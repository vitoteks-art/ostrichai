import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Settings,
  Activity,
  Camera,
  Save,
  Edit3,
  Bell,
  Shield,
  Eye,
  Globe,
  Home,
  BarChart3,
  Video,
  Palette,
  ArrowRight,
  ChevronRight,
  CreditCard,
  Zap
} from 'lucide-react';
import { SubscriptionService } from '../services/subscriptionService';
import { useToast } from '../hooks/use-toast';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../lib/api';

interface UserProfileData {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  roles?: string[];
  created_at: string;
  updated_at?: string;
}

interface ActivityItem {
  id: string;
  action: string;
  timestamp: string;
  details?: string;
}

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { subscription, plan } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [activityHistory, setActivityHistory] = useState<ActivityItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [creditBalance, setCreditBalance] = useState<{
    balance: number;
    monthly_allocation: number;
    overage_rate_cents: number;
    credit_rollover_days: number;
  } | null>(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
    bio: ''
  });
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    profileVisibility: 'public',
    activityTracking: true
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
      fetchActivityHistory();
      fetchCreditBalance();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔄 Fetching profile via FastAPI');
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfileData(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        location: data.location || '',
        bio: data.bio || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityHistory = async () => {
    // Mock activity data for now
    const mockActivity: ActivityItem[] = [
      {
        id: '1',
        action: 'Profile Updated',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        details: 'Updated profile information'
      },
      {
        id: '2',
        action: 'Video Created',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        details: 'Created promotional video'
      },
      {
        id: '3',
        action: 'Logo Generated',
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        details: 'Generated company logo'
      }
    ];
    setActivityHistory(mockActivity);
  };

  const fetchCreditBalance = async () => {
    if (!user) return;

    setCreditLoading(true);
    try {
      const creditResult = await SubscriptionService.getCreditBalance(user.id);
      if (creditResult.success && creditResult.data) {
        setCreditBalance(creditResult.data);
      }
    } catch (error) {
      console.error('Error fetching credit balance:', error);
    } finally {
      setCreditLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profileData) return;

    setSaving(true);
    try {
      console.log('🔄 Updating profile via FastAPI');
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfileData(updatedProfile);
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      console.log('🔄 Uploading avatar via FastAPI');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/users/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const data = await response.json();
      const avatar_url = data.avatar_url;

      setProfileData(prev => prev ? {
        ...prev,
        avatar_url: avatar_url
      } : null);

      toast({
        title: 'Success',
        description: 'Avatar updated successfully'
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload avatar',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>Unable to load your profile data.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors flex items-center">
          <Home className="h-4 w-4 mr-1" />
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Profile</span>
      </div>

      {/* Quick Navigation Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link to="/dashboard" className="group">
          <Card className="hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20">
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Dashboard</p>
                <p className="text-xs text-muted-foreground">View analytics</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/video-creation" className="group">
          <Card className="hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20">
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <Video className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Create Video</p>
                <p className="text-xs text-muted-foreground">AI-powered videos</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/logo-creation" className="group">
          <Card className="hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20">
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <Palette className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Design Logo</p>
                <p className="text-xs text-muted-foreground">Professional logos</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/ads-creative" className="group">
          <Card className="hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20">
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                <ArrowRight className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Ad Creative</p>
                <p className="text-xs text-muted-foreground">Design ads</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="credits" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Credits</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Activity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Upload and manage your profile picture</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileData.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {getInitials(profileData.full_name, profileData.email)}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{profileData.full_name || 'No name set'}</h3>
                <p className="text-muted-foreground">{profileData.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">
                    Member since {formatDate(profileData.created_at)}
                  </Badge>
                  {profileData.roles?.map((role) => (
                    <Badge
                      key={role}
                      variant="default"
                      className={
                        role === 'super_admin' ? 'bg-red-500 hover:bg-red-600' :
                          role === 'admin' ? 'bg-amber-500 hover:bg-amber-600' :
                            'bg-blue-500 hover:bg-blue-600'
                      }
                    >
                      {role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
              <Button
                variant={isEditing ? "outline" : "default"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Enter your location"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>
              {isEditing && (
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Credit Balance & Usage
              </CardTitle>
              <CardDescription>Monitor your credit balance, usage, and subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Subscription Info */}
              {plan && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Current Plan</h4>
                    <p className="text-lg font-semibold">{plan.name}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Monthly Credits</h4>
                    <p className="text-lg font-semibold">{plan.limits.monthlyCredits}</p>
                  </div>
                </div>
              )}

              {/* Credit Balance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4">
                    <div className="text-center">
                      {creditLoading ? (
                        <div className="animate-pulse">
                          <div className="h-8 w-16 bg-gray-200 rounded mb-2 mx-auto"></div>
                          <div className="h-4 w-20 bg-gray-200 rounded mx-auto"></div>
                        </div>
                      ) : (
                        <>
                          <div className="text-3xl font-bold text-blue-600 mb-2">
                            {creditBalance?.balance || 0}
                          </div>
                          <div className="text-sm text-blue-700">Credits Remaining</div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4">
                    <div className="text-center">
                      {creditLoading ? (
                        <div className="animate-pulse">
                          <div className="h-8 w-16 bg-gray-200 rounded mb-2 mx-auto"></div>
                          <div className="h-4 w-20 bg-gray-200 rounded mx-auto"></div>
                        </div>
                      ) : (
                        <>
                          <div className="text-3xl font-bold text-green-600 mb-2">
                            {creditBalance?.monthly_allocation || 0}
                          </div>
                          <div className="text-sm text-green-700">Monthly Allocation</div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-4">
                    <div className="text-center">
                      {creditLoading ? (
                        <div className="animate-pulse">
                          <div className="h-8 w-16 bg-gray-200 rounded mb-2 mx-auto"></div>
                          <div className="h-4 w-20 bg-gray-200 rounded mx-auto"></div>
                        </div>
                      ) : (
                        <>
                          <div className="text-3xl font-bold text-orange-600 mb-2">
                            ${creditBalance?.overage_rate_cents ? (creditBalance.overage_rate_cents / 100).toFixed(2) : '0.00'}
                          </div>
                          <div className="text-sm text-orange-700">Overage Rate</div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Credit Usage Progress */}
              {creditBalance && plan && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Credit Usage This Month</span>
                      <span>
                        {creditBalance.monthly_allocation - (creditBalance.balance || 0)} / {creditBalance.monthly_allocation} credits used
                      </span>
                    </div>
                    <Progress
                      value={creditBalance.monthly_allocation > 0 ? ((creditBalance.monthly_allocation - (creditBalance.balance || 0)) / creditBalance.monthly_allocation) * 100 : 0}
                      className="h-3"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {creditBalance.balance || 0} credits remaining this month
                    </div>
                  </div>

                  {/* Credit Rollover Info */}
                  {plan.limits.creditRolloverDays > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Credit Rollover</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Unused credits roll over for {plan.limits.creditRolloverDays} days. Your current balance will be available beyond this billing cycle.
                      </p>
                    </div>
                  )}

                  {/* Low Credit Warning */}
                  {creditBalance.balance !== undefined && creditBalance.balance <= 50 && creditBalance.balance > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Low Credit Balance</span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        You have {creditBalance.balance} credits remaining. Consider upgrading your plan or purchasing additional credits.
                      </p>
                    </div>
                  )}

                  {/* Out of Credits Alert */}
                  {creditBalance.balance !== undefined && creditBalance.balance <= 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-800">Out of Credits</span>
                      </div>
                      <p className="text-sm text-red-700">
                        You've used all your credits for this month. Upgrade your plan or purchase additional credits to continue using features.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Credit Cost Reference */}
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Credit Cost Reference</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Background Removal</span>
                      <span className="font-medium">1 credit</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nano-banana Image</span>
                      <span className="font-medium">2 credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nano-banana-pro (1-2k)</span>
                      <span className="font-medium">6 credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nano-banana-pro (4k)</span>
                      <span className="font-medium">8 credits</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Veo3 Fast (8 sec)</span>
                      <span className="font-medium">20 credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Veo3 Quality (8 sec)</span>
                      <span className="font-medium">80 credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span>YouTube Scraper</span>
                      <span className="font-medium">1 credit</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Search</span>
                      <span className="font-medium">1 credit</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, pushNotifications: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your privacy and data preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activity Tracking</Label>
                  <p className="text-sm text-muted-foreground">Allow us to track your activity for better experience</p>
                </div>
                <Switch
                  checked={settings.activityTracking}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, activityTracking: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent actions and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityHistory.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{activity.action}</h4>
                      {activity.details && (
                        <p className="text-sm text-muted-foreground">{activity.details}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                {activityHistory.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
            asChild
          >
            <Link to="/dashboard">
              <BarChart3 className="h-6 w-6" />
            </Link>
          </Button>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Go to Dashboard
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Helper */}
      <div className="mt-12 p-6 bg-card/30 rounded-lg border">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold mb-2">Ready to Create?</h3>
          <p className="text-muted-foreground text-sm">Start building amazing content with our AI tools</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Dashboard
            </Button>
          </Link>
          <Link to="/video-creation">
            <Button variant="outline" size="sm">
              <Video className="h-4 w-4 mr-2" />
              Create Video
            </Button>
          </Link>
          <Link to="/logo-creation">
            <Button variant="outline" size="sm">
              <Palette className="h-4 w-4 mr-2" />
              Design Logo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
