import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  Palette,
  Image as ImageIcon,
  FileText,
  Eye,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Project } from '@/hooks/useProjects';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const getProjectIcon = (type: string, projectType?: string) => {
    const actualType = projectType || type;

    switch (actualType) {
      case 'video':
      case 'video_generation':
        return <Video className="h-5 w-5 text-blue-500" />;
      case 'logo':
      case 'logo_generation':
        return <Palette className="h-5 w-5 text-purple-500" />;
      case 'ad':
      case 'image_ad':
      case 'title_generation':
        return <ImageIcon className="h-5 w-5 text-green-500" />;
      case 'blog':
      case 'blog_research':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'seo_audit':
        return <FileText className="h-5 w-5 text-emerald-500" />;
      case 'social_post':
      case 'social':
        return <Sparkles className="h-5 w-5 text-pink-500" />;
      case 'flyer':
        return <Palette className="h-5 w-5 text-orange-500" />;
      case 'script':
      case 'youtube':
      case 'enhanced-youtube':
        return <FileText className="h-5 w-5 text-indigo-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getProjectTypeLabel = (type: string, projectType?: string) => {
    const actualType = projectType || type;

    switch (actualType) {
      case 'video':
      case 'video_generation':
        return 'Video Generation';
      case 'logo':
      case 'logo_generation':
        return 'Logo Design';
      case 'ad':
      case 'image_ad':
        return 'Ad Creative';
      case 'title_generation':
        return 'Title Generation';
      case 'blog':
      case 'blog_research':
        return 'Blog Research';
      case 'seo_audit':
        return 'SEO Audit';
      case 'social_post':
      case 'social':
        return 'Social Media Post';
      case 'flyer':
        return 'Flyer Design';
      case 'script':
      case 'youtube':
      case 'enhanced-youtube':
        return 'Script Generation';
      default:
        return 'Content';
    }
  };

  const getContentPreview = (project: Project) => {
    const metadata = project.metadata;
    if (!metadata) return 'No preview available';

    // Enhanced type detection for script projects
    const actualType = metadata.projectType ||
      project.type ||
      (metadata.scriptType ? 'script' : null) ||
      (metadata.scriptResult ? 'script' : null);

    switch (actualType) {
      case 'title_generation':
        return metadata.generatedContent?.title || 'YouTube title generated';
      case 'video':
      case 'video_generation':
        return metadata.description || 'Video generated';
      case 'logo':
      case 'logo_generation':
        return `Logo for ${metadata.brandName || 'brand'}`;
      case 'image_ad':
      case 'image_edit':
        return metadata.description || 'Image edited';
      case 'ad':
        return metadata.description || 'Ad creative created';
      case 'blog':
      case 'blog_research':
        return metadata.query || 'Blog research completed';
      case 'seo_audit':
        return metadata.summary?.executive_summary || metadata.url || 'SEO audit completed';
      case 'social_post':
      case 'social':
        return metadata.description || metadata.query || 'Social media post created';
      case 'flyer':
        return metadata.headline || 'Flyer design created';
      case 'script':
      case 'youtube':
      case 'enhanced-youtube':
        // Also check for script data even if type detection didn't work perfectly
        const scriptResult = metadata.scriptResult;
        if (scriptResult && Array.isArray(scriptResult) && scriptResult.length > 0) {
          const firstScript = scriptResult[0];
          if (firstScript.output?.title) {
            return firstScript.output.title;
          }
          if (firstScript.title) {
            return firstScript.title;
          }
        }
        return metadata.topic || metadata.title || 'Script generated';
      default:
        return 'Content generated';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-200 cursor-pointer group ${isExpanded ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {getProjectIcon(project.type, project.metadata?.projectType)}
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
            {isExpanded && (
              <Badge variant="outline" className="text-xs">
                Expanded
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isExpanded && (
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(project.created_at)}
            </span>
          </div>
        </div>

        <CardTitle className="text-lg leading-tight line-clamp-2">
          {project.title}
        </CardTitle>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{getProjectTypeLabel(project.type, project.metadata?.projectType)}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {getContentPreview(project)}
        </p>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            className="flex-1 shadow-sm hover:shadow-md transition-all"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/project/${project.id}`);
            }}
          >
            <ArrowRight className="h-4 w-4 mr-1" />
            View Details
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="hover:bg-secondary"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            title={isExpanded ? 'Hide Preview' : 'Show Preview'}
          >
            <Eye className={`h-4 w-4 transition-transform ${isExpanded ? 'scale-110 text-primary' : ''}`} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/project/${project.id}`, '_blank');
            }}
            title="Open in New Tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        {/* Expanded Content Preview */}
        {isExpanded && (
          <div className="mt-4 p-4 bg-secondary/30 rounded-lg border border-secondary animate-in slide-in-from-top-2 duration-200">
            <div className="mb-2">
              <h4 className="font-medium text-sm text-foreground mb-1">Content Preview</h4>
              <div className="w-full bg-secondary/50 h-px"></div>
            </div>
            <ProjectContentPreview project={project} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Content preview component for expanded view
const ProjectContentPreview = ({ project }: { project: Project }) => {
  const metadata = project.metadata;
  if (!metadata) return <p className="text-sm text-muted-foreground">No preview available</p>;

  // Enhanced type detection for script projects
  const actualType = metadata.projectType ||
    project.type ||
    (metadata.scriptType ? 'script' : null) ||
    (metadata.scriptResult ? 'script' : null) ||
    (metadata.topic && metadata.powerWords ? 'script' : null);

  switch (actualType) {
    case 'title_generation':
      return (
        <div className="space-y-2">
          <div>
            <h4 className="font-medium text-sm mb-1">Generated Title</h4>
            <p className="text-sm text-foreground">{metadata.generatedContent?.title}</p>
          </div>
          {metadata.generatedContent?.description && (
            <div>
              <h4 className="font-medium text-sm mb-1">Description</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {metadata.generatedContent.description}
              </p>
            </div>
          )}
          {metadata.generatedContent?.thumbnailImageUrl && (
            <div>
              <h4 className="font-medium text-sm mb-1">Thumbnail</h4>
              <ThumbnailImage
                src={metadata.generatedContent.thumbnailImageUrl}
                alt="Generated thumbnail"
              />
            </div>
          )}
        </div>
      );

    case 'video':
    case 'video_generation':
      return (
        <div className="space-y-2">
          <p className="text-sm">{metadata.description}</p>
          {metadata.taskId && (
            <p className="text-xs text-muted-foreground">Task ID: {metadata.taskId}</p>
          )}
        </div>
      );

    case 'logo':
    case 'logo_generation':
      return (
        <div className="space-y-1 text-sm">
          <p><strong>Brand:</strong> {metadata.brandName}</p>
          <p><strong>Industry:</strong> {metadata.industry}</p>
          <p><strong>Style:</strong> {metadata.stylePreference}</p>
        </div>
      );

    case 'image_ad':
    case 'ad':
    case 'image_edit':
      return (
        <div className="space-y-2">
          <p className="text-sm">{metadata.description || 'No description provided'}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {metadata.model && <Badge variant="outline" className="text-[10px]">{metadata.model}</Badge>}
            {metadata.resolution && <Badge variant="outline" className="text-[10px]">{metadata.resolution}</Badge>}
            {metadata.editType && <Badge variant="secondary" className="text-[10px]">{metadata.editType}</Badge>}
          </div>
        </div>
      );

    case 'blog':
    case 'blog_research':
      return (
        <div className="space-y-2">
          <p className="text-sm">{metadata.query}</p>
          <p className="text-xs text-muted-foreground">Research query</p>
        </div>
      );
    case 'seo_audit':
      return (
        <div className="space-y-2">
          <p className="text-sm">{metadata.summary?.executive_summary || 'SEO audit completed'}</p>
          {metadata.url && (
            <p className="text-xs text-muted-foreground">URL: {metadata.url}</p>
          )}
        </div>
      );

    case 'social_post':
    case 'social':
      return (
        <div className="space-y-2">
          <p className="text-sm">{metadata.description || metadata.query}</p>
          <p className="text-xs text-muted-foreground">Platform: {metadata.platform}</p>
        </div>
      );

    case 'flyer':
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">{metadata.headline}</p>
          <p className="text-xs text-muted-foreground">Venue: {metadata.venue}</p>
          <p className="text-xs text-muted-foreground">Date: {metadata.date}</p>
        </div>
      );

    case 'script':
    case 'youtube':
    case 'enhanced-youtube':
      // Also check for script data even if type detection didn't work perfectly
      const scriptResult = metadata.scriptResult;
      if (scriptResult && Array.isArray(scriptResult) && scriptResult.length > 0) {
        const firstScript = scriptResult[0];
        const output = firstScript.output || firstScript;

        return (
          <div className="space-y-3">
            {output.title && (
              <div>
                <h4 className="font-medium text-sm mb-1">Script Title</h4>
                <p className="text-sm text-foreground">{output.title}</p>
              </div>
            )}

            {output.script && (
              <div>
                <h4 className="font-medium text-sm mb-2">Script Sections</h4>
                <div className="space-y-2">
                  {Object.keys(output.script).slice(0, 3).map((sectionName, idx) => {
                    const content = output.script[sectionName];
                    if (!content) return null;

                    return (
                      <div key={idx} className="text-xs">
                        <div className="font-medium text-muted-foreground uppercase text-xs mb-1">
                          {sectionName.replace(/_/g, ' ')}
                        </div>
                        <p className="text-foreground line-clamp-2">{String(content)}</p>
                      </div>
                    );
                  })}
                  {Object.keys(output.script).length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{Object.keys(output.script).length - 3} more sections
                    </p>
                  )}
                </div>
              </div>
            )}

            {output.estimated_runtime_minutes && (
              <div className="text-xs text-muted-foreground">
                Duration: {output.estimated_runtime_minutes} minutes
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="space-y-2">
          <p className="text-sm">{metadata.topic || metadata.title || 'Script generated'}</p>
          <p className="text-xs text-muted-foreground">Script content available</p>
        </div>
      );

    default:
      // Debug information for troubleshooting
      console.log('ProjectCard Debug:', {
        projectType: project.type,
        metadataProjectType: metadata.projectType,
        hasScriptResult: !!metadata.scriptResult,
        hasScriptType: !!metadata.scriptType,
        hasTopic: !!metadata.topic,
        hasPowerWords: !!metadata.powerWords,
        metadataKeys: Object.keys(metadata || {}),
        actualType
      });

      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Project type: {project.type || 'unknown'}
          </p>
          {metadata.scriptResult && (
            <p className="text-sm text-green-600">✓ Has script content</p>
          )}
          {metadata.topic && (
            <p className="text-sm text-blue-600">✓ Topic: {metadata.topic}</p>
          )}
          <p className="text-xs text-muted-foreground">Click "View Details" for full content</p>
        </div>
      );
  }
};

// Custom Thumbnail component with lazy loading and error handling
const ThumbnailImage = ({ src, alt }: { src: string; alt: string }) => {
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  if (error) {
    return (
      <div className="w-full h-20 bg-secondary/50 rounded flex items-center justify-center border border-dashed border-border">
        <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-20">
      {loading && (
        <Skeleton className="absolute inset-0 w-full h-full rounded" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        className={`w-full h-20 object-cover rounded transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
};
