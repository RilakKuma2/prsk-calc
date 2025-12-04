import React, { useState, useEffect } from 'react';
import { InputTableWrapper, InputRow, SelectRow } from './common/InputComponents';
import { useTranslation } from '../contexts/LanguageContext';

const FireTab = ({ surveyData, setSurveyData }) => {
  const { t } = useTranslation();
  const [score1, setScore1] = useState(surveyData.score1 || '');
  const [score2, setScore2] = useState(surveyData.score2 || '');
  const [score3, setScore3] = useState(surveyData.score3 || '');
  const [rounds1, setRounds1] = useState(surveyData.rounds1 || '');
  const [firea, setFirea] = useState(surveyData.firea || '25');
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
      26: 6,
      27: 6,
      29: 7,
      28: 7,
      31: 8,
      29: 9,
      33: 9,
      30: 10,
      35: 10,
      31: 10,
    };
    // Correcting the table based on select options values
    // Options: 1, 5, 10, 15, 20, 25, 27, 29, 31, 33, 35
    // Labels: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    const fireaMap = {
      "1": 0,
      "5": 1,
      "10": 2,
      "15": 3,
      "20": 4,
      "25": 5,
      "27": 6,
      "29": 7,
      "31": 8,
      "33": 9,
      "35": 10
    };
    return fireaMap[firea] !== undefined ? fireaMap[firea] : 0;
  }

  useEffect(() => {
    const newSurveyData = { ...surveyData, score1, score2, score3, rounds1, firea, fires2 };
    setSurveyData(newSurveyData);

    let currentScore = parseFloat(score1 || '2500') || 0;
    let targetScore = parseFloat(score2 || '3000') || 0;
    let scorePerRound = parseFloat(score3 || '2.8') || 0;
    let roundsPerInterval = parseFloat(rounds1 || '28') || 0;
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
      <InputTableWrapper>
        <InputRow
          label={t('fire.current_score')}
          value={score1}
          onChange={e => setScore1(e.target.value)}
          suffix={t('fire.suffix_man')}
          min="0"
          max="50000"
          placeholder="2500"
          spacer={true}
        />
        <InputRow
          label={t('fire.target_score')}
          value={score2}
          onChange={e => setScore2(e.target.value)}
          suffix={t('fire.suffix_man')}
          min="0"
          max="50000"
          placeholder="3000"
          spacer={true}
        />
        <InputRow
          label={t('fire.score_per_round')}
          value={score3}
          onChange={e => setScore3(e.target.value)}
          suffix={t('fire.suffix_man')}
          min="0"
          max="50000"
          placeholder="2.8"
          spacer={true}
        />
        <InputRow
          label={t('fire.rounds_per_interval')}
          value={rounds1}
          onChange={e => setRounds1(e.target.value)}
          suffix={t('fire.rounds_suffix')}
          min="0"
          max="50000"
          placeholder="28"
          spacer={true}
        />
        <SelectRow
          label={t('fire.current_fire')}
          value={firea}
          onChange={e => setFirea(e.target.value)}
          options={[
            { value: "1", label: "0" },
            { value: "5", label: "1" },
            { value: "10", label: "2" },
            { value: "15", label: "3" },
            { value: "20", label: "4" },
            { value: "25", label: "5" },
            { value: "27", label: "6" },
            { value: "29", label: "7" },
            { value: "31", label: "8" },
            { value: "33", label: "9" },
            { value: "35", label: "10" },
          ]}
          spacer={true}
        />
        <SelectRow
          label={t('fire.change_fire')}
          value={fires2}
          onChange={e => setFires2(e.target.value)}
          options={[
            { value: "none", label: t('fire.no_change') },
            { value: "1", label: "0" },
            { value: "5", label: "1" },
            { value: "10", label: "2" },
            { value: "15", label: "3" },
            { value: "20", label: "4" },
            { value: "25", label: "5" },
            { value: "27", label: "6" },
            { value: "29", label: "7" },
            { value: "31", label: "8" },
            { value: "33", label: "9" },
            { value: "35", label: "10" },
          ]}
          spacer={true}
        />
      </InputTableWrapper>

      {/* Result Section - Amatsuyu Style */}
      <div className="w-[85%] max-w-[280px] mx-auto space-y-4">
        <div className="bg-white rounded-lg p-3">
          <div className="grid grid-cols-2 items-center mb-1 text-center">
            <span className="text-gray-600">{t('fire.needed_rounds')}</span>
            <span className="font-bold text-blue-600">{Math.ceil(neededRounds).toLocaleString()}{t('fire.rounds_suffix')}</span>
          </div>
          <div className="grid grid-cols-2 items-center mb-1 text-center">
            <span className="text-gray-600">{t('fire.needed_fire')}</span>
            <div>
              <span className="font-bold text-blue-600">{Math.ceil(neededFires).toLocaleString()}{t('fire.fire_suffix')}</span>
              <span className="text-xs text-gray-500 ml-1">({Math.ceil(neededFires / 10)} {t('fire.cans_suffix')})</span>
            </div>
          </div>
          <div className="grid grid-cols-2 items-center pt-1 border-t mt-1 text-center">
            <span className="text-gray-600">{t('fire.needed_time')}</span>
            <span className="font-bold text-blue-600">{neededTime.toFixed(1)}{t('fire.hours_suffix')}</span>
          </div>
        </div>

        <div className="text-sm text-gray-600 text-center space-y-2">
          <div>
            <span className="font-bold block mb-1">{t('fire.approx_rounds')}</span>
            <span className="text-xs">{t('fire.approx_desc')}</span>
          </div>
          <div className="pt-2">
            <a target="_blank" rel="noopener noreferrer" href="https://71ar.github.io/index/" className="text-blue-500 hover:underline font-bold">
              {t('fire.deck_power_calc')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FireTab;
