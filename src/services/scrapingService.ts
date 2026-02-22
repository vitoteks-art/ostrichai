import { toast } from 'sonner';
import { ProjectService, ProjectData } from './projectService';
import { UsageService } from './usageService';
import { SubscriptionService } from './subscriptionService';

export interface ScrapingConfig {
  // Basic search parameters
  locationQuery: string;
  searchTerms: string;
  searchLimit: number;
  maxImages: number;

  // Advanced options
  leadEnrichment: number;
  additionalContactProcessing: boolean;

  // Data collection options
  includeWebResults: boolean;
  skipClosedPlaces: boolean;
  scrapeContacts: boolean;
  scrapeDirectories: boolean;
  scrapeImageAuthors: boolean;
  scrapePlaceDetails: boolean;
  includeReviewsPersonalData: boolean;
  scrapeTableReservations: boolean;
}

export interface ScrapingResult {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  businessHours?: string[];
  category: string;
  description?: string;
  images: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  isOpen?: boolean;
  priceLevel?: number;
  reviews?: Array<{
    author: string;
    rating: number;
    text: string;
    date: string;
  }>;
  socialMediaLinks?: string[];
  competitors?: string[];
}

export interface ScrapingResponse {
  success: boolean;
  results?: ScrapingResult[];
  totalResults?: number;
  executionTime?: number;
  error?: string;
  isDemo?: boolean;
}

class ScrapingService {
  private readonly WEBHOOK_URL = 'https://n8n.getostrichai.com/webhook/web-scraping';

