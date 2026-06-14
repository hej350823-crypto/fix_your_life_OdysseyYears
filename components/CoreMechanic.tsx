import React, { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import { Language } from '../types';

interface CoreMechanicProps {
  language: Language;
}

const CoreMechanic: React.FC<CoreMechanicProps> = ({ language }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);
  const [blurAmount, setBlurAmount] = useState(40);
  const [opacity, setOpacity] = useState(0.4);
  const [isScrollingDown, setIsScrollingDown] = useState(true);
  const steps = t(language).core.steps;
  const shoreImage = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop';

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const currentScrollY = window.scrollY;
      const nextIsScrollingDown = currentScrollY >= lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;
      setIsScrollingDown((current) => (
        current === nextIsScrollingDown ? current : nextIsScrollingDown
      ));

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const totalDistance = Math.max(rect.height - viewportHeight, 1);
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalDistance));

      setBlurAmount(40 - progress * 40);
      setOpacity(0.4 + progress * 0.6);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="defer-section py-20 px-8 md:px-12">
      <div ref={containerRef} className="relative flex flex-col md:flex-row max-w-6xl mx-auto">
        <div className="hidden md:flex md:w-1/2 h-screen sticky top-0 items-center justify-center p-10">
          <div className="relative w-full max-w-[360px] aspect-[3/4] max-h-[68vh] rounded-xl overflow-hidden shadow-2xl border border-white/70 bg-stone-200">
            <img
              src={shoreImage}
              alt="A future self portrait gradually becoming clear"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-all duration-100 ease-linear"
              style={{
                filter: `blur(${blurAmount}px)`,
                transform: `scale(${1.05 - blurAmount / 1000})`,
              }}
            />

            <div
              className="absolute inset-0 bg-warmWhite pointer-events-none transition-opacity duration-100"
              style={{ opacity: 1 - opacity }}
            />
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-charcoal/45 to-transparent text-white">
              <div className="text-xs uppercase tracking-[0.22em] opacity-75">
                {language === 'zh' ? '未来的你' : 'Future You'}
              </div>
            </div>
          </div>
        </div>

        <div className="md:w-1/2 flex flex-col">
          <div className="md:hidden sticky top-20 z-10 mb-12">
            <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-lg border-4 border-white">
              <img
                src={shoreImage}
                loading="lazy"
                decoding="async"
                style={{ filter: `blur(${blurAmount}px)` }}
                className="w-full h-full object-cover"
                alt="A future self portrait"
              />
            </div>
          </div>

          <div className="pb-[50vh]" />

          {steps.map((step, idx) => {
            const isLastStep = idx === steps.length - 1;

            return (
            <div
              key={step.title}
              className={`${isLastStep ? 'min-h-[130vh] items-start pt-[22vh]' : 'min-h-[80vh] items-center'} flex justify-center md:justify-start px-4`}
            >
              <div className={`max-w-md ${isLastStep && isScrollingDown ? 'md:sticky md:top-[34vh]' : ''}`}>
                <div className="text-warmOrange font-serif text-2xl italic mb-4">0{idx + 1}</div>
                <h3 className="text-4xl font-serif text-charcoal mb-6 leading-tight">{step.title}</h3>
                <p className="text-lg font-sans text-stone-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
            );
          })}

          <div className="pb-[35vh]" />
        </div>
      </div>
    </section>
  );
};

export default CoreMechanic;
