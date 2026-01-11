import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KizunaTab from './KizunaTab';
import CardLevelTab from './CardLevelTab';
import { useTranslation } from '../contexts/LanguageContext';

const LevelTab = ({ surveyData, setSurveyData, subPath }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Determine active sub tab from subPath
  const getSubTabFromPath = () => {
    if (subPath === 'card') return 'card';
    return 'kizuna'; // default
  };

  const [activeSubTab, setActiveSubTab] = useState(getSubTabFromPath());

  // Sync with URL changes
  useEffect(() => {
    const newSubTab = getSubTabFromPath();
    if (newSubTab !== activeSubTab) {
      setActiveSubTab(newSubTab);
    }
  }, [subPath]);

  const handleSubTabChange = (subTab) => {
    setActiveSubTab(subTab);
    navigate(`/level/${subTab}`);
  };

  return (
    <div>
      <div className="flex justify-center gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeSubTab === 'kizuna' ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => handleSubTabChange('kizuna')}
        >
          {t('level.kizuna')}
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeSubTab === 'card' ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => handleSubTabChange('card')}
        >
          {t('level.card')}
        </button>
      </div>

      {activeSubTab === 'kizuna' && <KizunaTab surveyData={surveyData} setSurveyData={setSurveyData} />}
      {activeSubTab === 'card' && <CardLevelTab surveyData={surveyData} setSurveyData={setSurveyData} />}
    </div>
  );
};

export default LevelTab;

