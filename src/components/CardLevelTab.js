import React, { useState, useEffect } from 'react';
import { InputTableWrapper, InputRow, SelectRow } from './common/InputComponents';
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

    <div id="card-level-tab" className="p-4 space-y-4">
      {/* Input Section */}
      <InputTableWrapper>
        <InputRow
          label="현재 레벨"
          value={currentLevel}
          onChange={e => setCurrentLevel(e.target.value)}
          min="1"
          max="60"
        />
        <InputRow
          label="남은 경험치"
          value={currentExp}
          onChange={e => setCurrentExp(e.target.value)}
          min="0"
        />
        <InputRow
          label="목표 레벨"
          value={targetLevel}
          onChange={e => setTargetLevel(e.target.value)}
          min="2"
          max="60"
        />
        <SelectRow
          label="라이브 랭크"
          value={rank}
          onChange={e => setRank(e.target.value)}
          options={[
            { value: "960", label: "S" },
            { value: "840", label: "A" },
            { value: "720", label: "B" },
            { value: "600", label: "C" },
          ]}
        />
        <SelectRow
          label="라이브보너스"
          value={fires}
          onChange={e => setFires(e.target.value)}
          options={[
            { value: "1", label: "0" },
            { value: "5", label: "1" },
            { value: "10", label: "2" },
            { value: "15", label: "3" },
            { value: "20", label: "4" },
            { value: "25", label: "5" },
            { value: "26", label: "6" },
            { value: "27", label: "7" },
            { value: "28", label: "8" },
            { value: "29", label: "9" },
            { value: "30", label: "10" },
          ]}
        />
      </InputTableWrapper>

      {/* Result Section - Reverted Width, Rearranged Items */}
      <div className="w-full max-w-[280px] mx-auto space-y-4">
        {errorMessage && (
          <div className="text-red-500 font-bold text-center text-sm">{errorMessage}</div>
        )}

        <div className="bg-white rounded-lg  p-3">
          <div className="grid grid-cols-2 items-center mb-1 text-center">
            <span className="text-gray-600">필요 경험치</span>
            <span className="font-bold text-blue-600">{neededExp.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 items-center mb-1 text-center">
            <span className="text-gray-600">판 당 경험치</span>
            <span className="font-bold text-blue-600">{expPerRound.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 items-center pt-1 border-t mt-1 text-center">
            <span className="text-gray-600">필요 판수</span>
            <span className="font-bold text-blue-600">{neededRounds.toLocaleString()}판</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardLevelTab;
