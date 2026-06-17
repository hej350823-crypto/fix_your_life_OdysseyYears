import crypto from 'node:crypto';
import {
  DEFAULT_PROMPT_SETTINGS,
  buildCurrentImagePrompt,
  buildImagePrompt,
  buildLetterPrompt,
  mergePromptSettings,
  buildSystemPrompt,
  buildTimeCapsulePrompt,
  buildUserPersonaPrompt,
} from '../config/promptSettings.js';
import { getTestData } from '../mock/testData.js';
import { getNetworkDiagnostics, networkFetch } from './networkFetch.js';

const fallbackImage = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const RESEND_BASE_URL = 'https://api.resend.com';
const MAX_CHAT_TURNS = 6;
const ADMIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const rateLimitStore = new Map();
const RATE_LIMIT_RULES = {
  'admin-auth': { limit: 5, windowMs: 10 * 60 * 1000, label: '后台密码验证' },
  'future-portrait': { limit: 8, windowMs: 10 * 60 * 1000, label: '未来画像生成' },
  'current-portrait': { limit: 8, windowMs: 10 * 60 * 1000, label: '当前画像生成' },
  chat: { limit: 40, windowMs: 10 * 60 * 1000, label: '对话请求' },
  'chat-stream': { limit: 40, windowMs: 10 * 60 * 1000, label: '对话请求' },
  default: { limit: 30, windowMs: 10 * 60 * 1000, label: 'AI 请求' },
};

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

const remoteImageUrlToDataUrl = async (imageUrl) => {
  if (typeof imageUrl !== 'string' || !/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  try {
    // Some providers return short-lived or anti-hotlink image URLs.
    // Converting them server-side makes the browser render path stable.
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return imageUrl;
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
    return imageUrl;
  }
};

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

const callTextModelStream = async ({ messages, maxTokens = 1000, onDelta }) => {
  const provider = getTextProvider();
  if (!provider) {
    return null;
  }

  let response;
  try {
    response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        max_tokens: maxTokens,
        stream: true,
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

  if (!response.body) {
    throw createApiError(`${provider.name} streaming response body is unavailable.`, 502, {
      provider: provider.name,
      baseUrl: provider.baseUrl,
      errorType: 'provider_error',
      hint: '上游返回了不可读取的流响应。',
    });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const rawEvent of events) {
      const lines = rawEvent.split('\n').map((line) => line.trim()).filter(Boolean);

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;

        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;

        try {
          const payload = JSON.parse(data);
          const delta = payload.choices?.[0]?.delta?.content;

          if (typeof delta === 'string' && delta.length > 0) {
            fullText += delta;
            onDelta?.(delta);
          }
        } catch {
          // Ignore malformed stream chunks from upstream.
        }
      }
    }

    if (done) break;
  }

  return fullText;
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
  if (firstImage?.url) return remoteImageUrlToDataUrl(firstImage.url);
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

const base64UrlEncode = (value) => Buffer.from(value, 'utf8').toString('base64url');
const base64UrlDecode = (value) => Buffer.from(value, 'base64url').toString('utf8');

const getRequestIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || 'unknown';
};

