
import React, { useState, useEffect } from 'react';
import { Run, RunType, UserProfile } from '../types';
import { RUN_TYPE_ORDER, RUN_TYPE_COLORS } from '../constants';
import { Input, Select } from './UIComponents';
import { Calendar, Activity, Clock, Heart, Footprints, Gauge, AlignLeft, Feather, Flame, Zap, Map, Trophy, BatteryCharging, ChevronDown, Check, Save } from 'lucide-react';

interface RunFormProps {
    initialData?: Partial<Run>;
    onSubmit: (data: Partial<Run>) => void;
    isEditing: boolean;
    profile?: UserProfile;
}

const RunForm: React.FC<RunFormProps> = ({ initialData, onSubmit, isEditing, profile }) => {
    const [formData, setFormData] = useState<Partial<Run>>({
        date: new Date().toISOString().split('T')[0],
        type: RunType.EASY,
        distance: 5,
        duration: 30,
        avgHr: 140,
        rpe: 5,
        cadence: 165,
        strideLength: 1.0,
        source: 'Manual',
        notes: '',
        shoeId: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    // Smart Shoe Selection
    const allShoes = profile?.shoes || [];
    const activeShoes = allShoes.filter(s => !s.isRetired);
    // Include retired shoes if one is already selected (e.g. editing an old run)
    const availableShoes = allShoes.filter(s => !s.isRetired || s.id === formData.shoeId);
    
    const defaultShoe = activeShoes.find(s => s.isDefault);

    useEffect(() => {
        // Only auto-set default if:
        // 1. We are NOT editing an existing run (we don't want to overwrite historical data)
        // 2. No shoe is currently selected in the form
        if (!isEditing && !formData.shoeId) {
            if (defaultShoe) {
                setFormData(prev => ({ ...prev, shoeId: defaultShoe.id }));
            } else if (activeShoes.length === 1) {
                // If only one active shoe exists, select it automatically
                setFormData(prev => ({ ...prev, shoeId: activeShoes[0].id }));
            }
        }
    }, [isEditing, formData.shoeId, activeShoes.length, defaultShoe]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const getRunTypeIcon = (type: RunType) => {
        switch (type) {
          case RunType.EASY: return <Feather size={20} />;
          case RunType.TEMPO: return <Flame size={20} />;
          case RunType.INTERVAL: return <Zap size={20} />;
          case RunType.LONG: return <Map size={20} />;
          case RunType.RACE: return <Trophy size={20} />;
          case RunType.RECOVERY: return <BatteryCharging size={20} />;
          default: return <Activity size={20} />;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="p-6 space-y-6">
                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Input 
                            label="Date" 
                            type="date" 
                            value={formData.date} 
                            onChange={(e: any) => setFormData({...formData, date: e.target.value})} 
                            icon={Calendar}
                            required
                        />
                    </div>
                    <Input 
                        label="Distance (km)" 
                        type="number" step="0.01"
                        value={formData.distance} 
                        onChange={(e: any) => setFormData({...formData, distance: parseFloat(e.target.value)})} 
                        icon={Map}
                        required
                    />
                    <Input 
                        label="Time (min)" 
                        type="number" 
                        value={formData.duration} 
                        onChange={(e: any) => setFormData({...formData, duration: parseInt(e.target.value)})} 
                        icon={Clock}
                        required
                    />
                </div>

                {/* Type Selection */}
                <div>
                    <label className="text-xs font-bold text-surface-on-variant uppercase tracking-wider mb-3 block">Run Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        {RUN_TYPE_ORDER.map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setFormData({...formData, type: type as RunType})}
                                className={`
                                    flex flex-col items-center justify-center p-3 rounded-2xl border transition-all
                                    ${formData.type === type 
                                        ? 'bg-surface-container-highest border-primary shadow-sm' 
                                        : 'bg-surface-container-low border-transparent hover:bg-surface-container-highest'}
                                `}
                            >
                                <div className="mb-1" style={{ color: formData.type === type ? RUN_TYPE_COLORS[type] : 'var(--md-sys-color-on-surface-variant)' }}>
                                    {getRunTypeIcon(type as RunType)}
                                </div>
                                <span className={`text-[10px] font-bold ${formData.type === type ? 'text-surface-on' : 'text-surface-on-variant'}`}>
                                    {type}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Advanced Metrics */}
                <div className="grid grid-cols-2 gap-4">
                     <Input 
                        label="Avg HR (bpm)" 
                        type="number" 
                        value={formData.avgHr} 
                        onChange={(e: any) => setFormData({...formData, avgHr: parseInt(e.target.value)})} 
                        icon={Heart}
                    />
                    <div className="relative">
                        <label className="text-xs font-bold text-surface-on-variant uppercase tracking-wider mb-2 block flex items-center gap-2">
                            <Gauge size={14} /> Effort (RPE)
                        </label>
                        <input 
                            type="range" 
                            min="1" max="10" 
                            value={formData.rpe} 
                            onChange={(e) => setFormData({...formData, rpe: parseInt(e.target.value)})}
                            className="w-full accent-primary h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-surface-on-variant mt-1">
                            <span>Easy (1)</span>
                            <span className="text-primary text-base">{formData.rpe}</span>
                            <span>Max (10)</span>
                        </div>
                    </div>
                     <Input 
                        label="Cadence (spm)" 
                        type="number" 
                        value={formData.cadence} 
                        onChange={(e: any) => setFormData({...formData, cadence: parseInt(e.target.value)})} 
                        icon={Footprints}
                    />
                    
                    {/* Shoe Selector */}
                    <Select 
                        label="Gear"
                        icon={Footprints}
                        value={formData.shoeId || ''}
                        onChange={(e: any) => setFormData({...formData, shoeId: e.target.value})}
                        options={[
                            { value: '', label: 'No Shoe Selected' },
                            ...availableShoes.map(s => ({ 
                                value: s.id, 
                                label: `${s.brand} ${s.model}${s.isDefault ? ' (Primary)' : ''}` 
                            }))
                        ]}
                    />
                </div>

                <div className="relative group">
                    <div className="absolute top-[26px] left-0 pl-4 flex items-center pointer-events-none">
                         <AlignLeft className="text-surface-on-variant/70 group-focus-within:text-primary transition-colors" size={20} />
                    </div>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder="How did it feel?"
                        className="block w-full pl-12 pr-4 pt-6 pb-2 bg-surface-container-highest rounded-xl border-b border-outline-variant/30 focus:border-primary text-surface-on placeholder-surface-on-variant/30 focus:outline-none transition-colors font-medium min-h-[100px] resize-none"
                    />
                    <label className="absolute left-12 top-2 text-surface-on-variant text-[10px] font-bold uppercase tracking-wider pointer-events-none select-none transition-colors group-focus-within:text-primary">
                        Notes
                    </label>
                </div>
            </div>

            <div className="p-6 border-t border-outline-variant/10 mt-auto bg-surface-container">
                <button 
                    type="submit"
                    className="w-full bg-primary text-primary-on py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <Save size={20} />
                    {isEditing ? 'Update Run' : 'Log Run'}
                </button>
            </div>
        </form>
    );
};

export default RunForm;
