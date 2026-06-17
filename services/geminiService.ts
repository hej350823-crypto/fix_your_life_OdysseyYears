import { DEFAULT_PROMPT_SETTINGS } from '../config/promptSettings';
import { Language, Message, PromptSettings, UserData, UserPersonaProfile } from '../types';
import { getTestData } from '../mock/testData';

export interface ChatResponse {
  text: string;
  suggestions: string[];
  visual_tags?: string[];
  current_turn?: number;
  audioBase64?: string;
}

interface ChatStreamEvent {
  type: 'text_delta' | 'done' | 'error';
  delta?: string;
  data?: ChatResponse;
  error?: string;
}

interface SendMessageOptions {
  onTextChunk?: (chunk: string) => void;
}

export interface ChatSession {
  sendMessage: (msg: string, options?: SendMessageOptions) => Promise<ChatResponse>;
}

type ApiErrorResponse = {
  error?: string;
  hint?: string | null;
  errorType?: string | null;
  provider?: string | null;
  baseUrl?: string | null;
  upstreamStatus?: number | null;
};

const fallbackImage = '/test-assets/future-self.png';
const MAX_CHAT_TURNS = 6;
const ADMIN_TOKEN_STORAGE_KEY = 'fix-your-life.admin-token.v1';
const STREAM_IDLE_TIMEOUT_MS = 15000;
const IMAGE_API_MAX_EDGE = 1024;
const IMAGE_API_EXPORT_QUALITY = 0.76;

const withoutPhoto = (userData: UserData): UserData => ({
  ...userData,
  photo: null,
});

const isImageDataUrl = (value?: string | null) => (
  typeof value === 'string' && /^data:image\//i.test(value)
);

const loadBrowserImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Image decode failed'));
  image.src = src;
});

const compressImageDataUrl = async (
  imageDataUrl?: string | null,
  maxEdge = IMAGE_API_MAX_EDGE,
  quality = IMAGE_API_EXPORT_QUALITY,
) => {
  if (!isImageDataUrl(imageDataUrl) || typeof document === 'undefined') {
    return imageDataUrl || '';
  }

  try {
    const image = await loadBrowserImage(imageDataUrl);
    const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = Math.min(1, maxEdge / longestEdge);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return imageDataUrl;
    }

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } catch (error) {
    console.warn('Image payload compression failed. Sending original image.', error);
    return imageDataUrl;
  }
};

const hasCustomPromptSettings = (promptSettings?: PromptSettings) => {
  if (!promptSettings) return false;

  return (Object.keys(DEFAULT_PROMPT_SETTINGS) as Array<keyof PromptSettings>)
    .some((key) => promptSettings[key] !== DEFAULT_PROMPT_SETTINGS[key]);
};

const getAdminToken = () => {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '';
};

export const setAdminToken = (token: string | null) => {
  if (typeof window === 'undefined') return;

  if (token) {
    window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    return;
  }

  window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
};

const formatApiErrorMessage = (detail: ApiErrorResponse | null, status: number) => {
  const headline = detail?.error || `AI API request failed: ${status}`;
  const extras = [
    detail?.errorType ? `类型：${detail.errorType}` : '',
    detail?.provider ? `提供方：${detail.provider}` : '',
    detail?.hint ? `提示：${detail.hint}` : '',
  ].filter(Boolean);

  return extras.length > 0 ? `${headline}。${extras.join('；')}` : headline;
};

const postAiAction = async <TResponse>(action: string, payload: Record<string, unknown>): Promise<TResponse> => {
  const nextPayload = { ...payload };
  const promptSettings = nextPayload.promptSettings as PromptSettings | undefined;

  if (hasCustomPromptSettings(promptSettings)) {
    const adminToken = getAdminToken();
    if (!adminToken) {
      throw new Error('Prompt admin verification expired. Please re-enter the admin password before using custom prompts.');
    }

    nextPayload.adminToken = adminToken;
  } else {
    delete nextPayload.promptSettings;
  }

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      ...nextPayload,
    }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null) as ApiErrorResponse | null;
    throw new Error(formatApiErrorMessage(detail, response.status));
  }

  return response.json() as Promise<TResponse>;
};

