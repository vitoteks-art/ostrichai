import React, { useState, useEffect } from 'react';
import { AdCreative, AppState } from '../../types/adsEngine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    CheckCircle2,
    Image as ImageIcon,
    Film,
    Edit3,
    Upload,
    Eye,
    Facebook,
    Instagram,
    Smartphone,
    Monitor,
    ChevronRight,
    Sparkles,
    MessageSquare,
    Link as LinkIcon,
    Palette,
    Rocket,
    Layout as LayoutIcon,
    Target as TargetIcon,
    Target,
    Globe,
    Layers,
    User,
    Calendar,
    Settings2,
    Database
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import * as FacebookAdsService from '../../services/facebookAdsService';
import { useAuth } from '@/contexts/AuthContext';
import { getConnectedAccounts } from '../../services/socialMediaOAuthService';

interface StepFinalReviewProps {
    appState: AppState;
    onUpdate: (finalAd: AdCreative, finalConfig?: any) => void;
    onLaunch: (config: any) => void;
}

export const StepFinalReview: React.FC<StepFinalReviewProps> = ({ appState, onUpdate, onLaunch }) => {
    const { user } = useAuth();
    const [wizardStep, setWizardStep] = useState(1);
    const [selectedId, setSelectedId] = useState<string | null>(
        appState.finalAd?.id || (appState.creatives.find(c => appState.predictions[c.id]?.status === 'WINNER')?.id) || appState.creatives[0]?.id || null
    );

    const [previewPlatform, setPreviewPlatform] = useState<'facebook' | 'instagram'>('facebook');
    const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
    const [localAd, setLocalAd] = useState<AdCreative | null>(appState.finalAd || null);

    // Meta Settings State
    const [config, setConfig] = useState<any>(() => {
        const defaults = {
            objective: 'OUTCOME_TRAFFIC',
            campaignName: `AI Campaign: ${appState.product.name} - ${new Date().toLocaleDateString()}`,
            specialAdCategories: [],
            campaignBudget: { amount: 20, type: 'DAILY' },
            adSetName: 'AI Ad Set - Main Audience',
            conversionLocation: 'WEBSITE',
            performanceGoal: 'LINK_CLICKS',
            pixelId: '',
            startTime: new Date().toISOString().slice(0, 16),
            adSetBudget: null,
            facebookPageId: '',
            instagramAccountId: '',
            adName: 'AI Ad - Standard Variation',
            creativeSource: 'MANUAL',
            adFormat: 'SINGLE_IMAGE_VIDEO',
            multiAdvertiserAds: true,
            websiteUrl: appState.product.productUrl || '',
            displayLink: '',
            targeting: {
                interests: appState.targeting?.interests || [],
                locations: appState.targeting?.segments?.[0]?.demographics?.locations || ['United States'],
                ageMin: 18,
                ageMax: 65,
                genders: [1, 2]
            }
        };

        if (appState.finalConfig) {
            return {
                ...defaults,
                ...appState.finalConfig,
                targeting: appState.finalConfig.targeting || defaults.targeting
            };
        }
        return defaults;
    });

    // Metadata for dropdowns
    const [pages, setPages] = useState<any[]>([]);
    const [igAccounts, setIgAccounts] = useState<any[]>([]);
    const [datasets, setDatasets] = useState<any[]>([]);
    const [isLoadingMeta, setIsLoadingMeta] = useState(false);

    useEffect(() => {
        if (!localAd && selectedId) {
            const baseAd = appState.creatives.find(c => c.id === selectedId);
            if (baseAd) {
                setLocalAd({ ...baseAd });

                // Check for stale blob URLs (typical of page reloads from localStorage)
                if (baseAd.visualConcept?.startsWith('blob:')) {
                    toast.warning("Media asset needs to be re-uploaded before launching (session expired)");
                }
            }
        }
    }, [selectedId, appState.creatives]);

    // Fetch initial metadata
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user?.id) return;
            setIsLoadingMeta(true);
            try {
                const connected = await getConnectedAccounts(user.id);
                const fb = connected.data?.find(a => a.platform === 'facebook');
                if (fb) {
                    const pagesData = await FacebookAdsService.getFacebookPages(fb.access_token);
                    setPages(pagesData);
                    if (pagesData.length > 0 && !config.facebookPageId) {
                        handleConfigChange('facebookPageId', pagesData[0].id);
                    }

                    // Datasets for the currently active ad account
                    // Note: We'd need the adAccountId from the selector modal context or passed down
                    // For now, if we have it in appState or can get it from the user's saved accounts
                    const savedAccounts = await FacebookAdsService.getSavedAdAccounts(user.id);
                    if (savedAccounts.success && savedAccounts.data && savedAccounts.data.length > 0) {
                        const activeId = savedAccounts.data[0].ad_account_id;
                        const ds = await FacebookAdsService.getAdAccountDatasets(activeId, fb.access_token);
                        setDatasets(ds);
                    }
                }
            } catch (e) {
                console.error("Meta fetch error", e);
            } finally {
                setIsLoadingMeta(false);
            }
        };
        fetchInitialData();
    }, [user?.id]);

    // Fetch Instagram accounts when page changes
    useEffect(() => {
        const fetchIG = async () => {
            if (!config.facebookPageId || !user?.id) return;
            try {
                const connected = await getConnectedAccounts(user.id);
                const fb = connected.data?.find(a => a.platform === 'facebook');
                if (fb) {
                    const ig = await FacebookAdsService.getInstagramAccounts(config.facebookPageId, fb.access_token);
                    setIgAccounts(ig);
                    if (ig.length > 0) {
                        handleConfigChange('instagramAccountId', ig[0].id);
                    } else {
                        handleConfigChange('instagramAccountId', '');
                    }
                }
            } catch (e) {
                console.error("IG fetch error", e);
            }
        };
        fetchIG();
    }, [config.facebookPageId]);

    const handleConfigChange = (field: string, value: any) => {
        setConfig((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSelectBase = (id: string) => {
        const baseAd = appState.creatives.find(c => c.id === id);
        if (baseAd) {
            setSelectedId(id);
            setLocalAd({ ...baseAd });
            toast.success("Base creative updated");
        }
    };

    const handleFieldChange = (field: keyof AdCreative, value: string) => {
        if (!localAd) return;
        setLocalAd({ ...localAd, [field]: value });
    };

    const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            handleFieldChange('visualConcept', url);
            toast.success("Custom media uploaded");
        }
    };

    // Auto-update parent state
    useEffect(() => {
        if (localAd) {
            onUpdate(localAd, config);
        }
    }, [localAd, config]);

    if (!localAd && appState.creatives.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                <Sparkles size={48} className="text-slate-700 mb-4" />
                <h3 className="text-xl font-bold">No creatives generated yet</h3>
                <p className="max-w-sm">Go back to the Creative Lab to generate concepts.</p>
            </div>
        );
    }

    if (!localAd) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500">Initializing launch control...</p>
            </div>
        );
    }

    const steps = [
        { id: 1, label: 'Campaign Settings', icon: Globe },
        { id: 2, label: 'Ad Set Config', icon: TargetIcon },
        { id: 3, label: 'Brand Identity', icon: User },
        { id: 4, label: 'Creative & Preview', icon: Sparkles }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Wizard Header */}
            <div className="grid grid-cols-4 gap-4 p-2 bg-slate-900/50 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                {steps.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setWizardStep(s.id)}
                        className={`flex flex-col items-center py-4 rounded-xl transition-all duration-300 ${wizardStep === s.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : wizardStep > s.id
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        <s.icon size={20} className="mb-2" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">{s.label}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Configuration Area */}
                <div className="lg:col-span-12 space-y-6">
                    {wizardStep === 1 && (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="text-indigo-400" size={20} />
                                    Campaign Level Settings
                                </CardTitle>
                                <CardDescription>Define your broad campaign goals and budget allocation.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-400">Campaign Name</label>
                                        <Input
                                            value={config.campaignName}
                                            onChange={(e) => handleConfigChange('campaignName', e.target.value)}
                                            className="bg-slate-950 border-slate-800"
                                            placeholder="E.g. Summer Sale 2024"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-400">Objective</label>
                                        <Select value={config.objective} onValueChange={(v) => handleConfigChange('objective', v)}>
                                            <SelectTrigger className="bg-slate-950 border-slate-800 capitalize">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                <SelectItem value="OUTCOME_TRAFFIC">Traffic</SelectItem>
                                                <SelectItem value="OUTCOME_SALES">Sales</SelectItem>
                                                <SelectItem value="OUTCOME_LEADS">Leads</SelectItem>
                                                <SelectItem value="OUTCOME_ENGAGEMENT">Engagement</SelectItem>
                                                <SelectItem value="OUTCOME_AWARENESS">Awareness</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-400">Campaign Budget Type</label>
                                        <Select value={config.campaignBudget.type} onValueChange={(v) => handleConfigChange('campaignBudget', { ...config.campaignBudget, type: v })}>
                                            <SelectTrigger className="bg-slate-950 border-slate-800">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                <SelectItem value="DAILY">Daily Budget</SelectItem>
                                                <SelectItem value="LIFETIME">Lifetime Budget</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-400">Budget Amount ($)</label>
                                        <Input
                                            type="number"
                                            value={config.campaignBudget.amount}
                                            onChange={(e) => handleConfigChange('campaignBudget', { ...config.campaignBudget, amount: parseFloat(e.target.value) })}
                                            className="bg-slate-950 border-slate-800"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-xs font-semibold text-slate-400">Special Ad Categories</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['HOUSING', 'EMPLOYMENT', 'CREDIT', 'ISSUES_ELECTIONS_POLITICS'].map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => {
                                                        const current = config.specialAdCategories || [];
                                                        const next = current.includes(cat)
                                                            ? current.filter((c: string) => c !== cat)
                                                            : [...current, cat];
                                                        handleConfigChange('specialAdCategories', next);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${(config.specialAdCategories || []).includes(cat)
                                                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                                                        : 'bg-slate-950 border-slate-800 text-slate-500'
                                                        }`}
                                                >
                                                    {cat.replace(/_/g, ' ')}
                                                </button>
                                            ))}
                                            {(config.specialAdCategories || []).length === 0 && (
                                                <span className="text-[10px] text-slate-600 italic">None selected (Standard Ads)</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-start gap-3">
                                    <Sparkles className="text-indigo-400 shrink-0 mt-0.5" size={16} />
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Advantage+ campaign budget will distribute your budget across ad sets for better performance.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {wizardStep === 2 && (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TargetIcon className="text-indigo-400" size={20} />
                                    Ad Set Configuration
                                </CardTitle>
                                <CardDescription>Configure conversion locations, performance goals, and tracking.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-400">Ad Set Name</label>
                                        <Input
                                            value={config.adSetName}
                                            onChange={(e) => handleConfigChange('adSetName', e.target.value)}
                                            className="bg-slate-950 border-slate-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-400">Conversion Location</label>
                                        <Select value={config.conversionLocation} onValueChange={(v) => handleConfigChange('conversionLocation', v)}>
                                            <SelectTrigger className="bg-slate-950 border-slate-800">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                <SelectItem value="WEBSITE">Website</SelectItem>
                                                <SelectItem value="MESSAGING_APPS">Messaging Apps</SelectItem>
                                                <SelectItem value="APP">App</SelectItem>
                                                <SelectItem value="ON_AD">On Your Ad</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-400">Performance Goal</label>
                                        <Select value={config.performanceGoal} onValueChange={(v) => handleConfigChange('performanceGoal', v)}>
                                            <SelectTrigger className="bg-slate-950 border-slate-800 capitalize">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                <SelectItem value="LINK_CLICKS">Maximize Link Clicks</SelectItem>
                                                <SelectItem value="OFFSITE_CONVERSIONS">Maximize Conversions</SelectItem>
                                                <SelectItem value="REACH">Maximize Daily Reach</SelectItem>
                                                <SelectItem value="THRUPLAY">Maximize ThruPlay Views</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-400">Dataset / Pixel</label>
                                        <Select value={config.pixelId} onValueChange={(v) => handleConfigChange('pixelId', v)}>
                                            <SelectTrigger className="bg-slate-950 border-slate-800">
                                                <SelectValue placeholder="Select Pixel..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                {datasets.length > 0 ? (
                                                    datasets.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)
                                                ) : (
                                                    <div className="p-4 text-center text-xs text-slate-500">No pixels found</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-400">Start Time</label>
                                        <Input
                                            type="datetime-local"
                                            value={config.startTime}
                                            onChange={(e) => handleConfigChange('startTime', e.target.value)}
                                            className="bg-slate-950 border-slate-800"
                                        />
                                    </div>
                                    <div className="md:col-span-2 pt-6 border-t border-slate-800">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                                <Target size={14} /> Global Audience Targeting
                                            </label>
                                            <Badge variant="outline" className="bg-indigo-500/5 text-indigo-400 border-indigo-500/20 text-[10px]">AI Optimized</Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Locations & Age */}
                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] uppercase font-bold text-slate-500">Target Locations</label>
                                                        <span className="text-[10px] text-slate-600">{config.targeting.locations.length} Selected</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800">
                                                        {config.targeting.locations.map(loc => (
                                                            <span key={loc} className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-300 flex items-center gap-1.5">
                                                                {loc}
                                                                <button
                                                                    onClick={() => handleConfigChange('targeting', {
                                                                        ...config.targeting,
                                                                        locations: config.targeting.locations.filter(l => l !== loc)
                                                                    })}
                                                                    className="hover:text-red-400"
                                                                >
                                                                    &times;
                                                                </button>
                                                            </span>
                                                        ))}
                                                        <input
                                                            placeholder="Add city or country..."
                                                            className="bg-transparent border-none text-[10px] text-slate-400 focus:ring-0 placeholder:text-slate-700 w-32"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    const val = (e.target as HTMLInputElement).value;
                                                                    if (val && !config.targeting.locations.includes(val)) {
                                                                        handleConfigChange('targeting', {
                                                                            ...config.targeting,
                                                                            locations: [...config.targeting.locations, val]
                                                                        });
                                                                        (e.target as HTMLInputElement).value = '';
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500">Demographic Range (Age)</label>
                                                    <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                                        <div className="flex flex-col gap-1 flex-1">
                                                            <span className="text-[9px] text-slate-600 uppercase">Min</span>
                                                            <input
                                                                type="number"
                                                                value={config.targeting.ageMin}
                                                                onChange={(e) => handleConfigChange('targeting', { ...config.targeting, ageMin: parseInt(e.target.value) || 18 })}
                                                                className="bg-transparent border-none text-xs text-slate-300 p-0 focus:ring-0"
                                                            />
                                                        </div>
                                                        <div className="w-px h-8 bg-slate-800" />
                                                        <div className="flex flex-col gap-1 flex-1">
                                                            <span className="text-[9px] text-slate-600 uppercase">Max</span>
                                                            <input
                                                                type="number"
                                                                value={config.targeting.ageMax}
                                                                onChange={(e) => handleConfigChange('targeting', { ...config.targeting, ageMax: parseInt(e.target.value) || 65 })}
                                                                className="bg-transparent border-none text-xs text-slate-300 p-0 focus:ring-0"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Interests & Gender */}
                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] uppercase font-bold text-slate-500">Interests & Behaviors</label>
                                                        <div className="flex items-center gap-2">
                                                            {appState.targeting?.interests && (
                                                                <button
                                                                    onClick={() => handleConfigChange('targeting', { ...config.targeting, interests: appState.targeting!.interests })}
                                                                    className="text-[9px] text-indigo-400 hover:text-indigo-300 underline"
                                                                >
                                                                    Reset to AI
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-slate-950 border border-slate-800 min-h-[100px]">
                                                        {config.targeting.interests.map(interest => (
                                                            <span
                                                                key={interest}
                                                                className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded text-[10px] text-indigo-300 flex items-center gap-1"
                                                            >
                                                                {interest}
                                                                <button
                                                                    onClick={() => handleConfigChange('targeting', {
                                                                        ...config.targeting,
                                                                        interests: config.targeting.interests.filter(i => i !== interest)
                                                                    })}
                                                                    className="hover:text-white"
                                                                >
                                                                    &times;
                                                                </button>
                                                            </span>
                                                        ))}
                                                        <input
                                                            placeholder="Search interests..."
                                                            className="bg-transparent border-none text-[10px] text-slate-400 focus:ring-0 placeholder:text-slate-700 w-24"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    const val = (e.target as HTMLInputElement).value;
                                                                    if (val && !config.targeting.interests.includes(val)) {
                                                                        handleConfigChange('targeting', {
                                                                            ...config.targeting,
                                                                            interests: [...config.targeting.interests, val]
                                                                        });
                                                                        (e.target as HTMLInputElement).value = '';
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500">Gender Identity</label>
                                                    <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                                                        {[
                                                            { id: 0, label: 'All', values: [1, 2] },
                                                            { id: 1, label: 'Men', values: [1] },
                                                            { id: 2, label: 'Women', values: [2] }
                                                        ].map(g => (
                                                            <button
                                                                key={g.id}
                                                                onClick={() => handleConfigChange('targeting', { ...config.targeting, genders: g.values })}
                                                                className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${JSON.stringify(config.targeting.genders) === JSON.stringify(g.values)
                                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                                                    : 'text-slate-500 hover:text-slate-300'
                                                                    }`}
                                                            >
                                                                {g.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {wizardStep === 3 && (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="text-indigo-400" size={20} />
                                    Identity & Social presence
                                </CardTitle>
                                <CardDescription>Select the assets people will see in the ad header.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                            <Facebook size={16} className="text-blue-500" />
                                            Facebook Page
                                        </label>
                                        <div className="grid gap-3">
                                            {pages.map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => handleConfigChange('facebookPageId', p.id)}
                                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${config.facebookPageId === p.id
                                                        ? 'bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500/30'
                                                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                                        }`}
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0">
                                                        {p.id ? (
                                                            <img src={`https://graph.facebook.com/${p.id}/picture?type=large`} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                                                <Facebook size={20} className="text-slate-600" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-bold text-slate-200">{p.name}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase">{p.category}</div>
                                                    </div>
                                                    {config.facebookPageId === p.id && <CheckCircle2 size={16} className="ml-auto text-indigo-400" />}
                                                </button>
                                            ))}
                                            {pages.length === 0 && !isLoadingMeta && (
                                                <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-xl">
                                                    <p className="text-xs text-slate-500">No pages found. Check permissions.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                            <Instagram size={16} className="text-pink-500" />
                                            Instagram Account
                                        </label>
                                        <div className="grid gap-3">
                                            {igAccounts.map((ig) => (
                                                <button
                                                    key={ig.id}
                                                    onClick={() => handleConfigChange('instagramAccountId', ig.id)}
                                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${config.instagramAccountId === ig.id
                                                        ? 'bg-pink-600/10 border-pink-500 ring-1 ring-pink-500/30'
                                                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                                        }`}
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0">
                                                        {ig.profile_picture_url ? (
                                                            <img
                                                                src={ig.profile_picture_url}
                                                                referrerPolicy="no-referrer"
                                                                className="w-full h-full object-cover"
                                                                alt={ig.username}
                                                            />
                                                        ) : (
                                                            <Instagram size={20} className="text-slate-600" />
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-bold text-slate-200">{ig.username || 'Linked Account'}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase">Business Account</div>
                                                    </div>
                                                    {config.instagramAccountId === ig.id && <CheckCircle2 size={16} className="ml-auto text-pink-400" />}
                                                </button>
                                            ))}
                                            {igAccounts.length === 0 && !isLoadingMeta && (
                                                <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-xl">
                                                    <p className="text-xs text-slate-500">Connect Instagram for better reach.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {wizardStep === 4 && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Selection Sidebar (Mini) */}
                            <div className="lg:col-span-3 space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Winning Creatives</h3>
                                <div className="grid gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {appState.creatives.map((c) => {
                                        const prediction = appState.predictions[c.id];
                                        const isSelected = selectedId === c.id;
                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => handleSelectBase(c.id)}
                                                className={`text-left p-3 rounded-lg border transition-all ${isSelected ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-900 border-slate-800'}`}
                                            >
                                                <p className="text-[11px] font-bold line-clamp-1">{c.headline}</p>
                                                <Badge className="mt-2 text-[10px] bg-slate-800">{prediction?.status || 'OPTION'}</Badge>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Editor & Preview */}
                            <div className="lg:col-span-9 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Tabs value={previewPlatform} onValueChange={(v: any) => setPreviewPlatform(v)} className="bg-slate-900 p-1 rounded-lg">
                                            <TabsList className="bg-transparent h-8">
                                                <TabsTrigger value="facebook" className="h-6 text-xs data-[state=active]:bg-blue-600 text-white"><Facebook size={12} className="mr-1" /> FB</TabsTrigger>
                                                <TabsTrigger value="instagram" className="h-6 text-xs data-[state=active]:bg-pink-600 text-white"><Instagram size={12} className="mr-1" /> IG</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                        <div className="flex bg-slate-900 p-1 rounded-lg">
                                            <Button variant="ghost" size="sm" onClick={() => setPreviewDevice('mobile')} className={`h-6 px-3 ${previewDevice === 'mobile' ? 'bg-slate-800' : ''}`}><Smartphone size={14} /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => setPreviewDevice('desktop')} className={`h-6 px-3 ${previewDevice === 'desktop' ? 'bg-slate-800' : ''}`}><Monitor size={14} /></Button>
                                        </div>
                                    </div>
                                    <Button onClick={() => onLaunch(config)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-10 px-8 rounded-full shadow-xl shadow-indigo-600/20">
                                        Launch Campaign <Rocket size={16} className="ml-2" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <Card className="bg-slate-900 border-slate-800">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                    <LayoutIcon size={16} className="text-indigo-400" />
                                                    Creative Source & Format
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-5">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500">Creative source</label>
                                                    <div className="grid gap-2">
                                                        {[
                                                            { id: 'MANUAL', label: 'Manual upload', desc: 'Upload your own media.' },
                                                            { id: 'CATALOG', label: 'Advantage+ catalogue ads', desc: 'Use media from your catalogue.' }
                                                        ].map(source => (
                                                            <button
                                                                key={source.id}
                                                                onClick={() => handleConfigChange('creativeSource', source.id)}
                                                                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${config.creativeSource === source.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                                            >
                                                                <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${config.creativeSource === source.id ? 'border-indigo-500' : 'border-slate-700'}`}>
                                                                    {config.creativeSource === source.id && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-200">{source.label}</p>
                                                                    <p className="text-[10px] text-slate-500">{source.desc}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500">Format</label>
                                                    <div className="grid gap-2">
                                                        {[
                                                            { id: 'SINGLE_IMAGE_VIDEO', label: 'Single image or video' },
                                                            { id: 'CAROUSEL', label: 'Carousel' },
                                                            { id: 'COLLECTION', label: 'Collection' }
                                                        ].map(format => (
                                                            <button
                                                                key={format.id}
                                                                onClick={() => handleConfigChange('adFormat', format.id)}
                                                                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${config.adFormat === format.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                                            >
                                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${config.adFormat === format.id ? 'border-indigo-500' : 'border-slate-700'}`}>
                                                                    {config.adFormat === format.id && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-200">{format.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
                                                    <input
                                                        type="checkbox"
                                                        checked={config.multiAdvertiserAds}
                                                        onChange={(e) => handleConfigChange('multiAdvertiserAds', e.target.checked)}
                                                        className="mt-1 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-200">Multi-advertiser ads</p>
                                                        <p className="text-[10px] text-slate-500">Your ad can appear with others in the same ad unit to help promote discoverability.</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-slate-900 border-slate-800">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                    <LinkIcon size={16} className="text-indigo-400" />
                                                    Destination & Links
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500">Website URL</label>
                                                    <Input
                                                        value={config.websiteUrl}
                                                        onChange={(e) => handleConfigChange('websiteUrl', e.target.value)}
                                                        className="bg-slate-950 border-slate-800"
                                                        placeholder="https://example.com"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500">Display link (optional)</label>
                                                    <Input
                                                        value={config.displayLink}
                                                        onChange={(e) => handleConfigChange('displayLink', e.target.value)}
                                                        className="bg-slate-950 border-slate-800"
                                                        placeholder="example.com"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-slate-900 border-slate-800">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                    <Edit3 size={16} className="text-indigo-400" />
                                                    Ad Copy Editor
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500">Headline</label>
                                                    <Input value={localAd.headline} onChange={(e) => handleFieldChange('headline', e.target.value)} className="bg-slate-950 border-slate-800" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500">Primary Text</label>
                                                    <Textarea value={localAd.caption} onChange={(e) => handleFieldChange('caption', e.target.value)} className="bg-slate-950 border-slate-800 min-h-[120px]" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500">Call to Action</label>
                                                    <Select
                                                        value={localAd.cta || 'LEARN_MORE'}
                                                        onValueChange={(value) => handleFieldChange('cta', value)}
                                                    >
                                                        <SelectTrigger className="bg-slate-950 border-slate-800">
                                                            <SelectValue placeholder="Select Button Text" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                            <SelectItem value="LEARN_MORE">Learn More</SelectItem>
                                                            <SelectItem value="SHOP_NOW">Shop Now</SelectItem>
                                                            <SelectItem value="SIGN_UP">Sign Up</SelectItem>
                                                            <SelectItem value="GET_QUOTE">Get Quote</SelectItem>
                                                            <SelectItem value="CONTACT_US">Contact Us</SelectItem>
                                                            <SelectItem value="BOOK_NOW">Book Now</SelectItem>
                                                            <SelectItem value="DOWNLOAD">Download</SelectItem>
                                                            <SelectItem value="APPLY_NOW">Apply Now</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="pt-4 border-t border-slate-800">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-2 mb-3">
                                                        <ImageIcon size={14} /> Production Assets
                                                    </label>
                                                    <div className="relative group p-6 rounded-xl border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/50 text-center cursor-pointer transition-all">
                                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleMediaUpload} accept="image/*,video/*" />
                                                        <Upload size={24} className="mx-auto text-slate-600 group-hover:text-indigo-400 mb-2" />
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Replace Visual Asset</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Real-time Preview */}
                                    <div className="flex justify-center">
                                        <div className={`${previewDevice === 'mobile' ? 'w-[320px] h-[580px] border-[12px]' : 'w-full h-auto border-t-[20px] border-x-[8px] border-b-[8px]'} border-slate-900 rounded-[40px] shadow-2xl bg-white overflow-hidden relative group`}>
                                            <div className="absolute inset-0 bg-white overflow-y-auto">
                                                {/* FB Mockup */}
                                                {previewPlatform === 'facebook' ? (
                                                    <div className="text-slate-900">
                                                        <div className="p-4 flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-slate-200">
                                                                <img
                                                                    src={`https://graph.facebook.com/${config.facebookPageId}/picture?type=large`}
                                                                    referrerPolicy="no-referrer"
                                                                    className="w-full h-full object-cover rounded-full"
                                                                />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold">{pages.find(p => p.id === config.facebookPageId)?.name || 'Brand Name'}</p>
                                                                <p className="text-[11px] text-slate-500">Sponsored • 🌐</p>
                                                            </div>
                                                        </div>
                                                        <p className="px-4 pb-4 text-sm leading-relaxed whitespace-pre-wrap">{localAd.caption}</p>
                                                        <div className="w-full aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                                                            {localAd.visualConcept.startsWith('blob:') || localAd.visualConcept.startsWith('http') ? (
                                                                <img src={localAd.visualConcept} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <p className="p-10 text-[10px] text-slate-400 font-mono text-center italic">{localAd.visualConcept}</p>
                                                            )}
                                                        </div>
                                                        <div className="p-4 bg-slate-100 flex items-center justify-between border-t border-slate-200">
                                                            <div className="flex-1 pr-4">
                                                                <p className="text-[10px] text-slate-500 uppercase">OstrichAi.AI</p>
                                                                <p className="text-sm font-bold line-clamp-1">{localAd.headline}</p>
                                                            </div>
                                                            <Button size="sm" variant="outline" className="h-8 px-6 text-xs font-bold border-slate-300 pointer-events-none capitalize">{localAd.cta.replace('_', ' ')}</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-900">
                                                        <div className="p-3 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[1px]">
                                                                    <div className="w-full h-full rounded-full bg-white overflow-hidden border-2 border-white">
                                                                        {igAccounts.find(ig => ig.id === config.instagramAccountId)?.profile_picture_url ? (
                                                                            <img
                                                                                src={igAccounts.find(ig => ig.id === config.instagramAccountId)?.profile_picture_url}
                                                                                referrerPolicy="no-referrer"
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full bg-slate-200" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs font-bold">{igAccounts.find(ig => ig.id === config.instagramAccountId)?.username || 'your_handle'}</p>
                                                            </div>
                                                            <div className="text-lg">⋮</div>
                                                        </div>
                                                        <div className="w-full aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                                                            {localAd.visualConcept.startsWith('blob:') || localAd.visualConcept.startsWith('http') ? (
                                                                <img src={localAd.visualConcept} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <p className="p-10 text-[10px] text-slate-400 font-mono text-center italic">{localAd.visualConcept}</p>
                                                            )}
                                                        </div>
                                                        <div className="bg-blue-600 px-4 py-3 flex items-center justify-between text-white">
                                                            <span className="text-sm font-bold capitalize">{localAd.cta.replace('_', ' ')}</span>
                                                            <ChevronRight size={18} />
                                                        </div>
                                                        <div className="p-4 space-y-2">
                                                            <div className="flex gap-4 text-xl"><span>♡</span> <span>💬</span> <span>✈</span></div>
                                                            <div className="text-sm">
                                                                <span className="font-bold mr-2">{localAd.headline}</span>
                                                                {localAd.caption}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Buttons footer */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 z-50 flex justify-center gap-4">
                <Button
                    variant="outline"
                    onClick={() => setWizardStep(prev => Math.max(1, prev - 1))}
                    disabled={wizardStep === 1}
                    className="border-slate-800 hover:bg-slate-900 px-10 h-12 rounded-full"
                >
                    Back
                </Button>
                {wizardStep < 4 ? (
                    <Button
                        onClick={() => setWizardStep(prev => prev + 1)}
                        className="bg-indigo-600 hover:bg-indigo-500 px-10 h-12 rounded-full"
                    >
                        Next Configuration Step
                    </Button>
                ) : (
                    <Button
                        onClick={() => onLaunch(config)}
                        className="bg-indigo-600 hover:bg-indigo-500 px-10 h-12 rounded-full shadow-lg shadow-indigo-600/30 font-bold group"
                    >
                        Finalize & Launch on Meta
                        <Rocket size={18} className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default StepFinalReview;
