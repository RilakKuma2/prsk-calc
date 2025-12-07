import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import UpcomingEvents from './components/UpcomingEvents';
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';
import LanguageSwitcher from './components/common/LanguageSwitcher';

function AppContent() {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState('internal');
  const [surveyData, setSurveyData] = useState({});
  const [loadVersion, setLoadVersion] = useState(0);

  // Info Bubble State
  const [showInfo, setShowInfo] = useState(false);
  const [isInfoLocked, setIsInfoLocked] = useState(false);
  const infoRef = useRef(null);

  // Close Info Bubble when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isInfoLocked && infoRef.current && !infoRef.current.contains(event.target)) {
        setIsInfoLocked(false);
        setShowInfo(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isInfoLocked]);

  // Info Button Handlers
  const handleInfoEnter = () => {
    if (!isInfoLocked) setShowInfo(true);
  };

  const handleInfoLeave = () => {
    if (!isInfoLocked) setShowInfo(false);
  };

  const handleInfoClick = () => {
    if (isInfoLocked) {
      setIsInfoLocked(false);
      setShowInfo(false);
    } else {
      setIsInfoLocked(true);
      setShowInfo(true);
    }
  };

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
      <UpcomingEvents>
        <h1 className="text-3xl font-extrabold my-6">{t('app.title')}</h1>
      </UpcomingEvents>
      <Tabs currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {tabComponents[currentTab]}

      <div className="button-container relative">
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
          onClick={() => window.open('https://chart.rilaksekai.com/', '_blank')}
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

      {/* Info Button - Positioned in Bottom Right of Container */}
      <div className="absolute bottom-6 right-6 z-50" ref={infoRef}>
        <div className="relative">
          <button
            className={`p-2 rounded-full transition-colors duration-200 focus:outline-none ${isInfoLocked ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
            onMouseEnter={handleInfoEnter}
            onMouseLeave={handleInfoLeave}
            onClick={handleInfoClick}
            aria-label="Copyright Info"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>

          {/* Info Tooltip (Opens Upwards) */}
          {showInfo && (
            <div className="absolute bottom-full mb-2 right-0 w-72 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-100 text-sm text-gray-600 leading-relaxed z-[60] animate-fade-in text-left flex flex-col gap-3">
              {/* Contact Info */}
              <div className="flex items-center gap-2 text-gray-800 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <a href="mailto:rilak@rilaksekai.com" className="hover:text-indigo-600 transition-colors">rilak@rilaksekai.com</a>
              </div>

              {/* Reference Links */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-800 block mb-1.5 px-1">{t('app.references') || '참고'}</span>

                <a href="https://sekai.best/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-1.5 -mx-1 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-indigo-600 transition-colors group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-indigo-500">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <span className="text-xs font-medium border-b border-transparent group-hover:border-indigo-600">sekai.best</span>
                </a>

                <a href="https://github.com/Jiiku831/Jiiku831.github.io/tree/main" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-1.5 -mx-1 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-indigo-600 transition-colors group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 group-hover:text-indigo-500">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span className="text-xs font-medium border-b border-transparent group-hover:border-indigo-600 truncate">Jiiku831/Jiiku831.github.io</span>
                </a>

                <a href="https://github.com/xfl03/sekai-calculator" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-1.5 -mx-1 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-indigo-600 transition-colors group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 group-hover:text-indigo-500">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span className="text-xs font-medium border-b border-transparent group-hover:border-indigo-600 truncate">RilakKuma2/prsk-calc</span>
                </a>
              </div>

              {/* Source Code Link */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-800 block mb-1.5 px-1">{t('app.source_code') || '소스 코드'}</span>
                <a href="https://github.com/RilakKuma2/prsk-calc" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-1.5 -mx-1 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-indigo-600 transition-colors group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 group-hover:text-indigo-500">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span className="text-xs font-medium border-b border-transparent group-hover:border-indigo-600 truncate">RilakKuma2/prsk-calc</span>
                </a>
              </div>

              {/* Separator */}
              <div className="border-t border-gray-100"></div>

              {/* Disclaimer */}
              <div className="text-[10px] text-gray-400 text-justify leading-snug">
                {t('app.copyright') || "이 웹사이트는 자료를 소유하지 않습니다. 모든 권리는 Sega, Colorful Palette, Crypton을 포함한 자료들의 정당한 소유자에게 있습니다."}
              </div>
            </div>
          )}
        </div>
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
