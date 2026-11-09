import React from 'react';
import { Sparkles, MessageCircle, Settings, Link2, Crown } from 'lucide-react';
import { MoodId } from '../types';
import { chatService } from '../services/chatService';

interface NavbarProps {
  currentMood?: MoodId | null;
  onOpenSettings: () => void;
  onGoHome: () => void;
  onOpenReconnect?: () => void;
  onOpenVip?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentMood, 
  onOpenSettings, 
  onGoHome,
  onOpenReconnect,
  onOpenVip 
}) => {
  const isVip = chatService.isVip();
  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 px-3 sm:px-4 py-2 sm:py-3">
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
            </div>
          </div>
        </button>



        {/* Right side controls */}
        <div className="flex items-center space-x-2">
          {/* VIP Upgrade Button */}
          {onOpenVip && (
            <button
              onClick={onOpenVip}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-black shadow-md transition-all ${
                isVip
                  ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 text-amber-300 hover:border-amber-400'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 hover:scale-105'
              }`}
              title={isVip ? 'VIP Membership Active' : 'Upgrade to VIP for Gender/City filters'}
            >
              <Crown className={`w-3.5 h-3.5 ${isVip ? 'text-amber-400' : 'text-slate-950 fill-current'}`} />
              <span className="hidden xs:inline sm:inline">{isVip ? 'VIP' : 'Get VIP'}</span>
            </button>
          )}

          {/* Reconnect Button (only on welcome/landing screens to avoid chat header clutter) */}
          {!currentMood && onOpenReconnect && (
            <button
              onClick={onOpenReconnect}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-semibold shadow-sm transition-all"
              title="Reconnect with a past partner"
            >
              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xs:inline sm:inline">Reconnect</span>
            </button>
          )}

          {!currentMood && (
            <div className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-800/30 text-[11px] text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Assisted</span>
            </div>
          )}

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
