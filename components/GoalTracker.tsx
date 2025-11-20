import React, { useState, useMemo } from 'react';
import { Run, Goal, GoalType, GoalPeriod } from '../types';
import { Target, Plus, Trash2, CheckCircle } from 'lucide-react';

interface GoalTrackerProps {
  runs: Run[];
  goals: Goal[];
  onAddGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
}

const GoalTracker: React.FC<GoalTrackerProps> = ({ runs, goals, onAddGoal, onDeleteGoal }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    type: 'distance',
    targetValue: 20,
    period: 'weekly'
  });

  // Calculate progress for each goal
  const goalsWithProgress = useMemo(() => {
    const now = new Date();
    
    return goals.map(goal => {
      let relevantRuns: Run[] = [];
      
      if (goal.period === 'weekly') {
        // Get runs from current week (Monday start)
        const day = now.getDay(); // 0 is Sunday
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        
        relevantRuns = runs.filter(r => new Date(r.date) >= monday);
      } else {
        // Monthly
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        relevantRuns = runs.filter(r => new Date(r.date) >= firstDay);
      }

      let current = 0;
      if (goal.type === 'distance') {
        current = relevantRuns.reduce((acc, r) => acc + r.distance, 0);
      } else if (goal.type === 'duration') {
        current = relevantRuns.reduce((acc, r) => acc + r.duration, 0);
      } else if (goal.type === 'frequency') {
        current = relevantRuns.length;
      }

      return {
        ...goal,
        current,
        progress: Math.min(100, (current / goal.targetValue) * 100)
      };
    });
  }, [runs, goals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddGoal({
      id: Date.now().toString(),
      type: newGoal.type as GoalType,
      targetValue: Number(newGoal.targetValue),
      period: newGoal.period as GoalPeriod
    });
    setIsAdding(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Target className="text-brand-500" size={20} />
          Goals & Progress
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1"
        >
          <Plus size={16} /> Set Goal
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-900/50 p-4 rounded-lg mb-6 border border-slate-700 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <select 
              className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-sm outline-none focus:border-brand-500"
              value={newGoal.type}
              onChange={(e) => setNewGoal({...newGoal, type: e.target.value as GoalType})}
            >
              <option value="distance">Distance (km)</option>
              <option value="duration">Duration (min)</option>
              <option value="frequency">Frequency (runs)</option>
            </select>
            <select 
               className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-sm outline-none focus:border-brand-500"
               value={newGoal.period}
               onChange={(e) => setNewGoal({...newGoal, period: e.target.value as GoalPeriod})}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <input 
              type="number" 
              className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-sm outline-none focus:border-brand-500"
              placeholder="Target Value"
              required
              value={newGoal.targetValue}
              onChange={(e) => setNewGoal({...newGoal, targetValue: parseFloat(e.target.value)})}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 text-sm px-3 py-1">Cancel</button>
            <button type="submit" className="bg-brand-500 text-white text-sm px-3 py-1 rounded hover:bg-brand-600">Save</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goalsWithProgress.map(goal => (
          <div key={goal.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 relative group">
             <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{goal.period} {goal.type}</p>
                  <p className="text-white font-medium text-lg">
                    {goal.current.toFixed(1)} / {goal.targetValue} {goal.type === 'distance' ? 'km' : goal.type === 'duration' ? 'm' : 'runs'}
                  </p>
                </div>
                <div className="text-brand-500">
                   {goal.progress >= 100 ? <CheckCircle size={20} /> : <span className="text-xs font-bold">{Math.round(goal.progress)}%</span>}
                </div>
             </div>
             <div className="w-full bg-slate-700 rounded-full h-2">
               <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${goal.progress >= 100 ? 'bg-brand-400' : 'bg-blue-500'}`}
                  style={{ width: `${goal.progress}%` }}
               ></div>
             </div>
             <button 
                onClick={() => onDeleteGoal(goal.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-500 transition-all"
             >
                <Trash2 size={14} />
             </button>
          </div>
        ))}
        {goals.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-4 text-slate-500 text-sm">
            No goals set. Challenge yourself!
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalTracker;