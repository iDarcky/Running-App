import React, { useMemo, useState, useEffect } from 'react';
import { Run, Goal, UserProfile, RunType } from '../types';
import GoalTracker from './GoalTracker';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceArea
} from 'recharts';
import { 
  Activity, Clock, TrendingUp, Footprints, Ruler, Heart, Trophy, Medal, Timer, 
  Filter, Settings, Eye, EyeOff, ArrowUp, ArrowDown, Maximize2, 
  Minimize2, RotateCcw, Plus
} from 'lucide-react';

interface DashboardProps {
  runs: Run[];
  goals: Goal[];
  profile?: UserProfile;
  onAddGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onNavigate: (tab: 'dashboard' | 'log' | 'coach' | 'profile') => void;
}

interface WidgetConfig {
  id: string;
  visible: boolean;
  colSpan: number; // 1 to 4
  title: string;
}

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'goals', visible: true, colSpan: 4, title: 'Goals' },
  { id: 'stat_dist', visible: true, colSpan: 1, title: 'Distance Stat' },
  { id: 'stat_pace', visible: true, colSpan: 1, title: 'Pace Stat' },
  { id: 'stat_cadence', visible: true, colSpan: 1, title: 'Cadence Stat' },
  { id: 'stat_hr', visible: true, colSpan: 1, title: 'Heart Rate Stat' },
  { id: 'records', visible: true, colSpan: 4, title: 'Personal Records' },
  { id: 'chart_dist', visible: true, colSpan: 4, title: 'Distance History' },
  { id: 'chart_hr', visible: true, colSpan: 2, title: 'HR Zones' },
  { id: 'chart_pace', visible: true, colSpan: 2, title: 'Pace vs HR' },
  { id: 'chart_form', visible: true, colSpan: 4, title: 'Form Analysis' },
];

