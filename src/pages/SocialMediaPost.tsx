import Layout from '@/components/Layout';
import SocialPostGenerator from '@/components/SocialPostGenerator';
import PostHistory from '@/components/PostHistory';
import { Button } from '@/components/ui/button';
import { MessageSquare, Share2, Sparkles, Zap, Clock, Shield, ArrowRight, TrendingUp, Settings, Download, CheckCircle2 } from 'lucide-react';
import SEO from '@/components/SEO';

const SocialMediaPost = () => {
  const socialMediaFeatures = [
    {
      icon: MessageSquare,
      title: "Multi-Platform Support",
      description: "Generate content optimized for Facebook, Twitter, Instagram, LinkedIn, TikTok, and YouTube"
    },
    {
      icon: Settings,
      title: "Content Enhancement",
      description: "Rewrite and improve existing content with AI-powered suggestions"
    },
    {
      icon: Download,
      title: "Visual Generation",
      description: "Create matching images and visuals for your social media posts"
    }
  ];

  const socialMediaTools = [
    {
      title: "AI Content Generator",
      description: "Create engaging social media posts with platform-specific optimization",
      features: ["Platform Optimization", "Hashtag Research", "Engagement Focus", "Trend Analysis"]
    },
    {
      title: "Content Rewriter",
      description: "Improve and adapt existing content for better performance",
      features: ["Tone Adjustment", "Length Optimization", "Emoji Enhancement", "Call-to-Action"]
    },
    {
      title: "Visual Creator",
      description: "Generate matching images and graphics for your posts",
      features: ["Image Generation", "Style Consistency", "Brand Integration", "Format Optimization"]
    }
  ];

  return (
    <Layout>
      <SEO
        title="AI Social Media Post Generator | Engagement Optimized"
        description="Create engaging social media content for all platforms with AI. Optimized for Facebook, Twitter, Instagram, LinkedIn, and more."
      />
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="relative py-24 px-4">
          <div className="container mx-auto text-center">
            <div className="max-w-screen-xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
                <MessageSquare className="h-4 w-4" />
                <span>AI Social Studio</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                Create Engaging
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent block">
                  Social Media Posts
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Generate compelling social media content with AI assistance.
                Perfect for all platforms with platform-specific optimization and visual generation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all">
                  <Share2 className="mr-2 h-5 w-5" />
                  Start Creating
                </Button>
                <Button variant="outline" size="lg" className="border-border hover:bg-secondary/80 px-8 py-4 text-lg">
                  <Sparkles className="mr-2 h-5 w-5" />
                  View Examples
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Social Post Generator Component */}
        <section className="mb-20">
          <SocialPostGenerator />
        </section>

        {/* Post History Section */}
        <section className="mb-20">
          <PostHistory />
        </section>

        {/* Features Section */}
        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Powerful Features</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Everything you need to create engaging social media content
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {socialMediaFeatures.map((feature, index) => (
                <div key={index} className="p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">AI-Powered Tools</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Advanced tools to maximize your social media impact
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {socialMediaTools.map((tool, index) => (
                <div key={index} className="p-6 bg-card rounded-xl border border-border">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{tool.title}</h3>
                  <p className="text-muted-foreground mb-4">{tool.description}</p>
                  <ul className="space-y-2">
                    {tool.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default SocialMediaPost;
