import React from 'react';
import { t } from '../i18n';
import { GenerationResult, Language } from '../types';

interface FinalRevealProps {
  result: GenerationResult;
  userName: string;
  language: Language;
  onRestart: () => void;
  onContinue: () => void;
}

const TEST_FUTURE_IMAGE = '/test-assets/future-self.png';

const FinalReveal: React.FC<FinalRevealProps> = ({ result, userName, language, onRestart, onContinue }) => {
  const text = t(language).final;
  const received = text.received.replace('{year}', String(new Date().getFullYear() + 5));

  return (
    <section className="flex min-h-[100svh] items-center justify-center bg-gradient-to-br from-warmWhite via-orange-50/30 to-purple-50/20 px-4 py-12 sm:px-6 md:min-h-screen md:py-20">
      <div className="mx-auto w-full max-w-6xl space-y-8 animate-fade-in-up md:space-y-12">
        <div className="text-center space-y-4">
          <h2 className="font-serif text-3xl text-charcoal sm:text-4xl md:text-5xl">
            {text.hello}, {userName}.
          </h2>
          <p className="text-stone-500 font-sans tracking-wide uppercase text-sm">
            {received}
          </p>
        </div>

        <div className="flex flex-col items-center gap-8 rounded-2xl border border-stone-100 bg-white p-5 shadow-2xl transition-transform duration-700 hover:scale-[1.01] sm:p-6 md:gap-12 md:p-16 lg:flex-row">
          <div className="w-full lg:w-5/12 shrink-0">
            <div className="aspect-[3/4] rounded-lg overflow-hidden relative shadow-lg group">
              <div className="absolute inset-0 bg-stone-200 animate-pulse" />
              <img
                src={result.imageUrl}
                loading="lazy"
                decoding="async"
                className="relative z-10 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                style={{ objectPosition: result.imageUrl === TEST_FUTURE_IMAGE ? 'center' : 'center' }}
                alt="Future Self"
              />
              <div className="absolute bottom-6 left-0 right-0 text-center z-20">
                <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold text-charcoal shadow-sm tracking-widest uppercase">
                  {text.badge}
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex-1 space-y-6 text-left md:space-y-8">
            <div className="absolute -right-2 -top-4 z-0 select-none font-serif text-6xl text-stone-50 sm:-top-6 sm:text-8xl md:-right-10 md:-top-10 md:text-9xl">"</div>

            <div className="relative z-10 border-b border-stone-100 pb-4 font-serif text-xl text-charcoal sm:text-2xl md:pb-6 md:text-3xl">
              {text.salutation}
            </div>

            <div className="relative z-10 font-serif text-base italic leading-8 text-stone-600 sm:text-lg md:text-xl md:leading-9">
              "{result.letter}"
            </div>

            <div className="relative z-10 flex flex-col items-stretch gap-4 pt-4 sm:items-center md:flex-row md:gap-6 md:pt-8">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 text-xs font-sans uppercase tracking-widest text-stone-400 transition-colors hover:text-charcoal"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {text.save}
              </button>
              <div className="h-px w-12 bg-stone-200 hidden md:block" />
              <button
                onClick={onRestart}
                className="text-xs font-sans text-stone-400 uppercase tracking-widest hover:text-charcoal transition-colors"
              >
                {text.restart}
              </button>
              <button
                onClick={onContinue}
                className="rounded-full bg-charcoal px-8 py-3 text-sm font-medium text-white transition-all hover:bg-black"
              >
                {text.continue}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalReveal;
