import React, { useState } from 'react';
import ChallengeScoreTab from './ChallengeScoreTab';
import ChallengeStageTab from './ChallengeStageTab';
import { useTranslation } from '../contexts/LanguageContext';

const ChallengeTab = ({ surveyData, setSurveyData }) => {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState('score');

  return (
    <div>
      <div className="flex justify-center gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeSubTab === 'score' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setActiveSubTab('score')}
        >
          {t('challenge.score')}
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeSubTab === 'stage' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setActiveSubTab('stage')}
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
