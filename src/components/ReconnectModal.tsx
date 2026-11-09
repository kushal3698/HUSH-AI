import React, { useState } from 'react';
import { X, Sparkles, Link2, Copy, Check, Bookmark, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { chatService } from '../services/chatService';
import { VaultConnection } from '../types';

interface ReconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartReconnect: (code: string) => void;
  initialCode?: string;
}

export const ReconnectModal: React.FC<ReconnectModalProps> = ({
  isOpen,
  onClose,
  onStartReconnect,
  initialCode = ''
}) => {
  const [reconnectCode, setReconnectCode] = useState(initialCode);
  const [activeTab, setActiveTab] = useState<'code' | 'vault'>('code');
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedMyCode] = useState<string>(() => {
    return 'HUSH-' + Math.floor(100000 + Math.random() * 900000);
  });

  const vaultConnections: VaultConnection[] = chatService.getVaultConnections();

  if (!isOpen) return null;

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = reconnectCode.trim().toUpperCase();
    if (!clean) return;
    onStartReconnect(clean);
  };

  const handleCopyInviteLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hush-live-chat.vercel.app';
    const link = `${origin}?reconnect=${generatedMyCode}`;
    const text = `Hey! Connect with me on HUSH AI using this direct link: ${link} (or enter code: ${generatedMyCode})`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in perspective-1000">
      <div 
        className="w-full max-w-lg max-h-[92dvh] flex flex-col rounded-3xl bg-[#0c1224] border border-purple-500/40 shadow-2xl shadow-purple-950/60 overflow-hidden floating-screen-3d"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-purple-950/70 via-indigo-950/70 to-slate-900 border-b border-purple-500/20">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-900/60 text-purple-300 text-xs font-semibold mb-2 border border-purple-700/50">
            <Link2 className="w-3.5 h-3.5" />
            <span>Direct Reconnect Protocol</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Reconnect with Past Partners
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Wondering how to talk to someone again? Enter your shared code or tap a saved friend from your Vault to connect directly!
          </p>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setActiveTab('code')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'code'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-700/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Enter Reconnect Code</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'vault'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-700/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Identity Vault ({vaultConnections.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto">
          {activeTab === 'code' ? (
            <div className="space-y-5">
              {/* Code Entry Form */}
              <form onSubmit={handleSubmitCode} className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Enter Shared Room Reconnect Code:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reconnectCode}
                    onChange={(e) => setReconnectCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HUSH-842910"
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-900/90 border border-purple-500/40 text-white placeholder-slate-500 font-mono text-base font-bold focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 tracking-wider"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!reconnectCode.trim()}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-900/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 transition-all"
                  >
                    <span>Connect</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tip: Both you and your friend enter the exact same code to instantly join each other's private chat room.
                </p>
              </form>

              {/* Shareable Link Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/50 to-purple-950/40 border border-indigo-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Or share your personal invite link:</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800">
                    {generatedMyCode}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Send this link to a past contact on WhatsApp, Discord, or Instagram. When they open it, they will automatically pair with you!
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-colors"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Direct Reconnect Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReconnectCode(generatedMyCode);
                      onStartReconnect(generatedMyCode);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                  >
                    Wait in Room
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {vaultConnections.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-semibold text-slate-300">No Saved Contacts Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    During or after any chat, tap the <span className="text-purple-300 font-semibold">"Save Contact"</span> or <span className="text-purple-300 font-semibold">"Mutual Reveal"</span> buttons to save partners here with their direct reconnect codes!
                  </p>
                </div>
              ) : (
                vaultConnections.map((conn) => (
                  <div
                    key={conn.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{conn.strangerAlias}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                          {conn.reconnectCode}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        {conn.city && (
                          <span className="flex items-center space-x-0.5 text-cyan-300">
                            <MapPin className="w-3 h-3 inline" />
                            <span>{conn.city}</span>
                          </span>
                        )}
                        {conn.age && <span>• {conn.age} yrs</span>}
                        {conn.gender && <span>• {conn.gender}</span>}
                        <span>• Saved {new Date(conn.savedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onStartReconnect(conn.reconnectCode)}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1 shadow-md transition-colors"
                    >
                      <span>⚡ Reconnect</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Privacy Note */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Encrypted ephemeral matching. Neither user's phone or email is ever revealed.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
