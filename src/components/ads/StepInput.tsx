
import React, { useState } from 'react';
import { ArrowRight, Loader2, Eye } from 'lucide-react';
import { ProductInput } from '../../types/adsEngine';
import { CreditDisplay } from './CreditDisplay';

interface StepInputProps {
    onSubmit: (data: ProductInput, enableAdSpy: boolean) => void;
    initialData: ProductInput;
    isProcessing: boolean;
    creditBalance: number;
}

export const StepInput: React.FC<StepInputProps> = ({ onSubmit, initialData, isProcessing, creditBalance }) => {
    const [formData, setFormData] = useState(initialData);
    const [enableAdSpy, setEnableAdSpy] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData, enableAdSpy);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <CreditDisplay balance={creditBalance} stepCost={2} stepName="Intelligence Analysis" />

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
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., HydraFlow Water Bottle"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Product URL <span className="text-slate-500 font-normal">(Optional)</span></label>
                        <input
                            type="url"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            value={formData.productUrl || ''}
                            onChange={e => setFormData({ ...formData, productUrl: e.target.value })}
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
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                            onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                            placeholder="e.g., Fitness enthusiasts, 25-40"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Target Ad Platforms</label>
                        <input
                            type="text"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            value={formData.adPlatforms || ''}
                            onChange={e => setFormData({ ...formData, adPlatforms: e.target.value })}
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
                            onChange={e => setFormData({ ...formData, competitors: e.target.value })}
                            placeholder="e.g., Stanley, Yeti"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Competitor URL <span className="text-slate-500 font-normal">(Optional)</span></label>
                        <input
                            type="url"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            value={formData.competitorUrl || ''}
                            onChange={e => setFormData({ ...formData, competitorUrl: e.target.value })}
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
