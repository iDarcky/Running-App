
import React, { useState, useRef, useEffect } from 'react';
import { Run, InsightResponse, UserProfile } from '../types';
import { analyzeRunningData, chatWithRunCoach } from '../services/geminiService';
import { Sparkles, MessageSquare, Send, RefreshCw, AlertCircle, CheckCircle2, ArrowRight, BrainCircuit, Activity, Ruler, ShieldCheck } from 'lucide-react';

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
    { role: 'model', text: "Hi! I'm Stride, your AI running coach. I've analyzed your data. Ask me anything about your training, race strategy, or injury prevention!" }
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
    } catch (err) {
      setError("Failed to connect to the AI Coach. Please check your API Key configuration.");
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
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble thinking right now. Please try again later." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-auto">
      {/* Tab Switcher */}
      <div className="flex p-1 bg-slate-800 rounded-lg mb-6 w-fit border border-slate-700">
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'analysis' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          <Sparkles size={16} /> Analysis
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          <MessageSquare size={16} /> Coach Chat
        </button>
      </div>

      {activeTab === 'analysis' && (
        <div className="animate-fade-in space-y-6">
          {!insights && !loading && (
            <div className="text-center py-16 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <BrainCircuit className="text-brand-400" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Ready to Analyze</h3>
              <p className="text-slate-400 max-w-md mx-auto mb-6">
                Our AI model will analyze your running history to provide personalized training advice, trend identification, and safety tips.
              </p>
              <button 
                onClick={handleGenerateInsights}
                className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-brand-500/25 flex items-center gap-2 mx-auto"
              >
                <Sparkles size={18} /> Generate Insights
              </button>
              {error && (
                <div className="mt-6 text-rose-400 flex items-center justify-center gap-2 bg-rose-500/10 py-2 px-4 rounded-lg inline-block">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="text-center py-20">
              <div className="animate-spin w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400 animate-pulse">Analyzing your running biomechanics & history...</p>
            </div>
          )}

          {insights && (
            <div className="space-y-6">
               {/* Fitness Summary */}
              <div className="bg-gradient-to-br from-brand-900/50 to-slate-800 border border-brand-500/30 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Activity className="text-brand-400" size={20} /> 
                    Fitness Summary
                </h3>
                <p className="text-slate-300 leading-relaxed">{insights.fitnessSummary}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form Analysis */}
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <Ruler className="text-purple-400" size={20} /> Form Analysis
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed mb-4">{insights.formAnalysis}</p>
                  </div>

                  {/* Injury Risk */}
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                       <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <ShieldCheck className="text-emerald-400" size={20} /> Injury Risk Assessment
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed mb-4">{insights.injuryRiskAssessment}</p>
                  </div>
              </div>

              {/* Trends */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.trends.map((trend, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${
                    trend.type === 'positive' ? 'bg-emerald-500/10 border-emerald-500/20' : 
                    trend.type === 'negative' ? 'bg-rose-500/10 border-rose-500/20' : 
                    'bg-slate-700/30 border-slate-600'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {trend.type === 'positive' ? <TrendingUp className="text-emerald-400" size={18} /> :
                       trend.type === 'negative' ? <AlertCircle className="text-rose-400" size={18} /> :
                       <Activity className="text-slate-400" size={18} />}
                      <h4 className="font-semibold text-white text-sm">{trend.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400">{trend.description}</p>
                  </div>
                ))}
              </div>

              {/* Focus & Tips */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6">
                   <h3 className="text-lg font-semibold text-white mb-4">Training Focus</h3>
                   <div className="flex items-start gap-4">
                      <div className="bg-brand-500/20 p-3 rounded-lg shrink-0">
                        <Target className="text-brand-400" size={24} />
                      </div>
                      <p className="text-slate-300">{insights.trainingFocus}</p>
                   </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                   <h3 className="text-lg font-semibold text-white mb-4">Actionable Tips</h3>
                   <ul className="space-y-3">
                     {insights.actionableTips.map((tip, i) => (
                       <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                         <CheckCircle2 className="text-brand-400 shrink-0 mt-0.5" size={16} />
                         <span>{tip}</span>
                       </li>
                     ))}
                   </ul>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button 
                  onClick={handleGenerateInsights}
                  className="text-slate-500 hover:text-brand-400 flex items-center gap-2 text-sm transition-colors"
                >
                  <RefreshCw size={14} /> Refresh Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="flex flex-col h-[600px] bg-slate-800 border border-slate-700 rounded-xl overflow-hidden animate-fade-in shadow-xl">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-brand-600 text-white rounded-tr-sm' 
                    : 'bg-slate-700 text-slate-200 rounded-tl-sm'
                }`}>
                  {msg.role === 'model' && (
                    <div className="flex items-center gap-2 mb-2 opacity-70 text-xs uppercase tracking-wider font-bold">
                      <Sparkles size={12} /> Stride Coach
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
               <div className="flex justify-start">
                <div className="bg-slate-700 p-4 rounded-2xl rounded-tl-sm flex gap-2 items-center">
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your pace, distance, or recovery..."
              className="flex-1 bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 transition-colors"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || chatLoading}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:hover:bg-brand-500 text-white p-3 rounded-xl transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// Helper icon for training focus
const Target = ({size, className}: {size: number, className?: string}) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
);

// Helper icon for trends
const TrendingUp = ({size, className}: {size: number, className?: string}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

export default CoachInsights;
