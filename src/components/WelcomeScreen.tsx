import React, { useState } from 'react';
import { ArrowRight, Sparkles, UserX, Compass, Calendar, Share2, Check, Link2 } from 'lucide-react';

interface WelcomeScreenProps {
  onStartChatting: () => void;
  onOpenReconnect: () => void;
  onOpenPrivacy: () => void;
  onOpenGuidelines: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartChatting,
  onOpenReconnect,
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
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8 max-w-5xl mx-auto perspective-1500">
      {/* 3D Floating Ambient Glowing Orbs */}
      <div className="ambient-orb-purple w-96 h-96 -top-20 -left-20"></div>
      <div className="ambient-orb-cyan w-96 h-96 top-40 -right-20"></div>

      {/* Floating 3D Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4 z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-950/70 border border-purple-800/50 text-purple-300 text-xs font-semibold shadow-lg shadow-purple-950/40 floating-option">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next-Gen Anonymous Networking</span>
        </div>
        <div className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-xs font-semibold shadow-lg floating-option-delayed">
          <span>⚡ Direct Reconnect Protocol</span>
        </div>
      </div>

      {/* Main Title & Tagline with 3D Depth */}
      <div className="text-center max-w-3xl mb-6 space-y-3 z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-sm">
          Meet someone new. <br />
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Keep your identity private.
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 font-medium">
          “No names. No judgment. Real human conversations.”
        </p>
        <p className="text-sm text-slate-400 max-w-lg mx-auto pt-1 leading-relaxed">
          Connect around shared moods, city, and college goals. Real verified people only. Reconnect anytime with past partners using direct codes.
        </p>
      </div>

      {/* 3D FLOATING SCREEN PREVIEW WIDGET */}
      <div className="w-full max-w-lg mb-8 p-1 z-10">
        <div className="floating-screen-3d p-4 sm:p-5 rounded-3xl space-y-3">
          {/* Header of Mock Screen */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow">
                S
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-bold text-xs sm:text-sm">Stranger #4829</span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/50">
                    Career & Tech
                  </span>
                </div>
                {/* Persona Badges */}
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-300 mt-0.5">
                  <span className="text-cyan-300 font-medium">📍 Mumbai</span>
                  <span>•</span>
                  <span className="text-indigo-300 font-medium">21 yrs</span>
                  <span>•</span>
                  <span className="text-pink-300 font-medium">♂️ Male</span>
                </div>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2 py-1 rounded-xl bg-purple-950 text-purple-200 border border-purple-700/60 font-bold">
              HUSH-829140
            </span>
          </div>

          {/* Messages Mockup with 3D Depth */}
          <div className="space-y-2 py-1 text-xs">
            <div className="p-2.5 rounded-2xl rounded-bl-sm bg-slate-800/90 border border-slate-700/70 text-slate-200 max-w-[85%] shadow-sm">
              Hey! Also studying CS? Thinking of learning Next.js or Go this month.
            </div>
            <div className="p-2.5 rounded-2xl rounded-br-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white ml-auto max-w-[85%] shadow-md">
              Nice to meet you! Same here from Mumbai. Next.js is super fun to build with!
            </div>
          </div>

          {/* Interactive footer bar of mock screen */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>10/10 Message Threshold Active</span>
            </span>
            <span className="text-purple-300 font-semibold">Media & Calls Ready</span>
          </div>
        </div>
      </div>

      {/* Scheduled Community Session Highlight Banner */}
      <div className="w-full max-w-md p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-purple-950/70 to-slate-900 border border-purple-500/40 shadow-lg shadow-purple-950/30 mb-6 flex items-center justify-between z-10 card-3d">
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

      {/* Main Action Buttons: Start Chatting & Reconnect with Past Partner */}
      <div className="w-full max-w-md mb-10 flex flex-col sm:flex-row gap-3 z-10">
        <button
          onClick={onStartChatting}
          className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-purple-600/40 hover:shadow-purple-600/60 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-1 active:translate-y-0 focus:outline-none"
        >
          <span>Start Chatting</span>
          <ArrowRight className="w-5 h-5 text-white/90" />
        </button>

        <button
          onClick={onOpenReconnect}
          className="py-4 px-5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-purple-500/40 hover:border-purple-400 text-purple-200 hover:text-white font-bold text-sm shadow-lg flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-1 active:translate-y-0"
        >
          <Link2 className="w-4 h-4 text-cyan-400" />
          <span>🔗 Reconnect Code</span>
        </button>
      </div>

      {/* 3 Pillar Feature Cards with 3D Tilt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-12 z-10">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col items-start space-y-2.5 card-3d">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <UserX className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-100 text-base">Purely Anonymous</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter as a guest. Share only your City, Age, and Mood. Your identity is 100% private and protected.
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col items-start space-y-2.5 card-3d">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-100 text-base">Mood & Persona Match</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Choose your vibe—Career, Happy, Curious, Bored, or General—and see where the person is from in real-time.
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col items-start space-y-2.5 card-3d">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Link2 className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-100 text-base">Direct Reconnect</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Want to chat again with someone from before? Share your 6-digit Reconnect Code or link to find each other directly!
          </p>
        </div>
      </div>

      {/* Safety & Compliance Footer Links */}
      <div className="w-full max-w-md pt-4 border-t border-slate-800/80 flex flex-col items-center space-y-3 text-center z-10">
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
