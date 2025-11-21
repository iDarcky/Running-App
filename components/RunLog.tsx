
import React, { useState, useEffect, useRef } from 'react';
import { Run, RunType, StravaToken, GoogleToken } from '../types';
import { Plus, Zap, Activity, Footprints, Clock, Calendar, Heart, Gauge, Watch, Edit2, Trash2, AlertTriangle, ExternalLink, Info, CheckCircle, Loader2, ChevronDown, Feather, Flame, Map, Trophy, BatteryCharging } from 'lucide-react';
import { getStravaAuthUrl, exchangeStravaToken, getStravaActivities, mapStravaToRun } from '../services/stravaService';
import { getGoogleAuthUrl, exchangeGoogleToken, getGoogleFitActivities } from '../services/googleFitService';
import { Modal, Input } from './UIComponents';
import RunForm from './RunForm';

interface RunLogProps {
  runs: Run[];
  onAddRun: (run: Run) => void;
  onAddRuns: (runs: Run[]) => void;
  onUpdateRun: (run: Run) => void;
  onDeleteRun: (id: string) => void;
}

const RunLog: React.FC<RunLogProps> = ({ runs, onAddRun, onAddRuns, onUpdateRun, onDeleteRun }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterType, setFilterType] = useState<RunType | 'All'>('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Expandable card state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [isStravaModalOpen, setIsStravaModalOpen] = useState(false);
  const [stravaClientId, setStravaClientId] = useState('');
  const [stravaClientSecret, setStravaClientSecret] = useState('');
  const [stravaTokenData, setStravaTokenData] = useState<StravaToken | null>(null);
  const [stravaError, setStravaError] = useState('');

  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [googleTokenData, setGoogleTokenData] = useState<GoogleToken | null>(null);
  const [googleError, setGoogleError] = useState('');

  const [authStatus, setAuthStatus] = useState<'idle' | 'exchanging' | 'connected' | 'error'>('idle');
  const [authMessage, setAuthMessage] = useState('');
  const [detectedHostname, setDetectedHostname] = useState('');
  const [detectedOrigin, setDetectedOrigin] = useState('');

  const authCodeProcessed = useRef(false);
  const stravaCredentialsRef = useRef({ id: '', secret: '' });
  const googleCredentialsRef = useRef({ id: '', secret: '' });

  const isPopup = !!window.opener;
  const urlParams = new URLSearchParams(window.location.search);
  const hasAuthCode = urlParams.has('code');

  useEffect(() => {
    stravaCredentialsRef.current = { id: stravaClientId, secret: stravaClientSecret };
  }, [stravaClientId, stravaClientSecret]);

  useEffect(() => {
    googleCredentialsRef.current = { id: googleClientId, secret: googleClientSecret };
  }, [googleClientId, googleClientSecret]);

  useEffect(() => {
    setDetectedHostname(window.location.hostname);
    setDetectedOrigin(window.location.origin);

    const savedStravaId = localStorage.getItem('strava_client_id');
    const savedStravaSecret = localStorage.getItem('strava_client_secret');
    const savedStravaTokens = localStorage.getItem('strava_tokens');

    if (savedStravaId) setStravaClientId(savedStravaId);
    if (savedStravaSecret) setStravaClientSecret(savedStravaSecret);
    if (savedStravaTokens) {
        try { setStravaTokenData(JSON.parse(savedStravaTokens)); } catch (e) {}
    }

    const savedGoogleId = localStorage.getItem('google_client_id');
    const savedGoogleSecret = localStorage.getItem('google_client_secret');
    const savedGoogleTokens = localStorage.getItem('google_tokens');

    if (savedGoogleId) setGoogleClientId(savedGoogleId);
    if (savedGoogleSecret) setGoogleClientSecret(savedGoogleSecret);
    if (savedGoogleTokens) {
        try { setGoogleTokenData(JSON.parse(savedGoogleTokens)); } catch (e) {}
    }

    const handleStorageChange = (e: StorageEvent) => {
        if (!isPopup) {
            if (e.key === 'strava_tokens' && e.newValue) {
                const newTokens = JSON.parse(e.newValue);
                setStravaTokenData(newTokens);
                if (stravaCredentialsRef.current.id && stravaCredentialsRef.current.secret) {
                    handleStravaSync(newTokens, stravaCredentialsRef.current.id, stravaCredentialsRef.current.secret);
                }
                setIsStravaModalOpen(false);
            }
            if (e.key === 'google_tokens' && e.newValue) {
                const newTokens = JSON.parse(e.newValue);
                setGoogleTokenData(newTokens);
                if (googleCredentialsRef.current.id && googleCredentialsRef.current.secret) {
                    handleGoogleSync(newTokens, googleCredentialsRef.current.id, googleCredentialsRef.current.secret);
                }
                setIsGoogleModalOpen(false);
            }
        }
    };
    window.addEventListener('storage', handleStorageChange);

    if (hasAuthCode && !authCodeProcessed.current) {
        authCodeProcessed.current = true;
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code) {
            window.history.replaceState({}, document.title, window.location.pathname);
            if (state === 'strava') {
                const cId = savedStravaId || localStorage.getItem('strava_client_id') || '';
                const cSecret = savedStravaSecret || localStorage.getItem('strava_client_secret') || '';
                if(cId && cSecret) handleStravaTokenExchange(code, cId, cSecret);
                else { setAuthStatus('error'); setAuthMessage("Missing Credentials"); }
            } else if (state === 'google') {
                const cId = savedGoogleId || localStorage.getItem('google_client_id') || '';
                const cSecret = savedGoogleSecret || localStorage.getItem('google_client_secret') || '';
                if (cId && cSecret) handleGoogleTokenExchange(code, cId, cSecret);
                else { setAuthStatus('error'); setAuthMessage("Missing Credentials"); }
            }
        }
    }
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleStravaTokenExchange = async (code: string, clientId: string, clientSecret: string) => {
      setAuthStatus('exchanging');
      try {
          const tokens = await exchangeStravaToken(clientId, clientSecret, code);
          setStravaTokenData(tokens);
          localStorage.setItem('strava_tokens', JSON.stringify(tokens));
          setAuthStatus('connected');
          setAuthMessage("Success!");
          if (window.opener) setTimeout(() => window.close(), 1500); 
      } catch (err: any) {
          setAuthStatus('error');
          setAuthMessage(err.message);
      }
  };

  const initiateStravaAuth = () => {
      if (!stravaClientId || !stravaClientSecret) { setStravaError('Required'); return; }
      localStorage.setItem('strava_client_id', stravaClientId);
      localStorage.setItem('strava_client_secret', stravaClientSecret);
      const w = 600, h = 700;
      const l = window.screenX + (window.innerWidth - w) / 2;
      const t = window.screenY + (window.innerHeight - h) / 2;
      window.open(getStravaAuthUrl(stravaClientId), 'Strava Auth', `width=${w},height=${h},left=${l},top=${t},resizable=yes,scrollbars=yes`);
  };

  const handleStravaSync = async (tokensOverride?: StravaToken, clientIdOverride?: string, clientSecretOverride?: string) => {
    const tokens = tokensOverride || stravaTokenData;
    const cId = clientIdOverride || stravaClientId;
    const cSecret = clientSecretOverride || stravaClientSecret;
    if (!tokens || !cId || !cSecret) { setIsStravaModalOpen(true); return; }
    setIsSyncing(true);
    setStravaError('');
    try {
        const activities = await getStravaActivities(tokens, cId, cSecret, (newTokens) => {
                setStravaTokenData(newTokens);
                localStorage.setItem('strava_tokens', JSON.stringify(newTokens));
        });
        const newRuns: Run[] = [];
        activities.forEach(activity => {
            if (activity.type === 'Run') newRuns.push(mapStravaToRun(activity));
        });
        if (newRuns.length > 0) onAddRuns(newRuns);
        if (isStravaModalOpen) setIsStravaModalOpen(false);
    } catch (err: any) {
        setStravaError(err.message);
        setIsStravaModalOpen(true);
    } finally {
        setIsSyncing(false);
    }
  };

  const handleGoogleTokenExchange = async (code: string, clientId: string, clientSecret: string) => {
      setAuthStatus('exchanging');
      try {
          const tokens = await exchangeGoogleToken(clientId, clientSecret, code);
          setGoogleTokenData(tokens);
          localStorage.setItem('google_tokens', JSON.stringify(tokens));
          setAuthStatus('connected');
          setAuthMessage("Success!");
          if (window.opener) setTimeout(() => window.close(), 1500);
      } catch (err: any) {
          setAuthStatus('error');
          setAuthMessage(err.message);
      }
  };

  const initiateGoogleAuth = () => {
      if (!googleClientId || !googleClientSecret) { setGoogleError('Required'); return; }
      localStorage.setItem('google_client_id', googleClientId);
      localStorage.setItem('google_client_secret', googleClientSecret);
      const w = 600, h = 700;
      const l = window.screenX + (window.innerWidth - w) / 2;
      const t = window.screenY + (window.innerHeight - h) / 2;
      window.open(getGoogleAuthUrl(googleClientId), 'Google Auth', `width=${w},height=${h},left=${l},top=${t},resizable=yes,scrollbars=yes`);
  };

  const handleGoogleSync = async (tokensOverride?: GoogleToken, clientIdOverride?: string, clientSecretOverride?: string) => {
      const tokens = tokensOverride || googleTokenData;
      const cId = clientIdOverride || googleClientId;
      const cSecret = clientSecretOverride || googleClientSecret;
      if (!tokens || !cId || !cSecret) { setIsGoogleModalOpen(true); return; }
      setIsSyncing(true);
      setGoogleError('');
      try {
          const googleRuns = await getGoogleFitActivities(tokens, cId, cSecret, (newTokens) => {
                  setGoogleTokenData(newTokens);
                  localStorage.setItem('google_tokens', JSON.stringify(newTokens));
          });
          if (googleRuns.length > 0) onAddRuns(googleRuns);
          if (isGoogleModalOpen) setIsGoogleModalOpen(false);
      } catch (err: any) {
          setGoogleError(err.message);
          setIsGoogleModalOpen(true);
      } finally {
          setIsSyncing(false);
      }
  };

  const handleEditClick = (run: Run) => {
    setEditingId(run.id);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: Partial<Run>) => {
    if (editingId) {
        onUpdateRun({ ...data, id: editingId } as Run);
    } else {
        const run: Run = {
            id: Date.now().toString(),
            date: data.date!,
            type: data.type as RunType,
            distance: Number(data.distance),
            duration: Number(data.duration),
            avgHr: Number(data.avgHr),
            rpe: Number(data.rpe),
            cadence: data.cadence ? Number(data.cadence) : undefined,
            strideLength: data.strideLength ? Number(data.strideLength) : undefined,
            source: 'Manual',
            notes: data.notes || ''
        };
        onAddRun(run);
    }
    setEditingId(null);
    setIsFormOpen(false);
  };

  const toggleExpand = (id: string) => {
      setExpandedId(prev => prev === id ? null : id);
  };

  const filteredRuns = filterType === 'All' ? runs : runs.filter(r => r.type === filterType);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    const s = Math.round((minutes * 60) % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getRunStyle = (type: RunType) => {
    switch (type) {
      case RunType.EASY: return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200 border border-emerald-500/20';
      case RunType.TEMPO: return 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-500/20';
      case RunType.INTERVAL: return 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200 border border-rose-500/20';
      case RunType.LONG: return 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-200 border border-sky-500/20';
      case RunType.RECOVERY: return 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200 border border-indigo-500/20';
      case RunType.RACE: return 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-200 border border-purple-500/20';
      default: return 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-300 border border-slate-500/20';
    }
  };

  const getRunTypeIcon = (type: RunType) => {
    switch (type) {
      case RunType.EASY: return <Feather size={14} className="shrink-0" />;
      case RunType.TEMPO: return <Flame size={14} className="shrink-0" />;
      case RunType.INTERVAL: return <Zap size={14} className="shrink-0" />;
      case RunType.LONG: return <Map size={14} className="shrink-0" />;
      case RunType.RACE: return <Trophy size={14} className="shrink-0" />;
      case RunType.RECOVERY: return <BatteryCharging size={14} className="shrink-0" />;
      default: return <Activity size={14} className="shrink-0" />;
    }
  };

  if (authStatus !== 'idle') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
             <div className={`p-8 rounded-3xl ${authStatus === 'error' ? 'bg-error-container text-error-on-container' : 'bg-primary-container text-primary-on-container'} shadow-lg text-center max-w-sm mx-4`}>
                  {authStatus === 'exchanging' && <Loader2 className="animate-spin mx-auto mb-4" size={48} />}
                  {authStatus === 'connected' && <CheckCircle className="mx-auto mb-4 text-green-600" size={48} />}
                  {authStatus === 'error' && <AlertTriangle className="mx-auto mb-4" size={48} />}
                  
                  <h3 className="text-2xl font-bold mb-2">{authStatus === 'exchanging' ? 'Connecting...' : authStatus === 'connected' ? 'Connected!' : 'Connection Failed'}</h3>
                  <p className="font-medium opacity-90">{authMessage || "Please wait while we finalize the connection."}</p>
             </div>
          </div>
      );
  }

  const editingRun = editingId ? runs.find(r => r.id === editingId) : undefined;

  return (
    <div className="animate-fade-in pb-20">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
         <h2 className="text-4xl font-bold text-surface-on tracking-tight">Training Log</h2>
         <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => { setEditingId(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 bg-primary text-primary-on px-5 py-2.5 rounded-full shadow-lg hover:scale-105 transition-transform font-medium"
            >
              <Plus size={20} /> Log Run
            </button>
            <button 
              onClick={() => handleStravaSync()}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-[#FC4C02] text-white px-5 py-2.5 rounded-full shadow-md hover:bg-[#E34402] transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} fill="currentColor" />} 
              Sync Strava
            </button>
            <button 
              onClick={() => handleGoogleSync()}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-surface-container-highest text-surface-on px-5 py-2.5 rounded-full shadow-sm border border-outline-variant hover:bg-surface-container-high transition-colors font-medium disabled:opacity-50"
            >
              {isSyncing ? <Loader2 className="animate-spin" size={20} /> : <Activity size={20} />} 
              Google Fit
            </button>
         </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-2">
        {['All', ...Object.values(RunType)].map(type => (
             <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-2 ${
                    filterType === type 
                    ? 'bg-secondary-container text-secondary-on-container border-secondary-container' 
                    : 'bg-surface text-surface-on-variant border-outline-variant/50 hover:bg-surface-container-high'
                }`}
             >
                {type !== 'All' && getRunTypeIcon(type as RunType)}
                {type}
             </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/20">
              <div className="text-surface-on-variant text-xs font-bold uppercase tracking-wider mb-1">Count</div>
              <div className="text-2xl font-bold text-surface-on">{filteredRuns.length}</div>
          </div>
          <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/20">
              <div className="text-surface-on-variant text-xs font-bold uppercase tracking-wider mb-1">Distance</div>
              <div className="text-2xl font-bold text-surface-on">{filteredRuns.reduce((acc, r) => acc + r.distance, 0).toFixed(1)} <span className="text-sm font-normal opacity-70">km</span></div>
          </div>
          <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/20">
              <div className="text-surface-on-variant text-xs font-bold uppercase tracking-wider mb-1">Time</div>
              <div className="text-2xl font-bold text-surface-on">{Math.round(filteredRuns.reduce((acc, r) => acc + r.duration, 0) / 60)} <span className="text-sm font-normal opacity-70">hrs</span></div>
          </div>
          <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/20">
              <div className="text-surface-on-variant text-xs font-bold uppercase tracking-wider mb-1">Avg HR</div>
              <div className="text-2xl font-bold text-surface-on">{Math.round(filteredRuns.reduce((acc, r) => acc + r.avgHr, 0) / (filteredRuns.length || 1))} <span className="text-sm font-normal opacity-70">bpm</span></div>
          </div>
      </div>

      {/* Run List */}
      <div className="space-y-4">
        {filteredRuns.length === 0 ? (
             <div className="text-center py-20 text-surface-on-variant opacity-60">
                 <Footprints size={48} className="mx-auto mb-4 opacity-50" />
                 <p className="text-lg">No runs found matching this filter.</p>
             </div>
        ) : (
            filteredRuns.map(run => {
                const isExpanded = expandedId === run.id;
                return (
                    <div 
                        key={run.id} 
                        onClick={() => toggleExpand(run.id)}
                        className={`rounded-[24px] transition-all duration-300 cursor-pointer overflow-hidden group ${getRunStyle(run.type)} ${isExpanded ? 'shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'hover:shadow-md hover:scale-[1.01]'}`}
                    >
                        {/* Summary Section */}
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                     <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/5 flex items-center gap-1.5">
                                        {getRunTypeIcon(run.type)}
                                        <span>{run.type}</span>
                                     </div>
                                     <div className="text-sm font-medium opacity-80 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(run.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                     </div>
                                </div>
                                <div className={`p-1 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-black/5 dark:bg-white/10' : 'opacity-50 group-hover:opacity-100'}`}>
                                    <ChevronDown size={18} />
                                </div>
                            </div>

                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold tracking-tighter leading-none">{run.distance}</span>
                                        <span className="text-sm font-bold opacity-60">km</span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 text-right">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase opacity-60 mb-0.5 flex items-center justify-end gap-1"><Clock size={10} /> Time</div>
                                        <div className="text-xl font-semibold leading-none">{formatDuration(run.duration)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase opacity-60 mb-0.5 flex items-center justify-end gap-1"><Zap size={10} /> Pace</div>
                                        <div className="text-xl font-semibold leading-none">
                                            {Math.floor(run.duration / run.distance)}:
                                            {Math.round(((run.duration / run.distance) % 1) * 60).toString().padStart(2, '0')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <div className="px-5 pb-5 pt-0">
                                    <div className="h-px w-full bg-black/5 dark:bg-white/5 mb-4"></div>
                                    
                                    {/* Detailed Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                        <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
                                            <Heart size={18} className="mb-1 opacity-70" />
                                            <div className="text-xs font-bold opacity-60">Avg HR</div>
                                            <div className="text-lg font-bold">{run.avgHr} <span className="text-[10px] font-normal opacity-60">bpm</span></div>
                                        </div>
                                        <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
                                            <Footprints size={18} className="mb-1 opacity-70" />
                                            <div className="text-xs font-bold opacity-60">Cadence</div>
                                            <div className="text-lg font-bold">{run.cadence || '--'} <span className="text-[10px] font-normal opacity-60">spm</span></div>
                                        </div>
                                        <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
                                            <Gauge size={18} className="mb-1 opacity-70" />
                                            <div className="text-xs font-bold opacity-60">Effort</div>
                                            <div className="text-lg font-bold">{run.rpe || '--'} <span className="text-[10px] font-normal opacity-60">/ 10</span></div>
                                        </div>
                                         <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
                                            {run.source === 'Strava' ? <Activity size={18} className="mb-1 opacity-70" /> : run.source === 'Google Fit' ? <Activity size={18} className="mb-1 opacity-70" /> : <Watch size={18} className="mb-1 opacity-70" />}
                                            <div className="text-xs font-bold opacity-60">Source</div>
                                            <div className="text-sm font-bold truncate w-full text-center">{run.source || 'Manual'}</div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {run.notes && (
                                        <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 mb-4 relative">
                                            <div className="absolute top-3 left-3 opacity-20"><Info size={16} /></div>
                                            <p className="text-sm italic opacity-80 pl-6">"{run.notes}"</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3">
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); handleEditClick(run); }}
                                            className="px-4 py-2 rounded-full bg-white/40 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/30 font-bold text-sm flex items-center gap-2 transition-colors"
                                        >
                                            <Edit2 size={16} /> Edit
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteRun(run.id); }}
                                            className="px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-300 font-bold text-sm flex items-center gap-2 transition-colors border border-red-500/10"
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* Run Form Modal */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => { setIsFormOpen(false); setEditingId(null); }}
        title={editingId ? 'Edit Run' : 'Log Run'}
      >
          <RunForm 
            initialData={editingRun} 
            onSubmit={handleFormSubmit}
            isEditing={!!editingId}
          />
      </Modal>

      {/* Strava Modal */}
      <Modal
        isOpen={isStravaModalOpen}
        onClose={() => setIsStravaModalOpen(false)}
        title="Connect Strava"
      >
           <div className="p-4 space-y-6">
                <div className="text-center">
                    <div className="bg-[#FC4C02] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                        <Zap size={32} className="text-white" fill="currentColor" />
                    </div>
                    <p className="text-surface-on-variant text-sm">Enter your API credentials to sync.</p>
                </div>
                
                <div className="space-y-4">
                    <Input 
                        label="Client ID"
                        value={stravaClientId}
                        onChange={(e: any) => setStravaClientId(e.target.value)}
                        placeholder="12345"
                    />
                    <Input 
                        label="Client Secret"
                        type="password"
                        value={stravaClientSecret}
                        onChange={(e: any) => setStravaClientSecret(e.target.value)}
                        placeholder="••••••••"
                    />
                    {stravaError && <div className="text-error text-sm bg-error-container p-3 rounded-lg flex gap-2 items-center"><AlertTriangle size={16} /> {stravaError}</div>}
                    
                    <button 
                        onClick={initiateStravaAuth} 
                        className="w-full py-4 bg-[#FC4C02] text-white font-bold rounded-full shadow-lg hover:bg-[#E34402] transition-colors flex items-center justify-center gap-2"
                    >
                        Authenticate <ExternalLink size={18} />
                    </button>
                    
                    <div className="text-xs text-center text-surface-on-variant/70">
                        Ensure "localhost" is in your Strava App's Authorization Callback Domain.
                    </div>
                </div>
           </div>
      </Modal>

      {/* Google Modal */}
      <Modal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        title="Connect Google Fit"
      >
          <div className="p-4 space-y-6">
              <div className="text-center">
                    <div className="bg-surface-container-highest w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-outline-variant/20">
                        <Activity size={32} className="text-surface-on" />
                    </div>
                    <p className="text-surface-on-variant text-sm">Sync your running history from Google.</p>
                </div>
                
                <div className="space-y-4">
                    <Input 
                        label="Client ID"
                        value={googleClientId}
                        onChange={(e: any) => setGoogleClientId(e.target.value)}
                        placeholder="...apps.googleusercontent.com"
                    />
                    <Input 
                        label="Client Secret"
                        type="password"
                        value={googleClientSecret}
                        onChange={(e: any) => setGoogleClientSecret(e.target.value)}
                        placeholder="••••••••"
                    />
                    {googleError && <div className="text-error text-sm bg-error-container p-3 rounded-lg flex gap-2 items-center"><AlertTriangle size={16} /> {googleError}</div>}
                    
                    <button 
                        onClick={initiateGoogleAuth} 
                        className="w-full py-4 bg-surface-on text-surface-inverse-on font-bold rounded-full shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        Authenticate <ExternalLink size={18} />
                    </button>

                    <div className="bg-surface-container-high p-3 rounded-xl">
                        <p className="text-xs text-surface-on-variant/70 text-center">
                            Note: Google Fit integration requires a Google Cloud Project with the Fitness API enabled and your origin added to Authorized JavaScript origins.
                        </p>
                    </div>
                </div>
           </div>
      </Modal>
    </div>
  );
};

export default RunLog;
