import React, { useState, useEffect } from 'react';
import { Run, Goal, UserProfile } from './types';
import { SAMPLE_RUNS, SAMPLE_GOALS } from './constants';
import Dashboard from './components/Dashboard';
import RunLog from './components/RunLog';
import CoachInsights from './components/CoachInsights';
import Profile from './components/Profile';
import { LayoutDashboard, List, BrainCircuit, Activity, User } from 'lucide-react';

const App: React.FC = () => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    height: 0,
    weight: 0,
    age: 0,
    sex: '',
    shoeModel: ''
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'log' | 'coach' | 'profile'>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('stride_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  // Apply Theme Class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#141218');
    } else {
      root.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#FEF7FF');
    }
    localStorage.setItem('stride_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Load runs, goals, and profile
  useEffect(() => {
    const savedRuns = localStorage.getItem('stride_runs');
    const savedGoals = localStorage.getItem('stride_goals');
    const savedProfile = localStorage.getItem('stride_profile');
    
    if (savedRuns) setRuns(JSON.parse(savedRuns));
    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedProfile) setProfile(JSON.parse(savedProfile));

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code')) {
        setActiveTab('log');
    }

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'stride_runs' && e.newValue) setRuns(JSON.parse(e.newValue));
        if (e.key === 'stride_goals' && e.newValue) setGoals(JSON.parse(e.newValue));
        if (e.key === 'stride_profile' && e.newValue) setProfile(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const saveRuns = (newRuns: Run[]) => {
    setRuns(newRuns);
    localStorage.setItem('stride_runs', JSON.stringify(newRuns));
  };

  const saveGoals = (newGoals: Goal[]) => {
    setGoals(newGoals);
    localStorage.setItem('stride_goals', JSON.stringify(newGoals));
  }

  const saveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('stride_profile', JSON.stringify(newProfile));
  }

  const handleAddRun = (run: Run) => {
    const newRuns = [run, ...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    saveRuns(newRuns);
  };

  const handleUpdateRun = (updatedRun: Run) => {
    const updatedRuns = runs.map(r => r.id === updatedRun.id ? updatedRun : r).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    saveRuns(updatedRuns);
  };

  const handleAddRuns = (newRunsData: Run[]) => {
    const currentIds = new Set(runs.map(r => r.id));
    const uniqueNewRuns = newRunsData.filter(r => !currentIds.has(r.id));
    if (uniqueNewRuns.length > 0) {
        const updatedRuns = [...uniqueNewRuns, ...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        saveRuns(updatedRuns);
    }
  };

  const handleDeleteRun = (id: string) => {
    saveRuns(runs.filter(r => r.id !== id));
  };

  const handleAddGoal = (goal: Goal) => {
      saveGoals([...goals, goal]);
  }

  const handleDeleteGoal = (id: string) => {
      saveGoals(goals.filter(g => g.id !== id));
  }

  const handleResetApp = () => {
      if (window.confirm("WARNING: This will delete ALL your data. Are you sure?")) {
          localStorage.clear();
          window.location.href = '/';
      }
  };

  const NavButton = ({ tab, icon: Icon, label, mobile = false }: { tab: typeof activeTab, icon: any, label: string, mobile?: boolean }) => {
    const isActive = activeTab === tab;
    return (
        <button 
            onClick={() => setActiveTab(tab)}
            className={`
                flex items-center gap-2 transition-all duration-300 group
                ${mobile 
                    ? 'flex-col justify-center gap-1 w-full py-3' 
                    : 'px-6 py-3 rounded-full'
                }
                ${isActive && !mobile ? 'bg-secondary-container text-secondary-on-container font-bold' : ''}
                ${!isActive && !mobile ? 'text-surface-on-variant hover:bg-surface-container-high' : ''}
            `}
        >
            <div className={`
                flex items-center justify-center rounded-full transition-all
                ${mobile ? (isActive ? 'bg-secondary-container text-secondary-on-container w-16 h-8' : 'text-surface-on-variant w-16 h-8') : ''}
            `}>
                 <Icon size={mobile ? 20 : 24} className={isActive && !mobile ? 'fill-current' : ''} />
            </div>
            <span className={`
                text-sm font-medium
                ${mobile ? (isActive ? 'text-surface-on font-bold' : 'text-surface-on-variant') : ''}
            `}>{label}</span>
        </button>
    );
  };

  return (
    <div className="min-h-screen bg-surface text-surface-on font-sans pb-24 md:pb-0 transition-colors duration-300">
      {/* Desktop Navigation Bar - Material 3 Top Bar style */}
      <nav className="hidden md:block bg-surface-container-low sticky top-0 z-50 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="bg-primary-container text-primary-on-container p-2.5 rounded-xl">
                <Activity size={24} className="fill-current" />
              </div>
              <span className="text-2xl font-bold text-surface-on tracking-tight">
                StrideAI
              </span>
            </div>
            
            <div className="flex items-center gap-2 bg-surface p-1 rounded-full shadow-sm border border-outline-variant/20">
                <NavButton tab="dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavButton tab="log" icon={List} label="Logs" />
                <NavButton tab="coach" icon={BrainCircuit} label="Coach" />
                <NavButton tab="profile" icon={User} label="Profile" />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header (Small Top Bar) */}
      <div className="md:hidden bg-surface-container-low sticky top-0 z-40 px-4 h-16 flex items-center justify-between shadow-sm transition-colors duration-300">
         <span className="text-xl font-bold text-surface-on flex items-center gap-3">
            <div className="bg-primary-container text-primary-on-container p-1.5 rounded-lg">
                <Activity size={20} className="fill-current" />
            </div>
            StrideAI
         </span>
         <div className="w-8 h-8 rounded-full bg-tertiary-container text-tertiary-on-container flex items-center justify-center font-bold text-sm">
             {profile.name ? profile.name.charAt(0).toUpperCase() : 'G'}
         </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
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
        {activeTab === 'profile' && (
            <Profile 
                profile={profile} 
                onSaveProfile={saveProfile} 
                onReset={handleResetApp} 
                theme={theme}
                toggleTheme={toggleTheme}
            />
        )}
      </main>

      {/* Mobile Bottom Navigation - Material 3 Style */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container z-50 pb-safe border-t border-outline-variant/20">
        <div className="flex justify-around items-center h-20 px-2">
            <NavButton tab="dashboard" icon={LayoutDashboard} label="Dash" mobile />
            <NavButton tab="log" icon={List} label="Logs" mobile />
            <NavButton tab="coach" icon={BrainCircuit} label="Coach" mobile />
            <NavButton tab="profile" icon={User} label="Profile" mobile />
        </div>
      </div>
    </div>
  );
};

export default App;