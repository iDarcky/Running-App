
import React, { useState } from 'react';
import { Run, RunType, RunSource } from '../types';
import { Plus, Trash2, MapPin, Clock, Heart, Activity, Watch, Smartphone, Footprints, Filter } from 'lucide-react';

interface RunLogProps {
  runs: Run[];
  onAddRun: (run: Run) => void;
  onDeleteRun: (id: string) => void;
}

const RunLog: React.FC<RunLogProps> = ({ runs, onAddRun, onDeleteRun }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterType, setFilterType] = useState<RunType | 'All'>('All');

  const [newRun, setNewRun] = useState<Partial<Run>>({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const run: Run = {
      id: Date.now().toString(),
      date: newRun.date!,
      distance: Number(newRun.distance),
      duration: Number(newRun.duration),
      type: newRun.type as RunType,
      avgHr: Number(newRun.avgHr),
      rpe: Number(newRun.rpe),
      cadence: newRun.cadence ? Number(newRun.cadence) : undefined,
      strideLength: newRun.strideLength ? Number(newRun.strideLength) : undefined,
      source: 'Manual',
      notes: newRun.notes || ''
    };
    onAddRun(run);
    setIsFormOpen(false);
  };

  const simulateSync = (source: RunSource) => {
    setIsSyncing(true);
    // Simulate network request delay
    setTimeout(() => {
        const mockRun: Run = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            distance: Number((Math.random() * 10 + 3).toFixed(2)),
            duration: Math.floor(Math.random() * 40 + 20),
            type: RunType.EASY,
            avgHr: Math.floor(Math.random() * 40 + 130),
            rpe: Math.floor(Math.random() * 4 + 4),
            cadence: Math.floor(Math.random() * 20 + 160),
            strideLength: Number((Math.random() * 0.3 + 0.8).toFixed(2)),
            source: source,
            notes: `Imported from ${source}`
        };
        onAddRun(mockRun);
        setIsSyncing(false);
    }, 1500);
  };

  const sortedRuns = [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const filteredRuns = filterType === 'All' 
    ? sortedRuns 
    : sortedRuns.filter(run => run.type === filterType);

  const getRunTypeColor = (type: RunType) => {
      switch(type) {
          case RunType.EASY: return 'text-brand-400 bg-brand-400/10 border-brand-400/20';
          case RunType.TEMPO: return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
          case RunType.INTERVAL: return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
          case RunType.LONG: return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
          default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Training Log</h2>
        
        <div className="flex flex-wrap gap-2">
             <button 
                onClick={() => simulateSync('Garmin')}
                disabled={isSyncing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg transition-colors text-sm"
             >
                <Watch size={16} />
                {isSyncing ? '...' : 'Garmin'}
             </button>
             <button 
                onClick={() => simulateSync('Strava')}
                disabled={isSyncing}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg transition-colors text-sm"
             >
                <Activity size={16} />
                {isSyncing ? '...' : 'Strava'}
             </button>
             <button 
                onClick={() => simulateSync('Health Connect')}
                disabled={isSyncing}
                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg transition-colors text-sm"
             >
                <Heart size={16} className="text-white" />
                {isSyncing ? '...' : 'Health Connect'}
             </button>
             <button 
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-brand-500/20"
             >
                <Plus size={20} />
                <span>Manual Log</span>
             </button>
        </div>
      </div>

      {/* Add Run Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 p-6 rounded-xl animate-slide-down mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-1">Date</label>
              <input 
                type="date" 
                required
                value={newRun.date}
                onChange={e => setNewRun({...newRun, date: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-1">Type</label>
              <select 
                value={newRun.type}
                onChange={e => setNewRun({...newRun, type: e.target.value as RunType})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-brand-500 outline-none"
              >
                {Object.values(RunType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-1">Distance (km)</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={newRun.distance}
                onChange={e => setNewRun({...newRun, distance: parseFloat(e.target.value)})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-1">Duration (min)</label>
              <input 
                type="number" 
                required
                value={newRun.duration}
                onChange={e => setNewRun({...newRun, duration: parseFloat(e.target.value)})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-brand-500 outline-none"
              />
            </div>
            <div>
               <label className="block text-slate-400 text-xs uppercase mb-1">Avg HR (bpm)</label>
               <input 
                type="number" 
                value={newRun.avgHr}
                onChange={e => setNewRun({...newRun, avgHr: parseFloat(e.target.value)})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-brand-500 outline-none"
              />
            </div>
            <div>
               <label className="block text-slate-400 text-xs uppercase mb-1">RPE (1-10)</label>
               <input 
                type="number"
                min="1"
                max="10" 
                value={newRun.rpe}
                onChange={e => setNewRun({...newRun, rpe: parseFloat(e.target.value)})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-brand-500 outline-none"
              />
            </div>
            <div>
               <label className="block text-slate-400 text-xs uppercase mb-1">Cadence (spm)</label>
               <input 
                type="number"
                value={newRun.cadence}
                onChange={e => setNewRun({...newRun, cadence: parseFloat(e.target.value)})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-brand-500 outline-none"
              />
            </div>
             <div>
               <label className="block text-slate-400 text-xs uppercase mb-1">Stride (m)</label>
               <input 
                type="number"
                step="0.01"
                value={newRun.strideLength}
                onChange={e => setNewRun({...newRun, strideLength: parseFloat(e.target.value)})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-brand-500 outline-none"
              />
            </div>
          </div>
          <div className="mb-4">
             <label className="block text-slate-400 text-xs uppercase mb-1">Notes</label>
             <textarea 
                value={newRun.notes}
                onChange={e => setNewRun({...newRun, notes: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-brand-500 outline-none h-20"
             />
          </div>
          <div className="flex justify-end gap-3">
             <button 
               type="button" 
               onClick={() => setIsFormOpen(false)}
               className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
             >
               Cancel
             </button>
             <button 
               type="submit" 
               className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg shadow-lg shadow-brand-500/20 transition-all"
             >
               Save Run
             </button>
          </div>
        </form>
      )}

      {/* List Header & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
          <div className="text-slate-400 text-sm font-medium">
              History ({filteredRuns.length})
          </div>
          <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <span className="text-slate-400 text-sm">Type:</span>
              <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as RunType | 'All')}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-2 py-1 outline-none focus:border-brand-500 cursor-pointer"
              >
                  <option value="All">All Activities</option>
                  {Object.values(RunType).map(t => (
                      <option key={t} value={t}>{t}</option>
                  ))}
              </select>
          </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredRuns.map(run => {
           const pace = run.duration / run.distance;
           const paceMin = Math.floor(pace);
           const paceSec = Math.round((pace - paceMin) * 60);
           
           return (
            <div key={run.id} className="bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl p-4 transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start md:items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-slate-900 border ${getRunTypeColor(run.type)} bg-opacity-10 relative`}>
                             {run.type === RunType.INTERVAL ? <Activity size={20} /> : 
                              run.type === RunType.LONG ? <MapPin size={20} /> : 
                              <Heart size={20} />}
                             {/* Source Badge */}
                             {run.source && run.source !== 'Manual' && (
                                <div className="absolute -bottom-1 -right-1 bg-slate-700 rounded-full p-0.5 border border-slate-600" title={`Synced from ${run.source}`}>
                                    {run.source === 'Garmin' ? <Watch size={10} className="text-blue-400" /> : 
                                     run.source === 'Strava' ? <Activity size={10} className="text-orange-400" /> :
                                     run.source === 'Health Connect' ? <Heart size={10} className="text-brand-400" /> :
                                     <Smartphone size={10} className="text-gray-400" />}
                                </div>
                             )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-white font-semibold text-lg">{run.distance} km</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${getRunTypeColor(run.type)}`}>
                                    {run.type}
                                </span>
                            </div>
                            <div className="text-slate-400 text-sm flex flex-wrap items-center gap-3 mt-1">
                                <span className="flex items-center gap-1"><Clock size={14} /> {run.duration}m</span>
                                <span>•</span>
                                <span>{paceMin}:{paceSec.toString().padStart(2, '0')} /km</span>
                                <span>•</span>
                                <span>{new Date(run.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                {run.cadence && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1 text-purple-400"><Footprints size={12} /> {run.cadence} spm</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 md:w-1/3">
                        <div className="text-right">
                            <div className="text-xs text-slate-500 uppercase">Avg HR</div>
                            <div className="text-white font-medium">{run.avgHr} bpm</div>
                        </div>
                         <div className="text-right">
                            <div className="text-xs text-slate-500 uppercase">RPE</div>
                            <div className="text-white font-medium">{run.rpe}/10</div>
                        </div>
                        <button 
                            onClick={() => onDeleteRun(run.id)}
                            className="text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-2"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                {run.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 text-slate-400 text-sm italic">
                        "{run.notes}"
                    </div>
                )}
            </div>
           );
        })}
        {filteredRuns.length === 0 && (
            <div className="text-center py-12 text-slate-500">
                <p>No runs found for this filter.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default RunLog;
