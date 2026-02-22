import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, Copy, CheckCheck, Sparkles, FileText, TrendingUp, Target, Clock, Shield, ArrowRight, Upload, Settings, Download, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useProjects } from '@/hooks/useProjects';
import { SubscriptionService } from '@/services/subscriptionService';
import { FeatureGate } from '@/components/FeatureGate';
import SEO from '@/components/SEO';

interface TitleGenerationResponse {
  titles?: string[];
  title?: string;
  message?: string;
  success?: boolean;
  error?: string;
}

interface GeneratedContent {
  title: string;
  description: string;
  thumbnailPrompt: string;
  targetAudience: string;
  contentAngle: string;
  powerWordsUsed: string[];
  thumbnailImageUrl?: string;
}

const YouTubeTitleGen = () => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { createProject, logActivity } = useProjects();

  const handleGenerateTitles = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a description or keywords for title generation",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate YouTube titles",
        variant: "destructive"
      });
      return;
    }

    // Check credit balance before proceeding
    const creditsNeeded = 4; // YouTube title generation costs 4 credits
    if (creditsNeeded > 0) {
      const creditCheck = await SubscriptionService.useCredits(user.id, 'youtube_title_gen', creditsNeeded);
      if (!creditCheck.success) {
        let errorMsg = creditCheck.error || 'Failed to process credit deduction';
        if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
          errorMsg = 'Credit system error. Please try again later.';
        } else if (subscription && subscription.credit_balance < creditsNeeded) {
          errorMsg = `Insufficient credits for title generation. You need ${creditsNeeded} credits but only have ${subscription.credit_balance}. Please upgrade your plan or purchase additional credits.`;
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
        description: `✅ ${creditsNeeded} credits deducted for title generation`,
      });
    }

    setIsGenerating(true);
    setGeneratedContent(null);
    setError(null);

    try {
      const response = await fetch('https://n8n.getostrichai.com/webhook/title-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_titles',
          inputText: inputText.trim(),
          timestamp: new Date().toISOString(),
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Title generation response:', responseData);

      // Handle the actual response format from the webhook
      if (responseData && Array.isArray(responseData) && responseData.length > 0) {
        const mainData = responseData[0];

        if (mainData.data && Array.isArray(mainData.data) && mainData.data.length > 0) {
          const outputData = mainData.data[0];

          if (outputData.output) {
            const output = outputData.output;

            // Extract all the rich content from the response
            const content: GeneratedContent = {
              title: output.title || '',
              description: output.description || '',
              thumbnailPrompt: output.thumbnailPrompt || '',
              targetAudience: output.targetAudience || '',
              contentAngle: output.contentAngle || '',
              powerWordsUsed: output.powerWordsUsed || []
            };

            // Check if there's image data in the response
            if (mainData.data.length > 1) {
              const imageData = mainData.data[1];
              if (imageData.extractedUrl) {
                content.thumbnailImageUrl = imageData.extractedUrl;
              }
            }

            setGeneratedContent(content);

            // Create project record upon successful completion
            const projectTitle = `YouTube Title: ${content.title.substring(0, 30)}${content.title.length > 30 ? '...' : ''}`;
            console.log('🔄 Creating project for YouTube title generation...');

            // Prepare comprehensive project metadata
            const projectMetadata = {
              inputText: inputText.trim(),
              projectType: 'title_generation',
              generatedContent: {
                title: content.title,
                description: content.description,
                thumbnailPrompt: content.thumbnailPrompt,
                targetAudience: content.targetAudience,
                contentAngle: content.contentAngle,
                powerWordsUsed: content.powerWordsUsed,
                thumbnailImageUrl: content.thumbnailImageUrl,
                generatedAt: new Date().toISOString()
              },
              webhookResponse: responseData,
              timestamps: {
                submittedAt: new Date().toISOString(),
                completedAt: new Date().toISOString()
              },
              userDetails: {
                userId: user.id,
                userEmail: user.email
              }
            };

            const projectResult = await createProject({
              title: projectTitle,
              type: 'youtube',
              status: 'completed', // Create directly as completed since we have all the data
              project_metadata: projectMetadata
            });

            console.log('📋 Project creation result:', projectResult);
            if (projectResult.success) {
              console.log('✅ Project created successfully with complete content');

              // Log activity with comprehensive details
              console.log('📋 Logging comprehensive activity...');
              await logActivity({
                action: 'Generated complete YouTube content package',
                details: `Created title "${content.title.substring(0, 50)}${content.title.length > 50 ? '...' : ''}" with description, thumbnail, and metadata`,
                activity_metadata: {
                  projectId: projectResult.data?.id,
                  contentType: 'title_generation',
                  hasImage: !!content.thumbnailImageUrl,
                  wordCount: content.description.split(' ').length
                }
              });
              console.log('✅ Comprehensive activity logged successfully');
            } else {
              console.error('❌ Failed to create project:', projectResult.error);
            }

            toast({
              title: "Content Generated!",
              description: "YouTube title, content, and thumbnail created successfully"
            });

            // Credit tracking is now handled above with useCredits()

          } else {
            throw new Error('No content found in the response');
          }
        } else {
          throw new Error('Invalid response structure');
        }
      } else {
        throw new Error('No valid response received from the service');
      }

    } catch (error) {
      console.error('Title generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate titles. Please try again.";
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, key: string | number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => {
        const newState = { ...prev };
        newState[key] = true;
        return newState;
      });
      toast({
        title: "Copied!",
        description: "Content copied to clipboard"
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedStates(prev => {
          const newState = { ...prev };
          newState[key] = false;
          return newState;
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setInputText('');
    setGeneratedContent(null);
    setCopiedStates({});
    setError(null);
    toast({
      title: "Reset Complete",
      description: "Ready to generate new content"
    });
  };

  const titleGenFeatures = [
    {
      icon: Sparkles,
      title: "AI Title Generation",
      description: "Generate compelling, click-worthy YouTube titles using advanced AI algorithms"
    },
    {
      icon: ImageIcon,
      title: "Thumbnail Creation",
      description: "Create matching thumbnails and visual content for your videos"
    },
    {
      icon: FileText,
      title: "Complete Content Package",
      description: "Get titles, descriptions, and thumbnail prompts in one comprehensive package"
    }
  ];

  const titleGenTools = [
    {
      title: "YouTube Title Generator",
      description: "Create engaging, SEO-optimized titles that drive clicks and views",
      features: ["Click Optimization", "SEO Keywords", "Trend Analysis", "A/B Testing Ready"]
    },
    {
      title: "Content Enhancement",
      description: "Generate descriptions and metadata that complement your titles",
      features: ["Description Writing", "Hashtag Research", "Call-to-Action", "Audience Targeting"]
    },
    {
      title: "Visual Content Creation",
      description: "Design thumbnails and visual elements that match your content",
      features: ["Thumbnail Design", "Color Optimization", "Brand Consistency", "Format Adaptation"]
    }
  ];

  return (
    <Layout>
      <SEO
        title="AI YouTube Title Generator | Catchy Video Titles"
        description="Generate high-clicking YouTube titles with AI. Optimize your video titles for SEO and click-through rates with our advanced title generator."
      />
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="relative py-24 px-4">
          <div className="container mx-auto text-center">
            <div className="max-w-screen-xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
                <Sparkles className="h-4 w-4" />
                <span>AI Title Studio</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                Create Winning
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent block">
                  YouTube Titles
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Generate compelling YouTube titles, descriptions, and thumbnails with AI assistance.
                Perfect for content creators looking to maximize clicks and engagement.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all">
                  <Sparkles className="mr-2 h-5 w-5" />
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

        {/* YouTube Title Generator Component */}
        <section className="mb-20">
          <div className="space-y-8">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  YouTube Title Generator
                </h1>
                <p className="text-muted-foreground text-lg">
                  Generate engaging YouTube titles from your description or keywords
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/30 mb-8">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <p className="text-red-300 font-medium">Error: {error}</p>
                      <Button
                        onClick={() => setError(null)}
                        variant="outline"
                        size="sm"
                        className="ml-auto border-red-500/30 text-red-300 hover:bg-red-500/20"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <FeatureGate feature="titleGeneration">
                <Card className="bg-card/80 backdrop-blur-xl border-primary/30 mb-8">
                  <CardHeader>
                    <CardTitle className="text-white">Generate YouTube Titles</CardTitle>
                    <CardDescription className="text-gray-300">
                      Enter a description or keywords to generate compelling YouTube titles
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Input Section */}
                    <div className="space-y-2">
                      <Label htmlFor="inputText" className="text-white">
                        Description or Keywords
                      </Label>
                      <Textarea
                        id="inputText"
                        placeholder="Enter your video description, topic, or keywords to generate engaging YouTube titles..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="bg-background/50 border-primary/30 text-white placeholder:text-gray-400 min-h-[120px] resize-none"
                        rows={4}
                      />
                      <p className="text-sm text-gray-400">
                        Describe your video content, target audience, or key topics you want to cover
                      </p>
                    </div>

                    {/* Credit Cost Display */}
                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-lg border border-rose-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                            <span className="text-rose-600 font-bold text-sm">💰</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Credit Cost</h4>
                            <p className="text-sm text-gray-600">Cost for YouTube title generation</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-rose-600">4 credits</div>
                          <div className="text-sm text-gray-500">Complete content package</div>
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

                    {/* Generate Button */}
                    <Button
                      onClick={handleGenerateTitles}
                      disabled={isGenerating || !inputText.trim()}
                      className="w-full bg-primary hover:bg-primary/90"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Generating Titles...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Generate Titles
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Generated Content Display */}
                {generatedContent && (
                  <Card className="bg-card/80 backdrop-blur-xl border-green-500/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-400" />
                        Generated YouTube Content
                      </CardTitle>
                      <CardDescription className="text-gray-300">
                        Complete content package for your YouTube video
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Title Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 bg-background/30 rounded-lg border border-primary/20">
                          <div className="flex-1">
                            <h3 className="text-white font-semibold text-lg leading-tight">
                              {generatedContent.title}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                              Generated Title
                            </p>
                          </div>
                          <Button
                            onClick={() => copyToClipboard(generatedContent.title, 'title')}
                            variant="outline"
                            size="sm"
                            className="border-primary/30 text-white hover:bg-primary/20 shrink-0"
                          >
                            {copiedStates['title'] ? (
                              <CheckCheck className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Description Section */}
                      <div className="space-y-3">
                        <h4 className="text-white font-medium">Video Description</h4>
                        <div className="p-4 bg-background/30 rounded-lg border border-primary/20">
                          <Textarea
                            value={generatedContent.description}
                            readOnly
                            className="bg-transparent border-none text-white resize-none min-h-[120px]"
                          />
                          <div className="flex justify-end mt-2">
                            <Button
                              onClick={() => copyToClipboard(generatedContent.description, 'description')}
                              variant="outline"
                              size="sm"
                              className="border-primary/30 text-white hover:bg-primary/20"
                            >
                              {copiedStates['description'] ? (
                                <CheckCheck className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Thumbnail Prompt Section */}
                      <div className="space-y-3">
                        <h4 className="text-white font-medium">Thumbnail Prompt</h4>
                        <div className="p-4 bg-background/30 rounded-lg border border-primary/20">
                          <Textarea
                            value={generatedContent.thumbnailPrompt}
                            readOnly
                            className="bg-transparent border-none text-white resize-none min-h-[100px]"
                          />
                          <div className="flex justify-end mt-2">
                            <Button
                              onClick={() => copyToClipboard(generatedContent.thumbnailPrompt, 'thumbnail')}
                              variant="outline"
                              size="sm"
                              className="border-primary/30 text-white hover:bg-primary/20"
                            >
                              {copiedStates['thumbnail'] ? (
                                <CheckCheck className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Generated Thumbnail Image Section */}
                      {generatedContent.thumbnailImageUrl && (
                        <div className="space-y-3">
                          <h4 className="text-white font-medium">Generated Thumbnail</h4>
                          <div className="p-4 bg-background/30 rounded-lg border border-primary/20">
                            <div className="flex justify-center mb-4">
                              <img
                                src={generatedContent.thumbnailImageUrl}
                                alt="Generated YouTube thumbnail"
                                className="max-w-full max-h-64 rounded-lg shadow-lg border border-primary/20"
                                onError={(e) => {
                                  console.error('Failed to load thumbnail image');
                                  toast({
                                    title: "Image Load Error",
                                    description: "Failed to load the generated thumbnail",
                                    variant: "destructive"
                                  });
                                }}
                              />
                            </div>
                            <div className="flex justify-center">
                              <Button
                                onClick={() => copyToClipboard(generatedContent.thumbnailImageUrl!, 'imageUrl')}
                                variant="outline"
                                size="sm"
                                className="border-primary/30 text-white hover:bg-primary/20"
                              >
                                {copiedStates['imageUrl'] ? (
                                  <CheckCheck className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Target Audience & Content Angle */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-white font-medium">Target Audience</h4>
                          <div className="p-3 bg-background/30 rounded-lg border border-primary/20">
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {generatedContent.targetAudience}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-white font-medium">Content Angle</h4>
                          <div className="p-3 bg-background/30 rounded-lg border border-primary/20">
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {generatedContent.contentAngle}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Power Words */}
                      {generatedContent.powerWordsUsed.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-white font-medium">Power Words Used</h4>
                          <div className="flex flex-wrap gap-2">
                            {generatedContent.powerWordsUsed.map((word, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium"
                              >
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-primary/20">
                        <Button
                          onClick={handleGenerateTitles}
                          disabled={isGenerating || !inputText.trim()}
                          variant="outline"
                          className="flex-1 border-primary/30 text-white hover:bg-primary/20"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Generate New Content
                        </Button>

                        <Button
                          onClick={handleReset}
                          variant="outline"
                          className="flex-1 border-red-400/30 text-red-400 hover:bg-red-400/20"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Start Over
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Empty State */}
                {!generatedContent && !isGenerating && (
                  <Card className="bg-card/80 backdrop-blur-xl border-primary/30">
                    <CardContent className="text-center py-12">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/60" />
                      <p className="text-gray-400">
                        Enter a description above and generate complete YouTube content!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </FeatureGate>
            </div>
          </div>
        </section>

        {/* YouTube Title Generation Features */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Complete Title Creation Suite
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to create compelling YouTube titles and content with AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {titleGenFeatures.map((feature, index) => (
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

        {/* YouTube Title Generation Tools Grid */}
        <section className="py-20 px-4 bg-secondary/20">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Professional Title Tools
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Advanced tools for every aspect of YouTube title and content creation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {titleGenTools.map((tool, index) => (
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
                Why Choose Our Title AI?
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
                <h3 className="text-2xl font-bold text-foreground mb-4">Click-Optimized</h3>
                <p className="text-muted-foreground leading-relaxed">Generate titles designed to maximize clicks and viewer engagement</p>
              </div>
              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">SEO-Enhanced</h3>
                <p className="text-muted-foreground leading-relaxed">Create titles optimized for YouTube search algorithms and discoverability</p>
              </div>
              <div className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Clock className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Instant Results</h3>
                <p className="text-muted-foreground leading-relaxed">Generate complete content packages in seconds, not hours</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default YouTubeTitleGen;
