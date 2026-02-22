import Layout from "@/components/Layout";
import AdsCreativeComponent from "@/components/AdsCreative";
import { Target, Sparkles, Zap, Clock, Shield, ArrowRight, Upload, Settings, Download, Palette, Layers, TrendingUp, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";

export default function AdsCreativePage() {
  const adsFeatures = [
    {
      icon: Target,
      title: "Campaign Planning",
      description: "Strategic campaign setup with multiple ad variations for testing"
    },
    {
      icon: Settings,
      title: "Multi-Stage Process",
      description: "Comprehensive workflow from campaign setup to ad generation"
    },
    {
      icon: Download,
      title: "Complete Assets",
      description: "Generate both copy and visual assets for complete campaigns"
    }
  ];

  const adsTools = [
    {
      title: "AI Campaign Generator",
      description: "Create complete ad campaigns with strategic copy and visuals",
      features: ["Campaign Strategy", "Copy Generation", "Visual Creation", "Performance Optimization"]
    },
    {
      title: "Ad Copy Engine",
      description: "Generate compelling headlines, descriptions, and CTAs",
      features: ["Headline Creation", "Description Writing", "CTA Optimization", "A/B Testing"]
    },
    {
      title: "Visual Ad Studio",
      description: "Design professional ad visuals with brand consistency",
      features: ["Image Generation", "Brand Integration", "Format Optimization", "Multi-Platform"]
    }
  ];

  return (
    <Layout>
      <SEO
        title="AI Ad Creative Generator | Create High-Converting Ads"
        description="Generate stunning ad creatives for Facebook, Instagram, and Google with AI. Boost your conversion rates with professionally designed visuals and copy."
      />
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="relative py-24 px-4">
          <div className="container mx-auto text-center">
            <div className="max-w-screen-xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
                <Target className="h-4 w-4" />
                <span>AI Ad Campaign Studio</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                Create Winning
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent block">
                  Ad Campaigns
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Generate complete advertising campaigns with AI-powered copy, visuals, and strategy.
                Perfect for social media, display ads, and marketing campaigns.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all">
                  <Megaphone className="mr-2 h-5 w-5" />
                  Start Campaign
                </Button>
                <Button variant="outline" size="lg" className="border-border hover:bg-secondary/80 px-8 py-4 text-lg">
                  <Sparkles className="mr-2 h-5 w-5" />
                  View Examples
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Ads Creative Component */}
        <section className="mb-20">
          <AdsCreativeComponent />
        </section>

        {/* Ads Features */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Complete Campaign Tools
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to create successful advertising campaigns with AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {adsFeatures.map((feature, index) => (
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

        {/* Ads Tools Grid */}
        <section className="py-20 px-4 bg-secondary/20">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Comprehensive Ad Suite
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Professional-grade tools for every advertising campaign need
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {adsTools.map((tool, index) => (
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
                Why Choose Our Campaign AI?
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
                <h3 className="text-2xl font-bold text-foreground mb-4">Campaign Success</h3>
                <p className="text-muted-foreground leading-relaxed">Create campaigns optimized for conversions and engagement</p>
              </div>
              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Brand Consistency</h3>
                <p className="text-muted-foreground leading-relaxed">Maintain brand guidelines across all campaign elements</p>
              </div>
              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Clock className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Time Efficient</h3>
                <p className="text-muted-foreground leading-relaxed">Generate complete campaigns in minutes, not hours</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
