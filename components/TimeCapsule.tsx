import React, { useMemo, useState } from 'react';
import { t } from '../i18n';
import { Language, PromptSettings, TimeCapsuleDelay, UserPersonaProfile } from '../types';
import { generateCurrentSelfPortrait, generateTimeCapsuleLetter } from '../services/geminiService';
import { saveTimeCapsule } from '../services/timeCapsuleService';

interface TimeCapsuleProps {
  userName: string;
  language: Language;
  conversationSummary: string;
  personaProfile?: UserPersonaProfile;
  promptSettings: PromptSettings;
  userPhoto?: string | null;
  isTestMode?: boolean;
  onBack: () => void;
  onRestart: () => void;
}

const delayDays: Record<TimeCapsuleDelay, number> = {
  threeDays: 3,
  oneWeek: 7,
  twoWeeks: 14,
  oneMonth: 30,
};

const getSendAt = (delay: TimeCapsuleDelay) => {
  const date = new Date();
  date.setDate(date.getDate() + delayDays[delay]);
  return date;
};

const formatDate = (date: Date, language: Language) => {
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const TimeCapsule: React.FC<TimeCapsuleProps> = ({
  userName,
  language,
  conversationSummary,
  personaProfile,
  promptSettings,
  userPhoto,
  isTestMode,
  onBack,
  onRestart,
}) => {
  const text = t(language).timeCapsule;
  const testCopy = t(language).test;
  const [email, setEmail] = useState('');
  const [delay, setDelay] = useState<TimeCapsuleDelay>('oneMonth');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isPreviewMode = true;

  const sendDate = useMemo(() => getSendAt(delay), [delay]);
  const canSubmit = !isPreviewMode && email.includes('@') && status !== 'saving' && status !== 'saved';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus('saving');
    try {
      const [message, imageUrl] = isTestMode
        ? [testCopy.timeCapsuleLetter, '/test-assets/current-self.svg']
        : await Promise.all([
            generateTimeCapsuleLetter(userName, conversationSummary, language, promptSettings, personaProfile),
            generateCurrentSelfPortrait(userName, personaProfile, promptSettings, userPhoto),
          ]);

      await saveTimeCapsule({
        userName,
        email,
        message,
        imageUrl,
        sendAt: sendDate.toISOString(),
        delay,
        language,
      });
      setStatus('saved');
    } catch (e) {
      console.error('Time capsule could not be saved.', e);
      setStatus('error');
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-warmWhite via-orange-50/30 to-purple-50/20 px-6 py-10 md:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="text-xs uppercase tracking-[0.22em] text-stone-400 hover:text-charcoal transition-colors"
          >
            ← {language === 'zh' ? '返回上一页' : 'Back'}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.16em] text-stone-500 transition-colors hover:border-stone-300 hover:text-charcoal"
          >
            {language === 'zh' ? '回到首页' : 'Home'}
          </button>
        </div>

        <div className="grid lg:grid-cols-[0.62fr_1.38fr] gap-10 lg:gap-16 items-center">
          <div className="space-y-6 lg:pb-16">
            <div className="inline-flex max-w-xl rounded-full border border-stone-200/80 bg-white/85 px-4 py-2 text-sm leading-relaxed text-stone-500 shadow-[0_10px_30px_rgba(120,113,108,0.08)] backdrop-blur">
              {text.previewNotice}
            </div>
            <h1 className="font-serif text-4xl md:text-6xl text-charcoal leading-tight">{text.title}</h1>
            <p className="font-sans text-lg text-stone-600 leading-relaxed">{text.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[28px] bg-white/92 p-7 md:p-12 shadow-[0_28px_80px_rgba(120,113,108,0.18)] border border-white/80 space-y-8 backdrop-blur">
            <div className="rounded-2xl bg-stone-50/90 border border-stone-100 p-5 text-base text-stone-500 leading-relaxed">
              {text.deliveryPreview.replace('{date}', formatDate(sendDate, language))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {(Object.keys(delayDays) as TimeCapsuleDelay[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => !isPreviewMode && setDelay(option)}
                  disabled={isPreviewMode}
                  className={`rounded-full border px-5 py-4 text-base transition-all ${
                    delay === option
                      ? 'border-charcoal bg-charcoal text-white shadow-sm'
                      : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                  } disabled:cursor-not-allowed disabled:hover:border-stone-200`}
                >
                  {text.delays[option]}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="block mb-3 text-xs uppercase tracking-[0.18em] text-stone-400">{text.emailLabel}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={text.emailPlaceholder}
                disabled={isPreviewMode}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-lg text-stone-400 outline-none transition focus:border-warmOrange focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed"
              />
            </label>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-full bg-charcoal px-9 py-4 text-base font-medium text-white transition-all hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {status === 'saving' ? text.saving : text.submit}
              </button>
              <p className="text-sm leading-relaxed text-stone-400">
                {status === 'saved' ? text.saved : status === 'error' ? text.error : text.privacy}
              </p>
            </div>

            {status === 'saved' && (
              <button
                type="button"
                onClick={onRestart}
                className="w-full rounded-full border border-stone-200 px-7 py-3 text-sm font-medium text-stone-500 transition-all hover:border-stone-300 hover:text-charcoal"
              >
                {language === 'zh' ? '回到首页' : 'Return Home'}
              </button>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

export default TimeCapsule;
