import React, { useState, useEffect } from 'react';
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
  // Navigation & Screen state
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('welcome');
  const [selectedMood, setSelectedMood] = useState<MoodId>('career');
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [queueStatus, setQueueStatus] = useState<{ position: number; totalWaiting: number } | null>(null);

  // User session
  const [session, setSession] = useState<UserSession>(() => chatService.getUserSession());

  // Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'settings' | 'privacy' | 'guidelines'>('settings');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isAiStarterOpen, setIsAiStarterOpen] = useState(false);
  const [pendingAiText, setPendingAiText] = useState<string | null>(null);

  // Direct Reconnect Modal State
  const [isReconnectOpen, setIsReconnectOpen] = useState(false);
  const [initialReconnectCode, setInitialReconnectCode] = useState<string>('');

  // VIP Upgrade Modal State
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);

  // Toast / notification banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Detect ?reconnect=CODE or ?ref=USER_ID from URL on page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('reconnect');
      if (code) {
        setInitialReconnectCode(code.trim().toUpperCase());
        setIsReconnectOpen(true);
      }

      const ref = params.get('ref');
      if (ref && ref !== session.userId) {
        const alreadyReferred = localStorage.getItem('hush_referred_by');
        if (alreadyReferred !== ref) {
          localStorage.setItem('hush_referred_by', ref);
          chatService.registerReferral(ref, session.userId);
          showToast("Joined via friend's referral link! ✨");
        }
      }
    }
  }, [session.userId]);

  // Start Real-Time Matching with human users
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

  // Direct Reconnect with a friend using a specific code
  const handleStartReconnect = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    setIsReconnectOpen(false);
    setSelectedMood('general');
    setCurrentScreen('matching');
    setQueueStatus(null);
    showToast(`Connecting with Reconnect Code: ${cleanCode}...`);

    chatService.joinQueue(
      'general',
      (room) => {
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

  // Cancel Matching
  const handleCancelMatching = () => {
    chatService.cancelQueue();
    setCurrentScreen('mood-select');
  };

  // Skip to next person
  const handleNextPerson = () => {
    chatService.leaveChat();
    setCurrentRoom(null);
    startMatching(selectedMood);
  };

  // Leave / end chat
  const handleEndChat = () => {
    chatService.leaveChat();
    setCurrentRoom(null);
    setCurrentScreen('mood-select');
  };

  // Block current user
  const handleConfirmBlock = () => {
    if (currentRoom) {
      chatService.blockUser(currentRoom.strangerId);
      setSession(chatService.getUserSession());
      showToast(`${currentRoom.strangerAlias} has been blocked.`);
      setIsBlockOpen(false);
      handleNextPerson();
    }
  };

  // Report current user
  const handleSubmitReport = (reason: ReportReason, details: string) => {
    if (currentRoom) {
      chatService.reportUser(currentRoom.strangerId, reason, details);
      setSession(chatService.getUserSession());
      showToast("Report submitted. Conversation terminated.");
      setIsReportOpen(false);
      handleNextPerson();
    }
  };

  // Reset Session
  const handleResetSession = () => {
    const fresh = chatService.resetSession();
    setSession(fresh);
    showToast("Session reset. Generated fresh anonymous identity.");
    setCurrentRoom(null);
    setCurrentScreen('welcome');
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] bg-glow-radial cyber-grid-3d relative">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-indigo-950/90 border border-indigo-500/40 text-xs text-white font-medium shadow-2xl backdrop-blur-md animate-fade-in flex items-center space-x-2">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Navigation */}
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
            if (confirm("Leaving will end your anonymous conversation with this person. Continue?")) {
              chatService.leaveChat();
              setCurrentScreen('welcome');
              setCurrentRoom(null);
            }
          } else {
            setCurrentScreen('welcome');
          }
        }}
      />

      {/* Screen Router */}
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

      {/* VIP Upgrade Modal */}
      <VipUpgradeModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
        onVipChanged={() => setSession(chatService.getUserSession())}
      />

      {/* Direct Reconnect Modal */}
      <ReconnectModal
        isOpen={isReconnectOpen}
        onClose={() => setIsReconnectOpen(false)}
        onStartReconnect={handleStartReconnect}
        initialCode={initialReconnectCode}
      />

      {/* AI Icebreaker Drawer / Modal */}
      <AiStarterModal
        topic={selectedMood}
        isOpen={isAiStarterOpen}
        onClose={() => setIsAiStarterOpen(false)}
        onSelectSuggestion={(text) => {
          setPendingAiText(text);
        }}
      />

      {/* Safety: Report Modal */}
      {currentRoom && (
        <ReportModal
          isOpen={isReportOpen}
          strangerAlias={currentRoom.strangerAlias}
          onClose={() => setIsReportOpen(false)}
          onSubmitReport={handleSubmitReport}
        />
      )}

      {/* Safety: Block Modal */}
      {currentRoom && (
        <BlockModal
          isOpen={isBlockOpen}
          strangerAlias={currentRoom.strangerAlias}
          onClose={() => setIsBlockOpen(false)}
          onConfirmBlock={handleConfirmBlock}
        />
      )}

      {/* Settings / Privacy / Guidelines Modal */}
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
