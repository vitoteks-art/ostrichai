
import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Image as ImageIcon, Wand2, Cloud } from 'lucide-react';

interface ApiKeyModalProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  imgbbKey: string;
  setImgbbKey: (key: string) => void;
  cloudinaryCloudName: string;
  setCloudinaryCloudName: (name: string) => void;
  cloudinaryPreset: string;
  setCloudinaryPreset: (preset: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
  apiKey, 
  setApiKey, 
  imgbbKey,
  setImgbbKey,
  cloudinaryCloudName,
  setCloudinaryCloudName,
  cloudinaryPreset,
  setCloudinaryPreset,
  isOpen, 
  onClose 
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [inputImgbbKey, setInputImgbbKey] = useState(imgbbKey);
  const [inputCloudName, setInputCloudName] = useState(cloudinaryCloudName);
  const [inputPreset, setInputPreset] = useState(cloudinaryPreset);
  
  const [showKey, setShowKey] = useState(false);
  const [showImgbbKey, setShowImgbbKey] = useState(false);
  const [showPreset, setShowPreset] = useState(false);

  useEffect(() => {
    setInputKey(apiKey);
    setInputImgbbKey(imgbbKey);
    setInputCloudName(cloudinaryCloudName);
    setInputPreset(cloudinaryPreset);
  }, [apiKey, imgbbKey, cloudinaryCloudName, cloudinaryPreset]);

  const handleSave = () => {
    setApiKey(inputKey);
    setImgbbKey(inputImgbbKey);
    setCloudinaryCloudName(inputCloudName);
    setCloudinaryPreset(inputPreset);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100 my-8">
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center gap-3 sticky top-0 z-10">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <Key size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">API Configuration</h3>
            <p className="text-sm text-slate-500">Manage your service credentials</p>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Kie.ai Key */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
              <Wand2 size={14} className="text-blue-500"/>
              Kie.ai API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="sk-..."
                className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-mono"
              />
              <button 
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* ImgBB Key */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
              <ImageIcon size={14} className="text-emerald-500"/>
              ImgBB API Key <span className="text-xs text-slate-400 font-normal">(BG Remover & Video)</span>
            </label>
            <div className="relative">
              <input
                type={showImgbbKey ? "text" : "password"}
                value={inputImgbbKey}
                onChange={(e) => setInputImgbbKey(e.target.value)}
                placeholder="ImgBB Key..."
                className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm font-mono"
              />
              <button 
                onClick={() => setShowImgbbKey(!showImgbbKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showImgbbKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Cloudinary Section */}
          <div className="pt-4 border-t border-slate-100">
             <div className="flex items-center gap-2 mb-3">
                <Cloud size={16} className="text-orange-500" />
                <h4 className="text-sm font-bold text-slate-800">Cloudinary <span className="font-normal text-slate-400 text-xs">(Flyer Designer)</span></h4>
             </div>
             
             <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                    Cloud Name
                    </label>
                    <input
                    type="text"
                    value={inputCloudName}
                    onChange={(e) => setInputCloudName(e.target.value)}
                    placeholder="e.g. dxy87..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm font-mono"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                    Upload Preset (Unsigned)
                    </label>
                    <div className="relative">
                        <input
                        type={showPreset ? "text" : "password"}
                        value={inputPreset}
                        onChange={(e) => setInputPreset(e.target.value)}
                        placeholder="preset_name"
                        className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm font-mono"
                        />
                        <button 
                        onClick={() => setShowPreset(!showPreset)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                        {showPreset ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>
             </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-lg active:scale-95 transform"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
