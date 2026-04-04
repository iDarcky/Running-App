import React from 'react';

export const RedLineLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M170 96h100l-50 256h170v80H120V96z" fill="currentColor" />
  </svg>
);

export const RedLineBrand: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizes = {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-4xl'
    };

    return (
        <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 bg-foreground rounded-md flex items-center justify-center transition-transform group-hover:scale-105">
                <RedLineLogo className="w-5 h-5 text-primary" />
            </div>
            <h1 className={`font-bold tracking-tighter text-foreground ${sizes[size]}`}>
                Red<span className="text-primary italic">Line</span>
            </h1>
        </div>
    );
};
