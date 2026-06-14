import { buildImagePrompt, buildLetterPrompt, buildSystemPrompt } from '../config/promptSettings.js';
import { getTestData } from '../mock/testData.js';

const fallbackImage = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

const getTextProvider = () => {
  const arkTextModel = process.env.ARK_TEXT_MODEL || '';

  if (process.env.ARK_API_KEY && arkTextModel) {
    return {
      apiKey: process.env.ARK_API_KEY,
      baseUrl: process.env.ARK_TEXT_BASE_URL || process.env.ARK_IMAGE_BASE_URL || DEFAULT_ARK_BASE_URL,
      model: arkTextModel,
      name: 'Ark text',
    };
  }

  if (process.env.DEEPSEEK_API_KEY) {
    return {
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: DEEPSEEK_BASE_URL,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
      name: 'DeepSeek',
    };
  }

  return null;
};

const callTextModel = async ({ messages, responseFormat, maxTokens = 1000 }) => {
  const provider = getTextProvider();
  if (!provider) {
    return null;
  }

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      response_format: responseFormat,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${provider.name} API request failed: ${response.status} ${detail}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};

const callArkImage = async ({ prompt }) => {
  const apiKey = process.env.ARK_API_KEY || process.env.DOUBAO_API_KEY;
  const imageModel = process.env.ARK_IMAGE_MODEL || '';

  if (!apiKey || !imageModel) {
    return null;
  }

  const response = await fetch(`${process.env.ARK_IMAGE_BASE_URL || DEFAULT_ARK_BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: imageModel,
      prompt,
      response_format: 'url',
      size: process.env.ARK_IMAGE_SIZE || '1024x1536',
      n: 1,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Ark image request failed: ${response.status} ${detail}`);
  }

  const data = await response.json();
  const firstImage = data.data?.[0] || data.images?.[0] || data.result?.data?.[0];
  if (firstImage?.url) return firstImage.url;
  if (firstImage?.b64_json) return `data:image/png;base64,${firstImage.b64_json}`;
  if (typeof firstImage === 'string') return firstImage;
  return null;
};

const cleanJsonString = (value = '') => {
  let cleaned = value.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
  }
  return cleaned.trim() || '{}';
};

const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const createDemoResponse = (name, currentTurn, language = 'zh') => {
  const turn = Math.min(Math.max(Number(currentTurn || 0) + 1, 1), 10);
  const demoQuestions = getTestData(language).demoQuestions;
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
      ? `(演示模式) ${name || '朋友'}，我听见了。${demoQuestions[turn - 1]}`
      : `(Demo mode) I hear you, ${name || 'friend'}. ${demoQuestions[turn - 1]}`,
    suggestions: turn >= 10
      ? [language === 'zh' ? '面对未来的理想自己' : 'Meet your ideal future self']
      : demoSuggestions,
    visual_tags: ['warm portrait', 'quiet confidence', 'soft morning light'],
    current_turn: turn,
  };
};

const handleChat = async (body) => {
  const { userData, message, history = [], currentTurn = 0, promptSettings } = body;
  const safeHistory = Array.isArray(history) ? history.slice(-12) : [];
  const name = userData?.name || '朋友';

  if (!getTextProvider()) {
    return createDemoResponse(name, currentTurn, userData?.language || 'zh');
  }

  const transcript = safeHistory
    .map((entry) => `${entry.sender === 'user' ? 'User' : 'Future Self'}: ${entry.text}`)
    .join('\n');

  const content = await callTextModel({
    messages: [
      {
        role: 'system',
        content: `${buildSystemPrompt(userData, promptSettings)}

Return valid json only, with this exact shape:
{
  "text": "string",
  "suggestions": ["exactly 4 choice-first possible user answers"],
  "visual_tags": ["english visual tag"],
  "current_turn": 1
}`,
      },
      {
        role: 'user',
        content: `
      Conversation history:
      ${transcript || '(no previous history)'}

      Latest user message:
      ${message}

      Previous current_turn: ${currentTurn}
    `,
      },
    ],
    responseFormat: { type: 'json_object' },
    maxTokens: 1200,
  });

  let parsed;
  try {
    parsed = JSON.parse(cleanJsonString(content || '{}'));
  } catch (e) {
    console.error('JSON parse error', e);
    parsed = createDemoResponse(name, currentTurn, userData?.language || 'zh');
  }

  return parsed;
};

