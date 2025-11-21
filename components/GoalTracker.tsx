
import React, { useState, useMemo } from 'react';
import { Run, Goal, GoalType, GoalPeriod } from '../types';
import { Target, Plus, Trash2, CheckCircle, Trophy, Flag } from 'lucide-react';

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
    <div className="bg-surface-container rounded-[24px] p-6 shadow-sm border border-outline-variant/20 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-surface-on flex items-center gap-2">
          <Target className="text-primary" size={24} />
          Goals & Progress
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-container text-primary-on-container hover:bg-primary/20 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> {isAdding ? 'Cancel' : 'Set Goal'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-surface-container-high p-4 rounded-2xl mb-6 border border-outline-variant/20 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="relative">
                 <label className="text-[10px] font-bold uppercase text-surface-on-variant mb-1 block ml-2">Type</label>
                 <select 
                  className="w-full bg-surface-container-highest border-b border-outline-variant text-surface-on rounded-t-lg px-4 py-3 text-sm outline-none focus:border-primary"
                  value={newGoal.type}
                  onChange={(e) => setNewGoal({...newGoal, type: e.target.value as GoalType})}
                >
                  <option value="distance">Distance (km)</option>
                  <option value="duration">Duration (min)</option>
                  <option value="frequency">Frequency (runs)</option>
                </select>
            </div>
            <div className="relative">
                <label className="text-[10px] font-bold uppercase text-surface-on-variant mb-1 block ml-2">Period</label>
                <select 
                   className="w-full bg-surface-container-highest border-b border-outline-variant text-surface-on rounded-t-lg px-4 py-3 text-sm outline-none focus:border-primary"
                   value={newGoal.period}
                   onChange={(e) => setNewGoal({...newGoal, period: e.target.value as GoalPeriod})}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
            </div>
            <div className="relative">
                <label className="text-[10px] font-bold uppercase text-surface-on-variant mb-1 block ml-2">Target</label>
                <input 
                  type="number" 
                  className="w-full bg-surface-container-highest border-b border-outline-variant text-surface-on rounded-t-lg px-4 py-3 text-sm outline-none focus:border-primary font-bold placeholder-surface-on-variant/50"
                  placeholder="Value"
                  required
                  value={newGoal.targetValue}
                  onChange={(e) => setNewGoal({...newGoal, targetValue: parseFloat(e.target.value)})}
                />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-primary text-primary-on text-sm font-bold px-6 py-2 rounded-full hover:shadow-lg transition-all">Save Goal</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goalsWithProgress.map(goal => (
          <div key={goal.id} className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 relative group hover:shadow-md transition-all">
             <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${goal.progress >= 100 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-secondary-container text-secondary-on-container'}`}>
                        {goal.progress >= 100 ? <Trophy size={18} /> : <Flag size={18} />}
                    </div>
                    <div>
                        <p className="text-surface-on-variant text-xs uppercase tracking-wider font-bold">{goal.period} {goal.type}</p>
                        <p className="text-surface-on font-bold text-xl leading-none mt-1">
                            {goal.current.toFixed(0)} <span className="text-sm font-medium text-surface-on-variant">/ {goal.targetValue} {goal.type === 'distance' ? 'km' : goal.type === 'duration' ? 'min' : ''}</span>
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={() => onDeleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-error-container hover:text-error-on-container rounded-full transition-all text-surface-on-variant"
                >
                    <Trash2 size={14} />
                </button>
             </div>
             
             <div className="relative w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
               <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${goal.progress >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                  style={{ width: `${goal.progress}%` }}
               ></div>
             </div>
             <div className="flex justify-end mt-1">
                <span className={`text-xs font-bold ${goal.progress >= 100 ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>{Math.round(goal.progress)}%</span>
             </div>
          </div>
        ))}
        {goals.length === 0 && !isAdding && (
          <div className="col-span-full flex flex-col items-center justify-center py-8 text-surface-on-variant opacity-60 border-2 border-dashed border-outline-variant/30 rounded-2xl">
            <Target size={32} className="mb-2 opacity-50" />
            <p className="font-medium">No goals set yet.</p>
            <p className="text-xs">Add a goal to track your progress.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalTracker;