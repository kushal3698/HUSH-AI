import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Sparkles, UserX, Compass, Calendar, Share2, Check } from 'lucide-react';

interface WelcomeScreenProps {
  onStartChatting: () => void;
  onOpenPrivacy: () => void;
  onOpenGuidelines: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartChatting,
  onOpenPrivacy,
  onOpenGuidelines,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: 'HUSH AI — Anonymous Chat',
      text: '🚀 Try HUSH AI with me! It’s a 100% anonymous chat app where real people talk about college, careers, and shared moods without names or judgment. No bots, only real users:',
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8 max-w-4xl mx-auto">
      {/* Hero Badge */}
      <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-medium mb-4 animate-pulse">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span>Next-Gen Anonymous Networking for Young Adults</span>
      </div>

      {/* Main Title & Tagline */}
      <div className="text-center max-w-2xl mb-6 space-y-3">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
          Meet someone new. <br />
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Keep your identity private.
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 font-medium">
          “No names. No judgment. Just conversations.”
        </p>
        <p className="text-sm text-slate-400 max-w-lg mx-auto pt-1 leading-relaxed">
          Connect with real people around shared moods, college life, and career goals. Real humans only—AI is your optional assistant.
        </p>
      </div>

      {/* Scheduled Community Session Highlight Banner */}
      <div className="w-full max-w-md p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-purple-950/70 to-slate-900 border border-purple-500/40 shadow-lg shadow-purple-950/30 mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-600/60 text-purple-100">
                Peak Hours
              </span>
              <span className="text-xs font-bold text-white">Daily Live Chat Session</span>
            </div>
            <p className="text-[11px] text-purple-200/80">
              7:00 PM – 8:00 PM IST • Most users online together
            </p>
          </div>
        </div>

        <button
          onClick={handleShare}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 hover:border-purple-500 transition-colors flex items-center space-x-1"
          title="Invite a friend"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Invite'}</span>
        </button>
      </div>

      {/* Main Action Button */}
      <div className="w-full max-w-sm mb-10 flex flex-col items-center space-y-3">
        <button
          onClick={onStartChatting}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-lg shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 flex items-center justify-center space-x-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none"
        >
          <span>Start Chatting</span>
          <ArrowRight className="w-5 h-5 text-white/90" />
        </button>
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Real people only • Zero registration required</span>
        </div>
      </div>

      {/* 3 Pillar Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-12">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col items-start space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <UserX className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-100 text-base">Purely Anonymous</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter as a guest. You're assigned a temporary alias like <span className="text-purple-300 font-mono">Stranger #4829</span> that disappears when you leave.
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col items-start space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-100 text-base">Mood-Based Matching</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Choose your vibe—Career & Tech, Happy, Curious, Bored, or General—and get matched with real people looking for the same topic.
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col items-start space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-100 text-base">AI Wingman Assistant</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Never experience awkward silences. Ask the AI assistant privately or generate icebreaker questions when you need inspiration.
          </p>
        </div>
      </div>

      {/* Safety & Compliance Footer Links */}
      <div className="w-full max-w-md pt-4 border-t border-slate-800/80 flex flex-col items-center space-y-3 text-center">
        <div className="flex items-center justify-center space-x-6 text-xs text-slate-400">
          <button 
            onClick={onOpenPrivacy}
            className="hover:text-purple-300 transition-colors underline decoration-slate-600 underline-offset-4"
          >
            Privacy & Safety
          </button>
          <span>•</span>
          <button 
            onClick={onOpenGuidelines}
            className="hover:text-purple-300 transition-colors underline decoration-slate-600 underline-offset-4"
          >
            Community Guidelines
          </button>
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700">
            18+
          </span>
          <span>Intended for adults 18–25+. Zero tolerance for harassment or abuse.</span>
        </div>
      </div>
    </div>
  );
};
