import React, { useEffect, useRef } from 'react';
import { t } from '../i18n';
import { Language, ViewState } from '../types';

const revealImage = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1800&auto=format&fit=crop';

const FOG_RECOVER_MS = 3000;

interface HeroProps {
  language: Language;
  setViewState: (view: ViewState) => void;
}

const Hero: React.FC<HeroProps> = ({ language, setViewState }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const revealImageRef = useRef<HTMLImageElement>(null);
  const brushPointsRef = useRef<Array<{ x: number; y: number; createdAt: number }>>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const pendingFrameRef = useRef<number | null>(null);
  const text = t(language).hero;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const currentTime = Date.now();
      brushPointsRef.current = brushPointsRef.current.filter((point) => currentTime - point.createdAt < FOG_RECOVER_MS);
      updateRevealMask(currentTime);
      if (brushPointsRef.current.length === 0) {
        lastPointRef.current = null;
      }
    }, 100);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    return () => {
      if (pendingFrameRef.current !== null) {
        window.cancelAnimationFrame(pendingFrameRef.current);
      }
    };
  }, []);

  const buildRevealMask = (currentTime: number) => {
    const activePoints = brushPointsRef.current.filter((point) => currentTime - point.createdAt < FOG_RECOVER_MS);

    if (activePoints.length === 0) {
      return 'radial-gradient(circle 1px at 50% 50%, transparent, transparent)';
    }

    return activePoints
      .map((point) => {
        const age = Math.min((currentTime - point.createdAt) / FOG_RECOVER_MS, 1);
        const opacity = Math.max(0, 1 - age);
        const size = Math.round(120 - age * 40);
        const softEdge = Math.round(58 - age * 18);
        return `radial-gradient(circle ${size}px at ${point.x}px ${point.y}px, rgba(0,0,0,${0.64 * opacity}) 0%, rgba(0,0,0,${0.34 * opacity}) ${softEdge}%, transparent 100%)`;
      })
      .join(', ');
  };

  const updateRevealMask = (currentTime = Date.now()) => {
    if (!revealImageRef.current) return;
    const revealMask = buildRevealMask(currentTime);
    revealImageRef.current.style.maskImage = revealMask;
    revealImageRef.current.style.webkitMaskImage = revealMask;
  };

  const scheduleRevealMaskUpdate = (currentTime = Date.now()) => {
    if (pendingFrameRef.current !== null) return;

    pendingFrameRef.current = window.requestAnimationFrame(() => {
      pendingFrameRef.current = null;
      updateRevealMask(currentTime);
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const nextPoint = {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
      createdAt: Date.now(),
    };

    const lastPoint = lastPointRef.current;
    if (lastPoint && Math.hypot(lastPoint.x - nextPoint.x, lastPoint.y - nextPoint.y) < 18) {
      return;
    }

    lastPointRef.current = nextPoint;
    brushPointsRef.current = [...brushPointsRef.current.slice(-50), nextPoint];
    scheduleRevealMaskUpdate(nextPoint.createdAt);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden selection:bg-orange-100"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="hero-fog-tint absolute inset-0" />
        <div className="hero-soft-white-mask absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-warmWhite/82 via-transparent to-warmWhite/10" />
        <img
          ref={revealImageRef}
          src={revealImage}
          alt="Hidden Self"
          decoding="async"
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-65 grayscale-[10%] contrast-110 mix-blend-multiply transition-opacity duration-700"
          style={{
            maskImage: 'radial-gradient(circle 1px at 50% 50%, transparent, transparent)',
            WebkitMaskImage: 'radial-gradient(circle 1px at 50% 50%, transparent, transparent)',
            maskComposite: 'add',
            WebkitMaskComposite: 'source-over',
          }}
        />
        <div className="hero-top-image-fade absolute inset-x-0 top-0 h-44 pointer-events-none" />
        <div className="hero-bottom-image-fade absolute inset-x-0 bottom-0 h-56 pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center space-y-10 md:space-y-12 pt-10">
        <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-charcoal tracking-tighter leading-none">
          {text.title}
        </h1>

        <div className="space-y-6">
          <h2 className="font-serif text-2xl md:text-4xl text-stone-600 not-italic">
            {text.subtitle}
          </h2>
          <p className="font-sans text-stone-500 text-base md:text-lg max-w-xl mx-auto font-light leading-relaxed">
            {text.description}
          </p>
        </div>

        <button
          onClick={() => setViewState(ViewState.ONBOARDING)}
          className="group relative inline-flex items-center gap-3 px-12 py-5 rounded-full bg-charcoal text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-200/50"
        >
          <span className="relative font-sans font-medium tracking-wide text-lg">
            {text.cta}
          </span>
          <svg className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>

      </div>

      <nav className="absolute top-0 left-0 right-0 p-8 flex items-center z-20">
        <div className="w-8 h-8 rounded-full bg-charcoal/10" />
      </nav>
    </section>
  );
};

export default Hero;
