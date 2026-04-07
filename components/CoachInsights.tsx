import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  Activity,
  RefreshCw,
  Heart,
  ShieldCheck,
  Send,
  Zap,
  Info,
  ChevronRight,
  Target,
  Ruler,
  CheckCircle2
} from 'lucide-react';
import { Run, UserProfile, CoachInsights as CoachInsightsType } from '../types';
import { generateCoachInsights, getCoachChatResponse } from '../services/geminiService';
import { Card, Button, StatCard } from './UIComponents';

interface CoachInsightsProps {
  runs: Run[];
  profile: UserProfile;
}

const CoachInsights: React.FC<CoachInsightsProps> = ({ runs, profile }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [insights, setInsights] = useState<CoachInsightsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedInsights = localStorage.getItem('redline_coach_insights');
    if (savedInsights) {
      try { setInsights(JSON.parse(savedInsights)); } catch(e) { }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGenerateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const newInsights = await generateCoachInsights(runs, profile);
      setInsights(newInsights);
      localStorage.setItem('redline_coach_insights', JSON.stringify(newInsights));
    } catch (err: any) {
      if (err.message && (err.message.includes('429') || err.message.includes('500') || err.message.includes('Quota') || err.message.includes('Edge Function'))) {
         setError("AI features are currently unavailable (Quota Exceeded). Please try again later.");
      } else {
         setError(err.message || 'Failed to generate insights');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setChatLoading(true);

    try {
      const response = await getCoachChatResponse(userMessage, runs, profile);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', text: "AI features are currently unavailable. Please try again later." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
         <div>
             <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tighter mb-2 flex items-center gap-3">
                AI Coach <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Beta</span>
             </h2>
             <p className="text-accents-5 text-base">Personalized training analysis and guidance.</p>
         </div>

         <div className="flex bg-accents-1 rounded-md p-1 border border-accents-2">
            <button
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'analysis' ? 'bg-background text-foreground shadow-sm' : 'text-accents-5 hover:text-foreground'}`}
            >
                Analysis
            </button>
            <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'chat' ? 'bg-background text-foreground shadow-sm' : 'text-accents-5 hover:text-foreground'}`}
            >
                Chat
            </button>
         </div>
      </div>

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {!insights && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-accents-1 p-6 rounded-full mb-6">
                <Sparkles size={48} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">Ready for a Deep Dive?</h3>
              <p className="text-accents-5 max-w-md mb-8">
                Our AI coach analyzes your recent runs, heart rate trends, and recovery to provide personalized training advice.
              </p>
              <Button onClick={handleGenerateInsights} className="h-12 px-8">
                Generate My Analysis
              </Button>
              {error && (
                <div className="mt-6 flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-12 h-12 border-2 border-foreground border-t-primary rounded-full animate-spin mb-6"></div>
              <p className="text-accents-5 font-medium tracking-wide uppercase text-xs animate-pulse">Analyzing your training load...</p>
            </div>
          )}

          {insights && (
            <div className="space-y-6 animate-fade-in">
               <Card className="bg-foreground text-background border-none p-8">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-accents-4 mb-4">Fitness Summary</h3>
                    <p className="text-xl md:text-2xl leading-relaxed font-bold tracking-tight">{insights.fitnessSummary}</p>
               </Card>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 uppercase tracking-widest">
                          <Activity className="text-primary" size={16} /> Analysis
                      </h3>
                      <p className="text-accents-6 leading-relaxed text-sm">{insights.formAnalysis}</p>
                  </Card>

                  <Card>
                       <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 uppercase tracking-widest">
                          <ShieldCheck className="text-primary" size={16} /> Risk Factors
                      </h3>
                      <p className="text-accents-6 leading-relaxed text-sm">{insights.injuryRiskAssessment}</p>
                  </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.trends.map((trend, i) => (
                  <div key={i} className={`p-4 rounded-lg border ${
                    trend.type === 'positive' ? 'bg-green-50/50 border-green-200 text-green-900' :
                    trend.type === 'negative' ? 'bg-red-50/50 border-red-200 text-red-900' :
                    'bg-accents-1 border-accents-2 text-foreground'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {trend.type === 'positive' ? <TrendingUp size={14} className="text-green-600" /> :
                       trend.type === 'negative' ? <AlertCircle size={14} className="text-red-600" /> :
                       <Activity size={14} />}
                      <h4 className="font-bold text-xs uppercase tracking-wider">{trend.title}</h4>
                    </div>
                    <p className="text-xs opacity-80 leading-relaxed">{trend.description}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                   <h3 className="text-sm font-semibold text-foreground mb-6 uppercase tracking-widest">Training Focus</h3>
                   <div className="flex items-start gap-4">
                      <div className="bg-accents-1 p-3 rounded-lg border border-accents-2 text-primary shrink-0">
                        <Target size={20} />
                      </div>
                      <p className="text-foreground font-bold text-lg tracking-tight">{insights.trainingFocus}</p>
                   </div>
                </Card>
                <Card>
                   <h3 className="text-sm font-semibold text-foreground mb-6 uppercase tracking-widest">Coach's Tips</h3>
                   <ul className="space-y-4">
                     {insights.actionableTips.map((tip, i) => (
                       <li key={i} className="flex items-start gap-3 text-xs text-accents-6">
                         <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={14} />
                         <span className="font-medium">{tip}</span>
                       </li>
                     ))}
                   </ul>
                </Card>
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={handleGenerateInsights}
                  className="text-accents-5 hover:text-foreground flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  <RefreshCw size={14} /> Refresh Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <Card className="p-0 flex flex-col h-[600px] overflow-hidden border-accents-2 shadow-xl">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 geist-grid">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale">
                    <MessageCircle size={48} className="mb-4" />
                    <p className="text-sm font-medium">Ask me anything about your training.</p>
                </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-foreground text-background font-medium'
                    : 'bg-accents-1 text-foreground border border-accents-2'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
               <div className="flex justify-start">
                <div className="bg-accents-1 p-3 rounded-xl border border-accents-2 flex gap-1.5 items-center">
                   <div className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                   <div className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSendMessage} className="p-4 border-t border-accents-2 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-background border border-accents-2 focus:border-foreground rounded-md px-4 py-2.5 focus:outline-none transition-colors text-sm"
            />
            <Button type="submit" disabled={!input.trim() || chatLoading} className="h-10 w-10 p-0">
              <Send size={18} />
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
};

export default CoachInsights;
