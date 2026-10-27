import React, { useState } from 'react';
import { Sparkles, RefreshCw, X, Send, Wand2, MessageSquarePlus, Bot, HelpCircle, ArrowRight } from 'lucide-react';
import { MoodId, AiSuggestion, AiToneMode } from '../types';
import { aiService } from '../services/aiService';

interface AiStarterModalProps {
  topic: MoodId;
  isOpen: boolean;
  onClose: () => void;
  onSelectSuggestion: (text: string, sendImmediately?: boolean) => void;
}

const TONE_PILLS: { id: AiToneMode; label: string }[] = [
  { id: 'funny', label: '😂 Funny & Witty' },
  { id: 'deep', label: '💭 Deep & Curious' },
  { id: 'friendly', label: '😊 Friendly & Chill' },
  { id: 'intellectual', label: '🧠 Tech & Career' },
];

export const AiStarterModal: React.FC<AiStarterModalProps> = ({
  topic,
  isOpen,
  onClose,
  onSelectSuggestion,
}) => {
  const [activeTab, setActiveTab] = useState<'starters' | 'ask'>('starters');
  const [selectedTone, setSelectedTone] = useState<AiToneMode>('funny');
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>(() => aiService.getSuggestionsByTone(topic, 'funny', 4));
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Private AI Query state
  const [userQuery, setUserQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [assistantReply, setAssistantReply] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToneChange = (tone: AiToneMode) => {
    setSelectedTone(tone);
    setSuggestions(aiService.getSuggestionsByTone(topic, tone, 4));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setSuggestions(aiService.getSuggestionsByTone(topic, selectedTone, 4));
      setIsRefreshing(false);
    }, 300);
  };

  const handleAskAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || isQuerying) return;

    setIsQuerying(true);
    try {
      const reply = await aiService.queryAssistant(userQuery, topic);
      setAssistantReply(reply);
    } catch {
      setAssistantReply("Could not process query right now. Try one of the topic starters!");
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#0e152e] border-t sm:border border-purple-500/30 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center space-x-1.5">
                <span>AI Conversation Bridge</span>
              </h3>
              <p className="text-[11px] text-purple-300">
                Turn awkward chats into engaging talks in <span className="font-semibold capitalize">{topic}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {activeTab === 'starters' && (
              <button
                onClick={handleRefresh}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                title="Get new suggestions"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher: Starters vs Ask Query */}
        <div className="flex p-1 bg-slate-900 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('starters')}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
              activeTab === 'starters' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tone Starters</span>
          </button>
          <button
            onClick={() => setActiveTab('ask')}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
              activeTab === 'ask' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask AI Privately</span>
          </button>
        </div>

        {/* TAB 1: Topic Icebreakers with Tone Selector */}
        {activeTab === 'starters' && (
          <>
            {/* Tone Selector Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {TONE_PILLS.map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => handleToneChange(pill.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedTone === pill.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 bg-slate-900/60 rounded-xl p-2 border border-slate-800 flex items-center space-x-2">
              <Wand2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Tap Insert to edit before sending, or Send Now to message the real stranger.</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 py-1">
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  className="group bg-slate-900/80 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between space-y-2.5"
                >
                  <p className="text-sm text-slate-200 group-hover:text-white leading-relaxed">
                    “{item.text}”
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-purple-300">
                      {item.tone}
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          onSelectSuggestion(item.text, false);
                          onClose();
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center space-x-1 transition-colors"
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5" />
                        <span>Insert</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectSuggestion(item.text, true);
                          onClose();
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center space-x-1 shadow-md shadow-purple-600/30 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TAB 2: Private AI Assistant Query Interface */}
        {activeTab === 'ask' && (
          <div className="flex-1 flex flex-col space-y-3 overflow-y-auto pr-1">
            <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-2xl text-xs text-purple-200 flex items-start space-x-2">
              <HelpCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Private Assistant:</strong> This interface is completely private between you and the AI. Nothing you type here is shared with the stranger.
              </span>
            </div>

            {assistantReply && (
              <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-3.5 space-y-2 animate-fade-in">
                <div className="flex items-center space-x-1.5 text-xs text-purple-300 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Wingman Suggestion:</span>
                </div>
                <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
                  {assistantReply}
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      onSelectSuggestion(assistantReply, false);
                      onClose();
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center space-x-1"
                  >
                    <span>Insert into Chat</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleAskAssistant} className="mt-auto space-y-2 pt-2">
              <label className="block text-xs text-slate-400 font-medium">
                Ask anything (e.g. "How should I respond to them?", "Explain what API means"):
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Ask your private AI wingman..."
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!userQuery.trim() || isQuerying}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow"
                >
                  {isQuerying ? '...' : 'Ask'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800/60 text-center">
          <p className="text-[11px] text-slate-500">
            AI suggestions are optional and clearly demarcated. The conversation partner is always a real person.
          </p>
        </div>
      </div>
    </div>
  );
};
