import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';
import { BlogService, BlogPost } from '@/services/blogService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { generateHTML } from '@tiptap/html';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

type TocItem = { id: string; title: string; level: number };

function getTextFromTiptapNode(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  const parts: string[] = [];
  const children = node.content || [];
  for (const c of children) parts.push(getTextFromTiptapNode(c));
  return parts.join('');
}

function extractTocFromTiptapJson(doc: any): TocItem[] {
  const items: TocItem[] = [];

  function walk(node: any) {
    if (!node) return;
    if (node.type === 'heading') {
      const level = Number(node.attrs?.level || 2);
      const title = getTextFromTiptapNode(node).trim();
      if (title) {
        items.push({ id: slugify(title), title, level });
      }
    }
    const children = node.content || [];
    for (const c of children) walk(c);
  }

  walk(doc);

  // de-dupe ids
  const seen = new Map<string, number>();
  return items.map((t) => {
    const count = (seen.get(t.id) || 0) + 1;
    seen.set(t.id, count);
    return count === 1 ? t : { ...t, id: `${t.id}-${count}` };
  });
}

function markdownToRoughTiptapDoc(md: string): any {
  // Minimal, “good enough” converter to avoid blank editor when editing legacy markdown posts.
  // Supports: H2/H3, bullet list, paragraphs.
  const lines = (md || '').split('\n');
  const content: any[] = [];
  let currentBullet: any[] | null = null;

  const flushBullets = () => {
    if (currentBullet && currentBullet.length) {
      content.push({
        type: 'bulletList',
        content: currentBullet,
      });
    }
    currentBullet = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    const h2 = line.match(/^##\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);
    const bullet = line.match(/^[-*]\s+(.+)$/);

    if (h2) {
      flushBullets();
      content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: h2[1].trim() }],
      });
      continue;
    }

    if (h3) {
      flushBullets();
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: h3[1].trim() }],
      });
      continue;
    }

    if (bullet) {
      if (!currentBullet) currentBullet = [];
      currentBullet.push({
        type: 'listItem',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: bullet[1].trim() }] }],
      });
      continue;
    }

    if (!line.trim()) {
      flushBullets();
      continue;
    }

    flushBullets();
    content.push({
      type: 'paragraph',
      content: [{ type: 'text', text: line.trim() }],
    });
  }

  flushBullets();

  return {
    type: 'doc',
    content: content.length ? content : [{ type: 'paragraph' }],
  };
}

const tiptapExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
  }),
  Placeholder.configure({
    placeholder: 'Write your blog post…',
  }),
  Image.configure({
    inline: false,
    allowBase64: false,
  }),
];

const AdminBlogEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<BlogPost | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugAuto, setSlugAuto] = useState(true);
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  const [coverUploading, setCoverUploading] = useState(false);
  const coverFileRef = useRef<HTMLInputElement | null>(null);

  const tagsArr = useMemo(() => tags.split(',').map(t => t.trim()).filter(Boolean), [tags]);

  const editor = useEditor({
    extensions: tiptapExtensions,
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        class:
          'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[520px] px-4 py-4',
      },
    },
  });

  const [toc, setToc] = useState<TocItem[]>([]);

  useEffect(() => {
    if (!editor) return;
    const update = () => setToc(extractTocFromTiptapJson(editor.getJSON()));
    update();
    editor.on('update', update);
    return () => {
      editor.off('update', update);
    };
  }, [editor]);

  const load = async () => {
    setLoading(true);
    try {
      if (!isNew && id) {
        const p = await BlogService.adminGetPost(id);
        setPost(p);
        setTitle(p.title);
        setSlug(p.slug);
        setSlugAuto(false);
        setExcerpt(p.excerpt || '');
        setCategory(p.category || '');
        setTags((p.tags || []).join(', '));
        setSeoTitle(p.seo_title || '');
        setSeoDescription(p.seo_description || '');
        setCoverImageUrl(p.cover_image_url || '');

        const initialDoc = p.content_json || markdownToRoughTiptapDoc(p.content_md || '');
        editor?.commands.setContent(initialDoc, false);
      } else {
        // new post
        setSlugAuto(true);
        editor?.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] }, false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // wait for editor instance
    if (!editor) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editor]);

  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
  const fileOrigin = (() => {
    try {
      return new URL(apiBase).origin;
    } catch {
      return window.location.origin;
    }
  })();

  const uploadLocalImage = async (file: File, kind: 'cover' | 'inline') => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const form = new FormData();
    form.append('file', file);

    const endpoint = kind === 'cover' ? '/admin/uploads/blog/cover' : '/admin/uploads/blog/inline';

    const resp = await fetch(`${apiBase}${endpoint}`, {
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

    // Ensure absolute URL for <img src> so it always loads (even if API base is relative)
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${fileOrigin}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const uploadCoverImage = async (file: File) => {
    setCoverUploading(true);
    try {
      const url = await uploadLocalImage(file, 'cover');
      setCoverImageUrl(url);
    } finally {
      setCoverUploading(false);
    }
  };

  const insertInlineImageAsHtml = async (file: File) => {
    if (!editor) return;
    const url = await uploadLocalImage(file, 'inline');
    editor.chain().focus().setImage({ src: url, alt: 'Image' }).run();
  };

  const save = async () => {
    if (!editor) throw new Error('Editor not ready');

    const content_json = editor.getJSON();
    const content_html = generateHTML(content_json, tiptapExtensions);
    const tocItems = extractTocFromTiptapJson(content_json);

    const basePayload: any = {
      title,
      excerpt,
      // Keep legacy field populated (empty is fine) for older UI and search fallbacks
      content_md: post?.content_md || '',
      content_json,
      content_html,
      toc: tocItems,
      category: category || null,
      tags: tagsArr,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      cover_image_url: coverImageUrl || null,
    };

    const tryCreateWithSlug = async (candidateSlug: string) => {
      const payload = { ...basePayload, slug: candidateSlug };
      return BlogService.adminCreatePost(payload);
    };

    if (isNew) {
      const initialSlug = slugify(slug || title);
      const maxTries = slugAuto ? 15 : 1;

      let lastErr: any = null;
      for (let i = 0; i < maxTries; i++) {
        const candidate = i === 0 ? initialSlug : `${initialSlug}-${i + 1}`;
        try {
          const created = await tryCreateWithSlug(candidate);
          // if slug was auto, keep it synced to the chosen slug
          setSlug(candidate);
          setSlugAuto(slugAuto);
          navigate(`/admin/blog/posts/${created.id}/edit`, { replace: true });
          return;
        } catch (e: any) {
          lastErr = e;
          const msg = String(e?.message || '');
          if (msg.toLowerCase().includes('slug already exists') && slugAuto) {
            continue;
          }
          throw e;
        }
      }
      throw lastErr;
    } else if (id) {
      const payload = { ...basePayload, slug };
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
              <Button variant="outline" onClick={save} disabled={loading || !editor}>Save</Button>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (!editor) return;
                          const url = prompt('Paste link URL');
                          if (!url) return;
                          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                        }}
                      >
                        Link
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleBold().run()} disabled={!editor?.can().toggleBold()}>
                        Bold
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleItalic().run()} disabled={!editor?.can().toggleItalic()}>
                        Italic
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
                        H2
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
                        H3
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleBulletList().run()}>
                        Bullets
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
                        Numbered
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => document.getElementById('inline-image-picker')?.click()}
                      >
                        Image
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      value={title}
                      onChange={(e) => {
                        const nextTitle = e.target.value;
                        setTitle(nextTitle);
                        if (isNew && slugAuto) {
                          setSlug(slugify(nextTitle));
                        }
                      }}
                      placeholder="Post title"
                    />

                    <input
                      id="inline-image-picker"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const inputEl = e.currentTarget;
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await insertInlineImageAsHtml(file);
                        inputEl.value = '';
                      }}
                    />

                    <div className="border border-border/60 rounded-lg bg-background">
                      <EditorContent editor={editor} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Settings + TOC */}
              <div className="xl:col-span-4 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Table of Contents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {toc.length === 0 ? (
                      <div className="text-xs text-muted-foreground">Add H2/H3 headings to generate a TOC.</div>
                    ) : (
                      <div className="space-y-1">
                        {toc.map((t) => (
                          <div key={t.id} className={t.level === 3 ? 'pl-4 text-sm text-muted-foreground' : 'text-sm font-medium'}>
                            {t.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Post Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs text-muted-foreground">Slug</label>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {isNew ? (slugAuto ? 'auto' : 'manual') : 'manual'}
                          </span>
                          {isNew && !slugAuto && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                setSlugAuto(true);
                                setSlug(slugify(title));
                              }}
                            >
                              Reset
                            </Button>
                          )}
                        </div>
                      </div>
                      <Input
                        value={slug}
                        onChange={(e) => {
                          setSlugAuto(false);
                          setSlug(slugify(e.target.value));
                        }}
                        placeholder="my-post-slug"
                      />
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
                          const inputEl = e.currentTarget;
                          const file = e.target.files?.[0];
                          if (!file) return;
                          await uploadCoverImage(file);
                          if (inputEl) inputEl.value = '';
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
