import { API_BASE_URL } from '../lib/api';


export interface ProjectData {
  title: string;
  type: 'video' | 'logo' | 'ad' | 'flyer' | 'social' | 'social_post' | 'scraping' | 'image_edit' | 'youtube' | 'script' | 'title_generation' | 'blog' | 'seo_audit';
  status: 'draft' | 'processing' | 'completed' | 'failed';
  thumbnail_url?: string;
  file_url?: string;
  project_metadata?: Record<string, any>;
}

export interface WebhookResponseData {
  extractedUrl?: string;
  success?: boolean;
  debugInfo?: {
    inputCount?: number;
    method1_structure?: string;
    isDirect?: boolean;
    extractionMethod?: string;
  };
  rawInput?: {
    code?: number;
    msg?: string;
    data?: {
      taskId?: string;
      model?: string;
      state?: string;
      param?: string;
      resultJson?: string;
      failCode?: string | null;
      failMsg?: string | null;
      costTime?: number;
      completeTime?: number;
      createTime?: number;
    };
  };
}

export interface ActivityData {
  action: string;
  details?: string;
  activity_metadata?: Record<string, any>;
}

export interface ProjectStats {
  totalProjects: number;
  videosCreated: number;
  logosGenerated: number;
  adsCreated: number;
  flyersCreated: number;
  socialPostsCreated: number;
  imagesEdited: number;
  scrapingProjects: number;
  storageUsed: number;
  storageLimit: number;
}

