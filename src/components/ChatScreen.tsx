import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  UserX, 
  Flag, 
  X, 
  RotateCw, 
  Info, 
  ArrowRight, 
  Globe, 
  Share2, 
  Gamepad2, 
  BookmarkCheck, 
  LifeBuoy, 
  Check, 
  CheckCheck, 
  HeartHandshake, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Video as VideoIcon, 
  Phone, 
  Mic, 
  Paperclip, 
  StopCircle, 
  PartyPopper,
  Copy,
  MapPin,
  Calendar,
  Users,
  Link2,
  Crown,
  RotateCcw,
  MoreVertical
} from 'lucide-react';
import { 
  ChatMessage, 
  ChatRoom, 
  MiniGameData, 
  VaultConnection, 
  RevealProfile, 
  RevealRequestPayload, 
  MediaAttachment, 
  ConversationProgress, 
  CallType, 
  CallState 
} from '../types';
import { chatService } from '../services/chatService';
import { aiService } from '../services/aiService';
import { gameService } from '../services/gameService';
import { MiniGameCard } from './MiniGameCard';
import { MutualRevealModal } from './MutualRevealModal';
import { LockedFeatureModal } from './LockedFeatureModal';
import { CallModal } from './CallModal';

interface ChatScreenProps {
  room: ChatRoom;
  onNextPerson: () => void;
  onEndChat: () => void;
  onOpenReport: () => void;
  onOpenBlock: () => void;
  onOpenAiStarter: () => void;
  pendingAiText?: string | null;
  onClearPendingAiText?: () => void;
  onOpenVip?: () => void;
  onRewind?: (code: string) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  room,
  onNextPerson,
  onEndChat,
  onOpenReport,
  onOpenBlock,
  onOpenAiStarter,
  pendingAiText,
  onClearPendingAiText,
  onOpenVip,
  onRewind,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStrangerTyping, setIsStrangerTyping] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(false);
  const [endReason, setEndReason] = useState<string>('Chat ended.');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  
  // Media & Call Threshold States
  const [progress, setProgress] = useState<ConversationProgress>({
    myMessageCount: 0,
    strangerMessageCount: 0,
    thresholdRequired: 10,
    mediaUnlocked: false
  });
  const [unlockedCelebration, setUnlockedCelebration] = useState(false);
  const [isLockedModalOpen, setIsLockedModalOpen] = useState(false);
  const [attemptedLockedFeature, setAttemptedLockedFeature] = useState<'media' | 'voice' | 'call_audio' | 'call_video' | null>(null);

  // Calling States
  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType>('audio');
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [strangerPresence, setStrangerPresence] = useState<'online' | 'offline'>('online');

  // Voice recording
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Game & Rescue states
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [showRescue, setShowRescue] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isConnectionSaved, setIsConnectionSaved] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showTopMenu, setShowTopMenu] = useState(false);

  // Mutual Reveal states
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [pendingIncomingReveal, setPendingIncomingReveal] = useState<RevealRequestPayload | null>(null);
  const [revealedStrangerProfile, setRevealedStrangerProfile] = useState<RevealProfile | null>(null);
  const [myRevealedProfile, setMyRevealedProfile] = useState<RevealProfile | null>(null);

  const session = chatService.getUserSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingOfferRef = useRef<any>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<number | null>(null);

  // Message counts & Eligibility
  const messagesCount = {
    me: messages.filter((m) => m.sender === 'me').length,
    stranger: messages.filter((m) => m.sender === 'stranger').length
  };
  const isRevealEligible = messagesCount.me >= 3 && messagesCount.stranger >= 3;

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStrangerTyping, showRescue]);

  // Conversation Rescue Timer: 25s of inactivity triggers a gentle rescue prompt
  useEffect(() => {
    if (isChatEnded) return;

    const rescueInterval = setInterval(() => {
      if (Date.now() - lastActivity > 25000 && messages.length >= 2 && !showRescue) {
        setShowRescue(true);
      }
    }, 4000);

    return () => clearInterval(rescueInterval);
  }, [lastActivity, isChatEnded, messages.length, showRescue]);

  // Initial connection & event listeners
  useEffect(() => {
    setIsChatEnded(false);
    setIsConnectionSaved(false);
    setRevealedStrangerProfile(null);
    setMyRevealedProfile(null);
    setPendingIncomingReveal(null);
    setLastActivity(Date.now());

    const welcomeMsg: ChatMessage = {
      id: `sys_init_${Date.now()}`,
      sender: 'system',
      text: `Connected with a real person: ${room.strangerAlias} (${room.moodId}). Say hi! 👋`,
      timestamp: Date.now()
    };
    setMessages([welcomeMsg]);

    // Real incoming messages
    chatService.onMessage((newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }
        return [...prev, newMsg];
      });
      setStrangerPresence('online');
      setLastActivity(Date.now());
      setShowRescue(false);
      chatService.sendReadReceipt(newMsg.id);
    });

    // Real delivery confirmation
    chatService.onMessageDelivered((id) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, status: 'delivered' } : msg))
      );
    });

    // Real read receipt confirmation
    chatService.onMessageRead((id) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, status: 'read' } : msg))
      );
    });

    // Real typing indicator
    chatService.onTyping((typing) => {
      setIsStrangerTyping(typing);
      if (typing) {
        setStrangerPresence('online');
        setLastActivity(Date.now());
        setShowRescue(false);
      }
    });

    // Real-time Partner Presence (Online / Offline / Away)
    chatService.onPartnerStatus((status) => {
      setStrangerPresence(status);
    });

    // Real Game Launched by Partner
    chatService.onGameLaunched((gameData) => {
      setMessages((prev) => {
        const gameMsgId = `msg_game_${gameData.id}`;
        if (prev.some((m) => m.id === gameMsgId)) return prev;
        const gameMsg: ChatMessage = {
          id: gameMsgId,
          sender: 'stranger',
          text: `🎮 ${room.strangerAlias} launched a mini-game!`,
          timestamp: Date.now(),
          gameData
        };
        return [...prev, gameMsg];
      });
      setLastActivity(Date.now());
      setShowRescue(false);
    });

    // Real Game Voted
    chatService.onGameVoted(({ gameId, userId, choice }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.gameData && msg.gameData.id === gameId) {
            return {
              ...msg,
              gameData: {
                ...msg.gameData,
                votes: {
                  ...(msg.gameData.votes || {}),
                  [userId]: choice
                }
              }
            };
          }
          return msg;
        })
      );
      setLastActivity(Date.now());
    });

    // Real Mutual Reveal Requested
    chatService.onRevealRequested((payload) => {
      setPendingIncomingReveal(payload);
      setIsRevealModalOpen(true);
      setMessages((prev) => {
        const sysId = `sys_reveal_req_${payload.requestId}`;
        if (prev.some((m) => m.id === sysId)) return prev;
        return [
          ...prev,
          {
            id: sysId,
            sender: 'system',
            text: `🤝 ${room.strangerAlias} sent a Mutual Reveal request! Click 'Reveal Identity' to reciprocate.`,
            timestamp: Date.now()
          }
        ];
      });
    });

    // Real Mutual Reveal Responded
    chatService.onRevealResponded((payload) => {
      if (payload.accepted && payload.sharedProfile) {
        setRevealedStrangerProfile(payload.sharedProfile);
        setSaveToast(`🎉 Mutual Reveal Unlocked! You and ${room.strangerAlias} shared identities.`);
        setMessages((prev) => {
          const sysId = `sys_revealed_${payload.requestId}`;
          if (prev.some((m) => m.id === sysId)) return prev;
          return [
            ...prev,
            {
              id: sysId,
              sender: 'system',
              text: `🎉 Mutual Reveal Complete! You both consented to unlock real identities.`,
              timestamp: Date.now()
            }
          ];
        });
      } else {
        setSaveToast(`${room.strangerAlias} declined the reveal request.`);
      }
    });

    // Real Connection Offered
    chatService.onConnectionOffered(({ senderAlias, reconnectCode }) => {
      setSaveToast(`${senderAlias} offered to save this connection! Reconnect code: ${reconnectCode}`);
      setTimeout(() => setSaveToast(null), 5000);
    });

    // Partner Disconnected
    chatService.onPartnerLeft(() => {
      setIsChatEnded(true);
      setEndReason(`${room.strangerAlias} has left the conversation.`);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys_partner_left_${Date.now()}`,
          sender: 'system',
          text: `${room.strangerAlias} disconnected or skipped to the next person.`,
          timestamp: Date.now()
        }
      ]);
    });

    // Authoritative conversation progress updates
    chatService.onProgress((newProg) => {
      setProgress((prev) => {
        if (!prev.mediaUnlocked && newProg.mediaUnlocked) {
          setUnlockedCelebration(true);
          setSaveToast('🎉 Mutual threshold reached! Media sharing, voice notes, and calls are now unlocked!');
          setTimeout(() => {
            setSaveToast(null);
            setUnlockedCelebration(false);
          }, 5500);
        }
        return newProg;
      });
    });

    // Backend security rejection notifications
    chatService.onMediaRejected((err) => {
      setSaveToast(`🔒 ${err}`);
      setTimeout(() => setSaveToast(null), 5000);
      setAttemptedLockedFeature('media');
      setIsLockedModalOpen(true);
    });

    chatService.onCallRejected((err) => {
      setSaveToast(`🔒 ${err}`);
      setTimeout(() => setSaveToast(null), 5000);
      setIsCallModalOpen(false);
      setAttemptedLockedFeature('call_audio');
      setIsLockedModalOpen(true);
    });

    // WebRTC Call Signaling
    chatService.onCallSignal(async (signal) => {
      if (signal.signalType === 'offer') {
        setCallType(signal.callType);
        setCallState('incoming');
        setIsCallModalOpen(true);
        pendingOfferRef.current = signal.payload;
      } else if (signal.signalType === 'answer') {
        const pc = peerConnectionRef.current;
        if (pc && signal.payload && !signal.payload.simulated) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
            await flushPendingIceCandidates(pc);
          } catch (e) {
            console.warn('[WebRTC] Could not set remote description from answer:', e);
          }
        }
        setCallState('connected');
      } else if (signal.signalType === 'ice-candidate') {
        const pc = peerConnectionRef.current;
        if (signal.payload) {
          if (pc && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
            } catch (e) {
              console.warn('[WebRTC] Could not add live ICE candidate:', e);
            }
          } else {
            console.log('[WebRTC] Queuing candidate until remoteDescription is set');
            pendingIceCandidatesRef.current.push(signal.payload);
          }
        }
      } else if (signal.signalType === 'end' || signal.signalType === 'reject') {
        handleEndCallLocal();
      }
    });

    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      if (voiceStreamRef.current) {
        voiceStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      pendingIceCandidatesRef.current = [];
    };
  }, [room]);

  // Presence sync when user leaves website / switches tab
  useEffect(() => {
    const handleVisibility = () => {
      const status = document.visibilityState === 'visible' ? 'online' : 'offline';
      chatService.sendPresence(status);
    };

    const handleFocus = () => chatService.sendPresence('online');
    const handleBlur = () => chatService.sendPresence('offline');

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Announce online
    chatService.sendPresence('online');

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [room]);

  // Helper to flush queued ICE candidates once remoteDescription is set
  const flushPendingIceCandidates = async (pc: RTCPeerConnection) => {
    while (pendingIceCandidatesRef.current.length > 0) {
      const cand = pendingIceCandidatesRef.current.shift();
      if (cand) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
          console.log('[WebRTC] Flushed queued ICE candidate');
        } catch (e) {
          console.warn('[WebRTC] Could not add queued candidate:', e);
        }
      }
    }
  };

  // Calling & Signaling Actions with Robust STUN & Candidate Serialization
  const createPeerConnection = (type: CallType) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:stun.cloudflare.com:3478' }
        ],
        iceCandidatePoolSize: 10
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const payload = event.candidate.toJSON ? event.candidate.toJSON() : {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            usernameFragment: event.candidate.usernameFragment
          };
          chatService.sendCallSignal({
            signalType: 'ice-candidate',
            callType: type,
            payload
          });
        }
      };

      pc.ontrack = (event) => {
        console.log('[WebRTC] Track received:', event.track.kind, event.streams);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        } else {
          const newStream = new MediaStream([event.track]);
          setRemoteStream(newStream);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE Connection State:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setCallState('connected');
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    } catch (e) {
      console.error('[WebRTC] Failed to create RTCPeerConnection:', e);
      return null;
    }
  };

  const handleStartCall = async (type: CallType) => {
    if (!progress.mediaUnlocked) {
      setAttemptedLockedFeature(type === 'video' ? 'call_video' : 'call_audio');
      setIsLockedModalOpen(true);
      return;
    }

    pendingIceCandidatesRef.current = [];
    setIsMuted(false);
    setIsVideoOff(false);
    setCallType(type);
    setCallState('calling');
    setIsCallModalOpen(true);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: type === 'video'
        });
        // Ensure all audio tracks are active
        stream.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
        setLocalStream(stream);

        const pc = createPeerConnection(type);
        if (pc) {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          chatService.sendCallSignal({
            signalType: 'offer',
            callType: type,
            payload: offer
          });
          return;
        }
      }
    } catch (err) {
      console.warn('[WebRTC] Real camera/mic unavailable or prompt cancelled:', err);
    }

    // Graceful simulated call signaling for testing/environments without physical webcam
    chatService.sendCallSignal({
      signalType: 'offer',
      callType: type,
      payload: { simulated: true }
    });
  };

  const handleAcceptCall = async () => {
    setCallState('connected');
    setIsMuted(false);
    setIsVideoOff(false);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: callType === 'video'
        });
        stream.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
        setLocalStream(stream);

        const pc = createPeerConnection(callType);
        if (pc) {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          if (pendingOfferRef.current && !pendingOfferRef.current.simulated) {
            await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
            await flushPendingIceCandidates(pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            chatService.sendCallSignal({
              signalType: 'answer',
              callType,
              payload: answer
            });
            return;
          }
        }
      }
    } catch (err) {
      console.warn('[WebRTC] Real camera/mic unavailable on accept:', err);
    }

    chatService.sendCallSignal({
      signalType: 'answer',
      callType,
      payload: { simulated: true }
    });
  };

  const handleDeclineCall = () => {
    chatService.sendCallSignal({
      signalType: 'reject',
      callType
    });
    handleEndCallLocal();
  };

  const handleEndCall = () => {
    chatService.sendCallSignal({
      signalType: 'end',
      callType
    });
    handleEndCallLocal();
  };

  const handleEndCallLocal = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    pendingIceCandidatesRef.current = [];
    pendingOfferRef.current = null;
    setRemoteStream(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setCallState('ended');
    setTimeout(() => {
      setIsCallModalOpen(false);
      setCallState('idle');
    }, 800);
  };

  const handleToggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        return;
      }
    }
    setIsMuted((prev) => !prev);
  };

  const handleToggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        return;
      }
    }
    setIsVideoOff((prev) => !prev);
  };

  // Media Attachment & Voice Message Actions
  const handleAttachmentClick = () => {
    if (!progress.mediaUnlocked) {
      setAttemptedLockedFeature('media');
      setIsLockedModalOpen(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    const isImage = file.type.startsWith('image');
    if (!isVideo && !isImage) {
      alert('Please select an image or video file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const media: MediaAttachment = {
        type: isVideo ? 'video' : 'image',
        url: dataUrl,
        name: file.name,
        size: file.size
      };

      const msgId = chatService.sendMedia(media, inputText.trim());
      const myMsg: ChatMessage = {
        id: msgId || `media_${Date.now()}`,
        sender: 'me',
        text: inputText.trim(),
        timestamp: Date.now(),
        media,
        status: 'sent'
      };

      setMessages((prev) => [...prev, myMsg]);
      setInputText('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVoiceClick = () => {
    if (!progress.mediaUnlocked) {
      setAttemptedLockedFeature('voice');
      setIsLockedModalOpen(true);
      return;
    }

    if (isRecordingAudio) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const startVoiceRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        voiceStreamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onload = () => {
            const audioUrl = reader.result as string;
            const media: MediaAttachment = {
              type: 'audio',
              url: audioUrl,
              duration: recordingSeconds
            };
            const msgId = chatService.sendMedia(media);
            const myMsg: ChatMessage = {
              id: msgId || `audio_${Date.now()}`,
              sender: 'me',
              text: '🎤 Voice message',
              timestamp: Date.now(),
              media,
              status: 'sent'
            };
            setMessages((prev) => [...prev, myMsg]);
          };
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach((t) => t.stop());
        };

        mediaRecorder.start();
        setIsRecordingAudio(true);
        setRecordingSeconds(0);
        recordingTimerRef.current = window.setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
        return;
      }
    } catch (err) {
      console.warn('Microphone access unavailable:', err);
    }

    // Graceful simulated voice note fallback
    const simulatedMedia: MediaAttachment = {
      type: 'audio',
      url: 'https://actions.google.com/sounds/v1/human_voices/applause_moderate.ogg',
      duration: 3
    };
    const msgId = chatService.sendMedia(simulatedMedia);
    setMessages((prev) => [
      ...prev,
      {
        id: msgId || `audio_${Date.now()}`,
        sender: 'me',
        text: '🎤 Voice message (simulated)',
        timestamp: Date.now(),
        media: simulatedMedia,
        status: 'sent'
      }
    ]);
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingAudio(false);
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
    }
  };

  // Handle AI suggestion populate
  useEffect(() => {
    if (pendingAiText) {
      setInputText(pendingAiText);
      inputRef.current?.focus();
      onClearPendingAiText?.();
    }
  }, [pendingAiText, onClearPendingAiText]);

  const handleTranslate = async (msgId: string, text: string) => {
    if (translations[msgId]) return;
    try {
      const translated = await aiService.translateMessage(text);
      setTranslations((prev) => ({ ...prev, [msgId]: translated }));
    } catch {
      setTranslations((prev) => ({ ...prev, [msgId]: text }));
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'HUSH AI — Anonymous Chat',
      text: '🚀 Just had a great anonymous chat on HUSH AI! Real people only, no bots. Join now:',
      url: window.location.origin
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert("Invite link copied to clipboard!");
    }
  };

  // Launch Mini-Game
  const handleLaunchGame = (type: 'would_you_rather' | 'two_truths_lie') => {
    setIsGameMenuOpen(false);
    setShowRescue(false);
    setLastActivity(Date.now());

    const gameData: MiniGameData = 
      type === 'would_you_rather' 
        ? gameService.getRandomWouldYouRather() 
        : gameService.getRandomTwoTruths();

    const gameMsg: ChatMessage = {
      id: `msg_game_${gameData.id}`,
      sender: 'me',
      text: `🎮 You launched a mini-game: ${type === 'would_you_rather' ? 'Would You Rather?' : 'Two Truths & A Lie'}!`,
      timestamp: Date.now(),
      gameData
    };

    setMessages((prev) => [...prev, gameMsg]);
    chatService.launchGame(gameData);
  };

  // Vote on Mini-Game
  const handleVoteGame = (gameId: string, choice: string) => {
    setLastActivity(Date.now());
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.gameData && msg.gameData.id === gameId) {
          return {
            ...msg,
            gameData: {
              ...msg.gameData,
              votes: {
                ...(msg.gameData.votes || {}),
                [session.userId]: choice
              }
            }
          };
        }
        return msg;
      })
    );
    chatService.voteGame(gameId, choice);
  };

  // Save Connection (Vault)
  const handleSaveConnection = () => {
    const reconnectCode = room.reconnectCode || `HUSH-${Math.floor(100000 + Math.random() * 900000)}`;
    const conn: VaultConnection = {
      id: `conn_${Date.now()}`,
      strangerAlias: room.strangerAlias,
      strangerId: room.strangerId,
      moodId: room.moodId,
      reconnectCode,
      savedAt: Date.now(),
      city: room.strangerCity,
      age: room.strangerAge,
      gender: room.strangerGender
    };

    chatService.addVaultConnection(conn);
    chatService.saveConnectionOffer(reconnectCode);
    setIsConnectionSaved(true);
    setSaveToast(`Saved to your Identity Vault! Reconnect Code: ${reconnectCode}`);
    setTimeout(() => setSaveToast(null), 4000);
  };

  // Mutual Reveal Handlers
  const handleSendRevealRequest = (profile: RevealProfile, fields: Array<keyof RevealProfile>) => {
    setMyRevealedProfile(profile);
    const payload: RevealRequestPayload = {
      requestId: `rev_${Date.now()}`,
      senderAlias: session.anonymousAlias,
      sharedProfile: profile,
      requestedFields: fields
    };
    chatService.requestReveal(payload);
  };

  const handleRespondRevealRequest = (accepted: boolean, profile?: RevealProfile) => {
    if (accepted && profile && pendingIncomingReveal) {
      setMyRevealedProfile(profile);
      setRevealedStrangerProfile(pendingIncomingReveal.sharedProfile);
      chatService.respondReveal({
        requestId: pendingIncomingReveal.requestId,
        accepted: true,
        senderAlias: session.anonymousAlias,
        sharedProfile: profile
      });
      setSaveToast(`🎉 Mutual Reveal Unlocked! You and ${room.strangerAlias} shared identities.`);
      setPendingIncomingReveal(null);
    } else if (pendingIncomingReveal) {
      chatService.respondReveal({
        requestId: pendingIncomingReveal.requestId,
        accepted: false,
        senderAlias: session.anonymousAlias
      });
      setPendingIncomingReveal(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);

    if (!isChatEnded) {
      setLastActivity(Date.now());
      chatService.sendTyping(true);

      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = window.setTimeout(() => {
        chatService.sendTyping(false);
      }, 1500);
    }
  };

  const handleSendMessage = (textToSend?: string, isAi = false) => {
    const text = (textToSend || inputText).trim();
    if (!text || isChatEnded) return;

    const msgId = `msg_${Date.now()}_me`;
    const myMsg: ChatMessage = {
      id: msgId,
      sender: 'me',
      text,
      timestamp: Date.now(),
      isAiSuggested: isAi,
      status: 'sent'
    };

    setMessages((prev) => [...prev, myMsg]);
    setInputText('');
    setLastActivity(Date.now());
    setShowRescue(false);

    chatService.sendMessage(msgId, text, isAi);
    chatService.sendTyping(false);
  };

  const handleLeaveConversation = () => {
    if (room.reconnectCode) {
      chatService.setLastSkippedPartner({
        alias: room.strangerAlias,
        reconnectCode: room.reconnectCode,
        city: room.strangerCity,
        age: room.strangerAge,
        gender: room.strangerGender
      });
    }
    setIsChatEnded(true);
    setEndReason('You left the chat.');
    chatService.leaveChat();
    onEndChat();
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto w-full bg-[#080c18] sm:border-x sm:border-slate-800/80 relative">
      {/* Toast Banner for Vault Save & Threshold - Auto-dismisses within 5-6s */}
      {saveToast && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-indigo-950/95 border border-indigo-400 text-xs text-white shadow-2xl backdrop-blur-md flex items-center space-x-2.5 animate-fade-in max-w-md w-[92%] sm:w-auto">
          <BookmarkCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="flex-1 font-medium">{saveToast}</span>
          <button 
            onClick={() => setSaveToast(null)} 
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors ml-1"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Participant & Action Bar - Clean, Clear & Uncluttered */}
      <div className="glass-panel border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between z-20 relative">
        {/* Left: Stranger Identity & Persona */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-700 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-900/30">
              {room.strangerAlias.substring(0, 1)}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#080c18] transition-colors ${
              isChatEnded 
                ? 'bg-rose-500' 
                : strangerPresence === 'online' 
                  ? 'bg-emerald-500 animate-pulse' 
                  : 'bg-slate-500'
            }`}></span>
          </div>

          <div className="text-left">
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-white text-sm tracking-wide">
                {room.strangerAlias}
              </h2>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50">
                {room.moodId}
              </span>
              {room.strangerIsVip && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center space-x-1 shadow-sm">
                  <Crown className="w-3 h-3 text-amber-400 fill-current" />
                  <span>VIP</span>
                </span>
              )}
            </div>

            {/* Persona Badges: City • Age • Gender */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-300 mt-0.5">
              {room.strangerCity && (
                <span className="text-cyan-300 font-medium inline-flex items-center space-x-0.5">
                  <MapPin className="w-3 h-3 text-cyan-400 inline" />
                  <span>{room.strangerCity}</span>
                </span>
              )}
              {room.strangerCity && room.strangerAge && <span>•</span>}
              {room.strangerAge && (
                <span className="text-indigo-300 font-medium inline-flex items-center space-x-0.5">
                  <Calendar className="w-3 h-3 text-indigo-400 inline" />
                  <span>{room.strangerAge} yrs</span>
                </span>
              )}
              {(room.strangerCity || room.strangerAge) && room.strangerGender && <span>•</span>}
              {room.strangerGender && (
                <span className="text-pink-300 font-medium inline-flex items-center space-x-0.5">
                  <Users className="w-3 h-3 text-pink-400 inline" />
                  <span>{room.strangerGender}</span>
                </span>
              )}
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {isChatEnded ? (
                  <span className="text-rose-400 ml-1">Left</span>
                ) : isStrangerTyping ? (
                  <span className="text-purple-300 animate-pulse ml-1">typing...</span>
                ) : strangerPresence === 'online' ? (
                  <span className="text-emerald-400 ml-1 inline-flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Online</span>
                  </span>
                ) : (
                  <span className="text-slate-400 ml-1 inline-flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                    <span>Offline (Away)</span>
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Clean, Well-Spaced Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Reconnect Code Button */}
          {room.reconnectCode && !isChatEnded && (
            <button
              onClick={() => {
                const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hush-live-chat.vercel.app';
                const link = `${origin}?reconnect=${room.reconnectCode}`;
                navigator.clipboard.writeText(`Connect with me on HUSH AI: ${link} (Code: ${room.reconnectCode})`);
                setSaveToast(`Copied Reconnect Code: ${room.reconnectCode}`);
                setTimeout(() => setSaveToast(null), 5000);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-purple-500/40 bg-purple-950/70 hover:bg-purple-900 text-purple-200 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-sm"
              title="Copy Reconnect Code"
            >
              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{room.reconnectCode}</span>
              <Copy className="w-3 h-3 text-purple-400 opacity-70 hover:opacity-100" />
            </button>
          )}

          {/* Rewind if Chat Ended */}
          {isChatEnded && onRewind && (
            <button
              onClick={() => {
                const last = chatService.getLastSkippedPartner();
                if (last && onRewind) {
                  onRewind(last.reconnectCode);
                } else if (onOpenVip) {
                  onOpenVip();
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center space-x-1 transition-all"
              title="Rewind / Reconnect with previous partner"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Rewind</span>
            </button>
          )}

          {/* Quick Call Controls */}
          {!isChatEnded && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleStartCall('audio')}
                className={`p-2 rounded-xl border text-xs transition-colors ${
                  progress.mediaUnlocked
                    ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700/60'
                }`}
                title={progress.mediaUnlocked ? 'Audio Call' : 'Audio Call Locked (10 msgs each required)'}
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleStartCall('video')}
                className={`p-2 rounded-xl border text-xs transition-colors ${
                  progress.mediaUnlocked
                    ? 'bg-purple-950/80 hover:bg-purple-900 text-purple-300 border-purple-500/50'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700/60'
                }`}
                title={progress.mediaUnlocked ? 'Video Call' : 'Video Call Locked (10 msgs each required)'}
              >
                <VideoIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Next Stranger Button */}
          <button
            onClick={() => {
              if (room.reconnectCode) {
                chatService.setLastSkippedPartner({
                  alias: room.strangerAlias,
                  reconnectCode: room.reconnectCode,
                  city: room.strangerCity,
                  age: room.strangerAge,
                  gender: room.strangerGender
                });
              }
              chatService.leaveChat();
              onNextPerson();
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-bold flex items-center space-x-1 transition-all"
            title="Next Person"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Next</span>
          </button>

          {/* Leave Button */}
          {!isChatEnded ? (
            <button
              onClick={handleLeaveConversation}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950 text-slate-300 hover:text-rose-200 border border-slate-700/60 hover:border-rose-700 text-xs font-semibold flex items-center space-x-1 transition-all"
              title="Leave Chat"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          ) : (
            <button
              onClick={onNextPerson}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow flex items-center space-x-1 transition-all"
            >
              <span>New</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* More Options Dropdown for Secondary Tools */}
          <div className="relative">
            <button
              onClick={() => setShowTopMenu(!showTopMenu)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="More Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showTopMenu && (
              <div 
                className="absolute right-0 top-11 w-52 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-1.5 z-50 text-xs space-y-0.5 animate-scale-up"
                onClick={() => setShowTopMenu(false)}
              >
                {!isChatEnded && (
                  <button
                    onClick={() => setIsRevealModalOpen(true)}
                    className="w-full px-3.5 py-2 text-left hover:bg-purple-950/60 text-purple-200 flex items-center space-x-2"
                  >
                    <HeartHandshake className="w-4 h-4 text-pink-400" />
                    <span>Reveal Identity ({Math.min(messagesCount.me, 3)}/3)</span>
                  </button>
                )}

                {!isChatEnded && (
                  <button
                    onClick={handleSaveConnection}
                    className="w-full px-3.5 py-2 text-left hover:bg-indigo-950/60 text-slate-200 flex items-center space-x-2"
                  >
                    <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                    <span>{isConnectionSaved ? 'Saved to Vault' : 'Save Connection'}</span>
                  </button>
                )}

                <button
                  onClick={onOpenReport}
                  className="w-full px-3.5 py-2 text-left hover:bg-rose-950/60 text-rose-300 flex items-center space-x-2"
                >
                  <Flag className="w-4 h-4 text-rose-400" />
                  <span>Report User</span>
                </button>

                <button
                  onClick={onOpenBlock}
                  className="w-full px-3.5 py-2 text-left hover:bg-amber-950/60 text-amber-300 flex items-center space-x-2"
                >
                  <UserX className="w-4 h-4 text-amber-400" />
                  <span>Block User</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mutual Conversation Threshold Progress Banner - Compact & Clean */}
      {!isChatEnded && (
        <div className="px-4 py-2 bg-[#090e20] border-b border-slate-800/80">
          {!progress.mediaUnlocked ? (
            <div 
              onClick={() => {
                setAttemptedLockedFeature(null);
                setIsLockedModalOpen(true);
              }}
              className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-indigo-950/50 border border-purple-500/30 hover:border-purple-500/50 cursor-pointer transition-all shadow-sm space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Send 10 messages each to unlock media & calls</span>
                </span>
                <span className="text-[11px] font-mono text-purple-300 font-bold">
                  You: {Math.min(progress.myMessageCount, 10)}/10 • Partner: {Math.min(progress.strangerMessageCount, 10)}/10
                </span>
              </div>

              {/* Clean Single Slim Dual Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                <div 
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${Math.min((progress.myMessageCount / 10) * 50, 50)}%` }}
                />
                <div 
                  className="h-full bg-cyan-400 transition-all duration-300 ml-auto"
                  style={{ width: `${Math.min((progress.strangerMessageCount / 10) * 50, 50)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="w-full px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 animate-fade-in">
              <span className="flex items-center space-x-1.5">
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Media & Calls Unlocked!</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-200">10+ Exchanged ✓</span>
            </div>
          )}
        </div>
      )}

      {/* Unlocked Celebration Banner - Auto-dismisses within 5-6s */}
      {unlockedCelebration && (
        <div className="mx-4 my-2 p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-2xl flex items-center justify-between animate-bounce z-30">
          <div className="flex items-center space-x-2.5 text-xs font-bold">
            <PartyPopper className="w-5 h-5 flex-shrink-0" />
            <span>🎉 Milestone Reached! You both sent 10+ messages! Media sharing, voice notes, audio and video calls are unlocked!</span>
          </div>
          <button
            onClick={() => setUnlockedCelebration(false)}
            className="text-white/80 hover:text-white text-xs px-2 py-1 rounded-lg bg-black/20 ml-2 flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* Mutually Revealed Identities Banner */}
        {revealedStrangerProfile && (
          <div className="w-full my-3 p-4 rounded-3xl bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-pink-950/90 border border-pink-500/50 shadow-2xl animate-fade-in space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-pink-300 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Identities Mutually Revealed!</span>
              </div>
              <button
                onClick={handleSaveConnection}
                className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-1 shadow transition-colors"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Save Contact to Vault</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-black/40 p-3.5 rounded-2xl border border-white/5">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-purple-400 block">{room.strangerAlias}'s Shared Info</span>
                {revealedStrangerProfile.name && <p className="text-white font-semibold">Name: <span className="text-pink-200">{revealedStrangerProfile.name}</span></p>}
                {revealedStrangerProfile.socialHandle && <p className="text-white">Social: <span className="text-cyan-300 font-mono">{revealedStrangerProfile.socialHandle}</span></p>}
                {revealedStrangerProfile.cityOrCollege && <p className="text-white">City/College: <span className="text-slate-200">{revealedStrangerProfile.cityOrCollege}</span></p>}
                {revealedStrangerProfile.bio && <p className="text-slate-300 text-[11px] mt-1 italic">"{revealedStrangerProfile.bio}"</p>}
              </div>

              {myRevealedProfile && (
                <div className="border-t sm:border-t-0 sm:border-l sm:border-slate-800 sm:pl-3.5 pt-2 sm:pt-0 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block">Your Shared Info</span>
                  {myRevealedProfile.name && <p className="text-white font-semibold">Name: <span className="text-purple-200">{myRevealedProfile.name}</span></p>}
                  {myRevealedProfile.socialHandle && <p className="text-white">Social: <span className="text-cyan-300 font-mono">{myRevealedProfile.socialHandle}</span></p>}
                  {myRevealedProfile.cityOrCollege && <p className="text-white">City/College: <span className="text-slate-200">{myRevealedProfile.cityOrCollege}</span></p>}
                  {myRevealedProfile.bio && <p className="text-slate-300 text-[11px] mt-1 italic">"{myRevealedProfile.bio}"</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-1.5 shadow-sm">
                  <Info className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span>{msg.text}</span>
                </div>
              </div>
            );
          }

          const isMe = msg.sender === 'me';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[90%] sm:max-w-[80%] ${
                isMe ? 'ml-auto' : 'mr-auto'
              }`}
            >
              {/* Embedded Mini-Game Card if present */}
              {msg.gameData ? (
                <MiniGameCard
                  game={msg.gameData}
                  isMe={isMe}
                  currentUserId={session.userId}
                  onVote={handleVoteGame}
                />
              ) : (
                <div
                  className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-purple-900/20'
                      : 'bg-slate-900 text-slate-100 rounded-tl-none border border-slate-800 shadow-sm'
                  }`}
                >
                  {msg.isAiSuggested && (
                    <div className="flex items-center space-x-1 text-[10px] text-purple-200 font-semibold mb-1 opacity-90">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Starter</span>
                    </div>
                  )}

                  {/* Render Attached Media if present */}
                  {msg.media && (
                    <div className="mb-2 rounded-xl overflow-hidden">
                      {msg.media.type === 'image' && (
                        <img
                          src={msg.media.url}
                          alt="Shared attachment"
                          className="max-h-72 w-full object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => window.open(msg.media?.url, '_blank')}
                        />
                      )}
                      {msg.media.type === 'video' && (
                        <video
                          src={msg.media.url}
                          controls
                          playsInline
                          className="max-h-72 w-full rounded-xl bg-black"
                        />
                      )}
                      {msg.media.type === 'audio' && (
                        <div className="bg-black/40 p-2.5 rounded-xl border border-white/10 space-y-1">
                          <audio src={msg.media.url} controls className="w-full max-w-xs" />
                          {msg.media.duration && (
                            <span className="text-[10px] text-slate-400 block">
                              Voice message ({msg.media.duration}s)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                  {translations[msg.id] && (
                    <div className="mt-2 pt-1.5 border-t border-slate-700/60 text-xs text-cyan-300 flex items-start space-x-1.5 animate-fade-in">
                      <Globe className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{translations[msg.id]}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-1.5 mt-1 px-1">
                <span className="text-[10px] text-slate-500">
                  {formatTime(msg.timestamp)}
                </span>
                {isMe && !msg.gameData && (
                  <span className="inline-flex items-center ml-0.5" title={msg.status === 'read' ? 'Read' : msg.status === 'delivered' ? 'Delivered' : 'Sent'}>
                    {msg.status === 'read' ? (
                      <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                    ) : msg.status === 'delivered' ? (
                      <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </span>
                )}
                {!isMe && !msg.gameData && (
                  <button
                    onClick={() => handleTranslate(msg.id, msg.text)}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-medium inline-flex items-center space-x-1 transition-colors ml-1"
                    title="Translate message with AI"
                  >
                    <Globe className="w-2.5 h-2.5" />
                    <span>{translations[msg.id] ? 'Translated' : 'Translate'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Real Stranger Typing Indicator */}
        {isStrangerTyping && (
          <div className="flex items-start mr-auto max-w-[75%] animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-2xl rounded-tl-none flex items-center space-x-2">
              <span className="text-xs text-purple-300 font-medium">{room.strangerAlias} is typing</span>
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
              </span>
            </div>
          </div>
        )}

        {/* Conversation Rescue (Silence Breaker Banner) */}
        {showRescue && !isChatEnded && (
          <div className="w-full my-2 p-3 rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/70 to-slate-900 border border-purple-500/40 shadow-lg animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <LifeBuoy className="w-4 h-4 text-purple-400 flex-shrink-0 animate-spin" style={{ animationDuration: '8s' }} />
              <div>
                <span className="text-xs font-bold text-white block">Conversation slowing down?</span>
                <span className="text-[10px] text-purple-200">Break the ice with an unexpected conversation starter!</span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleLaunchGame('would_you_rather')}
                className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold flex items-center space-x-1"
              >
                <Gamepad2 className="w-3 h-3" />
                <span>Play Game</span>
              </button>
              <button
                onClick={onOpenAiStarter}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-semibold flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Icebreakers</span>
              </button>
              <button
                onClick={() => setShowRescue(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Disconnected / Ended Overlay Banner */}
      {isChatEnded && (
        <div className="bg-slate-900/90 border-t border-slate-800 p-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-400">
            {endReason} Messages vanish when you leave.
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShareApp}
              className="px-2.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 text-xs font-medium flex items-center space-x-1 transition-colors"
              title="Invite a friend"
            >
              <Share2 className="w-3 h-3" />
              <span>Invite Friend</span>
            </button>
            <button
              onClick={onEndChat}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Topics Menu
            </button>
            <button
              onClick={onNextPerson}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:from-purple-500 hover:to-indigo-500 transition-all"
            >
              Find Next Person 🎲
            </button>
          </div>
        </div>
      )}

      {/* Input / Composer Area */}
      {!isChatEnded && (
        <div className="glass-panel border-t border-slate-800/80 p-3 space-y-2 relative">
          {/* Game Menu Popup if open */}
          {isGameMenuOpen && (
            <div className="absolute bottom-16 left-3 bg-[#0f172a] border border-purple-500/40 rounded-2xl shadow-2xl p-3 z-30 space-y-2 w-64 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Gamepad2 className="w-4 h-4 text-purple-400" />
                  <span>Launch In-Chat Game</span>
                </span>
                <button onClick={() => setIsGameMenuOpen(false)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <button
                onClick={() => handleLaunchGame('would_you_rather')}
                className="w-full text-left p-2 rounded-xl bg-slate-900 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500/50 text-xs text-slate-200 hover:text-white flex items-center space-x-2 transition-colors"
              >
                <span className="text-base">🅰️</span>
                <div>
                  <span className="font-semibold block">Would You Rather?</span>
                  <span className="text-[10px] text-slate-400">Vote on crazy dilemmas together</span>
                </div>
              </button>
              <button
                onClick={() => handleLaunchGame('two_truths_lie')}
                className="w-full text-left p-2 rounded-xl bg-slate-900 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500/50 text-xs text-slate-200 hover:text-white flex items-center space-x-2 transition-colors"
              >
                <span className="text-base">🕵️‍♂️</span>
                <div>
                  <span className="font-semibold block">Two Truths & A Lie</span>
                  <span className="text-[10px] text-slate-400">Guess the fake statement</span>
                </div>
              </button>
            </div>
          )}

          {/* Quick AI Icebreaker & Game Launcher Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenAiStarter}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-950/80 to-indigo-950/80 hover:from-purple-900/80 hover:to-indigo-900/80 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-medium transition-all group shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>✨ AI Wingman</span>
              </button>

              <button
                onClick={() => setIsGameMenuOpen(!isGameMenuOpen)}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-medium transition-all"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>🎮 Play Game</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Press Enter to send
            </span>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            {/* Attachment Button */}
            <button
              type="button"
              onClick={handleAttachmentClick}
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all flex-shrink-0 ${
                progress.mediaUnlocked
                  ? 'bg-slate-900 hover:bg-purple-950/60 border-slate-700/60 text-purple-300 hover:text-white shadow-sm'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-400'
              }`}
              title={progress.mediaUnlocked ? 'Share photo or video' : 'Media locked (10 messages each)'}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Message Button */}
            <button
              type="button"
              onClick={handleVoiceClick}
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all flex-shrink-0 ${
                isRecordingAudio
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-lg shadow-rose-600/30'
                  : progress.mediaUnlocked
                  ? 'bg-slate-900 hover:bg-pink-950/60 border-slate-700/60 text-pink-300 hover:text-white shadow-sm'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-400'
              }`}
              title={
                isRecordingAudio 
                  ? 'Recording audio... click to finish and send' 
                  : progress.mediaUnlocked 
                  ? 'Record voice note' 
                  : 'Voice message locked (10 messages each)'
              }
            >
              {isRecordingAudio ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={
                  isRecordingAudio
                    ? `Recording voice message (${recordingSeconds}s)... click stop to send`
                    : `Message ${room.strangerAlias}...`
                }
                disabled={isRecordingAudio}
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-purple-500/60 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/40 transition-all disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isRecordingAudio}
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-lg shadow-purple-600/30 transition-all focus:outline-none flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Hidden File Input for Image/Video Attachments */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Locked Feature Explanation Modal */}
      <LockedFeatureModal
        isOpen={isLockedModalOpen}
        onClose={() => setIsLockedModalOpen(false)}
        progress={progress}
        strangerAlias={room.strangerAlias}
        attemptedFeature={attemptedLockedFeature}
      />

      {/* Audio & Video Call Modal */}
      <CallModal
        isOpen={isCallModalOpen}
        callState={callState}
        callType={callType}
        partnerAlias={room.strangerAlias}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
        onEndCall={handleEndCall}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
      />

      {/* Mutual Reveal Modal */}
      <MutualRevealModal
        isOpen={isRevealModalOpen}
        onClose={() => setIsRevealModalOpen(false)}
        strangerAlias={room.strangerAlias}
        isEligible={isRevealEligible}
        messagesCount={messagesCount}
        pendingIncomingRequest={pendingIncomingReveal}
        onSendRequest={handleSendRevealRequest}
        onRespondRequest={handleRespondRevealRequest}
      />

      {/* Global Fallback Remote Audio Output for Active WebRTC Voice Calls */}
      {remoteStream && (
        <audio
          ref={(node) => {
            if (node && node.srcObject !== remoteStream) {
              node.srcObject = remoteStream;
              node.play().catch((err) => console.warn('[ChatScreen] Remote audio autoplay error:', err));
            }
          }}
          autoPlay
          playsInline
          className="hidden"
        />
      )}
    </div>
  );
};
