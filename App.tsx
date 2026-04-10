
import React, { useState, useEffect } from 'react';
import { Run, Goal, UserProfile, Race, Shoe } from './types';
import { SAMPLE_GOALS, DEMO_SHOES, generateDemoRuns } from './constants';
import Dashboard from './components/Dashboard';
import RunLog from './components/RunLog';
import CoachInsights from './components/CoachInsights';
import RacePrep from './components/RacePrep';
import Profile from './components/Profile';
import { LandingPage } from './components/LandingPage';
import { LayoutDashboard, CalendarRange, Sparkles, FlagTriangleRight, User, AlertTriangle, Users } from 'lucide-react';
import { RedLineLogo } from './components/Logo';
import { NavButton } from './components/NavButton';
import ActiveRun from "./components/ActiveRun";
import PostRunSummary from "./components/PostRunSummary";
import { CommunityFeed } from './components/CommunityFeed';

import { supabase } from './services/supabase';
import { Auth } from './components/Auth';
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

// Pure helper function for robust calculation
const calculateShoeMileage = (shoes: Shoe[], currentRuns: Run[]): Shoe[] => {
    if (!shoes || !Array.isArray(shoes)) return [];
    
    return shoes.map(shoe => {
        const distance = currentRuns
          .filter(r => r.shoeId === shoe.id)
          .reduce((acc, r) => {
              const val = parseFloat(String(r.distance));
              return acc + (isNaN(val) ? 0 : val);
          }, 0);

        return { ...shoe, distance: Number(distance.toFixed(2)) };
    });
};

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'feed' | 'log' | 'coach' | 'race' | 'profile'>('dashboard');
  const [runState, setRunState] = useState<"idle" | "active" | "summary">("idle");
  const [currentRunData, setCurrentRunData] = useState<any>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [session, setSession] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  const [runs, setRuns] = useState<Run[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ name: '', preferredUnits: 'km' });


  useEffect(() => {
    const initApp = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.setOverlaysWebView({ overlay: true });
        } catch (e) {
          console.error("Error setting status bar overlay", e);
        }
      }
    };
    initApp();
  }, []);

  // Load localStorage data (Demo or Offline)
  useEffect(() => {
    const savedRuns = localStorage.getItem('redline_runs');
    if (savedRuns) {
      try { setRuns(JSON.parse(savedRuns)); } catch (e) {}
    }
  }, []);

  // Initial Auth Check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);


  const handleAddRun = async (run: Run) => {
      setRuns(prev => [run, ...prev]);
      if (!session?.user?.id) return;

      const timeParts = (run.time || "00:00:00").split(':').map(Number);
      const movingTimeSeconds = timeParts.length === 3 ? (timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]) : 0;

      const { error } = await supabase.from('activities').insert({
          user_id: session.user.id,
          title: run.type || 'Activity',
          activity_type: run.type,
          distance_km: run.distance,
          moving_time: movingTimeSeconds,
          start_time: run.date,
          description: run.notes,
          gear_id: run.shoeId
      });
      if (error) console.error(error);
  };

  const handleAddRuns = (newRuns: Run[]) => {
      setRuns([...newRuns, ...runs]);
  };

  const handleUpdateRun = async (updatedRun: Run) => {
      setRuns(runs.map(r => r.id === updatedRun.id ? updatedRun : r));
      if (!session?.user?.id) return;

      const timeParts = (updatedRun.time || "00:00:00").split(':').map(Number);
      const movingTimeSeconds = timeParts.length === 3 ? (timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]) : 0;

      const { error } = await supabase.from('activities').update({
          title: updatedRun.type || 'Activity',
          activity_type: updatedRun.type,
          distance_km: updatedRun.distance,
          moving_time: movingTimeSeconds,
          start_time: updatedRun.date,
          description: updatedRun.notes,
          gear_id: updatedRun.shoeId
      }).eq('id', updatedRun.id);
      if (error) console.error(error);
  };

  const handleDeleteRun = async (id: string) => {
      setRuns(runs.filter(r => r.id !== id));
      if (!session?.user?.id) return;
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) console.error(error);
  };

  const saveProfile = async (newProfile: UserProfile) => {
      setProfile(newProfile);
      if (!session?.user?.id) return;

      await supabase.from('profiles').update({
          full_name: newProfile.name,
      }).eq('id', session.user.id);
  };

  // Check local storage for onboarding skip
  useEffect(() => {
      const hasOnboarded = localStorage.getItem('redline_onboarded');
      if (hasOnboarded === 'true') {
          setShowLanding(false);
          const demoMode = localStorage.getItem('redline_demo_mode') === 'true';
          setIsDemoMode(demoMode);
      }
  }, []);

  // Load Data
  useEffect(() => {
    if (!session?.user?.id) return;

    const loadData = async () => {
      try {
        const userId = session.user.id;

        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
        const { data: gearData } = await supabase.from('gear').select('*').eq('user_id', userId);
        const { data: activitiesData } = await supabase.from('activities').select('*').eq('user_id', userId).order('start_time', { ascending: false });

        const mappedRuns = (activitiesData || []).map((a: any) => ({
          id: a.id,
          date: a.start_time,
          distance: a.distance_km,
          time: new Date(a.moving_time * 1000).toISOString().substr(11, 8),
          pace: '',
          notes: a.description,
          shoeId: a.gear_id,
          type: a.activity_type
        }));

        const mappedShoes = (gearData || []).map((g: any) => ({
          id: g.id,
          name: g.name,
          brand: g.brand || '',
          model: g.model || '',
          distance: g.total_mileage,
          isRetired: g.retired
        }));

        setRuns(mappedRuns);

        const newProfile = {
           name: profileData?.full_name || profileData?.username || 'User',
           height: 0, weight: 0, age: 0, sex: '', shoeModel: '',
           shoes: mappedShoes,
           preferredUnits: 'km' as any
        };
        setProfile(newProfile);

        setShowLanding(false);
      } catch (err) {
        console.error('Error loading data from Supabase:', err);
      }
    };

    loadData();
  }, [session]);
  const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      localStorage.setItem('redline_theme', newTheme);
      if (newTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  };

  // --- Onboarding Handlers ---

  const completeOnboarding = (newProfile: UserProfile, initialRuns: Run[]) => {
      saveProfile(newProfile); localStorage.setItem('redline_runs', JSON.stringify(initialRuns)); setRuns(initialRuns);
      setRuns(initialRuns);
      localStorage.setItem('redline_onboarded', 'true');
      setShowLanding(false);
  };

  const handleLogin = (name: string, email: string) => {
      // For prototype, we just create a local profile
      const newProfile = { ...profile, name: name };
      completeOnboarding(newProfile, []); // Start with empty runs for logged in user unless we pull from cloud later
  };

  const handleGuest = (useDemoData: boolean) => {
      let initialRuns: Run[] = [];
      let initialShoes: Shoe[] = [];

      if (useDemoData) {
          initialRuns = generateDemoRuns();
          // DEMO_SHOES are imported from constants
          // We need to calc their initial distance based on the demo runs immediately
          initialShoes = calculateShoeMileage(DEMO_SHOES, initialRuns);
          localStorage.setItem('redline_demo_mode', 'true');
          setIsDemoMode(true);
      } else {
          localStorage.removeItem('redline_demo_mode');
          setIsDemoMode(false);
      }

      const newProfile = { 
          ...profile, 
          name: 'Guest Runner',
          shoes: initialShoes
      };

      completeOnboarding(newProfile, initialRuns);
  };



  const handleStartRun = () => setRunState('active');
  const handleFinishRun = (data: any) => {
    setCurrentRunData(data);
    setRunState('summary');
  };
  const handleCancelRun = () => {
    setRunState('idle');
    setCurrentRunData(null);
  };
  const handleSaveRun = (runDetails: any) => {
    const newRun = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      distance: runDetails.distance,
      duration: runDetails.duration,
      type: 'Easy' as any,
      avgHr: 0,
      pace: runDetails.pace,
      rpe: runDetails.rpe,
      notes: runDetails.notes,
      source: 'Manual' as any,
      splits: runDetails.splits,
      positions: runDetails.positions
    };
    handleAddRun(newRun);
    setRunState('idle');
    setCurrentRunData(null);
  };


  const handleAddGoal = (goal: Goal) => saveGoals([...goals, goal]);
  const handleDeleteGoal = (id: string) => saveGoals(goals.filter(g => g.id !== id));
  
  const handleAddRace = (race: Race) => saveRaces([...races, race]);
  const handleUpdateRace = (updatedRace: Race) => saveRaces(races.map(r => r.id === updatedRace.id ? updatedRace : r));
  const handleDeleteRace = (id: string) => saveRaces(races.filter(r => r.id !== id));

  const handleAddShoe = (shoe: Shoe) => {
      const updatedShoes = [...(profile.shoes || []), shoe];
      saveProfile({ ...profile, shoes: updatedShoes });
  };

  const handleReset = () => {
      if (window.confirm("Are you sure you want to reset all data? This cannot be undone.")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const handleExitDemo = () => {
      localStorage.clear();
      window.location.reload();
  };


  if (runState === 'active') {
    return <ActiveRun onFinish={handleFinishRun} onCancel={handleCancelRun} unit={profile.preferredUnits || "km"} />;
  }

  if (runState === 'summary' && currentRunData) {
    return <PostRunSummary runData={currentRunData} onSave={handleSaveRun} onDiscard={handleCancelRun} unit={profile.preferredUnits || "km"} />;
  }


  if (authChecking) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Loading App Auth... If you see this, Supabase might not be connected correctly.</div>;
  }

  if (!session && !showLanding && !isDemoMode) {
    return <Auth onSuccess={() => {}} />;
  }

  if (showLanding) {
      return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return (
    <div className={`min-h-screen bg-surface transition-colors duration-300 pt-safe ${theme === 'dark' ? 'dark' : ''}`}>
        {/* Demo Banner */}
        {isDemoMode && (
            <div className="bg-orange-500 text-white text-sm font-bold px-4 py-2 flex items-center justify-center gap-4 relative z-[60] shadow-sm">
               <div className="flex items-center gap-2">
                   <AlertTriangle size={16} fill="currentColor" className="text-orange-700" /> 
                   <span>Demo Mode Active</span>
               </div>
               <div className="w-[1px] h-4 bg-white/20"></div>
               <button onClick={handleExitDemo} className="underline hover:text-orange-100 transition-colors">
                   Exit & Clear Data
               </button>
            </div>
        )}

        <div className="flex min-h-screen w-full relative">
            {/* Sidebar (Desktop) */}
            <aside className={`hidden md:flex flex-col w-64 fixed inset-y-0 left-0 p-6 border-r border-outline-variant/10 bg-surface/50 backdrop-blur-xl z-10 transition-[top] duration-300 ${isDemoMode ? 'top-[38px]' : 'top-0'}`}>
                <div className="flex items-center gap-3 px-4 mb-10">
                    <div className="w-10 h-10 bg-[#090909] rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <RedLineLogo className="w-6 h-6 text-[#D32F2F]" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tighter text-surface-on"><span className="text-primary">Red</span>Line</h1>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavButton tab="dashboard" activeTab={activeTab} icon={LayoutDashboard} label="Dashboard" onClick={setActiveTab} />
                    <NavButton tab="feed" activeTab={activeTab} icon={Users} label="Community" onClick={setActiveTab} />
                    <NavButton tab="log" activeTab={activeTab} icon={CalendarRange} label="Training Log" onClick={setActiveTab} />
                    <NavButton tab="coach" activeTab={activeTab} icon={Sparkles} label="Coach" onClick={setActiveTab} />
                    <NavButton tab="race" activeTab={activeTab} icon={FlagTriangleRight} label="Race Prep" onClick={setActiveTab} />
                </nav>

                <div 
                    onClick={() => setActiveTab('profile')}
                    className="p-4 bg-surface-container-high rounded-2xl mt-auto cursor-pointer hover:bg-surface-container-highest transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center text-tertiary-on-container font-bold text-xs group-hover:scale-110 transition-transform">
                             {profile.name ? profile.name.charAt(0).toUpperCase() : 'G'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-surface-on truncate">{profile.name || 'Guest Runner'}</p>
                            <p className="text-[10px] text-surface-on-variant truncate group-hover:text-primary transition-colors">View Profile</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-6 pb-32 md:pb-8 w-full overflow-x-hidden">
                <div className="w-full px-4 md:px-8">
                    {activeTab === 'dashboard' && (
                        <Dashboard 
                            onStartRun={handleStartRun}
                            runs={runs} 
                            goals={goals} 
                            profile={profile} 
                            onAddGoal={handleAddGoal} 
                            onDeleteGoal={handleDeleteGoal}
                            onNavigate={setActiveTab}
                        />
                    )}
                    {activeTab === 'feed' && <CommunityFeed />}
        {activeTab === 'log' && (
                        <RunLog 
                            runs={runs} 
                            onAddRun={handleAddRun} 
                            onAddRuns={handleAddRuns}
                            onUpdateRun={handleUpdateRun} 
                            onDeleteRun={handleDeleteRun}
                            onAddShoe={handleAddShoe}
                            profile={profile}
                        />
                    )}
                    {activeTab === 'coach' && (
                        <CoachInsights runs={runs} profile={profile} />
                    )}
                    {activeTab === 'race' && (
                        <RacePrep 
                            races={races}
                            runs={runs}
                            profile={profile}
                            onAddRace={handleAddRace}
                            onUpdateRace={handleUpdateRace}
                            onDeleteRace={handleDeleteRace}
                        />
                    )}
                    {activeTab === 'profile' && (
                        <Profile 
                            profile={profile} 
                            onSaveProfile={saveProfile} 
                            onReset={handleReset} 
                            theme={theme}
                            toggleTheme={toggleTheme}
                        />
                    )}
                </div>
            </main>

            {/* Floating Bottom Nav (Mobile) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 p-4 pb-safe z-50 flex justify-center pointer-events-none">
                 <div className="bg-surface-container/90 backdrop-blur-xl border border-outline-variant/10 p-2 flex justify-between items-center rounded-[24px] shadow-2xl shadow-black/20 w-full max-w-md pointer-events-auto">
                     <NavButton tab="dashboard" activeTab={activeTab} icon={LayoutDashboard} label="Home" onClick={setActiveTab} mobile />
                     <NavButton tab="feed" activeTab={activeTab} icon={Users} label="Social" onClick={setActiveTab} mobile />
                     <NavButton tab="log" activeTab={activeTab} icon={CalendarRange} label="Log" onClick={setActiveTab} mobile />
                     <NavButton tab="coach" activeTab={activeTab} icon={Sparkles} label="Coach" onClick={setActiveTab} mobile />
                     <NavButton tab="race" activeTab={activeTab} icon={FlagTriangleRight} label="Race" onClick={setActiveTab} mobile />
                     <NavButton tab="profile" activeTab={activeTab} icon={User} label="Profile" onClick={setActiveTab} mobile />
                 </div>
            </nav>
        </div>
    </div>
  );
};

export default App;
