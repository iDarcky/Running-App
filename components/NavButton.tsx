import React from 'react';

interface NavButtonProps {
    tab: string;
    activeTab: string;
    icon: any;
    label: string;
    onClick: (t: any) => void;
    mobile?: boolean;
}

export const NavButton: React.FC<NavButtonProps> = ({ tab, activeTab, icon: Icon, label, onClick, mobile = false }) => {
    const isActive = activeTab === tab;
    return (
        <button 
            onClick={() => onClick(tab)}
            className={`
                flex items-center transition-all duration-300 group relative
                ${mobile 
                    ? `justify-center flex-col h-16 w-full rounded-2xl ${isActive ? 'text-primary' : 'text-surface-on-variant/60 hover:text-surface-on-variant'}` 
                    : `justify-start gap-3 w-full px-4 py-3 rounded-full mb-2 ${isActive ? 'bg-primary text-primary-on shadow-lg shadow-primary/25 font-bold' : 'text-surface-on-variant hover:bg-surface-container-highest hover:text-surface-on'}`
                }
            `}
        >
            <div className={`transition-transform duration-300 ${isActive && !mobile ? 'scale-110' : ''} ${mobile && isActive ? '-translate-y-4' : ''}`}>
                <Icon size={mobile ? 24 : 20} className={isActive ? 'fill-current' : ''} strokeWidth={mobile && isActive ? 2.5 : 2} />
            </div>
            
            {!mobile && <span>{label}</span>}
            {mobile && (
                <span className={`text-[10px] font-bold transition-all duration-300 absolute bottom-2 leading-none ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    {label}
                </span>
            )}
            
            {!mobile && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
            {mobile && isActive && <div className="absolute top-1.5 w-1 h-1 rounded-full bg-primary"></div>}
        </button>
    );
};
