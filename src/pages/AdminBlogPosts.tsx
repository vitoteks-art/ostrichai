import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';
import { BlogService, BlogPost } from '@/services/blogService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    draft: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    approved: 'bg-primary/10 text-primary border-primary/20',
    published: 'bg-green-500/10 text-green-500 border-green-500/20',
  };
  return map[status] || 'bg-slate-500/10 text-slate-500';
};

const AdminBlogPosts: React.FC = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  const load = async () => {
    setLoading(true);
    try {
      const res = await BlogService.adminListPosts({ q, status: status || undefined, page, pageSize });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await load();
  };

  const quickStatus = async (postId: string, next: any) => {
    await BlogService.adminSetPostStatus(postId, next);
    await load();
  };

  const del = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    await BlogService.adminDeletePost(postId);
    await load();
  };

  return (
    <ProtectedAdminRoute requiredRole="admin">
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Blog Posts</h1>
              <p className="text-muted-foreground">Create, approve, publish, and manage posts.</p>
            </div>
            <Button onClick={() => navigate('/admin/blog/posts/new')}>Create New Post</Button>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:items-center mb-6">
            <form onSubmit={onSearch} className="flex gap-2 flex-1">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or slug..." />
              <Button type="submit" variant="outline">Search</Button>
            </form>
            <div className="flex gap-2 flex-wrap">
              {['', 'draft', 'pending', 'approved', 'published'].map((s) => (
                <Button
                  key={s || 'all'}
                  variant={status === s ? 'default' : 'outline'}
                  onClick={() => { setStatus(s); setPage(1); }}
                >
                  {s ? s.toUpperCase() : 'ALL'}
                </Button>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : items.length === 0 ? (
                <p className="text-muted-foreground">No posts found.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((p) => (
                    <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 border border-border/60 rounded-lg p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link to={`/admin/blog/posts/${p.id}/edit`} className="font-semibold hover:text-primary line-clamp-1">{p.title}</Link>
                          <Badge variant="outline" className={statusBadge(p.status)}>{p.status}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">/blog/{p.slug}</div>
                      </div>
                      <div className="flex gap-2 flex-wrap md:justify-end">
                        {p.status === 'pending' && (
                          <Button size="sm" onClick={() => quickStatus(p.id, 'approved')}>Approve</Button>
                        )}
                        {p.status === 'approved' && (
                          <Button size="sm" onClick={() => quickStatus(p.id, 'published')}>Publish</Button>
                        )}
                        {p.status === 'published' && (
                          <Button size="sm" variant="outline" onClick={() => quickStatus(p.id, 'approved')}>Unpublish</Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/blog/posts/${p.id}/edit`)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => del(p.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">Page {page} • {total} total</div>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                  <Button variant="outline" disabled={page * pageSize >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedAdminRoute>
  );
};

export default AdminBlogPosts;
