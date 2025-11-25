import React, { useState, useEffect } from 'react';
import MySekaiTable from './MySekaiTable';
import { mySekaiTableData, powerColumnThresholds, scoreRowKeys } from '../data/mySekaiTableData';

const PowerTab = ({ surveyData, setSurveyData }) => {
  const [power, setPower] = useState(surveyData.power || '');
  const [effi, setEffi] = useState(surveyData.effi || '');
  const [showMySekaiTable, setShowMySekaiTable] = useState(false);

  const [multiEff, setMultiEff] = useState(0);
  const [soloEff, setSoloEff] = useState(0);
  const [autoEff, setAutoEff] = useState(0);
  const [mySekaiScore, setMySekaiScore] = useState('N/A');

  useEffect(() => {
    const newSurveyData = { ...surveyData, power, effi };
    setSurveyData(newSurveyData);

    const powerVal = parseFloat(power) || 0;
    const effiVal = parseInt(effi) || 0;

    const multiConstant = 4.877;
    const soloConstant = 2.8;
    const autoConstant = 1.84;

    const multiEfficiency =
      ((100 + (powerVal + 1) * multiConstant) /
        (100 + powerVal * multiConstant) -
        1) *
      (100 + effiVal);
    setMultiEff(multiEfficiency);

    const soloEfficiency =
      ((100 + (powerVal + 1) * soloConstant) /
        (100 + powerVal * soloConstant) -
        1) *
      (100 + effiVal);
    setSoloEff(soloEfficiency);

    const autoEfficiency =
      ((100 + (powerVal + 1) * autoConstant) /
        (100 + powerVal * autoConstant) -
        1) *
      (100 + effiVal);
    setAutoEff(autoEfficiency);

    let highestPossibleScore = "N/A";
    let columnIndex = -1;
    if (powerVal >= 0) {
      for (let j = powerColumnThresholds.length - 1; j >= 0; j--) {
        if (powerColumnThresholds[j] <= powerVal) {
          columnIndex = j;
          break;
        }
      }
    }

    if (columnIndex !== -1) {
      for (let i = scoreRowKeys.length - 1; i >= 0; i--) {
        const currentScoreRow = scoreRowKeys[i];
        const requiredEffiForThisScore =
          mySekaiTableData[currentScoreRow][columnIndex];
        if (
          requiredEffiForThisScore !== null &&
          effiVal >= requiredEffiForThisScore
        ) {
          highestPossibleScore = currentScoreRow;
          break;
        }
      }
    }
    setMySekaiScore(highestPossibleScore);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [power, effi]);

  return (
    <div>
      <div id="power-tab-content">
        <label htmlFor="power">종합력:</label>
        <input type="number" id="power" min="0" max="40" value={power} onChange={e => setPower(e.target.value)} />
        <span>만</span><br />

        <label htmlFor="effi">배수:</label>
        <input type="number" id="effi" min="0" max="1000" value={effi} onChange={e => setEffi(e.target.value)} />
        <span>%</span><br />

        <button
          className="action-button"
          style={{ marginTop: '10px', marginBottom: '10px' }}
          onClick={() => setShowMySekaiTable(!showMySekaiTable)}
        >
          마이세카이 테이블
        </button>
        {showMySekaiTable && <MySekaiTable />}


        <p id="multi-eff">멀티효율: <span style={{ fontWeight: "bold", color: "blue" }}>{multiEff.toFixed(2)}%</span></p>
        <p id="solo-eff">솔로효율: <span style={{ fontWeight: "bold", color: "blue" }}>{soloEff.toFixed(2)}%</span></p>
        <p id="auto-eff">오토효율: <span style={{ fontWeight: "bold", color: "blue" }}>{autoEff.toFixed(2)}%</span></p>
        <p id="my-sekai-score-display">마이세카이 불 당 이벤포: <span style={{ fontWeight: "bold", color: "green" }}>{mySekaiScore}</span></p>
        <p id="power-calculation-text"><br />종합력 1만과 같은 효율의 배수<br /><br />대략적인 값으로 곡이나 스킬에 따라 달라짐</p>
      </div>
    </div>
  );
};

export default PowerTab;
