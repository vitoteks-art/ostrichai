
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { 
  AppStep, 
  AppState, 
  ProductInput, 
  MarketIntelligence,
  MessagingArchitecture,
  AdCreative,
  AudienceTargeting,
  PredictionResult,
  OptimizationInsight,
  OptimizationResult
} from './types';
import * as GeminiService from './services/geminiService';
import { 
  Loader2, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  BrainCircuit,
  Target,
  Activity,
  TrendingUp,
  RefreshCw,
  Zap,
  Swords,
  Eye,
  Radio,
  Lightbulb,
  Video,
  Trophy,
  XCircle,
  BarChart2,
  DollarSign,
  MousePointer,
  Percent,
  Layers,
  MapPin,
  Users,
  TestTube,
  Globe,
  TrendingDown,
  Calendar,
  Sparkles,
  MessageSquare
} from 'lucide-react';

/* --- Component: Step 1 Input --- */
const StepInput = ({ 
  onSubmit, 
  initialData,
  isProcessing
}: { 
  onSubmit: (data: ProductInput, enableAdSpy: boolean) => void; 
  initialData: ProductInput;
  isProcessing: boolean;
}) => {
  const [formData, setFormData] = useState(initialData);
  const [enableAdSpy, setEnableAdSpy] = useState(true); // Default to true as it now drives the webhook

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, enableAdSpy);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Start Your Campaign
        </h1>
        <p className="text-slate-400">Tell us about your product to initialize the AI engine.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/50 p-8 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
        
        {/* Row 1: Product Name & URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Product Name</label>
            <input
              type="text"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., HydraFlow Water Bottle"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Product URL <span className="text-slate-500 font-normal">(Optional)</span></label>
            <input
              type="url"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              value={formData.productUrl || ''}
              onChange={e => setFormData({...formData, productUrl: e.target.value})}
              placeholder="https://yourproduct.com"
            />
          </div>
        </div>

        {/* Row 2: Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
          <textarea
            required
            rows={4}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            placeholder="Describe the product features and benefits..."
          />
        </div>

        {/* Row 3: Audience & Ad Platforms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Audience</label>
            <input
              type="text"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              value={formData.targetAudience}
              onChange={e => setFormData({...formData, targetAudience: e.target.value})}
              placeholder="e.g., Fitness enthusiasts, 25-40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Ad Platforms</label>
            <input
              type="text"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              value={formData.adPlatforms || ''}
              onChange={e => setFormData({...formData, adPlatforms: e.target.value})}
              placeholder="e.g., Meta, Google, TikTok"
            />
          </div>
        </div>

        {/* Row 4: Competitors & Competitor URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Key Competitors</label>
            <input
              type="text"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              value={formData.competitors}
              onChange={e => setFormData({...formData, competitors: e.target.value})}
              placeholder="e.g., Stanley, Yeti"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Competitor URL <span className="text-slate-500 font-normal">(Optional)</span></label>
            <input
              type="url"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              value={formData.competitorUrl || ''}
              onChange={e => setFormData({...formData, competitorUrl: e.target.value})}
              placeholder="https://competitor.com"
            />
          </div>
        </div>

        {/* Ad Spy Toggle */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer group hover:border-indigo-500/50 transition-all" onClick={() => setEnableAdSpy(!enableAdSpy)}>
           <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg transition-colors ${enableAdSpy ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                <Eye size={20} />
             </div>
             <div>
               <div className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">Competitor Ad Spy</div>
               <div className="text-xs text-slate-500">Uses Live Webhook Intelligence when enabled.</div>
             </div>
           </div>
           <div className={`w-12 h-6 rounded-full p-1 transition-colors ${enableAdSpy ? 'bg-indigo-600' : 'bg-slate-700'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${enableAdSpy ? 'translate-x-6' : 'translate-x-0'}`} />
           </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 mt-4 group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isProcessing ? <Loader2 className="animate-spin" /> : <React.Fragment>Initialize AI Engine <ArrowRight className="group-hover:translate-x-1 transition-transform" /></React.Fragment>}
        </button>
      </form>
    </div>
  );
};

