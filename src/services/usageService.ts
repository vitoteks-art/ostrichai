import { apiClient } from '../lib/api';

export interface UsageMetrics {
  featureType: string;
  usageCount: number;
  metadata?: Record<string, any>;
}

export interface UsageRecord {
  id?: string;
  user_id: string;
  subscription_id?: string;
  feature_type: string;
  usage_count: number;
  usage_date: string;
  usage_metadata: Record<string, any>;
  created_at?: string;
}

export class UsageService {
  /**
   * Record usage metrics for a user
   */
  static async recordUsage(userId: string, metrics: UsageMetrics, subscriptionId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.trackUsage(metrics.featureType, metrics.usageCount, metrics.metadata);
      return { success: true, data: response };
    } catch (error: any) {
      console.warn('Error recording usage:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Record scraping usage with comprehensive metrics
   */
  static async recordScrapingUsage(
    userId: string,
    scrapingResults: any[],
    config: any,
    duration: number,
    success: boolean,
    errorMessage?: string,
    subscriptionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Calculate comprehensive metrics
      const businessCount = scrapingResults.length;
      const categoriesFound = [...new Set(scrapingResults.map(r => r.category))].length;
      const businessesWithContactInfo = scrapingResults.filter(r => r.phone || r.email || r.website).length;
      const averageRating = scrapingResults.filter(r => r.rating).length > 0
        ? scrapingResults.filter(r => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) / scrapingResults.filter(r => r.rating).length
        : 0;

      // Record main scraping usage
      const metadata = {
        businessCount,
        categoriesFound,
        businessesWithContactInfo,
        averageRating: Math.round(averageRating * 100) / 100,
        duration,
        success,
        searchTerms: config.searchTerms,
        locationQuery: config.locationQuery,
        searchLimit: config.searchLimit,
        errorMessage: errorMessage || null,
        timestamp: new Date().toISOString()
      };

      const mainUsageResult = await this.recordUsage(userId, {
        featureType: 'scraping',
        usageCount: 1,
        metadata
      }, subscriptionId);

      if (!mainUsageResult.success) {
        console.warn('Failed to record main scraping usage:', mainUsageResult.error);
      }

      // Record individual business records as usage (for detailed tracking)
      if (success && businessCount > 0) {
        const businessUsageResult = await this.recordUsage(userId, {
          featureType: 'scraping_business',
          usageCount: businessCount,
          metadata: {
            parentScrapingUsage: true,
            categories: scrapingResults.reduce((acc, result) => {
              acc[result.category] = (acc[result.category] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
            withContactInfo: businessesWithContactInfo,
            totalProcessed: businessCount,
            timestamp: new Date().toISOString()
          }
        }, subscriptionId);

        if (!businessUsageResult.success) {
          console.warn('Failed to record business usage:', businessUsageResult.error);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.warn('Error recording scraping usage:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user's usage statistics for a specific feature type
   */
  static async getUserUsageStats(userId: string, featureType?: string, days: number = 30): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const data = await apiClient.request(`/subscriptions/usage`);

      // Calculate aggregated statistics
      const stats = {
        totalUsage: data?.length || 0,
        totalCount: data?.reduce((sum: number, record: any) => sum + record.usage_count, 0) || 0,
        featureBreakdown: data?.reduce((acc: any, record: any) => {
          acc[record.feature_type] = (acc[record.feature_type] || 0) + record.usage_count;
          return acc;
        }, {} as Record<string, number>) || {},
        dailyUsage: data?.reduce((acc: any, record: any) => {
          const date = record.usage_date;
          acc[date] = (acc[date] || 0) + record.usage_count;
          return acc;
        }, {} as Record<string, number>) || {},
        recentActivity: data?.slice(0, 10) || []
      };

      return { success: true, data: stats };
    } catch (error: any) {
      console.warn('Error fetching usage stats:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user's scraping-specific usage statistics
   */
  static async getScrapingUsageStats(userId: string, days: number = 30): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const data = await apiClient.request(`/subscriptions/usage`);
      const scrapingData = data.filter((m: any) => m.feature_type === 'scraping');

      // Calculate scraping-specific statistics
      const scrapingStats = {
        totalScrapingSessions: scrapingData?.length || 0,
        totalBusinessesScraped: scrapingData?.reduce((sum: number, record: any) =>
          sum + (record.usage_metadata?.businessCount || 0), 0) || 0,
        successfulSessions: scrapingData?.filter((record: any) => record.usage_metadata?.success === true).length || 0,
        failedSessions: scrapingData?.filter((record: any) => record.usage_metadata?.success === false).length || 0,
        averageBusinessesPerSession: scrapingData?.length ? Math.round(
          (scrapingData.reduce((sum: number, record: any) => sum + (record.usage_metadata?.businessCount || 0), 0) / scrapingData.length) * 100
        ) / 100 : 0,
        averageDuration: scrapingData?.length ? Math.round(
          (scrapingData.reduce((sum: number, record: any) => sum + (record.usage_metadata?.duration || 0), 0) / scrapingData.length)
        ) : 0,
        categoriesScraped: scrapingData?.reduce((acc: any, record: any) => {
          const categories = record.usage_metadata?.categories || {};
          Object.keys(categories).forEach(category => {
            acc[category] = (acc[category] || 0) + categories[category];
          });
          return acc;
        }, {} as Record<string, number>) || {},
        recentSessions: scrapingData?.slice(0, 10).map((record: any) => ({
          date: record.usage_date,
          businessCount: record.usage_metadata?.businessCount || 0,
          duration: record.usage_metadata?.duration || 0,
          success: record.usage_metadata?.success || false,
          searchTerms: record.usage_metadata?.searchTerms || 'Unknown',
          locationQuery: record.usage_metadata?.locationQuery || 'Unknown'
        })) || []
      };

      return { success: true, data: scrapingStats };
    } catch (error: any) {
      console.warn('Error fetching scraping usage stats:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Update existing usage record (for incremental counting)
   */
  static async updateUsageRecord(recordId: string, additionalCount: number, additionalMetadata?: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
      // The current backend doesn't support direct updates easily by UUID yet via track-usage, 
      // but we can just track new usage. For now, we'll just track as new usage or skip if not critical.
      await apiClient.trackUsage('incremental_update', additionalCount, additionalMetadata);
      return { success: true };
    } catch (error: any) {
      console.warn('Error updating usage record:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }
}
