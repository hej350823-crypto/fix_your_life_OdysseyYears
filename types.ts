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
  chatSystemPrompt: string;
  userPersonaPrompt: string;
  imagePrompt: string;
  currentImagePrompt: string;
  letterPrompt: string;
  timeCapsulePrompt: string;
}

export interface UserPersonaProfile {
  present_persona?: {
    core_emotion?: string;
    behavior_pattern?: string;
    limiting_belief?: string;
    living_metaphor?: string;
    visual_cues?: {
      facial_expression?: string;
      ideal_environment?: string;
      symbolic_props?: string[];
    };
    visual_tags_en?: string[];
  };
  future_persona?: {
    desired_state?: string;
    core_values?: string[];
    symbolic_micro_action?: string;
    living_metaphor?: string;
    visual_cues?: {
      facial_expression?: string;
      ideal_environment?: string;
      symbolic_props?: string[];
    };
    visual_tags_en?: string[];
  };
  evidence?: string[];
}

export interface GenerationResult {
  imageUrl: string;
  letter: string;
  conversationSummary: string;
  personaProfile?: UserPersonaProfile;
}

export type TimeCapsuleDelay = 'threeDays' | 'oneWeek' | 'twoWeeks' | 'oneMonth';

export interface TimeCapsulePayload {
  userName: string;
  email: string;
  message: string;
  imageUrl?: string;
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
