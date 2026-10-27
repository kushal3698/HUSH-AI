import React from 'react';
import { Sparkles, MessageCircle, Settings } from 'lucide-react';
import { MoodId } from '../types';

interface NavbarProps {
  currentMood?: MoodId | null;
  onOpenSettings: () => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentMood, onOpenSettings, onGoHome }) => {
  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <button 
          onClick={onGoHome}
          className="flex items-center space-x-2.5 text-left group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0a0f24] rounded-[10px] flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
                HUSH<span className="text-purple-400">.</span>AI
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/40">
                PROTOTYPE
              </span>
            </div>
          </div>
        </button>

        {/* Center / Mood indicator if active */}
        {currentMood && (
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Room:</span>
            <span className="font-medium text-white capitalize">{currentMood}</span>
          </div>
        )}

        {/* Right side controls */}
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-800/30 text-[11px] text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Assisted</span>
          </div>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50 transition-colors focus:outline-none"
            title="Privacy & Settings"
            aria-label="Privacy & Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
