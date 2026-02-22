import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle, XCircle, Clock, Image as ImageIcon, Copy, Video, ExternalLink, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BatchResult {
  code?: number;
  msg?: string;
  data?: {
    taskId: string;
    model: string;
    state: string;
    param?: string;
    resultJson?: string;
    failCode?: string;
    failMsg?: string;
    costTime: number;
    completeTime: number;
    createTime: number;
  };
  id?: number;
  scene_number?: number;
  title?: string;
  image_prompt?: string;
  video_prompt?: string;
  voice_over?: string;
  image_url?: string;
  video_status?: string;
  nano_image_url?: string;
  task_id?: string;
  taskId?: string;
  imageUrl?: string;
  state?: string;
  model?: string;
  costTime?: number;
  completeTime?: number;
  createTime?: number;
  success?: boolean;
}

interface VideoResult {
  task_id: string;
  status: string;
  message: string;
  created_at: string;
  result_url?: string;
  original_video_url?: string;
}

interface BatchResultDisplayProps {
  results: BatchResult[];
}

const BatchResultDisplay: React.FC<BatchResultDisplayProps> = ({ results }) => {
  const { toast } = useToast();
  const [videoResults, setVideoResults] = useState<Record<string, VideoResult>>({});
  const [checkingVideos, setCheckingVideos] = useState<Record<string, boolean>>({});
  const [videoGenerationTasks, setVideoGenerationTasks] = useState<Record<string, string>>({});

  // Calculate statistics
  const successCount = results.filter(result => 
    result.success === true || 
    result.state === 'success' || 
    (result.data && result.data.state === 'success')
  ).length;
  
  const failedCount = results.filter(result => 
    result.success === false || 
    result.state === 'fail' || 
    (result.data && result.data.state === 'fail')
  ).length;
  
  const pendingCount = results.length - successCount - failedCount;

  // Get successful results with images
  const successfulResults = results.filter(result => {
    const isSuccess = result.success === true || 
                     result.state === 'success' || 
                     (result.data && result.data.state === 'success') ||
                     result.image_url; // New API format
    const hasImage = result.imageUrl || result.image_url || (result.data && result.data.resultJson);
    return isSuccess && hasImage;
  });

  // Get failed results
  const failedResults = results.filter(result => 
    result.success === false || 
    result.state === 'fail' || 
    (result.data && result.data.state === 'fail')
  );

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status) return <Clock className="h-5 w-5 text-yellow-500" />;
    const statusLower = status.toLowerCase();
    if (statusLower.includes('success') || statusLower.includes('complete')) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (statusLower.includes('error') || statusLower.includes('fail')) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('success') || statusLower.includes('complete')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (statusLower.includes('error') || statusLower.includes('fail')) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${fieldName} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy text to clipboard.",
        variant: "destructive",
      });
    }
  };

  const checkVideoResult = async (taskId: string) => {
    setCheckingVideos(prev => ({ ...prev, [taskId]: true }));

    try {
      const response = await fetch(
        `https://n8n.getostrichai.com/webhook/get-veo-results?task_id=${encodeURIComponent(taskId)}`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Video not found. It may still be processing.");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        } else {
          throw new Error(`Request failed with status ${response.status}`);
        }
      }

      let data;
      try {
        const responseText = await response.text();
        if (!responseText.trim()) {
          throw new Error("Empty response from server. Video may still be processing.");
        }
        data = JSON.parse(responseText);
      } catch (jsonError) {
        if (jsonError instanceof SyntaxError) {
          throw new Error("Invalid response format from server. Please try again later.");
        }
        throw jsonError;
      }
      
      // Extract first item from array and clean URLs
      const rawResult = Array.isArray(data) ? data[0] : data;
      
      if (!rawResult) {
        throw new Error("No video data found. Video may still be processing.");
      }
      const videoResult: VideoResult = {
        task_id: rawResult.task_id || taskId,
        status: rawResult.status || 'completed',
        message: rawResult.msg || rawResult.message || 'Video completed',
        created_at: rawResult.created_at || new Date().toISOString(),
        result_url: rawResult.result_url?.replace(/[`\s]/g, ''),
        original_video_url: rawResult.origin_url?.replace(/[`\s]/g, '')
      };
      
      setVideoResults(prev => ({ ...prev, [taskId]: videoResult }));
      
      if (videoResult.result_url) {
        toast({
          title: "Video Ready!",
          description: `Status: ${videoResult.message}`,
        });
      } else {
        toast({
          title: "Video Status",
          description: `Status: ${videoResult.message}`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to check video result";
      toast({
        title: "Check Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCheckingVideos(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const handleVideoDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Download Started",
        description: `Downloading ${filename}...`,
      });
    } catch (err) {
      toast({
        title: "Download Failed",
        description: "Failed to download the video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateVideo = async (imageUrl: string, title: string, videoPrompt: string, voiceOver: string, taskId: string) => {
    try {
      const payload = {
        image_url: imageUrl,
        title: title,
        video_prompt: videoPrompt,
        voice_over: voiceOver,
        task_id: taskId
      };

      const response = await fetch('https://n8n.getostrichai.com/webhook/video-ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Extract task ID from response
      const videoTaskId = result.task_id || result.taskId || result.data?.task_id || result.data?.taskId;
      
      if (videoTaskId) {
        // Store the video generation task ID
        setVideoGenerationTasks(prev => ({ ...prev, [taskId]: videoTaskId }));
        
        toast({
          title: "Video Generation Started!",
          description: `Task ID: ${videoTaskId}. Click "Check Video Status" to view progress.`,
        });
      } else {
        toast({
          title: "Video Generation Started",
          description: "Your video is being generated. You'll be notified when it's ready.",
        });
      }
    } catch (error) {
      console.error('Video generation error:', error);
      toast({
        title: "Video Generation Failed",
        description: `Failed to start video generation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleDownload = (imageUrl: string, taskId: string) => {
    try {
      // Check if imageUrl is valid
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('Invalid image URL');
      }

      // Simple approach: directly navigate to the image URL
      window.location.href = imageUrl;
      
      toast({
        title: "Download Started",
        description: "Image download initiated.",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: `Failed to download the image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (costTime: number) => {
    return `${(costTime / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Successful</p>
                <p className="text-3xl font-bold text-green-700">{successCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Failed</p>
                <p className="text-3xl font-bold text-red-700">{failedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total</p>
                <p className="text-3xl font-bold text-blue-700">{results.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Successful Results Gallery */}
      {successfulResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Generated Images ({successfulResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {successfulResults.map((result, index) => {
                const taskId = result.task_id || result.taskId || result.data?.taskId || `task-${index}`;
                const imageUrl = result.image_url || result.imageUrl || result.data?.resultJson;
                const sceneNumber = result.scene_number;
                const title = result.title;
                const imagePrompt = result.image_prompt;
                const videoPrompt = result.video_prompt;
                const voiceOver = result.voice_over;
                const videoStatus = result.video_status;

                return (
                  <div key={taskId} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <div className="aspect-square relative bg-gray-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={title || `Generated image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        {sceneNumber && (
                          <Badge variant="secondary" className="text-xs">
                            Scene {sceneNumber}
                          </Badge>
                        )}
                        {videoStatus && (
                          <Badge variant="outline" className="text-xs">
                            {videoStatus}
                          </Badge>
                        )}
                      </div>
                      
                      {title && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
                            <Button
                              onClick={() => handleCopy(title, 'Title')}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {imagePrompt && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-600">Image Prompt</label>
                            <Button
                              onClick={() => handleCopy(imagePrompt, 'Image Prompt')}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-3">{imagePrompt}</p>
                        </div>
                      )}
                      
                      {videoPrompt && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-600">Video Prompt</label>
                            <Button
                              onClick={() => handleCopy(videoPrompt, 'Video Prompt')}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-3">{videoPrompt}</p>
                        </div>
                      )}
                      
                      {voiceOver && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-600">Voice Over</label>
                            <Button
                              onClick={() => handleCopy(voiceOver, 'Voice Over')}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">{voiceOver}</p>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        <p>Task ID: {taskId.substring(0, 8)}...</p>
                      </div>
                      
                      <div className="space-y-2">
                        {imageUrl && (
                          <Button
                            onClick={() => handleDownload(imageUrl, taskId)}
                            className="w-full"
                            size="sm"
                            variant="outline"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Image
                          </Button>
                        )}
                        
                        {imageUrl && title && videoPrompt && voiceOver && (
                           <Button
                             onClick={() => handleGenerateVideo(imageUrl, title, videoPrompt, voiceOver, taskId)}
                             className="w-full"
                             size="sm"
                           >
                             <Video className="h-4 w-4 mr-2" />
                             Generate Video
                           </Button>
                         )}
                         
                         <Button
                           onClick={() => {
                             const videoTaskId = videoGenerationTasks[taskId];
                             if (videoTaskId) {
                               checkVideoResult(videoTaskId);
                             } else {
                               toast({
                                 title: "No Video Task Found",
                                 description: "Please generate a video first before checking status.",
                                 variant: "destructive",
                               });
                             }
                           }}
                           variant="outline"
                           size="sm"
                           disabled={checkingVideos[videoGenerationTasks[taskId]] || !videoGenerationTasks[taskId]}
                           className="w-full"
                         >
                           {checkingVideos[videoGenerationTasks[taskId]] ? (
                             <>
                               <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                               Checking...
                             </>
                           ) : (
                             <>
                               <Search className="h-4 w-4 mr-2" />
                               Check Video Status
                             </>
                           )}
                         </Button>
                       </div>
                       
                       {/* Video Generation Task ID Display */}
                       {videoGenerationTasks[taskId] && (
                         <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                           <div className="space-y-3">
                             <div className="flex items-center space-x-2">
                               <Video className="h-5 w-5 text-green-600" />
                               <h4 className="text-sm font-semibold text-green-800">Video Generation Started!</h4>
                             </div>
                             
                             <p className="text-sm text-green-700">
                               Your video is being generated. Use the task ID below to check the status.
                             </p>
                             
                             <div className="space-y-2">
                               <label className="text-xs font-medium text-green-700">Video Task ID:</label>
                               <div className="flex items-center space-x-2">
                                 <input
                                   type="text"
                                   value={videoGenerationTasks[taskId]}
                                   readOnly
                                   className="flex-1 px-3 py-2 text-sm bg-white border border-green-300 rounded-md font-mono"
                                 />
                                 <Button
                                   onClick={() => handleCopy(videoGenerationTasks[taskId], 'Video Task ID')}
                                   variant="outline"
                                   size="sm"
                                   className="px-3 border-green-300 hover:bg-green-50"
                                 >
                                   <Copy className="h-4 w-4" />
                                 </Button>
                               </div>
                             </div>
                             
                             <p className="text-xs text-green-600">
                               💡 Click "Check Video Status" above to view the generation progress.
                             </p>
                           </div>
                         </div>
                       )}
                       
                       {/* Video Result Display */}
                       {videoGenerationTasks[taskId] && videoResults[videoGenerationTasks[taskId]] && (
                         <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                           <div className="space-y-4">
                             {/* Task Information */}
                             <div className="flex items-center justify-between">
                               <h4 className="text-lg font-semibold">Video Status</h4>
                               <Badge className={`${getStatusColor(videoResults[videoGenerationTasks[taskId]].status)} border`}>
                                 {getStatusIcon(videoResults[videoGenerationTasks[taskId]].status)}
                                 <span className="ml-2">{videoResults[videoGenerationTasks[taskId]].status}</span>
                               </Badge>
                             </div>
                           
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                               <div>
                                 <span className="font-medium text-gray-600">Task ID:</span>
                                 <p className="font-mono text-gray-900 break-all">{videoResults[videoGenerationTasks[taskId]].task_id}</p>
                               </div>
                               <div>
                                 <span className="font-medium text-gray-600">Created:</span>
                                 <p className="text-gray-900">{formatDate(videoResults[videoGenerationTasks[taskId]].created_at)}</p>
                               </div>
                             </div>
                           
                             {videoResults[videoGenerationTasks[taskId]].message && (
                               <div>
                                 <span className="font-medium text-gray-600">Message:</span>
                                 <p className="text-gray-900 mt-1">{videoResults[videoGenerationTasks[taskId]].message}</p>
                               </div>
                             )}
                           
                             {/* Generated Video */}
                             {videoResults[videoGenerationTasks[taskId]].result_url && (
                               <div className="space-y-4">
                                 <h5 className="text-md font-semibold flex items-center">
                                   <Video className="mr-2 h-4 w-4" />
                                   Generated Video
                                 </h5>
                                 
                                 <div className="bg-black rounded-lg overflow-hidden">
                                   <video 
                                     controls 
                                     className="w-full h-auto"
                                     src={videoResults[videoGenerationTasks[taskId]].result_url}
                                     poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23000'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%23fff' font-size='16'%3ELoading video...%3C/text%3E%3C/svg%3E"
                                   >
                                     Your browser does not support the video tag.
                                   </video>
                                 </div>
                                 
                                 <div className="flex flex-col sm:flex-row gap-3">
                                   <Button 
                                     onClick={() => handleVideoDownload(videoResults[videoGenerationTasks[taskId]].result_url!, `generated-video-${taskId}.mp4`)}
                                     className="flex-1"
                                     variant="default"
                                     size="sm"
                                   >
                                     <Download className="mr-2 h-4 w-4" />
                                     Download Video
                                   </Button>
                                   
                                   <Button 
                                     onClick={() => window.open(videoResults[videoGenerationTasks[taskId]].result_url, '_blank')}
                                     className="flex-1"
                                     variant="outline"
                                     size="sm"
                                   >
                                     <ExternalLink className="mr-2 h-4 w-4" />
                                     View in New Tab
                                   </Button>
                                 </div>
                               </div>
                             )}
                           
                             {/* Original Video */}
                             {videoResults[videoGenerationTasks[taskId]].original_video_url && (
                               <div className="space-y-4">
                                 <h5 className="text-md font-semibold flex items-center">
                                   <Video className="mr-2 h-4 w-4" />
                                   Original Video
                                 </h5>
                                 
                                 <div className="bg-black rounded-lg overflow-hidden">
                                   <video 
                                     controls 
                                     className="w-full h-auto"
                                     src={videoResults[videoGenerationTasks[taskId]].original_video_url}
                                     poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23000'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%23fff' font-size='16'%3ELoading video...%3C/text%3E%3C/svg%3E"
                                   >
                                     Your browser does not support the video tag.
                                   </video>
                                 </div>
                                 
                                 <div className="flex flex-col sm:flex-row gap-3">
                                   <Button 
                                     onClick={() => handleVideoDownload(videoResults[videoGenerationTasks[taskId]].original_video_url!, `original-video-${taskId}.mp4`)}
                                     className="flex-1"
                                     variant="default"
                                     size="sm"
                                   >
                                     <Download className="mr-2 h-4 w-4" />
                                     Download Original
                                   </Button>
                                   
                                   <Button 
                                     onClick={() => window.open(videoResults[videoGenerationTasks[taskId]].original_video_url, '_blank')}
                                     className="flex-1"
                                     variant="outline"
                                     size="sm"
                                   >
                                     <ExternalLink className="mr-2 h-4 w-4" />
                                     View in New Tab
                                   </Button>
                                 </div>
                               </div>
                             )}
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 );
             })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Results */}
      {failedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Failed Tasks ({failedResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {failedResults.map((result, index) => {
                const taskId = result.taskId || result.data?.taskId || `failed-task-${index}`;
                const failMsg = result.data?.failMsg || 'Unknown error';
                const failCode = result.data?.failCode || 'N/A';
                const model = result.model || result.data?.model || 'Unknown';
                const costTime = result.costTime || result.data?.costTime || 0;

                return (
                  <div key={taskId} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          Error {failCode}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {model}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDuration(costTime)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-red-700 mb-2">{failMsg}</p>
                    
                    <p className="text-xs text-gray-500">
                      Task ID: {taskId}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatchResultDisplay;
