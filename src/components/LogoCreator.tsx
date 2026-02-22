import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Palette, Sparkles, Loader2, CreditCard, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useProjects } from "../hooks/useProjects";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { uploadToCloudinary } from "../services/cloudinaryService";
import { SubscriptionService } from "../services/subscriptionService";

interface LogoFormData {
  brandName: string;
  slogan: string;
  industry: string;
  stylePreference: string;
  colors: string;
  iconsSymbols: string;
  previousLogo: File | null;
  userRequest: string;
  model: string;
}

const LogoCreator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, plan } = useSubscription();
  const { createProject, updateProject, updateProjectWithWebhookData, logActivity, isDemo } = useProjects();

  const [formData, setFormData] = useState<LogoFormData>({
    brandName: "",
    slogan: "",
    industry: "",
    stylePreference: "",
    colors: "",
    iconsSymbols: "",
    previousLogo: null,
    userRequest: "",
    model: "google/nano-banana"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const industries = [
    "Technology",
    "Finance",
    "Health",
    "Fashion",
    "Education",
    "Food & Beverage",
    "Real Estate",
    "Entertainment",
    "Sports",
    "Automotive",
    "Other"
  ];

  const stylePreferences = [
    "Minimalist",
    "Geometric",
    "Flat",
    "Abstract",
    "Typography-focused",
    "Vintage",
    "Modern",
    "Playful",
    "Corporate",
    "Artistic"
  ];

  const handleInputChange = (field: keyof LogoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (file: File) => {
    if (file.type.startsWith('image/')) {
      setFormData(prev => ({ ...prev, previousLogo: file }));
      toast.success("Logo uploaded successfully!");
    } else {
      toast.error("Please upload an image file.");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.brandName || !formData.industry || !formData.stylePreference) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!user) {
      toast.error("Please log in to create logos");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check credit balance and deduct credits for logo generation based on selected model
      const creditCost = SubscriptionService.getCreditCostForLogo(formData.model);
      console.log(`Logo generation with ${formData.model} costs ${creditCost} credits`);

      if (creditCost > 0) {
        // Check if user has enough credits
        const creditCheck = await SubscriptionService.useCredits(user.id, 'logo', creditCost);
        if (!creditCheck.success) {
          let errorMsg = creditCheck.error || 'Failed to process credit deduction';
          if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
            errorMsg = 'Credit system error. Please try again later.';
          } else if (subscription && subscription.credit_balance < creditCost) {
            errorMsg = `Insufficient credits for logo generation. You need ${creditCost} credits but only have ${subscription.credit_balance}. Please upgrade your plan or purchase additional credits.`;
          }

          toast.error(
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{errorMsg}</span>
            </div>
          );
          setIsSubmitting(false);
          return;
        }

        toast.success(`✅ ${creditCost} credits deducted for logo generation`);
      }
      // Create project record first
      const projectTitle = `Logo: ${formData.brandName}`;
      const projectResult = await createProject({
        title: projectTitle,
        type: 'logo',
        status: 'processing',
        project_metadata: {
          brandName: formData.brandName,
          slogan: formData.slogan,
          industry: formData.industry,
          stylePreference: formData.stylePreference,
          colors: formData.colors,
          iconsSymbols: formData.iconsSymbols,
          userRequest: formData.userRequest,
          hasPreviousLogo: !!formData.previousLogo,
          submittedAt: new Date().toISOString()
        }
      });

      if (!projectResult.success) {
        throw new Error('Failed to create project record');
      }

      setCurrentProjectId(projectResult.data?.id || null);

      // Upload previous logo to Cloudinary if provided
      let previousLogoUrl = '';
      if (formData.previousLogo) {
        toast.info('Uploading logo to Cloudinary...');
        try {
          previousLogoUrl = await uploadToCloudinary(formData.previousLogo);
          console.log('Uploaded previous logo to Cloudinary:', previousLogoUrl);
        } catch (uploadErr) {
          console.error('Failed to upload previous logo:', uploadErr);
          toast.error('Failed to upload previous logo');
        }
      }

      // Prepare JSON payload with Cloudinary URL
      const payload = {
        brandName: formData.brandName,
        slogan: formData.slogan,
        industry: formData.industry,
        stylePreference: formData.stylePreference,
        colors: formData.colors,
        iconsSymbols: formData.iconsSymbols,
        userRequest: formData.userRequest,
        model: formData.model,
        userId: user.id,
        previousLogoUrl: previousLogoUrl || null,
        timestamp: new Date().toISOString()
      };

      console.log('Payload being sent to webhook:', payload);

      const response = await fetch('https://n8n.getostrichai.com/webhook/logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const responseData = await response.json();

        // Update project with comprehensive webhook data
        if (currentProjectId || projectResult.data?.id) {
          const originalMetadata = {
            brandName: formData.brandName,
            slogan: formData.slogan,
            industry: formData.industry,
            stylePreference: formData.stylePreference,
            colors: formData.colors,
            iconsSymbols: formData.iconsSymbols,
            userRequest: formData.userRequest,
            hasPreviousLogo: !!formData.previousLogo,
            submittedAt: new Date().toISOString()
          };

          await updateProjectWithWebhookData(
            currentProjectId || projectResult.data!.id,
            Array.isArray(responseData) ? responseData : [responseData],
            originalMetadata
          );
        }

        // Log activity
        await logActivity({
          action: 'Created logo',
          details: `Created logo for brand "${formData.brandName}" in ${formData.industry} industry with ${formData.stylePreference} style`,
          activity_metadata: {
            brandName: formData.brandName,
            industry: formData.industry,
            stylePreference: formData.stylePreference
          }
        });

        const message = isDemo
          ? "Logo creation request submitted successfully (demo mode)!"
          : "Logo creation request submitted successfully!";
        toast.success(message);

        // Store the form data and webhook response for the results page
        sessionStorage.setItem('logoFormData', JSON.stringify({
          brandName: formData.brandName,
          slogan: formData.slogan
        }));

        // Store the webhook response data
        sessionStorage.setItem('logoResults', JSON.stringify(responseData));

        // Navigate to results page
        navigate('/logo-results');

        // Reset form
        setFormData({
          brandName: "",
          slogan: "",
          industry: "",
          stylePreference: "",
          colors: "",
          iconsSymbols: "",
          previousLogo: null,
          userRequest: "",
          model: "google/nano-banana"
        });
        setCurrentProjectId(null);
      } else {
        // Update project status to failed
        if (currentProjectId || projectResult.data?.id) {
          await updateProject(currentProjectId || projectResult.data!.id, {
            status: 'failed'
          });
        }
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      // Update project status to failed if it exists
      if (currentProjectId) {
        try {
          await updateProject(currentProjectId, {
            status: 'failed'
          });
        } catch (updateError) {
          console.error('Failed to update project status:', updateError);
        }
      }

      // Log error activity
      if (user) {
        await logActivity({
          action: 'Logo creation failed',
          details: `Failed to create logo for brand "${formData.brandName}": ${error instanceof Error ? error.message : 'Unknown error'}`,
          activity_metadata: {
            brandName: formData.brandName,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }

      toast.error("Failed to submit logo creation request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
            <Palette className="h-4 w-4" />
            <span>AI Logo Generator</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Create Your Perfect
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary block">
              Brand Logo
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your brand vision into a stunning logo with our AI-powered design tools
          </p>
        </div>

        {/* Credit Balance Display */}
        {subscription && (
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Credit Balance</p>
                    <p className="text-lg font-bold text-blue-600">
                      {subscription.credit_balance || 0} credits
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-700">Logo generation costs</p>
                  <p className="text-sm font-semibold text-blue-800">
                    {SubscriptionService.getCreditCostForLogo(formData.model)} credits
                  </p>
                </div>
              </div>
              {(subscription.credit_balance || 0) < SubscriptionService.getCreditCostForLogo(formData.model) && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-800 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Insufficient credits for selected model. Please upgrade your plan or purchase additional credits.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card className="bg-card/80 backdrop-blur-xl border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Logo Creation Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Brand Name */}
              <div className="space-y-2">
                <Label htmlFor="brandName" className="text-sm font-medium">
                  Brand Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="brandName"
                  placeholder="e.g., NeoTech"
                  value={formData.brandName}
                  onChange={(e) => handleInputChange('brandName', e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>

              {/* Slogan */}
              <div className="space-y-2">
                <Label htmlFor="slogan" className="text-sm font-medium">
                  Slogan (Optional)
                </Label>
                <Input
                  id="slogan"
                  placeholder="e.g., Innovating Tomorrow"
                  value={formData.slogan}
                  onChange={(e) => handleInputChange('slogan', e.target.value)}
                  className="bg-input border-border"
                />
              </div>

              {/* Industry and Style Preference */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-medium">
                    Industry <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stylePreference" className="text-sm font-medium">
                    Style Preference <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.stylePreference} onValueChange={(value) => handleInputChange('stylePreference', value)}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select a style" />
                    </SelectTrigger>
                    <SelectContent>
                      {stylePreferences.map((style) => (
                        <SelectItem key={style} value={style}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* AI Model Selection */}
              <div className="space-y-2">
                <Label htmlFor="model" className="text-sm font-medium">
                  🤖 AI Model
                </Label>
                <Select value={formData.model} onValueChange={(value) => handleInputChange('model', value)}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nano-banana-pro">Titan - Premium Quality (6 credits)</SelectItem>
                    <SelectItem value="google/nano-banana-edit">Nexus - Medium Quality (2 credits)</SelectItem>
                    <SelectItem value="google/nano-banana">Base - Text Only (2 credits)</SelectItem>
                    <SelectItem value="z-image">Echo - Text Only (1 credit)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Select the AI model for logo generation</p>
              </div>

              {/* Colors and Icons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="colors" className="text-sm font-medium">
                    Colors (Optional)
                  </Label>
                  <Input
                    id="colors"
                    placeholder="e.g., Electric Blue, Charcoal Gray, White"
                    value={formData.colors}
                    onChange={(e) => handleInputChange('colors', e.target.value)}
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iconsSymbols" className="text-sm font-medium">
                    Icons / Symbols (Optional)
                  </Label>
                  <Input
                    id="iconsSymbols"
                    placeholder="e.g., Leaf, Globe, Circuit, Monogram"
                    value={formData.iconsSymbols}
                    onChange={(e) => handleInputChange('iconsSymbols', e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
              </div>

              {/* Previous Logo Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Previous Logo (Optional)
                </Label>
                {formData.model === 'google/nano-banana' || formData.model === 'z-image' ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/30">
                    <Upload className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground font-medium">
                      Image uploads are disabled for the "{formData.model === 'z-image' ? 'Echo' : 'Base'}" model.
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formData.model === 'z-image'
                        ? 'Echo model generates logos from text prompts only.'
                        : 'Select "Titan" or "Nexus" model to upload a reference logo.'
                      }
                    </p>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      {formData.previousLogo ? formData.previousLogo.name : 'Drag and drop your logo here, or click to browse'}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      className="hidden"
                      id="logoUpload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logoUpload')?.click()}
                      className="mt-2"
                    >
                      Choose File
                    </Button>
                  </div>
                )}
              </div>

              {/* User Request */}
              <div className="space-y-2">
                <Label htmlFor="userRequest" className="text-sm font-medium">
                  Additional Instructions (Optional)
                </Label>
                <Textarea
                  id="userRequest"
                  placeholder="e.g., Make it futuristic, Keep it eco-friendly but modern"
                  value={formData.userRequest}
                  onChange={(e) => handleInputChange('userRequest', e.target.value)}
                  className="bg-input border-border min-h-[100px]"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Logo...
                    </>
                  ) : (
                    <>
                      <Palette className="mr-2 h-5 w-5" />
                      Generate Logo
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LogoCreator;
