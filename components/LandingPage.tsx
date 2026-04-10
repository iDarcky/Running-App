import React from 'react';
import { RedLineBrand } from './Logo';
import { ChevronRight } from 'lucide-react';
import { Button } from './UIComponents';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const renderWelcome = () => (
    <div className="flex flex-col items-center text-center animate-fade-in max-w-lg mx-auto">
        <div className="mb-12">
            <RedLineBrand size="lg" />
        </div>
        
        <h2 className="text-4xl md:text-6xl font-bold text-foreground tracking-tighter mb-6 leading-[1.1]">
            Track your activities.<br />
            <span className="text-accents-5">Beat your best.</span>
        </h2>
        <p className="text-accents-5 text-lg mb-12 leading-relaxed max-w-md mx-auto">
            The minimalist activity tracker for athletes who value data over distractions.
        </p>

        <div className="w-full max-w-sm space-y-4">
            <Button
                onClick={onGetStarted}
                className="w-full text-lg h-14"
            >
                Get Started <ChevronRight size={20} className="ml-2" />
            </Button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 geist-grid">
        {renderWelcome()}
    </div>
  );
};
