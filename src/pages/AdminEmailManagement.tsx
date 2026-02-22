import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { EmailCampaignService } from '@/services/emailCampaignService';
import type {
  EmailCampaign,
  EmailTemplate,
  EmailStatus,
  EmailType,
} from '@/types/email';
import {
  Mail,
  Plus,
  Search,
  Filter,
  Trash2,
  Send,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  ChevronRight,
  RefreshCw,
  FileText,
  Users,
} from 'lucide-react';

const AdminEmailManagement: React.FC = () => {
  const { user } = useAuth();
  const { checkPermission } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State management
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewCampaign, setViewCampaign] = useState<EmailCampaign | null>(null);


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('📧 Loading email data...');
      const campaignsData = await EmailCampaignService.getCampaigns();
      const templatesData = await EmailCampaignService.getTemplates();

      console.log('📧 Loaded campaigns:', campaignsData);
      console.log('📧 Loaded templates:', templatesData);

      setCampaigns(campaignsData);
      setTemplates(templatesData);

    } catch (error) {
      console.error('Error loading email data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      console.log('🚀 Starting campaign send:', campaignId);

      // Get campaign details for debugging
      const campaign = await EmailCampaignService.getCampaign(campaignId);
      console.log('🚀 Campaign details:', campaign);

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (!campaign.recipients || campaign.recipients.length === 0) {
        throw new Error('No recipients found for campaign');
      }

      console.log('🚀 Campaign recipients:', campaign.recipients);

      await EmailCampaignService.sendCampaign(campaignId);

      toast({
        title: 'Success',
        description: 'Campaign sent successfully',
      });

      loadData();
    } catch (error) {
      console.error('❌ Campaign send failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        campaignId: campaignId
      });

      toast({
        title: 'Error',
        description: `Failed to send campaign: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await EmailCampaignService.deleteCampaign(campaignId);

      toast({
        title: 'Success',
        description: 'Campaign deleted successfully',
      });

      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
    }
  };

  const handleViewCampaign = async (campaignId: string) => {
    try {
      const campaign = await EmailCampaignService.getCampaign(campaignId);
      setViewCampaign(campaign);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load campaign details',
        variant: 'destructive',
      });
    }
  };


  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesType = typeFilter === 'all' || campaign.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });


  const getStatusBadge = (status: EmailStatus) => {
    const variants: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
      scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      sending: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      sent: 'bg-green-500/20 text-green-400 border-green-500/50',
      failed: 'bg-red-500/20 text-red-400 border-red-500/50',
      cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    };

    const icons = {
      draft: FileText,
      scheduled: Clock,
      sending: Send,
      sent: CheckCircle,
      failed: XCircle,
      cancelled: AlertCircle,
    };

    const Icon = icons[status] || FileText;

    return (
      <Badge className={`${variants[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/50'} border backdrop-blur-sm flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: EmailType) => {
    const variants: Record<string, string> = {
      promotional: 'bg-purple-500/20 text-purple-400',
      newsletter: 'bg-indigo-500/20 text-indigo-400',
      transactional: 'bg-emerald-500/20 text-emerald-400',
      announcement: 'bg-orange-500/20 text-orange-400',
    };

    return (
      <Badge className={`${variants[type] || 'bg-gray-500/20'} border-0`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background text-foreground p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedAdminRoute requiredPermission="users" requiredAction="manage">
      <Layout>
        <div className="min-h-screen bg-background text-foreground pb-20">
          {/* Header Section */}
          <div className="bg-gradient-to-b from-background to-black/20 pb-8 pt-8">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Link to="/admin" className="hover:text-white transition-colors">Admin</Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-white">Email Campaigns</span>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Email Campaigns
                  </h1>
                  <p className="text-muted-foreground mt-2 text-lg">
                    Create, schedule, and track promotional email campaigns.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="bg-black/20 border-white/10 hover:bg-white/10"
                    onClick={loadData}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button
                    onClick={() => navigate('/admin/emails/compose')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Campaign
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                  {
                    title: 'Total Campaigns',
                    value: campaigns.length,
                    icon: Mail,
                    color: 'text-blue-400',
                    bg: 'bg-blue-500/10'
                  },
                  {
                    title: 'Sent This Month',
                    value: campaigns.filter(c => c.status === 'sent' && new Date(c.sentAt || c.createdAt).getMonth() === new Date().getMonth()).length,
                    icon: CheckCircle,
                    color: 'text-green-400',
                    bg: 'bg-green-500/10'
                  },
                  {
                    title: 'Scheduled',
                    value: campaigns.filter(c => c.status === 'scheduled').length,
                    icon: Clock,
                    color: 'text-yellow-400',
                    bg: 'bg-yellow-500/10'
                  },
                  {
                    title: 'Total Recipients',
                    value: campaigns.reduce((total, campaign) => total + campaign.recipients.length, 0),
                    icon: Users,
                    color: 'text-purple-400',
                    bg: 'bg-purple-500/10'
                  },
                ].map((stat, i) => (
                  <Card key={i} className="backdrop-blur-xl bg-black/40 border-white/10 hover:bg-white/5 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <div className={`p-2 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Filters and Search */}
              <Card className="backdrop-blur-xl bg-black/40 border-white/10 mb-8">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search campaigns..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-black/40 border-white/10 focus:border-indigo-500 text-sm"
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px] bg-black/40 border-white/10 text-white">
                        <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/10 text-white">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="sending">Sending</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-full sm:w-[180px] bg-black/40 border-white/10 text-white">
                        <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/10 text-white">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Campaigns Table */}
              <Card className="backdrop-blur-xl bg-black/40 border-white/10 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <CardTitle className="text-white">Email Campaigns ({filteredCampaigns.length})</CardTitle>
                  <CardDescription>Manage your email campaigns and track their performance</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredCampaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="p-4 rounded-full bg-white/5 mb-4">
                        <Mail className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-white">No campaigns found</h3>
                      <p className="text-muted-foreground max-w-sm mt-2">
                        Try adjusting your search or filters, or create a new campaign.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-white/5">
                          <TableRow className="border-white/5 hover:bg-white/5">
                            <TableHead className="text-white">Campaign</TableHead>
                            <TableHead className="text-white">Type</TableHead>
                            <TableHead className="text-white">Status</TableHead>
                            <TableHead className="text-white">Recipients</TableHead>
                            <TableHead className="text-white">CC/BCC</TableHead>
                            <TableHead className="text-white">Created</TableHead>
                            <TableHead className="text-white">Sent</TableHead>
                            <TableHead className="text-right text-white">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCampaigns.map((campaign) => (
                            <TableRow key={campaign.id} className="border-white/5 hover:bg-white/5">
                              <TableCell>
                                <div>
                                  <div className="font-medium text-white">{campaign.name}</div>
                                  <div className="text-sm text-muted-foreground truncate max-w-xs">{campaign.subject}</div>
                                </div>
                              </TableCell>
                              <TableCell>{getTypeBadge(campaign.type)}</TableCell>
                              <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-300">
                                  <div>{campaign.recipients.length} recipients</div>
                                  <div className="text-muted-foreground text-xs">{campaign.recipientType !== 'custom' ? campaign.recipientType : 'selected'}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {campaign.cc && campaign.cc.length > 0 && <div className="text-blue-400">CC: {campaign.cc.length}</div>}
                                  {campaign.bcc && campaign.bcc.length > 0 && <div className="text-purple-400">BCC: {campaign.bcc.length}</div>}
                                  {(!campaign.cc?.length && !campaign.bcc?.length) && <span className="text-muted-foreground">-</span>}
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-400">{formatDate(campaign.createdAt)}</TableCell>
                              <TableCell className="text-gray-400">{campaign.sentAt ? formatDate(campaign.sentAt) : '-'}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {campaign.status === 'draft' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSendCampaign(campaign.id)}
                                      className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
                                    >
                                      <Send className="h-3 w-3 mr-1" /> Send
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewCampaign(campaign.id)}
                                    className="hover:bg-white/10 text-gray-300"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="ghost" className="hover:bg-red-500/20 text-red-400">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-400">
                                          Are you sure you want to delete this campaign? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteCampaign(campaign.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* View Campaign Dialog */}
          <Dialog open={!!viewCampaign} onOpenChange={() => setViewCampaign(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-black/90 border-white/10 text-white backdrop-blur-xl">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Campaign Details: {viewCampaign?.name}</DialogTitle>
                <DialogDescription className="text-gray-400">View the details of the email campaign.</DialogDescription>
              </DialogHeader>
              {viewCampaign && (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-300 mb-1">Subject</h3>
                      <p className="text-white text-lg">{viewCampaign.subject}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-300 mb-1">Status</h3>
                      <div className="flex">{getStatusBadge(viewCampaign.status)}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-300 mb-2">Content Preview</h3>
                    <div className="border border-white/10 rounded-lg p-4 bg-white text-black min-h-[200px]" dangerouslySetInnerHTML={{ __html: viewCampaign.content }} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-300 mb-2">Recipients ({viewCampaign.recipients.length})</h3>
                    <div className="max-h-40 overflow-y-auto border border-white/10 rounded-lg p-2 bg-black/50">
                      <ul className="list-disc list-inside space-y-1">
                        {viewCampaign.recipients.map((rec, idx) => (
                          <li key={idx} className="text-sm text-gray-300">{rec.email}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                    <div>
                      <span className="font-semibold text-gray-300">Created:</span> {formatDate(viewCampaign.createdAt)}
                    </div>
                    {viewCampaign.sentAt && (
                      <div>
                        <span className="font-semibold text-gray-300">Sent:</span> {formatDate(viewCampaign.sentAt)}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <DialogFooter className="flex-shrink-0">
                <Button onClick={() => setViewCampaign(null)} variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-white">Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    </ProtectedAdminRoute>
  );
};

export default AdminEmailManagement;
