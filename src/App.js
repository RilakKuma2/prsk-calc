import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Tabs from './components/Tabs';
import InternalTab from './components/InternalTab';
import LevelTab from './components/LevelTab';
import PowerTab from './components/PowerTab';
import FireTab from './components/FireTab';
import ChallengeTab from './components/ChallengeTab';
import AmatsuyuTab from './components/AmatsuyuTab';
import AutoTab from './components/AutoTab';
import ScoreArtTab from './components/ScoreArtTab';
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';
import LanguageSwitcher from './components/common/LanguageSwitcher';

function AppContent() {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState('internal');
  const [surveyData, setSurveyData] = useState({});
  const [loadVersion, setLoadVersion] = useState(0);

  const tabComponents = {
    internal: <InternalTab key={loadVersion} surveyData={surveyData} setSurveyData={setSurveyData} />,
    level: <LevelTab key={loadVersion} surveyData={surveyData} setSurveyData={setSurveyData} />,
    power: <PowerTab key={loadVersion} surveyData={surveyData} setSurveyData={setSurveyData} />,
    auto: <AutoTab key={loadVersion} surveyData={surveyData} setSurveyData={setSurveyData} />,
    fire: <FireTab key={loadVersion} surveyData={surveyData} setSurveyData={setSurveyData} />,
    challenge: <ChallengeTab key={loadVersion} surveyData={surveyData} setSurveyData={setSurveyData} />,
    amatsuyu: <AmatsuyuTab key={loadVersion} surveyData={surveyData} setSurveyData={setSurveyData} />,
    scoreArt: <ScoreArtTab key={loadVersion} surveyData={surveyData} setSurveyData={setSurveyData} />,
  };

  const [toast, setToast] = useState({ show: false, message: '', fadingOut: false });
  const timerRef1 = React.useRef(null);
  const timerRef2 = React.useRef(null);

  const showToastMessage = (message) => {
    if (timerRef1.current) clearTimeout(timerRef1.current);
    if (timerRef2.current) clearTimeout(timerRef2.current);

    setToast({ show: true, message, fadingOut: false });

    timerRef1.current = setTimeout(() => {
      setToast(prev => ({ ...prev, fadingOut: true }));
    }, 1000);

    timerRef2.current = setTimeout(() => {
      setToast({ show: false, message: '', fadingOut: false });
    }, 1500);
  };

  const saveData = () => {
    localStorage.setItem('surveyData', JSON.stringify(surveyData));
    showToastMessage(t('app.toast.saved'));
  };

  const loadData = useCallback(() => {
    const savedData = JSON.parse(localStorage.getItem('surveyData'));
    if (savedData) {
      setSurveyData(savedData);
      setLoadVersion(v => v + 1);
      showToastMessage(t('app.toast.loaded'));
    } else {
      showToastMessage(t('app.toast.no_data'));
    }
  }, [t]);

  const toggleAutoLoad = (e) => {
    localStorage.setItem('autoLoad', e.target.checked);
  };

  useEffect(() => {
    const autoLoad = JSON.parse(localStorage.getItem('autoLoad'));
    if (autoLoad) {
      loadData();
    }
  }, [loadData]);

  // Update page title and iOS app name based on language
  useEffect(() => {
    document.title = t('app.title');

    // Update iOS web app title
    const metaTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (metaTitle) {
      metaTitle.setAttribute('content', t('app.title'));
    }
  }, [t]);

  return (
    <div className="container relative min-h-screen">
      <LanguageSwitcher />
      <h1 className="text-3xl font-extrabold my-6">{t('app.title')}</h1>
      <Tabs currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {tabComponents[currentTab]}

      <div className="button-container">
        <button className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg shadow-md transition-all duration-200" onClick={saveData}>{t('app.save')}</button>
        <button className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg shadow-md transition-all duration-200" onClick={loadData}>{t('app.load')}</button>
      </div>
      <div className="button-container">
        <label className="label">
          <input
            type="checkbox"
            id="auto-load-checkbox"
            onChange={toggleAutoLoad}
            defaultChecked={JSON.parse(localStorage.getItem('autoLoad'))}
          />
          {t('app.auto_load')}
        </label>
      </div>
      <div className="button-container">
        <button
          className="link-button"
          onClick={() => window.open('https://rilaksekai.com/', '_blank')}
        >
          {t('app.chart_link')}
        </button>
      </div>
      <div className="button-container">
        <button
          className="link-button"
          onClick={() => window.open('https://rilakkuma2.github.io/pickup/', '_blank')}
        >
          {t('app.gacha_link')}
        </button>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg border border-gray-700 z-50 flex items-center gap-2 whitespace-nowrap ${toast.fadingOut ? 'animate-fade-out' : 'animate-toast-fade-in-up'}`}>
          <span className="text-green-400">✓</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
