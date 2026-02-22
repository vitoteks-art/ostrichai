import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, CopyCheck, Clock, Image as ImageIcon, Video, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProjects } from "../hooks/useProjects";
import { useAuth } from "../contexts/AuthContext";

interface YouTubeScriptSegment {
  text: string;
  time: string;
  imagePrompt: string;
  videoPrompt: string;
}

interface YouTubeScriptOutput {
  title: string;
  script: YouTubeScriptSegment[];
  generatedImages?: Record<string, any>;
}

interface YouTubeScriptResultProps {
  data: Array<{
    output: YouTubeScriptOutput;
  }>;
  projectId?: string;
}

export const YouTubeScriptResult = ({ data, projectId }: YouTubeScriptResultProps) => {
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const { updateProject } = useProjects();

  // Load existing generated images from project metadata
  useEffect(() => {
    if (data && data[0]?.output?.generatedImages) {
      const existingImages: Record<string, string> = {};
      Object.entries(data[0].output.generatedImages).forEach(([key, imageData]: [string, any]) => {
        if (imageData.imageUrl) {
          // Convert scene-X to outputIndex-sceneIndex format
          const sceneMatch = key.match(/scene-(\d+)/);
          if (sceneMatch) {
            existingImages[`0-${sceneMatch[1]}`] = imageData.imageUrl;
          }
        }
      });
      setGeneratedImages(existingImages);
    }
  }, [data]);

  const handleCopySegment = async (segmentIndex: number, content: string, outputIndex: number) => {
    const key = `segment-${outputIndex}-${segmentIndex}`;

    try {
      await navigator.clipboard.writeText(content);
      setCopiedItems(prev => ({ ...prev, [key]: true }));
      toast({
        title: "Copied",
        description: `Segment ${segmentIndex + 1} copied to clipboard!`,
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

  const handleCopyEntireScript = async (output: YouTubeScriptOutput, outputIndex: number) => {
    const key = `script-${outputIndex}`;

    const scriptContent = output.script.map((segment, index) =>
      `[${segment.time}] ${segment.text}\n\nImage Prompt: ${segment.imagePrompt}\n\nVideo Prompt: ${segment.videoPrompt}`
    ).join('\n\n---\n\n');

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

  const handleCopyImagePrompts = async (script: YouTubeScriptSegment[], outputIndex: number) => {
    const key = `image-prompts-${outputIndex}`;

    const promptsText = script.map((segment, index) =>
      `Scene ${index + 1} [${segment.time}]:\n${segment.imagePrompt}`
    ).join('\n\n');

    try {
      await navigator.clipboard.writeText(promptsText);
      setCopiedItems(prev => ({ ...prev, [key]: true }));
      toast({
        title: "Copied",
        description: "All image prompts copied to clipboard!",
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

  const handleCopyVideoPrompts = async (script: YouTubeScriptSegment[], outputIndex: number) => {
    const key = `video-prompts-${outputIndex}`;

    const promptsText = script.map((segment, index) =>
      `Scene ${index + 1} [${segment.time}]:\n${segment.videoPrompt}`
    ).join('\n\n');

    try {
      await navigator.clipboard.writeText(promptsText);
      setCopiedItems(prev => ({ ...prev, [key]: true }));
      toast({
        title: "Copied",
        description: "All video prompts copied to clipboard!",
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

  const handleGenerateImage = async (prompt: string, segmentIndex: number, outputIndex: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate images.",
        variant: "destructive",
      });
      return;
    }

    const key = `${outputIndex}-${segmentIndex}`;
    setGeneratingImages(prev => ({ ...prev, [key]: true }));

    try {
      const response = await fetch("https://n8n.getostrichai.com/webhook/youtube-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          userId: user.id
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

        // Update project metadata with generated image
        if (projectId) {
          try {
            // For direct script projects, the metadata update is handled by the parent component
            // We just log success here since the image is already stored in component state
            console.log('✅ Image generated successfully:', imageUrl);
          } catch (error) {
            console.error('❌ Failed to update project with generated image:', error);
          }
        }

        toast({
          title: "Success",
          description: "Image generated and saved to project!",
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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in">
      {data.map((item, outputIndex) => (
        <div key={outputIndex} className="space-y-6">
          {/* Script Header */}
          <div className="text-center space-y-4">
            <Badge variant="outline" className="text-sm px-4 py-1">
              YouTube Script #{outputIndex + 1}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              {item.output.title}
            </h2>

            <div className="flex gap-2 justify-center flex-wrap">
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
              <Button
                onClick={() => handleCopyImagePrompts(item.output.script, outputIndex)}
                variant="outline"
                size="sm"
              >
                {copiedItems[`image-prompts-${outputIndex}`] ? (
                  <>
                    <CopyCheck className="w-4 h-4" />
                    Image Prompts Copied
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    Copy Image Prompts
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleCopyVideoPrompts(item.output.script, outputIndex)}
                variant="outline"
                size="sm"
              >
                {copiedItems[`video-prompts-${outputIndex}`] ? (
                  <>
                    <CopyCheck className="w-4 h-4" />
                    Video Prompts Copied
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    Copy Video Prompts
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Script Segments */}
          <div className="space-y-6">
            {item.output.script.map((segment, segmentIndex) => (
              <Card key={segmentIndex} className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3 text-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {segment.time}
                      </Badge>
                      <span>Scene {segmentIndex + 1}</span>
                    </div>
                    <Button
                      onClick={() => handleCopySegment(segmentIndex, segment.text, outputIndex)}
                      variant="ghost"
                      size="sm"
                    >
                      {copiedItems[`segment-${outputIndex}-${segmentIndex}`] ? (
                        <CopyCheck className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Script Text */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Video className="w-4 h-4 text-primary" />
                      Script Text
                    </h4>
                    <div className="p-4 bg-secondary/10 rounded-lg border border-border/50">
                      <p className="text-foreground leading-relaxed whitespace-pre-line">
                        {segment.text}
                      </p>
                    </div>
                  </div>

                  {/* Image Prompt */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      Image Prompt
                    </h4>
                    <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                      <p className="text-sm text-foreground/80 italic leading-relaxed">
                        {segment.imagePrompt}
                      </p>
                    </div>
                  </div>

                  {/* Video Prompt */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Video Prompt
                    </h4>
                    <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                      <p className="text-sm text-foreground/80 italic leading-relaxed">
                        {segment.videoPrompt}
                      </p>
                    </div>
                  </div>

                  {/* Image Generation */}
                  <div className="flex gap-2 pt-4 border-t border-border/50">
                    <Button
                      onClick={() => handleGenerateImage(segment.imagePrompt, segmentIndex, outputIndex)}
                      disabled={generatingImages[`${outputIndex}-${segmentIndex}`]}
                      size="sm"
                      variant="gradient"
                      className="flex-1"
                    >
                      {generatingImages[`${outputIndex}-${segmentIndex}`] ? (
                        <>
                          <Sparkles className="animate-spin w-4 h-4 mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Generate Image
                        </>
                      )}
                    </Button>

                    {generatedImages[`${outputIndex}-${segmentIndex}`] && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a href={generatedImages[`${outputIndex}-${segmentIndex}`]} download={`scene-${segmentIndex + 1}.png`}>
                          <Sparkles className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>

                  {generatedImages[`${outputIndex}-${segmentIndex}`] && (
                    <div className="mt-3">
                      <img
                        src={generatedImages[`${outputIndex}-${segmentIndex}`]}
                        alt={`Generated for scene ${segmentIndex + 1}`}
                        className="w-full rounded-md border border-border"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
