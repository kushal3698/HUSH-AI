import React, { useState } from 'react';
import { ShieldCheck, UserCheck, HeartHandshake, X, Lock, CheckCircle2 } from 'lucide-react';
import { RevealProfile, RevealRequestPayload } from '../types';

interface MutualRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  strangerAlias: string;
  isEligible: boolean;
  messagesCount: { me: number; stranger: number };
  pendingIncomingRequest: RevealRequestPayload | null;
  onSendRequest: (profile: RevealProfile, fields: Array<keyof RevealProfile>) => void;
  onRespondRequest: (accepted: boolean, profile?: RevealProfile) => void;
}

export const MutualRevealModal: React.FC<MutualRevealModalProps> = ({
  isOpen,
  onClose,
  strangerAlias,
  isEligible,
  messagesCount,
  pendingIncomingRequest,
  onSendRequest,
  onRespondRequest,
}) => {
  const [name, setName] = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [cityOrCollege, setCityOrCollege] = useState('');
  const [bio, setBio] = useState('');
  const [sentRequest, setSentRequest] = useState(false);

  if (!isOpen) return null;

  const handleSubmitSend = (e: React.FormEvent) => {
    e.preventDefault();
    const profile: RevealProfile = {
      name: name.trim() || undefined,
      socialHandle: socialHandle.trim() || undefined,
      cityOrCollege: cityOrCollege.trim() || undefined,
      bio: bio.trim() || undefined,
    };

    const fields: Array<keyof RevealProfile> = [];
    if (profile.name) fields.push('name');
    if (profile.socialHandle) fields.push('socialHandle');
    if (profile.cityOrCollege) fields.push('cityOrCollege');
    if (profile.bio) fields.push('bio');

    if (fields.length === 0) {
      alert('Please fill in at least one detail to share.');
      return;
    }

    onSendRequest(profile, fields);
    setSentRequest(true);
  };

  const handleAcceptIncoming = (e: React.FormEvent) => {
    e.preventDefault();
    const profile: RevealProfile = {
      name: name.trim() || undefined,
      socialHandle: socialHandle.trim() || undefined,
      cityOrCollege: cityOrCollege.trim() || undefined,
      bio: bio.trim() || undefined,
    };

    onRespondRequest(true, profile);
    onClose();
  };

  const handleDeclineIncoming = () => {
    onRespondRequest(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b1120] border border-purple-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/60 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">Mutual Reveal Protocol</h3>
            <p className="text-xs text-purple-300">Connect anonymously, reveal selectively</p>
          </div>
        </div>

        {/* Condition 1: Not Eligible Yet */}
        {!isEligible && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/50 text-slate-300 text-xs leading-relaxed space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold">
                <Lock className="w-4 h-4" />
                <span>Eligibility Threshold Locked</span>
              </div>
              <p>
                To preserve your anonymity and safety, Mutual Reveal requires both participants to have exchanged at least <strong>3 messages each</strong> before trading identities.
              </p>
              <div className="pt-2 flex justify-between text-[11px] text-slate-400 border-t border-purple-900/60">
                <span>Your messages: <strong className="text-white">{messagesCount.me}/3</strong></span>
                <span>{strangerAlias}'s messages: <strong className="text-white">{messagesCount.stranger}/3</strong></span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Why this exists:</p>
              <p>• Prevents spam bots and immediate unsolicited contact requests.</p>
              <p>• Ensures a genuine conversation vibe before sharing socials.</p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
            >
              Keep Chatting
            </button>
          </div>
        )}

        {/* Condition 2: Incoming Request from Partner */}
        {isEligible && pendingIncomingRequest && (
          <form onSubmit={handleAcceptIncoming} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 text-xs text-indigo-200 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{strangerAlias} offered to reveal identities!</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                They have submitted their details. If you reciprocate below, both of your contact details will be unlocked simultaneously!
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {pendingIncomingRequest.requestedFields.map((field) => (
                  <span
                    key={field}
                    className="px-2 py-0.5 rounded-lg bg-indigo-900/80 text-cyan-300 text-[10px] font-medium uppercase border border-indigo-700/50"
                  >
                    ✓ {field === 'socialHandle' ? 'Instagram/Social' : field === 'cityOrCollege' ? 'City/College' : field}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-white">Your details to share back:</p>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Your Name / Nickname</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Instagram or Social Handle</label>
                <input
                  type="text"
                  value={socialHandle}
                  onChange={(e) => setSocialHandle(e.target.value)}
                  placeholder="e.g. @alex_dev or snap: alex"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">City or College / University</label>
                <input
                  type="text"
                  value={cityOrCollege}
                  onChange={(e) => setCityOrCollege(e.target.value)}
                  placeholder="e.g. Mumbai / IIT Bombay"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Bio or Interests</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Web developer, loves anime & gaming"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={handleDeclineIncoming}
                className="w-1/2 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Decline Politely
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Accept & Reveal</span>
              </button>
            </div>
          </form>
        )}

        {/* Condition 3: Send New Request to Stranger */}
        {isEligible && !pendingIncomingRequest && (
          sentRequest ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500/50 mx-auto flex items-center justify-center text-emerald-400 animate-pulse">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-white">Reveal Request Sent!</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                We notified {strangerAlias}. As soon as they accept and share their details, both profiles will be revealed in chat!
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-5 py-2 rounded-xl bg-slate-800 text-white text-xs hover:bg-slate-700 transition-colors"
              >
                Back to Chat
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitSend} className="space-y-4">
              <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Zero Asymmetric Risk:</strong> {strangerAlias} cannot see anything you enter here until they consent and agree to reveal their own details in return.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Your First Name / Nickname</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rohan"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Social Handle (Instagram / LinkedIn / X)</label>
                  <input
                    type="text"
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value)}
                    placeholder="e.g. @rohan_tech"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">City or College</label>
                  <input
                    type="text"
                    value={cityOrCollege}
                    onChange={(e) => setCityOrCollege(e.target.value)}
                    placeholder="e.g. Delhi University / Bangalore"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Short Bio</label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Tech enthusiast, building AI tools"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Send Mutual Reveal Request 🤝</span>
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
};