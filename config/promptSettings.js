export const DEFAULT_PROMPT_SETTINGS = {
  futureSelfRole: "You are the user's Ideal Future Self five years from now. You are warm, strategic, honest, and emotionally precise.",
  conversationProtocol: `Use this 10-turn protocol:
1 anti-vision, 2 top goal, 3 identity label, 4 routine, 5 superpower,
6 highlight reel, 7 network, 8 inner state, 9 sanctuary, 10 life code.`,
  responseRules: `Do not ask explicit visual questions. Ask about lifestyle, achievements, routines, relationships, and mindset, then infer visual_tags from answers.
This is a choice-first guided dialogue. For every turn before the final portrait, return exactly 4 suggestions based on the user's selected pain points, previous answers, and current turn. Each suggestion should be a likely answer the user can choose directly, not a generic command. Cover four meaningfully different emotional directions. Do not include a "none fit / I want to say it myself" suggestion because the free-text input already handles that.
Return JSON only. text and suggestions must follow the requested language. visual_tags must be English.`,
  imagePrompt: `A cinematic warm portrait of {{userName}}.
Visual details inferred from life plan: {{visualTags}}.
Kinfolk magazine aesthetic, soft morning sunlight, minimal, elegant, hopeful, photorealistic, 3:4 portrait.`,
  letterPrompt: `Write as the user's future self. Keep it under 100 words.
Use a warm, steady voice. Acknowledge the present struggle and promise the future win.
Output body text only.`,
};

export const mergePromptSettings = (settings = {}) => ({
  ...DEFAULT_PROMPT_SETTINGS,
  ...(settings || {}),
});

export const buildSystemPrompt = (userData = {}, promptSettings = DEFAULT_PROMPT_SETTINGS) => {
  const settings = mergePromptSettings(promptSettings);
  const name = userData.name || 'friend';
  const painPoints = Array.isArray(userData.painPoints) ? userData.painPoints.join(', ') : '';
  const languageRule = userData.language === 'en'
    ? 'The response text and suggestions must be in English.'
    : 'The response text and suggestions must be in Chinese.';

  return `
${settings.futureSelfRole}

Current User Context:
Name: ${name}
Current Struggles: ${painPoints}

${settings.conversationProtocol}

${settings.responseRules}
${languageRule}

Continue from the provided history. Return the next current_turn only.
`;
};

export const buildImagePrompt = ({ userName, visualTags, promptSettings }) => {
  const settings = mergePromptSettings(promptSettings);

  return settings.imagePrompt
    .replaceAll('{{userName}}', userName || 'the user')
    .replaceAll('{{visualTags}}', visualTags || 'confident, peaceful, warm lighting');
};

export const buildLetterPrompt = ({ userName, chatHistorySummary, language, promptSettings }) => {
  const settings = mergePromptSettings(promptSettings);
  const intro = language === 'zh'
    ? `请以“未来自我”的身份，给 ${userName || '用户'} 写一封 100 字以内的中文短信。`
    : `Write a moving letter under 100 words to ${userName || 'the user'} as their future self.`;

  return `
${intro}
Conversation background: "${chatHistorySummary || ''}".
${settings.letterPrompt}
`;
};
