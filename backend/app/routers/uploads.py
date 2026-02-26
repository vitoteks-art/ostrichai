import uuid
import os
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..auth.dependencies import get_current_admin_user
from ..models import User

router = APIRouter(tags=["Uploads"])


def _safe_ext(filename: str, content_type: str | None) -> str:
    # prefer filename extension
    ext = Path(filename or "").suffix.lower()
    if ext in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        return ext

    # fallback by content-type
    if content_type == "image/jpeg":
        return ".jpg"
    if content_type == "image/png":
        return ".png"
    if content_type == "image/webp":
        return ".webp"
    if content_type == "image/gif":
        return ".gif"

    return ".jpg"


MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5MB


@router.post("/blog/cover")
async def upload_blog_cover(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin_user),
):
    if not file:
        raise HTTPException(status_code=400, detail="File is required")

    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed")

    # store uploads in UPLOADS_DIR/blog if set, else default to backend/app/../uploads/blog
    backend_dir = Path(__file__).resolve().parents[2].parent  # .../backend
    base_uploads = Path(os.environ.get("UPLOADS_DIR", str(backend_dir / "uploads")))
    uploads_dir = base_uploads / "blog"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    ext = _safe_ext(file.filename or "", file.content_type)
    name = f"{uuid.uuid4().hex}{ext}"
    dest = uploads_dir / name

    # Stream to disk with size limit
    written = 0
    try:
        with dest.open("wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                written += len(chunk)
                if written > MAX_IMAGE_BYTES:
                    raise HTTPException(status_code=413, detail="Image too large (max 5MB)")
                out.write(chunk)
    finally:
        await file.close()

    # return a URL path that FastAPI serves
    path = f"/uploads/blog/{name}"
    return {"success": True, "path": path}
