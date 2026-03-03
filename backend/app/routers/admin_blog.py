from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone
import bleach

from ..database import get_db
from ..auth.dependencies import get_current_admin_user
from ..models import BlogPost, BlogComment, BlogPostAuditLog, User
from ..schemas.blog import (
    BlogPostCreate,
    BlogPostUpdate,
    BlogPostListResponse,
    BlogPostResponse,
    BlogCommentListResponse,
    BlogCommentResponse,
    BlogCommentModerateRequest,
    BlogAuditLogResponse,
)

router = APIRouter(tags=["Admin Blog"])

POST_STATUSES = {"draft", "pending", "approved", "published"}
COMMENT_STATUSES = {"pending", "approved", "rejected", "spam"}

# Minimal HTML sanitization (admin-authored, but rendered publicly)
_ALLOWED_TAGS = [
    "p", "br",
    "strong", "b", "em", "i", "u", "s",
    "h2", "h3",
    "ul", "ol", "li",
    "blockquote",
    "code", "pre",
    "hr",
    "a",
    "img",
]
_ALLOWED_ATTRS = {
    "a": ["href", "title", "rel", "target"],
    "img": ["src", "alt", "title", "loading"],
    "h2": ["id"],
    "h3": ["id"],
}
_ALLOWED_PROTOCOLS = ["http", "https", "mailto"]


def _sanitize_html(html: str | None) -> str | None:
    if html is None:
        return None
    cleaned = bleach.clean(
        html,
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRS,
        protocols=_ALLOWED_PROTOCOLS,
        strip=True,
    )
    return cleaned


def _slugify_heading(text: str) -> str:
    import re

    s = (text or "").strip().lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s


def _get_text_from_tiptap_node(node: dict | None) -> str:
    if not node:
        return ""
    if node.get("type") == "text":
        return node.get("text") or ""
    out: list[str] = []
    for c in node.get("content") or []:
        out.append(_get_text_from_tiptap_node(c))
    return "".join(out)


def _extract_toc_from_tiptap_json(doc: dict | None):
    if not doc:
        return None

    items: list[dict] = []

    def walk(node: dict | None):
        if not node:
            return
        if node.get("type") == "heading":
            level = int((node.get("attrs") or {}).get("level") or 2)
            title = _get_text_from_tiptap_node(node).strip()
            if title:
                items.append({"id": _slugify_heading(title), "title": title, "level": level})
        for c in node.get("content") or []:
            walk(c)

    walk(doc)

    # de-dupe ids
    seen: dict[str, int] = {}
    out: list[dict] = []
    for it in items:
        base = it["id"]
        n = seen.get(base, 0) + 1
        seen[base] = n
        if n == 1:
            out.append(it)
        else:
            out.append({**it, "id": f"{base}-{n}"})

    return out


def _audit(
    db: Session,
    post_id: UUID,
    actor_user_id: UUID,
    action: str,
    from_status: Optional[str] = None,
    to_status: Optional[str] = None,
    note: Optional[str] = None,
    meta: Optional[dict] = None,
):
    log = BlogPostAuditLog(
        post_id=post_id,
        actor_user_id=actor_user_id,
        action=action,
        from_status=from_status,
        to_status=to_status,
        note=note,
        meta=meta or {},
    )
    db.add(log)


