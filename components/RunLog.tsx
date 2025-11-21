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
  const [copied, setCopied] = useState(false);
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

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

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
      const existingRun = runs.find(r => r.id === editingId);
      if (existingRun) {
        onUpdateRun({ ...existingRun, date: newRun.date!, distance: Number(newRun.distance), duration: Number(newRun.duration), type: newRun.type as RunType, avgHr: Number(newRun.avgHr), rpe: Number(newRun.rpe), cadence: newRun.cadence ? Number(newRun.cadence) : undefined, strideLength: newRun.strideLength ? Number(newRun.strideLength) : undefined, notes: newRun.notes || '' });
      }
    } else {
      onAddRun({ id: Date.now().toString(), date: newRun.date!, distance: Number(newRun.distance), duration: Number(newRun.duration), type: newRun.type as RunType, avgHr: Number(newRun.avgHr), rpe: Number(newRun.rpe), cadence: newRun.cadence ? Number(newRun.cadence) : undefined, strideLength: newRun.strideLength ? Number(newRun.strideLength) : undefined, source: 'Manual', notes: newRun.notes || '' });
    }
    resetForm();
  };

  const M3Input = ({ label, type="text", value, onChange, required, className }: any) => (
    <div className={`relative group ${className}`}>
        <input type={type} value={value} onChange={onChange} required={required} placeholder=" "
            className="block w-full px-4 pt-6 pb-2 bg-surface-container-highest rounded-t-xl border-b border-outline-variant text-surface-on placeholder-transparent focus:border-primary focus:ring-0 focus:outline-none transition-colors peer" />
        <label className="absolute left-4 top-4 text-surface-on-variant text-xs transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary pointer-events-none">{label}</label>
        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-300 peer-focus:w-full"></div>
    </div>
  );

  if (isPopup) {
      return <div className="min-h-screen bg-surface flex items-center justify-center text-surface-on"><div className="text-center"><h2 className="text-xl font-bold">{authMessage}</h2></div></div>;
  }

  const sortedRuns = [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filteredRuns = filterType === 'All' ? sortedRuns : sortedRuns.filter(run => run.type === filterType);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h2 className="text-4xl font-bold text-surface-on tracking-tighter">Training Log</h2>
        <div className="flex flex-wrap gap-3">
             <button onClick={() => stravaTokenData ? handleStravaSync() : setIsStravaModalOpen(true)} disabled={isSyncing} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-[#FC4C02] text-white hover:opacity-90 transition-opacity shadow-md">{isSyncing && stravaTokenData ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}{stravaTokenData ? 'Sync Strava' : 'Connect Strava'}</button>
             <button onClick={() => googleTokenData ? handleGoogleSync() : setIsGoogleModalOpen(true)} disabled={isSyncing} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-blue-600 text-white hover:opacity-90 transition-opacity shadow-md">{isSyncing && googleTokenData ? <Loader2 size={16} className="animate-spin" /> : <Chrome size={16} />}{googleTokenData ? 'Sync Google' : 'Google Fit'}</button>
             <button onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }} className="flex items-center gap-2 bg-primary-container text-primary-on-container px-6 py-2.5 rounded-full transition-all hover:shadow-md font-bold">
                {isFormOpen ? <X size={20} /> : <Plus size={20} />}<span>{isFormOpen ? 'Close' : 'Log Run'}</span>
             </button>
        </div>
      </div>

      {isStravaModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container rounded-[28px] p-8 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-surface-on">Strava Integration</h3><button onClick={() => setIsStravaModalOpen(false)} className="p-2 hover:bg-surface-container-high rounded-full"><X size={20} /></button></div>
                {!stravaTokenData ? (
                    <div className="space-y-4">
                         <M3Input label="Client ID" value={stravaClientId} onChange={(e: any) => setStravaClientId(e.target.value)} />
                         <M3Input label="Client Secret" type="password" value={stravaClientSecret} onChange={(e: any) => setStravaClientSecret(e.target.value)} />
                         <button onClick={initiateStravaAuth} className="w-full bg-[#FC4C02] text-white py-3 rounded-full font-bold mt-4">Connect</button>
                    </div>
                ) : <div className="text-center"><p className="text-surface-on mb-4">Connected as {stravaTokenData.athlete?.firstname}</p><button onClick={() => {setStravaTokenData(null); localStorage.removeItem('strava_tokens');}} className="text-error font-bold">Disconnect</button></div>}
            </div>
        </div>
      )}

      {isGoogleModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container rounded-[28px] p-8 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-surface-on">Google Fit</h3><button onClick={() => setIsGoogleModalOpen(false)} className="p-2 hover:bg-surface-container-high rounded-full"><X size={20} /></button></div>
                {!googleTokenData ? (
                    <div className="space-y-4">
                         <M3Input label="Client ID" value={googleClientId} onChange={(e: any) => setGoogleClientId(e.target.value)} />
                         <M3Input label="Client Secret" type="password" value={googleClientSecret} onChange={(e: any) => setGoogleClientSecret(e.target.value)} />
                         <button onClick={initiateGoogleAuth} className="w-full bg-blue-600 text-white py-3 rounded-full font-bold mt-4">Connect</button>
                    </div>
                ) : <div className="text-center"><p className="text-surface-on mb-4">Connected</p><button onClick={() => {setGoogleTokenData(null); localStorage.removeItem('google_tokens');}} className="text-error font-bold">Disconnect</button></div>}
            </div>
        </div>
      )}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-surface-container-low p-8 rounded-[32px] animate-slide-down shadow-sm border border-outline-variant/20">
          <h3 className="text-xl font-bold text-surface-on mb-6 flex items-center gap-2">{editingId ? 'Edit Run' : 'New Entry'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
             <M3Input label="Date" type="date" value={newRun.date} onChange={(e: any) => setNewRun({...newRun, date: e.target.value})} required />
             <div className="relative group">
                 <select value={newRun.type} onChange={e => setNewRun({...newRun, type: e.target.value as RunType})} className="block w-full px-4 pt-6 pb-2 bg-surface-container-highest rounded-t-xl border-b border-outline-variant text-surface-on appearance-none focus:border-primary focus:outline-none">
                    {Object.values(RunType).map(type => (<option key={type} value={type}>{type}</option>))}
                 </select>
                 <label className="absolute left-4 top-1 text-xs text-surface-on-variant">Type</label>
             </div>
             <M3Input label="Distance (km)" type="number" value={newRun.distance} onChange={(e: any) => setNewRun({...newRun, distance: parseFloat(e.target.value)})} required />
             <M3Input label="Duration (min)" type="number" value={newRun.duration} onChange={(e: any) => setNewRun({...newRun, duration: parseFloat(e.target.value)})} required />
             <M3Input label="Avg HR" type="number" value={newRun.avgHr} onChange={(e: any) => setNewRun({...newRun, avgHr: parseFloat(e.target.value)})} />
             <M3Input label="RPE (1-10)" type="number" value={newRun.rpe} onChange={(e: any) => setNewRun({...newRun, rpe: parseFloat(e.target.value)})} />
             <M3Input label="Notes" value={newRun.notes} onChange={(e: any) => setNewRun({...newRun, notes: e.target.value})} className="md:col-span-2" />
          </div>
          <div className="flex justify-end gap-4">
             <button type="button" onClick={resetForm} className="px-6 py-2 rounded-full text-surface-on-variant hover:bg-surface-container-high font-medium">Cancel</button>
             <button type="submit" className="px-8 py-2 bg-primary text-primary-on rounded-full font-bold shadow-lg shadow-primary/20">{editingId ? 'Update' : 'Save'}</button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button onClick={() => setFilterType('All')} className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${filterType === 'All' ? 'bg-secondary-container text-secondary-on-container border-secondary-container' : 'border-outline text-surface-on-variant hover:bg-surface-container-high'}`}>All</button>
          {Object.values(RunType).map(t => (
              <button key={t} onClick={() => setFilterType(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${filterType === t ? 'bg-secondary-container text-secondary-on-container border-secondary-container' : 'border-outline text-surface-on-variant hover:bg-surface-container-high'}`}>{t}</button>
          ))}
      </div>

      <div className="space-y-3">
        {filteredRuns.map(run => {
           const pace = run.duration / (run.distance || 1);
           const paceMin = Math.floor(pace);
           const paceSec = Math.round((pace - paceMin) * 60);
           
           // M3 Colors for run types
           const typeColors = {
             [RunType.EASY]: 'bg-primary-container text-primary-on-container',
             [RunType.TEMPO]: 'bg-tertiary-container text-tertiary-on-container',
             [RunType.INTERVAL]: 'bg-error-container text-error-on-container',
             [RunType.LONG]: 'bg-secondary-container text-secondary-on-container',
             [RunType.RECOVERY]: 'bg-surface-container-high text-surface-on',
             [RunType.RACE]: 'bg-[#FFD8E4] text-[#31111D]',
           };
           const badgeClass = typeColors[run.type] || 'bg-surface-container-high text-surface-on';

           return (
            <div key={run.id} className="bg-surface-container rounded-[24px] p-5 shadow-sm border border-transparent hover:border-outline-variant/50 transition-all group">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${badgeClass}`}>
                             {run.type === RunType.RACE ? <Trophy size={20} /> : run.type === RunType.INTERVAL ? <Activity size={20} /> : <Footprints size={20} />}
                        </div>
                        <div>
                            <h3 className="text-surface-on font-bold text-lg flex items-center gap-2">
                                {run.distance} km <span className="text-sm font-normal text-surface-on-variant">• {run.duration}m</span>
                            </h3>
                            <div className="text-surface-on-variant text-sm flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${badgeClass}`}>{run.type}</span>
                                <span>{new Date(run.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                         <div className="text-lg font-mono text-surface-on">{paceMin}:{paceSec.toString().padStart(2, '0')} <span className="text-xs text-surface-on-variant sans-serif">/km</span></div>
                         <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleEditClick(run)} className="p-2 hover:bg-surface-container-highest rounded-full text-primary"><Edit2 size={16} /></button>
                             <button onClick={() => onDeleteRun(run.id)} className="p-2 hover:bg-error-container hover:text-error-on-container rounded-full text-surface-on-variant"><Trash2 size={16} /></button>
                         </div>
                    </div>
                </div>
                {run.notes && <div className="mt-3 pt-3 border-t border-outline-variant/10 text-surface-on-variant text-sm italic">"{run.notes}"</div>}
            </div>
           );
        })}
        {filteredRuns.length === 0 && <div className="text-center py-12 text-surface-on-variant">No runs found.</div>}
      </div>
    </div>
  );
};

export default RunLog;