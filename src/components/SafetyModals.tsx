import React, { useState } from 'react';
import { Shield, ShieldAlert, UserX, CheckCircle2, X, Trash2, Calendar, Share2, Check, BookmarkCheck } from 'lucide-react';
import { ReportReason, UserSession, VaultConnection } from '../types';
import { chatService } from '../services/chatService';

/* =========================================================================
   REPORT MODAL
   ========================================================================= */
interface ReportModalProps {
  isOpen: boolean;
  strangerAlias: string;
  onClose: () => void;
  onSubmitReport: (reason: ReportReason, details: string) => void;
}

const REPORT_REASONS: { id: ReportReason; label: string; desc: string }[] = [
  { id: 'harassment', label: 'Harassment or Hate Speech', desc: 'Bullying, threats, targeted insults or offensive slurs' },
  { id: 'inappropriate_content', label: 'Explicit or Inappropriate Content', desc: 'Unsolicited adult or NSFW text/links' },
  { id: 'spam_or_bot', label: 'Spam, Links, or Bot Behavior', desc: 'Repetitive advertising, phishing links, or scripted bots' },
  { id: 'underage_user', label: 'Underage User (<18)', desc: 'User indicates they are under the age of 18' },
  { id: 'privacy_violation', label: 'Doxxing or Sharing Private Info', desc: 'Attempting to leak or demand real-world identities' },
  { id: 'other', label: 'Other Safety Concern', desc: 'Any other safety or security violation' }
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  strangerAlias,
  onClose,
  onSubmitReport,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('harassment');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onSubmitReport(selectedReason, details);
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-[#0f172a] border border-rose-500/40 rounded-3xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Report {strangerAlias}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-white">Report Submitted</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Thank you for keeping HUSH AI safe. This participant has been blocked from your queue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-300">
              Select the primary reason for reporting this conversation. Our team takes abuse seriously.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedReason === r.id
                      ? 'bg-rose-950/30 border-rose-500/60 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.id}
                    checked={selectedReason === r.id}
                    onChange={() => setSelectedReason(r.id)}
                    className="mt-1 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="ml-3">
                    <span className="block text-xs font-semibold">{r.label}</span>
                    <span className="block text-[11px] text-slate-400">{r.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Additional context (optional):
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what occurred..."
                className="w-full h-16 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
              >
                Submit & Block
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};


/* =========================================================================
   BLOCK CONFIRMATION MODAL
   ========================================================================= */
interface BlockModalProps {
  isOpen: boolean;
  strangerAlias: string;
  onClose: () => void;
  onConfirmBlock: () => void;
}

export const BlockModal: React.FC<BlockModalProps> = ({
  isOpen,
  strangerAlias,
  onClose,
  onConfirmBlock,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="w-full max-w-sm bg-[#0f172a] border border-amber-500/40 rounded-3xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 text-amber-400">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Block Stranger?</h3>
            <p className="text-xs text-slate-400">Prevent future connections</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Are you sure you want to block <span className="font-semibold text-white">{strangerAlias}</span>? 
          The conversation will end immediately and you will never be matched with this session again.
        </p>

        <div className="flex items-center space-x-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirmBlock}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30"
          >
            Block & Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};


/* =========================================================================
   SETTINGS & PRIVACY MODAL
   ========================================================================= */
interface SettingsModalProps {
  isOpen: boolean;
  session: UserSession;
  onClose: () => void;
  onResetSession: () => void;
  initialTab?: 'settings' | 'vault' | 'sessions' | 'privacy' | 'guidelines';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  session,
  onClose,
  onResetSession,
  initialTab = 'settings'
}) => {
  const [tab, setTab] = useState<'settings' | 'vault' | 'sessions' | 'privacy' | 'guidelines'>(initialTab);
  const [copied, setCopied] = useState(false);
  const [vaultList, setVaultList] = useState<VaultConnection[]>(() => chatService.getVaultConnections());

  if (!isOpen) return null;

  const handleShareApp = async () => {
    const shareData = {
      title: 'HUSH AI — Anonymous Chat for College & Careers',
      text: '🚀 Try HUSH AI with me! An anonymous chat app for college students & young adults. Real people only, no bots. Chat here:',
      url: window.location.origin
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDeleteVaultConn = (id: string) => {
    chatService.removeVaultConnection(id);
    setVaultList(chatService.getVaultConnections());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#0e152e] border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-purple-400">
            <Shield className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">HUSH AI Safety & Privacy</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 bg-slate-900 rounded-xl text-xs font-medium overflow-x-auto scrollbar-none">
          <button
            onClick={() => setTab('settings')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              tab === 'settings' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Session
          </button>
          <button
            onClick={() => setTab('vault')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              tab === 'vault' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vault ({vaultList.length})
          </button>
          <button
            onClick={() => setTab('sessions')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              tab === 'sessions' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setTab('privacy')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              tab === 'privacy' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Privacy
          </button>
          <button
            onClick={() => setTab('guidelines')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              tab === 'guidelines' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Rules
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 text-xs text-slate-300 space-y-4">
          {tab === 'settings' && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Your Anonymous Alias:</span>
                  <span className="font-mono font-semibold text-purple-300">{session.anonymousAlias}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Session ID:</span>
                  <span className="font-mono text-[10px] text-slate-500">{session.userId.substring(0, 16)}...</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Chats Started:</span>
                  <span className="font-bold text-white">{session.totalChatsCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Blocked Strangers:</span>
                  <span className="font-medium text-amber-400">{session.blockedUserIds.length}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-2">
                <h4 className="font-semibold text-rose-300 flex items-center space-x-1.5">
                  <Trash2 className="w-4 h-4" />
                  <span>Reset Anonymous Session</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Permanently clears your local identifiers, reset your blocked list, and generates a fresh anonymous persona.
                </p>
                <button
                  onClick={() => {
                    onResetSession();
                    onClose();
                  }}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-semibold text-xs transition-colors"
                >
                  Reset Session Data
                </button>
              </div>
            </div>
          )}

          {tab === 'vault' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center space-x-1.5">
                    <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                    <span>Identity Vault</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Saved anonymous connections with private reconnect codes.
                  </p>
                </div>
              </div>

              {vaultList.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                  <BookmarkCheck className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">No saved connections yet</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    During a great chat, tap "Save Connection" in the header to bookmark a partner with a secret reconnect key!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {vaultList.map((conn) => (
                    <div
                      key={conn.id}
                      className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-xs">{conn.strangerAlias}</span>
                          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                            {conn.moodId}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-400">
                          <span>Code:</span>
                          <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                            {conn.reconnectCode}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteVaultConn(conn.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Delete saved connection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'sessions' && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-purple-300">
                  <Calendar className="w-4 h-4" />
                  <h4 className="font-bold text-white text-sm">Weekly Community Chat Schedule</h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  To ensure you find people to talk to right away, join during these peak hours when students and young adults gather online:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/30">
                    <span className="font-semibold text-white">Monday (7:00 – 8:00 PM IST)</span>
                    <span className="text-purple-300">Career & Placement Prep</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <span className="font-semibold text-white">Wednesday (7:00 – 8:00 PM IST)</span>
                    <span className="text-indigo-300">Tech & College Banter</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <span className="font-semibold text-white">Friday (7:00 – 8:00 PM IST)</span>
                    <span className="text-pink-300">Casual & Weekend Vibes</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <span className="font-semibold text-white">Sunday (6:00 – 8:00 PM IST)</span>
                    <span className="text-cyan-300">Open Community Night</span>
                  </div>
                </div>
              </div>

              {/* Share Card */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-2.5">
                <h4 className="font-semibold text-white text-xs flex items-center space-x-1.5">
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span>Invite Friends to Next Session</span>
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Share HUSH AI with your college group or friends so more real people are available to chat.
                </p>
                <button
                  onClick={handleShareApp}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Invite Copied!' : 'Share Invite Link on WhatsApp'}</span>
                </button>
              </div>
            </div>
          )}

          {tab === 'privacy' && (
            <div className="space-y-3 leading-relaxed">
              <h4 className="font-bold text-white text-sm">Privacy & Data Retention Policy</h4>
              <p>
                <strong>1. Zero Permanent Chat Storage:</strong> HUSH AI does not maintain permanent archives of your direct chats. When you or your conversation partner ends a chat room, the conversation buffer is deleted.
              </p>
              <p>
                <strong>2. No PII Collection:</strong> We do not require, collect, or store your real name, phone number, physical address, or contact list.
              </p>
              <p>
                <strong>3. Client-Side AI Suggestions:</strong> Topic icebreakers are computed locally on your device or via temporary stateless calls to Google Gemini. Your chats are never sold or trained on.
              </p>
              <p>
                <strong>4. Abuse Reports:</strong> If a user reports abusive behavior, only recent message context submitted with the report is retained temporarily for moderation compliance.
              </p>
            </div>
          )}

          {tab === 'guidelines' && (
            <div className="space-y-3 leading-relaxed">
              <h4 className="font-bold text-white text-sm">Community Guidelines</h4>
              <ul className="space-y-2 list-disc list-inside text-slate-300">
                <li><strong>Age Restriction:</strong> HUSH AI is strictly for users 18 years of age or older.</li>
                <li><strong>Be Respectful:</strong> No harassment, hate speech, threats, or stalking. Treat strangers with dignity.</li>
                <li><strong>No Inappropriate or NSFW Links:</strong> Do not post sexually explicit links, illegal material, or automated spam bots.</li>
                <li><strong>Protect Privacy:</strong> Do not ask for, share, or demand real names, financial details, or social accounts.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
