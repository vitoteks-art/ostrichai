import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Settings, CheckCircle, AlertCircle, Copy, ExternalLink, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GoogleOAuthSettingsProps {
  className?: string;
}

export const GoogleOAuthSettings: React.FC<GoogleOAuthSettingsProps> = ({ className }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleTestConfiguration = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Test Google OAuth configuration
      console.log('🔧 Testing Google OAuth configuration...');

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUrl = import.meta.env.VITE_GOOGLE_REDIRECT_URL;

      if (!clientId || !redirectUrl) {
        throw new Error('Google OAuth credentials not configured in environment variables');
      }

      if (!clientId.startsWith('your-google-client-id')) {
        console.log('✅ Google OAuth appears to be configured');
        setTestResult(true);

        toast({
          title: "Configuration Check Passed",
          description: "Google OAuth credentials are configured. Test the actual OAuth flow by trying to sign in.",
        });
      } else {
        throw new Error('Please configure your Google OAuth credentials in the .env file');
      }
    } catch (error) {
      setTestResult(false);
      toast({
        title: "Configuration Check Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Configuration copied to clipboard!",
    });
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleRedirectUrl = import.meta.env.VITE_GOOGLE_REDIRECT_URL;

  return (
    <div className={className}>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Google OAuth Configuration
          </CardTitle>
          <CardDescription>
            Configure Google OAuth for seamless user authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration Status */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              {googleClientId && !googleClientId.startsWith('your-') ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <h3 className="font-semibold">Google OAuth Status</h3>
                <p className="text-sm text-muted-foreground">
                  {googleClientId && !googleClientId.startsWith('your-')
                    ? 'Google OAuth is configured and ready to use'
                    : 'Google OAuth credentials not configured'
                  }
                </p>
              </div>
            </div>
            <Badge variant={googleClientId && !googleClientId.startsWith('your-') ? "default" : "secondary"}>
              {googleClientId && !googleClientId.startsWith('your-') ? "Configured" : "Not Configured"}
            </Badge>
          </div>

          {/* Current Configuration */}
          {googleClientId && googleRedirectUrl && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Current Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Google Client ID</Label>
                  <div className="flex gap-2">
                    <Input
                      value={googleClientId.startsWith('your-') ? 'Not configured' : googleClientId}
                      readOnly
                      className="font-mono text-sm"
                    />
                    {!googleClientId.startsWith('your-') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(googleClientId)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Redirect URL</Label>
                  <div className="flex gap-2">
                    <Input value={googleRedirectUrl} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(googleRedirectUrl)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleTestConfiguration}
              disabled={isTesting}
              variant="outline"
              className="flex-1"
            >
              {isTesting ? (
                <>
                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                  Testing Configuration...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Test OAuth Configuration
                </>
              )}
            </Button>
          </div>

          {/* Test Results */}
          {testResult !== null && (
            <div className={`p-4 rounded-lg border ${
              testResult
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {testResult ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-medium">
                  {testResult ? 'OAuth Configuration Check Passed' : 'OAuth Configuration Check Failed'}
                </span>
              </div>
            </div>
          )}

          {/* Setup Instructions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Google OAuth Setup Instructions</h3>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">1. Create Google Cloud Project</h4>
                <p className="text-blue-800 mb-2">Go to Google Cloud Console and:</p>
                <ul className="list-disc list-inside text-blue-800 space-y-1">
                  <li>Create a new project or select existing one</li>
                  <li>Enable the Google+ API in the API Library</li>
                  <li>Configure the OAuth consent screen</li>
                  <li>Create OAuth 2.0 Client ID credentials</li>
                </ul>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">2. Configure Supabase</h4>
                <p className="text-green-800 mb-2">In your Supabase Dashboard:</p>
                <ol className="list-decimal list-inside text-green-800 space-y-1">
                  <li>Go to Authentication → Providers</li>
                  <li>Enable Google provider</li>
                  <li>Enter your Google Client ID and Client Secret</li>
                  <li>Add redirect URLs: <code>http://localhost:5173/auth/callback</code></li>
                </ol>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">3. Update Environment Variables</h4>
                <p className="text-purple-800 mb-2">Add to your <code>.env</code> file:</p>
                <pre className="mt-2 p-2 bg-purple-100 rounded text-xs overflow-x-auto">
{`VITE_GOOGLE_CLIENT_ID=your-actual-client-id
GOOGLE_CLIENT_SECRET=your-actual-client-secret
VITE_GOOGLE_REDIRECT_URL=http://localhost:5173/auth/callback`}
                </pre>
              </div>

              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">4. Test Integration</h4>
                <p className="text-orange-800 mb-2">After configuration:</p>
                <ul className="list-disc list-inside text-orange-800 space-y-1">
                  <li>Restart your development server</li>
                  <li>Try signing in with Google</li>
                  <li>Verify users are created in Supabase Auth</li>
                  <li>Check for any OAuth-related errors</li>
                </ul>
              </div>
            </div>
          </div>

          {/* External Links */}
          <div className="flex gap-4 pt-4">
            <Button variant="outline" asChild className="flex-1">
              <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Google Cloud Console
              </a>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <a href="https://supabase.com/docs/guides/auth/google-oauth" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Supabase OAuth Guide
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
