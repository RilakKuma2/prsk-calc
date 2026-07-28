import React, { useState, useEffect, useMemo } from 'react';
import { InputTableWrapper, InputRow, SelectRow } from './common/InputComponents';
import CustomSelectDropdown from './common/CustomSelectDropdown';
import { kizunaData } from '../data/kizunaData';
import { useTranslation } from '../contexts/LanguageContext';
import playerLevelData from '../data/player_levels.json';
import {
  createKizunaPresets,
  getActiveKizunaPreset,
  KIZUNA_PRESETS,
  mirrorActiveKizunaPreset,
  selectKizunaPreset,
  updateActiveKizunaPreset,
} from '../utils/kizunaPresets';

const findPlayerLevelInfo = (level) => playerLevelData.find(d => {
  if (d.range === String(level)) return true;
  if (d.range.includes('~')) {
    const [min, max] = d.range.split('~').map(Number);
    return level >= min && level <= max;
  }
  return false;
});

const KizunaTab = ({ surveyData, setSurveyData }) => {
  const { t } = useTranslation();
  const presets = useMemo(
    () => createKizunaPresets(surveyData),
    [surveyData],
  );
  const activePreset = getActiveKizunaPreset(presets);

  useEffect(() => {
    if (surveyData.kizunaPresets) return;
    setSurveyData((previous) => {
      const initialPresets = createKizunaPresets(previous);
      return mirrorActiveKizunaPreset(previous, initialPresets);
    });
  }, [setSurveyData, surveyData.kizunaPresets]);

  const commitPresets = (transform) => {
    setSurveyData((previous) => {
      const currentPresets = createKizunaPresets(previous);
      const nextPresets = transform(currentPresets);
      return mirrorActiveKizunaPreset(previous, nextPresets);
    });
  };

  const setKizunaData = (updater) => {
    commitPresets((currentPresets) => (
      updateActiveKizunaPreset(currentPresets, updater)
    ));
  };

  const currentLevel = activePreset.kizunaCurrentLevel || '';
  const setCurrentLevel = (val) => setKizunaData(prev => ({ ...prev, kizunaCurrentLevel: typeof val === 'function' ? val(prev.kizunaCurrentLevel || '') : val }));
  const currentExp = activePreset.kizunaCurrentExp || '';
  const setCurrentExp = (val) => setKizunaData(prev => ({ ...prev, kizunaCurrentExp: typeof val === 'function' ? val(prev.kizunaCurrentExp || '') : val }));
  const targetLevel = activePreset.kizunaTargetLevel || '';
  const setTargetLevel = (val) => setKizunaData(prev => ({ ...prev, kizunaTargetLevel: typeof val === 'function' ? val(prev.kizunaTargetLevel || '') : val }));
  const rank = activePreset.kizunaRank || '150';
  const setRank = (val) => setKizunaData(prev => ({ ...prev, kizunaRank: typeof val === 'function' ? val(prev.kizunaRank || '150') : val }));
  const fires = activePreset.kizunaFires || '5';
  const setFires = (val) => setKizunaData(prev => ({ ...prev, kizunaFires: typeof val === 'function' ? val(prev.kizunaFires || '5') : val }));

  // 렙업불 관련 상태
  const levelUpEnabled = activePreset.kizunaLevelUpEnabled || false;
  const setLevelUpEnabled = (val) => setKizunaData(prev => ({ ...prev, kizunaLevelUpEnabled: typeof val === 'function' ? val(prev.kizunaLevelUpEnabled || false) : val }));
  const playerLevel = activePreset.kizunaPlayerLevel || '';
  const setPlayerLevel = (val) => setKizunaData(prev => ({ ...prev, kizunaPlayerLevel: typeof val === 'function' ? val(prev.kizunaPlayerLevel || '') : val }));
  const playerRemainingExp = activePreset.kizunaPlayerRemainingExp || '';
  const setPlayerRemainingExp = (val) => setKizunaData(prev => ({ ...prev, kizunaPlayerRemainingExp: typeof val === 'function' ? val(prev.kizunaPlayerRemainingExp || '') : val }));
  const playerLiveRank = activePreset.kizunaPlayerLiveRank || 'S';
  const setPlayerLiveRank = (val) => setKizunaData(prev => ({ ...prev, kizunaPlayerLiveRank: typeof val === 'function' ? val(prev.kizunaPlayerLiveRank || 'S') : val }));

  const [neededExp, setNeededExp] = useState(0);
  const [neededRounds, setNeededRounds] = useState(0);
  const [expPerRound, setExpPerRound] = useState(0);
  const [naturalFiresDays, setNaturalFiresDays] = useState(0);
  const [levelUpFire, setLevelUpFire] = useState(0);
  const [adjustedDays, setAdjustedDays] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const currentLevelVal = parseInt(currentLevel || '30');
    const currentExpVal = parseInt(currentExp || '159027');
    const targetLevelVal = parseInt(targetLevel || '125');
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

    // 기본 자연불 소요일 계산 (5불 기준)
    let baseNaturalFiresDays = 0;
    if (rankVal > 0) {
      baseNaturalFiresDays = Math.ceil(needed / rankVal / 5 / 58);
    }
    setNaturalFiresDays(baseNaturalFiresDays);

    // 렙업불 시뮬레이션 (토글이 활성화되어 있고 입력값이 있을 때만)
    let calculatedLevelUpFire = 0;
    let calculatedAdjustedDays = baseNaturalFiresDays;

    if (levelUpEnabled && playerLevel && playerRemainingExp && baseNaturalFiresDays > 0) {
      // 플레이어 랭크 별 XP
      let rankExpBonus = 1600; // S
      if (playerLiveRank === 'A') rankExpBonus = 1400;
      if (playerLiveRank === 'B') rankExpBonus = 1200;
      if (playerLiveRank === 'C') rankExpBonus = 1000;

      const fireConsumption = firesVal;

      // 반복적으로 보정일수 계산 (렙업불로 총 불이 증가하면 일수가 줄어들 수 있음)
      let prevAdjustedDays = baseNaturalFiresDays;
      for (let iteration = 0; iteration < 10; iteration++) {
        const totalNaturalFire = prevAdjustedDays * 58;

        let simFire = totalNaturalFire;
        let simLevel = parseInt(playerLevel);
        let simExp = parseInt(playerRemainingExp);
        let tempLevelUpFire = 0;

        let safeGuard = 0;
        const MAX_LOOPS = 5000;

        while (simFire >= fireConsumption && safeGuard < MAX_LOOPS) {
          safeGuard++;

          const xpPerRun = fireConsumption * rankExpBonus;
          if (xpPerRun === 0) break;

          const runsToLevel = Math.ceil(simExp / xpPerRun);
          const fireNeeded = runsToLevel * fireConsumption;

          if (simFire >= fireNeeded) {
            simFire -= fireNeeded;
            const xpGained = runsToLevel * xpPerRun;
            const overflow = xpGained - simExp;

            simLevel++;
            tempLevelUpFire += 10;
            simFire += 10;

            const levelData = findPlayerLevelInfo(simLevel);

            if (levelData && levelData.exp) {
              simExp = levelData.exp - overflow;
              if (simExp <= 0) simExp = 1;
            } else {
              simExp = 999999999;
            }
          } else {
            break;
          }
        }

        calculatedLevelUpFire = tempLevelUpFire;

        // 렙업불 포함 총 불로 보정 일수 재계산
        const totalFireWithLevelUp = needed / rankVal / 5; // 필요 불
        const dailyFireWithLevelUp = 58 + (tempLevelUpFire / prevAdjustedDays); // 하루 평균 불
        const newAdjustedDays = Math.ceil(totalFireWithLevelUp / dailyFireWithLevelUp);

        if (newAdjustedDays >= prevAdjustedDays || newAdjustedDays < 1) {
          calculatedAdjustedDays = prevAdjustedDays;
          break;
        }

        prevAdjustedDays = newAdjustedDays;
        calculatedAdjustedDays = newAdjustedDays;
      }
    }

    setLevelUpFire(calculatedLevelUpFire);
    setAdjustedDays(calculatedAdjustedDays);
    setErrorMessage('');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel, currentExp, targetLevel, rank, fires, levelUpEnabled, playerLevel, playerRemainingExp, playerLiveRank, t]);

  return (
    <div id="kizuna-level-tab" className="px-4 pb-4 pt-0 space-y-4">
      <div
        className="flex items-center justify-center gap-2"
        role="group"
        aria-label={t('kizuna.preset_label')}
      >
        {KIZUNA_PRESETS.map((preset, index) => (
          <button
            key={preset}
            type="button"
            onClick={() => commitPresets((currentPresets) => (
              selectKizunaPreset(currentPresets, preset)
            ))}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
              presets.currentPreset === preset
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-pressed={presets.currentPreset === preset}
          >
            {t('kizuna.preset', { count: index + 1 })}
          </button>
        ))}
      </div>

      {/* Input Section */}
      <InputTableWrapper>
        <InputRow
          label={t('kizuna.current_rank')}
          value={currentLevel}
          onChange={e => setCurrentLevel(e.target.value)}
          placeholder="30"
          min="1"
          max="125"
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
          placeholder="125"
          min="2"
          max="125"
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

      {/* Level Up Fire Toggle Section */}
      <div className="w-[85%] max-w-[260px] mx-auto mb-2">
        <button
          onClick={() => setLevelUpEnabled(!levelUpEnabled)}
          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${levelUpEnabled
              ? 'bg-indigo-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
            }`}
        >
          <span className={`transform transition-transform duration-300 ${levelUpEnabled ? 'rotate-180' : 'rotate-0'}`}>▼</span>
          {t('kizuna.levelup_fire_section')}
        </button>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${levelUpEnabled ? 'max-h-[200px] opacity-100 mt-2' : 'max-h-0 opacity-0'
          }`}>
          <div className="bg-indigo-50 rounded-xl p-2 border border-indigo-100 shadow-sm">
            <div className="grid grid-cols-3 gap-2">
              {/* Player Level */}
              <div className="flex flex-col items-center">
                <label className="text-[9px] text-gray-500 font-bold mb-0.5">{t('kizuna.player_level')}</label>
                <input
                  type="number"
                  value={playerLevel}
                  onChange={(e) => setPlayerLevel(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="300"
                  className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-1 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              {/* Remaining EXP */}
              <div className="flex flex-col items-center">
                <label className="text-[9px] text-gray-500 font-bold mb-0.5">{t('kizuna.player_remaining_exp')}</label>
                <input
                  type="number"
                  value={playerRemainingExp}
                  onChange={(e) => setPlayerRemainingExp(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="5000"
                  className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-1 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              {/* Live Rank */}
              <div className="flex flex-col items-center">
                <label className="text-[9px] text-gray-500 font-bold mb-0.5">{t('kizuna.player_live_rank')}</label>
                <CustomSelectDropdown
                  value={playerLiveRank}
                  onChange={setPlayerLiveRank}
                  ariaLabel={t('kizuna.player_live_rank')}
                  className="w-full"
                  buttonClassName="!h-[26px] !w-full !rounded-lg !border-gray-200 !bg-gray-50 !px-4 !text-xs !font-medium"
                  options={['S', 'A', 'B', 'C'].map(value => ({ value, label: value }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result Section */}
      <div className="w-full max-w-[280px] mx-auto space-y-4">
        {errorMessage && (
          <div className="text-red-500 font-bold text-center text-sm">{errorMessage}</div>
        )}

        <div className="bg-white rounded-lg p-3">
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

          {/* Level Up Fire Result - 토글 활성화 시에만 표시 */}
          {levelUpEnabled && levelUpFire > 0 && (
            <>
              <div className="grid grid-cols-2 items-center pt-1 border-t mt-1 text-center">
                <span className="text-gray-600">{t('kizuna.levelup_fire_bonus')}</span>
                <span className="font-bold text-indigo-600">+{levelUpFire}{t('kizuna.suffix_fire')}</span>
              </div>
              {adjustedDays < naturalFiresDays && (
                <div className="grid grid-cols-2 items-center text-center">
                  <span className="text-gray-600">{t('kizuna.adjusted_natural_days')}</span>
                  <span className="font-bold text-green-600">{adjustedDays}{t('kizuna.suffix_day')}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Natural Fire Note */}
        <p className="text-xs text-gray-400 mt-2 text-center whitespace-pre-wrap">
          {t('kizuna.natural_fire_note')}
        </p>
      </div>
    </div>
  );
};

export default KizunaTab;