export class ProjectService {
  /**
   * Helper to get common headers with auth token
   */
  private static getHeaders(token?: string) {
    const activeToken = token || localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
    };
  }

  /**
   * Create a new project record in the database
   */
  static async createProject(userId: string, projectData: ProjectData, token?: string) {
    try {
      console.log('Creates project via FastAPI');
      const response = await fetch(`${API_BASE_URL}/projects/`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({
          title: projectData.title,
          type: projectData.type,
          status: projectData.status,
          thumbnail_url: projectData.thumbnail_url,
          file_url: projectData.file_url,
          project_metadata: projectData.project_metadata
        })
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);
          }
        } catch (e) {
          console.warn('Failed to parse error response:', e);
        }
        throw new Error(`FastAPI Error: ${errorMessage}`);
      }

      const data = await response.json();
      return { success: true, data, isDemo: false };

    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  /**
   * Update an existing project
   */
  static async updateProject(projectId: string, updates: Partial<ProjectData>, token?: string) {
    try {
      console.log('Updates project via FastAPI');
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'PATCH',
        headers: this.getHeaders(token),
        body: JSON.stringify({
          title: updates.title,
          status: updates.status,
          thumbnail_url: updates.thumbnail_url,
          file_url: updates.file_url,
          project_metadata: updates.project_metadata
        })
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);
          }
        } catch (e) {
          console.warn('Failed to parse error response:', e);
        }
        throw new Error(`FastAPI Error: ${errorMessage}`);
      }

      const data = await response.json();
      return { success: true, data, isDemo: false };

    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  /**
  * Merge updates into existing project metadata (Deep Merge)
  */
  static async mergeProjectMetadata(projectId: string, metadataUpdates: Record<string, any>, token?: string) {
    try {
      // 1. Fetch current project
      const result = await this.getProjectById(projectId, token);

      if (!result.success || !result.data) {
        console.warn('Error fetching project for metadata merge:', result.error);
        return { success: false, error: result.error };
      }

      const currentProject = result.data;

      // 2. Merge metadata
      // Check both project_metadata and metadata for backward compatibility
      const existingMetadata = {
        ...(currentProject?.project_metadata || {}),
        ...(currentProject?.metadata || {})
      };

      const newMetadata = {
        ...existingMetadata,
        ...metadataUpdates
      };

      // 3. Update project
      return await this.updateProject(projectId, { project_metadata: newMetadata }, token);
    } catch (error) {
      console.warn('Error merging project metadata:', error);
      return { success: false, error };
    }
  }

  /**
   * Update project with webhook response data
   */
  static async updateProjectWithWebhookData(projectId: string, webhookResponse: WebhookResponseData[], originalMetadata?: Record<string, any>, token?: string) {
    try {
      // Extract data from the first response item (assuming array format)
      const responseData = webhookResponse[0] || {};

      // Determine status based on comprehensive success indicators
      // Handle different webhook response formats from various components
      const isSuccessful =
        responseData.success === true ||
        responseData.extractedUrl ||
        (responseData.rawInput && responseData.rawInput.data && responseData.rawInput.data.state === 'success') ||
        // Additional success indicators for different component types
        (responseData as any).image_url || // For image-based responses
        (responseData as any).result_url || // For video/result URL responses
        (responseData as any).output || // For responses with output object
        ((responseData as any).code === 200) || // For responses with HTTP-like codes
        ((responseData as any).status && (responseData as any).status.toLowerCase().includes('success')) || // For status-based responses
        ((responseData as any).state === 'success') || // Direct state success
        // Check if response has any meaningful content/URLs that indicate success
        (responseData as any).url ||
        (responseData as any).imageUrl ||
        (responseData as any).videoUrl;

      let status: 'completed' | 'failed' = isSuccessful ? 'completed' : 'failed';

      // Extract URLs and metadata from various response formats
      const extractedUrl = responseData.extractedUrl ||
        (responseData as any).image_url ||
        (responseData as any).result_url ||
        (responseData as any).url ||
        (responseData as any).imageUrl ||
        (responseData as any).videoUrl;

      const taskId = responseData.rawInput?.data?.taskId || (responseData as any).task_id || (responseData as any).taskId;
      const model = responseData.rawInput?.data?.model || (responseData as any).model;
      const costTime = responseData.rawInput?.data?.costTime || (responseData as any).costTime;
      const completeTime = responseData.rawInput?.data?.completeTime || (responseData as any).completeTime;
      const createTime = responseData.rawInput?.data?.createTime || (responseData as any).createTime;

      // Parse resultJson if available
      let resultUrls: string[] = [];
      if (responseData.rawInput?.data?.resultJson) {
        try {
          const resultData = JSON.parse(responseData.rawInput.data.resultJson);
          resultUrls = resultData.resultUrls || [];
        } catch (parseError) {
          console.warn('Failed to parse resultJson:', parseError);
        }
      }

      // Combine all metadata
      const enhancedMetadata = {
        ...originalMetadata,
        webhookResponse: {
          extractedUrl,
          taskId,
          model,
          costTime,
          completeTime,
          createTime,
          resultUrls,
          debugInfo: responseData.debugInfo,
          success: responseData.success,
          failCode: responseData.rawInput?.data?.failCode,
          failMsg: responseData.rawInput?.data?.failMsg,
          processedAt: new Date().toISOString(),
          // Store original response for debugging
          originalResponse: responseData
        }
      };

      const updates: Partial<ProjectData> = {
        status,
        file_url: extractedUrl || resultUrls[0],
        project_metadata: enhancedMetadata
      };

      return await this.updateProject(projectId, updates, token);
    } catch (error) {
      console.warn('Error updating project with webhook data:', error);
      return { success: false, error: 'Failed to update project with webhook data', isDemo: true };
    }
  }

  /**
   * Get all dashboard data in a single parallel call
   */
  static async getUserDashboardData(userId: string, token?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/dashboard`, {
        headers: this.getHeaders(token)
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);
          }
        } catch (e) {
          console.warn('Failed to parse error response:', e);
        }
        throw new Error(`FastAPI Error: ${errorMessage}`);
      }

      const data = await response.json();

      // Transform data to match expected interface if necessary
      // Assuming backend returns matching structure for now
      return {
        success: true,
        data: {
          projects: data.projects || [],
          activities: data.activities || [],
          stats: {
            totalProjects: data.stats?.totalProjects || 0,
            videosCreated: data.stats?.videosCreated || 0,
            logosGenerated: data.stats?.logosGenerated || 0,
            adsCreated: data.stats?.adsCreated || 0,
            flyersCreated: data.stats?.flyersCreated || 0,
            socialPostsCreated: data.stats?.socialPostsCreated || 0,
            imagesEdited: data.stats?.imagesEdited || 0,
            scrapingProjects: data.stats?.scrapingProjects || 0,
            storageUsed: data.stats?.storageUsed || 0,
            storageLimit: data.stats?.storageLimit || 1000
          }
        },
        isDemo: false
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return { success: false, error };
    }
  }

  /**
   * Get all projects for a user (Summary fields only)
   * Optimized to exclude large metadata for stats calculation
   */
  static async getUserProjectsSummary(userId: string, token?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/?limit=1000`, {
        headers: this.getHeaders(token)
      }); // Fetch all for summary

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);
          }
        } catch (e) {
          console.warn('Failed to parse error response:', e);
        }
        throw new Error(`FastAPI Error: ${errorMessage}`);
      }

      const data = await response.json();
      return { success: true, data: data || [], isDemo: false };
    } catch (error: any) {
      console.error('Error fetching project summaries:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Get a limited number of recent projects with full metadata
   */
  static async getFullRecentProjects(userId: string, limit: number = 10, token?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/?limit=${limit}`, {
        headers: this.getHeaders(token)
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);
          }
        } catch (e) {
          console.warn('Failed to parse error response:', e);
        }
        throw new Error(`FastAPI Error: ${errorMessage}`);
      }

      const data = await response.json();
      return { success: true, data: data || [], isDemo: false };
    } catch (error: any) {
      console.error('Error fetching recent full projects:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Get paginated projects with filters and sorting (Full metadata)
   */
  static async getProjectsPaginated(params: {
    userId: string;
    page: number;
    limit: number;
    searchTerm?: string;
    filterType?: string;
    sortBy?: string;
  }, providedToken?: string) {
    const { userId, page, limit, searchTerm, filterType, sortBy } = params;
    const skip = (page - 1) * limit;

    // Use provided token or fallback to localStorage
    const token = providedToken || localStorage.getItem('auth_token');

    try {
      const queryParams = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString()
      });

      if (filterType && filterType !== 'all') {
        queryParams.append('type', filterType);
      }

      // Note: Search and SortBy are not yet implemented in backend Basic router
      // If we need them, we should pass them or handle client side for now.
      // Backend router only filters by type and pages.

      const response = await fetch(`${API_BASE_URL}/projects/?${queryParams.toString()}`, {
        headers: this.getHeaders(token)
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);
          }
        } catch (e) {
          console.warn('Failed to parse error response:', e);
        }
        throw new Error(`FastAPI Error: ${errorMessage}`);
      }

      const data = await response.json();
      const totalCount = 100; // Mock count because basic backend list doesn't return count yet.

      return {
        success: true,
        data: data || [],
        count: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error: any) {
      console.error('Error fetching paginated projects:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Get a single project by ID with full details (including metadata)
   */
  static async getProjectById(projectId: string, token?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        headers: this.getHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Project not found');
      }

      const data = await response.json();
      return { success: true, data, isDemo: false };
    } catch (error: any) {
      console.error('Error fetching project detail:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Log user activity with enhanced tracking (stored in metadata)
   */
  static async logActivity(userId: string, activityData: ActivityData, token?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/activity`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({
          action: activityData.action,
          details: activityData.details,
          activity_metadata: {
            ...activityData.activity_metadata,
            category: activityData.activity_metadata?.category || 'system',
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
            sessionId: this.generateSessionId(),
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);
          }
        } catch (e) {
          console.warn('Failed to parse error response:', e);
        }
        throw new Error(`FastAPI Error: ${errorMessage}`);
      }

      return { success: true, isDemo: false };
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  /**
   * Log product creation activity
   */
  static async logProductCreation(userId: string, productType: string, productTitle: string, metadata?: Record<string, any>, token?: string) {
    return this.logActivity(userId, {
      action: `Created ${productType}`,
      details: `Started creating new ${productType}: ${productTitle}`,
      activity_metadata: {
        category: 'creation',
        productType,
        productTitle,
        ...metadata
      }
    }, token);
  }

  /**
   * Log product completion activity
   */
  static async logProductCompletion(userId: string, productType: string, productTitle: string, projectId?: string, duration?: number, metadata?: Record<string, any>, token?: string) {
    return this.logActivity(userId, {
      action: `Completed ${productType}`,
      details: `Successfully completed ${productType}: ${productTitle}`,
      activity_metadata: {
        category: 'completion',
        productType,
        productTitle,
        projectId,
        duration,
        completionTime: new Date().toISOString(),
        ...metadata
      }
    }, token);
  }

  /**
   * Log product error activity
   */
  static async logProductError(userId: string, productType: string, errorMessage: string, projectId?: string, metadata?: Record<string, any>, token?: string) {
    return this.logActivity(userId, {
      action: `${productType} failed`,
      details: `Failed to create ${productType}: ${errorMessage}`,
      activity_metadata: {
        category: 'error',
        productType,
        errorMessage,
        projectId,
        ...metadata
      }
    }, token);
  }

  /**
   * Log user interaction activity
   */
  static async logUserInteraction(userId: string, action: string, details: string, metadata?: Record<string, any>, token?: string) {
    return this.logActivity(userId, {
      action,
      details,
      activity_metadata: {
        category: 'view',
        ...metadata
      }
    }, token);
  }

  /**
   * Log system activity
   */
  static async logSystemActivity(userId: string, action: string, details: string, metadata?: Record<string, any>, token?: string) {
    return this.logActivity(userId, {
      action,
      details,
      activity_metadata: {
        category: 'system',
        ...metadata
      }
    }, token);
  }

  /**
   * Generate a session ID for tracking user sessions
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user activity history
   */
  static async getUserActivity(userId: string, limit = 10, token?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/activity?limit=${limit}`, {
        headers: this.getHeaders(token)
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);
          }
        } catch (e) {
          console.warn('Failed to parse error response:', e);
        }
        throw new Error(`FastAPI Error: ${errorMessage}`);
      }

      const data = await response.json();
      return { success: true, data: data || [], isDemo: false };
    } catch (error) {
      console.warn('Error fetching activity, using demo mode:', error);
      return { success: true, data: this.getMockActivity(userId), isDemo: true };
    }
  }

  /**
   * Get comprehensive activity statistics and state
   */
  static async getActivityStats(userId: string, token?: string) {
    try {
      const [projectsResult, activitiesResult] = await Promise.all([
        this.getUserProjectsSummary(userId, token),
        this.getUserActivity(userId, 100, token) // Get more activities for stats
      ]);

      const projects = projectsResult.data || [];
      const activities = activitiesResult.data || [];

      // Calculate activity statistics
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recentActivities = activities.filter(a => new Date(a.created_at) >= last24Hours);
      const weeklyActivities = activities.filter(a => new Date(a.created_at) >= last7Days);

      // Group activities by category (extract from metadata)
      const activitiesByCategory = activities.reduce((acc, activity) => {
        const metadata = activity.activity_metadata || activity.project_metadata || activity.metadata;
        const category = metadata?.category || 'system';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group activities by product type (extract from metadata)
      const activitiesByProduct = activities.reduce((acc, activity) => {
        const metadata = activity.activity_metadata || activity.project_metadata || activity.metadata;
        const productType = metadata?.productType || 'other';
        acc[productType] = (acc[productType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get current state of all projects
      const currentState = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'processing').length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        failedProjects: projects.filter(p => p.status === 'failed').length,
        draftProjects: projects.filter(p => p.status === 'draft').length,
        projectsByType: projects.reduce((acc, project) => {
          acc[project.type] = (acc[project.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return {
        success: true,
        data: {
          currentState,
          activityStats: {
            totalActivities: activities.length,
            recentActivities: recentActivities.length,
            weeklyActivities: weeklyActivities.length,
            activitiesByCategory,
            activitiesByProduct,
            averageActivitiesPerDay: activities.length / Math.max(1, Math.ceil((now.getTime() - new Date(activities[activities.length - 1]?.created_at || now).getTime()) / (24 * 60 * 60 * 1000)))
          },
          lastActivity: activities[0]?.created_at || null,
          mostActiveProduct: Object.entries(activitiesByProduct).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'none'
        },
        isDemo: projectsResult.isDemo
      };
    } catch (error) {
      console.warn('Error getting activity stats:', error);
      return {
        success: true,
        data: {
          currentState: {
            totalProjects: 0,
            activeProjects: 0,
            completedProjects: 0,
            failedProjects: 0,
            draftProjects: 0,
            projectsByType: {}
          },
          activityStats: {
            totalActivities: 0,
            recentActivities: 0,
            weeklyActivities: 0,
            activitiesByCategory: {},
            activitiesByProduct: {},
            averageActivitiesPerDay: 0
          },
          lastActivity: null,
          mostActiveProduct: 'none'
        },
        isDemo: true
      };
    }
  }

  /**
   * Get project statistics for a user - Optimized to use provided projects list
   */
  static calculateProjectStats(projects: any[]): ProjectStats {
    return {
      totalProjects: projects.length,
      videosCreated: projects.filter(p => p.type === 'video' && p.status === 'completed').length,
      logosGenerated: projects.filter(p => p.type === 'logo' && p.status === 'completed').length,
      adsCreated: projects.filter(p => p.type === 'ad' && p.status === 'completed').length,
      flyersCreated: projects.filter(p => p.type === 'flyer' && p.status === 'completed').length,
      socialPostsCreated: projects.filter(p => (p.type === 'social_post' || p.type === 'social') && p.status === 'completed').length,
      imagesEdited: projects.filter(p => p.type === 'image_edit' && p.status === 'completed').length,
      scrapingProjects: projects.filter(p => p.type === 'scraping' && p.status === 'completed').length,
      storageUsed: this.calculateStorageUsed(projects),
      storageLimit: 1000 // 1GB default limit
    };
  }

  /**
   * Get project statistics for a user (Legacy wrapper)
   */
  static async getProjectStats(userId: string): Promise<{ success: boolean; data: ProjectStats; isDemo: boolean }> {
    try {
      const projectsResult = await this.getUserProjectsSummary(userId);
      const stats = this.calculateProjectStats(projectsResult.data || []);
      return { success: true, data: stats, isDemo: projectsResult.isDemo };
    } catch (error) {
      console.warn('Error calculating stats, using demo data:', error);
      return { success: true, data: this.getMockStats(), isDemo: true };
    }
  }

  private static getMockStats(): ProjectStats {
    return {
      totalProjects: 12,
      videosCreated: 5,
      logosGenerated: 3,
      adsCreated: 2,
      flyersCreated: 1,
      socialPostsCreated: 1,
      imagesEdited: 0,
      scrapingProjects: 0,
      storageUsed: 450,
      storageLimit: 1000
    };
  }

  /**
   * Delete a project
   */
  static async deleteProject(projectId: string, token?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: this.getHeaders(token) // Added headers for DELETE
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);
          }
        } catch (e) {
          console.warn('Failed to parse error response:', e);
        }
        throw new Error(`FastAPI Error: ${errorMessage}`);
      }

      return { success: true, isDemo: false };
    } catch (error) {
      console.warn('Error deleting project, using demo mode:', error);
      return { success: true, isDemo: true };
    }
  }

  /**
   * Calculate storage used by projects (in MB)
   */
  private static calculateStorageUsed(projects: any[]): number {
    // Calculate based on actual project types and metadata
    return projects.reduce((total, project) => {
      let size = 5; // Base size for project record

      // Add size based on project type and metadata
      if (project.type === 'scraping' && project.metadata?.scrapingResults) {
        // Estimate size for scraping results (rough calculation)
        const results = project.metadata.scrapingResults;
        size += results.length * 2; // ~2KB per business record
      } else if (project.type === 'video' && project.metadata?.fileSize) {
        size += Math.floor(project.metadata.fileSize / (1024 * 1024)); // Convert bytes to MB
      } else {
        size += 15; // Default size for other project types
      }

      return total + size;
    }, 0);
  }

  /**
   * Get mock projects for demo mode
   */
  private static getMockProjects(userId: string) {
    const now = new Date();
    return [
      {
        id: 'mock-1',
        user_id: userId,
        title: 'Product Launch Video',
        type: 'video',
        status: 'completed',
        thumbnail_url: '/placeholder.svg',
        created_at: new Date(now.getTime() - 86400000).toISOString(),
        updated_at: new Date(now.getTime() - 86400000).toISOString(),
        metadata: { description: 'AI-generated product launch video' }
      },
      {
        id: 'mock-2',
        user_id: userId,
        title: 'Company Logo Design',
        type: 'logo',
        status: 'completed',
        thumbnail_url: '/placeholder.svg',
        created_at: new Date(now.getTime() - 172800000).toISOString(),
        updated_at: new Date(now.getTime() - 172800000).toISOString(),
        metadata: { style: 'modern', colors: ['#3B82F6', '#1E40AF'] }
      },
      {
        id: 'mock-3',
        user_id: userId,
        title: 'Social Media Campaign',
        type: 'ad',
        status: 'processing',
        created_at: new Date(now.getTime() - 259200000).toISOString(),
        updated_at: new Date(now.getTime() - 259200000).toISOString(),
        metadata: { platform: 'facebook', variations: 3 }
      },
      {
        id: 'mock-4',
        user_id: userId,
        title: 'Social Post: Instagram - Product Launch',
        type: 'social',
        status: 'completed',
        thumbnail_url: '/placeholder.svg',
        created_at: new Date(now.getTime() - 43200000).toISOString(),
        updated_at: new Date(now.getTime() - 43200000).toISOString(),
        metadata: { platform: 'instagram', query: 'Product Launch' }
      },
      {
        id: 'mock-5',
        user_id: userId,
        title: 'Flyer: Tech Conference 2024',
        type: 'flyer',
        status: 'completed',
        thumbnail_url: '/placeholder.svg',
        created_at: new Date(now.getTime() - 100000000).toISOString(),
        updated_at: new Date(now.getTime() - 100000000).toISOString(),
        metadata: { headline: 'Tech Conference 2024', venue: 'Convention Center' }
      }
    ];
  }

  /**
   * Get mock activity for demo mode
   */
  private static getMockActivity(userId: string) {
    const now = new Date();
    return [
      {
        id: 'activity-1',
        user_id: userId,
        action: 'Created video',
        details: 'Generated AI video: Product Launch Video',
        created_at: new Date(now.getTime() - 86400000).toISOString()
      },
      {
        id: 'activity-2',
        user_id: userId,
        action: 'Created logo',
        details: 'Designed logo: Company Logo Design',
        created_at: new Date(now.getTime() - 172800000).toISOString()
      },
      {
        id: 'activity-3',
        user_id: userId,
        action: 'Started ad campaign',
        details: 'Created ad campaign: Social Media Campaign',
        created_at: new Date(now.getTime() - 259200000).toISOString()
      },
      {
        id: 'activity-4',
        user_id: userId,
        action: 'Logged in',
        details: 'User logged into the platform',
        created_at: new Date(now.getTime() - 345600000).toISOString()
      }
    ];
  }
}
