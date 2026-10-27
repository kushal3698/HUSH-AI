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
  UserCheck,
  Globe,
  Share2,
  Gamepad2,
  BookmarkCheck,
  LifeBuoy,
  Check,
  CheckCheck,
  HeartHandshake,
  ShieldCheck
} from 'lucide-react';
import { 
  ChatMessage, 
  ChatRoom, 
  MiniGameData, 
  VaultConnection,
  RevealProfile,
  RevealRequestPayload
} from '../types';
import { chatService } from '../services/chatService';
import { aiService } from '../services/aiService';
import { gameService } from '../services/gameService';
import { MiniGameCard } from './MiniGameCard';
import { MutualRevealModal } from './MutualRevealModal';

interface ChatScreenProps {
  room: ChatRoom;
  onNextPerson: () => void;
  onEndChat: () => void;
  onOpenReport: () => void;
  onOpenBlock: () => void;
  onOpenAiStarter: () => void;
  pendingAiText?: string | null;
  onClearPendingAiText?: () => void;
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
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStrangerTyping, setIsStrangerTyping] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(false);
  const [endReason, setEndReason] = useState<string>('Chat ended.');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  
  // Game & Rescue states
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [showRescue, setShowRescue] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isConnectionSaved, setIsConnectionSaved] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Mutual Reveal states
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [pendingIncomingReveal, setPendingIncomingReveal] = useState<RevealRequestPayload | null>(null);
  const [revealedStrangerProfile, setRevealedStrangerProfile] = useState<RevealProfile | null>(null);
  const [myRevealedProfile, setMyRevealedProfile] = useState<RevealProfile | null>(null);

  const session = chatService.getUserSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

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
        setLastActivity(Date.now());
        setShowRescue(false);
      }
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

    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [room]);

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
    const reconnectCode = `HUSH-${Math.floor(1000 + Math.random() * 9000)}`;
    const conn: VaultConnection = {
      id: `conn_${Date.now()}`,
      strangerAlias: room.strangerAlias,
      strangerId: room.strangerId,
      moodId: room.moodId,
      reconnectCode,
      savedAt: Date.now()
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
      {/* Toast Banner for Vault Save */}
      {saveToast && (
        <div className="absolute top-14 left-1/2 transform -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-indigo-950/95 border border-indigo-400 text-xs text-white shadow-2xl backdrop-blur-md flex items-center space-x-2 animate-fade-in">
          <BookmarkCheck className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Participant & Action Bar */}
      <div className="glass-panel border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-900/30">
              {room.strangerAlias.substring(0, 1)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#080c18]"></span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-white text-sm tracking-wide">
                {room.strangerAlias}
              </h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/40">
                {room.moodId}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isChatEnded ? (
                <span className="text-rose-400">{endReason}</span>
              ) : isStrangerTyping ? (
                <span className="text-purple-300 animate-pulse font-medium">Stranger is typing...</span>
              ) : (
                <span className="text-emerald-400 flex items-center space-x-1">
                  <UserCheck className="w-3 h-3 inline" />
                  <span>Real person connected</span>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Mutual Reveal Protocol */}
          {!isChatEnded && (
            <button
              onClick={() => setIsRevealModalOpen(true)}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-medium flex items-center space-x-1.5 transition-all ${
                revealedStrangerProfile
                  ? 'bg-gradient-to-r from-pink-950/80 to-purple-950/80 border-pink-500/50 text-pink-300'
                  : isRevealEligible
                  ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border-purple-500/50 text-purple-300 hover:text-white animate-pulse'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-300'
              }`}
              title={
                revealedStrangerProfile
                  ? 'Identities Revealed'
                  : isRevealEligible
                  ? 'Mutual Reveal Unlocked! (3+ msgs exchanged)'
                  : `Mutual Reveal Locked (${messagesCount.me}/3 msgs sent)`
              }
            >
              <HeartHandshake className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden md:inline">
                {revealedStrangerProfile ? 'Revealed' : 'Reveal Identity'}
              </span>
              {!revealedStrangerProfile && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700">
                  {isRevealEligible ? '🤝 Unlock' : `${Math.min(messagesCount.me, 3)}/3`}
                </span>
              )}
            </button>
          )}

          {/* Save Connection / Vault Handshake */}
          {!isChatEnded && (
            <button
              onClick={handleSaveConnection}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-medium flex items-center space-x-1 transition-colors ${
                isConnectionSaved
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800/60 hover:bg-indigo-950/60 text-slate-300 hover:text-white border-slate-700/60'
              }`}
              title="Save connection anonymously to Vault"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isConnectionSaved ? 'Saved' : 'Save Connection'}</span>
            </button>
          )}

          {/* Next Stranger */}
          <button
            onClick={() => {
              chatService.leaveChat();
              onNextPerson();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            title="Skip to next person"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Next</span>
          </button>

          {/* End Chat */}
          {!isChatEnded ? (
            <button
              onClick={handleLeaveConversation}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/60 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700/60 hover:border-rose-800 text-xs font-medium flex items-center space-x-1 transition-colors"
              title="End conversation"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          ) : (
            <button
              onClick={onNextPerson}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition-colors flex items-center space-x-1"
            >
              <span>Find New</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Safety options */}
          <button
            onClick={onOpenReport}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            title="Report this user"
          >
            <Flag className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenBlock}
            className="p-1.5 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-950/30 transition-colors"
            title="Block this user"
          >
            <UserX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
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
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
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
                <span className="text-[10px] text-purple-200">Break the ice with a fun micro-game or unexpected question!</span>
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
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Message ${room.strangerAlias}...`}
              className="flex-1 bg-slate-900/90 border border-slate-800 focus:border-purple-500/60 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/40 transition-all"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-lg shadow-purple-600/30 transition-all focus:outline-none flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

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
    </div>
  );
};
