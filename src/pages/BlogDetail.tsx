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

const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const p = await BlogService.getPublishedPostBySlug(slug);
      setPost(p);
      const c = await BlogService.listApprovedComments(p.id);
      setComments(c.items || []);
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
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10 max-w-3xl">
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link> / <Link to="/blog" className="hover:text-primary">Blog</Link> / <span className="text-foreground">{post.title}</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">{post.title}</h1>
        <div className="text-sm text-muted-foreground mb-8">
          {post.published_at ? new Date(post.published_at).toLocaleDateString() : new Date(post.created_at).toLocaleDateString()}
        </div>

        {post.cover_image_url && (
          <div className="rounded-2xl overflow-hidden bg-muted mb-10">
            <img src={post.cover_image_url} alt={post.title} className="w-full h-auto" />
          </div>
        )}

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content_md}</ReactMarkdown>
        </div>

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
      </div>
    </Layout>
  );
};

export default BlogDetail;
