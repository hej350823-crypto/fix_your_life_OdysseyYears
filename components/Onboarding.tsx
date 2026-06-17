import React, { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import { Language, UserData } from '../types';

interface OnboardingProps {
  language: Language;
  testMode: boolean;
  initialName?: string;
  onComplete: (data: UserData) => void;
}

const MAX_UPLOAD_EDGE = 1024;
const UPLOAD_EXPORT_QUALITY = 0.76;

const Onboarding: React.FC<OnboardingProps> = ({ language, testMode, initialName = '', onComplete }) => {
  const TEST_PROFILE_SOURCE = '/test-assets/test-source.png';
  const normalizedInitialName = initialName.trim();
  const [step, setStep] = useState<0 | 1 | 2>(normalizedInitialName ? 1 : 0);
  const [name, setName] = useState(normalizedInitialName);
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loadedTestProfile, setLoadedTestProfile] = useState(false);
  const [shake, setShake] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const [focusedPoint, setFocusedPoint] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const text = t(language).onboarding;
  const testProfile = t(language).test.profile;
  const allPainPointOptions = text.painPointGroups.flatMap((group) => group.options);
  const previewPoint = allPainPointOptions.find((option) => option.title === (hoveredPoint || focusedPoint)) || null;

  useEffect(() => {
    if (!testMode && loadedTestProfile) {
      setLoadedTestProfile(false);
    }
  }, [testMode, loadedTestProfile]);

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
      prev.includes(point)
        ? prev.filter((p) => p !== point)
        : [...prev, point],
    );
    setFocusedPoint(point);
  };

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('File read failed'));
    reader.readAsDataURL(file);
  });

  const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image decode failed'));
    image.src = src;
  });

  const compressPhoto = async (file: File) => {
    const sourceDataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(sourceDataUrl);
    const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);

    const scale = Math.min(1, MAX_UPLOAD_EDGE / longestEdge);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return sourceDataUrl;
    }

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', UPLOAD_EXPORT_QUALITY);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedPhoto = await compressPhoto(file);
      setPhoto(compressedPhoto);
    } catch (error) {
      console.warn('Photo compression failed. Falling back to original upload.', error);
      const fallbackPhoto = await readFileAsDataUrl(file);
      setPhoto(fallbackPhoto);
    }
  };

  const handleFinalize = () => {
    if (!photo) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsFadingOut(true);
    setTimeout(() => {
      onComplete({
        name,
        painPoints: selectedPoints,
        photo,
        language,
        isTestMode: testMode,
      });
    }, 800);
  };

  const loadTestProfile = () => {
    setName(testProfile.name);
    setSelectedPoints(testProfile.painPoints);
    setPhoto(testProfile.photo);
    setLoadedTestProfile(true);
    setFocusedPoint(testProfile.painPoints[0] || null);
  };

  const progressWidth = step === 0 ? '33%' : step === 1 ? '66%' : '100%';

  return (
    <div className={`relative flex min-h-[100svh] flex-col items-center overflow-hidden transition-opacity duration-700 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-warmWhite via-orange-50/40 to-purple-50/30 -z-10 transition-colors duration-1000" />

      <div className="w-full h-1 bg-stone-100 fixed top-0 left-0 z-50">
        <div
          className="h-full bg-gradient-to-r from-orange-200 to-warmOrange transition-all duration-1000 ease-out"
          style={{ width: progressWidth }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-5 py-24 sm:px-6 md:py-12">
        {testMode && (
          <div className="absolute left-5 top-20 z-40 flex max-w-[calc(100%-40px)] flex-col items-start gap-2 md:left-6 md:top-6">
            <button
              type="button"
              onClick={loadTestProfile}
              className="rounded-full bg-charcoal px-4 py-2 text-xs font-medium text-white shadow-lg hover:bg-black sm:px-5 sm:text-sm"
            >
              {loadedTestProfile ? text.testProfileReady : text.useTestProfile}
            </button>
            <span className="rounded-full bg-white/75 px-4 py-1 text-[11px] text-stone-500 shadow-sm backdrop-blur sm:text-xs">
              {text.privacyNote}
            </span>
          </div>
        )}

        {step === 0 && (
          <div className="animate-fade-in-up flex flex-col items-center space-y-8 text-center md:space-y-12">
            <h2 className="font-serif text-2xl text-stone-600 sm:text-3xl md:text-4xl">
              {text.nameQuestion}
            </h2>

            <form onSubmit={handleNameSubmit} className="w-full relative group">
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full border-b-2 border-transparent bg-transparent pb-4 text-center font-serif text-4xl text-charcoal outline-none transition-all placeholder:text-stone-200 focus:border-stone-200 sm:text-5xl md:text-7xl ${shake ? 'translate-x-[-10px]' : ''}`}
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
                  className="rounded-full bg-charcoal px-8 py-4 font-sans text-sm font-medium tracking-wide text-white shadow-xl shadow-stone-300/30 transition-all duration-500 hover:-translate-y-0.5 hover:bg-black sm:px-9 sm:text-base disabled:pointer-events-none disabled:translate-y-3 disabled:opacity-0"
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
          <div className="animate-fade-in-up flex flex-col items-center space-y-4 text-center">
            <div className="space-y-4">
              <h2 className="font-serif text-3xl text-charcoal sm:text-4xl md:text-5xl">
                {text.hello}, {name}.
              </h2>
              <div className="space-y-6 md:space-y-10">
                <p className="font-serif text-xl text-stone-500 not-italic sm:text-2xl">
                  {text.painQuestion}
                </p>
                <div className="min-h-[72px] md:min-h-[48px]">
                  {previewPoint && (
                    <p className="mx-auto max-w-3xl text-base leading-7 text-stone-500 transition-all duration-300">
                      “{previewPoint.preview}”
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid w-full max-w-5xl gap-x-8 gap-y-4 md:grid-cols-2">
              {text.painPointGroups.map((group) => (
                <div key={group.title} className="space-y-3">
                  <div className="text-center text-[11px] uppercase tracking-[0.24em] text-stone-300">
                    {group.title}
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {group.options.map((point) => {
                      const isSelected = selectedPoints.includes(point.title);
                      return (
                        <button
                          key={point.title}
                          type="button"
                          onClick={() => togglePoint(point.title)}
                          onMouseEnter={() => setHoveredPoint(point.title)}
                          onMouseLeave={() => setHoveredPoint(null)}
                          className={`rounded-full px-4 py-2.5 text-sm transition-all duration-300 transform sm:px-5 sm:text-base md:text-lg ${
                            isSelected
                              ? 'bg-orange-100 text-charcoal shadow-md scale-105 border border-orange-200'
                              : 'bg-white text-stone-500 border border-stone-100 hover:-translate-y-1 hover:border-stone-300'
                          }`}
                        >
                          {point.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 md:pt-8">
              <button
                onClick={() => setStep(2)}
                disabled={selectedPoints.length === 0}
                className="rounded-full bg-charcoal px-8 py-4 text-base font-medium tracking-wide text-white shadow-lg transition-all hover:bg-black hover:shadow-orange-200/50 sm:px-10 sm:text-lg disabled:translate-y-4 disabled:opacity-0"
              >
                {text.continue}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in-up flex flex-col items-center space-y-8 text-center md:space-y-10">
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-charcoal sm:text-3xl md:text-4xl">
                {text.photoTitle}
              </h2>
              <p className="font-sans text-stone-400 tracking-wide uppercase text-xs">
                {text.photoSubtitle}
              </p>
            </div>

            <div
              className="group relative h-72 w-56 cursor-pointer overflow-hidden rounded-b-[20px] rounded-t-[140px] border-4 border-white bg-stone-100 shadow-2xl transition-all hover:shadow-orange-100/50 sm:h-80 sm:w-64 md:h-96 md:w-80 md:rounded-t-[160px]"
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
                    style={{ objectPosition: photo === TEST_PROFILE_SOURCE ? 'left center' : 'center' }}
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
                {testMode && (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setPhoto(testProfile.photo);
                        setLoadedTestProfile(true);
                      }}
                      className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs text-stone-600 shadow-sm hover:border-orange-200 hover:text-charcoal sm:px-5 sm:text-sm"
                    >
                      {text.useTestPhoto}
                    </button>
                  </div>
                )}

                {photo && (
                  <>
                  <p className="font-serif text-stone-500 italic">
                    {text.photoQuote}
                  </p>
                  <button
                    onClick={handleFinalize}
                    className="rounded-full bg-gradient-to-r from-warmOrange to-orange-400 px-10 py-4 text-base font-medium text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-orange-200 sm:px-12 sm:text-lg"
                  >
                    {text.start}
                  </button>
                  </>
                )}
                {!photo && (
                  <p className={`font-sans text-sm transition-colors ${shake ? 'text-red-400' : 'text-stone-400'}`}>
                    {text.photoRequired}
                  </p>
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
