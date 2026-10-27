import React, { useEffect, useState, useRef } from 'react';
import { 
  PhoneOff, 
  PhoneCall, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  ShieldCheck 
} from 'lucide-react';
import { CallType, CallState } from '../types';

interface CallModalProps {
  isOpen: boolean;
  callState: CallState;
  callType: CallType;
  partnerAlias: string;
  onAccept: () => void;
  onDecline: () => void;
  onEndCall: () => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  callState,
  callType,
  partnerAlias,
  onAccept,
  onDecline,
  onEndCall,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let timer: number;
    if (callState === 'connected') {
      timer = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  if (!isOpen || callState === 'idle') return null;

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in">
      <div className="w-full max-w-lg bg-[#090d1a] border border-indigo-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center relative text-white">
        {/* Top Header */}
        <div className="w-full px-5 py-3.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">
              {callType === 'video' ? 'HUSH Video Call' : 'HUSH Encrypted Voice'}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Peer-to-Peer</span>
          </div>
        </div>

        {/* Call Body */}
        <div className="w-full min-h-[340px] flex flex-col items-center justify-center p-6 relative">
          {/* Connected Video View */}
          {callState === 'connected' && callType === 'video' ? (
            <div className="w-full h-80 relative rounded-2xl overflow-hidden bg-black border border-slate-800">
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {!remoteStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-700 flex items-center justify-center text-2xl font-bold mb-2">
                    {partnerAlias.substring(0, 1)}
                  </div>
                  <span className="text-sm font-semibold">{partnerAlias}</span>
                  <span className="text-xs text-slate-400 mt-1">Connecting video feed...</span>
                </div>
              )}

              {/* Local PiP Video */}
              <div className="absolute bottom-3 right-3 w-28 h-36 rounded-xl overflow-hidden border-2 border-indigo-500 shadow-xl bg-slate-900">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-[10px] text-slate-400">
                    <VideoOff className="w-5 h-5 mb-1 text-slate-500" />
                    <span>Camera Off</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Audio Call / Ringing / Incoming View */
            <div className="flex flex-col items-center space-y-4 my-auto">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-3xl font-bold shadow-2xl">
                  {partnerAlias.substring(0, 1)}
                </div>
                {callState === 'calling' && (
                  <span className="absolute -inset-2 rounded-full border-2 border-purple-500/50 animate-ping pointer-events-none" />
                )}
                {callState === 'incoming' && (
                  <span className="absolute -inset-3 rounded-full border-2 border-emerald-500/60 animate-ping pointer-events-none" />
                )}
              </div>

              <div className="text-center space-y-1">
                <h4 className="text-lg font-bold text-white tracking-wide">
                  {partnerAlias}
                </h4>
                <p className="text-xs text-purple-300 font-medium">
                  {callState === 'incoming' && (
                    <span>Incoming {callType === 'video' ? 'Video' : 'Audio'} Call...</span>
                  )}
                  {callState === 'calling' && (
                    <span className="animate-pulse">Calling {partnerAlias}...</span>
                  )}
                  {callState === 'connected' && (
                    <span className="text-emerald-400 font-mono font-bold">
                      Connected • {formatDuration(callDuration)}
                    </span>
                  )}
                  {callState === 'ended' && (
                    <span className="text-rose-400">Call Ended</span>
                  )}
                </p>
              </div>

              {callState === 'connected' && callType === 'audio' && (
                <div className="flex items-center space-x-1 py-2">
                  <div className="w-1.5 h-6 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-10 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-12 bg-cyan-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-8 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls Bar */}
        <div className="w-full px-6 py-4 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-center space-x-4">
          {callState === 'incoming' ? (
            /* Incoming Actions: Decline & Accept */
            <div className="flex items-center space-x-8">
              <button
                onClick={onDecline}
                className="flex flex-col items-center space-y-1.5 group"
              >
                <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-transform group-hover:scale-105">
                  <PhoneOff className="w-6 h-6" />
                </div>
                <span className="text-xs text-rose-300 font-medium">Decline</span>
              </button>

              <button
                onClick={onAccept}
                className="flex flex-col items-center space-y-1.5 group"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-transform group-hover:scale-105 animate-pulse">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <span className="text-xs text-emerald-300 font-medium">Accept</span>
              </button>
            </div>
          ) : callState === 'calling' ? (
            /* Calling Actions: Cancel */
            <button
              onClick={onEndCall}
              className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-rose-600/30 transition-all"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Cancel Call</span>
            </button>
          ) : callState === 'connected' ? (
            /* Connected Actions: Mute, Video, End */
            <div className="flex items-center space-x-4">
              <button
                onClick={onToggleMute}
                className={`p-3.5 rounded-full border transition-all ${
                  isMuted 
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300' 
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {callType === 'video' && (
                <button
                  onClick={onToggleVideo}
                  className={`p-3.5 rounded-full border transition-all ${
                    isVideoOff 
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300' 
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                  }`}
                  title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              <button
                onClick={onEndCall}
                className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-rose-600/30 transition-all"
                title="Hang Up"
              >
                <PhoneOff className="w-5 h-5" />
                <span>End Call</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onEndCall}
              className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
