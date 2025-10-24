import React, { useState } from 'react';
import KizunaTab from './KizunaTab';
import CardLevelTab from './CardLevelTab';

const LevelTab = ({ surveyData, setSurveyData }) => {
  const [activeSubTab, setActiveSubTab] = useState('kizuna');

  return (
    <div>
      <div className="mini-tabs">
        <button 
          className={`mini-tab ${activeSubTab === 'kizuna' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('kizuna')}
        >
          키즈나
        </button>
        <button 
          className={`mini-tab ${activeSubTab === 'card' ? 'active' : ''}`}
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
