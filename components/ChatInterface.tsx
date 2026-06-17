import React, { useEffect, useRef, useState } from 'react';
import {
  createChatSession,
  ChatSession,
  generateFinalLetter,
  generateFutureSelfPortrait,
  generateUserPersonaProfile,
} from '../services/geminiService';
import { t } from '../i18n';
import { ConversationStage, GenerationResult, Language, Message, PromptSettings, UserData } from '../types';

const MAX_CHAT_TURNS = 6;
const STREAM_MIN_CHARS_PER_TICK = 1;
const STREAM_MAX_CHARS_PER_TICK = 3;
const STREAM_TICK_MS = 42;

interface ChatInterfaceProps {
  userData: UserData;
  language: Language;
  testMode: boolean;
  promptSettings: PromptSettings;
  onBack: () => void;
  onComplete: (result: GenerationResult) => void;
}

const conversationStageByTurn = (turnCount: number): ConversationStage => {
  if (turnCount <= 2) return 'anti-vision';
  if (turnCount <= 4) return 'shift';
  return 'ideal';
};

const ambientGradientByStage: Record<ConversationStage, string> = {
  'anti-vision': 'bg-gradient-to-br from-slate-50 via-stone-50 to-stone-100',
  shift: 'bg-gradient-to-br from-orange-50 via-rose-50 to-stone-50',
  ideal: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50/30',
};

const inputFadeByStage: Record<ConversationStage, string> = {
  'anti-vision': 'from-stone-50/92 via-stone-50/70',
  shift: 'from-rose-50/90 via-orange-50/64',
  ideal: 'from-orange-50/88 via-amber-50/62',
};

const collectVisualTags = (tags: unknown, target: Set<string>) => {
  if (!Array.isArray(tags)) return;
  tags
    .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
    .forEach((tag) => target.add(tag));
};

const getPersonaVisualTags = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) return [];
  return tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
};

const TEST_PROFILE_SOURCE = '/test-assets/test-source.png';

