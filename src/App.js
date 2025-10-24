import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Tabs from './components/Tabs';
import InternalTab from './components/InternalTab';
import LevelTab from './components/LevelTab';
import PowerTab from './components/PowerTab';
import FireTab from './components/FireTab';
import ChallengeTab from './components/ChallengeTab';
import AmatsuyuTab from './components/AmatsuyuTab';

function App() {
  const [currentTab, setCurrentTab] = useState('internal');
  const [surveyData, setSurveyData] = useState({});

  const tabComponents = {
    internal: <InternalTab surveyData={surveyData} setSurveyData={setSurveyData} />,
    level: <LevelTab surveyData={surveyData} setSurveyData={setSurveyData} />,
    power: <PowerTab surveyData={surveyData} setSurveyData={setSurveyData} />,
    fire: <FireTab surveyData={surveyData} setSurveyData={setSurveyData} />,
    challenge: <ChallengeTab surveyData={surveyData} setSurveyData={setSurveyData} />,
    amatsuyu: <AmatsuyuTab surveyData={surveyData} setSurveyData={setSurveyData} />,
  };

  const saveData = () => {
    localStorage.setItem('surveyData', JSON.stringify(surveyData));
    alert('데이터가 저장되었습니다.');
  };

  const loadData = useCallback(() => {
    const savedData = JSON.parse(localStorage.getItem('surveyData'));
    if (savedData) {
      setSurveyData(savedData);
    } else {
      alert('저장된 데이터가 없습니다.');
    }
  }, []);

  const toggleAutoLoad = (e) => {
    localStorage.setItem('autoLoad', e.target.checked);
  };

  useEffect(() => {
    const autoLoad = JSON.parse(localStorage.getItem('autoLoad'));
    if (autoLoad) {
      loadData();
    }
  }, [loadData]);

  return (
    <div className="container">
      <h1>프로세카 계산기</h1>
      <Tabs currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <div className="tab-content">
        {tabComponents[currentTab]}
      </div>

      <div className="button-container">
        <button className="action-button" onClick={saveData}>저장</button>
        <button className="action-button" onClick={loadData}>불러오기</button>
      </div>
      <div className="button-container">
        <label className="label">
          <input
            type="checkbox"
            id="auto-load-checkbox"
            onChange={toggleAutoLoad}
            defaultChecked={JSON.parse(localStorage.getItem('autoLoad'))}
          />
          자동 불러오기
        </label>
      </div>
      <div className="button-container">
        <button
          className="link-button"
          onClick={() => window.open('https://rilaksekai.com/', '_blank')}
        >
          프로세카 채보
        </button>
      </div>
      <div className="button-container">
        <button
          className="link-button"
          onClick={() => window.open('https://rilakkuma2.github.io/pickup/', '_blank')}
        >
          픽업 확률 계산기
        </button>
      </div>
    </div>
  );
}

export default App;
