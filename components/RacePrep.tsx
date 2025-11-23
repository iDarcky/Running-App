
import React, { useState } from 'react';
import { Race, Run, UserProfile } from '../types';
import { generateRacePlan } from '../services/geminiService';
import { Flag, Calendar, Clock, Plus, Trash2, BrainCircuit, Loader2, X, Map as MapIcon, Trophy, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface RacePrepProps {
    races: Race[];
    runs: Run[];
    profile: UserProfile;
    onAddRace: (race: Race) => void;
    onDeleteRace: (id: string) => void;
    onUpdateRace: (race: Race) => void;
}

const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;
  
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  lines.forEach((line, index) => {
    const key = `line-${index}`;
    
    // Main Section Headers (##)
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key} className="text-xl font-bold text-surface-on mt-6 mb-3 pb-2 border-b border-outline-variant/20 flex items-center gap-2">
            {line.replace('## ', '')}
        </h2>
      );
      return;
    }

    // Sub Headers (###)
    if (line.startsWith('### ')) {
      elements.push(<h3 key={key} className="text-lg font-bold text-primary mt-4 mb-2">{line.replace('### ', '')}</h3>);
      return;
    }
    
    // Bullet Points
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
       const cleanLine = line.trim().replace(/^[-*]\s/, '');
       const parts = cleanLine.split(/(\*\*.*?\*\*)/g).map((part, i) => {
           if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="text-surface-on font-bold">{part.slice(2, -2)}</strong>;
           return part;
       });
       elements.push(
         <div key={key} className="flex items-start gap-2 mb-2 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
            <div className="text-surface-on-variant text-sm leading-relaxed">{parts}</div>
         </div>
       );
       return;
    }
    
    // Empty lines
    if (line.trim() === '') {
        elements.push(<div key={key} className="h-2"></div>);
        return;
    }
    
    // Standard Paragraphs
    const parts = line.split(/(\*\*.*?\*\*)/g).map((part, i) => {
       if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="text-surface-on font-bold">{part.slice(2, -2)}</strong>;
       return part;
    });
    elements.push(<p key={key} className="text-surface-on-variant mb-2 text-sm leading-relaxed">{parts}</p>);
  });
  
  return <div className="animate-fade-in">{elements}</div>;
};

