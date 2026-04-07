import React, { useState } from 'react';
import {
  Save,
  X,
  Plus,
  MapPin,
  Clock,
  Calendar,
  Footprints,
  Heart,
  Zap,
  Activity,
  Flag,
  TrendingUp,
  Info,
  History,
  AlignLeft,
  Timer,
  AlertCircle,
  Gauge
} from 'lucide-react';
import { Run, RunType, UserProfile, Shoe } from '../types';
import { RUN_TYPE_COLORS, RUN_TYPE_ORDER } from '../constants';
import { formatPace } from '../utils/formatters';
import { Input, Select, Button } from './UIComponents';

interface RunFormProps {
  initialData?: Run;
  onSubmit: (run: Run) => void;
  isEditing?: boolean;
  profile?: UserProfile;
  onAddShoe?: (shoe: Shoe) => void;
}

export const ActivityForm: React.FC<RunFormProps> = ({ initialData, onSubmit, isEditing = false, profile, onAddShoe }) => {
    const [formData, setFormData] = useState<Partial<Run>>(initialData || {
        date: new Date().toISOString().split('T')[0],
        distance: 10,
        duration: 50,
        pace: '5:00',
        type: 'Easy',
        location: '',
        notes: '',
        avgHr: 140,
        effort: 5,
        cadence: 170,
        elevation: 50,
        shoeId: profile?.shoes?.find(s => s.isDefault)?.id || ''
    });

    const [isCreatingShoe, setIsCreatingShoe] = useState(false);
    const [newShoeBrand, setNewShoeBrand] = useState('');
    const [newShoeModel, setNewShoeModel] = useState('');

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let finalShoeId = formData.shoeId;
        if (isCreatingShoe && newShoeBrand && newShoeModel && onAddShoe) {
            const newShoe: Shoe = {
                id: Date.now().toString(),
                brand: newShoeBrand,
                model: newShoeModel,
                distance: 0,
                maxDistance: 800,
                isDefault: false,
                isRetired: false
            };
            onAddShoe(newShoe);
            finalShoeId = newShoe.id;
        }

        const pace = formatPace(formData.distance || 0, formData.duration || 0);
        onSubmit({
            ...formData,
            pace,
            shoeId: finalShoeId
        } as Run);
    };

    const getRunTypeIcon = (type: RunType) => {
        switch(type) {
            case 'Easy': return <Activity size={16} />;
            case 'Intervals': return <Zap size={16} />;
            case 'Long Run': return <Flag size={16} />;
            case 'Tempo': return <TrendingUp size={16} />;
            case 'Race': return <Trophy size={16} />;
            default: return <Activity size={16} />;
        }
    };

    const Trophy = ({ size, className }: any) => <Activity size={size} className={className} />;

    const availableShoes = profile?.shoes?.filter(s => !s.isRetired) || [];

    return (
        <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Date" type="date" value={formData.date} onChange={(e: any) => setFormData({...formData, date: e.target.value})} icon={Calendar} required />
                <Input label="Location" value={formData.location} onChange={(e: any) => setFormData({...formData, location: e.target.value})} icon={MapPin} placeholder="e.g. Regent's Park" />
                <Input label="Distance (km)" type="number" step="0.01" value={formData.distance} onChange={(e: any) => setFormData({...formData, distance: parseFloat(e.target.value)})} icon={Activity} required />
                <Input label="Duration (min)" type="number" value={formData.duration} onChange={(e: any) => setFormData({...formData, duration: parseInt(e.target.value)})} icon={Timer} required />
            </div>

            <div>
                <label className="block text-[10px] font-bold text-accents-5 uppercase tracking-widest mb-3 ml-1">Run Type</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {RUN_TYPE_ORDER.map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({...formData, type: type as RunType})}
                            className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all ${formData.type === type ? 'bg-accents-1 border-foreground' : 'bg-background border-accents-2 hover:bg-accents-1'}`}
                        >
                            <div className="mb-1.5" style={{ color: formData.type === type ? 'var(--brand-red)' : 'var(--accents-3)' }}>
                                {getRunTypeIcon(type as RunType)}
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${formData.type === type ? 'text-foreground' : 'text-accents-5'}`}>{type}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Avg HR" type="number" value={formData.avgHr} onChange={(e: any) => setFormData({...formData, avgHr: parseInt(e.target.value)})} icon={Heart} />
                <Input label="Cadence" type="number" value={formData.cadence} onChange={(e: any) => setFormData({...formData, cadence: parseInt(e.target.value)})} icon={Footprints} />
                <Input label="Elevation (m)" type="number" value={formData.elevation} onChange={(e: any) => setFormData({...formData, elevation: parseInt(e.target.value)})} icon={TrendingUp} />
            </div>

            <div>
                <label className="block text-[10px] font-bold text-accents-5 uppercase tracking-widest mb-3 ml-1">Effort (1-10)</label>
                <div className="flex items-center gap-4">
                    <input
                        type="range" min="1" max="10" step="1"
                        value={formData.effort}
                        onChange={(e) => setFormData({...formData, effort: parseInt(e.target.value)})}
                        className="flex-1 accent-foreground h-1 bg-accents-2 rounded-full appearance-none cursor-pointer"
                    />
                    <span className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">{formData.effort}</span>
                </div>
            </div>

            {isCreatingShoe ? (
                <div className="p-4 bg-accents-1 rounded-md border border-accents-2 animate-fade-in relative">
                    <button type="button" onClick={() => setIsCreatingShoe(false)} className="absolute top-2 right-2 text-accents-4 hover:text-foreground"><X size={14} /></button>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Add New Gear</p>
                    <div className="grid grid-cols-2 gap-3">
                        <input className="bg-background border border-accents-2 p-2 rounded text-xs outline-none focus:border-foreground" placeholder="Brand" value={newShoeBrand} onChange={e => setNewShoeBrand(e.target.value)} />
                        <input className="bg-background border border-accents-2 p-2 rounded text-xs outline-none focus:border-foreground" placeholder="Model" value={newShoeModel} onChange={e => setNewShoeModel(e.target.value)} />
                    </div>
                </div>
            ) : (
                <Select
                    label="Footwear"
                    value={formData.shoeId || ''}
                    onChange={(e: any) => e.target.value === 'NEW' ? setIsCreatingShoe(true) : setFormData({...formData, shoeId: e.target.value})}
                    options={[
                        { value: '', label: 'Select Shoe...' },
                        ...availableShoes.map(s => ({ value: s.id, label: `${s.brand} ${s.model}` })),
                        { value: 'NEW', label: '+ Add New...' }
                    ]}
                />
            )}

            <div className="relative">
                <label className="block text-[10px] font-bold text-accents-5 uppercase tracking-widest mb-1.5 ml-1">Session Notes</label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="How did it feel?"
                    className="w-full p-3 bg-background rounded-md border border-accents-2 text-sm focus:border-foreground focus:outline-none transition-colors min-h-[100px] resize-none"
                />
            </div>

            <Button type="submit" className="w-full h-12">
                <Save size={18} className="mr-2" /> {isEditing ? 'Update Entry' : 'Log Workout'}
            </Button>
        </form>
    );
};

export default RunForm;
