import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import BlogPostDisplay from '@/components/BlogPostDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Download,
  Copy,
  ExternalLink,
  Calendar,
  User,
  FileText,
  Image as ImageIcon,
  Video,
  Palette,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Building,
  Filter,
  Search,
  Target,
  Activity,
  Send,
  History,
  RotateCw,
  Edit,
  Trash2,
  MoreHorizontal,
  Maximize2,
  Youtube
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { SocialMediaAccount, getConnectedAccounts } from '@/services/socialMediaOAuthService';
import { postToMultipleAccounts, PostContent } from '@/services/socialMediaPostingService';
import { SubscriptionService } from '@/services/subscriptionService';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EnhancedScriptResult } from '@/components/EnhancedScriptResult';
import SEO from '@/components/SEO';
import { YouTubeScriptResult } from '@/components/YouTubeScriptResult';
import AdsCreative from '@/components/AdsCreative';
import { YoutubeUploadModal } from '@/components/YoutubeUploadModal';
import { openSeoAuditPdf } from '@/lib/seoAuditPdf';

const ProjectView = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getProject } = useProjects();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // YouTube Upload Modal State
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [selectedVideoForYoutube, setSelectedVideoForYoutube] = useState<{ url: string; title: string } | null>(null);
  const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY || '';

  useEffect(() => {
    const fetchProjectDetail = async () => {
      if (id) {
        setLoading(true);
        const result = await getProject(id);
        if (result.success && result.data) {
          setProject(result.data);
        } else {
          toast.error('Failed to load project details');
        }
        setLoading(false);
      }
    };

    fetchProjectDetail();
  }, [id, getProject]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getProjectIcon = (type: string, projectType?: string) => {
    const actualType = projectType || type;

    switch (actualType) {
      case 'video':
      case 'video_generation':
        return <Video className="h-6 w-6 text-blue-500" />;
      case 'logo':
      case 'logo_generation':
        return <Palette className="h-6 w-6 text-purple-500" />;
      case 'ad':
      case 'image_ad':
      case 'title_generation':
        return <ImageIcon className="h-6 w-6 text-green-500" />;
      case 'flyer':
        return <FileText className="h-6 w-6 text-orange-500" />;
      case 'blog':
      case 'blog_research':
        return <FileText className="h-6 w-6 text-orange-500" />;
      case 'social_post':
        return <Sparkles className="h-6 w-6 text-pink-500" />;
      case 'scraping':
        return <MapPin className="h-6 w-6 text-green-500" />;
      case 'script':
      case 'youtube':
      case 'enhanced-youtube':
        return <FileText className="h-6 w-6 text-indigo-500" />;
      case 'seo_audit':
        return <Globe className="h-6 w-6 text-emerald-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
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
      case 'flyer':
        return 'Flyer Design';
      case 'title_generation':
        return 'Title Generation';
      case 'blog':
      case 'blog_research':
        return 'Blog Research';
      case 'social_post':
        return 'Social Media Post';
      case 'scraping':
        return 'Google Maps Scraping';
      case 'script':
      case 'youtube':
      case 'enhanced-youtube':
        return 'Script Generation';
      case 'seo_audit':
        return 'SEO Audit';
      default:
        return 'Content';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading project...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
            <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
            <Link to="/projects">
              <Button>Back to Projects</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const metadata = project.project_metadata || project.metadata || {};

  // Enhanced type detection for script projects
  const actualType = metadata.projectType ||
    project.type ||
    (metadata.scriptType ? 'script' : null) ||
    (metadata.scriptResult ? 'script' : null) ||
    (metadata.scrapingResults ? 'scraping' : null);

  // Debug logging for scraping projects
  if (project.type === 'scraping' || metadata.scrapingResults) {
    console.log('🎯 Scraping project detected:', {
      projectType: project.type,
      metadataProjectType: metadata.projectType,
      hasScrapingResults: !!metadata.scrapingResults,
      scrapingResultsLength: metadata.scrapingResults?.length || 0,
      actualType: actualType,
      metadataKeys: Object.keys(metadata)
    });
  }

  return (
    <Layout>
      <SEO
        title="View Project | OstrichAi Workspace"
        description="View and manage your AI-generated marketing projects. Access your results, download assets, and track your creative progress."
      />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/projects">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              {getProjectIcon(project.type, metadata.projectType)}
              <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                {getStatusIcon(project.status)}
                <span className="ml-2">{project.status}</span>
              </Badge>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>{getProjectTypeLabel(project.type, metadata.projectType)}</span>
            <span>•</span>
            <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Project Content */}
        <div className="max-w-none mx-auto space-y-6 px-4">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Project ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-secondary px-2 py-1 rounded">{project.id}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(project.id, 'Project ID')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="mt-1">{new Date(project.created_at).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Info (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-800">Debug Information</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-2">
                  <div><strong>Project Type:</strong> {project.type}</div>
                  <div><strong>Metadata Project Type:</strong> {metadata.projectType || 'none'}</div>
                  <div><strong>Detected Type:</strong> {actualType || 'none'}</div>
                  <div><strong>Has Script Result:</strong> {metadata.scriptResult ? 'Yes' : 'No'}</div>
                  <div><strong>Has Script Type:</strong> {metadata.scriptType ? 'Yes' : 'No'}</div>
                  <div><strong>Script Result Type:</strong> {Array.isArray(metadata.scriptResult) ? 'Array' : typeof metadata.scriptResult}</div>
                  {metadata.scriptResult && (
                    <div><strong>Script Result Length:</strong> {Array.isArray(metadata.scriptResult) ? metadata.scriptResult.length : 'N/A'}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Based on Type */}
          {actualType === 'title_generation' && (
            <YouTubeTitleContent metadata={metadata} />
          )}

          {actualType === 'video' && metadata.resultUrl && (
            <VideoLipsyncContent
              metadata={metadata}
              project={project}
              setYoutubeModalOpen={setYoutubeModalOpen}
              setSelectedVideoForYoutube={setSelectedVideoForYoutube}
            />
          )}
          {actualType === 'video' && !metadata.resultUrl && (
            <VideoContent metadata={metadata} />
          )}

          {actualType === 'logo' && (
            <LogoContent metadata={metadata} project={project} />
          )}

          {(actualType === 'image_ad' || (actualType === 'ad' && metadata.creativeType === 'image_ad')) && (
            <ImageAdContent metadata={metadata} />
          )}

          {actualType === 'blog' && (
            <BlogContent metadata={metadata} />
          )}

          {actualType === 'social_post' && (
            <SocialPostContent metadata={metadata} />
          )}

          {actualType === 'scraping' && (
            <ScrapingContent metadata={metadata} />
          )}

          {actualType === 'seo_audit' && (
            <SeoAuditContent metadata={metadata} />
          )}

          {/* Show YouTubeResearchContent for YouTube research projects */}
          {actualType === 'youtube' && metadata.researchResults && (
            <YouTubeResearchContent metadata={metadata} />
          )}

          {/* Show YouTubeScriptResult for YouTube scripts (script is array) */}
          {metadata.scriptVersion && metadata.scriptVersion.includes('youtube') && metadata.scriptResult && metadata.scriptResult[0]?.output?.script && Array.isArray(metadata.scriptResult[0].output.script) && (
            <YouTubeScriptResult data={metadata.scriptResult} projectId={id} />
          )}

          {/* Show YouTubeScriptResult for YouTube script projects with direct script array */}
          {actualType === 'youtube' && metadata.script && Array.isArray(metadata.script) && !metadata.researchResults && (
            <YouTubeScriptResult data={[{ output: { title: metadata.title, script: metadata.script, generatedImages: metadata.generatedImages } }]} projectId={id} />
          )}

          {/* Show EnhancedScriptResult for enhanced scripts (script is object) */}
          {metadata.scriptVersion && (metadata.scriptVersion.includes('enhanced') || (metadata.scriptVersion.includes('youtube') && metadata.scriptResult && metadata.scriptResult[0]?.output?.script && !Array.isArray(metadata.scriptResult[0].output.script))) && metadata.scriptResult && (
            <EnhancedScriptResult data={metadata.scriptResult} />
          )}

          {/* Show ScriptContent for regular scripts and other script types */}
          {(actualType === 'script' || actualType === 'enhanced-youtube' || metadata.scriptResult) && actualType !== 'youtube' && !(metadata.scriptVersion && (metadata.scriptVersion.includes('enhanced') || metadata.scriptVersion.includes('youtube'))) && (
            <ScriptContent metadata={metadata} />
          )}

          {/* Show FlyerContent for flyer projects */}
          {actualType === 'flyer' && (
            <FlyerContent metadata={metadata} project={project} />
          )}

          {/* Show AdContent for ad projects that are NOT image edits */}
          {actualType === 'ad' && !metadata.editType && (
            <AdContent metadata={metadata} />
          )}

          {/* Show ImageEditContent for image editing projects (including ad type with editType) */}
          {(actualType === 'image_edit' || (actualType === 'ad' && (metadata.editType === 'image_edit' || metadata.editType === 'two_image_edit'))) && (
            <ImageEditContent metadata={metadata} project={project} />
          )}

          {/* Raw Data (for debugging) */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Project Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-secondary p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(project, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div >

      {/* YouTube Upload Modal */}
      {selectedVideoForYoutube && (
        <YoutubeUploadModal
          open={youtubeModalOpen}
          onClose={() => {
            setYoutubeModalOpen(false);
            setSelectedVideoForYoutube(null);
          }}
          videoUrl={selectedVideoForYoutube.url}
          defaultTitle={selectedVideoForYoutube.title}
          imgbbKey={imgbbKey}
        />
      )}
    </Layout >
  );
};

// Content display components for different project types
const VideoContent = ({ metadata }: { metadata: any }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Video className="h-5 w-5 text-blue-500" />
        Video Generation Content
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-center py-8">
        <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Video content available</p>
        <p className="text-sm text-muted-foreground mt-2">This is a standard video generation project.</p>
      </div>
    </CardContent>
  </Card>
);

const VideoLipsyncContent = ({
  metadata,
  project,
  setYoutubeModalOpen,
  setSelectedVideoForYoutube
}: {
  metadata: any;
  project: any;
  setYoutubeModalOpen: (open: boolean) => void;
  setSelectedVideoForYoutube: (video: { url: string; title: string } | null) => void;
}) => {
  const videoUrl = metadata.resultUrl;
  const taskId = metadata.taskId;

  if (!videoUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-500" />
            Lipsync Video Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No video URL available</p>
            <p className="text-sm text-muted-foreground mt-2">The lipsync video may still be processing.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-blue-500" />
          Lipsync Video Content
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Video Player */}
        <div className="flex justify-center">
          <video
            controls
            className="max-w-full max-h-96 rounded-lg shadow-lg border"
            src={videoUrl}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = '<p class="text-muted-foreground text-center py-8">Failed to load video</p>';
              }
            }}
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Video Metadata Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/20 rounded-lg">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Project Title</label>
            <p className="font-medium mt-1">{project.title}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Task ID</label>
            <p className="font-medium mt-1 font-mono text-sm">{taskId || 'N/A'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => window.open(videoUrl, '_blank')}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const link = document.createElement('a');
              link.href = videoUrl;
              link.download = `lipsync-video-${taskId || 'download'}.mp4`;
              link.click();
            }}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            onClick={() => navigator.clipboard.writeText(videoUrl)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy URL
          </Button>

          {/* YouTube Upload Button */}
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg transition-all"
            onClick={() => {
              setSelectedVideoForYoutube({ url: videoUrl, title: project.title });
              setYoutubeModalOpen(true);
            }}
          >
            <Youtube className="h-4 w-4 mr-2" />
            Upload to YouTube
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const LogoContent = ({ metadata, project }: { metadata: any; project: any }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-purple-500" />
        Logo Design Content
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Logo Image Display */}
      {(metadata.file_url || project.file_url) && (
        <div>
          <h3 className="font-semibold mb-2">Generated Logo</h3>
          <div className="flex justify-center">
            <img
              src={metadata.file_url || project.file_url}
              alt="Generated logo"
              className="max-w-full max-h-96 rounded-lg shadow-lg border"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<p class="text-muted-foreground text-center py-8">Failed to load logo image</p>';
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Logo Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Brand Name</label>
            <p className="font-medium">{metadata.brandName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Industry</label>
            <p>{metadata.industry}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Style Preference</label>
            <p>{metadata.stylePreference}</p>
          </div>
          {metadata.slogan && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Slogan</label>
              <p className="italic">{metadata.slogan}</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Metadata */}
      {metadata.colors && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">Colors</label>
          <p>{metadata.colors}</p>
        </div>
      )}

      {metadata.userRequest && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">User Request</label>
          <p className="text-sm bg-secondary/20 p-3 rounded-lg">{metadata.userRequest}</p>
        </div>
      )}

      {/* Action Buttons */}
      {(metadata.file_url || project.file_url) && (
        <div className="pt-4 border-t flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(metadata.file_url || project.file_url, '_blank')}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Size
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const link = document.createElement('a');
              link.href = metadata.file_url || project.file_url;
              link.download = `logo-${metadata.brandName || 'download'}.png`;
              link.click();
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);

const YouTubeTitleContent = ({ metadata }: { metadata: any }) => (
  <Card>
    <CardHeader>
      <CardTitle>YouTube Title Generation Content</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      {metadata.generatedContent?.title && (
        <div>
          <h3 className="font-semibold mb-2">Generated Title</h3>
          <div className="flex items-start gap-3 p-4 bg-secondary/20 rounded-lg">
            <div className="flex-1">
              <p className="text-lg font-medium">{metadata.generatedContent.title}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(metadata.generatedContent.title)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {metadata.generatedContent?.description && (
        <div>
          <h3 className="font-semibold mb-2">Video Description</h3>
          <div className="p-4 bg-secondary/20 rounded-lg">
            <p className="whitespace-pre-wrap">{metadata.generatedContent.description}</p>
          </div>
        </div>
      )}

      {metadata.generatedContent?.thumbnailImageUrl && (
        <div>
          <h3 className="font-semibold mb-2">Generated Thumbnail</h3>
          <div className="flex justify-center">
            <img
              src={metadata.generatedContent.thumbnailImageUrl}
              alt="Generated thumbnail"
              className="max-w-full max-h-64 rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}

      {metadata.generatedContent?.targetAudience && (
        <div>
          <h3 className="font-semibold mb-2">Target Audience</h3>
          <p className="p-3 bg-secondary/20 rounded-lg">{metadata.generatedContent.targetAudience}</p>
        </div>
      )}

      {metadata.generatedContent?.contentAngle && (
        <div>
          <h3 className="font-semibold mb-2">Content Angle</h3>
          <p className="p-3 bg-secondary/20 rounded-lg">{metadata.generatedContent.contentAngle}</p>
        </div>
      )}

      {metadata.generatedContent?.powerWordsUsed && metadata.generatedContent.powerWordsUsed.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Power Words Used</h3>
          <div className="flex flex-wrap gap-2">
            {metadata.generatedContent.powerWordsUsed.map((word: string, index: number) => (
              <Badge key={index} variant="secondary">{word}</Badge>
            ))}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

const ImageAdContent = ({ metadata }: { metadata: any }) => {
  const results = metadata.results || [];

  return (
    <div className="space-y-6">
      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-blue-500" />
            Image Ad Creative Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-secondary/20 rounded-lg">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Creative Description</label>
              <p className="font-medium mt-1">{metadata.description}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Images Used</label>
              <p className="font-medium mt-1">{metadata.imageCount || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Scenes Generated</label>
              <p className="font-medium mt-1">{metadata.sceneCount || results.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {results.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Generated Ad Scenes</h3>
            <Badge variant="secondary">{results.length} scenes</Badge>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {results.map((scene: any, index: number) => (
              <Card key={scene.id || index} className="overflow-hidden border-l-4 border-l-blue-500 shadow-lg">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* Image Section */}
                    <div className="relative bg-gray-50 p-6 flex items-center justify-center min-h-[300px]">
                      {scene.image_url ? (
                        <div className="relative w-full max-w-md">
                          <img
                            src={scene.image_url}
                            alt={scene.title}
                            className="w-full h-auto max-h-80 object-contain rounded-lg shadow-md border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                    <ImageIcon class="h-12 w-12 mb-2 opacity-50" />
                                    <p class="text-center">Failed to load image</p>
                                  </div>
                                `;
                              }
                            }}
                          />
                          {/* Overlay with title and voice over */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                            <h4 className="text-white font-semibold text-lg mb-2">{scene.title}</h4>
                            {scene.voice_over && (
                              <p className="text-white/90 text-sm italic leading-relaxed line-clamp-2">
                                "{scene.voice_over}"
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                          <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                          <p>No image available</p>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-6 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              Scene {scene.scene_number || index + 1}
                            </Badge>
                            {scene.video_status && (
                              <Badge variant={scene.video_status === 'pending' ? 'secondary' : 'default'}>
                                {scene.video_status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Task ID: {scene.task_id || scene.taskId}
                          </p>
                        </div>
                      </div>

                      {/* Prompts */}
                      <div className="space-y-4">
                        {scene.image_prompt && (
                          <div>
                            <h5 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                              Image Prompt
                            </h5>
                            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                              <p className="text-sm leading-relaxed text-gray-700">{scene.image_prompt}</p>
                            </div>
                          </div>
                        )}

                        {scene.video_prompt && (
                          <div>
                            <h5 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                              Video Prompt
                            </h5>
                            <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-200">
                              <p className="text-sm leading-relaxed text-gray-700">{scene.video_prompt}</p>
                            </div>
                          </div>
                        )}

                        {scene.voice_over && (
                          <div>
                            <h5 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                              Voice Over Script
                            </h5>
                            <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-200">
                              <p className="text-sm italic leading-relaxed text-gray-700">"{scene.voice_over}"</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4 border-t flex flex-wrap gap-2">
                        {scene.image_url && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(scene.image_url, '_blank')}
                              className="flex-1 min-w-0"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Full Size
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = scene.image_url;
                                link.download = `scene-${scene.scene_number || index + 1}.png`;
                                link.click();
                              }}
                              className="flex-1 min-w-0"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const content = `Scene ${scene.scene_number || index + 1}: ${scene.title}\n\nImage Prompt: ${scene.image_prompt || 'N/A'}\n\nVideo Prompt: ${scene.video_prompt || 'N/A'}\n\nVoice Over: ${scene.voice_over || 'N/A'}`;
                            navigator.clipboard.writeText(content);
                            toast.success('Scene details copied to clipboard');
                          }}
                          className="flex-1 min-w-0"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Scenes Generated Yet</h3>
            <p className="text-muted-foreground mb-4">The creative generation may still be in progress or encountered an issue.</p>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Processing...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const BlogContent = ({ metadata }: { metadata: any }) => {
  const titleIdeas = metadata?.titles || [];
  const topics = metadata?.topics || [];
  const selectedTitle =
    metadata?.selectedTitle
    || metadata?.title
    || metadata?.sectionConfig?.topic
    || metadata?.query
    || "Blog Research";

  const sectionConfig = metadata?.sectionConfig || {};
  const sectionDetails = metadata?.sectionDetails || [];
  const sectionSources = metadata?.sectionSources || [];
  const sectionOutline = metadata?.sectionOutlineText
    || (Array.isArray(metadata?.sections) ? metadata.sections.join("\n") : "");

  const seoEntries = Array.isArray(metadata?.seo) ? metadata.seo : metadata?.seo ? [metadata.seo] : [];

  const content =
    metadata?.content?.content
    || metadata?.content?.blog
    || metadata?.blog
    || metadata?.output?.blog
    || "";

  const blogResponse = content
    ? [{ output: { title: selectedTitle, content } }]
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Title Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {metadata?.query && (
            <p><strong>Research Query:</strong> {metadata.query}</p>
          )}
          {topics.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold">Title ideas</p>
              <div className="grid gap-3">
                {topics.map((topic: any, index: number) => (
                  <div key={`${topic.title}-${index}`} className="rounded-lg border border-border/60 p-3">
                    <div className="font-medium">{topic.title}</div>
                    {topic.targetAudience && (
                      <div className="text-xs text-muted-foreground mt-1">Audience: {topic.targetAudience}</div>
                    )}
                    {topic.searchIntent && (
                      <div className="text-xs text-muted-foreground">Intent: {topic.searchIntent}</div>
                    )}
                    {Array.isArray(topic.powerWordsUsed) && topic.powerWordsUsed.length > 0 && (
                      <div className="text-xs text-muted-foreground">Power words: {topic.powerWordsUsed.join(", ")}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {topics.length === 0 && titleIdeas.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold">Title ideas</p>
              <ul className="list-disc pl-5 text-muted-foreground">
                {titleIdeas.map((idea: string, index: number) => (
                  <li key={`${idea}-${index}`}>{idea}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="font-semibold">Selected title</p>
            <p className="text-muted-foreground">{selectedTitle}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 2: Section Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <p className="font-semibold">Title</p>
              <p className="text-muted-foreground">{sectionConfig.topic || selectedTitle}</p>
            </div>
            <div>
              <p className="font-semibold">Segment</p>
              <p className="text-muted-foreground">{sectionConfig.segment || "—"}</p>
            </div>
            <div>
              <p className="font-semibold">Goal</p>
              <p className="text-muted-foreground">{sectionConfig.goal || "—"}</p>
            </div>
            <div>
              <p className="font-semibold">Word count</p>
              <p className="text-muted-foreground">{sectionConfig.wordCount || "—"}</p>
            </div>
          </div>

          {sectionDetails.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold">Generated sections</p>
              <div className="grid gap-3">
                {sectionDetails.map((section: any, index: number) => (
                  <div key={`${section.section_name}-${index}`} className="rounded-lg border border-border/60 p-3">
                    <div className="font-medium">{section.section_name}</div>
                    {section.section_word_count && (
                      <div className="text-xs text-muted-foreground">Word count: {section.section_word_count}</div>
                    )}
                    {section.overview_idea && (
                      <div className="text-xs text-muted-foreground mt-1">{section.overview_idea}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {sectionOutline && (
            <div>
              <p className="font-semibold">Final outline</p>
              <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                {sectionOutline}
              </pre>
            </div>
          )}

          {sectionSources.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold">Sources</p>
              <div className="grid gap-2">
                {sectionSources.map((source: any, index: number) => (
                  <div key={`${source.url}-${index}`} className="rounded-lg border border-border/60 p-3">
                    <div className="text-xs text-primary">{source.url}</div>
                    {source.reason && (
                      <div className="text-xs text-muted-foreground mt-1">{source.reason}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 3: SEO Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {seoEntries.length > 0 ? (
            <div className="space-y-3">
              {seoEntries.map((entry: any, index: number) => (
                <div key={`seo-${index}`} className="rounded-lg border border-border/60 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {entry.section_index && (
                      <span className="text-xs text-muted-foreground">Section {entry.section_index}</span>
                    )}
                    {entry.primary_keyword && (
                      <span className="text-xs font-semibold text-primary">{entry.primary_keyword}</span>
                    )}
                  </div>
                  {Array.isArray(entry.keywords) && entry.keywords.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {entry.keywords.map((keyword: string, keywordIndex: number) => (
                        <span key={`${keyword}-${keywordIndex}`} className="rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No SEO data available.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 4: Complete Content</CardTitle>
        </CardHeader>
        <CardContent>
          {blogResponse ? (
            <BlogPostDisplay response={blogResponse} />
          ) : (
            <p className="text-muted-foreground text-sm">No final blog content available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const SocialPostContent = ({ metadata, projectId }: { metadata: any, projectId: string }) => {
  const { user } = useAuth();
  const output = metadata.output || {};
  const isSuccess = output.status === 'success' || metadata.status === 'success';
  const postText = output.post || metadata.post_text || metadata.description;
  const imageUrl = output.image_url || metadata.image_url || metadata.thumbnail_url;
  const hashtags = output.hashtags || metadata.hashtags || [];
  const platform = output.platform || metadata.platform;

  // Posting State
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [postHistory, setPostHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeletePost = async (post: any) => {
    if (!user) return;

    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this post? This will attempt to delete it from the social platform as well.")) {
      return;
    }

    setDeletingId(post.id);
    try {
      // Import deletePost from service
      const { deletePost } = await import('@/services/socialMediaPostingService');
      const result = await deletePost(post.id, user.id);

      if (result.success) {
        toast.success('Post deleted successfully');
        setPostHistory(prev => prev.filter(p => p.id !== post.id));
      } else {
        toast.error(result.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('An error occurred while deleting the post');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (user) {
      loadAccounts();
    }
  }, [user]);

  useEffect(() => {
    if (projectId) {
      loadPostHistory();
    }
  }, [projectId]);

  const loadAccounts = async () => {
    if (!user) return;
    const result = await getConnectedAccounts(user.id);
    if (result.success && result.data) {
      setAccounts(result.data.filter(acc => acc.account_status === 'active'));
    }
  };

  const loadPostHistory = async () => {
    if (!projectId) return; // Prevent fetch if no project ID
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*, social_media_accounts(platform, account_name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPostHistory(data || []);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handlePost = async () => {
    if (!user) return;
    if (selectedAccounts.length === 0) {
      toast.error('Please select at least one account to post to');
      return;
    }

    setIsPosting(true);
    try {
      // 1. Check credits
      const costPerPost = 4;
      const totalCost = costPerPost * selectedAccounts.length;

      const creditCheck = await SubscriptionService.useCredits(
        user.id,
        'social_post',
        totalCost,
        selectedAccounts.length
      );

      if (!creditCheck.success) {
        let errorMsg = creditCheck.error || 'Failed to process credit deduction';
        if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
          errorMsg = 'Credit system error. Please try again later.';
        } else if (subscription && Number(subscription.credit_balance) < Number(totalCost)) {
          errorMsg = `Insufficient credits to post. You need ${totalCost} credits but only have ${subscription.credit_balance}.`;
        }
        toast.error(errorMsg);
        setIsPosting(false);
        return;
      }

      // 2. Prepare content
      const content: PostContent = {
        text: postText,
        imageUrls: imageUrl ? [imageUrl] : [],
        hashtags: hashtags
      };

      // 3. Post to accounts
      const accountsToPost = accounts.filter(acc => selectedAccounts.includes(acc.id));
      const results = await postToMultipleAccounts(accountsToPost, content, projectId);

      // 4. Handle results
      const successCount = results.filter(r => r.result.success).length;
      if (successCount > 0) {
        toast.success(`Successfully posted to ${successCount} accounts`);
        loadPostHistory(); // Refresh history
      }

      if (successCount < results.length) {
        toast.error(`Failed to post to ${results.length - successCount} accounts`);
      }

    } catch (error) {
      console.error('Posting error:', error);
      toast.error('An error occurred while posting');
    } finally {
      setIsPosting(false);
    }
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-500" />
            Social Media Post Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/20 rounded-lg">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Platform</label>
              <p className="font-medium mt-1 capitalize">{platform || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={isSuccess ? "default" : "secondary"} className={isSuccess ? "bg-green-500 hover:bg-green-600" : ""}>
                  {output.status || metadata.status || 'Unknown'}
                </Badge>
              </div>
            </div>
            {output.model_used && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Model Used</label>
                <p className="font-medium mt-1 text-sm font-mono">{output.model_used}</p>
              </div>
            )}
            {output.generation_time && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Generation Time</label>
                <p className="font-medium mt-1 text-sm">{output.generation_time}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Post Content */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-lg">Generated Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-secondary/10 rounded-lg border">
              <p className="whitespace-pre-wrap leading-relaxed">
                {postText || <span className="text-muted-foreground italic">No content generated</span>}
              </p>
            </div>

            {hashtags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Hashtags</h4>
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                      #{tag.replace(/^#/, '')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-6 pt-0 mt-auto space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const textToCopy = `${postText}\n\n${hashtags.map((t: string) => t.startsWith('#') ? t : `#${t}`).join(' ')}`;
                navigator.clipboard.writeText(textToCopy);
                toast.success('Post content copied to clipboard');
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Content
            </Button>
          </div>
        </Card>

        {/* Visual Asset */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-lg">Visual Asset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {imageUrl ? (
              <div className="relative group">
                <div className="flex justify-center bg-gray-50 dark:bg-gray-900 rounded-lg border overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Generated visual"
                    className="max-w-full max-h-[400px] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                                        <div class="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                          <ImageIcon class="h-12 w-12 mb-2 opacity-50" />
                                          <p class="text-center">Failed to load image</p>
                                        </div>
                                      `;
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                <ImageIcon className="h-12 w-12 mb-4 opacity-30" />
                <p>No visual asset generated</p>
              </div>
            )}
            {output.visual_idea && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Visual Concept</h4>
                <p className="text-sm text-foreground/80 italic p-3 bg-secondary/20 rounded-md">"{output.visual_idea}"</p>
              </div>
            )}
          </CardContent>
          {imageUrl && (
            <div className="p-6 pt-0 mt-auto flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => window.open(imageUrl, '_blank')}>
                <Maximize2 className="h-4 w-4 mr-2" />
                View Full
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  try {
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `social-post-${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (e) {
                    window.open(imageUrl, '_blank');
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Posting Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-500" />
            Post to Social Media
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-medium">Select Accounts to Post to:</label>
            {accounts.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                No active social media accounts found. Please connect your accounts in settings.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map(account => (
                  <div key={account.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-secondary/10 transition-colors">
                    <Checkbox
                      id={`account-${account.id}`}
                      checked={selectedAccounts.includes(account.id)}
                      onCheckedChange={() => toggleAccount(account.id)}
                    />
                    <label
                      htmlFor={`account-${account.id}`}
                      className="flex-1 cursor-pointer flex items-center gap-2 text-sm font-medium"
                    >
                      {/* Platform Icon helper */}
                      <span className="capitalize">{account.platform}</span>
                      <span className="text-muted-foreground font-normal overflow-hidden text-ellipsis whitespace-nowrap">
                        - {account.account_name || account.platform_username || 'Connected'}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Estimated Cost: <span className="font-bold text-foreground">{selectedAccounts.length * 4} Credits</span>
            </div>
            <Button
              onClick={handlePost}
              disabled={isPosting || selectedAccounts.length === 0}
              className="min-w-[120px]"
            >
              {isPosting ? 'Posting...' : 'Post Now'}
              {!isPosting && <Send className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-purple-500" />
              Posting History
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={loadPostHistory} disabled={isLoadingHistory}>
              <RotateCw className={`h-4 w-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {postHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No posting history for this project yet
                  </TableCell>
                </TableRow>
              ) : (
                postHistory.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="capitalize font-medium">{post.platform}</TableCell>
                    <TableCell>{post.social_media_accounts?.account_name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'published' ? 'default' : 'destructive'}
                        className={post.status === 'published' ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {post.platform_post_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={post.platform_post_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeletePost(post)}
                          disabled={deletingId === post.id}
                        >
                          {deletingId === post.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Prompts Section */}
      {(output.image_prompt) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {output.image_prompt && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Image Prompt</h4>
                <div className="p-3 bg-secondary/10 rounded-lg border font-mono text-xs text-muted-foreground">
                  {output.image_prompt}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const ScrapingContent = ({ metadata }: { metadata: any }) => {
  const scrapingResults = metadata.scrapingResults || [];
  const stats = metadata.stats || {};

  console.log('🗺️ ScrapingContent rendering with:', {
    scrapingResultsLength: scrapingResults.length,
    stats,
    metadataKeys: Object.keys(metadata),
    firstResult: scrapingResults[0]
  });

  if (!scrapingResults || scrapingResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-500" />
            Google Maps Scraping Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No scraping results available</p>
            <p className="text-sm text-muted-foreground mt-2">This project doesn't contain scraping data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-500" />
          Google Maps Scraping Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scraping Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-secondary/20 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalBusinesses || scrapingResults.length}</div>
            <div className="text-sm text-muted-foreground">Businesses Found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.withContactInfo || 0}</div>
            <div className="text-sm text-muted-foreground">With Contact Info</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}</div>
            <div className="text-sm text-muted-foreground">Avg Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{Object.keys(stats.categories || {}).length}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </div>
        </div>

        {/* Category Breakdown */}
        {stats.categories && Object.keys(stats.categories).length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Categories Found</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.categories).map(([category, count]) => (
                <Badge key={category} variant="secondary">
                  {category} ({String(count)})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Business Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Business Results ({scrapingResults.length})</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const csvContent = generateScrapingCSV(scrapingResults);
                navigator.clipboard.writeText(csvContent);
                toast.success('CSV data copied to clipboard');
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy CSV
            </Button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {scrapingResults.map((business: any, index: number) => (
              <div key={business.id || index} className="border rounded-lg p-4 hover:bg-secondary/10 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-primary">{business.name}</h4>
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      {business.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {business.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{business.rating}</span>
                      </div>
                    )}
                    {business.reviewCount && (
                      <Badge variant="outline" className="text-xs">
                        {business.reviewCount} reviews
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {business.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${business.phone}`} className="text-primary hover:underline">
                        {business.phone}
                      </a>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${business.email}`} className="text-primary hover:underline">
                        {business.email}
                      </a>
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {business.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="outline">{business.category}</Badge>
                  {business.coordinates && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${business.coordinates.lat},${business.coordinates.lng}`;
                        window.open(mapsUrl, '_blank');
                      }}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      View on Maps
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-3">Export Options</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const jsonContent = JSON.stringify(scrapingResults, null, 2);
                navigator.clipboard.writeText(jsonContent);
                toast.success('JSON data copied to clipboard');
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const csvContent = generateScrapingCSV(scrapingResults);
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `scraping-results-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success('CSV file downloaded');
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to generate CSV from scraping results
const generateScrapingCSV = (results: any[]) => {
  if (!results || results.length === 0) return '';

  const headers = ['Name', 'Address', 'Phone', 'Email', 'Website', 'Rating', 'Review Count', 'Category', 'Latitude', 'Longitude'];
  const csvRows = results.map(business => [
    business.name || '',
    business.address || '',
    business.phone || '',
    business.email || '',
    business.website || '',
    business.rating || '',
    business.reviewCount || '',
    business.category || '',
    business.coordinates?.lat || '',
    business.coordinates?.lng || ''
  ]);

  return [headers, ...csvRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
};

const FlyerContent = ({ metadata, project }: { metadata: any; project: any }) => {
  const webhookResponse = metadata.webhookResponse;

  if (!webhookResponse || !webhookResponse.resultUrls || webhookResponse.resultUrls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" />
            Flyer Design Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No flyer content available</p>
            <p className="text-sm text-muted-foreground mt-2">This project doesn't contain flyer data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Flyer Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" />
            Flyer Design Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-secondary/20 rounded-lg">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <p className="font-medium mt-1">{metadata.title || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Theme</label>
              <p className="font-medium mt-1 capitalize">{metadata.theme || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Style</label>
              <p className="font-medium mt-1 capitalize">{metadata.stylePreference || 'N/A'}</p>
            </div>
          </div>

          {/* Event Details */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
              <p className="font-medium mt-1">{metadata.date || 'N/A'} at {metadata.time || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Venue</label>
              <p className="font-medium mt-1">{metadata.venue || 'N/A'}</p>
            </div>
          </div>

          {/* Additional Details */}
          <div className="mt-4 space-y-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Subheadline</label>
              <p className="font-medium mt-1">{metadata.subheadline || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Call to Action</label>
              <p className="font-medium mt-1">{metadata.callToAction || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Contact</label>
              <p className="font-medium mt-1">{metadata.contactInfo || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Flyer Image */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Flyer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <img
              src={webhookResponse.resultUrls[0]}
              alt="Generated Flyer"
              className="max-w-full max-h-96 rounded-lg shadow-lg border"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<p class="text-muted-foreground text-center py-8">Failed to load flyer image</p>';
                }
              }}
            />
          </div>

          {/* Processing Details */}
          {webhookResponse.debugInfo && (
            <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
              <div>
                <span className="font-medium text-muted-foreground">Model:</span>
                <p className="font-medium">{webhookResponse.model}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Processing Time:</span>
                <p className="font-medium">{webhookResponse.costTime}s</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Task ID:</span>
                <p className="font-medium font-mono text-xs">{webhookResponse.taskId}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Completed:</span>
                <p className="font-medium">{new Date(webhookResponse.processedAt).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(webhookResponse.resultUrls[0], '_blank')}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Size
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const link = document.createElement('a');
                link.href = webhookResponse.resultUrls[0];
                link.download = `flyer-${metadata.title || 'download'}.png`;
                link.click();
              }}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(webhookResponse.resultUrls[0])}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy URL
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AdContent = ({ metadata }: { metadata: any }) => {
  // Handle both individual ad generation and ad campaign results
  const webhookResponse = metadata.webhookResponse;
  const isIndividualAd = metadata.generationType === 'individual_ad';

  // Check if it's a full Ads Engine project
  if (metadata.intelligence) {
    return (
      <div className="w-full">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-indigo-500" />
              Full Campaign Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AdsCreative initialState={metadata} projectId={metadata.projectId} overrideLayout={true} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!webhookResponse) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-green-500" />
            Ad Creative Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No ad content available</p>
            <p className="text-sm text-muted-foreground mt-2">This project doesn't contain ad data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Individual ad generation (with image)
  if (isIndividualAd && webhookResponse.resultUrls && webhookResponse.resultUrls.length > 0) {
    return (
      <div className="space-y-6">
        {/* Project Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-green-500" />
              Individual Ad Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-secondary/20 rounded-lg">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Headline</label>
                <p className="font-medium mt-1">{metadata.headline || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Platform</label>
                <p className="font-medium mt-1 capitalize">{metadata.platform || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Orientation</label>
                <p className="font-medium mt-1 capitalize">{metadata.orientation || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Ad Image */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Ad Creative</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <img
                src={webhookResponse.resultUrls[0]}
                alt="Generated Ad"
                className="max-w-full max-h-96 rounded-lg shadow-lg border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<p class="text-muted-foreground text-center py-8">Failed to load ad image</p>';
                  }
                }}
              />
            </div>

            {/* Ad Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Headline</label>
                  <p className="font-medium">{metadata.headline}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ad Copy</label>
                  <p className="text-sm">{metadata.adCopy}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Call-to-Action</label>
                  <p className="font-medium">{metadata.cta}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Platform</label>
                  <p className="capitalize">{metadata.platform}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(webhookResponse.resultUrls[0], '_blank')}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Size
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = webhookResponse.resultUrls[0];
                  link.download = `generated-ad-${Date.now()}.png`;
                  link.click();
                }}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={() => navigator.clipboard.writeText(webhookResponse.resultUrls[0])}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Processing Details */}
        {webhookResponse.debugInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Processing Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Model:</span>
                  <p className="font-medium">{webhookResponse.model}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Processing Time:</span>
                  <p className="font-medium">{webhookResponse.costTime}s</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Task ID:</span>
                  <p className="font-medium font-mono text-xs">{webhookResponse.taskId}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Completed:</span>
                  <p className="font-medium">{new Date(webhookResponse.processedAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Ad campaign (text-only ads)
  if ((webhookResponse.output && webhookResponse.output.ads && webhookResponse.output.ads.length > 0) ||
    (webhookResponse.originalResponse && webhookResponse.originalResponse.output && webhookResponse.originalResponse.output.ads && webhookResponse.originalResponse.output.ads.length > 0)) {
    const ads = webhookResponse.output?.ads || webhookResponse.originalResponse.output.ads;

    return (
      <div className="space-y-6">
        {/* Campaign Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Ad Campaign Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-secondary/20 rounded-lg">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Campaign Name</label>
                <p className="font-medium mt-1">{metadata.campaignName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ad Variations</label>
                <p className="font-medium mt-1">{metadata.adVariations || ads.length}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Generated</label>
                <p className="font-medium mt-1">{new Date(metadata.submittedAt).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Ad Copy Variations */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Ad Copy Variations</h3>
            <Badge variant="secondary">{ads.length} variations</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad: any, index: number) => (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-blue-600 text-white border-0 px-3 py-1 text-sm font-medium">
                      Variation {index + 1}
                    </Badge>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Headline</span>
                      <p className="text-gray-900 mt-2 font-semibold text-lg leading-tight">{ad.headline}</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-sm">
                      <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Primary Text</span>
                      <p className="text-gray-800 mt-2 leading-relaxed">{ad.primaryText}</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500 shadow-sm">
                      <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Call to Action</span>
                      <p className="text-gray-900 mt-2 font-medium">{ad.cta}</p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
                    <Button
                      onClick={() => navigator.clipboard.writeText(`Headline: ${ad.headline}\nPrimary Text: ${ad.primaryText}\nCTA: ${ad.cta}`)}
                      variant="outline"
                      className="w-full border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 text-gray-700 transition-colors duration-200"
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Ad Copy
                    </Button>

                    <Button
                      onClick={() => {
                        // This would trigger the ad generator form with pre-filled data
                        // For now, just show a toast
                        toast.success('Ad generation feature would open here');
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                      size="sm"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Generate Ad Image
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fallback for other ad types
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-green-500" />
          Ad Creative Content
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Ad content format not recognized</p>
          <p className="text-sm text-muted-foreground mt-2">Please check the project data structure.</p>
        </div>
      </CardContent>
    </Card>
  );
};

const ImageEditContent = ({ metadata, project }: { metadata: any; project: any }) => {
  // Support both new multi-result format AND legacy single-image format
  const results = metadata.results || [];

  // Legacy single-image detection (added resultUrl)
  const hasLegacyImage =
    metadata.resultUrl ||
    metadata.processedUrl ||
    project?.file_url ||
    project?.thumbnail_url;

  // Extract legacy image URL (priority order)
  const legacyImageUrl =
    metadata.resultUrl ||
    metadata.processedUrl ||
    project?.file_url ||
    project?.thumbnail_url ||
    null;

  // If we have legacy format only → fake a single "result"
  if (results.length === 0 && hasLegacyImage) {
    results.push({
      extractedUrl: legacyImageUrl,
      success: true,
      rawInput: {
        data: {
          taskId: metadata.taskId || metadata.id || "legacy",
          model: metadata.model || "Unknown",
          state: "completed",
          costTime: metadata.processingTime ? Math.round(metadata.processingTime / 1000) : "N/A",
          completeTime: project?.updated_at || project?.created_at,
        },
      },
    });
  }

  // If still no results → show empty state
  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Edited Image Found</h3>
          <p className="text-muted-foreground">
            The image editing task may have failed or the result is no longer available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-purple-500" />
            Image Editing Result{results.length > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-secondary/20 rounded-lg">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Task Type</label>
              <p className="font-medium mt-1 uppercase text-xs">{metadata.editType?.replace(/_/g, ' ') || "Image Edit"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Model</label>
              <p className="font-medium mt-1 text-xs font-mono">{metadata.model || "N/A"}</p>
            </div>
            {metadata.resolution && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Resolution</label>
                <p className="font-medium mt-1">{metadata.resolution}</p>
              </div>
            )}
            {metadata.aspectRatio && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Aspect Ratio</label>
                <p className="font-medium mt-1">{metadata.aspectRatio}</p>
              </div>
            )}
          </div>
          {metadata.description && (
            <div className="mt-4 p-4 border rounded-lg bg-background">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Instruction / Description</label>
              <p className="text-sm italic">"{metadata.description}"</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {results.map((result: any, index: number) => {
          const imageUrl = result.extractedUrl || legacyImageUrl;
          const taskId =
            result.rawInput?.data?.taskId ||
            metadata.taskId ||
            metadata.id ||
            "N/A";

          return (
            <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-background/50 backdrop-blur-sm">
              <div className="bg-secondary/10 p-6 flex items-center justify-center min-h-[400px] relative group">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={`Edited image ${index + 1}`}
                      className="max-w-full max-h-80 rounded-xl shadow-2xl border border-white/10 object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="flex flex-col items-center text-muted-foreground py-12">
                              <div class="text-3xl mb-2">⚠️</div>
                              <p class="text-center opacity-70">Failed to load result</p>
                            </div>
                          `;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 border-none">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full h-12 w-12 shadow-xl hover:scale-110 transition-transform"
                        onClick={() => window.open(imageUrl, '_blank')}
                      >
                        <Maximize2 className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full h-12 w-12 shadow-xl hover:scale-110 transition-transform"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = imageUrl;
                          link.download = `edited-image-${taskId}.png`;
                          link.click();
                        }}
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-white/90 text-black backdrop-blur-sm border-none">
                        Result {index + 1}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground py-12">
                    <ImageIcon className="h-12 w-12 mb-2 opacity-30" />
                    <p>No result image available</p>
                  </div>
                )}
              </div>
              <CardContent className="p-5 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Reference ID</span>
                    <p className="text-xs font-mono font-medium truncate max-w-[150px]">{taskId}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1">
                    {result.status || "Ready"}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 font-semibold group/btn"
                    onClick={() => {
                      if (!imageUrl) return;
                      navigator.clipboard.writeText(imageUrl);
                      toast.success('Image URL copied to clipboard');
                    }}
                    disabled={!imageUrl}
                  >
                    <Copy className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};



const YouTubeResearchContent = ({ metadata }: { metadata: any }) => {
  const researchResults = metadata.researchResults;

  if (!researchResults || !Array.isArray(researchResults) || researchResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-500" />
            YouTube Research Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No research content available</p>
            <p className="text-sm text-muted-foreground mt-2">This project doesn't contain research data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Research Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-500" />
            YouTube Research Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-secondary/20 rounded-lg">
            <div>
              <label className="text-sm font-medium text-muted-foreground">YouTube Channel</label>
              <p className="font-medium mt-1">{metadata.youtubeLink || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Results Found</label>
              <p className="font-medium mt-1">{researchResults.length} item{researchResults.length > 1 ? 's' : ''}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Research Date</label>
              <p className="font-medium mt-1">{new Date(metadata.submittedAt || Date.now()).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Research Results */}
      {researchResults.map((result: any, index: number) => {
        // Check if this is research output (has title, contentAngle, etc.)
        if (result.output && result.output.title) {
          const output = result.output;
          return (
            <Card key={index} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  Research Analysis {index + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div>
                  <h3 className="font-semibold mb-2">Suggested Video Title</h3>
                  <div className="flex items-start gap-3 p-4 bg-secondary/20 rounded-lg">
                    <div className="flex-1">
                      <p className="text-lg font-medium">{output.title}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(output.title)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Target Audience */}
                  <div>
                    <h4 className="font-semibold mb-2">Target Audience</h4>
                    <p className="text-sm text-muted-foreground bg-secondary/10 p-3 rounded-lg">
                      {output.targetAudience}
                    </p>
                  </div>

                  {/* Content Angle */}
                  <div>
                    <h4 className="font-semibold mb-2">Content Angle</h4>
                    <p className="text-sm text-muted-foreground bg-secondary/10 p-3 rounded-lg">
                      {output.contentAngle}
                    </p>
                  </div>
                </div>

                {/* Power Words */}
                {output.powerWordsUsed && output.powerWordsUsed.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Power Words Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {output.powerWordsUsed.map((word: string, wordIndex: number) => (
                        <Badge key={wordIndex} variant="secondary">{word}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Thumbnail Prompt */}
                {output.thumbnailPrompt && (
                  <div>
                    <h4 className="font-semibold mb-2">Thumbnail Design Prompt</h4>
                    <div className="p-4 bg-secondary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {output.thumbnailPrompt}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        }

        // Check if this is a thumbnail generation result
        if (result.extractedUrl && result.success) {
          return (
            <Card key={index} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-purple-500" />
                  Generated Thumbnail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Thumbnail Image */}
                <div className="flex justify-center">
                  <img
                    src={result.extractedUrl}
                    alt="Generated thumbnail"
                    className="max-w-full max-h-64 rounded-lg shadow-lg border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = '<p class="text-muted-foreground text-center py-8">Failed to load thumbnail image</p>';
                      }
                    }}
                  />
                </div>

                {/* Processing Details */}
                {result.rawInput?.data && (
                  <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                    <div>
                      <span className="font-medium text-muted-foreground">Model:</span>
                      <p className="font-medium">{result.rawInput.data.model}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Processing Time:</span>
                      <p className="font-medium">{result.rawInput.data.costTime}s</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Task ID:</span>
                      <p className="font-medium font-mono text-xs">{result.rawInput.data.taskId}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Completed:</span>
                      <p className="font-medium">{new Date(result.rawInput.data.completeTime).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(result.extractedUrl, '_blank')}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Size
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = result.extractedUrl;
                      link.download = `thumbnail-${result.rawInput?.data?.taskId || Date.now()}.png`;
                      link.click();
                    }}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(result.extractedUrl)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        }

        // Fallback for other result types
        return (
          <Card key={index}>
            <CardHeader>
              <CardTitle>Research Result {index + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-secondary p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const SeoAuditContent = ({ metadata }: { metadata: any }) => {
  const audit = metadata.auditResult || metadata.output || metadata;
  const summary = audit?.summary;
  const opportunities = audit?.high_impact_opportunities || [];
  const quickWins = audit?.quick_wins || [];
  const criticalIssues = audit?.critical_issues || [];
  const technical = audit?.technical_details;
  const nextSteps = audit?.next_steps;
  const auditMeta = audit?.audit_metadata;

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-500" />
            SEO Audit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No SEO audit data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-500" />
              SEO Audit Summary
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{summary.health_rating}</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openSeoAuditPdf(audit, metadata.url)}
              >
                Download PDF
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Overall score</div>
              <div className="text-4xl font-semibold">{summary.overall_score}</div>
              <Progress value={summary.overall_score} className="mt-2" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Critical issues</span>
                <span className="font-medium">{summary.critical_issues_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">High-impact opportunities</span>
                <span className="font-medium">{summary.high_impact_opportunities_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Quick wins</span>
                <span className="font-medium">{summary.quick_wins_count}</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="font-medium text-foreground mb-2">Executive summary</div>
              <p className="leading-relaxed">{summary.executive_summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>High-Impact Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {opportunities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No high-impact opportunities recorded.</p>
            ) : (
              opportunities.map((item: any) => (
                <div key={item.id || item.title} className="rounded-xl border border-border/60 bg-muted/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.details}</p>
                    </div>
                    <Badge variant="secondary">{item.category}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                    <div><span className="text-foreground">ROI:</span> {item.roi_potential}</div>
                    <div><span className="text-foreground">Effort:</span> {item.estimated_effort}</div>
                  </div>
                  {Array.isArray(item.implementation_steps) && item.implementation_steps.length > 0 && (
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {item.implementation_steps.map((step: string) => (
                        <li key={step} className="flex gap-2">
                          <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Wins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickWins.length === 0 ? (
                <p className="text-sm text-muted-foreground">No quick wins recorded.</p>
              ) : (
                quickWins.map((win: any) => (
                  <div key={win.id || win.title} className="rounded-lg border border-border/60 bg-muted/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{win.title}</p>
                      <Badge variant="outline">{win.category}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{win.action}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Effort: <span className="text-foreground">{win.estimated_effort}</span></p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Critical Issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {criticalIssues.length === 0 ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                  No critical issues detected.
                </div>
              ) : (
                criticalIssues.map((issue: any) => (
                  <div key={issue.id || issue.title} className="rounded-lg border border-border/60 bg-muted/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{issue.title || 'Critical issue'}</p>
                      <Badge variant="destructive">{issue.severity || 'High'}</Badge>
                    </div>
                    {issue.details && (
                      <p className="mt-2 text-sm text-muted-foreground">{issue.details}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {(technical || nextSteps || auditMeta) && (
        <Card>
          <CardHeader>
            <CardTitle>Technical Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3 text-sm text-muted-foreground">
            {technical && (
              <div className="space-y-2">
                <div className="text-foreground font-medium">Status codes</div>
                <div>Pages scanned: {technical.status_codes?.total_pages}</div>
                <div>200 OK: {technical.status_codes?.ok_200}</div>
                <div>3xx: {technical.status_codes?.redirects_3xx}</div>
                <div>404: {technical.status_codes?.not_found_404}</div>
                <div>5xx: {technical.status_codes?.server_errors_5xx}</div>
              </div>
            )}
            {nextSteps && (
              <div className="space-y-2">
                <div className="text-foreground font-medium">Next steps</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">This week</div>
                <ul className="space-y-1">
                  {nextSteps.immediate_this_week?.map((step: string) => (
                    <li key={step} className="flex gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {auditMeta && (
              <div className="space-y-2">
                <div className="text-foreground font-medium">Audit metadata</div>
                <div>{auditMeta.analysis_scope}</div>
                {Array.isArray(auditMeta.seo_pillars_covered) && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {auditMeta.seo_pillars_covered.map((pillar: string) => (
                      <Badge key={pillar} variant="secondary">{pillar}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const ScriptContent = ({ metadata }: { metadata: any }) => {
  const scriptResult = metadata.scriptResult;

  if (!scriptResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" />
            Script Generation Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No script content available</p>
            <p className="text-sm text-muted-foreground mt-2">This project doesn't contain script data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-500" />
          Script Generation Content
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Script Generation Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/20 rounded-lg">
          <div>
            <h3 className="font-semibold mb-2">Generation Details</h3>
            <div className="space-y-2 text-sm">
              {metadata.topic && (
                <div>
                  <span className="text-muted-foreground">Topic:</span>
                  <p className="font-medium">{metadata.topic}</p>
                </div>
              )}
              {metadata.temporalFocus && (
                <div>
                  <span className="text-muted-foreground">Temporal Focus:</span>
                  <p className="font-medium">{metadata.temporalFocus}</p>
                </div>
              )}
              {metadata.targetAudience && (
                <div>
                  <span className="text-muted-foreground">Target Audience:</span>
                  <p className="font-medium">{metadata.targetAudience}</p>
                </div>
              )}
              {metadata.generatedAt && (
                <div>
                  <span className="text-muted-foreground">Generated:</span>
                  <p className="font-medium">{new Date(metadata.generatedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Script Settings</h3>
            <div className="space-y-2 text-sm">
              {metadata.powerWords && (
                <div>
                  <span className="text-muted-foreground">Power Words:</span>
                  <p className="font-medium">{metadata.powerWords}</p>
                </div>
              )}
              {metadata.duration && (
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <p className="font-medium">{metadata.duration} minutes</p>
                </div>
              )}
              {metadata.scriptVersion && (
                <div>
                  <span className="text-muted-foreground">Version:</span>
                  <p className="font-medium">{metadata.scriptVersion}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Script Content */}
        {(() => {
          // Handle both array and single object formats
          const scripts = Array.isArray(scriptResult) ? scriptResult : [scriptResult];

          return scripts.map((scriptItem, index) => {
            // Handle different data structures
            const output = scriptItem?.output || scriptItem;
            const script = output?.script || output;

            console.log('Processing script item:', { scriptItem, output, script });

            if (!script || (typeof script === 'object' && Object.keys(script).length === 0)) {
              return (
                <div key={index} className="border rounded-lg p-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No script content found in this item</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={index} className="border rounded-lg p-6">
                {output?.title && (
                  <h3 className="text-xl font-bold mb-4 text-primary">{output.title}</h3>
                )}

                {/* Script Metadata */}
                {output?.metadata && (
                  <div className="mb-6 p-4 bg-muted/20 rounded-lg">
                    <h4 className="font-semibold mb-3">Script Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {output.metadata.topic_type && (
                        <div>
                          <span className="text-muted-foreground">Topic Type:</span>
                          <p className="font-medium">{output.metadata.topic_type}</p>
                        </div>
                      )}
                      {output.metadata.temporal_focus && (
                        <div>
                          <span className="text-muted-foreground">Temporal Focus:</span>
                          <p className="font-medium">{output.metadata.temporal_focus}</p>
                        </div>
                      )}
                      {output.metadata.controversy_level && (
                        <div>
                          <span className="text-muted-foreground">Controversy Level:</span>
                          <p className="font-medium">{output.metadata.controversy_level}</p>
                        </div>
                      )}
                      {output.estimated_runtime_minutes && (
                        <div>
                          <span className="text-muted-foreground">Runtime:</span>
                          <p className="font-medium">{output.estimated_runtime_minutes} minutes</p>
                        </div>
                      )}
                      {output.target_word_count && (
                        <div>
                          <span className="text-muted-foreground">Word Count:</span>
                          <p className="font-medium">{output.target_word_count.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Script Sections */}
                <div className="space-y-6">
                  {(() => {
                    // Handle array of script segments (regular YouTube scripts)
                    if (Array.isArray(script)) {
                      console.log('Script is array, rendering segments:', script.length);
                      return script.map((segment: any, segmentIndex: number) => {
                        console.log(`Rendering segment ${segmentIndex}:`, segment);

                        // Extract text content from segment
                        let segmentText = 'No script text available';
                        let segmentTime = `Scene ${segmentIndex + 1}`;
                        let imagePrompt = '';
                        let videoPrompt = '';

                        if (typeof segment === 'string') {
                          segmentText = segment;
                        } else if (segment && typeof segment === 'object') {
                          // Handle nested text objects
                          if (segment.text && typeof segment.text === 'object') {
                            segmentText = (segment.text as any).text || (segment.text as any).content || JSON.stringify(segment.text);
                          } else if (segment.text) {
                            segmentText = segment.text;
                          } else if ((segment as any).content) {
                            segmentText = (segment as any).content;
                          } else if ((segment as any).description) {
                            segmentText = (segment as any).description;
                          } else {
                            segmentText = JSON.stringify(segment);
                          }

                          segmentTime = segment.time || segmentTime;
                          imagePrompt = segment.imagePrompt || '';
                          videoPrompt = segment.videoPrompt || '';
                        }

                        return (
                          <div key={segmentIndex} className="border-l-4 border-primary/20 pl-4">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="secondary" className="font-mono text-xs">
                                {segmentTime}
                              </Badge>
                              <h4 className="font-semibold text-lg text-primary">
                                Scene {segmentIndex + 1}
                              </h4>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-r-lg space-y-4">
                              <div>
                                <h5 className="font-semibold text-sm text-muted-foreground mb-2">Script Text</h5>
                                <p className="text-foreground leading-relaxed whitespace-pre-line">{segmentText}</p>
                              </div>

                              {imagePrompt && (
                                <div>
                                  <h5 className="font-semibold text-sm text-muted-foreground mb-2">Image Prompt</h5>
                                  <p className="text-sm text-foreground/80 italic leading-relaxed bg-background p-3 rounded border">
                                    {imagePrompt}
                                  </p>
                                </div>
                              )}

                              {videoPrompt && (
                                <div>
                                  <h5 className="font-semibold text-sm text-muted-foreground mb-2">Video Prompt</h5>
                                  <p className="text-sm text-foreground/80 italic leading-relaxed bg-background p-3 rounded border">
                                    {videoPrompt}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    }

                    // Handle object with named sections (enhanced YouTube scripts)
                    if (typeof script === 'object') {
                      console.log('Script is object, rendering sections');
                      return Object.entries(script).map(([sectionName, content]) => {
                        if (!content || String(content).trim() === '') return null;

                        const getSectionTitle = (name: string) => {
                          return name.split('_').map(word =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ');
                        };

                        return (
                          <div key={sectionName} className="border-l-4 border-primary/20 pl-4">
                            <h4 className="font-semibold text-lg mb-2 text-primary">
                              {getSectionTitle(sectionName)}
                            </h4>
                            <div className="bg-secondary/10 p-4 rounded-r-lg">
                              <p className="text-foreground leading-relaxed whitespace-pre-line">{String(content)}</p>
                            </div>
                          </div>
                        );
                      });
                    }

                    // Fallback for simple string
                    return (
                      <div className="border-l-4 border-primary/20 pl-4">
                        <h4 className="font-semibold text-lg mb-2 text-primary">Script Content</h4>
                        <div className="bg-secondary/10 p-4 rounded-r-lg">
                          <p className="text-foreground leading-relaxed whitespace-pre-line">{String(script)}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Visual Cues */}
                {output?.visual_cues && Array.isArray(output.visual_cues) && output.visual_cues.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-semibold text-lg mb-4">Visual Cues & Image Prompts</h4>
                    <div className="space-y-4">
                      {output.visual_cues.map((cue: any, cueIndex: number) => (
                        <div key={cueIndex} className="border rounded-lg p-4 bg-muted/10">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-1">
                              {cue.timestamp}
                            </Badge>
                            <div className="flex-1">
                              <h5 className="font-medium mb-2">Visual Cue {cueIndex + 1}</h5>
                              <p className="text-sm text-muted-foreground mb-3">{String(cue.description || '')}</p>
                              <div>
                                <h6 className="font-medium text-sm mb-1">Image Prompt:</h6>
                                <p className="text-sm italic bg-background p-3 rounded border">
                                  {String(cue.imagePrompt || '')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t flex gap-2">
                  <Button
                    onClick={() => {
                      try {
                        const scriptContent = typeof script === 'object'
                          ? Object.entries(script)
                            .map(([sectionName, content]) => `=== ${sectionName.toUpperCase().replace(/_/g, ' ')} ===\n${content}`)
                            .join('\n\n')
                          : String(script);

                        const fullScript = `${output?.title || 'Script'}\n\n${scriptContent}`;
                        navigator.clipboard.writeText(fullScript);
                        toast.success('Full script copied to clipboard');
                      } catch (error) {
                        toast.error('Failed to copy script');
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Full Script
                  </Button>
                  <Button
                    onClick={() => {
                      try {
                        if (output?.visual_cues && Array.isArray(output.visual_cues)) {
                          const visualCuesText = output.visual_cues.map((cue: any) =>
                            `[${cue.timestamp || ''}] ${String(cue.description || '')}\nImage Prompt: ${String(cue.imagePrompt || '')}`
                          ).join('\n\n');
                          navigator.clipboard.writeText(visualCuesText);
                          toast.success('Visual cues copied to clipboard');
                        } else {
                          toast.error('No visual cues available');
                        }
                      } catch (error) {
                        toast.error('Failed to copy visual cues');
                      }
                    }}
                    variant="outline"
                    disabled={!output?.visual_cues || !Array.isArray(output.visual_cues) || output.visual_cues.length === 0}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Visual Cues
                  </Button>
                </div>
              </div>
            );
          });
        })()}
      </CardContent>
    </Card>
  );
};

export default ProjectView;
