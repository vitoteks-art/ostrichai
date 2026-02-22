
import React from 'react';
import { BarChart2, DollarSign, MousePointer, Percent, TrendingDown, TrendingUp, Calendar, Zap, MessageSquare, Facebook, Rocket } from 'lucide-react';
import { OptimizationResult, DailyPerformance } from '../../types/adsEngine';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface StepOptimizationProps {
    data: OptimizationResult;
    onReset: () => void;
    onNext: () => void;
}

export const StepOptimization: React.FC<StepOptimizationProps> = ({ data, onReset, onNext }) => {

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

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700 pb-12">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Dynamic Optimization Core</h2>
                <p className="text-slate-400">Real-time performance simulation and actionable insights.</p>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <MetricCard icon={DollarSign} label="Spend" value={`$${metrics.totalSpend?.toLocaleString()}`} color="text-slate-300" />
                <MetricCard icon={DollarSign} label="ROAS" value={`${metrics.roas}x`} color="text-emerald-400" />
                <MetricCard icon={MousePointer} label="CTR" value={`${metrics.ctr}%`} color="text-blue-400" />
                <MetricCard icon={DollarSign} label="CPA" value={`$${metrics.cpa}`} color="text-rose-400" />
                <MetricCard icon={BarChart2} label="Impressions" value={metrics.impressions?.toLocaleString()} color="text-slate-300" />
                <MetricCard icon={Percent} label="Clicks" value={metrics.clicks?.toLocaleString()} color="text-slate-300" />
            </div>

            {/* Performance Chart & Fatigue Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center justify-between">
                        <span>7-Day Performance Trend</span>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> ROAS</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> CPA</span>
                        </div>
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.campaignPerformance?.dailyBreakdown || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="day" stroke="#64748b" tickFormatter={(val) => `D${val}`} />
                                <YAxis yAxisId="left" stroke="#64748b" />
                                <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                />
                                <Line yAxisId="left" type="monotone" dataKey="roas" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                                <Line yAxisId="right" type="monotone" dataKey="cpa" stroke="#f43f5e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Fatigue Monitor */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <TrendingDown size={16} /> Fatigue Monitor
                        </h3>
                        {analysis?.fatigueSignals && analysis.fatigueSignals.length > 0 ? (
                            <div className="space-y-3">
                                {analysis.fatigueSignals.map((sig, i) => (
                                    <div key={i} className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-lg">
                                        <div className="flex justify-between text-rose-400 font-bold text-xs mb-1">
                                            <span>{sig.signal}</span>
                                            <span>{sig.severity}</span>
                                        </div>
                                        <p className="text-xs text-rose-200/70 leading-tight">{sig.evidence}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-sm">No significant fatigue detected.</div>
                        )}
                    </div>

                    {/* Opportunities */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Zap size={16} /> New Opportunities
                        </h3>
                        {analysis?.opportunities?.slice(0, 2).map((opp, i) => (
                            <div key={i} className="mb-3 last:mb-0">
                                <div className="text-emerald-400 font-medium text-sm mb-1">{opp.area}</div>
                                <p className="text-xs text-slate-500 leading-tight">{opp.reasoning}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Optimization Actions & Forecast */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-bold text-white mb-4">Recommended Actions</h3>
                    <div className="space-y-4">
                        {actions.map((action, index) => (
                            <div key={index} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex gap-4 transition-all hover:border-blue-500/30">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${action.category === 'budget' ? 'bg-emerald-500/10 text-emerald-500' :
                                    action.category === 'creative' ? 'bg-purple-500/10 text-purple-500' :
                                        'bg-blue-500/10 text-blue-500'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-lg mb-1">{action.action}</h4>
                                    <p className="text-sm text-slate-400 mb-2">{action.reasoning}</p>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className={`px-2 py-0.5 rounded font-bold uppercase ${action.category === 'budget' ? 'bg-emerald-950 text-emerald-400' :
                                            action.category === 'creative' ? 'bg-purple-950 text-purple-400' :
                                                'bg-blue-950 text-blue-400'
                                            }`}>
                                            {action.category}
                                        </span>
                                        <span className="text-slate-500 flex items-center gap-1">
                                            <TrendingUp size={12} /> Impact: {action.expectedImpact}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-white mb-4">7-Day Forecast</h3>
                    <div className="bg-gradient-to-br from-indigo-950/30 to-slate-950 border border-indigo-500/20 rounded-2xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <Calendar className="text-indigo-500/20 w-24 h-24" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="px-3 py-1 rounded-full bg-indigo-500 text-white text-xs font-bold">
                                    CONFIDENCE: {forecast?.confidence || 'High'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Projected Conversions</div>
                                    <div className="text-3xl font-bold text-white">{forecast?.projectedConversions?.toLocaleString()}</div>
                                    <div className="text-emerald-400 text-xs flex items-center gap-1 mt-1">
                                        <TrendingUp size={12} /> +12% vs last week
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Projected ROAS</div>
                                    <div className="text-3xl font-bold text-white">{forecast?.projectedROAS}x</div>
                                    <div className="text-emerald-400 text-xs flex items-center gap-1 mt-1">
                                        <TrendingUp size={12} /> +0.4x lift
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Projected CPA</div>
                                    <div className="text-3xl font-bold text-white">${forecast?.projectedCPA}</div>
                                    <div className="text-emerald-400 text-xs flex items-center gap-1 mt-1">
                                        <TrendingDown size={12} /> -5% improvement
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Projected Spend</div>
                                    <div className="text-3xl font-bold text-white">${forecast?.projectedSpend?.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-start gap-3">
                        <MessageSquare className="text-blue-400 mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1">AI Recommendation</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                "Based on the fatigue analysis and projected lift, I recommend scaling the budget on the winning 'Social Proof' creative variant by 20% while pausing the underperforming 'Feature' angle to maximize ROAS."
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center pt-8 border-t border-slate-800/50">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    <button
                        onClick={onReset}
                        className="text-slate-500 hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                            <Zap size={14} />
                        </div>
                        Start New Campaign
                    </button>

                    <button
                        onClick={onNext}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-10 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 group"
                    >
                        Review & Finalize
                        <Rocket size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col items-center text-center hover:bg-slate-800/50 transition-colors">
        <Icon size={20} className={`mb-2 ${color}`} />
        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</div>
        <div className={`text-xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
);
