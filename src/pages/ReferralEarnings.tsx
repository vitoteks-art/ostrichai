import React, { useEffect, useMemo, useState } from 'react';
import { ReferralService } from '@/services/referralService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const formatMoney = (cents: number, currency: string) => {
  const amount = cents / 100;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
};

const ReferralEarnings: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [referralLink, setReferralLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'referrals' | 'rewards' | 'withdrawals'>('referrals');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const [withdrawPayload, setWithdrawPayload] = useState({
    amount_cents: 0,
    method: 'bank',
    payout_details: {} as Record<string, any>
  });
  const [redeemAmount, setRedeemAmount] = useState('');

  const currency = summary?.currency || 'USD';

  const reload = async () => {
    setLoading(true);
    try {
      const [summaryRes, referralsRes, rewardsRes, withdrawalsRes, kycRes, campaignRes] = await Promise.all([
        ReferralService.getEarningsSummary(),
        ReferralService.getEarningsReferrals(),
        ReferralService.getEarningsRewards(),
        ReferralService.getEarningsWithdrawals(),
        ReferralService.getKycStatus(),
        ReferralService.getActiveCampaign(),
      ]);

      if (summaryRes.success) setSummary(summaryRes.data);
      if (referralsRes.success) setReferrals(referralsRes.data || []);
      if (rewardsRes.success) setRewards(rewardsRes.data || []);
      if (withdrawalsRes.success) setWithdrawals(withdrawalsRes.data || []);
      if (kycRes.success) setKycStatus(kycRes.data);

      if (campaignRes.success && campaignRes.data) {
        const linkResult = await ReferralService.getOrCreateReferralLink('"'"'self'"'"', campaignRes.data.id);
        if (linkResult.success && linkResult.data) {
          setReferralLink(linkResult.data.full_url);
        }
      }
    } catch (error) {
      console.error('Referral page load error', error);
      toast.error('Failed to load referral earnings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      reload();
    }
  }, [user]);

  const withdrawDisabled = useMemo(() => {
    return !summary || summary.available_cents < 5000;
  }, [summary]);

  const submitWithdrawal = async () => {
    try {
      if (!kycStatus || kycStatus.status !== 'verified') {
        setShowKyc(true);
        return;
      }

      const result = await ReferralService.requestWithdrawal(withdrawPayload);
      if (!result.success) {
        toast.error(result.error || 'Failed to request withdrawal');
        return;
      }
      toast.success('Withdrawal request submitted');
      setShowWithdraw(false);
      reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to request withdrawal');
    }
  };

  const startKyc = async () => {
    const result = await ReferralService.startKyc({ provider: 'manual' });
    if (result.success) {
      toast.success('KYC started. We will notify you once verified.');
      setShowKyc(false);
      reload();
    } else {
      toast.error(result.error || 'Failed to start KYC');
    }
  };

  const redeemCredits = async () => {
    const amount_cents = Math.round(parseFloat(redeemAmount || '0') * 100);
    if (!amount_cents || amount_cents <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const result = await ReferralService.redeemCredits(amount_cents);
    if (result.success) {
      toast.success('Credits redeemed');
      setRedeemAmount('');
      reload();
    } else {
      toast.error(result.error || 'Failed to redeem credits');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-56 bg-slate-100 rounded mb-4 animate-pulse" />
        <div className="h-48 w-full bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-slate-900 dark:text-slate-100 p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight">Referrals</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Earn 10% of a friend’s first payment if they subscribe within 30 days.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-primary/10 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🔗</span> Share & Link
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Share your referral link and track your rewards.</p>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-2 block">Your Unique Referral Link</span>
                  <div className="flex items-stretch">
                    <input
                      className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-l-lg px-4 py-3 text-primary font-medium focus:ring-1 focus:ring-primary outline-none"
                      readOnly
                      value={referralLink || "Referral link not available"}
                    />
                    <button className="bg-primary hover:bg-primary/90 text-white px-6 rounded-r-lg flex items-center gap-2 transition-all">
                      <span>⧉</span>
                      <span className="hidden sm:inline">Copy</span>
                    </button>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-primary/10 rounded-xl overflow-hidden shadow-sm">
              <div className="flex border-b border-slate-200 dark:border-primary/10 overflow-x-auto no-scrollbar">
                <button className={`px-6 py-4 text-sm font-bold whitespace-nowrap ${activeTab === 'referrals' ? 'border-b-2 border-primary text-primary' : 'text-slate-500'}`} onClick={() => setActiveTab('referrals')}>Referrals List</button>
                <button className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'rewards' ? 'border-b-2 border-primary text-primary' : 'text-slate-500'}`} onClick={() => setActiveTab('rewards')}>Rewards History</button>
                <button className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'withdrawals' ? 'border-b-2 border-primary text-primary' : 'text-slate-500'}`} onClick={() => setActiveTab('withdrawals')}>Withdrawals</button>
              </div>

              {activeTab === 'referrals' && (
                <div className="p-0">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-primary/5 text-slate-600 dark:text-primary/70 uppercase text-[11px] font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Friend</th>
                        <th className="px-6 py-4">Signup Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-primary/10">
                      {referrals.map((ref) => (
                        <tr key={ref.referred_user_id} className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-4 font-medium">{ref.referred_email || '—'}</td>
                          <td className="px-6 py-4 text-slate-500">{new Date(ref.signup_date).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                              {ref.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-primary">
                            {ref.amount_cents ? formatMoney(ref.amount_cents, currency) : '—'}
                          </td>
                        </tr>
                      ))}
                      {referrals.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-6 text-center text-slate-500">No referrals yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'rewards' && (
                <div className="p-0">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-primary/5 text-slate-600 dark:text-primary/70 uppercase text-[11px] font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Reward</th>
                        <th className="px-6 py-4">Friend</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-primary/10">
                      {rewards.map((reward) => (
                        <tr key={reward.id} className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-4">{new Date(reward.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-slate-500">{reward.referred_email || '—'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              {reward.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-primary">
                            {formatMoney(reward.amount_cents, reward.currency)}
                          </td>
                        </tr>
                      ))}
                      {rewards.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-6 text-center text-slate-500">No rewards yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'withdrawals' && (
                <div className="p-0">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-primary/5 text-slate-600 dark:text-primary/70 uppercase text-[11px] font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Method</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-primary/10">
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-4">{new Date(w.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-slate-500">{w.method}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400">
                              {w.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-primary">{formatMoney(w.amount_cents, w.currency)}</td>
                        </tr>
                      ))}
                      {withdrawals.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-6 text-center text-slate-500">No withdrawals yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-primary mb-2">Withdrawal Balance</h3>
                <div className="text-4xl font-black mb-1">{summary ? formatMoney(summary.available_cents, currency) : '$0.00'}</div>
                <p className="text-sm text-slate-400 mb-6">Minimum withdrawal: $50.00</p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: summary ? `${Math.min(100, (summary.available_cents / 5000) * 100)}%` : '0%' }} />
                </div>
                <p className="text-xs text-right font-medium text-primary">{summary ? Math.min(100, (summary.available_cents / 5000) * 100).toFixed(0) : 0}% of threshold reached</p>
                <button
                  className={`w-full mt-6 py-3 px-4 ${withdrawDisabled ? 'bg-primary/20 text-primary cursor-not-allowed opacity-60' : 'bg-primary text-white'} font-bold rounded-lg`}
                  onClick={() => setShowWithdraw(true)}
                  disabled={withdrawDisabled}
                >
                  Withdraw Rewards
                </button>
                <div className="mt-4">
                  <label className="text-xs text-slate-500 uppercase font-bold">Redeem as Credits</label>
                  <div className="flex gap-2 mt-2">
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      placeholder="Amount (USD)"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                    />
                    <button className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-lg" onClick={redeemCredits}>
                      Redeem
                    </button>
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 text-primary/10">
                <span>💰</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-primary/10 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>⚖️</span> Program Rules
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span>✅</span>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Earn <span className="font-bold">10% commission</span> on your friend's first subscription payment.</p>
                </li>
                <li className="flex gap-3">
                  <span>⏱️</span>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Friends must subscribe within <span className="font-bold">30 days</span> of using your link.</p>
                </li>
                <li className="flex gap-3">
                  <span>💳</span>
                  <p className="text-sm text-slate-600 dark:text-slate-300"><span className="font-bold">$50 minimum</span> withdrawal threshold applies.</p>
                </li>
                <li className="flex gap-3">
                  <span>🛡️</span>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Identity verification <span className="font-bold">(KYC)</span> required before withdrawal.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#1c162d] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-primary/30 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-primary/10 flex items-center justify-between">
              <h3 className="text-xl font-bold">Request Withdrawal</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowWithdraw(false)}>
                <span>✖</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">Amount (USD)</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none"
                  type="number"
                  onChange={(e) => setWithdrawPayload({ ...withdrawPayload, amount_cents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">Withdrawal Method</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4"
                  value={withdrawPayload.method}
                  onChange={(e) => setWithdrawPayload({ ...withdrawPayload, method: e.target.value })}
                >
                  <option value="bank">Bank</option>
                  <option value="crypto">Crypto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">Payout Details</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4"
                  rows={3}
                  placeholder="Bank account or wallet details"
                  onChange={(e) => setWithdrawPayload({ ...withdrawPayload, payout_details: { details: e.target.value } })}
                />
              </div>
              <button className="w-full bg-primary text-white font-bold py-3 rounded-xl" onClick={submitWithdrawal}>
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {showKyc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-[#1c162d] w-full max-w-sm rounded-3xl shadow-2xl border border-primary/30 overflow-hidden text-center p-8">
            <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary ring-4 ring-primary/5">
              <span>🛡️</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-3">KYC Required</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Identity verification is required before withdrawals.</p>
            <div className="flex flex-col gap-3">
              <button className="w-full bg-primary text-white font-bold py-4 rounded-xl" onClick={startKyc}>
                Start KYC Now
              </button>
              <button className="w-full bg-transparent text-slate-500 font-semibold py-3 rounded-xl" onClick={() => setShowKyc(false)}>
                I'll do it later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralEarnings;
