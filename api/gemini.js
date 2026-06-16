import {
  buildCurrentImagePrompt,
  buildImagePrompt,
  buildLetterPrompt,
  buildSystemPrompt,
  buildTimeCapsulePrompt,
  buildUserPersonaPrompt,
} from '../config/promptSettings.js';
import { getTestData } from '../mock/testData.js';
import { getNetworkDiagnostics, networkFetch } from './networkFetch.js';

const fallbackImage = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const MAX_CHAT_TURNS = 6;

const createApiError = (message, statusCode = 500, meta = {}) => Object.assign(new Error(message), {
  statusCode,
  ...meta,
});

const getNetworkHint = ({ providerName, baseUrl, diagnostics }) => {
  const prefix = providerName === 'DeepSeek' ? 'DeepSeek' : 'Ark';

  if (diagnostics?.spoofedAddress) {
    return `检测到 fake-ip（${diagnostics.spoofedAddress}）。Clash / FlClash 可能仍在运行。请完全退出代理，或把 *.volces.com 设为直连。`;
  }

  return `外部请求没连通。可能是 VPN / 代理 / 防火墙拦住了本机进程访问 ${prefix} 接口，也可能是 ${baseUrl} 不可达。`;
};

const getResponseErrorMeta = ({ providerName, status, detail, action }) => {
  if (status === 401 || status === 403) {
    return {
      errorType: 'auth',
      hint: `${providerName} 返回了 ${status}。通常是 API key 无效、过期，或者账号权限不足。`,
    };
  }

  if (status === 404) {
    return {
      errorType: 'model_or_endpoint',
      hint: `${providerName} 返回了 404。通常是 model 名称写错，或者 base URL 配错。`,
    };
  }

  if (status === 429) {
    return {
      errorType: 'rate_limit',
      hint: `${providerName} 返回了 429。当前请求太频繁，稍后重试就好。`,
    };
  }

  if (status >= 500) {
    return {
      errorType: 'upstream',
      hint: `${providerName} 服务端暂时不可用。可以稍后再试。`,
    };
  }

  return {
    errorType: 'provider_error',
    hint: `${providerName} 返回了 ${status}。请检查模型名、参数和接入方式。`,
  };
};

const getFetchErrorMeta = ({ providerName, baseUrl, diagnostics }) => ({
  errorType: 'network',
  hint: getNetworkHint({ providerName, baseUrl, diagnostics }),
});

const getTextProvider = () => {
  if (process.env.DEEPSEEK_API_KEY) {
    return {
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: DEEPSEEK_BASE_URL,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
      name: 'DeepSeek',
    };
  }

  const arkTextModel = process.env.ARK_TEXT_MODEL || '';

  if (process.env.ARK_API_KEY && arkTextModel) {
    return {
      apiKey: process.env.ARK_API_KEY,
      baseUrl: process.env.ARK_TEXT_BASE_URL || process.env.ARK_IMAGE_BASE_URL || DEFAULT_ARK_BASE_URL,
      model: arkTextModel,
      name: 'Ark text',
    };
  }

  return null;
};

