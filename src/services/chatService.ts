import { 
  MoodId, 
  ChatRoom, 
  UserSession, 
  ReportReason, 
  ChatMessage, 
  MiniGameData, 
  VaultConnection,
  RevealRequestPayload,
  RevealResponsePayload,
  MediaAttachment,
  ConversationProgress,
  CallSignalPayload
} from '../types';

const SESSION_KEY = 'hush_ai_user_session';
const BLOCKED_KEY = 'hush_ai_blocked_strangers';
const VAULT_KEY = 'hush_ai_vault_connections';

type MatchCallback = (room: ChatRoom) => void;
type QueueUpdateCallback = (data: { position: number; totalWaiting: number }) => void;
type MessageCallback = (message: ChatMessage) => void;
type MessageDeliveredCallback = (messageId: string) => void;
type MessageReadCallback = (messageId: string) => void;
type TypingCallback = (isTyping: boolean) => void;
type PartnerLeftCallback = () => void;
type GameLaunchedCallback = (gameData: MiniGameData) => void;
type GameVotedCallback = (data: { gameId: string; userId: string; choice: string }) => void;
type ConnectionOfferedCallback = (data: { senderAlias: string; reconnectCode: string }) => void;
type RevealRequestedCallback = (payload: RevealRequestPayload) => void;
type RevealRespondedCallback = (payload: RevealResponsePayload) => void;
type ProgressCallback = (progress: ConversationProgress) => void;
type MediaRejectedCallback = (error: string) => void;
type CallRejectedCallback = (error: string) => void;
type CallSignalCallback = (signal: CallSignalPayload) => void;
type PartnerStatusCallback = (status: 'online' | 'offline') => void;

class RealtimeChatService {
  private socket: WebSocket | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private currentRoom: ChatRoom | null = null;

  // Listeners
  private onMatchedListener: MatchCallback | null = null;
  private onQueueUpdateListener: QueueUpdateCallback | null = null;
  private onMessageListener: MessageCallback | null = null;
  private onMessageDeliveredListener: MessageDeliveredCallback | null = null;
  private onMessageReadListener: MessageReadCallback | null = null;
  private onTypingListener: TypingCallback | null = null;
  private onPartnerLeftListener: PartnerLeftCallback | null = null;
  private onPartnerStatusListener: PartnerStatusCallback | null = null;
  private onGameLaunchedListener: GameLaunchedCallback | null = null;
  private onGameVotedListener: GameVotedCallback | null = null;
  private onConnectionOfferedListener: ConnectionOfferedCallback | null = null;
  private onRevealRequestedListener: RevealRequestedCallback | null = null;
  private onRevealRespondedListener: RevealRespondedCallback | null = null;
  private onProgressListener: ProgressCallback | null = null;
  private onMediaRejectedListener: MediaRejectedCallback | null = null;
  private onCallRejectedListener: CallRejectedCallback | null = null;
  private onCallSignalListener: CallSignalCallback | null = null;

  constructor() {
    this.initBroadcastChannel();
    this.connectWebSocket();
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('hush_ai_realtime_channel');
      this.broadcastChannel.onmessage = (event) => {
        this.handleCrossTabEvent(event.data);
      };
    }
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return;

    const envWsUrl = (import.meta as any).env?.VITE_WS_URL;
    let wsUrl: string;