const RacePrep: React.FC<RacePrepProps> = ({ races, runs, profile, onAddRace, onDeleteRace, onUpdateRace }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const [newRace, setNewRace] = useState<Partial<Race>>({
        name: '',
        date: '',
        distance: 21.1,
        targetTime: ''
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newRace.name || !newRace.date) return;
        
        onAddRace({
            id: Date.now().toString(),
            name: newRace.name,
            date: newRace.date,
            distance: Number(newRace.distance),
            targetTime: newRace.targetTime
        });
        setIsAdding(false);
        setNewRace({ name: '', date: '', distance: 21.1, targetTime: '' });
    };

    const handleGeneratePlan = async (race: Race) => {
        setGeneratingId(race.id);
        setError(null);
        try {
            const plan = await generateRacePlan(race, runs, profile);
            if(plan) {
                onUpdateRace({ ...race, aiPlan: plan });
                setExpandedId(race.id);
            }
        } catch(e: any) {
            setError(e.message || "Failed to generate plan. Please try again.");
        } finally {
            setGeneratingId(null);
        }
    };

    const getDaysUntil = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        return days;
    };

    return (
        <div className="animate-fade-in pb-20">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-surface-on tracking-tight">Race Prep</h2>
                    <p className="text-surface-on-variant text-lg">Upcoming events & strategy</p>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-primary text-primary-on px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform font-bold"
                >
                    <Plus size={20} /> Add Race
                </button>
             </div>

             {isAdding && (
                 <div className="bg-surface-container rounded-[32px] p-6 mb-8 shadow-lg animate-slide-down border border-outline-variant/20">
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="text-lg font-bold text-surface-on">New Event</h3>
                         <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-surface-container-highest rounded-full"><X size={20} /></button>
                     </div>
                     <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                             <label className="text-xs font-bold uppercase text-surface-on-variant ml-2 mb-1 block">Event Name</label>
                             <input 
                                className="w-full bg-surface-container-high p-4 rounded-xl outline-none focus:ring-2 ring-primary text-surface-on font-medium" 
                                placeholder="e.g. Boston Marathon"
                                value={newRace.name}
                                onChange={e => setNewRace({...newRace, name: e.target.value})}
                                required
                            />
                         </div>
                         <div>
                             <label className="text-xs font-bold uppercase text-surface-on-variant ml-2 mb-1 block">Date</label>
                             <input 
                                type="date"
                                className="w-full bg-surface-container-high p-4 rounded-xl outline-none focus:ring-2 ring-primary text-surface-on font-medium" 
                                value={newRace.date}
                                onChange={e => setNewRace({...newRace, date: e.target.value})}
                                required
                            />
                         </div>
                         <div>
                             <label className="text-xs font-bold uppercase text-surface-on-variant ml-2 mb-1 block">Distance (km)</label>
                             <input 
                                type="number" step="0.1"
                                className="w-full bg-surface-container-high p-4 rounded-xl outline-none focus:ring-2 ring-primary text-surface-on font-medium" 
                                value={newRace.distance}
                                onChange={e => setNewRace({...newRace, distance: parseFloat(e.target.value)})}
                                required
                            />
                         </div>
                         <div>
                             <label className="text-xs font-bold uppercase text-surface-on-variant ml-2 mb-1 block">Goal Time (Optional)</label>
                             <input 
                                type="text"
                                className="w-full bg-surface-container-high p-4 rounded-xl outline-none focus:ring-2 ring-primary text-surface-on font-medium" 
                                placeholder="HH:MM:SS"
                                value={newRace.targetTime}
                                onChange={e => setNewRace({...newRace, targetTime: e.target.value})}
                            />
                         </div>
                         <div className="md:col-span-2 pt-2">
                             <button type="submit" className="w-full py-4 bg-primary text-primary-on rounded-full font-bold hover:opacity-90">Save Race</button>
                         </div>
                     </form>
                 </div>
             )}

             <div className="space-y-4">
                 {races.length === 0 ? (
                     <div className="text-center py-20 bg-surface-container rounded-[32px] border border-dashed border-outline-variant/30">
                         <Flag size={48} className="mx-auto mb-4 text-surface-on-variant opacity-50" />
                         <h3 className="text-xl font-bold text-surface-on">No Upcoming Races</h3>
                         <p className="text-surface-on-variant">Add a race to get AI training advice.</p>
                     </div>
                 ) : (
                     races.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(race => {
                         const days = getDaysUntil(race.date);
                         const isPast = days < 0;
                         const isExpanded = expandedId === race.id;

                         return (
                             <div key={race.id} className="bg-surface-container rounded-[24px] overflow-hidden shadow-sm border border-outline-variant/10 transition-all hover:shadow-md">
                                 <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                     <div className="flex items-center gap-4">
                                         <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold shadow-inner ${isPast ? 'bg-surface-container-highest text-surface-on-variant' : 'bg-tertiary-container text-tertiary-on-container'}`}>
                                             <span className="text-xl leading-none">{new Date(race.date).getDate()}</span>
                                             <span className="text-xs uppercase">{new Date(race.date).toLocaleDateString(undefined, {month: 'short'})}</span>
                                         </div>
                                         <div>
                                             <h3 className="text-xl font-bold text-surface-on">{race.name}</h3>
                                             <div className="flex gap-4 mt-1 text-sm text-surface-on-variant font-medium">
                                                 <span className="flex items-center gap-1"><MapIcon size={14} /> {race.distance} km</span>
                                                 <span className="flex items-center gap-1"><Trophy size={14} /> {race.targetTime || 'No time set'}</span>
                                             </div>
                                         </div>
                                     </div>

                                     <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                         <div className="text-right">
                                             <div className="text-2xl font-bold text-primary">{isPast ? 'Done' : days}</div>
                                             <div className="text-xs font-bold text-surface-on-variant uppercase tracking-wider">{isPast ? 'Finished' : 'Days to go'}</div>
                                         </div>
                                         
                                         <div className="flex gap-2">
                                             <button 
                                                onClick={() => setExpandedId(isExpanded ? null : race.id)}
                                                className="p-2 hover:bg-surface-container-highest rounded-full transition-colors"
                                             >
                                                 {isExpanded ? <ChevronUp /> : <ChevronDown />}
                                             </button>
                                             <button 
                                                onClick={() => onDeleteRace(race.id)}
                                                className="p-2 hover:bg-error-container hover:text-error-on-container rounded-full transition-colors text-surface-on-variant"
                                             >
                                                 <Trash2 size={20} />
                                             </button>
                                         </div>
                                     </div>
                                 </div>

                                 {isExpanded && (
                                     <div className="border-t border-outline-variant/10 bg-surface-container-low p-6 animate-slide-down">
                                         {error && generatingId === race.id && (
                                            <div className="mb-4 bg-error-container text-error-on-container p-3 rounded-xl text-sm flex items-center gap-2">
                                                <AlertCircle size={16} /> {error}
                                            </div>
                                         )}
                                         
                                         {!race.aiPlan ? (
                                             <div className="text-center py-8">
                                                 <BrainCircuit className="mx-auto mb-3 text-primary" size={32} />
                                                 <h4 className="font-bold text-surface-on mb-2">AI Training Strategy</h4>
                                                 <p className="text-sm text-surface-on-variant mb-4 max-w-md mx-auto">Generate a personalized high-level strategy for this race based on your recent run history and profile.</p>
                                                 <button 
                                                    onClick={() => handleGeneratePlan(race)}
                                                    disabled={generatingId === race.id}
                                                    className="px-6 py-3 bg-primary text-primary-on rounded-full font-bold text-sm shadow-lg flex items-center gap-2 mx-auto disabled:opacity-70 hover:scale-105 transition-transform"
                                                 >
                                                     {generatingId === race.id ? <Loader2 className="animate-spin" size={16} /> : <BrainCircuit size={16} />}
                                                     Generate Strategy
                                                 </button>
                                             </div>
                                         ) : (
                                             <div>
                                                 <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-bold text-surface-on flex items-center gap-2">
                                                        <BrainCircuit className="text-primary" size={20} /> Training Strategy
                                                    </h4>
                                                    <button 
                                                        onClick={() => handleGeneratePlan(race)}
                                                        className="text-xs font-bold text-primary hover:underline"
                                                    >
                                                        Regenerate
                                                    </button>
                                                 </div>
                                                 <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
                                                     <MarkdownRenderer content={race.aiPlan} />
                                                 </div>
                                             </div>
                                         )}
                                     </div>
                                 )}
                             </div>
                         );
                     })
                 )}
             </div>
        </div>
    );
};

export default RacePrep;
