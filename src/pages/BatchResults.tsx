import React from 'react';
import BatchResultDisplay from '@/components/BatchResultDisplay';

const BatchResults = () => {
  // Sample data from user input
  const sampleResults = [
    {
      "code": 200,
      "msg": "success",
      "data": {
        "taskId": "07b764924bcc2483d227fa53ebef5b0a",
        "model": "google/nano-banana-edit",
        "state": "fail",
        "param": "{\"model\":\"google/nano-banana-edit\",\"callBackUrl\":\"https://your-domain.com/api/callback\",\"input\":{\"prompt\":\"Transform this image into a modern office scene where the man with the gray hoodie and glasses stands confidently smiling in front of a sleek digital display layered with bright AI-driven data analytics. The wooden geometric background is softened with natural sunlight streaming through wide windows, adding warmth and positivity. He gestures engagingly, embodying happiness and enthusiasm about AI's role in simplifying business operations. The tech-savvy atmosphere is retained with vibrant colors from the digital display, enhanced with subtle office elements like a laptop, indoor plants, and tidy workstations around, linking back clearly to the original image's composition and style. Image Integration: This scene uses the same man, attire, and confident expression from the reference image, applying the digital display with vibrant colors as the focal tech element within a sunlit modern office to transform the mood from studio to lively workplace. Continuity Notes: The scene progresses from the original image's tech display and confident individual to a more inviting office environment, maintaining lighting and wood textures for continuity and emphasizing the man's positive energy about AI. Target Emotion: Joy and inspiration. Key Focus: AI benefits making business easier and more efficient through real-time data insights from the digital display. Keep the original logo, branding, and overall design exactly as is in the unmodified image – no changes to colors, text, styling, or positioning. Maintain visual consistency with previous scenes in lighting, character appearance, and environmental elements.\",\"image_urls\":[\"https://i.ibb.co/9mtW0Rpr/463d07a6-9475-4e78-9771-09328509f426.png\"]}}",
        "resultJson": "",
        "failCode": "422",
        "failMsg": "Director: unexpected error handling prediction (E6716)",
        "costTime": 160,
        "completeTime": 1757778687850,
        "createTime": 1757778527139
      }
    },
    {
      "taskId": "7f68b57e4dbccd4b44b7d35e80792d69",
      "imageUrl": "https://tempfile.aiquickdraw.com/nano3/cf254edb-58d0-4d46-8465-141a50b1ad36.png",
      "state": "success",
      "model": "google/nano-banana-edit",
      "costTime": 333,
      "completeTime": 1757778860080,
      "createTime": 1757778527179,
      "success": true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-bg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-secondary opacity-50" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Batch Processing Results
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            View your batch processing statistics and download successful results
          </p>
        </div>

        {/* Results Display */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-elegant p-6">
          <BatchResultDisplay results={sampleResults} />
        </div>
      </div>
    </div>
  );
};

export default BatchResults;
