import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarRange,
  Sparkles,
  FlagTriangleRight,
  User,
  AlertTriangle,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Button, Avatar, Chip, Tooltip } from '@heroui/react';
import { Run, Goal, UserProfile, Shoe, Race } from '../types';
import Dashboard from './Dashboard';
import RunLog from './RunLog';
import CoachInsights from './CoachInsights';
import RacePrep from './RacePrep';
import Profile from './Profile';
import LandingPage from './LandingPage';
import { RedLineBrand } from './Logo';
import NavButton from './NavButton';
import { RunTrackingFAB } from './RunTracking';

const SAMPLE_RUNS: Run[] = [
  { id: '1', date: '2024-03-20', distance: 12.5, duration: 62, type: 'Long Run', avgHr: 145, pace: '4:58', rpe: 6, location: 'Hyde Park', source: 'Garmin' },
  { id: '2', date: '2024-03-18', distance: 8.2, duration: 41, type: 'Easy', avgHr: 138, pace: '5:00', rpe: 4, location: 'Thames Path', source: 'Strava' },
  { id: '3', date: '2024-03-16', distance: 10.1, duration: 48, type: 'Tempo', avgHr: 162, pace: '4:45', rpe: 8, location: 'Battersea Park', source: 'Apple Health' },
];

const DEMO_SHOES: Shoe[] = [
    { id: 's1', brand: 'Nike', model: 'Vaporfly 3', nickname: 'Race Day', distance: 120, maxDistance: 400, isRetired: false, isDefault: false },
    { id: 's2', brand: 'Saucony', model: 'Endorphin Speed 3', distance: 450, maxDistance: 800, isRetired: false, isDefault: true },
    { id: 's3', brand: 'Asics', model: 'Novablast 4', distance: 85, maxDistance: 800, isRetired: false, isDefault: false }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [runs, setRuns] = useState<Run[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
      name: '',
      height: 180,
      weight: 75,
      age: 30,
      sex: 'Male',
      shoeModel: '',
      shoes: []
  });
  const [showLanding, setShowLanding] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const loadData = () => {
      const savedRuns = localStorage.getItem('redline_runs');
      const savedGoals = localStorage.getItem('redline_goals');
      const savedProfile = localStorage.getItem('redline_profile');
      const savedRaces = localStorage.getItem('redline_races');
      const onboarded = localStorage.getItem('redline_onboarded');
      const savedTheme = localStorage.getItem('redline_theme');
      const demoMode = localStorage.getItem('redline_demo_mode');

      if (onboarded === 'true') setShowLanding(false);
      if (demoMode === 'true') setIsDemoMode(true);
      if (savedRuns) setRuns(JSON.parse(savedRuns));
      if (savedGoals) setGoals(JSON.parse(savedGoals));
      if (savedRaces) setRaces(JSON.parse(savedRaces));
      
      const loadedProfile = savedProfile ? JSON.parse(savedProfile) : {
          name: '',
          height: 180,
          weight: 75,
          age: 30,
          sex: 'Male',
          shoeModel: '',
          shoes: []
      };
      
      setProfile(loadedProfile);

      if (savedTheme === 'dark') {
          setTheme('dark');
          document.documentElement.classList.add('dark');
      }
    };
    loadData();
  }, []);

  const calculateShoeMileage = (shoes: Shoe[], currentRuns: Run[]): Shoe[] => {
      return shoes.map(shoe => {
          const distance = currentRuns
            .filter(r => r.shoeId === shoe.id)
            .reduce((acc, r) => acc + r.distance, 0);
          return { ...shoe, distance };
      });
  };

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

  const handleLogin = (name: string, email: string) => {
      const newProfile = { ...profile, name: name };
      saveProfile(newProfile);
      localStorage.setItem('redline_onboarded', 'true');
      setShowLanding(false);
  };

  const handleGuest = (useDemoData: boolean) => {
      let initialRuns: Run[] = [];
      let initialShoes: Shoe[] = [];

      if (useDemoData) {
          initialRuns = SAMPLE_RUNS;
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

      saveProfile(newProfile);
      saveRuns(initialRuns);
      localStorage.setItem('redline_onboarded', 'true');
      setShowLanding(false);
  };

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
    <div className={`min-h-screen bg-background transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
        {isDemoMode && (
            <div className="bg-primary text-white text-[10px] font-bold px-4 py-1.5 flex items-center justify-center gap-4 relative z-[60] tracking-widest uppercase">
               <div className="flex items-center gap-2">
                   <AlertTriangle size={12} fill="currentColor" />
                   <span>Demo Mode</span>
               </div>
               <button onClick={handleExitDemo} className="underline hover:text-white/80 transition-colors">
                   Exit
               </button>
            </div>
        )}

        <div className="flex min-h-screen w-full relative">
            {/* Sidebar (Desktop) */}
            <aside className={`hidden md:flex flex-col w-64 fixed inset-y-0 left-0 p-6 border-r border-accents-2 bg-background z-10 ${isDemoMode ? 'top-[28px]' : 'top-0'}`}>
                <div className="mb-8 px-2">
                    <RedLineBrand />
                </div>

                <nav className="flex-1 space-y-1">
                    <NavButton tab="dashboard" activeTab={activeTab} icon={LayoutDashboard} label="Dashboard" onClick={setActiveTab} />
                    <NavButton tab="log" activeTab={activeTab} icon={CalendarRange} label="Training Log" onClick={setActiveTab} />
                    <NavButton tab="coach" activeTab={activeTab} icon={Sparkles} label="Coach" onClick={setActiveTab} />
                    <NavButton tab="race" activeTab={activeTab} icon={FlagTriangleRight} label="Race Prep" onClick={setActiveTab} />
                </nav>

                <div 
                    onClick={() => setActiveTab('profile')}
                    className="p-3 bg-accents-1 rounded-lg mt-auto cursor-pointer hover:bg-accents-2 transition-colors group flex items-center gap-3 border border-transparent hover:border-accents-2"
                >
                    <Avatar
                        name={profile.name || 'G'}
                        size="sm"
                        className="bg-foreground text-background font-bold"
                    />
                    <div className="overflow-hidden flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{profile.name || 'Guest Runner'}</p>
                        <p className="text-[10px] text-accents-5 uppercase tracking-wider font-medium">Settings</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-10 pt-6 pb-32 md:pb-10 w-full overflow-x-hidden">
                <div className="max-w-6xl mx-auto">
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

            <RunTrackingFAB onRunComplete={handleAddRun} />

            {/* Bottom Nav (Mobile) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-accents-2 z-50 flex items-center justify-around px-2 pb-safe shadow-[0_-1px_0_rgba(0,0,0,0.05)]">
                 <NavButton tab="dashboard" activeTab={activeTab} icon={LayoutDashboard} label="Home" onClick={setActiveTab} mobile />
                 <NavButton tab="log" activeTab={activeTab} icon={CalendarRange} label="Log" onClick={setActiveTab} mobile />
                 <NavButton tab="coach" activeTab={activeTab} icon={Sparkles} label="Coach" onClick={setActiveTab} mobile />
                 <NavButton tab="race" activeTab={activeTab} icon={FlagTriangleRight} label="Race" onClick={setActiveTab} mobile />
                 <NavButton tab="profile" activeTab={activeTab} icon={User} label="Profile" onClick={setActiveTab} mobile />
            </nav>
        </div>
    </div>
  );
};

export default App;
