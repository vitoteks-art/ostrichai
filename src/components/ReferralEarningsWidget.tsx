import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ReferralService } from '@/services/referralService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const formatMoney = (cents: number, currency: string) => {
  const amount = cents / 100;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
};

const ReferralEarningsWidget: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [referralLink, setReferralLink] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      try {
        const [summaryResult, campaignResult] = await Promise.all([
          ReferralService.getEarningsSummary(),
          ReferralService.getActiveCampaign(),
        ]);

        if (summaryResult.success) {
          setSummary(summaryResult.data);
        }

        if (campaignResult.success && campaignResult.data) {
          const linkResult = await ReferralService.getOrCreateReferralLink(user.id, campaignResult.data.id);
          if (linkResult.success && linkResult.data) {
            setReferralLink(linkResult.data.full_url);
          }
        }
      } catch (error) {
        console.error('Referral widget load error', error);
        toast.error('Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-6 w-40 bg-slate-100 rounded mb-4 animate-pulse" />
        <div className="h-12 w-full bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl overflow-hidden shadow-xl shadow-black/5">
      <div className="p-6 border-b border-slate-200 dark:border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <span className="text-2xl">🎁</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Referral Earnings</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Earn 10% on first payments (30‑day window).</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/referrals" className="px-4 py-2 text-sm font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-all">
            View Details
          </Link>
          <button
            onClick={copyLink}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:shadow-lg hover:shadow-primary/40 transition-all flex items-center gap-2"
          >
            <span className="text-sm">⧉</span>
            Copy Referral Link
          </button>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Your Unique Referral Link</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-primary/30 rounded-lg px-4 py-3">
              <input className="bg-transparent border-none focus:ring-0 text-slate-900 dark:text-primary font-mono text-sm w-full" readOnly value={referralLink || 'No active campaign yet'} />
              <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-primary transition-colors" onClick={copyLink}>content_copy</span>
            </div>
            <Link to="/referrals" className="p-3 bg-slate-100 dark:bg-primary/10 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-primary/20 transition-colors">
              <span>🔗</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <p className="text-xs font-bold text-slate-500 uppercase">Clicks</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{summary?.total_clicks ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <p className="text-xs font-bold text-slate-500 uppercase">Signups</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{summary?.total_signups ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <p className="text-xs font-bold text-slate-500 uppercase">Qualified</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{summary?.total_qualified ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <p className="text-xs font-bold text-slate-500 uppercase">Earned</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {summary ? formatMoney(summary.earned_cents, summary.currency) : '$0.00'}
            </p>
          </div>
        </div>

        <div className="bg-slate-100 dark:bg-black/30 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Available Balance</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {summary ? formatMoney(summary.available_cents, summary.currency) : '$0.00'}
                </span>
                <span className="text-emerald-500">✅</span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-primary/20 hidden md:block" />
            <div className="flex flex-col">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Pending Clearance</p>
              <p className="text-xl font-bold text-slate-600 dark:text-slate-400">
                {summary ? formatMoney(summary.pending_cents, summary.currency) : '$0.00'}
              </p>
            </div>
          </div>
          <Link to="/referrals" className="w-full md:w-auto px-8 py-3 bg-primary text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg shadow-primary/30 text-center">
            Withdraw Funds
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReferralEarningsWidget;
