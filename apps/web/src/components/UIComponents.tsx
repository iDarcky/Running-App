import React from 'react';
import { X, Info, ChevronDown } from 'lucide-react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-background rounded-lg p-6 border border-accents-2 transition-all hover:border-accents-3 ${className}`}>
        {children}
    </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'error', size?: 'sm' | 'md' | 'lg' }> = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) => {
    const variants = {
        primary: 'bg-foreground text-background hover:bg-accents-7 border-transparent',
        secondary: 'bg-background text-foreground border-accents-2 hover:border-foreground',
        ghost: 'bg-transparent text-accents-5 hover:text-foreground border-transparent',
        error: 'bg-primary text-white hover:bg-primary/90 border-transparent',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs font-medium h-8',
        md: 'px-4 py-2 text-sm font-medium h-10',
        lg: 'px-6 py-3 text-base font-medium h-12',
    };

    return (
        <button
            className={`inline-flex items-center justify-center rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-accents-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subtext?: string; colorClass?: string; tooltip?: string }> = ({ title, value, icon, subtext, colorClass = 'text-primary', tooltip }) => (
  <Card className="h-full flex flex-col justify-between min-h-[140px]">
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <h3 className="text-accents-5 text-xs font-medium uppercase tracking-widest truncate">{title}</h3>
            {tooltip && (
                <div className="group relative flex items-center" title={tooltip}>
                    <Info size={14} className="text-accents-3 hover:text-foreground cursor-help transition-colors" />
                </div>
            )}
        </div>
        <div className={`p-2 ${colorClass}`}>
          {React.cloneElement(icon as any, { size: 18 })}
        </div>
      </div>
      <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
    </div>
    {subtext && <span className="text-accents-4 text-xs mt-2 block font-medium">{subtext}</span>}
  </Card>
);

export const Input: React.FC<any> = ({ label, icon: Icon, type = "text", value, onChange, placeholder, required = false, className = '', ...props }) => (
    <div className="relative w-full group mb-4">
        {label && <label className="block text-xs font-medium text-accents-5 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
        <div className="relative">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-accents-4">
                    <Icon size={16} />
                </div>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                className={`
                    block w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2
                    bg-background rounded-md border border-accents-2 focus:border-foreground
                    text-foreground placeholder-accents-3 focus:outline-none transition-colors text-sm
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                    ${className}
                `}
                {...props}
            />
        </div>
    </div>
);

export const Select: React.FC<any> = ({ label, icon: Icon, value, onChange, options, className = '' }) => (
    <div className="relative w-full group mb-4">
        {label && <label className="block text-xs font-medium text-accents-5 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
        <div className="relative">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-accents-4">
                    <Icon size={16} />
                </div>
            )}
            <select
                value={value}
                onChange={onChange}
                className={`
                    block w-full ${Icon ? 'pl-10' : 'pl-3'} pr-10 py-2
                    bg-background rounded-md border border-accents-2 text-foreground
                    appearance-none focus:border-foreground focus:outline-none cursor-pointer text-sm transition-colors
                    ${className}
                `}
            >
                {options.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-accents-4">
                <ChevronDown size={14} />
            </div>
        </div>
    </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-fade-in">
          <div className="bg-background w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-accents-2">
            <div className="px-6 py-4 border-b border-accents-2 flex justify-between items-center shrink-0">
               <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
               <button onClick={onClose} className="p-1.5 hover:bg-accents-1 rounded-md text-accents-5 transition-colors">
                 <X size={20} />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                {children}
            </div>
          </div>
        </div>
    );
};
