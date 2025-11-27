import React, { useState } from 'react';
import KizunaTab from './KizunaTab';
import CardLevelTab from './CardLevelTab';

const LevelTab = ({ surveyData, setSurveyData }) => {
  const [activeSubTab, setActiveSubTab] = useState('kizuna');

  return (
    <div>
      <div className="flex justify-center gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeSubTab === 'kizuna' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setActiveSubTab('kizuna')}
        >
          키즈나
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeSubTab === 'card' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setActiveSubTab('card')}
        >
          카드
        </button>
      </div>

      {activeSubTab === 'kizuna' && <KizunaTab surveyData={surveyData} setSurveyData={setSurveyData} />}
      {activeSubTab === 'card' && <CardLevelTab surveyData={surveyData} setSurveyData={setSurveyData} />}
    </div>
  );
};

export default LevelTab;
