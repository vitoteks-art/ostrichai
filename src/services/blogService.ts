import { apiClient } from '@/lib/api';

export type BlogPostStatus = 'draft' | 'pending' | 'approved' | 'published';
export type BlogCommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  // Legacy markdown field (kept for backward compatibility)
  content_md: string;

  // New rich editor fields
  content_json?: any;
  content_html?: string;
  toc?: Array<{ id: string; title: string; level?: number }>;
  status: BlogPostStatus;
  category?: string;
  tags: string[];
  seo_title?: string;
  seo_description?: string;
  cover_image_url?: string;
  created_by: string;
  updated_by?: string;
  approved_by?: string;
  published_by?: string;
  approved_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogListResponse {
  items: BlogPost[];
  total: number;
  page: number;
  page_size: number;
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  status: BlogCommentStatus;
  created_at: string;
}

export interface BlogCommentListResponse {
  items: BlogComment[];
  total: number;
}

export interface BlogAuditLog {
  id: string;
  post_id: string;
  actor_user_id: string;
  action: string;
  from_status?: string;
  to_status?: string;
  note?: string;
  meta?: any;
  created_at: string;
}

export const BlogService = {
  // Public
  async listPublishedPosts(params: { q?: string; page?: number; pageSize?: number } = {}): Promise<BlogListResponse> {
    const q = params.q ? `&q=${encodeURIComponent(params.q)}` : '';
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 12;
    return apiClient.request(`/blog/posts?page=${page}&page_size=${pageSize}${q}`);
  },

  async getPublishedPostBySlug(slug: string): Promise<BlogPost> {
    return apiClient.request(`/blog/posts/${encodeURIComponent(slug)}`);
  },

  async listApprovedComments(postId: string): Promise<BlogCommentListResponse> {
    return apiClient.request(`/blog/posts/${postId}/comments`);
  },

  async createComment(postId: string, body: string): Promise<BlogComment> {
    return apiClient.request(`/blog/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body })
    });
  },

  // Admin
  async adminListPosts(params: { q?: string; status?: string; page?: number; pageSize?: number } = {}): Promise<BlogListResponse> {
    const q = params.q ? `&q=${encodeURIComponent(params.q)}` : '';
    const status = params.status ? `&status=${encodeURIComponent(params.status)}` : '';
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 25;
    return apiClient.request(`/admin/blog/posts?page=${page}&page_size=${pageSize}${q}${status}`);
  },

  async adminGetPost(postId: string): Promise<BlogPost> {
    return apiClient.request(`/admin/blog/posts/${postId}`);
  },

  async adminCreatePost(payload: Partial<BlogPost> & { title: string; slug: string; content_md: string }): Promise<BlogPost> {
    return apiClient.request(`/admin/blog/posts`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async adminUpdatePost(postId: string, payload: Partial<BlogPost>): Promise<BlogPost> {
    return apiClient.request(`/admin/blog/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  async adminSetPostStatus(postId: string, status: BlogPostStatus, note?: string): Promise<BlogPost> {
    const noteQs = note ? `&note=${encodeURIComponent(note)}` : '';
    return apiClient.request(`/admin/blog/posts/${postId}/status?status=${status}${noteQs}`, {
      method: 'POST'
    });
  },

  async adminDeletePost(postId: string): Promise<{ success: boolean }> {
    return apiClient.request(`/admin/blog/posts/${postId}`, { method: 'DELETE' });
  },

  async adminListComments(params: { status?: string; postId?: string; page?: number; pageSize?: number } = {}): Promise<BlogCommentListResponse> {
    const status = params.status ? `&status=${encodeURIComponent(params.status)}` : '';
    const postId = params.postId ? `&post_id=${encodeURIComponent(params.postId)}` : '';
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;
    return apiClient.request(`/admin/blog/comments?page=${page}&page_size=${pageSize}${status}${postId}`);
  },

  async adminModerateComment(commentId: string, status: BlogCommentStatus, reason?: string): Promise<BlogComment> {
    return apiClient.request(`/admin/blog/comments/${commentId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ status, reason })
    });
  },

  async adminDeleteComment(commentId: string): Promise<{ success: boolean }> {
    return apiClient.request(`/admin/blog/comments/${commentId}`, { method: 'DELETE' });
  },

  async adminAuditLogs(params: { postId?: string; limit?: number } = {}): Promise<BlogAuditLog[]> {
    const postId = params.postId ? `?post_id=${encodeURIComponent(params.postId)}` : '';
    const limit = params.limit ? `${postId ? '&' : '?'}limit=${params.limit}` : '';
    return apiClient.request(`/admin/blog/audit${postId}${limit}`);
  }
};
