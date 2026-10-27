import React from 'react';
import { Lock, Image, Video, Phone, Mic } from 'lucide-react';
import { ConversationProgress } from '../types';

interface LockedFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: ConversationProgress;
  strangerAlias: string;
  attemptedFeature?: 'media' | 'voice' | 'call_audio' | 'call_video' | null;
}

export const LockedFeatureModal: React.FC<LockedFeatureModalProps> = ({
  isOpen,
  onClose,
  progress,
  strangerAlias,
  attemptedFeature
}) => {
  if (!isOpen) return null;

  const myCount = Math.min(progress.myMessageCount, 10);
  const strangerCount = Math.min(progress.strangerMessageCount, 10);
  const myPct = (myCount / 10) * 100;
  const strangerPct = (strangerCount / 10) * 100;

  const getFeatureTitle = () => {
    switch (attemptedFeature) {
      case 'media':
        return 'Photo & Video Sharing is Locked';
      case 'voice':
        return 'Voice Messages are Locked';
      case 'call_audio':
        return 'Audio Calling is Locked';
      case 'call_video':
        return 'Video Calling is Locked';
      default:
        return 'Media & Calling are Locked';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-md bg-[#0c1222] border border-purple-500/40 rounded-3xl p-6 shadow-2xl text-white space-y-5 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-purple-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              {getFeatureTitle()}
            </h3>
            <p className="text-xs text-amber-300/90 font-medium">
              Mutual Threshold Requirement
            </p>
          </div>
        </div>

        {/* Core Message */}
        <div className="bg-purple-950/40 border border-purple-800/40 p-3.5 rounded-2xl space-y-1">
          <p className="text-xs text-purple-200 font-semibold leading-relaxed">
            "Build your connection: send 10 messages each to unlock media and calls."
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Both you and {strangerAlias} must independently exchange at least 10 qualifying text messages before photos, videos, voice notes, and calls unlock.
          </p>
        </div>

        {/* Progress Breakdown */}
        <div className="bg-black/40 border border-slate-800/80 rounded-2xl p-4 space-y-3.5">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-300">Connection Progress</span>
            <span className="text-purple-300 font-mono">
              You: {myCount}/10 messages | Other person: {strangerCount}/10 messages
            </span>
          </div>

          {/* User Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Your messages sent</span>
              <span className={`font-semibold ${myCount >= 10 ? 'text-emerald-400' : 'text-purple-300'}`}>
                {myCount} / 10 {myCount >= 10 && '✓'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  myCount >= 10 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-500'
                }`}
                style={{ width: `${myPct}%` }}
              />
            </div>
          </div>

          {/* Stranger Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">{strangerAlias}'s messages sent</span>
              <span className={`font-semibold ${strangerCount >= 10 ? 'text-emerald-400' : 'text-cyan-300'}`}>
                {strangerCount} / 10 {strangerCount >= 10 && '✓'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  strangerCount >= 10 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                    : 'bg-gradient-to-r from-indigo-500 to-cyan-500'
                }`}
                style={{ width: `${strangerPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* What Unlocks */}
        <div className="space-y-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
            Features unlocked at 10 messages each:
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div className="flex items-center space-x-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <Image className="w-3.5 h-3.5 text-purple-400" />
              <span>Image Sharing</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              <span>Video Sharing</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <Mic className="w-3.5 h-3.5 text-pink-400" />
              <span>Voice Messages</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audio & Video Calls</span>
            </div>
          </div>
        </div>

        {/* Note on Counting Rules */}
        <p className="text-[10px] text-slate-500 italic">
          * Empty messages, repeated sends, reactions, and AI suggestions do not count toward your progress.
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all"
        >
          Keep Chatting
        </button>
      </div>
    </div>
  );
};
