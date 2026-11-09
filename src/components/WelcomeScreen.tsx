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

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-4.5rem)] px-4 py-10 sm:py-16 max-w-4xl mx-auto perspective-1500">
      {/* 3D Floating Ambient Glowing Orbs */}
      <div className="ambient-orb-purple w-96 h-96 -top-24 -left-24 opacity-60"></div>
      <div className="ambient-orb-cyan w-96 h-96 top-48 -right-24 opacity-60"></div>

      {/* Floating Pill - Crisp & Spaced */}
      <div className="mb-6 z-10">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-950/70 border border-purple-700/50 text-purple-300 text-xs sm:text-sm font-semibold shadow-lg shadow-purple-950/40 floating-option">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Anonymous 1-on-1 Chat</span>
        </div>
      </div>

      {/* Main Title - Clean & High Impact, No Heavy Matter */}
      <div className="text-center max-w-2xl mb-8 space-y-4 z-10">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Talk Freely. <br />
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Stay Anonymous.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
          No names. No judgment. Connect instantly with real people around shared vibes, campus life, and genuine conversations.
        </p>
      </div>

      {/* 3D FLOATING SCREEN PREVIEW WIDGET - Clean, Roomy, Light */}
      <div className="w-full max-w-md mb-8 z-10">
        <div className="floating-screen-3d p-5 rounded-3xl space-y-3.5 shadow-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold text-base shadow">
                S
              </div>
              <div className="text-left">
                <span className="text-white font-bold text-sm block">Stranger #4829</span>
                <div className="flex items-center space-x-1.5 text-xs text-slate-300 mt-0.5">
                  <span className="text-cyan-300 font-semibold">📍 Mumbai</span>
                  <span>•</span>
                  <span className="text-purple-300 font-semibold">Career & Tech</span>
                </div>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-purple-950 text-purple-200 border border-purple-700/60 font-bold">
              Active
            </span>
          </div>

          {/* Simple Clean Messages */}
          <div className="space-y-2.5 py-1 text-xs sm:text-sm text-left">
            <div className="p-3 rounded-2xl rounded-bl-sm bg-slate-800 text-slate-200 max-w-[85%]">
              Hey! Preparing for tech placements too?
            </div>
            <div className="p-3 rounded-2xl rounded-br-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white ml-auto max-w-[85%]">
              Yes! Building cool projects right now. Where are you from?
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Buttons: Start Chatting & Reconnect - Spacious & Clear */}
      <div className="w-full max-w-md mb-10 flex flex-col sm:flex-row gap-3.5 z-10">
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
