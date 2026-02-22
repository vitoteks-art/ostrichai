import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { ReferralService, ReferralFormSubmission } from '@/services/referralService';
import {
  Download,
  Filter,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  Mail,
  Phone,
  Globe,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface ReferralSubmissionsDashboardProps {
  campaignId: string;
}

const ReferralSubmissionsDashboard: React.FC<ReferralSubmissionsDashboardProps> = ({ campaignId }): JSX.Element => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ReferralFormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    email: '',
    formType: ''
  });

  // Dialog states
  const [selectedSubmission, setSelectedSubmission] = useState<ReferralFormSubmission | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [dbError, setDbError] = useState<string | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Cache key for this campaign
  const getCacheKey = (campaignId: string) => `submissions_cache_${campaignId}`;

  // Handle visibility change to load fresh data when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && campaignId && !loading) {
        const cacheKey = getCacheKey(campaignId);
        const cached = localStorage.getItem(cacheKey);
        const now = Date.now();

        if (cached) {
          try {
            const cacheData = JSON.parse(cached);
            // If cache is older than 30 seconds when returning to tab, refresh
            if ((now - cacheData.timestamp) > 30000) {
              loadSubmissions();
            }
          } catch (e) {
            loadSubmissions();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, campaignId, loading]);

  useEffect(() => {
    if (user && campaignId && document.visibilityState === 'visible') {
      const currentParams = JSON.stringify({ campaignId, page, filters });
      const cacheKey = getCacheKey(campaignId);
      const cached = localStorage.getItem(cacheKey);

      let shouldLoad = !loading;
      const now = Date.now();

      if (cached) {
        try {
          const cacheData = JSON.parse(cached);
          const isExpired = (now - cacheData.timestamp) > CACHE_DURATION;
          const paramsChanged = cacheData.params !== currentParams;

          shouldLoad = shouldLoad && (isExpired || paramsChanged);
        } catch (e) {
          // Invalid cache, reload
          shouldLoad = true;
        }
      }

      if (shouldLoad) {
        // Update cache
        localStorage.setItem(cacheKey, JSON.stringify({
          params: currentParams,
          timestamp: now
        }));
        loadSubmissions();
      }
    }
  }, [user, campaignId, page, filters, loading]);

  const loadSubmissions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await ReferralService.getFormSubmissions(
        campaignId,
        user.id,
        filters,
        { page, limit }
      );

      if (result.success && result.data) {
        setSubmissions(result.data.submissions);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      } else {
        console.error('Failed to load submissions:', result.error);
        // If table doesn't exist, show database setup message
        if (result.error?.includes('relation') || result.error?.includes('does not exist')) {
          setDbError('Database table not found. Please apply the referral-form-submissions-schema.sql to your database.');
          setSubmissions([]);
          setTotal(0);
          setTotalPages(0);
        } else {
          toast.error(result.error || 'Failed to load submissions');
        }
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      dateFrom: '',
      dateTo: '',
      email: '',
      formType: ''
    });
    setPage(1);
  };

  const handleStatusUpdate = async () => {
    if (!selectedSubmission || !user) return;

    try {
      const result = await ReferralService.updateSubmissionStatus(
        selectedSubmission.id,
        campaignId,
        user.id,
        updateStatus,
        updateNotes
      );

      if (result.success) {
        toast.success('Submission updated successfully');
        setUpdateDialogOpen(false);
        setSelectedSubmission(null);
        setUpdateNotes('');
        loadSubmissions();
      } else {
        toast.error(result.error || 'Failed to update submission');
      }
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error('Failed to update submission');
    }
  };

  const handleExportCSV = async () => {
    try {
      const result = await ReferralService.exportSubmissionsToCSV(campaignId, user?.id || '', filters);

      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `referral-submissions-${campaignId}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('CSV exported successfully');
      } else {
        toast.error(result.error || 'Failed to export CSV');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'duplicate':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'spam':
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'duplicate':
        return 'bg-orange-100 text-orange-800';
      case 'spam':
      case 'invalid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openDetailsDialog = (submission: ReferralFormSubmission) => {
    setSelectedSubmission(submission);
    setDetailsDialogOpen(true);
  };

  const openUpdateDialog = (submission: ReferralFormSubmission) => {
    setSelectedSubmission(submission);
    setUpdateStatus(submission.status);
    setUpdateNotes(submission.notes || '');
    setUpdateDialogOpen(true);
  };

  if (loading && submissions.length === 0 && !dbError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submissions...</p>
          <p className="text-sm text-gray-500 mt-2">
            If this takes too long, the database schema may need to be applied.
          </p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Database Setup Required</h3>
            <p className="text-yellow-700 mb-4">{dbError}</p>
            <p className="text-sm text-yellow-600">
              Please apply the referral-form-submissions-schema.sql file to your Supabase database.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Form Submissions</h2>
          <p className="text-gray-600">Manage and review form submissions from your referral campaign</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="duplicate">Duplicate</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="invalid">Invalid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="form-type-filter">Form Type</Label>
              <Select value={filters.formType} onValueChange={(value) => handleFilterChange('formType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="signup">Signup</SelectItem>
                  <SelectItem value="lead_capture">Lead Capture</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="email-filter">Email</Label>
              <Input
                id="email-filter"
                placeholder="Search by email..."
                value={filters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">
                  {submissions.filter(s => s.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Processed</p>
                <p className="text-2xl font-bold">
                  {submissions.filter(s => s.status === 'processed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Duplicates</p>
                <p className="text-2xl font-bold">
                  {submissions.filter(s => s.status === 'duplicate').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Form Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.email}</TableCell>
                  <TableCell>{submission.full_name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {submission.form_type === 'signup' ? 'Signup' : 'Lead Capture'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(submission.status)}>
                      {getStatusIcon(submission.status)}
                      <span className="ml-1 capitalize">{submission.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(submission.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailsDialog(submission)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openUpdateDialog(submission)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {submissions.length === 0 && (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No submissions found</h3>
              <p className="text-gray-500">
                {Object.values(filters).some(v => v) ? 'Try adjusting your filters' : 'Submissions will appear here once forms are submitted'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} submissions
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Detailed information about this form submission
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {selectedSubmission.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-sm text-gray-600">{selectedSubmission.full_name || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <p className="text-sm text-gray-600">{selectedSubmission.company || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-gray-600 flex items-center">
                    {selectedSubmission.phone && <Phone className="h-4 w-4 mr-1" />}
                    {selectedSubmission.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Website</Label>
                  <p className="text-sm text-gray-600 flex items-center">
                    {selectedSubmission.website && <Globe className="h-4 w-4 mr-1" />}
                    {selectedSubmission.website || 'Not provided'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Form Type</Label>
                  <Badge variant="outline">
                    {selectedSubmission.form_type === 'signup' ? 'Signup' : 'Lead Capture'}
                  </Badge>
                </div>
              </div>

              {selectedSubmission.message && (
                <div>
                  <Label className="text-sm font-medium flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {selectedSubmission.message}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedSubmission.status)}>
                    {getStatusIcon(selectedSubmission.status)}
                    <span className="ml-1 capitalize">{selectedSubmission.status}</span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Submitted</Label>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(selectedSubmission.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedSubmission.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {selectedSubmission.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setDetailsDialogOpen(false);
                  openUpdateDialog(selectedSubmission);
                }}>
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Submission Status</DialogTitle>
            <DialogDescription>
              Change the status of this submission and add notes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="duplicate">Duplicate</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="invalid">Invalid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="Add any notes about this submission..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate}>
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferralSubmissionsDashboard;
