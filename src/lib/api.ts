// API Client for FastAPI backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  public async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: headers as HeadersInit,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(email: string, password: string, fullName?: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  }

  async login(email: string, password: string) {
    // OAuth2PasswordRequestForm expects form data, not JSON
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await this.request('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async verifyEmail(email: string, code: string) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async getGoogleAuthUrl() {
    return this.request('/auth/google/url');
  }

  async exchangeGoogleCode(code: string, redirectUri: string) {
    const response = await this.request('/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async resendVerification(email: string) {
    return this.request(`/auth/resend-verification?email=${encodeURIComponent(email)}`, {
      method: 'POST',
    });
  }

  async requestPasswordReset(email: string) {
    return this.request('/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async confirmPasswordReset(email: string, code: string, newPassword: string) {
    return this.request('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ email, code, new_password: newPassword }),
    });
  }

  async recordSession(sessionToken: string) {
    return this.request('/auth/sessions/login', {
      method: 'POST',
      body: JSON.stringify({ session_token: sessionToken }),
    });
  }

  async logoutSession() {
    return this.request('/auth/sessions/logout', {
      method: 'POST',
    });
  }

  // User endpoints
  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(profileData: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getSettings() {
    return this.request('/users/settings');
  }

  async updateSettings(settingsData: any) {
    return this.request('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }

  // Subscription endpoints
  async getPlans() {
    return this.request('/subscriptions/plans');
  }

  async getMySubscription() {
    return this.request('/subscriptions/my-subscription');
  }

  async getCreditBalance() {
    return this.request('/subscriptions/credit-balance');
  }

  async trackUsage(featureType: string, amount: number = 1, metadata: any = {}) {
    return this.request('/subscriptions/track-usage', {
      method: 'POST',
      body: JSON.stringify({ feature_type: featureType, amount, metadata }),
    });
  }

  // Social Media endpoints
  async getSocialAccounts() {
    return this.request('/social/accounts');
  }

  async socialOAuthExchange(platform: string, code: string, redirectUri: string) {
    return this.request('/social/oauth/exchange', {
      method: 'POST',
      body: JSON.stringify({ platform, code, redirect_uri: redirectUri }),
    });
  }

  async createSocialAccount(accountData: any) {
    return this.request('/social/accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  }

  async deleteSocialAccount(accountId: string) {
    return this.request(`/social/accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  async getSocialPosts(skip: number = 0, limit: number = 50) {
    return this.request(`/social/posts?skip=${skip}&limit=${limit}`);
  }

  async createSocialPostRecord(postData: any) {
    return this.request('/social/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async publishSocialPost(publishData: any) {
    return this.request('/social/publish', {
      method: 'POST',
      body: JSON.stringify(publishData),
    });
  }

  async updateSocialPostStatus(postId: string, statusData: any) {
    // Note: Router uses status, platform_post_id, etc as params but for simplicity we could change it to JSON body if needed.
    // However, our router expects them as query params currently except for status? 
    // Wait, let's check the router implementation again.
    const urlParams = new URLSearchParams(statusData);
    return this.request(`/social/posts/${postId}?${urlParams.toString()}`, {
      method: 'PATCH',
    });
  }

  async scheduleSocialPost(postData: any) {
    return this.request('/social/scheduled', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async getScheduledPosts() {
    return this.request('/social/scheduled');
  }

  // Campaign endpoints
  async getAdAccounts() {
    return this.request('/campaigns/ad-accounts');
  }

  async createAdAccountRecord(accountData: any) {
    return this.request('/campaigns/ad-accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  }

  async getCampaigns(skip: number = 0, limit: number = 50) {
    return this.request(`/campaigns/campaigns?skip=${skip}&limit=${limit}`);
  }

  async createCampaignRecord(campaignData: any) {
    return this.request('/campaigns/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData),
    });
  }

  async updateCampaignStatus(campaignId: string, updateData: any) {
    return this.request(`/campaigns/campaigns/${campaignId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  // Payment Transaction endpoints
  async recordPaymentTransaction(transactionData: any) {
    return this.request('/payments/transaction/record', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async updatePaymentTransaction(reference: string, updateData: any) {
    return this.request(`/payments/transaction/update/${reference}`, {
      method: 'POST',
      body: JSON.stringify(updateData),
    });
  }

  // Booking endpoints
  async getMeetingTypes() {
    return this.request('/bookings/meeting-types');
  }

  async createMeetingType(data: any) {
    return this.request('/bookings/meeting-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMeetingType(id: string, data: any) {
    return this.request(`/bookings/meeting-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMeetingType(id: string) {
    return this.request(`/bookings/meeting-types/${id}`, {
      method: 'DELETE',
    });
  }

  async getAppointments() {
    return this.request('/bookings/appointments');
  }

  async createAppointment(data: any) {
    return this.request('/bookings/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAppointment(id: string, data: any) {
    return this.request(`/bookings/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAppointment(id: string) {
    return this.request(`/bookings/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  async getAvailability() {
    return this.request('/bookings/availability');
  }

  async updateAvailability(data: any[]) {
    return this.request('/bookings/availability', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBookingSettings() {
    return this.request('/bookings/settings');
  }

  async updateBookingSettings(data: any) {
    return this.request('/bookings/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Email endpoints
  async getEmailTemplates() {
    return this.request('/emails/templates');
  }

  async getEmailTemplate(id: string) {
    return this.request(`/emails/templates/${id}`);
  }

  async createEmailTemplate(data: any) {
    return this.request('/emails/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmailTemplate(id: string, data: any) {
    return this.request(`/emails/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmailTemplate(id: string) {
    return this.request(`/emails/templates/${id}`, {
      method: 'DELETE',
    });
  }

  async getEmailCampaigns() {
    return this.request('/emails/campaigns');
  }

  async getEmailCampaign(id: string) {
    return this.request(`/emails/campaigns/${id}`);
  }

  async createEmailCampaign(data: any) {
    return this.request('/emails/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmailCampaignStatus(id: string, status: string, stats?: any) {
    return this.request(`/emails/campaigns/${id}/status?status=${status}`, {
      method: 'PATCH',
      body: stats ? JSON.stringify(stats) : undefined,
    });
  }

  async logEmailSend(data: any) {
    return this.request('/emails/sends', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmailSendStatus(id: string, statusData: any) {
    const { status, ...rest } = statusData;
    const urlParams = new URLSearchParams({ status, ...rest });
    return this.request(`/emails/sends/${id}/status?${urlParams.toString()}`, {
      method: 'PATCH',
    });
  }

  async createEmailLog(data: any) {
    return this.request('/emails/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendEmail(data: { to: string; subject: string; html: string; text?: string; type?: string }) {
    return this.request('/emails/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Referral endpoints
  async getReferralCampaigns(status?: string) {
    return this.request(`/referrals/campaigns${status ? `?status=${status}` : ''}`);
  }

  async createReferralCampaign(data: any) {
    return this.request('/referrals/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReferralCampaign(id: string, data: any) {
    return this.request(`/referrals/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteReferralCampaign(id: string) {
    return this.request(`/referrals/campaigns/${id}`, {
      method: 'DELETE',
    });
  }

  async getReferralStats(campaignId?: string) {
    return this.request(`/referrals/stats${campaignId ? `?campaign_id=${campaignId}` : ''}`);
  }

  async redeemReferralReward(data: any) {
    return this.request('/referrals/redeem', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReferralLink(campaignId: string) {
    return this.request(`/referrals/link?campaign_id=${campaignId}`);
  }

  async trackReferralClick(data: any) {
    return this.request('/referrals/click', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async recordReferralConversion(data: any) {
    return this.request('/referrals/conversion', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReferralLeaderboard(limit: number = 10) {
    return this.request(`/referrals/leaderboard?limit=${limit}`);
  }

  async getReferralAnalytics(campaignId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString();
    return this.request(`/referrals/campaigns/${campaignId}/analytics${query ? `?${query}` : ''}`);
  }

  async processReferralConversions() {
    return this.request('/referrals/process-conversions', {
      method: 'POST',
    });
  }

  async submitReferralForm(data: any) {
    return this.request('/referrals/form-submission', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReferralSubmissions(campaignId: string, page: number = 1, limit: number = 20, status?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append('status', status);
    return this.request(`/referrals/campaigns/${campaignId}/submissions?${params.toString()}`);
  }

  async updateReferralSubmission(campaignId: string, submissionId: string, data: any) {
    return this.request(`/referrals/campaigns/${campaignId}/submissions/${submissionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
