import React, { useState } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { MoodCategory, MoodId } from '../types';

interface MoodSelectionScreenProps {
  onSelectMoodAndFind: (mood: MoodId, interests?: string[]) => void;
  onBack: () => void;
}

const MOODS: MoodCategory[] = [
  {
    id: 'career',
    label: 'Career & Tech',
    emoji: '🎯',
    tagline: 'Jobs, placements & ambitions',
    description: 'Discuss interviewing, learning new stacks, startup ideas, or work life.',
    gradient: 'from-blue-600/20 to-indigo-600/20',
    accentColor: 'border-blue-500/50 hover:border-blue-400',
    badge: 'Popular'
  },
  {
    id: 'happy',
    label: 'Happy & Positive',
    emoji: '😊',
    tagline: 'Good news & wholesome vibes',
    description: 'Share wins, celebrate good moments, or exchange uplifting encouragement.',
    gradient: 'from-amber-500/20 to-orange-500/20',
    accentColor: 'border-amber-500/50 hover:border-amber-400',
    badge: 'Vibes'
  },
  {
    id: 'bored',
    label: 'Bored / Casual',
    emoji: '🎮',
    tagline: 'Late night chill banter',
    description: 'Pass the time with fun debates, internet rabbit holes, or quick banter.',
    gradient: 'from-purple-600/20 to-pink-600/20',
    accentColor: 'border-purple-500/50 hover:border-purple-400',
    badge: 'Relaxed'
  },
  {
    id: 'curious',
    label: 'Curious & Deep',
    emoji: '🤔',
    tagline: 'Philosophy, science & hot takes',
    description: 'Explore mind-bending questions, sci-fi, ethics, and unconventional views.',
    gradient: 'from-emerald-600/20 to-teal-600/20',
    accentColor: 'border-emerald-500/50 hover:border-emerald-400',
    badge: 'Deep Dive'
  },
  {
    id: 'general',
    label: 'General Chat',
    emoji: '💬',
    tagline: 'Talk about anything',
    description: 'Open-ended, unstructured conversation. Meet someone new with no fixed agenda.',
    gradient: 'from-cyan-600/20 to-sky-600/20',
    accentColor: 'border-cyan-500/50 hover:border-cyan-400',
    badge: 'Any topic'
  }
];

const VIBE_INTERESTS = [
  { id: 'tech', label: '💻 Tech & AI' },
  { id: 'gaming', label: '🎮 Gaming' },
  { id: 'music', label: '🎵 Music' },
  { id: 'career', label: '📚 College & Jobs' },
  { id: 'memes', label: '😂 Memes & Banter' },
  { id: 'advice', label: '❤️ Life Advice' },
  { id: 'movies', label: '🎬 Movies & Anime' },
  { id: 'deep', label: '🧠 Deep Thoughts' },
];

export const MoodSelectionScreen: React.FC<MoodSelectionScreenProps> = ({
  onSelectMoodAndFind,
  onBack,
}) => {
  const [selectedMood, setSelectedMood] = useState<MoodId>('career');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['tech']);

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(prev => prev.filter(item => item !== id));
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests(prev => [...prev, id]);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] px-4 py-6 max-w-2xl mx-auto">
      {/* Back button & Step header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-sm text-slate-400 hover:text-white transition-colors p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          Step 1 of 2 • VibeMatch
        </span>
      </div>

      <div className="mb-6 space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          What vibe are you in the mood for?
        </h2>
        <p className="text-sm text-slate-400">
          Choose a mood and optional interest tags for high-compatibility matching.
        </p>
      </div>

      {/* Mood Cards List */}
      <div className="space-y-3 mb-6">
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.id;
          return (
            <div
              key={mood.id}
              onClick={() => setSelectedMood(mood.id)}
              className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-200 border ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border-purple-500 shadow-lg shadow-purple-900/30 ring-1 ring-purple-500/60'
                  : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-2xl shadow-inner">
                    {mood.emoji}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-white text-base">
                        {mood.label}
                      </h3>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                        {mood.badge}
                      </span>
                    </div>
                    <p className="text-xs text-purple-300 font-medium mt-0.5">
                      {mood.tagline}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed hidden sm:block">
                      {mood.description}
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                        : 'border border-slate-700 bg-slate-800/40'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VibeMatch Sub-Interest Tags */}
      <div className="mb-8 p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>VibeMatch™ Interest Tags (Pick up to 3):</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {selectedInterests.length}/3 selected
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {VIBE_INTERESTS.map((tag) => {
            const isPicked = selectedInterests.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleInterest(tag.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isPicked
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-900/30 ring-1 ring-cyan-400'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Launch Action */}
      <div className="sticky bottom-4 z-20 pt-2 pb-2">
        <button
          onClick={() => onSelectMoodAndFind(selectedMood, selectedInterests)}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-base shadow-xl shadow-purple-900/40 hover:shadow-purple-900/60 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="text-lg">🎲</span>
          <span>Find Someone in {MOODS.find(m => m.id === selectedMood)?.label}</span>
        </button>
      </div>
    </div>
  );
};
