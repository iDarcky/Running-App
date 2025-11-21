
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
  
  // Load runs, goals, and profile from local storage or init
  useEffect(() => {
    const savedRuns = localStorage.getItem('stride_runs');
    const savedGoals = localStorage.getItem('stride_goals');
    const savedProfile = localStorage.getItem('stride_profile');
    
    if (savedRuns) {
      setRuns(JSON.parse(savedRuns));
    }

    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }

    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }

    // Check for Strava OAuth Code to redirect to log tab
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code')) {
        setActiveTab('log');
    }

    // Listen for updates from other tabs/popups
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'stride_runs' && e.newValue) {
            setRuns(JSON.parse(e.newValue));
        }
        if (e.key === 'stride_goals' && e.newValue) {
            setGoals(JSON.parse(e.newValue));
        }
        if (e.key === 'stride_profile' && e.newValue) {
            setProfile(JSON.parse(e.newValue));
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
    saveRuns([run, ...runs]);
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

  const NavButton = ({ tab, icon: Icon, label, mobile = false }: { tab: typeof activeTab, icon: any, label: string, mobile?: boolean }) => (
    <button 
        onClick={() => setActiveTab(tab)}
        className={`
            flex items-center gap-2 rounded-lg font-medium transition-all
            ${mobile 
                ? 'flex-col justify-center p-2 text-[10px]' 
                : 'px-3 py-2 text-sm'
            }
            ${activeTab === tab 
                ? 'text-brand-400 ' + (mobile ? '' : 'bg-brand-500/10') 
                : 'text-slate-400 hover:text-white'
            }
        `}
    >
        <Icon size={mobile ? 22 : 18} className={activeTab === tab && mobile ? 'text-brand-400 drop-shadow-[0_0_8px_rgba(90,79,207,0.5)]' : ''} />
        <span className={mobile ? '' : 'hidden sm:inline'}>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-brand-500/30 pb-24 md:pb-0">
      {/* Desktop Navigation Bar */}
      <nav className="hidden md:block bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-brand-500 p-2 rounded-lg">
                <Activity size={24} className="text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-brand-200 bg-clip-text text-transparent">
                StrideAI
              </span>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-4">
                <NavButton tab="dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavButton tab="log" icon={List} label="Logs" />
                <NavButton tab="coach" icon={BrainCircuit} label="AI Coach" />
                <NavButton tab="profile" icon={User} label="Profile" />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header (Logo Only) */}
      <div className="md:hidden bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-4 h-14 flex items-center justify-center">
         <span className="text-lg font-bold text-white flex items-center gap-2">
            <Activity size={20} className="text-brand-500" /> StrideAI
         </span>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {activeTab === 'dashboard' && (
            <Dashboard 
                runs={runs} 
                goals={goals} 
                profile={profile}
                onAddGoal={handleAddGoal} 
                onDeleteGoal={handleDeleteGoal} 
            />
        )}
        {activeTab === 'log' && (
            <RunLog 
                runs={runs} 
                onAddRun={handleAddRun} 
                onDeleteRun={handleDeleteRun} 
            />
        )}
        {activeTab === 'coach' && (
            <CoachInsights runs={runs} profile={profile} />
        )}
        {activeTab === 'profile' && (
            <Profile profile={profile} onSaveProfile={saveProfile} />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
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
