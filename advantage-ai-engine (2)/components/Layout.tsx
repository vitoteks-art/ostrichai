import React from 'react';
import { 
  Activity, 
  BrainCircuit, 
  Target, 
  PenTool, 
  BarChart3, 
  Settings,
  TrendingUp
} from 'lucide-react';
import { AppStep } from '../types';

interface LayoutProps {
  currentStep: number;
  maxStep: number;
  onStepChange: (step: number) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentStep, maxStep, onStepChange, children }) => {
  const steps = [
    { id: AppStep.INPUT, label: 'Product Input', icon: Settings },
    { id: AppStep.INTELLIGENCE, label: 'Market Intel', icon: BrainCircuit },
    { id: AppStep.MESSAGING, label: 'Messaging Arch', icon: PenTool },
    { id: AppStep.CREATIVES, label: 'Creative Lab', icon: Activity },
    { id: AppStep.PREDICTION, label: 'Predictive AI', icon: BarChart3 },
    { id: AppStep.TARGETING, label: 'Audience', icon: Target },
    { id: AppStep.OPTIMIZATION, label: 'Optimization', icon: TrendingUp },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            AdVantage AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">Full-Stack Ad Engine</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isAccessible = step.id <= maxStep;
            
            return (
              <button
                key={step.id}
                onClick={() => isAccessible && onStepChange(step.id)}
                disabled={!isAccessible}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                    : isAccessible
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 cursor-pointer' 
                      : 'text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <Icon size={18} className={isActive ? 'animate-pulse' : ''} />
                <span className="font-medium text-sm">{step.label}</span>
                {isCompleted && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System Operational
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-950/80 backdrop-blur-sm z-10">
          <h2 className="text-lg font-semibold text-white">
            {steps.find(s => s.id === currentStep)?.label}
          </h2>
          <div className="flex items-center gap-4">
             {/* Header Actions can go here */}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth relative">
           {/* Background Grid Pattern */}
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
           <div className="relative z-10 max-w-6xl mx-auto">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;