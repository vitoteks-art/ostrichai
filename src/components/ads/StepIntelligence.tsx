
import React from 'react';
import { ArrowRight, AlertTriangle, CheckCircle2, Swords, Radio, Eye, Zap, Video, Lightbulb } from 'lucide-react';
import { MarketIntelligence } from '../../types/adsEngine';

import { CreditDisplay } from './CreditDisplay';

interface StepIntelligenceProps {
    data: MarketIntelligence;
    onNext: () => void;
    creditBalance: number;
}

export const StepIntelligence: React.FC<StepIntelligenceProps> = ({ data, onNext, creditBalance }) => {
    return (
        <div className="max-w-4xl mx-auto">
            <CreditDisplay balance={creditBalance} stepCost={1} stepName="Messaging" />

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
                            {(data.painPoints && data.painPoints.length > 0) ? data.painPoints.map((p, i) => (
                                <li key={i} className="bg-slate-950/50 p-3 rounded-lg border-l-2 border-rose-500/50">
                                    <div className="flex justify-between">
                                        <span className="font-medium text-slate-200">{p.title}</span>
                                        <span className="text-xs text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded">Lvl {p.intensity}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">{p.description}</p>
                                </li>
                            )) : <p className="text-slate-500 text-sm">No pain points identified.</p>}
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-sm">
                        <h3 className="text-emerald-400 font-semibold mb-4 flex items-center gap-2">
                            <CheckCircle2 size={18} /> Core Desires
                        </h3>
                        <ul className="space-y-4">
                            {(data.desires && data.desires.length > 0) ? data.desires.map((d, i) => (
                                <li key={i} className="bg-slate-950/50 p-3 rounded-lg border-l-2 border-emerald-500/50">
                                    <span className="font-medium text-slate-200 block">{d.title}</span>
                                    <p className="text-sm text-slate-400 mt-1">{d.description}</p>
                                </li>
                            )) : <p className="text-slate-500 text-sm">No desires identified.</p>}
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-sm">
                        <h3 className="text-blue-400 font-semibold mb-4">Buyer Segments</h3>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {(data.buyerSegments && data.buyerSegments.length > 0) ? data.buyerSegments.map((seg, i) => (
                                <span key={i} className="px-3 py-1 bg-blue-900/20 text-blue-300 rounded-full text-sm border border-blue-800/50">
                                    {seg}
                                </span>
                            )) : <p className="text-slate-500 text-sm">No segments identified.</p>}
                        </div>
                        <h3 className="text-amber-400 font-semibold mb-4">Objections</h3>
                        <ul className="space-y-3">
                            {(data.objections && data.objections.length > 0) ? data.objections.map((obj, i) => (
                                <li key={i} className="text-sm border-b border-slate-800 pb-2 last:border-0">
                                    <span className="text-slate-300 block mb-1">"{obj.title}"</span>
                                    <span className="text-slate-500 italic">Counter: {obj.counterArg}</span>
                                </li>
                            )) : <p className="text-slate-500 text-sm">No objections identified.</p>}
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
        </div>
    );
};
