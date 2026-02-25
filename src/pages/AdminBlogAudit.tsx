import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';
import { BlogService, BlogAuditLog } from '@/services/blogService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminBlogAudit: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BlogAuditLog[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await BlogService.adminAuditLogs({ limit: 200 });
      setItems(res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ProtectedAdminRoute requiredRole="admin">
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <h1 className="text-3xl font-black tracking-tight mb-6">Blog Activity Audit</h1>
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : items.length === 0 ? (
                <p className="text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="space-y-2">
                  {items.map((a) => (
                    <div key={a.id} className="border border-border/60 rounded-lg p-3 text-sm">
                      <div className="text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()} • actor: {a.actor_user_id}
                      </div>
                      <div className="mt-1">
                        <span className="font-medium">{a.action}</span>
                        {a.from_status || a.to_status ? (
                          <span className="text-muted-foreground"> • {a.from_status || '—'} → {a.to_status || '—'}</span>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">post_id: {a.post_id}</div>
                      {a.note && <div className="text-xs mt-1">note: {a.note}</div>}
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

export default AdminBlogAudit;
