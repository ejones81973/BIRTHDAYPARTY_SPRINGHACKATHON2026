import React, { useState } from 'react';
import { Sparkles, BarChart3, Video, Send, RefreshCw, MessageSquare, ShieldCheck } from 'lucide-react';

export default function App() {
  // State for the user's input and the AI's response
  const [pitch, setPitch] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Mock function to simulate the "AI Feedback Loop"
  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate API delay
    setTimeout(() => {
      setFeedback({
        critique: "Your opening is strong, but the 'Impact' section needs more data. Try adding a specific market size.",
        scores: { P: 90, I: 45, T: 70, C: 85, H: 95 },
        alignment: "88% Match with Company Values"
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. Header Navigation */}
      <nav className="border-b bg-white p-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            PitchArchitect AI
          </h1>
        </div>
        <div className="flex gap-4">
          <button className="text-slate-600 font-medium hover:text-indigo-600 transition">Saved Pitches</button>
          <button className="bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all">
            Export Slide Deck
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 2. Left Column: The Edit Loop (Input & Video) */}
        <section className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Project Workspace</span>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition shadow-sm">
                   <Video className="w-4 h-4 text-indigo-600" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Refine your project pitch:</label>
              <textarea 
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                className="w-full h-64 p-5 text-lg border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none placeholder:text-slate-400 transition-all"
                placeholder="Start typing your big idea here..."
              />
              
              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-slate-400 italic">Auto-saving to GitHub...</p>
                <button 
                  onClick={handleAnalyze}
                  disabled={!pitch || isAnalyzing}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                    isAnalyzing ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:scale-105 active:scale-95'
                  }`}
                >
                  {isAnalyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {isAnalyzing ? "Analyzing..." : "Analyze Pitch"}
                </button>
              </div>
            </div>
          </div>

          {/* Feedback Display Area */}
          {feedback && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
              <h3 className="flex items-center gap-2 font-bold text-indigo-900 mb-2">
                <MessageSquare className="w-5 h-5" /> Responsive Feedback
              </h3>
              <p className="text-indigo-800 leading-relaxed">{feedback.critique}</p>
            </div>
          )}
        </section>

        {/* 3. Right Column: The PITCH Metrics & Evaluation */}
        <aside className="lg:col-span-4 space-y-6">
          {/* PITCH Scorecard */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-4 text-slate-800">
              <BarChart3 className="w-5 h-5 text-indigo-600" /> PITCH Evaluation
            </h2>
            <div className="space-y-6">
              {[
                { label: 'Purpose', key: 'P', color: 'bg-emerald-500' },
                { label: 'Impact', key: 'I', color: 'bg-rose-500' },
                { label: 'Technicals', key: 'T', color: 'bg-blue-500' },
                { label: 'Clarity', key: 'C', color: 'bg-amber-500' },
                { label: 'Hook', key: 'H', color: 'bg-purple-500' },
              ].map((item) => (
                <div key={item.key} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <span className="text-sm font-black text-slate-400 group-hover:text-indigo-600">
                      {feedback ? feedback.scores[item.key] : 0}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`${item.color} h-full transition-all duration-1000 ease-out`}
                      style={{ width: `${feedback ? feedback.scores[item.key] : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alignment Badge */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="font-bold">Goal Alignment</h3>
            </div>
            <p className="text-indigo-100 text-sm mb-4">
              This score measures how well your pitch resonates with the specific company values and personal goals you've set.
            </p>
            <div className="text-3xl font-black text-center py-2">
              {feedback ? feedback.alignment : "--% Match"}
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
}