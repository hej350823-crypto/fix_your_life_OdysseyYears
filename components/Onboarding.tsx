import React, { useRef, useState } from 'react';
import { t } from '../i18n';
import { Language, UserData } from '../types';

interface OnboardingProps {
  language: Language;
  testMode: boolean;
  initialName?: string;
  onComplete: (data: UserData) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ language, testMode, initialName = '', onComplete }) => {
  const normalizedInitialName = initialName.trim();
  const [step, setStep] = useState<0 | 1 | 2>(normalizedInitialName ? 1 : 0);
  const [name, setName] = useState(normalizedInitialName);
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loadedTestProfile, setLoadedTestProfile] = useState(false);
  const [shake, setShake] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const text = t(language).onboarding;
  const testProfile = t(language).test.profile;

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setStep(1);
  };

  const togglePoint = (point: string) => {
    setSelectedPoints((prev) =>
      prev.includes(point) ? prev.filter((p) => p !== point) : [...prev, point],
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFinalize = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete({
        name,
        painPoints: selectedPoints,
        photo,
        language,
        isTestMode: testMode || loadedTestProfile,
      });
    }, 800);
  };

  const loadTestProfile = () => {
    setName(testProfile.name);
    setSelectedPoints(testProfile.painPoints);
    setPhoto(testProfile.photo);
    setLoadedTestProfile(true);
  };

  const progressWidth = step === 0 ? '33%' : step === 1 ? '66%' : '100%';

  return (
    <div className={`min-h-screen flex flex-col items-center relative overflow-hidden transition-opacity duration-700 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-warmWhite via-orange-50/40 to-purple-50/30 -z-10 transition-colors duration-1000" />

      <div className="w-full h-1 bg-stone-100 fixed top-0 left-0 z-50">
        <div
          className="h-full bg-gradient-to-r from-orange-200 to-warmOrange transition-all duration-1000 ease-out"
          style={{ width: progressWidth }}
        />
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col justify-center px-6 py-12">
        {testMode && (
          <div className="absolute left-6 top-6 z-40 flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={loadTestProfile}
              className="rounded-full bg-charcoal px-5 py-2 text-sm font-medium text-white shadow-lg hover:bg-black"
            >
              {loadedTestProfile ? text.testProfileReady : text.useTestProfile}
            </button>
            <span className="rounded-full bg-white/75 px-4 py-1 text-xs text-stone-500 shadow-sm backdrop-blur">
              {text.privacyNote}
            </span>
          </div>
        )}

        {step === 0 && (
          <div className="flex flex-col items-center text-center space-y-12 animate-fade-in-up">
            <h2 className="font-serif text-3xl md:text-4xl text-stone-600">
              {text.nameQuestion}
            </h2>

            <form onSubmit={handleNameSubmit} className="w-full relative group">
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full bg-transparent text-center font-serif text-5xl md:text-7xl text-charcoal placeholder:text-stone-200 outline-none border-b-2 border-transparent focus:border-stone-200 transition-all pb-4 ${shake ? 'translate-x-[-10px]' : ''}`}
                placeholder={text.namePlaceholder}
                style={{ animation: shake ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none' }}
              />
              <div className="mt-8 flex flex-col items-center gap-5">
                <div className={`font-sans text-sm text-stone-400 transition-opacity duration-300 ${name.trim() ? 'opacity-100' : 'opacity-75 animate-pulse'}`}>
                  {text.enterHint}
                </div>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="rounded-full bg-charcoal px-9 py-4 font-sans text-base font-medium tracking-wide text-white shadow-xl shadow-stone-300/30 transition-all duration-500 hover:-translate-y-0.5 hover:bg-black disabled:pointer-events-none disabled:translate-y-3 disabled:opacity-0"
                >
                  <span className="inline-flex items-center gap-3">
                    {text.nameContinue}
                    <span aria-hidden="true">→</span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col items-center text-center space-y-12 animate-fade-in-up">
            <div className="space-y-4">
              <h2 className="font-serif text-4xl md:text-5xl text-charcoal">
                {text.hello}, {name}.
              </h2>
              <p className="font-serif text-2xl text-stone-500 italic">
                {text.painQuestion}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 max-w-2xl">
              {text.painPoints.map((point) => {
                const isSelected = selectedPoints.includes(point);
                return (
                  <button
                    key={point}
                    onClick={() => togglePoint(point)}
                    className={`px-6 py-3 rounded-full text-lg transition-all duration-300 transform hover:-translate-y-1 ${
                      isSelected
                        ? 'bg-orange-100 text-charcoal shadow-md scale-105 border border-orange-200'
                        : 'bg-white text-stone-500 border border-stone-100 hover:border-stone-300'
                    }`}
                  >
                    {point}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={selectedPoints.length === 0}
              className="mt-8 px-10 py-4 bg-charcoal text-white rounded-full text-lg font-medium tracking-wide shadow-lg hover:bg-black hover:shadow-orange-200/50 transition-all disabled:opacity-0 disabled:translate-y-4"
            >
              {text.continue}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center text-center space-y-10 animate-fade-in-up">
            <div className="space-y-2">
              <h2 className="font-serif text-3xl md:text-4xl text-charcoal">
                {text.photoTitle}
              </h2>
              <p className="font-sans text-stone-400 tracking-wide uppercase text-xs">
                {text.photoSubtitle}
              </p>
            </div>

            <div
              className="relative w-64 h-80 md:w-80 md:h-96 rounded-t-[160px] rounded-b-[20px] bg-stone-100 overflow-hidden cursor-pointer group shadow-2xl transition-all hover:shadow-orange-100/50 border-4 border-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                hidden
              />

              {photo ? (
                <>
                  <img
                    src={photo}
                    alt="Current State"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-100/12 via-transparent to-white/10 pointer-events-none" />
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 text-stone-400 group-hover:text-stone-600 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-tr from-stone-50 via-white to-stone-100 opacity-50 animate-pulse-slow" />
                  <div className="relative z-10 p-4 border border-dashed border-stone-300 rounded-full">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="relative z-10 font-serif italic text-lg">{text.upload}</span>
                </div>
              )}
            </div>

            <div className="min-h-12 flex items-center justify-center">
              <div className="animate-fade-in-up space-y-6">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {testMode && (
                    <button
                      onClick={() => {
                        setPhoto(testProfile.photo);
                        setLoadedTestProfile(true);
                      }}
                      className="rounded-full border border-stone-200 bg-white px-5 py-2 text-sm text-stone-600 shadow-sm hover:border-orange-200 hover:text-charcoal"
                    >
                      {text.useTestPhoto}
                    </button>
                  )}
                  <button
                    onClick={() => setPhoto(null)}
                    className="rounded-full border border-stone-200 bg-white px-5 py-2 text-sm text-stone-500 shadow-sm hover:border-stone-300 hover:text-charcoal"
                  >
                    {text.skipPhoto}
                  </button>
                </div>

                {photo && (
                  <>
                  <p className="font-serif text-stone-500 italic">
                    {text.photoQuote}
                  </p>
                  <button
                    onClick={handleFinalize}
                    className="px-12 py-4 bg-gradient-to-r from-warmOrange to-orange-400 text-white rounded-full text-lg font-medium shadow-lg hover:shadow-orange-200 hover:-translate-y-1 transition-all"
                  >
                    {text.start}
                  </button>
                  </>
                )}
                {!photo && (
                  <button
                    onClick={handleFinalize}
                    className="px-12 py-4 bg-charcoal text-white rounded-full text-lg font-medium shadow-lg hover:bg-black transition-all"
                  >
                    {text.start}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
