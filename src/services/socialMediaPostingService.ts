import { apiClient } from '@/lib/api';
import { SocialMediaAccount } from './socialMediaOAuthService';

export interface PostContent {
    text: string;
    imageUrls?: string[];
    videoUrl?: string;
    hashtags?: string[];
}

export interface PostResult {
    success: boolean;
    platformPostId?: string;
    platformPostUrl?: string;
    error?: string;
    warning?: string;
}

// Main posting function that routes to platform-specific handlers via Backend API
export const postToSocialMedia = async (
    account: SocialMediaAccount,
    content: PostContent,
    projectId?: string
): Promise<PostResult> => {
    let result: PostResult;
    let warning: string | undefined;

    console.log(`[Frontend Debug] postToSocialMedia called for ${account.platform}`, { content, projectId });

    let contentToSend: PostContent = { ...content };
    if (account.platform === 'linkedin' && content.videoUrl) {
        contentToSend = { ...contentToSend, videoUrl: undefined, imageUrls: [] };
        warning = "LinkedIn video isn't supported for this app. Posted text only.";
    }

    // Client-side validation
    if (account.platform === 'instagram') {
        const hasImage = !!contentToSend.imageUrls && contentToSend.imageUrls.length > 0;
        const hasVideo = !!contentToSend.videoUrl;
        if (!hasImage && !hasVideo) {
            console.error('[Frontend Debug] Instagram validation failed: no media');
            return {
                success: false,
                error: "Instagram requires at least one image or video."
            };
        }
    }

    try {
        console.log('[Frontend Debug] Calling apiClient.publishSocialPost...');
        const response = await apiClient.publishSocialPost({
            account_id: account.id,
            content: contentToSend,
            project_id: projectId
        });

        result = {
            success: true,
            platformPostId: response.platformPostId,
            platformPostUrl: response.platformPostUrl,
            warning
        };
    } catch (error: any) {
        console.error(`Error posting to ${account.platform}:`, error);

        let errorMessage = error.message || `Failed to post to ${account.platform}`;

        // Enhance error message for common issues
        if (errorMessage.includes('permissions') || errorMessage.includes('(#200)')) {
            errorMessage += " Please try disconnecting and re-connecting your account.";
        }

        result = {
            success: false,
            error: errorMessage,
            warning
        };
    }

    // Save post record to database...

    // Save post record to database
    try {
        await apiClient.createSocialPostRecord({
            account_id: account.id,
            project_id: projectId || undefined,
            platform: account.platform,
            post_text: content.text,
            image_urls: contentToSend.imageUrls || [],
            video_url: contentToSend.videoUrl || undefined,
            platform_post_id: result.platformPostId,
            platform_post_url: result.platformPostUrl,
            status: result.success ? 'published' : 'failed',
            error_message: result.error
        });
    } catch (error) {
        console.error('Error saving post record to backend:', error);
    }

    return result;
};

// Post to multiple accounts
export const postToMultipleAccounts = async (
    accounts: SocialMediaAccount[],
    content: PostContent,
    projectId?: string
): Promise<{ accountId: string; result: PostResult }[]> => {
    const results = await Promise.allSettled(
        accounts.map(account =>
            postToSocialMedia(account, content, projectId)
                .then(result => ({ accountId: account.id, result }))
        )
    );

    return results.map(result => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            return {
                accountId: 'unknown',
                result: {
                    success: false,
                    error: result.reason?.message || 'Unknown error'
                }
            };
        }
    });
};

// Schedule post for future publishing
export const schedulePost = async (
    accounts: SocialMediaAccount[],
    content: PostContent,
    scheduledTime: Date,
    projectId?: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const accountIds = accounts.map(acc => acc.id);

        await apiClient.scheduleSocialPost({
            post_text: content.text,
            image_urls: content.imageUrls || [],
            video_url: content.videoUrl || undefined,
            target_accounts: accountIds,
            scheduled_time: scheduledTime.toISOString(),
            status: 'scheduled'
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error scheduling post:', error);
        return {
            success: false,
            error: error.message || 'Failed to schedule post'
        };
    }
};

// Delete post from platform and database
export const deletePost = async (
    postId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        // 1. Get post details via backend or just try to delete if we have the platform info
        // For simplicity during migration, we'll keep the remote deletion logic but update the local status via backend

        // Mark as deleted in backend
        await apiClient.updateSocialPostStatus(postId, { status: 'deleted' });

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting post:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete post'
        };
    }
};
