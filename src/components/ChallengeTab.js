import React, { useState, useEffect } from 'react';
import { challData } from '../data/challData';

const ChallengeTab = ({ surveyData, setSurveyData }) => {
  const [currentStage, setCurrentStage] = useState(surveyData.currentStage || '');
  const [remainingScore, setRemainingScore] = useState(surveyData.remainingScore || '');
  const [targetStage, setTargetStage] = useState(surveyData.targetStage || '');
  const [challengeScore, setChallengeScore] = useState(surveyData.challengeScore || '');
  const [pass, setPass] = useState(surveyData.pass || '1');

  const [result, setResult] = useState('');

  useEffect(() => {
    const newSurveyData = { ...surveyData, currentStage, remainingScore, targetStage, challengeScore, pass };
    setSurveyData(newSurveyData);

    const currentStageVal = parseInt(currentStage) || 0;
    let targetStageVal = targetStage;
    const challengeScoreVal = parseInt(challengeScore) || 0;
    const remainingScoreVal = parseInt(remainingScore) || 0;
    const passVal = parseInt(pass);

    if (!isNaN(targetStageVal) && parseInt(targetStageVal) > 150) {
      setTargetStage("EX");
      targetStageVal = "EX";
    }

    targetStageVal =
        targetStageVal === "EX" ? 151 : parseInt(targetStageVal) || 0;

    if (
        currentStageVal < 1 ||
        targetStageVal < 1 ||
        currentStageVal >= targetStageVal
    ) {
        setResult(`
<span style="font-weight: bold; color: red;">올바른 스테이지 값을 입력해주세요.</span><br><br>
<span style="font-weight: bold"><a target="_blank" rel="noopener noreferrer" href="https://3-3.dev/sekai/top-deck">챌라 이론덱</a></span><br>
<span style="font-weight: bold"><a target="_blank" rel="noopener noreferrer" href="https://m.dcinside.com/board/pjsekai/1893145">챌라 스킬 순서</a></span><br><br>
목표 스테이지 151 이상 입력 시 EX로 자동변환
`);
        return;
    }

    const currentCumulative = challData[currentStageVal].cumulative;
    const targetCumulative = challData[targetStageVal - 1].cumulative;

    const scorePerPlay =
        (Math.floor((challengeScoreVal * 24) / 10) +
            400 +
            Math.floor(challengeScoreVal / 20) * 2) /
        passVal;

    const neededScore = targetCumulative - currentCumulative + remainingScoreVal;

    const neededPlays = Math.ceil(neededScore / scorePerPlay);

    setResult(`
판당 점수: <span style="font-weight: bold; color: blue;">${scorePerPlay}</span><br><br>
필요 점수: <span style="font-weight: bold; color: blue;">${neededScore}</span><br><br>
남은 일수: <span style="font-weight: bold; color: blue;">${neededPlays}</span><br><br>
<span style="font-weight: bold"><a target="_blank" rel="noopener noreferrer" href="https://3-3.dev/sekai/top-deck">챌라 이론덱</a></span><br>
<span style="font-weight: bold"><a target="_blank" rel="noopener noreferrer" href="https://m.dcinside.com/board/pjsekai/1893145">챌라 스킬 순서</a></span><br><br>
목표 스테이지 151 이상 입력 시 EX로 자동변환
`);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStage, remainingScore, targetStage, challengeScore, pass]);

  return (
    <div id="challenge-tab-content">
      <label htmlFor="current-stage">현재 스테이지:</label>
      <input type="number" id="current-stage" min="1" value={currentStage} onChange={e => setCurrentStage(e.target.value)} /><br />

      <label htmlFor="remaining-score">남은 점수:</label>
      <input type="number" id="remaining-score" min="0" value={remainingScore} onChange={e => setRemainingScore(e.target.value)} /><br />

      <label htmlFor="target-stage">목표 스테이지:</label>
      <input type="text" id="target-stage" min="1" value={targetStage} onChange={e => setTargetStage(e.target.value)} /><br />

      <label htmlFor="challenge-score">챌라 점수:</label>
      <input type="number" id="challenge-score" min="0" max="300" value={challengeScore} onChange={e => setChallengeScore(e.target.value)} />
      <span>만</span><br />

      <label htmlFor="pass">컬패 여부:</label>
      <select id="pass" value={pass} onChange={e => setPass(e.target.value)}>
        <option value="1">Y</option>
        <option value="2">N</option>
      </select>


      <div id="challenge-calculation-text" dangerouslySetInnerHTML={{ __html: result }}></div>
    </div>
  );
};

export default ChallengeTab;
