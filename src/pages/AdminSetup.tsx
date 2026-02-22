import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { setupAdminUser, getCurrentUserId } from '../utils/setupAdminUser';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Crown,
  Users,
  Database,
  ArrowRight,
  Copy,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const AdminSetup: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'super_admin' | 'admin' | 'moderator' | 'viewer'>('super_admin');
  const [isLoading, setIsLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [currentRole, setCurrentRole] = useState<string>('');

  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
      loadCurrentUserRole();
    }
  }, [user]);

  const loadCurrentUserRole = async () => {
    try {
      // This would typically use the adminService to check current role
      // For now, we'll show a placeholder
      setCurrentRole('user'); // Default role
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const handleSetupAdmin = async () => {
    if (!currentUserId) {
      toast({
        title: 'Error',
        description: 'No user ID found. Please login first.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await setupAdminUser({
        userId: currentUserId,
        role: selectedRole,
        skipIfExists: true,
      });

      if (result.success) {
        setSetupComplete(true);
        toast({
          title: 'Success!',
          description: result.message,
        });

        // Redirect to admin dashboard after a short delay
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
      } else {
        toast({
          title: 'Setup Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Setup failed: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'User ID copied to clipboard',
    });
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Full system access with all permissions';
      case 'admin':
        return 'Can manage users, settings, and most administrative functions';
      case 'moderator':
        return 'Limited administrative access with content management';
      case 'viewer':
        return 'Read-only access to administrative data';
      default:
        return 'Standard user access';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-5 w-5 text-purple-600" />;
      case 'admin':
        return <Shield className="h-5 w-5 text-blue-600" />;
      case 'moderator':
        return <Users className="h-5 w-5 text-green-600" />;
      case 'viewer':
        return <CheckCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <Users className="h-5 w-5 text-gray-600" />;
    }
  };

  if (setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Setup Complete!</CardTitle>
            <CardDescription>
              Your admin role has been successfully configured.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <Badge className="bg-green-100 text-green-800 mb-2">
                {getRoleIcon(selectedRole)}
                <span className="ml-2 capitalize">{selectedRole.replace('_', ' ')}</span>
              </Badge>
              <p className="text-sm text-green-700">{getRoleDescription(selectedRole)}</p>
            </div>
            <p className="text-sm text-gray-600">
              Redirecting to admin dashboard in a few seconds...
            </p>
            <Button onClick={() => navigate('/admin')} className="w-full">
              Go to Admin Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Admin Dashboard Setup</CardTitle>
          <CardDescription>
            Set up your first admin user to access the administrative features
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Prerequisites Alert */}
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>Before proceeding:</strong> Make sure you've run the <code>admin-schema.sql</code> file
              in your Supabase SQL editor to create the necessary database tables.
            </AlertDescription>
          </Alert>

          {/* Current User Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Current User Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-mono">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">User ID:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                    {currentUserId}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(currentUserId)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Role:</span>
                <Badge variant="outline" className="capitalize">
                  {currentRole.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <h3 className="font-medium">Select Admin Role</h3>
            <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">
                  <div className="flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="font-medium">Super Admin</div>
                      <div className="text-xs text-gray-500">Full system access</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">Admin</div>
                      <div className="text-xs text-gray-500">Most administrative functions</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="moderator">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">Moderator</div>
                      <div className="text-xs text-gray-500">Limited administrative access</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="viewer">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-gray-600" />
                    <div>
                      <div className="font-medium">Viewer</div>
                      <div className="text-xs text-gray-500">Read-only administrative access</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Selected Role Description */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                {getRoleIcon(selectedRole)}
                <div>
                  <div className="font-medium text-blue-900 capitalize">
                    {selectedRole.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-blue-700">
                    {getRoleDescription(selectedRole)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Setup Button */}
          <Button
            onClick={handleSetupAdmin}
            disabled={isLoading || !currentUserId}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Setting up admin role...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Set Up Admin Role
              </>
            )}
          </Button>

          {/* Help Section */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Need Help?</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>1. 📋 Copy your User ID from the section above</p>
              <p>2. 🗃️ Run <code>admin-schema.sql</code> in Supabase SQL editor</p>
              <p>3. 🔑 Login to your application</p>
              <p>4. 🎉 Access admin dashboard at <code>/admin</code></p>
            </div>
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Alternative:</strong> Run this in your browser console:
                <code className="block mt-1 p-2 bg-yellow-100 rounded text-xs">
                  import('./utils/setupAdminUser.js').then(m => m.quickSetup())
                </code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