@router.get("/posts", response_model=BlogPostListResponse)
async def admin_list_posts(
    q: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 25,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    if page < 1:
        page = 1

    query = db.query(BlogPost).filter(BlogPost.is_deleted == False)

    if status:
        query = query.filter(BlogPost.status == status)

    if q:
        like = f"%{q}%"
        query = query.filter((BlogPost.title.ilike(like)) | (BlogPost.slug.ilike(like)))

    total = query.count()
    items = (
        query.order_by(BlogPost.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/posts/{post_id}", response_model=BlogPostResponse)
async def admin_get_post(
    post_id: UUID,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    post = db.query(BlogPost).filter(BlogPost.id == post_id, BlogPost.is_deleted == False).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/posts", response_model=BlogPostResponse)
async def admin_create_post(
    payload: BlogPostCreate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    if payload.status and payload.status not in POST_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    existing = db.query(BlogPost).filter(BlogPost.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")

    # Require some content
    if not (payload.content_json or (payload.content_md and payload.content_md.strip())):
        raise HTTPException(status_code=400, detail="Post content is required")

    toc = _extract_toc_from_tiptap_json(payload.content_json) if payload.content_json else None
    content_html = _sanitize_html(payload.content_html) if payload.content_html else None

    post = BlogPost(
        title=payload.title,
        slug=payload.slug,
        excerpt=payload.excerpt,
        content_md=(payload.content_md or ""),
        content_json=payload.content_json,
        content_html=content_html,
        toc=toc,
        status=payload.status or "draft",
        category=payload.category,
        tags=payload.tags or [],
        seo_title=payload.seo_title,
        seo_description=payload.seo_description,
        cover_image_url=payload.cover_image_url,
        created_by=admin.id,
        updated_by=admin.id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    _audit(db, post.id, admin.id, action="created", to_status=post.status)
    db.commit()

    return post


@router.patch("/posts/{post_id}", response_model=BlogPostResponse)
async def admin_update_post(
    post_id: UUID,
    payload: BlogPostUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    post = db.query(BlogPost).filter(BlogPost.id == post_id, BlogPost.is_deleted == False).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # uniqueness if slug changed
    if payload.slug and payload.slug != post.slug:
        exists = db.query(BlogPost).filter(BlogPost.slug == payload.slug).first()
        if exists:
            raise HTTPException(status_code=400, detail="Slug already exists")

    from_status = post.status

    data = payload.dict(exclude_unset=True)

    # Sanitize + compute derived fields
    if "content_html" in data:
        data["content_html"] = _sanitize_html(data.get("content_html"))

    if "content_json" in data and data.get("content_json") is not None:
        # always regenerate toc from json (don’t trust client toc)
        data["toc"] = _extract_toc_from_tiptap_json(data.get("content_json"))

    for field, value in data.items():
        if field == "status":
            continue
        setattr(post, field, value)

    post.updated_by = admin.id

    if payload.status:
        if payload.status not in POST_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid status")
        post.status = payload.status

    db.commit()
    db.refresh(post)

    _audit(db, post.id, admin.id, action="updated", from_status=from_status, to_status=post.status)
    db.commit()

    return post


@router.post("/posts/{post_id}/status", response_model=BlogPostResponse)
async def admin_set_post_status(
    post_id: UUID,
    status: str = Query(...),
    note: Optional[str] = None,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    if status not in POST_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    post = db.query(BlogPost).filter(BlogPost.id == post_id, BlogPost.is_deleted == False).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    from_status = post.status
    post.status = status
    post.updated_by = admin.id

    now = datetime.now(timezone.utc)

    if status == "approved":
        post.approved_by = admin.id
        post.approved_at = now
    if status == "published":
        post.published_by = admin.id
        post.published_at = now

    db.commit()
    db.refresh(post)

    _audit(db, post.id, admin.id, action="status_change", from_status=from_status, to_status=status, note=note)
    db.commit()

    return post


@router.delete("/posts/{post_id}")
async def admin_delete_post(
    post_id: UUID,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    post = db.query(BlogPost).filter(BlogPost.id == post_id, BlogPost.is_deleted == False).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.is_deleted = True
    post.deleted_at = datetime.now(timezone.utc)
    post.updated_by = admin.id

    _audit(db, post.id, admin.id, action="deleted", from_status=post.status, to_status=None)

    db.commit()
    return {"success": True}


@router.get("/comments", response_model=BlogCommentListResponse)
async def admin_list_comments(
    status: Optional[str] = None,
    post_id: Optional[UUID] = None,
    page: int = 1,
    page_size: int = 50,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    if page < 1:
        page = 1

    query = db.query(BlogComment).filter(BlogComment.is_deleted == False)
    if status:
        query = query.filter(BlogComment.status == status)
    if post_id:
        query = query.filter(BlogComment.post_id == post_id)

    total = query.count()
    items = (
        query.order_by(BlogComment.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {"items": items, "total": total}


@router.post("/comments/{comment_id}/moderate", response_model=BlogCommentResponse)
async def admin_moderate_comment(
    comment_id: UUID,
    payload: BlogCommentModerateRequest,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    if payload.status not in COMMENT_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    comment = db.query(BlogComment).filter(BlogComment.id == comment_id, BlogComment.is_deleted == False).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.status = payload.status
    comment.moderated_by = admin.id
    comment.moderated_at = datetime.now(timezone.utc)
    comment.moderation_reason = payload.reason

    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}")
async def admin_delete_comment(
    comment_id: UUID,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    comment = db.query(BlogComment).filter(BlogComment.id == comment_id, BlogComment.is_deleted == False).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.is_deleted = True
    comment.deleted_at = datetime.now(timezone.utc)
    comment.moderated_by = admin.id
    comment.moderated_at = datetime.now(timezone.utc)

    db.commit()
    return {"success": True}


@router.get("/audit", response_model=List[BlogAuditLogResponse])
async def admin_audit_logs(
    post_id: Optional[UUID] = None,
    limit: int = 100,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    query = db.query(BlogPostAuditLog)
    if post_id:
        query = query.filter(BlogPostAuditLog.post_id == post_id)

    return query.order_by(BlogPostAuditLog.created_at.desc()).limit(limit).all()
