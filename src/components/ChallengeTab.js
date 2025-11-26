import React, { useState } from 'react';
import ChallengeScoreTab from './ChallengeScoreTab';
import ChallengeStageTab from './ChallengeStageTab';

const ChallengeTab = ({ surveyData, setSurveyData }) => {
  const [activeSubTab, setActiveSubTab] = useState('score');

  return (
    <div>
      <div className="mini-tabs">
        <button
          className={`mini-tab ${activeSubTab === 'score' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('score')}
        >
          스코어
        </button>
        <button
          className={`mini-tab ${activeSubTab === 'stage' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('stage')}
        >
          스테이지
        </button>
      </div>

      {activeSubTab === 'score' && <ChallengeScoreTab surveyData={surveyData} setSurveyData={setSurveyData} />}
      {activeSubTab === 'stage' && <ChallengeStageTab surveyData={surveyData} setSurveyData={setSurveyData} />}
    </div>
  );
};

export default ChallengeTab;
