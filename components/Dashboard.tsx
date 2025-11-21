
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Run, UserProfile, RunType } from '../types';
import { StatCard, Modal } from './UIComponents';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { 
  Activity, Timer, Heart, Trophy, Medal, 
  TrendingUp, Calendar, SlidersHorizontal, 
  Check, GripVertical, Maximize2, Minimize2, X,
  Edit3, Plus, ChevronLeft, ChevronRight
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
    { id: 'volume', label: 'Training Volume', icon: Calendar, defaultSize: 'full' as WidgetSize },
    { id: 'intensity', label: 'Heart Rate Zones', icon: Heart, defaultSize: 'half' as WidgetSize },
    { id: 'trends', label: 'Pace Trends', icon: TrendingUp, defaultSize: 'full' as WidgetSize },
    { id: 'records', label: 'Personal Records', icon: Trophy, defaultSize: 'half' as WidgetSize },
];

const Dashboard: React.FC<DashboardProps> = ({ runs, profile }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('all');
  const [greeting, setGreeting] = useState('');
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  
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

      const savedLayout = localStorage.getItem('redline_dashboard_layout_v2');
      if (savedLayout) {
          try {
            setLayout(JSON.parse(savedLayout));
          } catch (e) {
             // Fallback
             setLayout(AVAILABLE_WIDGETS.map(w => ({ id: w.id, size: w.defaultSize }))); 
          }
      } else {
          // Default Initial Layout
          setLayout(AVAILABLE_WIDGETS.map(w => ({ id: w.id, size: w.defaultSize })));
      }
  }, []);

  const saveLayout = (newLayout: WidgetLayout[]) => {
      setLayout(newLayout);
      localStorage.setItem('redline_dashboard_layout_v2', JSON.stringify(newLayout));
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
      setDraggedItemIndex(index);
      // Create a cleaner ghost image
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
      const newLayout = [...layout, { id, size: def?.defaultSize || 'full' }];
      saveLayout(newLayout);
  };

  // --- Data Processing ---
  const getRunTypeColor = (type: string) => {
    switch (type) {
      case RunType.EASY: return '#9CA3AF'; // Gray
      case RunType.TEMPO: return '#D32F2F'; // Red
      case RunType.INTERVAL: return '#7F1D1D'; // Dark Red
      case RunType.LONG: return '#000000'; // Black
      case RunType.RECOVERY: return '#D1D5DB'; // Light Gray
      case RunType.RACE: return '#DC2626'; // Bright Red
      default: return '#6B7280';
    }
  };

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
    if (filteredRuns.length === 0) return { totalDistance: 0, avgPace: 0, totalRuns: 0, avgHr: 0, avgCadence: 0, avgPaceStr: "0:00" };
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
        { name: 'Z1', min: 0, max: maxHr * 0.6, color: '#F3F4F6', minutes: 0 },
        { name: 'Z2', min: maxHr * 0.6, max: maxHr * 0.7, color: '#9CA3AF', minutes: 0 },
        { name: 'Z3', min: maxHr * 0.7, max: maxHr * 0.8, color: '#4B5563', minutes: 0 },
        { name: 'Z4', min: maxHr * 0.8, max: maxHr * 0.9, color: '#EF4444', minutes: 0 },
        { name: 'Z5', min: maxHr * 0.9, max: 300, color: '#991B1B', minutes: 0 },
    ];
    filteredRuns.forEach(run => {
        const zone = zones.find(z => run.avgHr >= z.min && run.avgHr < z.max);
        if (zone) zone.minutes += run.duration;
    });
    return zones.filter(z => z.minutes > 0).map(z => ({ ...z, value: z.minutes }));
  }, [filteredRuns, profile]);

  const records = useMemo(() => {
    const milestones = [
      { label: '5km', distance: 5, icon: <Medal size={18} /> },
      { label: '10km', distance: 10, icon: <Medal size={18} /> },
      { label: 'Half', distance: 21.0975, icon: <Trophy size={18} /> },
      { label: 'Full', distance: 42.195, icon: <Trophy size={18} /> },
    ];

    return milestones.map(milestone => {
      const eligibleRuns = filteredRuns.filter(r => r.distance >= milestone.distance);
      if (eligibleRuns.length === 0) return { ...milestone, best: null };
      
      const bestRun = eligibleRuns.reduce((best, current) => {
        const currentPace = current.duration / current.distance;
        const bestPace = best.duration / best.distance;
        return currentPace < bestPace ? current : best;
      });

      const totalMinutes = (bestRun.duration / bestRun.distance) * milestone.distance;
      const h = Math.floor(totalMinutes / 60);
      const m = Math.floor(totalMinutes % 60);
      const s = Math.round((totalMinutes * 60) % 60);
      const timeStr = h > 0 
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m}:${s.toString().padStart(2, '0')}`;

      return { ...milestone, best: timeStr, date: bestRun.date };
    });
  }, [filteredRuns]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-container p-3 border border-outline-variant/20 shadow-lg rounded-xl text-xs">
          <p className="font-bold text-surface-on mb-1">{label}</p>
          {payload.map((p: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-0.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                <span className="text-surface-on-variant capitalize">{p.name}:</span>
                <span className="font-bold text-surface-on">
                    {p.name === 'pace' ? `${Math.floor(p.value)}:${Math.round((p.value % 1) * 60).toString().padStart(2,'0')} /km` : p.value}
                </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // --- Render Helpers ---
  const renderWidgetContent = (id: string) => {
      switch (id) {
          case 'stats':
              return (
                <div className="grid grid-cols-2 gap-3 h-full">
                    <StatCard title="Distance" value={`${stats.totalDistance} km`} icon={<Activity />} colorClass="bg-surface-on text-surface-inverse-on" />
                    <StatCard title="Avg Pace" value={`${stats.avgPaceStr} /km`} icon={<Timer />} colorClass="bg-primary text-primary-on" />
                    <StatCard title="Runs" value={stats.totalRuns.toString()} icon={<Calendar />} colorClass="bg-surface-container-high text-surface-on" />
                    <StatCard title="Avg HR" value={`${stats.avgHr} bpm`} icon={<Heart />} colorClass="bg-error-container text-error-on-container" />
                </div>
              );
          case 'volume':
              return (
                 <div className="bg-surface-container p-5 md:p-6 rounded-[24px] border border-outline-variant/20 shadow-sm h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <h3 className="text-lg font-bold text-surface-on flex items-center gap-2">
                            <Activity size={18} className="text-surface-on-variant" />
                            Training Volume
                        </h3>
                    </div>
                    <div className="flex-1 min-h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280'}} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                                <Bar dataKey="distance" name="Distance" radius={[4, 4, 0, 0]} animationDuration={1000}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getRunTypeColor(entry.type)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
              );
          case 'intensity':
              return (
                <div className="bg-surface-container p-5 md:p-6 rounded-[24px] border border-outline-variant/20 shadow-sm h-full flex flex-col">
                    <h3 className="text-lg font-bold text-surface-on mb-4 flex items-center gap-2 shrink-0">
                        <Heart size={18} className="text-surface-on-variant" />
                        Intensity Dist.
                    </h3>
                    <div className="flex-1 min-h-[160px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={hrZoneData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {hrZoneData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="text-2xl font-bold text-surface-on">{stats.avgHr}</span>
                                <div className="text-[9px] font-bold text-surface-on-variant uppercase">Avg BPM</div>
                            </div>
                        </div>
                    </div>
                </div>
              );
          case 'trends':
              return (
                <div className="bg-surface-container p-5 md:p-6 rounded-[24px] border border-outline-variant/20 shadow-sm h-full flex flex-col">
                    <h3 className="text-lg font-bold text-surface-on mb-4 flex items-center gap-2 shrink-0">
                        <TrendingUp size={18} className="text-surface-on-variant" />
                        Pace vs Heart Rate
                    </h3>
                    <div className="flex-1 min-h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280'}} dy={10} />
                                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280'}} domain={['auto', 'auto']} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#EF4444'}} domain={['auto', 'auto']} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line yAxisId="left" type="monotone" dataKey="pace" stroke="#000000" strokeWidth={2} dot={false} name="pace" activeDot={{r: 6}} />
                                <Line yAxisId="right" type="monotone" dataKey="hr" stroke="#EF4444" strokeWidth={2} dot={false} name="hr" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
              );
          case 'records':
              return (
                <div className="bg-surface-container p-5 md:p-6 rounded-[24px] border border-outline-variant/20 shadow-sm h-full flex flex-col">
                     <h3 className="text-lg font-bold text-surface-on mb-4 flex items-center gap-2 shrink-0">
                        <Trophy size={18} className="text-surface-on-variant" />
                        Personal Bests
                    </h3>
                    <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
                        {records.map((record, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${record.best ? 'bg-primary text-primary-on' : 'bg-surface-container-highest text-surface-on-variant'}`}>
                                        {React.cloneElement(record.icon as any, { size: 16 })}
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-surface-on-variant uppercase">{record.label}</div>
                                        <div className={`font-bold text-sm ${record.best ? 'text-surface-on' : 'text-surface-on-variant/50'}`}>
                                            {record.best || '--:--'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
              );
          default: return null;
      }
  };

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Header & Personalization */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-surface-on tracking-tight">
                    {greeting}, <span className="text-primary">{profile?.name?.split(' ')[0] || 'Runner'}</span>
                </h1>
                <p className="text-surface-on-variant text-sm md:text-base">Here is your performance breakdown.</p>
            </div>
            <div className="flex gap-2">
                {isEditingLayout ? (
                    <>
                         <button 
                            onClick={() => setIsCustomizeOpen(true)}
                            className="px-4 py-2.5 rounded-full bg-surface-container-highest text-surface-on hover:bg-surface-container-high transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Plus size={18} />
                            <span className="text-sm font-bold">Add Widget</span>
                        </button>
                        <button 
                            onClick={() => setIsEditingLayout(false)}
                            className="px-4 py-2.5 rounded-full bg-primary text-primary-on transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Check size={18} />
                            <span className="text-sm font-bold">Done</span>
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => setIsEditingLayout(true)}
                        className="px-4 py-2.5 rounded-full bg-surface-container-high text-surface-on hover:bg-surface-container-highest transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Edit3 size={18} />
                        <span className="text-sm font-bold">Customize</span>
                    </button>
                )}
            </div>
        </div>
        
        {/* Time Filter */}
        <div className="overflow-x-auto no-scrollbar pb-1">
            <div className="bg-surface-container-high p-1 rounded-full flex border border-outline-variant/20 w-max">
                {['week', 'month', 'year', 'all'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTimeRange(t as any)}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all ${
                            timeRange === t 
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' 
                            : 'text-surface-on-variant hover:bg-surface-container-highest hover:text-surface-on'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Dynamic Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
         {layout.map((widget, index) => (
             <div
                key={widget.id}
                draggable={isEditingLayout}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                    transition-all duration-300 ease-in-out relative rounded-[24px]
                    ${widget.size === 'full' ? 'lg:col-span-2' : 'lg:col-span-1'}
                    ${isEditingLayout ? 'cursor-move ring-2 ring-primary/20 ring-offset-2 hover:ring-primary bg-surface-container/50' : ''}
                    ${draggedItemIndex === index ? 'opacity-40 scale-95' : 'opacity-100'}
                `}
                style={{
                    // Subtle shake animation when editing
                    animation: isEditingLayout ? `wiggle 0.3s infinite alternate` : 'none',
                    animationDelay: `${index * 0.05}s`
                }}
             >
                 {/* Edit Mode Controls */}
                 {isEditingLayout && (
                     <>
                         {/* Resizing & Removing (Top Right) */}
                         <div className="absolute -top-3 -right-3 z-10 flex gap-2">
                             <button 
                                 onClick={() => toggleWidgetSize(widget.id)}
                                 className="bg-surface-on text-surface-inverse-on p-2 rounded-full shadow-md hover:scale-110 transition-transform"
                                 title={widget.size === 'full' ? "Shrink" : "Expand"}
                             >
                                 {widget.size === 'full' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                             </button>
                             <button 
                                 onClick={() => removeWidget(widget.id)}
                                 className="bg-red-500 text-white p-2 rounded-full shadow-md hover:scale-110 transition-transform"
                                 title="Remove Widget"
                             >
                                 <X size={14} />
                             </button>
                         </div>

                         {/* Reordering (Top Left) - Mobile Friendly */}
                         <div className="absolute -top-3 -left-3 z-10 flex gap-1">
                            <button 
                                onClick={() => moveWidget(index, 'prev')}
                                disabled={index === 0}
                                className="bg-surface-container-highest text-surface-on p-2 rounded-full shadow-md disabled:opacity-30 hover:bg-primary hover:text-primary-on transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button 
                                onClick={() => moveWidget(index, 'next')}
                                disabled={index === layout.length - 1}
                                className="bg-surface-container-highest text-surface-on p-2 rounded-full shadow-md disabled:opacity-30 hover:bg-primary hover:text-primary-on transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                         </div>
                     </>
                 )}

                 {isEditingLayout && (
                    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-10">
                        <GripVertical size={48} />
                    </div>
                 )}

                 {renderWidgetContent(widget.id)}
             </div>
         ))}
      </div>

      {/* CSS for wiggle animation */}
      <style>{`
        @keyframes wiggle {
            0% { transform: rotate(-0.5deg); }
            100% { transform: rotate(0.5deg); }
        }
      `}</style>

      {/* Empty State */}
      {layout.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-surface-on-variant opacity-60 border-2 border-dashed border-outline-variant/30 rounded-[32px]">
              <SlidersHorizontal size={48} className="mb-4" />
              <p className="font-medium">All widgets are hidden.</p>
              <button onClick={() => setIsCustomizeOpen(true)} className="text-primary font-bold text-sm mt-2 hover:underline">Add Widgets</button>
          </div>
      )}

      {/* Customization Modal */}
      <Modal isOpen={isCustomizeOpen} onClose={() => setIsCustomizeOpen(false)} title="Add Widgets">
          <div className="p-6 space-y-4">
              <p className="text-sm text-surface-on-variant mb-4">Select widgets to add to your dashboard.</p>
              {AVAILABLE_WIDGETS.map(widget => {
                  const isAdded = layout.some(w => w.id === widget.id);
                  const Icon = widget.icon;
                  return (
                    <button
                        key={widget.id}
                        onClick={() => isAdded ? removeWidget(widget.id) : addWidget(widget.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                            isAdded 
                            ? 'bg-primary-container border-primary text-primary-on-container' 
                            : 'bg-surface-container-low border-outline-variant/20 text-surface-on-variant hover:bg-surface-container-high'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isAdded ? 'bg-white/20' : 'bg-surface-container-highest'}`}>
                                <Icon size={20} />
                            </div>
                            <span className="font-bold">{widget.label}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isAdded ? 'bg-primary text-primary-on' : 'bg-surface-container-highest text-transparent'}`}>
                            <Check size={14} strokeWidth={4} />
                        </div>
                    </button>
                  );
              })}
              <div className="pt-4">
                <button onClick={() => setIsCustomizeOpen(false)} className="w-full py-4 bg-surface-on text-surface-inverse-on font-bold rounded-full">Done</button>
              </div>
          </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
