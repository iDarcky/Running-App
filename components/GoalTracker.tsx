
import React, { useState, useMemo } from 'react';
import { Run, Goal, GoalType, GoalPeriod } from '../types';
import { Input, Select } from './UIComponents';
import { Target, Plus, Trash2, CheckCircle, Trophy, Flag, Calendar, TrendingUp, Timer, X } from 'lucide-react';

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
    if (!newGoal.targetValue || newGoal.targetValue <= 0) return;
    
    onAddGoal({
      id: Date.now().toString(),
      type: newGoal.type as GoalType,
      targetValue: Number(newGoal.targetValue),
      period: newGoal.period as GoalPeriod
    });
    setIsAdding(false);
    // Reset to defaults
    setNewGoal({ type: 'distance', targetValue: 20, period: 'weekly' });
  };

  const getGoalIcon = (type: GoalType) => {
    switch(type) {
      case 'distance': return <Flag size={20} />;
      case 'duration': return <Timer size={20} />;
      case 'frequency': return <TrendingUp size={20} />;
      default: return <Target size={20} />;
    }
  };

  return (
    <div className="bg-surface-container rounded-[24px] p-6 shadow-sm border border-outline-variant/20 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-surface-on flex items-center gap-2">
          <Target className="text-primary" size={24} />
          Goals
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all
            ${isAdding 
                ? 'bg-surface-container-highest text-surface-on-variant hover:bg-surface-container-high' 
                : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90 shadow-md'}
          `}
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          <span>{isAdding ? 'Cancel' : 'New Goal'}</span>
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 animate-slide-down">
            <div className="bg-surface-container-high p-5 rounded-[24px] border border-primary/20">
                <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">Set a new target</h4>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Select 
                            label="Metric"
                            icon={Target}
                            value={newGoal.type}
                            onChange={(e: any) => setNewGoal({...newGoal, type: e.target.value as GoalType})}
                            options={[
                                { value: 'distance', label: 'Distance (km)' },
                                { value: 'duration', label: 'Duration (min)' },
                                { value: 'frequency', label: 'Frequency (runs)' }
                            ]}
                        />
                        <Select 
                            label="Period"
                            icon={Calendar}
                            value={newGoal.period}
                            onChange={(e: any) => setNewGoal({...newGoal, period: e.target.value as GoalPeriod})}
                            options={[
                                { value: 'weekly', label: 'Weekly' },
                                { value: 'monthly', label: 'Monthly' }
                            ]}
                        />
                        <Input 
                            label="Target Value"
                            icon={TrendingUp}
                            type="number" 
                            required
                            value={newGoal.targetValue}
                            onChange={(e: any) => setNewGoal({...newGoal, targetValue: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-primary text-primary-on px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/25 hover:scale-105 transition-transform">
                            Create Goal
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[400px] pr-2 -mr-2">
        {goalsWithProgress.map(goal => {
          const isComplete = goal.progress >= 100;
          return (
          <div 
            key={goal.id} 
            className={`
                relative p-5 rounded-[24px] border transition-all duration-300 group
                ${isComplete 
                    ? 'bg-surface-container-low border-green-500/30 shadow-sm' 
                    : 'bg-surface-container-low border-outline-variant/10 hover:border-primary/30 hover:shadow-md'}
            `}
          >
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <div className={`
                        p-2.5 rounded-xl transition-colors
                        ${isComplete ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-surface-container-highest text-surface-on-variant'}
                    `}>
                        {isComplete ? <Trophy size={20} /> : getGoalIcon(goal.type)}
                    </div>
                    <div>
                        <p className="text-surface-on-variant text-[10px] uppercase tracking-wider font-bold mb-0.5">{goal.period} {goal.type}</p>
                        <p className="text-surface-on font-bold text-lg leading-none">
                            {goal.current.toFixed(goal.type === 'distance' ? 1 : 0)} 
                            <span className="text-surface-on-variant text-sm font-medium mx-1">/</span>
                            {goal.targetValue}
                            <span className="text-xs ml-1 opacity-60 font-normal">{goal.type === 'distance' ? 'km' : goal.type === 'duration' ? 'min' : 'runs'}</span>
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={() => onDeleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-error-container hover:text-error-on-container rounded-full transition-all text-surface-on-variant scale-90 group-hover:scale-100"
                >
                    <Trash2 size={16} />
                </button>
             </div>
             
             <div className="space-y-2">
                 <div className="flex justify-between items-end text-xs">
                     <span className={`font-bold ${isComplete ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>
                        {Math.round(goal.progress)}%
                     </span>
                     {isComplete && <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold"><CheckCircle size={12} /> Done</span>}
                 </div>
                 
                 <div className="relative w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                   <div 
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${isComplete ? 'bg-green-500' : 'bg-primary'}`}
                      style={{ width: `${goal.progress}%` }}
                   >
                       {/* Shine effect */}
                       {!isComplete && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>}
                   </div>
                 </div>
             </div>
          </div>
        )})}
        
        {goals.length === 0 && !isAdding && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-surface-on-variant opacity-60 border-2 border-dashed border-outline-variant/30 rounded-[24px]">
            <Target size={48} className="mb-3 opacity-40" />
            <p className="font-bold text-lg">No goals set yet</p>
            <p className="text-sm opacity-80">Set a weekly or monthly target to stay motivated.</p>
            <button onClick={() => setIsAdding(true)} className="mt-4 text-primary font-bold text-sm hover:underline">
                Create your first goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalTracker;
