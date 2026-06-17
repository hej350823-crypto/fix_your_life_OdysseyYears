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
    <section className="min-h-screen flex items-center justify-center py-20 px-6 bg-gradient-to-br from-warmWhite via-orange-50/30 to-purple-50/20">
      <div className="max-w-6xl mx-auto w-full space-y-12 animate-fade-in-up">
        <div className="text-center space-y-4">
          <h2 className="font-serif text-4xl md:text-5xl text-charcoal">
            {text.hello}, {userName}.
          </h2>
          <p className="text-stone-500 font-sans tracking-wide uppercase text-sm">
            {received}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-16 flex flex-col lg:flex-row gap-12 items-center transform hover:scale-[1.01] transition-transform duration-700 border border-stone-100">
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

          <div className="flex-1 text-left space-y-8 relative">
            <div className="absolute -top-10 -right-10 text-9xl text-stone-50 font-serif z-0 select-none">"</div>

            <div className="relative z-10 font-serif text-2xl md:text-3xl text-charcoal border-b border-stone-100 pb-6">
              {text.salutation}
            </div>

            <div className="relative z-10 font-serif text-stone-600 leading-9 text-lg md:text-xl italic">
              "{result.letter}"
            </div>

            <div className="pt-8 flex flex-col md:flex-row items-center gap-6 relative z-10">
              <button
                onClick={() => window.print()}
                className="text-xs font-sans text-stone-400 uppercase tracking-widest hover:text-charcoal transition-colors flex items-center gap-2"
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
                className="px-8 py-3 bg-charcoal text-white rounded-full text-sm font-medium hover:bg-black transition-all"
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
