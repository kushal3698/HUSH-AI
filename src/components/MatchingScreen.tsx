import React, { useEffect, useState } from 'react';
import { Compass, X, Sparkles, ExternalLink, Users, Calendar, Share2, Check, Globe, Gamepad2, ArrowRight } from 'lucide-react';
import { MoodId } from '../types';
import { WOULD_YOU_RATHER_DECK, WouldYouRatherPrompt } from '../services/gameService';

interface MatchingScreenProps {
  mood: MoodId;
  queueStatus?: { position: number; totalWaiting: number } | null;
  onCancel: () => void;
  onSwitchToMood?: (newMood: MoodId) => void;
}

const SAFETY_TIPS = [
  "You are matching with real people. No bots or AI will talk for them.",
  "Tip: Never share your passwords, bank details, or home address.",
  "Tip: Tap ✨ Help me start a conversation inside chat if you want icebreaker ideas.",
  "Tip: You can launch in-chat mini-games with 🎮 Play Game to break the ice!",
  "Tip: Abusive or harassing users are immediately banned upon reporting."
];

export const MatchingScreen: React.FC<MatchingScreenProps> = ({ 
  mood, 
  queueStatus,
  onCancel,
  onSwitchToMood
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Solo Queue Mini-Game
  const [queuePromptIndex, setQueuePromptIndex] = useState(0);
  const [soloVote, setSoloVote] = useState<'A' | 'B' | null>(null);

  const currentDilemma: WouldYouRatherPrompt = WOULD_YOU_RATHER_DECK[queuePromptIndex % WOULD_YOU_RATHER_DECK.length];

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Tip cycler
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % SAFETY_TIPS.length);
    }, 4000);
    return () => clearInterval(tipInterval);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOpenSecondTab = () => {
    window.open(window.location.origin, '_blank');
  };

  const handleNextDilemma = () => {
    setSoloVote(null);
    setQueuePromptIndex((prev) => prev + 1);
  };

  const handleShareInvite = async () => {
    const shareData = {
      title: 'HUSH AI — Chat with me anonymously',
      text: `🚀 Hey! I'm online right now on HUSH AI waiting in the "${mood}" room. Tap the link to match and chat with me anonymously:`,
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8 max-w-md mx-auto text-center">
      {/* Active Mood Pill */}
      <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-950/70 border border-purple-800/50 text-purple-300 text-xs font-semibold mb-6 shadow-inner">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        <span>Matching with Real People:</span>
        <span className="text-white capitalize">{mood}</span>
      </div>

      {/* Radar Pulse Animation Container */}
      <div className="relative w-44 h-44 flex items-center justify-center mb-5">
        <div className="absolute w-40 h-40 rounded-full border border-purple-500/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        <div className="absolute w-28 h-28 rounded-full border border-indigo-500/30 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_delay-300]"></div>

        <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-tr from-purple-700 via-indigo-600 to-cyan-500 p-[2px] shadow-2xl shadow-purple-600/50">
          <div className="w-full h-full rounded-full bg-[#0a0f24] flex flex-col items-center justify-center">
            <Compass className="w-7 h-7 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>
      </div>

      {/* Status Text */}
      <div className="space-y-1.5 mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Waiting for another person...
        </h2>
        <p className="text-xs text-slate-300">
          Searching for someone in <span className="text-purple-300 font-semibold capitalize">{mood}</span>
        </p>

        {queueStatus && (
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <Users className="w-3 h-3 text-indigo-400" />
            <span>People in queue: {queueStatus.totalWaiting}</span>
          </div>
        )}

        <p className="text-xs font-mono text-cyan-400 font-medium">
          Waiting: {formatTime(secondsElapsed)}
        </p>
      </div>

      {/* Queue Solo Entertainment: Would You Rather while waiting */}
      <div className="w-full mb-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/60 border border-purple-500/30 text-left space-y-2.5 shadow-lg animate-fade-in">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5">
          <div className="flex items-center space-x-1.5 text-purple-300">
            <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Play While You Wait</span>
          </div>
          <button
            onClick={handleNextDilemma}
            className="text-[10px] text-purple-300 hover:text-white flex items-center space-x-0.5"
          >
            <span>Next</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <p className="text-xs font-semibold text-white">
          {currentDilemma.question}
        </p>

        <div className="space-y-1.5">
          <button
            onClick={() => setSoloVote('A')}
            className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
              soloVote === 'A'
                ? 'bg-purple-900/60 border-purple-400 text-white font-semibold'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/70 text-slate-200'
            }`}
          >
            🅰️ {currentDilemma.optionA}
            {soloVote && (
              <span className="float-right text-[10px] font-mono text-purple-300">
                {soloVote === 'A' ? '68%' : '32%'}
              </span>
            )}
          </button>

          <button
            onClick={() => setSoloVote('B')}
            className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
              soloVote === 'B'
                ? 'bg-cyan-900/60 border-cyan-400 text-white font-semibold'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/70 text-slate-200'
            }`}
          >
            🅱️ {currentDilemma.optionB}
            {soloVote && (
              <span className="float-right text-[10px] font-mono text-cyan-300">
                {soloVote === 'B' ? '71%' : '29%'}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Helpful Waiting Assistant when waiting > 8 seconds */}
      {secondsElapsed >= 8 && mood !== 'general' && onSwitchToMood && (
        <div className="w-full mb-3 p-3 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-left space-y-2 animate-fade-in">
          <p className="text-xs text-purple-200">
            Nobody in <strong className="capitalize">{mood}</strong> right this second?
          </p>
          <button
            onClick={() => onSwitchToMood('general')}
            className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Switch to Any Topic (General Chat)</span>
          </button>
        </div>
      )}

      {/* Scheduled Session Notice */}
      <div className="w-full mb-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-left">
        <div className="flex items-center space-x-2.5">
          <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <div>
            <span className="block text-xs font-bold text-slate-200">Peak Session: 7:00–8:00 PM IST</span>
            <span className="block text-[10px] text-slate-400">Most students online simultaneously</span>
          </div>
        </div>
        <button
          onClick={handleShareInvite}
          className="px-2.5 py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white text-[11px] font-semibold flex items-center space-x-1 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Invite'}</span>
        </button>
      </div>

      {/* Quick Test Helper Button (Open 2nd Window) */}
      <div className="w-full mb-5 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-left space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center space-x-1.5">
            <span>Want to self-test right now?</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-900 text-indigo-200">
            Test
          </span>
        </div>
        <button
          onClick={handleOpenSecondTab}
          className="w-full py-2 px-3 rounded-xl bg-indigo-600/60 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open 2nd Window (Test 2-Person Chat)</span>
        </button>
      </div>

      {/* Safety / Helpful Tip */}
      <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 mb-5 text-xs text-slate-400 transition-all duration-300 flex items-center space-x-2.5">
        <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <span className="text-left leading-relaxed">{SAFETY_TIPS[tipIndex]}</span>
      </div>

      {/* Cancel Search Button */}
      <button
        onClick={onCancel}
        className="w-full py-3 px-6 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-medium text-sm flex items-center justify-center space-x-2 transition-colors focus:outline-none"
      >
        <X className="w-4 h-4" />
        <span>Cancel Search</span>
      </button>
    </div>
  );
};
