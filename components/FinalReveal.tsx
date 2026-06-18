import React, { useState } from 'react';
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

const EXPORT_WIDTH = 2048;
const EXPORT_HEIGHT = 1210;
const EXPORT_CARD_RADIUS = 28;

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
};

const loadExportImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  if (!src.startsWith('data:') && !src.startsWith('blob:')) {
    image.crossOrigin = 'anonymous';
  }
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Image failed to load for export'));
  image.src = src;
});

const drawCoverImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  const sourceWidth = imageRatio > targetRatio ? image.naturalHeight * targetRatio : image.naturalWidth;
  const sourceHeight = sourceWidth / targetRatio;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;

  context.save();
  drawRoundedRect(context, x, y, width, height, 12);
  context.clip();
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  context.restore();
};

const wrapCanvasText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const lines: string[] = [];
  let line = '';

  for (const character of normalized) {
    const nextLine = line + character;
    if (line && context.measureText(nextLine).width > maxWidth) {
      lines.push(line.trimEnd());
      line = character.trimStart();
    } else {
      line = nextLine;
    }
  }

  if (line) {
    lines.push(line.trimEnd());
  }

  return lines;
};

const FinalReveal: React.FC<FinalRevealProps> = ({ result, userName, language, onRestart, onContinue }) => {
  const text = t(language).final;
  const received = text.received.replace('{year}', String(new Date().getFullYear() + 5));
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSaveImage = async () => {
    if (isSavingImage) return;
    setIsSavingImage(true);
    setSaveError('');

    try {
      const image = await loadExportImage(result.imageUrl);
      const canvas = document.createElement('canvas');
      canvas.width = EXPORT_WIDTH;
      canvas.height = EXPORT_HEIGHT;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.fillStyle = '#f7f5f1';
      context.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

      context.save();
      context.shadowColor = 'rgba(28, 25, 23, 0.12)';
      context.shadowBlur = 42;
      context.shadowOffsetY = 18;
      context.fillStyle = '#ffffff';
      drawRoundedRect(context, 20, 20, EXPORT_WIDTH - 40, EXPORT_HEIGHT - 40, EXPORT_CARD_RADIUS);
      context.fill();
      context.restore();

      const imageX = 132;
      const imageY = 132;
      const imageWidth = 744;
      const imageHeight = 986;
      drawCoverImage(context, image, imageX, imageY, imageWidth, imageHeight);

      context.save();
      context.fillStyle = 'rgba(255, 255, 255, 0.94)';
      context.shadowColor = 'rgba(28, 25, 23, 0.16)';
      context.shadowBlur = 16;
      drawRoundedRect(context, imageX + imageWidth / 2 - 74, imageY + imageHeight - 86, 148, 54, 27);
      context.fill();
      context.restore();
      context.fillStyle = '#292524';
      context.font = '700 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text.badge, imageX + imageWidth / 2, imageY + imageHeight - 59);

      const textX = 960;
      const textY = 318;
      const textWidth = 952;

      context.fillStyle = '#f6f5f4';
      context.font = '130px Georgia, "Times New Roman", serif';
      context.textAlign = 'right';
      context.textBaseline = 'top';
      context.fillText('"', 1964, 222);

      context.fillStyle = '#292524';
      context.textAlign = 'left';
      context.font = '48px Georgia, "Times New Roman", "Noto Serif SC", serif';
      context.fillText(text.salutation, textX, textY);

      context.strokeStyle = '#eee9e3';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(textX, textY + 98);
      context.lineTo(textX + textWidth, textY + 98);
      context.stroke();

      const quotedLetter = `"${result.letter}"`;
      let fontSize = 36;
      let lineHeight = 64;
      let lines: string[] = [];
      do {
        context.font = `italic ${fontSize}px Georgia, "Times New Roman", "Noto Serif SC", serif`;
        lines = wrapCanvasText(context, quotedLetter, textWidth);
        if (lines.length <= 7 || fontSize <= 28) break;
        fontSize -= 2;
        lineHeight -= 3;
      } while (true);

      context.fillStyle = '#6b6660';
      context.textBaseline = 'top';
      lines.slice(0, 8).forEach((line, index) => {
        context.fillText(line, textX, textY + 168 + index * lineHeight);
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `future-letter-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.warn('Could not export future letter image.', error);
      setSaveError(text.saveError);
    } finally {
      setIsSavingImage(false);
    }
  };

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
                onClick={handleSaveImage}
                disabled={isSavingImage}
                className="flex items-center justify-center gap-2 text-xs font-sans uppercase tracking-widest text-stone-400 transition-colors hover:text-charcoal disabled:cursor-wait disabled:opacity-60"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {isSavingImage ? text.saving : text.save}
              </button>
              {saveError && (
                <span className="text-xs font-sans text-rose-400">
                  {saveError}
                </span>
              )}
              <div className="h-px w-12 bg-stone-200 hidden md:block" />
              <button
                onClick={() => setShowRestartConfirm(true)}
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

      {showRestartConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-950/30 px-5 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-white/70 bg-white p-6 text-center shadow-[0_24px_80px_rgba(28,25,23,0.22)] sm:p-8">
            <h3 className="font-serif text-2xl text-charcoal">
              {text.restartConfirmTitle}
            </h3>
            <p className="mx-auto mt-4 max-w-lg font-sans text-sm leading-7 text-stone-500">
              {text.restartConfirmBody}
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <button
                type="button"
                onClick={() => setShowRestartConfirm(false)}
                className="rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-medium text-stone-600 transition-all hover:border-stone-300 hover:text-charcoal"
              >
                {text.restartConfirmCancel}
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="rounded-full bg-charcoal px-6 py-3 text-sm font-medium text-white transition-all hover:bg-black"
              >
                {text.restartConfirmAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FinalReveal;
