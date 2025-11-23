import React, { useMemo, useState, useEffect } from 'react';
import { Run, UserProfile, RunType, Shoe, Goal } from '../types';
import { RUN_TYPE_COLORS } from '../constants';
import { StatCard } from './UIComponents';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart as RePieChart, Pie, Legend
} from 'recharts';
import { 
  Activity, Timer, Heart, Medal, 
  TrendingUp, Maximize2, Minimize2, X,
  Settings2, Map as MapIcon, Footprints, BarChart3, PieChart, Flame, Star, BrainCircuit, RefreshCw, AlertTriangle, Target, Plus
} from 'lucide-react';
import { formatPace, formatDate } from '../utils/formatters';
import { generateDailyWorkout } from '../services/geminiService';

interface DashboardProps {
  runs: Run[];
  goals: Goal[];
  profile?: UserProfile;
  onAddGoal: (goal: any) => void;
  onDeleteGoal: (id: string) => void;
  onNavigate: (tab: 'dashboard' | 'log' | 'coach' | 'profile') => void;
  onAddRuns?: (runs: Run[]) => void;
}

// Widget Definition Types
type WidgetSize = 'half' | 'full';
interface WidgetLayout {
    id: string;
    size: WidgetSize;
}

const AVAILABLE_WIDGETS = [
    { id: 'stats', label: 'Key Statistics', icon: Activity, defaultSize: 'full' as WidgetSize },
    { id: 'active_goal', label: 'Current Goal', icon: Target, defaultSize: 'half' as WidgetSize },
    { id: 'ai_workout', label: 'Coach\'s Pick', icon: BrainCircuit, defaultSize: 'half' as WidgetSize },
    { id: 'streak', label: 'Consistency', icon: Flame, defaultSize: 'full' as WidgetSize },
    { id: 'shoe_tracker', label: 'My Shoes', icon: Footprints, defaultSize: 'full' as WidgetSize },
    { id: 'rotw', label: 'Run of the Week', icon: Star, defaultSize: 'half' as WidgetSize },
    { id: 'records', label: 'Personal Bests', icon: Medal, defaultSize: 'half' as WidgetSize },
    { id: 'volume', label: 'Training Volume', icon: BarChart3, defaultSize: 'full' as WidgetSize },
    { id: 'intensity', label: 'Intensity Dist.', icon: PieChart, defaultSize: 'half' as WidgetSize },
    { id: 'trends', label: 'Pace vs Heart Rate', icon: TrendingUp, defaultSize: 'full' as WidgetSize },
];

