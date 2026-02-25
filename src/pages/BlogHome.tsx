import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { BlogService, BlogPost } from '@/services/blogService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BlogHome: React.FC = () => {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  const load = async () => {
    setLoading(true);
    try {
      const res = await BlogService.listPublishedPosts({ q, page, pageSize });
      setPosts(res.items || []);
      setTotal(res.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await load();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Blog</h1>
            <p className="text-muted-foreground mt-2">Latest insights from OstrichAi.</p>
          </div>
          <form onSubmit={onSearch} className="flex gap-2 w-full md:w-[420px]">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts..." />
            <Button type="submit" variant="default">Search</Button>
          </form>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading posts…</p>
        ) : posts.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No posts yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No published posts found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="group">
                <Card className="h-full hover:border-primary/40 transition-colors">
                  {p.cover_image_url ? (
                    <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
                      <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-t-xl bg-primary/5" />
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{p.excerpt || '—'}</p>
                    <div className="mt-4 text-xs text-muted-foreground">
                      {p.published_at ? new Date(p.published_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-10">
          <div className="text-sm text-muted-foreground">
            Page {page} • {total} posts
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
            <Button variant="outline" disabled={page * pageSize >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BlogHome;
