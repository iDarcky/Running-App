
import React, { useMemo, useState, useEffect } from 'react';
import { Run, UserProfile, RunType } from '../types';
import { RUN_TYPE_COLORS } from '../constants';
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
  Map, Footprints, BarChart3, PieChart, Target
} from 'lucide-react';

interface DashboardProps {
  runs: Run[];
  goals: any[];
  profile?: UserProfile;
  onAddGoal: (goal: any) => void;
  onDeleteGoal: (id: string) => void;
  onNavigate: (tab: 'dashboard' | 'log' | 'coach' | 'profile') => void;
}

// Widget Definition Types
type WidgetSize = 'half' | 'full';
interface WidgetLayout {
    id: string;
    size: WidgetSize;
}

const AVAILABLE_WIDGETS = [
    { id: 'stats', label: 'Key Statistics', icon: Activity, defaultSize: 'full' as WidgetSize },
    { id: 'records', label: 'Personal Bests', icon: Medal, defaultSize: 'half' as WidgetSize },
    { id: 'volume', label: 'Training Volume', icon: BarChart3, defaultSize: 'full' as WidgetSize },
    { id: 'intensity', label: 'Intensity Dist.', icon: PieChart, defaultSize: 'half' as WidgetSize },
    { id: 'goals', label: 'Goals', icon: Target, defaultSize: 'full' as WidgetSize },
    { id: 'trends', label: 'Pace vs Heart Rate', icon: TrendingUp, defaultSize: 'full' as WidgetSize },
];

const Dashboard: React.FC<DashboardProps> = ({ runs, goals, profile, onAddGoal, onDeleteGoal, onNavigate }) => {
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

      const savedLayout = localStorage.getItem('redline_dashboard_layout_v4');
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
      localStorage.setItem('redline_dashboard_layout_v4', JSON.stringify(newLayout));
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
    const avgPaceDec = totalDistance > 0 ? totalDuration / totalDistance : 0; 
    const paceMin = Math.floor(avgPaceDec);
    const paceSec = Math.round((avgPaceDec - paceMin) * 60);
    const totalRuns = filteredRuns.length;
    const avgHr = Math.round(filteredRuns.reduce((acc, run) => acc + run.avgHr, 0) / totalRuns);
    const runsWithCadence = filteredRuns.filter(r => r.cadence);
    const avgCadence = runsWithCadence.length > 0 
        ? Math.round(runsWithCadence.reduce((acc, r) => acc + (r.cadence || 0), 0) / runsWithCadence.length)
        : 0;
    return {
      totalDistance: totalDistance.toFixed(1),
      avgPaceStr: `${paceMin}:${paceSec.toString().padStart(2, '0')}`,
      totalRuns,
      avgHr,
      avgCadence
    };
  }, [filteredRuns]);

  const chartData = useMemo(() => {
    return [...filteredRuns]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(run => ({
            date: new Date(run.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            distance: run.distance,
            pace: parseFloat((run.duration / run.distance).toFixed(2)),
            hr: run.avgHr,
            cadence: run.cadence || null,
            type: run.type
      }));
  }, [filteredRuns]);

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
      const min = Math.floor(time % 60);
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

        {/* Grid Layout - Expanded to 3 columns on XL screens */}
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
    </div>
  );
};

export default Dashboard;
