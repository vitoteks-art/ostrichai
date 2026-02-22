import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ResearchOutput {
  title: string;
  thumbnailPrompt: string;
  targetAudience: string;
  contentAngle: string;
  powerWordsUsed: string[];
}

interface ResearchResultsProps {
  data: Array<{
    output?: ResearchOutput;
    extractedUrl?: string;
    success?: boolean;
  }>;
}

const ResearchResults = ({ data }: ResearchResultsProps) => {
  const output = data.find(item => item.output)?.output;
  const imageData = data.find(item => item.extractedUrl);
  const imageUrl = imageData?.extractedUrl;

  if (!output) return null;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Title Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl">{output.title}</CardTitle>
        </CardHeader>
      </Card>

      {/* Thumbnail Image */}
      {imageUrl && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <img 
              src={imageUrl} 
              alt="Generated thumbnail" 
              className="w-full h-auto object-cover"
            />
          </CardContent>
        </Card>
      )}

      {/* Content Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Target Audience</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{output.targetAudience}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Content Angle</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{output.contentAngle}</p>
          </CardContent>
        </Card>
      </div>

      {/* Power Words */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Power Words</CardTitle>
          <CardDescription>Key phrases to maximize engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {output.powerWordsUsed && output.powerWordsUsed.length > 0 ? (
              output.powerWordsUsed.map((word, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {word}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No power words available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thumbnail Design Brief</CardTitle>
          <CardDescription>Detailed prompt used for thumbnail generation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {output.thumbnailPrompt}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResearchResults;
