import React, { useState, useMemo } from 'react';
import { Target, Plus, Trash2, Calendar, TrendingUp, Flag, Timer, CheckCircle, Trophy, X } from 'lucide-react';
import { Goal, Run, GoalType, GoalPeriod } from '../types';
import { Card, Button, Input, Select } from './UIComponents';

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

  const goalsWithProgress = useMemo(() => {
    const now = new Date();
    
    return (goals || []).map(goal => {
      let relevantRuns: Run[] = [];
      
      if (goal.period === 'weekly') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        relevantRuns = runs.filter(r => new Date(r.date) >= monday);
      } else {
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
        progress: Math.min(100, (current / (goal.targetValue || 1)) * 100)
      };
    });
  }, [runs, goals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.targetValue || newGoal.targetValue <= 0) return;
    
    onAddGoal({
      id: Date.now().toString(),
      type: (newGoal.type as GoalType) || 'distance',
      targetValue: Number(newGoal.targetValue),
      period: (newGoal.period as GoalPeriod) || 'weekly',
      current: 0,
      deadline: ''
    } as Goal);
    setIsAdding(false);
    setNewGoal({ type: 'distance', targetValue: 20, period: 'weekly' });
  };

  const getGoalIcon = (type: GoalType) => {
    switch(type) {
      case 'distance': return <Flag size={18} />;
      case 'duration': return <Timer size={18} />;
      case 'frequency': return <TrendingUp size={18} />;
      default: return <Target size={18} />;
    }
  };

  return (
    <Card className="flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-widest">
          <Target className="text-primary" size={16} />
          Performance Goals
        </h3>
        <Button
          variant={isAdding ? 'ghost' : 'primary'}
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? <X size={14} /> : <Plus size={14} className="mr-1" />}
          {isAdding ? 'Cancel' : 'New Goal'}
        </Button>
      </div>

      {isAdding && (
        <div className="mb-8 p-6 bg-accents-1 rounded-lg border border-accents-2 animate-fade-in">
            <h4 className="text-[10px] font-bold text-accents-5 uppercase tracking-widest mb-4">Target Settings</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Metric"
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
                        value={newGoal.period}
                        onChange={(e: any) => setNewGoal({...newGoal, period: e.target.value as GoalPeriod})}
                        options={[
                            { value: 'weekly', label: 'Weekly' },
                            { value: 'monthly', label: 'Monthly' }
                        ]}
                    />
                </div>
                <Input
                    label="Target Value"
                    type="number"
                    value={newGoal.targetValue}
                    onChange={(e: any) => setNewGoal({...newGoal, targetValue: parseFloat(e.target.value)})}
                    required
                />
                <Button type="submit" className="w-full">Create Goal</Button>
            </form>
        </div>
      )}

      <div className="space-y-4">
        {goalsWithProgress.map(goal => {
          const isComplete = goal.progress >= 100;
          return (
          <div key={goal.id} className="p-4 rounded-lg border border-accents-2 bg-background hover:border-accents-3 transition-colors group">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${isComplete ? 'bg-primary text-white shadow-lg' : 'bg-accents-1 text-accents-5'}`}>
                        {isComplete ? <Trophy size={16} /> : getGoalIcon(goal.type)}
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-accents-5">{goal.period} {goal.type}</p>
                        <p className="text-foreground font-bold tracking-tight">
                            {goal.current.toFixed(goal.type === 'distance' ? 1 : 0)} 
                            <span className="text-accents-4 text-xs font-medium mx-1">/</span>
                            {goal.targetValue}
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={() => onDeleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-accents-4 hover:text-primary transition-all"
                >
                    <Trash2 size={14} />
                </button>
             </div>
             
             <div className="space-y-2">
                 <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-widest">
                     <span className={isComplete ? 'text-primary' : 'text-accents-5'}>
                        {Math.round(goal.progress)}% Complete
                     </span>
                     {isComplete && <span className="flex items-center gap-1 text-primary"><CheckCircle size={10} /> Done</span>}
                 </div>
                 <div className="h-1 bg-accents-1 rounded-full overflow-hidden border border-accents-2/30">
                   <div 
                      className={`h-full transition-all duration-1000 ${isComplete ? 'bg-primary' : 'bg-foreground'}`}
                      style={{ width: `${goal.progress}%` }}
                   />
                 </div>
             </div>
          </div>
        )})}
        
        {goals.length === 0 && !isAdding && (
          <div className="py-12 text-center bg-accents-1/30 rounded-lg border border-accents-2 border-dashed">
            <Target size={32} className="mx-auto mb-4 text-accents-3" />
            <p className="text-xs font-bold text-accents-5 uppercase tracking-widest mb-6">No performance goals set</p>
            <Button variant="secondary" size="sm" onClick={() => setIsAdding(true)}>
                Get Started
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default GoalTracker;
