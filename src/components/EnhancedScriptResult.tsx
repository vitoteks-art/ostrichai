import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Download, Copy, CopyCheck, Clock, Target, AlertTriangle, Eye, Info, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { SubscriptionService } from "../services/subscriptionService";
import { useProjects } from "../hooks/useProjects";

interface VisualCue {
  timestamp: string;
  description: string;
  imagePrompt: string;
}

interface ScriptSection {
  hook?: string;
  context_foundation?: string;
  mechanism_process?: string;
  evidence_impact?: string;
  debate_controversy?: string;
  patterns_lessons?: string;
  call_to_action?: string;
}

interface EnhancedScriptOutput {
  title: string;
  topic?: string;
  topic_type?: string;
  estimated_runtime_minutes?: number;
  target_word_count?: number;
  script: ScriptSection;
  visual_cues: VisualCue[];
  metadata?: {
    topic_type?: string;
    temporal_focus?: string;
    controversy_level?: string;
    technical_complexity?: string;
    relevance_score?: number;
    primary_audience?: string;
    research_sources?: string[];
    key_statistics?: string[];
    production_notes?: {
      estimated_images_needed?: number;
      music_style?: string;
      voice_tone?: string;
      special_considerations?: string;
    };
  };
}

interface EnhancedScriptResultProps {
  data: Array<{
    output: EnhancedScriptOutput;
  }>;
}

