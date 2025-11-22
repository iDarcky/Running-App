
import React, { useState } from 'react';
import { RedLineLogo } from './Logo';
import { ChevronRight, User, Mail, Lock, Database, Sparkles, PlayCircle } from 'lucide-react';
import { Input } from './UIComponents';

interface LandingPageProps {
  onLogin: (name: string, email: string) => void;
  onGuest: (useDemoData: boolean) => void;
}

type Step = 'welcome' | 'auth' | 'guest-options';

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onGuest }) => {
  const [step, setStep] = useState<Step>('welcome');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Auth State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = name.trim() || (authMode === 'signup' ? 'Runner' : 'Runner');
    onLogin(displayName, email);
  };

  const renderWelcome = () => (
    <div className="flex flex-col items-center text-center animate-fade-in max-w-md mx-auto">
        <div className="mb-8 relative">
             <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full"></div>
             <div className="bg-[#090909] w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 relative z-10 border border-white/10">
                <RedLineLogo className="w-14 h-14 text-[#D32F2F]" />
             </div>
        </div>
        
        <h1 className="text-5xl font-bold text-surface-on tracking-tighter mb-4">
            Welcome to <span className="text-primary">Red</span>Line
        </h1>
        <p className="text-surface-on-variant text-lg mb-12 leading-relaxed">
            The advanced running tracker that analyzes your training, spots trends, and helps you hit your next PB.
        </p>

        <div className="w-full space-y-4">
            <button 
                onClick={() => setStep('auth')}
                className="w-full bg-primary text-primary-on py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
                Get Started <ChevronRight size={20} />
            </button>
            
            <button 
                onClick={() => setStep('guest-options')}
                className="w-full bg-surface-container-high text-surface-on py-4 rounded-full font-bold text-lg hover:bg-surface-container-highest transition-colors"
            >
                Continue as Guest
            </button>
        </div>
    </div>
  );

  const renderAuth = () => (
    <div className="w-full max-w-md mx-auto animate-slide-down">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-surface-on mb-2">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-surface-on-variant">
                {authMode === 'login' ? 'Sign in to sync your training data' : 'Join the RedLine community'}
            </p>
        </div>

        <form onSubmit={handleAuthSubmit} className="bg-surface-container p-8 rounded-[32px] border border-outline-variant/20 shadow-lg space-y-4">
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

            <button 
                type="submit"
                className="w-full bg-primary text-primary-on py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/25 mt-6 hover:scale-[1.02] transition-transform"
            >
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
        </form>

        <div className="mt-6 text-center space-y-4">
            <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-primary font-bold hover:underline"
            >
                {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
            <div>
                <button onClick={() => setStep('welcome')} className="text-surface-on-variant text-sm font-medium hover:text-surface-on">
                    Back to Home
                </button>
            </div>
        </div>
    </div>
  );

  const renderGuestOptions = () => (
    <div className="w-full max-w-md mx-auto animate-slide-down text-center">
        <div className="mb-8">
            <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-6 text-surface-on">
                <User size={32} />
            </div>
            <h2 className="text-3xl font-bold text-surface-on mb-3">Guest Access</h2>
            <p className="text-surface-on-variant">
                How would you like to start your session?
            </p>
        </div>

        <div className="space-y-4">
            <button 
                onClick={() => onGuest(false)}
                className="w-full bg-surface-container p-6 rounded-[24px] border border-outline-variant/20 hover:border-primary hover:shadow-lg transition-all group text-left flex items-center gap-4"
            >
                <div className="bg-surface-container-highest p-3 rounded-full text-surface-on-variant group-hover:bg-primary group-hover:text-primary-on transition-colors">
                    <PlayCircle size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-surface-on">Start Fresh</h3>
                    <p className="text-sm text-surface-on-variant">Empty dashboard. Ready for your first run.</p>
                </div>
            </button>

            <button 
                onClick={() => onGuest(true)}
                className="w-full bg-surface-container p-6 rounded-[24px] border border-outline-variant/20 hover:border-primary hover:shadow-lg transition-all group text-left flex items-center gap-4 relative overflow-hidden"
            >   
                <div className="absolute top-0 right-0 bg-primary text-primary-on text-[10px] font-bold px-2 py-1 rounded-bl-xl">RECOMMENDED</div>
                <div className="bg-surface-container-highest p-3 rounded-full text-surface-on-variant group-hover:bg-primary group-hover:text-primary-on transition-colors">
                    <Database size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-surface-on">Load Demo Data</h3>
                    <p className="text-sm text-surface-on-variant">Pre-populated with 15+ runs & gear stats.</p>
                </div>
            </button>
        </div>

        <button onClick={() => setStep('welcome')} className="mt-8 text-surface-on-variant text-sm font-medium hover:text-surface-on">
            Back
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        {step === 'welcome' && renderWelcome()}
        {step === 'auth' && renderAuth()}
        {step === 'guest-options' && renderGuestOptions()}
    </div>
  );
};