const postAiActionStream = async (
  action: string,
  payload: Record<string, unknown>,
  onEvent: (event: ChatStreamEvent) => void,
): Promise<ChatResponse> => {
  const nextPayload = { ...payload };
  const promptSettings = nextPayload.promptSettings as PromptSettings | undefined;

  if (hasCustomPromptSettings(promptSettings)) {
    const adminToken = getAdminToken();
    if (!adminToken) {
      throw new Error('Prompt admin verification expired. Please re-enter the admin password before using custom prompts.');
    }

    nextPayload.adminToken = adminToken;
  } else {
    delete nextPayload.promptSettings;
  }

  const abortController = new AbortController();
  let streamTimeout: ReturnType<typeof setTimeout> | undefined;
  const refreshStreamTimeout = () => {
    if (streamTimeout) {
      clearTimeout(streamTimeout);
    }

    streamTimeout = setTimeout(() => {
      abortController.abort();
    }, STREAM_IDLE_TIMEOUT_MS);
  };

  try {
    refreshStreamTimeout();

    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: abortController.signal,
      body: JSON.stringify({
        action,
        ...nextPayload,
      }),
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => null) as ApiErrorResponse | null;
      throw new Error(formatApiErrorMessage(detail, response.status));
    }

    if (!response.body) {
      throw new Error('Streaming response body is unavailable.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResponse: ChatResponse | null = null;

    while (true) {
      const { value, done } = await reader.read();
      refreshStreamTimeout();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const event = JSON.parse(trimmed) as ChatStreamEvent;
        onEvent(event);

        if (event.type === 'error') {
          throw new Error(event.error || 'Streaming request failed.');
        }

        if (event.type === 'done' && event.data) {
          finalResponse = event.data;
        }
      }

      if (done) break;
    }

    if (buffer.trim()) {
      const event = JSON.parse(buffer.trim()) as ChatStreamEvent;
      onEvent(event);

      if (event.type === 'error') {
        throw new Error(event.error || 'Streaming request failed.');
      }

      if (event.type === 'done' && event.data) {
        finalResponse = event.data;
      }
    }

    if (!finalResponse) {
      throw new Error('Streaming response ended before completion.');
    }

    return finalResponse;
  } catch (error) {
    if (abortController.signal.aborted) {
      throw new Error('Streaming response timed out after a long pause. Please try again.');
    }

    throw error;
  } finally {
    if (streamTimeout) {
      clearTimeout(streamTimeout);
    }
  }
};

const createDemoResponse = (userData: UserData, turn: number): ChatResponse => {
  const currentTurn = Math.min(Math.max(turn, 1), MAX_CHAT_TURNS);
  const language = userData.language || 'zh';
  const demoQuestions = getTestData(language).demoQuestions;
  const name = userData.name;
  const demoSuggestions = language === 'zh'
    ? [
        '我其实最怕选错方向',
        '我知道问题，但很难开始',
        '我只是太累了，想先停一下',
        '我想要更清楚地看见自己',
      ]
    : [
        'I am afraid of choosing wrong',
        'I know the issue, but cannot begin',
        'I am just tired and need to pause',
        'I want to see myself more clearly',
      ];

  return {
    text: language === 'zh'
      ? `${name}，我听见了。${demoQuestions[currentTurn - 1]}`
      : `I hear you, ${name}. ${demoQuestions[currentTurn - 1]}`,
    suggestions: currentTurn >= MAX_CHAT_TURNS
      ? [language === 'zh' ? '面对未来的理想自己' : 'Meet your ideal future self']
      : demoSuggestions,
    visual_tags: ['warm portrait', 'quiet confidence', 'soft morning light'],
    current_turn: currentTurn,
  };
};

