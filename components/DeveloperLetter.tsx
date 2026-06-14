import React from 'react';
import { Language } from '../types';

interface DeveloperLetterProps {
  language: Language;
  onBack: () => void;
}

const letterCopy = {
  zh: {
    nav: '返回首页',
    title: '我想对现在的你说',
    paragraphs: [
      '做这个作品，是因为我也还在迷雾里。',
      '有一段时间，我很害怕承认自己没有方向。好像只要说出口，就等于我落后了、失败了、没有把人生安排好。但后来我慢慢发现，很多人不是不努力，也不是不想变好，只是站在一个很难被看见的过渡地带：旧的自己已经不太能继续，新的人生又还没有长出来。',
      '我做 Fix Your Life，不是因为我已经知道答案。恰恰相反，是因为我也在寻找一个可以让人慢下来、诚实一点、重新看见自己的入口。',
      '我希望它不像一个催你变好的工具，也不像一句轻飘飘的鼓励。它更像一盏很小的灯：先陪你把现在的迷雾说清楚，再帮你看一眼那个可能正在前方等你的自己。',
      '如果你也正处在这种说不清的阶段，我想告诉你：看不清方向，不代表你没有未来。也许你只是正在离开一个旧的自己，而新的自己还需要一点时间被你认出来。',
    ],
    signature: '谢谢你来到这里。也谢谢你，还愿意继续往前走。',
  },
  en: {
    nav: 'Back Home',
    title: 'A note to you, right now',
    paragraphs: [
      'I made this because I am still in the fog too.',
      'For a while, I was afraid to admit that I did not know where I was going. Saying it out loud felt like proof that I was behind, failing, or unable to arrange my life properly. But I started to realize that many people are not lazy or unwilling to change. They are standing in a hard-to-name in-between place: the old self no longer fits, and the new life has not fully arrived.',
      'Fix Your Life does not come from someone who already has the answer. It comes from someone who is also looking for a gentler entry point back to honesty, direction, and self-recognition.',
      'I hope this does not feel like a tool that rushes you to improve, or a piece of shallow encouragement. I hope it feels more like a small light: first helping you name the fog, then helping you glimpse the self who may already be waiting ahead.',
      'If you are in that unclear place too, I want to say this: not seeing the direction does not mean you have no future. Maybe you are simply leaving an old self, and the new one still needs time to become recognizable.',
    ],
    signature: 'Thank you for being here. And thank you for still moving forward.',
  },
};

const DeveloperLetter: React.FC<DeveloperLetterProps> = ({ language, onBack }) => {
  const copy = letterCopy[language];

  return (
    <main
      className="relative min-h-screen overflow-hidden px-6 py-8 text-charcoal md:px-12"
      style={{
        backgroundImage: `
          linear-gradient(90deg, transparent 0, transparent 68px, rgba(251, 113, 133, 0.16) 69px, transparent 70px),
          radial-gradient(circle at 86% 12%, rgba(254, 215, 170, 0.34), transparent 34%),
          radial-gradient(circle at 10% 82%, rgba(221, 214, 254, 0.26), transparent 32%),
          linear-gradient(180deg, #fffdf7 0%, #fffaf2 48%, #fcf8f1 100%)
        `,
        backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 100%',
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-multiply [background-image:radial-gradient(rgba(87,83,78,0.20)_0.6px,transparent_0.7px)] [background-size:5px_5px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/40 to-transparent" />

      <button
        type="button"
        onClick={onBack}
        className="relative z-10 rounded-full bg-white/60 px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-stone-500 shadow-sm backdrop-blur transition-colors hover:text-charcoal"
      >
        ← {copy.nav}
      </button>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-3xl flex-col justify-center py-16 pl-8 md:pl-12">
        <article className="py-12">
          <h1 className="font-serif text-4xl leading-tight text-charcoal md:text-6xl">
              {copy.title}
            </h1>

          <div className="mt-12 space-y-7 font-serif text-xl leading-10 text-stone-600 md:text-2xl md:leading-[2.05]">
            {copy.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <p className="mt-12 font-sans text-base leading-8 text-stone-500">
            {copy.signature}
          </p>
        </article>
      </section>
    </main>
  );
};

export default DeveloperLetter;
