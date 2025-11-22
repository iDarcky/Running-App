
import React, { useState, useEffect, useRef } from 'react';
import { Run, RunType, StravaToken, GoogleToken, UserProfile } from '../types';
import { RUN_TYPE_COLORS, RUN_TYPE_ORDER } from '../constants';
import { Plus, Zap, Activity, Footprints, Clock, Calendar, Heart, Gauge, Pencil, Trash2, AlertTriangle, ExternalLink, Info, CheckCircle, Loader2, ChevronDown, Feather, Flame, Map, Trophy, BatteryCharging, Timer, Share2 } from 'lucide-react';
import { getStravaAuthUrl, exchangeStravaToken, getStravaActivities, mapStravaToRun } from '../services/stravaService';
import { getGoogleAuthUrl, exchangeGoogleToken, getGoogleFitActivities } from '../services/googleFitService';
import { Modal, Input } from './UIComponents';
import RunForm from './RunForm';
import SocialShareModal from './SocialShareModal';
import { formatDuration, formatFullDate, formatPace } from '../utils/formatters';

interface RunLogProps {
  runs: Run[];
  onAddRun: (run: Run) => void;
  onAddRuns: (runs: Run[]) => void;
  onUpdateRun: (run: Run) => void;
  onDeleteRun: (id: string) => void;
  profile?: UserProfile;
}

