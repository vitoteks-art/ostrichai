import React from 'react';
import { Type, ListOrdered, Search, FileText, RotateCcw } from 'lucide-react';
import { BlogStep } from '@/types/blogResearch';
import { Button } from '@/components/ui/button';

interface BlogLayoutProps {
  currentStep: BlogStep;
  maxStep: BlogStep;
  onStepChange: (step: BlogStep) => void;
  onReset?: () => void;
  children: React.ReactNode;
  className?: string;
  showReset?: boolean;
}

const steps = [
  { id: BlogStep.TITLE, label: 'Title Generator', icon: Type },
  { id: BlogStep.SECTIONS, label: 'Section Generator', icon: ListOrdered },
  { id: BlogStep.SEO, label: 'SEO Generator', icon: Search },
  { id: BlogStep.CONTENT, label: 'Complete Content', icon: FileText }
];

const BlogLayout: React.FC<BlogLayoutProps> = ({
  currentStep,
  maxStep,
  onStepChange,
  onReset,
  children,
  className,
  showReset = true
}) => {
  const handleReset = onReset || (() => {});
  return (
    <div className={`w-full ${className || ''}`}>
      <div className="flex flex-col lg:flex-row bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/60">
          <div className="p-5 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-white">Blog Research</h2>
            <p className="text-xs text-slate-400 mt-1">4-step content workflow</p>
          </div>
          <nav className="p-4 space-y-2">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isEnabled = step.id <= maxStep;

              return (
                <button
                  key={step.id}
                  onClick={() => isEnabled && onStepChange(step.id)}
                  disabled={!isEnabled}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : isEnabled
                      ? 'text-slate-300 hover:bg-slate-800/60'
                      : 'text-slate-600 cursor-not-allowed opacity-60'
                    }`}
                >
                  <Icon size={16} />
                  <span className="text-sm font-medium">{step.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
            <h3 className="text-base font-semibold text-white">
              {steps.find(step => step.id === currentStep)?.label}
            </h3>
            {showReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
              >
                <RotateCcw size={14} className="mr-2" />
                Start Over
              </Button>
            )}
          </header>
          <div className="p-6">{children}</div>
        </section>
      </div>
    </div>
  );
};

export default BlogLayout;
