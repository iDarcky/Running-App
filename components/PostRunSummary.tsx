import React, { useState } from 'react';
import { Save, Trash2, MapPin, Clock, Activity, Map as MapIcon } from 'lucide-react';
import { formatDuration as formatDurationOriginal, displayDistance, displayPaceFromStr } from '../utils/formatters';

const formatDuration = (seconds: number) => formatDurationOriginal(seconds / 60);

interface PostRunSummaryProps {
  unit: "km" | "mi";
  runData: {
    distance: number;
    duration: number;
    positions: any[];
    calories: number;
    splits?: number[];
  };
  onSave: (runDetails: any) => void;
  onDiscard: () => void;
}

export const PostRunSummary: React.FC<PostRunSummaryProps> = ({ runData, onSave, onDiscard, unit = "km" }) => {
  const [name, setName] = useState('Morning Run');
  const [notes, setNotes] = useState('');
  const [rpe, setRpe] = useState<number>(5);

  const avgPace = runData.distance > 0 ? Math.floor(runData.duration / runData.distance) : 0;

  const handleSave = () => {
    onSave({
      distance: runData.distance,
      duration: runData.duration,
      pace: formatDuration(avgPace),
      rpe,
      notes,
      name,
      positions: runData.positions,
      splits: runData.splits
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-surface overflow-y-auto pb-safe">
      {/* Header Image / Map Placeholder */}
      <div className="h-64 bg-surface-container-high relative w-full flex items-center justify-center">
         {/* In a real app we'd render a static map here or keep the interactive one.
             For simplicity we show an icon/gradient */}
         <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent z-10" />
         <MapIcon size={64} className="text-surface-on/20" />
         <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
            <h1 className="text-2xl font-bold text-surface-on shadow-sm">Run Summary</h1>
         </div>
      </div>

      <div className="px-6 -mt-12 relative z-20">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-3xl font-bold bg-transparent border-none outline-none text-surface-on w-full mb-8 placeholder-surface-on-variant/50 focus:border-b-2 focus:border-primary transition-all"
          placeholder="Name your run"
        />

        {/* Core Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-surface-container p-4 rounded-2xl flex items-center gap-4">
             <div className="p-3 bg-primary/10 text-primary rounded-xl">
                 <MapPin size={24} />
             </div>
             <div>
                <p className="text-surface-on-variant text-sm font-medium">Distance</p>
                <p className="text-2xl font-bold text-surface-on font-mono">{displayDistance(runData.distance, unit)} {unit}</p>
             </div>
          </div>
          <div className="bg-surface-container p-4 rounded-2xl flex items-center gap-4">
             <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                 <Clock size={24} />
             </div>
             <div>
                <p className="text-surface-on-variant text-sm font-medium">Duration</p>
                <p className="text-2xl font-bold text-surface-on font-mono">{formatDuration(runData.duration)}</p>
             </div>
          </div>
          <div className="bg-surface-container p-4 rounded-2xl flex items-center gap-4">
             <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                 <Activity size={24} />
             </div>
             <div>
                <p className="text-surface-on-variant text-sm font-medium">Avg Pace</p>
                <p className="text-2xl font-bold text-surface-on font-mono">{displayPaceFromStr(formatDuration(avgPace), unit)} /{unit}</p>
             </div>
          </div>
          <div className="bg-surface-container p-4 rounded-2xl flex items-center gap-4">
             <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                 <Activity size={24} />
             </div>
             <div>
                <p className="text-surface-on-variant text-sm font-medium">Calories</p>
                <p className="text-2xl font-bold text-surface-on font-mono">{runData.calories}</p>
             </div>
          </div>
        </div>


        {/* Splits */}
        {runData.splits && runData.splits.length > 0 && (
          <div className="mb-12">
            <h3 className="text-lg font-bold text-surface-on mb-4">Splits ({unit})</h3>
            <div className="bg-surface-container rounded-2xl overflow-hidden">
               {runData.splits.map((splitTime, idx) => (
                 <div key={idx} className="flex justify-between p-4 border-b border-surface-container-high last:border-0">
                    <span className="font-bold text-surface-on-variant">{idx + 1}</span>
                    <span className="font-mono font-bold text-surface-on">{formatDurationOriginal ? formatDurationOriginal(splitTime/60) : formatDuration(splitTime)}</span>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* Additional Details */}
        <div className="space-y-6 mb-12">
           <div>
             <label className="block text-sm font-medium text-surface-on-variant mb-2">How did it feel? (RPE: {rpe}/10)</label>
             <input
               type="range"
               min="1"
               max="10"
               value={rpe}
               onChange={(e) => setRpe(Number(e.target.value))}
               className="w-full accent-primary h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
             />
             <div className="flex justify-between text-xs text-surface-on-variant mt-1">
               <span>Very Light</span>
               <span>Max Effort</span>
             </div>
           </div>

           <div>
             <label className="block text-sm font-medium text-surface-on-variant mb-2">Notes</label>
             <textarea
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               className="w-full bg-surface-container p-4 rounded-xl text-surface-on outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
               placeholder="How was the weather? How did your legs feel?"
             />
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pb-8">
           <button
             onClick={onDiscard}
             className="flex-1 py-4 flex items-center justify-center gap-2 rounded-xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
           >
             <Trash2 size={20} /> Discard
           </button>
           <button
             onClick={handleSave}
             className="flex-[2] py-4 flex items-center justify-center gap-2 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all"
           >
             <Save size={20} /> Save Run
           </button>
        </div>
      </div>
    </div>
  );
};

export default PostRunSummary;
