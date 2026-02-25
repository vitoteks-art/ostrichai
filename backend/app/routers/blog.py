from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from ..database import get_db
from ..auth.dependencies import get_current_user
from ..models import BlogPost, BlogComment, User
from ..schemas.blog import (
    BlogPostListResponse,
    BlogPostResponse,
    BlogCommentCreate,
    BlogCommentListResponse,
    BlogCommentResponse,
)

router = APIRouter(tags=["Blog"])


@router.get("/posts", response_model=BlogPostListResponse)
async def list_published_posts(
    q: Optional[str] = None,
    page: int = 1,
    page_size: int = 12,
    db: Session = Depends(get_db),
):
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 12

    query = db.query(BlogPost).filter(
        BlogPost.is_deleted == False,
        BlogPost.status == "published",
    )

    if q:
        like = f"%{q}%"
        query = query.filter((BlogPost.title.ilike(like)) | (BlogPost.content_md.ilike(like)))

    total = query.count()
    items = (
        query.order_by(BlogPost.published_at.desc().nullslast(), BlogPost.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/posts/{slug}", response_model=BlogPostResponse)
async def get_published_post(slug: str, db: Session = Depends(get_db)):
    post = (
        db.query(BlogPost)
        .filter(
            BlogPost.slug == slug,
            BlogPost.is_deleted == False,
            BlogPost.status == "published",
        )
        .first()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.get("/posts/{post_id}/comments", response_model=BlogCommentListResponse)
async def list_approved_comments(
    post_id: UUID,
    db: Session = Depends(get_db),
):
    query = db.query(BlogComment).filter(
        BlogComment.post_id == post_id,
        BlogComment.is_deleted == False,
        BlogComment.status == "approved",
    )
    total = query.count()
    items = query.order_by(BlogComment.created_at.asc()).all()
    return {"items": items, "total": total}


@router.post("/posts/{post_id}/comments", response_model=BlogCommentResponse)
async def create_comment(
    post_id: UUID,
    payload: BlogCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ensure post exists (can be unpublished, but must not be deleted)
    post = db.query(BlogPost).filter(BlogPost.id == post_id, BlogPost.is_deleted == False).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    body = (payload.body or "").strip()
    if not body:
        raise HTTPException(status_code=400, detail="Comment body is required")

    comment = BlogComment(
        post_id=post_id,
        user_id=current_user.id,
        body=body,
        status="pending",
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
