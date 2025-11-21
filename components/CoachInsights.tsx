import React, { useState, useRef, useEffect } from 'react';
import { Run, InsightResponse, UserProfile } from '../types';
import { analyzeRunningData, chatWithRunCoach } from '../services/geminiService';
import { Sparkles, MessageSquare, Send, RefreshCw, AlertCircle, CheckCircle2, Activity, Ruler, ShieldCheck, TrendingUp } from 'lucide-react';

interface CoachInsightsProps {
  runs: Run[];
  profile?: UserProfile;
}

const CoachInsights: React.FC<CoachInsightsProps> = ({ runs, profile }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [insights, setInsights] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: "Ready to chat about your running metrics and strategy." }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTab]);

  const handleGenerateInsights = async () => {
    if (runs.length < 3) {
      setError("I need at least 3 runs to spot meaningful trends. Please log more activity!");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeRunningData(runs, profile);
      setInsights(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate insights. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const response = await chatWithRunCoach(messages, userMsg, runs, profile);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting to the Coach right now." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Auto-analyze on first load if data exists and not analyzed yet
  useEffect(() => {
    if (runs.length >= 3 && !insights && !loading && activeTab === 'analysis' && !error) {
        // handleGenerateInsights(); // Optional: Uncomment to auto-trigger
    }
  }, [runs]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-auto animate-fade-in">
        
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-surface-on tracking-tight">Performance Lab</h2>
          
          <div className="flex bg-surface-container-high p-1 rounded-full border border-outline-variant/20">
            <button
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'analysis' ? 'bg-primary text-primary-on shadow-md' : 'text-surface-on-variant hover:bg-surface-container-highest'}`}
            >
                <Activity size={16} /> Analysis
            </button>
            <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'bg-primary text-primary-on shadow-md' : 'text-surface-on-variant hover:bg-surface-container-highest'}`}
            >
                <MessageSquare size={16} /> Chat
            </button>
          </div>
      </div>

      {activeTab === 'analysis' && (
        <div className="space-y-6 pb-20">
          {!insights && !loading && (
            <div className="flex flex-col items-center justify-center py-16 bg-surface-container rounded-[32px] border border-dashed border-outline-variant/40">
              <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Sparkles className="text-primary" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-surface-on mb-2">Deep Dive Analysis</h3>
              <p className="text-surface-on-variant max-w-md text-center mb-8">
                Analyze your recent {runs.length} runs to calculate your Form Score, injury risk, and upcoming training focus.
              </p>
              <button 
                onClick={handleGenerateInsights}
                className="bg-primary text-primary-on px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-primary/25 hover:scale-105 flex items-center gap-2"
              >
                <Sparkles size={20} /> Generate Report
              </button>
              {error && (
                <div className="mt-6 text-error flex items-center justify-center gap-2 bg-error-container py-3 px-6 rounded-xl font-medium max-w-md text-center text-sm">
                  <AlertCircle size={18} className="shrink-0" /> {error}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-surface-on-variant font-medium animate-pulse">Crunching the numbers...</p>
            </div>
          )}

          {insights && (
            <div className="space-y-6 animate-slide-down">
               {/* Top Row: Summary & Form Score */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-primary-container text-primary-on-container rounded-[32px] p-8 shadow-sm">
                         <h3 className="text-lg font-bold uppercase opacity-70 tracking-wider mb-2">Fitness Summary</h3>
                         <p className="text-xl leading-relaxed font-medium">{insights.fitnessSummary}</p>
                    </div>
                    
                    <div className="bg-surface-container rounded-[32px] p-8 shadow-sm flex flex-col items-center justify-center relative overflow-hidden border border-outline-variant/20">
                        <h3 className="text-sm font-bold text-surface-on-variant uppercase tracking-wider mb-4">Form Score</h3>
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--md-sys-color-surface-container-highest)" strokeWidth="8" />
                                <circle 
                                    cx="50" cy="50" r="45" fill="none" 
                                    stroke="var(--md-sys-color-primary)" 
                                    strokeWidth="8" 
                                    strokeDasharray="283"
                                    strokeDashoffset={283 - (283 * (insights.formScore || 0) / 100)}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-4xl font-bold text-primary">{insights.formScore || '--'}</span>
                                <span className="text-[10px] font-bold text-primary/60">/ 100</span>
                            </div>
                        </div>
                    </div>
               </div>

               {/* Metrics & Risk */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-surface-container rounded-[24px] p-6 border border-outline-variant/10">
                      <h3 className="text-lg font-bold text-surface-on mb-4 flex items-center gap-2">
                          <div className="bg-secondary-container p-2 rounded-full text-secondary-on-container"><Ruler size={18} /></div>
                          Form Analysis
                      </h3>
                      <p className="text-surface-on-variant leading-relaxed">{insights.formAnalysis}</p>
                  </div>

                  <div className="bg-surface-container rounded-[24px] p-6 border border-outline-variant/10">
                       <h3 className="text-lg font-bold text-surface-on mb-4 flex items-center gap-2">
                          <div className="bg-error-container p-2 rounded-full text-error-on-container"><ShieldCheck size={18} /></div>
                          Injury Risk
                      </h3>
                      <p className="text-surface-on-variant leading-relaxed">{insights.injuryRiskAssessment}</p>
                  </div>
              </div>

              {/* Trends */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.trends.map((trend, i) => (
                  <div key={i} className={`p-5 rounded-2xl border ${
                    trend.type === 'positive' ? 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200' : 
                    trend.type === 'negative' ? 'bg-red-100 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200' : 
                    'bg-surface-container-high border-outline-variant/20 text-surface-on'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {trend.type === 'positive' ? <TrendingUp size={18} /> :
                       trend.type === 'negative' ? <AlertCircle size={18} /> :
                       <Activity size={18} />}
                      <h4 className="font-bold text-sm">{trend.title}</h4>
                    </div>
                    <p className="text-xs opacity-80 font-medium">{trend.description}</p>
                  </div>
                ))}
              </div>

              {/* Focus & Tips */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-surface-container-low border border-outline-variant/20 rounded-[24px] p-6">
                   <h3 className="text-lg font-bold text-surface-on mb-4">Training Focus</h3>
                   <div className="flex items-start gap-4">
                      <div className="bg-tertiary-container p-3 rounded-xl text-tertiary-on-container shrink-0">
                        <TrendingUp size={24} />
                      </div>
                      <p className="text-surface-on-variant font-medium text-lg">{insights.trainingFocus}</p>
                   </div>
                </div>
                <div className="bg-surface-container-low border border-outline-variant/20 rounded-[24px] p-6">
                   <h3 className="text-lg font-bold text-surface-on mb-4">Coach's Tips</h3>
                   <ul className="space-y-4">
                     {insights.actionableTips.map((tip, i) => (
                       <li key={i} className="flex items-start gap-3 text-sm text-surface-on-variant">
                         <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={16} />
                         <span className="font-medium">{tip}</span>
                       </li>
                     ))}
                   </ul>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button 
                  onClick={handleGenerateInsights}
                  className="text-primary hover:text-primary/80 flex items-center gap-2 text-sm font-bold transition-colors bg-primary/5 px-4 py-2 rounded-full"
                >
                  <RefreshCw size={14} /> Refresh Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="flex flex-col h-[600px] bg-surface-container border border-outline-variant/20 rounded-[32px] overflow-hidden shadow-sm">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-5 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-on rounded-tr-sm' 
                    : 'bg-surface-container-high text-surface-on rounded-tl-sm'
                }`}>
                  {msg.role === 'model' && (
                    <div className="flex items-center gap-2 mb-2 opacity-60 text-xs uppercase tracking-wider font-bold">
                      <Sparkles size={12} /> RedLine Coach
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed font-medium">{msg.text}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
               <div className="flex justify-start">
                <div className="bg-surface-container-high p-4 rounded-2xl rounded-tl-sm flex gap-2 items-center">
                   <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                   <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSendMessage} className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your pace, distance, or recovery..."
              className="flex-1 bg-surface-container-highest text-surface-on border-transparent focus:border-primary rounded-full px-6 py-3 focus:outline-none transition-colors font-medium"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || chatLoading}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-on p-3 rounded-full transition-colors shadow-md"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CoachInsights;