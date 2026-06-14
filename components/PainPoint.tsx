import React, { useCallback, useEffect, useState } from 'react';
import { t } from '../i18n';
import { Language } from '../types';

interface PainPointProps {
  language: Language;
}

const insightCards = [
  {
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop',
    zh: {
      quote: '方向不是突然出现的。它常常先是一点光。',
      author: 'Fix Your Life',
    },
    en: {
      quote: 'Direction rarely arrives all at once. It often begins as a small light.',
      author: 'Fix Your Life',
    },
  },
  {
    image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=1200&auto=format&fit=crop',
    zh: {
      quote: '向外看的人在寻找，向内看的人开始醒来。',
      author: 'Carl Jung',
    },
    en: {
      quote: 'Who looks outside searches; who looks within begins to wake.',
      author: 'Carl Jung',
    },
  },
  {
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
    zh: {
      quote: '你要成为你本来可以成为的那个人。',
      author: 'Friedrich Nietzsche',
    },
    en: {
      quote: 'Become who you are capable of becoming.',
      author: 'Friedrich Nietzsche',
    },
  },
  {
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    zh: {
      quote: '真正的旅程，不是寻找新风景，而是拥有新的眼睛。',
      author: 'Marcel Proust',
    },
    en: {
      quote: 'The real voyage is to see with new eyes.',
      author: 'Marcel Proust',
    },
  },
];

const CARD_ROTATION_MS = 6000;
const CARD_BREATH_MS = 2600;

const stackedCardLayers = [
  'translate-x-[-34px] translate-y-5 rotate-[-8deg] scale-[0.985] border-stone-200/80 bg-gradient-to-br from-purple-100/80 via-stone-50 to-orange-50/80 shadow-[0_18px_46px_rgba(120,113,108,0.18)]',
  'translate-x-[42px] translate-y-6 rotate-[7deg] scale-[0.985] border-stone-200/80 bg-gradient-to-br from-orange-100/85 via-rose-50/80 to-stone-50 shadow-[0_18px_46px_rgba(120,113,108,0.16)]',
  'translate-x-[-20px] translate-y-5 rotate-[-4deg] scale-[0.99] border-stone-200/70 bg-gradient-to-br from-stone-100/95 via-purple-50/80 to-orange-50/70 shadow-[0_14px_34px_rgba(120,113,108,0.14)]',
  'translate-x-[27px] translate-y-5 rotate-[4deg] scale-[0.99] border-stone-200/70 bg-gradient-to-br from-violet-100/85 via-rose-50/70 to-orange-50/70 shadow-[0_14px_34px_rgba(120,113,108,0.14)]',
];

const PainPoint: React.FC<PainPointProps> = ({ language }) => {
  const text = t(language).pain;
  const [activeCard, setActiveCard] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);

  const advanceCard = useCallback(() => {
    setActiveCard((current) => (current + 1) % insightCards.length);
  }, []);

  useEffect(() => {
    insightCards.forEach((card) => {
      const image = new Image();
      image.src = card.image;
    });
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(advanceCard, CARD_ROTATION_MS);

    return () => window.clearInterval(intervalId);
  }, [advanceCard]);

  useEffect(() => {
    setIsBreathing(false);
    const frameId = window.requestAnimationFrame(() => {
      setIsBreathing(true);
    });
    const timeoutId = window.setTimeout(() => {
      setIsBreathing(false);
    }, CARD_BREATH_MS);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [activeCard]);

  return (
    <section className="defer-section py-24 px-8 md:px-12">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
        <div
          className="relative mx-auto w-full max-w-[360px] pb-8"
          onClick={advanceCard}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              advanceCard();
            }
          }}
          aria-label={language === 'zh' ? '切换灵感卡片' : 'Change insight card'}
        >
          <div className="relative aspect-[3/4] rounded-xl">
            {stackedCardLayers.map((layerClass) => (
              <div
                key={layerClass}
                className={`absolute inset-0 rounded-xl border ${layerClass}`}
              />
            ))}
            <div
              className={`absolute inset-0 z-10 overflow-hidden rounded-xl shadow-2xl ${
                isBreathing ? 'insight-card-breath' : ''
              }`}
            >
              {insightCards.map((card, index) => {
                const copy = card[language];
                const isActive = index === activeCard;

                return (
                  <div
                    key={card.image}
                    className={`absolute inset-0 transition-opacity duration-[1800ms] ease-in-out ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                    aria-hidden={!isActive}
                  >
                    <div className="absolute inset-0 bg-stone-900/10 z-10 mix-blend-multiply" />
                    <img
                      src={card.image}
                      alt={copy.quote}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="w-full h-full object-cover grayscale-[18%] scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/48 via-stone-100/8 to-white/15" />
                    <div className="absolute bottom-8 left-8 right-8 z-20 border-l border-white/70 pl-5 text-white drop-shadow">
                      <p className="font-serif italic text-base md:text-lg leading-7">
                        {copy.quote}
                      </p>
                      <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-white/70">
                        {copy.author}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="w-12 h-1 bg-charcoal/20" />
          <h2 className="font-serif text-4xl md:text-5xl text-charcoal leading-[1.25] md:leading-[1.25]">
            {text.title}
          </h2>
          <div className="space-y-6 text-stone-600 font-sans text-lg leading-relaxed">
            <p>{text.body1}</p>
            <p className="font-medium text-charcoal">{text.body2}</p>
            <p>{text.body3}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PainPoint;
