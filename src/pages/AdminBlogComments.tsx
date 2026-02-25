import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';
import { BlogService, BlogComment } from '@/services/blogService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AdminBlogComments: React.FC = () => {
  const [status, setStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BlogComment[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await BlogService.adminListComments({ status });
      setItems(res.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const moderate = async (id: string, next: any) => {
    await BlogService.adminModerateComment(id, next);
    await load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    await BlogService.adminDeleteComment(id);
    await load();
  };

  return (
    <ProtectedAdminRoute requiredRole="admin">
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Comment Moderation</h1>
              <p className="text-muted-foreground">Approve or reject comments submitted on blog posts.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['pending', 'approved', 'rejected', 'spam'].map((s) => (
                <Button key={s} variant={status === s ? 'default' : 'outline'} onClick={() => setStatus(s)}>
                  {s.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{status.toUpperCase()} comments</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : items.length === 0 ? (
                <p className="text-muted-foreground">No comments.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((c) => (
                    <div key={c.id} className="border border-border/60 rounded-lg p-4">
                      <div className="text-xs text-muted-foreground mb-2">
                        {new Date(c.created_at).toLocaleString()} • post_id: {c.post_id}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{c.body}</div>
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {status !== 'approved' && <Button size="sm" onClick={() => moderate(c.id, 'approved')}>Approve</Button>}
                        {status !== 'rejected' && <Button size="sm" variant="outline" onClick={() => moderate(c.id, 'rejected')}>Reject</Button>}
                        {status !== 'spam' && <Button size="sm" variant="outline" onClick={() => moderate(c.id, 'spam')}>Spam</Button>}
                        <Button size="sm" variant="destructive" onClick={() => del(c.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedAdminRoute>
  );
};

export default AdminBlogComments;
