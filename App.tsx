import React, { useEffect, useState } from 'react';
import { DEFAULT_PROMPT_SETTINGS, mergePromptSettings } from './config/promptSettings';
import { GenerationResult, Language, PromptSettings, UserData, ViewState } from './types';
import AdminPanel from './components/AdminPanel';
import AppControls from './components/AppControls';
import ChatInterface from './components/ChatInterface';
import CoreMechanic from './components/CoreMechanic';
import DeveloperLetter from './components/DeveloperLetter';
import FinalReveal from './components/FinalReveal';
import Footer from './components/Footer';
import Hero from './components/Hero';
import Onboarding from './components/Onboarding';
import PainPoint from './components/PainPoint';
import ResultDemo from './components/ResultDemo';
import TimeCapsule from './components/TimeCapsule';
import { t } from './i18n';

const PROMPT_SETTINGS_STORAGE_KEY = 'fix-your-life.prompt-settings.v3';
const ADMIN_SESSION_STORAGE_KEY = 'fix-your-life.admin-auth.v1';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.LANDING);
  const [language, setLanguage] = useState<Language>('zh');
  const [testMode, setTestMode] = useState(false);
  const [promptSettings, setPromptSettings] = useState<PromptSettings>(DEFAULT_PROMPT_SETTINGS as PromptSettings);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [onboardingInitialName, setOnboardingInitialName] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isAdminAuthLoading, setIsAdminAuthLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(PROMPT_SETTINGS_STORAGE_KEY);
    if (!saved) return;

    try {
      setPromptSettings(mergePromptSettings(JSON.parse(saved)) as PromptSettings);
    } catch (e) {
      console.warn('Prompt settings could not be restored.', e);
    }
  }, []);

  useEffect(() => {
    if (window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) === 'ok') {
      setIsAdminAuthenticated(true);
    }
  }, []);

  const toggleLanguage = () => {
    setLanguage((current) => (current === 'zh' ? 'en' : 'zh'));
  };

  const handleFooterStart = (name: string) => {
    setOnboardingInitialName(name.trim());
    setViewState(ViewState.ONBOARDING);
    window.scrollTo(0, 0);
  };

  const handleHeroStart = () => {
    setOnboardingInitialName('');
    setViewState(ViewState.ONBOARDING);
  };

  const handleOnboardingComplete = (data: UserData) => {
    setUserData({
      ...data,
      language,
      isTestMode: testMode || data.isTestMode,
    });
    setViewState(ViewState.CHAT);
  };

  const handleGenerationComplete = (res: GenerationResult) => {
    setResult(res);
    setViewState(ViewState.RESULT);
  };

  const savePromptSettings = (settings: PromptSettings) => {
    const merged = mergePromptSettings(settings) as PromptSettings;
    setPromptSettings(merged);
    window.localStorage.setItem(PROMPT_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
  };

  const resetPromptSettings = () => {
    setPromptSettings(DEFAULT_PROMPT_SETTINGS as PromptSettings);
    window.localStorage.removeItem(PROMPT_SETTINGS_STORAGE_KEY);
  };

  const openAdmin = () => {
    if (isAdminAuthenticated) {
      setViewState(ViewState.ADMIN);
      return;
    }

    setAdminPassword('');
    setAdminAuthError('');
    setIsAdminAuthOpen(true);
  };

  const closeAdminAuth = () => {
    setIsAdminAuthOpen(false);
    setAdminPassword('');
    setAdminAuthError('');
    setIsAdminAuthLoading(false);
  };

  const submitAdminPassword = async () => {
    if (!adminPassword.trim() || isAdminAuthLoading) return;

    setIsAdminAuthLoading(true);
    setAdminAuthError('');
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'admin-auth',
          password: adminPassword,
        }),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null) as { hint?: string | null; error?: string } | null;
        throw new Error(detail?.hint || detail?.error || (language === 'zh' ? '验证失败，请重试。' : 'Authentication failed. Please try again.'));
      }

      setIsAdminAuthenticated(true);
      window.sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, 'ok');
      setIsAdminAuthOpen(false);
      setAdminPassword('');
      setViewState(ViewState.ADMIN);
    } catch (e) {
      setAdminAuthError(e instanceof Error ? e.message : (language === 'zh' ? '验证失败，请重试。' : 'Authentication failed. Please try again.'));
    } finally {
      setIsAdminAuthLoading(false);
    }
  };

  const controls = (
    <AppControls
      language={language}
      testMode={testMode}
      onToggleLanguage={toggleLanguage}
      onToggleTestMode={() => setTestMode((value) => !value)}
      onOpenAdmin={openAdmin}
      onOpenLetter={() => setViewState(ViewState.LETTER)}
    />
  );

  if (viewState === ViewState.ADMIN && isAdminAuthenticated) {
    return (
      <AdminPanel
        language={language}
        promptSettings={promptSettings}
        onSave={savePromptSettings}
        onReset={resetPromptSettings}
        onBack={() => setViewState(ViewState.LANDING)}
      />
    );
  }

  if (viewState === ViewState.LETTER) {
    return (
      <DeveloperLetter
        language={language}
        onBack={() => setViewState(ViewState.LANDING)}
      />
    );
  }

  if (viewState === ViewState.RESULT && result && userData) {
    return (
      <FinalReveal
        result={result}
        userName={userData.name}
        language={language}
        onContinue={() => setViewState(ViewState.TIME_CAPSULE)}
        onRestart={() => setViewState(ViewState.LANDING)}
      />
    );
  }

  if (viewState === ViewState.TIME_CAPSULE && result && userData) {
    return (
      <TimeCapsule
        userName={userData.name}
        language={language}
        conversationSummary={result.conversationSummary}
        personaProfile={result.personaProfile}
        promptSettings={promptSettings}
        userPhoto={userData.photo}
        isTestMode={testMode || userData.isTestMode}
        onBack={() => setViewState(ViewState.RESULT)}
        onRestart={() => setViewState(ViewState.LANDING)}
      />
    );
  }

  if (viewState === ViewState.CHAT && userData) {
    return (
      <ChatInterface
        userData={userData}
        language={language}
        testMode={testMode}
        promptSettings={promptSettings}
        onBack={() => setViewState(ViewState.LANDING)}
        onComplete={handleGenerationComplete}
      />
    );
  }

  if (viewState === ViewState.ONBOARDING) {
    return (
      <>
        {controls}
        <Onboarding
          language={language}
          testMode={testMode}
          initialName={onboardingInitialName}
          onComplete={handleOnboardingComplete}
        />
      </>
    );
  }

  return (
    <div className="landing-background min-h-screen">
      {controls}
      <Hero language={language} setViewState={handleHeroStart} />
      <PainPoint language={language} />
      <CoreMechanic language={language} />
      <ResultDemo language={language} />
      <Footer language={language} onStart={handleFooterStart} onOpenLetter={() => setViewState(ViewState.LETTER)} />

      {isAdminAuthOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/28 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-7 shadow-[0_24px_80px_rgba(28,25,23,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
              {language === 'zh' ? 'Prompt Admin' : 'Prompt Admin'}
            </p>
            <h2 className="mt-3 font-serif text-3xl text-charcoal">
              {language === 'zh' ? '输入后台密码' : 'Enter Admin Password'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              {language === 'zh'
                ? '只有验证通过后，才能查看和修改提示词配置。'
                : 'Only verified access can view and edit prompt settings.'}
            </p>

            <label className="mt-6 block">
              <span className="block mb-3 text-xs uppercase tracking-[0.16em] text-stone-400">
                {language === 'zh' ? '密码' : 'Password'}
              </span>
              <input
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void submitAdminPassword();
                  }
                }}
                autoFocus
                className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-base text-charcoal outline-none transition focus:border-orange-200 focus:ring-4 focus:ring-orange-100"
              />
            </label>

            {adminAuthError && (
              <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {adminAuthError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeAdminAuth}
                className="rounded-full border border-stone-200 bg-white px-5 py-2 text-sm text-stone-600 hover:border-stone-300 hover:text-charcoal"
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => void submitAdminPassword()}
                disabled={!adminPassword.trim() || isAdminAuthLoading}
                className="rounded-full bg-charcoal px-5 py-2 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAdminAuthLoading
                  ? (language === 'zh' ? '验证中' : 'Verifying')
                  : (language === 'zh' ? '进入后台' : 'Unlock')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
