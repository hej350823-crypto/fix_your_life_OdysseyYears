import React, { useMemo, useState } from 'react';
import { t } from '../i18n';
import { Language, TimeCapsuleDelay } from '../types';
import { saveTimeCapsule } from '../services/timeCapsuleService';

interface TimeCapsuleProps {
  userName: string;
  language: Language;
  sealedLetter: string;
  imageUrl: string;
  onBack: () => void;
  onRestart: () => void;
}

const delayMonths: Record<TimeCapsuleDelay, number> = {
  oneMonth: 1,
  threeMonths: 3,
  sixMonths: 6,
  oneYear: 12,
};

const getSendAt = (delay: TimeCapsuleDelay) => {
  const date = new Date();
  date.setMonth(date.getMonth() + delayMonths[delay]);
  return date;
};

const formatDate = (date: Date, language: Language) => {
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const TimeCapsule: React.FC<TimeCapsuleProps> = ({ userName, language, sealedLetter, imageUrl, onBack, onRestart }) => {
  const text = t(language).timeCapsule;
  const [email, setEmail] = useState('');
  const [delay, setDelay] = useState<TimeCapsuleDelay>('oneYear');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const sendDate = useMemo(() => getSendAt(delay), [delay]);
  const canSubmit = email.includes('@') && sealedLetter.trim().length > 10 && status !== 'saving' && status !== 'saved';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus('saving');
    try {
      await saveTimeCapsule({
        userName,
        email,
        message: sealedLetter,
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
        <button
          onClick={onBack}
          className="mb-10 text-xs uppercase tracking-[0.22em] text-stone-400 hover:text-charcoal transition-colors"
        >
          ← {language === 'zh' ? '返回上一页' : 'Back'}
        </button>

        <div className="grid lg:grid-cols-[0.75fr_1.25fr] gap-10 lg:gap-16 items-center">
          <div className="space-y-6 lg:pb-16">
            <p className="text-xs uppercase tracking-[0.24em] text-warmOrange font-semibold">{text.eyebrow}</p>
            <h1 className="font-serif text-4xl md:text-6xl text-charcoal leading-tight">{text.title}</h1>
            <p className="font-sans text-lg text-stone-600 leading-relaxed">{text.description}</p>
            <div className="max-w-sm overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(120,113,108,0.16)]">
              <div className="aspect-[3/4] bg-stone-100">
                <img
                  src={imageUrl}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  alt={language === 'zh' ? '今天的自己' : 'Present self'}
                />
              </div>
              <div className="px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
                  {language === 'zh' ? '今天的画像' : 'Present portrait'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[28px] bg-white/92 p-7 md:p-12 shadow-[0_28px_80px_rgba(120,113,108,0.18)] border border-white/80 space-y-8 backdrop-blur">
            <div className="rounded-2xl bg-stone-50/90 border border-stone-100 p-5 text-base text-stone-500 leading-relaxed">
              {text.deliveryPreview.replace('{date}', formatDate(sendDate, language))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {(Object.keys(delayMonths) as TimeCapsuleDelay[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDelay(option)}
                  className={`rounded-full border px-5 py-4 text-base transition-all ${
                    delay === option
                      ? 'border-charcoal bg-charcoal text-white shadow-sm'
                      : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                  }`}
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
                className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-lg text-charcoal outline-none transition focus:border-warmOrange focus:ring-4 focus:ring-orange-100"
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
