
import React, { useState, useEffect } from 'react';
import { Run, RunType } from '../types';
import { Input } from './UIComponents';
import { Calendar, Activity, Clock, Heart, Footprints, Gauge, AlignLeft } from 'lucide-react';

interface RunFormProps {
    initialData?: Partial<Run>;
    onSubmit: (data: Partial<Run>) => void;
    isEditing: boolean;
}

const RunForm: React.FC<RunFormProps> = ({ initialData, onSubmit, isEditing }) => {
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
        notes: ''
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
                        {Object.values(RunType).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setFormData({...formData, type: t})}
                                className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                                    formData.type === t 
                                    ? 'bg-primary-container text-primary-on-container border-primary shadow-sm' 
                                    : 'bg-surface-container-high text-surface-on-variant border-transparent hover:bg-surface-container-highest'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
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
                        className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-primary rounded-t-xl pl-12 pr-4 py-4 text-surface-on outline-none resize-none h-24 block"
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
