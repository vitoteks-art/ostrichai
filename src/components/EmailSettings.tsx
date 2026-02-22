import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Mail, Settings, TestTube, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MailService } from '../services/mailService';
import { setupSupabaseMailtrap } from '../utils/supabaseMailtrapSetup';

interface EmailSettingsProps {
  className?: string;
}

export const EmailSettings: React.FC<EmailSettingsProps> = ({ className }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [apiTestResult, setApiTestResult] = useState<boolean | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [configResult, setConfigResult] = useState<boolean | null>(null);
  const { toast } = useToast();

  const mailtrapConfig = MailService.getSMTPConfig();

  const handleTestConfiguration = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await MailService.testSMTPConfiguration();
      setTestResult(result);

      toast({
        title: result ? "SMTP Test Successful" : "SMTP Test Failed",
        description: result
          ? "Mailtrap SMTP configuration is working correctly!"
          : "Mailtrap SMTP configuration has issues. Check your credentials.",
        variant: result ? "default" : "destructive",
      });
    } catch (error) {
      setTestResult(false);
      toast({
        title: "SMTP Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestAPIConfiguration = async () => {
    setIsTestingAPI(true);
    setApiTestResult(null);

    try {
      // Test API by sending a test email
      const result = await MailService.sendEmailViaAPI(
        'test@example.com',
        'Mailtrap API Test',
        '<h1>Test Email</h1><p>This is a test email from Mailtrap API integration.</p>',
        'Test Email - This is a test email from Mailtrap API integration.'
      );

      setApiTestResult(result);

      toast({
        title: result ? "API Test Successful" : "API Test Failed",
        description: result
          ? "Mailtrap API integration is working correctly!"
          : "Mailtrap API integration has issues. Check your API token.",
        variant: result ? "default" : "destructive",
      });
    } catch (error) {
      setApiTestResult(false);
      toast({
        title: "API Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsTestingAPI(false);
    }
  };

  const handleConfigureSupabase = async () => {
    setIsConfiguring(true);
    setConfigResult(null);

    try {
      const result = await setupSupabaseMailtrap();
      setConfigResult(result);

      if (result) {
        toast({
          title: "Configuration Generated",
          description: "Supabase configuration has been generated. Check console for SQL commands.",
        });
      }
    } catch (error) {
      setConfigResult(false);
      toast({
        title: "Configuration Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Configuration copied to clipboard!",
    });
  };

  return (
    <div className={className}>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Configuration (Mailtrap)
          </CardTitle>
          <CardDescription>
            Configure and test Mailtrap integration for Supabase Auth emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                {MailService.isSMTPConfigured() ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <div>
                  <h3 className="font-semibold">SMTP Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    {MailService.isSMTPConfigured()
                      ? 'SMTP configured for Supabase Auth emails'
                      : 'SMTP credentials not found in environment variables'
                    }
                  </p>
                </div>
              </div>
              <Badge variant={MailService.isSMTPConfigured() ? "default" : "secondary"}>
                {MailService.isSMTPConfigured() ? "Ready" : "Not Configured"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                {MailService.isAPIConfigured() ? (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <div>
                  <h3 className="font-semibold">API Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    {MailService.isAPIConfigured()
                      ? 'API configured for custom email sending'
                      : 'API token not found in environment variables'
                    }
                  </p>
                </div>
              </div>
              <Badge variant={MailService.isAPIConfigured() ? "default" : "secondary"}>
                {MailService.isAPIConfigured() ? "Ready" : "Not Configured"}
              </Badge>
            </div>
          </div>

          {/* Configuration Details */}
          {mailtrapConfig && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Current Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">SMTP Host</Label>
                  <div className="flex gap-2">
                    <Input value={mailtrapConfig.host} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(mailtrapConfig.host)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Port</Label>
                  <Input value={mailtrapConfig.port} readOnly className="font-mono text-sm" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Username</Label>
                  <div className="flex gap-2">
                    <Input value={mailtrapConfig.user} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(mailtrapConfig.user)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">From Email</Label>
                  <div className="flex gap-2">
                    <Input value={mailtrapConfig.from} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(mailtrapConfig.from)}
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
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleTestConfiguration}
                disabled={!MailService.isSMTPConfigured() || isTesting}
                variant="outline"
                className="flex-1"
              >
                {isTesting ? (
                  <>
                    <TestTube className="w-4 h-4 mr-2 animate-pulse" />
                    Testing SMTP...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Test SMTP Configuration
                  </>
                )}
              </Button>

              <Button
                onClick={handleTestAPIConfiguration}
                disabled={!MailService.isAPIConfigured() || isTestingAPI}
                variant="outline"
                className="flex-1"
              >
                {isTestingAPI ? (
                  <>
                    <TestTube className="w-4 h-4 mr-2 animate-pulse" />
                    Testing API...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Test API Integration
                  </>
                )}
              </Button>
            </div>

            <Button
              onClick={handleConfigureSupabase}
              disabled={!MailService.isSMTPConfigured() || isConfiguring}
              className="w-full"
            >
              {isConfiguring ? (
                <>
                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                  Generating Supabase Config...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Generate Supabase SMTP Config
                </>
              )}
            </Button>
          </div>

          {/* Test Results */}
          <div className="space-y-3">
            {/* SMTP Test Results */}
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
                    SMTP {testResult ? 'Test Passed' : 'Test Failed'}
                  </span>
                </div>
              </div>
            )}

            {/* API Test Results */}
            {apiTestResult !== null && (
              <div className={`p-4 rounded-lg border ${
                apiTestResult
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {apiTestResult ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="font-medium">
                    API {apiTestResult ? 'Test Passed' : 'Test Failed'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Integration Methods Comparison */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">SMTP vs API Integration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SMTP Method */}
              <Card className={`p-4 ${MailService.isSMTPConfigured() ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-600" />
                    SMTP Integration
                    {MailService.isSMTPConfigured() && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${MailService.isSMTPConfigured() ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span>Supabase Auth Compatible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${MailService.isSMTPConfigured() ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span>Built-in Email Templates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${MailService.isSMTPConfigured() ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span>Better for Auth Emails</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${MailService.isSMTPConfigured() ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span>Simpler Configuration</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Recommended for authentication emails (signup, password reset)
                  </p>
                </CardContent>
              </Card>

              {/* API Method */}
              <Card className={`p-4 ${MailService.isAPIConfigured() ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    API Integration
                    {MailService.isAPIConfigured() && <CheckCircle className="w-4 h-4 text-blue-600" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${MailService.isAPIConfigured() ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      <span>Custom Email Templates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${MailService.isAPIConfigured() ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      <span>More Control & Flexibility</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${MailService.isAPIConfigured() ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      <span>Advanced Features</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${MailService.isAPIConfigured() ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      <span>Complex Email Workflows</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Better for marketing emails and custom notifications
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-900 mb-2">💡 Recommendation</h4>
              <p className="text-sm text-amber-800">
                <strong>Use SMTP</strong> for authentication emails (signup, password reset) as it integrates seamlessly with Supabase Auth.
                <strong>Use API</strong> for custom emails where you need more control over templates and content.
              </p>
            </div>
          </div>

          <Separator />

          {/* Setup Instructions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Setup Instructions</h3>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">1. Get Mailtrap Credentials</h4>
                <p className="text-blue-800">
                  Go to <a href="https://mailtrap.io" target="_blank" rel="noopener noreferrer" className="underline">Mailtrap.io</a> and:
                </p>
                <ul className="list-disc list-inside mt-2 text-blue-800 space-y-1">
                  <li>Sign up for a free account</li>
                  <li>Go to Email Testing → Inboxes</li>
                  <li>Create a new inbox or use the default one</li>
                  <li>Go to Settings → SMTP Settings</li>
                  <li>Copy the credentials (Host, Port, Username, Password)</li>
                </ul>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">2. Configure Environment Variables</h4>
                <p className="text-green-800">
                  Update your <code>.env</code> file with your Mailtrap credentials:
                </p>
                <pre className="mt-2 p-2 bg-green-100 rounded text-xs overflow-x-auto">
{`VITE_MAILTRAP_HOST=sandbox.smtp.mailtrap.io
VITE_MAILTRAP_PORT=2525
VITE_MAILTRAP_USER=your_mailtrap_username
VITE_MAILTRAP_PASS=your_mailtrap_password
SUPABASE_SMTP_FROM=noreply@yourdomain.com`}
                </pre>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">3. Configure Supabase Auth</h4>
                <p className="text-purple-800">
                  In your Supabase Dashboard:
                </p>
                <ol className="list-decimal list-inside mt-2 text-purple-800 space-y-1">
                  <li>Go to Authentication → Settings</li>
                  <li>Scroll to "SMTP Settings"</li>
                  <li>Enable "Configure SMTP"</li>
                  <li>Enter the Mailtrap credentials from step 1</li>
                  <li>Set "From Email" to match your SUPABASE_SMTP_FROM</li>
                  <li>Click "Save"</li>
                </ol>
              </div>

              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">4. Test Email Sending</h4>
                <p className="text-orange-800">
                  Use the buttons above to:
                </p>
                <ul className="list-disc list-inside mt-2 text-orange-800 space-y-1">
                  <li>Test your Mailtrap configuration</li>
                  <li>Generate Supabase SQL configuration</li>
                  <li>Verify emails are being sent correctly</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Development Helper */}
          {import.meta.env.DEV && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                💡 <strong>Development Mode:</strong> Run <code>setupSupabaseMailtrap()</code> in the browser console to generate configuration commands.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
