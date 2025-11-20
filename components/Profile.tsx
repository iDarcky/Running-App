
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { User, Ruler, Scale, Calendar, Footprints, Save, CheckCircle, Smile } from 'lucide-react';

interface ProfileProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, onSaveProfile }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);

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
    
    // Hide success message after 3 seconds
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-8 border-b border-slate-700 pb-6">
                <div className="w-16 h-16 bg-brand-500 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/30">
                    <User size={32} className="text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Athlete Profile</h2>
                    <p className="text-slate-400">Update your biometrics for better AI insights</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Name */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm text-slate-400 font-medium uppercase flex items-center gap-2">
                            <Smile size={16} /> Name
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-4 text-white focus:border-brand-500 outline-none transition-colors"
                                placeholder="e.g. Alex Smith"
                            />
                        </div>
                    </div>

                    {/* Height */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-medium uppercase flex items-center gap-2">
                            <Ruler size={16} /> Height (cm)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={formData.height || ''}
                                onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-4 text-white focus:border-brand-500 outline-none transition-colors"
                                placeholder="e.g. 175"
                            />
                        </div>
                    </div>

                    {/* Weight */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-medium uppercase flex items-center gap-2">
                            <Scale size={16} /> Weight (kg)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.1"
                                value={formData.weight || ''}
                                onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-4 text-white focus:border-brand-500 outline-none transition-colors"
                                placeholder="e.g. 70.5"
                            />
                        </div>
                    </div>

                    {/* Age */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-medium uppercase flex items-center gap-2">
                            <Calendar size={16} /> Age
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={formData.age || ''}
                                onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-4 text-white focus:border-brand-500 outline-none transition-colors"
                                placeholder="e.g. 30"
                            />
                        </div>
                    </div>

                    {/* Sex */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-medium uppercase flex items-center gap-2">
                            <User size={16} /> Sex
                        </label>
                        <div className="relative">
                            <select
                                value={formData.sex}
                                onChange={(e) => handleChange('sex', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-4 text-white focus:border-brand-500 outline-none transition-colors appearance-none"
                            >
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Shoes (Full Width) */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-400 font-medium uppercase flex items-center gap-2">
                        <Footprints size={16} /> Current Running Shoes
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={formData.shoeModel}
                            onChange={(e) => handleChange('shoeModel', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-4 text-white focus:border-brand-500 outline-none transition-colors"
                            placeholder="e.g. Nike Pegasus 40"
                        />
                    </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                   <p className="text-xs text-slate-500">
                     * These details help the AI provide more accurate form analysis and heart rate zones.
                   </p>
                    <button 
                        type="submit"
                        className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all transform active:scale-95 ${
                            saved 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                            : 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                        }`}
                    >
                        {saved ? (
                            <>
                                <CheckCircle size={20} /> Saved
                            </>
                        ) : (
                            <>
                                <Save size={20} /> Save Profile
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default Profile;
