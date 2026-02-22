import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlogPostResponse {
  output: {
    title: string;
    content: string;
  };
}

interface ImageResponse {
  extractedUrl: string;
  success: boolean;
}

interface BlogPostDisplayProps {
  response: (BlogPostResponse | ImageResponse)[];
}

const BlogPostDisplay = ({ response }: BlogPostDisplayProps) => {
  const { toast } = useToast();
  
  // Extract blog content and images from response
  const blogData = response.find(item => 'output' in item) as BlogPostResponse;
  const images = response.filter(item => 'extractedUrl' in item && item.success) as ImageResponse[];

  if (!blogData) {
    return null;
  }

  const { title, content } = blogData.output;
  
  // Process content to properly format lists with line breaks
  const processContent = (content: string) => {
    // Add proper line breaks before lists
    let processed = content
      .replace(/([^\n])\n[-*+]\s/g, '$1\n\n- ')
      .replace(/([^\n])\n(\d+)\.\s/g, '$1\n\n$2. ');
      
    // Ensure consistent spacing between list items
    processed = processed
      .replace(/\n[-*+]\s/g, '\n- ')
      .replace(/\n(\d+)\.\s/g, '\n$1. ');
      
    return processed;
  };
  
  const copyToClipboard = async () => {
    // Process content to remove markdown syntax and improve formatting
    const processedContent = processContent(content)
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold syntax
      .replace(/\*(.*?)\*/g, '$1');     // Remove italic syntax
    
    const fullContent = `${title}\n\n${processedContent}`;
    try {
      await navigator.clipboard.writeText(fullContent);
      toast({
        title: "Copied!",
        description: "Blog post copied to clipboard with improved formatting",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };
  
  // Process content to improve formatting
  const processedContent = processContent(content);
  
  // Split content into paragraphs and insert images
  const paragraphs = processedContent.split('\n\n').filter(p => p.trim());
  
  const renderContentWithImages = () => {
    const elements: JSX.Element[] = [];
    let subheadingCount = 0;
    let inList = false;
    let listItems: JSX.Element[] = [];
    
    paragraphs.forEach((paragraph, index) => {
      // Track subheadings (## level)
      if (paragraph.startsWith('## ')) {
        subheadingCount++;
      }
      
      // Check if paragraph is a list item
      const isBulletItem = /^[-*+]\s/.test(paragraph);
      const isNumberedItem = /^\d+\.\s/.test(paragraph);
      
      // If we're starting a new list
      if ((isBulletItem || isNumberedItem) && !inList) {
        inList = true;
        listItems = [];
      }
      
      // If we're in a list and this is a list item
      if (inList && (isBulletItem || isNumberedItem)) {
        // Remove the list marker and add to list items
        const content = paragraph.replace(/^[-*+]\s|^\d+\.\s/, '')
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold syntax
          .replace(/\*(.*?)\*/g, '$1');     // Remove italic syntax
        listItems.push(
          <li key={`list-item-${index}`} className="ml-6 mb-2 text-muted-foreground leading-relaxed">
            {content}
          </li>
        );
        return; // Skip to next paragraph
      }
      
      // If we were in a list but this paragraph is not a list item
      if (inList && !(isBulletItem || isNumberedItem)) {
        // Add the completed list to elements
        elements.push(
          <ul key={`list-${index}`} className="mb-6 list-disc">
            {listItems}
          </ul>
        );
        inList = false;
      }
      
      // Add regular paragraph
      if (!inList) {
        elements.push(
          <div key={`paragraph-${index}`} className="mb-6">
            {paragraph.startsWith('#') ? (
              <div dangerouslySetInnerHTML={{ __html: formatMarkdown(paragraph) }} />
            ) : (
              <p className="text-muted-foreground leading-relaxed text-justify">
                {paragraph.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
              </p>
            )}
          </div>
        );
      }
      
      // Insert images after specific elements
      let imageIndex = -1;
      if (index === 0) imageIndex = 0; // 1st image after 1st paragraph (intro)
      if (paragraph.startsWith('## ') && subheadingCount === 2) imageIndex = 1; // 2nd image after 2nd subheading
      if (paragraph.startsWith('## ') && subheadingCount === 3) imageIndex = 2; // 3rd image after 3rd subheading
      
      if (imageIndex >= 0 && images[imageIndex]) {
        elements.push(
          <div key={`image-${imageIndex}`} className="mb-8">
            <img 
              src={images[imageIndex].extractedUrl} 
              alt={`Blog illustration ${imageIndex + 1}`}
              className="w-full rounded-lg shadow-lg object-cover max-h-96"
              loading="lazy"
            />
          </div>
        );
      }
    });
    
    // If we ended with a list, add it to the elements
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key="final-list" className="mb-6 list-disc">
          {listItems}
        </ul>
      );
    }
    
    return elements;
  };

  const formatMarkdown = (text: string) => {
    return text
      .replace(/^# (.*)/gm, '<h1 class="text-3xl font-bold mb-4 text-foreground">$1</h1>')
      .replace(/^## (.*)/gm, '<h2 class="text-2xl font-semibold mb-3 text-foreground">$1</h2>')
      .replace(/^### (.*)/gm, '<h3 class="text-xl font-medium mb-2 text-foreground">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/^\s*[-*+]\s+(.*)$/gm, '<li class="ml-6 mb-2">$1</li>')
      .replace(/^\s*(\d+)\.\s+(.*)$/gm, '<li class="ml-6 mb-2"><span class="mr-2 font-medium">$1.</span>$2</li>');
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-8">
        <article className="prose prose-lg max-w-none text-justify">
          <header className="mb-8 flex items-start justify-between gap-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent leading-tight flex-1">
              {title}
            </h1>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 shrink-0"
            >
              <Copy className="h-4 w-4" />
              Copy All
            </Button>
          </header>
          
          <div className="space-y-6">
            {renderContentWithImages()}
          </div>
        </article>
      </Card>
    </div>
  );
};

export default BlogPostDisplay;
