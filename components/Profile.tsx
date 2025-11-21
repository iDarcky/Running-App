import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { User, Ruler, Scale, Calendar, Footprints, Save, CheckCircle, Smile, LogOut, Lock, ChevronRight, Activity, Mail, AlertTriangle, Trash2, Moon, Sun } from 'lucide-react';

interface ProfileProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onReset: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Material 3 Input Component - Definition kept simple
const M3Input = ({ label, icon: Icon, type = "text", value, onChange, placeholder, required = false }: any) => (
    <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="text-surface-on-variant" size={20} />
        </div>
        <input
            type={type}
            value={value}
            onChange={onChange}
            required={required}
            placeholder=" "
            className="block w-full pl-12 pr-4 pt-6 pb-2 bg-surface-container-highest rounded-t-xl border-b border-outline-variant text-surface-on placeholder-transparent focus:border-primary focus:ring-0 focus:outline-none transition-colors peer"
        />
        <label className="absolute left-12 top-4 text-surface-on-variant text-xs transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary pointer-events-none">
            {label}
        </label>
        {/* Active Indicator */}
        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-300 peer-focus:w-full"></div>
    </div>
);

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
                    <div className="bg-primary-container w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Activity size={40} className="text-primary-on-container" />
                    </div>
                    <h2 className="text-3xl font-bold text-surface-on tracking-tight">
                        {authMode === 'login' ? 'Welcome Back' : 'Join StrideAI'}
                    </h2>
                    <p className="text-surface-on-variant mt-2">
                        {authMode === 'login' ? 'Sign in to continue' : 'Create your profile'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    {authMode === 'signup' && (
                        <M3Input 
                            key="name-input"
                            label="Name" 
                            icon={User} 
                            value={loginName} 
                            onChange={(e: any) => setLoginName(e.target.value)} 
                            required 
                        />
                    )}
                    <M3Input 
                        key="email-input"
                        label="Email" 
                        icon={Mail} 
                        type="email" 
                        value={email} 
                        onChange={(e: any) => setEmail(e.target.value)} 
                    />
                    <M3Input 
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
                        className="text-primary font-medium text-sm hover:text-primary/80 transition-colors"
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

  // Login View
  if (!isLoggedIn) {
    return <AuthScreen onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-surface-container rounded-[32px] p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-tertiary-container text-tertiary-on-container rounded-full flex items-center justify-center text-4xl font-bold shadow-inner">
                {formData.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <h2 className="text-3xl font-bold text-surface-on tracking-tight">{formData.name}</h2>
                <p className="text-surface-on-variant text-lg">Athlete in Training</p>
            </div>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={toggleTheme}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-surface-container-high text-surface-on hover:bg-surface-container-highest transition-colors border border-outline-variant/20"
            >
                {theme === 'dark' ? <Moon size={20} className="fill-current" /> : <Sun size={20} className="fill-current" />}
                <span className="font-medium hidden sm:inline">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
            <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-error-container text-error-on-container hover:bg-error-container/80 transition-colors"
            >
                <LogOut size={20} /> <span className="font-medium hidden sm:inline">Sign Out</span>
            </button>
        </div>
      </div>

      {/* Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface-container rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <User size={24} />
                </div>
                <h3 className="text-xl font-bold text-surface-on">Personal Details</h3>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <M3Input label="Full Name" icon={Smile} value={formData.name} onChange={(e: any) => handleChange('name', e.target.value)} />
                <M3Input label="Age" icon={Calendar} type="number" value={formData.age || ''} onChange={(e: any) => handleChange('age', parseInt(e.target.value))} />
                <M3Input label="Height (cm)" icon={Ruler} type="number" value={formData.height || ''} onChange={(e: any) => handleChange('height', parseInt(e.target.value))} />
                <M3Input label="Weight (kg)" icon={Scale} type="number" value={formData.weight || ''} onChange={(e: any) => handleChange('weight', parseInt(e.target.value))} />
                
                <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="text-surface-on-variant" size={20} />
                    </div>
                    <select 
                        value={formData.sex}
                        onChange={e => handleChange('sex', e.target.value)}
                        className="block w-full pl-12 pr-4 pt-6 pb-2 bg-surface-container-highest rounded-t-xl border-b border-outline-variant text-surface-on appearance-none focus:border-primary focus:outline-none"
                    >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                    <label className="absolute left-12 top-1 text-xs text-surface-on-variant pointer-events-none">Biological Sex</label>
                </div>

                <M3Input label="Current Shoe Model" icon={Footprints} value={formData.shoeModel} onChange={(e: any) => handleChange('shoeModel', e.target.value)} />

                <div className="md:col-span-2 mt-4">
                    <button 
                        type="submit" 
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-full font-bold text-lg transition-all ${
                            saved 
                            ? 'bg-green-600 text-white shadow-none' 
                            : 'bg-primary text-primary-on shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01]'
                        }`}
                    >
                        {saved ? <CheckCircle size={24} /> : <Save size={24} />}
                        {saved ? 'Saved Successfully' : 'Save Changes'}
                    </button>
                </div>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-error-container/20 border border-error-container rounded-[32px] p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-error mb-4">
                    <AlertTriangle size={24} />
                    <h3 className="text-xl font-bold">Danger Zone</h3>
                </div>
                <p className="text-surface-on-variant text-sm mb-8 leading-relaxed">
                    Resetting the application will permanently delete all your local data, including runs, goals, profile settings, and API connections. This action cannot be undone.
                </p>
              </div>
              <button 
                  type="button"
                  onClick={onReset}
                  className="w-full py-4 bg-error text-error-on rounded-full font-bold shadow-lg shadow-error/20 hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                  <Trash2 size={20} /> Factory Reset
              </button>
          </div>
      </div>
    </div>
  );
};

export default Profile;