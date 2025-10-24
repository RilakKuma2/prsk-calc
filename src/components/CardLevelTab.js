import React, { useState, useEffect } from 'react';
import { expData } from '../data/expData';

const CardLevelTab = ({ surveyData, setSurveyData }) => {
  const [currentLevel, setCurrentLevel] = useState(surveyData.currentLevel || '');
  const [currentExp, setCurrentExp] = useState(surveyData.currentExp || '');
  const [targetLevel, setTargetLevel] = useState(surveyData.targetLevel || '');
  const [rank, setRank] = useState(surveyData.rank || '960');
  const [fires, setFires] = useState(surveyData.fires || '1');

  const [neededExp, setNeededExp] = useState(0);
  const [neededRounds, setNeededRounds] = useState(0);
  const [expPerRound, setExpPerRound] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const newSurveyData = { ...surveyData, currentLevel, currentExp, targetLevel, rank, fires };
    setSurveyData(newSurveyData);

    const currentLevelVal = parseInt(currentLevel);
    const currentExpVal = parseInt(currentExp);
    const targetLevelVal = parseInt(targetLevel);
    const rankVal = parseInt(rank);
    const firesVal = parseInt(fires);

    if (isNaN(currentLevelVal) || isNaN(currentExpVal) || isNaN(targetLevelVal) || isNaN(rankVal) || isNaN(firesVal)) {
      setErrorMessage('에러: 모든 입력 값을 정확히 입력해 주세요.');
      setNeededExp(0);
      setNeededRounds(0);
      setExpPerRound(0);
      return;
    }

    if (currentLevelVal >= targetLevelVal) {
      setErrorMessage('에러: 목표 레벨은 현재 레벨보다 높아야 합니다.');
      setNeededExp(0);
      setNeededRounds(0);
      setExpPerRound(0);
      return;
    }

    const currentData = expData.find((d) => d.LV === currentLevelVal);
    const nextLevelData = expData.find((d) => d.LV === currentLevelVal + 1);
    const targetData = expData.find((d) => d.LV === targetLevelVal);

    if (!currentData || !nextLevelData || !targetData) {
        setErrorMessage('에러: 레벨 데이터를 불러오는 데 실패했습니다.');
        setNeededExp(0);
        setNeededRounds(0);
        setExpPerRound(0);
        return;
    }

    const currentCumulativeExp =
        currentData.누적EXP +
        nextLevelData.필요EXP -
        currentExpVal;
    const targetCumulativeExp = targetData.누적EXP;

    const needed = targetCumulativeExp - currentCumulativeExp;
    const perRound = rankVal * firesVal;
    const rounds = Math.ceil(needed / perRound);

    setNeededExp(needed);
    setExpPerRound(perRound);
    setNeededRounds(rounds);
    setErrorMessage('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel, currentExp, targetLevel, rank, fires]);

  return (
    <div id="card-level-tab">
      <label htmlFor="current-level">현재 레벨:</label>
      <input type="number" id="current-level" min="1" max="60" value={currentLevel} onChange={e => setCurrentLevel(e.target.value)} /><br />

      <label htmlFor="current-exp">남은 경험치:</label>
      <input type="number" id="current-exp" min="0" value={currentExp} onChange={e => setCurrentExp(e.target.value)} /><br />

      <label htmlFor="target-level">목표 레벨:</label>
      <input type="number" id="target-level" min="2" max="60" value={targetLevel} onChange={e => setTargetLevel(e.target.value)} /><br />

      <label htmlFor="rank">라이브 랭크:</label>
      <select id="rank" value={rank} onChange={e => setRank(e.target.value)}>
        <option value="960">S</option>
        <option value="840">A</option>
        <option value="720">B</option>
        <option value="600">C</option>
      </select><br />

      <label htmlFor="fires">라이브보너스:</label>
      <select id="fires" value={fires} onChange={e => setFires(e.target.value)}>
        <option value="1">0</option>
        <option value="5">1</option>
        <option value="10">2</option>
        <option value="15">3</option>
        <option value="20">4</option>
        <option value="25">5</option>
        <option value="26">6</option>
        <option value="27">7</option>
        <option value="28">8</option>
        <option value="29">9</option>
        <option value="30">10</option>
      </select>


      <p id="error-message">{errorMessage}</p>
      <p id="needed-exp">필요 경험치: <span style={{fontWeight: "bold", color: "blue"}}>{neededExp}</span></p>
      <p id="needed-rounds">필요 판수: <span style={{fontWeight: "bold", color: "blue"}}>{neededRounds}</span></p>
      <p id="exp-per-round">판 당 경험치 획득량: <span style={{fontWeight: "bold", color: "blue"}}>{expPerRound}</span></p>
    </div>
  );
};

export default CardLevelTab;
