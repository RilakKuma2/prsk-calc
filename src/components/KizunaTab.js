import React, { useState, useEffect } from 'react';
import { InputTableWrapper, InputRow, SelectRow } from './common/InputComponents';
import { kizunaData } from '../data/kizunaData';
import { useTranslation } from '../contexts/LanguageContext';

const KizunaTab = ({ surveyData, setSurveyData }) => {
  const { t } = useTranslation();
  const [currentLevel, setCurrentLevel] = useState(surveyData.kizunaCurrentLevel || '');
  const [currentExp, setCurrentExp] = useState(surveyData.kizunaCurrentExp || '');
  const [targetLevel, setTargetLevel] = useState(surveyData.kizunaTargetLevel || '');
  const [rank, setRank] = useState(surveyData.kizunaRank || '150');
  const [fires, setFires] = useState(surveyData.kizunaFires || '5');

  const [neededExp, setNeededExp] = useState(0);
  const [neededRounds, setNeededRounds] = useState(0);
  const [expPerRound, setExpPerRound] = useState(0);
  const [naturalFiresDays, setNaturalFiresDays] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const newSurveyData = { ...surveyData, kizunaCurrentLevel: currentLevel, kizunaCurrentExp: currentExp, kizunaTargetLevel: targetLevel, kizunaRank: rank, kizunaFires: fires };
    setSurveyData(newSurveyData);

    const currentLevelVal = parseInt(currentLevel || '30');
    const currentExpVal = parseInt(currentExp || '159027');
    const targetLevelVal = parseInt(targetLevel || '75');
    const rankVal = parseInt(rank);
    const firesVal = parseInt(fires);

    if (isNaN(currentLevelVal) || isNaN(currentExpVal) || isNaN(targetLevelVal) || isNaN(rankVal) || isNaN(firesVal)) {
      setErrorMessage(t('kizuna.error_input'));
      setNeededExp(0);
      setNeededRounds(0);
      setExpPerRound(0);
      return;
    }

    if (currentLevelVal >= targetLevelVal) {
      setErrorMessage(t('kizuna.error_target'));
      setNeededExp(0);
      setNeededRounds(0);
      setExpPerRound(0);
      return;
    }

    const currentData = kizunaData.find((d) => d.LV === currentLevelVal);
    const nextLevelData = kizunaData.find((d) => d.LV === currentLevelVal + 1);
    const targetData = kizunaData.find((d) => d.LV === targetLevelVal);

    if (!currentData || !nextLevelData || !targetData) {
      setErrorMessage(t('kizuna.error_data'));
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

    // Calculate Natural Fires Days
    let naturalFiresDaysCalc = 0;
    if (rankVal > 0) {
      naturalFiresDaysCalc = Math.ceil(needed / rankVal / 5 / 58);
    }
    setNaturalFiresDays(naturalFiresDaysCalc);

    setErrorMessage('');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel, currentExp, targetLevel, rank, fires, t]);

  return (
    <div id="kizuna-level-tab" className="p-4 space-y-4">
      {/* Input Section */}
      <InputTableWrapper>
        <InputRow
          label={t('kizuna.current_rank')}
          value={currentLevel}
          onChange={e => setCurrentLevel(e.target.value)}
          placeholder="30"
          min="1"
          max="75"
        />
        <InputRow
          label={t('kizuna.remaining_exp')}
          value={currentExp}
          onChange={e => setCurrentExp(e.target.value)}
          placeholder="159027"
          min="0"
        />
        <InputRow
          label={t('kizuna.target_rank')}
          value={targetLevel}
          onChange={e => setTargetLevel(e.target.value)}
          placeholder="75"
          min="2"
          max="75"
        />
        <SelectRow
          label={t('kizuna.live_rank')}
          value={rank}
          onChange={e => setRank(e.target.value)}
          options={[
            { value: "150", label: "S" },
            { value: "130", label: "A" },
            { value: "110", label: "B" },
            { value: "100", label: "C" },
          ]}
        />
        <SelectRow
          label={t('kizuna.live_bonus')}
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
            <span className="text-gray-600">{t('kizuna.needed_exp')}</span>
            <span className="font-bold text-blue-600">{neededExp.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 items-center mb-1 text-center">
            <span className="text-gray-600">{t('kizuna.exp_per_round')}</span>
            <span className="font-bold text-blue-600">{expPerRound.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 items-center pt-1 border-t mt-1 text-center">

            <span className="text-gray-600">{t('kizuna.needed_rounds')}</span>
            <span className="font-bold text-blue-600">{neededRounds.toLocaleString()}{t('kizuna.suffix_round')}</span>
          </div>
          <div className="grid grid-cols-2 items-center mb-1 text-center">
            <span className="text-gray-600">{t('kizuna.natural_fire_days')}</span>
            <span className="font-bold text-blue-600">{naturalFiresDays}{t('kizuna.suffix_day')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KizunaTab;
