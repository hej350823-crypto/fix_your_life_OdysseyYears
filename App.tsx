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

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.LANDING);
  const [language, setLanguage] = useState<Language>('zh');
  const [testMode, setTestMode] = useState(false);
  const [promptSettings, setPromptSettings] = useState<PromptSettings>(DEFAULT_PROMPT_SETTINGS as PromptSettings);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [onboardingInitialName, setOnboardingInitialName] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem(PROMPT_SETTINGS_STORAGE_KEY);
    if (!saved) return;

    try {
      setPromptSettings(mergePromptSettings(JSON.parse(saved)) as PromptSettings);
    } catch (e) {
      console.warn('Prompt settings could not be restored.', e);
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

  const controls = (
    <AppControls
      language={language}
      testMode={testMode}
      onToggleLanguage={toggleLanguage}
      onToggleTestMode={() => setTestMode((value) => !value)}
      onOpenAdmin={() => setViewState(ViewState.ADMIN)}
      onOpenLetter={() => setViewState(ViewState.LETTER)}
    />
  );

  if (viewState === ViewState.ADMIN) {
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
    </div>
  );
};

export default App;
