
import React, { useMemo, useState } from 'react';
import { Run, Goal, UserProfile, RunType } from '../types';
import GoalTracker from './GoalTracker';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceArea, ReferenceLine,
  PieChart, Pie, Legend
} from 'recharts';
import { Activity, Clock, TrendingUp, Footprints, Ruler, Heart, Trophy, Medal, Timer, Calendar, Filter } from 'lucide-react';

interface DashboardProps {
  runs: Run[];
  goals: Goal[];
  profile?: UserProfile;
  onAddGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onNavigate: (tab: 'dashboard' | 'log' | 'coach' | 'profile') => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subtext?: string }> = ({ title, value, icon, subtext }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
      <div className="text-brand-400 bg-brand-400/10 p-2 rounded-lg">
        {icon}
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-3xl font-bold text-white">{value}</span>
      {subtext && <span className="text-slate-500 text-xs mt-1">{subtext}</span>}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ runs, goals, profile, onAddGoal, onDeleteGoal, onNavigate }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('all');

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
    // Set to start of today for consistent comparison
    now.setHours(0,0,0,0); 
    
    const cutoff = new Date(now);
    
    if (timeRange === 'week') cutoff.setDate(now.getDate() - 7);
    if (timeRange === 'month') cutoff.setDate(now.getDate() - 30);
    if (timeRange === 'year') cutoff.setDate(now.getDate() - 365);

    return runs.filter(run => {
        const runDate = new Date(run.date);
        return runDate >= cutoff;
    });
  }, [runs, timeRange]);
  
  const stats = useMemo(() => {
    if (filteredRuns.length === 0) return { totalDistance: 0, avgPace: 0, totalRuns: 0, avgHr: 0, avgCadence: 0 };

    const totalDistance = filteredRuns.reduce((acc, run) => acc + run.distance, 0);
    const totalDuration = filteredRuns.reduce((acc, run) => acc + run.duration, 0);
    const avgPaceDec = totalDuration / (totalDistance || 1); 
    // Convert decimal pace (min/km) to mm:ss
    const paceMin = Math.floor(avgPaceDec);
    const paceSec = Math.round((avgPaceDec - paceMin) * 60);
    
    const totalRuns = filteredRuns.length;
    const avgHr = Math.round(filteredRuns.reduce((acc, run) => acc + run.avgHr, 0) / totalRuns);
    
    // Calculate average cadence excluding runs without data
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
    // Sort by date ascending for charts
    return [...filteredRuns]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(run => {
        const pace = run.duration / run.distance;
        return {
            date: new Date(run.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            distance: run.distance,
            pace: parseFloat(pace.toFixed(2)),
            hr: run.avgHr,
            cadence: run.cadence || null,
            strideLength: run.strideLength || null,
            type: run.type
        }
      });
  }, [filteredRuns]);

  // HR Zones Calculation
  const hrZoneData = useMemo(() => {
    // Default to age 30 (Max HR 190) if not provided
    const age = profile?.age && profile.age > 0 ? profile.age : 30;
    const maxHr = 220 - age;

    // Zone Definitions (Standard 5-Zone Model)
    const zones = [
        { name: 'Z1 Recovery', min: 0, max: maxHr * 0.6, color: '#94a3b8', minutes: 0 }, // Slate 400
        { name: 'Z2 Aerobic', min: maxHr * 0.6, max: maxHr * 0.7, color: '#3b82f6', minutes: 0 }, // Blue 500
        { name: 'Z3 Tempo', min: maxHr * 0.7, max: maxHr * 0.8, color: '#22c55e', minutes: 0 }, // Green 500
        { name: 'Z4 Threshold', min: maxHr * 0.8, max: maxHr * 0.9, color: '#f59e0b', minutes: 0 }, // Amber 500
        { name: 'Z5 Anaerobic', min: maxHr * 0.9, max: 300, color: '#ef4444', minutes: 0 }, // Red 500
    ];

    filteredRuns.forEach(run => {
        // We classify the whole run based on Avg HR for this high-level view
        const zone = zones.find(z => run.avgHr >= z.min && run.avgHr < z.max);
        if (zone) {
            zone.minutes += run.duration;
        }
    });

    return zones.map(z => ({
        name: z.name,
        value: z.minutes,
        color: z.color,
        range: `${Math.round(z.min)}-${Math.round(z.max)} bpm`
    }));
  }, [filteredRuns, profile]);

  // Personal Records Calculation
  const records = useMemo(() => {
    const milestones = [
      { label: '1km', distance: 1, icon: <Timer size={16} /> },
      { label: '5km', distance: 5, icon: <Medal size={16} className="text-blue-400" /> },
      { label: '10km', distance: 10, icon: <Medal size={16} className="text-purple-400" /> },
      { label: 'Half Marathon', distance: 21.0975, icon: <Trophy size={16} className="text-amber-400" /> },
      { label: 'Marathon', distance: 42.195, icon: <Trophy size={16} className="text-rose-400" /> },
      { label: '50km Ultra', distance: 50, icon: <Trophy size={16} className="text-fuchsia-400" /> },
    ];

    return milestones.map(milestone => {
      const eligibleRuns = filteredRuns.filter(r => r.distance >= milestone.distance);
      
      if (eligibleRuns.length === 0) {
        return { ...milestone, best: null };
      }

      // Find run with best average pace that meets distance requirement
      const bestRun = eligibleRuns.reduce((best, current) => {
        const currentPace = current.duration / current.distance;
        const bestPace = best.duration / best.distance;
        return currentPace < bestPace ? current : best;
      });

      const pace = bestRun.duration / bestRun.distance;
      const estimatedTime = pace * milestone.distance;

      return {
        ...milestone,
        best: {
          time: estimatedTime,
          date: bestRun.date,
          pace: pace
        }
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
             <button 
                onClick={() => onNavigate('log')}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-brand-500/20"
             >
                Go to Logs
             </button>
             <button 
                onClick={() => onNavigate('profile')}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors border border-slate-600"
             >
                Setup Profile
             </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
         <div>
            <h1 className="text-3xl font-bold text-white">
            Hello, <span className="text-brand-400">{profile?.name || 'Runner'}</span>
            </h1>
            <p className="text-slate-400 text-lg">Have a great run today! 🏃</p>
         </div>

         <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 shadow-sm">
            <div className="pl-3 pr-2 py-1 border-r border-slate-700">
                <Filter size={16} className="text-slate-400" />
            </div>
            <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="bg-transparent text-white text-sm font-medium p-2 pr-8 outline-none cursor-pointer appearance-none hover:text-brand-400 transition-colors"
            >
                <option value="all" className="bg-slate-800 text-slate-200">All Time</option>
                <option value="year" className="bg-slate-800 text-slate-200">Last Year</option>
                <option value="month" className="bg-slate-800 text-slate-200">Last 30 Days</option>
                <option value="week" className="bg-slate-800 text-slate-200">Last 7 Days</option>
            </select>
         </div>
      </div>

      {/* Goals Section - Uses full run history to keep goal tracking consistent */}
      <GoalTracker runs={runs} goals={goals} onAddGoal={onAddGoal} onDeleteGoal={onDeleteGoal} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Distance" 
          value={`${stats.totalDistance} km`} 
          icon={<Activity size={20} />} 
          subtext={timeRange === 'all' ? "All time volume" : "In selected period"}
        />
        <StatCard 
          title="Avg Pace" 
          value={`${stats.avgPaceStr} /km`} 
          icon={<Clock size={20} />} 
          subtext="Average across selection"
        />
        <StatCard 
          title="Avg Cadence" 
          value={stats.avgCadence ? `${stats.avgCadence} spm` : '--'} 
          icon={<Footprints size={20} />} 
          subtext="Steps per minute"
        />
        <StatCard 
          title="Avg Heart Rate" 
          value={`${stats.avgHr} bpm`} 
          icon={<TrendingUp size={20} />} 
          subtext="Average intensity"
        />
      </div>

      {/* Personal Records */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
           <Trophy className="text-yellow-500" size={20} />
           Personal Records {timeRange !== 'all' && '(Period Best)'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {records.map((record, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 flex flex-col relative overflow-hidden group">
                    <div className="text-slate-400 text-xs font-medium uppercase mb-2 flex items-center gap-1">
                        {record.icon} {record.label}
                    </div>
                    {record.best ? (
                        <>
                            <div className="text-white font-bold text-xl mb-1">
                                {formatDuration(record.best.time)}
                            </div>
                            <div className="text-slate-500 text-xs flex items-center gap-1">
                                <Calendar size={10} />
                                {new Date(record.best.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                            </div>
                            <div className="text-slate-600 text-[10px] mt-1">
                                @ {Math.floor(record.best.pace)}:{(Math.round((record.best.pace % 1) * 60)).toString().padStart(2, '0')}/km
                            </div>
                             {/* Shine effect on hover */}
                             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                        </>
                    ) : (
                        <div className="text-slate-600 text-sm italic mt-1">--:--</div>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* Combined Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distance Chart - Full Width (col-span-2) and Taller */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-white">Distance History</h3>
             <div className="flex gap-2 flex-wrap justify-end">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> Easy
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-[#8b5cf6]"></div> Long
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div> Tempo
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div> Interval
                </div>
             </div>
          </div>
          {chartData.length > 0 ? (
            <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8" 
                        tick={{fontSize: 12}} 
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis 
                        stroke="#94a3b8" 
                        tick={{fontSize: 12}} 
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
                        cursor={{fill: '#334155', opacity: 0.4}}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: any, name: any, props: any) => {
                            // Add type to tooltip
                            return [`${value} km`, `${props.payload.type} Distance`];
                        }}
                    />
                    <Bar dataKey="distance" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getRunTypeColor(entry.type)} />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 w-full flex items-center justify-center text-slate-500 italic">
                No runs in this period
            </div>
          )}
        </div>

        {/* HR Zones Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
           <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Heart size={20} className="text-rose-500" />
                    Training Zones
                </h3>
                <div className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                    Max HR: {220 - (profile?.age && profile.age > 0 ? profile.age : 30)} bpm
                </div>
           </div>
           <div className="h-72 w-full relative">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hrZoneData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" hide />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#94a3b8" 
                        tick={{fontSize: 11}} 
                        width={80}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip 
                        cursor={{fill: 'transparent'}}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-slate-800 border border-slate-600 p-3 rounded-lg shadow-xl">
                                <p className="text-white font-medium mb-1">{data.name}</p>
                                <p className="text-slate-400 text-xs mb-2">Range: {data.range}</p>
                                <p className="text-brand-400 text-sm font-bold">{data.value} mins</p>
                                </div>
                            );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                         {hrZoneData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

         {/* Pace vs HR Chart */}
         <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-6">Physiology (Pace vs HR)</h3>
          {chartData.length > 0 ? (
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8" 
                        tick={{fontSize: 12}}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis 
                        yAxisId="left" 
                        stroke="#38bdf8" 
                        tick={{fontSize: 12}} 
                        domain={['dataMin - 1', 'dataMax + 1']}
                        hide
                    />
                    <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke="#f43f5e" 
                        tick={{fontSize: 12}} 
                        domain={['dataMin - 10', 'dataMax + 10']}
                        hide
                    />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} />
                    <Line yAxisId="left" type="monotone" dataKey="pace" stroke="#38bdf8" strokeWidth={2} dot={{fill: '#38bdf8', r: 4}} name="Pace (min/km)" />
                    <Line yAxisId="right" type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={2} dot={{fill: '#f43f5e', r: 4}} name="HR (bpm)" />
                </LineChart>
                </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 w-full flex items-center justify-center text-slate-500 italic">
                No data available
            </div>
          )}
        </div>

        {/* Form Analysis Chart - Full Width */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
             <Ruler size={20} className="text-purple-400" />
             Form Analysis
          </h3>
          {chartData.length > 0 ? (
            <>
                <div className="h-72 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            stroke="#94a3b8" 
                            tick={{fontSize: 12}}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis 
                            yAxisId="left" 
                            stroke="#c084fc" 
                            tick={{fontSize: 12}} 
                            domain={[140, 210]}
                            label={{ value: 'SPM', angle: -90, position: 'insideLeft', fill: '#c084fc' }}
                        />
                        <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            stroke="#fbbf24" 
                            tick={{fontSize: 12}} 
                            domain={[0, 2.0]}
                            label={{ value: 'Meters', angle: 90, position: 'insideRight', fill: '#fbbf24' }}
                        />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} />
                        
                        <ReferenceArea 
                            yAxisId="left" 
                            y1={170} 
                            y2={185} 
                            fill="#c084fc" 
                            fillOpacity={0.15} 
                        />
                        <ReferenceLine 
                            yAxisId="left" 
                            y={180} 
                            stroke="#c084fc" 
                            strokeDasharray="3 3" 
                            opacity={0.6}
                        />

                        <Line yAxisId="left" type="monotone" dataKey="cadence" stroke="#c084fc" strokeWidth={2} dot={{fill: '#c084fc', r: 4}} name="Cadence (spm)" connectNulls />
                        <Line yAxisId="right" type="monotone" dataKey="strideLength" stroke="#fbbf24" strokeWidth={2} dot={{fill: '#fbbf24', r: 4}} name="Stride Length (m)" connectNulls />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-400/20 border border-purple-400/50 rounded-sm"></div>
                    <span>Ideal Zone (170-185 spm)</span>
                    </div>
                </div>
            </>
          ) : (
            <div className="h-72 w-full flex items-center justify-center text-slate-500 italic">
                No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
