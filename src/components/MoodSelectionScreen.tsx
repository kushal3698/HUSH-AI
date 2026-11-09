import React, { useState } from 'react';
import { ArrowLeft, Check, Sparkles, MapPin, Calendar, Users, Link2, Crown, Lock } from 'lucide-react';
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
  onOpenVip?: () => void;
}

const MOODS: MoodCategory[] = [
  {
    id: 'career',
    label: 'Career & Tech',
    emoji: '🎯',
    tagline: 'Placements, tech & startup ideas',
    description: '',
    gradient: 'from-blue-600/20 to-indigo-600/20',
    accentColor: 'border-blue-500/50 hover:border-blue-400',
    badge: 'Popular'
  },
  {
    id: 'happy',
    label: 'Happy & Positive',
    emoji: '😊',
    tagline: 'Wholesome wins & good vibes',
    description: '',
    gradient: 'from-amber-500/20 to-orange-500/20',
    accentColor: 'border-amber-500/50 hover:border-amber-400',
    badge: 'Vibes'
  },
  {
    id: 'bored',
    label: 'Bored / Casual',
    emoji: '🎮',
    tagline: 'Fun debates & late night chill banter',
    description: '',
    gradient: 'from-purple-600/20 to-pink-600/20',
    accentColor: 'border-purple-500/50 hover:border-purple-400',
    badge: 'Relaxed'
  },
  {
    id: 'curious',
    label: 'Curious & Deep',
    emoji: '🤔',
    tagline: 'Philosophy, science & hot takes',
    description: '',
    gradient: 'from-emerald-600/20 to-teal-600/20',
    accentColor: 'border-emerald-500/50 hover:border-emerald-400',
    badge: 'Deep Dive'
  },
  {
    id: 'general',
    label: 'General Chat',
    emoji: '💬',
    tagline: 'Talk about anything',
    description: '',
    gradient: 'from-cyan-600/20 to-sky-600/20',
    accentColor: 'border-cyan-500/50 hover:border-cyan-400',
    badge: 'Open'
  }
];

const VIBE_INTERESTS = [
  { id: 'tech', label: '💻 Tech & AI' },
  { id: 'gaming', label: '🎮 Gaming' },
  { id: 'music', label: '🎵 Music' },
  { id: 'career', label: '📚 College & Jobs' },
  { id: 'memes', label: '😂 Memes' },
  { id: 'advice', label: '❤️ Life Advice' },
  { id: 'movies', label: '🎬 Movies & Anime' },
  { id: 'deep', label: '🧠 Deep Thoughts' },
];

