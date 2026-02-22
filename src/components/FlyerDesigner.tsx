import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Palette,
  Calendar,
  MapPin,
  Phone,
  Type,
  Upload,
  X,
  Loader2,
  CheckCircle,
  Image as ImageIcon,
  Send,
  Settings,
  AlertCircle,
  Clock,
  FileText,
  Download,
  ExternalLink,
  Copy,
  Mic,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { submitFlyerTask, FlyerFormData, FlyerWebhookResponseItem, Speaker } from '../services/flyerService';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionService } from '../services/subscriptionService';
import { useSubscription } from '../contexts/SubscriptionContext';
import { toast } from 'sonner';

export const FlyerDesigner: React.FC = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { createProject, updateProject, logActivity, isDemo } = useProjects();

  const apiKey = import.meta.env.VITE_KIE_API_KEY || '';

  const [formData, setFormData] = useState<FlyerFormData>({
    headline: '',
    subheadline: '',
    details: '',
    date: '',
    time: '',
    venue: '',
    contactInfo: '',
    cta: '',
    theme: 'Modern',
    additionalInfo: '',
    imageUrls: [],
    speakers: [{ id: Date.now().toString(), name: '', role: '' }],
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    aspectRatio: '9:16',
    model: 'google/nano-banana',
    resolution: '1K',
    outputFormat: 'png'
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Helper to convert File to data URL (CSP-compliant)
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<FlyerWebhookResponseItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxImages = 8;

  const isTextOnlyModel = formData.model === 'google/nano-banana' || formData.model === 'z-image';

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpeakerChange = (id: string, field: keyof Speaker, value: string) => {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const addSpeaker = () => {
    setFormData(prev => ({
      ...prev,
      speakers: [...prev.speakers, { id: Date.now().toString(), name: '', role: '' }]
    }));
  };

  const removeSpeaker = (id: string) => {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.filter(s => s.id !== id)
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalImages = images.length + newFiles.length;

      if (totalImages > maxImages) {
        toast.error(`You can only upload a maximum of ${maxImages} images.`);
        return;
      }

      setImages(prev => [...prev, ...newFiles]);

      // Convert files to data URLs for previews
      for (const file of newFiles) {
        try {
          const dataUrl = await fileToDataURL(file);
          setImagePreviews(prev => [...prev, dataUrl]);
        } catch (error) {
          console.error('Error converting file to data URL:', error);
        }
      }

      toast.success(`${newFiles.length} image(s) uploaded successfully`);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      const totalImages = images.length + newFiles.length;

      if (totalImages > maxImages) {
        toast.error(`You can only upload a maximum of ${maxImages} images.`);
        return;
      }

      setImages(prev => [...prev, ...newFiles]);

      // Convert files to data URLs for previews
      for (const file of newFiles) {
        try {
          const dataUrl = await fileToDataURL(file);
          setImagePreviews(prev => [...prev, dataUrl]);
        } catch (error) {
          console.error('Error converting file to data URL:', error);
        }
      }

      toast.success(`${newFiles.length} image(s) uploaded successfully`);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    toast.success('Image removed');
  };

  const handleReset = () => {
    setResult(null);
    setImages([]);
    setImagePreviews([]);
    setCurrentProjectId(null);
    setFormData(prev => ({
      headline: '',
      subheadline: '',
      details: '',
      date: '',
      time: '',
      venue: '',
      contactInfo: '',
      cta: '',
      theme: 'Modern',
      additionalInfo: '',
      imageUrls: [],
      speakers: [{ id: Date.now().toString(), name: '', role: '' }],
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      aspectRatio: prev.aspectRatio,
      model: prev.model,
      resolution: prev.resolution,
      outputFormat: prev.outputFormat
    }));
    toast.success('Ready for new flyer design');
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${fieldName} copied to clipboard!`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in to create flyers");
      return;
    }

    if (!formData.headline.trim()) {
      toast.error('Title/Headline is required');
      return;
    }

    if (!formData.details.trim()) {
      toast.error('Event/Offer details are required');
      return;
    }

    if (!formData.venue.trim()) {
      toast.error('Venue is required');
      return;
    }

    if (!formData.contactInfo.trim()) {
      toast.error('Contact information is required');
      return;
    }

    if (!formData.cta.trim()) {
      toast.error('Call to action is required');
      return;
    }

    if (!apiKey) {
      toast.error("Kie.ai API Key is missing. Please configure VITE_KIE_API_KEY in your environment.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      // Check credit balance before proceeding
      const creditsNeeded = SubscriptionService.getCreditCostForFeature(formData.model);
      if (creditsNeeded > 0) {
        const creditCheck = await SubscriptionService.useCredits(user.id, formData.model, creditsNeeded);
        if (!creditCheck.success) {
          let errorMsg = creditCheck.error || 'Failed to process credit deduction';
          if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
            errorMsg = 'Credit system error. Please try again later.';
          } else if (subscription && subscription.credit_balance < creditsNeeded) {
            errorMsg = `Insufficient credits for flyer generation. You need ${creditsNeeded} credits but only have ${subscription.credit_balance}. Please upgrade your plan or purchase additional credits.`;
          }
          setError(errorMsg);
          toast.error(errorMsg);
          setIsSubmitting(false);
          return;
        }

        toast.success(`✅ ${creditsNeeded} credits deducted for flyer generation`);
      }

      const projectTitle = `Flyer: ${formData.headline}`;
      const projectResult = await createProject({
        title: projectTitle,
        type: 'flyer',
        status: 'processing',
        project_metadata: {
          headline: formData.headline,
          subheadline: formData.subheadline,
          details: formData.details,
          date: formData.date,
          time: formData.time,
          venue: formData.venue,
          contactInfo: formData.contactInfo,
          cta: formData.cta,
          theme: formData.theme,
          model: formData.model,
          aspectRatio: formData.aspectRatio,
          hasImages: images.length > 0,
          imageCount: images.length,
          submittedAt: new Date().toISOString(),
          userId: user.id
        }
      });

      if (!projectResult.success) {
        throw new Error('Failed to create project record');
      }

      setCurrentProjectId(projectResult.data?.id || null);

      const uploadedUrls: string[] = [];

      if (!isTextOnlyModel && images.length > 0) {
        for (const file of images) {
          const url = await uploadToCloudinary(file);
          uploadedUrls.push(url);
        }
      }

      const payload: FlyerFormData = {
        ...formData,
        imageUrls: isTextOnlyModel ? [] : uploadedUrls,
      };

      const response = await submitFlyerTask(apiKey, payload);

      if (Array.isArray(response) && response.length > 0) {
        const flyerResult = response[0];
        setResult(flyerResult);

        if (currentProjectId || projectResult.data?.id) {
          await updateProject(currentProjectId || projectResult.data!.id, {
            status: flyerResult.success ? 'completed' : 'failed',
            file_url: flyerResult.extractedUrl || null
          });
        }

        await logActivity({
          action: 'Created flyer',
          details: `Created flyer "${formData.headline}" for event at ${formData.venue}${formData.date ? ` on ${formData.date}` : ''}${formData.time ? ` at ${formData.time}` : ''}`,
          activity_metadata: {
            type: 'flyer',
            headline: formData.headline,
            venue: formData.venue,
            date: formData.date
          }
        });

        const message = isDemo
          ? 'Flyer design completed (demo mode)!'
          : 'Flyer design completed!';
        toast.success(message);
      } else {
        throw new Error("Received empty response from server.");
      }

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "Failed to submit flyer design.";
      setError(errorMessage);
      toast.error(errorMessage);

      if (currentProjectId) {
        try {
          await updateProject(currentProjectId, { status: 'failed' });
        } catch (updateErr) {
          console.error('Failed to update project status:', updateErr);
        }
      }

      if (user) {
        await logActivity({
          action: 'Flyer creation failed',
          details: `Failed to create flyer "${formData.headline}": ${errorMessage}`,
          activity_metadata: {
            error: errorMessage,
            headline: formData.headline
          }
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success/Result View
  if (result) {
    const rawData = result.rawInput?.data;
    const createdDate = rawData?.createTime ? new Date(rawData.createTime).toLocaleString() : '-';

    return (
      <div className="space-y-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Flyer Generated Successfully!</h1>
            <p className="text-lg text-gray-600">Your design is ready for download</p>
          </div>

          {/* Result Card */}
          <Card className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Display */}
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-gray-100 border group">
                  {result.extractedUrl ? (
                    <img
                      src={result.extractedUrl}
                      alt="Generated Flyer"
                      className="w-full h-auto object-contain"
                    />
                  ) : (
                    <div className="aspect-[9/16] flex items-center justify-center text-gray-400">
                      <ImageIcon className="h-12 w-12 mr-2" />
                      <span>No Image URL Found</span>
                    </div>
                  )}
                  {result.extractedUrl && (
                    <a
                      href={result.extractedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg font-medium shadow-lg flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" /> Open Full Size
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* Details & Actions */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" /> Task Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-500">Status</Label>
                      <Badge variant="default" className="mt-1 bg-green-600">
                        {rawData?.state || 'Success'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-gray-500">Model</Label>
                      <p className="font-mono text-sm mt-1">{rawData?.model || formData.model}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Task ID</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs truncate max-w-[120px]" title={rawData?.taskId}>
                          {rawData?.taskId || '-'}
                        </span>
                        {rawData?.taskId && (
                          <Button variant="ghost" size="sm" onClick={() => handleCopy(rawData.taskId, 'Task ID')}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-500">Created At</Label>
                      <p className="text-xs mt-1">{createdDate}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Processing Time</Label>
                      <p className="mt-1">{rawData?.costTime ? `${rawData.costTime}s` : '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  {result.extractedUrl && (
                    <Button asChild className="w-full" size="lg">
                      <a href={result.extractedUrl} download={`flyer-${rawData?.taskId || Date.now()}.png`}>
                        <Download className="h-4 w-4 mr-2" /> Download Image
                      </a>
                    </Button>
                  )}

                  <Button onClick={handleReset} variant="outline" className="w-full" size="lg">
                    <Palette className="h-4 w-4 mr-2" /> Create Another Flyer
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Main Form View
  return (
    <div className="space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
            <Palette className="h-8 w-8 text-pink-600" />
          </div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Flyer Design</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">AI Flyer Designer</h1>
          <p className="text-lg text-gray-600">Create stunning professional flyers with AI assistance</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Basic Information */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Type className="h-6 w-6 text-pink-600" />
                <h2 className="text-xl font-semibold">Basic Information</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="headline">Title / Headline <span className="text-red-500">*</span></Label>
                  <Input
                    id="headline"
                    name="headline"
                    value={formData.headline}
                    onChange={handleInputChange}
                    maxLength={100}
                    placeholder="e.g., Grand Opening Sale!"
                  />
                  <div className="text-right text-xs text-gray-500">{formData.headline.length}/100</div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subheadline">Subheadline / Tagline</Label>
                  <Input
                    id="subheadline"
                    name="subheadline"
                    value={formData.subheadline}
                    onChange={handleInputChange}
                    maxLength={100}
                    placeholder="e.g., Best deals in town"
                  />
                  <div className="text-right text-xs text-gray-500">{formData.subheadline.length}/100</div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">Event / Offer Details <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="details"
                    name="details"
                    value={formData.details}
                    onChange={handleInputChange}
                    maxLength={500}
                    rows={4}
                    placeholder="Describe what the event or offer is about..."
                  />
                  <div className="text-right text-xs text-gray-500">{formData.details.length}/500</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Date, Time & Location */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Calendar className="h-6 w-6 text-pink-600" />
                <h2 className="text-xl font-semibold">Date, Time & Location</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    min={minDate}
                    value={formData.date}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue / Platform <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="venue"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    placeholder="Location or platform name"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Speakers */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Mic className="h-6 w-6 text-pink-600" />
                <h2 className="text-xl font-semibold">Speakers / Guests</h2>
                <Badge variant="secondary">Optional</Badge>
              </div>

              <div className="space-y-4">
                {formData.speakers.map((speaker) => (
                  <div key={speaker.id} className="flex gap-4 items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Speaker Name"
                        value={speaker.name}
                        onChange={(e) => handleSpeakerChange(speaker.id, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Role / Topic (Optional)"
                        value={speaker.role}
                        onChange={(e) => handleSpeakerChange(speaker.id, 'role', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSpeaker(speaker.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addSpeaker} className="text-pink-600">
                  <Plus className="h-4 w-4 mr-2" /> Add Another Speaker
                </Button>
              </div>
            </div>
          </Card>

          {/* Contact & CTA */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Phone className="h-6 w-6 text-pink-600" />
                <h2 className="text-xl font-semibold">Contact & Call to Action</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactInfo">Contact Information <span className="text-red-500">*</span></Label>
                  <Input
                    id="contactInfo"
                    name="contactInfo"
                    value={formData.contactInfo}
                    onChange={handleInputChange}
                    placeholder="Email, phone, or website"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta">Call to Action (CTA) <span className="text-red-500">*</span></Label>
                  <Input
                    id="cta"
                    name="cta"
                    value={formData.cta}
                    onChange={handleInputChange}
                    placeholder="e.g., Register Now"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Design Preferences */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Palette className="h-6 w-6 text-pink-600" />
                <h2 className="text-xl font-semibold">Design Preferences</h2>
              </div>

              <div className="space-y-2">
                <Label>Style / Theme</Label>
                <Select value={formData.theme} onValueChange={(value) => handleSelectChange('theme', value)}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Modern">Modern & Clean</SelectItem>
                    <SelectItem value="Bold">Bold & Vibrant</SelectItem>
                    <SelectItem value="Minimalist">Minimalist</SelectItem>
                    <SelectItem value="Corporate">Corporate / Professional</SelectItem>
                    <SelectItem value="Elegant">Elegant / Luxury</SelectItem>
                    <SelectItem value="Playful">Playful / Fun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Color Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer shadow-sm"
                      style={{ backgroundColor: formData.primaryColor }}
                      onClick={() => document.getElementById('primaryColorPicker')?.click()}
                    />
                    <Input
                      id="primaryColorPicker"
                      name="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={handleInputChange}
                      className="w-0 h-0 opacity-0 absolute"
                    />
                    <Input
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleInputChange}
                      placeholder="#3B82F6"
                      className="flex-1 font-mono uppercase"
                      maxLength={7}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Main brand color for headings and accents</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer shadow-sm"
                      style={{ backgroundColor: formData.secondaryColor }}
                      onClick={() => document.getElementById('secondaryColorPicker')?.click()}
                    />
                    <Input
                      id="secondaryColorPicker"
                      name="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={handleInputChange}
                      className="w-0 h-0 opacity-0 absolute"
                    />
                    <Input
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleInputChange}
                      placeholder="#10B981"
                      className="flex-1 font-mono uppercase"
                      maxLength={7}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Supporting color for backgrounds and highlights</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Additional Instructions */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-pink-600" />
                <h2 className="text-xl font-semibold">Additional Instructions</h2>
                <Badge variant="secondary">Optional</Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Custom Prompt / Special Requirements</Label>
                <p className="text-sm text-gray-500">Provide any additional design guidance</p>
                <Textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Any specific design requirements, layout preferences, or additional instructions..."
                />
              </div>
            </div>
          </Card>

          {/* Output Configuration */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-pink-600" />
                <h2 className="text-xl font-semibold">Output Configuration</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select value={formData.aspectRatio} onValueChange={(value) => handleSelectChange('aspectRatio', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="9:16">9:16 (Story)</SelectItem>
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="4:5">4:5</SelectItem>
                      <SelectItem value="3:4">3:4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select value={formData.model} onValueChange={(value) => handleSelectChange('model', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nano-banana-pro">Titan - Premium</SelectItem>
                      <SelectItem value="google/nano-banana-edit">Nexus - Medium</SelectItem>
                      <SelectItem value="google/nano-banana">Base - Text Only</SelectItem>
                      <SelectItem value="z-image">Echo - Text Only (Budget)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select value={formData.resolution} onValueChange={(value) => handleSelectChange('resolution', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1K">1K</SelectItem>
                      <SelectItem value="2K">2K</SelectItem>
                      <SelectItem value="4K">4K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Select value={formData.outputFormat} onValueChange={(value) => handleSelectChange('outputFormat', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* Images Upload */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <ImageIcon className="h-6 w-6 text-pink-600" />
                <h2 className="text-xl font-semibold">Logos & Images</h2>
                <Badge variant="secondary">Optional</Badge>
              </div>

              {isTextOnlyModel ? (
                <div className="bg-gray-50 border rounded-xl p-6 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500 font-medium">
                    Image uploads are disabled for the "{formData.model === 'z-image' ? 'Echo' : 'Base'}" model.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.model === 'z-image'
                      ? 'Echo model generates images from text prompts only.'
                      : 'Please select "Titan" or "Nexus" to upload reference images.'
                    }
                  </p>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragOver ? 'border-pink-400 bg-pink-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {isDragOver ? 'Drop images here' : 'Drag & drop images here'}
                      </p>
                      <p className="text-gray-500">or click to browse files (Max {maxImages} images)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Uploaded Images ({images.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={imagePreviews[index] || ''}
                            alt={`Preview ${index}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Credit Cost Display */}
          <Card className="p-8">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">💰</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Credit Cost</h4>
                    <p className="text-sm text-gray-600">Cost for flyer generation</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600">
                    {(() => {
                      if (formData.model === 'nano-banana-pro') {
                        return formData.resolution === '4K' ? '8 credits' : '6 credits';
                      } else if (formData.model === 'z-image') {
                        return '1 credit';
                      } else {
                        return '2 credits';
                      }
                    })()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formData.model === 'nano-banana-pro'
                      ? `Titan • ${formData.resolution} resolution`
                      : formData.model === 'google/nano-banana-edit'
                        ? 'Nexus • Medium quality'
                        : formData.model === 'z-image'
                          ? 'Echo • Budget option'
                          : 'Base • Fast generation'
                    }
                  </div>
                </div>
              </div>

              {subscription && (
                <div className="mt-3 text-center">
                  <span className="text-sm text-gray-600">
                    Your balance: <span className="font-semibold text-green-600">{subscription.credit_balance} credits</span>
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Submit Button */}
          <Card className="p-8">
            <div className="text-center space-y-4">
              {error && (
                <div className="flex items-center justify-center gap-2 text-red-600 text-sm mb-4">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="w-full max-w-md font-semibold py-4 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Flyer... (This may take a minute)
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Generate Flyer Design
                  </>
                )}
              </Button>

              {(!formData.headline.trim() || !formData.details.trim() || !formData.venue.trim() || !formData.contactInfo.trim() || !formData.cta.trim()) && (
                <div className="flex items-center justify-center text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Please fill in all required fields
                </div>
              )}
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default FlyerDesigner;
