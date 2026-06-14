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
    <div className="fixed top-5 right-5 z-[60] flex items-center gap-2">
      <button
        onClick={onOpenLetter}
        className="rounded-full bg-white/75 px-4 py-2 text-xs font-medium tracking-[0.12em] text-stone-500 shadow-sm backdrop-blur hover:text-charcoal"
      >
        {language === 'zh' ? '我想说' : 'A Note'}
      </button>
      <button
        onClick={onOpenAdmin}
        className="rounded-full bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600 shadow-sm backdrop-blur hover:text-charcoal"
      >
        Admin
      </button>
      <button
        onClick={onToggleLanguage}
        className="rounded-full bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600 shadow-sm backdrop-blur hover:text-charcoal"
      >
        {language === 'zh' ? 'EN' : '中文'}
      </button>
      <button
        onClick={onToggleTestMode}
        className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] shadow-sm backdrop-blur ${
          testMode ? 'bg-charcoal text-white' : 'bg-white/85 text-stone-600 hover:text-charcoal'
        }`}
      >
        {testMode ? text.app.testMode : text.app.normalMode}
      </button>
    </div>
  );
};

export default AppControls;
