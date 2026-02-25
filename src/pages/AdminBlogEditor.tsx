import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';
import { BlogService, BlogPost } from '@/services/blogService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const AdminBlogEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [post, setPost] = useState<BlogPost | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const coverFileRef = useRef<HTMLInputElement | null>(null);

  const tagsArr = useMemo(() => tags.split(',').map(t => t.trim()).filter(Boolean), [tags]);

  const load = async () => {
    setLoading(true);
    try {
      if (!isNew && id) {
        const p = await BlogService.adminGetPost(id);
        setPost(p);
        setTitle(p.title);
        setSlug(p.slug);
        setExcerpt(p.excerpt || '');
        setContent(p.content_md || '');
        setCategory(p.category || '');
        setTags((p.tags || []).join(', '));
        setSeoTitle(p.seo_title || '');
        setSeoDescription(p.seo_description || '');
        setCoverImageUrl(p.cover_image_url || '');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    const payload: any = {
      title,
      slug,
      excerpt,
      content_md: content,
      category: category || null,
      tags: tagsArr,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      cover_image_url: coverImageUrl || null,
    };

    if (isNew) {
      const created = await BlogService.adminCreatePost(payload);
      navigate(`/admin/blog/posts/${created.id}/edit`, { replace: true });
    } else if (id) {
      const updated = await BlogService.adminUpdatePost(id, payload);
      setPost(updated);
    }
  };

  const setStatus = async (status: any) => {
    if (isNew) {
      await save();
      return;
    }
    if (!id) return;
    const updated = await BlogService.adminSetPostStatus(id, status);
    setPost(updated);
  };

  const uploadCoverImage = async (file: File) => {
    setCoverUploading(true);
    try {
      // Local upload to FastAPI (admin-only)
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const form = new FormData();
      form.append('file', file);

      // VITE_API_URL is like http://host:8001/api
      const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
      const resp = await fetch(`${apiBase}/admin/uploads/blog/cover`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `Upload failed (${resp.status})`);
      }

      const data = await resp.json();
      const path = data.path as string;

      // Turn /uploads/... into absolute URL on same API host
      const fileBase = apiBase.replace(/\/api$/, '');
      const url = `${fileBase}${path}`;

      setCoverImageUrl(url);
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <ProtectedAdminRoute requiredRole="admin">
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight">{isNew ? 'New Blog Post' : 'Edit Blog Post'}</h1>
              <p className="text-muted-foreground">Status: <span className="text-foreground font-medium">{post?.status || (isNew ? 'draft' : '—')}</span></p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <Button variant="outline" onClick={() => navigate('/admin/blog/posts')}>Back</Button>
              <Button variant="outline" onClick={save} disabled={loading}>Save</Button>
              <Button variant="secondary" onClick={() => setStatus('pending')} disabled={loading}>Set Pending</Button>
              <Button variant="outline" onClick={() => setStatus('approved')} disabled={loading}>Approve</Button>
              <Button onClick={() => setStatus('published')} disabled={loading}>Publish</Button>
            </div>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Editor */}
              <div className="xl:col-span-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Editor</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant={mode === 'write' ? 'default' : 'outline'} onClick={() => setMode('write')}>Write</Button>
                      <Button size="sm" variant={mode === 'preview' ? 'default' : 'outline'} onClick={() => setMode('preview')}>Preview</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input value={title} onChange={(e) => {
                      setTitle(e.target.value);
                      if (isNew && !slug) setSlug(slugify(e.target.value));
                    }} placeholder="Post title" />

                    {mode === 'write' ? (
                      <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write in Markdown…" className="min-h-[520px]" />
                    ) : (
                      <div className="prose prose-slate dark:prose-invert max-w-none border border-border/60 rounded-lg p-4">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*Nothing to preview yet.*'}</ReactMarkdown>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Settings */}
              <div className="xl:col-span-4 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Post Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Slug</label>
                      <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="my-post-slug" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Excerpt</label>
                      <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Category</label>
                      <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Engineering" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Tags (comma separated)</label>
                      <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ai, product, engineering" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>SEO</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground">SEO Title</label>
                      <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Meta Description</label>
                      <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Featured Image</label>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => coverFileRef.current?.click()}
                          disabled={coverUploading}
                        >
                          {coverUploading ? 'Uploading…' : 'Upload image'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCoverImageUrl('')}
                          disabled={coverUploading || !coverImageUrl}
                        >
                          Remove
                        </Button>
                      </div>

                      <input
                        ref={coverFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          await uploadCoverImage(file);
                          // reset input so same file can be selected again
                          e.currentTarget.value = '';
                        }}
                      />

                      <div>
                        <label className="text-xs text-muted-foreground">Or paste image URL</label>
                        <Input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://..." />
                      </div>

                      {coverImageUrl ? (
                        <div className="rounded-lg overflow-hidden border border-border/60 bg-muted aspect-video">
                          <img src={coverImageUrl} alt="Featured" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Tip: set <code>VITE_IMGBB_API_KEY</code> (preferred) or Cloudinary env vars to enable direct uploads.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedAdminRoute>
  );
};

export default AdminBlogEditor;
