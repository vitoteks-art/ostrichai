import React, { useState } from 'react';
import Layout from '../components/Layout';
import SEO from '@/components/SEO';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Slider } from '../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  MapPin,
  Search,
  Settings,
  Download,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  Star,
  Clock,
  Users
} from 'lucide-react';
import { useScraping } from '../hooks/useScraping';
import { ScrapingConfig } from '../services/scrapingService';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { ProjectService } from '../services/projectService';

interface ScrapingResult {
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

const GoogleMapsScraping = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { results, isLoading, error, scrapeBusinesses, exportResults, clearError } = useScraping();

  const [config, setConfig] = useState<ScrapingConfig>({
    locationQuery: '',
    searchTerms: '',
    searchLimit: 50,
    maxImages: 5,
    leadEnrichment: 5,
    additionalContactProcessing: false,
    includeWebResults: true,
    skipClosedPlaces: true,
    scrapeContacts: true,
    scrapeDirectories: false,
    scrapeImageAuthors: false,
    scrapePlaceDetails: true,
    includeReviewsPersonalData: false,
    scrapeTableReservations: false,
  });

  const handleInputChange = (field: keyof ScrapingConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSliderChange = (field: keyof ScrapingConfig, value: number[]) => {
    setConfig(prev => ({
      ...prev,
      [field]: value[0]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await scrapeBusinesses(config);
    } catch (err) {
      // Error handling is managed by the hook
      console.error('Scraping error:', err);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }

    try {
      const content = exportResults(format);

      if (format === 'json') {
        const dataBlob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `google-maps-scraping-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const dataBlob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `google-maps-scraping-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }

      toast.success(`Results exported as ${format.toUpperCase()}`);

      // Log export activity if user is authenticated
      if (user) {
        await ProjectService.logUserInteraction(
          user.id,
          `Exported ${format.toUpperCase()}`,
          `Exported ${results.length} scraped businesses as ${format.toUpperCase()}`,
          {
            category: 'export',
            exportFormat: format,
            businessCount: results.length,
            fileName: `google-maps-scraping-${new Date().toISOString().split('T')[0]}.${format}`
          }
        );
      }
    } catch (err) {
      toast.error('Failed to export results');
      console.error('Export error:', err);
    }
  };

  return (
    <Layout>
      <SEO
        title="AI Google Maps Scraping | Business Lead Generation"
        description="Scrape business data from Google Maps with AI. Generate high-quality B2B leads, contact information, and business insights automatically."
      />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Google Maps Business Scraper</h1>
          <p className="text-muted-foreground">
            Extract business data from Google Maps with advanced filtering and enrichment options
          </p>
        </div>

        {/* Legal Disclaimer */}
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Legal Notice:</strong> Use this tool responsibly and in compliance with Google's Terms of Service,
            local laws, and data protection regulations. Ensure you have permission to collect and use business data.
            Review and respect website terms, robots.txt files, and privacy policies before scraping.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Scraping Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Search Parameters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Search Parameters</h3>

                  <div className="space-y-2">
                    <Label htmlFor="locationQuery">Location Query *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="locationQuery"
                        placeholder="e.g., New York, NY or 40.7128,-74.0060"
                        value={config.locationQuery}
                        onChange={(e) => handleInputChange('locationQuery', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="searchTerms">Search Terms *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="searchTerms"
                        placeholder="e.g., restaurants, coffee shops, hotels"
                        value={config.searchTerms}
                        onChange={(e) => handleInputChange('searchTerms', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="searchLimit">Search Limit</Label>
                      <Input
                        id="searchLimit"
                        type="number"
                        min="1"
                        max="1000"
                        value={config.searchLimit}
                        onChange={(e) => handleInputChange('searchLimit', parseInt(e.target.value) || 50)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxImages">Max Images per Business</Label>
                      <Input
                        id="maxImages"
                        type="number"
                        min="1"
                        max="20"
                        value={config.maxImages}
                        onChange={(e) => handleInputChange('maxImages', parseInt(e.target.value) || 5)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Advanced Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Advanced Options</h3>

                  <div className="space-y-2">
                    <Label>Lead Enrichment Level: {config.leadEnrichment}/10</Label>
                    <Slider
                      value={[config.leadEnrichment]}
                      onValueChange={(value) => handleSliderChange('leadEnrichment', value)}
                      max={10}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      Higher levels include more detailed competitor analysis and social media research
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="additionalContactProcessing"
                      checked={config.additionalContactProcessing}
                      onCheckedChange={(checked) => handleInputChange('additionalContactProcessing', checked)}
                    />
                    <Label htmlFor="additionalContactProcessing" className="text-sm">
                      Enable additional contact information processing
                    </Label>
                  </div>
                </div>

                <Separator />

                {/* Data Collection Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Data Collection Options</h3>

                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { key: 'includeWebResults', label: 'Include Web Results', description: 'Scrape additional web-based information beyond Maps' },
                      { key: 'skipClosedPlaces', label: 'Skip Closed Places', description: 'Exclude businesses marked as permanently closed' },
                      { key: 'scrapeContacts', label: 'Scrape Contacts', description: 'Extract phone numbers, emails, and websites' },
                      { key: 'scrapeDirectories', label: 'Scrape Directories', description: 'Pull data from associated business directories' },
                      { key: 'scrapeImageAuthors', label: 'Scrape Image Authors', description: 'Include metadata about image creators or sources' },
                      { key: 'scrapePlaceDetails', label: 'Scrape Place Details', description: 'Gather detailed information like hours, ratings, and descriptions' },
                      { key: 'includeReviewsPersonalData', label: 'Include Reviews Personal Data', description: 'Scrape user reviews, including reviewer names and profiles' },
                      { key: 'scrapeTableReservations', label: 'Scrape Table Reservations', description: 'Extract availability or booking links if applicable' },
                    ].map(({ key, label, description }) => (
                      <div key={key} className="flex items-start space-x-3">
                        <Checkbox
                          id={key}
                          checked={config[key as keyof ScrapingConfig] as boolean}
                          onCheckedChange={(checked) => handleInputChange(key as keyof ScrapingConfig, checked)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor={key} className="text-sm font-medium">
                            {label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Credit Cost Display */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">💰</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Credit Cost</h4>
                        <p className="text-sm text-gray-600">Cost for Google Maps scraping</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{config.searchLimit} credits</div>
                      <div className="text-sm text-gray-500">{config.searchLimit} places × 1 credit each</div>
                    </div>
                  </div>

                  {subscription && (
                    <div className="mt-3 text-center">
                      <span className="text-sm text-gray-600">
                        Your balance: <span className="font-semibold text-green-600">{subscription.credit_balance} credits</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scraping in Progress...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Start Scraping
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Results Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Scraping Results
                  </CardTitle>
                  {results.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('json').catch(console.error)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('csv').catch(console.error)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {results.length > 0 && (
                  <div className="mb-4">
                    <Badge variant="secondary" className="text-sm">
                      {results.length} businesses found
                    </Badge>
                  </div>
                )}

                {results.length === 0 && !isLoading && !error && (
                  <p className="text-muted-foreground text-center py-8">
                    Configure your search parameters and click "Start Scraping" to see results here.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Results List */}
            {results.length > 0 && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <Card key={result.id || index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{result.name}</h3>
                          <p className="text-muted-foreground text-sm">{result.address}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{result.rating}</span>
                              {result.reviewCount && (
                                <span className="text-sm text-muted-foreground">
                                  ({result.reviewCount})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {result.category}
                        {result.description && ` • ${result.description}`}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm">
                        {result.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>{result.phone}</span>
                          </div>
                        )}
                        {result.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span>{result.email}</span>
                          </div>
                        )}
                        {result.website && (
                          <div className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            <a
                              href={result.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Website
                            </a>
                          </div>
                        )}
                      </div>

                      {result.businessHours && result.businessHours.length > 0 && (
                        <div className="mt-3 flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>{typeof result.businessHours[0] === 'object' ? JSON.stringify(result.businessHours[0]) : result.businessHours[0]}</span>
                          {result.isOpen !== undefined && (
                            <Badge variant={result.isOpen ? "default" : "secondary"} className="ml-2">
                              {result.isOpen ? "Open" : "Closed"}
                            </Badge>
                          )}
                        </div>
                      )}

                      {result.images && result.images.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">{result.images.length} images scraped</p>
                          <div className="flex gap-2 overflow-x-auto">
                            {result.images.slice(0, 3).map((image, imgIndex) => (
                              <img
                                key={imgIndex}
                                src={image}
                                alt={`${result.name} ${imgIndex + 1}`}
                                className="w-16 h-16 object-cover rounded"
                              />
                            ))}
                            {result.images.length > 3 && (
                              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                                +{result.images.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GoogleMapsScraping;
