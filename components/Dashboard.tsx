
import React, { useMemo, useState, useEffect } from 'react';
import { Run, Goal, UserProfile, RunType } from '../types';
import { StatCard } from './UIComponents';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { 
  Activity, Timer, Footprints, Heart, Trophy, Medal, 
  Info, TrendingUp, Calendar
} from 'lucide-react';

interface DashboardProps {
  runs: Run[];
  goals: Goal[];
  profile?: UserProfile;
  onAddGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onNavigate: (tab: 'dashboard' | 'log' | 'coach' | 'profile') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ runs, profile }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('all');

  // RedLine Palette - Adizero Style
  // Primary: #D32F2F (Red), Secondary: #000000 (Black), Neutral: #9CA3AF (Gray)
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
    // Monochromatic Gradient with Red Peak for intensity
    const zones = [
        { name: 'Z1', min: 0, max: maxHr * 0.6, color: '#F3F4F6', minutes: 0 }, // Gray 100
        { name: 'Z2', min: maxHr * 0.6, max: maxHr * 0.7, color: '#9CA3AF', minutes: 0 }, // Gray 400
        { name: 'Z3', min: maxHr * 0.7, max: maxHr * 0.8, color: '#4B5563', minutes: 0 }, // Gray 600
        { name: 'Z4', min: maxHr * 0.8, max: maxHr * 0.9, color: '#EF4444', minutes: 0 }, // Red 500
        { name: 'Z5', min: maxHr * 0.9, max: 300, color: '#991B1B', minutes: 0 }, // Red 800
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
        // Calculate pace for the specific distance segment roughly by using average pace
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

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-surface-on tracking-tight">Dashboard</h2>
            <p className="text-surface-on-variant text-sm">Your training at a glance</p>
        </div>
        
        <div className="bg-surface-container-high p-1 rounded-full flex border border-outline-variant/20">
            {['week', 'month', 'year', 'all'].map((t) => (
                <button
                    key={t}
                    onClick={() => setTimeRange(t as any)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all ${timeRange === t ? 'bg-surface-on text-surface-inverse-on shadow-md' : 'text-surface-on-variant hover:bg-surface-container-highest'}`}
                >
                    {t}
                </button>
            ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
            title="Distance" 
            value={`${stats.totalDistance} km`} 
            icon={<Activity />} 
            colorClass="bg-surface-on text-surface-inverse-on" 
        />
        <StatCard 
            title="Avg Pace" 
            value={`${stats.avgPaceStr} /km`} 
            icon={<Timer />} 
            colorClass="bg-primary text-primary-on" 
        />
        <StatCard 
            title="Runs" 
            value={stats.totalRuns.toString()} 
            icon={<Calendar />} 
            colorClass="bg-surface-container-high text-surface-on" 
        />
        <StatCard 
            title="Avg HR" 
            value={`${stats.avgHr} bpm`} 
            icon={<Heart />} 
            colorClass="bg-error-container text-error-on-container" 
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distance History */}
        <div className="lg:col-span-2 bg-surface-container p-6 rounded-[24px] border border-outline-variant/20 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-surface-on flex items-center gap-2">
                    <Activity size={18} className="text-surface-on-variant" />
                    Training Volume
                </h3>
            </div>
            <div className="h-64 w-full">
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

        {/* HR Zones */}
        <div className="bg-surface-container p-6 rounded-[24px] border border-outline-variant/20 shadow-sm flex flex-col">
             <h3 className="text-lg font-bold text-surface-on mb-6 flex items-center gap-2">
                <Heart size={18} className="text-surface-on-variant" />
                Intensity Dist.
            </h3>
            <div className="flex-1 min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={hrZoneData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
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
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <span className="text-3xl font-bold text-surface-on">{stats.avgHr}</span>
                        <div className="text-[10px] font-bold text-surface-on-variant uppercase">Avg BPM</div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Charts Row 2 & PRs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Pace vs HR Trends */}
         <div className="lg:col-span-2 bg-surface-container p-6 rounded-[24px] border border-outline-variant/20 shadow-sm">
            <h3 className="text-lg font-bold text-surface-on mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-surface-on-variant" />
                Pace vs Heart Rate
            </h3>
            <div className="h-64 w-full">
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

         {/* Records */}
         <div className="bg-surface-container p-6 rounded-[24px] border border-outline-variant/20 shadow-sm">
             <h3 className="text-lg font-bold text-surface-on mb-6 flex items-center gap-2">
                <Trophy size={18} className="text-surface-on-variant" />
                Personal Bests
            </h3>
            <div className="space-y-4">
                {records.map((record, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${record.best ? 'bg-primary text-primary-on' : 'bg-surface-container-highest text-surface-on-variant'}`}>
                                {React.cloneElement(record.icon as any, { size: 16 })}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-surface-on-variant uppercase">{record.label}</div>
                                <div className={`font-bold ${record.best ? 'text-surface-on' : 'text-surface-on-variant/50'}`}>
                                    {record.best || '--:--'}
                                </div>
                            </div>
                        </div>
                        {record.date && (
                             <div className="text-[10px] font-medium text-surface-on-variant opacity-0 group-hover:opacity-100 transition-opacity">
                                 {new Date(record.date).toLocaleDateString(undefined, {month:'short', year:'2-digit'})}
                             </div>
                        )}
                    </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
