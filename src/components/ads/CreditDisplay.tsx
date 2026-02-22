import React from 'react';
import { Coins } from 'lucide-react';

interface CreditDisplayProps {
    balance: number;
    stepCost: number;
    stepName: string;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({ balance, stepCost, stepName }) => {
    const afterDeduction = balance - stepCost;
    const insufficient = afterDeduction < 0;

    return (
        <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-2 rounded-lg">
                        <Coins className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Your Credit Balance</p>
                        <p className="text-2xl font-bold text-white">{balance.toLocaleString()} credits</p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">{stepName} Cost</p>
                    <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${insufficient ? 'text-red-400' : 'text-emerald-400'}`}>
                            -{stepCost} credits
                        </span>
                        {!insufficient ? (
                            <span className="text-xs text-slate-500">
                                → {afterDeduction.toLocaleString()} remaining
                            </span>
                        ) : (
                            <span className="text-xs text-red-400 font-semibold">
                                Insufficient credits
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