const callTextModel = async ({ messages, responseFormat, maxTokens = 1000 }) => {
  const provider = getTextProvider();
  if (!provider) {
    return null;
  }

  let response;
  try {
    response = await networkFetch(`${provider.baseUrl}/chat/completions`, {
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
  } catch (error) {
    const diagnostics = await getNetworkDiagnostics(provider.baseUrl).catch(() => null);
    throw createApiError(
      `${provider.name} API request failed: ${error?.message || 'fetch failed'}`,
      502,
      {
        provider: provider.name,
        baseUrl: provider.baseUrl,
        ...getFetchErrorMeta({ providerName: provider.name, baseUrl: provider.baseUrl, diagnostics }),
      },
    );
  }

  if (!response.ok) {
    const detail = await response.text();
    const meta = getResponseErrorMeta({
      providerName: provider.name,
      status: response.status,
      detail,
      action: 'text',
    });
    throw createApiError(`${provider.name} API request failed: ${response.status} ${detail}`, response.status, {
      provider: provider.name,
      baseUrl: provider.baseUrl,
      upstreamStatus: response.status,
      upstreamDetail: detail,
      ...meta,
    });
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};

const callArkImage = async ({ prompt, referenceImage }) => {
  const apiKey = process.env.ARK_API_KEY || process.env.DOUBAO_API_KEY;
  const imageModel = process.env.ARK_IMAGE_MODEL
    || process.env.ARK_IMAGE_MODEL_ID
    || process.env.DOUBAO_IMAGE_MODEL
    || process.env.DOUBAO_IMAGE_MODEL_ID
    || '';

  if (!apiKey || !imageModel) {
    return null;
  }

  const imageBaseUrl = process.env.ARK_IMAGE_BASE_URL
    || process.env.DOUBAO_IMAGE_BASE_URL
    || DEFAULT_ARK_BASE_URL;
  const watermarkEnabled = String(process.env.ARK_IMAGE_WATERMARK || process.env.DOUBAO_IMAGE_WATERMARK || '')
    .toLowerCase() === 'true';
  const outputFormat = process.env.ARK_IMAGE_OUTPUT_FORMAT || process.env.DOUBAO_IMAGE_OUTPUT_FORMAT || 'png';

  let response;
  try {
    response = await networkFetch(`${imageBaseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageModel,
        prompt,
        ...(referenceImage ? { image: referenceImage } : {}),
        response_format: 'url',
        size: process.env.ARK_IMAGE_SIZE || process.env.DOUBAO_IMAGE_SIZE || '2K',
        output_format: outputFormat,
        ...(watermarkEnabled ? { watermark: true } : {}),
        n: 1,
      }),
    });
  } catch (error) {
    const diagnostics = await getNetworkDiagnostics(imageBaseUrl).catch(() => null);
    throw createApiError(
      `Ark image request failed: ${error?.message || 'fetch failed'}`,
      502,
      {
        provider: 'Ark image',
        baseUrl: imageBaseUrl,
        ...getFetchErrorMeta({ providerName: 'Ark image', baseUrl: imageBaseUrl, diagnostics }),
      },
    );
  }

  if (!response.ok) {
    const detail = await response.text();
    const meta = getResponseErrorMeta({
      providerName: 'Ark image',
      status: response.status,
      detail,
      action: 'image',
    });
    throw createApiError(`Ark image request failed: ${response.status} ${detail}`, response.status, {
      provider: 'Ark image',
      baseUrl: imageBaseUrl,
      upstreamStatus: response.status,
      upstreamDetail: detail,
      ...meta,
    });
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

const serializePersonaForPrompt = (personaProfile) => {
  if (!personaProfile) return '';
  if (typeof personaProfile === 'string') return personaProfile;
  return JSON.stringify(personaProfile, null, 2);
};

const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const createDemoPersonaProfile = (name, language = 'zh') => {
  if (language === 'en') {
    return {
      present_persona: {
        core_emotion: 'A tired uncertainty, mixed with the wish to see oneself more clearly.',
        behavior_pattern: 'Pausing and delaying decisions as a way to protect against choosing the wrong direction.',
        limiting_belief: 'There may be a quiet fear that one wrong step means falling behind.',
        living_metaphor: 'Like standing in a room before sunrise, able to sense the window but not yet the view.',
        visual_cues: {
          facial_expression: 'Soft tired eyes, a quiet inward-looking expression, and a face that looks paused rather than defeated.',
          ideal_environment: 'An ordinary room in gentle indoor light, slightly still, with a calm window-side atmosphere.',
          symbolic_props: ['half-open notebook', 'warm cup'],
        },
        visual_tags_en: ['quiet introspection', 'gentle indoor light', 'soft tired eyes', 'ordinary room', 'warm cup'],
      },
      future_persona: {
        desired_state: 'A steadier self who can move before everything is perfectly certain.',
        core_values: ['self-trust', 'gentle exploration'],
        symbolic_micro_action: 'Place one hand on a warm cup and write down the next smallest step.',
        living_metaphor: 'A clear morning path slowly appearing after the fog lifts.',
        visual_cues: {
          facial_expression: 'Clear, gentle eyes with a small relieved smile, calm rather than triumphant.',
          ideal_environment: 'A sunlit, minimal room with fresh air and a quiet morning atmosphere.',
          symbolic_props: ['warm tea', 'open notebook'],
        },
        visual_tags_en: ['calm clear eyes', 'soft morning light', 'quiet confidence', 'open notebook'],
      },
      evidence: [`${name || 'The user'} selected uncertainty-oriented answers`, 'The conversation points toward fatigue and a wish for clarity'],
    };
  }

  return {
    present_persona: {
      core_emotion: '一种带着疲惫的迷茫，里面也有想重新看清自己的愿望。',
      behavior_pattern: '可能会通过暂停、拖延或反复思考来保护自己，避免太快做出错误选择。',
      limiting_belief: '内心似乎担心一旦走错一步，就会被同龄人落下。',
      living_metaphor: '像站在天亮前的房间里，知道窗户在那儿，却还看不清外面的路。',
      visual_cues: {
        facial_expression: '眼神有一点疲惫和内收，但不是崩溃；像终于允许自己暂停下来，安静地看向某处。',
        ideal_environment: '普通房间的一角，柔和室内光，窗边有一点未散开的安静感，空间真实但不凌乱。',
        symbolic_props: ['半开的笔记本', '一杯温水'],
      },
      visual_tags_en: ['quiet introspection', 'gentle indoor light', 'soft tired eyes', 'ordinary room', 'warm cup'],
    },
    future_persona: {
      desired_state: '成为一个不必等完全确定，也能温柔向前移动的人。',
      core_values: ['自我信任', '温柔探索'],
      symbolic_micro_action: '把手放在一杯温水旁，在纸上写下今天最小的一步。',
      living_metaphor: '雾慢慢散开后，一条清晨的小路终于显出来。',
      visual_cues: {
        facial_expression: '眼神清澈温和，嘴角有一点如释重负的浅笑，平静而不夸张。',
        ideal_environment: '有清晨柔光、空气流动、安静整洁的极简房间。',
        symbolic_props: ['一杯温水', '翻开的笔记本'],
      },
      visual_tags_en: ['calm clear eyes', 'soft morning light', 'quiet confidence', 'open notebook'],
    },
    evidence: [`${name || '用户'}的选择集中在害怕选错和想看清自己`, '对话呈现出疲惫、停顿和重新开始的愿望'],
  };
};

const createDemoResponse = (name, currentTurn, language = 'zh') => {
  const turn = Math.min(Math.max(Number(currentTurn || 0) + 1, 1), MAX_CHAT_TURNS);
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
    suggestions: turn >= MAX_CHAT_TURNS
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

  if (!getTextProvider() && userData?.isTestMode) {
    return createDemoResponse(name, currentTurn, userData?.language || 'zh');
  }

  if (!getTextProvider()) {
    throw createApiError('AI provider is not configured. Add ARK_API_KEY + ARK_TEXT_MODEL or DEEPSEEK_API_KEY.', 503);
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

  parsed.current_turn = Math.min(Math.max(Number(parsed.current_turn || Number(currentTurn || 0) + 1), 1), MAX_CHAT_TURNS);

  return parsed;
};

const handleUserPersona = async (body) => {
  const userData = body.userData || {};
  const userName = userData.name || '朋友';
  const language = body.language || userData.language || 'zh';

  if (body.isTestMode || userData.isTestMode) {
    return { personaProfile: createDemoPersonaProfile(userName, language) };
  }

  if (!getTextProvider()) {
    throw createApiError('AI provider is not configured. Add ARK_API_KEY + ARK_TEXT_MODEL or DEEPSEEK_API_KEY.', 503);
  }

  const content = await callTextModel({
    messages: [
      {
        role: 'user',
        content: buildUserPersonaPrompt({
          userName,
          painPoints: userData.painPoints,
          chatHistorySummary: body.chatHistorySummary,
          promptSettings: body.promptSettings,
        }),
      },
    ],
    responseFormat: { type: 'json_object' },
    maxTokens: 1600,
  });

  try {
    return { personaProfile: JSON.parse(cleanJsonString(content || '{}')) };
  } catch (e) {
    console.error('Persona JSON parse error', e);
    return { personaProfile: createDemoPersonaProfile(userName, language) };
  }
};

const handleFinalLetter = async (body) => {
  const userName = body.userName || '朋友';
  const language = body.language || 'zh';
  const fallbackLetter = getTestData(language).fallbackLetter(userName);

  if (body.isTestMode) {
    return { letter: fallbackLetter };
  }

  if (!getTextProvider()) {
    throw createApiError('AI provider is not configured. Add ARK_API_KEY + ARK_TEXT_MODEL or DEEPSEEK_API_KEY.', 503);
  }

  const content = await callTextModel({
    messages: [
      {
        role: 'user',
        content: buildLetterPrompt({
          userName,
          chatHistorySummary: [
            body.chatHistorySummary || '',
            body.personaProfile ? `\nUser persona profile:\n${serializePersonaForPrompt(body.personaProfile)}` : '',
          ].filter(Boolean).join('\n'),
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

  if (body.isTestMode) {
    return { letter: fallbackLetter };
  }

  if (!getTextProvider()) {
    throw createApiError('AI provider is not configured. Add ARK_API_KEY + ARK_TEXT_MODEL or DEEPSEEK_API_KEY.', 503);
  }

  const content = await callTextModel({
    messages: [
      {
        role: 'user',
        content: buildTimeCapsulePrompt({
          userName,
          chatHistorySummary: [
            body.chatHistorySummary || '',
            body.personaProfile ? `\nUser persona profile:\n${serializePersonaForPrompt(body.personaProfile)}` : '',
          ].filter(Boolean).join('\n'),
          language,
          promptSettings: body.promptSettings,
        }),
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
  const referenceImage = typeof body.userPhoto === 'string' && body.userPhoto.trim().length > 0
    ? body.userPhoto.trim()
    : '';

  const prompt = buildImagePrompt({
    userName,
    visualTags: tags,
    futurePersona: body.personaProfile?.future_persona,
    promptSettings: body.promptSettings,
  });

  if (body.isTestMode) {
    return {
      imageUrl: fallbackImage,
    };
  }

  if (!process.env.ARK_API_KEY && !process.env.DOUBAO_API_KEY) {
    throw createApiError('Image provider is not configured. Add ARK_API_KEY or DOUBAO_API_KEY plus ARK_IMAGE_MODEL / DOUBAO_IMAGE_MODEL.', 503, {
      errorType: 'config',
      hint: '图片接口还没配置好。请检查 ARK_API_KEY / DOUBAO_API_KEY 和 ARK_IMAGE_MODEL / DOUBAO_IMAGE_MODEL。',
    });
  }

  if (!process.env.ARK_IMAGE_MODEL && !process.env.DOUBAO_IMAGE_MODEL) {
    throw createApiError('Image provider model is not configured. Add ARK_IMAGE_MODEL or DOUBAO_IMAGE_MODEL.', 503, {
      errorType: 'config',
      hint: '图片模型名还没填。请补上 ARK_IMAGE_MODEL 或 DOUBAO_IMAGE_MODEL。',
    });
  }

  const imageUrl = await callArkImage({ prompt, referenceImage });
  if (imageUrl) {
    return { imageUrl };
  }

  throw createApiError('Ark image provider returned an empty result.', 502, {
    errorType: 'upstream',
    hint: '图片服务返回了空结果，可能是模型、参数或网络线路的问题。',
  });
};

const handleCurrentPortrait = async (body) => {
  const userName = body.userName || 'the user';
  const referenceImage = typeof body.userPhoto === 'string' && body.userPhoto.trim().length > 0
    ? body.userPhoto.trim()
    : '';

  const prompt = buildCurrentImagePrompt({
    userName,
    presentPersona: body.personaProfile?.present_persona || body.presentPersona,
    promptSettings: body.promptSettings,
  });

  if (body.isTestMode) {
    return {
      imageUrl: fallbackImage,
    };
  }

  if (!process.env.ARK_API_KEY && !process.env.DOUBAO_API_KEY) {
    throw createApiError('Image provider is not configured. Add ARK_API_KEY or DOUBAO_API_KEY plus ARK_IMAGE_MODEL / DOUBAO_IMAGE_MODEL.', 503, {
      errorType: 'config',
      hint: '图片接口还没配置好。请检查 ARK_API_KEY / DOUBAO_API_KEY 和 ARK_IMAGE_MODEL / DOUBAO_IMAGE_MODEL。',
    });
  }

  if (!process.env.ARK_IMAGE_MODEL && !process.env.DOUBAO_IMAGE_MODEL) {
    throw createApiError('Image provider model is not configured. Add ARK_IMAGE_MODEL or DOUBAO_IMAGE_MODEL.', 503, {
      errorType: 'config',
      hint: '图片模型名还没填。请补上 ARK_IMAGE_MODEL 或 DOUBAO_IMAGE_MODEL。',
    });
  }

  const imageUrl = await callArkImage({ prompt, referenceImage });
  if (imageUrl) {
    return { imageUrl };
  }

  throw createApiError('Ark image provider returned an empty result.', 502, {
    errorType: 'upstream',
    hint: '图片服务返回了空结果，可能是模型、参数或网络线路的问题。',
  });
};

const handleTimeCapsule = async (body) => {
  const { email, message, imageUrl, sendAt, userName, language = 'zh' } = body;

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
    imageUrl,
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

    if (body.action === 'user-persona') {
      return sendJson(res, 200, await handleUserPersona(body));
    }

    if (body.action === 'time-capsule-letter') {
      return sendJson(res, 200, await handleTimeCapsuleLetter(body));
    }

    if (body.action === 'future-portrait') {
      return sendJson(res, 200, await handleFuturePortrait(body));
    }

    if (body.action === 'current-portrait') {
      return sendJson(res, 200, await handleCurrentPortrait(body));
    }

    if (body.action === 'time-capsule') {
      return sendJson(res, 200, await handleTimeCapsule(body));
    }

    return sendJson(res, 400, { error: 'Unknown action' });
  } catch (e) {
    console.error('AI endpoint failed', e);
    return sendJson(res, e.statusCode || 500, {
      error: e.message || 'AI endpoint failed',
      errorType: e.errorType || 'unknown',
      hint: e.hint || null,
      provider: e.provider || null,
      baseUrl: e.baseUrl || null,
      upstreamStatus: e.upstreamStatus || null,
    });
  }
}
