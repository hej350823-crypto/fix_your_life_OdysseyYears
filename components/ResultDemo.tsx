import React, { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import { Language } from '../types';

interface ResultDemoProps {
  language: Language;
}

type ResultPanel = 'portrait' | 'capsule';

const panelIds: ResultPanel[] = ['portrait', 'capsule'];

const showcaseCardClass =
  'relative min-h-[500px] rounded-sm border border-white/80 bg-white/90 p-7 backdrop-blur transition-shadow duration-900 md:p-10';

const ResultDemo: React.FC<ResultDemoProps> = ({ language }) => {
  const text = t(language).resultDemo;
  const [activePanel, setActivePanel] = useState<ResultPanel | null>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const capsuleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const focusedEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        const nextPanel = focusedEntry?.target.getAttribute('data-result-panel');
        if (nextPanel === 'portrait' || nextPanel === 'capsule') {
          setActivePanel(nextPanel);
        }
      },
      {
        rootMargin: '-22% 0px -26% 0px',
        threshold: [0.28, 0.45, 0.62],
      },
    );

    const panelElements: Record<ResultPanel, HTMLDivElement | null> = {
      portrait: portraitRef.current,
      capsule: capsuleRef.current,
    };

    panelIds.forEach((panel) => {
      const element = panelElements[panel];
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const panelClass = (panel: ResultPanel) =>
    `transition-[transform,opacity,filter,box-shadow] duration-1000 ease-out will-change-transform ${
      activePanel === panel
        ? 'scale-100 translate-y-0 opacity-100 blur-0'
        : 'scale-[0.76] translate-y-14 opacity-20 blur-[1.5px]'
    }`;
  const cardShadowClass = (panel: ResultPanel) =>
    activePanel === panel
      ? 'shadow-[0_32px_96px_rgba(120,113,108,0.20)]'
      : 'shadow-[0_14px_42px_rgba(120,113,108,0.08)]';

  return (
    <section className="defer-section py-32 px-8 md:px-12">
      <div className="max-w-3xl mx-auto text-center mb-20">
        <h2 className="font-serif text-4xl md:text-5xl text-charcoal mb-4">{text.title}</h2>
        <p className="text-stone-500 font-sans">{text.subtitle}</p>
      </div>

      <div className="max-w-5xl mx-auto relative space-y-28 md:space-y-36">
        <div
          ref={portraitRef}
          data-result-panel="portrait"
          className={`relative ${panelClass('portrait')}`}
        >
          <div className="absolute -inset-8 bg-white/55 blur-3xl" />
          <div className="absolute -left-10 top-10 h-44 w-44 rounded-full bg-violet-100/45 blur-3xl" />

          <div className={`${showcaseCardClass} rotate-[-0.4deg] ${cardShadowClass('portrait')}`}>
            <div className="grid min-h-[408px] gap-7 md:grid-cols-[0.86fr_1.14fr] md:gap-10 md:items-stretch">
              <div className="w-full">
                <div className="relative h-full min-h-[330px] overflow-hidden bg-stone-100">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=900&auto=format&fit=crop"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover grayscale-[10%]"
                    alt="A future self portrait revealed after fog"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/45 via-transparent to-white/20" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-charcoal shadow-sm">
                      {text.badge}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center text-left space-y-6 py-2 md:pr-4">
                <div className="flex items-center gap-4">
                  <div className="h-px bg-stone-200 flex-1" />
                  <span className="text-xs font-sans text-stone-400 uppercase tracking-widest">
                    {text.delivered}
                  </span>
                </div>
                <div className="font-serif text-2xl md:text-3xl text-charcoal">{text.greeting}</div>
                <div className="font-serif text-stone-600 leading-9 italic text-xl">"{text.letter}"</div>
                <div className="pt-8">
                  <div className="inline-flex items-center gap-3 border-t border-stone-200 pt-5 text-xs uppercase tracking-[0.2em] text-stone-400">
                    <span>
                      {language === 'zh'
                        ? '等你在迷雾里想回头看的时候'
                        : 'For the days when the fog returns'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={capsuleRef}
          data-result-panel="capsule"
          className={`relative ${panelClass('capsule')}`}
        >
          <div className="absolute -inset-10 bg-white/45 blur-3xl" />
          <div className="absolute -right-10 top-8 h-56 w-56 rounded-full bg-orange-100/55 blur-3xl" />
          <div className="absolute left-10 bottom-0 h-48 w-48 rounded-full bg-purple-100/45 blur-3xl" />

          <div className={`${showcaseCardClass} rotate-[0.35deg] ${cardShadowClass('capsule')}`}>
            <div className="grid min-h-[408px] gap-7 md:grid-cols-[0.86fr_1.14fr] md:gap-10 md:items-stretch">
              <div className="relative overflow-hidden rounded-sm border border-stone-100 bg-gradient-to-br from-white via-orange-50/45 to-violet-50/55 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_16px_38px_rgba(120,113,108,0.11)]">
                <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-orange-100/70 blur-3xl" />
                <div className="absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-purple-100/70 blur-3xl" />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-stone-200/80 pb-5">
                    <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-warmOrange">
                      {text.futureEyebrow}
                    </span>
                    <span className="h-11 w-11 rounded-full bg-charcoal text-white flex items-center justify-center shadow-lg shadow-stone-300/60">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.7"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-center space-y-8 pt-8">
                    <div className="relative mx-auto aspect-[1.42] w-full max-w-[320px] rounded-sm border border-white/80 bg-white/86 shadow-[0_18px_42px_rgba(120,113,108,0.14)]">
                      <div
                        className="absolute inset-x-0 top-0 h-1/2 border-b border-orange-100/80 bg-gradient-to-br from-orange-50/70 to-violet-50/60"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
                      />
                      <div className="absolute inset-x-8 top-1/2 h-px bg-stone-200/80" />
                      <div className="absolute left-8 right-8 top-[62%] space-y-3">
                        <div className="h-2 w-2/3 rounded-full bg-stone-200/90" />
                        <div className="h-2 w-full rounded-full bg-stone-200/70" />
                        <div className="h-2 w-5/6 rounded-full bg-stone-200/60" />
                      </div>
                      <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-orange-100 bg-gradient-to-br from-amber-100 to-violet-100 text-charcoal shadow-lg">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.7"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <span className="inline-flex rounded-full bg-white/90 px-5 py-2 font-sans text-xs text-stone-500 shadow-sm">
                        {text.futureSealed}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center text-left md:pr-4">
                <div className="mb-6 h-px w-20 bg-stone-200" />
                <h3 className="font-serif text-3xl text-charcoal md:text-4xl leading-tight">
                  {text.futureTitle}
                </h3>
                <p className="mt-6 font-sans text-base leading-8 text-stone-600 md:text-lg">
                  {text.futureBody}
                </p>
                <p className="mt-6 font-sans text-xs uppercase tracking-[0.18em] text-stone-400">
                  {text.futureDelay}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultDemo;
