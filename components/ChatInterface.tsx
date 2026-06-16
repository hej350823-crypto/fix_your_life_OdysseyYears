import React, { useEffect, useRef, useState } from 'react';
import {
  createChatSession,
  ChatSession,
  generateCurrentSelfPortrait,
  generateFinalLetter,
  generateFutureSelfPortrait,
  generateTimeCapsuleLetter,
  generateUserPersonaProfile,
} from '../services/geminiService';
import { t } from '../i18n';
import { ConversationStage, GenerationResult, Language, Message, PromptSettings, UserData } from '../types';

const MAX_CHAT_TURNS = 6;

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const text = t(language).chat;
  const testCopy = t(language).test;

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      chatSession.current = createChatSession(userData, promptSettings);
      setIsTyping(true);
      const welcomeData = await chatSession.current.sendMessage(`(System: User arrived. Name: ${userData.name}. Start Turn 1.)`);
      if (cancelled) return;

      setMessages([{ sender: 'ai', text: welcomeData.text, audioBase64: welcomeData.audioBase64 }]);
      setCurrentSuggestions(welcomeData.suggestions || []);
      collectVisualTags(welcomeData.visual_tags, collectedTagsRef.current);
      setTurnCount(welcomeData.current_turn || 1);
      setIsTyping(false);
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [userData, promptSettings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [messages, isTyping, currentSuggestions]);

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

    const response = await chatSession.current.sendMessage(textToSend);

    collectVisualTags(response.visual_tags, collectedTagsRef.current);
    setTurnCount(response.current_turn || turnCount + 1);
    setMessages((prev) => [...prev, { sender: 'ai', text: response.text, audioBase64: response.audioBase64 }]);
    setCurrentSuggestions(response.suggestions || []);
    setIsTyping(false);
  };

  const handleVisualize = async () => {
    setIsGenerating(true);
    try {
      const conversationSummary = messages.map((m) => `${m.sender}: ${m.text}`).join('\n').slice(-2000);
      const tagsArray: string[] = Array.from(collectedTagsRef.current);

      if (testMode || userData.isTestMode) {
        onComplete({
          imageUrl: '/test-assets/future-self.svg',
          timeCapsuleImageUrl: '/test-assets/current-self.svg',
          letter: testCopy.finalLetter,
          timeCapsuleLetter: testCopy.timeCapsuleLetter,
        });
        return;
      }

      const personaProfile = await generateUserPersonaProfile(userData, conversationSummary, language, promptSettings);
      const enrichedTags = [
        ...tagsArray,
        ...getPersonaVisualTags(personaProfile.future_persona?.visual_tags_en),
      ];

      const [letter, timeCapsuleLetter, imageUrl, timeCapsuleImageUrl] = await Promise.all([
        generateFinalLetter(userData.name, conversationSummary, language, promptSettings, personaProfile),
        generateTimeCapsuleLetter(userData.name, conversationSummary, language, promptSettings, personaProfile),
        generateFutureSelfPortrait(userData.name, enrichedTags, promptSettings, userData.photo, personaProfile),
        generateCurrentSelfPortrait(userData.name, personaProfile, promptSettings, userData.photo),
      ]);

      onComplete({ imageUrl, timeCapsuleImageUrl, letter, timeCapsuleLetter, personaProfile });
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: language === 'zh'
            ? `真实 AI 结果还没有生成成功：${error instanceof Error ? error.message : '未知错误'}。请先检查 VPN / 代理 / 网络出口，或打开测试模式体验完整流程。`
            : `The real AI result could not be generated yet: ${error instanceof Error ? error.message : 'Unknown error'}. Check VPN / proxy / network access first, or turn on test mode to try the full flow.`,
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
      <div className="h-screen bg-warmWhite flex flex-col items-center justify-center space-y-8 animate-pulse-slow">
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
    <div className={`h-screen w-full flex flex-col md:flex-row overflow-hidden transition-colors duration-1000 ease-in-out ${ambientGradientByStage[stage]}`}>
      <aside className="relative z-10 w-full md:w-[40%] h-[25vh] md:h-screen flex items-center justify-center p-6 md:p-12 transition-all duration-700 border-b md:border-b-0 border-white/20">
        <div className="absolute top-0 left-0 w-full h-full opacity-50 transition-colors duration-1000 mix-blend-multiply pointer-events-none">
          <div className={`absolute top-10 left-10 w-64 h-64 rounded-full blur-[80px] animate-float ${stage === 'anti-vision' ? 'bg-slate-200' : 'bg-orange-100'}`} />
          <div className={`absolute bottom-10 right-10 w-64 h-64 rounded-full blur-[80px] animate-pulse-slow ${stage === 'anti-vision' ? 'bg-stone-200' : 'bg-purple-100'}`} />
        </div>

        <div className="relative w-[100px] h-[130px] md:w-[320px] md:h-[420px] transition-all duration-700 ease-out animate-breathe">
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
                style={{ filter: `blur(${blurLevel}px) contrast(1.1)`, transform: 'scale(1.1)' }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-stone-100 to-orange-100" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/10 mix-blend-overlay pointer-events-none" />
          </div>
        </div>

        <button
          onClick={onBack}
          className="absolute top-4 left-4 md:top-10 md:left-10 text-stone-400 hover:text-charcoal transition-colors uppercase tracking-widest text-xs z-20 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden md:inline">{text.exit}</span>
        </button>
        {(testMode || userData.isTestMode) && (
          <div className="absolute bottom-4 left-4 md:bottom-10 md:left-10 z-20 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 shadow-sm backdrop-blur">
            {text.testBadge}
          </div>
        )}
      </aside>

      <main className="relative z-10 flex-1 h-[75vh] md:h-screen flex flex-col bg-transparent">
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 md:px-0 py-4 md:py-12 scroll-smooth">
          <div className="max-w-2xl mx-auto space-y-12 md:space-y-16 pb-72 md:pb-80">
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
                      <div className="font-serif text-2xl md:text-3xl text-charcoal leading-relaxed tracking-tight">
                        {msg.text}
                      </div>
                    </div>
                  )}

                  {isUser && (
                    <div className="mt-6 md:mt-8 flex justify-end animate-fade-in-up">
                      <div className="max-w-[90%] font-sans text-lg md:text-xl text-stone-600 font-light leading-relaxed text-right border-r-2 border-stone-200 pr-4 md:pr-6">
                        {msg.text}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-stone-400 font-serif italic text-lg animate-pulse pl-2">
                <span>{text.thinking}</span>
                <span className="text-orange-300">. . .</span>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        <div className={`absolute bottom-0 left-0 right-0 p-4 md:p-10 z-20 bg-gradient-to-t ${inputFadeByStage[stage]} to-transparent pointer-events-none transition-colors duration-1000`}>
          <div className="max-w-3xl mx-auto pointer-events-auto relative">
            {isReadyForPortrait && !isTyping ? (
              <div className="flex justify-center animate-fade-in-up">
                <button
                  onClick={handleVisualize}
                  className="group relative overflow-hidden rounded-full border border-white/80 bg-gradient-to-r from-amber-200 via-rose-200 to-violet-200 px-10 py-4 font-serif text-lg italic text-charcoal shadow-[0_20px_50px_rgba(251,146,60,0.24)] ring-1 ring-amber-100/70 transition-all duration-500 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_24px_64px_rgba(196,181,253,0.34)]"
                >
                  <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="relative inline-flex items-center gap-3">
                    {text.visualize}
                    <span aria-hidden="true">→</span>
                  </span>
                </button>
              </div>
            ) : !isTyping && currentSuggestions.length > 0 && (
              <div className="mb-5 animate-fade-in-up">
                <div className="mb-3 text-center font-sans text-[11px] uppercase tracking-[0.22em] text-stone-400">
                  {text.choiceLead}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {currentSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="min-h-[68px] rounded-2xl border border-stone-200/80 bg-white/95 px-5 py-4 text-left font-sans text-base leading-6 text-stone-700 shadow-[0_14px_34px_rgba(120,113,108,0.18)] ring-1 ring-white/80 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-white hover:text-charcoal hover:shadow-[0_18px_42px_rgba(251,146,60,0.20)]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isReadyForPortrait && (
              <div className="mx-auto flex max-w-2xl items-center rounded-full border border-stone-200/50 bg-white/58 p-1.5 shadow-sm backdrop-blur-md transition-all focus-within:bg-white/90 focus-within:shadow-lg focus-within:shadow-orange-100/40 focus-within:border-orange-200">
                <input
                  type="text"
                  value={input}
                  disabled={isTyping}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={text.placeholder}
                  className="flex-1 bg-transparent border-none px-4 py-2 text-sm text-charcoal placeholder:text-stone-400 focus:ring-0 md:text-base font-sans outline-none"
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

            <div className="text-center mt-4 text-[10px] uppercase tracking-[0.2em] text-stone-300 font-sans">
              {text.footer}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatInterface;
