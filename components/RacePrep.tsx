import React, { useState } from 'react';
import {
  Flag,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Trophy,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2, Sparkles,
  FlagTriangleRight,
  Target,
  ArrowRight
} from 'lucide-react';
import { Race, Run, UserProfile } from '../types';
import { generateRaceStrategy } from '../services/geminiService';
import { Card, Button, Input, Modal } from './UIComponents';

interface RacePrepProps {
  races: Race[];
  runs: Run[];
  profile: UserProfile;
  onAddRace: (race: Race) => void;
  onUpdateRace: (race: Race) => void;
  onDeleteRace: (id: string) => void;
}

const RacePrep: React.FC<RacePrepProps> = ({ races, runs, profile, onAddRace, onUpdateRace, onDeleteRace }) => {
    const [isAddingRace, setIsAddingRace] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [newRace, setNewRace] = useState<Partial<Race>>({
        name: '',
        date: '',
        distance: 21.1,
        targetTime: ''
    });

    const handleAddRace = (e: React.FormEvent) => {
        e.preventDefault();
        onAddRace({
            ...newRace,
            id: Date.now().toString(),
            aiPlan: ''
        } as Race);
        setIsAddingRace(false);
        setNewRace({ name: '', date: '', distance: 21.1, targetTime: '' });
    };

    const handleGeneratePlan = async (race: Race) => {
        setGeneratingId(race.id);
        setError(null);
        try {
            const plan = await generateRaceStrategy(race, runs, profile);
            onUpdateRace({ ...race, aiPlan: plan });
        } catch (err: any) {
            setError(err.message || 'Failed to generate plan');
        } finally {
            setGeneratingId(null);
        }
    };

    const getDaysUntil = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="animate-fade-in pb-10">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                 <div>
                     <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tighter mb-2">Race Preparation</h2>
                     <p className="text-accents-5 text-base">Plan and strategize for your next finish line.</p>
                 </div>

                 <Button onClick={() => setIsAddingRace(true)}>
                     <Plus size={16} className="mr-1.5" /> Add Race
                 </Button>
             </div>

             <div className="space-y-4">
                 {races.length === 0 ? (
                     <div className="text-center py-20 bg-accents-1 rounded-xl border border-accents-2 border-dashed">
                         <Flag size={48} className="mx-auto mb-4 text-accents-3" />
                         <p className="text-accents-5 font-medium mb-6">No upcoming races planned.</p>
                         <Button variant="secondary" onClick={() => setIsAddingRace(true)}>Add your first race</Button>
                     </div>
                 ) : (
                     races.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(race => {
                         const days = getDaysUntil(race.date);
                         const isPast = days < 0;
                         const isExpanded = expandedId === race.id;

                         return (
                             <Card key={race.id} className="p-0 overflow-hidden hover:border-accents-3">
                                 <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                     <div className="flex items-center gap-5">
                                         <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center border shrink-0 ${isPast ? 'bg-accents-1 border-accents-2 grayscale' : 'bg-foreground border-foreground text-background shadow-lg shadow-black/10'}`}>
                                             <span className="text-xs font-bold uppercase leading-none mb-1 opacity-70">{new Date(race.date).toLocaleDateString(undefined, {month: 'short'})}</span>
                                             <span className="text-xl font-bold leading-none">{new Date(race.date).getDate()}</span>
                                         </div>
                                         <div>
                                             <h3 className="text-xl font-bold text-foreground tracking-tight mb-1">{race.name}</h3>
                                             <div className="flex gap-4 text-[10px] font-bold text-accents-5 uppercase tracking-widest">
                                                 <span className="flex items-center gap-1.5"><MapPin size={12} /> {race.distance} km</span>
                                                 {race.targetTime && <span className="flex items-center gap-1.5"><Target size={12} /> {race.targetTime}</span>}
                                             </div>
                                         </div>
                                     </div>

                                     <div className="flex items-center justify-between md:justify-end gap-10 w-full md:w-auto border-t md:border-none pt-4 md:pt-0">
                                         <div className="text-right">
                                             <p className="text-2xl font-bold text-foreground tracking-tighter leading-none mb-1">{isPast ? 'Finished' : days}</p>
                                             <p className="text-[10px] font-bold text-accents-5 uppercase tracking-widest">{isPast ? 'Status' : 'Days to go'}</p>
                                         </div>
                                         <div className="flex gap-2">
                                             <Button variant="ghost" size="sm" onClick={() => setExpandedId(isExpanded ? null : race.id)}>
                                                 {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                             </Button>
                                             <Button variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={() => onDeleteRace(race.id)}>
                                                 <Trash2 size={18} />
                                             </Button>
                                         </div>
                                     </div>
                                 </div>

                                 {isExpanded && (
                                     <div className="border-t border-accents-2 bg-accents-1/30 p-6 animate-fade-in">
                                         {!race.aiPlan ? (
                                             <div className="text-center py-10 bg-background border border-accents-2 border-dashed rounded-lg">
                                                 <BrainCircuit className="mx-auto mb-4 text-primary" size={32} />
                                                 <h4 className="font-bold text-foreground mb-2">Generate Race Strategy</h4>
                                                 <p className="text-xs text-accents-5 max-w-sm mx-auto mb-6">Our AI will analyze your recent training history to provide a high-level strategy for this specific distance.</p>
                                                 <Button
                                                    onClick={() => handleGeneratePlan(race)}
                                                    disabled={generatingId === race.id}
                                                 >
                                                     {generatingId === race.id ? <Loader2 className="animate-spin mr-2" size={16} /> : <Sparkles className="mr-2" size={16} />}
                                                     Analyze Performance
                                                 </Button>
                                             </div>
                                         ) : (
                                             <div className="space-y-6">
                                                 <div className="flex justify-between items-center">
                                                    <h4 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                                        <BrainCircuit className="text-primary" size={16} /> Training Strategy
                                                    </h4>
                                                    <button 
                                                        onClick={() => handleGeneratePlan(race)}
                                                        className="text-[10px] font-bold text-accents-4 hover:text-foreground uppercase tracking-widest transition-colors"
                                                    >
                                                        Regenerate
                                                    </button>
                                                 </div>
                                                 <Card className="bg-background border-accents-2">
                                                     <div className="prose prose-sm dark:prose-invert max-w-none text-accents-6 leading-relaxed whitespace-pre-wrap">
                                                         {race.aiPlan}
                                                     </div>
                                                 </Card>
                                             </div>
                                         )}
                                     </div>
                                 )}
                             </Card>
                         );
                     })
                 )}
             </div>

             <Modal isOpen={isAddingRace} onClose={() => setIsAddingRace(false)} title="New Race Goal">
                 <form onSubmit={handleAddRace} className="space-y-4">
                     <Input label="Event Name" value={newRace.name} onChange={(e: any) => setNewRace({...newRace, name: e.target.value})} required placeholder="e.g. London Marathon" />
                     <Input label="Event Date" type="date" value={newRace.date} onChange={(e: any) => setNewRace({...newRace, date: e.target.value})} required />
                     <Input label="Distance (km)" type="number" step="0.1" value={newRace.distance} onChange={(e: any) => setNewRace({...newRace, distance: parseFloat(e.target.value)})} required />
                     <Input label="Goal Time (Optional)" value={newRace.targetTime} onChange={(e: any) => setNewRace({...newRace, targetTime: e.target.value})} placeholder="HH:MM:SS" />
                     <Button type="submit" className="w-full mt-4">Add Race</Button>
                 </form>
             </Modal>
        </div>
    );
};

export default RacePrep;