  /**
    * Perform Google Maps scraping with the provided configuration
    */
  async scrapeBusinesses(config: ScrapingConfig, userId?: string): Promise<ScrapingResponse> {
    let projectId: string | null = null;
    const startTime = Date.now();

    try {
      // Validate configuration
      this.validateConfig(config);

      // Check credit balance before proceeding (1 credit per place)
      if (userId) {
        const creditsNeeded = config.searchLimit; // 1 credit per place
        if (creditsNeeded > 0) {
          const creditCheck = await SubscriptionService.useCredits(userId, 'google_maps_scraping', creditsNeeded);

          if (!creditCheck.success) {
            let errorMsg = creditCheck.error || 'Failed to process credit deduction';
            if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
              errorMsg = 'Credit system error. Please try again later.';
            } else {
              // Get current subscription to provide specific balance info if available
              const subscriptionResult = await SubscriptionService.getUserSubscription(userId);
              const currentBalance = subscriptionResult.data?.credit_balance || 0;
              if (currentBalance < creditsNeeded) {
                errorMsg = `Insufficient credits for Google Maps scraping. You need ${creditsNeeded} credits (${config.searchLimit} places × 1 credit each) but only have ${currentBalance}. Please upgrade your plan or purchase additional credits.`;
              }
            }
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
          }

          toast.success(`✅ ${creditsNeeded} credits deducted for Google Maps scraping`);
        }
      }

      // Show loading toast
      toast.loading('Starting Google Maps scraping...', { id: 'scraping' });

      // Create project record if user is authenticated
      if (userId) {
        const projectTitle = `Scraping: ${config.searchTerms} in ${config.locationQuery}`;
        const projectResult = await ProjectService.createProject(userId, {
          title: projectTitle,
          type: 'scraping',
          status: 'processing',
          metadata: {
            scrapingConfig: config,
            startTime: new Date().toISOString(),
            searchTerms: config.searchTerms,
            locationQuery: config.locationQuery,
            searchLimit: config.searchLimit,
            webhookUrl: this.WEBHOOK_URL
          }
        });

        if (projectResult.success && projectResult.data) {
          projectId = projectResult.data.id;
          console.log('✅ Scraping project created:', projectId);

          // Log scraping start activity
          await ProjectService.logActivity(userId, {
            action: 'Started scraping',
            details: `Started scraping for "${config.searchTerms}" in ${config.locationQuery}`,
            metadata: {
              category: 'creation',
              productType: 'scraping',
              projectId,
              searchTerms: config.searchTerms,
              locationQuery: config.locationQuery
            }
          });
        } else {
          console.warn('❌ Failed to create scraping project:', projectResult);
          // Try to create a mock project for demo mode
          projectId = `scraping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          console.log('📝 Using mock project ID:', projectId);
        }
      }

      // Prepare request payload
      const payload = {
        ...config,
        userId: userId || null,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      // Make API request to webhook
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawResults = await response.json();

      // Handle case where webhook returns error response
      if (!Array.isArray(rawResults)) {
        if (rawResults.error) {
          throw new Error(rawResults.error);
        }
        throw new Error('Invalid response format from scraping service');
      }

      // Transform webhook response to expected format using dynamic field mapping
      const results: ScrapingResult[] = rawResults.map((item: any) => {
        // Dynamic field mapping with fallbacks
        const fieldMappings = {
          // ID fields
          id: ['id', 'place_id', 'business_id', '_id'],

          // Name fields
          name: ['title', 'name', 'business_name', 'establishment'],

          // Address fields
          address: ['address', 'full_address', 'street_address'],

          // Contact fields
          phone: ['phone', 'phone_number', 'telephone', 'contact_phone'],
          email: ['email', 'company_email', 'business_email', 'contact_email'],
          website: ['website', 'url', 'web_url', 'homepage'],

          // Rating fields
          rating: ['total_score', 'rating', 'average_rating', 'score'],
          reviewCount: ['reviews_count', 'review_count', 'reviews', 'total_reviews'],

          // Business details
          businessHours: ['opening_hours', 'hours', 'business_hours', 'operating_hours'],
          category: ['category_name', 'category', 'business_type', 'type'],

          // Categories array
          categories: ['categories', 'category_list', 'business_categories', 'tags'],

          // Location fields
          latitude: ['latitude', 'lat', 'y', 'coord_lat'],
          longitude: ['longitude', 'lng', 'lon', 'x', 'coord_lng'],

          // City and location details
          city: ['city', 'town', 'locality'],
          state: ['state', 'province', 'region'],
          postalCode: ['postal_code', 'zip_code', 'zip']
        };

        // Helper function to find value from multiple possible field names
        const findField = (fieldNames: string[], defaultValue: any = undefined): any => {
          for (const fieldName of fieldNames) {
            if (item[fieldName] != null) {
              return item[fieldName];
            }
          }
          return defaultValue;
        };

        // Extract values using dynamic mapping
        const id = findField(fieldMappings.id, `business_${Math.random().toString(36).substr(2, 9)}`);
        const name = findField(fieldMappings.name, 'Unknown Business');
        const address = findField(fieldMappings.address, '');

        // Build full address if not provided directly
        let fullAddress = address;
        if (!fullAddress) {
          const city = findField(fieldMappings.city);
          const state = findField(fieldMappings.state);
          const postalCode = findField(fieldMappings.postalCode);
          const addressParts = [city, state, postalCode].filter(Boolean);
          fullAddress = addressParts.join(', ');
        }

        const phone = findField(fieldMappings.phone);
        const email = findField(fieldMappings.email);
        const website = findField(fieldMappings.website);
        const rating = findField(fieldMappings.rating);
        const reviewCount = findField(fieldMappings.reviewCount);
        const businessHours = findField(fieldMappings.businessHours, []);
        const category = findField(fieldMappings.category, 'Business');

        // Handle categories array for description
        const categories = findField(fieldMappings.categories, []);
        const description = Array.isArray(categories) && categories.length > 0
          ? categories.join(', ')
          : '';

        // Handle coordinates
        const lat = findField(fieldMappings.latitude);
        const lng = findField(fieldMappings.longitude);
        const coordinates = (typeof lat === 'number' && typeof lng === 'number') ? {
          lat,
          lng
        } : undefined;

        return {
          id,
          name,
          address: fullAddress,
          phone,
          email,
          website,
          rating: typeof rating === 'number' ? rating : undefined,
          reviewCount: typeof reviewCount === 'number' ? reviewCount : undefined,
          businessHours: Array.isArray(businessHours) ? businessHours : [],
          category,
          description,
          images: [], // Webhook doesn't provide images in current format
          coordinates,
          isOpen: undefined, // Would need additional logic to determine
          priceLevel: undefined, // Not provided in webhook response
          reviews: [], // Not provided in webhook response
          socialMediaLinks: [], // Not provided in webhook response
          competitors: [] // Not provided in webhook response
        };
      });

      const data: ScrapingResponse = {
        success: true,
        results,
        totalResults: results.length,
        executionTime: Date.now() - startTime,
        isDemo: false
      };

      // Update project with success
      if (projectId && userId) {
        const projectUpdateData: Partial<ProjectData> = {
          status: 'completed' as const,
          file_url: `scraping-results-${projectId}.${Date.now()}`,
          metadata: {
            scrapingResults: results,
            webhookResponse: rawResults,
            endTime: new Date().toISOString(),
            duration: Date.now() - startTime,
            businessCount: results.length,
            executionTime: Date.now() - startTime,
            totalResults: results.length,
            success: true,
            // Include original scraping config for reference
            scrapingConfig: config,
            // Add project metadata for proper tracking
            projectType: 'scraping',
            completedAt: new Date().toISOString(),
            // Statistics for dashboard
            stats: {
              totalBusinesses: results.length,
              totalImages: results.reduce((sum, r) => sum + r.images.length, 0),
              categories: results.reduce((acc, r) => {
                acc[r.category] = (acc[r.category] || 0) + 1;
                return acc;
              }, {} as Record<string, number>),
              withContactInfo: results.filter(r => r.phone || r.email || r.website).length,
              averageRating: results.filter(r => r.rating).length > 0
                ? results.filter(r => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) / results.filter(r => r.rating).length
                : 0
            }
          }
        };

        const updateResult = await ProjectService.updateProject(projectId, projectUpdateData);
        console.log('✅ Project updated with success:', updateResult.success);

        // Record usage metrics in user_usage table
        await UsageService.recordScrapingUsage(
          userId,
          results,
          config,
          Date.now() - startTime,
          true, // success
          undefined, // no error
          undefined // subscriptionId - could be added later if needed
        );

        // Log successful completion
        await ProjectService.logProductCompletion(
          userId,
          'scraping',
          `Scraping: ${config.searchTerms}`,
          projectId,
          Date.now() - startTime
        );
      }

      // Dismiss loading toast
      toast.dismiss('scraping');

      toast.success(`Successfully scraped ${results.length} businesses`);
      return data;

    } catch (error) {
      toast.dismiss('scraping');

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Update project with failure if it was created
      if (projectId && userId) {
        const errorUpdateData = {
          status: 'failed' as const,
          metadata: {
            error: errorMessage,
            endTime: new Date().toISOString(),
            duration: Date.now() - startTime,
            failedAt: new Date().toISOString(),
            projectType: 'scraping',
            success: false,
            scrapingConfig: config
          }
        };

        const errorUpdateResult = await ProjectService.updateProject(projectId, errorUpdateData);
        console.log('❌ Project updated with failure:', errorUpdateResult.success);

        // Record failed usage metrics in user_usage table
        await UsageService.recordScrapingUsage(
          userId,
          [], // no results for failed scraping
          config,
          Date.now() - startTime,
          false, // failure
          errorMessage,
          undefined // subscriptionId
        );

        // Log error activity
        await ProjectService.logProductError(
          userId,
          'scraping',
          errorMessage,
          projectId,
          {
            searchTerms: config.searchTerms,
            locationQuery: config.locationQuery,
            duration: Date.now() - startTime
          }
        );
      }

      toast.error(`Scraping failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate scraping configuration
   */
  private validateConfig(config: ScrapingConfig): void {
    if (!config.locationQuery?.trim()) {
      throw new Error('Location query is required');
    }

    if (!config.searchTerms?.trim()) {
      throw new Error('Search terms are required');
    }

    if (config.searchLimit < 1 || config.searchLimit > 1000) {
      throw new Error('Search limit must be between 1 and 1000');
    }

    if (config.maxImages < 1 || config.maxImages > 20) {
      throw new Error('Max images must be between 1 and 20');
    }

    if (config.leadEnrichment < 0 || config.leadEnrichment > 10) {
      throw new Error('Lead enrichment level must be between 0 and 10');
    }
  }

  /**
   * Get scraping statistics
   */
  getScrapingStats(results: ScrapingResult[]): {
    totalBusinesses: number;
    totalImages: number;
    averageRating: number;
    categories: Record<string, number>;
    withContactInfo: number;
    withReviews: number;
  } {
    const totalBusinesses = results.length;
    const totalImages = results.reduce((sum, result) => sum + result.images.length, 0);
    const averageRating = results.filter(r => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) / Math.max(1, results.filter(r => r.rating).length);

    const categories: Record<string, number> = {};
    results.forEach(result => {
      categories[result.category] = (categories[result.category] || 0) + 1;
    });

    const withContactInfo = results.filter(r => r.phone || r.email || r.website).length;
    const withReviews = results.filter(r => r.reviews && r.reviews.length > 0).length;

    return {
      totalBusinesses,
      totalImages,
      averageRating: Math.round(averageRating * 100) / 100,
      categories,
      withContactInfo,
      withReviews,
    };
  }

  /**
   * Filter results based on criteria
   */
  filterResults(results: ScrapingResult[], filters: {
    minRating?: number;
    hasContactInfo?: boolean;
    hasImages?: boolean;
    categories?: string[];
  }): ScrapingResult[] {
    return results.filter(result => {
      if (filters.minRating && (result.rating || 0) < filters.minRating) {
        return false;
      }

      if (filters.hasContactInfo && !result.phone && !result.email && !result.website) {
        return false;
      }

      if (filters.hasImages && (!result.images || result.images.length === 0)) {
        return false;
      }

      if (filters.categories && filters.categories.length > 0 && !filters.categories.includes(result.category)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Export results to different formats
   */
  exportResults(results: ScrapingResult[], format: 'json' | 'csv' | 'xlsx'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2);

      case 'csv':
        const headers = [
          'Name', 'Address', 'Phone', 'Email', 'Website', 'Rating',
          'Review Count', 'Category', 'Description', 'Latitude', 'Longitude',
          'Business Hours', 'Is Open', 'Price Level', 'Image Count', 'CC', 'BCC'
        ];

        const csvRows = results.map(result => [
          result.name,
          result.address,
          result.phone || '',
          result.email || '',
          result.website || '',
          result.rating || '',
          result.reviewCount || '',
          result.category,
          result.description || '',
          result.coordinates?.lat || '',
          result.coordinates?.lng || '',
          (result.businessHours || []).join('; '),
          result.isOpen ? 'Yes' : 'No',
          result.priceLevel || '',
          result.images.length
        ]);

        return [headers, ...csvRows].map(row =>
          row.map(field => `"${field}"`).join(',')
        ).join('\n');

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate scraping report
   */
  generateReport(results: ScrapingResult[]): {
    summary: string;
    statistics: ReturnType<typeof this.getScrapingStats>;
    recommendations: string[];
  } {
    const stats = this.getScrapingStats(results);

    const summary = `Scraped ${stats.totalBusinesses} businesses with ${stats.totalImages} total images. ` +
      `Average rating: ${stats.averageRating}/5. ` +
      `${stats.withContactInfo} businesses have contact information.`;

    const recommendations = [];

    if (stats.averageRating < 3) {
      recommendations.push('Consider filtering for higher-rated businesses (3+ stars) for better lead quality.');
    }

    if (stats.withContactInfo / stats.totalBusinesses < 0.5) {
      recommendations.push('Enable additional contact processing for better contact information coverage.');
    }

    if (Object.keys(stats.categories).length < 3) {
      recommendations.push('Try broader search terms to capture more diverse business categories.');
    }

    return {
      summary,
      statistics: stats,
      recommendations,
    };
  }
}

// Export singleton instance
export const scrapingService = new ScrapingService();
export default scrapingService;
