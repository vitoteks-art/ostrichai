-- Blog TipTap migration (adds rich editor fields)
-- Run against your Postgres database.

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS content_json JSONB,
  ADD COLUMN IF NOT EXISTS content_html TEXT,
  ADD COLUMN IF NOT EXISTS toc JSONB;

-- Legacy markdown field stays, but ensure it has a default so new TipTap posts can leave it empty
ALTER TABLE blog_posts
  ALTER COLUMN content_md SET DEFAULT '';

UPDATE blog_posts
SET content_md = COALESCE(content_md, '')
WHERE content_md IS NULL;
