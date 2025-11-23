
import React, { useMemo, useState, useEffect } from 'react';
import { Run, UserProfile, RunType } from '../types';
import { RUN_TYPE_COLORS, SAMPLE_RUNS, ACHIEVEMENTS } from '../constants';
import { StatCard, Modal } from './UIComponents';
import GoalTracker from './GoalTracker';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart as RePieChart, Pie, ComposedChart, Legend
} from 'recharts';
import { 
  Activity, Timer, Heart, Trophy, Medal, 
  TrendingUp, Check, Maximize2, Minimize2, X,
  Settings2, Plus, ChevronLeft, ChevronRight, 
  Map, Footprints, BarChart3, PieChart, Target, Flame, Sparkles, Star, Award, Calendar, AlertTriangle
} from 'lucide-react';
import { formatPace, formatDate, formatFullDate, formatDuration } from '../utils/formatters';

interface DashboardProps {
  runs: Run[];
  goals: any[];
  profile?: UserProfile;
  onAddGoal: (goal: any) => void;
  onDeleteGoal: (id: string) => void;
  onNavigate: (tab: 'dashboard' | 'log' | 'coach' | 'profile') => void;
  onAddRuns?: (runs: Run[]) => void; // Optional prop for demo data
}

// Widget Definition Types
type WidgetSize = 'half' | 'full';
interface WidgetLayout {
    id: string;
    size: WidgetSize;
}

const AVAILABLE_WIDGETS = [
    { id: 'stats', label: 'Key Statistics', icon: Activity, defaultSize: 'full' as WidgetSize },
    { id: 'shoe_tracker', label: 'My Shoes', icon: Footprints, defaultSize: 'half' as WidgetSize },
    { id: 'rotw', label: 'Run of the Week', icon: Star, defaultSize: 'half' as WidgetSize },
    { id: 'streak', label: 'Current Streak', icon: Flame, defaultSize: 'half' as WidgetSize },
    { id: 'records', label: 'Personal Bests', icon: Medal, defaultSize: 'half' as WidgetSize },
    { id: 'volume', label: 'Training Volume', icon: BarChart3, defaultSize: 'full' as WidgetSize },
    { id: 'intensity', label: 'Intensity Dist.', icon: PieChart, defaultSize: 'half' as WidgetSize },
    { id: 'goals', label: 'Goals', icon: Target, defaultSize: 'full' as WidgetSize },
    { id: 'trends', label: 'Pace vs Heart Rate', icon: TrendingUp, defaultSize: 'full' as WidgetSize },
];