const RunLog: React.FC<RunLogProps> = ({ runs, onAddRun, onAddRuns, onUpdateRun, onDeleteRun, profile }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterType, setFilterType] = useState<RunType | 'All'>('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Share State
  const [shareRun, setShareRun] = useState<Run | null>(null);
  
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
            notes: data.notes || '',
            shoeId: data.shoeId
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

  const getRunTypeIcon = (type: RunType, size: number = 14) => {
    switch (type) {
      case RunType.EASY: return <Feather size={size} className="shrink-0" />;
      case RunType.TEMPO: return <Flame size={size} className="shrink-0" />;
      case RunType.INTERVAL: return <Zap size={size} className="shrink-0" />;
      case RunType.LONG: return <Map size={size} className="shrink-0" />;
      case RunType.RACE: return <Trophy size={size} className="shrink-0" />;
      case RunType.RECOVERY: return <BatteryCharging size={size} className="shrink-0" />;
      default: return <Activity size={size} className="shrink-0" />;
    }
  };
  
  const getShoeName = (shoeId?: string) => {
      if (!shoeId || !profile?.shoes) return null;
      const shoe = profile.shoes.find(s => s.id === shoeId);
      if (!shoe) return null;
      const name = shoe.nickname || `${shoe.brand} ${shoe.model}`;
      return shoe.isRetired ? `${name} (Retired)` : name;
  };

  if (authStatus !== 'idle') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
             <div className={`p-8 rounded-3xl ${authStatus === 'error' ? 'bg-error-container text-error-on-container' : 'bg-primary-container text-primary-on-container'} shadow-lg text-center max-w-sm mx-4`}>
                  {authStatus === 'exchanging' && <Loader2 className="animate-spin mx-auto mb-4" size={48} />}
                  {authStatus === 'connected' && <CheckCircle className="mx-auto mb-4 text-white" size={48} />}
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
              className="flex items-center gap-2 bg-primary text-primary-on px-5 py-2.5 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform font-medium"
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
        {['All', ...RUN_TYPE_ORDER].map(type => {
             const isActive = filterType === type;
             const typeColor = type === 'All' ? '#000000' : RUN_TYPE_COLORS[type as RunType];
             
             return (
                 <button
                    key={type}
                    onClick={() => setFilterType(type as any)}
                    style={{
                        backgroundColor: isActive && type !== 'All' ? typeColor : undefined,
                        borderColor: isActive && type !== 'All' ? typeColor : undefined,
                    }}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors border flex items-center gap-2 ${
                        isActive
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg' 
                        : 'bg-surface text-surface-on-variant border-outline-variant/50 hover:bg-surface-container-high'
                    }`}
                 >
                    {type !== 'All' && getRunTypeIcon(type as RunType)}
                    {type}
                 </button>
             );
        })}
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
                const shoeName = getShoeName(run.shoeId);

                return (
                    <div key={run.id} className="bg-surface-container rounded-3xl p-6 relative overflow-hidden transition-all hover:shadow-md">
                        <div className="flex gap-4">
                            {/* Pill Indicator */}
                            <div 
                                className="w-1.5 rounded-full shrink-0" 
                                style={{ backgroundColor: RUN_TYPE_COLORS[run.type] }}
                            ></div>

                            <div className="flex-1 min-w-0">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleExpand(run.id)}>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div 
                                            style={{ color: RUN_TYPE_COLORS[run.type] }} 
                                            className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap"
                                        >
                                            {getRunTypeIcon(run.type, 16)}
                                            {run.type}
                                        </div>
                                        <div className="text-surface-on-variant/40 hidden sm:block">|</div>
                                        <div className="text-sm font-medium text-surface-on-variant flex items-center gap-2">
                                            <Calendar size={14} />
                                            {formatFullDate(run.date)}
                                        </div>
                                        
                                        {/* Shoe Badge in Collapsed View */}
                                        {shoeName && (
                                            <>
                                                <div className="text-surface-on-variant/40 hidden sm:block">|</div>
                                                <div className="text-xs font-bold text-surface-on-variant flex items-center gap-1.5 bg-surface-container-high px-2 py-1 rounded-md">
                                                    <Footprints size={12} className="text-primary" />
                                                    <span className="truncate max-w-[120px]">{shoeName}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className={`transition-transform duration-300 text-surface-on-variant ${isExpanded ? 'rotate-180' : ''}`}>
                                        <ChevronDown size={20} />
                                    </div>
                                </div>

                                {/* Main Stats Row */}
                                <div className="flex items-end justify-between mb-2 cursor-pointer" onClick={() => toggleExpand(run.id)}>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-bold text-surface-on tracking-tight">{run.distance}</span>
                                        <span className="text-lg font-medium text-surface-on-variant">km</span>
                                    </div>
                                    
                                    <div className="flex gap-8 text-right mb-1">
                                        <div>
                                            <div className="text-[10px] font-bold uppercase text-surface-on-variant mb-1 flex items-center justify-end gap-1"><Clock size={12} /> Time</div>
                                            <div className="text-xl font-bold text-surface-on leading-none">{formatDuration(run.duration)}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold uppercase text-surface-on-variant mb-1 flex items-center justify-end gap-1"><Timer size={12} /> Pace</div>
                                            <div className="text-xl font-bold text-surface-on leading-none">
                                                {formatPace(run.distance, run.duration)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Section */}
                                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                                    <div className="overflow-hidden">
                                         {/* 4-Card Grid */}
                                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                             {/* Avg HR */}
                                             <div className="bg-surface-container-high rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                                 <Heart size={20} className="mb-2 opacity-50" />
                                                 <div className="text-xs font-bold opacity-50 uppercase tracking-wide">Avg HR</div>
                                                 <div className="text-lg font-bold">{run.avgHr} <span className="text-xs font-normal opacity-60">bpm</span></div>
                                             </div>
                                             {/* Cadence */}
                                             <div className="bg-surface-container-high rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                                 <Footprints size={20} className="mb-2 opacity-50" />
                                                 <div className="text-xs font-bold opacity-50 uppercase tracking-wide">Cadence</div>
                                                 <div className="text-lg font-bold">{run.cadence || '--'} <span className="text-xs font-normal opacity-60">spm</span></div>
                                             </div>
                                             {/* Effort */}
                                             <div className="bg-surface-container-high rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                                 <Gauge size={20} className="mb-2 opacity-50" />
                                                 <div className="text-xs font-bold opacity-50 uppercase tracking-wide">Effort</div>
                                                 <div className="text-lg font-bold">{run.rpe || '--'} <span className="text-xs font-normal opacity-60">/ 10</span></div>
                                             </div>
                                             {/* Source / Shoe */}
                                             <div className="bg-surface-container-high rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                                 {shoeName ? (
                                                     <>
                                                        <Footprints size={20} className="mb-2 text-primary opacity-80" />
                                                        <div className="text-xs font-bold opacity-50 uppercase tracking-wide">Gear</div>
                                                        <div className="text-xs font-bold truncate w-full px-2">{shoeName}</div>
                                                     </>
                                                 ) : (
                                                     <>
                                                        {run.source === 'Strava' ? <Zap size={20} className="mb-2 text-[#FC4C02]" fill="currentColor" /> : <Activity size={20} className="mb-2 opacity-50" />}
                                                        <div className="text-xs font-bold opacity-50 uppercase tracking-wide">Source</div>
                                                        <div className="text-lg font-bold truncate w-full px-2">{run.source || 'Manual'}</div>
                                                     </>
                                                 )}
                                             </div>
                                         </div>

                                         {/* Notes */}
                                         {run.notes && (
                                            <div className="bg-surface-container-high rounded-xl p-4 mb-6 relative">
                                                <div className="absolute top-3 left-3 opacity-20"><Info size={16} /></div>
                                                <p className="text-sm italic opacity-80 pl-6">"{run.notes}"</p>
                                            </div>
                                        )}

                                         {/* Actions */}
                                         <div className="flex justify-between items-center">
                                              <button 
                                                 onClick={(e) => { e.stopPropagation(); setShareRun(run); }}
                                                 className="px-5 py-2.5 rounded-full bg-surface-container-highest hover:bg-surface-container-high text-surface-on font-bold text-sm flex items-center gap-2 transition-colors"
                                             >
                                                 <Share2 size={16} /> Share Card
                                             </button>
                                             
                                             <div className="flex gap-3">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(run); }}
                                                    className="px-5 py-2.5 rounded-full bg-surface-container-highest hover:bg-surface-container-high font-bold text-sm flex items-center gap-2 transition-colors"
                                                >
                                                    <Pencil size={16} /> Edit
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onDeleteRun(run.id); }}
                                                    className="px-5 py-2.5 rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 font-bold text-sm flex items-center gap-2 transition-colors"
                                                >
                                                    <Trash2 size={16} /> Delete
                                                </button>
                                             </div>
                                         </div>
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
            profile={profile}
          />
      </Modal>
      
      {/* Social Share Modal */}
      {shareRun && (
          <SocialShareModal 
            run={shareRun}
            onClose={() => setShareRun(null)}
          />
      )}

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
                    />
                    <Input 
                        label="Client Secret"
                        type="password"
                        value={stravaClientSecret}
                        onChange={(e: any) => setStravaClientSecret(e.target.value)}
                    />
                    
                    <div className="bg-surface-container-high p-4 rounded-xl text-xs text-surface-on-variant">
                        <p className="font-bold mb-2">Callback Domain Setup:</p>
                        <p className="mb-1">Add this domain to your Strava API Application settings:</p>
                        <code className="block bg-black/10 dark:bg-white/10 p-2 rounded mb-2">{detectedHostname}</code>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-xs text-red-600 dark:text-red-300 flex gap-2">
                        <AlertTriangle size={16} className="shrink-0" />
                        <p>Ensure your Strava App has "Authorization Callback Domain" set correctly, otherwise you will get a "Invalid Redirect URI" error.</p>
                    </div>

                    {stravaError && (
                        <div className="text-red-500 text-sm font-bold text-center">{stravaError}</div>
                    )}

                    <button 
                        onClick={initiateStravaAuth}
                        className="w-full bg-[#FC4C02] text-white py-4 rounded-full font-bold shadow-lg hover:bg-[#E34402] transition-colors"
                    >
                        Connect & Sync
                    </button>
                    
                    <div className="text-center">
                         <a href="https://www.strava.com/settings/api" target="_blank" rel="noreferrer" className="text-xs text-surface-on-variant hover:underline flex items-center justify-center gap-1">
                            Get API Credentials <ExternalLink size={10} />
                         </a>
                    </div>
                </div>
           </div>
      </Modal>

      {/* Google Fit Modal */}
      <Modal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        title="Connect Google Fit"
      >
          <div className="p-4 space-y-6">
                <div className="text-center">
                    <div className="bg-surface-container-highest w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-outline-variant">
                        <Activity size={32} className="text-surface-on" />
                    </div>
                    <p className="text-surface-on-variant text-sm">Enter your Google Cloud OAuth credentials.</p>
                </div>

                <div className="space-y-4">
                    <Input 
                        label="Client ID"
                        value={googleClientId}
                        onChange={(e: any) => setGoogleClientId(e.target.value)}
                    />
                    <Input 
                        label="Client Secret"
                        type="password"
                        value={googleClientSecret}
                        onChange={(e: any) => setGoogleClientSecret(e.target.value)}
                    />

                    <div className="bg-surface-container-high p-4 rounded-xl text-xs text-surface-on-variant">
                        <p className="font-bold mb-2">OAuth Config:</p>
                        <p className="mb-1">Add this URI to "Authorized redirect URIs" in Google Cloud Console:</p>
                        <code className="block bg-black/10 dark:bg-white/10 p-2 rounded mb-2">{detectedOrigin}</code>
                    </div>

                    {googleError && (
                        <div className="text-red-500 text-sm font-bold text-center">{googleError}</div>
                    )}

                    <button 
                        onClick={initiateGoogleAuth}
                        className="w-full bg-surface-container-highest text-surface-on border border-outline-variant py-4 rounded-full font-bold hover:bg-surface-container-high transition-colors"
                    >
                        Connect Google Fit
                    </button>
                </div>
          </div>
      </Modal>
    </div>
  );
};

export default RunLog;
