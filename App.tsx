
import React, { useState, useEffect } from 'react';
import { Run, Goal, UserProfile, Race, Shoe } from './types';
import { SAMPLE_GOALS, DEMO_SHOES, generateDemoRuns } from './constants';
import Dashboard from './components/Dashboard';
import RunLog from './components/RunLog';
import CoachInsights from './components/CoachInsights';
import RacePrep from './components/RacePrep';
import Profile from './components/Profile';
import { LandingPage } from './components/LandingPage';
import { LayoutDashboard, CalendarRange, Sparkles, FlagTriangleRight, User, AlertTriangle } from 'lucide-react';
import { RedLineLogo } from './components/Logo';
import { NavButton } from './components/NavButton';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'log' | 'coach' | 'race' | 'profile'>('dashboard');
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const [runs, setRuns] = useState<Run[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    height: 0,
    weight: 0,
    age: 0,
    sex: '',
    shoeModel: '',
    shoes: []
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load Data
  useEffect(() => {
    const loadData = () => {
      const savedRuns = localStorage.getItem('redline_runs');
      const savedGoals = localStorage.getItem('redline_goals');
      const savedRaces = localStorage.getItem('redline_races');
      const savedProfile = localStorage.getItem('redline_profile');
      const savedTheme = localStorage.getItem('redline_theme');
      const hasOnboarded = localStorage.getItem('redline_onboarded');
      const demoMode = localStorage.getItem('redline_demo_mode') === 'true';

      // If user has onboarded before, skip landing
      if (hasOnboarded === 'true' && savedProfile) {
          setShowLanding(false);
      }
      
      setIsDemoMode(demoMode);

      let loadedRuns: Run[] = [];
      if (savedRuns) {
          try { loadedRuns = JSON.parse(savedRuns); } catch(e) { console.error("Error parsing runs", e); }
      }
      setRuns(loadedRuns);

      if (savedGoals) {
          try { setGoals(JSON.parse(savedGoals)); } catch(e) { setGoals(SAMPLE_GOALS); }
      } else {
          setGoals(SAMPLE_GOALS);
      }
      
      if (savedRaces) {
          try { setRaces(JSON.parse(savedRaces)); } catch(e) { setRaces([]); }
      }

      let loadedProfile: UserProfile = { name: '', height: 0, weight: 0, age: 0, sex: '', shoeModel: '', shoes: [] };
      if (savedProfile) {
          try { loadedProfile = JSON.parse(savedProfile); } catch(e) {}
      }

      // Recalculate Shoe Mileage on Load to ensure sync and data integrity
      if (loadedProfile.shoes && loadedProfile.shoes.length > 0) {
          const updatedShoes = calculateShoeMileage(loadedProfile.shoes, loadedRuns);
          loadedProfile.shoes = updatedShoes;
      }
      
      setProfile(loadedProfile);

      if (savedTheme === 'dark') {
          setTheme('dark');
          document.documentElement.classList.add('dark');
      }
    };
    loadData();
  }, []);

  // --- Save Logic ---
  const saveRuns = (newRuns: Run[]) => {
      setRuns(newRuns);
      localStorage.setItem('redline_runs', JSON.stringify(newRuns));
      if (profile.shoes && profile.shoes.length > 0) {
          const updatedShoes = calculateShoeMileage(profile.shoes, newRuns);
          const newProfile = { ...profile, shoes: updatedShoes };
          setProfile(newProfile);
          localStorage.setItem('redline_profile', JSON.stringify(newProfile));
      }
  };

  const saveGoals = (newGoals: Goal[]) => {
      setGoals(newGoals);
      localStorage.setItem('redline_goals', JSON.stringify(newGoals));
  };
  
  const saveRaces = (newRaces: Race[]) => {
      setRaces(newRaces);
      localStorage.setItem('redline_races', JSON.stringify(newRaces));
  };

  const saveProfile = (newProfile: UserProfile) => {
      if (newProfile.shoes) {
          newProfile.shoes = calculateShoeMileage(newProfile.shoes, runs);
      }
      setProfile(newProfile);
      localStorage.setItem('redline_profile', JSON.stringify(newProfile));
  };

  const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      localStorage.setItem('redline_theme', newTheme);
      if (newTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  };

  // --- Onboarding Handlers ---

  const completeOnboarding = (newProfile: UserProfile, initialRuns: Run[]) => {
      saveProfile(newProfile);
      saveRuns(initialRuns);
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

  // --- CRUD Handlers ---
  const handleAddRun = (run: Run) => saveRuns([run, ...runs]);
  const handleAddRuns = (newRuns: Run[]) => {
      const existingIds = new Set(runs.map(r => r.id));
      const uniqueNewRuns = newRuns.filter(r => !existingIds.has(r.id));
      saveRuns([...uniqueNewRuns, ...runs]);
  };
  const handleUpdateRun = (updatedRun: Run) => saveRuns(runs.map(r => r.id === updatedRun.id ? updatedRun : r));
  const handleDeleteRun = (id: string) => saveRuns(runs.filter(r => r.id !== id));

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

  if (showLanding) {
      return <LandingPage onLogin={handleLogin} onGuest={handleGuest} />;
  }

  return (
    <div className={`min-h-screen bg-surface transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
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
                            runs={runs} 
                            goals={goals} 
                            profile={profile} 
                            onAddGoal={handleAddGoal} 
                            onDeleteGoal={handleDeleteGoal}
                            onNavigate={setActiveTab}
                        />
                    )}
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
