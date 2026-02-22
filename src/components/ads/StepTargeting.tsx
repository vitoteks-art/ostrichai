import React from 'react';
import { Users, MapPin, Target, Activity, Layers, TestTube, RefreshCw, Monitor, Smartphone, Globe, Layout, CheckCircle } from 'lucide-react';
import { AudienceTargeting } from '../../types/adsEngine';

interface StepTargetingProps {
    data: AudienceTargeting;
    onUpdate: (data: Partial<AudienceTargeting>) => void;
    onNext: () => void;
}

const PLACEMENT_OPTIONS = [
    { id: 'facebook_feed', name: 'Facebook Feed', icon: Monitor, platform: 'Facebook' },
    { id: 'instagram_feed', name: 'Instagram Feed', icon: Smartphone, platform: 'Instagram' },
    { id: 'instagram_stories', name: 'Instagram Stories', icon: Smartphone, platform: 'Instagram' },
    { id: 'facebook_stories', name: 'Facebook Stories', icon: Smartphone, platform: 'Facebook' },
    { id: 'facebook_marketplace', name: 'Facebook Marketplace', icon: Layout, platform: 'Facebook' },
    { id: 'facebook_video_feeds', name: 'Video Feeds', icon: Monitor, platform: 'Facebook' },
    { id: 'audience_network', name: 'Audience Network', icon: Globe, platform: 'Meta' },
];

export const StepTargeting: React.FC<StepTargetingProps> = ({ data, onUpdate, onNext }) => {
    const selectedPlacements = data.placements || ['facebook_feed', 'instagram_feed'];

    const togglePlacement = (id: string) => {
        let newPlacements;
        if (selectedPlacements.includes(id)) {
            newPlacements = selectedPlacements.filter(p => p !== id);
        } else {
            newPlacements = [...selectedPlacements, id];
        }
        onUpdate({ placements: newPlacements });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 pb-12">
            <div className="text-center max-w-2xl mx-auto mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Audience Intelligence</h2>
                <p className="text-slate-400">AI-optimized targeting parameters and placement control.</p>
            </div>

            {/* Placement Selection */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <Layout className="text-blue-400" /> Ad Placements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {PLACEMENT_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = selectedPlacements.includes(opt.id);
                        return (
                            <button
                                key={opt.id}
                                onClick={() => togglePlacement(opt.id)}
                                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${isSelected
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                    <Icon size={18} />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold">{opt.name}</div>
                                    <div className="text-[10px] uppercase tracking-wider opacity-60">{opt.platform}</div>
                                </div>
                                {isSelected && <CheckCircle size={14} className="ml-auto text-blue-400" />}
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs text-slate-500 mt-6 flex items-center gap-2 italic">
                    <Activity size={12} /> Pro Tip: Broad placements (Advantage+) usually yield lower CPA, while specific feeds maximize CTR for high-intent products.
                </p>
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
                                        <span className="flex items-center gap-1"><MapPin size={14} className="text-slate-500" /> {seg.demographics?.locations?.slice(0, 2).join(', ') + (seg.demographics?.locations?.length > 2 ? '...' : '')}</span>
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

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center mt-8">
                <h3 className="text-lg font-semibold text-white mb-2">Ready to Optimize?</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-md">The engine has all targeting and placement parameters. Launch the optimization loop to simulate performance.</p>
                <button onClick={onNext} className="w-full max-w-sm bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                    <RefreshCw className="animate-spin-slow" size={18} />
                    Launch Optimization Loop
                </button>
            </div>
        </div>
    );
};
