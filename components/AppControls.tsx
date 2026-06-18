import React from 'react';
import { t } from '../i18n';
import { Language } from '../types';

interface AppControlsProps {
  language: Language;
  testMode: boolean;
  onToggleLanguage: () => void;
  onToggleTestMode: () => void;
  onOpenAdmin: () => void;
  onOpenLetter: () => void;
}

const AppControls: React.FC<AppControlsProps> = ({
  language,
  testMode,
  onToggleLanguage,
  onToggleTestMode,
  onOpenAdmin,
  onOpenLetter,
}) => {
  const text = t(language);

  return (
    <div className="fixed left-4 right-4 top-4 z-[60] flex flex-wrap justify-end gap-2 sm:left-auto sm:right-5 sm:top-5 sm:flex-nowrap">
      <button
        onClick={onOpenLetter}
        className="rounded-full bg-white/75 px-3 py-2 text-[11px] font-medium tracking-[0.08em] text-stone-500 shadow-sm backdrop-blur hover:text-charcoal sm:px-4 sm:text-xs sm:tracking-[0.12em]"
      >
        {language === 'zh' ? '我想说' : 'A Note'}
      </button>
      <button
        onClick={onToggleLanguage}
        className="rounded-full bg-white/85 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-600 shadow-sm backdrop-blur hover:text-charcoal sm:px-4 sm:text-xs sm:tracking-[0.16em]"
      >
        {language === 'zh' ? 'EN' : '中文'}
      </button>
      <button
        onClick={onToggleTestMode}
        className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] shadow-sm backdrop-blur sm:px-4 sm:text-xs sm:tracking-[0.14em] ${
          testMode ? 'bg-charcoal text-white' : 'bg-white/85 text-stone-600 hover:text-charcoal'
        }`}
      >
        {testMode ? text.app.testMode : text.app.normalMode}
      </button>
      <button
        onClick={onOpenAdmin}
        className="rounded-full bg-white/85 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-600 shadow-sm backdrop-blur hover:text-charcoal sm:px-4 sm:text-xs sm:tracking-[0.14em]"
      >
        Admin
      </button>
    </div>
  );
};

export default AppControls;
