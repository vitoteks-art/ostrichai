import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { ProtectedAdminRoute } from '../components/ProtectedAdminRoute';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { EmailInput } from '../components/ui/email-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { useToast } from '../hooks/use-toast';
import { EmailCampaignService } from '../services/emailCampaignService';
import { WysiwygEditor } from '../components/WysiwygEditor';
import type {
  EmailCampaign,
  EmailType,
  RecipientType,
} from '../types/email';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Calendar,
  Users,
  Mail,
  Settings,
  Home,
  ChevronRight,
  X,
  Code,
  BarChart3,
} from 'lucide-react';

const AdminEmailComposer: React.FC = () => {
  const { user } = useAuth();
  const { checkPermission } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId?: string }>();

  // Form state
  const [campaign, setCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'promotional' as EmailType,
    recipientType: 'all' as RecipientType,
    scheduledFor: '',
    cc: [] as string[],
    bcc: [] as string[],
  });

  const [availableRecipients, setAvailableRecipients] = useState<any[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);

  useEffect(() => {
    loadRecipients();

    // If editing existing campaign, load it
    if (campaignId) {
      loadCampaign(campaignId);
    }
  }, [campaignId]);

  const loadRecipients = async () => {
    // Mock data - in real app, fetch from database
    const mockRecipients = [
      { id: '1', email: 'client1@example.com', name: 'John Doe', type: 'client' },
      { id: '2', email: 'client2@example.com', name: 'Jane Smith', type: 'client' },
      { id: '3', email: 'prospect1@example.com', name: 'Bob Johnson', type: 'prospect' },
    ];
    setAvailableRecipients(mockRecipients);
  };

  const loadCampaign = async (id: string) => {
    setLoading(true);
    try {
      const campaignData = await EmailCampaignService.getCampaign(id);
      if (campaignData) {
        setCampaign({
          name: campaignData.name,
          subject: campaignData.subject,
          content: campaignData.content,
          type: campaignData.type,
          recipientType: campaignData.recipientType,
          scheduledFor: campaignData.scheduledFor || '',
          cc: campaignData.cc || [],
          bcc: campaignData.bcc || [],
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load campaign',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (sendNow = false) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Create recipients from the emails entered by user
      const recipients = recipientEmails.map(email => {
        const recipient = availableRecipients.find(r => r.email === email);
        return recipient || {
          id: `manual_${email}`,
          email: email,
          name: email.split('@')[0],
          type: 'client' as const,
          userId: undefined,
          metadata: {}
        };
      });

      const campaignData: Omit<EmailCampaign, 'id' | 'createdAt' | 'updatedAt' | 'stats'> = {
        name: campaign.name,
        subject: campaign.subject,
        content: campaign.content,
        type: campaign.type,
        status: campaign.scheduledFor ? 'scheduled' : 'draft', // Never set to 'sent' during creation
        recipientType: 'custom',
        recipients,
        cc: campaign.cc.length > 0 ? campaign.cc : undefined,
        bcc: campaign.bcc.length > 0 ? campaign.bcc : undefined,
        scheduledFor: campaign.scheduledFor || undefined,
        createdBy: user.id,
      };

      let campaignIdToUse = campaignId;

      if (campaignId) {
        // Update existing campaign
        toast({
          title: 'Success',
          description: `Campaign ${sendNow ? 'sent' : 'updated'} successfully`,
        });
      } else {
        // Create new campaign
        const newCampaign = await EmailCampaignService.createCampaign(campaignData);
        campaignIdToUse = newCampaign.id;
        console.log('✅ Created new campaign:', newCampaign.id);
        toast({
          title: 'Success',
          description: `Campaign ${sendNow ? 'sent' : 'saved'} successfully`,
        });
      }

      if (sendNow) {
        // Send the campaign
        console.log('🚀 Sending campaign:', campaignIdToUse);
        await EmailCampaignService.sendCampaign(campaignIdToUse!);
        toast({
          title: 'Campaign Sent',
          description: 'Your email campaign has been sent successfully',
        });
      }

      navigate('/admin/emails');
    } catch (error) {
      console.error('❌ Campaign save/send failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        campaignName: campaign.name,
        campaignSubject: campaign.subject,
        sendNow: sendNow
      });

      toast({
        title: 'Error',
        description: `Failed to ${sendNow ? 'send' : 'save'} campaign: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const previewEmail = () => {
    setIsPreview(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <ProtectedAdminRoute requiredPermission="users" requiredAction="manage">
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link
                  to="/admin/emails"
                  className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Campaigns</span>
                </Link>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <h1 className="text-2xl font-bold text-black">
                    {campaignId ? 'Edit Campaign' : 'Compose Email Campaign'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Create and send promotional emails to your clients and prospects
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={previewEmail}
                  className="border-2 border-gray-400 text-gray-900 bg-white hover:bg-gray-100 hover:border-gray-500 font-semibold"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="border-2 border-gray-400 text-gray-900 bg-white hover:bg-gray-100 hover:border-gray-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-300 font-semibold"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-200 font-semibold shadow-md"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {saving ? 'Sending...' : 'Send Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Campaign Details */}
              <Card className="border-gray-300 bg-white shadow-sm">
                <CardHeader className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200">
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Campaign Details
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Basic information about your email campaign
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-white pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="campaign-name" className="text-gray-900 font-semibold text-sm">Campaign Name</Label>
                      <Input
                        id="campaign-name"
                        value={campaign.name}
                        onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                        placeholder="Internal campaign name"
                        className="border-2 border-gray-400 text-gray-900 placeholder:text-gray-500 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-200 h-11 text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="campaign-subject" className="text-gray-900 font-semibold text-sm">Email Subject</Label>
                      <Input
                        id="campaign-subject"
                        value={campaign.subject}
                        onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
                        placeholder="Email subject line"
                        className="border-2 border-gray-400 text-gray-900 placeholder:text-gray-500 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-200 h-11 text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="campaign-cc" className="text-gray-900 font-semibold text-sm">CC (Carbon Copy)</Label>
                      <EmailInput
                        value={campaign.cc}
                        onChange={(emails) => setCampaign({ ...campaign, cc: emails })}
                        placeholder="Type email addresses and press Enter, Tab, or comma to add"
                        className="border-2 border-gray-400 text-gray-900 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200"
                        maxEmails={20}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="campaign-bcc" className="text-gray-900 font-semibold text-sm">BCC (Blind Carbon Copy)</Label>
                      <EmailInput
                        value={campaign.bcc}
                        onChange={(emails) => setCampaign({ ...campaign, bcc: emails })}
                        placeholder="Type email addresses and press Enter, Tab, or comma to add"
                        className="border-2 border-gray-400 text-gray-900 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200"
                        maxEmails={20}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="campaign-type" className="text-gray-900 font-semibold text-sm">Campaign Type</Label>
                      <Select value={campaign.type} onValueChange={(value: EmailType) => setCampaign({ ...campaign, type: value })}>
                        <SelectTrigger className="border-2 border-gray-400 text-gray-900 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-200 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-2 border-gray-300">
                          <SelectItem value="promotional" className="text-gray-900 focus:bg-blue-100 focus:text-gray-900">Promotional</SelectItem>
                          <SelectItem value="newsletter" className="text-gray-900 focus:bg-blue-100 focus:text-gray-900">Newsletter</SelectItem>
                          <SelectItem value="transactional" className="text-gray-900 focus:bg-blue-100 focus:text-gray-900">Transactional</SelectItem>
                          <SelectItem value="announcement" className="text-gray-900 focus:bg-blue-100 focus:text-gray-900">Announcement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recipient-emails" className="text-gray-900 font-semibold text-sm">Recipients (To)</Label>
                      <EmailInput
                        value={recipientEmails}
                        onChange={(emails) => {
                          setRecipientEmails(emails);
                          // Update selectedRecipients based on the emails entered
                          const newSelectedRecipients = emails.map(email =>
                            availableRecipients.find(r => r.email === email)?.id
                          ).filter(Boolean) as string[];
                          setSelectedRecipients(newSelectedRecipients);
                          setCampaign({ ...campaign, recipientType: 'custom' });
                        }}
                        placeholder="Type email addresses and press Enter, Tab, or comma to add"
                        className="border-2 border-gray-400 text-gray-900 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200"
                        maxEmails={50}
                      />
                      <p className="text-xs text-gray-600">Enter email addresses directly or use quick selection below</p>

                      {/* Quick recipient selection */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-700 font-medium">Quick Selection:</Label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const allEmails = availableRecipients.map(r => r.email);
                              setRecipientEmails(allEmails);
                              const newSelectedRecipients = availableRecipients.map(r => r.id);
                              setSelectedRecipients(newSelectedRecipients);
                              setCampaign({ ...campaign, recipientType: 'all' });
                            }}
                            className="text-xs border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400"
                          >
                            All Users ({availableRecipients.length})
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const clientEmails = availableRecipients.filter(r => r.type === 'client').map(r => r.email);
                              setRecipientEmails(clientEmails);
                              const newSelectedRecipients = availableRecipients.filter(r => r.type === 'client').map(r => r.id);
                              setSelectedRecipients(newSelectedRecipients);
                              setCampaign({ ...campaign, recipientType: 'clients' });
                            }}
                            className="text-xs border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400"
                          >
                            Clients ({availableRecipients.filter(r => r.type === 'client').length})
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const prospectEmails = availableRecipients.filter(r => r.type === 'prospect').map(r => r.email);
                              setRecipientEmails(prospectEmails);
                              const newSelectedRecipients = availableRecipients.filter(r => r.type === 'prospect').map(r => r.id);
                              setSelectedRecipients(newSelectedRecipients);
                              setCampaign({ ...campaign, recipientType: 'prospects' });
                            }}
                            className="text-xs border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-400"
                          >
                            Prospects ({availableRecipients.filter(r => r.type === 'prospect').length})
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule-date" className="text-gray-900 font-semibold text-sm">Schedule (Optional)</Label>
                    <Input
                      id="schedule-date"
                      type="datetime-local"
                      value={campaign.scheduledFor}
                      onChange={(e) => setCampaign({ ...campaign, scheduledFor: e.target.value })}
                      className="border-2 border-gray-400 text-gray-900 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-200 h-11 text-base"
                    />
                    <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded border border-blue-200">
                      💡 Leave empty to send immediately, or set a future date and time
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Email Content */}
              <Card className="border-gray-300 bg-white shadow-sm">
                <CardHeader className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200">
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Email Content
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Compose your email message with rich formatting and RTL support
                  </CardDescription>
                </CardHeader>
                <CardContent className="bg-white p-0">
                  <WysiwygEditor
                    value={campaign.content}
                    onChange={(value) => setCampaign({ ...campaign, content: value })}
                    placeholder="Compose your email content..."
                    height="500px"
                    variables={[
                      { key: 'recipient_name', label: 'Recipient Name' },
                      { key: 'company_name', label: 'Company Name' },
                      { key: 'unsubscribe_url', label: 'Unsubscribe URL' },
                      { key: 'current_date', label: 'Current Date' },
                    ]}
                    className="border-none"
                    direction="ltr"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Campaign Stats */}
              <Card className="border-gray-300 bg-white shadow-sm">
                <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-gray-200">
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Campaign Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 bg-white pt-6">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Recipients:</span>
                    <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                      {campaign.recipientType === 'all' ? availableRecipients.length :
                       campaign.recipientType === 'clients' ?
                         availableRecipients.filter(r => r.type === 'client').length :
                       availableRecipients.filter(r => r.type === 'prospect').length}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Type:</span>
                    <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                      {campaign.type}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <Badge variant="outline" className="border-gray-400 text-gray-700 bg-white">
                      {campaign.scheduledFor ? 'Scheduled' : 'Draft'}
                    </Badge>
                  </div>

                  {campaign.scheduledFor && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        Scheduled:
                      </span>
                      <span className="text-sm text-gray-900 font-semibold">
                        {new Date(campaign.scheduledFor).toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Template Variables */}
              <Card className="border-gray-300 bg-white shadow-sm">
                <CardHeader className="bg-gradient-to-r from-white to-purple-50 border-b border-gray-200">
                  <CardTitle className="text-gray-900 text-base flex items-center gap-2">
                    <Code className="h-4 w-4 text-purple-600" />
                    Template Variables
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-sm">
                    Click to insert into content
                  </CardDescription>
                </CardHeader>
                <CardContent className="bg-white pt-4">
                  <div className="space-y-2">
                    {[
                      { key: 'recipient_name', label: 'Recipient Name', desc: 'Personalized recipient name' },
                      { key: 'company_name', label: 'Company Name', desc: 'Your company name' },
                      { key: 'unsubscribe_url', label: 'Unsubscribe URL', desc: 'Unsubscribe link' },
                      { key: 'current_date', label: 'Current Date', desc: 'Today\'s date' },
                    ].map((variable) => (
                      <div
                        key={variable.key}
                        className="p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-all duration-200 bg-white"
                        onClick={() => {
                          const variableTag = `{{${variable.key}}}`;
                          setCampaign({
                            ...campaign,
                            content: campaign.content + variableTag
                          });
                          toast({
                            title: 'Variable Inserted',
                            description: `${variable.label} added to content`,
                          });
                        }}
                      >
                        <div className="font-medium text-gray-900 text-sm">{variable.label}</div>
                        <div className="text-xs text-gray-600 mt-1">{variable.desc}</div>
                        <code className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded mt-2 inline-block font-mono">
                          {`{{${variable.key}}}`}
                        </code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-gray-300 bg-white shadow-sm">
                <CardHeader className="bg-gradient-to-r from-white to-green-50 border-b border-gray-200">
                  <CardTitle className="text-gray-900 text-base flex items-center gap-2">
                    <Settings className="h-4 w-4 text-green-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 bg-white pt-4">
                  <Button
                    variant="outline"
                    className="w-full border-2 border-gray-400 text-gray-900 bg-white hover:bg-gray-100 hover:border-gray-500 font-semibold"
                    onClick={async () => {
                      // Load a template
                      try {
                        const templates = await EmailCampaignService.getTemplates();
                        if (templates.length > 0) {
                          const template = templates[0];
                          setCampaign({
                            ...campaign,
                            subject: template.subject,
                            content: template.htmlContent,
                          });
                          toast({
                            title: 'Template Loaded',
                            description: `${template.name} template applied`,
                          });
                        } else {
                          toast({
                            title: 'No Templates',
                            description: 'No email templates available',
                            variant: 'destructive',
                          });
                        }
                      } catch (error) {
                        toast({
                          title: 'Error',
                          description: 'Failed to load templates',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    Load Template
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-2 border-gray-400 text-gray-900 bg-white hover:bg-gray-100 hover:border-gray-500 font-semibold"
                    onClick={() => {
                      setCampaign({
                        ...campaign,
                        content: campaign.content + '\n\n<p>Best regards,<br>The Team</p>',
                      });
                    }}
                  >
                    Add Signature
                  </Button>

                  <Separator className="bg-gray-300" />

                  <div className="text-xs text-gray-700 space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900">💡 Tips:</p>
                    <p>• Use template variables for personalization</p>
                    <p>• Click LTR/RTL button to change text direction</p>
                    <p className="font-semibold text-blue-900 mt-2">⌨️ Keyboard shortcuts:</p>
                    <p>• <code className="bg-white px-1 rounded">Ctrl+B</code>: Bold text</p>
                    <p>• <code className="bg-white px-1 rounded">Ctrl+I</code>: Italic text</p>
                    <p>• <code className="bg-white px-1 rounded">Ctrl+Z</code>: Undo</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {isPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-300">
              <div className="p-4 border-b border-gray-300 flex justify-between items-center bg-gradient-to-r from-white to-gray-50">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreview(false)}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6 max-h-[calc(90vh-80px)] overflow-auto bg-gray-50">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-sm text-gray-700 mb-4 pb-4 border-b border-gray-200">
                    <div className="space-y-1">
                      <div>
                        <strong className="text-gray-900">To:</strong>{' '}
                        {recipientEmails.length > 0
                          ? recipientEmails.join(', ')
                          : 'No recipients selected'
                        }
                      </div>
                      {campaign.cc.length > 0 && <div><strong className="text-gray-900">CC:</strong> {campaign.cc.join(', ')}</div>}
                      {campaign.bcc.length > 0 && <div><strong className="text-gray-900">BCC:</strong> {campaign.bcc.join(', ')}</div>}
                      <div><strong className="text-gray-900">Subject:</strong> {campaign.subject || 'No subject'}</div>
                    </div>
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-gray-900 wysiwyg-editor"
                    dangerouslySetInnerHTML={{
                      __html: campaign.content || '<p class="text-gray-500">Email content will appear here...</p>'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedAdminRoute>
  );
};

export default AdminEmailComposer;
