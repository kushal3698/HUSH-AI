export type MoodId = 'happy' | 'career' | 'bored' | 'curious' | 'general';

export type InterestTag = 'tech' | 'gaming' | 'music' | 'career' | 'deep' | 'memes' | 'advice' | 'movies';

export type AiToneMode = 'funny' | 'deep' | 'friendly' | 'intellectual';

export interface MoodCategory {
  id: MoodId;
  label: string;
  emoji: string;
  tagline: string;
  description: string;
  gradient: string;
  accentColor: string;
  badge: string;
}

export interface InterestOption {
  id: InterestTag;
  label: string;
  emoji: string;
}

export type MiniGameType = 'would_you_rather' | 'two_truths_lie';

export interface MiniGameData {
  id: string;
  type: MiniGameType;
  question: string;
  optionA?: string;
  optionB?: string;
  statements?: string[]; // for 2 truths & 1 lie
  lieIndex?: number;
  votes?: Record<string, string>; // userId -> 'A' | 'B' or statement index
  status: 'active' | 'completed';
  initiatorAlias: string;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'stranger' | 'system';
  text: string;
  timestamp: number;
  isAiSuggested?: boolean;
  gameData?: MiniGameData;
  status?: 'sent' | 'delivered' | 'read';
}

export interface RevealProfile {
  name?: string;
  socialHandle?: string;
  cityOrCollege?: string;
  bio?: string;
}

export interface RevealRequestPayload {
  requestId: string;
  senderAlias: string;
  sharedProfile: RevealProfile;
  requestedFields: Array<keyof RevealProfile>;
}

export interface RevealResponsePayload {
  requestId: string;
  accepted: boolean;
  senderAlias: string;
  sharedProfile?: RevealProfile;
}

export interface ChatRoom {
  id: string;
  moodId: MoodId;
  strangerId: string;
  strangerAlias: string;
  strangerMood: string;
  createdAt: number;
  status: 'active' | 'ended' | 'skipped' | 'blocked';
  interests?: string[];
}

export interface VaultConnection {
  id: string;
  strangerAlias: string;
  strangerId: string;
  moodId: MoodId;
  interests?: string[];
  reconnectCode: string;
  savedAt: number;
}

export interface UserSession {
  userId: string;
  anonymousAlias: string;
  isGuest: boolean;
  selectedMood: MoodId | null;
  selectedInterests?: string[];
  blockedUserIds: string[];
  totalChatsCount: number;
  createdAt: number;
}

export type ScreenState = 'welcome' | 'mood-select' | 'matching' | 'chat';

export type ReportReason = 
  | 'harassment'
  | 'inappropriate_content'
  | 'spam_or_bot'
  | 'underage_user'
  | 'privacy_violation'
  | 'other';

export interface AiSuggestion {
  id: string;
  topic: MoodId;
  text: string;
  tone: AiToneMode;
}
