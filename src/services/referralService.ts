import { apiClient } from '../lib/api';

// Types for referral system
export interface ReferralCampaign {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  start_date: string;
  end_date?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  reward_config: {
    points_per_referral: number;
    points_per_conversion: number;
    tier_rewards: {
      bronze: { min_points: number; reward: string };
      silver: { min_points: number; reward: string };
      gold: { min_points: number; reward: string };
    };
    max_referrals_per_user: number;
    conversion_window_days: number;
  };
  sharing_config: {
    platforms: string[];
    default_message: string;
    custom_tracking: boolean;
  };
  analytics: any;
  created_at: string;
  updated_at: string;
}

export interface ReferralLink {
  id: string;
  campaign_id: string;
  user_id: string;
  referral_code: string;
  short_url?: string;
  full_url: string;
  clicks_count: number;
  conversions_count: number;
  points_earned: number;
  status: 'active' | 'inactive' | 'expired';
  expires_at?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface ReferralClick {
  id: string;
  referral_link_id: string;
  campaign_id: string;
  referrer_id: string;
  clicked_by_ip?: string;
  clicked_by_user_agent?: string;
  clicked_by_fingerprint?: string;
  referrer_url?: string;
  device_info: any;
  metadata: any;
  created_at: string;
}

export interface ReferralConversion {
  id: string;
  referral_link_id: string;
  campaign_id: string;
  referrer_id: string;
  converted_user_id: string;
  conversion_type: 'signup' | 'subscription' | 'purchase';
  points_awarded: number;
  reward_tier?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  conversion_value?: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface UserPoints {
  id: string;
  user_id: string;
  campaign_id?: string;
  total_points: number;
  available_points: number;
  points_used: number;
  current_tier: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
  lifetime_earned: number;
  last_activity_at: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  user_id: string;
  campaign_id?: string;
  reward_type: 'credits' | 'discount' | 'free_month' | 'free_year' | 'custom';
  reward_value: string;
  points_spent: number;
  status: 'pending' | 'approved' | 'fulfilled' | 'rejected';
  fulfilled_at?: string;
  fulfilled_by?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface ReferralFormSubmission {
  id: string;
  campaign_id: string;
  referral_code?: string;
  referrer_id?: string;
  email: string;
  full_name?: string;
  company?: string;
  phone?: string;
  website?: string;
  message?: string;
  form_type: 'signup' | 'lead_capture';
  form_config?: any;
  ip_address?: string;
  user_agent?: string;
  referrer_url?: string;
  device_info?: any;
  fingerprint?: string;
  status: 'pending' | 'processed' | 'duplicate' | 'spam' | 'invalid';
  processed_at?: string;
  processed_by?: string;
  consent_given: boolean;
  consent_timestamp?: string;
  data_retention_until?: string;
  metadata?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralAnalytics {
  id: string;
  campaign_id: string;
  date: string;
  total_clicks: number;
  total_conversions: number;
  total_points_awarded: number;
  viral_coefficient: number;
  top_referrer_id?: string;
  top_referrer_clicks: number;
  new_users_acquired: number;
  revenue_generated: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}


export interface ReferralEarningsSummary {
  total_clicks: number;
  total_signups: number;
  total_qualified: number;
  earned_cents: number;
  pending_cents: number;
  available_cents: number;
  currency: string;
}

export interface ReferralEarningsReferralItem {
  referred_user_id: string;
  referred_email?: string | null;
  signup_date: string;
  status: string;
  amount_cents?: number | null;
}

export interface ReferralRewardItem {
  id: string;
  referred_email?: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface ReferralWithdrawalItem {
  id: string;
  amount_cents: number;
  currency: string;
  method: string;
  status: string;
  kyc_status: string;
  created_at: string;
}

export interface KycStatusResponse {
  status: string;
  provider?: string | null;
  metadata?: Record<string, any> | null;
}

export class ReferralService {
  /**
   * Create a new referral campaign via API
   */
  static async createCampaign(
    userId: string,
    campaignData: {
      name: string;
      description?: string;
      start_date?: string;
      end_date?: string;
      reward_config?: any;
      sharing_config?: any;
    }
  ): Promise<{ success: boolean; data?: ReferralCampaign; error?: string }> {
    try {
      const data = await apiClient.createReferralCampaign({
        name: campaignData.name,
        description: campaignData.description,
        start_date: campaignData.start_date,
        end_date: campaignData.end_date,
        reward_config: campaignData.reward_config,
        sharing_config: campaignData.sharing_config
      });
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error creating campaign:', error);
      return { success: false, error: error.message || 'Failed to create campaign' };
    }
  }

  /**
   * Get user's referral campaigns via API
   */
  static async getUserCampaigns(
    userId: string,
    status?: string
  ): Promise<{ success: boolean; data?: ReferralCampaign[]; error?: string }> {
    try {
      const data = await apiClient.getReferralCampaigns(status);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Error fetching campaigns:', error);
      return { success: false, error: 'Failed to fetch campaigns' };
    }
  }

  /**
   * Update a referral campaign via API
   */
  static async updateCampaign(
    campaignId: string,
    userId: string,
    updates: Partial<ReferralCampaign>
  ): Promise<{ success: boolean; data?: ReferralCampaign; error?: string }> {
    try {
      const data = await apiClient.updateReferralCampaign(campaignId, updates);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error updating campaign:', error);
      return { success: false, error: 'Failed to update campaign' };
    }
  }

  /**
   * Get active campaign via API
   */
  static async getActiveCampaign(): Promise<{ success: boolean; data?: ReferralCampaign; error?: string }> {
    try {
      const campaigns = await apiClient.getReferralCampaigns('active');
      const activeCampaign = campaigns && campaigns.length > 0 ? campaigns[0] : null;

      if (activeCampaign) {
        return { success: true, data: activeCampaign };
      }
      return { success: false, error: 'No active campaign found' };
    } catch (error) {
      console.error('❌ Error fetching active campaign:', error);
      return { success: false, error: 'Failed to fetch active campaign' };
    }
  }

  /**
   * Get user's referral statistics via API
   */
  static async getUserReferralStats(
    userId: string,
    campaignId?: string
  ): Promise<{
    success: boolean; data?: {
      totalClicks: number;
      totalConversions: number;
      totalPoints: number;
      availablePoints: number;
      currentTier: string;
      links: ReferralLink[];
      conversions: ReferralConversion[];
    }; error?: string
  }> {
    try {
      const stats = await apiClient.getReferralStats(campaignId);
      return { success: true, data: stats };
    } catch (error) {
      console.error('❌ Error getting referral stats:', error);
      return { success: false, error: 'Failed to get referral stats' };
    }
  }

  /**
   * Redeem a reward via API
   */
  static async redeemReward(
    userId: string,
    campaignId: string,
    rewardType: string,
    pointsRequired: number
  ): Promise<{ success: boolean; data?: RewardRedemption; error?: string }> {
    try {
      const redemption = await apiClient.redeemReferralReward({
        campaign_id: campaignId,
        reward_type: rewardType,
        points_spent: pointsRequired
      });
      return { success: true, data: redemption };
    } catch (error: any) {
      console.error('❌ Error redeeming reward:', error);
      return { success: false, error: error.message || 'Failed to redeem reward' };
    }
  }

  /**
   * Delete a referral campaign via API
   */
  static async deleteCampaign(
    campaignId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.deleteReferralCampaign(campaignId);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error deleting campaign:', error);
      return { success: false, error: error.message || 'Failed to delete campaign' };
    }
  }

  /**
   * Generate or get referral link for a user and campaign via API
   */
  static async getOrCreateReferralLink(
    userId: string,
    campaignId: string
  ): Promise<{ success: boolean; data?: ReferralLink; error?: string }> {
    try {
      const link = await apiClient.getReferralLink(campaignId);
      return { success: true, data: link };
    } catch (error) {
      console.error('❌ Error getting/creating referral link:', error);
      return { success: false, error: 'Failed to manage referral link' };
    }
  }

  /**
   * Track a referral click via API
   */
  static async trackReferralClick(
    referralCode: string,
    campaignId: string,
    clickData: {
      ip?: string;
      userAgent?: string;
      fingerprint?: string;
      referrerUrl?: string;
      deviceInfo?: any;
    }
  ): Promise<{ success: boolean; data?: ReferralClick; error?: string }> {
    try {
      const result = await apiClient.trackReferralClick({
        referral_code: referralCode,
        campaign_id: campaignId,
        ip: clickData.ip,
        user_agent: clickData.userAgent,
        fingerprint: clickData.fingerprint,
        referrer_url: clickData.referrerUrl,
        device_info: clickData.deviceInfo
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Error tracking click:', error);
      return { success: false, error: 'Failed to track click' };
    }
  }

  /**
   * Record a referral conversion via API
   */
  static async recordConversion(
    referralLinkId: string,
    convertedUserId: string,
    conversionData: {
      type: 'signup' | 'subscription' | 'purchase';
      value?: number;
      metadata?: any;
    }
  ): Promise<{ success: boolean; data?: ReferralConversion; error?: string }> {
    try {
      const result = await apiClient.recordReferralConversion({
        referral_link_id: referralLinkId,
        converted_user_id: convertedUserId,
        type: conversionData.type,
        value: conversionData.value,
        metadata: conversionData.metadata
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Error recording conversion:', error);
      return { success: false, error: 'Failed to record conversion' };
    }
  }

  /**
   * Get campaign leaderboard via API
   */
  static async getCampaignLeaderboard(
    campaignId: string,
    limit: number = 10
  ): Promise<{
    success: boolean; data?: Array<{
      user_id: string;
      full_name?: string;
      avatar_url?: string;
      total_points: number;
      rank: number;
    }>; error?: string
  }> {
    try {
      const leaderboard = await apiClient.getReferralLeaderboard(limit);
      return { success: true, data: leaderboard };
    } catch (error) {
      console.error('❌ Error getting leaderboard:', error);
      return { success: false, error: 'Failed to get leaderboard' };
    }
  }

  /**
   * Get campaign analytics via API
   */
  static async getCampaignAnalytics(
    campaignId: string,
    userId: string,
    dateRange?: { start: string; end: string }
  ): Promise<{
    success: boolean; data?: {
      totalClicks: number;
      totalConversions: number;
      conversionRate: number;
      viralCoefficient: number;
      topReferrers: any[];
      dailyStats: any[];
      revenueGenerated: number;
    }; error?: string
  }> {
    try {
      const analyticsData = await apiClient.getReferralAnalytics(campaignId, dateRange?.start, dateRange?.end);
      return { success: true, data: analyticsData };
    } catch (error) {
      console.error('❌ Error getting analytics:', error);
      return { success: false, error: 'Failed to get analytics' };
    }
  }

  /**
   * Process pending conversions via API
   */
  static async processPendingConversions(): Promise<{ success: boolean; processedCount?: number; error?: string }> {
    try {
      const result = await apiClient.processReferralConversions();
      return { success: true, processedCount: result.processed_count };
    } catch (error) {
      console.error('❌ Error processing conversions:', error);
      return { success: false, error: 'Failed to process conversions' };
    }
  }

  /**
   * Submit a referral form via API
   */
  static async submitReferralForm(
    campaignId: string,
    referralCode: string | undefined,
    formData: {
      email: string;
      full_name?: string;
      company?: string;
      phone?: string;
      website?: string;
      message?: string;
    },
    formType: 'signup' | 'lead_capture',
    formConfig?: any,
    submissionData?: {
      ip?: string;
      userAgent?: string;
      referrerUrl?: string;
      deviceInfo?: any;
      fingerprint?: string;
      consentGiven?: boolean;
    }
  ): Promise<{ success: boolean; data?: ReferralFormSubmission; error?: string; isDuplicate?: boolean }> {
    try {
      const result = await apiClient.submitReferralForm({
        campaign_id: campaignId,
        referral_code: referralCode,
        email: formData.email,
        full_name: formData.full_name,
        company: formData.company,
        phone: formData.phone,
        website: formData.website,
        message: formData.message,
        form_type: formType,
        ip_address: submissionData?.ip,
        user_agent: submissionData?.userAgent,
        referrer_url: submissionData?.referrerUrl,
        device_info: submissionData?.deviceInfo,
        fingerprint: submissionData?.fingerprint,
        consent_given: submissionData?.consentGiven || false
      });

      return { success: true, data: result, isDuplicate: result.is_duplicate };
    } catch (error: any) {
      console.error('❌ Error submitting form:', error);
      return { success: false, error: error.message || 'Failed to submit form' };
    }
  }

  /**
   * Get form submissions for a campaign via API
   */
  static async getFormSubmissions(
    campaignId: string,
    userId: string,
    filters?: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      email?: string;
      formType?: string;
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ): Promise<{
    success: boolean; data?: {
      submissions: ReferralFormSubmission[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }; error?: string
  }> {
    try {
      const data = await apiClient.getReferralSubmissions(
        campaignId,
        pagination?.page,
        pagination?.limit,
        filters?.status
      );
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error getting submissions:', error);
      return { success: false, error: error.message || 'Failed to get submissions' };
    }
  }

  /**
   * Update submission status via API
   */
  static async updateSubmissionStatus(
    submissionId: string,
    campaignId: string,
    userId: string,
    status: string,
    notes?: string
  ): Promise<{ success: boolean; data?: ReferralFormSubmission; error?: string }> {
    try {
      const data = await apiClient.updateReferralSubmission(campaignId, submissionId, { status, notes });
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error updating submission:', error);
      return { success: false, error: error.message || 'Failed to update submission' };
    }
  }

  /**
   * Export submissions to CSV
   */
  static async exportSubmissionsToCSV(
    campaignId: string,
    userId: string,
    filters?: any
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const result = await this.getFormSubmissions(campaignId, userId, filters, { page: 1, limit: 10000 });
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to fetch submissions' };
      }

      const submissions = result.data.submissions;

      // CSV headers
      const headers = [
        'Date',
        'Name',
        'Email',
        'Phone',
        'Company',
        'Type',
        'Status',
        'Referrer Code'
      ];

      // CSV content
      const rows = submissions.map(sub => [
        new Date(sub.created_at).toLocaleDateString(),
        sub.full_name || '',
        sub.email,
        sub.phone || '',
        sub.company || '',
        sub.form_type,
        sub.status,
        sub.referral_code || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      return { success: true, data: csvContent };
    } catch (error: any) {
      console.error('❌ Error exporting to CSV:', error);
      return { success: false, error: error.message || 'Failed to export CSV' };
    }
  }

  /**
   * Delete expired submissions via API
   */
  static async cleanupExpiredSubmissions(adminId: string): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const result = await apiClient.request('/referrals/cleanup-submissions', { method: 'POST' });
      return { success: true, deletedCount: result.deleted_count };
    } catch (error: any) {
      console.error('❌ Error cleaning up submissions:', error);
      return { success: false, error: error.message || 'Failed to cleanup submissions' };
    }
  }

  /**
   * Referral earnings summary
   */
  static async getEarningsSummary(): Promise<{ success: boolean; data?: ReferralEarningsSummary; error?: string }> {
    try {
      const data = await apiClient.getReferralEarningsSummary();
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error getting earnings summary:', error);
      return { success: false, error: error.message || 'Failed to get earnings summary' };
    }
  }

  static async getEarningsReferrals(): Promise<{ success: boolean; data?: ReferralEarningsReferralItem[]; error?: string }> {
    try {
      const data = await apiClient.getReferralEarningsReferrals();
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error getting referrals list:', error);
      return { success: false, error: error.message || 'Failed to get referrals list' };
    }
  }

  static async getEarningsRewards(): Promise<{ success: boolean; data?: ReferralRewardItem[]; error?: string }> {
    try {
      const data = await apiClient.getReferralEarningsRewards();
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error getting rewards:', error);
      return { success: false, error: error.message || 'Failed to get rewards' };
    }
  }

  static async getEarningsWithdrawals(): Promise<{ success: boolean; data?: ReferralWithdrawalItem[]; error?: string }> {
    try {
      const data = await apiClient.getReferralEarningsWithdrawals();
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error getting withdrawals:', error);
      return { success: false, error: error.message || 'Failed to get withdrawals' };
    }
  }

  static async requestWithdrawal(payload: { amount_cents: number; method: string; payout_details: Record<string, any> }): Promise<{ success: boolean; data?: ReferralWithdrawalItem; error?: string }> {
    try {
      const data = await apiClient.requestReferralWithdrawal(payload);
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error requesting withdrawal:', error);
      return { success: false, error: error.message || 'Failed to request withdrawal' };
    }
  }

  static async redeemCredits(amount_cents: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const data = await apiClient.redeemReferralCredits({ amount_cents });
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error redeeming credits:', error);
      return { success: false, error: error.message || 'Failed to redeem credits' };
    }
  }

  static async getKycStatus(): Promise<{ success: boolean; data?: KycStatusResponse; error?: string }> {
    try {
      const data = await apiClient.getReferralKycStatus();
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error getting KYC status:', error);
      return { success: false, error: error.message || 'Failed to get KYC status' };
    }
  }

  static async startKyc(payload: { provider?: string; metadata?: Record<string, any> }): Promise<{ success: boolean; data?: KycStatusResponse; error?: string }> {
    try {
      const data = await apiClient.startReferralKyc(payload);
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error starting KYC:', error);
      return { success: false, error: error.message || 'Failed to start KYC' };
    }
  }

}
