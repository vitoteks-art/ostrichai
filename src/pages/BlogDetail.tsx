import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { BlogService, BlogPost } from '@/services/blogService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type TocItem = { id: string; title: string; level?: number };

function slugifyHeading(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function stripHtml(html: string) {
  return (html || '').replace(/<[^>]*>/g, ' ');
}

function estimateReadTimeMinutes(textOrHtml: string) {
  const text = stripHtml(textOrHtml || '').replace(/[#*_`>\-\[\]\(\)]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [related, setRelated] = useState<BlogPost[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  const readTime = useMemo(() => estimateReadTimeMinutes(post?.content_html || post?.content_md || ''), [post?.content_html, post?.content_md]);

  const toc: TocItem[] = useMemo(() => {
    // Prefer backend-provided TOC (TipTap editor)
    if (post?.toc && Array.isArray(post.toc) && post.toc.length) {
      return post.toc as any;
    }

    // Fallback: build TOC from legacy markdown H2 headings (## Heading)
    const md = post?.content_md || '';
    const items: TocItem[] = [];
    const lines = md.split('\n');
    for (const line of lines) {
      const m = line.match(/^##\s+(.+)$/);
      if (m?.[1]) {
        const title = m[1].trim();
        const id = slugifyHeading(title);
        items.push({ id, title, level: 2 });
      }
    }
    return items;
  }, [post?.toc, post?.content_md]);

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const p = await BlogService.getPublishedPostBySlug(slug);
      setPost(p);

      const c = await BlogService.listApprovedComments(p.id);
      setComments(c.items || []);

      const list = await BlogService.listPublishedPosts({ page: 1, pageSize: 6 });
      const rel = (list.items || []).filter((x) => x.slug !== slug).slice(0, 3);
      setRelated(rel);
    } catch (e: any) {
      setError(e.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Highlight active section as user scrolls
  useEffect(() => {
    if (!toc.length) return;

    const ids = toc.map((t) => t.id);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top > b.boundingClientRect.top ? 1 : -1));
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: [0.1, 0.2, 0.3] }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [toc]);

  const onSubmitComment = async () => {
    if (!post) return;
    if (!user) {
      setError('Please login to comment.');
      return;
    }
    const body = commentDraft.trim();
    if (!body) return;

    setPosting(true);
    try {
      await BlogService.createComment(post.id, body);
      setCommentDraft('');
      // comments are moderated; public list shows only approved
    } catch (e: any) {
      setError(e.message || 'Failed to submit comment');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Card>
            <CardHeader>
              <CardTitle>Post not available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{error || 'Not found'}</p>
              <div className="mt-6">
                <Link to="/blog" className="text-primary underline">Back to blog</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const publishedDate = post.published_at ? new Date(post.published_at) : new Date(post.created_at);

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-8">
          <Link className="hover:text-primary transition-colors" to="/">Home</Link>
          <span className="text-xs">/</span>
          <Link className="hover:text-primary transition-colors" to="/blog">Blog</Link>
          <span className="text-xs">/</span>
          <span className="text-slate-900 dark:text-slate-100 font-medium line-clamp-1">{post.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Sidebar: Table of Contents */}
          <aside className="hidden lg:block lg:col-span-2">
            <div className="sticky top-24 h-fit rounded-2xl bg-slate-950/25 border border-white/10 p-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 px-3">Table of Contents</h3>
              {toc.length === 0 ? (
                <div className="text-xs text-muted-foreground px-3">No sections</div>
              ) : (
                <nav className="space-y-1">
                  {toc.map((t) => {
                    const isActive = activeId ? activeId === t.id : false;
                    return (
                      <a
                        key={t.id}
                        href={`#${t.id}`}
                        className={
                          isActive
                            ? 'flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/20 text-white border-l-4 border-primary font-semibold transition-all'
                            : 'flex items-center gap-3 px-3 py-2 rounded-lg text-white/90 hover:bg-white/5 transition-all'
                        }
                      >
                        <span className="inline-block size-2 rounded-full bg-primary/40" />
                        <span className="line-clamp-1">{t.title}</span>
                      </a>
                    );
                  })}
                </nav>
              )}

              <div className="mt-12 p-6 rounded-xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Want the whitepaper?</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Get the full PDF technical specifications for Ostrich.</p>
                <Button className="w-full text-xs font-bold">Download PDF</Button>
              </div>
            </div>
          </aside>

          {/* Main Content Column */}
          <article className="lg:col-span-8">
            <header className="mb-10 rounded-2xl bg-slate-950/30 border border-white/10 p-6">
              <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-slate-50 mb-6">
                {post.title}
              </h1>

              <div className="flex items-center gap-4 py-6 border-y border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center text-primary font-bold">
                  OA
                </div>
                <div>
                  <p className="text-slate-900 dark:text-slate-100 font-bold">OstrichAI</p>
                  <p className="text-xs text-white/85">
                    {publishedDate.toLocaleDateString()} • {readTime} min read
                  </p>
                </div>

                <div className="ml-auto flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(window.location.href);
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    Share
                  </Button>
                </div>
              </div>
            </header>

            {post.cover_image_url && (
              <div className="mb-10 rounded-2xl overflow-hidden aspect-video bg-slate-800">
                <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="prose prose-slate dark:prose-invert max-w-none text-left md:prose-lg prose-p:leading-7 md:prose-p:leading-8 prose-p:my-5 prose-li:my-2 prose-ul:my-5 prose-ol:my-5 prose-h2:mt-12 prose-h2:mb-5 prose-h2:font-black prose-h2:text-3xl md:prose-h2:text-4xl prose-h3:mt-10 prose-h3:mb-4 prose-h3:font-bold prose-h3:text-2xl">
              {post.content_html ? (
                <div
                  // content_html is sanitized server-side before being stored
                  dangerouslySetInnerHTML={{ __html: post.content_html }}
                />
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children, ...props }) => {
                      const text = String(children?.[0] ?? '').trim() || 'section';
                      const id = slugifyHeading(text);
                      return (
                        <h2 id={id} {...props}>
                          {children}
                        </h2>
                      );
                    },
                    img: ({ ...props }) => (
                      <img
                        {...props}
                        className="rounded-xl border border-primary/10 shadow-sm"
                        loading="lazy"
                      />
                    ),
                  }}
                >
                  {post.content_md}
                </ReactMarkdown>
              )}
            </div>

            {/* About the Author (simple v1) */}
            <section className="mt-16 p-8 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-20 h-20 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black">OA</div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">About OstrichAI</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                    Insights and product research from the OstrichAI team.
                  </p>
                  <div className="flex gap-4">
                    <a className="text-primary hover:underline text-xs font-bold uppercase tracking-wider" href="#">Twitter</a>
                    <a className="text-primary hover:underline text-xs font-bold uppercase tracking-wider" href="#">LinkedIn</a>
                  </div>
                </div>
              </div>
            </section>

            {/* Newsletter CTA */}
            <section className="mt-12 p-10 rounded-2xl bg-primary text-white text-center">
              <h3 className="text-2xl font-black mb-2">Join the Community</h3>
              <p className="mb-8 opacity-90 max-w-md mx-auto text-sm">Get bi-weekly deep dives delivered to your inbox.</p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
                <input className="flex-1 bg-white/10 border-white/20 rounded-lg py-3 px-4 text-white placeholder:text-white/60 focus:ring-2 focus:ring-white" placeholder="enter your email" type="email" />
                <button className="bg-white text-primary font-bold px-8 py-3 rounded-lg hover:bg-slate-100 transition-colors">Subscribe</button>
              </form>
              <p className="mt-4 text-[10px] text-white/70">By subscribing, you agree to our Privacy Policy and Terms.</p>
            </section>

            {/* Comments */}
            <div className="mt-14">
              <h2 className="text-2xl font-bold mb-4">Comments</h2>

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-base">Leave a comment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} placeholder={user ? 'Write your comment…' : 'Login to comment…'} disabled={!user || posting} />
                  <div className="flex justify-end">
                    <Button onClick={onSubmitComment} disabled={!user || posting || !commentDraft.trim()}>
                      {posting ? 'Submitting…' : 'Submit (requires approval)'}
                    </Button>
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </CardContent>
              </Card>

              {comments.length === 0 ? (
                <p className="text-muted-foreground">No approved comments yet.</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((c) => (
                    <Card key={c.id}>
                      <CardContent className="pt-6">
                        <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                        <div className="text-xs text-muted-foreground mt-3">
                          {new Date(c.created_at).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </article>

          {/* Right Sidebar: Related Articles */}
          <aside className="hidden lg:block lg:col-span-2">
            <div className="sticky top-24 h-fit space-y-8">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 px-2">Related Articles</h3>
                <div className="space-y-6">
                  {related.length === 0 ? (
                    <div className="text-xs text-muted-foreground px-2">No related posts yet.</div>
                  ) : (
                    related.map((r) => (
                      <Link key={r.id} to={`/blog/${r.slug}`} className="group block">
                        <div className="rounded-xl overflow-hidden mb-3 bg-slate-900/20 border border-primary/10">
                          {r.cover_image_url ? (
                            <img src={r.cover_image_url} alt={r.title} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-32 bg-primary/5" />
                          )}
                        </div>
                        {r.category && (
                          <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase mb-2">
                            {r.category}
                          </span>
                        )}
                        <h4 className="text-sm font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {r.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-2">
                          {(r.published_at ? new Date(r.published_at) : new Date(r.created_at)).toLocaleDateString()} • {estimateReadTimeMinutes(r.content_html || r.content_md)} min read
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 px-2">Share this article</h3>
                <div className="flex gap-3 px-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(window.location.href);
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    Copy link
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </Layout>
  );
};

export default BlogDetail;