export const createChatSession = (userData: UserData, promptSettings?: PromptSettings): ChatSession => {
  const history: Message[] = [];
  const textUserData = withoutPhoto(userData);
  let localTurn = 0;

  return {
    sendMessage: async (msg: string, options?: SendMessageOptions) => {
      const nextDemoTurn = Math.min(localTurn + 1, MAX_CHAT_TURNS);

      if (userData.isTestMode) {
        localTurn = nextDemoTurn;
        const response = createDemoResponse(userData, localTurn);

        if (!msg.startsWith('(System:')) {
          history.push({ sender: 'user', text: msg });
        }
        history.push({ sender: 'ai', text: response.text });

        return response;
      }

      try {
        const response = await postAiActionStream('chat-stream', {
          userData: textUserData,
          message: msg,
          history,
          currentTurn: localTurn,
          promptSettings,
        }, (event) => {
          if (event.type === 'text_delta' && event.delta) {
            options?.onTextChunk?.(event.delta);
          }
        });

        localTurn = response.current_turn || nextDemoTurn;

        if (!msg.startsWith('(System:')) {
          history.push({ sender: 'user', text: msg });
        }
        history.push({ sender: 'ai', text: response.text });

        return response;
      } catch (e) {
        console.warn('/api/gemini is unavailable.', e);

        if (!userData.isTestMode) {
          return {
            text: userData.language === 'zh'
              ? `这次对话没有成功连接到 AI 服务。可能是网络、代理、接口配置或上游服务暂时不可用。错误信息：${e instanceof Error ? e.message : '未知错误'}`
              : `This chat could not connect to the AI service. It may be a network, proxy, API configuration, or upstream service issue. Error: ${e instanceof Error ? e.message : 'Unknown error'}`,
            suggestions: [],
            current_turn: localTurn,
          };
        }

        localTurn = nextDemoTurn;
        const response = createDemoResponse(userData, localTurn);

        if (!msg.startsWith('(System:')) {
          history.push({ sender: 'user', text: msg });
        }
        history.push({ sender: 'ai', text: response.text });

        return response;
      }
    },
  };
};

export const generateFutureSelfPortrait = async (
  userName: string,
  collectedTags: string[] = [],
  promptSettings?: PromptSettings,
  userPhoto?: string | null,
  personaProfile?: UserPersonaProfile,
): Promise<string> => {
  try {
    const preparedUserPhoto = await compressImageDataUrl(userPhoto);
    const response = await postAiAction<{ imageUrl: string }>('future-portrait', {
      userName,
      collectedTags,
      promptSettings,
      userPhoto: preparedUserPhoto,
      personaProfile,
    });

    return response.imageUrl || fallbackImage;
  } catch (e) {
    console.warn('/api/gemini future portrait is unavailable.', e);
    throw e;
  }
};

export const generateCurrentSelfPortrait = async (
  userName: string,
  personaProfile?: UserPersonaProfile,
  promptSettings?: PromptSettings,
  userPhoto?: string | null,
): Promise<string> => {
  try {
    const preparedUserPhoto = await compressImageDataUrl(userPhoto);
    const response = await postAiAction<{ imageUrl: string }>('current-portrait', {
      userName,
      personaProfile,
      promptSettings,
      userPhoto: preparedUserPhoto,
    });

    return response.imageUrl || fallbackImage;
  } catch (e) {
    console.warn('/api/gemini current portrait is unavailable.', e);
    throw e;
  }
};

export const generateUserPersonaProfile = async (
  userData: UserData,
  chatHistorySummary: string,
  language: Language = 'zh',
  promptSettings?: PromptSettings,
): Promise<UserPersonaProfile> => {
  try {
    const response = await postAiAction<{ personaProfile: UserPersonaProfile }>('user-persona', {
      userData: withoutPhoto(userData),
      chatHistorySummary,
      language,
      promptSettings,
      isTestMode: userData.isTestMode,
    });

    return response.personaProfile || {};
  } catch (e) {
    console.warn('/api/gemini user persona is unavailable.', e);
    throw e;
  }
};

export const generateFinalLetter = async (
  userName: string,
  chatHistorySummary: string,
  language: Language = 'zh',
  promptSettings?: PromptSettings,
  personaProfile?: UserPersonaProfile,
): Promise<string> => {
  const fallbackLetter = getTestData(language).fallbackLetter(userName);

  try {
    const response = await postAiAction<{ letter: string }>('final-letter', {
      userName,
      chatHistorySummary,
      language,
      promptSettings,
      personaProfile,
    });

    return response.letter || fallbackLetter;
  } catch (e) {
    console.warn('/api/gemini final letter is unavailable.', e);
    throw e;
  }
};

export const generateTimeCapsuleLetter = async (
  userName: string,
  chatHistorySummary: string,
  language: Language = 'zh',
  promptSettings?: PromptSettings,
  personaProfile?: UserPersonaProfile,
): Promise<string> => {
  const fallbackLetter = getTestData(language).fallbackTimeCapsuleLetter(userName);

  try {
    const response = await postAiAction<{ letter: string }>('time-capsule-letter', {
      userName,
      chatHistorySummary,
      language,
      promptSettings,
      personaProfile,
    });

    return response.letter || fallbackLetter;
  } catch (e) {
    console.warn('/api/gemini time capsule letter is unavailable.', e);
    throw e;
  }
};
