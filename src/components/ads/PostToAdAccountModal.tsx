import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Facebook, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { getAdAccounts, saveAdAccount, getSavedAdAccounts, FacebookAdAccount } from '../../services/facebookAdsService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PostToAdAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLaunch: (adAccountId: string, config: any) => Promise<void>;
    isLaunching: boolean;
}

export const PostToAdAccountModal: React.FC<PostToAdAccountModalProps> = ({
    isOpen,
    onClose,
    onLaunch,
    isLaunching
}) => {
    const { user } = useAuth();
    const [adAccounts, setAdAccounts] = useState<FacebookAdAccount[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'selection' | 'confirmation'>('selection');

    useEffect(() => {
        if (isOpen && user?.id) {
            loadAdAccounts();
        }
    }, [isOpen, user?.id]);

    const loadAdAccounts = async () => {
        setIsLoading(true);
        try {
            // First check if we have results in social_media_accounts to get tokens
            // This is a simplified version; in a real app we'd fetch the specific Facebook token
            const result = await getSavedAdAccounts(user!.id);
            if (result.success && result.data && result.data.length > 0) {
                setAdAccounts(result.data as FacebookAdAccount[]);
                setSelectedId(result.data[0].ad_account_id);
            } else {
                // If none saved, we might need the user to link them first
                // For now, we'll show a message or try to fetch if we have an access token
                // (In this implementation, we assume SocialAccountsManager handles the token part)
            }
        } catch (error) {
            toast.error("Failed to load ad accounts");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!selectedId) {
            toast.error("Please select an ad account");
            return;
        }
        setStep('confirmation');
    };

    const handleLaunch = async () => {
        await onLaunch(selectedId, {});
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Facebook className="text-blue-500" />
                        {step === 'selection' ? 'Select Ad Account' : 'Confirm Launch'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {step === 'selection'
                            ? 'Choose the Facebook Ad Account where you want to deploy this campaign.'
                            : 'Review your campaign details before launching it live on Facebook.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {step === 'selection' ? (
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="flex flex-col items-center py-10 gap-3">
                                    <Loader2 className="animate-spin text-blue-500" />
                                    <span className="text-sm text-slate-500">Fetching ad accounts...</span>
                                </div>
                            ) : adAccounts.length > 0 ? (
                                <div className="grid gap-3">
                                    {adAccounts.map((acc) => (
                                        <button
                                            key={acc.ad_account_id}
                                            onClick={() => setSelectedId(acc.ad_account_id)}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${selectedId === acc.ad_account_id
                                                ? 'bg-blue-600/20 border-blue-500 text-blue-100'
                                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                                }`}
                                        >
                                            <div className="text-left">
                                                <div className="font-bold text-sm">{acc.ad_account_name}</div>
                                                <div className="text-[10px] opacity-60">ID: {acc.ad_account_id}</div>
                                            </div>
                                            {selectedId === acc.ad_account_id && <CheckCircle2 size={18} className="text-blue-500" />}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-slate-950 border border-amber-900/30 p-4 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-amber-200">No Ad Accounts Found</p>
                                        <p className="text-xs text-slate-500">Please connect your Facebook Business account in the Social Dashboard first.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-xl space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Target Ad Account</span>
                                    <span className="text-white font-bold">{adAccounts.find(a => a.ad_account_id === selectedId)?.ad_account_name}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Status</span>
                                    <span className="text-amber-400 font-bold uppercase text-[10px]">Ready to Place</span>
                                </div>
                            </div>

                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                                <Info className="text-blue-400 shrink-0" size={18} />
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    By launching, your ad will be created in your Facebook Ads Manager. You can pause or edit the campaign at any time directly through Meta or this dashboard.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-3">
                    <Button
                        variant="outline"
                        onClick={step === 'selection' ? onClose : () => setStep('selection')}
                        className="border-slate-800 text-slate-400 hover:bg-slate-800"
                        disabled={isLaunching}
                    >
                        {step === 'selection' ? 'Cancel' : 'Back'}
                    </Button>
                    <Button
                        onClick={step === 'selection' ? handleConfirm : handleLaunch}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
                        disabled={isLaunching || (step === 'selection' && adAccounts.length === 0)}
                    >
                        {isLaunching ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={16} />
                                Deploying...
                            </>
                        ) : (
                            step === 'selection' ? 'Continue' : 'Launch Campaign'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