const enforceRateLimit = (req, action = 'default') => {
  const rule = RATE_LIMIT_RULES[action] || RATE_LIMIT_RULES.default;
  const clientIp = getRequestIp(req);
  const key = `${action}:${clientIp}`;
  const now = Date.now();
  const attempts = rateLimitStore.get(key) || [];
  const recentAttempts = attempts.filter((timestamp) => now - timestamp < rule.windowMs);

  if (recentAttempts.length >= rule.limit) {
    throw createApiError(`${rule.label}过于频繁，请稍后再试。`, 429, {
      errorType: 'rate_limit',
      hint: `${rule.label}在短时间内次数过多。请过几分钟再试。`,
    });
  }

  recentAttempts.push(now);
  rateLimitStore.set(key, recentAttempts);
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

const sendStreamHeaders = (res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
};

const writeStreamEvent = (res, payload) => {
  res.write(`${JSON.stringify(payload)}\n`);
};

const escapeHtml = (value = '') => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const createChatMetadataPrompt = ({ currentTurn, assistantReply, language }) => `
Return valid json only, with this exact shape:
{
  "suggestions": ["exactly 4 choice-first possible user answers"],
  "visual_tags": ["english visual tag"],
  "current_turn": 1
}

Rules:
- current_turn must be the next turn number after the assistant reply, between 1 and ${MAX_CHAT_TURNS}
- suggestions must be short, natural, first-person user replies
- keep suggestions in ${language === 'en' ? 'English' : 'Chinese'}
- visual_tags must be concise English image cues

Assistant reply:
${assistantReply}

Previous current_turn: ${currentTurn}
`;

const formatCapsuleMessageHtml = (message = '') => escapeHtml(message).replace(/\n/g, '<br />');

const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const getAdminPassword = () => process.env.ADMIN_PASSWORD || process.env.PROMPT_ADMIN_PASSWORD || '';
const hasCustomPromptSettings = (promptSettings) => {
  if (!promptSettings || typeof promptSettings !== 'object') return false;

  return (Object.keys(DEFAULT_PROMPT_SETTINGS))
    .some((key) => promptSettings[key] !== DEFAULT_PROMPT_SETTINGS[key]);
};

const signAdminToken = (payload, secret) => crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('base64url');

const createAdminToken = () => {
  const secret = getAdminPassword();
  const payload = JSON.stringify({ exp: Date.now() + ADMIN_TOKEN_TTL_MS });
  const encodedPayload = base64UrlEncode(payload);
  const signature = signAdminToken(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
};

const verifyAdminToken = (token = '') => {
  const secret = getAdminPassword();
  if (!secret || !token || typeof token !== 'string') {
    return false;
  }

  const [encodedPayload, providedSignature] = token.split('.');
  if (!encodedPayload || !providedSignature) {
    return false;
  }

  const expectedSignature = signAdminToken(encodedPayload, secret);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
};

const getAuthorizedPromptSettings = (body) => {
  if (!hasCustomPromptSettings(body.promptSettings)) {
    return undefined;
  }

  if (!verifyAdminToken(body.adminToken)) {
    throw createApiError('Custom prompt settings require admin verification.', 401, {
      errorType: 'auth',
      hint: '自定义提示词需要先重新输入后台密码验证。',
    });
  }

  return mergePromptSettings(body.promptSettings);
};

const buildTimeCapsuleEmail = ({ userName, message, imageUrl, sendAt, language }) => {
  const safeName = escapeHtml(userName || (language === 'zh' ? '朋友' : 'friend'));
  const safeDate = escapeHtml(new Date(sendAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }));
  const safeMessage = formatCapsuleMessageHtml(message);
  const canEmbedImage = typeof imageUrl === 'string' && /^https?:\/\//i.test(imageUrl);

  if (language === 'en') {
    return {
      subject: `A note from your past self, ${safeName}`,
      html: `
        <div style="margin:0 auto;max-width:640px;padding:32px 20px;font-family:Georgia,'Times New Roman',serif;color:#1f2937;line-height:1.8;">
          <p style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#9a3412;">Future Mailbox</p>
          <h1 style="margin:0 0 16px;font-size:32px;line-height:1.2;">A letter you asked us to return today.</h1>
          <p style="margin:0 0 24px;font-family:Arial,sans-serif;color:#57534e;">Scheduled for ${safeDate}</p>
          <div style="padding:24px;border:1px solid #e7e5e4;border-radius:20px;background:#fafaf9;">
            <p style="margin:0 0 12px;">Dear ${safeName},</p>
            <p style="margin:0;">${safeMessage}</p>
          </div>
          ${canEmbedImage ? `<div style="margin-top:24px;"><img src="${imageUrl}" alt="Your present portrait" style="width:100%;border-radius:20px;display:block;object-fit:cover;" /></div>` : ''}
        </div>
      `,
      text: `A letter you asked us to return today.\nScheduled for ${safeDate}\n\nDear ${userName || 'friend'},\n\n${message}`,
    };
  }

  return {
    subject: `${userName || '你'}，这是你留给未来的一封信`,
    html: `
      <div style="margin:0 auto;max-width:640px;padding:32px 20px;font-family:Georgia,'Times New Roman',serif;color:#1f2937;line-height:1.8;">
        <p style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#9a3412;">未来邮局</p>
        <h1 style="margin:0 0 16px;font-size:32px;line-height:1.2;">这是你曾经预约在今天打开的一封信。</h1>
        <p style="margin:0 0 24px;font-family:Arial,sans-serif;color:#57534e;">封存日期已到：${safeDate}</p>
        <div style="padding:24px;border:1px solid #e7e5e4;border-radius:20px;background:#fafaf9;">
          <p style="margin:0 0 12px;">${safeName}：</p>
          <p style="margin:0;">${safeMessage}</p>
        </div>
        ${canEmbedImage ? `<div style="margin-top:24px;"><img src="${imageUrl}" alt="今天的你" style="width:100%;border-radius:20px;display:block;object-fit:cover;" /></div>` : ''}
      </div>
    `,
    text: `这是你曾经预约在今天打开的一封信。\n封存日期已到：${safeDate}\n\n${userName || '你'}：\n\n${message}`,
  };
};

const scheduleResendEmail = async ({ to, userName, message, imageUrl, sendAt, language }) => {
  if (!process.env.RESEND_API_KEY) {
    throw createApiError('Resend is not configured. Add RESEND_API_KEY to enable real email delivery.', 503, {
      errorType: 'config',
      hint: '还没配置 RESEND_API_KEY，所以现在不能真的预约发邮件。',
    });
  }

  const from = process.env.RESEND_FROM_EMAIL || 'Fix Your Life <onboarding@resend.dev>';
  const replyTo = process.env.RESEND_REPLY_TO;
  const emailContent = buildTimeCapsuleEmail({ userName, message, imageUrl, sendAt, language });

  let response;
  try {
    response = await networkFetch(`${RESEND_BASE_URL}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        scheduledAt: sendAt,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
  } catch (error) {
    const diagnostics = await getNetworkDiagnostics(RESEND_BASE_URL).catch(() => null);
    throw createApiError(
      `Resend API request failed: ${error?.message || 'fetch failed'}`,
      502,
      {
        provider: 'Resend',
        baseUrl: RESEND_BASE_URL,
        ...getFetchErrorMeta({ providerName: 'Resend', baseUrl: RESEND_BASE_URL, diagnostics }),
      },
    );
  }

  if (!response.ok) {
    const detail = await response.text();
    const meta = getResponseErrorMeta({
      providerName: 'Resend',
      status: response.status,
      detail,
      action: 'email',
    });
    throw createApiError(`Resend API request failed: ${response.status} ${detail}`, response.status, {
      provider: 'Resend',
      baseUrl: RESEND_BASE_URL,
      upstreamStatus: response.status,
      upstreamDetail: detail,
      ...meta,
    });
  }

  return response.json();
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

const handleChatStream = async (res, body) => {
  const { userData, message, history = [], currentTurn = 0, promptSettings } = body;
  const safeHistory = Array.isArray(history) ? history.slice(-12) : [];
  const language = userData?.language || 'zh';
  const name = userData?.name || '朋友';

  if (!getTextProvider() && userData?.isTestMode) {
    const demoResponse = createDemoResponse(name, currentTurn, language);
    writeStreamEvent(res, { type: 'text_delta', delta: demoResponse.text });
    writeStreamEvent(res, { type: 'done', data: demoResponse });
    return;
  }

  if (!getTextProvider()) {
    throw createApiError('AI provider is not configured. Add ARK_API_KEY + ARK_TEXT_MODEL or DEEPSEEK_API_KEY.', 503);
  }

  const transcript = safeHistory
    .map((entry) => `${entry.sender === 'user' ? 'User' : 'Future Self'}: ${entry.text}`)
    .join('\n');

  const streamedReply = await callTextModelStream({
    messages: [
      {
        role: 'system',
        content: `${buildSystemPrompt(userData, promptSettings)}

Respond with only the next reply text from the future self.
Do not return JSON.
Do not label the speaker.
Do not include suggestions or analysis.
Keep the tone warm, concise, and conversational.`,
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
    maxTokens: 900,
    onDelta: (delta) => writeStreamEvent(res, { type: 'text_delta', delta }),
  });

  const replyText = (streamedReply || '').trim() || createDemoResponse(name, currentTurn, language).text;

  const metadataContent = await callTextModel({
    messages: [
      {
        role: 'system',
        content: createChatMetadataPrompt({ currentTurn, assistantReply: replyText, language }),
      },
      {
        role: 'user',
        content: `
Conversation history:
${transcript || '(no previous history)'}

Latest user message:
${message}

Assistant reply:
${replyText}
`,
      },
    ],
    responseFormat: { type: 'json_object' },
    maxTokens: 500,
  });

  let parsed;
  try {
    parsed = JSON.parse(cleanJsonString(metadataContent || '{}'));
  } catch (e) {
    console.error('Chat metadata JSON parse error', e);
    parsed = createDemoResponse(name, currentTurn, language);
  }

  const finalResponse = {
    text: replyText,
    suggestions: Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((item) => typeof item === 'string' && item.trim()).slice(0, 4)
      : [],
    visual_tags: Array.isArray(parsed.visual_tags)
      ? parsed.visual_tags.filter((item) => typeof item === 'string' && item.trim())
      : [],
    current_turn: Math.min(Math.max(Number(parsed.current_turn || Number(currentTurn || 0) + 1), 1), MAX_CHAT_TURNS),
  };

  writeStreamEvent(res, { type: 'done', data: finalResponse });
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
          personaProfile: body.personaProfile,
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
          personaProfile: body.personaProfile,
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

const handleAdminAuth = async (body) => {
  const configuredPassword = getAdminPassword();

  if (!configuredPassword) {
    throw createApiError('Admin password is not configured.', 503, {
      errorType: 'config',
      hint: '请在环境变量里设置 ADMIN_PASSWORD 或 PROMPT_ADMIN_PASSWORD。',
    });
  }

  const providedPassword = typeof body.password === 'string' ? body.password : '';
  const providedBuffer = Buffer.from(providedPassword);
  const configuredBuffer = Buffer.from(configuredPassword);
  const passwordMatches = providedBuffer.length === configuredBuffer.length
    && crypto.timingSafeEqual(providedBuffer, configuredBuffer);

  if (!passwordMatches) {
    throw createApiError('Invalid admin password.', 401, {
      errorType: 'auth',
      hint: '密码不正确，请再试一次。',
    });
  }

  return { ok: true, adminToken: createAdminToken() };
};

const handleTimeCapsule = async (body) => {
  const { email, message, imageUrl, sendAt, userName, language = 'zh' } = body;

  if (!email || !message || !sendAt) {
    throw createApiError('Missing required time capsule fields', 400, {
      errorType: 'validation',
      hint: '邮箱、信件内容和发送时间不能为空。',
    });
  }

  if (!isValidEmail(email)) {
    throw createApiError('Invalid email address', 400, {
      errorType: 'validation',
      hint: '请输入一个有效的邮箱地址。',
    });
  }

  const sendDate = new Date(sendAt);
  if (Number.isNaN(sendDate.getTime())) {
    throw createApiError('Invalid sendAt value', 400, {
      errorType: 'validation',
      hint: '发送时间格式不正确。',
    });
  }

  const now = Date.now();
  const maxScheduledAt = now + 30 * 24 * 60 * 60 * 1000;
  if (sendDate.getTime() <= now || sendDate.getTime() > maxScheduledAt) {
    throw createApiError('Scheduled time must be within the next 30 days', 400, {
      errorType: 'validation',
      hint: 'Resend 最多只能预约未来 30 天内的邮件。',
    });
  }

  const scheduled = await scheduleResendEmail({
    to: email,
    userName,
    message,
    imageUrl,
    sendAt: sendDate.toISOString(),
    language,
  });

  return {
    id: scheduled.id || `scheduled-${Date.now()}`,
    status: 'pending',
    storedLocally: false,
    userName,
    email,
    sendAt: sendDate.toISOString(),
    language,
    provider: 'resend',
  };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const action = typeof body?.action === 'string' ? body.action : 'default';

    enforceRateLimit(req, action);
    body.promptSettings = getAuthorizedPromptSettings(body);

    if (action === 'chat-stream') {
      sendStreamHeaders(res);

      try {
        await handleChatStream(res, body);
        res.end();
      } catch (e) {
        console.error('AI chat stream failed', e);
        writeStreamEvent(res, {
          type: 'error',
          error: e.message || 'AI chat stream failed',
        });
        res.end();
      }

      return;
    }

    if (action === 'chat') {
      return sendJson(res, 200, await handleChat(body));
    }

    if (action === 'final-letter') {
      return sendJson(res, 200, await handleFinalLetter(body));
    }

    if (action === 'user-persona') {
      return sendJson(res, 200, await handleUserPersona(body));
    }

    if (action === 'time-capsule-letter') {
      return sendJson(res, 200, await handleTimeCapsuleLetter(body));
    }

    if (action === 'future-portrait') {
      return sendJson(res, 200, await handleFuturePortrait(body));
    }

    if (action === 'current-portrait') {
      return sendJson(res, 200, await handleCurrentPortrait(body));
    }

    if (action === 'admin-auth') {
      return sendJson(res, 200, await handleAdminAuth(body));
    }

    if (action === 'time-capsule') {
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
