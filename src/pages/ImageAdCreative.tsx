import Layout from "@/components/Layout";
import { FeatureGate } from "@/components/FeatureGate";
import { ImageAdCreative } from "@/components/ImageAdCreative";
import { Image as ImageIcon, Sparkles, Zap, Clock, Shield, ArrowRight, Upload, Settings, Download, Palette, Layers, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";

export default function ImageAdCreativePage() {
  const adCreativeFeatures = [
    {
      icon: Upload,
      title: "Multi-Image Upload",
      description: "Upload multiple images for comprehensive ad creative generation"
    },
    {
      icon: Settings,
      title: "Scene Control",
      description: "Configure multiple scenes for dynamic ad storytelling"
    },
    {
      icon: Download,
      title: "Batch Export",
      description: "Export multiple creative variations in various formats"
    }
  ];

  const adCreativeTools = [
    {
      title: "AI Ad Generation",
      description: "Create compelling advertising content with advanced AI",
      features: ["Smart Copywriting", "Visual Design", "Brand Consistency", "A/B Testing"]
    },
    {
      title: "Creative Enhancement",
      description: "Improve ad performance with professional optimizations",
      features: ["Performance Analysis", "Design Refinement", "Copy Optimization", "Visual Enhancement"]
    },
    {
      title: "Campaign Management",
      description: "Manage multiple ad creatives across campaigns",
      features: ["Batch Creation", "Performance Tracking", "Variant Testing", "Campaign Analytics"]
    }
  ];

  return (
    <Layout>
      <SEO
        title="AI Image Ad Creative Generator | Stunning Marketing Visuals"
        description="Create professional image ad creatives for social media and display advertising with AI. Optimize your visuals for maximum engagement and brand consistency."
      />
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="relative py-24 px-4">
          <div className="container mx-auto text-center">
            <div className="max-w-screen-xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
                <ImageIcon className="h-4 w-4" />
                <span>AI Ad Studio</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                Create Amazing
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent block">
                  AI-Powered Ads
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Generate professional advertising creatives using cutting-edge AI technology.
                Perfect for social media campaigns, display ads, and marketing materials.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all">
                  <Target className="mr-2 h-5 w-5" />
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

        {/* Image Ad Creative Component */}
        <section className="mb-20">
          <FeatureGate feature="adCreation">
            <ImageAdCreative />
          </FeatureGate>
        </section>

        {/* Ad Creative Features */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Powerful Ad Tools
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to create high-converting advertisements with AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {adCreativeFeatures.map((feature, index) => (
                <div key={index} className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                    <feature.icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ad Creative Tools Grid */}
        <section className="py-20 px-4 bg-secondary/20">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Comprehensive Ad Suite
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Professional-grade tools for every advertising need
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {adCreativeTools.map((tool, index) => (
                <Card key={index} className="bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 hover:border-primary/30 transition-all duration-300 group cursor-pointer h-full shadow-lg hover:shadow-xl">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-foreground mb-4">{tool.title}</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">{tool.description}</p>
                    <ul className="space-y-2">
                      {tool.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                          <ArrowRight className="h-4 w-4 text-primary mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Why Choose Our Ad AI?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Industry-leading technology meets advertising expertise
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <TrendingUp className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Performance Driven</h3>
                <p className="text-muted-foreground leading-relaxed">Create ads optimized for conversions and engagement</p>
              </div>
              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Brand Safe</h3>
                <p className="text-muted-foreground leading-relaxed">Maintain brand consistency and compliance across all creatives</p>
              </div>
              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Clock className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Campaign Ready</h3>
                <p className="text-muted-foreground leading-relaxed">Generate multiple ad variations quickly for testing and deployment</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
