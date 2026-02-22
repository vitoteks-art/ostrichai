import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart3, TrendingUp, Crown, Zap, Users, Clock, DollarSign, Target, Award, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import Footer from '@/components/Footer';
import RevenueAuditForm from '@/components/RevenueAuditForm';
import AuditResults from '@/components/AuditResults';
import SEO from '@/components/SEO';
import { useCurrency } from '@/lib/currencyUtils';

export interface AuditData {
  companyName: string;
  industry: string;
  monthlyLeads: number;
  avgDealValue: number;
  currentResponseTime: number;
  leadSources: string[];
  salesTeamSize: number;
  crmSystem: string;
  currentConversionRate: number;
  biggestChallenge: string;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface RevenueLeak {
  category: string;
  impact: number;
  description: string;
  solution: string;
  confidence: number;
}

export interface Projections {
  currentMonthlyRevenue: number;
  conservativeMonthlyRevenue: number;
  aggressiveMonthlyRevenue: number;
  conservativeIncrease: number;
  aggressiveIncrease: number;
  annualConservative: number;
  annualAggressive: number;
  roiTimeline: string;
  confidenceLevel: number;
}

export interface Recommendation {
  priority: string;
  title: string;
  description: string;
  impact: string;
  estimatedValue: number;
  timeframe: string;
}

export interface Benchmarks {
  industryAverage: number;
  topPerformers: number;
  yourPosition: string;
  industryConversionRate: number;
}

export interface AuditResultsData {
  overallScore: number;
  revenueLeaks: RevenueLeak[];
  projections: Projections;
  recommendations: Recommendation[];
  benchmarks: Benchmarks;
  aiInsights: string;
  metadata: {
    analysisDate: string;
    businessSize: string;
  };
}

const RevenueAudit = () => {
  const [currentStep, setCurrentStep] = useState<'form' | 'processing' | 'results'>('form');
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [auditResults, setAuditResults] = useState<AuditResultsData | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Use currency detection
  const { currency, convertAndFormat } = useCurrency();

  const handleFormSubmit = async (data: AuditData) => {
    console.log('=== FORM SUBMISSION START ===');
    console.log('Form data received:', data);

    // Convert USD values to local currency for processing
    const localizedData = {
      ...data,
      avgDealValue: currency.code === 'USD' ? data.avgDealValue : data.avgDealValue * 1650 // Convert to NGN if needed
    };

    setAuditData(localizedData);
    setCurrentStep('processing');
    console.log('Step changed to processing');

    // Simulate processing progress
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev >= 90 ? 90 : prev + 10;
        console.log('Progress updated to:', newProgress);
        return newProgress;
      });
    }, 500);

    try {
      console.log('=== N8N WEBHOOK REQUEST START ===');
      console.log('Webhook URL:', 'https://n8n.getostrichai.com/webhook/revenue-audit-main');
      console.log('Request data:', JSON.stringify(localizedData, null, 2));

      // Send data to n8n webhook
      const response = await fetch('https://n8n.getostrichai.com/webhook/revenue-audit-main', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...localizedData,
          currency: currency.code,
          currencySymbol: currency.symbol
        }),
      });

      console.log('=== N8N WEBHOOK RESPONSE ===');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        let results;
        try {
          results = await response.json();
          console.log('Parsed results from n8n:', results);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          throw new Error('Invalid JSON response from n8n webhook');
        }

        // Handle array response from n8n - extract first item
        let processedResults;
        if (Array.isArray(results)) {
          console.log('Response is array with length:', results.length);
          if (results.length > 0) {
            processedResults = results[0];
            console.log('Extracted first item from array:', processedResults);
          } else {
            throw new Error('Empty array response from n8n webhook');
          }
        } else if (results && typeof results === 'object') {
          processedResults = results;
          console.log('Response is object:', processedResults);
        } else {
          console.error('Invalid response format:', typeof results, results);
          throw new Error('Invalid response format from n8n webhook');
        }

        // Validate that we have the expected structure
        console.log('Validating response structure...');
        console.log('processedResults keys:', Object.keys(processedResults));
        console.log('overallScore:', processedResults.overallScore);
        console.log('revenueLeaks:', processedResults.revenueLeaks);
        console.log('projections:', processedResults.projections);

        // Validate required fields exist
        if (processedResults &&
          typeof processedResults === 'object' &&
          processedResults.overallScore !== undefined &&
          processedResults.revenueLeaks !== undefined &&
          processedResults.projections !== undefined &&
          processedResults.recommendations !== undefined &&
          processedResults.benchmarks !== undefined) {

          console.log('Setting audit results:', processedResults);
          setAuditResults(processedResults);
          setProcessingProgress(100);
          console.log('Progress set to 100, changing to results step in 1 second');
          setTimeout(() => {
            console.log('Changing step to results');
            setCurrentStep('results');
          }, 1000);
        } else {
          console.error('Invalid response structure. Missing required fields:', processedResults);
          console.error('Required fields check:');
          console.error('- overallScore:', processedResults?.overallScore);
          console.error('- revenueLeaks:', processedResults?.revenueLeaks);
          console.error('- projections:', processedResults?.projections);
          console.error('- recommendations:', processedResults?.recommendations);
          console.error('- benchmarks:', processedResults?.benchmarks);
          throw new Error('Invalid response structure from n8n webhook - missing required fields');
        }
      } else {
        const errorText = await response.text();
        console.error('N8N webhook error response:', errorText);
        throw new Error(`N8N webhook responded with status ${response.status}: ${errorText}`);
      }

    } catch (error) {
      console.error('=== N8N WEBHOOK ERROR ===');
      console.error('Error details:', error);

      // Type-safe error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error message:', errorMessage);

      if (error instanceof Error && error.stack) {
        console.error('Error stack:', error.stack);
      }

      // Show error message to user
      alert(`Failed to generate audit results: ${errorMessage}. Please try again or contact support.`);

      // Reset to form
      console.log('Resetting to form due to error');
      setCurrentStep('form');
      setProcessingProgress(0);
    }

    clearInterval(progressInterval);
    console.log('=== FORM SUBMISSION END ===');
  };

  console.log('=== RENDER STATE ===');
  console.log('Current step:', currentStep);
  console.log('Audit data exists:', !!auditData);
  console.log('Audit results exists:', !!auditResults);
  console.log('Processing progress:', processingProgress);

  return (
    <Layout>
      <SEO
        title="Free Revenue & Lead Response Audit | OstrichAi"
        description="Find out how much revenue you're losing to slow lead response. Get a free, AI-powered audit of your sales funnel and lead management process."
      />
      <div className="container mx-auto px-4">
        {/* Hero Section - Matching Studio Page Style */}
        <section className="relative py-24 px-4">
          <div className="container mx-auto text-center">
            <div className="max-w-screen-xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
                <Zap className="h-4 w-4" />
                <span>Free Revenue Analysis</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                Stop Losing Revenue
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary block">
                  Every Month
                </span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Get a personalized analysis of your revenue potential and discover exactly
                how much money you're leaving on the table with slow lead response.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                  onClick={() => setCurrentStep('form')}
                >
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Get Free Audit
                </Button>
                <Link to="/">
                  <Button variant="outline" size="lg" className="border-border hover:bg-secondary/80 px-8 py-4 text-lg">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - Matching Studio Page */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 mx-auto">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">60s</div>
                <div className="text-muted-foreground">Response Time</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 mx-auto">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">47%</div>
                <div className="text-muted-foreground">More Qualified Leads</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 mx-auto">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">24/7</div>
                <div className="text-muted-foreground">Lead Coverage</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 mx-auto">
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">3x</div>
                <div className="text-muted-foreground">ROI Average</div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section - Matching Studio Page */}
        <section className="py-20 px-4 bg-secondary/20">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Why Revenue Audit?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover hidden revenue opportunities and optimize your lead management process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Target className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Instant Analysis</h3>
                <p className="text-muted-foreground leading-relaxed">Get comprehensive insights in under 5 minutes</p>
              </div>

              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Award className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">AI-Powered Insights</h3>
                <p className="text-muted-foreground leading-relaxed">Advanced algorithms identify your biggest opportunities</p>
              </div>

              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Actionable Plan</h3>
                <p className="text-muted-foreground leading-relaxed">Get specific recommendations to improve your results</p>
              </div>
            </div>
          </div>
        </section>

        {/* Form Section */}
        {currentStep === 'form' && (
          <section className="py-20 px-4 bg-secondary/10">
            <div className="container mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  Get Your Free Revenue Audit
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Fill out the form below to receive your personalized revenue analysis
                </p>
              </div>
              <RevenueAuditForm onSubmit={handleFormSubmit} />
            </div>
          </section>
        )}

        {/* Processing Section */}
        {currentStep === 'processing' && (
          <section className="py-20 px-4 bg-secondary/10">
            <div className="container mx-auto">
              <div className="max-w-2xl mx-auto text-center">
                <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl">
                  <CardContent className="p-12">
                    <div className="mb-8">
                      <div className="bg-primary/10 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <BarChart3 className="h-12 w-12 text-primary animate-pulse" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-4">
                        Analyzing Your Business Data
                      </h3>
                      <p className="text-muted-foreground text-lg">
                        Our AI is processing your information and generating personalized insights...
                      </p>
                    </div>

                    <div className="mb-8">
                      <div className="bg-muted rounded-full h-4 mb-4">
                        <div
                          className="bg-primary h-4 rounded-full transition-all duration-500"
                          style={{ width: `${processingProgress}%` }}
                        />
                      </div>
                      <p className="text-muted-foreground">{processingProgress}% Complete</p>
                    </div>

                    <div className="space-y-4 text-muted-foreground">
                      <div className={`flex items-center justify-center ${processingProgress >= 20 ? 'text-green-600' : ''}`}>
                        <div className={`w-3 h-3 rounded-full mr-4 ${processingProgress >= 20 ? 'bg-green-600' : 'bg-muted-foreground'}`} />
                        Analyzing revenue patterns
                      </div>
                      <div className={`flex items-center justify-center ${processingProgress >= 50 ? 'text-green-600' : ''}`}>
                        <div className={`w-3 h-3 rounded-full mr-4 ${processingProgress >= 50 ? 'bg-green-600' : 'bg-muted-foreground'}`} />
                        Identifying revenue leaks
                      </div>
                      <div className={`flex items-center justify-center ${processingProgress >= 80 ? 'text-green-600' : ''}`}>
                        <div className={`w-3 h-3 rounded-full mr-4 ${processingProgress >= 80 ? 'bg-green-600' : 'bg-muted-foreground'}`} />
                        Calculating ROI projections
                      </div>
                      <div className={`flex items-center justify-center ${processingProgress >= 100 ? 'text-green-600' : ''}`}>
                        <div className={`w-3 h-3 rounded-full mr-4 ${processingProgress >= 100 ? 'bg-green-600' : 'bg-muted-foreground'}`} />
                        Generating recommendations
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Results Section */}
        {currentStep === 'results' && auditResults && auditData && (
          <AuditResults
            results={auditResults}
            businessData={auditData}
            onStartOver={() => {
              console.log('Starting over - resetting state');
              setCurrentStep('form');
              setAuditData(null);
              setAuditResults(null);
              setProcessingProgress(0);
            }}
          />
        )}

        {/* Error Section */}
        {currentStep === 'results' && (!auditResults || !auditData) && (
          <section className="py-20 px-4">
            <div className="container mx-auto">
              <div className="max-w-md mx-auto text-center">
                <Card className="bg-card/80 backdrop-blur-xl border-border/50">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-destructive mb-4">Error Loading Results</h3>
                    <p className="text-muted-foreground mb-6">
                      There was an issue loading your audit results. Please try again.
                    </p>
                    <Button onClick={() => {
                      console.log('Error state - returning to form');
                      setCurrentStep('form');
                      setAuditData(null);
                      setAuditResults(null);
                      setProcessingProgress(0);
                    }}>
                      Start Over
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default RevenueAudit;
