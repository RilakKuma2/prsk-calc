import React, { useState, useEffect } from 'react';
import { InputTableWrapper, InputRow, SelectRow } from './common/InputComponents';
import { expData } from '../data/expData';
import { useTranslation } from '../contexts/LanguageContext';

const CardLevelTab = ({ surveyData, setSurveyData }) => {
  const { t } = useTranslation();
  const [currentLevel, setCurrentLevel] = useState(surveyData.currentLevel || '');
  const [currentExp, setCurrentExp] = useState(surveyData.currentExp || '');
  const [targetLevel, setTargetLevel] = useState(surveyData.targetLevel || '');
  const [rank, setRank] = useState(surveyData.rank || '960');
  const [fires, setFires] = useState(surveyData.fires || '5');

  const [neededExp, setNeededExp] = useState(0);
  const [neededRounds, setNeededRounds] = useState(0);
  const [expPerRound, setExpPerRound] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const newSurveyData = { ...surveyData, currentLevel, currentExp, targetLevel, rank, fires };
    setSurveyData(newSurveyData);

    const currentLevelVal = parseInt(currentLevel || '13');
    const currentExpVal = parseInt(currentExp || '5332');
    const targetLevelVal = parseInt(targetLevel || '50');
    const rankVal = parseInt(rank);
    const firesVal = parseInt(fires);

    if (isNaN(currentLevelVal) || isNaN(currentExpVal) || isNaN(targetLevelVal) || isNaN(rankVal) || isNaN(firesVal)) {
      setErrorMessage(t('card_level.error_input'));
      setNeededExp(0);
      setNeededRounds(0);
      setExpPerRound(0);
      return;
    }

    if (currentLevelVal >= targetLevelVal) {
      setErrorMessage(t('card_level.error_target'));
      setNeededExp(0);
      setNeededRounds(0);
      setExpPerRound(0);
      return;
    }

    const currentData = expData.find((d) => d.LV === currentLevelVal);
    const nextLevelData = expData.find((d) => d.LV === currentLevelVal + 1);
    const targetData = expData.find((d) => d.LV === targetLevelVal);

    if (!currentData || !nextLevelData || !targetData) {
      setErrorMessage(t('card_level.error_data'));
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
  }, [currentLevel, currentExp, targetLevel, rank, fires, t]);

  return (

    <div id="card-level-tab" className="p-4 space-y-4">
      {/* Input Section */}
      <InputTableWrapper>
        <InputRow
          label={t('card_level.current_level')}
          value={currentLevel}
          onChange={e => setCurrentLevel(e.target.value)}
          placeholder="13"
          min="1"
          max="60"
        />
        <InputRow
          label={t('card_level.remaining_exp')}
          value={currentExp}
          onChange={e => setCurrentExp(e.target.value)}
          placeholder="5332"
          min="0"
        />
        <InputRow
          label={t('card_level.target_level')}
          value={targetLevel}
          onChange={e => setTargetLevel(e.target.value)}
          placeholder="50"
          min="2"
          max="60"
        />
        <SelectRow
          label={t('card_level.live_rank')}
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
          label={t('card_level.live_bonus')}
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
            <span className="text-gray-600">{t('card_level.needed_exp')}</span>
            <span className="font-bold text-blue-600">{neededExp.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 items-center mb-1 text-center">
            <span className="text-gray-600">{t('card_level.exp_per_round')}</span>
            <span className="font-bold text-blue-600">{expPerRound.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 items-center pt-1 border-t mt-1 text-center">
            <span className="text-gray-600">{t('card_level.needed_rounds')}</span>
            <span className="font-bold text-blue-600">{neededRounds.toLocaleString()}{t('card_level.suffix_round')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardLevelTab;