const wait = (ms: number) => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userData, language, testMode, promptSettings, onBack, onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stage, setStage] = useState<ConversationStage>('anti-vision');
  const [blurLevel, setBlurLevel] = useState(30);
  const [turnCount, setTurnCount] = useState(0);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);

  const collectedTagsRef = useRef<Set<string>>(new Set());
  const chatSession = useRef<ChatSession | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const streamControllerRef = useRef(0);
  const text = t(language).chat;
  const testCopy = t(language).test;

  const upsertLastAiMessage = (nextText: string, audioBase64?: string) => {
    setMessages((prev) => {
      if (prev.length === 0 || prev[prev.length - 1].sender !== 'ai') {
        return [...prev, { sender: 'ai', text: nextText, audioBase64 }];
      }

      const lastMessage = prev[prev.length - 1];
      return [
        ...prev.slice(0, -1),
        {
          ...lastMessage,
          text: nextText,
          audioBase64: audioBase64 ?? lastMessage.audioBase64,
        },
      ];
    });
  };

  const createDisplayStream = () => {
    const streamId = streamControllerRef.current + 1;
    streamControllerRef.current = streamId;
    let queuedText = '';
    let displayedText = '';
    let isClosed = false;
    let drainPromise: Promise<void> | null = null;

    const drain = async () => {
      while (streamControllerRef.current === streamId && (!isClosed || queuedText.length > 0)) {
        if (queuedText.length === 0) {
          await wait(STREAM_TICK_MS);
          continue;
        }

        const nextSize = Math.min(
          queuedText.length,
          Math.max(STREAM_MIN_CHARS_PER_TICK, Math.min(STREAM_MAX_CHARS_PER_TICK, Math.ceil(queuedText.length / 18))),
        );
        displayedText += queuedText.slice(0, nextSize);
        queuedText = queuedText.slice(nextSize);
        upsertLastAiMessage(displayedText);
        await wait(STREAM_TICK_MS);
      }
    };

    const ensureDrain = () => {
      if (!drainPromise) {
        drainPromise = drain();
      }
      return drainPromise;
    };

    return {
      push: (chunk: string) => {
        queuedText += chunk;
        void ensureDrain();
      },
      finish: async (finalText: string, audioBase64?: string) => {
        queuedText = finalText.slice(displayedText.length);
        isClosed = true;
        await ensureDrain();

        if (streamControllerRef.current === streamId) {
          upsertLastAiMessage(finalText, audioBase64);
        }
      },
      cancel: () => {
        isClosed = true;
      },
    };
  };

  useEffect(() => {
    let cancelled = false;
    let displayStream: ReturnType<typeof createDisplayStream> | null = null;

    const init = async () => {
      chatSession.current = createChatSession(userData, promptSettings);
      setIsTyping(true);
      try {
        displayStream = createDisplayStream();
        const welcomeData = await chatSession.current.sendMessage(`(System: User arrived. Name: ${userData.name}. Start Turn 1.)`, {
          onTextChunk: (chunk) => {
            if (cancelled) return;
            displayStream?.push(chunk);
          },
        });
        if (cancelled) return;

        await displayStream.finish(welcomeData.text, welcomeData.audioBase64);
        if (cancelled) return;

        setCurrentSuggestions(welcomeData.suggestions || []);
        collectVisualTags(welcomeData.visual_tags, collectedTagsRef.current);
        setTurnCount(welcomeData.current_turn || 1);
      } finally {
        if (!cancelled) {
          setIsTyping(false);
        }
      }
    };

    init();
    return () => {
      cancelled = true;
      displayStream?.cancel();
    };
  }, [userData, promptSettings]);

  useEffect(() => {
    const scrollEl = messagesScrollRef.current;
    if (!scrollEl) return;

    const frame = window.requestAnimationFrame(() => {
      scrollEl.scrollTo({
        top: scrollEl.scrollHeight,
        behavior: 'smooth',
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [messages, isTyping]);

  useEffect(() => {
    setStage(conversationStageByTurn(turnCount));

    const progress = Math.min(turnCount / MAX_CHAT_TURNS, 1);
    setBlurLevel(Math.max(0, 30 - progress * 30));
  }, [turnCount]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || !chatSession.current || isTyping) return;

    setInput('');
    setCurrentSuggestions([]);
    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setIsTyping(true);

    try {
      const displayStream = createDisplayStream();
      const response = await chatSession.current.sendMessage(textToSend, {
        onTextChunk: (chunk) => {
          displayStream.push(chunk);
        },
      });

      collectVisualTags(response.visual_tags, collectedTagsRef.current);
      setTurnCount(response.current_turn || turnCount + 1);
      await displayStream.finish(response.text, response.audioBase64);
      setCurrentSuggestions(response.suggestions || []);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: language === 'zh'
            ? `这次对话没有成功返回：${error instanceof Error ? error.message : '未知错误'}`
            : `This chat response did not complete: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVisualize = async () => {
    setIsGenerating(true);
    try {
      const conversationSummary = messages.map((m) => `${m.sender}: ${m.text}`).join('\n').slice(-2000);
      const tagsArray: string[] = Array.from(collectedTagsRef.current);

      if (testMode || userData.isTestMode) {
        onComplete({
          imageUrl: '/test-assets/future-self.png',
          letter: testCopy.finalLetter,
          conversationSummary,
        });
        return;
      }

      const personaProfile = await generateUserPersonaProfile(userData, conversationSummary, language, promptSettings);
      const enrichedTags = [
        ...tagsArray,
        ...getPersonaVisualTags(personaProfile.future_persona?.visual_tags_en),
      ];

      const [letter, imageUrl] = await Promise.all([
        generateFinalLetter(userData.name, conversationSummary, language, promptSettings, personaProfile),
        generateFutureSelfPortrait(userData.name, enrichedTags, promptSettings, userData.photo, personaProfile),
      ]);

      onComplete({ imageUrl, letter, conversationSummary, personaProfile });
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: language === 'zh'
            ? `结果生成失败了。可能是网络、代理、接口配置或上游 AI 服务暂时不可用。错误信息：${error instanceof Error ? error.message : '未知错误'}`
            : `The result could not be generated. It may be a network, proxy, API configuration, or upstream AI service issue. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const getSunRingDash = () => {
    const totalCircumference = 2 * Math.PI * 48;
    const progress = Math.min(turnCount / MAX_CHAT_TURNS, 1);
    return `${progress * totalCircumference} ${totalCircumference}`;
  };

  const isReadyForPortrait = turnCount >= MAX_CHAT_TURNS;

  if (isGenerating) {
    return (
      <div className="flex h-[100dvh] min-h-[100svh] flex-col items-center justify-center space-y-8 bg-warmWhite animate-pulse-slow md:min-h-screen">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 bg-orange-200 rounded-full blur-3xl animate-pulse" />
          <div className="absolute inset-8 bg-white/90 rounded-full blur-xl" />
        </div>
        <div className="text-center space-y-2 z-10">
          <h2 className="font-serif text-3xl text-charcoal">{text.generating}</h2>
          <p className="font-sans text-stone-400 text-xs tracking-widest uppercase">{text.generatingSub}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-[100dvh] min-h-[100svh] w-full flex-col overflow-hidden transition-colors duration-1000 ease-in-out md:h-screen md:flex-row ${ambientGradientByStage[stage]}`}>
      <aside className="relative z-10 flex min-h-[180px] shrink-0 items-center justify-center border-b border-white/20 px-6 pb-5 pt-14 transition-all duration-700 sm:min-h-[220px] md:h-screen md:w-[40%] md:border-b-0 md:p-12">
        <div className="absolute top-0 left-0 w-full h-full opacity-50 transition-colors duration-1000 mix-blend-multiply pointer-events-none">
          <div className={`absolute left-4 top-6 h-40 w-40 rounded-full blur-[70px] animate-float sm:left-8 sm:top-8 sm:h-52 sm:w-52 md:left-10 md:top-10 md:h-64 md:w-64 md:blur-[80px] ${stage === 'anti-vision' ? 'bg-slate-200' : 'bg-orange-100'}`} />
          <div className={`absolute bottom-4 right-4 h-40 w-40 rounded-full blur-[70px] animate-pulse-slow sm:bottom-8 sm:right-8 sm:h-52 sm:w-52 md:bottom-10 md:right-10 md:h-64 md:w-64 md:blur-[80px] ${stage === 'anti-vision' ? 'bg-stone-200' : 'bg-purple-100'}`} />
        </div>

        <div className="relative h-[108px] w-[84px] transition-all duration-700 ease-out animate-breathe sm:h-[144px] sm:w-[110px] md:h-[420px] md:w-[320px]">
          <div className="absolute -inset-4 md:-inset-8 rotate-[-90deg]">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="none" stroke="#e7e5e4" strokeWidth="0.5" strokeDasharray="4 4" />
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke={stage === 'ideal' ? '#f59e0b' : '#fdba74'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={getSunRingDash()}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
          </div>

          <div className="w-full h-full rounded-t-[1000px] rounded-b-[200px] md:rounded-b-[20px] overflow-hidden shadow-2xl border-4 border-white relative bg-stone-200 z-10">
            {userData.photo ? (
              <img
                src={userData.photo}
                alt="Reflecting..."
                decoding="async"
                className="w-full h-full object-cover transition-all duration-1000 ease-linear"
                style={{
                  filter: `blur(${blurLevel}px) contrast(1.1)`,
                  transform: 'scale(1.1)',
                  objectPosition: userData.photo === TEST_PROFILE_SOURCE ? 'left center' : 'center',
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-stone-100 to-orange-100" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/10 mix-blend-overlay pointer-events-none" />
          </div>
        </div>

        <button
          onClick={onBack}
          className="absolute left-4 top-4 z-20 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-stone-400 transition-colors hover:text-charcoal md:left-10 md:top-10 md:text-xs md:tracking-widest"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden md:inline">{text.exit}</span>
        </button>
        {(testMode || userData.isTestMode) && (
          <div className="absolute bottom-4 left-4 z-20 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500 shadow-sm backdrop-blur md:bottom-10 md:left-10 md:px-4 md:py-2 md:text-xs md:tracking-[0.14em]">
            {text.testBadge}
          </div>
        )}
      </aside>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
        <div ref={messagesScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain no-scrollbar px-5 py-5 scroll-smooth sm:px-6 md:px-0 md:py-12">
          <div className="mx-auto max-w-2xl space-y-8 pb-8 md:space-y-16 md:pb-24">
            {messages.map((msg, idx) => {
              const isLast = idx === messages.length - 1;
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={`${msg.sender}-${idx}`}
                  className={`transition-opacity duration-700 ease-out ${!isLast && idx !== messages.length - 2 ? 'opacity-40 hover:opacity-80' : 'opacity-100'}`}
                >
                  {!isUser && (
                    <div className="relative animate-fade-in-up group">
                      <div className="absolute -left-8 top-1 text-orange-400 opacity-80 text-xl animate-pulse-slow hidden md:block">
                        ✴
                      </div>
                      <div className="font-serif text-xl leading-relaxed tracking-tight text-charcoal sm:text-2xl md:text-3xl">
                        {msg.text}
                      </div>
                    </div>
                  )}

                  {isUser && (
                    <div className="mt-5 flex justify-end animate-fade-in-up md:mt-8">
                      <div className="max-w-[92%] border-r-2 border-stone-200 pr-4 text-right font-sans text-base font-light leading-7 text-stone-600 sm:text-lg md:pr-6 md:text-xl md:leading-relaxed">
                        {msg.text}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 pl-2 font-serif text-base italic text-stone-400 animate-pulse md:text-lg">
                <span>{text.thinking}</span>
                <span className="text-orange-300">. . .</span>
              </div>
            )}
            <div className="h-4" />
          </div>
        </div>

        <div className={`sticky bottom-0 z-20 border-t border-white/35 bg-gradient-to-t px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 ${inputFadeByStage[stage]} to-transparent transition-colors duration-1000 backdrop-blur-md md:border-t-0 md:px-10 md:pb-10 md:pt-6`}>
          <div className="relative mx-auto max-w-3xl">
            {isReadyForPortrait && !isTyping ? (
              <div className="flex justify-center animate-fade-in-up">
                <button
                  onClick={handleVisualize}
                  className="group relative overflow-hidden rounded-full border border-white/80 bg-gradient-to-r from-amber-200 via-rose-200 to-violet-200 px-7 py-3.5 font-serif text-base italic text-charcoal shadow-[0_20px_50px_rgba(251,146,60,0.24)] ring-1 ring-amber-100/70 transition-all duration-500 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_24px_64px_rgba(196,181,253,0.34)] sm:px-10 sm:py-4 md:text-lg"
                >
                  <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="relative inline-flex items-center gap-3">
                    {text.visualize}
                    <span aria-hidden="true">→</span>
                  </span>
                </button>
              </div>
            ) : !isTyping && currentSuggestions.length > 0 && (
              <div className="mb-4 animate-fade-in-up md:mb-5">
                <div className="mb-3 text-center font-sans text-[11px] uppercase tracking-[0.22em] text-stone-400">
                  {text.choiceLead}
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {currentSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="min-h-[56px] rounded-xl border border-stone-200/80 bg-white/95 px-3 py-2.5 text-left font-sans text-[13px] leading-5 text-stone-700 shadow-[0_10px_24px_rgba(120,113,108,0.15)] ring-1 ring-white/80 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-white hover:text-charcoal hover:shadow-[0_18px_42px_rgba(251,146,60,0.20)] sm:min-h-[64px] sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base sm:leading-6"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isReadyForPortrait && (
              <div className="mx-auto flex max-w-2xl items-center rounded-[24px] border border-stone-200/50 bg-white/70 p-1.5 shadow-sm backdrop-blur-md transition-all focus-within:border-orange-200 focus-within:bg-white/90 focus-within:shadow-lg focus-within:shadow-orange-100/40 md:rounded-full">
                <input
                  type="text"
                  value={input}
                  disabled={isTyping}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  onFocus={() => {
                    window.setTimeout(() => {
                      messagesScrollRef.current?.scrollTo({
                        top: messagesScrollRef.current.scrollHeight,
                        behavior: 'smooth',
                      });
                    }, 250);
                  }}
                  placeholder={text.placeholder}
                  className="flex-1 border-none bg-transparent px-3 py-2 text-sm font-sans text-charcoal outline-none placeholder:text-stone-400 focus:ring-0 sm:px-4 md:text-base"
                />

                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="rounded-full bg-white p-2.5 text-stone-400 shadow-sm transition-all hover:text-charcoal hover:shadow-md disabled:opacity-40 disabled:shadow-none"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            <div className="mt-4 text-center font-sans text-[10px] uppercase tracking-[0.2em] text-stone-300">
              {text.footer}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatInterface;
