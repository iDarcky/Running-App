
import React, { useMemo, useState, useEffect } from 'react';
import { Run, Goal, UserProfile, RunType } from '../types';
import GoalTracker from './GoalTracker';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceArea, ReferenceLine,
  PieChart, Pie, Legend
} from 'recharts';
import { 
  Activity, Clock, TrendingUp, Footprints, Ruler, Heart, Trophy, Medal, Timer, 
  Calendar, Filter, Settings, Eye, EyeOff, ArrowUp, ArrowDown, Maximize2, 
  Minimize2, RotateCcw, Plus, X
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

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subtext?: string }> = ({ title, value, icon, subtext }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg h-full flex flex-col justify-between">
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider truncate pr-2">{title}</h3>
        <div className="text-brand-400 bg-brand-400/10 p-2 rounded-lg shrink-0">
          {icon}
        </div>
      </div>
      <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
    </div>
    {subtext && <span className="text-slate-500 text-xs mt-2 block">{subtext}</span>}
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ runs, goals, profile, onAddGoal, onDeleteGoal, onNavigate }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<WidgetConfig[]>(DEFAULT_LAYOUT);

  // Load layout from local storage
  useEffect(() => {
    const savedLayout = localStorage.getItem('stride_dashboard_layout');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        // Merge with default to ensure any new widgets are added
        const merged = [...parsed];
        DEFAULT_LAYOUT.forEach(def => {
            if (!merged.find(m => m.id === def.id)) {
                merged.push(def);
            }
        });
        setLayout(merged);
      } catch (e) {
        console.error("Failed to parse layout", e);
      }
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
    if (window.confirm("Reset dashboard to default layout?")) {
        saveLayout(DEFAULT_LAYOUT);
    }
  };

  const getRunTypeColor = (type: string) => {
    switch (type) {
      case RunType.EASY: return '#3b82f6'; // Blue 500
      case RunType.TEMPO: return '#f59e0b'; // Amber 500
      case RunType.INTERVAL: return '#ef4444'; // Red 500
      case RunType.LONG: return '#8b5cf6'; // Violet 500
      case RunType.RECOVERY: return '#10b981'; // Emerald 500
      case RunType.RACE: return '#eab308'; // Yellow 500
      default: return '#64748b'; // Slate 500
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
        { name: 'Z1', min: 0, max: maxHr * 0.6, color: '#94a3b8', minutes: 0 }, 
        { name: 'Z2', min: maxHr * 0.6, max: maxHr * 0.7, color: '#3b82f6', minutes: 0 }, 
        { name: 'Z3', min: maxHr * 0.7, max: maxHr * 0.8, color: '#22c55e', minutes: 0 }, 
        { name: 'Z4', min: maxHr * 0.8, max: maxHr * 0.9, color: '#f59e0b', minutes: 0 }, 
        { name: 'Z5', min: maxHr * 0.9, max: 300, color: '#ef4444', minutes: 0 }, 
    ];
    filteredRuns.forEach(run => {
        const zone = zones.find(z => run.avgHr >= z.min && run.avgHr < z.max);
        if (zone) zone.minutes += run.duration;
    });
    return zones.map(z => ({
        name: z.name,
        value: z.minutes,
        color: z.color,
        range: `${Math.round(z.min)}-${Math.round(z.max)}`
    }));
  }, [filteredRuns, profile]);

  const records = useMemo(() => {
    const milestones = [
      { label: '1km', distance: 1, icon: <Timer size={16} /> },
      { label: '5km', distance: 5, icon: <Medal size={16} className="text-blue-400" /> },
      { label: '10km', distance: 10, icon: <Medal size={16} className="text-purple-400" /> },
      { label: 'Half', distance: 21.0975, icon: <Trophy size={16} className="text-amber-400" /> },
      { label: 'Full', distance: 42.195, icon: <Trophy size={16} className="text-rose-400" /> },
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
        best: { time: pace * milestone.distance, date: bestRun.date, pace: pace }
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
      <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="bg-brand-500/20 p-6 rounded-full">
           <Activity size={64} className="text-brand-500" />
        </div>
        <h1 className="text-4xl font-bold text-white">Welcome to StrideAI</h1>
        <p className="text-slate-400 max-w-md text-lg">
          Your personal AI running coach. Please connect or log a run manually to get started with insights, trends, and goals.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto px-6">
             <button onClick={() => onNavigate('log')} className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium shadow-lg">Go to Logs</button>
             <button onClick={() => onNavigate('profile')} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium border border-slate-600">Setup Profile</button>
        </div>
      </div>
    );
  }

  const renderWidgetContent = (id: string) => {
    switch(id) {
        case 'goals':
            return <GoalTracker runs={runs} goals={goals} onAddGoal={onAddGoal} onDeleteGoal={onDeleteGoal} />;
        
        case 'stat_dist':
            return <StatCard title="Total Distance" value={`${stats.totalDistance} km`} icon={<Activity size={20} />} subtext={timeRange === 'all' ? "All time" : "Selected period"} />;
        
        case 'stat_pace':
            return <StatCard title="Avg Pace" value={`${stats.avgPaceStr} /km`} icon={<Clock size={20} />} subtext="Average pace" />;
        
        case 'stat_cadence':
            return <StatCard title="Avg Cadence" value={stats.avgCadence ? `${stats.avgCadence} spm` : '--'} icon={<Footprints size={20} />} subtext="Steps per min" />;
        
        case 'stat_hr':
            return <StatCard title="Avg HR" value={`${stats.avgHr} bpm`} icon={<TrendingUp size={20} />} subtext="Intensity" />;
        
        case 'records':
            return (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg h-full">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Trophy className="text-yellow-500" size={20} />
                        Personal Records {timeRange !== 'all' && '(Period Best)'}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {records.map((record, idx) => (
                            <div key={idx} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 flex flex-col group">
                                <div className="text-slate-400 text-xs font-medium uppercase mb-1 flex items-center gap-1">
                                    {record.icon} {record.label}
                                </div>
                                {record.best ? (
                                    <div>
                                        <div className="text-white font-bold text-lg">{formatDuration(record.best.time)}</div>
                                        <div className="text-slate-600 text-[10px] mt-1">
                                            {new Date(record.best.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                                        </div>
                                    </div>
                                ) : <div className="text-slate-600 text-sm italic mt-1">--:--</div>}
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'chart_dist':
            return (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg h-full min-h-[400px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Distance History</h3>
                        <div className="flex gap-2 flex-wrap justify-end">
                             {/* Legend dots could go here */}
                        </div>
                    </div>
                    {chartData.length > 0 ? (
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
                                    cursor={{fill: '#334155', opacity: 0.4}}
                                />
                                <Bar dataKey="distance" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getRunTypeColor(entry.type)} />
                                    ))}
                                </Bar>
                            </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <div className="h-80 flex items-center justify-center text-slate-500">No data</div>}
                </div>
            );

        case 'chart_hr':
             return (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg h-full min-h-[350px]">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Heart size={20} className="text-rose-500" /> Zones
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hrZoneData} layout="vertical" margin={{ left: 0, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{fontSize: 11}} width={30} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                    {hrZoneData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
             );
        
        case 'chart_pace':
             return (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg h-full min-h-[350px]">
                    <h3 className="text-lg font-semibold text-white mb-4">Pace vs HR</h3>
                    {chartData.length > 0 ? (
                        <div className="h-64 w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="left" stroke="#38bdf8" hide domain={['dataMin - 1', 'dataMax + 1']} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" hide domain={['dataMin - 10', 'dataMax + 10']} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="pace" stroke="#38bdf8" strokeWidth={2} dot={{r:2}} />
                                    <Line yAxisId="right" type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={2} dot={{r:2}} />
                                </LineChart>
                             </ResponsiveContainer>
                        </div>
                    ) : <div className="h-64 flex items-center justify-center text-slate-500">No data</div>}
                </div>
             );

        case 'chart_form':
             return (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg h-full min-h-[400px]">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Ruler size={20} className="text-purple-400" /> Form Analysis
                    </h3>
                    {chartData.length > 0 ? (
                        <div className="h-72 w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="left" stroke="#c084fc" tick={{fontSize: 11}} domain={[140, 210]} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#fbbf24" tick={{fontSize: 11}} domain={[0, 2.0]} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                    <ReferenceArea yAxisId="left" y1={170} y2={185} fill="#c084fc" fillOpacity={0.1} />
                                    <Line yAxisId="left" type="monotone" dataKey="cadence" stroke="#c084fc" strokeWidth={2} dot={{r:3}} name="Cadence" connectNulls />
                                    <Line yAxisId="right" type="monotone" dataKey="strideLength" stroke="#fbbf24" strokeWidth={2} dot={{r:3}} name="Stride" connectNulls />
                                </LineChart>
                             </ResponsiveContainer>
                        </div>
                    ) : <div className="h-72 flex items-center justify-center text-slate-500">No data</div>}
                </div>
             );

        default: return null;
    }
  };

  // --- RENDER ---
  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
         <div>
            <h1 className="text-3xl font-bold text-white">
            Hello, <span className="text-brand-400">{profile?.name || 'Runner'}</span>
            </h1>
            <p className="text-slate-400 text-lg">Your customizable training hub.</p>
         </div>

         <div className="flex items-center gap-3">
            {/* Customize Button */}
            <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${isEditing ? 'bg-brand-500 border-brand-400 text-white shadow-lg shadow-brand-500/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}
            >
                <Settings size={18} className={isEditing ? 'animate-spin-slow' : ''} />
                <span className="hidden sm:inline">{isEditing ? 'Done Customizing' : 'Customize'}</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 shadow-sm">
                <div className="pl-3 pr-2 py-1 border-r border-slate-700">
                    <Filter size={16} className="text-slate-400" />
                </div>
                <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="bg-transparent text-white text-sm font-medium p-2 pr-8 outline-none cursor-pointer appearance-none hover:text-brand-400"
                >
                    <option value="all" className="bg-slate-800">All Time</option>
                    <option value="year" className="bg-slate-800">Last Year</option>
                    <option value="month" className="bg-slate-800">Last 30 Days</option>
                    <option value="week" className="bg-slate-800">Last 7 Days</option>
                </select>
            </div>
         </div>
      </div>

      {/* Edit Mode Panel (Hidden Items) */}
      {isEditing && (
        <div className="bg-slate-800 border-y border-slate-700 -mx-4 sm:mx-0 sm:rounded-xl p-4 animate-slide-down mb-6">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Settings size={16} className="text-brand-400" /> Dashboard Settings
                </h3>
                <button onClick={resetLayout} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 border border-rose-500/30 px-2 py-1 rounded hover:bg-rose-500/10 transition-colors">
                    <RotateCcw size={12} /> Reset Default
                </button>
            </div>
            
            {/* Restore Hidden Widgets */}
            <div className="flex flex-wrap gap-2">
                {layout.filter(w => !w.visible).map(widget => (
                    <button 
                        key={widget.id}
                        onClick={() => toggleWidgetVisibility(widget.id)}
                        className="flex items-center gap-2 bg-slate-900 border border-slate-600 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-700 hover:text-white hover:border-brand-500 transition-all text-sm"
                    >
                        <Plus size={14} /> {widget.title}
                    </button>
                ))}
                {layout.every(w => w.visible) && (
                    <span className="text-slate-500 text-sm italic">All widgets are visible. Use the toggles on the cards to hide them.</span>
                )}
            </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {layout.filter(w => w.visible || isEditing).map((widget, index) => {
            if (!widget.visible && !isEditing) return null;
            
            // Determine class based on colSpan state
            // On mobile always col-span-1 (full width in single col grid), on md 2 col grid, on lg 4 col grid
            // We map internal 1-4 scale to css classes
            let colClass = 'col-span-1'; // Default for mobile/base
            
            // For LG screens (4 columns)
            if (widget.colSpan === 4) colClass += ' lg:col-span-4';
            else if (widget.colSpan === 3) colClass += ' lg:col-span-3';
            else if (widget.colSpan === 2) colClass += ' lg:col-span-2';
            else colClass += ' lg:col-span-1';

            // For MD screens (2 columns) - map 1->1, 2+->2 (full width on tablet)
            if (widget.colSpan >= 2) colClass += ' md:col-span-2';
            else colClass += ' md:col-span-1';

            return (
                <div 
                    key={widget.id} 
                    className={`
                        relative transition-all duration-300
                        ${colClass}
                        ${!widget.visible ? 'opacity-40 grayscale' : ''}
                        ${isEditing ? 'ring-2 ring-brand-500/50 rounded-xl bg-slate-800/50 border-dashed border-2 border-slate-600 p-2' : ''}
                    `}
                >
                    {/* Edit Overlay Controls */}
                    {isEditing && (
                        <div className="absolute -top-3 left-0 right-0 flex justify-center z-20 px-4">
                            <div className="bg-slate-900 border border-slate-600 shadow-xl rounded-full flex items-center gap-1 p-1 px-3 text-slate-200 scale-90 hover:scale-100 transition-transform">
                                <button 
                                    onClick={() => moveWidget(index, 'up')} 
                                    disabled={index === 0}
                                    className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                                    title="Move Left/Up"
                                >
                                    <ArrowUp size={14} className="-rotate-90 lg:rotate-0" />
                                </button>
                                <div className="w-px h-3 bg-slate-700 mx-1"></div>
                                
                                <button 
                                    onClick={() => toggleWidgetSize(widget.id, false)}
                                    className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 hover:text-blue-400"
                                    disabled={widget.colSpan <= 1}
                                    title="Shrink Width"
                                >
                                    <Minimize2 size={14} />
                                </button>
                                <span className="text-[10px] font-mono bg-slate-800 px-1.5 rounded text-slate-400">{widget.colSpan}x</span>
                                <button 
                                    onClick={() => toggleWidgetSize(widget.id, true)}
                                    className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 hover:text-blue-400"
                                    disabled={widget.colSpan >= 4}
                                    title="Expand Width"
                                >
                                    <Maximize2 size={14} />
                                </button>
                                
                                <div className="w-px h-3 bg-slate-700 mx-1"></div>
                                <button 
                                    onClick={() => toggleWidgetVisibility(widget.id)}
                                    className={`p-1 rounded hover:bg-slate-700 ${!widget.visible ? 'text-brand-400' : 'hover:text-rose-400'}`}
                                    title={widget.visible ? "Hide" : "Show"}
                                >
                                    {widget.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>

                                <div className="w-px h-3 bg-slate-700 mx-1"></div>
                                <button 
                                    onClick={() => moveWidget(index, 'down')} 
                                    disabled={index === layout.length - 1}
                                    className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                                    title="Move Right/Down"
                                >
                                    <ArrowDown size={14} className="-rotate-90 lg:rotate-0" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Render The Widget */}
                    <div className={isEditing && !widget.visible ? 'pointer-events-none blur-[2px]' : ''}>
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
