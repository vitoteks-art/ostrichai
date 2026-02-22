import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { ProjectService, ProjectData, ActivityData, ProjectStats, WebhookResponseData } from '../services/projectService';
import { toast } from 'sonner';

export interface Project {
  id: string;
  user_id: string;
  title: string;
  type: 'video' | 'logo' | 'ad' | 'flyer' | 'scraping' | 'image_edit' | 'social_post' | 'seo_audit';
  status: 'draft' | 'processing' | 'completed' | 'failed';
  thumbnail_url?: string;
  file_url?: string;
  project_metadata?: Record<string, any>;
  metadata?: Record<string, any>; // For backward compatibility with older data
  created_at: string;
  updated_at?: string;
}

export interface Activity {
  id: string;
  user_id: string;
  action: string;
  details?: string;
  activity_metadata?: Record<string, any>;
  metadata?: Record<string, any>; // For backward compatibility
  created_at: string;
}

export const useProjects = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [mutationLoading, setMutationLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const { data: combinedData, isLoading: projectsLoading } = useQuery({
    queryKey: ['dashboardData', user?.id],
    queryFn: async () => {
      const token = session?.access_token;
      const [dashboardResult, statsResult] = await Promise.all([
        ProjectService.getUserDashboardData(user!.id, token),
        ProjectService.getActivityStats(user!.id, token)
      ]);

      return {
        dashboard: dashboardResult.success ? dashboardResult.data : { projects: [], activities: [], stats: null },
        activityStats: statsResult.success ? statsResult.data : null
      };
    },
    enabled: !!user,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const projects = combinedData?.dashboard?.projects || [];
  const activities = combinedData?.dashboard?.activities || [];
  const stats = combinedData?.dashboard?.stats || {
    totalProjects: 0,
    videosCreated: 0,
    logosGenerated: 0,
    adsCreated: 0,
    flyersCreated: 0,
    socialPostsCreated: 0,
    imagesEdited: 0,
    scrapingProjects: 0,
    storageUsed: 0,
    storageLimit: 1000
  };
  const activityStats = combinedData?.activityStats || null;
  const activityStatsLoading = projectsLoading;

  /**
   * Create a new project and log the activity
   */
  const createProject = useCallback(async (projectData: ProjectData) => {
    if (!user) {
      toast.error('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    setMutationLoading(true);
    try {
      const token = session?.access_token;
      const result = await ProjectService.createProject(user.id, projectData, token);

      if (result.success) {
        // Log activity
        await ProjectService.logActivity(user.id, {
          action: `Created ${projectData.type}`,
          details: `Created new ${projectData.type}: ${projectData.title}`
        }, session?.access_token);

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['dashboardData', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['projectsList', user?.id] });

        const message = result.isDemo
          ? `${projectData.type} project created (demo mode)!`
          : `${projectData.type} project created successfully!`;
        toast.success(message);

        return { success: true, data: result.data, isDemo: result.isDemo };
      } else {
        toast.error('Failed to create project');
        return { success: false, error: 'Failed to create project' };
      }
    } catch (error) {
      console.error('Error in createProject:', error);
      toast.error('An error occurred while creating the project');
      return { success: false, error: 'An error occurred while creating the project' };
    } finally {
      setMutationLoading(false);
    }
  }, [user, queryClient, session]);

  /**
   * Update an existing project
   */
  const updateProject = useCallback(async (projectId: string, updates: Partial<ProjectData>) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const token = session?.access_token;
      const result = await ProjectService.updateProject(projectId, updates, token);

      if (result.success) {
        // Log activity if status changed to completed
        if (updates.status === 'completed') {
          const project = projects.find(p => p.id === projectId);
          if (project) {
            await ProjectService.logActivity(user.id, {
              action: `Completed ${project.type}`,
              details: `Completed ${project.type}: ${project.title}`
            }, session?.access_token);
          }
        }

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['dashboardData', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['projectsList', user?.id] });

        const message = result.isDemo
          ? 'Project updated (demo mode)!'
          : 'Project updated successfully!';
        toast.success(message);

        return { success: true, data: result.data, isDemo: result.isDemo };
      }

      return result;
    } catch (error) {
      console.error('Error in updateProject:', error);
      return { success: false, error: 'An error occurred while updating the project' };
    }
  }, [user, projects, queryClient, session]);

  // ... (keeping other actions as they were but updating invalidation keys)

  /**
   * Log a custom activity
   */
  const logActivity = useCallback(async (activityData: ActivityData) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const token = session?.access_token;
      const result = await ProjectService.logActivity(user.id, activityData, token);

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['dashboardData', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['projectsList', user?.id] });
        return { success: true, isDemo: result.isDemo };
      }

      return result;
    } catch (error) {
      console.error('Error in logActivity:', error);
      return { success: false, error: 'An error occurred while logging activity' };
    }
  }, [user, queryClient, session]); // Added session to dependencies

  /**
   * Log product creation activity
   */
  const logProductCreation = useCallback(async (productType: string, productName: string, metadata?: Record<string, any>) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const token = session?.access_token;
      const result = await ProjectService.logProductCreation(user.id, productType, productName, metadata, token);

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['dashboardData', user?.id] });
        return { success: true, isDemo: result.isDemo };
      }

      return result;
    } catch (error) {
      console.error('Error in logProductCreation:', error);
      return { success: false, error: 'An error occurred while logging product creation' };
    }
  }, [user, queryClient, session]);

  /**
   * Log product completion activity
   */
  const logProductCompletion = useCallback(async (productType: string, productTitle: string, projectId?: string, duration?: number, metadata?: Record<string, any>) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const token = session?.access_token;
      const result = await ProjectService.logProductCompletion(user.id, productType, productTitle, projectId, duration, metadata, token);

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['dashboardData', user?.id] });
        return { success: true, isDemo: result.isDemo };
      }

      return result;
    } catch (error) {
      console.error('Error in logProductCompletion:', error);
      return { success: false, error: 'An error occurred while logging product completion' };
    }
  }, [user, queryClient, session]);

  /**
   * Log product error activity
   */
  const logProductError = useCallback(async (productType: string, errorMessage: string, projectId?: string, metadata?: Record<string, any>) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const token = session?.access_token;
      const result = await ProjectService.logProductError(user.id, productType, errorMessage, projectId, metadata, token);

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['dashboardData', user?.id] });
        return { success: true, isDemo: result.isDemo };
      }

      return result;
    } catch (error) {
      console.error('Error in logProductError:', error);
      return { success: false, error: 'An error occurred while logging product error' };
    }
  }, [user, queryClient, session]);

  /**
   * Get comprehensive activity statistics and state
   */
  // Now handled by useQuery above

  /**
   * Update project with webhook data
   */
  const updateProjectWithWebhookData = useCallback(async (projectId: string, webhookResponse: WebhookResponseData[], originalMetadata?: Record<string, any>) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const token = session?.access_token;
      const result = await ProjectService.updateProjectWithWebhookData(projectId, webhookResponse, originalMetadata, token);

      if (result.success) {
        // Refresh dashboard data
        queryClient.invalidateQueries({ queryKey: ['dashboardData', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['projectsList', user?.id] });

        // Log activity for webhook processing
        await logActivity({
          action: 'Webhook data processed',
          details: `Updated project with webhook response data.`
        });

        const message = result.isDemo
          ? 'Project updated with webhook data (demo mode)!'
          : 'Project updated with webhook data successfully!';
        toast.success(message);

        return { success: true, data: 'data' in result ? result.data : undefined, isDemo: result.isDemo };
      }

      return result;
    } catch (error) {
      console.error('Error in updateProjectWithWebhookData:', error);
      return { success: false, error: 'An error occurred while updating project with webhook data' };
    }
  }, [user, logActivity, queryClient, session]);

  /**
   * Delete a project
   */
  const deleteProject = useCallback(async (projectId: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const token = session?.access_token;
      const project = projects.find(p => p.id === projectId);
      const result = await ProjectService.deleteProject(projectId, token);

      if (result.success) {
        // Log activity
        if (project) {
          await ProjectService.logActivity(user.id, {
            action: `Deleted ${project.type}`,
            details: `Deleted ${project.type}: ${project.title}`
          }, token);
        }

        // Refresh dashboard data
        queryClient.invalidateQueries({ queryKey: ['dashboardData', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['projectsList', user?.id] });

        toast.success('Project deleted successfully!');

        return { success: true, isDemo: result.isDemo };
      }

      return result;
    } catch (error) {
      console.error('Error in deleteProject:', error);
      toast.error('An error occurred while deleting the project');
      return { success: false, error: 'An error occurred while deleting the project' };
    }
  }, [user, queryClient, projects, session]);


  /**
   * Get projects by type
   */
  const getProjectsByType = useCallback((type: Project['type']) => {
    return projects.filter(project => project.type === type);
  }, [projects]);

  /**
   * Get recent projects
   */
  const getRecentProjects = useCallback((limit = 5) => {
    return projects
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }, [projects]);

  /**
   * Get recent activities
   */
  const getRecentActivities = useCallback((limit = 10) => {
    return activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }, [activities]);

  /**
   * Manually fetch projects (refetch from server)
   */
  const fetchProjects = useCallback(async () => {
    if (!user) return;
    await queryClient.invalidateQueries({ queryKey: ['dashboardData', user.id] });
  }, [user, queryClient]);

  /**
   * Fetch a single project by ID (manual call)
   */
  const getProject = useCallback(async (projectId: string) => {
    const token = session?.access_token;
    const result = await ProjectService.getProjectById(projectId, token);
    return result;
  }, [session]);

  return {
    // Data
    projects,
    activities,
    stats,
    projectsLoading,
    loading: projectsLoading,
    mutationLoading,
    isDemo,
    activityStats,
    activityStatsLoading,

    // Actions
    createProject,
    updateProject,
    updateProjectWithWebhookData,
    deleteProject,
    logActivity,
    logProductCreation,
    logProductCompletion,
    logProductError,
    fetchProjects,
    getProject,

    // Utility functions
    getProjectsByType,
    getRecentProjects,
    getRecentActivities
  };
};

/**
 * Enhanced hook for the main Projects gallery with server-side pagination,
 * filtering, and sorting.
 */
export const useProjectsList = (params: {
  page: number;
  limit: number;
  searchTerm?: string;
  filterType?: string;
  sortBy?: string;
}) => {
  const { user, session } = useAuth();

  const query = useQuery({
    queryKey: ['projectsList', user?.id, params.page, params.searchTerm, params.filterType, params.sortBy],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const token = session?.access_token;
      const result = await ProjectService.getProjectsPaginated({
        userId: user.id,
        ...params
      }, token);

      if (!result.success) {
        throw new Error(result.error as string);
      }

      return result;
    },
    enabled: !!user,
    staleTime: 60000,
    placeholderData: (previousData) => previousData, // Smooth pagination
  });

  return {
    projects: query.data?.data || [],
    totalCount: query.data?.count || 0,
    totalPages: query.data?.totalPages || 0,
    loading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
};
