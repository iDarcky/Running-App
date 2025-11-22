
import React, { useState, useEffect } from 'react';
import { UserProfile, Shoe } from '../types';
import { Input } from './UIComponents';
import { User, Ruler, Scale, Calendar, Footprints, Save, CheckCircle, Smile, LogOut, Lock, ChevronRight, Activity, Mail, AlertTriangle, Trash2, Moon, Sun, Plus, Archive } from 'lucide-react';
import { RedLineLogo } from './Logo';

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
    const [guestName, setGuestName] = useState('');
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
                    <div className="bg-[#090909] w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                        <RedLineLogo className="w-10 h-10 text-[#D32F2F]" />
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

                    <div className="flex flex-col gap-2">
                        <p className="text-xs text-surface-on-variant">Quick Start</p>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Guest Name (Optional)" 
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                className="bg-surface-container-highest px-4 py-2 rounded-xl text-sm flex-1 border-none outline-none focus:ring-1 focus:ring-primary text-surface-on"
                            />
                            <button 
                                type="button"
                                onClick={() => onLogin(guestName.trim() || 'Guest Runner')}
                                className="bg-surface-container-high hover:bg-surface-container-highest text-surface-on px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                            >
                                Go
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Profile: React.FC<ProfileProps> = ({ profile, onSaveProfile, onReset, theme, toggleTheme }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);
  const [isAddingShoe, setIsAddingShoe] = useState(false);
  const [newShoe, setNewShoe] = useState<Partial<Shoe>>({ brand: '', model: '', maxDistance: 800 });

  const isLoggedIn = !!profile.name;

  useEffect(() => {
    // Ensure shoes array exists
    setFormData({
        ...profile,
        shoes: profile.shoes || []
    });
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
    const nameToSave = formData.name.trim() === '' ? 'Runner' : formData.name;
    onSaveProfile({ ...formData, name: nameToSave });
    if (formData.name.trim() === '') setFormData(prev => ({ ...prev, name: 'Runner' }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddShoe = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newShoe.brand || !newShoe.model) return;
      
      const shoe: Shoe = {
          id: Date.now().toString(),
          brand: newShoe.brand,
          model: newShoe.model,
          distance: 0,
          maxDistance: newShoe.maxDistance || 800,
          isRetired: false
      };
      
      const updatedShoes = [...(formData.shoes || []), shoe];
      setFormData(prev => ({ ...prev, shoes: updatedShoes }));
      onSaveProfile({ ...formData, shoes: updatedShoes });
      
      setNewShoe({ brand: '', model: '', maxDistance: 800 });
      setIsAddingShoe(false);
  };

  const handleRetireShoe = (id: string) => {
      const updatedShoes = formData.shoes.map(s => 
          s.id === id ? { ...s, isRetired: !s.isRetired } : s
      );
      setFormData(prev => ({ ...prev, shoes: updatedShoes }));
      onSaveProfile({ ...formData, shoes: updatedShoes });
  };

  const handleDeleteShoe = (id: string) => {
      if(!window.confirm("Delete this shoe? This won't affect past runs.")) return;
      const updatedShoes = formData.shoes.filter(s => s.id !== id);
      setFormData(prev => ({ ...prev, shoes: updatedShoes }));
      onSaveProfile({ ...formData, shoes: updatedShoes });
  };

  const handleLoginSuccess = (name: string) => {
    onSaveProfile({ ...profile, name: name });
  };

  const handleLogout = () => {
      onSaveProfile({
          name: '',
          height: 0,
          weight: 0,
          age: 0,
          sex: '',
          shoeModel: '',
          shoes: []
      });
  };

  if (!isLoggedIn) {
      return <AuthScreen onLogin={handleLoginSuccess} />;
  }

  const activeShoes = formData.shoes?.filter(s => !s.isRetired) || [];
  const retiredShoes = formData.shoes?.filter(s => s.isRetired) || [];

  return (
    <div className="w-full animate-fade-in pb-20">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
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
                            <span className="text-sm text-surface-on-variant font-medium">Shoes Tracked</span>
                            <span className="text-sm font-bold text-surface-on">{formData.shoes?.length || 0}</span>
                        </div>
                    </div>
                </div>

                 {/* Edit Form */}
                <div className="bg-surface-container rounded-[32px] p-8 border border-outline-variant/20 shadow-sm">
                    <h3 className="text-lg font-bold text-surface-on mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-primary" /> Vitals
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input 
                            label="Display Name" 
                            type="text" 
                            value={formData.name || ''} 
                            onChange={(e: any) => handleChange('name', e.target.value)} 
                            icon={User}
                            placeholder="Your Name"
                        />

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
                                    className="block w-full pl-12 pr-4 pt-6 pb-2 bg-surface-container-highest rounded-t-xl border-b border-outline-variant text-surface-on appearance-none focus:border-primary focus:outline-none cursor-pointer font-bold"
                                >
                                    <option value="">Select Sex</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                <label className="absolute left-12 top-1 text-[10px] font-bold uppercase tracking-wider text-surface-on-variant pointer-events-none">Sex</label>
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
                                className="bg-primary text-primary-on px-6 py-3 rounded-full font-bold shadow-lg shadow-primary/25 hover:scale-105 transition-transform flex items-center gap-2"
                            >
                                {saved ? <CheckCircle size={20} /> : <Save size={20} />}
                                {saved ? 'Saved!' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Column - Gear Locker */}
            <div className="lg:col-span-2 bg-surface-container rounded-[32px] p-8 border border-outline-variant/20 shadow-sm flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-surface-on flex items-center gap-2">
                        <Footprints size={20} className="text-primary" /> Gear Locker
                    </h3>
                    <button 
                        onClick={() => setIsAddingShoe(!isAddingShoe)}
                        className="bg-surface-container-highest hover:bg-surface-container-high text-surface-on p-2 rounded-full transition-colors"
                    >
                        {isAddingShoe ? <ChevronRight className="rotate-90" /> : <Plus />}
                    </button>
                </div>

                {isAddingShoe && (
                    <form onSubmit={handleAddShoe} className="bg-surface-container-low p-6 rounded-[24px] mb-6 animate-slide-down border border-primary/20">
                        <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">Add New Kicks</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="md:col-span-1">
                                <Input 
                                    label="Brand" 
                                    value={newShoe.brand}
                                    onChange={(e: any) => setNewShoe({...newShoe, brand: e.target.value})}
                                    placeholder="e.g. Nike"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Input 
                                    label="Model" 
                                    value={newShoe.model}
                                    onChange={(e: any) => setNewShoe({...newShoe, model: e.target.value})}
                                    placeholder="e.g. Pegasus 41"
                                    required
                                />
                            </div>
                            <div className="md:col-span-1">
                                <Input 
                                    label="Max Distance (km)" 
                                    type="number"
                                    value={newShoe.maxDistance}
                                    onChange={(e: any) => setNewShoe({...newShoe, maxDistance: parseInt(e.target.value)})}
                                    placeholder="800"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="bg-primary text-primary-on px-6 py-2 rounded-full font-bold text-sm">
                                Add to Locker
                            </button>
                        </div>
                    </form>
                )}

                <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-2">
                    {activeShoes.length === 0 && !isAddingShoe && (
                        <div className="text-center py-12 border-2 border-dashed border-outline-variant/20 rounded-2xl">
                            <Footprints className="mx-auto mb-2 text-surface-on-variant opacity-50" size={32} />
                            <p className="text-surface-on-variant font-medium">No active shoes.</p>
                            <button onClick={() => setIsAddingShoe(true)} className="text-primary font-bold text-sm mt-2 hover:underline">Add your running shoes</button>
                        </div>
                    )}

                    {activeShoes.map(shoe => {
                        const progress = Math.min(100, (shoe.distance / shoe.maxDistance) * 100);
                        const isNearLimit = progress > 80;
                        const isOverLimit = progress >= 100;

                        return (
                            <div key={shoe.id} className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 transition-all hover:border-outline-variant/30">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-bold text-lg text-surface-on">{shoe.brand} <span className="font-normal opacity-90">{shoe.model}</span></h4>
                                        <div className="text-xs font-bold uppercase text-surface-on-variant tracking-wider mt-1">Active</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleRetireShoe(shoe.id)} 
                                            title="Retire Shoe"
                                            className="p-2 hover:bg-surface-container-high rounded-full text-surface-on-variant transition-colors"
                                        >
                                            <Archive size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteShoe(shoe.id)} 
                                            title="Delete"
                                            className="p-2 hover:bg-error-container hover:text-error-on-container rounded-full text-surface-on-variant transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-surface-on">{shoe.distance.toFixed(1)} km</span>
                                        <span className="text-surface-on-variant">Limit: {shoe.maxDistance} km</span>
                                    </div>
                                    <div className="relative h-2 bg-surface-container-highest rounded-full overflow-hidden">
                                        <div 
                                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${isOverLimit ? 'bg-error' : isNearLimit ? 'bg-[#FFD166]' : 'bg-primary'}`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    {isNearLimit && (
                                        <p className="text-xs font-bold text-[#FFD166] flex items-center gap-1 mt-1">
                                            <AlertTriangle size={12} /> 
                                            {isOverLimit ? 'Max mileage reached. Time to retire?' : 'Approaching mileage limit.'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {retiredShoes.length > 0 && (
                        <div className="pt-6 mt-6 border-t border-outline-variant/10">
                            <h4 className="text-sm font-bold text-surface-on-variant uppercase tracking-wider mb-4">Retired</h4>
                            <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                                {retiredShoes.map(shoe => (
                                    <div key={shoe.id} className="flex justify-between items-center p-4 bg-surface-container-highest rounded-xl">
                                        <div>
                                            <div className="font-bold text-surface-on">{shoe.brand} {shoe.model}</div>
                                            <div className="text-xs text-surface-on-variant">Retire Mileage: {shoe.distance.toFixed(1)} km</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleRetireShoe(shoe.id)}
                                                className="text-xs font-bold text-primary hover:underline"
                                            >
                                                Un-retire
                                            </button>
                                            <button onClick={() => handleDeleteShoe(shoe.id)} className="text-surface-on-variant hover:text-error">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Profile;
