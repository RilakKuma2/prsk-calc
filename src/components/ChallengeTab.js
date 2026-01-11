import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChallengeScoreTab from './ChallengeScoreTab';
import ChallengeStageTab from './ChallengeStageTab';
import { useTranslation } from '../contexts/LanguageContext';

const ChallengeTab = ({ surveyData, setSurveyData, subPath }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Determine active sub tab from subPath
  const getSubTabFromPath = () => {
    if (subPath === 'stage') return 'stage';
    return 'score'; // default
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
    navigate(`/chall/${subTab}`);
  };

  return (
    <div>
      <div className="flex justify-center gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeSubTab === 'score' ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => handleSubTabChange('score')}
        >
          {t('challenge.score')}
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeSubTab === 'stage' ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => handleSubTabChange('stage')}
        >
          {t('challenge.stage')}
        </button>
      </div>

      {activeSubTab === 'score' && <ChallengeScoreTab surveyData={surveyData} setSurveyData={setSurveyData} />}
      {activeSubTab === 'stage' && <ChallengeStageTab surveyData={surveyData} setSurveyData={setSurveyData} />}
    </div>
  );
};

export default ChallengeTab;

