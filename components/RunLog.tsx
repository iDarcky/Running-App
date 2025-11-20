
import React, { useState, useEffect } from 'react';
import { Run, RunType, RunSource, StravaToken, GoogleToken } from '../types';
import { Plus, Trash2, MapPin, Clock, Heart, Activity, Watch, Smartphone, Footprints, Filter, X, CheckCircle, Chrome, Zap, BatteryCharging, Trophy, Copy, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { getStravaAuthUrl, exchangeStravaToken, getStravaActivities, mapStravaToRun } from '../services/stravaService';
import { getGoogleAuthUrl, exchangeGoogleToken, getGoogleFitActivities } from '../services/googleFitService';

interface RunLogProps {
  runs: Run[];
  onAddRun: (run: Run) => void;
  onDeleteRun: (id: string) => void;
}

const RunLog: React.FC<RunLogProps> = ({ runs, onAddRun, onDeleteRun }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterType, setFilterType] = useState<RunType | 'All'>('All');
  
  // Strava State
  const [isStravaModalOpen, setIsStravaModalOpen] = useState(false);
  const [stravaClientId, setStravaClientId] = useState('');
  const [stravaClientSecret, setStravaClientSecret] = useState('');
  const [stravaTokenData, setStravaTokenData] = useState<StravaToken | null>(null);
  const [stravaError, setStravaError] = useState('');

  // Google Fit State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [googleTokenData, setGoogleTokenData] = useState<GoogleToken | null>(null);
  const [googleError, setGoogleError] = useState('');

  const [authStatus, setAuthStatus] = useState<'idle' | 'exchanging' | 'connected'>('idle');
  const [copied, setCopied] = useState(false);

  // Domain Detection
  const [detectedHostname, setDetectedHostname] = useState('');
  const [detectedOrigin, setDetectedOrigin] = useState('');

  // Load credentials & tokens on mount
  useEffect(() => {
    // Capture environment details
    setDetectedHostname(window.location.hostname);
    setDetectedOrigin(window.location.origin);

    // Strava Load
    const savedStravaId = localStorage.getItem('strava_client_id');
    const savedStravaSecret = localStorage.getItem('strava_client_secret');
    const savedStravaTokens = localStorage.getItem('strava_tokens');

    if (savedStravaId) setStravaClientId(savedStravaId);
    if (savedStravaSecret) setStravaClientSecret(savedStravaSecret);
    if (savedStravaTokens) {
        try {
            setStravaTokenData(JSON.parse(savedStravaTokens));
        } catch (e) { console.error("Bad Strava Token"); }
    }

    // Google Load
    const savedGoogleId = localStorage.getItem('google_client_id');
    const savedGoogleSecret = localStorage.getItem('google_client_secret');
    const savedGoogleTokens = localStorage.getItem('google_tokens');

    if (savedGoogleId) setGoogleClientId(savedGoogleId);
    if (savedGoogleSecret) setGoogleClientSecret(savedGoogleSecret);
    if (savedGoogleTokens) {
        try {
            setGoogleTokenData(JSON.parse(savedGoogleTokens));
        } catch (e) { console.error("Bad Google Token"); }
    }

    // Check for OAuth Code in URL (if we are the popup)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code) {
        if (state === 'strava' && savedStravaId && savedStravaSecret) {
            handleStravaTokenExchange(code, savedStravaId, savedStravaSecret);
        } else if (state === 'google' && savedGoogleId && savedGoogleSecret) {
            handleGoogleTokenExchange(code, savedGoogleId, savedGoogleSecret);
        }
    }

    // Listen for storage changes (if we are the main window and popup updated tokens)
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'strava_tokens' && e.newValue) {
            setStravaTokenData(JSON.parse(e.newValue));
        }
        if (e.key === 'google_tokens' && e.newValue) {
            setGoogleTokenData(JSON.parse(e.newValue));
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // --- UTILS ---
  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  // --- STRAVA LOGIC ---

  const handleStravaTokenExchange = async (code: string, clientId: string, clientSecret: string) => {
      setAuthStatus('exchanging');
      setIsStravaModalOpen(true);
      try {
          const tokens = await exchangeStravaToken(clientId, clientSecret, code);
          setStravaTokenData(tokens);
          localStorage.setItem('strava_tokens', JSON.stringify(tokens));
          setAuthStatus('connected');
          setStravaError('');
          
          // Immediately sync after connecting
          await handleStravaSync(tokens);

          // If we are in a popup/new window opened by the app, close self
          if (window.opener) {
              setTimeout(() => window.close(), 2000); // Delay slightly so user sees success
          } else {
              window.history.replaceState({}, document.title, window.location.pathname);
          }
      } catch (err: any) {
          setStravaError(`OAuth Failed: ${err.message}`);
          setAuthStatus('idle');
      }
  };

  const initiateStravaAuth = () => {
      if (!stravaClientId || !stravaClientSecret) {
          setStravaError('Client ID and Client Secret are required.');
          return;
      }
      localStorage.setItem('strava_client_id', stravaClientId);
      localStorage.setItem('strava_client_secret', stravaClientSecret);
      
      // Open in new window/popup to avoid X-Frame-Options issues in iframes/previews
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      window.open(
        getStravaAuthUrl(stravaClientId), 
        'Strava Auth', 
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );
  };

  const disconnectStrava = () => {
      localStorage.removeItem('strava_tokens');
      setStravaTokenData(null);
      setAuthStatus('idle');
  };

  const handleStravaSync = async (tokensOverride?: StravaToken) => {
    const tokens = tokensOverride || stravaTokenData;
    if (!tokens || !stravaClientId || !stravaClientSecret) {
        setIsStravaModalOpen(true);
        return;
    }

    setIsSyncing(true);
    setStravaError('');

    try {
        const activities = await getStravaActivities(
            tokens, stravaClientId, stravaClientSecret,
            (newTokens) => {
                setStravaTokenData(newTokens);
                localStorage.setItem('strava_tokens', JSON.stringify(newTokens));
            }
        );

        const existingIds = new Set(runs.map(r => r.id));
        let count = 0;
        activities.forEach(activity => {
            if (activity.type === 'Run') {
                const mappedRun = mapStravaToRun(activity);
                if (!existingIds.has(mappedRun.id)) {
                    onAddRun(mappedRun);
                    count++;
                }
            }
        });
        // Only close modal if not in popup mode (if opener exists, we wait for close)
        if (count > 0 && !window.opener) setIsStravaModalOpen(false);
    } catch (err: any) {
        const errMsg = err.message || 'Sync failed.';
        setStravaError(errMsg);
        setIsStravaModalOpen(true);
        if (errMsg.includes('Permission Denied') || errMsg.includes('Unauthorized')) {
             disconnectStrava();
        }
    } finally {
        setIsSyncing(false);
    }
  };

  // --- GOOGLE FIT LOGIC ---

  const handleGoogleTokenExchange = async (code: string, clientId: string, clientSecret: string) => {
      setAuthStatus('exchanging');
      setIsGoogleModalOpen(true);
      try {
          const tokens = await exchangeGoogleToken(clientId, clientSecret, code);
          setGoogleTokenData(tokens);
          localStorage.setItem('google_tokens', JSON.stringify(tokens));
          setAuthStatus('connected');
          setGoogleError('');
          
          // Immediately sync
          await handleGoogleSync(tokens);

          if (window.opener) {
              setTimeout(() => window.close(), 2000);
          } else {
              window.history.replaceState({}, document.title, window.location.pathname);
          }
      } catch (err: any) {
          setGoogleError(`Google Auth Failed: ${err.message}`);
          setAuthStatus('idle');
      }
  };

  const initiateGoogleAuth = () => {
      if (!googleClientId || !googleClientSecret) {
          setGoogleError('Client ID and Client Secret are required.');
          return;
      }
      localStorage.setItem('google_client_id', googleClientId);
      localStorage.setItem('google_client_secret', googleClientSecret);
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      window.open(
          getGoogleAuthUrl(googleClientId),
          'Google Auth',
           `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );
  };

  const disconnectGoogle = () => {
      localStorage.removeItem('google_tokens');
      setGoogleTokenData(null);
      setAuthStatus('idle');
  };

  const handleGoogleSync = async (tokensOverride?: GoogleToken) => {
      const tokens = tokensOverride || googleTokenData;
      if (!tokens || !googleClientId || !googleClientSecret) {
          setIsGoogleModalOpen(true);
          return;
      }

      setIsSyncing(true);
      setGoogleError('');

      try {
          const googleRuns = await getGoogleFitActivities(
              tokens, googleClientId, googleClientSecret,
              (newTokens) => {
                  setGoogleTokenData(newTokens);
                  localStorage.setItem('google_tokens', JSON.stringify(newTokens));
              }
          );

          const existingIds = new Set(runs.map(r => r.id));
          let count = 0;
          googleRuns.forEach(run => {
              if (!existingIds.has(run.id)) {
                  onAddRun(run);
                  count++;
              }
          });
          if (count > 0 && !window.opener) setIsGoogleModalOpen(false);
      } catch (err: any) {
          setGoogleError(err.message || 'Google sync failed');
          setIsGoogleModalOpen(true);
          if (err.message.includes('Expired') || err.message.includes('Auth')) {
              disconnectGoogle();
          }
      } finally {
          setIsSyncing(false);
      }
  };

  // --- MANUAL FORM LOGIC ---

  const [newRun, setNewRun] = useState<Partial<Run>>({
    date: new Date().toISOString().split('T')[0],
    type: RunType.EASY,
    distance: 5,
    duration: 30,
    avgHr: 140,
    rpe: 5,
    cadence: 165,
    strideLength: 1.0,
    source: 'Manual',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const run: Run = {
      id: Date.now().toString(),
      date: newRun.date!,
      distance: Number(newRun.distance),
      duration: Number(newRun.duration),
      type: newRun.type as RunType,
      avgHr: Number(newRun.avgHr),
      rpe: Number(newRun.rpe),
      cadence: newRun.cadence ? Number(newRun.cadence) : undefined,
      strideLength: newRun.strideLength ? Number(newRun.strideLength) : undefined,
      source: 'Manual',
      notes: newRun.notes || ''
    };
    onAddRun(run);
    setIsFormOpen(false);
  };

  const simulateSync = (source: RunSource) => {
    setIsSyncing(true);
    setTimeout(() => {
        const mockRun: Run = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            distance: Number((Math.random() * 10 + 3).toFixed(2)),
            duration: Math.floor(Math.random() * 40 + 20),
            type: RunType.EASY,
            avgHr: Math.floor(Math.random() * 40 + 130),
            rpe: Math.floor(Math.random() * 4 + 4),
            cadence: Math.floor(Math.random() * 20 + 160),
            strideLength: Number((Math.random() * 0.3 + 0.8).toFixed(2)),
            source: source,
            notes: `Imported from ${source}`
        };
        onAddRun(mockRun);
        setIsSyncing(false);
    }, 1500);
  };

  const sortedRuns = [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filteredRuns = filterType === 'All' ? sortedRuns : sortedRuns.filter(run => run.type === filterType);

  const getRunStyles = (type: RunType) => {
    switch(type) {
        case RunType.EASY: return { container: 'bg-slate-800 border-blue-500/30 hover:border-blue-500/50 shadow-lg shadow-blue-500/5', badge: 'text-blue-400 bg-blue-400/10 border-blue-400/20', iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400', icon: <Heart size={20} /> };
        case RunType.TEMPO: return { container: 'bg-slate-800 border-amber-500/30 hover:border-amber-500/50 shadow-lg shadow-amber-500/5', badge: 'text-amber-400 bg-amber-400/10 border-amber-400/20', iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', icon: <Zap size={20} /> };
        case RunType.INTERVAL: return { container: 'bg-slate-800 border-red-500/30 hover:border-red-500/50 shadow-lg shadow-red-500/5', badge: 'text-red-400 bg-red-400/10 border-red-400/20', iconBg: 'bg-red-500/10 border-red-500/20 text-red-400', icon: <Activity size={20} /> };
        case RunType.LONG: return { container: 'bg-slate-800 border-violet-500/30 hover:border-violet-500/50 shadow-lg shadow-violet-500/5', badge: 'text-violet-400 bg-violet-400/10 border-violet-400/20', iconBg: 'bg-violet-500/10 border-violet-500/20 text-violet-400', icon: <MapPin size={20} /> };
        case RunType.RECOVERY: return { container: 'bg-slate-800 border-emerald-500/30 hover:border-emerald-500/50 shadow-lg shadow-emerald-500/5', badge: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', icon: <BatteryCharging size={20} /> };
        case RunType.RACE: return { container: 'bg-slate-800 border-yellow-500/30 hover:border-yellow-500/50 shadow-lg shadow-yellow-500/5', badge: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', iconBg: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400', icon: <Trophy size={20} /> };
        default: return { container: 'bg-slate-800 border-slate-700/50 hover:border-slate-600', badge: 'text-slate-400 bg-slate-400/10 border-slate-400/20', iconBg: 'bg-slate-400/10 border-slate-400/20 text-slate-400', icon: <Footprints size={20} /> };
    }
  };

  // If we are inside the popup and auth was successful, show a minimal success screen
  if (window.opener && authStatus === 'connected') {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
                  <CheckCircle className="text-emerald-400" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Successfully Connected!</h2>
              <p className="text-slate-400 mb-4">Your runs are syncing...</p>
              <p className="text-xs text-slate-500">This window will close automatically.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Training Log</h2>
        
        <div className="flex flex-wrap gap-2">
             {/* Strava Button */}
             <button 
                onClick={() => stravaTokenData ? handleStravaSync() : setIsStravaModalOpen(true)}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    stravaTokenData 
                    ? 'bg-[#FC4C02] hover:bg-[#E34402] text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                } disabled:opacity-50`}
             >
                <Activity size={16} />
                {isSyncing && stravaTokenData ? 'Syncing...' : stravaTokenData ? 'Sync Strava' : 'Connect Strava'}
             </button>

             {/* Google Fit Button */}
             <button 
                onClick={() => googleTokenData ? handleGoogleSync() : setIsGoogleModalOpen(true)}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    googleTokenData
                    ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                } disabled:opacity-50`}
             >
                <Chrome size={16} />
                {isSyncing && googleTokenData ? 'Syncing...' : googleTokenData ? 'Sync Google' : 'Google Fit'}
             </button>

             {/* Other Buttons */}
             <button 
                onClick={() => simulateSync('Garmin')}
                disabled={isSyncing}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 px-3 py-2 rounded-lg transition-colors text-sm"
             >
                <Watch size={16} />
                Garmin
             </button>
             
             <button 
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-brand-500/20"
             >
                <Plus size={20} />
                <span>Manual Log</span>
             </button>
        </div>
      </div>

      {/* --- Strava Modal --- */}
      {isStravaModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl animate-fade-in p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <Activity className="text-[#FC4C02]" size={24} />
                        <h3 className="text-xl font-bold text-white">Strava Integration</h3>
                    </div>
                    <button onClick={() => setIsStravaModalOpen(false)} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-4">
                    {stravaTokenData ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center space-y-3">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="text-emerald-400" size={24} />
                            </div>
                            <h4 className="text-white font-medium">Connected to Strava</h4>
                            <p className="text-slate-400 text-sm">As {stravaTokenData.athlete?.firstname || 'Athlete'}</p>
                            <button onClick={disconnectStrava} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-medium text-sm">Disconnect</button>
                        </div>
                    ) : (
                        <>
                            {/* Helper Box */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-200 mb-2">
                                <div className="flex items-center gap-2 mb-2 border-b border-blue-500/20 pb-2">
                                    <Info size={16} className="shrink-0 text-blue-400" />
                                    <p className="font-bold">Important Configuration</p>
                                </div>
                                <div className="space-y-2 text-slate-300">
                                    <p>1. Go to <a href="https://www.strava.com/settings/api" target="_blank" rel="noreferrer" className="underline hover:text-white inline-flex items-center gap-1">Strava API Settings <ExternalLink size={10}/></a></p>
                                    <p>2. Paste the exact domain below into the <strong>Authorization Callback Domain</strong> field:</p>
                                    
                                    <div className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700 mt-1">
                                        <code className="flex-1 truncate text-slate-300 font-mono select-all">
                                            {detectedHostname || 'Loading...'}
                                        </code>
                                        <button 
                                            onClick={() => copyToClipboard(detectedHostname)} 
                                            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" 
                                            title="Copy Domain"
                                        >
                                            {copied ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        * Note: In AI Studio/IDX previews, this domain looks like a long random string (e.g. 8000-idx...). You must use this exact value.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <input type="text" value={stravaClientId} onChange={(e) => setStravaClientId(e.target.value)} placeholder="Client ID" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-[#FC4C02] outline-none transition-colors" />
                                <input type="password" value={stravaClientSecret} onChange={(e) => setStravaClientSecret(e.target.value)} placeholder="Client Secret" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-[#FC4C02] outline-none transition-colors" />
                                <button onClick={initiateStravaAuth} disabled={!stravaClientId || !stravaClientSecret} className="w-full bg-[#FC4C02] hover:bg-[#E34402] disabled:opacity-50 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">Connect Strava</button>
                            </div>
                        </>
                    )}
                    {stravaError && (
                        <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 p-3 rounded flex items-start gap-2">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <div className="break-words">{stravaError}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* --- Google Fit Modal --- */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl animate-fade-in p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <Chrome className="text-blue-500" size={24} />
                        <h3 className="text-xl font-bold text-white">Google Fit</h3>
                    </div>
                    <button onClick={() => setIsGoogleModalOpen(false)} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-4">
                    {googleTokenData ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center space-y-3">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="text-emerald-400" size={24} />
                            </div>
                            <h4 className="text-white font-medium">Connected to Google Fit</h4>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => handleGoogleSync()} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm">Sync</button>
                                <button onClick={disconnectGoogle} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm">Disconnect</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Helper Box */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-200 mb-2">
                                <div className="flex items-center gap-2 mb-2 border-b border-blue-500/20 pb-2">
                                    <Info size={16} className="shrink-0 text-blue-400" />
                                    <p className="font-bold">Configuration Required</p>
                                </div>
                                <div className="space-y-2 text-slate-300">
                                    <p>1. Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="underline hover:text-white inline-flex items-center gap-1">Google Cloud Console <ExternalLink size={10}/></a></p>
                                    <p>2. Add this exact URI to <strong>Authorized Redirect URIs</strong>:</p>
                                    
                                    <div className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700 mt-1">
                                        <code className="flex-1 truncate text-slate-300 font-mono select-all">
                                            {detectedOrigin || 'Loading...'}
                                        </code>
                                        <button 
                                            onClick={() => copyToClipboard(detectedOrigin)} 
                                            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                            title="Copy URI"
                                        >
                                            {copied ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <input type="text" value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)} placeholder="Google Client ID" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none transition-colors" />
                            <input type="password" value={googleClientSecret} onChange={(e) => setGoogleClientSecret(e.target.value)} placeholder="Google Client Secret" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none transition-colors" />
                            <button onClick={initiateGoogleAuth} disabled={!googleClientId || !googleClientSecret} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">Connect Google Account</button>
                        </>
                    )}
                    {googleError && (
                        <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 p-3 rounded flex items-start gap-2">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <div className="break-words">{googleError}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Add Run Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 p-6 rounded-xl animate-slide-down mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-1">Date</label>
              <input type="date" required value={newRun.date} onChange={e => setNewRun({...newRun, date: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-brand-500 outline-none" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-1">Type</label>
              <select value={newRun.type} onChange={e => setNewRun({...newRun, type: e.target.value as RunType})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-brand-500 outline-none">
                {Object.values(RunType).map(type => (<option key={type} value={type}>{type}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-1">Distance (km)</label>
              <input type="number" step="0.01" required value={newRun.distance} onChange={e => setNewRun({...newRun, distance: parseFloat(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-brand-500 outline-none" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-1">Duration (min)</label>
              <input type="number" required value={newRun.duration} onChange={e => setNewRun({...newRun, duration: parseFloat(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-brand-500 outline-none" />
            </div>
            <div>
               <label className="block text-slate-400 text-xs uppercase mb-1">Avg HR (bpm)</label>
               <input type="number" value={newRun.avgHr} onChange={e => setNewRun({...newRun, avgHr: parseFloat(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-brand-500 outline-none" />
            </div>
            <div>
               <label className="block text-slate-400 text-xs uppercase mb-1">RPE (1-10)</label>
               <input type="number" min="1" max="10" value={newRun.rpe} onChange={e => setNewRun({...newRun, rpe: parseFloat(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-brand-500 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
             <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
             <button type="submit" className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg shadow-lg shadow-brand-500/20 transition-all">Save Run</button>
          </div>
        </form>
      )}

      {/* List Header & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
          <div className="text-slate-400 text-sm font-medium">History ({filteredRuns.length})</div>
          <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value as RunType | 'All')} className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-2 py-1 outline-none focus:border-brand-500 cursor-pointer">
                  <option value="All">All Activities</option>
                  {Object.values(RunType).map(t => (<option key={t} value={t}>{t}</option>))}
              </select>
          </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredRuns.map(run => {
           const pace = run.duration / (run.distance || 1);
           const paceMin = Math.floor(pace);
           const paceSec = Math.round((pace - paceMin) * 60);
           const styles = getRunStyles(run.type);

           return (
            <div key={run.id} className={`border rounded-xl p-4 transition-all group ${styles.container}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start md:items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border relative ${styles.iconBg}`}>
                             {styles.icon}
                             {run.source && run.source !== 'Manual' && (
                                <div className="absolute -bottom-1 -right-1 bg-slate-700 rounded-full p-0.5 border border-slate-600" title={`Synced from ${run.source}`}>
                                    {run.source === 'Garmin' ? <Watch size={10} className="text-blue-400" /> : 
                                     run.source === 'Strava' ? <Activity size={10} className="text-[#FC4C02]" /> :
                                     run.source === 'Google Fit' ? <Chrome size={10} className="text-blue-500" /> :
                                     run.source === 'Health Connect' ? <Heart size={10} className="text-brand-400" /> :
                                     <Smartphone size={10} className="text-gray-400" />}
                                </div>
                             )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-white font-semibold text-lg">{run.distance} km</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${styles.badge}`}>{run.type}</span>
                            </div>
                            <div className="text-slate-400 text-sm flex flex-wrap items-center gap-3 mt-1">
                                <span className="flex items-center gap-1"><Clock size={14} /> {run.duration}m</span>
                                <span>•</span>
                                <span>{paceMin}:{paceSec.toString().padStart(2, '0')} /km</span>
                                <span>•</span>
                                <span>{new Date(run.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                {run.cadence && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1 text-purple-400"><Footprints size={12} /> {run.cadence} spm</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-6 md:w-1/3">
                        <div className="text-right">
                            <div className="text-xs text-slate-500 uppercase">Avg HR</div>
                            <div className="text-white font-medium">{run.avgHr || '--'} bpm</div>
                        </div>
                         <div className="text-right">
                            <div className="text-xs text-slate-500 uppercase">RPE</div>
                            <div className="text-white font-medium">{run.rpe > 0 ? `${run.rpe}/10` : '--'}</div>
                        </div>
                        <button onClick={() => onDeleteRun(run.id)} className="text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-2">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                {run.notes && <div className="mt-3 pt-3 border-t border-slate-700/50 text-slate-400 text-sm italic">"{run.notes}"</div>}
            </div>
           );
        })}
        {filteredRuns.length === 0 && (
            <div className="text-center py-12 text-slate-500"><p>No runs found for this filter.</p></div>
        )}
      </div>
    </div>
  );
};

export default RunLog;
