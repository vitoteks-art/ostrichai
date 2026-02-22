// Pricing/Packages Page

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionService, SubscriptionPlan } from '@/services/subscriptionService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Crown,
  CheckCircle,
  X,
  Star,
  Zap,
  Users,
  Building2,
  ArrowRight,
  CreditCard,
  Smartphone,
  Building,
  QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

const Pricing = () => {
  const { subscription, plan } = useSubscription();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  // Calculator State
  const [calcInitType, setCalcInitType] = useState('images');
  const [calcInitQuantity, setCalcInitQuantity] = useState('');
  const [calcResult, setCalcResult] = useState<{ credits: number, plan: string, cost: number, leftover: number } | null>(null);

  const calculateCredits = () => {
    const quantity = parseInt(calcInitQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    let creditsPerUnit = 0;
    switch (calcInitType) {
      case 'images': creditsPerUnit = 2; break; // Nano-banana
      case 'pro-images': creditsPerUnit = 6; break; // Nano-banana-pro
      case 'videos': creditsPerUnit = 20; break; // Veo3 Fast
      case 'quality-videos': creditsPerUnit = 80; break; // Veo3 Quality
      case 'mixed': creditsPerUnit = 10; break; // Average estimation
      default: creditsPerUnit = 2;
    }

    const totalCreditsNeeded = quantity * creditsPerUnit;

    // Find suitable plan
    // Sort plans by credits ascending to find the smallest sufficient plan
    const sortedPlans = [...plans].sort((a, b) => a.limits.monthlyCredits - b.limits.monthlyCredits);
    let recommendedPlan = sortedPlans.find(p => p.limits.monthlyCredits >= totalCreditsNeeded) || sortedPlans[sortedPlans.length - 1]; // Default to largest if none fit

    // If even largest isn't enough, just show largest but note it
    if (!recommendedPlan && sortedPlans.length > 0) {
      recommendedPlan = sortedPlans[sortedPlans.length - 1];
    }

    if (recommendedPlan) {
      setCalcResult({
        credits: totalCreditsNeeded,
        plan: recommendedPlan.name,
        cost: recommendedPlan.price,
        leftover: Math.max(0, recommendedPlan.limits.monthlyCredits - totalCreditsNeeded)
      });
    }
  };


  React.useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const plansResult = await SubscriptionService.getPlans();
      if (plansResult.success && plansResult.data) {
        setPlans(plansResult.data);
      } else {
        console.error('Failed to load plans:', plansResult.error);
        toast.error('Failed to load pricing information');
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load pricing information');
    } finally {
      setLoading(false);
    }
  };

  const getFeatureValue = (feature: string, planLimits: any, plan?: SubscriptionPlan | null) => {
    // Handle cases where plan or planLimits might be null/undefined
    if (!planLimits || !plan) {
      switch (feature) {
        case 'credits': return 'N/A';
        case 'overage': return 'N/A';
        case 'rollover': return 'N/A';
        case 'videos': return 'N/A';
        case 'logos': return 'N/A';
        case 'ads': return 'N/A';
        case 'flyers': return 'N/A';
        case 'storage': return 'N/A';
        case 'support': return 'N/A';
        case 'api': return 'N/A';
        default: return 'N/A';
      }
    }

    switch (feature) {
      case 'credits': return `${planLimits.monthlyCredits} credits`;
      case 'overage': return planLimits.overageRateCents === 0 ? 'N/A' : `$${(planLimits.overageRateCents / 100).toFixed(2)}/100 credits`;
      case 'rollover': return planLimits.creditRolloverDays === -1 ? 'Never expire' :
        planLimits.creditRolloverDays === 0 ? 'No rollover' :
          `${planLimits.creditRolloverDays} days`;
      case 'videos': return planLimits.videosPerMonth === -1 ? 'Unlimited' : planLimits.videosPerMonth;
      case 'logos': return planLimits.logosPerMonth === -1 ? 'Unlimited' : planLimits.logosPerMonth;
      case 'ads': return planLimits.adsPerMonth === -1 ? 'Unlimited' : planLimits.adsPerMonth;
      case 'flyers': return planLimits.flyersPerMonth === -1 ? 'Unlimited' : planLimits.flyersPerMonth;
      case 'storage': return planLimits.storageLimit === -1 ? 'Unlimited' : `${planLimits.storageLimit}MB`;
      case 'support': return plan.features?.prioritySupport ? 'Priority' : 'Standard';
      case 'api': return plan.features?.apiAccess ? 'Included' : 'Not included';
      default: return 'N/A';
    }
  };

  // Filter plans by billing interval
  const filteredPlans = plans.filter(p => p.interval === billingInterval);

  // Group plans by name to calculate savings
  const planSavings = plans.reduce((acc, plan) => {
    if (!acc[plan.name]) {
      acc[plan.name] = {};
    }
    acc[plan.name][plan.interval] = plan;
    return acc;
  }, {} as Record<string, Record<string, SubscriptionPlan>>);

  const getYearlySavings = (planName: string) => {
    const planData = planSavings[planName];
    if (planData?.month && planData?.year) {
      const monthlyYearly = planData.month.price * 12;
      const yearlyPrice = planData.year.price;
      const savings = monthlyYearly - yearlyPrice;
      const savingsPercent = Math.round((savings / monthlyYearly) * 100);
      return { amount: savings, percent: savingsPercent };
    }
    return null;
  };

  const comparisonFeatures = [
    { name: 'Monthly Credits', key: 'credits' },
    { name: 'Overage Rate', key: 'overage' },
    { name: 'Credit Rollover', key: 'rollover' },
    { name: 'Video Generation', key: 'videos' },
    { name: 'Logo Design', key: 'logos' },
    { name: 'Ad Creation', key: 'ads' },
    { name: 'Flyer Design', key: 'flyers' },
    { name: 'Storage', key: 'storage' },
    { name: 'Support Level', key: 'support' },
    { name: 'API Access', key: 'api' },
    { name: 'Batch Processing', key: 'batch' },
    { name: 'Analytics', key: 'analytics' },
    { name: 'Custom Branding', key: 'branding' }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="Transparent Pricing & Flexible Plans"
        description="Choose the perfect plan for your business. Transparent credit-based pricing with no hidden fees and local payment support for Nigeria."
      />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Simple, Transparent
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary block">
              Pricing
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Pay for what you use. Scale as you grow. All plans include monthly credits with flexible overage pricing.
            No hidden fees, transparent credit costs, and Nigerian payment support.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-muted p-1 rounded-lg">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${billingInterval === 'month'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-6 py-2 rounded-md font-medium transition-all relative ${billingInterval === 'year'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Yearly
            </button>
          </div>
          {billingInterval === 'year' && (
            <div className="ml-4">
              <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                Save up to 20%
              </span>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {filteredPlans.length > 0 ? (
            filteredPlans.map((plan) => {
              const isCurrentPlan = plan.id === subscription?.plan_id;
              return (
                <Card key={plan.id} className={`relative ${isCurrentPlan ? 'border-green-500 border-2' : plan.popular ? 'border-primary border-2 scale-105' : ''}`}>
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-green-600 text-white px-4 py-1">
                        Current Plan
                      </Badge>
                    </div>
                  )}
                  {plan.popular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                    <div className="mt-6">
                      <span className="text-5xl font-bold">
                        {plan.price > 0 ? `$${plan.price}` : 'Free'}
                      </span>
                      <span className="text-muted-foreground text-lg">
                        {plan.price > 0 ? `/${billingInterval === 'year' ? 'year' : 'month'}` : ''}
                      </span>
                      {billingInterval === 'year' && plan.price > 0 && (
                        <div className="mt-2">
                          {(() => {
                            const savings = getYearlySavings(plan.name);
                            return savings ? (
                              <Badge className="bg-green-600 text-white">
                                Save ${savings.amount} ({savings.percent}% off)
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Key Features */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Monthly Credits</span>
                        <span className="text-sm font-semibold text-primary">{getFeatureValue('credits', plan.limits, plan)}</span>
                      </div>
                      {plan.price > 0 && (
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium">Overage Rate</span>
                          <span className="text-sm">{getFeatureValue('overage', plan.limits, plan)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Credit Rollover</span>
                        <span className="text-sm">{getFeatureValue('rollover', plan.limits, plan)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Support</span>
                        <span className="text-sm">{getFeatureValue('support', plan.limits, plan)}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link to="/subscription" className="block">
                      <Button
                        className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                        variant={isCurrentPlan ? 'secondary' : plan.popular ? 'default' : 'outline'}
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan ? 'Current Plan' : plan.price > 0 ? 'Choose Plan' : 'Get Started Free'}
                      </Button>
                    </Link>

                    {/* Feature List */}
                    <div className="space-y-2 pt-4 border-t">
                      <div className="text-sm font-medium mb-3">Features included:</div>
                      <div className="space-y-2">
                        {Object.entries(plan.features).slice(0, 6).map(([feature, enabled]) => (
                          <div key={feature} className="flex items-center gap-2 text-sm">
                            {enabled ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-gray-300" />
                            )}
                            <span className={enabled ? 'text-foreground' : 'text-muted-foreground'}>
                              {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No pricing plans available at the moment.</p>
            </div>
          )}
        </div>

        {/* Detailed Comparison */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl">Detailed Feature Comparison</CardTitle>
            <CardDescription>Compare all features across our subscription plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-2">Feature</th>
                    {filteredPlans.length > 0 ? (
                      filteredPlans.map(plan => (
                        <th key={plan.id} className="text-center py-4 px-2">
                          <div className="font-semibold">{plan.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {plan.price > 0 ? `$${plan.price}/${billingInterval === 'year' ? 'yr' : 'mo'}` : 'Free'}
                          </div>
                        </th>
                      ))
                    ) : (
                      <th className="text-center py-4 px-2">
                        <div className="text-muted-foreground">No plans available</div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-4 px-2 font-medium">{feature.name}</td>
                      {filteredPlans.length > 0 ? (
                        filteredPlans.map(plan => (
                          <td key={plan.id} className="text-center py-4 px-2">
                            {feature.key === 'batch' ? (
                              plan.features.batchProcessing ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-gray-300 mx-auto" />
                              )
                            ) : feature.key === 'analytics' ? (
                              plan.features.analytics ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-gray-300 mx-auto" />
                              )
                            ) : feature.key === 'branding' ? (
                              plan.features.customBranding ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-gray-300 mx-auto" />
                              )
                            ) : (
                              <span className="text-sm">
                                {getFeatureValue(feature.key, plan.limits, plan)}
                              </span>
                            )}
                          </td>
                        ))
                      ) : (
                        <td className="text-center py-4 px-2">
                          <span className="text-muted-foreground">No plans available</span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Credit Calculator Section */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl">Credit Calculator</CardTitle>
            <CardDescription>Not sure which plan? Use our calculator to find the perfect fit!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>What do you want to create?</Label>
                  <Select value={calcInitType} onValueChange={setCalcInitType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="images">Images (Nano-banana)</SelectItem>
                      <SelectItem value="pro-images">Pro Images (Nano-banana-pro)</SelectItem>
                      <SelectItem value="videos">Fast Videos (Veo3 Fast)</SelectItem>
                      <SelectItem value="quality-videos">Quality Videos (Veo3 Quality)</SelectItem>
                      <SelectItem value="mixed">Mixed Usage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>How many per month?</Label>
                  <Input
                    type="number"
                    placeholder="Enter quantity"
                    value={calcInitQuantity}
                    onChange={(e) => setCalcInitQuantity(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={calculateCredits}>Calculate Credits Needed</Button>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Recommended Plan</h3>
                {calcResult ? (
                  <div className="space-y-2 text-sm">
                    <p><strong>Credits needed:</strong> {calcResult.credits.toLocaleString()}/month</p>
                    <p><strong>Recommended:</strong> {calcResult.plan} (${calcResult.cost}/mo)</p>
                    <p><strong>Monthly cost:</strong> ${calcResult.cost}</p>
                    <p><strong>Credits leftover:</strong> {calcResult.leftover.toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Enter your usage details to see a recommendation.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Cost Reference */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl">Credit Cost Reference</CardTitle>
            <CardDescription>Understand how credits are used for each feature</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Feature</th>
                    <th className="text-center py-3 px-2">Credits</th>
                    <th className="text-left py-3 px-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">Background Removal</td>
                    <td className="text-center py-3 px-2">1</td>
                    <td className="py-3 px-2">Remove background from 1 image</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">Nano-banana (1-2k)</td>
                    <td className="text-center py-3 px-2">2</td>
                    <td className="py-3 px-2">Generate 1 image</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">Nano-banana-pro (1-2k)</td>
                    <td className="text-center py-3 px-2">6</td>
                    <td className="py-3 px-2">Generate 1 high-quality image</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">Nano-banana-pro (4k)</td>
                    <td className="text-center py-3 px-2">8</td>
                    <td className="py-3 px-2">Generate 1 ultra-high-res image</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">Veo3 Fast (8 sec)</td>
                    <td className="text-center py-3 px-2">20</td>
                    <td className="py-3 px-2">Generate 8 seconds of video</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">Veo3 Quality (8 sec)</td>
                    <td className="text-center py-3 px-2">80</td>
                    <td className="py-3 px-2">Generate 8 seconds of high-quality video</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">Infinit-talk 480p (per sec)</td>
                    <td className="text-center py-3 px-2">15</td>
                    <td className="py-3 px-2">Generate 1 second of talking head video</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">YouTube Scraper</td>
                    <td className="text-center py-3 px-2">1</td>
                    <td className="py-3 px-2">Scrape 1 video/channel</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">AI Search</td>
                    <td className="text-center py-3 px-2">1</td>
                    <td className="py-3 px-2">Perform 1 AI-powered search</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">GPT-5.1 (per call)</td>
                    <td className="text-center py-3 px-2">5</td>
                    <td className="py-3 px-2">Use advanced GPT model</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2 font-medium">GPT-5 nano (per call)</td>
                    <td className="text-center py-3 px-2">0</td>
                    <td className="py-3 px-2">Free lightweight GPT model</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Supported Payment Methods
            </CardTitle>
            <CardDescription>Nigerian and international payment options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <CreditCard className="h-8 w-8 text-blue-600 mb-2" />
                <span className="font-medium">Credit/Debit Cards</span>
                <span className="text-sm text-muted-foreground">Visa, Mastercard</span>
              </div>

              <div className="flex flex-col items-center p-4 border rounded-lg">
                <Smartphone className="h-8 w-8 text-green-600 mb-2" />
                <span className="font-medium">Mobile Money</span>
                <span className="text-sm text-muted-foreground">MTN, Airtel, Glo</span>
              </div>

              <div className="flex flex-col items-center p-4 border rounded-lg">
                <Building className="h-8 w-8 text-purple-600 mb-2" />
                <span className="font-medium">Bank Transfer</span>
                <span className="text-sm text-muted-foreground">All Nigerian banks</span>
              </div>

              <div className="flex flex-col items-center p-4 border rounded-lg">
                <QrCode className="h-8 w-8 text-orange-600 mb-2" />
                <span className="font-medium">QR Code</span>
                <span className="text-sm text-muted-foreground">Scan to pay</span>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Everything you need to know about our credit-based pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">What happens when I run out of credits?</h4>
                <p className="text-muted-foreground">
                  You can choose to auto-reload credits (default) or manually top up. Your service won't be interrupted with auto-reload enabled. When auto-reload is on, we automatically purchase 100 credits when your balance hits zero.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Do unused credits roll over?</h4>
                <p className="text-muted-foreground">
                  Free Trial credits expire monthly. Starter plan credits expire monthly. Pro credits roll over for 3 months. Business credits roll over for 6 months.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Can I change plans anytime?</h4>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments. When downgrading, you keep unused credits and the change takes effect at your next billing cycle.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">How do overages work?</h4>
                <p className="text-muted-foreground">
                  When you exceed your monthly credits, we automatically add 100 credits at your plan's overage rate. You can set monthly overage caps to control spending and prevent unexpected bills.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Is there a free trial?</h4>
                <p className="text-muted-foreground">
                  Yes! Get 20 free credits to test all features. No credit card required to start your free trial.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">What payment methods do you accept?</h4>
                <p className="text-muted-foreground">
                  We accept all major Nigerian payment methods including cards, mobile money (MTN, Airtel, Glo), bank transfers, USSD codes, and QR payments through Flutterwave and Paystack.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Do you offer refunds?</h4>
                <p className="text-muted-foreground">
                  We offer a 7-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team for a full refund.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of creators already using our AI platform. Start free and upgrade when ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/subscription">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <Crown className="h-5 w-5 mr-2" />
                  View All Plans
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                <Users className="h-5 w-5 mr-2" />
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Pricing;
