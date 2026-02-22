import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Video,
  Image,
  Palette,
  Layout as LayoutIcon,
  Heart,
  ImageIcon,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Calendar,
  Clock,
  Home,
  ChevronRight,
  MoreVertical,
  Play,
  FileText,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { toast } from 'sonner';

type ViewMode = 'grid' | 'list';
type SortBy = 'created_at' | 'updated_at' | 'title' | 'type' | 'status';
type SortOrder = 'asc' | 'desc';
type FilterBy = 'all' | 'video' | 'logo' | 'ad' | 'flyer' | 'social_post' | 'image_edit';
type StatusFilter = 'all' | 'completed' | 'processing' | 'draft' | 'failed';

const ProjectsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, loading, deleteProject, refreshData } = useProjects();
  
  // State for UI controls
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      // Search filter
      const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter
      const matchesType = filterBy === 'all' || project.type === filterBy;
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort projects
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at || a.created_at);
          bValue = new Date(b.updated_at || b.created_at);
          break;
        default: // created_at
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [projects, searchQuery, filterBy, statusFilter, sortBy, sortOrder]);

  // Helper functions
  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'logo': return <Palette className="h-5 w-5" />;
      case 'ad': return <Image className="h-5 w-5" />;
      case 'flyer': return <LayoutIcon className="h-5 w-5" />;
      case 'social_post': return <Heart className="h-5 w-5" />;
      case 'image_edit': return <ImageIcon className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'draft': return 'outline';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Video';
      case 'logo': return 'Logo';
      case 'ad': return 'Advertisement';
      case 'flyer': return 'Flyer';
      case 'social_post': return 'Social Post';
      case 'image_edit': return 'Image Edit';
      default: return type;
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setDeletingProjectId(projectId);
    try {
      const result = await deleteProject(projectId);
      if (result.success) {
        toast.success('Project deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete project');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the project');
    } finally {
      setDeletingProjectId(null);
    }
  };

  const getCreateProjectLink = (type: string) => {
    switch (type) {
      case 'video': return '/video-creation';
      case 'logo': return '/logo-creation';
      case 'ad': return '/ads-creative';
      case 'flyer': return '/flyer-designer';
      case 'social_post': return '/social-media-post';
      case 'image_edit': return '/two-image-editor';
      default: return '/video-creation';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">Loading projects...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors flex items-center">
          <Home className="h-4 w-4 mr-1" />
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Projects</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Projects</h1>
          <p className="text-muted-foreground">
            Manage and organize all your creative projects in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/video-creation">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Controls Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <Select value={filterBy} onValueChange={(value: FilterBy) => setFilterBy(value)}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="logo">Logo</SelectItem>
                  <SelectItem value="ad">Advertisement</SelectItem>
                  <SelectItem value="flyer">Flyer</SelectItem>
                  <SelectItem value="social_post">Social Post</SelectItem>
                  <SelectItem value="image_edit">Image Edit</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field as SortBy);
                setSortOrder(order as SortOrder);
              }}>
                <SelectTrigger className="w-[160px]">
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Newest First</SelectItem>
                  <SelectItem value="created_at-asc">Oldest First</SelectItem>
                  <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
                  <SelectItem value="title-asc">Name A-Z</SelectItem>
                  <SelectItem value="title-desc">Name Z-A</SelectItem>
                  <SelectItem value="type-asc">Type A-Z</SelectItem>
                  <SelectItem value="status-asc">Status</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {filteredAndSortedProjects.length} of {projects.length} projects
        </p>
        <Button variant="outline" size="sm" onClick={refreshData}>
          <Clock className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Projects Grid/List */}
      {filteredAndSortedProjects.length === 0 ? (
        // Empty State
        <Card className="p-12">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {projects.length === 0 
                ? 'Start creating amazing content with our AI-powered tools. Your projects will appear here.'
                : 'Try adjusting your search terms or filters to find the projects you\'re looking for.'
              }
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to="/video-creation">
                  <Video className="h-4 w-4 mr-2" />
                  Create Video
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/logo-creation">
                  <Palette className="h-4 w-4 mr-2" />
                  Design Logo
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/ads-creative">
                  <Image className="h-4 w-4 mr-2" />
                  Create Ad
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {filteredAndSortedProjects.map((project) => (
            viewMode === 'grid' ? (
              // Grid Card View
              <Card key={project.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-secondary rounded-lg">
                        {getProjectIcon(project.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{project.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {getProjectTypeLabel(project.type)}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/status?projectId=${project.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={getCreateProjectLink(project.type)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Project
                          </Link>
                        </DropdownMenuItem>
                        {project.file_url && (
                          <DropdownMenuItem asChild>
                            <a href={project.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Project</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{project.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProject(project.id)}
                                disabled={deletingProjectId === project.id}
                              >
                                {deletingProjectId === project.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Thumbnail */}
                  {project.thumbnail_url ? (
                    <div className="aspect-video bg-secondary rounded-lg mb-3 overflow-hidden">
                      <img 
                        src={project.thumbnail_url} 
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-secondary rounded-lg mb-3 flex items-center justify-center">
                      {getProjectIcon(project.type)}
                    </div>
                  )}
                  
                  {/* Status and Progress */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={getStatusBadgeVariant(project.status)} className="capitalize">
                      <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(project.status)}`}></div>
                      {project.status}
                    </Badge>
                    {project.status === 'processing' && (
                      <div className="flex items-center space-x-2">
                        <Progress value={65} className="w-16" />
                        <span className="text-xs text-muted-foreground">65%</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Dates */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Created {formatDate(project.created_at)}
                    </div>
                    {project.updated_at && project.updated_at !== project.created_at && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Updated {formatDate(project.updated_at)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              // List View
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                      {project.thumbnail_url ? (
                        <img 
                          src={project.thumbnail_url} 
                          alt={project.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        getProjectIcon(project.type)
                      )}
                    </div>
                    
                    {/* Project Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{project.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {getProjectTypeLabel(project.type)}
                          </p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                            <span>Created {formatDate(project.created_at)}</span>
                            {project.updated_at && project.updated_at !== project.created_at && (
                              <span>Updated {formatDate(project.updated_at)}</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Status and Actions */}
                        <div className="flex items-center space-x-3 ml-4">
                          <Badge variant={getStatusBadgeVariant(project.status)} className="capitalize">
                            <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(project.status)}`}></div>
                            {project.status}
                          </Badge>
                          
                          {project.status === 'processing' && (
                            <div className="flex items-center space-x-2">
                              <Progress value={65} className="w-20" />
                              <span className="text-xs text-muted-foreground">65%</span>
                            </div>
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/status?projectId=${project.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={getCreateProjectLink(project.type)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Project
                                </Link>
                              </DropdownMenuItem>
                              {project.file_url && (
                                <DropdownMenuItem asChild>
                                  <a href={project.file_url} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Project</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{project.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteProject(project.id)}
                                      disabled={deletingProjectId === project.id}
                                    >
                                      {deletingProjectId === project.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      ) : null}
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="lg" 
              className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/video-creation">
                <Video className="h-4 w-4 mr-2" />
                Create Video
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/logo-creation">
                <Palette className="h-4 w-4 mr-2" />
                Design Logo
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/ads-creative">
                <Image className="h-4 w-4 mr-2" />
                Create Ad
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/flyer-designer">
                <LayoutIcon className="h-4 w-4 mr-2" />
                Design Flyer
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/social-media-post">
                <Heart className="h-4 w-4 mr-2" />
                Social Post
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/two-image-editor">
                <ImageIcon className="h-4 w-4 mr-2" />
                Edit Image
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ProjectsDashboard;