const M3Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-surface-container rounded-[24px] p-6 shadow-sm border border-outline-variant/20 transition-all hover:shadow-md ${className}`}>
        {children}
    </div>
);

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subtext?: string; colorClass?: string }> = ({ title, value, icon, subtext, colorClass = 'bg-primary-container text-primary-on-container' }) => (
  <M3Card className="h-full flex flex-col justify-between relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2">
        {React.cloneElement(icon as any, { size: 64 })}
    </div>
    <div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-surface-on-variant text-sm font-medium uppercase tracking-wider truncate pr-2">{title}</h3>
        <div className={`p-3 rounded-full ${colorClass} shadow-sm`}>
          {icon}
        </div>
      </div>
      <span className="text-4xl font-bold text-surface-on tracking-tight relative z-10">{value}</span>
    </div>
    {subtext && <span className="text-surface-on-variant text-xs mt-2 block font-medium relative z-10">{subtext}</span>}
  </M3Card>
);

const Dashboard: React.FC<DashboardProps> = ({ runs, goals, profile, onAddGoal, onDeleteGoal, onNavigate }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<WidgetConfig[]>(DEFAULT_LAYOUT);

  // Load layout
  useEffect(() => {
    const savedLayout = localStorage.getItem('stride_dashboard_layout');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        const merged = [...parsed];
        DEFAULT_LAYOUT.forEach(def => {
            if (!merged.find(m => m.id === def.id)) merged.push(def);
        });
        setLayout(merged);
      } catch (e) { console.error("Failed to parse layout", e); }
    }
  }, []);

  const saveLayout = (newLayout: WidgetConfig[]) => {
    setLayout(newLayout);
    localStorage.setItem('stride_dashboard_layout', JSON.stringify(newLayout));
  };

  const toggleWidgetVisibility = (id: string) => {
    const newLayout = layout.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    saveLayout(newLayout);
  };

  const toggleWidgetSize = (id: string, increase: boolean) => {
    const newLayout = layout.map(w => {
      if (w.id === id) {
        let newSpan = w.colSpan + (increase ? 1 : -1);
        if (newSpan < 1) newSpan = 1;
        if (newSpan > 4) newSpan = 4;
        return { ...w, colSpan: newSpan };
      }
      return w;
    });
    saveLayout(newLayout);
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const newLayout = [...layout];
    if (direction === 'up' && index > 0) {
      [newLayout[index], newLayout[index - 1]] = [newLayout[index - 1], newLayout[index]];
    } else if (direction === 'down' && index < newLayout.length - 1) {
      [newLayout[index], newLayout[index + 1]] = [newLayout[index + 1], newLayout[index]];
    }
    saveLayout(newLayout);
  };

  const resetLayout = () => {
    if (window.confirm("Reset dashboard to default layout?")) saveLayout(DEFAULT_LAYOUT);
  };

  const getRunTypeColor = (type: string) => {
    switch (type) {
      case RunType.EASY: return '#6750A4'; // Primary
      case RunType.TEMPO: return '#EAB308'; // Yellow
      case RunType.INTERVAL: return '#B3261E'; // Error/Red
      case RunType.LONG: return '#7D5260'; // Tertiary
      case RunType.RECOVERY: return '#625B71'; // Secondary
      case RunType.RACE: return '#F59E0B'; // Orange
      default: return '#79747E';
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
    if (filteredRuns.length === 0) return { totalDistance: 0, avgPace: 0, totalRuns: 0, avgHr: 0, avgCadence: 0 };
    const totalDistance = filteredRuns.reduce((acc, run) => acc + run.distance, 0);
    const totalDuration = filteredRuns.reduce((acc, run) => acc + run.duration, 0);
    const avgPaceDec = totalDuration / (totalDistance || 1); 
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
            strideLength: run.strideLength || null,
            type: run.type
      }));
  }, [filteredRuns]);

  const hrZoneData = useMemo(() => {
    const age = profile?.age && profile.age > 0 ? profile.age : 30;
    const maxHr = 220 - age;
    const zones = [
        { name: 'Z1', min: 0, max: maxHr * 0.6, color: '#79747E', minutes: 0 }, 
        { name: 'Z2', min: maxHr * 0.6, max: maxHr * 0.7, color: '#6750A4', minutes: 0 }, 
        { name: 'Z3', min: maxHr * 0.7, max: maxHr * 0.8, color: '#625B71', minutes: 0 }, 
        { name: 'Z4', min: maxHr * 0.8, max: maxHr * 0.9, color: '#7D5260', minutes: 0 }, 
        { name: 'Z5', min: maxHr * 0.9, max: 300, color: '#B3261E', minutes: 0 }, 
    ];
    filteredRuns.forEach(run => {
        const zone = zones.find(z => run.avgHr >= z.min && run.avgHr < z.max);
        if (zone) zone.minutes += run.duration;
    });
    return zones.map(z => ({ ...z, value: z.minutes, range: `${Math.round(z.min)}-${Math.round(z.max)}` }));
  }, [filteredRuns, profile]);

  const records = useMemo(() => {
    const milestones = [
      { label: '1km', distance: 1, icon: <Timer size={18} /> },
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
      const pace = bestRun.duration / bestRun.distance;
      return {
        ...milestone,
        best: { time: pace * milestone.distance, date: bestRun.date }
      };
    });
  }, [filteredRuns]);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    const s = Math.round((minutes * 60) % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (runs.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center space-y-8">
        <div className="bg-primary-container p-8 rounded-3xl shadow-lg">
           <Activity size={80} className="text-primary-on-container" />
        </div>
        <div>
            <h1 className="text-5xl font-bold text-surface-on tracking-tight mb-4">Welcome</h1>
            <p className="text-surface-on-variant max-w-md text-xl">
            Your intelligent running companion waits. Start logging to unlock insights.
            </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto px-6">
             <button onClick={() => onNavigate('log')} className="px-8 py-4 bg-primary text-primary-on rounded-full font-bold shadow-lg hover:scale-105 transition-transform">Log First Run</button>
             <button onClick={() => onNavigate('profile')} className="px-8 py-4 bg-secondary-container text-secondary-on-container rounded-full font-bold hover:bg-secondary-container/80 transition-colors">Setup Profile</button>
        </div>
      </div>
    );
  }

  const renderWidgetContent = (id: string) => {
    switch(id) {
        case 'goals':
            return <GoalTracker runs={runs} goals={goals} onAddGoal={onAddGoal} onDeleteGoal={onDeleteGoal} />;
        case 'stat_dist':
            return <StatCard title="Distance" value={`${stats.totalDistance} km`} icon={<Activity />} colorClass="bg-primary-container text-primary-on-container" />;
        case 'stat_pace':
            return <StatCard title="Avg Pace" value={`${stats.avgPaceStr} /km`} icon={<Clock />} colorClass="bg-secondary-container text-secondary-on-container" />;
        case 'stat_cadence':
            return <StatCard title="Cadence" value={stats.avgCadence ? `${stats.avgCadence}` : '--'} icon={<Footprints />} colorClass="bg-tertiary-container text-tertiary-on-container" subtext="Steps per min" />;
        case 'stat_hr':
            return <StatCard title="Avg HR" value={`${stats.avgHr} bpm`} icon={<Heart />} colorClass="bg-error-container text-error-on-container" />;
        case 'records':
            return (
                <M3Card className="h-full">
                    <h3 className="text-xl font-bold text-surface-on mb-6 flex items-center gap-2">
                        <Trophy className="text-tertiary" size={24} />
                        Personal Records
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {records.map((record, idx) => (
                            <div key={idx} className="bg-surface-container-highest rounded-2xl p-4 flex flex-col group border border-transparent hover:border-primary/20 transition-all">
                                <div className="text-surface-on-variant text-xs font-bold uppercase mb-2 flex items-center gap-1">
                                    {React.cloneElement(record.icon as any, { size: 14 })} {record.label}
                                </div>
                                {record.best ? (
                                    <div>
                                        <div className="text-primary font-bold text-2xl">{formatDuration(record.best.time)}</div>
                                        <div className="text-surface-on-variant text-[10px] mt-1 opacity-80">
                                            {new Date(record.best.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                                        </div>
                                    </div>
                                ) : <div className="text-surface-on-variant/50 text-sm italic mt-1">--:--</div>}
                            </div>
                        ))}
                    </div>
                </M3Card>
            );

        case 'chart_dist':
            return (
                <M3Card className="h-full min-h-[400px]">
                    <h3 className="text-xl font-bold text-surface-on mb-6">Distance History</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} />
                            <XAxis dataKey="date" stroke="var(--md-sys-color-on-surface-variant)" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--md-sys-color-on-surface-variant)" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', border: 'none', borderRadius: '16px', color: 'var(--md-sys-color-on-surface)' }}
                                cursor={{fill: 'var(--md-sys-color-surface-container-highest)'}}
                            />
                            <Bar dataKey="distance" radius={[8, 8, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getRunTypeColor(entry.type)} />
                                ))}
                            </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                </M3Card>
            );

        case 'chart_hr':
             return (
                <M3Card className="h-full min-h-[350px]">
                    <h3 className="text-xl font-bold text-surface-on mb-6 flex items-center gap-2">
                        <Heart size={24} className="text-error" /> Heart Rate Zones
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hrZoneData} layout="vertical" margin={{ left: 0, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="var(--md-sys-color-on-surface-variant)" tick={{fontSize: 12, fontWeight: 'bold'}} width={30} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', border: 'none', borderRadius: '12px', color: 'var(--md-sys-color-on-surface)' }} />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                                    {hrZoneData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </M3Card>
             );
        
        case 'chart_pace':
             return (
                <M3Card className="h-full min-h-[350px]">
                    <h3 className="text-xl font-bold text-surface-on mb-6">Pace vs Intensity</h3>
                    <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--md-sys-color-on-surface-variant)" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="var(--md-sys-color-primary)" hide domain={['dataMin - 1', 'dataMax + 1']} />
                                <YAxis yAxisId="right" orientation="right" stroke="var(--md-sys-color-error)" hide domain={['dataMin - 10', 'dataMax + 10']} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', border: 'none', borderRadius: '12px', color: 'var(--md-sys-color-on-surface)' }} />
                                <Line yAxisId="left" type="monotone" dataKey="pace" stroke="var(--md-sys-color-primary)" strokeWidth={3} dot={{r:3, fill:'var(--md-sys-color-primary)'}} />
                                <Line yAxisId="right" type="monotone" dataKey="hr" stroke="var(--md-sys-color-error)" strokeWidth={3} dot={{r:3, fill:'var(--md-sys-color-error)'}} />
                            </LineChart>
                            </ResponsiveContainer>
                    </div>
                </M3Card>
             );

        case 'chart_form':
             return (
                <M3Card className="h-full min-h-[400px]">
                    <h3 className="text-xl font-bold text-surface-on mb-6 flex items-center gap-2">
                        <Ruler size={24} className="text-secondary" /> Form Analysis
                    </h3>
                    <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--md-sys-color-on-surface-variant)" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="var(--md-sys-color-secondary)" tick={{fontSize: 11}} domain={[140, 210]} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="var(--md-sys-color-tertiary)" tick={{fontSize: 11}} domain={[0, 2.0]} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', border: 'none', borderRadius: '12px', color: 'var(--md-sys-color-on-surface)' }} />
                                <ReferenceArea yAxisId="left" y1={170} y2={185} fill="var(--md-sys-color-secondary-container)" fillOpacity={0.3} />
                                <Line yAxisId="left" type="monotone" dataKey="cadence" stroke="var(--md-sys-color-secondary)" strokeWidth={3} dot={{r:4}} name="Cadence" connectNulls />
                                <Line yAxisId="right" type="monotone" dataKey="strideLength" stroke="var(--md-sys-color-tertiary)" strokeWidth={3} dot={{r:4}} name="Stride" connectNulls />
                            </LineChart>
                            </ResponsiveContainer>
                    </div>
                </M3Card>
             );
        default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
         <div>
            <h1 className="text-4xl font-bold text-surface-on tracking-tighter">
            Hello, <span className="text-primary">{profile?.name || 'Runner'}</span>
            </h1>
            <p className="text-surface-on-variant text-lg mt-1">Your Expressive Dashboard</p>
         </div>

         <div className="flex items-center gap-3">
            <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all ${isEditing ? 'bg-primary text-primary-on border-primary' : 'bg-surface-container-high text-surface-on-variant border-transparent hover:bg-surface-container-highest'}`}
            >
                <Settings size={20} className={isEditing ? 'animate-spin-slow' : ''} />
                <span className="font-medium text-sm">{isEditing ? 'Done' : 'Customize'}</span>
            </button>

            <div className="flex items-center gap-2 bg-surface-container-high p-1.5 rounded-full border border-outline-variant/20">
                <div className="pl-3 pr-2 text-surface-on-variant">
                    <Filter size={18} />
                </div>
                <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="bg-transparent text-surface-on text-sm font-bold p-1 pr-4 outline-none cursor-pointer appearance-none hover:text-primary"
                >
                    <option value="all" className="bg-surface-container">All Time</option>
                    <option value="year" className="bg-surface-container">Last Year</option>
                    <option value="month" className="bg-surface-container">Last 30 Days</option>
                    <option value="week" className="bg-surface-container">Last 7 Days</option>
                </select>
            </div>
         </div>
      </div>

      {isEditing && (
        <div className="bg-secondary-container text-secondary-on-container rounded-3xl p-6 animate-slide-down mb-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2 text-lg"><Settings size={20} /> Dashboard Configuration</h3>
                <button onClick={resetLayout} className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"><RotateCcw size={12} /> RESET DEFAULT</button>
            </div>
            <div className="flex flex-wrap gap-2">
                {layout.filter(w => !w.visible).map(widget => (
                    <button key={widget.id} onClick={() => toggleWidgetVisibility(widget.id)} className="flex items-center gap-2 bg-surface text-surface-on px-4 py-2 rounded-xl shadow-sm hover:bg-primary-container hover:text-primary-on-container transition-all text-sm font-medium">
                        <Plus size={16} /> {widget.title}
                    </button>
                ))}
                {layout.every(w => w.visible) && <span className="opacity-70 text-sm italic">All widgets are visible.</span>}
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {layout.filter(w => w.visible || isEditing).map((widget, index) => {
            if (!widget.visible && !isEditing) return null;
            let colClass = 'col-span-1';
            if (widget.colSpan === 4) colClass += ' lg:col-span-4';
            else if (widget.colSpan === 3) colClass += ' lg:col-span-3';
            else if (widget.colSpan === 2) colClass += ' lg:col-span-2';
            else colClass += ' lg:col-span-1';
            if (widget.colSpan >= 2) colClass += ' md:col-span-2';
            else colClass += ' md:col-span-1';

            return (
                <div key={widget.id} className={`relative transition-all duration-300 ${colClass} ${!widget.visible ? 'opacity-40 grayscale scale-95' : ''} ${isEditing ? 'ring-2 ring-primary/50 rounded-[26px] p-1' : ''}`}>
                    {isEditing && (
                        <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                            <div className="bg-surface-inverse text-surface-inverse-on shadow-xl rounded-full flex items-center p-1 px-3 gap-1 scale-90 hover:scale-100 transition-transform bg-slate-800 text-white">
                                <button onClick={() => moveWidget(index, 'up')} disabled={index === 0} className="p-1.5 hover:bg-white/20 rounded-full disabled:opacity-30"><ArrowUp size={14} className="-rotate-90 lg:rotate-0" /></button>
                                <button onClick={() => toggleWidgetSize(widget.id, false)} className="p-1.5 hover:bg-white/20 rounded-full disabled:opacity-30" disabled={widget.colSpan <= 1}><Minimize2 size={14} /></button>
                                <span className="text-[10px] font-mono font-bold px-1">{widget.colSpan}x</span>
                                <button onClick={() => toggleWidgetSize(widget.id, true)} className="p-1.5 hover:bg-white/20 rounded-full disabled:opacity-30" disabled={widget.colSpan >= 4}><Maximize2 size={14} /></button>
                                <button onClick={() => toggleWidgetVisibility(widget.id)} className={`p-1.5 rounded-full hover:bg-white/20 ${!widget.visible ? 'text-primary-container' : ''}`}>{widget.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                                <button onClick={() => moveWidget(index, 'down')} disabled={index === layout.length - 1} className="p-1.5 hover:bg-white/20 rounded-full disabled:opacity-30"><ArrowDown size={14} className="-rotate-90 lg:rotate-0" /></button>
                            </div>
                        </div>
                    )}
                    <div className={isEditing && !widget.visible ? 'pointer-events-none blur-sm' : ''}>
                        {renderWidgetContent(widget.id)}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default Dashboard;