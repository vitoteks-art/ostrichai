import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Facebook, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { getAdAccounts, saveAdAccount, FacebookAdAccount } from '../../services/facebookAdsService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FacebookAdAccountSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    accessToken: string;
    socialAccountId: string;
}

export const FacebookAdAccountSelectorModal: React.FC<FacebookAdAccountSelectorModalProps> = ({
    isOpen,
    onClose,
    accessToken,
    socialAccountId
}) => {
    const { user } = useAuth();
    const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && accessToken) {
            fetchAccounts();
        }
    }, [isOpen, accessToken]);

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const accounts = await getAdAccounts(accessToken);
            setAvailableAccounts(accounts);
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch ad accounts from Facebook");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLinkAccount = async (acc: any) => {
        if (!user?.id) return;
        setIsSaving(acc.id);
        try {
            const result = await saveAdAccount(user.id, socialAccountId, acc);
            if (result.success) {
                toast.success(`Account "${acc.name}" linked successfully!`);
                // Optionally refresh or close after some delay
            } else {
                toast.error(result.error || "Failed to link account");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred while linking account");
        } finally {
            setIsSaving(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 text-white max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Facebook className="text-blue-500" />
                        Link Ad Accounts
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Select the ad accounts you want to manage within the platform.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center py-20 gap-3">
                            <Loader2 className="animate-spin text-blue-500" />
                            <span className="text-sm text-slate-500">Fetching accounts from Meta...</span>
                        </div>
                    ) : availableAccounts.length > 0 ? (
                        <div className="grid gap-3">
                            {availableAccounts.map((acc) => (
                                <div
                                    key={acc.id}
                                    className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm truncate">{acc.name}</div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-slate-500">ID: {acc.id}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                                {acc.currency}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleLinkAccount(acc)}
                                        disabled={!!isSaving}
                                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 px-4"
                                    >
                                        {isSaving === acc.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            'Link Account'
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-20 text-center gap-3">
                            <AlertCircle className="text-slate-600" size={40} />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-400">No ad accounts found</p>
                                <p className="text-xs text-slate-500 max-w-[250px]">
                                    Make sure your Facebook profile has advertiser access to at least one active ad account.
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchAccounts} className="mt-4">
                                <RefreshCw size={14} className="mr-2" /> Retry
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-slate-800 text-slate-400 hover:bg-slate-800 w-full sm:w-auto"
                    >
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
