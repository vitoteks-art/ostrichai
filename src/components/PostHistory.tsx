import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Trash2, ExternalLink, Calendar, Facebook,
    Twitter, Instagram, Linkedin, Video,
    Loader2, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { deletePost } from '@/services/socialMediaPostingService';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from 'date-fns';

interface Post {
    id: string;
    platform: string;
    post_text: string;
    platform_post_url?: string;
    status: string;
    posted_at?: string;
    scheduled_for?: string;
    error_message?: string;
    image_urls?: string[];
    created_at: string;
}

const PostHistory: React.FC = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [postToDelete, setPostToDelete] = useState<Post | null>(null);

    const platformIcons: Record<string, React.FC<any>> = {
        facebook: Facebook,
        instagram: Instagram,
        twitter: Twitter,
        linkedin: Linkedin,
        tiktok: Video,
    };

    const platformColors: Record<string, string> = {
        facebook: 'text-blue-600',
        instagram: 'text-pink-600',
        twitter: 'text-black dark:text-white',
        linkedin: 'text-blue-700',
        tiktok: 'text-slate-900 dark:text-white',
    };

    useEffect(() => {
        if (user) {
            fetchPosts();
        }
    }, [user]);

    const fetchPosts = async () => {
        try {
            const data = await apiClient.getSocialPosts(0, 20);
            const filtered = (data || []).filter((post: Post) => post.status !== 'deleted');
            setPosts(filtered);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!postToDelete || !user) return;

        setDeletingId(postToDelete.id);

        try {
            const result = await deletePost(postToDelete.id, user.id);

            if (result.success) {
                toast.success('Post deleted successfully');
                setPosts(posts.filter(p => p.id !== postToDelete.id));
            } else {
                toast.error(result.error || 'Failed to delete post');
            }
        } catch (error) {
            toast.error('An error occurred while deleting the post');
        } finally {
            setDeletingId(null);
            setPostToDelete(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Published</Badge>;
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>;
            case 'pending':
            case 'posting':
                return <Badge variant="secondary">Processing</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (posts.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Recent Activity</h2>
            </div>

            <div className="grid gap-4">
                {posts.map((post) => {
                    const PlatformIcon = platformIcons[post.platform] || Facebook;
                    const colorClass = platformColors[post.platform] || 'text-gray-600';

                    return (
                        <Card key={post.id} className="p-4 transition-all hover:bg-secondary/20">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className={`mt-1 p-2 bg-secondary/50 rounded-full ${colorClass}`}>
                                        <PlatformIcon size={20} />
                                    </div>
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold capitalize text-sm">{post.platform}</span>
                                            {getStatusBadge(post.status)}
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                {post.posted_at
                                                    ? formatDistanceToNow(new Date(post.posted_at), { addSuffix: true })
                                                    : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                                                }
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground/80 line-clamp-2">
                                            {post.post_text}
                                        </p>

                                        {post.error_message && (
                                            <div className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                                <AlertTriangle size={12} />
                                                {post.error_message}
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-2 pt-2 border-t border-border/50">
                                            {post.platform_post_url && (
                                                <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                                                    <a href={post.platform_post_url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink size={14} className="mr-1" /> View Live
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                    onClick={() => setPostToDelete(post)}
                                    disabled={deletingId === post.id}
                                >
                                    {deletingId === post.id ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={18} />
                                    )}
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the post from your history.
                            {postToDelete?.platform_post_url && " We will also attempt to delete it from the social media platform."}
                            <br /><br />
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PostHistory;