export const EnhancedScriptResult = ({ data }: EnhancedScriptResultProps) => {
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [selectedImageModel, setSelectedImageModel] = useState<string>('nano-banana-pro');

  const { toast } = useToast();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { createProject, updateProject, logActivity } = useProjects();

  // Debug: Log the data structure to understand the format
  useEffect(() => {
    console.log('EnhancedScriptResult received data:', data);
    console.log('First item output:', data[0]?.output);
    console.log('Script sections:', data[0]?.output?.script);
    console.log('Script sections type:', typeof data[0]?.output?.script);
    console.log('Script sections isArray:', Array.isArray(data[0]?.output?.script));
    console.log('Visual cues:', data[0]?.output?.visual_cues);

    // Log each script section for debugging
    if (data[0]?.output?.script) {
      if (Array.isArray(data[0].output.script)) {
        console.log('Script is array with length:', data[0].output.script.length);
        data[0].output.script.forEach((item, index) => {
          console.log(`Script[${index}]:`, item, 'Type:', typeof item);
        });
      } else if (typeof data[0].output.script === 'object') {
        console.log('Script is object with keys:', Object.keys(data[0].output.script));
        Object.entries(data[0].output.script).forEach(([key, value]) => {
          console.log(`Script.${key}:`, value, 'Type:', typeof value);
        });
      }
    }
  }, [data]);

  const handleCopySection = async (sectionName: string, content: string, outputIndex: number) => {
    const key = `section-${outputIndex}-${sectionName}`;

    try {
      await navigator.clipboard.writeText(content);
      setCopiedItems(prev => ({ ...prev, [key]: true }));
      toast({
        title: "Copied",
        description: `${sectionName} copied to clipboard!`,
      });
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleCopyEntireScript = async (output: EnhancedScriptOutput, outputIndex: number) => {
    const key = `script-${outputIndex}`;

    const scriptContent = Object.entries(output.script)
      .map(([sectionName, content]) => `=== ${sectionName.toUpperCase().replace(/_/g, ' ')} ===\n${content}`)
      .join('\n\n');

    const fullScript = `${output.title}\n\n${scriptContent}`;

    try {
      await navigator.clipboard.writeText(fullScript);
      setCopiedItems(prev => ({ ...prev, [key]: true }));
      toast({
        title: "Copied",
        description: "Entire script copied to clipboard!",
      });
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleCopyVisualCues = async (visualCues: VisualCue[], outputIndex: number) => {
    const key = `visual-cues-${outputIndex}`;

    const visualCuesText = visualCues.map(cue =>
      `[${cue.timestamp}] ${cue.description}\nImage Prompt: ${cue.imagePrompt}`
    ).join('\n\n');

    try {
      await navigator.clipboard.writeText(visualCuesText);
      setCopiedItems(prev => ({ ...prev, [key]: true }));
      toast({
        title: "Copied",
        description: "Visual cues copied to clipboard!",
      });
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateImage = async (prompt: string, cueIndex: number, outputIndex: number, model: string = 'google/nano-banana') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate images.",
        variant: "destructive",
      });
      return;
    }

    // Get credit cost based on selected model
    const creditsNeeded = SubscriptionService.getCreditCostForLogo(model);

    // Check credit balance before proceeding
    if (creditsNeeded > 0) {
      const creditCheck = await SubscriptionService.useCredits(user.id, 'enhanced_script_image', creditsNeeded);
      if (!creditCheck.success) {
        let errorMsg = creditCheck.error || 'Failed to process credit deduction';
        if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
          errorMsg = 'Credit system error. Please try again later.';
        } else if (subscription && subscription.credit_balance < creditsNeeded) {
          errorMsg = `Insufficient credits for image generation. You need ${creditsNeeded} credits but only have ${subscription.credit_balance}. Please upgrade your plan or purchase additional credits.`;
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
        description: `✅ ${creditsNeeded} credits deducted for image generation`,
      });
    }

    const key = `${outputIndex}-${cueIndex}`;
    setGeneratingImages(prev => ({ ...prev, [key]: true }));

    try {
      const response = await fetch("https://n8n.getostrichai.com/webhook/youtube-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          userId: user.id,
          model: model
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const result = await response.json();
      const imageUrl = Array.isArray(result) ? result[0]?.imageUrl : result.imageUrl;

      if (imageUrl) {
        setGeneratedImages(prev => ({
          ...prev,
          [key]: imageUrl
        }));

        toast({
          title: "Success",
          description: "Image generated successfully!",
        });
      } else {
        throw new Error("No image URL in response");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingImages(prev => ({ ...prev, [key]: false }));
    }
  };

  const getSectionIcon = (sectionName: string) => {
    switch (sectionName) {
      case 'hook': return <Sparkles className="w-4 h-4" />;
      case 'context_foundation': return <Info className="w-4 h-4" />;
      case 'mechanism_process': return <Target className="w-4 h-4" />;
      case 'evidence_impact': return <Eye className="w-4 h-4" />;
      case 'debate_controversy': return <AlertTriangle className="w-4 h-4" />;
      case 'patterns_lessons': return <Clock className="w-4 h-4" />;
      case 'call_to_action': return <Sparkles className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getSectionTitle = (sectionName: string) => {
    return sectionName.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in">
      {data.map((item, outputIndex) => (
        <div key={outputIndex} className="space-y-6">
          {/* Script Header */}
          <div className="text-center space-y-4">
            <Badge variant="outline" className="text-sm px-4 py-1">
              Enhanced Script #{outputIndex + 1}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              {item.output.title}
            </h2>

            {/* Script Metadata */}
            {item.output.metadata && (
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{item.output.metadata.topic_type} • {item.output.metadata.temporal_focus}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-full">
                  <Target className="w-4 h-4 text-secondary-foreground" />
                  <span>Controversy: {item.output.metadata.controversy_level}</span>
                </div>
                {item.output.estimated_runtime_minutes && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full">
                    <Clock className="w-4 h-4 text-accent-foreground" />
                    <span>{item.output.estimated_runtime_minutes} minutes</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => handleCopyEntireScript(item.output, outputIndex)}
                variant="outline"
                size="sm"
              >
                {copiedItems[`script-${outputIndex}`] ? (
                  <>
                    <CopyCheck className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Full Script
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Script Sections */}
          <div className="space-y-6">
            {(() => {
              // Handle different data structures for script content
              const scriptData = item.output.script;

              // If script is not available or invalid, show error message
              if (!scriptData) {
                return (
                  <Card className="bg-destructive/10 border-destructive/20">
                    <CardContent className="pt-6">
                      <p className="text-destructive text-center">
                        Script content is not available. Please try generating the script again.
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              // If script is an array (fallback structure)
              if (Array.isArray(scriptData)) {
                return scriptData.map((content, index) => (
                  <Card key={index} className="bg-card/50 backdrop-blur-sm border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-3 text-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="font-mono text-xs">
                            Section {index + 1}
                          </Badge>
                          <span>Script Section</span>
                        </div>
                        <Button
                          onClick={() => handleCopySection(`section-${index}`, content || '', outputIndex)}
                          variant="ghost"
                          size="sm"
                        >
                          {copiedItems[`section-${outputIndex}-section-${index}`] ? (
                            <CopyCheck className="w-4 h-4 text-primary" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground leading-relaxed whitespace-pre-line">
                        {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                      </p>
                    </CardContent>
                  </Card>
                ));
              }

              // If script is an object (expected structure)
              if (typeof scriptData === 'object' && scriptData !== null) {
                return Object.entries(scriptData).map(([sectionName, content]) => {
                  // Skip if content is not a string or is empty
                  if (typeof content !== 'string' || !content.trim()) {
                    return null;
                  }

                  return (
                    <Card key={sectionName} className="bg-card/50 backdrop-blur-sm border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-3 text-lg">
                          <div className="flex items-center gap-3">
                            {getSectionIcon(sectionName)}
                            <span>{getSectionTitle(sectionName)}</span>
                          </div>
                          <Button
                            onClick={() => handleCopySection(sectionName, content || '', outputIndex)}
                            variant="ghost"
                            size="sm"
                          >
                            {copiedItems[`section-${outputIndex}-${sectionName}`] ? (
                              <CopyCheck className="w-4 h-4 text-primary" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground leading-relaxed whitespace-pre-line">{content}</p>
                      </CardContent>
                    </Card>
                  );
                }).filter(Boolean); // Remove null entries
              }

              // Fallback for unexpected data types
              return (
                <Card className="bg-muted/50 border-border">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">
                      Unable to display script content. Data format: {typeof scriptData}
                    </p>
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        View raw data
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(scriptData, null, 2)}
                      </pre>
                    </details>
                  </CardContent>
                </Card>
              );
            })()}
          </div>

          {/* Image Model Selection */}
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Image Generation Model</h3>
              </div>
              <Select value={selectedImageModel} onValueChange={setSelectedImageModel}>
                <SelectTrigger className="w-full md:w-64 bg-card border-border">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nano-banana-pro">Titan - Premium Quality (6 credits)</SelectItem>
                  <SelectItem value="google/nano-banana-edit">Nexus - Medium Quality (2 credits)</SelectItem>
                  <SelectItem value="google/nano-banana">Base - Text Only (2 credits)</SelectItem>
                  <SelectItem value="z-image">Echo - Text Only (1 credit)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Choose the AI model for generating images from script prompts
              </p>
            </CardContent>
          </Card>

          {/* Visual Cues Section */}
          <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Eye className="w-5 h-5 text-primary" />
                Visual Cues & Image Prompts
              </CardTitle>
              <Button
                onClick={() => handleCopyVisualCues(item.output.visual_cues, outputIndex)}
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                {copiedItems[`visual-cues-${outputIndex}`] ? (
                  <>
                    <CopyCheck className="w-4 h-4" />
                    Copy All Prompts
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy All Prompts
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.output.visual_cues.map((cue, cueIndex) => {
                const key = `${outputIndex}-${cueIndex}`;
                const isGenerating = generatingImages[key];
                const generatedImage = generatedImages[key];

                return (
                  <Card key={cueIndex} className="bg-muted/20 border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {cue.timestamp}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Visual Cue {cueIndex + 1}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Description</h4>
                        <p className="text-sm text-foreground">{cue.description}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          Image Prompt
                        </h4>
                        <p className="text-sm text-foreground/80 italic leading-relaxed mb-4">
                          {cue.imagePrompt}
                        </p>
                      </div>

                      {generatedImage && (
                        <div className="mt-3">
                          <img
                            src={generatedImage}
                            alt={`Generated for ${cue.timestamp}`}
                            className="w-full rounded-md border border-border"
                          />
                        </div>
                      )}

                      {/* Credit Cost Display */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-xs">💰</span>
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900 text-sm">Credit Cost</h5>
                              <p className="text-xs text-gray-600">Cost for image generation</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-blue-600">{SubscriptionService.getCreditCostForLogo(selectedImageModel)} credits</div>
                            <div className="text-xs text-gray-500">AI image generation</div>
                          </div>
                        </div>

                        {subscription && (
                          <div className="mt-2 text-center">
                            <span className="text-xs text-gray-600">
                              Your balance: <span className="font-semibold text-green-600">{subscription.credit_balance} credits</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleGenerateImage(cue.imagePrompt, cueIndex, outputIndex, selectedImageModel)}
                          disabled={isGenerating}
                          size="sm"
                          variant="gradient"
                          className="flex-1"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="animate-spin w-4 h-4 mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Image
                            </>
                          )}
                        </Button>

                        {generatedImage && (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a href={generatedImage} download={`visual-cue-${cueIndex + 1}.png`}>
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>

          {/* Metadata Section */}
          {item.output.metadata && (
            <Card className="bg-card/30 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="w-5 h-5 text-primary" />
                  Script Metadata & Production Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Script Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Topic Type:</span>
                        <Badge variant="outline">{item.output.metadata.topic_type}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temporal Focus:</span>
                        <Badge variant="outline">{item.output.metadata.temporal_focus}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Controversy Level:</span>
                        <Badge variant="outline">{item.output.metadata.controversy_level}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Complexity:</span>
                        <Badge variant="outline">{item.output.metadata.technical_complexity}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Production Info</h4>
                    <div className="space-y-2 text-sm">
                      {item.output.estimated_runtime_minutes && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Runtime:</span>
                          <span className="font-medium">{item.output.estimated_runtime_minutes} minutes</span>
                        </div>
                      )}
                      {item.output.target_word_count && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Word Count:</span>
                          <span className="font-medium">{item.output.target_word_count.toLocaleString()}</span>
                        </div>
                      )}
                      {item.output.metadata.relevance_score && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Relevance Score:</span>
                          <span className="font-medium">{item.output.metadata.relevance_score}/10</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Target Audience */}
                {item.output.metadata.primary_audience && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Target Audience</h4>
                    <p className="text-sm text-muted-foreground">{item.output.metadata.primary_audience}</p>
                  </div>
                )}

                {/* Research Sources */}
                {item.output.metadata.research_sources && item.output.metadata.research_sources.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Research Sources</h4>
                    <div className="space-y-2">
                      {item.output.metadata.research_sources.map((source, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
                          <Badge variant="outline" className="mt-0.5 text-xs shrink-0">
                            {idx + 1}
                          </Badge>
                          <a
                            href={source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 break-all leading-relaxed"
                          >
                            {source}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Statistics */}
                {item.output.metadata.key_statistics && item.output.metadata.key_statistics.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Key Statistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {item.output.metadata.key_statistics.map((stat, idx) => (
                        <div key={idx} className="text-sm p-2 bg-primary/5 rounded border">
                          {stat}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Production Notes */}
                {item.output.metadata.production_notes && (
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="font-semibold text-foreground mb-3">Production Notes</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {item.output.metadata.production_notes.music_style && (
                        <div>
                          <span className="text-muted-foreground">Music Style:</span>
                          <p className="font-medium">{item.output.metadata.production_notes.music_style}</p>
                        </div>
                      )}
                      {item.output.metadata.production_notes.voice_tone && (
                        <div>
                          <span className="text-muted-foreground">Voice Tone:</span>
                          <p className="font-medium">{item.output.metadata.production_notes.voice_tone}</p>
                        </div>
                      )}
                      {item.output.metadata.production_notes.estimated_images_needed && (
                        <div>
                          <span className="text-muted-foreground">Images Needed:</span>
                          <p className="font-medium">{item.output.metadata.production_notes.estimated_images_needed}</p>
                        </div>
                      )}
                      {item.output.metadata.production_notes.special_considerations && (
                        <div className="md:col-span-2">
                          <span className="text-muted-foreground">Special Considerations:</span>
                          <p className="font-medium mt-1">{item.output.metadata.production_notes.special_considerations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </div>
  );
};
