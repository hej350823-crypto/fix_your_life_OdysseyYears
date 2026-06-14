import React, { useState } from 'react';
import { t } from '../i18n';
import { Language } from '../types';

interface FooterProps {
  language: Language;
  onStart: (name: string) => void;
  onOpenLetter: () => void;
}

const Footer: React.FC<FooterProps> = ({ language, onStart, onOpenLetter }) => {
  const [name, setName] = useState('');
  const text = t(language).footer;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name);
    }
  };

  return (
    <footer className="py-32 px-6 text-center">
      <div className="max-w-3xl mx-auto space-y-10">
        <h2 className="font-serif text-4xl md:text-5xl text-charcoal">
          {text.title}
        </h2>

        <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto group">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={text.placeholder}
            className="w-full bg-white border-none rounded-full py-6 px-8 text-lg md:text-xl text-charcoal placeholder:text-stone-300 shadow-xl focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 bottom-2 bg-charcoal text-white rounded-full px-8 hover:bg-black transition-colors font-medium flex items-center justify-center"
          >
            {text.submit}
          </button>
        </form>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 font-sans text-sm text-stone-400 sm:flex-row">
          <button
            type="button"
            onClick={onOpenLetter}
            className="transition-colors hover:text-charcoal"
          >
            {language === 'zh' ? '我想说' : 'A Note'}
          </button>
          <span className="hidden h-1 w-1 rounded-full bg-stone-300 sm:block" />
          <p>{text.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
