
import React, { useState, useEffect } from 'react';
import { Run, Goal, UserProfile, Race } from './types';
import { SAMPLE_RUNS, SAMPLE_GOALS } from './constants';
import Dashboard from './components/Dashboard';
import RunLog from './components/RunLog';
import CoachInsights from './components/CoachInsights';
import RacePrep from './components/RacePrep';
import Profile from './components/Profile';
import { LayoutGrid, CalendarDays, Bot, Activity, User, Trophy } from 'lucide-react';

// Moved outside App to prevent re-creation on every render
const NavButton = ({ tab, activeTab, icon: Icon, label, onClick, mobile = false }: { tab: string, activeTab: string, icon: any, label: string, onClick: (t: any) => void, mobile?: boolean }) => {
    const isActive = activeTab === tab;
    return (
        <button 
            onClick={() => onClick(tab)}
            className={`
                flex items-center transition-all duration-300 group relative
                ${mobile 
                    ? `justify-center flex-col h-16 w-full rounded-2xl ${isActive ? 'text-primary' : 'text-surface-on-variant/60 hover:text-surface-on-variant'}` 
                    : `justify-start gap-3 w-full px-4 py-3 rounded-full mb-2 ${isActive ? 'bg-primary text-primary-on shadow-lg shadow-primary/25 font-bold' : 'text-surface-on-variant hover:bg-surface-container-highest hover:text-surface-on'}`
                }
            `}
        >
            <div className={`transition-transform duration-300 ${isActive && !mobile ? 'scale-110' : ''} ${mobile && isActive ? '-translate-y-4' : ''}`}>
                <Icon size={mobile ? 24 : 20} className={isActive ? 'fill-current' : ''} strokeWidth={mobile && isActive ? 2.5 : 2} />
            </div>
            
            {!mobile && <span>{label}</span>}
            {mobile && (
                <span className={`text-[10px] font-bold transition-all duration-300 absolute bottom-2 leading-none ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    {label}
                </span>
            )}
            
            {!mobile && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
            {mobile && isActive && <div className="absolute top-1.5 w-1 h-1 rounded-full bg-primary"></div>}
        </button>
    );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'log' | 'coach' | 'race' | 'profile'>('dashboard');
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
      const savedRuns = localStorage.getItem('stride_runs');
      const savedGoals = localStorage.getItem('stride_goals');
      const savedRaces = localStorage.getItem('stride_races');
      const savedProfile = localStorage.getItem('stride_profile');
      const savedTheme = localStorage.getItem('stride_theme');

      if (savedRuns) {
          try {
              const parsedRuns = JSON.parse(savedRuns);
              setRuns(parsedRuns);
          } catch(e) { console.error("Error parsing runs", e); setRuns(SAMPLE_RUNS); }
      } else {
          setRuns(SAMPLE_RUNS);
      }

      if (savedGoals) {
          try { setGoals(JSON.parse(savedGoals)); } catch(e) { setGoals(SAMPLE_GOALS); }
      } else {
          setGoals(SAMPLE_GOALS);
      }
      
      if (savedRaces) {
          try { setRaces(JSON.parse(savedRaces)); } catch(e) { setRaces([]); }
      }

      if (savedProfile) {
          try { setProfile(JSON.parse(savedProfile)); } catch(e) {}
      }

      if (savedTheme === 'dark') {
          setTheme('dark');
          document.documentElement.classList.add('dark');
      }
    };
    loadData();
  }, []);

  // Save Data Helpers
  const saveRuns = (newRuns: Run[]) => {
      setRuns(newRuns);
      localStorage.setItem('stride_runs', JSON.stringify(newRuns));
  };

  const saveGoals = (newGoals: Goal[]) => {
      setGoals(newGoals);
      localStorage.setItem('stride_goals', JSON.stringify(newGoals));
  };
  
  const saveRaces = (newRaces: Race[]) => {
      setRaces(newRaces);
      localStorage.setItem('stride_races', JSON.stringify(newRaces));
  };

  const saveProfile = (newProfile: UserProfile) => {
      setProfile(newProfile);
      localStorage.setItem('stride_profile', JSON.stringify(newProfile));
  };

  const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      localStorage.setItem('stride_theme', newTheme);
      if (newTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  };

  // Handlers
  const handleAddRun = (run: Run) => saveRuns([run, ...runs]);
  const handleAddRuns = (newRuns: Run[]) => {
      // Avoid duplicates by ID
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

  const handleReset = () => {
      if (window.confirm("Are you sure you want to reset all data? This cannot be undone.")) {
          localStorage.clear();
          setRuns(SAMPLE_RUNS);
          setGoals(SAMPLE_GOALS);
          setRaces([]);
          setProfile({ name: '', height: 0, weight: 0, age: 0, sex: '', shoeModel: '', shoes: [] });
          setActiveTab('dashboard');
          window.location.reload();
      }
  };

  return (
    <div className={`min-h-screen bg-surface transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="flex min-h-screen w-full relative">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 p-6 border-r border-outline-variant/10 bg-surface/50 backdrop-blur-xl z-10">
                <div className="flex items-center gap-3 px-4 mb-10">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                        <Activity className="text-primary-on" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tighter text-surface-on"><span className="text-primary">Red</span>Line</h1>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavButton tab="dashboard" activeTab={activeTab} icon={LayoutGrid} label="Dashboard" onClick={setActiveTab} />
                    <NavButton tab="log" activeTab={activeTab} icon={CalendarDays} label="Training Log" onClick={setActiveTab} />
                    <NavButton tab="coach" activeTab={activeTab} icon={Bot} label="Coach" onClick={setActiveTab} />
                    <NavButton tab="race" activeTab={activeTab} icon={Trophy} label="Race Prep" onClick={setActiveTab} />
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

            {/* Floating Bottom Nav (Mobile) - Updated for Safe Area support */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 p-4 pb-safe z-50 flex justify-center pointer-events-none">
                 <div className="bg-surface-container/90 backdrop-blur-xl border border-outline-variant/10 p-2 flex justify-between items-center rounded-[24px] shadow-2xl shadow-black/20 w-full max-w-md pointer-events-auto">
                     <NavButton tab="dashboard" activeTab={activeTab} icon={LayoutGrid} label="Home" onClick={setActiveTab} mobile />
                     <NavButton tab="log" activeTab={activeTab} icon={CalendarDays} label="Log" onClick={setActiveTab} mobile />
                     <NavButton tab="coach" activeTab={activeTab} icon={Bot} label="Coach" onClick={setActiveTab} mobile />
                     <NavButton tab="race" activeTab={activeTab} icon={Trophy} label="Race" onClick={setActiveTab} mobile />
                     <NavButton tab="profile" activeTab={activeTab} icon={User} label="Profile" onClick={setActiveTab} mobile />
                 </div>
            </nav>
        </div>
    </div>
  );
};

export default App;
