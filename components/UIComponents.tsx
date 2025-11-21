
import React from 'react';
import { X } from 'lucide-react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-surface-container rounded-[24px] p-6 shadow-sm border border-outline-variant/20 transition-all hover:shadow-md ${className}`}>
        {children}
    </div>
);

export const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subtext?: string; colorClass?: string }> = ({ title, value, icon, subtext, colorClass = 'bg-primary-container text-primary-on-container' }) => (
  <Card className="h-full flex flex-col justify-between relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2">
        {React.cloneElement(icon as any, { size: 64 })}
    </div>
    <div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-surface-on-variant text-sm font-medium uppercase tracking-wider truncate pr-2">{title}</h3>
        <div className={`p-3 rounded-full ${colorClass} shadow-sm`}>
          {icon}
        </div>
      </div>
      <span className="text-4xl font-bold text-surface-on tracking-tight relative z-10">{value}</span>
    </div>
    {subtext && <span className="text-surface-on-variant text-xs mt-2 block font-medium relative z-10">{subtext}</span>}
  </Card>
);

export const Input: React.FC<any> = ({ label, icon: Icon, type = "text", value, onChange, placeholder, required = false, className = '', ...props }) => (
    <div className={`relative group ${className}`}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {Icon && <Icon className="text-surface-on-variant" size={20} />}
        </div>
        <input
            type={type}
            value={value}
            onChange={onChange}
            required={required}
            placeholder=" "
            className={`block w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 pt-6 pb-2 bg-surface-container-highest rounded-t-xl border-b border-outline-variant text-surface-on placeholder-transparent focus:border-primary focus:ring-0 focus:outline-none transition-colors peer`}
            {...props}
        />
        <label className={`absolute ${Icon ? 'left-12' : 'left-4'} top-4 text-surface-on-variant text-xs transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary pointer-events-none`}>
            {label}
        </label>
        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-300 peer-focus:w-full"></div>
    </div>
);

export const Select: React.FC<any> = ({ label, icon: Icon, value, onChange, options, className = '' }) => (
    <div className={`relative group ${className}`}>
         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {Icon && <Icon className="text-surface-on-variant" size={20} />}
        </div>
        <select 
            value={value}
            onChange={onChange}
            className={`block w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 pt-6 pb-2 bg-surface-container-highest rounded-t-xl border-b border-outline-variant text-surface-on appearance-none focus:border-primary focus:outline-none cursor-pointer`}
        >
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        <label className={`absolute ${Icon ? 'left-12' : 'left-4'} top-1 text-xs text-surface-on-variant pointer-events-none`}>{label}</label>
    </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container w-full md:max-w-2xl h-[90vh] md:h-auto rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-outline-variant/20 flex justify-between items-center shrink-0">
               <h3 className="text-xl font-bold text-surface-on">{title}</h3>
               <button onClick={onClose} className="p-2 hover:bg-surface-container-highest rounded-full text-surface-on-variant transition-colors">
                 <X size={24} />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
          </div>
        </div>
    );
};
