export interface ScrollProgress {
  progress: number;
}

export enum ViewState {
  LANDING = 'LANDING',
  ONBOARDING = 'ONBOARDING',
  CHAT = 'CHAT',
  RESULT = 'RESULT',
  TIME_CAPSULE = 'TIME_CAPSULE',
  ADMIN = 'ADMIN',
  LETTER = 'LETTER',
}

export type ConversationStage = 'anti-vision' | 'shift' | 'ideal';
export type Language = 'zh' | 'en';

export interface UserData {
  name: string;
  painPoints: string[];
  photo: string | null;
  language: Language;
  isTestMode?: boolean;
}

export interface PromptSettings {
  futureSelfRole: string;
  conversationProtocol: string;
  responseRules: string;
  imagePrompt: string;
  letterPrompt: string;
}

export interface GenerationResult {
  imageUrl: string;
  letter: string;
  timeCapsuleLetter: string;
}

export type TimeCapsuleDelay = 'oneMonth' | 'threeMonths' | 'sixMonths' | 'oneYear';

export interface TimeCapsulePayload {
  userName: string;
  email: string;
  message: string;
  sendAt: string;
  delay: TimeCapsuleDelay;
  language: Language;
}

export interface Message {
  sender: 'ai' | 'user';
  text: string;
  audioBase64?: string;
  suggestions?: string[];
  visualTags?: string[];
}

export interface TestProfile {
  name: string;
  painPoints: string[];
  photo: string;
}
