import React, { useState } from 'react';
import { RedLineBrand } from './Logo';
import { ChevronRight, User, Mail, Lock, Database, PlayCircle } from 'lucide-react';
import { Input, Button } from './UIComponents';

interface LandingPageProps {
  onLogin: (name: string, email: string) => void;
  onGuest: (useDemoData: boolean) => void;
}

type Step = 'welcome' | 'auth' | 'guest-options';

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onGuest }) => {
  const [step, setStep] = useState<Step>('welcome');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = name.trim() || (authMode === 'signup' ? 'Runner' : 'Runner');
    onLogin(displayName, email);
  };

  const renderWelcome = () => (
    <div className="flex flex-col items-center text-center animate-fade-in max-w-lg mx-auto">
        <div className="mb-12">
            <RedLineBrand size="lg" />
        </div>
        
        <h2 className="text-4xl md:text-6xl font-bold text-foreground tracking-tighter mb-6 leading-[1.1]">
            Track your runs.<br />
            <span className="text-accents-5">Beat your best.</span>
        </h2>
        <p className="text-accents-5 text-lg mb-12 leading-relaxed max-w-md mx-auto">
            The minimalist running tracker for athletes who value data over distractions.
        </p>

        <div className="w-full max-w-sm space-y-4">
            <Button
                onClick={() => setStep('auth')}
                className="w-full text-lg h-14"
            >
                Get Started <ChevronRight size={20} className="ml-2" />
            </Button>
            
            <Button
                variant="secondary"
                onClick={() => setStep('guest-options')}
                className="w-full text-lg h-14"
            >
                Continue as Guest
            </Button>
        </div>
    </div>
  );

  const renderAuth = () => (
    <div className="w-full max-w-md mx-auto animate-fade-in">
        <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
                {authMode === 'login' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-accents-5">
                {authMode === 'login' ? 'Sign in to sync your training data' : 'Join the RedLine community'}
            </p>
        </div>

        <form onSubmit={handleAuthSubmit} className="bg-background p-8 rounded-xl border border-accents-2 shadow-sm space-y-4">
            {authMode === 'signup' && (
                <Input 
                    label="Name" 
                    icon={User} 
                    value={name} 
                    onChange={(e: any) => setName(e.target.value)} 
                    required
                    placeholder="Your Name"
                />
            )}
            <Input 
                label="Email" 
                icon={Mail} 
                type="email" 
                value={email} 
                onChange={(e: any) => setEmail(e.target.value)} 
                placeholder="hello@example.com"
            />
            <Input 
                label="Password" 
                icon={Lock} 
                type="password" 
                value={password} 
                onChange={(e: any) => setPassword(e.target.value)} 
                placeholder="••••••••"
            />

            <Button
                type="submit"
                className="w-full mt-6 h-12"
            >
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
        </form>

        <div className="mt-8 text-center space-y-4">
            <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-foreground text-sm font-semibold hover:underline"
            >
                {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
            <div>
                <button onClick={() => setStep('welcome')} className="text-accents-5 text-xs font-medium hover:text-foreground uppercase tracking-widest">
                    Back to Home
                </button>
            </div>
        </div>
    </div>
  );

  const renderGuestOptions = () => (
    <div className="w-full max-w-md mx-auto animate-fade-in text-center">
        <div className="mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Guest Access</h2>
            <p className="text-accents-5">
                Experience RedLine without an account.
            </p>
        </div>

        <div className="space-y-4">
            <button 
                onClick={() => onGuest(false)}
                className="w-full bg-background p-6 rounded-xl border border-accents-2 hover:border-foreground transition-all group text-left flex items-center gap-5"
            >
                <div className="text-accents-3 group-hover:text-foreground transition-colors">
                    <PlayCircle size={28} />
                </div>
                <div>
                    <h3 className="font-bold text-base text-foreground tracking-tight">Start Fresh</h3>
                    <p className="text-sm text-accents-5">Empty dashboard. Ready for your first run.</p>
                </div>
            </button>

            <button 
                onClick={() => { onGuest(true); }}
                className="w-full bg-background p-6 rounded-xl border border-accents-2 hover:border-foreground transition-all group text-left flex items-center gap-5 relative overflow-hidden"
            >   
                <div className="absolute top-0 right-0 bg-foreground text-background text-[10px] font-bold px-3 py-1 uppercase tracking-widest">PRO</div>
                <div className="text-accents-3 group-hover:text-foreground transition-colors">
                    <Database size={28} />
                </div>
                <div>
                    <h3 className="font-bold text-base text-foreground tracking-tight">Demo Mode</h3>
                    <p className="text-sm text-accents-5">Pre-populated with 15+ runs & gear stats.</p>
                </div>
            </button>
        </div>

        <button onClick={() => setStep('welcome')} className="mt-10 text-accents-5 text-xs font-medium hover:text-foreground uppercase tracking-widest">
            Back
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 geist-grid">
        {step === 'welcome' && renderWelcome()}
        {step === 'auth' && renderAuth()}
        {step === 'guest-options' && renderGuestOptions()}
    </div>
  );
};
