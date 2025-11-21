import React, { useState, useEffect, useRef } from 'react';
import { Run, RunType, StravaToken, GoogleToken } from '../types';
import { Plus, Trash2, MapPin, Clock, Heart, Activity, Watch, Smartphone, Footprints, Filter, X, CheckCircle, Chrome, Zap, BatteryCharging, Trophy, Copy, AlertTriangle, Info, ExternalLink, Loader2, ArrowRight, Edit2 } from 'lucide-react';
import { getStravaAuthUrl, exchangeStravaToken, getStravaActivities, mapStravaToRun } from '../services/stravaService';
import { getGoogleAuthUrl, exchangeGoogleToken, getGoogleFitActivities } from '../services/googleFitService';

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

  const [newRun, setNewRun] = useState<Partial<Run>>({ date: new Date().toISOString().split('T')[0], type: RunType.EASY, distance: 5, duration: 30, avgHr: 140, rpe: 5, cadence: 165, strideLength: 1.0, source: 'Manual', notes: '' });

  const handleEditClick = (run: Run) => {
    setEditingId(run.id);
    setNewRun({ ...run, date: run.date.split('T')[0] });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setIsFormOpen(false);
    setNewRun({ date: new Date().toISOString().split('T')[0], type: RunType.EASY, distance: 5, duration: 30, avgHr: 140, rpe: 5, cadence: 165, strideLength: 1.0, source: 'Manual', notes: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
        // @ts-ignore
        onUpdateRun({ ...newRun, id: editingId } as Run);
    } else {
        const run: Run = {
            id: Date.now().toString(),
            date: newRun.date!,
            type: newRun.type as RunType,
            distance: Number(newRun.distance),
            duration: Number(newRun.duration),
            avgHr: Number(newRun.avgHr),
            rpe: Number(newRun.rpe),
            cadence: newRun.cadence ? Number(newRun.cadence) : undefined,
            strideLength: newRun.strideLength ? Number(newRun.strideLength) : undefined,
            source: 'Manual',
            notes: newRun.notes || ''
        };
        onAddRun(run);
    }
    resetForm();
  };

  const filteredRuns = filterType === 'All' ? runs : runs.filter(r => r.type === filterType);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    const s = Math.round((minutes * 60) % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // REFINED COLORS - STRICTLY MATCHING DASHBOARD
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

  return (
    <div className="animate-fade-in pb-20">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
         <h2 className="text-4xl font-bold text-surface-on tracking-tight">Training Log</h2>
         <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setIsFormOpen(true)}
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
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    filterType === type 
                    ? 'bg-secondary-container text-secondary-on-container border-secondary-container' 
                    : 'bg-surface text-surface-on-variant border-outline-variant/50 hover:bg-surface-container-high'
                }`}
             >
                {type}
             </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-container p-4 rounded-2xl">
              <div className="text-surface-on-variant text-xs font-bold uppercase tracking-wider mb-1">Count</div>
              <div className="text-2xl font-bold text-surface-on">{filteredRuns.length}</div>
          </div>
          <div className="bg-surface-container p-4 rounded-2xl">
              <div className="text-surface-on-variant text-xs font-bold uppercase tracking-wider mb-1">Distance</div>
              <div className="text-2xl font-bold text-surface-on">{filteredRuns.reduce((acc, r) => acc + r.distance, 0).toFixed(1)} <span className="text-sm font-normal opacity-70">km</span></div>
          </div>
          <div className="bg-surface-container p-4 rounded-2xl">
              <div className="text-surface-on-variant text-xs font-bold uppercase tracking-wider mb-1">Time</div>
              <div className="text-2xl font-bold text-surface-on">{Math.round(filteredRuns.reduce((acc, r) => acc + r.duration, 0) / 60)} <span className="text-sm font-normal opacity-70">hrs</span></div>
          </div>
          <div className="bg-surface-container p-4 rounded-2xl">
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
            filteredRuns.map(run => (
            <div key={run.id} className={`rounded-3xl p-6 transition-all hover:shadow-md ${getRunStyle(run.type)}`}>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Left Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider opacity-80 bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">
                                {run.type}
                            </span>
                            <span className="text-sm opacity-75 font-medium flex items-center gap-1">
                                {new Date(run.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                            </span>
                             {run.source && run.source !== 'Manual' && (
                                <span className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm ml-auto md:ml-0">
                                    {run.source === 'Strava' ? <Activity size={10} /> : <Zap size={10} />} {run.source}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-baseline gap-1 mb-1">
                            <h3 className="text-3xl font-bold tracking-tight">{run.distance}</h3>
                            <span className="text-sm font-medium opacity-80">km</span>
                        </div>
                        
                        {run.notes && <p className="text-sm opacity-80 line-clamp-1 mt-1 max-w-md italic">{run.notes}</p>}
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-center md:text-left">
                         <div>
                             <div className="text-[10px] uppercase font-bold opacity-60">Pace</div>
                             <div className="font-semibold text-lg">
                                {Math.floor(run.duration / run.distance)}:
                                {Math.round(((run.duration / run.distance) % 1) * 60).toString().padStart(2, '0')}
                                <span className="text-xs font-normal opacity-70">/km</span>
                             </div>
                         </div>
                         <div>
                             <div className="text-[10px] uppercase font-bold opacity-60">Time</div>
                             <div className="font-semibold text-lg">{formatDuration(run.duration)}</div>
                         </div>
                         <div>
                             <div className="text-[10px] uppercase font-bold opacity-60">HR</div>
                             <div className="font-semibold text-lg flex items-center gap-1 justify-center md:justify-start">
                                 <Heart size={14} className="opacity-70" /> {run.avgHr}
                             </div>
                         </div>
                         {(run.cadence || 0) > 0 && (
                            <div>
                                <div className="text-[10px] uppercase font-bold opacity-60">Cadence</div>
                                <div className="font-semibold text-lg">{run.cadence}</div>
                            </div>
                         )}
                         {(run.rpe || 0) > 0 && (
                            <div>
                                <div className="text-[10px] uppercase font-bold opacity-60">Effort</div>
                                <div className="font-semibold text-lg">{run.rpe}<span className="text-xs opacity-60">/10</span></div>
                            </div>
                         )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex md:flex-col justify-end gap-2">
                        <button 
                            onClick={() => handleEditClick(run)}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
                            aria-label="Edit"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button 
                            onClick={() => onDeleteRun(run.id)}
                            className="p-2 rounded-full bg-white/20 hover:bg-red-500/40 hover:text-red-100 backdrop-blur-sm transition-colors"
                            aria-label="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
            ))
        )}
      </div>

      {/* Add/Edit Modal - Full Screen on Mobile, Modal on Desktop */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container w-full md:max-w-2xl h-[90vh] md:h-auto rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant/20 flex justify-between items-center">
               <h3 className="text-xl font-bold text-surface-on">{editingId ? 'Edit Run' : 'Log Run'}</h3>
               <button onClick={resetForm} className="p-2 hover:bg-surface-container-highest rounded-full text-surface-on-variant transition-colors">
                 <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-surface-on-variant uppercase tracking-wider mb-1">Date</label>
                        <input 
                            type="date" 
                            required
                            className="w-full bg-surface-container-high border-b-2 border-outline-variant/50 focus:border-primary rounded-t-lg px-4 py-3 text-surface-on outline-none transition-colors"
                            value={newRun.date}
                            onChange={(e) => setNewRun({...newRun, date: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-surface-on-variant uppercase tracking-wider mb-1">Distance (km)</label>
                        <input 
                            type="number" step="0.01" required
                            className="w-full bg-surface-container-high border-b-2 border-outline-variant/50 focus:border-primary rounded-t-lg px-4 py-3 text-surface-on outline-none text-xl font-bold"
                            value={newRun.distance}
                            onChange={(e) => setNewRun({...newRun, distance: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-surface-on-variant uppercase tracking-wider mb-1">Time (min)</label>
                        <input 
                            type="number" required
                            className="w-full bg-surface-container-high border-b-2 border-outline-variant/50 focus:border-primary rounded-t-lg px-4 py-3 text-surface-on outline-none text-xl font-bold"
                            value={newRun.duration}
                            onChange={(e) => setNewRun({...newRun, duration: parseFloat(e.target.value)})}
                        />
                    </div>
                </div>

                {/* Type Selection */}
                <div>
                    <label className="block text-xs font-bold text-surface-on-variant uppercase tracking-wider mb-2">Run Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        {Object.values(RunType).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setNewRun({...newRun, type: t})}
                                className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                                    newRun.type === t 
                                    ? 'bg-primary-container text-primary-on-container border-primary shadow-sm' 
                                    : 'bg-surface-container-high text-surface-on-variant border-transparent hover:bg-surface-container-highest'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Advanced Stats */}
                <div className="grid grid-cols-3 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-surface-on-variant uppercase tracking-wider mb-1">Avg HR</label>
                        <input 
                            type="number"
                            className="w-full bg-surface-container-high border-b-2 border-outline-variant/50 focus:border-primary rounded-t-lg px-4 py-2 text-surface-on outline-none"
                            value={newRun.avgHr}
                            onChange={(e) => setNewRun({...newRun, avgHr: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-surface-on-variant uppercase tracking-wider mb-1">Cadence</label>
                        <input 
                            type="number"
                            className="w-full bg-surface-container-high border-b-2 border-outline-variant/50 focus:border-primary rounded-t-lg px-4 py-2 text-surface-on outline-none"
                            value={newRun.cadence || ''}
                            onChange={(e) => setNewRun({...newRun, cadence: parseFloat(e.target.value)})}
                            placeholder="spm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-surface-on-variant uppercase tracking-wider mb-1">RPE (1-10)</label>
                        <input 
                            type="number" max="10"
                            className="w-full bg-surface-container-high border-b-2 border-outline-variant/50 focus:border-primary rounded-t-lg px-4 py-2 text-surface-on outline-none"
                            value={newRun.rpe}
                            onChange={(e) => setNewRun({...newRun, rpe: parseFloat(e.target.value)})}
                        />
                    </div>
                </div>

                <div>
                     <label className="block text-xs font-bold text-surface-on-variant uppercase tracking-wider mb-1">Notes</label>
                     <textarea 
                        className="w-full bg-surface-container-high border-b-2 border-outline-variant/50 focus:border-primary rounded-t-lg px-4 py-3 text-surface-on outline-none resize-none h-24"
                        value={newRun.notes}
                        onChange={(e) => setNewRun({...newRun, notes: e.target.value})}
                        placeholder="How did it feel?"
                     />
                </div>
            </form>
            
            <div className="p-6 border-t border-outline-variant/20 bg-surface-container-low">
                <button 
                    onClick={handleSubmit}
                    className="w-full py-4 bg-primary text-primary-on rounded-full font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01] transition-all"
                >
                    {editingId ? 'Update Run' : 'Save Run'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Strava Modal */}
      {isStravaModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
              <div className="bg-surface-container max-w-md w-full rounded-[32px] p-8 shadow-2xl relative">
                  <button onClick={() => setIsStravaModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-surface-container-high rounded-full"><X size={20} /></button>
                  <div className="text-center mb-6">
                       <div className="bg-[#FC4C02] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                           <Zap size={32} className="text-white" fill="currentColor" />
                       </div>
                       <h3 className="text-2xl font-bold text-surface-on">Connect Strava</h3>
                       <p className="text-surface-on-variant text-sm mt-2">Enter your API credentials to sync.</p>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-surface-on-variant ml-2">Client ID</label>
                          <input 
                            type="text" 
                            value={stravaClientId} 
                            onChange={(e) => setStravaClientId(e.target.value)} 
                            className="w-full bg-surface-container-high p-4 rounded-xl outline-none focus:ring-2 ring-primary"
                            placeholder="12345"
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-surface-on-variant ml-2">Client Secret</label>
                          <input 
                            type="password" 
                            value={stravaClientSecret} 
                            onChange={(e) => setStravaClientSecret(e.target.value)} 
                            className="w-full bg-surface-container-high p-4 rounded-xl outline-none focus:ring-2 ring-primary"
                            placeholder="••••••••"
                          />
                      </div>
                      {stravaError && <div className="text-error text-sm bg-error-container p-3 rounded-lg flex gap-2 items-center"><AlertTriangle size={16} /> {stravaError}</div>}
                      
                      <div className="pt-2">
                        <button 
                            onClick={initiateStravaAuth} 
                            className="w-full py-4 bg-[#FC4C02] text-white font-bold rounded-full shadow-lg hover:bg-[#E34402] transition-colors flex items-center justify-center gap-2"
                        >
                            Authenticate <ExternalLink size={18} />
                        </button>
                      </div>
                      
                      <div className="text-xs text-center text-surface-on-variant/70 mt-4">
                          Ensure "localhost" is in your Strava App's Authorization Callback Domain.
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Google Modal */}
      {isGoogleModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
              <div className="bg-surface-container max-w-md w-full rounded-[32px] p-8 shadow-2xl relative">
                  <button onClick={() => setIsGoogleModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-surface-container-high rounded-full"><X size={20} /></button>
                  <div className="text-center mb-6">
                       <div className="bg-surface-container-highest w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-outline-variant/20">
                           <Activity size={32} className="text-surface-on" />
                       </div>
                       <h3 className="text-2xl font-bold text-surface-on">Connect Google Fit</h3>
                       <p className="text-surface-on-variant text-sm mt-2">Sync your running history from Google.</p>
                  </div>
                  
                   <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-surface-on-variant ml-2">Client ID</label>
                          <input 
                            type="text" 
                            value={googleClientId} 
                            onChange={(e) => setGoogleClientId(e.target.value)} 
                            className="w-full bg-surface-container-high p-4 rounded-xl outline-none focus:ring-2 ring-primary"
                            placeholder="...apps.googleusercontent.com"
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-surface-on-variant ml-2">Client Secret</label>
                          <input 
                            type="password" 
                            value={googleClientSecret} 
                            onChange={(e) => setGoogleClientSecret(e.target.value)} 
                            className="w-full bg-surface-container-high p-4 rounded-xl outline-none focus:ring-2 ring-primary"
                            placeholder="••••••••"
                          />
                      </div>
                      {googleError && <div className="text-error text-sm bg-error-container p-3 rounded-lg flex gap-2 items-center"><AlertTriangle size={16} /> {googleError}</div>}
                      
                      <div className="pt-2">
                        <button 
                            onClick={initiateGoogleAuth} 
                            className="w-full py-4 bg-surface-on text-surface-inverse-on font-bold rounded-full shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            Authenticate <ExternalLink size={18} />
                        </button>
                      </div>

                       <div className="bg-surface-container-high p-3 rounded-xl mt-4">
                         <p className="text-[10px] text-surface-on-variant flex items-start gap-2">
                            <Info size={14} className="shrink-0 mt-0.5" />
                            <span>
                                Add <strong>{detectedOrigin}</strong> to "Authorized Javascript Origins" and <strong>{detectedOrigin}</strong> to "Authorized Redirect URIs" in Google Cloud Console.
                            </span>
                         </p>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default RunLog;