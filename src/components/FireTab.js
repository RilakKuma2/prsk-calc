import React, { useState, useEffect } from 'react';

const FireTab = ({ surveyData, setSurveyData }) => {
  const [score1, setScore1] = useState(surveyData.score1 || '');
  const [score2, setScore2] = useState(surveyData.score2 || '');
  const [score3, setScore3] = useState(surveyData.score3 || '');
  const [rounds1, setRounds1] = useState(surveyData.rounds1 || '');
  const [firea, setFirea] = useState(surveyData.firea || '1');
  const [fires2, setFires2] = useState(surveyData.fires2 || 'none');

  const [neededRounds, setNeededRounds] = useState(0);
  const [neededFires, setNeededFires] = useState(0);
  const [neededTime, setNeededTime] = useState(0);

  const getFireaValue = (firea) => {
    const fireaTable = {
      1: 0,
      5: 1,
      10: 2,
      15: 3,
      20: 4,
      25: 5,
      27: 6,
      29: 7,
      31: 8,
      33: 9,
      35: 10,
    };
    return fireaTable[firea] || null;
  }

  useEffect(() => {
    const newSurveyData = { ...surveyData, score1, score2, score3, rounds1, firea, fires2 };
    setSurveyData(newSurveyData);

    let currentScore = parseFloat(score1) || 0;
    let targetScore = parseFloat(score2) || 0;
    let scorePerRound = parseFloat(score3) || 0;
    let roundsPerInterval = parseFloat(rounds1) || 0;
    let currentFireBonus = parseInt(firea) || 0;
    let changeFireBonus = fires2;
    let firenow = getFireaValue(currentFireBonus);

    let calculationScore;
    if (changeFireBonus === "none") {
      calculationScore = scorePerRound;
    } else {
      let newFireBonus = parseInt(changeFireBonus);
      calculationScore =
        (scorePerRound / currentFireBonus) * newFireBonus;
      currentFireBonus = newFireBonus;
      firenow = getFireaValue(currentFireBonus);
    }

    let rounds = (targetScore - currentScore) / calculationScore;
    rounds = rounds > 0 ? rounds : 0;
    rounds = Math.ceil(rounds);
    setNeededRounds(rounds);

    let fires = rounds * firenow;
    setNeededFires(fires);

    let time = rounds / roundsPerInterval;
    time = time > 0 ? time : 0;
    setNeededTime(time);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score1, score2, score3, rounds1, firea, fires2]);

  return (

    <div id="fire-tab-content" className="p-4 space-y-4">
      {/* Input Section */}
      <div>
        <label htmlFor="score1">현재점수:</label>
        <input type="number" id="score1" min="0" max="50000" value={score1} onChange={e => setScore1(e.target.value)} onFocus={(e) => e.target.select()} />
        <span>만</span><br />

        <label htmlFor="score2">목표점수:</label>
        <input type="number" id="score2" min="0" max="50000" value={score2} onChange={e => setScore2(e.target.value)} onFocus={(e) => e.target.select()} />
        <span>만</span><br />

        <label htmlFor="score3">판 당 점수:</label>
        <input type="number" id="score3" min="0" max="50000" value={score3} onChange={e => setScore3(e.target.value)} onFocus={(e) => e.target.select()} />
        <span>만</span><br />

        <label htmlFor="rounds1">간 당 판수:</label>
        <input type="number" id="rounds1" min="0" max="50000" value={rounds1} onChange={e => setRounds1(e.target.value)} onFocus={(e) => e.target.select()} />
        <span>회</span><br />

        <label htmlFor="firea">현재 라이브보너스:</label>
        <select id="firea" value={firea} onChange={e => setFirea(e.target.value)}>
          <option value="1">0</option>
          <option value="5">1</option>
          <option value="10">2</option>
          <option value="15">3</option>
          <option value="20">4</option>
          <option value="25">5</option>
          <option value="27">6</option>
          <option value="29">7</option>
          <option value="31">8</option>
          <option value="33">9</option>
          <option value="35">10</option>
        </select><br />
        <label htmlFor="fires2">라이브보너스 변경:</label>
        <select id="fires2" value={fires2} onChange={e => setFires2(e.target.value)}>
          <option value="none">변경없음</option>
          <option value="1">0</option>
          <option value="5">1</option>
          <option value="10">2</option>
          <option value="15">3</option>
          <option value="20">4</option>
          <option value="25">5</option>
          <option value="27">6</option>
          <option value="29">7</option>
          <option value="31">8</option>
          <option value="33">9</option>
          <option value="35">10</option>
        </select>
      </div>

      {/* Result Section - Amatsuyu Style */}
      <div className="w-[85%] max-w-[280px] mx-auto space-y-4">
        <div className="bg-white rounded-lg p-3">
          <div className="grid grid-cols-2 items-center mb-1 text-center">
            <span className="text-gray-600">필요 판수</span>
            <span className="font-bold text-blue-600">{Math.ceil(neededRounds).toLocaleString()}판</span>
          </div>
          <div className="grid grid-cols-2 items-center mb-1 text-center">
            <span className="text-gray-600">필요 불</span>
            <div>
              <span className="font-bold text-blue-600">{Math.ceil(neededFires).toLocaleString()}불</span>
              <span className="text-xs text-gray-500 ml-1">({Math.ceil(neededFires / 10)} 뚱캔)</span>
            </div>
          </div>
          <div className="grid grid-cols-2 items-center pt-1 border-t mt-1 text-center">
            <span className="text-gray-600">필요 시간</span>
            <span className="font-bold text-blue-600">{neededTime.toFixed(1)}시간</span>
          </div>
        </div>

        <div className="text-sm text-gray-600 text-center space-y-2">
          <div>
            <span className="font-bold block mb-1">대략적인 간 당 판수</span>
            <span className="text-xs">엔비:26~29 로앤파:17~19 치어풀:15~17</span>
          </div>
          <div className="pt-2">
            <a target="_blank" rel="noopener noreferrer" href="https://71ar.github.io/index/" className="text-blue-500 hover:underline font-bold">
              덱파워 예측 계산기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FireTab;
