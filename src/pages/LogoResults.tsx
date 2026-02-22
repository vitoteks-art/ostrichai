import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import LogoResults from '../components/LogoResults';

// Sample data for demonstration - in a real app, this would come from props or state management
const sampleResults = [
  {
    "extractedUrl": "https://tempfile.aiquickdraw.com/workers/nano/image_1758377733322_ywv1fj.png",
    "success": true,
    "debugInfo": {
      "inputCount": 1,
      "method1_structure": "object",
      "isDirect": true,
      "extractionMethod": "method1_direct"
    },
    "rawInput": {
      "code": 200,
      "msg": "success",
      "data": {
        "taskId": "6b5219b9f0d90e9f91b793c22c74b501",
        "model": "google/nano-banana",
        "state": "success",
        "param": "{\"model\":\"google/nano-banana\",\"callBackUrl\":\"https://your-domain.com/api/callback\",\"input\":{\"prompt\":\"Design a modern flat logo for OstrichAi that reads as a professional scalable brand mark. Use navy blue and horse blood as primary colors with cool gray and white accents in a clean flat minimal palette. Incorporate an abstract globe grid with digital meridians to convey global connectivity, data flows, and enterprise technology. Include the brand name OstrichAi and the slogan Complete Digital Solutions set in a strong geometric sans serif typeface with balanced letterspacing. Prioritize modern design principles: minimalism, clean lines, scalable vector construction, crisp flat shapes, and versatile lockups for horizontal, stacked, and icon-only use. Deliver color, monochrome, and reversed versions plus SVG outlines and clear spacing guidelines. Integrate the user request exactly as given: create a modern realistic logo while maintaining a flat aesthetic by using subtle realistic cues such as restrained layering or tone shifts only where they remain crisp at small sizes.\"}}",
        "resultJson": "{\"resultUrls\":[\"https://tempfile.aiquickdraw.com/workers/nano/image_1758377733322_ywv1fj.png\"]}",
        "failCode": null,
        "failMsg": null,
        "costTime": 8,
        "completeTime": 1758377733788,
        "createTime": 1758377724807
      }
    }
  }
];

interface LogoResultsPageProps {
  results?: any[];
  brandName?: string;
  slogan?: string;
}

const LogoResultsPage: React.FC<LogoResultsPageProps> = () => {
  const [formData, setFormData] = useState<{brandName?: string; slogan?: string}>({});
  const [logoResults, setLogoResults] = useState<any[]>(sampleResults);

  useEffect(() => {
    // Try to get form data from sessionStorage
    const storedFormData = sessionStorage.getItem('logoFormData');
    if (storedFormData) {
      try {
        const parsedFormData = JSON.parse(storedFormData);
        setFormData(parsedFormData);
      } catch (error) {
        console.error('Failed to parse stored form data:', error);
      }
    }

    // Try to get logo results from sessionStorage
    const storedResults = sessionStorage.getItem('logoResults');
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        // If the response is an array, use it directly
        // If it's a single object, wrap it in an array
        const resultsArray = Array.isArray(parsedResults) ? parsedResults : [parsedResults];
        setLogoResults(resultsArray);
      } catch (error) {
        console.error('Failed to parse stored logo results:', error);
        // Fall back to sample data if parsing fails
        setLogoResults(sampleResults);
      }
    }
  }, []);

  return (
    <Layout>
      <LogoResults 
        results={logoResults} 
        brandName={formData.brandName || "OstrichAi"} 
        slogan={formData.slogan || "Complete Digital Solutions"} 
      />
    </Layout>
  );
};

export default LogoResultsPage;
