import React, { useState, useEffect } from 'react';
import { Download, Eye, Share2, Heart, Copy, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface LogoResult {
  extractedUrl: string;
  success: boolean;
  debugInfo: {
    inputCount: number;
    method1_structure: string;
    isDirect: boolean;
    extractionMethod: string;
  };
  rawInput: {
    code: number;
    msg: string;
    data: {
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
    };
  };
}

interface LogoResultsProps {
  results: LogoResult[];
  brandName?: string;
  slogan?: string;
}

const LogoResults: React.FC<LogoResultsProps> = ({ results, brandName, slogan }) => {
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading animation
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = async (url: string, filename: string) => {
    try {
      // Try direct download first
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download initiated! If it doesn\'t work, try right-click and "Save image as..."');
    } catch (error) {
      // Fallback: open in new tab
      try {
        window.open(url, '_blank');
        toast.info('Image opened in new tab. Right-click and "Save image as..." to download.');
      } catch (fallbackError) {
        toast.error('Unable to download. Please right-click the image and select "Save image as..."');
      }
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success('URL copied to clipboard!');
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const toggleFavorite = (url: string) => {
    const newFavorites = new Set(favorites);
    if (favorites.has(url)) {
      newFavorites.delete(url);
      toast.success('Removed from favorites');
    } else {
      newFavorites.add(url);
      toast.success('Added to favorites');
    }
    setFavorites(newFavorites);
  };

  const getLogoUrls = (results: LogoResult[]): string[] => {
    const urls: string[] = [];
    results.forEach(result => {
      if (result.success && result.rawInput?.data?.resultJson) {
        try {
          const resultData = JSON.parse(result.rawInput.data.resultJson);
          if (resultData.resultUrls && Array.isArray(resultData.resultUrls)) {
            urls.push(...resultData.resultUrls);
          }
        } catch (error) {
          console.error('Failed to parse result JSON:', error);
        }
      }
      if (result.extractedUrl) {
        urls.push(result.extractedUrl);
      }
    });
    return [...new Set(urls)]; // Remove duplicates
  };

  const logoUrls = getLogoUrls(results);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded-lg w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-48 mx-auto"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="aspect-square bg-slate-200 rounded-xl mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Your Logo Designs
          </h1>
          {brandName && (
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-slate-700 mb-2">{brandName}</h2>
              {slogan && (
                <p className="text-lg text-slate-600 italic">"{slogan}"</p>
              )}
            </div>
          )}
          <p className="text-slate-600 max-w-2xl mx-auto">
            Here are your AI-generated logo designs. Click on any logo to view it in full size, 
            download your favorites, or share them with your team.
          </p>
        </div>

        {/* Results Grid */}
        {logoUrls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {logoUrls.map((url, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-6">
                  {/* Logo Display */}
                  <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-white rounded-xl mb-6 overflow-hidden border-2 border-slate-100 group-hover:border-blue-200 transition-colors">
                    <img
                      src={url}
                      alt={`Logo design ${index + 1}`}
                      className="w-full h-full object-contain p-4 cursor-pointer transition-transform duration-300 group-hover:scale-105"
                      onClick={() => setSelectedLogo(url)}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBMMTMwIDEzMEg3MEwxMDAgNzBaIiBmaWxsPSIjOTQ5NEE0Ii8+CjwvZz4KPC9zdmc+';
                      }}
                    />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        size="sm"
                        className="bg-white/90 text-slate-800 hover:bg-white"
                        onClick={() => setSelectedLogo(url)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(url, `logo-${index + 1}.png`)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyUrl(url)}
                        className={`transition-colors ${copiedUrl === url ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
                      >
                        {copiedUrl === url ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleFavorite(url)}
                      className={`transition-colors ${favorites.has(url) ? 'text-red-500 hover:text-red-600' : 'text-slate-400 hover:text-red-500'}`}
                    >
                      <Heart className={`w-4 h-4 ${favorites.has(url) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Eye className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No logos found</h3>
            <p className="text-slate-500">The logo generation results don't contain any valid images.</p>
          </div>
        )}

        {/* Full Size Modal */}
        {selectedLogo && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={() => setSelectedLogo(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <img
                src={selectedLogo}
                alt="Full size logo"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-4 right-4"
                onClick={() => setSelectedLogo(null)}
              >
                ✕
              </Button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }
          
          .animate-slide-up {
            animation: slide-up 0.6s ease-out forwards;
            opacity: 0;
          }
        `
      }} />
    </div>
  );
};

export default LogoResults;
