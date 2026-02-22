import { VideoGenForm } from "@/components/VideoGenForm";
import Layout from "@/components/Layout";
import { FeatureGate } from "@/components/FeatureGate";
import { Video, Play, Sparkles, Zap, Clock, Shield, ArrowRight, Upload, Settings, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";

const VideoCreation = () => {
  const videoFeatures = [
    {
      icon: Upload,
      title: "Smart Upload",
      description: "Upload images and let AI transform them into dynamic videos"
    },
    {
      icon: Settings,
      title: "Advanced Controls",
      description: "Fine-tune video parameters for perfect results"
    },
    {
      icon: Download,
      title: "Export Options",
      description: "Download in multiple formats and resolutions"
    }
  ];

  const videoTools = [
    {
      title: "AI Video Generation",
      description: "Transform static images into engaging videos with advanced AI",
      features: ["Image-to-Video", "Style Transfer", "Motion Effects", "Auto Enhancement"]
    },
    {
      title: "Video Enhancement",
      description: "Improve video quality and add professional effects",
      features: ["Upscaling", "Noise Reduction", "Color Grading", "Stabilization"]
    },
    {
      title: "Batch Processing",
      description: "Process multiple videos simultaneously for efficiency",
      features: ["Bulk Upload", "Queue Management", "Progress Tracking", "Batch Export"]
    }
  ];

  return (
    <Layout>
      <SEO
        title="AI Video Generator | Create Cinematic Videos"
        description="Transform your ideas and images into high-quality cinematic videos with AI. Multiple models and styles supported for professional video creation."
      />
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="relative py-24 px-4">
          <div className="container mx-auto text-center">
            <div className="max-w-screen-xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
                <Video className="h-4 w-4" />
                <span>AI Video Studio</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                Create Amazing
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent block">
                  AI-Generated Videos
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Transform your static images into dynamic, engaging videos using cutting-edge AI technology.
                Perfect for social media, marketing, and creative projects.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all">
                  <Play className="mr-2 h-5 w-5" />
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

        {/* Video Generation Form */}
        <section className="mb-20">
          <FeatureGate feature="videoGeneration">
            <VideoGenForm />
          </FeatureGate>
        </section>

        {/* Video Features */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Powerful Video Tools
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to create professional videos with AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {videoFeatures.map((feature, index) => (
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

        {/* Video Tools Grid */}
        <section className="py-20 px-4 bg-secondary/20">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Comprehensive Video Suite
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Professional-grade tools for every video creation need
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {videoTools.map((tool, index) => (
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
                Why Choose Our Video AI?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Industry-leading technology meets user-friendly design
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Zap className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Lightning Fast</h3>
                <p className="text-muted-foreground leading-relaxed">Generate high-quality videos in minutes, not hours</p>
              </div>
              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Enterprise Ready</h3>
                <p className="text-muted-foreground leading-relaxed">Secure, scalable, and reliable for business use</p>
              </div>
              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Clock className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">24/7 Available</h3>
                <p className="text-muted-foreground leading-relaxed">Create videos anytime, anywhere with cloud processing</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default VideoCreation;