/* --- Component: Step 2 Intelligence --- */
const StepIntelligence = ({ data, onNext }: { data: MarketIntelligence; onNext: () => void }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Market Intelligence Analysis</h2>
          <p className="text-slate-400">Deep dive into market psychology and hidden demand signals.</p>
        </div>
        <button onClick={onNext} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 border border-slate-700">
          Continue to Messaging <ArrowRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-sm">
          <h3 className="text-rose-400 font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={18} /> Pain Points
          </h3>
          <ul className="space-y-4">
            {data.painPoints?.map((p, i) => (
              <li key={i} className="bg-slate-950/50 p-3 rounded-lg border-l-2 border-rose-500/50">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-200">{p.title}</span>
                  <span className="text-xs text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded">Lvl {p.intensity}</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">{p.description}</p>
              </li>
            )) || <p className="text-slate-500 text-sm">No pain points identified.</p>}
          </ul>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-sm">
          <h3 className="text-emerald-400 font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} /> Core Desires
          </h3>
          <ul className="space-y-4">
            {data.desires?.map((d, i) => (
              <li key={i} className="bg-slate-950/50 p-3 rounded-lg border-l-2 border-emerald-500/50">
                <span className="font-medium text-slate-200 block">{d.title}</span>
                <p className="text-sm text-slate-400 mt-1">{d.description}</p>
              </li>
            )) || <p className="text-slate-500 text-sm">No desires identified.</p>}
          </ul>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-sm">
          <h3 className="text-blue-400 font-semibold mb-4">Buyer Segments</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {data.buyerSegments?.map((seg, i) => (
              <span key={i} className="px-3 py-1 bg-blue-900/20 text-blue-300 rounded-full text-sm border border-blue-800/50">
                {seg}
              </span>
            )) || <p className="text-slate-500 text-sm">No segments identified.</p>}
          </div>
          <h3 className="text-amber-400 font-semibold mb-4">Objections</h3>
          <ul className="space-y-3">
             {data.objections?.map((obj, i) => (
               <li key={i} className="text-sm border-b border-slate-800 pb-2 last:border-0">
                 <span className="text-slate-300 block mb-1">"{obj.title}"</span>
                 <span className="text-slate-500 italic">Counter: {obj.counterArg}</span>
               </li>
             )) || <p className="text-slate-500 text-sm">No objections identified.</p>}
          </ul>
        </div>
      </div>

      {/* Competitor Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <h3 className="text-indigo-400 font-semibold mb-4 flex items-center gap-2">
             <Swords size={20} /> Competitor Weaknesses
          </h3>
          <div className="space-y-4">
            {data.competitorAnalysis?.map((comp, i) => (
              <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                 <div className="text-white font-bold mb-2">{comp.name}</div>
                 <div className="space-y-3 text-sm">
                   <div className="flex gap-4">
                     <div className="flex-1">
                       <span className="text-rose-400 text-xs uppercase tracking-wide font-semibold block mb-1">Weakness</span>
                       <p className="text-slate-400 leading-tight">{comp.weakness}</p>
                     </div>
                     <div className="flex-1 border-l border-slate-800 pl-4">
                       <span className="text-emerald-400 text-xs uppercase tracking-wide font-semibold block mb-1">Opportunity</span>
                       <p className="text-slate-300 leading-tight font-medium">{comp.opportunity}</p>
                     </div>
                   </div>
                 </div>
              </div>
            )) || <p className="text-slate-500 text-sm">No competitor data found.</p>}
          </div>
        </div>

        {/* Competitor Ad Spy Insights */}
        {data.competitorAdInsights && (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/20 border border-indigo-500/20 rounded-2xl p-6 relative">
             <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-bl-xl font-medium border-l border-b border-emerald-500/20 flex items-center gap-1">
               <Radio size={12} className="animate-pulse" /> Live Signal: {data.analyzedAdCount} Ads
             </div>
             
             <h3 className="text-indigo-300 font-semibold mb-6 flex items-center gap-2">
                <Eye size={20} /> Competitor Strategy Declassified
             </h3>

             <div className="space-y-6">
               <div>
                 <h4 className="text-xs uppercase text-slate-500 font-bold tracking-wider mb-3 flex items-center gap-2">
                   <Zap size={14} /> Dominant Hooks
                 </h4>
                 <div className="flex flex-wrap gap-2">
                   {data.competitorAdInsights.dominantHooks?.map((hook, i) => (
                     <span key={i} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-md text-sm">
                       "{hook}"
                     </span>
                   )) || <span className="text-slate-500 text-sm">No hooks found</span>}
                 </div>
               </div>

               <div>
                 <h4 className="text-xs uppercase text-slate-500 font-bold tracking-wider mb-3 flex items-center gap-2">
                   <Video size={14} /> Visual Patterns
                 </h4>
                 <ul className="space-y-2">
                   {data.competitorAdInsights.visualThemes?.map((theme, i) => (
                     <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                       <span className="text-indigo-500 mt-1">•</span> {theme}
                     </li>
                   )) || <li className="text-slate-500 text-sm">No themes found</li>}
                 </ul>
               </div>

               <div>
                 <h4 className="text-xs uppercase text-slate-500 font-bold tracking-wider mb-3 flex items-center gap-2">
                   <Lightbulb size={14} /> Active Offers
                 </h4>
                 <div className="flex flex-wrap gap-2">
                   {data.competitorAdInsights.activeOffers?.map((offer, i) => (
                     <span key={i} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-mono">
                       {offer}
                     </span>
                   )) || <span className="text-slate-500 text-sm">No offers found</span>}
                 </div>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* --- Component: Step 3 Messaging --- */
const StepMessaging = ({ data, onNext }: { data: MessagingArchitecture; onNext: () => void }) => {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Messaging Architecture</h2>
          <p className="text-slate-400">Strategic positioning and psychological hooks generated by AI.</p>
        </div>
        <button onClick={onNext} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20">
          Generate Creatives <ArrowRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/50 p-6 rounded-2xl border border-indigo-500/30 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
             <h3 className="text-indigo-300 font-medium text-sm uppercase tracking-wider mb-2">Core Value Proposition</h3>
             <p className="text-2xl font-light text-white leading-relaxed">"{data.coreValueProp}"</p>
          </div>
          
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-slate-400 text-sm uppercase tracking-wider mb-3">Positioning Statement</h3>
            <p className="text-lg text-slate-200">{data.positioningStatement}</p>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col h-full">
           <h3 className="text-white font-semibold mb-4">High-Converting Hooks</h3>
           <div className="space-y-3 flex-1">
             {data.hooks?.map((hook, i) => (
               <div key={i} className="flex gap-3 items-start p-3 hover:bg-slate-800/50 rounded-lg transition-colors cursor-default">
                 <div className="bg-blue-500/20 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                   {i + 1}
                 </div>
                 <p className="text-slate-300">{hook}</p>
               </div>
             )) || <p className="text-slate-500 text-sm">No hooks generated.</p>}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.messagingAngles?.map((angle, i) => (
          <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <h4 className="font-semibold text-blue-300 mb-2">{angle.angle}</h4>
            <p className="text-sm text-slate-500">{angle.description}</p>
          </div>
        )) || <p className="text-slate-500 text-sm col-span-3">No angles generated.</p>}
      </div>
    </div>
  );
};

/* --- Component: Step 4 Creatives & Prediction UI --- */
const StepCreativesAndPrediction = ({ 
  creatives, 
  predictions,
  onRunPrediction,
  onNext,
  isPredicting
}: { 
  creatives: AdCreative[]; 
  predictions: Record<string, PredictionResult>;
  onRunPrediction: () => void;
  onNext: () => void;
  isPredicting: boolean;
}) => {
  const hasPredictions = Object.keys(predictions).length > 0;

  // Sort creatives if predictions exist: Winners first, then average, then losers
  const sortedCreatives = [...creatives].sort((a, b) => {
    if (!hasPredictions) return 0;
    const scoreA = predictions[a.id]?.score || 0;
    const scoreB = predictions[b.id]?.score || 0;
    return scoreB - scoreA;
  });

  // Get Best and Worst for A/B view
  const bestAd = sortedCreatives[0];
  const worstAd = sortedCreatives[sortedCreatives.length - 1];
  const bestPred = predictions[bestAd.id];
  const worstPred = predictions[worstAd.id];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center sticky top-0 bg-slate-950/90 backdrop-blur py-4 z-20 border-b border-slate-800/50">
        <div>
          <h2 className="text-2xl font-bold text-white">Creative Lab & Predictions</h2>
          <p className="text-slate-400 text-sm">AI-generated concepts {hasPredictions ? 'ranked by synthetic performance.' : 'ready for evaluation.'}</p>
        </div>
        <div className="flex gap-3">
          {!hasPredictions ? (
            <button 
              onClick={onRunPrediction}
              disabled={isPredicting}
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPredicting ? <Loader2 className="animate-spin" /> : <BrainCircuit size={18} />}
              {isPredicting ? 'Running Simulation...' : 'Run Synthetic A/B Test'}
            </button>
          ) : (
            <button 
              onClick={onNext}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20"
            >
              View Targeting <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Head-to-Head Comparison View */}
      {hasPredictions && bestPred && worstPred && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-top-4 duration-700 mb-10">
          <div className="flex items-center gap-3 mb-6 text-purple-400">
            <Swords size={24} />
            <h3 className="text-xl font-bold text-white">Synthetic A/B Test Results: Head-to-Head</h3>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-stretch">
            {/* Winner Card */}
            <div className="flex-1 bg-gradient-to-b from-emerald-950/20 to-slate-950 border border-emerald-500/40 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                <Trophy size={12} /> WINNER
              </div>
              <div className="mb-4">
                <h4 className="text-sm text-emerald-400 font-mono mb-1">Concept #{bestAd.id}</h4>
                <div className="text-3xl font-bold text-white mb-1">{bestPred.score}<span className="text-lg text-slate-500 font-normal">/100</span></div>
              </div>
              <p className="text-white font-medium italic mb-4">"{bestAd.headline}"</p>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Resonance</span>
                    <span>{bestPred.resonance}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${bestPred.resonance}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Attention</span>
                    <span>{bestPred.attention}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${bestPred.attention}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/50">
                <p className="text-xs text-slate-400 leading-relaxed"><span className="text-emerald-400 font-bold">Why it won:</span> {bestPred.reasoning}</p>
              </div>
            </div>

            {/* Vs Badge */}
            <div className="flex items-center justify-center">
              <div className="bg-slate-800 rounded-full p-2 text-slate-400 font-bold text-xs border border-slate-700">VS</div>
            </div>

            {/* Loser Card */}
            <div className="flex-1 bg-slate-950 border border-red-900/30 rounded-xl p-5 relative opacity-80">
              <div className="absolute top-0 right-0 bg-red-900/50 text-red-300 text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                <XCircle size={12} /> ELIMINATED
              </div>
              <div className="mb-4">
                <h4 className="text-sm text-red-400 font-mono mb-1">Concept #{worstAd.id}</h4>
                <div className="text-3xl font-bold text-slate-400 mb-1">{worstPred.score}<span className="text-lg text-slate-600 font-normal">/100</span></div>
              </div>
              <p className="text-slate-300 font-medium italic mb-4">"{worstAd.headline}"</p>
              
              <div className="space-y-3 opacity-60">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Resonance</span>
                    <span>{worstPred.resonance}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-600" style={{ width: `${worstPred.resonance}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Attention</span>
                    <span>{worstPred.attention}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-600" style={{ width: `${worstPred.attention}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/50">
                <p className="text-xs text-slate-500 leading-relaxed"><span className="text-red-400 font-bold">Why it failed:</span> {worstPred.reasoning}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of all results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedCreatives.map((ad) => {
          const prediction = predictions[ad.id];
          const isWinner = prediction?.status === 'WINNER';
          const isLoser = prediction?.status === 'LOSER';

          return (
            <div 
              key={ad.id} 
              className={`
                relative rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col
                ${isWinner ? 'border-emerald-500/50 bg-emerald-950/10 shadow-emerald-900/20 shadow-xl scale-[1.02]' : 
                  isLoser ? 'border-red-900/30 bg-slate-950 opacity-60 grayscale-[0.5]' : 
                  'border-slate-800 bg-slate-900/40 hover:border-slate-700'}
              `}
            >
              {hasPredictions && prediction && (
                <div className={`
                  absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide z-10 backdrop-blur-md
                  ${isWinner ? 'bg-emerald-500 text-white' : isLoser ? 'bg-red-500/80 text-white' : 'bg-slate-700 text-slate-300'}
                `}>
                  {isWinner ? 'Winner' : isLoser ? 'Eliminated' : 'Average'} • {prediction.score}
                </div>
              )}

              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ad.format === 'VIDEO' ? 'border-purple-500/30 text-purple-400' : 'border-blue-500/30 text-blue-400'}`}>
                    {ad.format}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-bold text-white leading-tight mb-2">"{ad.headline}"</h4>
                  <p className="text-sm text-slate-400">{ad.caption}</p>
                </div>
                
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50 text-xs">
                  <span className="text-slate-500 uppercase tracking-wider font-bold block mb-1">Visual Concept</span>
                  <p className="text-slate-300 italic">{ad.visualConcept}</p>
                </div>

                {/* New Rich Context Section: Rationale & Angle */}
                {(ad.rationale || ad.angle || ad.differentiation) && (
                  <div className="bg-slate-950/30 p-3 rounded-lg border border-indigo-900/30 text-xs space-y-2">
                    <span className="text-indigo-400 uppercase tracking-wider font-bold block flex items-center gap-1">
                      <Sparkles size={10} /> AI Strategy
                    </span>
                    {ad.angle && <p className="text-slate-300"><span className="text-slate-500">Angle:</span> {ad.angle}</p>}
                    {ad.rationale && <p className="text-slate-400 italic">"{ad.rationale}"</p>}
                    
                    {ad.differentiation && (
                      <div className="mt-2 pt-2 border-t border-slate-800/50">
                        <span className="text-emerald-500 font-bold block mb-1">Vs Competitors:</span>
                        <p className="text-slate-400">{ad.differentiation}</p>
                      </div>
                    )}
                  </div>
                )}

                {ad.script && (
                   <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50 text-xs">
                   <span className="text-slate-500 uppercase tracking-wider font-bold block mb-1">Production Notes</span>
                   <p className="text-slate-300 line-clamp-3">{ad.script}</p>
                 </div>
                )}
              </div>
              
              <div className="bg-slate-950 p-4 border-t border-slate-800 mt-auto">
                 <button className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors">
                   {ad.cta}
                 </button>
              </div>

              {/* Analysis Overlay if predicted */}
              {hasPredictions && prediction && (
                <div className="p-4 bg-slate-900/80 border-t border-slate-800 text-xs space-y-2">
                   <div className="flex justify-between items-center text-slate-400">
                      <span>Resonance</span>
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${prediction.resonance}%`}}></div>
                      </div>
                   </div>
                   <div className="flex justify-between items-center text-slate-400">
                      <span>Attention</span>
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${prediction.attention}%`}}></div>
                      </div>
                   </div>
                   <p className="text-slate-500 mt-2 border-t border-slate-800 pt-2 italic line-clamp-2">
                     "{prediction.reasoning}"
                   </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* --- Component: Step 5 Targeting --- */
const StepTargeting = ({ data, onNext }: { data: AudienceTargeting; onNext: () => void }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 pb-12">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Audience Intelligence</h2>
        <p className="text-slate-400">AI-optimized targeting parameters to maximize ROAS.</p>
      </div>

      {/* Platform Strategy Cards */}
      {data.platformStrategy && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {data.platformStrategy.map((p, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <span className="font-bold text-white text-lg">{p.platform}</span>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${p.priority === 'Primary' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {p.priority}
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{p.reasoning}</p>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Targeting Segments */}
      {data.segments && data.segments.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Users className="text-purple-400" /> Target Segments
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {data.segments.map((seg, i) => (
              <div key={i} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-slate-800 pb-4">
                  <h4 className="text-lg font-bold text-white">{seg.segment}</h4>
                  <div className="flex gap-4 mt-2 md:mt-0 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><MapPin size={14} className="text-slate-500" /> {seg.demographics?.locations?.slice(0,2).join(', ') + (seg.demographics?.locations?.length > 2 ? '...' : '')}</span>
                    <span className="flex items-center gap-1"><Users size={14} className="text-slate-500" /> {seg.demographics?.ageRange}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h5 className="text-xs uppercase text-slate-500 font-bold mb-3 flex items-center gap-2">
                      <Target size={14} /> Interests
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {seg.interests?.map((int, j) => (
                        <span key={j} className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs border border-slate-700">
                          {int}
                        </span>
                      )) || <span className="text-slate-500 text-sm">None</span>}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs uppercase text-slate-500 font-bold mb-3 flex items-center gap-2">
                      <Activity size={14} /> Behaviors
                    </h5>
                    <ul className="space-y-2">
                      {seg.behaviors?.map((beh, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                          <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5" />
                          {beh}
                        </li>
                      )) || <li className="text-slate-500 text-sm">None</li>}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lookalikes & Testing Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lookalikes */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Layers className="text-blue-500" /> Lookalike Strategy
          </h3>
          <div className="space-y-3">
            {data.lookalikes?.map((lal, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800/50">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Users size={16} />
                </div>
                <span className="text-slate-300 text-sm font-medium">{lal}</span>
              </div>
            )) || <p className="text-slate-500 text-sm">No lookalikes found.</p>}
          </div>
        </div>

        {/* Testing Roadmap */}
        {data.testingRoadmap && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <TestTube className="text-amber-500" /> Testing Roadmap
            </h3>
            <div className="space-y-4">
              {data.testingRoadmap.map((item, i) => (
                <div key={i} className="border-l-2 border-amber-500/50 pl-4 py-1">
                  <div className="flex justify-between items-start">
                    <span className="text-slate-200 font-medium text-sm block mb-1">{item.test}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${item.priority === 'High' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 italic">"{item.hypothesis}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Area */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center mt-8">
         <h3 className="text-lg font-semibold text-white mb-2">Ready to Optimize?</h3>
         <p className="text-slate-400 text-sm mb-6 max-w-md">The engine has all targeting parameters. Launch the optimization loop to simulate performance.</p>
         <button onClick={onNext} className="w-full max-w-sm bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
           <RefreshCw className="animate-spin-slow" size={18} />
           Launch Optimization Loop
         </button>
      </div>
    </div>
  );
};

/* --- Component: Step 6 Optimization --- */
const StepOptimization = ({ data, onReset }: { data: OptimizationResult; onReset: () => void }) => {
  
  // Use rich data if available, else legacy format
  const metrics = data.campaignPerformance?.metrics || {
    totalSpend: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    conversions: 0,
    cpa: 0,
    roas: 0,
    cpm: 0,
    cpc: 0
  };

  const actions = data.optimizationActions || [];
  const forecast = data.weekAheadForecast;
  const analysis = data.performanceAnalysis;

  // Calculate max conversion for chart scaling
  const maxConversions = data.campaignPerformance?.dailyBreakdown 
    ? Math.max(...data.campaignPerformance.dailyBreakdown.map(d => d.conversions)) 
    : 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
          <TrendingUp className="text-green-500" />
          Dynamic Optimization Engine
        </h2>
        <p className="text-slate-400">
          The AI has run a 7-day simulation of your campaign. Below is the generated performance data and recommended next steps.
        </p>
      </div>

      {/* Simulated Performance Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Key Metrics */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="text-blue-400" size={20} />
            <h3 className="text-lg font-semibold text-white">Simulated 7-Day Performance</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><DollarSign size={12}/> Spend</div>
              <div className="text-xl font-bold text-white">${metrics.totalSpend?.toLocaleString()}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Eye size={12}/> Impr.</div>
              <div className="text-xl font-bold text-white">{metrics.impressions?.toLocaleString()}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><MousePointer size={12}/> Clicks</div>
              <div className="text-xl font-bold text-white">{metrics.clicks?.toLocaleString()}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Percent size={12}/> CTR</div>
              <div className="text-xl font-bold text-blue-400">{metrics.ctr}%</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Target size={12}/> CPA</div>
              <div className="text-xl font-bold text-white">${metrics.cpa}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Target size={12}/> CPM</div>
              <div className="text-xl font-bold text-slate-300">${metrics.cpm}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Target size={12}/> CPC</div>
              <div className="text-xl font-bold text-slate-300">${metrics.cpc}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 bg-emerald-900/10 border-emerald-900/30">
              <div className="text-emerald-500 text-xs mb-1 flex items-center gap-1"><TrendingUp size={12}/> ROAS</div>
              <div className="text-xl font-bold text-emerald-400">{metrics.roas}x</div>
            </div>
          </div>
        </div>

        {/* Daily Trend Chart (Simple CSS Bar Chart) */}
        {data.campaignPerformance?.dailyBreakdown && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
             <div className="flex items-center gap-2 mb-6">
               <Activity className="text-purple-400" size={20} />
               <h3 className="text-lg font-semibold text-white">Daily Conversions</h3>
             </div>
             <div className="flex items-end justify-between flex-1 gap-2 h-40">
                {data.campaignPerformance.dailyBreakdown.map((day) => {
                  const heightPercent = (day.conversions / maxConversions) * 100;
                  return (
                    <div key={day.day} className="flex flex-col items-center flex-1 group relative">
                       <div 
                         className="w-full bg-purple-500/50 rounded-t-sm transition-all group-hover:bg-purple-400"
                         style={{ height: `${heightPercent}%` }}
                       ></div>
                       <span className="text-[10px] text-slate-500 mt-2">D{day.day}</span>
                       
                       {/* Tooltip */}
                       <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                         {day.conversions} conv.
                       </div>
                    </div>
                  )
                })}
             </div>
          </div>
        )}
      </div>

      {/* Analysis, Health & Opportunities */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Activity size={18} className={analysis.overallHealth === 'Good' ? 'text-green-500' : 'text-amber-500'} />
                Campaign Health: {analysis.overallHealth}
              </h4>
              <div className="space-y-4">
                <div>
                  <span className="text-emerald-400 text-xs font-bold uppercase tracking-wide mb-1 block">Strengths</span>
                  <ul className="text-sm text-slate-400 list-disc list-inside">
                    {analysis.strengths.map((s,i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <span className="text-rose-400 text-xs font-bold uppercase tracking-wide mb-1 block">Weaknesses</span>
                  <ul className="text-sm text-slate-400 list-disc list-inside">
                    {analysis.weaknesses.map((w,i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>
           </div>

           <div className="space-y-6">
             <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <TrendingDown size={18} className="text-amber-500" />
                  Fatigue Signals
                </h4>
                <div className="space-y-3">
                  {analysis.fatigueSignals.map((sig, i) => (
                    <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-200 text-sm font-medium">{sig.signal}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${sig.severity === 'High' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {sig.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{sig.evidence}</p>
                    </div>
                  ))}
                  {analysis.fatigueSignals.length === 0 && <p className="text-slate-500 text-sm">No fatigue detected.</p>}
                </div>
             </div>

             {analysis.opportunities && analysis.opportunities.length > 0 && (
               <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Sparkles size={18} className="text-indigo-400" />
                    Growth Opportunities
                  </h4>
                  <div className="space-y-3">
                    {analysis.opportunities.map((opp, i) => (
                      <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800/50 hover:border-indigo-500/30 transition-colors">
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-200 text-sm font-medium">{opp.area}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${opp.potential === 'High' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                            {opp.potential} Potential
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 italic">{opp.reasoning}</p>
                      </div>
                    ))}
                  </div>
               </div>
             )}
           </div>
        </div>
      )}

      {/* Actions */}
      <h3 className="text-xl font-bold text-white mt-8 mb-4">Recommended Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actions.map((insight, i) => {
          return (
            <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col hover:border-blue-500/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                 <div className={`p-2 rounded-lg bg-blue-500/10 text-blue-400`}>
                   <Zap size={20} />
                 </div>
                 <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full uppercase">Priority {insight.priority}</span>
              </div>
              
              <div className="mb-1 text-xs font-bold text-blue-400 uppercase tracking-wide">{insight.category}</div>
              <h3 className="text-lg font-bold text-white mb-2 leading-tight">{insight.action}</h3>
              <p className="text-sm text-slate-400 mb-4 flex-1">{insight.reasoning}</p>
              
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50 mt-auto space-y-2">
                <div>
                  <span className="text-emerald-400 text-[10px] font-bold uppercase block mb-0.5">Expected Impact</span>
                  <p className="text-xs text-slate-300">{insight.expectedImpact}</p>
                </div>
                {insight.implementation && (
                  <div className="pt-2 border-t border-slate-800/50">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block mb-0.5">Implementation</span>
                    <p className="text-xs text-slate-400">{insight.implementation}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Forecast */}
      {forecast && (
        <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-2xl p-6 mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
           <div>
             <h4 className="text-white font-bold text-lg flex items-center gap-2">
               <Calendar size={18} className="text-blue-400" /> 7-Day Forecast
             </h4>
             <p className="text-slate-400 text-sm mt-1">Projected performance if actions are implemented.</p>
           </div>
           <div className="flex gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{forecast.projectedConversions}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Conv.</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">${forecast.projectedCPA}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">CPA</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">{forecast.projectedROAS}x</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">ROAS</div>
              </div>
           </div>
        </div>
      )}

      <div className="flex justify-center mt-12">
        <button 
          onClick={onReset}
          className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors border border-slate-700 flex items-center gap-2"
        >
          <RefreshCw size={16} /> Start New Campaign
        </button>
      </div>
    </div>
  );
};

/* --- Main App --- */
const App = () => {
  const [state, setState] = useState<AppState>({
    step: AppStep.INPUT,
    isLoading: false,
    product: {
      name: '',
      productUrl: '', // New Field
      description: '',
      targetAudience: '',
      adPlatforms: '', // New Field
      competitors: '',
      competitorUrl: '' // New Field
    },
    intelligence: null,
    messaging: null,
    creatives: [],
    predictions: {},
    targeting: null,
    optimization: null
  });

  const [error, setError] = useState<string | null>(null);

  // Calculate maximum unlocked step based on available data
  const getMaxStep = () => {
    if (state.optimization) return AppStep.OPTIMIZATION;
    if (state.targeting) return AppStep.TARGETING;
    // Both 4 and 5 share the same screen mostly, but are distinct steps in logic
    if (state.creatives.length > 0) return AppStep.PREDICTION; 
    if (state.messaging) return AppStep.MESSAGING;
    if (state.intelligence) return AppStep.INTELLIGENCE;
    return AppStep.INPUT;
  };

  const maxStep = getMaxStep();

  const handleStepNavigation = (stepId: number) => {
    // Only allow navigation if not loading and step is unlocked
    if (!state.isLoading && stepId <= maxStep) {
      setState(prev => ({ ...prev, step: stepId }));
    }
  };

  // Handlers for step transitions and API calls
  
  const handleInputSubmit = async (data: ProductInput, enableAdSpy: boolean) => {
    setState(prev => ({ ...prev, isLoading: true, product: data }));
    setError(null);
    try {
      // Analyze Market (Step 1)
      // If enableAdSpy is true, the service layer will utilize the webhook 'market_intel'
      // effectively handling what used to be a separate fetch call.
      // We pass [] as competitorAds because the fetching is now internal to analyzeMarket via the unified webhook approach if needed,
      // OR we can rely on analyzeMarket's new logic.
      // Actually, checking previous service update: analyzeMarket calls webhook internally if no data passed.
      const intel = await GeminiService.analyzeMarket(data, []);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        step: AppStep.INTELLIGENCE,
        intelligence: intel
      }));
    } catch (e: any) {
      setError(e.message || "Failed to analyze market.");
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleIntelNext = async () => {
    // Check if we already have messaging data to avoid re-generating
    if (state.messaging) {
      setState(prev => ({ ...prev, step: AppStep.MESSAGING }));
      return;
    }

    if (!state.product || !state.intelligence) return;
    setState(prev => ({ ...prev, isLoading: true }));
    setError(null);
    try {
      const msg = await GeminiService.buildMessaging(state.product, state.intelligence);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        step: AppStep.MESSAGING,
        messaging: msg
      }));
    } catch (e: any) {
      setError(e.message);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleMessagingNext = async () => {
    if (state.creatives.length > 0) {
      setState(prev => ({ ...prev, step: AppStep.CREATIVES }));
      return;
    }

    if (!state.messaging) return;
    setState(prev => ({ ...prev, isLoading: true }));
    setError(null);
    try {
      // Pass state.intelligence as the second argument
      const creatives = await GeminiService.generateCreatives(state.messaging, state.intelligence);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        step: AppStep.CREATIVES, 
        creatives: creatives
      }));
    } catch (e: any) {
      setError(e.message);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleRunPrediction = async () => {
    if (state.creatives.length === 0) return;
    setState(prev => ({ ...prev, isLoading: true }));
    setError(null);
    try {
      const predictions = await GeminiService.predictPerformance(state.creatives, state.product.targetAudience);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        predictions: predictions
      }));
    } catch (e: any) {
      setError(e.message);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handlePredictionNext = async () => {
    if (state.targeting) {
      setState(prev => ({ ...prev, step: AppStep.TARGETING }));
      return;
    }

    if (!state.product || !state.intelligence) return;
    setState(prev => ({ ...prev, isLoading: true }));
    setError(null);
    try {
      const targeting = await GeminiService.generateTargeting(state.product, state.intelligence);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        step: AppStep.TARGETING,
        targeting: targeting
      }));
    } catch (e: any) {
      setError(e.message);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleTargetingNext = async () => {
    if (state.optimization) {
       setState(prev => ({ ...prev, step: AppStep.OPTIMIZATION }));
       return;
    }

    if (!state.targeting || !state.creatives) return;
    setState(prev => ({ ...prev, isLoading: true }));
    setError(null);
    
    // Filter winning creatives for the prompt
    const winningCreatives = state.creatives.filter(c => 
      !state.predictions[c.id] || state.predictions[c.id].status === 'WINNER'
    );
    // Fallback if no specific winners
    const finalCreatives = winningCreatives.length > 0 ? winningCreatives : state.creatives.slice(0, 3);

    try {
      const optimization = await GeminiService.generateOptimizationInsights(state.targeting, finalCreatives);
      setState(prev => ({
        ...prev,
        isLoading: false,
        step: AppStep.OPTIMIZATION,
        optimization: optimization
      }));
    } catch (e: any) {
      setError(e.message);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleReset = () => {
    setState(prev => ({ 
      ...prev, 
      step: AppStep.INPUT,
      intelligence: null,
      messaging: null,
      creatives: [],
      predictions: {},
      targeting: null,
      optimization: null
    }));
  };

  // Render content based on step
  const renderContent = () => {
    if (state.isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] animate-in fade-in duration-500">
          <Loader2 className="animate-spin text-blue-500 mb-6" size={48} />
          <h3 className="text-xl font-medium text-white">AI Engine Processing...</h3>
          <p className="text-slate-500 mt-2 text-center max-w-md">
            Analyzing billions of data points, synthesizing creative concepts, and predicting outcomes.
          </p>
        </div>
      );
    }

    if (error) {
       return (
         <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <div className="bg-red-500/10 p-4 rounded-full mb-4"><AlertTriangle className="text-red-500" size={32} /></div>
            <h3 className="text-xl font-bold text-white mb-2">System Error</h3>
            <p className="text-red-400 max-w-md mb-6">{error}</p>
            <button onClick={() => setError(null)} className="px-4 py-2 bg-slate-800 rounded-lg text-white">Dismiss</button>
         </div>
       )
    }

    switch (state.step) {
      case AppStep.INPUT:
        return <StepInput onSubmit={handleInputSubmit} initialData={state.product} isProcessing={state.isLoading} />;
      case AppStep.INTELLIGENCE:
        return state.intelligence ? <StepIntelligence data={state.intelligence} onNext={handleIntelNext} /> : null;
      case AppStep.MESSAGING:
        return state.messaging ? <StepMessaging data={state.messaging} onNext={handleMessagingNext} /> : null;
      case AppStep.CREATIVES:
      case AppStep.PREDICTION:
        return (
          <StepCreativesAndPrediction 
            creatives={state.creatives} 
            predictions={state.predictions}
            onRunPrediction={handleRunPrediction}
            onNext={handlePredictionNext}
            isPredicting={state.isLoading}
          />
        );
      case AppStep.TARGETING:
        return state.targeting ? <StepTargeting data={state.targeting} onNext={handleTargetingNext} /> : null;
      case AppStep.OPTIMIZATION:
        return state.optimization ? <StepOptimization data={state.optimization} onReset={handleReset} /> : null;
      default:
        return null;
    }
  };

  return (
    <Layout currentStep={state.step} maxStep={maxStep} onStepChange={handleStepNavigation}>
      {renderContent()}
    </Layout>
  );
};

export default App;
