import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  Send,
  AlertCircle,
  CheckCircle,
  FileImage,
  Hash,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useProjects } from "../hooks/useProjects";

interface ImageFile {
  file: File;
  preview: string;
  id: string;
  slot: 1 | 2; // Which upload slot this image belongs to
}

interface DebugInfo {
  inputCount: number;
  method1_structure: string;
  isDirect: boolean;
  extractionMethod: string;
}

interface RawInputData {
  taskId: string;
  model: string;
  state: string;
  param: string;
  resultJson: string;
  failCode: string | null;
  failMsg: string | null;
  costTime: number;
  completeTime: number;
  createTime: number;
}

interface RawInput {
  code: number;
  msg: string;
  data: RawInputData;
}

interface EditingResult {
  extractedUrl?: string;
  success: boolean;
  debugInfo?: DebugInfo;
  rawInput?: RawInput;
  error?: string;
}

const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB
const MAX_DESCRIPTION_LENGTH = 1000;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export const TwoImageEditor = () => {
  const { user } = useAuth();
  const { createProject, updateProject, logActivity, logProductCreation, logProductCompletion, logProductError, isDemo } = useProjects();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<EditingResult | null>(null);
  const [isDragOver, setIsDragOver] = useState<{ slot1: boolean, slot2: boolean }>({ slot1: false, slot2: false });
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

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload only JPEG, PNG, or GIF images.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB.`;
    }
    return null;
  };

  const handleFileSelect = useCallback(async (files: FileList | null, slot: 1 | 2) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // Only take the first file for each slot
    const error = validateFile(file);

    if (error) {
      toast.error(error);
      return;
    }

    // Remove existing image from this slot
    setImages(prev => prev.filter(img => img.slot !== slot));

    // Convert to data URL for preview
    try {
      const preview = await fileToDataURL(file);

      // Add new image to the slot
      const imageFile: ImageFile = {
        file,
        preview,
        id: `${slot}-${Date.now()}`,
        slot
      };

      setImages(prev => [...prev, imageFile]);
      toast.success(`Image ${slot} uploaded successfully!`);
    } catch (err) {
      console.error('Error converting file to data URL:', err);
      toast.error('Failed to load image preview');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, slot: 1 | 2) => {
    e.preventDefault();
    setIsDragOver(prev => ({ ...prev, [`slot${slot}`]: false }));
    handleFileSelect(e.dataTransfer.files, slot);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent, slot: 1 | 2) => {
    e.preventDefault();
    setIsDragOver(prev => ({ ...prev, [`slot${slot}`]: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, slot: 1 | 2) => {
    e.preventDefault();
    setIsDragOver(prev => ({ ...prev, [`slot${slot}`]: false }));
  }, []);

  const removeImage = (slot: 1 | 2) => {
    const imageToRemove = images.find(img => img.slot === slot);
    if (imageToRemove) {
      setImages(prev => prev.filter(img => img.slot !== slot));
      toast.success(`Image ${slot} removed`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (images.length !== 2) {
      toast.error('Please upload exactly 2 images.');
      return;
    }

    if (!description.trim()) {
      toast.error('Please provide a description/prompt.');
      return;
    }

    if (!user) {
      toast.error("Please log in to edit images");
      return;
    }

    setIsLoading(true);

    try {
      // Create project record first
      const projectTitle = `Image Edit: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`;
      const projectResult = await createProject({
        title: projectTitle,
        type: 'ad',
        status: 'processing',
        project_metadata: {
          description: description.trim(),
          imageCount: images.length,
          submittedAt: new Date().toISOString(),
          editType: 'two_image_edit'
        }
      });

      if (!projectResult.success) {
        throw new Error('Failed to create project record');
      }

      setCurrentProjectId(projectResult.data?.id || null);

      // Log activity for starting image editing
      await logProductCreation('image_edit', projectTitle, {
        description: description.trim(),
        imageCount: images.length,
        editType: 'two_image_edit'
      });
      const formData = new FormData();

      // Add images in order (slot 1, then slot 2)
      const image1 = images.find(img => img.slot === 1);
      const image2 = images.find(img => img.slot === 2);

      if (image1) formData.append('image1', image1.file);
      if (image2) formData.append('image2', image2.file);
      formData.append('prompt', description.trim());

      const response = await fetch('https://n8n.getostrichai.com/webhook/editing-two-images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Transform result to match expected format
      const finalResults = Array.isArray(result) ? result : [result];

      // Update project status to completed and store final results
      if (currentProjectId || projectResult.data?.id) {
        await updateProject(currentProjectId || projectResult.data!.id, {
          status: 'completed',
          project_metadata: {
            description: description.trim(),
            imageCount: images.length,
            submittedAt: new Date().toISOString(),
            editType: 'two_image_edit',
            results: finalResults
          }
        });
      }

      // Log successful completion
      await logProductCompletion('image_edit', projectTitle, currentProjectId || projectResult.data?.id);

      // Handle array response format
      const resultData = Array.isArray(result) ? result[0] : result;

      const editingResult: EditingResult = {
        extractedUrl: resultData.extractedUrl,
        success: resultData.success || false,
        debugInfo: resultData.debugInfo,
        rawInput: resultData.rawInput,
      };

      setSubmissionResult(editingResult);
      setIsSubmitted(true);
      toast.success('Images submitted for editing!');

    } catch (error) {
      let errorMessage = 'Failed to submit images for editing';

      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not registered')) {
          errorMessage = 'Webhook endpoint not available. Please ensure the n8n workflow is active and the webhook is registered.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_FAILED')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else if (error.message.includes('413')) {
          errorMessage = 'File size too large. Please reduce image sizes and try again.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid request format. Please check your inputs and try again.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error occurred. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }

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
        await logProductError('image_edit', errorMessage, currentProjectId, {
          description: description.trim(),
          imageCount: images.length,
          editType: 'two_image_edit'
        });
      }

      const errorResult: EditingResult = {
        success: false,
        error: errorMessage
      };

      setSubmissionResult(errorResult);
      setIsSubmitted(true);
      toast.error(errorMessage);
      console.error('Submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewEdit = () => {
    setImages([]);
    setDescription('');
    setIsSubmitted(false);
    setSubmissionResult(null);
    toast.success('Ready for new editing task');
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${fieldName} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getImageForSlot = (slot: 1 | 2) => images.find(img => img.slot === slot);

  if (isSubmitted && submissionResult) {
    return (
      <div className="space-y-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${submissionResult.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
              {submissionResult.success ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-600" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              {submissionResult.success ? 'Images Submitted Successfully!' : 'Submission Failed'}
            </h1>
            <p className="text-lg text-gray-600">
              {submissionResult.success
                ? 'Your images have been successfully processed and combined!'
                : submissionResult.error || 'There was an error processing your request'
              }
            </p>
          </div>

          {/* Result Display */}
          {submissionResult.success && (
            <div className="space-y-6">
              {/* Extracted Result Image */}
              {submissionResult.extractedUrl && (
                <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-green-800">Edited Result</h3>
                    </div>
                    <div className="bg-white rounded-lg overflow-hidden shadow-sm border">
                      <img
                        src={submissionResult.extractedUrl}
                        alt="Edited result"
                        className="w-full h-auto"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => window.open(submissionResult.extractedUrl, '_blank')}
                        variant="outline"
                        className="flex-1"
                      >
                        <FileImage className="h-4 w-4 mr-2" />
                        View Full Size
                      </Button>
                      <Button
                        onClick={() => handleCopy(submissionResult.extractedUrl!, 'Image URL')}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Task Information */}
              {submissionResult.rawInput?.data && (
                <Card className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                      <Hash className="h-5 w-5 text-blue-600" />
                      <span>Task Information</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Task ID:</Label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={submissionResult.rawInput.data.taskId}
                            readOnly
                            className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md font-mono"
                          />
                          <Button
                            onClick={() => handleCopy(submissionResult.rawInput!.data.taskId, 'Task ID')}
                            variant="outline"
                            size="sm"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Model:</Label>
                        <input
                          type="text"
                          value={submissionResult.rawInput.data.model}
                          readOnly
                          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">State:</Label>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={submissionResult.rawInput.data.state === 'success' ? 'default' : 'secondary'}
                            className={submissionResult.rawInput.data.state === 'success' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {submissionResult.rawInput.data.state}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Processing Time:</Label>
                        <input
                          type="text"
                          value={`${submissionResult.rawInput.data.costTime}s`}
                          readOnly
                          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Debug Information */}
              {submissionResult.debugInfo && (
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-800 flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5" />
                      <span>Debug Information</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-blue-600">Input Count:</Label>
                        <div className="px-2 py-1 bg-white rounded border text-blue-800">
                          {submissionResult.debugInfo.inputCount}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-blue-600">Structure:</Label>
                        <div className="px-2 py-1 bg-white rounded border text-blue-800">
                          {submissionResult.debugInfo.method1_structure}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-blue-600">Is Direct:</Label>
                        <div className="px-2 py-1 bg-white rounded border text-blue-800">
                          {submissionResult.debugInfo.isDirect ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-blue-600">Method:</Label>
                        <div className="px-2 py-1 bg-white rounded border text-blue-800">
                          {submissionResult.debugInfo.extractionMethod}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          <Card className="p-6">
            <Button
              onClick={handleNewEdit}
              size="lg"
              className="w-full font-semibold py-4"
            >
              Start New Editing Task
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <ImageIcon className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Two Image Editor</h1>
          <p className="text-lg text-gray-600">Upload two images and provide editing instructions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dual Image Upload Section */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <FileImage className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-semibold">Upload Two Images</h2>
                <Badge variant="outline">Required</Badge>
              </div>

              <p className="text-gray-600">
                Upload exactly 2 images (JPEG, PNG, GIF). Maximum file size: 7MB per image.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Slot 1 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Image 1</Label>
                  <div
                    onDrop={(e) => handleDrop(e, 1)}
                    onDragOver={(e) => handleDragOver(e, 1)}
                    onDragLeave={(e) => handleDragLeave(e, 1)}
                    className={`
                      relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 aspect-square
                      ${isDragOver.slot1
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={(e) => handleFileSelect(e.target.files, 1)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {getImageForSlot(1) ? (
                      <div className="relative h-full">
                        <img
                          src={getImageForSlot(1)!.preview}
                          alt="Image 1 preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(1)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
                          <div className="truncate">{getImageForSlot(1)!.file.name}</div>
                          <div>{formatFileSize(getImageForSlot(1)!.file.size)}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full space-y-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                          <Upload className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {isDragOver.slot1 ? 'Drop image here' : 'Upload Image 1'}
                          </p>
                          <p className="text-sm text-gray-500">or click to browse</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Slot 2 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Image 2</Label>
                  <div
                    onDrop={(e) => handleDrop(e, 2)}
                    onDragOver={(e) => handleDragOver(e, 2)}
                    onDragLeave={(e) => handleDragLeave(e, 2)}
                    className={`
                      relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 aspect-square
                      ${isDragOver.slot2
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={(e) => handleFileSelect(e.target.files, 2)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {getImageForSlot(2) ? (
                      <div className="relative h-full">
                        <img
                          src={getImageForSlot(2)!.preview}
                          alt="Image 2 preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(2)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
                          <div className="truncate">{getImageForSlot(2)!.file.name}</div>
                          <div>{formatFileSize(getImageForSlot(2)!.file.size)}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full space-y-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                          <Upload className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {isDragOver.slot2 ? 'Drop image here' : 'Upload Image 2'}
                          </p>
                          <p className="text-sm text-gray-500">or click to browse</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
                <span>JPEG</span>
                <span>•</span>
                <span>PNG</span>
                <span>•</span>
                <span>GIF</span>
                <span>•</span>
                <span>Max 7MB each</span>
              </div>
            </div>
          </Card>

          {/* Description Section */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Hash className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-semibold">Editing Instructions</h2>
                <Badge variant="outline">Required</Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">
                  Describe what you want to do with these images
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter detailed instructions for editing these two images. For example: 'Combine these images side by side', 'Replace the background of image 1 with image 2', 'Create a collage', etc..."
                  className="min-h-32 text-base"
                  maxLength={MAX_DESCRIPTION_LENGTH}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Provide clear, detailed instructions for best results</span>
                  <span>{description.length}/{MAX_DESCRIPTION_LENGTH}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <Card className="p-8">
            <div className="text-center space-y-4">
              <Button
                type="submit"
                disabled={isLoading || images.length !== 2 || !description.trim()}
                size="lg"
                className="w-full max-w-md font-semibold py-4 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing Images...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Submit for Editing
                  </>
                )}
              </Button>

              {(images.length !== 2 || !description.trim()) && (
                <div className="flex items-center justify-center text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {images.length !== 2
                    ? `Please upload exactly 2 images (${images.length}/2 uploaded)`
                    : 'Please provide editing instructions'
                  }
                </div>
              )}
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};
