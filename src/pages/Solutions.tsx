'use client';

import React, { useState, useEffect } from 'react';
import { useCurrency } from '@/lib/currencyUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bot,
  DollarSign,
  Globe,
  TrendingUp,
  Zap,
  Crown,
  CheckCircle,
  ArrowRight,
  Clock,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  Code,
  BarChart3,
  Search,
  Target,
  Smartphone,
  Settings,
  Shield,
  Headphones,
  Award,
  Rocket
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';

const Solutions = () => {
  const [lostRevenue, setLostRevenue] = useState(15000);
  const [monthlyLeads, setMonthlyLeads] = useState(100);
  const [avgDealValue, setAvgDealValue] = useState(5000);
  const [currentResponseTime, setCurrentResponseTime] = useState(24);
  const { currency, formatCurrency, convertAndFormat } = useCurrency();
  const [expandedService, setExpandedService] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const startCounter = () => {
      interval = setInterval(() => {
        setLostRevenue(prev => {
          const increment = Math.floor(Math.random() * 50) + 25;
          return prev + increment;
        });
      }, 1000);
    };
    startCounter();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const calculateROI = () => {
    const currentConversionRate = 0.02; // 2% baseline
    const improvedConversionRate = 0.047; // 4.7% with AI (47% improvement)
    const localAvgDealValue = currency.code === 'USD' ? avgDealValue : avgDealValue * 1650;
    const currentRevenue = monthlyLeads * currentConversionRate * localAvgDealValue * 12;
    const improvedRevenue = monthlyLeads * improvedConversionRate * localAvgDealValue * 12;
    const additionalRevenue = improvedRevenue - currentRevenue;
    const monthlyCost = currency.code === 'USD' ? 1000 : 1000 * 1650;
    return {
      currentRevenue,
      improvedRevenue,
      additionalRevenue,
      roiMultiplier: Math.round(additionalRevenue / (monthlyCost * 12)) || 0
    };
  };

  const roi = calculateROI();

  const services = [
    {
      id: 'web-design',
      icon: <Globe className="h-8 w-8 text-blue-600" />,
      title: 'Customized Web Design',
      shortDesc: 'Professional, responsive websites that convert visitors into customers',
      fullDesc: 'We create stunning, mobile-responsive websites tailored to your brand and business goals. Our designs focus on user experience, conversion optimization, and modern aesthetics that make your business stand out online.',
      features: [
        'Custom responsive design',
        'Mobile-first approach',
        'SEO-optimized structure',
        'Fast loading speeds',
        'Brand-aligned aesthetics',
        'User experience optimization',
        'Content management system',
        'E-commerce integration'
      ],
      pricing: 'Custom Quote',
      timeline: '2-4 weeks',
      color: 'blue',
      popular: false
    },
    {
      id: 'ai-automation',
      icon: <Bot className="h-8 w-8 text-purple-600" />,
      title: 'AI Business Automation Setup',
      shortDesc: 'Streamline operations with intelligent automation solutions',
      fullDesc: 'Transform your business processes with AI-powered automation. From lead qualification to customer support, we implement smart systems that work 24/7 to grow your business.',
      features: [
        'OstrichAi AI lead response',
        'Custom automation workflows',
        'CRM integration',
        'Real-time analytics dashboard',
        'Multi-channel communication',
        'Performance monitoring',
        'AI chatbot implementation',
        'Process optimization'
      ],
      pricing: 'Custom Pricing',
      timeline: '48 hours setup',
      color: 'purple',
      popular: true
    },
    {
      id: 'lead-generation',
      icon: <Target className="h-8 w-8 text-green-600" />,
      title: 'Lead Generation & Management',
      shortDesc: 'Advanced lead generation with AI-powered qualification and nurturing',
      fullDesc: 'Comprehensive lead generation system that finds, qualifies, and nurtures prospects automatically. Our advanced web scraping and AI qualification ensures you only get high-quality leads.',
      features: [
        'Google Maps business scraping',
        'Advanced lead qualification',
        'Automated lead nurturing',
        'Multi-source lead capture',
        'Lead scoring and prioritization',
        'CRM integration',
        'Performance analytics',
        'Custom lead funnels'
      ],
      pricing: 'Custom Pricing',
      timeline: '1 week setup',
      color: 'green',
      popular: false
    },
    {
      id: 'dashboard-analytics',
      icon: <BarChart3 className="h-8 w-8 text-orange-600" />,
      title: 'Business Intelligence Dashboard',
      shortDesc: 'Real-time analytics and insights for data-driven decisions',
      fullDesc: 'Custom dashboards that provide real-time insights into your business performance. Track leads, monitor campaigns, analyze customer behavior, and make informed decisions with our comprehensive analytics platform.',
      features: [
        'Real-time data visualization',
        'Custom KPI tracking',
        'Lead performance metrics',
        'Campaign analytics',
        'Customer behavior insights',
        'Automated reporting',
        'Mobile-responsive design',
        'Data export capabilities'
      ],
      pricing: 'Custom Pricing',
      timeline: '1-2 weeks',
      color: 'orange',
      popular: false
    },
    {
      id: 'digital-marketing',
      icon: <TrendingUp className="h-8 w-8 text-red-600" />,
      title: 'Digital Marketing Automation',
      shortDesc: 'Comprehensive digital marketing campaigns with automation',
      fullDesc: 'End-to-end digital marketing solutions including SEO, social media management, email marketing, and paid advertising campaigns. All automated and optimized for maximum ROI.',
      features: [
        'SEO optimization',
        'Social media automation',
        'Email marketing campaigns',
        'PPC campaign management',
        'Content creation',
        'Marketing analytics',
        'Lead magnet creation',
        'Conversion optimization'
      ],
      pricing: 'Custom Pricing',
      timeline: '1-3 weeks setup',
      color: 'red',
      popular: false
    },
    {
      id: 'mobile-apps',
      icon: <Smartphone className="h-8 w-8 text-indigo-600" />,
      title: 'Mobile App Development',
      shortDesc: 'Native and cross-platform mobile applications',
      fullDesc: 'Custom mobile applications for iOS and Android that extend your business reach. From simple business apps to complex enterprise solutions, we build apps that engage your customers.',
      features: [
        'iOS and Android development',
        'Cross-platform solutions',
        'Native performance',
        'Push notifications',
        'Offline functionality',
        'App store optimization',
        'Analytics integration',
        'Maintenance and updates'
      ],
      pricing: 'Custom Quote',
      timeline: '6-12 weeks',
      color: 'indigo',
      popular: false
    }
  ];

  const toggleExpanded = (serviceId: string) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'border-blue-200 bg-blue-50',
      purple: 'border-purple-200 bg-purple-50',
      green: 'border-green-200 bg-green-50',
      orange: 'border-orange-200 bg-orange-50',
      red: 'border-red-200 bg-red-50',
      indigo: 'border-indigo-200 bg-indigo-50'
    };
    return colorMap[color as keyof typeof colorMap] || 'border-gray-200 bg-gray-50';
  };

  const stats = [
    { number: "500+", label: "Projects Completed", icon: <Award className="h-6 w-6" /> },
    { number: "98%", label: "Client Satisfaction", icon: <Star className="h-6 w-6" /> },
    { number: "24/7", label: "Support Available", icon: <Headphones className="h-6 w-6" /> },
    { number: "48hr", label: "Average Setup Time", icon: <Clock className="h-6 w-6" /> }
  ];

  return (
    <Layout>
      <SEO
        title="AI Solutions & Revenue Recovery | OstrichAi"
        description="Discover how OstrichAi's intelligent solutions, from instant lead response to custom automation, recover lost revenue and accelerate business growth."
      />
      {/* Hero Section */}
      <section className="relative py-24 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-screen-xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
              <Crown className="h-4 w-4" />
              <span>Professional Services by OstrichAi</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Transform Your Business with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary block animate-pulse">
                Expert Solutions
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              From custom web design to AI automation, we provide comprehensive digital solutions
              that drive growth and streamline your operations.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-screen-xl mx-auto mt-12">
              {stats.map((stat, index) => (
                <div key={index} className="bg-card/60 backdrop-blur-xl rounded-2xl p-6 border border-border/50 hover:bg-card/80 transition-all duration-300">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4 mx-auto">
                    <div className="text-primary">{stat.icon}</div>
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">{stat.number}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-12 sm:py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              The Hidden Cost of Slow Lead Response
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Every minute you wait to respond to a lead, your conversion rate drops dramatically.
              Here's what slow response times are really costing you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 sm:mb-16">
            <Card className="bg-card/60 backdrop-blur-xl border-border/50 text-center p-6 hover:shadow-lg hover:bg-card/80 hover:border-primary/30 transition-all">
              <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-red-600 mb-2">78%</h3>
              <p className="text-muted-foreground">of leads go to the first responder</p>
            </Card>

            <Card className="bg-card/60 backdrop-blur-xl border-border/50 text-center p-6 hover:shadow-lg hover:bg-card/80 hover:border-primary/30 transition-all">
              <div className="bg-orange-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-orange-600 mb-2">50%</h3>
              <p className="text-muted-foreground">conversion rate drop after 5 minutes</p>
            </Card>

            <Card className="bg-card/60 backdrop-blur-xl border-border/50 text-center p-6 hover:shadow-lg hover:bg-card/80 hover:border-primary/30 transition-all">
              <div className="bg-yellow-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-yellow-600 mb-2">35%</h3>
              <p className="text-muted-foreground">of leads never get contacted</p>
            </Card>

            <Card className="bg-card/60 backdrop-blur-xl border-border/50 text-center p-6 hover:shadow-lg hover:bg-card/80 hover:border-primary/30 transition-all">
              <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-red-600 mb-2">{convertAndFormat(50000)}+</h3>
              <p className="text-muted-foreground">average monthly revenue lost</p>
            </Card>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section id="roi-calculator" className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              Calculate Your Revenue Recovery
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              See exactly how much revenue you could recover with OstrichAi's instant lead response.
            </p>
          </div>

          <div className="max-w-screen-xl mx-auto">
            <Card className="bg-card/60 backdrop-blur-xl border-border/50 p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-6">Your Business Metrics</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Monthly Leads
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="1000"
                        value={monthlyLeads}
                        onChange={(e) => setMonthlyLeads(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>50</span>
                        <span className="font-semibold">{monthlyLeads}</span>
                        <span>1000+</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Average Deal Value
                      </label>
                      <input
                        type="range"
                        min="1000"
                        max="50000"
                        step="1000"
                        value={avgDealValue}
                        onChange={(e) => setAvgDealValue(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>{convertAndFormat(1000)}</span>
                        <span className="font-semibold">{convertAndFormat(avgDealValue)}</span>
                        <span>{convertAndFormat(50000)}+</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Current Response Time (hours)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="72"
                        value={currentResponseTime}
                        onChange={(e) => setCurrentResponseTime(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>1hr</span>
                        <span className="font-semibold">{currentResponseTime}hrs</span>
                        <span>72hrs+</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6 rounded-2xl border border-border/30">
                  <h3 className="text-2xl font-bold text-foreground mb-6">Your Revenue Recovery</h3>
                  <div className="space-y-4">
                    <div className="bg-card/60 backdrop-blur-xl border border-border/30 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Current Annual Revenue</div>
                      <div className="text-2xl font-bold text-foreground">
                        {formatCurrency(roi.currentRevenue)}
                      </div>
                    </div>
                    <div className="bg-card/60 backdrop-blur-xl border border-border/30 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">With OstrichAi</div>
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(roi.improvedRevenue)}
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-primary to-accent p-4 rounded-lg text-white">
                      <div className="text-sm opacity-90">Additional Annual Revenue</div>
                      <div className="text-3xl font-bold">
                        +{formatCurrency(roi.additionalRevenue)}
                      </div>
                      <div className="text-sm opacity-90 mt-1">
                        {roi.roiMultiplier}x ROI in first year
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Our Professional Services
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive digital solutions designed to accelerate your business growth
              and optimize your operations with cutting-edge technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {services.map((service) => (
              <Card
                key={service.id}
                className={`relative overflow-hidden hover:shadow-xl transition-all duration-300 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 hover:border-primary/30 ${service.popular ? 'ring-2 ring-primary/50 border-primary/30' : ''
                  }`}
              >
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl group-hover:scale-110 transition-all">
                      {service.icon}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Price</div>
                      <div className="font-bold text-lg">{service.pricing}</div>
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {service.shortDesc}
                  </p>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Timeline */}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{service.timeline}</span>
                    </div>

                    {/* Features Preview */}
                    <div className="space-y-2">
                      {service.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {service.features.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          +{service.features.length - 3} more features
                        </div>
                      )}
                    </div>

                    {/* Expand/Collapse Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpanded(service.id)}
                      className="w-full mt-4"
                    >
                      {expandedService === service.id ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Learn More
                        </>
                      )}
                    </Button>

                    {/* Expanded Content */}
                    {expandedService === service.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 animate-in slide-in-from-top-2">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {service.fullDesc}
                        </p>

                        <div>
                          <h4 className="font-semibold text-sm mb-2">All Features:</h4>
                          <div className="grid grid-cols-1 gap-1">
                            {service.features.map((feature, index) => (
                              <div key={index} className="flex items-center text-sm">
                                <CheckCircle className="h-3 w-3 text-green-600 mr-2 flex-shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CTA Button */}
                    <Link to="/services-request">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Request This Service
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="features" className="py-20 px-4 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get up and running in 48 hours with our proven implementation process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-primary/20">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Setup & Integration</h3>
              <p className="text-muted-foreground text-sm">
                We connect to your CRM, website forms, and lead sources.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-primary/20">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">AI Training</h3>
              <p className="text-muted-foreground text-sm">
                OstrichAi learns your qualification criteria, brand voice, and sales process.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-primary/20">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Go Live</h3>
              <p className="text-muted-foreground text-sm">
                OstrichAi starts responding to leads instantly while you monitor.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-primary/20">
                <span className="text-2xl font-bold text-primary">4</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Scale & Optimize</h3>
              <p className="text-muted-foreground text-sm">
                Continuous improvement based on performance data and feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Why Choose OstrichAi?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're not just another service provider. We're your technology partner
              committed to your long-term success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <Zap className="h-10 w-10 text-primary" />,
                title: "Lightning Fast Delivery",
                description: "Most projects completed within 48 hours to 4 weeks, depending on complexity."
              },
              {
                icon: <Shield className="h-10 w-10 text-green-600" />,
                title: "Performance Promise",
                description: "We stand behind our work with a comprehensive performance commitment."
              },
              {
                icon: <Users className="h-10 w-10 text-blue-600" />,
                title: "Expert Team",
                description: "Experienced professionals with 10+ years in web development and AI automation."
              },
              {
                icon: <Headphones className="h-10 w-10 text-purple-600" />,
                title: "24/7 Support",
                description: "Round-the-clock support to ensure your systems run smoothly at all times."
              },
              {
                icon: <TrendingUp className="h-10 w-10 text-red-600" />,
                title: "Proven Results",
                description: "Our clients see an average of 47% increase in qualified leads within 60 days."
              },
              {
                icon: <Award className="h-10 w-10 text-indigo-600" />,
                title: "Industry Recognition",
                description: "Award-winning solutions trusted by 500+ businesses worldwide."
              }
            ].map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto bg-card/60 backdrop-blur-xl rounded-3xl p-12 border border-border/50 shadow-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              <span>Start Your Journey</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Join 500+ companies that have already transformed their operations with our
              professional services. Get started today with a consultation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/solutions-request">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all">
                  Request Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border hover:bg-secondary/80 px-8 py-4 text-lg"
                >
                  Get Consultation
                  <Zap className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 pt-8 border-t border-border/30">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground">500+</div>
                  <div className="text-muted-foreground text-sm">Happy Clients</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">98%</div>
                  <div className="text-muted-foreground text-sm">Success Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">24/7</div>
                  <div className="text-muted-foreground text-sm">Support</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">10+</div>
                  <div className="text-muted-foreground text-sm">Years Experience</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-secondary/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get answers to common questions about our services and process.
            </p>
          </div>

          <div className="max-w-screen-xl mx-auto space-y-4">
            {[
              {
                question: "How long does it take to complete a project?",
                answer: "Project timelines vary depending on complexity. Simple websites take 2-4 weeks, while AI automation setups can be completed in 48 hours. We provide detailed timelines during our initial consultation."
              },
              {
                question: "Do you provide ongoing support after project completion?",
                answer: "Yes! We offer 24/7 support and maintenance packages to ensure your systems continue running smoothly. Our support includes updates, monitoring, and technical assistance."
              },
              {
                question: "Can you integrate with our existing systems?",
                answer: "Absolutely. We specialize in seamless integrations with popular CRMs, marketing platforms, and business tools. We'll assess your current setup and recommend the best integration approach."
              },
              {
                question: "What makes your AI automation different?",
                answer: "Our OstrichAi AI is specifically trained for lead qualification and response. It learns your business requirements and responds to leads with personalized messages in under 60 seconds, 24/7."
              },
              {
                question: "Do you offer custom pricing for enterprise clients?",
                answer: "Yes, we offer flexible pricing packages for enterprise clients with multiple projects or ongoing needs. Contact us for a custom quote based on your specific requirements."
              }
            ].map((faq, index) => (
              <Card key={index} className="overflow-hidden bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                <button
                  onClick={() => toggleExpanded(`faq-${index}`)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-secondary/50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-foreground pr-4">
                    {faq.question}
                  </h3>
                  {expandedService === `faq-${index}` ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {expandedService === `faq-${index}` && (
                  <div className="px-6 pb-6">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg">
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="font-bold text-base sm:text-lg">
                  <span className="hidden xs:inline">OstrichAi </span>King
                </span>
              </div>
              <p className="text-gray-400 mb-4 text-sm">
                Transforming lead response with OstrichAi to help businesses capture more revenue
                and accelerate growth.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                  </svg>
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Services</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/solutions#web-design" className="hover:text-white transition-colors">Web Design</Link></li>
                <li><Link to="/solutions#ai-automation" className="hover:text-white transition-colors">AI Automation</Link></li>
                <li><Link to="/solutions#lead-generation" className="hover:text-white transition-colors">Lead Generation</Link></li>
                <li><Link to="/solutions#dashboard-analytics" className="hover:text-white transition-colors">Analytics Dashboard</Link></li>
                <li><Link to="/solutions#digital-marketing" className="hover:text-white transition-colors">Digital Marketing</Link></li>
                <li><Link to="/solutions#mobile-apps" className="hover:text-white transition-colors">Mobile Apps</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/solutions" className="hover:text-white transition-colors">Services</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/free-trial" className="hover:text-white transition-colors">Get Started</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 sm:pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 mb-4 md:mb-0 text-sm">
                © 2024 OstrichAi Limited. All rights reserved.
              </div>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-gray-400 text-sm">
                <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link to="#" className="hover:text-white transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </Layout>
  );
};

export default Solutions;