const Dashboard: React.FC<DashboardProps> = ({ runs, goals, profile, onAddGoal, onDeleteGoal, onNavigate, onAddRuns }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('all');
  const [greeting, setGreeting] = useState('');
  
  // Layout State
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [layout, setLayout] = useState<WidgetLayout[]>([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Initialize Layout
  useEffect(() => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 18) setGreeting('Good afternoon');
      else setGreeting('Good evening');

      const savedLayout = localStorage.getItem('redline_dashboard_layout_v6');
      if (savedLayout) {
          try {
            setLayout(JSON.parse(savedLayout));
          } catch (e) {
             setLayout(AVAILABLE_WIDGETS.map(w => ({ id: w.id, size: w.defaultSize }))); 
          }
      } else {
          setLayout(AVAILABLE_WIDGETS.map(w => ({ id: w.id, size: w.defaultSize })));
      }
  }, []);

  const saveLayout = (newLayout: WidgetLayout[]) => {
      setLayout(newLayout);
      localStorage.setItem('redline_dashboard_layout_v6', JSON.stringify(newLayout));
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
      setDraggedItemIndex(index);
      const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
      ghost.style.opacity = '0.5';
      ghost.style.position = 'absolute';
      ghost.style.top = '-1000px';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedItemIndex === null || draggedItemIndex === index) return;
      
      const newLayout = [...layout];
      const draggedItem = newLayout[draggedItemIndex];
      
      // Remove dragged item
      newLayout.splice(draggedItemIndex, 1);
      // Insert at new position
      newLayout.splice(index, 0, draggedItem);
      
      setLayout(newLayout);
      setDraggedItemIndex(index);
  };

  const handleDragEnd = () => {
      setDraggedItemIndex(null);
      saveLayout(layout);
  };

  // --- Mobile/Manual Move Logic ---
  const moveWidget = (index: number, direction: 'prev' | 'next') => {
      if (!isEditingLayout) return;
      const newLayout = [...layout];
      if (direction === 'prev' && index > 0) {
          [newLayout[index], newLayout[index - 1]] = [newLayout[index - 1], newLayout[index]];
      } else if (direction === 'next' && index < newLayout.length - 1) {
          [newLayout[index], newLayout[index + 1]] = [newLayout[index + 1], newLayout[index]];
      }
      saveLayout(newLayout);
  };

  const toggleWidgetSize = (id: string) => {
      const newLayout = layout.map(w => 
          w.id === id ? { ...w, size: w.size === 'half' ? 'full' : 'half' as WidgetSize } : w
      );
      saveLayout(newLayout);
  };

  const removeWidget = (id: string) => {
      const newLayout = layout.filter(w => w.id !== id);
      saveLayout(newLayout);
  };

  const addWidget = (id: string) => {
      if (layout.find(w => w.id === id)) return;
      const def = AVAILABLE_WIDGETS.find(w => w.id === id);
      const newLayout = [...layout, { id: id, size: def?.defaultSize || 'full' }];
      saveLayout(newLayout);
  };

  // --- Data Processing ---
  const filteredRuns = useMemo(() => {
    if (timeRange === 'all') return runs;
    const now = new Date();
    now.setHours(0,0,0,0); 
    const cutoff = new Date(now);
    if (timeRange === 'week') cutoff.setDate(now.getDate() - 7);
    if (timeRange === 'month') cutoff.setDate(now.getDate() - 30);
    if (timeRange === 'year') cutoff.setDate(now.getDate() - 365);
    return runs.filter(run => new Date(run.date) >= cutoff);
  }, [runs, timeRange]);
  
  const stats = useMemo(() => {
    if (filteredRuns.length === 0) return { totalDistance: "0.0", avgPace: 0, totalRuns: 0, avgHr: 0, avgCadence: 0, avgPaceStr: "0:00" };
    const totalDistance = filteredRuns.reduce((acc, run) => acc + run.distance, 0);
    const totalDuration = filteredRuns.reduce((acc, run) => acc + run.duration, 0);
    const totalRuns = filteredRuns.length;
    const avgHr = Math.round(filteredRuns.reduce((acc, run) => acc + run.avgHr, 0) / totalRuns);
    const runsWithCadence = filteredRuns.filter(r => r.cadence);
    const avgCadence = runsWithCadence.length > 0 
        ? Math.round(runsWithCadence.reduce((acc, r) => acc + (r.cadence || 0), 0) / runsWithCadence.length)
        : 0;
    return {
      totalDistance: totalDistance.toFixed(1),
      avgPaceStr: formatPace(totalDistance, totalDuration),
      totalRuns,
      avgHr,
      avgCadence
    };
  }, [filteredRuns]);

  const chartData = useMemo(() => {
    return [...filteredRuns]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(run => ({
            date: formatDate(run.date),
            distance: run.distance,
            pace: run.distance > 0 ? parseFloat((run.duration / run.distance).toFixed(2)) : 0,
            hr: run.avgHr,
            cadence: run.cadence || null,
            type: run.type
      }));
  }, [filteredRuns]);

  const streakData = useMemo(() => {
      if (runs.length === 0) return { current: 0, max: 0, active: false };
      
      const sortedRuns = [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const today = new Date();
      today.setHours(0,0,0,0);
      
      let currentStreak = 0;
      let checkDate = new Date(today);
      
      // Check if we ran this week
      const getWeekStart = (d: Date) => {
          const date = new Date(d);
          const day = date.getDay(); // 0 (Sun) to 6 (Sat)
          const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
          return new Date(date.setDate(diff));
      };

      // Simple Weekly Streak Logic
      const uniqueWeeks = new Set(sortedRuns.map(r => getWeekStart(new Date(r.date)).toDateString()));
      
      // Check continuity from current week backwards
      let tempDate = getWeekStart(new Date());
      
      // If no run this week yet, check last week to keep streak alive?
      // For simplicity, let's count consecutive active weeks
      while (uniqueWeeks.has(tempDate.toDateString())) {
          currentStreak++;
          tempDate.setDate(tempDate.getDate() - 7);
      }
      
      return { current: currentStreak, max: currentStreak, active: currentStreak > 0 };
  }, [runs]);

  const runOfTheWeek = useMemo(() => {
      const now = new Date();
      // 7 days ago
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklyRuns = runs.filter(r => new Date(r.date) >= oneWeekAgo);
      
      if (weeklyRuns.length === 0) return null;

      // Sort by distance descending
      return weeklyRuns.reduce((prev, current) => (prev.distance > current.distance) ? prev : current);
  }, [runs]);

  const hrZoneData = useMemo(() => {
    const age = profile?.age && profile.age > 0 ? profile.age : 30;
    const maxHr = 220 - age;
    const zones = [
        { name: 'Z1', min: 0, max: maxHr * 0.6, color: '#9CA3AF', minutes: 0 }, // Gray
        { name: 'Z2', min: maxHr * 0.6, max: maxHr * 0.7, color: '#60A5FA', minutes: 0 }, // Blue
        { name: 'Z3', min: maxHr * 0.7, max: maxHr * 0.8, color: '#34D399', minutes: 0 }, // Green
        { name: 'Z4', min: maxHr * 0.8, max: maxHr * 0.9, color: '#FBBF24', minutes: 0 }, // Yellow
        { name: 'Z5', min: maxHr * 0.9, max: 300, color: '#EF4444', minutes: 0 }, // Red
    ];
    filteredRuns.forEach(run => {
        const zone = zones.find(z => run.avgHr >= z.min && run.avgHr < z.max);
        if (zone) zone.minutes += run.duration;
    });
    return zones.filter(z => z.minutes > 0).map(z => ({ ...z, value: z.minutes }));
  }, [filteredRuns, profile]);

  const records = useMemo(() => {
    const milestones = [
      { label: '5km', distance: 5, id: '5k' },
      { label: '10km', distance: 10, id: '10k' },
      { label: 'Half', distance: 21.0975, id: 'half' },
      { label: 'Full', distance: 42.195, id: 'full' }
    ];

    return milestones.map(m => {
      const validRuns = runs.filter(r => r.distance >= m.distance);
      if (validRuns.length === 0) return { ...m, pb: null };
      
      // Estimate best time based on average pace of the run
      const bestRun = validRuns.reduce((best, current) => {
          const currentPace = current.duration / current.distance;
          const bestPace = best.duration / best.distance;
          return currentPace < bestPace ? current : best;
      }, validRuns[0]);

      const pace = bestRun.duration / bestRun.distance;
      const time = pace * m.distance;
      
      const h = Math.floor(time / 60);
      const min = Math.floor(time / 60) % 60;
      const s = Math.round((time * 60) % 60);
      
      return { 
        ...m, 
        pb: h > 0 ? `${h}:${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${min}:${s.toString().padStart(2, '0')}`,
        date: bestRun.date
      };
    });
  }, [runs]);

  // --- Render Helpers ---

  const renderWidget = (widgetId: string) => {
      switch(widgetId) {
          case 'stats':
              return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full">
                      <StatCard 
                        title="DISTANCE" 
                        value={stats.totalDistance} 
                        subtext="km" 
                        icon={<Map />} 
                        colorClass="bg-black text-white dark:bg-white dark:text-black"
                      />
                      <StatCard 
                        title="AVG PACE" 
                        value={stats.avgPaceStr} 
                        subtext="/km" 
                        icon={<Timer />} 
                        colorClass="bg-[#D32F2F] text-white"
                      />
                      <StatCard 
                        title="RUNS" 
                        value={stats.totalRuns.toString()} 
                        subtext="" 
                        icon={<Footprints />} 
                        colorClass="bg-surface-container-highest text-surface-on"
                      />
                      <StatCard 
                        title="AVG HR" 
                        value={stats.avgHr.toString()} 
                        subtext="bpm" 
                        icon={<Heart />} 
                        colorClass="bg-[#FFDAD6] text-black"
                      />
                  </div>
              );
            case 'shoe_tracker':
                const activeShoes = profile?.shoes?.filter(s => !s.isRetired) || [];
                
                if (activeShoes.length === 0) {
                     return (
                        <div className="bg-surface-container rounded-[24px] p-6 h-full shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                            <Footprints size={32} className="text-surface-on-variant opacity-50 mb-2" />
                            <p className="text-sm text-surface-on-variant font-bold">No active gear</p>
                            <button onClick={() => onNavigate('profile')} className="text-primary text-xs font-bold mt-2 hover:underline">Add Shoes</button>
                        </div>
                     );
                }
                
                // Sort: Primary first, then by mileage desc
                const sortedShoes = [...activeShoes].sort((a, b) => {
                    if (a.isDefault && !b.isDefault) return -1;
                    if (!a.isDefault && b.isDefault) return 1;
                    return b.distance - a.distance;
                });

                return (
                    <div className="bg-surface-container rounded-[24px] h-full shadow-sm border border-outline-variant/20 flex flex-col relative overflow-hidden">
                         <div className="px-6 pt-6 flex justify-between items-start mb-2 shrink-0">
                            <h3 className="text-xl font-bold text-surface-on flex items-center gap-2">
                                <Footprints className="text-primary" size={24} />
                                My Shoes
                            </h3>
                            <button onClick={() => onNavigate('profile')} className="text-surface-on-variant hover:text-primary transition-colors">
                                <span className="text-xs font-bold bg-surface-container-highest px-2 py-1 rounded-md">{sortedShoes.length} Pair{sortedShoes.length !== 1 ? 's' : ''}</span>
                            </button>
                        </div>
                        
                        <div className="flex-1 flex overflow-x-auto snap-x snap-mandatory pb-6 px-6 gap-4 items-center no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {/* Inline style to hide scrollbar for this container only */}
                            <style dangerouslySetInnerHTML={{__html: `.no-scrollbar::-webkit-scrollbar { display: none; }`}} />
                            
                            {sortedShoes.map((shoe) => {
                                const progress = Math.min(100, (shoe.distance / shoe.maxDistance) * 100);
                                const remaining = Math.max(0, shoe.maxDistance - shoe.distance);
                                let barColor = 'bg-[#06D6A0]';
                                if (progress > 50) barColor = 'bg-[#FFD166]';
                                if (progress > 80) barColor = 'bg-[#EF476F]';
                                
                                return (
                                    <div key={shoe.id} className="snap-center shrink-0 w-full min-w-full flex flex-col justify-center">
                                        <div className="flex justify-between items-start mb-2">
                                             <div className="max-w-[75%]">
                                                <h4 className="text-lg font-bold text-surface-on truncate leading-tight">{shoe.brand}</h4>
                                                <p className="text-sm text-surface-on-variant font-medium truncate">{shoe.model}</p>
                                             </div>
                                             {shoe.isDefault && (
                                                <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase px-2 py-1 rounded-md shrink-0">Primary</span>
                                             )}
                                        </div>

                                        <div className="space-y-2 mt-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-bold text-surface-on">{shoe.distance.toFixed(1)} km</span>
                                                <span className="text-surface-on-variant text-xs">{shoe.maxDistance} km max</span>
                                            </div>
                                            <div className="relative h-3 bg-surface-container-highest rounded-full overflow-hidden">
                                                <div 
                                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${barColor}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center pt-1">
                                                <span className="text-xs font-bold text-surface-on-variant">{Math.round(100 - progress)}% Health</span>
                                                {remaining < 50 ? (
                                                    <span className="flex items-center gap-1 text-xs text-[#EF476F] font-bold">
                                                        <AlertTriangle size={10} /> Replace
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-surface-on-variant opacity-60">{Math.round(remaining)} km left</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {sortedShoes.length > 1 && (
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none pb-1">
                                {sortedShoes.map((_, i) => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-surface-on-variant opacity-20"></div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'rotw':
                return (
                    <div className="bg-surface-container rounded-[24px] p-6 h-full shadow-sm border border-outline-variant/20 flex flex-col relative overflow-hidden">
                         <h3 className="text-xl font-bold text-surface-on mb-4 flex items-center gap-2 relative z-10">
                            <Star className="text-[#FFD166]" size={24} fill="currentColor" />
                            Run of the Week
                        </h3>
                        {runOfTheWeek ? (
                            <div className="relative z-10 flex-1 flex flex-col justify-center">
                                <div className="flex items-baseline gap-1 mb-1">
                                     <span className="text-5xl font-bold text-surface-on tracking-tight">{runOfTheWeek.distance}</span>
                                     <span className="text-lg font-medium text-surface-on-variant">km</span>
                                </div>
                                <div className="flex gap-4 text-sm font-bold text-surface-on-variant mb-4">
                                    <span className="flex items-center gap-1"><Calendar size={14}/> {formatFullDate(runOfTheWeek.date)}</span>
                                    <span className="flex items-center gap-1"><Timer size={14}/> {formatDuration(runOfTheWeek.duration)}</span>
                                </div>
                                 <div className="mt-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold w-fit">
                                    <Trophy size={12} /> Longest Effort
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-surface-on-variant opacity-60">
                                <p className="text-sm font-bold">No runs this week</p>
                            </div>
                        )}
                        {/* Background Decoration */}
                        <div className="absolute -bottom-4 -right-4 opacity-5 text-surface-on pointer-events-none">
                            <Award size={140} />
                        </div>
                    </div>
                );
            case 'streak':
                const nextAchievement = ACHIEVEMENTS.find(a => !a.condition(runs));
                return (
                    <div className="bg-surface-container rounded-[24px] p-6 h-full shadow-sm border border-outline-variant/20 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Flame size={120} />
                        </div>
                        <div>
                             <h3 className="text-xl font-bold text-surface-on mb-2 flex items-center gap-2">
                                <Flame className="text-[#FC4C02]" size={24} fill="currentColor" />
                                Streak
                            </h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-surface-on">{streakData.current}</span>
                                <span className="text-lg font-bold text-surface-on-variant">WEEKS</span>
                            </div>
                            <p className="text-xs text-surface-on-variant font-medium mt-1">
                                {streakData.active ? 'Keep the flame alive!' : 'Start a new streak this week.'}
                            </p>
                        </div>
                        {nextAchievement && (
                            <div className="mt-4 bg-surface-container-high rounded-xl p-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center shrink-0">
                                    <Trophy size={14} className="text-tertiary-on-container" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] uppercase font-bold text-surface-on-variant">Next Unlock</p>
                                    <p className="text-xs font-bold text-surface-on truncate">{nextAchievement.title}</p>
                                </div>
                            </div>
                        )}
                    </div>
                );
           case 'goals':
               return (
                   <GoalTracker runs={runs} goals={goals} onAddGoal={onAddGoal} onDeleteGoal={onDeleteGoal} />
               );
           case 'volume':
               return (
                   <div className="bg-surface-container rounded-[24px] p-6 h-full flex flex-col shadow-sm border border-outline-variant/20">
                       <h3 className="text-xl font-bold text-surface-on mb-4 flex items-center gap-2">
                           <BarChart3 className="text-surface-on" size={24} />
                           Training Volume
                       </h3>
                       <div className="flex-1 min-h-[200px]">
                           <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={chartData.slice(-14)}>
                                   <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                   <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10}} dy={10} />
                                   <Tooltip 
                                     contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                                     cursor={{fill: 'var(--md-sys-color-surface-container-high)'}}
                                   />
                                   <Bar dataKey="distance" radius={[4, 4, 0, 0]}>
                                     {chartData.slice(-14).map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={RUN_TYPE_COLORS[entry.type] || RUN_TYPE_COLORS[RunType.EASY]} />
                                     ))}
                                   </Bar>
                               </BarChart>
                           </ResponsiveContainer>
                       </div>
                   </div>
               );
            case 'trends':
                return (
                    <div className="bg-surface-container rounded-[24px] p-6 h-full flex flex-col shadow-sm border border-outline-variant/20">
                        <h3 className="text-xl font-bold text-surface-on mb-4 flex items-center gap-2">
                            <TrendingUp className="text-surface-on" size={24} />
                            Pace vs Heart Rate
                        </h3>
                        <div className="flex-1 min-h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData.slice(-14)}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10}} dy={10} />
                                    <YAxis yAxisId="left" hide domain={['dataMin - 1', 'dataMax + 1']} />
                                    <YAxis yAxisId="right" orientation="right" hide domain={[100, 200]} />
                                    <Tooltip 
                                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                      labelStyle={{ fontWeight: 'bold', color: 'black' }}
                                    />
                                    <Legend iconType="circle" />
                                    <Line yAxisId="left" type="monotone" dataKey="pace" stroke="#000000" strokeWidth={2.5} dot={false} name="Pace (min/km)" />
                                    <Line yAxisId="right" type="monotone" dataKey="hr" stroke="#EF4444" strokeWidth={2.5} dot={false} name="HR (bpm)" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            case 'intensity':
                return (
                    <div className="bg-surface-container rounded-[24px] p-6 h-full flex flex-col shadow-sm border border-outline-variant/20 relative">
                        <h3 className="text-xl font-bold text-surface-on mb-2 flex items-center gap-2">
                            <PieChart className="text-surface-on" size={24} />
                            Intensity Dist.
                        </h3>
                        <div className="flex-1 min-h-[200px] flex items-center justify-center relative">
                            {hrZoneData.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={hrZoneData}
                                                innerRadius={65}
                                                outerRadius={85}
                                                paddingAngle={3}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {hrZoneData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                formatter={(val: number) => [`${Math.round(val)} mins`, 'Time in Zone']}
                                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                            />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                    {/* Center Overlay */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-3xl font-bold text-surface-on leading-none">{stats.avgHr}</span>
                                        <span className="text-[10px] font-bold text-surface-on-variant uppercase tracking-wider mt-1">AVG BPM</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-surface-on-variant opacity-60">
                                    <p>No HR data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'records':
                return (
                    <div className="bg-surface-container rounded-[24px] p-6 h-full shadow-sm border border-outline-variant/20">
                         <h3 className="text-xl font-bold text-surface-on mb-6 flex items-center gap-2">
                            <Medal className="text-surface-on" size={24} />
                            Personal Bests
                        </h3>
                        <div className="flex flex-col gap-3">
                            {records.map((rec, i) => {
                                const isMajor = rec.id === '5k' || rec.id === '10k';
                                return (
                                    <div key={i} className="bg-surface-container-low p-3 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isMajor ? 'bg-[#D32F2F] text-white' : 'bg-surface-container-highest text-surface-on-variant'}`}>
                                                {isMajor ? <Medal size={20} /> : <Trophy size={18} />}
                                            </div>
                                            <div className="text-xs font-bold uppercase text-surface-on-variant tracking-wider">{rec.label}</div>
                                        </div>
                                        <div className="font-bold text-xl text-surface-on mr-2">{rec.pb || '--:--'}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
          default: return null;
      }
  };

  return (
    <div className="w-full animate-fade-in pb-20">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-8 animate-fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-4xl font-bold text-surface-on tracking-tight">
                        {greeting}, <span className="text-primary">{profile?.name ? profile.name.split(' ')[0] : 'Guest'}</span>
                    </h2>
                    <p className="text-surface-on-variant text-lg mt-1">Here is your performance breakdown.</p>
                </div>
                <button 
                    onClick={() => setIsEditingLayout(!isEditingLayout)}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all
                        ${isEditingLayout 
                            ? 'bg-primary text-primary-on shadow-lg shadow-primary/25' 
                            : 'bg-surface-container-high text-surface-on hover:bg-surface-container-highest'}
                    `}
                >
                    {isEditingLayout ? <Check size={16} /> : <Settings2 size={16} />}
                    <span>{isEditingLayout ? 'Done' : 'Customize'}</span>
                </button>
            </div>
            
            <div className="flex bg-surface-container rounded-full p-1.5 border border-outline-variant/20 w-fit">
                    {(['week', 'month', 'year', 'all'] as const).map(range => (
                        <button 
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                            timeRange === range 
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' 
                            : 'text-surface-on-variant hover:bg-surface-container-high'
                        }`}
                    >
                        {range}
                        </button>
                    ))}
            </div>
        </div>

        {/* Zero State / Onboarding */}
        {runs.length === 0 && (
            <div className="bg-surface-container rounded-[32px] p-8 mb-8 border border-outline-variant/20 text-center animate-fade-in">
                <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles size={40} className="text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-surface-on mb-3">Welcome to RedLine</h3>
                <p className="text-surface-on-variant max-w-md mx-auto mb-8">
                    Your training dashboard is looking a little empty. Log your first run or load some demo data to see the analytics in action.
                </p>
                <div className="flex justify-center gap-4">
                    <button 
                        onClick={() => onNavigate('log')}
                        className="bg-primary text-primary-on px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/25 hover:scale-105 transition-transform"
                    >
                        Log a Run
                    </button>
                    {onAddRuns && (
                        <button 
                            onClick={() => onAddRuns(SAMPLE_RUNS)}
                            className="bg-surface-container-high text-surface-on px-8 py-3 rounded-full font-bold hover:bg-surface-container-highest transition-colors border border-outline-variant/20"
                        >
                            Load Demo Data
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* Edit Mode Toolbar */}
        {isEditingLayout && (
            <div className="mb-8 bg-surface-container p-4 rounded-2xl border border-primary/30 animate-slide-down">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-primary">Customize Layout</h3>
                    <button onClick={() => setLayout(AVAILABLE_WIDGETS.map(w => ({ id: w.id, size: w.defaultSize })))} className="text-xs font-bold text-surface-on-variant hover:text-primary">Reset Default</button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {AVAILABLE_WIDGETS.filter(w => !layout.find(l => l.id === w.id)).map(widget => (
                        <button 
                            key={widget.id}
                            onClick={() => addWidget(widget.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-full border border-dashed border-outline-variant hover:border-primary hover:text-primary transition-colors text-sm font-bold whitespace-nowrap"
                        >
                            <Plus size={16} /> {widget.label}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Grid Layout */}
        {runs.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {layout.map((widget, index) => (
                    <div 
                        key={widget.id}
                        draggable={isEditingLayout}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`
                            transition-all duration-300 ease-in-out
                            ${widget.size === 'full' ? 'lg:col-span-2 xl:col-span-2' : 'lg:col-span-1 xl:col-span-1'}
                            ${isEditingLayout ? 'cursor-move ring-2 ring-primary/20 ring-offset-2 rounded-[24px]' : ''}
                            ${draggedItemIndex === index ? 'opacity-50 scale-95' : 'opacity-100'}
                        `}
                    >
                        <div className="relative h-full group">
                            {/* Widget Controls */}
                            {isEditingLayout && (
                                <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black text-white dark:bg-white dark:text-black rounded-full p-1.5 shadow-xl ring-1 ring-white/20 animate-fade-in">
                                    <button onClick={() => moveWidget(index, 'prev')} className="p-1 hover:bg-white/20 rounded-full transition-colors" disabled={index === 0} title="Move Left/Up"><ChevronLeft size={14} /></button>
                                    <button onClick={() => toggleWidgetSize(widget.id)} className="p-1 hover:bg-white/20 rounded-full transition-colors" title="Resize">
                                        {widget.size === 'full' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                    </button>
                                    <button onClick={() => removeWidget(widget.id)} className="p-1 hover:bg-red-500 hover:text-white rounded-full transition-colors" title="Remove"><X size={14} /></button>
                                    <button onClick={() => moveWidget(index, 'next')} className="p-1 hover:bg-white/20 rounded-full transition-colors" disabled={index === layout.length - 1} title="Move Right/Down"><ChevronRight size={14} /></button>
                                </div>
                            )}
                            
                            {renderWidget(widget.id)}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default Dashboard;
