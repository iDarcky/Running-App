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

    if (mobile) {
        return (
            <button
                onClick={() => onClick(tab)}
                className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${isActive ? 'text-primary' : 'text-accents-5 hover:text-foreground'}`}
            >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{label}</span>
            </button>
        );
    }

    return (
        <button 
            onClick={() => onClick(tab)}
            className={`
                flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1
                ${isActive
                    ? 'bg-accents-1 text-foreground'
                    : 'text-accents-5 hover:bg-accents-1 hover:text-foreground'
                }
            `}
        >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            <span>{label}</span>
            {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-primary animate-pulse"></div>}
        </button>
    );
};
