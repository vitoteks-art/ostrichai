import { BookingLayout } from "@/components/BookingLayout";
import { useBooking } from "@/contexts/BookingContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, TestTube, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { BookingSettings as BookingSettingsType } from "@/types/booking";

export default function BookingSettings() {
  const { settings, updateSettings } = useBooking();
  const [localSettings, setLocalSettings] = useState<BookingSettingsType>(settings);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<"success" | "error" | null>(null);
  const { toast } = useToast();

  const handleInputChange = (field: keyof BookingSettingsType, value: any) => {
    setLocalSettings({ ...localSettings, [field]: value });
    // Reset test result when URL changes
    if (field === "n8nWebhookUrl") {
      setWebhookTestResult(null);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = () => {
    updateSettings(localSettings);
    toast({
      title: "Settings Updated",
      description: "Your booking settings have been saved successfully.",
    });
  };

  const handleReset = () => {
    setLocalSettings(settings);
    toast({
      title: "Changes Discarded",
      description: "Your settings have been reset.",
    });
  };

  const testWebhook = async () => {
    // Use current settings webhook URL
    const webhookUrl = localSettings.n8nWebhookUrl || "https://n8n.getostrichai.com/webhook/calendly";

    setIsTestingWebhook(true);
    setWebhookTestResult(null);

    try {
      const testData = {
        event: "test",
        data: {
          message: "This is a test webhook from the booking system",
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      console.log("🧪 Testing webhook with URL:", webhookUrl);
      console.log("📦 Test payload:", testData);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      console.log("📡 Test response status:", response.status);

      if (response.ok) {
        setWebhookTestResult("success");
        const responseText = await response.text();
        console.log("📨 Test response:", responseText);

        try {
          const responseData = JSON.parse(responseText);
          console.log("📋 Parsed test response:", responseData);
        } catch (parseError) {
          console.log("📄 Raw test response:", responseText);
        }

        toast({
          title: "Webhook Test Successful",
          description: "Your webhook is working correctly!",
        });
      } else {
        setWebhookTestResult("error");
        toast({
          title: "Webhook Test Failed",
          description: `HTTP ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      setWebhookTestResult("error");
      console.error("❌ Webhook test error:", error);
      toast({
        title: "Webhook Test Failed",
        description: "Unable to reach the webhook URL. Check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  return (
    <BookingLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Configure your booking system preferences
            </p>
          </div>
          <Settings className="h-8 w-8 text-muted-foreground" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Rules</CardTitle>
            <CardDescription>
              Set constraints for appointment scheduling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="minNoticeHours">
                Minimum Notice Hours
              </Label>
              <Input
                id="minNoticeHours"
                type="number"
                value={localSettings.minNoticeHours}
                onChange={(e) =>
                  handleInputChange("minNoticeHours", parseInt(e.target.value) || 0)
                }
                min="0"
                placeholder="e.g., 4"
              />
              <p className="text-sm text-muted-foreground">
                Minimum hours in advance clients must book (e.g., 4 hours)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDaysInAdvance">
                Maximum Days in Advance
              </Label>
              <Input
                id="maxDaysInAdvance"
                type="number"
                value={localSettings.maxDaysInAdvance}
                onChange={(e) =>
                  handleInputChange("maxDaysInAdvance", parseInt(e.target.value) || 0)
                }
                min="1"
                placeholder="e.g., 60"
              />
              <p className="text-sm text-muted-foreground">
                Maximum days in advance clients can book (e.g., 60 days)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bufferMinutes">
                Buffer Time (Minutes)
              </Label>
              <Input
                id="bufferMinutes"
                type="number"
                value={localSettings.bufferMinutes}
                onChange={(e) =>
                  handleInputChange("bufferMinutes", parseInt(e.target.value) || 0)
                }
                min="0"
                step="5"
                placeholder="e.g., 15"
              />
              <p className="text-sm text-muted-foreground">
                Time buffer between appointments (e.g., 15 minutes for breaks)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Integration</CardTitle>
            <CardDescription>
              Connect your booking system to n8n or other automation tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="n8nWebhookUrl">
                n8n Webhook URL (Optional)
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="n8nWebhookUrl"
                  type="url"
                  value={localSettings.n8nWebhookUrl || ""}
                  onChange={(e) => handleInputChange("n8nWebhookUrl", e.target.value)}
                  placeholder="https://your-n8n-instance.com/webhook/..."
                  className={`flex-1 ${localSettings.n8nWebhookUrl && !isValidUrl(localSettings.n8nWebhookUrl) ? 'border-red-500' : ''}`}
                />
                <Button
                  onClick={testWebhook}
                  disabled={isTestingWebhook || !localSettings.n8nWebhookUrl}
                  variant="outline"
                >
                  {isTestingWebhook ? (
                    <>
                      <TestTube className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test
                    </>
                  )}
                </Button>
              </div>
              {localSettings.n8nWebhookUrl && !isValidUrl(localSettings.n8nWebhookUrl) && (
                <div className="flex items-center space-x-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">Invalid URL format</span>
                </div>
              )}
              {webhookTestResult && isValidUrl(localSettings.n8nWebhookUrl || "") && (
                <div className="flex items-center space-x-2 text-sm">
                  {webhookTestResult === "success" ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Webhook is working correctly!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">Webhook test failed</span>
                    </>
                  )}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Events will be sent to this webhook: appointment.created, appointment.updated,
                appointment.cancelled
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 Current webhook URL: {localSettings.n8nWebhookUrl || "https://n8n.getostrichai.com/webhook/calendly"}
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h4 className="text-sm font-medium mb-2">Webhook Payload Example:</h4>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
                {JSON.stringify(
                  {
                    event: "appointment.created",
                    data: {
                      id: "123",
                      clientName: "John Doe",
                      clientEmail: "john@example.com",
                      clientPhone: "+1234567890",
                      meetingTypeName: "30-min Consultation",
                      date: "2024-01-15",
                      time: "10:00",
                      duration: 30,
                      status: "confirmed",
                      notes: "Looking forward to discussing the project",
                    },
                    timestamp: "2024-01-10T12:00:00.000Z",
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
              <h4 className="text-sm font-medium mb-2">Setup Instructions:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Configure a webhook in your n8n workflow</li>
                <li>Copy the webhook URL and paste it above</li>
                <li>Click "Test" to verify the connection</li>
                <li>Save your settings</li>
                <li>Every new booking will trigger the webhook automatically</li>
              </ol>
              <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                <strong>Debug:</strong> Open browser console and check for webhook logs when testing or submitting bookings.
                <br />
                <strong>Manual Test:</strong> Run <code className="bg-gray-200 px-1 rounded">window.testBookingWebhook()</code> in console.
                <br />
                <strong>Full Test:</strong> Run <code className="bg-gray-200 px-1 rounded">window.testBookingFlow()</code> to test complete booking flow.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Public Booking Link</CardTitle>
            <CardDescription>
              Share this link with clients to allow them to book appointments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                value={`${window.location.origin}/book`}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/book`);
                  toast({
                    title: "Link Copied",
                    description: "The booking link has been copied to your clipboard.",
                  });
                }}
              >
                Copy Link
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Clients can visit this page to view available meeting types and book appointments
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={handleReset}>
            Reset Changes
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </BookingLayout>
  );
}