const Dashboard: React.FC<DashboardProps> = ({ runs, goals, profile, onNavigate, onAddGoal }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('all');
  const [greeting, setGreeting] = useState('');
  
  // Layout State
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [layout, setLayout] = useState<WidgetLayout[]>([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // AI Workout State
  const [suggestedWorkout, setSuggestedWorkout] = useState<{title: string, description: string, type: string, duration: number} | null>(null);
  const [loadingWorkout, setLoadingWorkout] = useState(false);

  // Initialize Layout
  useEffect(() => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 18) setGreeting('Good afternoon');
      else setGreeting('Good evening');

      const savedLayout = localStorage.getItem('redline_dashboard_layout_v9');
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
      localStorage.setItem('redline_dashboard_layout_v9', JSON.stringify(newLayout));
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
      newLayout.splice(draggedItemIndex, 1);
      newLayout.splice(index, 0, draggedItem);
      
      setLayout(newLayout);
      setDraggedItemIndex(index);
  };

  const handleDragEnd = () => {
      setDraggedItemIndex(null);
      saveLayout(layout);
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

  // --- Helper: Heatmap Data Generation ---
  const heatmapData = useMemo(() => {
      const today = new Date();
      const data = [];
      // Generate last 21 weeks (approx 5 months)
      // 21 * 7 = 147 days
      for (let i = 146; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          
          const dayRuns = runs.filter(r => r.date === dateStr);
          const totalDistance = dayRuns.reduce((acc, r) => acc + r.distance, 0);
          
          let intensity = 0;
          if (totalDistance > 0) intensity = 1;
          if (totalDistance > 5) intensity = 2;
          if (totalDistance > 10) intensity = 3;
          if (totalDistance > 15) intensity = 4;

          data.push({ date: d, intensity, distance: totalDistance });
      }
      return data;
  }, [runs]);

  const handleGenerateWorkout = async () => {
      setLoadingWorkout(true);
      try {
          const plan = await generateDailyWorkout(runs, profile);
          setSuggestedWorkout(plan);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingWorkout(false);
      }
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
    const avgHr = Math.round(filteredRuns.reduce((acc, run) => acc + run.avgHr, 0) / (totalRuns || 1));
    const runsWithCadence = filteredRuns.filter(r => r.cadence);
    const avgCadence = runsWithCadence.length > 0 
        ? Math.round(runsWithCadence.reduce((acc, r) => acc + (r.cadence || 0), 0) / runsWithCadence.length)
        : 0;
    return {
      totalDistance: totalDistance.toFixed(1),
      avgPaceStr: formatPace(totalDistance, totalDuration),
      totalRuns,
      avgHr: isNaN(avgHr) ? 0 : avgHr,
      avgCadence
    };
  }, [filteredRuns]);

  const chartData = useMemo(() => {
    // Group by date to handle multiple runs per day
    // Fixed Map constructor collision by using MapIcon alias
    const groupedData = new Map();
    
    [...filteredRuns]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(run => {
          const dateLabel = formatDate(run.date);
          if (!groupedData.has(dateLabel)) {
              groupedData.set(dateLabel, { 
                  date: dateLabel, 
                  distance: 0, 
                  duration: 0, 
                  count: 0, 
                  totalHr: 0,
                  rawDate: run.date
              });
          }
          const entry = groupedData.get(dateLabel);
          entry.distance += run.distance;
          entry.duration += run.duration;
          entry.totalHr += run.avgHr;
          entry.count += 1;

          // Aggregate by run type for stacked chart
          if (!entry[run.type]) entry[run.type] = 0;
          entry[run.type] += run.distance;
      });

    return Array.from(groupedData.values()).map((entry: any) => {
        const dataPoint: any = {
            date: entry.date,
            shortDay: new Date(entry.rawDate).toLocaleDateString('en-US', { weekday: 'short' }),
            distance: parseFloat(entry.distance.toFixed(2)),
            pace: entry.distance > 0 ? parseFloat((entry.duration / entry.distance).toFixed(2)) : 0,
            hr: Math.round(entry.totalHr / entry.count)
        };

        // Add type-specific distances for stacked bars
        Object.values(RunType).forEach((type: any) => {
            if (entry[type]) {
                dataPoint[type] = parseFloat(entry[type].toFixed(2));
            }
        });
        return dataPoint;
    });
  }, [filteredRuns]);

  // --- Goal Logic ---
  const primaryGoal = goals[0];
  const goalProgress = useMemo(() => {
      if (!primaryGoal) return { current: 0, percent: 0 };
      
      const now = new Date();
      let relevantRuns: Run[] = [];
      
      if (primaryGoal.period === 'weekly') {
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
      if (primaryGoal.type === 'distance') current = relevantRuns.reduce((acc, r) => acc + r.distance, 0);
      else if (primaryGoal.type === 'duration') current = relevantRuns.reduce((acc, r) => acc + r.duration, 0);
      else if (primaryGoal.type === 'frequency') current = relevantRuns.length;

      return {
          current,
          percent: Math.min(100, (current / primaryGoal.targetValue) * 100)
      };
  }, [primaryGoal, runs]);

  // --- Streak Logic ---
  const streakData = useMemo(() => {
      if (runs.length === 0) return { current: 0, max: 0, active: false };
      
      const sortedRuns = [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const getWeekStart = (d: Date) => {
          const date = new Date(d);
          const day = date.getDay(); // 0 (Sun) to 6 (Sat)
          const diff = date.getDate() - day + (day === 0 ? -6 : 1);
          return new Date(date.setDate(diff));
      };

      const uniqueWeeks = new Set(sortedRuns.map(r => getWeekStart(new Date(r.date)).toDateString()));
      let tempDate = getWeekStart(new Date());
      let currentStreak = 0;
      
      // Check if this week has a run
      if (uniqueWeeks.has(tempDate.toDateString())) {
          // Iterate backwards
          while (uniqueWeeks.has(tempDate.toDateString())) {
              currentStreak++;
              tempDate.setDate(tempDate.getDate() - 7);
          }
      }
      
      return { current: currentStreak, max: currentStreak, active: currentStreak > 0 };
  }, [runs]);

  const runOfTheWeek = useMemo(() => {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklyRuns = runs.filter(r => new Date(r.date) >= oneWeekAgo);
      if (weeklyRuns.length === 0) return null;
      return weeklyRuns.reduce((prev, current) => (prev.distance > current.distance) ? prev : current);
  }, [runs]);

  const hrZoneData = useMemo(() => {
    const age = profile?.age && profile.age > 0 ? profile.age : 30;
    const maxHr = 220 - age;
    const zones = [
        { name: 'Z1', min: 0, max: maxHr * 0.6, color: '#9CA3AF', minutes: 0 },
        { name: 'Z2', min: maxHr * 0.6, max: maxHr * 0.7, color: '#60A5FA', minutes: 0 },
        { name: 'Z3', min: maxHr * 0.7, max: maxHr * 0.8, color: '#34D399', minutes: 0 },
        { name: 'Z4', min: maxHr * 0.8, max: maxHr * 0.9, color: '#FBBF24', minutes: 0 },
        { name: 'Z5', min: maxHr * 0.9, max: 300, color: '#EF4444', minutes: 0 },
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
    ];

    return milestones.map(m => {
      const validRuns = runs.filter(r => r.distance >= m.distance);
      if (validRuns.length === 0) return { ...m, pb: null };
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

  // --- Render Widgets ---

  const renderWidget = (widgetId: string) => {
      switch(widgetId) {
          case 'stats':
              return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full">
                      <StatCard title="DISTANCE" value={stats.totalDistance} subtext="km" icon={<MapIcon />} colorClass="bg-black text-white dark:bg-white dark:text-black" />
                      <StatCard title="AVG PACE" value={stats.avgPaceStr} subtext="/km" icon={<Timer />} colorClass="bg-[#D32F2F] text-white" />
                      <StatCard title="RUNS" value={stats.totalRuns.toString()} subtext="" icon={<Footprints />} colorClass="bg-surface-container-highest text-surface-on" />
                      <StatCard title="AVG HR" value={stats.avgHr.toString()} subtext="bpm" icon={<Heart />} colorClass="bg-[#FFDAD6] text-black" />
                  </div>
              );
            case 'active_goal':
                if (!primaryGoal) {
                     return (
                         <div className="bg-surface-container rounded-[24px] p-6 h-full shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center text-center relative overflow-hidden">
                             <Target size={32} className="text-surface-on-variant opacity-50 mb-2" />
                             <p className="text-sm font-bold text-surface-on mb-3">No Active Goal</p>
                             <button 
                                onClick={() => onAddGoal({ id: Date.now().toString(), type: 'distance', targetValue: 20, period: 'weekly' })}
                                className="text-xs font-bold bg-primary text-primary-on px-3 py-1.5 rounded-full flex items-center gap-1"
                             >
                                 <Plus size={12} /> Add Weekly Goal
                             </button>
                         </div>
                     );
                }
                return (
                    <div className="bg-surface-container rounded-[24px] p-6 h-full shadow-sm border border-outline-variant/20 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-surface-on flex items-center gap-2">
                                <Target className="text-primary" size={20} /> Goal Progress
                            </h3>
                            <span className="text-[10px] font-bold uppercase text-surface-on-variant bg-surface-container-highest px-2 py-1 rounded-md">
                                {primaryGoal.period}
                            </span>
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center">
                             <div className="flex items-baseline gap-1 mb-1">
                                 <span className="text-4xl font-black text-surface-on">{goalProgress.current.toFixed(1)}</span>
                                 <span className="text-sm font-bold text-surface-on-variant">
                                     / {primaryGoal.targetValue} {primaryGoal.type === 'distance' ? 'km' : 'runs'}
                                 </span>
                             </div>
                             
                             <div className="relative h-3 bg-surface-container-highest rounded-full overflow-hidden w-full">
                                 <div 
                                     className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                                     style={{ width: `${goalProgress.percent}%` }}
                                 />
                             </div>
                             <p className="text-xs font-bold text-surface-on-variant mt-2 text-right">
                                 {Math.round(goalProgress.percent)}% Complete
                             </p>
                        </div>
                    </div>
                );
            case 'ai_workout':
                return (
                    <div className="bg-surface-container rounded-[24px] p-6 h-full shadow-sm border border-outline-variant/20 flex flex-col relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-surface-on flex items-center gap-2">
                                <BrainCircuit className="text-primary" size={24} />
                                Coach's Pick
                            </h3>
                            {!suggestedWorkout && !loadingWorkout && (
                                <button onClick={handleGenerateWorkout} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors">
                                    Generate
                                </button>
                            )}
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center relative z-10">
                            {loadingWorkout ? (
                                <div className="flex flex-col items-center gap-2 text-surface-on-variant animate-pulse">
                                    <RefreshCw className="animate-spin" size={24} />
                                    <span className="text-xs font-bold">Analyzing fatigue...</span>
                                </div>
                            ) : suggestedWorkout ? (
                                <div className="animate-slide-down">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                                            suggestedWorkout.type === 'Recovery' ? 'bg-green-100 text-green-700' : 
                                            suggestedWorkout.type === 'Tempo' ? 'bg-orange-100 text-orange-700' :
                                            'bg-surface-container-highest text-surface-on-variant'
                                        }`}>
                                            {suggestedWorkout.type}
                                        </span>
                                        <span className="text-xs font-bold text-surface-on-variant">{suggestedWorkout.duration} min</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-surface-on leading-tight mb-2">{suggestedWorkout.title}</h4>
                                    <p className="text-xs text-surface-on-variant leading-relaxed">{suggestedWorkout.description}</p>
                                    <button onClick={() => setSuggestedWorkout(null)} className="mt-4 text-xs font-bold text-surface-on-variant hover:text-primary flex items-center gap-1">
                                        <RefreshCw size={10} /> New Suggestion
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center opacity-60">
                                    <p className="text-sm font-bold text-surface-on">Need a plan for today?</p>
                                    <p className="text-xs text-surface-on-variant">Get an AI recommendation based on your load.</p>
                                </div>
                            )}
                        </div>
                        {/* Background decoration */}
                        <div className="absolute -right-6 -bottom-6 opacity-5 text-surface-on pointer-events-none group-hover:opacity-10 transition-opacity">
                            <BrainCircuit size={120} />
                        </div>
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
                
                // Calculate Pace per Shoe & Sort by Default then Usage
                const shoesWithStats = activeShoes.map(shoe => {
                    const shoeRuns = runs.filter(r => r.shoeId === shoe.id);
                    const totalDist = shoeRuns.reduce((acc, r) => acc + r.distance, 0);
                    const totalDur = shoeRuns.reduce((acc, r) => acc + r.duration, 0);
                    const avgPace = totalDist > 0 ? formatPace(totalDist, totalDur) : '--:--';
                    return { ...shoe, avgPace, runCount: shoeRuns.length };
                });

                const sortedShoes = [...shoesWithStats].sort((a, b) => {
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
                            <style dangerouslySetInnerHTML={{__html: `.no-scrollbar::-webkit-scrollbar { display: none; }`}} />
                            
                            {sortedShoes.map((shoe) => {
                                const progress = Math.min(100, (shoe.distance / shoe.maxDistance) * 100);
                                const remaining = Math.max(0, shoe.maxDistance - shoe.distance);
                                let barColor = 'bg-[#06D6A0]'; // Green
                                if (progress > 50) barColor = 'bg-[#FFD166]'; // Yellow
                                if (progress > 80) barColor = 'bg-[#EF476F]'; // Red
                                
                                return (
                                    <div key={shoe.id} className="snap-center shrink-0 w-[85%] sm:w-[280px] bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                             <div className="max-w-[75%]">
                                                <h4 className="text-lg font-bold text-surface-on truncate leading-tight">{shoe.brand}</h4>
                                                <p className="text-sm text-surface-on-variant font-medium truncate">{shoe.model}</p>
                                             </div>
                                             {shoe.isDefault && (
                                                <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase px-2 py-1 rounded-md shrink-0">Primary</span>
                                             )}
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            <div className="bg-surface-container p-2 rounded-lg">
                                                <p className="text-[10px] text-surface-on-variant font-bold uppercase">Mileage</p>
                                                <p className="text-sm font-bold text-surface-on">{shoe.distance.toFixed(0)} km</p>
                                            </div>
                                            <div className="bg-surface-container p-2 rounded-lg">
                                                <p className="text-[10px] text-surface-on-variant font-bold uppercase">Avg Pace</p>
                                                <p className="text-sm font-bold text-surface-on">{shoe.avgPace} <span className="text-[10px] font-normal text-surface-on-variant">/km</span></p>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-surface-on-variant uppercase">{Math.round(100 - progress)}% Life Left</span>
                                                {remaining < 50 && <AlertTriangle size={12} className="text-error" />}
                                            </div>
                                            <div className="relative h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                                <div 
                                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${barColor}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            case 'streak':
                return (
                    <div className="bg-surface-container rounded-[24px] p-6 h-full shadow-sm border border-outline-variant/20 flex flex-col relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-surface-on mb-1 flex items-center gap-2">
                                    <Flame className="text-[#FC4C02]" size={24} fill="currentColor" />
                                    Consistency
                                </h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-surface-on">{streakData.current}</span>
                                    <span className="text-sm font-bold text-surface-on-variant uppercase">Week Streak</span>
                                </div>
                            </div>
                            
                            {/* Heatmap Legend */}
                            <div className="flex items-center gap-1 text-[10px] text-surface-on-variant font-bold">
                                <span>Less</span>
                                <div className="w-2 h-2 bg-surface-container-highest rounded-sm"></div>
                                <div className="w-2 h-2 bg-primary/40 rounded-sm"></div>
                                <div className="w-2 h-2 bg-primary/70 rounded-sm"></div>
                                <div className="w-2 h-2 bg-primary rounded-sm"></div>
                                <span>More</span>
                            </div>
                        </div>

                        {/* Heatmap Grid */}
                        <div className="flex-1 flex items-end pb-2 overflow-x-auto overflow-y-hidden no-scrollbar">
                             <div className="grid grid-rows-7 grid-flow-col gap-1">
                                 {heatmapData.map((day, i) => (
                                     <div 
                                        key={i}
                                        title={`${day.date.toLocaleDateString()}: ${day.distance}km`}
                                        className={`w-3 h-3 rounded-sm transition-colors hover:ring-1 ring-surface-on ${
                                            day.intensity === 0 ? 'bg-surface-container-highest' :
                                            day.intensity === 1 ? 'bg-primary/30' :
                                            day.intensity === 2 ? 'bg-primary/50' :
                                            day.intensity === 3 ? 'bg-primary/80' :
                                            'bg-primary'
                                        }`}
                                     />
                                 ))}
                             </div>
                        </div>
                    </div>
                );
            case 'rotw':
                if (!runOfTheWeek) return (
                    <div className="bg-surface-container rounded-[24px] p-6 h-full border border-outline-variant/20 flex flex-col items-center justify-center text-center opacity-60">
                         <Star size={32} className="mb-2" />
                         <p className="text-sm font-bold">No run yet this week</p>
                    </div>
                );
                return (
                     <div className="bg-surface-container rounded-[24px] p-6 h-full shadow-sm border border-outline-variant/20 flex flex-col relative overflow-hidden bg-gradient-to-br from-surface-container to-surface-container-high">
                        <h3 className="text-lg font-bold text-surface-on mb-4 flex items-center gap-2 relative z-10">
                             <Star className="text-[#FFD166]" size={20} fill="currentColor" /> Run of the Week
                        </h3>
                        <div className="relative z-10">
                             <p className="text-3xl font-black text-surface-on">{runOfTheWeek.distance} <span className="text-lg font-medium text-surface-on-variant">km</span></p>
                             <p className="text-sm font-bold text-surface-on-variant uppercase mt-1">{formatDate(runOfTheWeek.date)} • {runOfTheWeek.type}</p>
                             <div className="mt-4 flex gap-2">
                                 <span className="text-xs font-bold bg-black/5 dark:bg-white/10 px-2 py-1 rounded">{runOfTheWeek.duration} min</span>
                                 <span className="text-xs font-bold bg-black/5 dark:bg-white/10 px-2 py-1 rounded">{runOfTheWeek.avgHr} bpm</span>
                             </div>
                        </div>
                        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12">
                             <Star size={150} />
                        </div>
                     </div>
                );
            case 'records':
                return (
                    <div className="bg-surface-container rounded-[24px] p-6 h-full shadow-sm border border-outline-variant/20 overflow-hidden">
                        <h3 className="text-lg font-bold text-surface-on mb-4 flex items-center gap-2">
                             <Medal className="text-[#FFD166]" size={20} /> Personal Bests
                        </h3>
                        <div className="space-y-3">
                            {records.map(r => (
                                <div key={r.id} className="flex justify-between items-center border-b border-outline-variant/10 pb-2 last:border-0">
                                    <span className="text-sm font-bold text-surface-on-variant">{r.label}</span>
                                    {r.pb ? (
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-surface-on">{r.pb}</span>
                                            <div className="text-[10px] text-surface-on-variant">{formatDate(r.date)}</div>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-surface-on-variant/50 italic">--:--</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'volume':
                return (
                    <div className="bg-surface-container rounded-[24px] p-6 h-full shadow-sm border border-outline-variant/20 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-bold text-surface-on flex items-center gap-2">
                                 <BarChart3 className="text-primary" size={20} /> Training Volume
                             </h3>
                        </div>
                        <div className="flex-1 min-h-[200px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} stacked>
                                    <XAxis 
                                        dataKey="shortDay" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 10}}
                                        interval="preserveStartEnd"
                                    />
                                    <Tooltip 
                                        cursor={{fill: 'var(--md-sys-color-surface-container-high)'}}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', color: 'var(--md-sys-color-primary)' }}
                                    />
                                    {/* Render bars for each run type, stacked */}
                                    {Object.values(RunType).map((type) => (
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
                        <div className="flex flex-wrap gap-3 mt-4 justify-center">
                            {Object.values(RunType).map(type => (
                                <div key={type} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RUN_TYPE_COLORS[type as RunType] }} />
                                    <span className="text-[10px] font-bold text-surface-on-variant uppercase">{type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'intensity':
                 return (
                    <div className="bg-surface-container rounded-[24px] p-6 h-full shadow-sm border border-outline-variant/20">
                        <h3 className="text-lg font-bold text-surface-on mb-2 flex items-center gap-2">
                             <PieChart className="text-primary" size={20} /> HR Zones
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
                                 <Heart size={24} className="text-surface-on-variant opacity-50" />
                             </div>
                        </div>
                        <div className="flex justify-center gap-3 flex-wrap">
                            {hrZoneData.map(z => (
                                <div key={z.name} className="flex items-center gap-1 text-[10px] font-bold text-surface-on-variant">
                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: z.color}}></div>
                                    {z.name}
                                </div>
                            ))}
                        </div>
                    </div>
                 );
            case 'trends':
                return (
                    <div className="bg-surface-container rounded-[24px] p-6 h-full shadow-sm border border-outline-variant/20">
                        <h3 className="text-lg font-bold text-surface-on mb-6 flex items-center gap-2">
                             <TrendingUp className="text-primary" size={20} /> Pace vs HR
                        </h3>
                         <div className="h-[200px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                    <XAxis dataKey="date" hide />
                                    <YAxis yAxisId="left" hide domain={['dataMin - 1', 'dataMax + 1']} />
                                    <YAxis yAxisId="right" orientation="right" hide domain={['dataMin - 10', 'dataMax + 10']} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="pace" stroke="var(--md-sys-color-primary)" strokeWidth={3} dot={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="hr" stroke="#9CA3AF" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                    <Legend />
                                </LineChart>
                             </ResponsiveContainer>
                        </div>
                    </div>
                );
          default: return null;
      }
  };

  return (
    <div className="animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
         <div>
             <h2 className="text-4xl font-bold text-surface-on tracking-tight">{greeting}, {profile?.name || 'Runner'}</h2>
             <p className="text-surface-on-variant text-lg">Here's your training overview</p>
         </div>
         
         <div className="flex gap-2 bg-surface-container rounded-full p-1 border border-outline-variant/20">
            {['week', 'month', 'year', 'all'].map((range) => (
                <button
                    key={range}
                    onClick={() => setTimeRange(range as any)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${timeRange === range ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'text-surface-on-variant hover:bg-surface-container-highest'}`}
                >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
            ))}
         </div>
      </div>

      {/* Edit Layout Toggle */}
      <div className="flex justify-end mb-4">
          <button 
            onClick={() => setIsEditingLayout(!isEditingLayout)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${isEditingLayout ? 'bg-primary text-primary-on' : 'text-surface-on-variant hover:bg-surface-container-high'}`}
          >
             <Settings2 size={14} /> {isEditingLayout ? 'Done Editing' : 'Customize Layout'}
          </button>
      </div>
      
      {/* Widget Grid */}
      {isEditingLayout && (
          <div className="mb-6 p-4 border-2 border-dashed border-outline-variant/30 rounded-2xl animate-slide-down">
              <p className="text-xs font-bold text-surface-on-variant uppercase mb-3">Available Widgets</p>
              <div className="flex flex-wrap gap-2">
                  {AVAILABLE_WIDGETS.filter(w => !layout.find(l => l.id === w.id)).map(w => (
                      <button key={w.id} onClick={() => addWidget(w.id)} className="flex items-center gap-2 px-3 py-2 bg-surface-container-high hover:bg-primary hover:text-primary-on rounded-lg text-sm font-bold transition-colors">
                          <w.icon size={16} /> {w.label}
                      </button>
                  ))}
                  {AVAILABLE_WIDGETS.every(w => layout.find(l => l.id === w.id)) && (
                      <span className="text-sm text-surface-on-variant italic">All widgets added</span>
                  )}
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {layout.map((item, index) => (
              <div 
                key={item.id}
                draggable={isEditingLayout}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                    ${item.size === 'full' ? 'md:col-span-2' : 'md:col-span-1'}
                    min-h-[240px] transition-all duration-300 relative group
                    ${isEditingLayout ? 'cursor-move ring-2 ring-primary/20 rounded-[24px]' : ''}
                `}
              >
                  {isEditingLayout && (
                      <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-1 backdrop-blur-md">
                          <button onClick={() => toggleWidgetSize(item.id)} className="p-1.5 text-white hover:bg-white/20 rounded-md" title="Resize">
                              {item.size === 'full' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                          </button>
                          <button onClick={() => removeWidget(item.id)} className="p-1.5 text-red-300 hover:bg-red-900/50 rounded-md" title="Remove">
                              <X size={14} />
                          </button>
                      </div>
                  )}
                  
                  {renderWidget(item.id)}
              </div>
          ))}
      </div>
    </div>
  );
};

export default Dashboard;