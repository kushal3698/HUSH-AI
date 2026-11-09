import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MoodSelectionScreen } from './components/MoodSelectionScreen';
import { MatchingScreen } from './components/MatchingScreen';
import { ChatScreen } from './components/ChatScreen';
import { AiStarterModal } from './components/AiStarterModal';
import { ReconnectModal } from './components/ReconnectModal';
import { VipUpgradeModal } from './components/VipUpgradeModal';
import { ReportModal, BlockModal, SettingsModal } from './components/SafetyModals';
import { chatService } from './services/chatService';
import { ScreenState, MoodId, ChatRoom, UserSession, ReportReason } from './types';

export const App: React.FC = () => {
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(() => chatService.getActiveRoom());
  const [currentScreen, setCurrentScreen] = useState<ScreenState>(() =>
    chatService.getActiveRoom() ? 'chat' : 'welcome'
  );
  const [selectedMood, setSelectedMood] = useState<MoodId>(() => {
    const active = chatService.getActiveRoom();
    return active ? active.moodId : 'career';
  });
  const [queueStatus, setQueueStatus] = useState<{ position: number; totalWaiting: number } | null>(null);
  const [session, setSession] = useState<UserSession>(() => chatService.getUserSession());

  // Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'settings' | 'privacy' | 'guidelines'>('settings');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isAiStarterOpen, setIsAiStarterOpen] = useState(false);
  const [pendingAiText, setPendingAiText] = useState<string | null>(null);
  const [isReconnectOpen, setIsReconnectOpen] = useState(false);
  const [initialReconnectCode, setInitialReconnectCode] = useState<string>('');
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);

  // Toast notification with proper timer cleanup
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Re-sync active room on mount if refreshed
  useEffect(() => {
    const active = chatService.getActiveRoom();
    if (active) {
      chatService.rejoinRoom(active.id);
    }
  }, []);

  // Detect ?reconnect=CODE or ?ref=USER_ID from URL on page load and clean URL bar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    let urlMutated = false;

    const code = params.get('reconnect');
    if (code) {
      setInitialReconnectCode(code.trim().toUpperCase());
      setIsReconnectOpen(true);
      params.delete('reconnect');
      urlMutated = true;
    }

    const ref = params.get('ref');
    if (ref && ref !== session.userId) {
      const alreadyReferred = localStorage.getItem('hush_referred_by');
      if (alreadyReferred !== ref) {
        localStorage.setItem('hush_referred_by', ref);
        chatService.registerReferral(ref, session.userId);
        showToast("Joined via friend's referral link! ✨");
      }
      params.delete('ref');
      urlMutated = true;
    }

    if (urlMutated) {
      const nextSearch = params.toString();
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
      window.history.replaceState({}, document.title, nextUrl);
    }
  }, [session.userId, showToast]);

  const startMatching = (
    mood: MoodId,
    interests?: string[],
    persona?: { city?: string; age?: string | number; gender?: string }
  ) => {
    setSelectedMood(mood);
    setCurrentScreen('matching');
    setQueueStatus(null);

    const updatedSession = persona ? chatService.updatePersona(persona) : chatService.getUserSession();
    if (interests && interests.length > 0) {
      updatedSession.selectedInterests = interests;
      sessionStorage.setItem('hush_ai_user_session', JSON.stringify(updatedSession));
    }
    setSession(updatedSession);

    chatService.joinQueue(
      mood,
      (room) => {
        chatService.saveActiveRoom(room);
        setCurrentRoom(room);
        setCurrentScreen('chat');
        showToast(`Matched with ${room.strangerAlias}!`);
      },
      (status) => {
        setQueueStatus(status);
      },
      {
        city: updatedSession.city,
        age: updatedSession.age,
        gender: updatedSession.gender
      }
    );
  };

  const handleStartReconnect = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setIsReconnectOpen(false);
    setSelectedMood('general');
    setCurrentScreen('matching');
    setQueueStatus(null);
    showToast(`Connecting with Reconnect Code: ${cleanCode}...`);

    chatService.joinQueue(
      'general',
      (room) => {
        chatService.saveActiveRoom(room);
        setCurrentRoom(room);
        setCurrentScreen('chat');
        showToast(`⚡ Reconnected with ${room.strangerAlias}!`);
      },
      (status) => {
        setQueueStatus(status);
      },
      {
        city: session.city,
        age: session.age,
        gender: session.gender,
        reconnectCode: cleanCode
      }
    );
  };

  const handleCancelMatching = () => {
    chatService.cancelQueue();
    setCurrentScreen('mood-select');
  };

  const handleNextPerson = () => {
    chatService.clearActiveRoomStorage();
    chatService.leaveChat();
    setCurrentRoom(null);
    startMatching(selectedMood);
  };

  const handleEndChat = () => {
    chatService.clearActiveRoomStorage();
    chatService.leaveChat();
    setCurrentRoom(null);
    setCurrentScreen('mood-select');
  };

  const handleConfirmBlock = () => {
    if (currentRoom) {
      chatService.blockUser(currentRoom.strangerId);
      setSession(chatService.getUserSession());
      showToast(`${currentRoom.strangerAlias} has been blocked.`);
      setIsBlockOpen(false);
      handleNextPerson();
    }
  };

  const handleSubmitReport = (reason: ReportReason, details: string) => {
    if (currentRoom) {
      chatService.reportUser(currentRoom.strangerId, reason, details);
      setSession(chatService.getUserSession());
      showToast('Report submitted. Conversation terminated.');
      setIsReportOpen(false);
      handleNextPerson();
    }
  };

  const handleResetSession = () => {
    const fresh = chatService.resetSession();
    setSession(fresh);
    showToast('Session reset. Generated fresh anonymous identity.');
    setCurrentRoom(null);
    setCurrentScreen('welcome');
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] bg-glow-radial cyber-grid-3d relative">
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-indigo-950/90 border border-indigo-500/40 text-xs text-white font-medium shadow-2xl backdrop-blur-md animate-toast-fade-in flex items-center space-x-2"
        >
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <Navbar
        currentMood={currentScreen === 'chat' || currentScreen === 'matching' ? selectedMood : null}
        onOpenSettings={() => {
          setSettingsTab('settings');
          setIsSettingsOpen(true);
        }}
        onOpenReconnect={() => setIsReconnectOpen(true)}
        onOpenVip={() => setIsVipModalOpen(true)}
        onGoHome={() => {
          if (currentScreen === 'chat') {
            if (window.confirm('Leaving will end your anonymous conversation with this person. Continue?')) {
              chatService.clearActiveRoomStorage();
              chatService.leaveChat();
              setCurrentScreen('welcome');
              setCurrentRoom(null);
            }
          } else if (currentScreen === 'matching') {
            chatService.cancelQueue();
            setCurrentScreen('welcome');
          } else {
            setCurrentScreen('welcome');
          }
        }}
      />

      <main className="flex-1 flex flex-col relative z-10">
        {currentScreen === 'welcome' && (
          <WelcomeScreen
            onStartChatting={() => setCurrentScreen('mood-select')}
            onOpenReconnect={() => setIsReconnectOpen(true)}
            onOpenPrivacy={() => {
              setSettingsTab('privacy');
              setIsSettingsOpen(true);
            }}
            onOpenGuidelines={() => {
              setSettingsTab('guidelines');
              setIsSettingsOpen(true);
            }}
          />
        )}

        {currentScreen === 'mood-select' && (
          <MoodSelectionScreen
            onSelectMoodAndFind={(mood, interests, persona) => startMatching(mood, interests, persona)}
            onBack={() => setCurrentScreen('welcome')}
            onOpenReconnect={() => setIsReconnectOpen(true)}
            onOpenVip={() => setIsVipModalOpen(true)}
          />
        )}

        {currentScreen === 'matching' && (
          <MatchingScreen
            mood={selectedMood}
            queueStatus={queueStatus}
            onCancel={handleCancelMatching}
            onSwitchToMood={(newMood) => startMatching(newMood)}
          />
        )}

        {currentScreen === 'chat' && currentRoom && (
          <ChatScreen
            room={currentRoom}
            onNextPerson={handleNextPerson}
            onEndChat={handleEndChat}
            onOpenReport={() => setIsReportOpen(true)}
            onOpenBlock={() => setIsBlockOpen(true)}
            onOpenAiStarter={() => setIsAiStarterOpen(true)}
            pendingAiText={pendingAiText}
            onClearPendingAiText={() => setPendingAiText(null)}
            onOpenVip={() => setIsVipModalOpen(true)}
            onRewind={(code) => handleStartReconnect(code)}
          />
        )}
      </main>

      <VipUpgradeModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
        onVipChanged={() => setSession(chatService.getUserSession())}
      />

      <ReconnectModal
        isOpen={isReconnectOpen}
        onClose={() => setIsReconnectOpen(false)}
        onStartReconnect={handleStartReconnect}
        initialCode={initialReconnectCode}
      />

      <AiStarterModal
        topic={selectedMood}
        isOpen={isAiStarterOpen}
        onClose={() => setIsAiStarterOpen(false)}
        onSelectSuggestion={(text) => setPendingAiText(text)}
      />

      {currentRoom && (
        <ReportModal
          isOpen={isReportOpen}
          strangerAlias={currentRoom.strangerAlias}
          onClose={() => setIsReportOpen(false)}
          onSubmitReport={handleSubmitReport}
        />
      )}

      {currentRoom && (
        <BlockModal
          isOpen={isBlockOpen}
          strangerAlias={currentRoom.strangerAlias}
          onClose={() => setIsBlockOpen(false)}
          onConfirmBlock={handleConfirmBlock}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        session={session}
        initialTab={settingsTab}
        onClose={() => setIsSettingsOpen(false)}
        onResetSession={handleResetSession}
      />
    </div>
  );
};

export default App;
