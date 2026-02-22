import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle, ExternalLink, Trophy, Users, TrendingUp, Gift, Link as LinkIcon, Copy, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ReferralService } from '@/services/referralService';
import SEO from '@/components/SEO';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

const ReferralLanding = () => {
  const { campaignId, referralCode } = useParams<{ campaignId: string; referralCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [referrer, setReferrer] = useState<any>(null);
  const [clickTracked, setClickTracked] = useState(false);
  const [landingConfig, setLandingConfig] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [generatedReferralLink, setGeneratedReferralLink] = useState<string>('');
  const [userPoints, setUserPoints] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    company: '',
    phone: '',
    website: '',
    message: ''
  });

  useEffect(() => {
    const processReferral = async () => {
      if (!campaignId || !referralCode) {
        setError('Invalid referral link');
        setLoading(false);
        return;
      }

      try {
        try {
          console.log('🔄 Fetching public landing content via FastAPI');
          const response = await fetch(`${API_BASE_URL}/referrals/public/landing?campaign_id=${campaignId}&referral_code=${referralCode}`);

          if (!response.ok) {
            throw new Error('Failed to fetch landing content');
          }

          const data = await response.json();
          setCampaign(data.campaign);
          setLandingConfig(data.campaign.landing_page_config);

          if (data.referrer) {
            setReferrer({
              name: data.referrer.full_name,
              avatar: data.referrer.avatar_url
            });
          } else {
            setReferrer({ name: 'A fellow creator' });
          }

          // Initialize form visibility
          setShowForm(!data.campaign.landing_page_config?.form_config?.show_form_on_click);

          // Track click (non-blocking)
          ReferralService.trackReferralClick(referralCode, campaignId, {
            userAgent: navigator.userAgent,
            referrerUrl: document.referrer,
            deviceInfo: {
              platform: navigator.platform,
              language: navigator.language,
              screenResolution: `${screen.width}x${screen.height}`,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          }).catch(err => console.warn('Click tracking failed:', err));

        } catch (err) {
          console.error('Error fetching landing content:', err);
          setError('Failed to load referral details');
        }
      } catch (err) {
        console.error('Error processing referral:', err);
        setError('An error occurred while processing your referral');
      } finally {
        setLoading(false);
      }
    };

    processReferral();
  }, [campaignId, referralCode]);

  const handleContinue = () => {
    if (user) {
      // User is logged in, redirect to dashboard
      navigate('/dashboard');
    } else {
      // Check if form should be shown on click
      const shouldShowFormOnClick = landingConfig?.form_config?.show_form_on_click !== false;
      if (shouldShowFormOnClick) {
        // Show the form
        setShowForm(true);
      } else {
        // Form is already shown, proceed to login
        const signupUrl = `/login?ref=${campaignId}_${referralCode}`;
        navigate(signupUrl);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Generate device fingerprint for duplicate detection
      const fingerprint = btoa(navigator.userAgent + screen.width + screen.height + new Date().getTimezoneOffset());

      const submissionResult = await ReferralService.submitReferralForm(
        campaignId || '',
        referralCode,
        formData,
        landingConfig?.form_type || 'lead_capture',
        landingConfig?.form_config,
        {
          ip: undefined, // Will be handled server-side
          userAgent: navigator.userAgent,
          referrerUrl: document.referrer,
          deviceInfo: {
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          fingerprint: fingerprint,
          consentGiven: true // Assume consent given by submitting form
        }
      );

      if (!submissionResult.success) {
        toast.error(submissionResult.error || 'Failed to submit form');
        return;
      }

      if (submissionResult.isDuplicate) {
        toast.warning('This email has already been submitted recently. We\'ll review your information.');
      } else {
        toast.success(landingConfig?.form_config?.success_message || 'Form submitted successfully!');
      }

      // Handle signup flow if needed
      if (landingConfig?.form_type === 'signup' && !submissionResult.isDuplicate) {
        try {
          // Handle user registration
          const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: 'temp_password_' + Date.now(), // Generate temporary password
            options: {
              data: {
                full_name: formData.full_name,
                referral_campaign: campaignId,
                referral_code: referralCode
              }
            }
          });

          if (error) throw error;

          // Record the conversion
          await ReferralService.recordConversion(referralCode || '', data.user?.id || '', {
            type: 'signup',
            metadata: {
              form_data: formData,
              campaign_id: campaignId,
              submission_id: submissionResult.data?.id
            }
          });

          // Generate referral link for the new user
          const linkResult = await ReferralService.getOrCreateReferralLink(data.user?.id || '', campaignId || '');
          if (linkResult.success) {
            setGeneratedReferralLink(linkResult.data?.full_url || '');
          }

          // Get user points
          const pointsResult = await ReferralService.getUserReferralStats(data.user?.id || '');
          if (pointsResult.success) {
            setUserPoints(pointsResult.data);
          }
        } catch (signupError: any) {
          console.error('Signup error:', signupError);
          // Don't fail the whole submission if signup fails
          toast.warning('Form submitted but account creation failed. Please try logging in.');
        }
      }

      setFormSubmitted(true);

      // Auto redirect after delay if configured
      if (landingConfig?.thank_you_page?.redirect_url && landingConfig.thank_you_page.redirect_delay > 0) {
        setTimeout(() => {
          window.location.href = landingConfig.thank_you_page.redirect_url;
        }, landingConfig.thank_you_page.redirect_delay);
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || 'Failed to submit form');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const shareOnSocial = (platform: string, url: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedMessage = encodeURIComponent(`Check out OstrichAi - amazing AI tools for creators! ${url}`);

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: landingConfig?.background_color || '#f8fafc' }}>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-center text-gray-600">Processing your referral...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <XCircle className="h-6 w-6 text-red-600" />
              <CardTitle className="text-red-900">Referral Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${landingConfig?.background_color || '#667eea'} 0%, ${landingConfig?.background_color || '#764ba2'} 100%)`,
        color: landingConfig?.text_color || '#ffffff'
      }}
    >
      <SEO
        title="OstrichAi Referral Program | Share and Earn"
        description="Join the OstrichAi referral program and earn rewards. Share the power of AI-driven marketing with your network and grow together."
      />
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto text-center">
          {/* Campaign Badge */}
          {campaign && (
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6 border border-white/30">
              <Trophy className="h-4 w-4 mr-2 text-yellow-300" />
              <span className="text-sm font-medium">{campaign.name} Campaign</span>
            </div>
          )}

          {/* Hero Layout - Conditional Rendering */}
          {(!landingConfig?.hero_layout || landingConfig.hero_layout === 'horizontal') ? (
            /* Horizontal Layout: Title, Subtitle, Image, Description */
            <>
              {/* Main Heading */}
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                {landingConfig?.title || "Welcome to OstrichAi!"}
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
                {landingConfig?.subtitle || "Join thousands of creators using AI-powered tools"}
              </p>

              {/* Hero Image */}
              {landingConfig?.hero_image_url && (
                <div className="mb-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                  <img
                    src={landingConfig.hero_image_url}
                    alt="Hero"
                    className="w-full max-w-lg mx-auto rounded-2xl shadow-2xl border border-white/20"
                  />
                </div>
              )}

              {/* Description */}
              <p className="text-lg mb-12 max-w-2xl mx-auto opacity-80 leading-relaxed">
                {landingConfig?.description || "Create stunning videos, logos, ads, and more with our advanced AI platform."}
              </p>
            </>
          ) : landingConfig.hero_layout === 'side-by-side' ? (
            /* Side-by-Side Layout: Content and Image side by side */
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-12 ${landingConfig?.hero_layout_side === 'right' ? 'lg:grid-flow-col-dense' : ''}`}>
              {/* Content Side */}
              <div className={`text-center lg:text-left ${landingConfig?.hero_layout_side === 'right' ? 'lg:col-start-2' : ''}`}>
                {/* Main Heading */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  {landingConfig?.title || "Welcome to OstrichAi!"}
                </h1>

                {/* Subtitle */}
                <p className="text-lg md:text-xl mb-6 opacity-90 leading-relaxed">
                  {landingConfig?.subtitle || "Join thousands of creators using AI-powered tools"}
                </p>

                {/* Description */}
                <p className="text-base mb-8 opacity-80 leading-relaxed">
                  {landingConfig?.description || "Create stunning videos, logos, ads, and more with our advanced AI platform."}
                </p>
              </div>

              {/* Image Side */}
              <div className={`${landingConfig?.hero_layout_side === 'right' ? 'lg:col-start-1' : ''}`}>
                {landingConfig?.hero_image_url && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                    <img
                      src={landingConfig.hero_image_url}
                      alt="Hero"
                      className="w-full h-auto max-w-sm mx-auto lg:max-w-none lg:h-80 xl:h-96 object-cover rounded-2xl shadow-2xl border border-white/20"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Form Beside Content Layout: Form + Content side by side, Image below */
            <>
              {/* Form and Content Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start mb-12">
                {/* Content Side */}
                <div className="text-center lg:text-left">
                  {/* Main Heading */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                    {landingConfig?.title || "Welcome to OstrichAi!"}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-lg md:text-xl mb-6 opacity-90 leading-relaxed">
                    {landingConfig?.subtitle || "Join thousands of creators using AI-powered tools"}
                  </p>

                  {/* Description */}
                  <p className="text-base mb-8 opacity-80 leading-relaxed">
                    {landingConfig?.description || "Create stunning videos, logos, ads, and more with our advanced AI platform."}
                  </p>
                </div>

                {/* Form Side */}
                <div className="flex justify-center lg:justify-end">
                  {showForm && !formSubmitted && (
                    <Card className="bg-white/95 backdrop-blur-md border-white/20 shadow-2xl max-w-lg w-full">
                      <CardHeader className="pb-6">
                        <CardTitle className="text-center text-gray-900 text-2xl font-bold">
                          Join The Competition
                        </CardTitle>
                        <CardDescription className="text-center text-gray-600 text-base">
                          {landingConfig?.form_type === 'signup'
                            ? 'Create your account and get your referral link to start earning rewards!'
                            : 'Tell us about yourself and we\'ll get back to you!'
                          }
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-8 pb-8">
                        <form onSubmit={handleFormSubmit} className="space-y-6">
                          {/* Default fields - always show email and full_name if not configured */}
                          {(!landingConfig?.form_config?.fields || landingConfig.form_config.fields.includes('full_name') || landingConfig.form_config.fields.length === 0) && (
                            <div className="space-y-2">
                              <Label htmlFor="full_name" className="text-sm font-semibold text-gray-700 block">
                                Full Name *
                              </Label>
                              <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="Enter your full name"
                                className="h-12 text-base"
                                required
                              />
                            </div>
                          )}
                          {(!landingConfig?.form_config?.fields || landingConfig.form_config.fields.includes('email') || landingConfig.form_config.fields.length === 0) && (
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 block">
                                Email Address *
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Enter your email address"
                                className="h-12 text-base"
                                required
                              />
                            </div>
                          )}
                          {landingConfig?.form_config?.fields?.includes('company') && (
                            <div className="space-y-2">
                              <Label htmlFor="company" className="text-sm font-semibold text-gray-700 block">
                                Company Name
                              </Label>
                              <Input
                                id="company"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                placeholder="Enter your company name"
                                className="h-12 text-base"
                              />
                            </div>
                          )}
                          {landingConfig?.form_config?.fields?.includes('phone') && (
                            <div className="space-y-2">
                              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 block">
                                Phone Number
                              </Label>
                              <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Enter your phone number"
                                className="h-12 text-base"
                              />
                            </div>
                          )}
                          {landingConfig?.form_config?.fields?.includes('website') && (
                            <div className="space-y-2">
                              <Label htmlFor="website" className="text-sm font-semibold text-gray-700 block">
                                Website URL
                              </Label>
                              <Input
                                id="website"
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                placeholder="https://yourwebsite.com"
                                className="h-12 text-base"
                              />
                            </div>
                          )}
                          {landingConfig?.form_config?.fields?.includes('message') && (
                            <div className="space-y-2">
                              <Label htmlFor="message" className="text-sm font-semibold text-gray-700 block">
                                Message
                              </Label>
                              <Textarea
                                id="message"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Tell us more about your needs..."
                                rows={4}
                                className="text-base resize-none"
                              />
                            </div>
                          )}
                          <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            {landingConfig?.form_type === 'signup' ? 'Create Account & Get Referral Link' : 'Submit Information'}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Hero Image Below */}
              {landingConfig?.hero_image_url && (
                <div className="mb-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                  <img
                    src={landingConfig.hero_image_url}
                    alt="Hero"
                    className="w-full max-w-2xl mx-auto rounded-2xl shadow-2xl border border-white/20"
                  />
                </div>
              )}
            </>
          )}

          {/* Features Grid */}
          {landingConfig?.features && landingConfig.features.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {landingConfig.features.map((feature: string, index: number) => (
                <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                  <div className="text-3xl mb-3">{feature.split(' ')[0]}</div>
                  <p className="text-sm font-medium leading-relaxed">{feature.substring(feature.indexOf(' ') + 1)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Gallery Section */}
          {landingConfig?.gallery_images && landingConfig.gallery_images.length > 0 && (
            <div className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">See Our Work</h2>
                <p className="text-lg opacity-90 max-w-2xl mx-auto">
                  Explore some of the amazing content created with OstrichAi
                </p>
              </div>
              <div className="relative max-w-5xl mx-auto">
                <Carousel className="w-full">
                  <CarouselContent>
                    {landingConfig.gallery_images.map((image: string, index: number) => (
                      <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-1">
                          <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-white/20">
                            <img
                              src={image}
                              alt={`Gallery image ${index + 1}`}
                              className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-4 bg-white/20 border-white/30 text-white hover:bg-white/30" />
                  <CarouselNext className="right-4 bg-white/20 border-white/30 text-white hover:bg-white/30" />
                </Carousel>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button
              onClick={handleContinue}
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-4 text-lg rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              {landingConfig?.primary_cta || "Start Creating Now"}
              <ExternalLink className="ml-2 h-5 w-5" />
            </Button>
            {landingConfig?.secondary_cta && (
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-4 text-lg rounded-xl"
              >
                {landingConfig.secondary_cta}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Referral Competition Section */}
      <div className="relative z-10 container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">🎯 Join the Competition!</h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                Share your unique referral link, bring friends to OstrichAi, and compete for amazing rewards.
                The more people you refer, the higher you climb on the leaderboard!
              </p>
            </div>

            {/* Form Section */}
            {showForm && !formSubmitted && (
              <div className="max-w-xl mx-auto mb-8">
                <Card className="bg-white/95 backdrop-blur-md border-white/20 shadow-2xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-center text-gray-900 text-2xl font-bold">
                      Join The Competition
                    </CardTitle>
                    <CardDescription className="text-center text-gray-600 text-base">
                      {landingConfig?.form_type === 'signup'
                        ? 'Create your account and get your referral link to start earning rewards!'
                        : 'Tell us about yourself and we\'ll get back to you!'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      {/* Default fields - always show email and full_name if not configured */}
                      {(!landingConfig?.form_config?.fields || landingConfig.form_config.fields.includes('full_name') || landingConfig.form_config.fields.length === 0) && (
                        <div className="space-y-2">
                          <Label htmlFor="full_name" className="text-sm font-semibold text-gray-700 block">
                            Full Name *
                          </Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="Enter your full name"
                            className="h-12 text-base"
                            required
                          />
                        </div>
                      )}
                      {(!landingConfig?.form_config?.fields || landingConfig.form_config.fields.includes('email') || landingConfig.form_config.fields.length === 0) && (
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-semibold text-gray-700 block">
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Enter your email address"
                            className="h-12 text-base"
                            required
                          />
                        </div>
                      )}
                      {landingConfig?.form_config?.fields?.includes('company') && (
                        <div className="space-y-2">
                          <Label htmlFor="company" className="text-sm font-semibold text-gray-700 block">
                            Company Name
                          </Label>
                          <Input
                            id="company"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            placeholder="Enter your company name"
                            className="h-12 text-base"
                          />
                        </div>
                      )}
                      {landingConfig?.form_config?.fields?.includes('phone') && (
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 block">
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Enter your phone number"
                            className="h-12 text-base"
                          />
                        </div>
                      )}
                      {landingConfig?.form_config?.fields?.includes('website') && (
                        <div className="space-y-2">
                          <Label htmlFor="website" className="text-sm font-semibold text-gray-700 block">
                            Website URL
                          </Label>
                          <Input
                            id="website"
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            placeholder="https://yourwebsite.com"
                            className="h-12 text-base"
                          />
                        </div>
                      )}
                      {landingConfig?.form_config?.fields?.includes('message') && (
                        <div className="space-y-2">
                          <Label htmlFor="message" className="text-sm font-semibold text-gray-700 block">
                            Message
                          </Label>
                          <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Tell us more about your needs..."
                            rows={4}
                            className="text-base resize-none"
                          />
                        </div>
                      )}
                      <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {landingConfig?.form_type === 'signup' ? 'Create Account & Get Referral Link' : 'Submit Information'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            {formSubmitted && (
              /* Thank You Page */
              <div className="max-w-2xl mx-auto mb-8">
                <Card className="bg-white/95 backdrop-blur-md border-white/20">
                  <CardContent className="pt-8">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        {landingConfig?.thank_you_page?.title || "Welcome to the Team!"}
                      </h2>
                      <p className="text-xl text-gray-600 mb-6">
                        {landingConfig?.thank_you_page?.subtitle || "Your referral link has been generated"}
                      </p>
                      <p className="text-gray-600 mb-8">
                        {landingConfig?.thank_you_page?.description || "Share this link to start earning rewards and climb the leaderboard!"}
                      </p>

                      {landingConfig?.thank_you_page?.show_referral_link && generatedReferralLink && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Your Referral Link:</Label>
                          <div className="flex items-center space-x-2">
                            <Input value={generatedReferralLink} readOnly className="flex-1" />
                            <Button onClick={() => copyToClipboard(generatedReferralLink)} variant="outline" size="sm">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex justify-center space-x-2 mt-3">
                            <Button onClick={() => shareOnSocial('twitter', generatedReferralLink)} variant="outline" size="sm">
                              Twitter
                            </Button>
                            <Button onClick={() => shareOnSocial('facebook', generatedReferralLink)} variant="outline" size="sm">
                              Facebook
                            </Button>
                            <Button onClick={() => shareOnSocial('linkedin', generatedReferralLink)} variant="outline" size="sm">
                              LinkedIn
                            </Button>
                          </div>
                        </div>
                      )}

                      {landingConfig?.thank_you_page?.show_points_info && userPoints && (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{userPoints.totalClicks}</div>
                            <div className="text-sm text-gray-600">Clicks</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{userPoints.totalConversions}</div>
                            <div className="text-sm text-gray-600">Conversions</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{userPoints.totalPoints}</div>
                            <div className="text-sm text-gray-600">Points</div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-center space-x-4">
                        <Button onClick={() => navigate('/dashboard')} className="px-6">
                          Go to Dashboard
                        </Button>
                        {landingConfig?.thank_you_page?.redirect_url && (
                          <Button variant="outline" onClick={() => window.location.href = landingConfig.thank_you_page.redirect_url} className="px-6">
                            Continue
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Share Your Link</h3>
                <p className="text-sm opacity-80">Get your personalized referral link after signing up</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Earn Points</h3>
                <p className="text-sm opacity-80">Points for every click and successful referral</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Win Rewards</h3>
                <p className="text-sm opacity-80">Unlock exclusive rewards and climb the leaderboard</p>
              </div>
            </div>

            {/* Referral Status */}
            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <h3 className="text-xl font-semibold">Referral Tracked Successfully!</h3>
              </div>

              {referrer && (
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {referrer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm opacity-90">Referred by</p>
                    <p className="font-medium">{referrer.name}</p>
                  </div>
                </div>
              )}

              <div className="text-center">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 mb-4">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Click Recorded
                </Badge>

                <p className="text-sm opacity-80 mb-4">
                  {user
                    ? "Welcome back! Your referral progress is being tracked."
                    : "Complete your signup to get your unique referral link and start competing for rewards!"
                  }
                </p>

                {!user && (
                  <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-lg p-4 mb-6 border border-yellow-400/30">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Trophy className="h-5 w-5 text-yellow-300" />
                      <span className="font-semibold text-yellow-200">Get Your Referral Link!</span>
                    </div>
                    <p className="text-xs opacity-90">
                      After signup and email verification, you'll receive a unique referral link to share and earn points for every successful referral.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleContinue}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  {user ? 'View My Referral Link' :
                    (landingConfig?.form_config?.show_form_on_click ? 'Sign Up & Get Referral Link' : 'Continue to Sign Up')}
                  <LinkIcon className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-8 opacity-70">
        <p className="text-sm">
          By continuing, you agree to our{' '}
          <a href="/privacy-policy" className="underline hover:no-underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy-policy" className="underline hover:no-underline">Privacy Policy</a>
        </p>
      </div>

      {/* Custom CSS */}
      {landingConfig?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: landingConfig.custom_css }} />
      )}
    </div>
  );
};

export default ReferralLanding;
