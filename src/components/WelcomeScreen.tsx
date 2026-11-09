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
      text: '🔥 Join me on HUSH AI! 100% anonymous 1-on-1 chat with zero names and zero judgment:',
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
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

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -(y * 18), y: x * 18 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-4.5rem)] px-4 py-10 sm:py-16 max-w-5xl mx-auto perspective-1500 overflow-hidden">
      {/* 3D Floating Ambient Glowing Orbs */}
      <div className="ambient-orb-purple w-[28rem] h-[28rem] -top-24 -left-28 opacity-70"></div>
      <div className="ambient-orb-cyan w-[28rem] h-[28rem] top-40 -right-28 opacity-70"></div>

      {/* 3D Cyber Horizon Floor */}
      <div className="cyber-floor-3d hidden sm:block"></div>

      {/* Floating Pill - Crisp & Spaced */}
      <div className="mb-6 z-10">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-950/80 border border-purple-600/50 text-purple-200 text-xs sm:text-sm font-semibold shadow-xl shadow-purple-950/60 floating-option-1 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Next-Gen Anonymous 1-on-1 Chat</span>
        </div>
      </div>

      {/* Main Title - Clean & High Impact, No Heavy Matter */}
      <div className="text-center max-w-2xl mb-10 space-y-4 z-10">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Talk Freely. <br />
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
            Stay Anonymous.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
          Zero login. Zero identity footprints. Connect with real people through shared vibes, mutual safety gates, and 3D immersive chat.
        </p>
      </div>

      {/* SPECTACULAR 3D FLOATING SCREEN PREVIEW WITH SURROUNDING FLOATING OPTIONS */}
      <div className="relative w-full max-w-xl mb-12 z-20 px-2 sm:px-4">
        {/* Floating Option Pill Top-Left */}
        <div className="hidden md:flex absolute -top-5 -left-12 z-30 floating-option-1">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-xl shadow-cyan-950/60 backdrop-blur-xl flex items-center space-x-2 hover:border-cyan-400 transition-colors">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>🎭 100% Anonymous</span>
          </div>
        </div>

        {/* Floating Option Pill Top-Right */}
        <div className="hidden md:flex absolute -top-4 -right-10 z-30 floating-option-2">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-purple-500/40 text-purple-300 text-xs font-bold shadow-xl shadow-purple-950/60 backdrop-blur-xl flex items-center space-x-2 hover:border-purple-400 transition-colors">
            <span>⚡ Real-Time Vibe Match</span>
          </div>
        </div>

        {/* Floating Option Pill Bottom-Left */}
        <div className="hidden md:flex absolute -bottom-4 -left-10 z-30 floating-option-3">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-xl shadow-amber-950/60 backdrop-blur-xl flex items-center space-x-2 hover:border-amber-400 transition-colors">
            <span>📍 Mumbai • BLR • Delhi</span>
          </div>
        </div>

        {/* Floating Option Pill Bottom-Right */}
        <div className="hidden md:flex absolute -bottom-5 -right-8 z-30 floating-option-4">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-xl shadow-emerald-950/60 backdrop-blur-xl flex items-center space-x-2 hover:border-emerald-400 transition-colors">
            <span>🔒 10-Msg Safe Gate</span>
          </div>
        </div>

        {/* The 3D Floating Screen with preserve-3d and dynamic tilt */}
        <div 
          className="floating-screen-3d p-6 sm:p-7 rounded-[2rem] space-y-4 shadow-2xl border border-purple-500/40 bg-gradient-to-br from-[#0e1428]/95 via-[#0b1022]/95 to-[#080d1a]/95 backdrop-blur-2xl transition-transform duration-200 cursor-pointer"
          style={isHovered ? {
            transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`,
            animation: 'none'
          } : undefined}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
        >
          {/* 3D Header Bar */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/10 preserve-3d">
            <div className="flex items-center space-x-3.5 translate-z-20">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-base shadow-lg shadow-purple-600/40 ring-2 ring-purple-400/30">
                  S
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950"></span>
              </div>
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-extrabold text-sm">Stranger #4829</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-700/50">
                    CAREER
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300 mt-1">
                  <span className="text-cyan-300 font-semibold">📍 Mumbai</span>
                  <span>•</span>
                  <span className="text-slate-300 font-semibold">21 yrs</span>
                  <span>•</span>
                  <span className="text-purple-300 font-semibold">Tech & Startups</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 translate-z-30">
              <span className="text-xs font-mono px-3 py-1 rounded-xl bg-purple-950/80 text-purple-200 border border-purple-600/50 font-bold shadow">
                🔗 HUSH-482910
              </span>
            </div>
          </div>

          {/* 3D Floating Chat Preview Messages */}
          <div className="space-y-3.5 py-2 text-xs sm:text-sm text-left preserve-3d">
            {/* Incoming Bubble with 3D Pop & Reaction */}
            <div className="relative translate-z-20 max-w-[85%]">
              <div className="p-3.5 rounded-2xl rounded-bl-sm bg-slate-800/90 text-slate-100 border border-white/5 shadow-md">
                Hey! Preparing for tech campus placements too? Building cool AI projects! 🚀
              </div>
              <div className="absolute -bottom-2.5 right-3 px-2 py-0.5 rounded-full bg-purple-950 border border-purple-600/60 text-[10px] font-bold text-purple-200 shadow-lg translate-z-30 floating-option-1">
                ❤️ 2
              </div>
            </div>

            {/* Outgoing Bubble with 3D Pop & Reaction */}
            <div className="relative ml-auto max-w-[85%] translate-z-30">
              <div className="p-3.5 rounded-2xl rounded-br-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-lg shadow-purple-600/25">
                Yes! Just launched with 3D floating vibes. Safe gate unlocks at 10 msgs ✨
              </div>
              <div className="absolute -bottom-2.5 left-3 px-2 py-0.5 rounded-full bg-indigo-950 border border-cyan-500/60 text-[10px] font-bold text-cyan-200 shadow-lg translate-z-40 floating-option-2">
                🔥 3
              </div>
            </div>
          </div>

          {/* 3D Floating Mutual Gate Progress Ribbon */}
          <div className="pt-2 translate-z-20">
            <div className="p-2.5 rounded-xl bg-black/40 border border-purple-500/20 flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <div className="flex items-center space-x-2">
                <span className="text-amber-400">🔒 Mutual Safe Gate:</span>
                <span>Send 10 messages each to unlock media & calls</span>
              </div>
              <span className="text-purple-300 font-mono font-bold">4/10 msgs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Buttons: Start Chatting & Reconnect - Spacious & Clear */}
      <div className="w-full max-w-md mb-8 flex flex-col sm:flex-row gap-3.5 z-10">
        <button
          onClick={onStartChatting}
          className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 flex items-center justify-center space-x-2.5 transition-all transform hover:-translate-y-1 active:translate-y-0 focus:outline-none"
        >
          <span>Start Chatting</span>
          <ArrowRight className="w-5 h-5 text-white/90" />
        </button>

        <button
          onClick={onOpenReconnect}
          className="py-4 px-6 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-purple-500/40 hover:border-purple-400 text-purple-200 hover:text-white font-bold text-sm shadow-lg flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-1 active:translate-y-0"
        >
          <Link2 className="w-4 h-4 text-cyan-400" />
          <span>Reconnect Code</span>
        </button>
      </div>

      {/* FLOATING VIBE OPTIONS CHIPS - Interactive 3D Treat */}
      <div className="w-full max-w-xl mb-10 text-center space-y-3 z-10">
        <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 block">
          ✨ Floating 3D Vibes • Tap Any To Jump In
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={onStartChatting}
            className="floating-option-1 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-950/80 to-indigo-950/80 border border-blue-500/40 hover:border-blue-400 text-blue-300 hover:text-white text-xs font-bold shadow-lg shadow-blue-950/50 backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center space-x-1.5"
          >
            <span>🎯 Career & Tech</span>
          </button>
          <button
            onClick={onStartChatting}
            className="floating-option-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-950/80 to-orange-950/80 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-bold shadow-lg shadow-amber-950/50 backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center space-x-1.5"
          >
            <span>😊 Happy Vibes</span>
          </button>
          <button
            onClick={onStartChatting}
            className="floating-option-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-950/80 to-pink-950/80 border border-purple-500/40 hover:border-purple-400 text-purple-300 hover:text-white text-xs font-bold shadow-lg shadow-purple-950/50 backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center space-x-1.5"
          >
            <span>🎮 Casual Banter</span>
          </button>
          <button
            onClick={onStartChatting}
            className="floating-option-4 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-bold shadow-lg shadow-emerald-950/50 backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center space-x-1.5"
          >
            <span>🤔 Deep Thoughts</span>
          </button>
        </div>
      </div>

      {/* Peak Session Notice - Minimal & Airy */}
      <div className="w-full max-w-md p-4 rounded-2xl bg-slate-900/70 border border-slate-800 mb-10 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3 text-left">
          <Calendar className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div>
            <span className="text-xs font-bold text-white block">Peak Time: 7:00–8:00 PM IST</span>
            <span className="text-[11px] text-slate-400">Most people online simultaneously</span>
          </div>
        </div>
        <button
          onClick={handleShare}
          className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-xs font-semibold border border-purple-500/40 transition-colors flex items-center space-x-1"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Invite'}</span>
        </button>
      </div>

      {/* 3 Clear Feature Cards with Generous Spacing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-3xl mb-12 z-10">
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 flex flex-col items-center text-center space-y-3 card-3d">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <UserX className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">100% Anonymous</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Zero sign-up required. Your identity is always private.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 flex flex-col items-center text-center space-y-3 card-3d">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">City & Vibe Match</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Filter by city and mood to meet like-minded people.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 flex flex-col items-center text-center space-y-3 card-3d">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Link2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">Direct Reconnect</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Liked someone? Reconnect anytime with 6-digit codes.
          </p>
        </div>
      </div>

      {/* Safety & Compliance Footer Links */}
      <div className="w-full max-w-md pt-6 border-t border-slate-800/60 flex flex-col items-center space-y-3 text-center z-10">
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
        <p className="text-[11px] text-slate-500">
          18+ Adults Only • Safe & Moderated Space
        </p>
      </div>
    </div>
  );
};
