
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
    } else {
        // Init with sample data if empty
        setRuns(SAMPLE_RUNS);
        localStorage.setItem('stride_runs', JSON.stringify(SAMPLE_RUNS));
    }

    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    } else {
        setGoals(SAMPLE_GOALS);
        localStorage.setItem('stride_goals', JSON.stringify(SAMPLE_GOALS));
    }

    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-brand-500/30">
      {/* Navigation Bar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
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
                <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-brand-500/10 text-brand-400' : 'text-slate-400 hover:text-white'}`}
                >
                    <LayoutDashboard size={18} />
                    <span className="hidden sm:inline">Dashboard</span>
                </button>
                 <button 
                    onClick={() => setActiveTab('log')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'log' ? 'bg-brand-500/10 text-brand-400' : 'text-slate-400 hover:text-white'}`}
                >
                    <List size={18} />
                    <span className="hidden sm:inline">Logs</span>
                </button>
                 <button 
                    onClick={() => setActiveTab('coach')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'coach' ? 'bg-brand-500/10 text-brand-400' : 'text-slate-400 hover:text-white'}`}
                >
                    <BrainCircuit size={18} />
                    <span className="hidden sm:inline">AI Coach</span>
                </button>
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-brand-500/10 text-brand-400' : 'text-slate-400 hover:text-white'}`}
                >
                    <User size={18} />
                    <span className="hidden sm:inline">Profile</span>
                </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    </div>
  );
};

export default App;
