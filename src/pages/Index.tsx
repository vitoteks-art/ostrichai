import Layout from "@/components/Layout";
import { Sparkles, Video, Search, Image, BarChart3, Edit, FileImage, Target, Zap, Shield, Clock, ArrowRight, Play, Palette, Wand2, MessageCircle, Rocket, SquarePen, ChartColumn, Users, TrendingUp, Award, Globe, Hash, Activity, Crown, Star, CheckCircle, BookOpen, Youtube, FileText, PenTool, Type, Map, Scissors, Mic, MonitorSpeaker, Layers, Box, Megaphone, ChevronRight, Check, HelpCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "../contexts/SubscriptionContext";
import SEO from "@/components/SEO";
import { useState } from "react";

const Index = () => {
  const { canAccess } = useSubscription();
  const [activeCategory, setActiveCategory] = useState<'all' | 'video' | 'design' | 'social' | 'research'>('all');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Categorized features
  const features = [
    {
      icon: Video,
      title: "AI Video Generation",
      description: "Transform static images into dynamic videos with advanced AI technology",
      link: "/video-creation",
      color: "bg-blue-500/20 text-blue-400",
      premium: true,
      requiredPlan: "Professional",
      category: "video"
    },
    {
      icon: MonitorSpeaker,
      title: "Video UGC Creator",
      description: "Create engaging user-generated content videos with AI-powered storytelling",
      link: "/video-ugc",
      color: "bg-teal-500/20 text-teal-400",
      premium: true,
      requiredPlan: "Professional",
      category: "video"
    },
    {
      icon: Mic,
      title: "Video Lipsync",
      description: "Create realistic lip-sync videos with AI-powered voice and facial animation",
      link: "/video-lipsync",
      color: "bg-orange-500/20 text-orange-400",
      premium: true,
      requiredPlan: "Professional",
      category: "video"
    },
    {
      icon: Palette,
      title: "Logo Creation",
      description: "Generate professional brand logos with AI-powered design intelligence",
      link: "/logo-creation",
      color: "bg-indigo-500/20 text-indigo-400",
      category: "design"
    },
    {
      icon: Scissors,
      title: "Background Remover",
      description: "Remove backgrounds from images with AI precision for clean, professional results",
      link: "/background-remover",
      color: "bg-cyan-500/20 text-cyan-400",
      category: "design"
    },
    {
      icon: Image,
      title: "Image Ad Creative",
      description: "Create stunning advertising visuals with AI-powered design tools",
      link: "/image-creative",
      color: "bg-purple-500/20 text-purple-400",
      category: "design"
    },
    {
      icon: FileImage,
      title: "Flyer Designer",
      description: "Create eye-catching flyers and promotional materials effortlessly",
      link: "/flyer-designer",
      color: "bg-pink-500/20 text-pink-400",
      category: "design"
    },
    {
      icon: SquarePen,
      title: "Image Editor",
      description: "Professional image editing with dual-image comparison tools",
      link: "/two-image-editor",
      color: "bg-orange-500/20 text-orange-400",
      category: "design"
    },
    {
      icon: Hash,
      title: "Social Media Post",
      description: "Generate engaging social media content with AI-powered copywriting and visuals",
      link: "/social-media-post",
      color: "bg-emerald-500/20 text-emerald-400",
      category: "social"
    },
    {
      icon: Target,
      title: "Ads Creative Suite",
      description: "Design compelling advertisements that convert and engage audiences",
      link: "/ads-creative",
      color: "bg-green-500/20 text-green-400",
      category: "social"
    },
    {
      icon: Activity,
      title: "Task Status",
      description: "Monitor and track the progress of your AI-generated content projects",
      link: "/status",
      color: "bg-teal-500/20 text-teal-400",
      category: "social"
    },
    {
      icon: BookOpen,
      title: "Blog Research",
      description: "Generate comprehensive blog content and research with AI-powered insights",
      link: "/blog-research",
      color: "bg-amber-500/20 text-amber-400",
      category: "research"
    },
    {
      icon: Youtube,
      title: "YouTube Research",
      description: "Analyze YouTube videos and channels for content research and insights",
      link: "/youtube-research",
      color: "bg-red-500/20 text-red-400",
      category: "research"
    },
    {
      icon: FileText,
      title: "YouTube Script",
      description: "Create engaging YouTube scripts with AI-powered content generation",
      link: "/youtube-script",
      color: "bg-slate-500/20 text-slate-400",
      category: "research"
    },
    {
      icon: PenTool,
      title: "Enhanced YouTube Script",
      description: "Generate advanced YouTube scripts with enhanced AI creativity",
      link: "/enhanced-youtube-script",
      color: "bg-violet-500/20 text-violet-400",
      category: "research"
    },
    {
      icon: Type,
      title: "YouTube Title Generator",
      description: "Create compelling YouTube titles that drive clicks and engagement",
      link: "/youtube-title-gen",
      color: "bg-rose-500/20 text-rose-400",
      category: "research"
    },
    {
      icon: BarChart3,
      title: "Revenue Audit",
      description: "Analyze your revenue potential and identify hidden opportunities with AI-powered insights",
      link: "/revenue-audit",
      color: "bg-green-600/20 text-green-600",
      category: "research"
    },
    {
      icon: Map,
      title: "Google Maps Scraper",
      description: "Extract business data and insights from Google Maps listings",
      link: "/google-maps-scraping",
      color: "bg-lime-500/20 text-lime-400",
      category: "research"
    }
  ];

  const filteredFeatures = activeCategory === 'all'
    ? features
    : features.filter(f => f.category === activeCategory);

  const useCases = [
    {
      icon: Rocket,
      title: "For Startups",
      description: "Build your brand presence from day one without hiring a full design team",
      benefits: ["Professional content from scratch", "Cost-effective branding", "Scale as you grow"],
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Users,
      title: "For Creators",
      description: "Produce 10x more content in the same time and grow your audience faster",
      benefits: ["Batch create social posts", "Multiple platform support", "Consistent quality"],
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Megaphone,
      title: "For Agencies",
      description: "Serve multiple clients efficiently with scalable AI-powered tools",
      benefits: ["Manage client projects", "White-label solutions", "Bulk content generation"],
      color: "from-orange-500 to-red-500"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      icon: Box,
      title: "Choose Your Tool",
      description: "Select from 18+ AI-powered tools based on your content needs"
    },
    {
      step: "2",
      icon: Edit,
      title: "Input Your Ideas",
      description: "Provide your brief, upload assets, or describe what you want to create"
    },
    {
      step: "3",
      icon: Sparkles,
      title: "AI Generates",
      description: "Our advanced AI processes your input and creates professional content in seconds"
    },
    {
      step: "4",
      icon: ArrowRight,
      title: "Download & Publish",
      description: "Get your content ready to use, or publish directly to social platforms"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director",
      company: "TechStart Inc",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      rating: 5,
      text: "OstrichAi cut our content production time by 70%. We went from struggling to post 3 times a week to daily posts across all platforms."
    },
    {
      name: "Michael Chen",
      role: "Content Creator",
      company: "@michaelcreates",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      rating: 5,
      text: "As a solo creator, this is a game-changer. The video tools alone saved me thousands in production costs."
    },
    {
      name: "Emily Rodriguez",
      role: "Agency Owner",
      company: "Creative Dynamics",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
      rating: 5,
      text: "We increased our client capacity by 3x without hiring more designers. The ROI has been incredible."
    }
  ];

  const faqs = [
    {
      question: "How do credits work?",
      answer: "Each AI tool costs a certain number of credits based on complexity. Simple tasks like social posts cost 1 credit, while advanced video generation costs 6 credits. Your plan includes monthly credits, and you can purchase more if needed."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes! You can cancel your subscription at any time. There are no long-term contracts or cancellation fees. Your credits will remain available until the end of your billing period."
    },
    {
      question: "What platforms do you integrate with?",
      answer: "We integrate with major social platforms including Facebook, Instagram, Twitter/X, LinkedIn, and more. You can connect your accounts and publish directly from OstrichAi."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use enterprise-grade encryption and security measures. Your data is stored securely, and we never share your information with third parties. We're SOC 2 compliant and maintain 99.9% uptime."
    },
    {
      question: "Do I need design skills to use OstrichAi?",
      answer: "Not at all! Our AI tools are designed for everyone, regardless of design experience. Simply describe what you want, and our AI handles the creative work. No technical or design skills required."
    },
    {
      question: "Can I try before I buy?",
      answer: "Yes! Every new user gets 20 free credits to test all our features. No credit card required for the trial. You can explore all tools and see the quality yourself."
    }
  ];

  const stats = [
    { number: "50K+", label: "Active Creators", icon: Users },
    { number: "2M+", label: "Content Generated", icon: TrendingUp },
    { number: "99.9%", label: "Uptime", icon: Award },
    { number: "150+", label: "Countries", icon: Globe }
  ];

  const platforms = [
    { name: "Facebook", icon: "📘" },
    { name: "Instagram", icon: "📷" },
    { name: "Twitter", icon: "🐦" },
    { name: "LinkedIn", icon: "💼" },
    { name: "YouTube", icon: "▶️" },
    { name: "TikTok", icon: "🎵" }
  ];

  return (
    <Layout>
      <SEO
        title="OstrichAi - Your All-in-One AI Studio for Social Media & Advertising | 50K+ Creators"
        description="Create stunning social media content, ads, and videos 10x faster with AI. Join 50,000+ creators using OstrichAi's 18+ AI-powered tools. Start free, no credit card required."
      />
      <div className="container mx-auto px-2 sm:px-4">
        {/* Enhanced Hero Section */}
        <section className="relative py-12 md:py-20 lg:py-28 px-2 sm:px-4">
          <div className="container mx-auto text-center">
            <div className="max-w-screen-xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20 animate-pulse">
                <Crown className="h-4 w-4" />
                <span>Trusted by 50,000+ Creators Worldwide</span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6 leading-tight">
                Your All-in-One
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary block mt-2">
                  AI Creative Studio
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                Create professional social media content, ads, and videos <span className="text-primary font-semibold">10x faster</span> with AI.
                No design skills needed.
              </p>

              {/* Key Metrics Badges */}
              <div className="flex flex-wrap gap-4 justify-center mb-10">
                <Badge variant="secondary" className="px-4 py-2 text-sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Save 20+ hours/week
                </Badge>
                <Badge variant="secondary" className="px-4 py-2 text-sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  18+ AI Tools
                </Badge>
                <Badge variant="secondary" className="px-4 py-2 text-sm">
                  <Shield className="h-4 w-4 mr-2" />
                  No credit card to start
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                  asChild
                >
                  <Link to="/video-creation">
                    <Rocket className="mr-2 h-5 w-5" />
                    Start Creating Free
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-border hover:bg-secondary/80 px-10 py-6 text-lg"
                  onClick={() => document.getElementById('demo-video')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              <p className="text-xs md:text-sm text-muted-foreground mt-4 md:mt-6 px-4">
                ✨ 20 free credits • No credit card • Cancel anytime
              </p>
            </div>
          </div>
        </section>

        {/* Trust Bar - Platform Integrations */}
        <section className="py-12 bg-secondary/20 border-y border-border/50">
          <div className="container mx-auto px-2 sm:px-4">
            <p className="text-center text-sm text-muted-foreground mb-6 font-medium">
              SEAMLESSLY INTEGRATES WITH YOUR FAVORITE PLATFORMS
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              {platforms.map((platform, idx) => (
                <div key={idx} className="flex items-center gap-2 text-2xl opacity-70 hover:opacity-100 transition-opacity">
                  <span>{platform.icon}</span>
                  <span className="text-sm font-medium text-foreground">{platform.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 px-2 sm:px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Built for Every Creator
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Whether you're starting out or scaling up, OstrichAi adapts to your needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
              {useCases.map((useCase, index) => (
                <Card key={index} className="relative overflow-hidden bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300 group">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${useCase.color}`}></div>
                  <CardContent className="p-6 md:p-8">
                    <div className={`flex items-center justify-center w-16 h-16 bg-gradient-to-br ${useCase.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
                      <useCase.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">{useCase.title}</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">{useCase.description}</p>
                    <ul className="space-y-3">
                      {useCase.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-2 sm:px-4 bg-secondary/10">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                How It Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                From idea to published content in 4 simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
              {howItWorks.map((step, index) => (
                <div key={index} className="relative">
                  <div className="text-center">
                    <div className="relative inline-block mb-4 md:mb-6">
                      <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full border-4 border-primary/20">
                        <step.icon className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                  </div>
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-8 md:mt-12 px-4">
              <Button size="lg" asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                <Link to="/video-creation">
                  Try It Now - It's Free
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Categorized Features Section */}
        <section id="features-section" className="py-20 px-2 sm:px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                18+ Powerful AI Tools
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to create professional content in one place
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8 md:mb-12 px-4">
              <Button
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveCategory('all')}
                className="rounded-full text-xs md:text-sm px-3 md:px-4 py-2"
              >
                <Layers className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">All Tools ({features.length})</span>
                <span className="sm:hidden">All ({features.length})</span>
              </Button>
              <Button
                variant={activeCategory === 'video' ? 'default' : 'outline'}
                onClick={() => setActiveCategory('video')}
                className="rounded-full text-xs md:text-sm px-3 md:px-4 py-2"
              >
                <Video className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Video Tools</span>
                <span className="sm:hidden">Video</span>
              </Button>
              <Button
                variant={activeCategory === 'design' ? 'default' : 'outline'}
                onClick={() => setActiveCategory('design')}
                className="rounded-full text-xs md:text-sm px-3 md:px-4 py-2"
              >
                <Palette className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Design Studio</span>
                <span className="sm:hidden">Design</span>
              </Button>
              <Button
                variant={activeCategory === 'social' ? 'default' : 'outline'}
                onClick={() => setActiveCategory('social')}
                className="rounded-full text-xs md:text-sm px-3 md:px-4 py-2"
              >
                <Hash className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Social & Ads</span>
                <span className="sm:hidden">Social</span>
              </Button>
              <Button
                variant={activeCategory === 'research' ? 'default' : 'outline'}
                onClick={() => setActiveCategory('research')}
                className="rounded-full text-xs md:text-sm px-3 md:px-4 py-2"
              >
                <Search className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Research & Content</span>
                <span className="sm:hidden">Research</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredFeatures.map((feature, index) => {
                const hasAccess = !feature.premium || canAccess(feature.premium === true ? 'videoGeneration' : 'logoDesign');

                return (
                  <div key={index} className="group">
                    {hasAccess ? (
                      <Link to={feature.link}>
                        <Card className="bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 hover:border-primary/30 transition-all duration-300 cursor-pointer h-full shadow-lg hover:shadow-xl">
                          <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                              <div className={`flex items-center justify-center w-16 h-16 ${feature.color} rounded-2xl group-hover:scale-110 transition-all`}>
                                <feature.icon className="h-8 w-8" />
                              </div>
                              {feature.premium && (
                                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Premium
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-4">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ) : (
                      <Card className="bg-card/60 backdrop-blur-xl border-border/50 border-dashed border-yellow-300 transition-all duration-300 h-full shadow-lg">
                        <CardContent className="p-8">
                          <div className="flex items-center justify-between mb-6">
                            <div className={`flex items-center justify-center w-16 h-16 ${feature.color} rounded-2xl opacity-60`}>
                              <feature.icon className="h-8 w-8" />
                            </div>
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                              <Crown className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          </div>
                          <h3 className="text-2xl font-bold text-foreground mb-4">{feature.title}</h3>
                          <p className="text-muted-foreground leading-relaxed mb-4">{feature.description}</p>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-yellow-800">
                              ✨ Upgrade to Professional Plan to unlock this feature
                            </p>
                          </div>
                          <Link to="/subscription">
                            <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                              <Crown className="h-4 w-4 mr-2" />
                              Upgrade Now
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Demo Video Section */}
        <section id="demo-video" className="py-20 px-2 sm:px-4 bg-secondary/10">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                See OstrichAi in Action
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Watch how our AI transforms your creative workflow in seconds
              </p>
            </div>

            <div className="max-w-screen-xl mx-auto px-2 sm:px-4">
              <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-8 border border-primary/30 shadow-2xl">
                <div className="aspect-video rounded-xl md:rounded-2xl overflow-hidden bg-gray-900">
                  <video
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                  >
                    <source src="/Complete 1st video ads.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="mt-4 md:mt-6 text-center">
                  <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4 px-2">
                    See how creators are using OstrichAi to generate stunning content in minutes
                  </p>
                  <Button size="lg" asChild className="w-full sm:w-auto">
                    <Link to="/video-creation">
                      <span className="hidden sm:inline">Start Creating Like This</span>
                      <span className="sm:inline md:hidden">Start Creating</span>
                      <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof & Stats */}
        <section className="py-16 px-2 sm:px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 mx-auto group-hover:bg-primary/20 transition-all">
                    <stat.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">{stat.number}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-2 sm:px-4 bg-secondary/10">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Loved by Creators Worldwide
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of satisfied users who transformed their content creation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-foreground mb-6 leading-relaxed italic">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-4">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.company}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-2 sm:px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about OstrichAi
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="bg-card/60 backdrop-blur-xl border-border/50 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full text-left p-6 flex items-center justify-between hover:bg-card/80 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full flex-shrink-0">
                        <HelpCircle className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground pr-4">{faq.question}</h3>
                    </div>
                    <div className={`transform transition-transform ${openFaq === index ? 'rotate-180' : ''}`}>
                      <ChevronRight className="h-5 w-5 text-muted-foreground rotate-90" />
                    </div>
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-muted-foreground leading-relaxed pl-14">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-12 md:py-20 px-2 sm:px-4 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
          <div className="container mx-auto text-center">
            <div className="max-w-4xl mx-auto bg-card/80 backdrop-blur-xl rounded-3xl p-12 border border-border/50 shadow-2xl">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Rocket className="h-4 w-4" />
                <span>Start Your Creative Journey Today</span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Ready to Create Amazing Content?
              </h2>

              <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
                Join 50,000+ creators who are already using OstrichAi to transform their content creation workflow.
                Start for free, no credit card required.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                  asChild
                >
                  <Link to="/video-creation">
                    <Rocket className="mr-2 h-5 w-5" />
                    Start Creating Free
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-border hover:bg-secondary/80 px-10 py-6 text-lg"
                  asChild
                >
                  <Link to="/subscription">
                    <Crown className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    View Pricing
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>20 free credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Access all 18+ tools</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
