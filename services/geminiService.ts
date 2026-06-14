import { Language, Message, PromptSettings, UserData } from '../types';
import { getTestData } from '../mock/testData';

export interface ChatResponse {
  text: string;
  suggestions: string[];
  visual_tags?: string[];
  current_turn?: number;
  audioBase64?: string;
}

export interface ChatSession {
  sendMessage: (msg: string) => Promise<ChatResponse>;
}

const fallbackImage = '/test-assets/future-self.svg';

const postAiAction = async <TResponse>(action: string, payload: Record<string, unknown>): Promise<TResponse> => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      ...payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API request failed: ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
};

const createDemoResponse = (userData: UserData, turn: number): ChatResponse => {
  const currentTurn = Math.min(Math.max(turn, 1), 10);
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
      ? `(演示模式) ${name}，我听见了。${demoQuestions[currentTurn - 1]}`
      : `(Demo mode) I hear you, ${name}. ${demoQuestions[currentTurn - 1]}`,
    suggestions: currentTurn >= 10
      ? [language === 'zh' ? '面对未来的理想自己' : 'Meet your ideal future self']
      : demoSuggestions,
    visual_tags: ['warm portrait', 'quiet confidence', 'soft morning light'],
    current_turn: currentTurn,
  };
};

export const createChatSession = (userData: UserData, promptSettings?: PromptSettings): ChatSession => {
  const history: Message[] = [];
  let localTurn = 0;

  return {
    sendMessage: async (msg: string) => {
      const nextDemoTurn = Math.min(localTurn + 1, 10);

      try {
        const response = await postAiAction<ChatResponse>('chat', {
          userData,
          message: msg,
          history,
          currentTurn: localTurn,
          promptSettings,
        });

        localTurn = response.current_turn || nextDemoTurn;

        if (!msg.startsWith('(System:')) {
          history.push({ sender: 'user', text: msg });
        }
        history.push({ sender: 'ai', text: response.text });

        return response;
      } catch (e) {
        console.warn('Using local demo response because /api/gemini is unavailable.', e);
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

export const generateFutureSelfPortrait = async (userName: string, collectedTags: string[] = [], promptSettings?: PromptSettings): Promise<string> => {
  try {
    const response = await postAiAction<{ imageUrl: string }>('future-portrait', {
      userName,
      collectedTags,
      promptSettings,
    });

    return response.imageUrl || fallbackImage;
  } catch (e) {
    console.warn('Using fallback portrait because /api/gemini is unavailable.', e);
    return fallbackImage;
  }
};

export const generateFinalLetter = async (userName: string, chatHistorySummary: string, language: Language = 'zh', promptSettings?: PromptSettings): Promise<string> => {
  const fallbackLetter = getTestData(language).fallbackLetter(userName);

  try {
    const response = await postAiAction<{ letter: string }>('final-letter', {
      userName,
      chatHistorySummary,
      language,
      promptSettings,
    });

    return response.letter || fallbackLetter;
  } catch (e) {
    console.warn('Using fallback letter because /api/gemini is unavailable.', e);
    return fallbackLetter;
  }
};

export const generateTimeCapsuleLetter = async (userName: string, chatHistorySummary: string, language: Language = 'zh', promptSettings?: PromptSettings): Promise<string> => {
  const fallbackLetter = getTestData(language).fallbackTimeCapsuleLetter(userName);

  try {
    const response = await postAiAction<{ letter: string }>('time-capsule-letter', {
      userName,
      chatHistorySummary,
      language,
      promptSettings,
    });

    return response.letter || fallbackLetter;
  } catch (e) {
    console.warn('Using fallback time capsule letter because /api/gemini is unavailable.', e);
    return fallbackLetter;
  }
};
