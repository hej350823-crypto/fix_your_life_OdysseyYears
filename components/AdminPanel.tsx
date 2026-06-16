import React, { useState } from 'react';
import { DEFAULT_PROMPT_SETTINGS } from '../config/promptSettings';
import { Language, PromptSettings } from '../types';

interface AdminPanelProps {
  language: Language;
  promptSettings: PromptSettings;
  onSave: (settings: PromptSettings) => void;
  onReset: () => void;
  onBack: () => void;
}

const promptFields: Array<{ key: keyof PromptSettings; zh: string; en: string; rows: number }> = [
  { key: 'chatSystemPrompt', zh: '聊天主提示词', en: 'Chat system prompt', rows: 24 },
  { key: 'userPersonaPrompt', zh: '用户画像提示词', en: 'User persona prompt', rows: 24 },
  { key: 'imagePrompt', zh: '未来画像提示词', en: 'Future portrait prompt', rows: 10 },
  { key: 'currentImagePrompt', zh: '时间胶囊当前画像提示词', en: 'Time capsule current portrait prompt', rows: 10 },
  { key: 'letterPrompt', zh: '未来信件提示词', en: 'Future letter prompt', rows: 10 },
  { key: 'timeCapsulePrompt', zh: '时间胶囊提示词', en: 'Time capsule prompt', rows: 12 },
];

const AdminPanel: React.FC<AdminPanelProps> = ({
  language,
  promptSettings,
  onSave,
  onReset,
  onBack,
}) => {
  const [draft, setDraft] = useState<PromptSettings>(promptSettings);
  const [status, setStatus] = useState('');
  const isZh = language === 'zh';

  const updateField = (key: keyof PromptSettings, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetDraft = () => {
    setDraft(DEFAULT_PROMPT_SETTINGS as PromptSettings);
    onReset();
    setStatus(isZh ? '已恢复默认配置' : 'Defaults restored');
  };

  const saveDraft = () => {
    onSave(draft);
    setStatus(isZh ? '已保存到当前浏览器' : 'Saved in this browser');
  };

  const copyPrompt = async (key: keyof PromptSettings) => {
    try {
      await navigator.clipboard.writeText(draft[key]);
      setStatus(isZh ? '已复制提示词' : 'Prompt copied');
    } catch (e) {
      console.warn('Prompt could not be copied.', e);
      setStatus(isZh ? '复制失败，请手动选中文本复制' : 'Copy failed. Select the text manually.');
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 text-charcoal">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Prompt Admin</p>
            <h1 className="mt-1 font-serif text-3xl text-charcoal">
              {isZh ? '提示词后台' : 'Prompt Console'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="rounded-full border border-stone-200 bg-white px-5 py-2 text-sm text-stone-600 hover:border-stone-300 hover:text-charcoal"
            >
              {isZh ? '返回首页' : 'Back'}
            </button>
            <button
              onClick={saveDraft}
              className="rounded-full bg-charcoal px-5 py-2 text-sm font-medium text-white hover:bg-black"
            >
              {isZh ? '保存配置' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-serif text-xl">{isZh ? '现在能做什么' : 'What this controls'}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              {isZh
                ? '这里先不加密码。你可以直接调整聊天主提示词、用户画像提示词、未来/当前图片提示词、未来信提示词和时间胶囊提示词。配置会保存在当前浏览器，下一次真实 API 调用会带给后端。'
                : 'No password yet. You can tune the chat system prompt, user persona prompt, future/current image prompts, future letter prompt, and time capsule prompt. Settings are saved in this browser and sent with future API calls.'}
            </p>
          </div>

          <div className="rounded-lg border border-orange-100 bg-orange-50 p-5 text-sm leading-6 text-orange-900">
            {isZh
              ? '上线前如果要真正保护后台，再加登录或环境变量密码。现在先保留轻量入口，方便你调产品感觉。'
              : 'Before launch, this can be protected with login or an environment password. For now it stays light so you can tune the product quickly.'}
          </div>

          {status && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
              {status}
            </div>
          )}

          <button
            onClick={resetDraft}
            className="w-full rounded-full border border-stone-200 bg-white px-5 py-3 text-sm text-stone-500 hover:border-stone-300 hover:text-charcoal"
          >
            {isZh ? '恢复默认提示词' : 'Restore defaults'}
          </button>
        </aside>

        <div className="space-y-5">
          {promptFields.map((field) => (
            <section key={field.key} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-stone-700">
                  {isZh ? field.zh : field.en}
                </h2>
                <button
                  type="button"
                  onClick={() => copyPrompt(field.key)}
                  className="rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs font-medium text-stone-500 transition hover:border-orange-200 hover:text-charcoal"
                >
                  {isZh ? '复制' : 'Copy'}
                </button>
              </div>
              <textarea
                value={draft[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                rows={field.rows}
                spellCheck={false}
                className="mt-4 w-full resize-y rounded-lg border border-stone-200 bg-white px-5 py-4 font-mono text-sm leading-7 text-stone-700 shadow-inner outline-none transition focus:border-orange-200 focus:ring-2 focus:ring-orange-100"
              />
            </section>
          ))}
        </div>
      </section>
    </main>
  );
};

export default AdminPanel;
