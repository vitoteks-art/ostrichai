import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Youtube, Search, Image, FileText, Play, Sparkles, Zap, Clock, Shield, ArrowRight, Upload, Settings, Download, TrendingUp, Video, Users, BarChart } from "lucide-react";
import ResearchResults from "@/components/ResearchResults";
import Layout from "@/components/Layout";
import { FeatureGate } from "@/components/FeatureGate";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionService } from "@/services/subscriptionService";
import { ProjectService } from "@/services/projectService";

const YouTubeResearch = () => {
  const [youtubeLink, setYoutubeLink] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [researchResults, setResearchResults] = useState<any>(null);
  const [isCreatingThumbnail, setIsCreatingThumbnail] = useState(false);
  const [isWritingScript, setIsWritingScript] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscription } = useSubscription();

  const handleResearch = async () => {
    if (!youtubeLink.trim()) {
      toast({
        title: "YouTube Link Required",
        description: "Please enter a valid YouTube link",
        variant: "destructive",
      });
      return;
    }

    // Check credit balance before proceeding
    const creditsNeeded = 4; // YouTube research costs 4 credits
    if (creditsNeeded > 0) {
      const creditCheck = await SubscriptionService.useCredits(user?.id || '', 'youtube_scraper', creditsNeeded);
      if (!creditCheck.success) {
        let errorMsg = creditCheck.error || 'Failed to process credit deduction';
        if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
          errorMsg = 'Credit system error. Please try again later.';
        } else if (subscription && subscription.credit_balance < creditsNeeded) {
          errorMsg = `Insufficient credits for YouTube research. You need ${creditsNeeded} credits but only have ${subscription.credit_balance}. Please upgrade your plan or purchase additional credits.`;
        }
        toast({
          title: "Credit Error",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Credits Deducted",
        description: `✅ ${creditsNeeded} credits deducted for YouTube research`,
      });
    }

    setIsResearching(true);
    setResearchResults(null); // Clear previous results

    try {
      const response = await fetch("https://n8n.getostrichai.com/webhook/idea-triggers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "research",
          youtubeLink: youtubeLink.trim(),
          timestamp: new Date().toISOString(),
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Webhook response:", data);

      // Extract data from webhook response format
      if (data && Array.isArray(data) && data.length > 0 && data[0].data) {
        const resultsData = data[0].data;
        console.log("Setting research results:", resultsData);
        setResearchResults(resultsData);

        // Create project record
        if (user?.id) {
          try {
            console.log("Creating YouTube project for user:", user.id);
            const projectResult = await ProjectService.createProject(user.id, {
              title: resultsData.title || `YouTube Research: ${youtubeLink}`,
              type: 'youtube',
              status: 'completed',
              project_metadata: {
                youtubeLink,
                researchResults: resultsData,
                projectType: 'youtube'
              }
            });

            console.log("Project creation result:", projectResult);

            if (!projectResult.success) {
              console.error("Failed to create project:", projectResult);
              toast({
                title: "Project Save Failed",
                description: "Could not save project to database",
                variant: "destructive",
              });
            } else if (projectResult.isDemo) {
              console.warn("Project created in demo mode (not persisted)");
              toast({
                title: "Demo Mode",
                description: "Project saved locally (demo mode)",
                variant: "default",
              });
            }

            await ProjectService.logActivity(user.id, {
              action: 'youtube_research',
              details: `Researched video: ${resultsData.title || youtubeLink}`,
              activity_metadata: { youtubeLink, title: resultsData.title }
            });
          } catch (err) {
            console.error("Failed to save project:", err);
            toast({
              title: "Save Error",
              description: "An error occurred while saving the project",
              variant: "destructive",
            });
          }
        } else {
          console.warn("User not logged in, skipping project creation");
        }

        toast({
          title: "Research Complete",
          description: "Your YouTube video analysis is ready and saved to projects",
        });
      } else {
        console.warn("Unexpected response format:", data);
        toast({
          title: "Unexpected Response",
          description: "The response format was not recognized",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Research error:", error);
      toast({
        title: "Research Failed",
        description: error instanceof Error ? error.message : "Failed to send research request",
        variant: "destructive",
      });
      setResearchResults(null);
    } finally {
      setIsResearching(false);
    }
  };

  const handleCreateThumbnail = async () => {
    if (!youtubeLink.trim()) {
      toast({
        title: "YouTube Link Required",
        description: "Please complete research first",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingThumbnail(true);
    try {
      const response = await fetch("https://n8n.getostrichai.com/webhook/idea-triggers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_thumbnail",
          youtubeLink: youtubeLink.trim(),
          timestamp: new Date().toISOString(),
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send thumbnail request");
      }

      toast({
        title: "Thumbnail Request Sent",
        description: "Your thumbnail is being generated",
      });

      // Create project record
      if (user?.id) {
        try {
          await ProjectService.createProject(user.id, {
            title: `Thumbnail: ${youtubeLink}`,
            type: 'youtube',
            status: 'processing',
            project_metadata: {
              youtubeLink,
              taskType: 'thumbnail_generation',
              projectType: 'youtube'
            }
          });

          await ProjectService.logActivity(user.id, {
            action: 'thumbnail_generation',
            details: `Started thumbnail generation for: ${youtubeLink}`,
            activity_metadata: { youtubeLink }
          });
        } catch (err) {
          console.error("Failed to save project:", err);
        }
      }
    } catch (error) {
      console.error("Thumbnail error:", error);
      toast({
        title: "Thumbnail Creation Failed",
        description: "Failed to send thumbnail request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingThumbnail(false);
    }
  };

  const handleWriteScript = async () => {
    if (!youtubeLink.trim()) {
      toast({
        title: "YouTube Link Required",
        description: "Please complete research first",
        variant: "destructive",
      });
      return;
    }

    setIsWritingScript(true);
    try {
      const response = await fetch("https://n8n.getostrichai.com/webhook/idea-triggers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "write_script",
          youtubeLink: youtubeLink.trim(),
          timestamp: new Date().toISOString(),
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send script request");
      }

      toast({
        title: "Script Request Sent",
        description: "Your video script is being written",
      });

      // Create project record
      if (user?.id) {
        try {
          await ProjectService.createProject(user.id, {
            title: `Script: ${youtubeLink}`,
            type: 'script',
            status: 'processing',
            project_metadata: {
              youtubeLink,
              taskType: 'script_writing',
              projectType: 'script'
            }
          });

          await ProjectService.logActivity(user.id, {
            action: 'script_writing',
            details: `Started script writing for: ${youtubeLink}`,
            activity_metadata: { youtubeLink }
          });
        } catch (err) {
          console.error("Failed to save project:", err);
        }
      }
    } catch (error) {
      console.error("Script error:", error);
      toast({
        title: "Script Writing Failed",
        description: "Failed to send script request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsWritingScript(false);
    }
  };

  const youtubeFeatures = [
    {
      icon: Search,
      title: "Video Analysis",
      description: "Deep analysis of YouTube videos to extract key insights and content ideas"
    },
    {
      icon: Settings,
      title: "Content Generation",
      description: "Generate thumbnails, scripts, and related content based on video analysis"
    },
    {
      icon: Download,
      title: "Multi-Format Export",
      description: "Export research results, scripts, and visual assets in multiple formats"
    }
  ];

  const youtubeTools = [
    {
      title: "AI Video Research",
      description: "Analyze YouTube videos and extract valuable insights for content creation",
      features: ["Content Analysis", "Trend Identification", "Idea Generation", "Competitor Research"]
    },
    {
      title: "Script Writing",
      description: "Generate engaging video scripts based on research findings",
      features: ["Script Structure", "Hook Creation", "Call-to-Action", "SEO Optimization"]
    },
    {
      title: "Thumbnail Creation",
      description: "Design eye-catching thumbnails that drive clicks and engagement",
      features: ["Visual Design", "Click Optimization", "Brand Consistency", "A/B Testing"]
    }
  ];

  return (
    <Layout>
      <SEO
        title="AI YouTube Research & Analysis | Channel Optimization"
        description="Analyze YouTube videos and channels with AI. Optimize your YouTube content strategy with data-driven insights and research."
      />
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="relative py-24 px-4">
          <div className="container mx-auto text-center">
            <div className="max-w-screen-xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
                <Youtube className="h-4 w-4" />
                <span>AI YouTube Studio</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                Analyze & Create
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent block">
                  YouTube Content
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Transform YouTube videos into research insights, scripts, and thumbnails.
                Perfect for content creators, marketers, and video strategists.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all">
                  <Play className="mr-2 h-5 w-5" />
                  Start Research
                </Button>
                <Button variant="outline" size="lg" className="border-border hover:bg-secondary/80 px-8 py-4 text-lg">
                  <Sparkles className="mr-2 h-5 w-5" />
                  View Examples
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* YouTube Research Component */}
        <section className="mb-20">
          <div className="space-y-8">
            <div className="max-w-6xl mx-auto space-y-8">
              <FeatureGate feature="blogResearch">
                <Card className="bg-card/80 backdrop-blur-xl border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-foreground">YouTube Video Research</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Enter a YouTube link to analyze the video and generate content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Credit Cost Display */}
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 font-bold text-sm">💰</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Credit Cost</h4>
                            <p className="text-sm text-gray-600">Cost for YouTube video research</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600">4 credits</div>
                          <div className="text-sm text-gray-500">AI-powered video analysis</div>
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

                    <div className="flex gap-2">
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        value={youtubeLink}
                        onChange={(e) => setYoutubeLink(e.target.value)}
                        className="flex-1 bg-background/50 border-primary/30 text-foreground placeholder:text-muted-foreground"
                      />
                      <Button
                        onClick={handleResearch}
                        disabled={isResearching}
                        className="gap-2 bg-primary hover:bg-primary/90"
                      >
                        <Search className="w-4 h-4" />
                        {isResearching ? "Researching..." : "Research"}
                      </Button>
                    </div>

                    {researchResults && (
                      <ResearchResults data={researchResults} />
                    )}
                  </CardContent>
                </Card>
              </FeatureGate>
            </div>
          </div>
        </section>

        {/* YouTube Features */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Powerful Research Tools
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to research, analyze, and create YouTube content with AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {youtubeFeatures.map((feature, index) => (
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

        {/* YouTube Tools Grid */}
        <section className="py-20 px-4 bg-secondary/20">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Comprehensive YouTube Suite
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Professional-grade tools for every YouTube content creation need
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {youtubeTools.map((tool, index) => (
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
                Why Choose Our YouTube AI?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Industry-leading technology meets YouTube expertise
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <TrendingUp className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Research-Driven</h3>
                <p className="text-muted-foreground leading-relaxed">Create content based on proven strategies and audience insights</p>
              </div>
              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Creator Focused</h3>
                <p className="text-muted-foreground leading-relaxed">Tools designed specifically for YouTube creators and marketers</p>
              </div>
              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Clock className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Workflow Optimized</h3>
                <p className="text-muted-foreground leading-relaxed">Streamline your content creation process from research to publication</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default YouTubeResearch;
