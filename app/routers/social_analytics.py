from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
import httpx
import sys

from ..database import get_db
from ..models import SocialMediaAccount, SocialMediaPost, User
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/social", tags=["Social Analytics"])

@router.post("/sync")
async def sync_social_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Synchronizes analytics for recently published posts across all platforms.
    """
    # Fetch posts from the last 30 days that are published
    posts = db.query(SocialMediaPost).filter(
        SocialMediaPost.user_id == current_user.id,
        SocialMediaPost.status == 'published',
        SocialMediaPost.platform_post_id != None
    ).order_by(SocialMediaPost.posted_at.desc()).limit(100).all()

    if not posts:
        return {"status": "success", "updated_count": 0, "message": "No published posts to sync"}

    stats_updated = 0
    
    async with httpx.AsyncClient() as client:
        for post in posts:
            account = db.query(SocialMediaAccount).filter(SocialMediaAccount.id == post.account_id).first()
            if not account:
                continue
                
            try:
                if account.platform == 'facebook':
                    await sync_facebook_post(client, post, account)
                elif account.platform == 'instagram':
                    await sync_instagram_post(client, post, account)
                elif account.platform == 'linkedin':
                    await sync_linkedin_post(client, post, account)
                
                post.last_analytics_update = datetime.now()
                stats_updated += 1
            except Exception as e:
                print(f"Error syncing {account.platform} post {post.id}: {str(e)}", file=sys.stderr)

    db.commit()
    return {"status": "success", "updated_count": stats_updated}

async def sync_facebook_post(client: httpx.AsyncClient, post: SocialMediaPost, account: SocialMediaAccount):
    """Fetches reactions and comments for a Facebook post."""
    post_id = post.platform_post_id
    access_token = account.access_token
    
    url = f"https://graph.facebook.com/v18.0/{post_id}"
    params = {
        "fields": "reactions.summary(true),comments.summary(true)",
        "access_token": access_token
    }
    
    response = await client.get(url, params=params)
    data = response.json()
    
    if "error" in data:
        raise Exception(data["error"]["message"])
        
    # Update stats
    post.likes_count = data.get("reactions", {}).get("summary", {}).get("total_count", post.likes_count)
    post.comments_count = data.get("comments", {}).get("summary", {}).get("total_count", post.comments_count)
    # FB impressions often require specific permissions (read_insights) and a Page token
    # We'll stick to basic engagement for now if impressions field is not trivial

async def sync_instagram_post(client: httpx.AsyncClient, post: SocialMediaPost, account: SocialMediaAccount):
    """Fetches likes and comments for an Instagram post."""
    media_id = post.platform_post_id
    access_token = account.access_token
    
    url = f"https://graph.facebook.com/v18.0/{media_id}"
    params = {
        "fields": "like_count,comments_count",
        "access_token": access_token
    }
    
    response = await client.get(url, params=params)
    data = response.json()
    
    if "error" in data:
        raise Exception(data["error"]["message"])
        
    post.likes_count = data.get("like_count", post.likes_count)
    post.comments_count = data.get("comments_count", post.comments_count)

async def sync_linkedin_post(client: httpx.AsyncClient, post: SocialMediaPost, account: SocialMediaAccount):
    """Fetches engagement for a LinkedIn post using socialMetadata endpoint."""
    post_id = post.platform_post_id
    # post_id for LinkedIn should be a URN like urn:li:share:123 or urn:li:ugcPost:123
    if not post_id.startswith("urn:li:"):
        # If it's just the ID, we might need to reconstruct it, but usually we save the URN
        return

    url = f"https://api.linkedin.com/v2/socialMetadata/{post_id}"
    headers = {
        "Authorization": f"Bearer {account.access_token}",
        "LinkedIn-Version": "202306",
        "X-Restli-Protocol-Version": "2.0.0"
    }
    
    response = await client.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        # LinkedIn socialMetadata returns reaction summaries and comment summaries
        # stats are nested in elements if fetching multiple, but here we fetch single
        reactions = data.get("reactionSummaries", {})
        total_likes = sum(r.get("count", 0) for r in reactions.values())
        
        comments = data.get("commentSummary", {}).get("count", post.comments_count)
        
        post.likes_count = total_likes
        post.comments_count = comments
    else:
        print(f"LinkedIn sync failed for {post_id}: {response.text}", file=sys.stderr)
