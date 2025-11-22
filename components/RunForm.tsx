
import React, { useState, useEffect } from 'react';
import { Run, RunType, UserProfile } from '../types';
import { RUN_TYPE_ORDER, RUN_TYPE_COLORS } from '../constants';
import { Input } from './UIComponents';
import { Calendar, Activity, Clock, Heart, Footprints, Gauge, AlignLeft, Feather, Flame, Zap, Map, Trophy, BatteryCharging, ChevronDown } from 'lucide-react';

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
    
    const allShoes = profile?.shoes || [];
    const activeShoes = allShoes.filter(s => !s.isRetired);
    // Show active shoes OR the specific shoe assigned to this run (even if retired) so editing doesn't break
    const availableShoes = allShoes.filter(s => !s.isRetired || s.id === formData.shoeId);
    
    // Default shoe logic
    const defaultShoe = activeShoes.find(s => s.isDefault);

    useEffect(() => {
        // If adding a new run, and no shoe is selected yet
        if (!isEditing && !formData.shoeId) {
            if (defaultShoe) {
                setFormData(prev => ({ ...prev, shoeId: defaultShoe.id }));
            } else if (activeShoes.length === 1) {
                 setFormData(prev => ({ ...prev, shoeId: activeShoes[0].id }));
            }
        }
    }, [isEditing, formData.shoeId, activeShoes.length, defaultShoe]);

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
                        icon={Activity}
                        required
                        className="font-bold text-lg"
                    />
                    <Input 
                        label="Time (min)" 
                        type="number" 
                        value={formData.duration} 
                        onChange={(e: any) => setFormData({...formData, duration: parseFloat(e.target.value)})} 
                        icon={Clock}
                        required
                        className="font-bold text-lg"
                    />
                </div>

                {/* Type Selection */}
                <div>
                    <label className="block text-xs font-bold text-surface-on-variant uppercase tracking-wider mb-2">Run Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        {RUN_TYPE_ORDER.map(t => {
                            const isSelected = formData.type === t;
                            const color = RUN_TYPE_COLORS[t as RunType];
                            
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFormData({...formData, type: t})}
                                    style={{
                                        borderColor: isSelected ? color : 'transparent',
                                        backgroundColor: isSelected ? `${color}20` : undefined,
                                        color: isSelected ? color : undefined,
                                    }}
                                    className={`py-3 px-2 rounded-xl text-xs font-medium border transition-all flex flex-col items-center gap-2 ${
                                        !isSelected ? 'bg-surface-container-high text-surface-on-variant hover:bg-surface-container-highest' : 'shadow-sm'
                                    }`}
                                >
                                    {getRunTypeIcon(t as RunType)}
                                    {t}
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                {/* Shoe Selection */}
                <div className="relative w-full pt-2 group">
                    <div className="absolute top-[26px] left-0 pl-4 flex items-center pointer-events-none">
                        <Footprints className="text-surface-on-variant/70 group-focus-within:text-primary transition-colors" size={20} />
                    </div>
                    <select 
                        value={formData.shoeId || ''}
                        onChange={(e) => setFormData({...formData, shoeId: e.target.value})}
                        className="block w-full pl-12 pr-10 pt-6 pb-2 bg-surface-container-highest rounded-xl border-b border-outline-variant/30 text-surface-on appearance-none focus:border-primary focus:outline-none cursor-pointer font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={availableShoes.length === 0}
                    >
                        <option value="">{availableShoes.length === 0 ? "No active shoes (Add in Profile)" : "Select your kicks..."}</option>
                        {availableShoes.map(shoe => (
                            <option key={shoe.id} value={shoe.id}>
                                {shoe.brand} {shoe.model} {shoe.isRetired ? '(Retired)' : ''} • {shoe.distance.toFixed(0)}km
                                </option>
                        ))}
                    </select>
                    <label className="absolute left-12 top-2 text-surface-on-variant text-[10px] font-bold uppercase tracking-wider pointer-events-none select-none transition-colors group-focus-within:text-primary">
                        Gear Used
                    </label>
                    <div className="absolute top-[26px] right-4 pointer-events-none text-surface-on-variant group-focus-within:text-primary transition-colors">
                        <ChevronDown size={16} />
                    </div>
                </div>

                {/* Advanced Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Input 
                        label="Avg HR" 
                        type="number" 
                        value={formData.avgHr} 
                        onChange={(e: any) => setFormData({...formData, avgHr: parseFloat(e.target.value)})} 
                        icon={Heart}
                    />
                    <Input 
                        label="Cadence" 
                        type="number" 
                        value={formData.cadence || ''} 
                        onChange={(e: any) => setFormData({...formData, cadence: parseFloat(e.target.value)})} 
                        icon={Footprints}
                        placeholder="spm"
                    />
                    <Input 
                        label="RPE (1-10)" 
                        type="number" max="10"
                        value={formData.rpe} 
                        onChange={(e: any) => setFormData({...formData, rpe: parseFloat(e.target.value)})} 
                        icon={Gauge}
                    />
                </div>

                <div className="relative group">
                     <div className="absolute top-4 left-4 pointer-events-none">
                        <AlignLeft className="text-surface-on-variant" size={20} />
                    </div>
                     <textarea 
                        className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-primary rounded-t-xl pl-12 pr-4 pt-8 pb-4 text-surface-on outline-none resize-none h-24 block"
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder=" "
                     />
                     <label className="absolute left-12 top-4 text-surface-on-variant text-xs transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary pointer-events-none">
                        Notes
                    </label>
                     <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-300 peer-focus:w-full"></div>
                </div>
            </div>
            
            <div className="p-6 border-t border-outline-variant/20 bg-surface-container-low mt-auto">
                <button 
                    type="submit"
                    className="w-full py-4 bg-primary text-primary-on rounded-full font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01] transition-all"
                >
                    {isEditing ? 'Update Run' : 'Save Run'}
                </button>
            </div>
        </form>
    );
};

export default RunForm;
