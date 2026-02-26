# Uploads (Production Notes)

OstrichAi supports **local uploads** for blog featured images.

## Where files are stored
- Backend directory: `backend/uploads/blog/`
- Public URL path: `/uploads/blog/<filename>`

## Serving
FastAPI mounts the `backend/uploads` folder as static files:
- `GET /uploads/...`

The backend ensures these directories exist on startup.

## Easypanel / Docker persistence (required in production)
Local uploads will be lost on redeploy unless you mount persistent storage.

### Recommended (best practice)
1) Set env var:
- `UPLOADS_DIR=/app/uploads`

2) Mount a Volume to the container path:
- `/app/uploads`

So:
- `/app/uploads/blog` persists across deploys

## Security
- Upload endpoint is admin-only.
- Only `image/*` content types accepted.
- Size limit enforced: 5MB.

## Backups
Include the uploads volume in your backup strategy.