const handleFinalLetter = async (body) => {
  const userName = body.userName || '朋友';
  const language = body.language || 'zh';
  const fallbackLetter = getTestData(language).fallbackLetter(userName);

  if (!getTextProvider()) {
    return { letter: fallbackLetter };
  }

  const content = await callTextModel({
    messages: [
      {
        role: 'user',
        content: buildLetterPrompt({
          userName,
          chatHistorySummary: body.chatHistorySummary,
          language,
          promptSettings: body.promptSettings,
        }),
      },
    ],
    maxTokens: 700,
  });

  return { letter: content || fallbackLetter };
};

const handleTimeCapsuleLetter = async (body) => {
  const userName = body.userName || '朋友';
  const language = body.language || 'zh';
  const fallbackLetter = getTestData(language).fallbackTimeCapsuleLetter(userName);

  if (!getTextProvider()) {
    return { letter: fallbackLetter };
  }

  const content = await callTextModel({
    messages: [
      {
        role: 'user',
        content: language === 'zh'
          ? `
        请为 ${userName} 写一封“现在寄给未来自己的密封信”。

        这封信不会立刻展示给用户，而是在未来某个日期通过邮件发送给用户。
        语气要求：
        - 像一个温柔、清醒、不过度鸡汤的未来见证者
        - 回应用户此刻的困惑与改变意愿
        - 不做诊断，不承诺治愈
        - 让未来的用户能够回看今天的自己
        - 180-260 字

        对话摘要：
        ${body.chatHistorySummary || '(no summary)'}
      `
          : `
        Write a sealed letter from the present moment to ${userName}'s future self.

        This letter will not be shown now. It will be emailed to the user at a future date.
        Tone:
        - warm, clear, emotionally grounded
        - not cheesy or overpromising
        - reflect today's struggle and willingness to change
        - no diagnosis, no promise of cure
        - 140-220 words

        Conversation summary:
        ${body.chatHistorySummary || '(no summary)'}
      `,
      },
    ],
    maxTokens: 900,
  });

  return { letter: content || fallbackLetter };
};

const handleFuturePortrait = async (body) => {
  const userName = body.userName || 'the user';
  const tags = Array.isArray(body.collectedTags) && body.collectedTags.length > 0
    ? body.collectedTags.join(', ')
    : 'confident, peaceful, warm lighting';

  const prompt = buildImagePrompt({
    userName,
    visualTags: tags,
    promptSettings: body.promptSettings,
  });

  try {
    const imageUrl = await callArkImage({ prompt });
    if (imageUrl) {
      return { imageUrl };
    }
  } catch (e) {
    console.warn('Using fallback portrait because Ark image generation failed.', e);
  }

  return {
    imageUrl: fallbackImage,
  };
};

const handleTimeCapsule = async (body) => {
  const { email, message, sendAt, userName, language = 'zh' } = body;

  if (!email || !message || !sendAt) {
    return {
      error: 'Missing required time capsule fields',
    };
  }

  return {
    id: `demo-${Date.now()}`,
    status: 'pending',
    storedLocally: true,
    userName,
    email,
    message,
    sendAt,
    language,
  };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (body.action === 'chat') {
      return sendJson(res, 200, await handleChat(body));
    }

    if (body.action === 'final-letter') {
      return sendJson(res, 200, await handleFinalLetter(body));
    }

    if (body.action === 'time-capsule-letter') {
      return sendJson(res, 200, await handleTimeCapsuleLetter(body));
    }

    if (body.action === 'future-portrait') {
      return sendJson(res, 200, await handleFuturePortrait(body));
    }

    if (body.action === 'time-capsule') {
      return sendJson(res, 200, await handleTimeCapsule(body));
    }

    return sendJson(res, 400, { error: 'Unknown action' });
  } catch (e) {
    console.error('AI endpoint failed', e);
    return sendJson(res, 500, { error: 'AI endpoint failed' });
  }
}