    if (envWsUrl) {
      wsUrl = envWsUrl;
    } else {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const hostname = window.location.hostname || 'localhost';

      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        wsUrl = `ws://${hostname}:3001`;
      } else {
        // Production fallback: use secure protocol
        wsUrl = `${wsProtocol}//${hostname}:3001`;
      }
    }

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[HUSH AI] Connected to real-time WebSocket server at', wsUrl);
        const sess = this.getUserSession();
        this.socket?.send(JSON.stringify({ type: 'IDENTIFY_USER', userId: sess.userId }));
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerEvent(data);
        } catch (e) {
          console.error('[HUSH AI] Error parsing server message:', e);
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[HUSH AI] WebSocket notice (Cross-tab active):', err);
      };

      this.socket.onclose = () => {
        setTimeout(() => this.connectWebSocket(), 3000);
      };
    } catch (err) {
      console.warn('[HUSH AI] Could not open WebSocket, using BroadcastChannel:', err);
    }
  }

  private handleServerEvent(data: any) {
    switch (data.type) {
      case 'QUEUE_STATUS': {
        this.onQueueUpdateListener?.({
          position: data.position,
          totalWaiting: data.totalWaiting
        });
        break;
      }

      case 'MATCHED': {
        const room: ChatRoom = {
          id: data.roomId,
          moodId: data.mood as MoodId,
          strangerId: data.strangerId,
          strangerAlias: data.strangerAlias,
          strangerMood: data.mood,
          createdAt: Date.now(),
          status: 'active',
          strangerCity: data.strangerCity,
          strangerAge: data.strangerAge,
          strangerGender: data.strangerGender,
          reconnectCode: data.reconnectCode,
          strangerIsVip: Boolean(data.strangerIsVip)
        };
        this.currentRoom = room;

        const session = this.getUserSession();
        session.totalChatsCount += 1;
        session.selectedMood = room.moodId;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

        this.onMatchedListener?.(room);

        if (data.progress) {
          this.onProgressListener?.(data.progress);
        }
        break;
      }

      case 'CONVERSATION_PROGRESS': {
        if (data.progress) {
          this.onProgressListener?.(data.progress);
        }
        break;
      }

      case 'NEW_MEDIA_MESSAGE': {
        const msg: ChatMessage = {
          id: data.id || `msg_media_${Date.now()}`,
          sender: 'stranger',
          text: data.text || '',
          timestamp: data.timestamp || Date.now(),
          media: data.media,
          status: 'delivered'
        };
        this.onMessageListener?.(msg);
        break;
      }

      case 'MEDIA_REJECTED': {
        this.onMediaRejectedListener?.(data.error);
        if (data.progress) {
          this.onProgressListener?.(data.progress);
        }
        break;
      }

      case 'CALL_SIGNAL': {
        this.onCallSignalListener?.({
          signalType: data.signalType,
          callType: data.callType,
          payload: data.payload,
          senderAlias: data.senderAlias
        });
        break;
      }

      case 'CALL_REJECTED': {
        this.onCallRejectedListener?.(data.error);
        break;
      }

      case 'PARTNER_STATUS': {
        this.onPartnerStatusListener?.(data.status);
        break;
      }

      case 'NEW_MESSAGE': {
        const msg: ChatMessage = {
          id: data.id || `msg_remote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          sender: 'stranger',
          text: data.text,
          timestamp: data.timestamp || Date.now(),
          isAiSuggested: data.isAiSuggested,
          status: 'delivered'
        };
        this.onMessageListener?.(msg);
        break;
      }

      case 'MESSAGE_DELIVERED': {
        if (data.id) {
          this.onMessageDeliveredListener?.(data.id);
        }
        break;
      }

      case 'MESSAGE_READ': {
        if (data.id) {
          this.onMessageReadListener?.(data.id);
        }
        break;
      }

      case 'PARTNER_TYPING': {
        this.onTypingListener?.(data.isTyping);
        break;
      }

      case 'GAME_LAUNCHED': {
        this.onGameLaunchedListener?.(data.gameData);
        break;
      }

      case 'GAME_VOTED': {
        this.onGameVotedListener?.({
          gameId: data.gameId,
          userId: data.userId,
          choice: data.choice
        });
        break;
      }

      case 'REVEAL_REQUESTED': {
        this.onRevealRequestedListener?.(data.payload);
        break;
      }

      case 'REVEAL_RESPONDED': {
        this.onRevealRespondedListener?.(data.payload);
        break;
      }

      case 'CONNECTION_SAVE_OFFERED': {
        this.onConnectionOfferedListener?.({
          senderAlias: data.senderAlias,
          reconnectCode: data.reconnectCode
        });
        break;
      }

      case 'REFERRAL_COUNT_UPDATED': {
        const count = Number(data.referralCount) || 0;
        this.saveReferralCount(count);
        if (count >= 10 && !this.isVip()) {
          this.setVip(true, '10-Referral Free VIP');
        }
        break;
      }

      case 'PARTNER_LEFT': {
        this.onPartnerLeftListener?.();
        this.currentRoom = null;
        break;
      }
    }
  }

  private handleCrossTabEvent(data: any) {
    const session = this.getUserSession();
    if (!data || data.senderId === session.userId) return;

    if (data.type === 'TAB_JOIN_QUEUE' && this.onMatchedListener && !this.currentRoom) {
      if (this.socket?.readyState !== WebSocket.OPEN) {
        const currentMood = session.selectedMood;
        if (currentMood === data.mood || currentMood === 'general' || data.mood === 'general') {
          const roomId = `room_tab_${Date.now()}`;
          const generatedCode = data.reconnectCode || `HUSH-${Math.floor(100000 + Math.random() * 900000)}`;
          this.broadcastChannel?.postMessage({
            type: 'TAB_MATCH_CONFIRMED',
            roomId,
            targetUserId: data.senderId,
            senderId: session.userId,
            senderAlias: session.anonymousAlias,
            mood: currentMood,
            city: session.city,
            age: session.age,
            gender: session.gender,
            reconnectCode: generatedCode
          });

          const room: ChatRoom = {
            id: roomId,
            moodId: (currentMood || 'general') as MoodId,
            strangerId: data.senderId,
            strangerAlias: data.senderAlias,
            strangerMood: data.mood,
            createdAt: Date.now(),
            status: 'active',
            strangerCity: data.city,
            strangerAge: data.age,
            strangerGender: data.gender,
            reconnectCode: generatedCode
          };
          this.currentRoom = room;
          this.onMatchedListener?.(room);
        }
      }
    } else if (data.type === 'TAB_MATCH_CONFIRMED' && data.targetUserId === session.userId) {
      const room: ChatRoom = {
        id: data.roomId,
        moodId: data.mood as MoodId,
        strangerId: data.senderId,
        strangerAlias: data.senderAlias,
        strangerMood: data.mood,
        createdAt: Date.now(),
        status: 'active',
        strangerCity: data.city,
        strangerAge: data.age,
        strangerGender: data.gender,
        reconnectCode: data.reconnectCode
      };
      this.currentRoom = room;
      this.onMatchedListener?.(room);
    } else if (data.type === 'TAB_MESSAGE' && this.currentRoom && data.roomId === this.currentRoom.id) {
      const msg: ChatMessage = {
        id: data.id || `msg_tab_${Date.now()}`,
        sender: 'stranger',
        text: data.text,
        timestamp: Date.now(),
        isAiSuggested: data.isAiSuggested,
        status: 'delivered'
      };
      this.onMessageListener?.(msg);

      // Send delivery ACK back over broadcast channel
      this.broadcastChannel?.postMessage({
        type: 'TAB_MESSAGE_DELIVERED',
        roomId: this.currentRoom.id,
        senderId: session.userId,
        id: msg.id
      });
    } else if (data.type === 'TAB_MEDIA_MESSAGE' && this.currentRoom && data.roomId === this.currentRoom.id) {
      const msg: ChatMessage = {
        id: data.id || `msg_tab_media_${Date.now()}`,
        sender: 'stranger',
        text: data.text || '',
        timestamp: Date.now(),
        media: data.media,
        status: 'delivered'
      };
      this.onMessageListener?.(msg);
      this.broadcastChannel?.postMessage({
        type: 'TAB_MESSAGE_DELIVERED',
        roomId: this.currentRoom.id,
        senderId: session.userId,
        id: msg.id
      });
    } else if (data.type === 'TAB_CALL_SIGNAL' && this.currentRoom && data.roomId === this.currentRoom.id) {
      this.onCallSignalListener?.({
        signalType: data.signalType,
        callType: data.callType,
        payload: data.payload,
        senderAlias: data.senderAlias
      });
    } else if (data.type === 'TAB_MESSAGE_DELIVERED' && this.currentRoom && data.roomId === this.currentRoom.id) {
      this.onMessageDeliveredListener?.(data.id);
    } else if (data.type === 'TAB_MESSAGE_READ' && this.currentRoom && data.roomId === this.currentRoom.id) {
      this.onMessageReadListener?.(data.id);
    } else if (data.type === 'TAB_TYPING' && this.currentRoom && data.roomId === this.currentRoom.id) {
      this.onTypingListener?.(data.isTyping);
    } else if (data.type === 'TAB_GAME_LAUNCHED' && this.currentRoom && data.roomId === this.currentRoom.id) {
      this.onGameLaunchedListener?.(data.gameData);
    } else if (data.type === 'TAB_GAME_VOTED' && this.currentRoom && data.roomId === this.currentRoom.id) {
      this.onGameVotedListener?.({
        gameId: data.gameId,
        userId: data.userId,
        choice: data.choice
      });
    } else if (data.type === 'TAB_REVEAL_REQUEST' && this.currentRoom && data.roomId === this.currentRoom.id) {
      this.onRevealRequestedListener?.(data.payload);
    } else if (data.type === 'TAB_REVEAL_RESPONSE' && this.currentRoom && data.roomId === this.currentRoom.id) {
      this.onRevealRespondedListener?.(data.payload);
    } else if (data.type === 'TAB_CONNECTION_OFFERED' && this.currentRoom && data.roomId === this.currentRoom.id) {
      this.onConnectionOfferedListener?.({
        senderAlias: data.senderAlias,
        reconnectCode: data.reconnectCode
      });
    } else if (data.type === 'TAB_PARTNER_STATUS' && this.currentRoom && data.roomId === this.currentRoom.id) {
      this.onPartnerStatusListener?.(data.status);
    } else if (data.type === 'TAB_LEFT' && this.currentRoom && data.roomId === this.currentRoom.id) {
      this.onPartnerLeftListener?.();
      this.currentRoom = null;
    }
  }

  getUserSession(): UserSession {
    let savedPersona: { city?: string; age?: string | number; gender?: string } = {};
    try {
      const pRaw = localStorage.getItem('hush_persona');
      if (pRaw) savedPersona = JSON.parse(pRaw);
    } catch {}

    const isVip = typeof window !== 'undefined' ? localStorage.getItem('hush_vip_active') === 'true' : false;
    const vipPlan = typeof window !== 'undefined' ? localStorage.getItem('hush_vip_plan') || undefined : undefined;
    const vipFilters = this.getVipFilters();

    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const parsed: UserSession = JSON.parse(raw);
        if (!parsed.city && savedPersona.city) parsed.city = savedPersona.city;
        if (!parsed.age && savedPersona.age) parsed.age = savedPersona.age;
        if (!parsed.gender && savedPersona.gender) parsed.gender = savedPersona.gender;
        parsed.isVip = isVip;
        parsed.vipPlan = vipPlan;
        parsed.vipFilters = vipFilters;
        return parsed;
      } catch {}
    }

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const newSession: UserSession = {
      userId: `user_guest_${Date.now()}_${randomId}`,
      anonymousAlias: `User #${randomId}`,
      isGuest: true,
      selectedMood: null,
      selectedInterests: [],
      blockedUserIds: this.getBlockedList(),
      totalChatsCount: 0,
      createdAt: Date.now(),
      city: savedPersona.city || '',
      age: savedPersona.age || '',
      gender: savedPersona.gender || '',
      isVip,
      vipPlan,
      vipFilters
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    return newSession;
  }

  // VIP Management
  isVip(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('hush_vip_active') === 'true';
  }

  setVip(active: boolean, plan = 'VIP Monthly Pass'): void {
    if (typeof window === 'undefined') return;
    if (active) {
      localStorage.setItem('hush_vip_active', 'true');
      localStorage.setItem('hush_vip_plan', plan);
      localStorage.setItem('hush_vip_expires', String(Date.now() + 30 * 24 * 60 * 60 * 1000));
    } else {
      localStorage.removeItem('hush_vip_active');
      localStorage.removeItem('hush_vip_plan');
      localStorage.removeItem('hush_vip_expires');
    }
    const sess = this.getUserSession();
    sess.isVip = active;
    sess.vipPlan = active ? plan : undefined;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  }

  getVipFilters(): { targetGender?: 'female' | 'male' | 'any'; targetCity?: string } {
    if (typeof window === 'undefined') return { targetGender: 'any', targetCity: '' };
    try {
      const raw = localStorage.getItem('hush_vip_filters');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { targetGender: 'any', targetCity: '' };
  }

  setVipFilters(filters: { targetGender?: 'female' | 'male' | 'any'; targetCity?: string }): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('hush_vip_filters', JSON.stringify(filters));
    const sess = this.getUserSession();
    sess.vipFilters = filters;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  }

  getLastSkippedPartner(): { alias: string; reconnectCode: string; city?: string; age?: string | number; gender?: string } | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('hush_last_skipped_partner');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  setLastSkippedPartner(partner: { alias: string; reconnectCode: string; city?: string; age?: string | number; gender?: string }): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('hush_last_skipped_partner', JSON.stringify(partner));
  }

  getReferralCount(): number {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = localStorage.getItem('hush_referral_count');
      return raw ? parseInt(raw, 10) : 0;
    } catch {}
    return 0;
  }

  saveReferralCount(count: number): number {
    if (typeof window === 'undefined') return count;
    localStorage.setItem('hush_referral_count', String(count));
    const sess = this.getUserSession();
    sess.referralCount = count;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    return count;
  }

  incrementReferralCount(by = 1): number {
    const current = this.getReferralCount();
    const updated = current + by;
    this.saveReferralCount(updated);
    if (updated >= 10 && !this.isVip()) {
      this.setVip(true, '10-Referral Free VIP');
    }
    return updated;
  }

  registerReferral(referrerId: string, visitorId: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'REGISTER_REFERRAL',
        referrerId,
        visitorId
      }));
    }
    this.broadcastChannel?.postMessage({
      type: 'TAB_REFERRAL_REGISTERED',
      referrerId,
      visitorId
    });
  }

  updatePersona(persona: { city?: string; age?: string | number; gender?: string }): UserSession {
    const session = this.getUserSession();
    if (persona.city !== undefined) session.city = persona.city;
    if (persona.age !== undefined) session.age = persona.age;
    if (persona.gender !== undefined) session.gender = persona.gender;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    try {
      localStorage.setItem('hush_persona', JSON.stringify({
        city: session.city,
        age: session.age,
        gender: session.gender
      }));
    } catch {}
    return session;
  }

  getBlockedList(): string[] {
    const raw = localStorage.getItem(BLOCKED_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  blockUser(strangerId: string) {
    const blocked = this.getBlockedList();
    if (!blocked.includes(strangerId)) {
      blocked.push(strangerId);
      localStorage.setItem(BLOCKED_KEY, JSON.stringify(blocked));
    }
    this.leaveChat();
  }

  reportUser(strangerId: string, reason: ReportReason, details?: string) {
    console.log(`[Safety Report] Target: ${strangerId}, Reason: ${reason}, Details: ${details}`);
    this.blockUser(strangerId);
  }

  resetSession(): UserSession {
    sessionStorage.removeItem(SESSION_KEY);
    return this.getUserSession();
  }

  // Vault Management
  getVaultConnections(): VaultConnection[] {
    const raw = localStorage.getItem(VAULT_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  addVaultConnection(conn: VaultConnection) {
    const list = this.getVaultConnections();
    if (!list.some(c => c.strangerId === conn.strangerId)) {
      list.unshift(conn);
      localStorage.setItem(VAULT_KEY, JSON.stringify(list));
    }
  }

  removeVaultConnection(id: string) {
    const list = this.getVaultConnections().filter(c => c.id !== id);
    localStorage.setItem(VAULT_KEY, JSON.stringify(list));
  }

  joinQueue(
    mood: MoodId, 
    onMatched: MatchCallback, 
    onQueueUpdate?: QueueUpdateCallback,
    options?: {
      city?: string;
      age?: string | number;
      gender?: string;
      reconnectCode?: string;
      isVip?: boolean;
      targetGender?: string;
      targetCity?: string;
    }
  ) {
    this.onMatchedListener = onMatched;
    this.onQueueUpdateListener = onQueueUpdate || null;
    this.currentRoom = null;

    const session = this.getUserSession();
    session.selectedMood = mood;
    if (options?.city !== undefined) session.city = options.city;
    if (options?.age !== undefined) session.age = options.age;
    if (options?.gender !== undefined) session.gender = options.gender;

    const isVip = options?.isVip ?? this.isVip();
    const vipFilters = this.getVipFilters();
    const targetGender = options?.targetGender ?? (isVip && vipFilters.targetGender !== 'any' ? vipFilters.targetGender : undefined);
    const targetCity = options?.targetCity ?? (isVip && vipFilters.targetCity ? vipFilters.targetCity : undefined);

    try {
      localStorage.setItem('hush_persona', JSON.stringify({
        city: session.city,
        age: session.age,
        gender: session.gender
      }));
    } catch {}
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

    const payload = {
      type: 'JOIN_QUEUE',
      userId: session.userId,
      alias: session.anonymousAlias,
      mood,
      city: session.city,
      age: session.age,
      gender: session.gender,
      isVip,
      targetGender,
      targetCity,
      reconnectCode: options?.reconnectCode ? options.reconnectCode.trim().toUpperCase() : undefined
    };

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else {
      this.connectWebSocket();
      this.broadcastChannel?.postMessage({
        type: 'TAB_JOIN_QUEUE',
        senderId: session.userId,
        senderAlias: session.anonymousAlias,
        mood,
        city: session.city,
        age: session.age,
        gender: session.gender,
        isVip,
        targetGender,
        targetCity,
        reconnectCode: options?.reconnectCode ? options.reconnectCode.trim().toUpperCase() : undefined
      });
    }
  }

  reconnectWithCode(
    reconnectCode: string,
    onMatched: MatchCallback,
    onQueueUpdate?: QueueUpdateCallback,
    options?: {
      city?: string;
      age?: string | number;
      gender?: string;
    }
  ) {
    this.joinQueue('general', onMatched, onQueueUpdate, {
      ...options,
      reconnectCode: reconnectCode.trim().toUpperCase()
    });
  }

  cancelQueue() {
    this.onMatchedListener = null;
    this.onQueueUpdateListener = null;

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'CANCEL_QUEUE' }));
    }
  }

  sendMessage(messageId: string, text: string, isAiSuggested = false) {
    if (!this.currentRoom) return;

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'SEND_MESSAGE',
        id: messageId,
        text,
        isAiSuggested
      }));
    } else {
      const session = this.getUserSession();
      this.broadcastChannel?.postMessage({
        type: 'TAB_MESSAGE',
        roomId: this.currentRoom.id,
        id: messageId,
        senderId: session.userId,
        text,
        isAiSuggested
      });
    }
  }

  sendReadReceipt(messageId: string) {
    if (!this.currentRoom) return;

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'READ_RECEIPT',
        id: messageId
      }));
    } else {
      const session = this.getUserSession();
      this.broadcastChannel?.postMessage({
        type: 'TAB_MESSAGE_READ',
        roomId: this.currentRoom.id,
        id: messageId,
        senderId: session.userId
      });
    }
  }

  sendTyping(isTyping: boolean) {
    if (!this.currentRoom) return;

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'TYPING',
        isTyping
      }));
    } else {
      const session = this.getUserSession();
      this.broadcastChannel?.postMessage({
        type: 'TAB_TYPING',
        roomId: this.currentRoom.id,
        senderId: session.userId,
        isTyping
      });
    }
  }

  // Mini-Games
  launchGame(gameData: MiniGameData) {
    if (!this.currentRoom) return;

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'LAUNCH_GAME',
        gameData
      }));
    } else {
      const session = this.getUserSession();
      this.broadcastChannel?.postMessage({
        type: 'TAB_GAME_LAUNCHED',
        roomId: this.currentRoom.id,
        senderId: session.userId,
        gameData
      });
    }
  }

  voteGame(gameId: string, choice: string) {
    if (!this.currentRoom) return;

    const session = this.getUserSession();
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'VOTE_GAME',
        gameId,
        userId: session.userId,
        choice
      }));
    } else {
      this.broadcastChannel?.postMessage({
        type: 'TAB_GAME_VOTED',
        roomId: this.currentRoom.id,
        senderId: session.userId,
        gameId,
        userId: session.userId,
        choice
      });
    }
  }

  // Mutual Reveal Protocol Handshake
  requestReveal(payload: RevealRequestPayload) {
    if (!this.currentRoom) return;

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'REVEAL_REQUEST',
        payload
      }));
    } else {
      const session = this.getUserSession();
      this.broadcastChannel?.postMessage({
        type: 'TAB_REVEAL_REQUEST',
        roomId: this.currentRoom.id,
        senderId: session.userId,
        payload
      });
    }
  }

  respondReveal(payload: RevealResponsePayload) {
    if (!this.currentRoom) return;

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'REVEAL_RESPONSE',
        payload
      }));
    } else {
      const session = this.getUserSession();
      this.broadcastChannel?.postMessage({
        type: 'TAB_REVEAL_RESPONSE',
        roomId: this.currentRoom.id,
        senderId: session.userId,
        payload
      });
    }
  }

  // Save Connection (Vault Handshake)
  saveConnectionOffer(reconnectCode: string) {
    if (!this.currentRoom) return;

    const session = this.getUserSession();
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'SAVE_CONNECTION',
        senderAlias: session.anonymousAlias,
        reconnectCode
      }));
    } else {
      this.broadcastChannel?.postMessage({
        type: 'TAB_CONNECTION_OFFERED',
        roomId: this.currentRoom.id,
        senderId: session.userId,
        senderAlias: session.anonymousAlias,
        reconnectCode
      });
    }
  }

  // Media & Calling Handlers
  sendMedia(media: MediaAttachment, text = ''): string {
    if (!this.currentRoom) return '';

    const messageId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'SEND_MEDIA',
        id: messageId,
        media,
        text
      }));
    } else {
      const session = this.getUserSession();
      this.broadcastChannel?.postMessage({
        type: 'TAB_MEDIA_MESSAGE',
        roomId: this.currentRoom.id,
        id: messageId,
        senderId: session.userId,
        media,
        text
      });
    }
    return messageId;
  }

  sendCallSignal(signal: CallSignalPayload) {
    if (!this.currentRoom) return;

    const session = this.getUserSession();
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'CALL_SIGNAL',
        signalType: signal.signalType,
        callType: signal.callType,
        payload: signal.payload,
        senderAlias: session.anonymousAlias
      }));
    } else {
      this.broadcastChannel?.postMessage({
        type: 'TAB_CALL_SIGNAL',
        roomId: this.currentRoom.id,
        senderId: session.userId,
        signalType: signal.signalType,
        callType: signal.callType,
        payload: signal.payload,
        senderAlias: session.anonymousAlias
      });
    }
  }

  requestProgress() {
    if (!this.currentRoom) return;
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'GET_PROGRESS' }));
    }
  }

  leaveChat() {
    if (this.currentRoom) {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'LEAVE_CHAT' }));
      } else {
        const session = this.getUserSession();
        this.broadcastChannel?.postMessage({
          type: 'TAB_LEFT',
          roomId: this.currentRoom.id,
          senderId: session.userId
        });
      }

      this.currentRoom = null;
    }
  }

  // Subscriptions
  onMessage(callback: MessageCallback) {
    this.onMessageListener = callback;
  }

  onMessageDelivered(callback: MessageDeliveredCallback) {
    this.onMessageDeliveredListener = callback;
  }

  onMessageRead(callback: MessageReadCallback) {
    this.onMessageReadListener = callback;
  }

  onTyping(callback: TypingCallback) {
    this.onTypingListener = callback;
  }

  onGameLaunched(callback: GameLaunchedCallback) {
    this.onGameLaunchedListener = callback;
  }

  onGameVoted(callback: GameVotedCallback) {
    this.onGameVotedListener = callback;
  }

  onConnectionOffered(callback: ConnectionOfferedCallback) {
    this.onConnectionOfferedListener = callback;
  }

  onRevealRequested(callback: RevealRequestedCallback) {
    this.onRevealRequestedListener = callback;
  }

  onRevealResponded(callback: RevealRespondedCallback) {
    this.onRevealRespondedListener = callback;
  }

  onPartnerLeft(callback: PartnerLeftCallback) {
    this.onPartnerLeftListener = callback;
  }

  onProgress(callback: ProgressCallback) {
    this.onProgressListener = callback;
  }

  onMediaRejected(callback: MediaRejectedCallback) {
    this.onMediaRejectedListener = callback;
  }

  onCallSignal(callback: CallSignalCallback) {
    this.onCallSignalListener = callback;
  }

  onCallRejected(callback: CallRejectedCallback) {
    this.onCallRejectedListener = callback;
  }

  sendPresence(status: 'online' | 'offline') {
    if (!this.currentRoom) return;

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'PRESENCE',
        status
      }));
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'TAB_PARTNER_STATUS',
        roomId: this.currentRoom.id,
        status
      });
    }
  }

  onPartnerStatus(callback: PartnerStatusCallback) {
    this.onPartnerStatusListener = callback;
  }
}

export const chatService = new RealtimeChatService();
