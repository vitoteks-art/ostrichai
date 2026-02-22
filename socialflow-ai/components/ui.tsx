import React from 'react';

export const Button = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  icon: Icon
}: { 
  onClick?: () => void; 
  children?: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'; 
  className?: string;
  disabled?: boolean;
  icon?: any;
}) => {
  const baseStyles = "flex items-center justify-center px-4 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base";
  
  const variants = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 focus:ring-primary-500",
    secondary: "bg-slate-800 hover:bg-slate-900 text-white focus:ring-slate-500",
    outline: "border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus:ring-slate-300",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 focus:ring-red-300"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
};

export const Card: React.FC<{ 
  children?: React.ReactNode; 
  className?: string; 
  selected?: boolean; 
  onClick?: () => void; 
}> = ({ children, className = '', selected = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`
      bg-white rounded-xl p-6 border-2 transition-all duration-200
      ${selected ? 'border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/50' : 'border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md'}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
  >
    {children}
  </div>
);

export const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
    </div>
    <p className="text-slate-500 animate-pulse font-medium">AI is thinking...</p>
  </div>
);

export const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
    <div 
      className="bg-primary-500 h-full rounded-full transition-all duration-500 ease-out"
      style={{ width: `${progress}%` }}
    />
  </div>
);

export const FeedbackModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title = "Provide Feedback",
  placeholder 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (feedback: string) => void;
  title?: string;
  placeholder: string;
}) => {
  const [feedback, setFeedback] = React.useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-4">Tell the AI what to change for the next attempt.</p>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 border border-slate-200 rounded-lg mb-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none h-32 text-slate-900 placeholder:text-slate-400"
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSubmit(feedback); setFeedback(''); }}>Regenerate</Button>
        </div>
      </div>
    </div>
  );
};