const QUICK_CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad'];
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
  onOpenVip
}) => {
  const existingSession = chatService.getUserSession();
  const isVip = chatService.isVip();
  const initialVipFilters = chatService.getVipFilters();

  const [selectedMood, setSelectedMood] = useState<MoodId>('career');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['tech']);
  const [city, setCity] = useState<string>(existingSession.city || '');
  const [age, setAge] = useState<string>(existingSession.age ? String(existingSession.age) : '20');
  const [gender, setGender] = useState<string>(existingSession.gender || 'Anonymous');

  // VIP Filter states
  const [targetGender, setTargetGender] = useState<'female' | 'male' | 'any'>(initialVipFilters.targetGender || 'any');
  const [targetCity, setTargetCity] = useState<string>(initialVipFilters.targetCity || '');

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(prev => prev.filter(item => item !== id));
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests(prev => [...prev, id]);
      }
    }
  };

  const handleGenderFilterChange = (filter: 'female' | 'male' | 'any') => {
    if (!isVip && filter !== 'any') {
      onOpenVip?.();
      return;
    }
    setTargetGender(filter);
    chatService.setVipFilters({ targetGender: filter, targetCity });
  };

  const handleTargetCityChange = (val: string) => {
    if (!isVip && val.trim().length > 0) {
      onOpenVip?.();
      return;
    }
    setTargetCity(val);
    chatService.setVipFilters({ targetGender, targetCity: val });
  };

  const handleStartMatching = () => {
    chatService.updatePersona({ city, age, gender });
    if (isVip) {
      chatService.setVipFilters({ targetGender, targetCity });
    }
    onSelectMoodAndFind(selectedMood, selectedInterests, { city, age, gender });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4.5rem)] min-h-[calc(100dvh-4.5rem)] px-4 sm:px-6 py-6 sm:py-12 max-w-xl mx-auto space-y-6 sm:space-y-7 perspective-1200 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* Top Header Row - Clean & Spaced */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {onOpenReconnect && (
          <button
            onClick={onOpenReconnect}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-500/40 flex items-center space-x-1.5 transition-all shadow"
          >
            <Link2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reconnect Code</span>
          </button>
        )}
      </div>

      {/* Screen Title - Clean & Punchy */}
      <div className="space-y-1 text-left">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Choose Your Vibe ✨
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Select what you want to talk about and set your anonymous persona.
        </p>
      </div>

      {/* 1. MOOD CARDS - Clean, Airy, 3D Elevation */}
      <div className="space-y-2.5">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-left">
          1. Select Conversation Topic:
        </span>
        <div className="space-y-2.5">
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.id;
            return (
              <div
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border flex items-center justify-between card-3d ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border-purple-400 shadow-xl shadow-purple-950/50 ring-1 ring-purple-400 translate-z-10'
                    : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3.5 text-left preserve-3d">
                  <span className="text-2xl p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner translate-z-10">
                    {mood.emoji}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-white text-sm">
                        {mood.label}
                      </h3>
                      {mood.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-purple-500/20">
                          {mood.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-purple-300 font-medium mt-0.5">
                      {mood.tagline}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                    isSelected
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'border border-slate-700 bg-slate-800/50'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. PERSONA (City, Age, Gender) - Spacious & Clean */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <span>🌐</span>
            <span>2. Your Persona (Shown in Chat):</span>
          </span>
          <span className="text-[10px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-800/50">
            100% Anonymous
          </span>
        </div>

        {/* City Field */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>City or College:</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Mumbai, Bengaluru, Delhi..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-base sm:text-xs focus:outline-none focus:border-cyan-400"
          />
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {QUICK_CITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCity(c)}
                className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
                  city.toLowerCase() === c.toLowerCase()
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Age & Gender Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Age Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Age:</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {AGE_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAge(a)}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    age === a
                      ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-pink-400" />
              <span>Gender:</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => setGender(g.label)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium flex items-center justify-center space-x-1 transition-all ${
                    gender === g.label
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold ring-1 ring-pink-400 shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
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

      {/* 3. VIP MATCH FILTERS - Clean, Simple Box */}
      <div className={`p-4 sm:p-5 rounded-3xl border transition-all text-left space-y-3 ${
        isVip 
          ? 'bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-500/50'
          : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className={`w-4 h-4 ${isVip ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              VIP Match Filter:
            </span>
          </div>
          {isVip ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              👑 Active
            </span>
          ) : (
            <button
              onClick={onOpenVip}
              className="text-[11px] font-bold px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:scale-105 transition-all flex items-center space-x-1"
            >
              <Crown className="w-3 h-3 text-slate-950 fill-current" />
              <span>Get VIP</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleGenderFilterChange('any')}
            className={`py-2 px-2 rounded-xl font-medium transition-all ${
              targetGender === 'any'
                ? 'bg-purple-600 text-white font-bold shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            👥 Anyone
          </button>

          <button
            type="button"
            onClick={() => handleGenderFilterChange('female')}
            className={`py-2 px-2 rounded-xl font-medium flex items-center justify-center space-x-1 transition-all ${
              targetGender === 'female'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold shadow'
                : 'bg-slate-800 text-slate-400 hover:text-pink-300'
            }`}
          >
            <span>♀️ Female</span>
            {!isVip && <Lock className="w-3 h-3 text-amber-400 inline" />}
          </button>

          <button
            type="button"
            onClick={() => handleGenderFilterChange('male')}
            className={`py-2 px-2 rounded-xl font-medium flex items-center justify-center space-x-1 transition-all ${
              targetGender === 'male'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow'
                : 'bg-slate-800 text-slate-400 hover:text-blue-300'
            }`}
          >
            <span>♂️ Male</span>
            {!isVip && <Lock className="w-3 h-3 text-amber-400 inline" />}
          </button>
        </div>

        {/* Optional Target City Filter */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Filter by Target City:</span>
            {!isVip && (
              <span className="text-[10px] text-amber-400 flex items-center space-x-0.5">
                <Lock className="w-2.5 h-2.5" />
                <span>VIP</span>
              </span>
            )}
          </div>
          <input
            type="text"
            value={targetCity}
            onChange={(e) => handleTargetCityChange(e.target.value)}
            onClick={() => { if (!isVip) onOpenVip?.(); }}
            placeholder={isVip ? "Filter by city (e.g. Mumbai, Delhi)..." : "🔒 VIP: Filter by specific city..."}
            className={`w-full px-3 py-2 rounded-xl text-base sm:text-xs bg-slate-950 border ${
              isVip ? 'border-slate-700 text-white focus:border-amber-400' : 'border-slate-800 text-slate-500 cursor-pointer'
            }`}
            readOnly={!isVip}
          />
        </div>
      </div>

      {/* 4. INTEREST TAGS - Airy & Clean */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5 text-left">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interests (Pick up to 3):</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {selectedInterests.length}/3
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
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md ring-1 ring-cyan-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. BIG CLEAN ACTION BUTTON */}
      <div className="pt-2 pb-4">
        <button
          onClick={handleStartMatching}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-black text-base shadow-xl shadow-purple-900/40 hover:shadow-purple-900/60 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>Find Someone Now</span>
          <span className="text-xl">→</span>
        </button>
      </div>
    </div>
  );
};
