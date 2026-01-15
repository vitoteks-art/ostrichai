from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from ..database import get_db
from ..models import SocialMediaAccount, SocialMediaPost, ScheduledPost, User
from ..schemas.social_media import (
    SocialMediaAccountCreate, SocialMediaAccountUpdate, SocialMediaAccountResponse,
    SocialMediaPostCreate, SocialMediaPostResponse,
    ScheduledPostCreate, ScheduledPostResponse,
    OAuthExchangeRequest, OAuthExchangeResponse
)
from ..auth.dependencies import get_current_user
from ..config import settings
import httpx
import base64

router = APIRouter(tags=["Social Media"])

@router.post("/oauth/exchange", response_model=OAuthExchangeResponse)
async def exchange_oauth_code(
    request: OAuthExchangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    platform = request.platform.lower()
    code = request.code
    redirect_uri = request.redirect_uri

    async with httpx.AsyncClient() as client:
        if platform in ['facebook', 'instagram']:
            app_id = settings.facebook_app_id or settings.vite_facebook_app_id
            app_secret = settings.facebook_app_secret
            
            resp = await client.get(
                "https://graph.facebook.com/v18.0/oauth/access_token",
                params={
                    "client_id": app_id,
                    "client_secret": app_secret,
                    "redirect_uri": redirect_uri,
                    "code": code
                }
            )
            data = resp.json()
            if resp.status_code != 200 or "error" in data:
                raise HTTPException(status_code=400, detail=data.get("error", {}).get("message", "OAuth failed"))
            
            access_token = data["access_token"]
            
            # Fetch user info
            user_info_resp = await client.get(
                f"https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token={access_token}"
            )
            user_info_raw = user_info_resp.json()
            user_info = {
                "id": user_info_raw.get("id"),
                "name": user_info_raw.get("name"),
                "profile_picture": user_info_raw.get("picture", {}).get("data", {}).get("url")
            }
            
            # Fetch pages (only for Facebook)
            accounts = []
            if platform == 'facebook':
                pages_resp = await client.get(
                    f"https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,picture&access_token={access_token}"
                )
                pages_data = pages_resp.json()
                if "data" in pages_data:
                    for page in pages_data["data"]:
                        accounts.append({
                            "id": page["id"],
                            "name": page["name"],
                            "type": "page",
                            "platform_user_id": page["id"],
                            "access_token": page.get("access_token")
                        })
            
            return OAuthExchangeResponse(
                access_token=access_token,
                expires_in=data.get("expires_in"),
                user_info=user_info,
                accounts=accounts
            )

        elif platform == 'twitter':
            auth_header = base64.b64encode(f"{settings.twitter_client_id}:{settings.twitter_client_secret}".encode()).decode()
            resp = await client.post(
                "https://api.twitter.com/2/oauth2/token",
                headers={
                    "Authorization": f"Basic {auth_header}",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data={
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri,
                    "code_verifier": "challenge" 
                }
            )
            data = resp.json()
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail=data.get("error_description", "OAuth failed"))
                
            # Get user info
            me_resp = await client.get(
                "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
                headers={"Authorization": f"Bearer {data['access_token']}"}
            )
            me_data = me_resp.json()
            user_info_raw = me_data.get("data", {})
            
            return OAuthExchangeResponse(
                access_token=data["access_token"],
                refresh_token=data.get("refresh_token"),
                expires_in=data.get("expires_in"),
                user_info={
                    "id": user_info_raw.get("id"),
                    "username": user_info_raw.get("username"),
                    "name": user_info_raw.get("name"),
                    "profile_picture": user_info_raw.get("profile_image_url")
                }
            )

        elif platform == 'google':
             from ..auth.utils import exchange_google_code, get_google_user_info
             token_data = await exchange_google_code(code, redirect_uri)
             if not token_data:
                 raise HTTPException(status_code=400, detail="Failed to exchange Google code")
             
             google_user = await get_google_user_info(token_data["access_token"])
             return OAuthExchangeResponse(
                 access_token=token_data["access_token"],
                 refresh_token=token_data.get("refresh_token"),
                 expires_in=token_data.get("expires_in"),
                 user_info={
                     "id": google_user.get("sub"),
                     "name": google_user.get("name"),
                     "profile_picture": google_user.get("picture"),
                     "username": google_user.get("email")
                 }
             )

        else:
            raise HTTPException(status_code=400, detail=f"Exchange for platform {platform} not implemented yet")

# --- Social Media Accounts ---

@router.get("/accounts", response_model=List[SocialMediaAccountResponse])
async def get_social_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(SocialMediaAccount).filter(SocialMediaAccount.user_id == current_user.id).order_by(SocialMediaAccount.connected_at.desc()).all()

@router.post("/accounts", response_model=SocialMediaAccountResponse)
async def create_or_update_social_account(
    account: SocialMediaAccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_account = db.query(SocialMediaAccount).filter(
        SocialMediaAccount.user_id == current_user.id,
        SocialMediaAccount.platform == account.platform,
        SocialMediaAccount.platform_user_id == account.platform_user_id
    ).first()

    if db_account:
        # Update existing
        for var, value in vars(account).items():
            setattr(db_account, var, value)
    else:
        # Create new
        db_account = SocialMediaAccount(**account.dict(), user_id=current_user.id)
        db.add(db_account)
    
    db.commit()
    db.refresh(db_account)
    return db_account

@router.delete("/accounts/{account_id}")
async def delete_social_account(
    account_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_account = db.query(SocialMediaAccount).filter(
        SocialMediaAccount.id == account_id,
        SocialMediaAccount.user_id == current_user.id
    ).first()
    
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    db.delete(db_account)
    db.commit()
    return {"status": "success"}

# --- Social Media Posts ---

@router.get("/posts", response_model=List[SocialMediaPostResponse])
async def get_social_posts(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(SocialMediaPost).filter(
        SocialMediaPost.user_id == current_user.id
    ).order_by(SocialMediaPost.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/posts", response_model=SocialMediaPostResponse)
async def create_social_post_record(
    post: SocialMediaPostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_post = SocialMediaPost(**post.dict(), user_id=current_user.id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@router.patch("/posts/{post_id}", response_model=SocialMediaPostResponse)
async def update_social_post_status(
    post_id: UUID,
    status: str,
    platform_post_id: Optional[str] = None,
    platform_post_url: Optional[str] = None,
    error_message: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_post = db.query(SocialMediaPost).filter(
        SocialMediaPost.id == post_id,
        SocialMediaPost.user_id == current_user.id
    ).first()
    
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    db_post.status = status
    if platform_post_id: db_post.platform_post_id = platform_post_id
    if platform_post_url: db_post.platform_post_url = platform_post_url
    if error_message: db_post.error_message = error_message
    if status == 'published': db_post.posted_at = datetime.now()
    
    db.commit()
    db.refresh(db_post)
    return db_post

# --- Publishing ---

from ..schemas.social_media import SocialMediaPublishRequest
import httpx
import asyncio
import json
import os

import sys

@router.post("/publish")
async def publish_social_post(
    request: SocialMediaPublishRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"Received publish request for account {request.account_id}", file=sys.stderr, flush=True)
    # 1. Fetch Account
    account = db.query(SocialMediaAccount).filter(
        SocialMediaAccount.id == request.account_id,
        SocialMediaAccount.user_id == current_user.id
    ).first()

    if not account:
        print(f"Account {request.account_id} not found for user {current_user.id}", file=sys.stderr, flush=True)
        raise HTTPException(status_code=404, detail="Social media account not found")
    
    print(f"Publishing to platform: {account.platform}", file=sys.stderr, flush=True)

    # 2. Prepare Content
    content = request.content
    
    # 3. Route to Platform Handler
    try:
        result = None
        if account.platform == 'facebook':
            result = await post_to_facebook(account, content)
        elif account.platform == 'instagram':
            print("Invoking post_to_instagram handler")
            result = await post_to_instagram(account, content)
        elif account.platform == 'linkedin':
            result = await post_to_linkedin(account, content)
        elif account.platform == 'twitter':
            result = await post_to_twitter(account, content)
        elif account.platform == 'youtube':
            # Not fully implemented in migration plan yet, but placeholder
             raise HTTPException(status_code=501, detail="YouTube posting not yet migrated to backend")
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported platform: {account.platform}")
            
        return result

    except Exception as e:
        print(f"Social Posting Error ({account.platform}): {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Platform Handlers ---

async def post_to_facebook(account, content):
    full_text = content.get('text', '')
    hashtags = content.get('hashtags', [])
    if hashtags:
        full_text += "\n\n" + " ".join([tag if tag.startswith('#') else f"#{tag}" for tag in hashtags])
    
    page_id = account.platform_user_id
    access_token = account.access_token
    image_urls = content.get('imageUrls', [])

    async with httpx.AsyncClient() as client:
        if image_urls:
            if len(image_urls) == 1:
                response = await client.post(
                    f"https://graph.facebook.com/v18.0/{page_id}/photos",
                    json={
                        "url": image_urls[0],
                        "caption": full_text,
                        "access_token": access_token
                    }
                )
                data = response.json()
                if "error" in data:
                    raise Exception(data["error"]["message"])
                return {
                    "success": True, 
                    "platformPostId": data.get("id") or data.get("post_id"),
                    "platformPostUrl": f"https://facebook.com/{data.get('id') or data.get('post_id')}"
                }
            else:
                # Multi-image
                photo_ids = []
                for url in image_urls:
                    res = await client.post(
                        f"https://graph.facebook.com/v18.0/{page_id}/photos",
                        json={"url": url, "published": False, "access_token": access_token}
                    )
                    d = res.json()
                    if "error" in d:
                         raise Exception(d["error"]["message"])
                    photo_ids.append(d["id"])
                
                response = await client.post(
                    f"https://graph.facebook.com/v18.0/{page_id}/feed",
                    json={
                        "message": full_text,
                        "attached_media": [{"media_fbid": pid} for pid in photo_ids],
                        "access_token": access_token
                    }
                )
                data = response.json()
                if "error" in data:
                     raise Exception(data["error"]["message"])
                return {
                    "success": True, 
                    "platformPostId": data["id"],
                    "platformPostUrl": f"https://facebook.com/{data['id']}"
                }
        else:
            # Text only
            response = await client.post(
                f"https://graph.facebook.com/v18.0/{page_id}/feed",
                json={"message": full_text, "access_token": access_token}
            )
            data = response.json()
            if "error" in data:
                raise Exception(data["error"]["message"])
            return {
                "success": True, 
                "platformPostId": data["id"],
                "platformPostUrl": f"https://facebook.com/{data['id']}"
            }

def log_error(message):
    try:
        with open("backend_errors.log", "a") as f:
            f.write(f"{datetime.now()}: {message}\n")
    except Exception:
        print(f"Failed to write to log file: {message}")

async def post_to_instagram(account, content):
    image_urls = content.get('imageUrls', [])
    if not image_urls:
        raise Exception("Instagram requires at least one image.")
    
    full_text = content.get('text', '')
    hashtags = content.get('hashtags', [])
    if hashtags:
        full_text += "\n\n" + " ".join([tag if tag.startswith('#') else f"#{tag}" for tag in hashtags])

    ig_user_id = account.platform_user_id
    access_token = account.access_token

    async with httpx.AsyncClient() as client:
        # 1. Create Media Container
        response = await client.post(
            f"https://graph.facebook.com/v18.0/{ig_user_id}/media",
            json={
                "image_url": image_urls[0],
                "caption": full_text,
                "access_token": access_token
            }
        )
        data = response.json()
        if "error" in data:
            error_details = json.dumps(data)
            print(f"Instagram Container Error Data: {error_details}")
            log_error(f"Instagram Container Error ({ig_user_id}): {error_details}")
            raise Exception(f"Instagram Container Error: {data['error']['message']}")
        
        creation_id = data["id"]

        # 2. Poll for Status
        status = 'IN_PROGRESS'
        attempts = 0
        while status != 'FINISHED' and attempts < 10:
            await asyncio.sleep(3)
            stat_res = await client.get(
                f"https://graph.facebook.com/v18.0/{creation_id}?fields=status_code&access_token={access_token}"
            )
            stat_data = stat_res.json()
            status = stat_data.get("status_code", "ERROR")
            if status == 'ERROR':
                 raise Exception("Instagram media processing failed.")
            attempts += 1
        
        if status != 'FINISHED':
             raise Exception("Instagram media processing timed out.")

        # 3. Publish
        pub_res = await client.post(
            f"https://graph.facebook.com/v18.0/{ig_user_id}/media_publish",
            json={"creation_id": creation_id, "access_token": access_token}
        )
        pub_data = pub_res.json()
        if "error" in pub_data:
            raise Exception(f"Instagram Publish Error: {pub_data['error']['message']}")
            
        return {
            "success": True,
            "platformPostId": pub_data["id"],
            "platformPostUrl": f"https://www.instagram.com/reels/{pub_data['id']}/" # simplified
        }

async def post_to_linkedin(account, content):
    full_text = content.get('text', '')
    hashtags = content.get('hashtags', [])
    if hashtags:
        full_text += "\n\n" + " ".join([tag if tag.startswith('#') else f"#{tag}" for tag in hashtags])
    
    author_urn = account.platform_user_id
    if not author_urn.startswith('urn:li:'):
        # Fallback assumption: personal profile
        author_urn = f"urn:li:person:{author_urn}"

    image_urls = content.get('imageUrls', [])
    
    async with httpx.AsyncClient() as client:
        media_urn = None
        if image_urls:
            # Handle Single Image
            image_url = image_urls[0]
            
            # A. Initialize
            init_res = await client.post(
                "https://api.linkedin.com/rest/images?action=initializeUpload",
                headers={
                    "Authorization": f"Bearer {account.access_token}",
                    "LinkedIn-Version": "202306", 
                    "X-Restli-Protocol-Version": "2.0.0",
                    "Content-Type": "application/json"
                },
                json={"initializeUploadRequest": {"owner": author_urn}}
            )
            
            if init_res.status_code >= 400:
                 raise Exception(f"LinkedIn Init Error: {init_res.text}")
            
            init_data = init_res.json()
            upload_url = init_data['value']['uploadUrl']
            media_urn = init_data['value']['image']

            # B. Upload Image
            img_res = await client.get(image_url)
            if img_res.status_code != 200:
                raise Exception("Failed to fetch image for LinkedIn upload")
            
            up_res = await client.put(upload_url, content=img_res.content) # no auth header for PUT
            if up_res.status_code >= 400:
                 raise Exception("Failed to upload image binary to LinkedIn")

        # Create Post
        post_data = {
            "author": author_urn,
            "commentary": full_text,
            "visibility": "PUBLIC",
            "distribution": {
                "feedDistribution": "MAIN_FEED",
                "targetEntities": [],
                "thirdPartyDistributionChannels": []
            },
            "lifecycleState": "PUBLISHED",
            "isReshareDisabledByAuthor": False
        }

        if media_urn:
            post_data["content"] = {
                "media": {
                    "id": media_urn
                }
            }

        post_res = await client.post(
            "https://api.linkedin.com/rest/posts",
             headers={
                "Authorization": f"Bearer {account.access_token}",
                "LinkedIn-Version": "202306", 
                "X-Restli-Protocol-Version": "2.0.0",
                "Content-Type": "application/json"
            },
            json=post_data
        )

        if post_res.status_code >= 400:
            raise Exception(f"LinkedIn Post Error: {post_res.text}")
            
        post_id = post_res.headers.get('x-linkedin-id')
        return {
            "success": True,
            "platformPostId": post_id,
            "platformPostUrl": f"https://www.linkedin.com/feed/update/{post_id}" if post_id else None
        }

async def post_to_twitter(account, content):
    full_text = content.get('text', '')
    hashtags = content.get('hashtags', [])
    if hashtags:
        full_text += "\n\n" + " ".join([tag if tag.startswith('#') else f"#{tag}" for tag in hashtags])
    
    # Truncate if necessary (simplified)
    if len(full_text) > 280:
        full_text = full_text[:277] + "..."

    image_urls = content.get('imageUrls', [])
    
    async with httpx.AsyncClient() as client:
        media_ids = []
        if image_urls:
            # V1.1 Media Upload
            for url in image_urls[:4]:
                 img_res = await client.get(url)
                 if img_res.status_code == 200:
                     # Upload
                     files = {'media': img_res.content}
                     # Twitter v1.1 upload usually requires OAuth 1.0a or Bearer if supported for media
                     # Standard V2 apps often need OAuth 1.0a for media upload? 
                     # Actually, v2 access tokens (Bearers) can work with v1.1 media/upload if app settings allow.
                     # But strictly, the TS implementation used Bearer.
                     up_res = await client.post(
                         "https://upload.twitter.com/1.1/media/upload.json",
                         headers={"Authorization": f"Bearer {account.access_token}"},
                         files=files
                     )
                     if up_res.status_code == 200:
                         media_ids.append(up_res.json()["media_id_string"])
                     else:
                         print(f"Twitter Media Upload Fail: {up_res.text}")

        tweet_data = {"text": full_text}
        if media_ids:
            tweet_data["media"] = {"media_ids": media_ids}

        # Post Tweet V2
        response = await client.post(
            "https://api.twitter.com/2/tweets",
            headers={
                "Authorization": f"Bearer {account.access_token}",
                "Content-Type": "application/json"
            },
            json=tweet_data
        )
        
        data = response.json()
        if "errors" in data:
            raise Exception(data["errors"][0]["message"])
            
        return {
            "success": True,
            "platformPostId": data["data"]["id"],
            "platformPostUrl": f"https://twitter.com/user/status/{data['data']['id']}"
        }
