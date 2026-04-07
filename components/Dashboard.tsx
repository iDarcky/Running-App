import { Play } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp,
  Target,
  Calendar,
  Settings2,
  Maximize2,
  Minimize2,
  X,
  BarChart as BarChartIcon,
  Activity,
  Heart,
  PieChart,
  Plus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart as RePieChart,
  Pie,
  Legend
} from 'recharts';
import { StatCard, Card, Button, Modal, Input, Select } from './UIComponents';
import { Run, Goal, UserProfile, RunType } from '../types';
import { RUN_TYPE_COLORS } from '../constants';
import { format, isValid, parseISO } from 'date-fns';
import { displayDistance } from '../utils/formatters';

interface DashboardProps {
  runs: Run[];
  goals: Goal[];
  profile: UserProfile;
  onAddGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onNavigate: (tab: string) => void;
  onStartRun?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ runs, goals, profile, onAddGoal, onDeleteGoal, onNavigate, onStartRun }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [layout, setLayout] = useState<{id: string, size: 'half' | 'full'}[]>([
    { id: 'stats', size: 'full' },
    { id: 'activity', size: 'half' },
    { id: 'intensity', size: 'half' },
    { id: 'goals', size: 'full' },
    { id: 'trends', size: 'full' }
  ]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');

  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    type: 'distance',
    target: 100,
    current: 0,
    deadline: format(new Date(), 'yyyy-MM-dd')
  });

  const formatDateSafely = (dateStr: string, formatStr: string) => {
    if (!dateStr) return 'No date';
    const date = parseISO(dateStr);
    return isValid(date) ? format(date, formatStr) : 'Invalid date';
  };

  const filteredRuns = (runs || []).filter(r => activityFilter === 'all' || (r.type && r.type.toLowerCase() === activityFilter.toLowerCase()));
  const stats = {
      totalDistance: filteredRuns.reduce((acc, r) => acc + r.distance, 0).toFixed(1),
      avgPace: (filteredRuns.reduce((acc, r) => acc + (parseFloat(r.pace.replace(':', '.')) || 0), 0) / (filteredRuns.length || 1)).toFixed(2).replace('.', ':'),
      totalRuns: filteredRuns.length,
      elevationGain: filteredRuns.reduce((acc, r) => acc + (r.elevation || 0), 0)
  };

  const chartData = filteredRuns.slice(0, 10).reverse().map(r => ({
      date: formatDateSafely(r.date, 'MMM d'),
      distance: r.distance,
      pace: parseFloat(r.pace.replace(':', '.')) || 0,
      hr: r.avgHr || 0,
      [r.type]: r.distance
  }));

  const hrZoneData = [
      { name: 'Z1', value: 15, color: '#10B981' },
      { name: 'Z2', value: 35, color: '#3B82F6' },
      { name: 'Z3', value: 25, color: '#F59E0B' },
      { name: 'Z4', value: 15, color: '#EF4444' },
      { name: 'Z5', value: 10, color: '#7C3AED' },
  ];

  const handleAddGoal = (e: React.FormEvent) => {
      e.preventDefault();
      onAddGoal({
          ...newGoal,
          id: Date.now().toString(),
          current: 0
      } as Goal);
      setIsGoalModalOpen(false);
  };

  const renderWidget = (id: string) => {
      switch (id) {
          case 'stats':
              return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                      <StatCard title="Total Distance" value={`${displayDistance(parseFloat(stats.totalDistance), profile.preferredUnits)} ${profile.preferredUnits || 'km'}`} icon={<Activity />} colorClass="text-primary" />
                      <StatCard title="Avg Pace" value={`${stats.avgPace} /${profile.preferredUnits || 'km'}`} icon={<TrendingUp />} colorClass="text-primary" />
                      <StatCard title="Total Runs" value={stats.totalRuns.toString()} icon={<Calendar />} colorClass="text-primary" />
                      <StatCard title="Elevation" value={`${stats.elevationGain} m`} icon={<TrendingUp />} colorClass="text-primary" />
                  </div>
              );
          case 'goals':
              return (
                <Card className="h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest flex items-center gap-2">
                             <Target className="text-primary" size={16} /> Active Goals
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => setIsGoalModalOpen(true)}>
                            <Plus size={16} className="mr-1" /> New Goal
                        </Button>
                    </div>
                    <div className="space-y-6">


                        {goals.length > 0 ? goals.map(goal => {
                            const progress = Math.min((goal.current / goal.target) * 100, 100);
                            return (
                                <div key={goal.id} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <p className="text-sm font-bold text-foreground capitalize tracking-tight">{goal.type} Target</p>
                                            <p className="text-[10px] text-accents-5 font-medium uppercase tracking-wider mt-0.5">Due: {formatDateSafely(goal.deadline, 'MMM d, yyyy')}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-foreground">{goal.current} / {goal.target}</span>
                                            <p className="text-[10px] text-accents-5 font-bold uppercase tracking-widest">{progress.toFixed(0)}%</p>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-accents-1 rounded-full overflow-hidden border border-accents-2">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="py-10 text-center">
                                <p className="text-sm text-accents-4 italic">No active goals. Set one to stay motivated!</p>
                            </div>
                        )}
                    </div>
                </Card>
              );
          case 'activity':
                return (
                    <Card className="h-full">
                        <h3 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2 uppercase tracking-widest">
                             <BarChartIcon className="text-primary" size={16} /> Distribution
                        </h3>
                         <div className="h-[200px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="date" hide />
                                    <Tooltip 
                                        cursor={{fill: 'var(--accents-1)'}}
                                        contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--accents-2)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    {['recovery', 'base', 'long', 'speed', 'race', 'workout'].map((type) => (
                                        <Bar 
                                            key={type} 
                                            dataKey={type} 
                                            stackId="a" 
                                            fill={RUN_TYPE_COLORS[type as RunType]} 
                                            radius={[2, 2, 2, 2]}
                                        />
                                    ))}
                                </BarChart>
                             </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-6 justify-center">
                            {['recovery', 'base', 'long', 'speed', 'race', 'workout'].map(type => (
                                <div key={type} className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RUN_TYPE_COLORS[type as RunType] }} />
                                    <span className="text-[9px] font-bold text-accents-5 uppercase tracking-wider">{type}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                );
            case 'intensity':
                 return (
                    <Card className="h-full">
                        <h3 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2 uppercase tracking-widest">
                             <Heart className="text-primary" size={16} /> HR Intensity
                        </h3>
                        <div className="h-[180px] w-full relative">
                             <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={hrZoneData}
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {hrZoneData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RePieChart>
                             </ResponsiveContainer>
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                 <Heart size={20} className="text-accents-3" />
                             </div>
                        </div>
                        <div className="flex justify-center gap-3 flex-wrap mt-2">
                            {hrZoneData.map(z => (
                                <div key={z.name} className="flex items-center gap-1 text-[9px] font-bold text-accents-5 uppercase tracking-wider">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: z.color}}></div>
                                    {z.name}
                                </div>
                            ))}
                        </div>
                    </Card>
                 );
            case 'trends':
                return (
                    <Card className="h-full">
                        <h3 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2 uppercase tracking-widest">
                             <TrendingUp className="text-primary" size={16} /> Pace vs Heart Rate
                        </h3>
                         <div className="h-[200px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--accents-2)" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis yAxisId="left" hide domain={['dataMin - 1', 'dataMax + 1']} />
                                    <YAxis yAxisId="right" orientation="right" hide domain={['dataMin - 10', 'dataMax + 10']} />
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--accents-2)' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="pace" stroke="var(--brand-red)" strokeWidth={2} dot={{ r: 3, fill: 'var(--brand-red)' }} />
                                    <Line yAxisId="right" type="monotone" dataKey="hr" stroke="var(--accents-3)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                </LineChart>
                             </ResponsiveContainer>
                        </div>
                    </Card>
                );
          default: return null;
      }
  };

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
         <div>
             <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tighter mb-2">Dashboard</h2>
             <p className="text-accents-5 text-base">Welcome back, {profile?.name || 'Runner'}.</p>
         </div>
         
         <div className="flex bg-accents-1 rounded-md p-1 border border-accents-2">
            {['week', 'month', 'year', 'all'].map((range) => (
                <button
                    key={range}
                    onClick={() => setTimeRange(range as any)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${timeRange === range ? 'bg-background text-foreground shadow-sm' : 'text-accents-5 hover:text-foreground'}`}
                >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {layout.map((item) => (
              <div 
                key={item.id}
                className={`
                    ${item.size === 'full' ? 'md:col-span-2' : 'md:col-span-1'}
                    min-h-[240px]
                `}
              >
                  {renderWidget(item.id)}
              </div>
          ))}
      </div>

      {/* Goal Modal */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Set New Goal">
          <form onSubmit={handleAddGoal} className="space-y-4">
              <Select
                label="Goal Type"
                value={newGoal.type}
                onChange={(e: any) => setNewGoal({...newGoal, type: e.target.value})}
                options={[
                    { value: 'distance', label: 'Distance (km)' },
                    { value: 'runs', label: 'Number of Runs' },
                    { value: 'elevation', label: 'Elevation Gain (m)' }
                ]}
              />
              <Input
                label="Target Value"
                type="number"
                value={newGoal.target}
                onChange={(e: any) => setNewGoal({...newGoal, target: parseFloat(e.target.value)})}
              />
              <Input
                label="Deadline"
                type="date"
                value={newGoal.deadline}
                onChange={(e: any) => setNewGoal({...newGoal, deadline: e.target.value})}
              />
              <Button type="submit" className="w-full mt-4">Create Goal</Button>
          </form>
      </Modal>
      {onStartRun && (
        <button
          onClick={onStartRun}
          className="fixed bottom-24 md:bottom-8 right-4 md:right-8 w-16 h-16 bg-[#EE0000] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#EE0000]/40 hover:scale-105 active:scale-95 transition-all z-50"
        >
          <Play size={28} fill="currentColor" className="ml-1" />
        </button>
      )}
    </div>
  );
};

export default Dashboard;
