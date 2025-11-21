
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { User, Ruler, Scale, Calendar, Footprints, Save, CheckCircle, Smile, LogOut, Lock, ChevronRight, Activity, Mail } from 'lucide-react';

interface ProfileProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, onSaveProfile }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);
  
  // Auth State
  const isLoggedIn = !!profile.name;
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginName, setLoginName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'signup' && !loginName.trim()) return;
    
    // For login mode, simulate setting the name if it wasn't provided (e.g. "Runner")
    const nameToUse = loginName.trim() || (authMode === 'login' ? "Runner" : "");
    
    if (nameToUse) {
        onSaveProfile({
            ...profile,
            name: nameToUse
        });
    }
  };

  const handleGuestLogin = () => {
    onSaveProfile({
        ...profile,
        name: 'Guest Runner'
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
      setLoginName('');
      setEmail('');
      setPassword('');
      setAuthMode('login');
  };

  // Login / Signup View
  if (!isLoggedIn) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in p-4">
            <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

                <div className="text-center mb-8 relative z-10">
                    <div className="bg-brand-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
                        <Activity size={32} className="text-brand-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                        {authMode === 'login' ? 'Welcome Back' : 'Join StrideAI'}
                    </h2>
                    <p className="text-slate-400 mt-2 text-sm">
                        {authMode === 'login' 
                            ? 'Sign in to access your training data' 
                            : 'Create your athlete profile to get started'}
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 relative z-10">
                    {authMode === 'signup' && (
                        <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase mb-1 ml-1">Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-500" size={18} />
                                <input 
                                    type="text" 
                                    required={authMode === 'signup'}
                                    value={loginName}
                                    onChange={(e) => setLoginName(e.target.value)}
                                    placeholder="Your Name"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase mb-1 ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="runner@example.com" 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase mb-1 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••" 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        {authMode === 'login' ? 'Sign In' : 'Create Account'}
                        <ChevronRight size={18} />
                    </button>
                </form>

                <div className="mt-6 text-center relative z-10">
                    <p className="text-slate-400 text-sm mb-4">
                        {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
                        <button 
                            onClick={() => {
                                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                                setLoginName('');
                            }}
                            className="text-brand-400 font-medium ml-2 hover:text-brand-300 hover:underline"
                        >
                            {authMode === 'login' ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                    
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-700"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase">Or</span>
                        <div className="flex-grow border-t border-slate-700"></div>
                    </div>

                    <button 
                        onClick={handleGuestLogin}
                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors mt-2 flex items-center justify-center gap-2 mx-auto"
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // Logged In View - Profile Editor
  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="text-brand-400" /> Athlete Profile
        </h2>
        <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700"
        >
            <LogOut size={16} /> Sign Out
        </button>
      </div>
      
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 lg:p-8 shadow-xl">
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-700">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {formData.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <h3 className="text-xl font-bold text-white">{formData.name}</h3>
                <p className="text-slate-400 text-sm">Marathoner in training</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-400 text-xs uppercase font-medium mb-2 flex items-center gap-2">
                <Smile size={14} /> Name
            </label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase font-medium mb-2 flex items-center gap-2">
                <Calendar size={14} /> Age
            </label>
            <input 
              type="number" 
              value={formData.age || ''}
              onChange={e => handleChange('age', parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase font-medium mb-2 flex items-center gap-2">
                <Ruler size={14} /> Height (cm)
            </label>
            <input 
              type="number" 
              value={formData.height || ''}
              onChange={e => handleChange('height', parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase font-medium mb-2 flex items-center gap-2">
                <Scale size={14} /> Weight (kg)
            </label>
            <input 
              type="number" 
              value={formData.weight || ''}
              onChange={e => handleChange('weight', parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase font-medium mb-2 flex items-center gap-2">
                <User size={14} /> Biological Sex
            </label>
            <select 
              value={formData.sex}
              onChange={e => handleChange('sex', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none transition-colors"
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase font-medium mb-2 flex items-center gap-2">
                <Footprints size={14} /> Current Shoe Model
            </label>
            <input 
              type="text" 
              value={formData.shoeModel}
              onChange={e => handleChange('shoeModel', e.target.value)}
              placeholder="e.g. Nike Pegasus 40"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none transition-colors"
            />
          </div>

          <div className="md:col-span-2 pt-4 border-t border-slate-700/50 mt-2">
            <button 
              type="submit" 
              className={`w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-medium transition-all ${
                saved 
                ? 'bg-emerald-500 text-white cursor-default' 
                : 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20'
              }`}
            >
              {saved ? <CheckCircle size={20} /> : <Save size={20} />}
              {saved ? 'Profile Saved' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
