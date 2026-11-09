import React, { useState } from 'react';
import { ArrowLeft, Check, Sparkles, MapPin, Calendar, Users, Link2 } from 'lucide-react';
import { MoodCategory, MoodId } from '../types';
import { chatService } from '../services/chatService';

interface MoodSelectionScreenProps {
  onSelectMoodAndFind: (
    mood: MoodId, 
    interests?: string[], 
    persona?: { city?: string; age?: string | number; gender?: string }
  ) => void;
  onBack: () => void;
  onOpenReconnect?: () => void;
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

const QUICK_CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'New York', 'London'];
const AGE_OPTIONS = ['18', '19', '20', '21', '22', '23', '24', '25+'];
const GENDER_OPTIONS = [
  { label: 'Male', emoji: '♂️' },
  { label: 'Female', emoji: '♀️' },
  { label: 'Non-Binary', emoji: '🌈' },
  { label: 'Anonymous', emoji: '🎭' }
];

export const MoodSelectionScreen: React.FC<MoodSelectionScreenProps> = ({
  onSelectMoodAndFind,
  onBack,
  onOpenReconnect,
}) => {
  const existingSession = chatService.getUserSession();

  const [selectedMood, setSelectedMood] = useState<MoodId>('career');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['tech']);
  const [city, setCity] = useState<string>(existingSession.city || '');
  const [age, setAge] = useState<string>(existingSession.age ? String(existingSession.age) : '20');
  const [gender, setGender] = useState<string>(existingSession.gender || 'Anonymous');

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(prev => prev.filter(item => item !== id));
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests(prev => [...prev, id]);
      }
    }
  };

  const handleStartMatching = () => {
    // Persist persona
    chatService.updatePersona({ city, age, gender });
    onSelectMoodAndFind(selectedMood, selectedInterests, { city, age, gender });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] px-4 py-6 max-w-2xl mx-auto perspective-1000">
      {/* Back button & Step header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-sm text-slate-400 hover:text-white transition-colors p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center space-x-2">
          {onOpenReconnect && (
            <button
              onClick={onOpenReconnect}
              className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 flex items-center space-x-1 transition-all shadow"
            >
              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reconnect Code</span>
            </button>
          )}
          <span className="text-xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            Step 1 of 2
          </span>
        </div>
      </div>

      <div className="mb-6 space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Select Your Vibe & Persona
        </h2>
        <p className="text-sm text-slate-400">
          Match with real people sharing your mood. Your city, age, and gender help start authentic conversations!
        </p>
      </div>

      {/* 3D PERSONA CARD (City, Age, Gender) */}
      <div className="mb-6 p-5 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-purple-950/50 border border-indigo-500/30 shadow-xl shadow-indigo-950/40 space-y-4 card-3d">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <span className="text-lg">🌐</span>
            <span>Your Anonymous Persona</span>
            <span className="text-[10px] font-normal text-purple-300 px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800">
              Shown to your partner in chat
            </span>
          </div>
        </div>

        {/* City Input & Quick Pills */}
        <div className="space-y-2">
          <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Your City or Region (e.g., Mumbai, Delhi, London):</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Type your city, college, or state..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {QUICK_CITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCity(c)}
                className={`text-[11px] px-2.5 py-1 rounded-lg transition-all ${
                  city.toLowerCase() === c.toLowerCase()
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Age & Gender Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Age Selection */}
          <div className="space-y-1.5">
            <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Age:</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {AGE_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAge(a)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    age === a
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-1 ring-indigo-400'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Selection */}
          <div className="space-y-1.5">
            <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
              <Users className="w-3.5 h-3.5 text-pink-400" />
              <span>Gender:</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => setGender(g.label)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-all ${
                    gender === g.label
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md font-semibold ring-1 ring-pink-400'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  <span>{g.emoji}</span>
                  <span>{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mood Cards List with 3D depth */}
      <div className="space-y-3 mb-6">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Choose Conversation Mood:
        </label>
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.id;
          return (
            <div
              key={mood.id}
              onClick={() => setSelectedMood(mood.id)}
              className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-300 border card-3d ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-950/70 via-indigo-950/70 to-slate-900 border-purple-500 shadow-xl shadow-purple-900/40 ring-1 ring-purple-500/60'
                  : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center text-2xl shadow-inner">
                    {mood.emoji}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-white text-base">
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
          onClick={handleStartMatching}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-base shadow-xl shadow-purple-900/40 hover:shadow-purple-900/60 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="text-lg">🎲</span>
          <span>Find Someone in {MOODS.find(m => m.id === selectedMood)?.label}</span>
        </button>
      </div>
    </div>
  );
};
