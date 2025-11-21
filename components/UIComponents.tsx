
import React from 'react';
import { X, Info } from 'lucide-react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-surface-container rounded-[24px] p-6 shadow-sm border border-outline-variant/20 transition-all hover:shadow-md ${className}`}>
        {children}
    </div>
);

export const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subtext?: string; colorClass?: string; tooltip?: string }> = ({ title, value, icon, subtext, colorClass = 'bg-primary-container text-primary-on-container', tooltip }) => (
  <Card className="h-full flex flex-col justify-between min-h-[120px]">
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <h3 className="text-surface-on-variant text-xs md:text-sm font-bold uppercase tracking-wider truncate">{title}</h3>
            {tooltip && (
                <div className="group relative flex items-center" title={tooltip}>
                    <Info size={14} className="text-surface-on-variant/50 hover:text-primary cursor-help transition-colors" />
                </div>
            )}
        </div>
        <div className={`p-2 md:p-3 rounded-full ${colorClass} shadow-sm`}>
          {React.cloneElement(icon as any, { size: 20 })}
        </div>
      </div>
      <span className="text-2xl md:text-4xl font-bold text-surface-on tracking-tight">{value}</span>
    </div>
    {subtext && <span className="text-surface-on-variant text-xs mt-2 block font-medium">{subtext}</span>}
  </Card>
);

export const Input: React.FC<any> = ({ label, icon: Icon, type = "text", value, onChange, placeholder, required = false, className = '', ...props }) => (
    <div className={`relative group ${className}`}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {Icon && <Icon className="text-surface-on-variant opacity-70" size={20} />}
        </div>
        <input
            type={type}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            className={`
                block w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 pt-7 pb-2.5 
                bg-surface-container-highest rounded-xl border-b border-outline-variant/30 focus:border-primary 
                text-surface-on placeholder-surface-on-variant/30 focus:outline-none transition-colors font-semibold text-base
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            `}
            {...props}
        />
        <label className={`absolute ${Icon ? 'left-12' : 'left-4'} top-2.5 text-surface-on-variant text-[10px] font-bold uppercase tracking-wider pointer-events-none select-none`}>
            {label}
        </label>
    </div>
);

export const Select: React.FC<any> = ({ label, icon: Icon, value, onChange, options, className = '' }) => (
    <div className={`relative group ${className}`}>
         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {Icon && <Icon className="text-surface-on-variant opacity-70" size={20} />}
        </div>
        <select 
            value={value}
            onChange={onChange}
            className={`
                block w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 pt-7 pb-2.5 
                bg-surface-container-highest rounded-xl border-b border-outline-variant/30 text-surface-on 
                appearance-none focus:border-primary focus:outline-none cursor-pointer font-semibold text-base transition-colors
            `}
        >
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        <label className={`absolute ${Icon ? 'left-12' : 'left-4'} top-2.5 text-surface-on-variant text-[10px] font-bold uppercase tracking-wider pointer-events-none select-none`}>
            {label}
        </label>
    </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container w-full md:max-w-2xl h-[90vh] md:h-auto rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-t border-white/10 md:border-none">
            <div className="px-6 py-5 border-b border-outline-variant/20 flex justify-between items-center shrink-0">
               <h3 className="text-xl font-bold text-surface-on">{title}</h3>
               <button onClick={onClose} className="p-2 hover:bg-surface-container-highest rounded-full text-surface-on-variant transition-colors">
                 <X size={24} />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-safe">
                {children}
            </div>
          </div>
        </div>
    );
};
