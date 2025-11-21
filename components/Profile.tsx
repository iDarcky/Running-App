
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Input } from './UIComponents';
import { User, Ruler, Scale, Calendar, Footprints, Save, CheckCircle, Smile, LogOut, Lock, ChevronRight, Activity, Mail, AlertTriangle, Trash2, Moon, Sun } from 'lucide-react';

interface ProfileProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onReset: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Auth Screen Component - Separated to isolate state and rendering
const AuthScreen = ({ onLogin }: { onLogin: (name: string) => void }) => {
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [loginName, setLoginName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (authMode === 'signup' && !loginName.trim()) return;
        
        const nameToUse = loginName.trim() || (authMode === 'login' ? "Runner" : "Runner");
        onLogin(nameToUse);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in p-4">
            <div className="w-full max-w-md bg-surface-container rounded-[32px] p-8 shadow-xl relative overflow-hidden border border-outline-variant/20">
                <div className="text-center mb-8 relative z-10">
                    <div className="bg-black w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Activity size={40} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-surface-on tracking-tight">
                        {authMode === 'login' ? 'Welcome to RedLine' : 'Join RedLine'}
                    </h2>
                    <p className="text-surface-on-variant mt-2">
                        {authMode === 'login' ? 'Sign in to access your training' : 'Create your athlete profile'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    {authMode === 'signup' && (
                        <Input 
                            key="name-input"
                            label="Name" 
                            icon={User} 
                            value={loginName} 
                            onChange={(e: any) => setLoginName(e.target.value)} 
                            required 
                        />
                    )}
                    <Input 
                        key="email-input"
                        label="Email" 
                        icon={Mail} 
                        type="email" 
                        value={email} 
                        onChange={(e: any) => setEmail(e.target.value)} 
                    />
                    <Input 
                        key="password-input"
                        label="Password" 
                        icon={Lock} 
                        type="password" 
                        value={password} 
                        onChange={(e: any) => setPassword(e.target.value)} 
                    />

                    <button 
                        type="submit" 
                        className="w-full bg-primary text-primary-on py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 mt-6"
                    >
                        {authMode === 'login' ? 'Sign In' : 'Create Account'}
                        <ChevronRight size={20} />
                    </button>
                </form>

                <div className="mt-8 text-center relative z-10">
                    <button 
                        type="button"
                        onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                        className="text-primary font-bold text-sm hover:underline transition-colors"
                    >
                        {authMode === 'login' ? "Don't have an account? Sign Up" : "Already a member? Log In"}
                    </button>
                    
                    <div className="my-6 border-t border-outline-variant/30"></div>

                    <button 
                        type="button"
                        onClick={() => onLogin('Guest Runner')}
                        className="text-surface-on-variant text-sm font-medium hover:text-surface-on transition-colors"
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};

const Profile: React.FC<ProfileProps> = ({ profile, onSaveProfile, onReset, theme, toggleTheme }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);
  const isLoggedIn = !!profile.name;

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (field: keyof UserProfile, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLoginSuccess = (name: string) => {
    onSaveProfile({
        ...profile,
        name: name
    });
  };

  const handleLogout = () => {
      onSaveProfile({
          name: '',
          height: 0,
          weight: 0,
          age: 0,
          sex: '',
          shoeModel: ''
      });
  };

  if (!isLoggedIn) {
      return <AuthScreen onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h2 className="text-3xl font-bold text-surface-on tracking-tight">Profile</h2>
                <p className="text-surface-on-variant text-sm">Manage your personal metrics</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={toggleTheme}
                    className="p-3 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-surface-on transition-colors"
                    title="Toggle Theme"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <button 
                    onClick={handleLogout}
                    className="px-6 py-3 rounded-full bg-surface-container-high hover:bg-error-container hover:text-error-on-container transition-colors text-sm font-bold flex items-center gap-2"
                >
                    <LogOut size={16} /> Sign Out
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Avatar Card */}
            <div className="bg-surface-container rounded-[32px] p-8 flex flex-col items-center text-center border border-outline-variant/20 shadow-sm">
                 <div className="w-32 h-32 bg-black text-white dark:bg-white dark:text-black rounded-full flex items-center justify-center text-5xl font-bold mb-6 shadow-lg">
                     {profile.name.charAt(0).toUpperCase()}
                 </div>
                 <h3 className="text-2xl font-bold text-surface-on">{profile.name}</h3>
                 <p className="text-surface-on-variant mt-1">RedLine Athlete</p>
                 
                 <div className="mt-8 w-full space-y-2">
                     <div className="bg-surface-container-low p-3 rounded-xl flex justify-between items-center">
                         <span className="text-sm text-surface-on-variant font-medium">Status</span>
                         <span className="text-sm font-bold text-primary">Active</span>
                     </div>
                     <div className="bg-surface-container-low p-3 rounded-xl flex justify-between items-center">
                         <span className="text-sm text-surface-on-variant font-medium">Member Since</span>
                         <span className="text-sm font-bold text-surface-on">{new Date().getFullYear()}</span>
                     </div>
                 </div>
            </div>

            {/* Edit Form */}
            <div className="md:col-span-2 bg-surface-container rounded-[32px] p-8 border border-outline-variant/20 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                            label="Age" 
                            type="number" 
                            value={formData.age || ''} 
                            onChange={(e: any) => handleChange('age', parseInt(e.target.value))} 
                            icon={Calendar}
                        />
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Smile className="text-surface-on-variant" size={20} />
                            </div>
                            <select 
                                value={formData.sex}
                                onChange={(e) => handleChange('sex', e.target.value)}
                                className="block w-full pl-12 pr-4 pt-6 pb-2 bg-surface-container-highest rounded-t-xl border-b border-outline-variant text-surface-on appearance-none focus:border-primary focus:outline-none cursor-pointer"
                            >
                                <option value="">Select Sex</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            <label className="absolute left-12 top-1 text-xs text-surface-on-variant pointer-events-none">Sex</label>
                        </div>
                        <Input 
                            label="Height (cm)" 
                            type="number" 
                            value={formData.height || ''} 
                            onChange={(e: any) => handleChange('height', parseInt(e.target.value))} 
                            icon={Ruler}
                        />
                        <Input 
                            label="Weight (kg)" 
                            type="number" 
                            value={formData.weight || ''} 
                            onChange={(e: any) => handleChange('weight', parseInt(e.target.value))} 
                            icon={Scale}
                        />
                    </div>
                    
                    <Input 
                        label="Current Shoe Model" 
                        type="text" 
                        value={formData.shoeModel || ''} 
                        onChange={(e: any) => handleChange('shoeModel', e.target.value)} 
                        icon={Footprints}
                        placeholder="e.g. Adidas Adizero Evo SL"
                    />

                    <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                         <button 
                            type="button"
                            onClick={onReset}
                            className="text-error hover:bg-error-container hover:text-error-on-container px-4 py-2 rounded-full transition-colors text-sm font-bold flex items-center gap-2"
                        >
                            <Trash2 size={16} /> Reset Data
                        </button>

                        <button 
                            type="submit"
                            className="bg-primary text-primary-on px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/25 hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            {saved ? <CheckCircle size={20} /> : <Save size={20} />}
                            {saved ? 'Saved!' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};

export default Profile;
