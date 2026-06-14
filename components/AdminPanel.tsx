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
  { key: 'futureSelfRole', zh: '未来自我角色设定', en: 'Future-self role', rows: 4 },
  { key: 'conversationProtocol', zh: '10 轮对话协议', en: 'Conversation protocol', rows: 7 },
  { key: 'responseRules', zh: '回复规则', en: 'Response rules', rows: 6 },
  { key: 'imagePrompt', zh: '未来画像提示词', en: 'Future portrait prompt', rows: 6 },
  { key: 'letterPrompt', zh: '未来信件提示词', en: 'Future letter prompt', rows: 5 },
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
                ? '这里先不加密码。你可以调整对话人格、10 轮流程、图片提示词和信件提示词。配置会保存在当前浏览器，下一次真实 API 调用会带给后端。'
                : 'No password yet. You can tune the dialogue persona, 10-turn flow, image prompt, and letter prompt. Settings are saved in this browser and sent with future API calls.'}
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
            <label key={field.key} className="block rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <span className="text-sm font-semibold text-stone-700">
                {isZh ? field.zh : field.en}
              </span>
              <textarea
                value={draft[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                rows={field.rows}
                className="mt-3 w-full resize-y rounded-lg border border-stone-200 bg-stone-50 p-4 font-mono text-sm leading-6 text-stone-700 outline-none transition focus:border-orange-200 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </label>
          ))}
        </div>
      </section>
    </main>
  );
};

export default AdminPanel;
