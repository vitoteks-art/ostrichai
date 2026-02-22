import { useState, useCallback } from 'react';
import { scrapingService, ScrapingConfig, ScrapingResult, ScrapingResponse } from '../services/scrapingService';
import { useAuth } from '../contexts/AuthContext';

export interface UseScrapingReturn {
  // State
  results: ScrapingResult[];
  isLoading: boolean;
  error: string | null;
  lastScraped: Date | null;

  // Actions
  scrapeBusinesses: (config: ScrapingConfig) => Promise<ScrapingResponse>;
  clearResults: () => void;
  clearError: () => void;

  // Utilities
  exportResults: (format: 'json' | 'csv' | 'xlsx') => string;
  filterResults: (filters: {
    minRating?: number;
    hasContactInfo?: boolean;
    hasImages?: boolean;
    categories?: string[];
  }) => ScrapingResult[];
  getStats: () => {
    totalBusinesses: number;
    totalImages: number;
    averageRating: number;
    categories: Record<string, number>;
    withContactInfo: number;
    withReviews: number;
  };
  generateReport: () => {
    summary: string;
    statistics: ReturnType<typeof scrapingService.getScrapingStats>;
    recommendations: string[];
  };
}

export const useScraping = (): UseScrapingReturn => {
  const { user } = useAuth();
  const [results, setResults] = useState<ScrapingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScraped, setLastScraped] = useState<Date | null>(null);

  const scrapeBusinesses = useCallback(async (config: ScrapingConfig): Promise<ScrapingResponse> => {
    if (!user) {
      const errorMsg = 'User must be authenticated to perform scraping';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await scrapingService.scrapeBusinesses(config, user?.id);

      if (response.success && response.results) {
        setResults(response.results);
        setLastScraped(new Date());
        setError(null);
      } else if (response.error) {
        setError(response.error);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const clearResults = useCallback(() => {
    setResults([]);
    setLastScraped(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const exportResults = useCallback((format: 'json' | 'csv' | 'xlsx'): string => {
    return scrapingService.exportResults(results, format);
  }, [results]);

  const filterResults = useCallback((filters: {
    minRating?: number;
    hasContactInfo?: boolean;
    hasImages?: boolean;
    categories?: string[];
  }): ScrapingResult[] => {
    return scrapingService.filterResults(results, filters);
  }, [results]);

  const getStats = useCallback(() => {
    return scrapingService.getScrapingStats(results);
  }, [results]);

  const generateReport = useCallback(() => {
    return scrapingService.generateReport(results);
  }, [results]);

  return {
    // State
    results,
    isLoading,
    error,
    lastScraped,

    // Actions
    scrapeBusinesses,
    clearResults,
    clearError,

    // Utilities
    exportResults,
    filterResults,
    getStats,
    generateReport,
  };
};
