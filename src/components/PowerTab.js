import React, { useState, useEffect, useRef } from 'react';
import MySekaiTable from './MySekaiTable';
import { mySekaiTableData, powerColumnThresholds, scoreRowKeys } from '../data/mySekaiTableData';
import { LiveCalculator, EventCalculator, LiveType, EventType } from 'sekai-calculator';
import musicMetas from '../data/music_metas.json';
import { SONG_OPTIONS } from '../utils/songs';
import { InputTableWrapper, InputRow, SelectRow } from './common/InputComponents';
import { calculateScoreRange } from '../utils/calculator';
import { useTranslation } from '../contexts/LanguageContext';

const FIRE_MULTIPLIERS = {
  0: 1,
  1: 5,
  2: 10,
  3: 15,
  4: 20,
  5: 25,
  6: 27,
  7: 29,
  8: 31,
  9: 33,
  10: 35
};

const PowerTab = ({ surveyData, setSurveyData }) => {
  const { t, language } = useTranslation();
  const [power, setPower] = useState(surveyData.power || '');
  const [effi, setEffi] = useState(surveyData.effi || '');
  const [internalValue, setInternalValue] = useState(surveyData.internalValue || '');
  const [showMySekaiTable, setShowMySekaiTable] = useState(false);

  // Comparison Mode State
  const [isComparisonMode, setIsComparisonMode] = useState(surveyData.isComparisonMode || false);
  const [powerB, setPowerB] = useState(surveyData.powerB || '');
  const [effiB, setEffiB] = useState(surveyData.effiB || '');
  const [internalValueB, setInternalValueB] = useState(surveyData.internalValueB || '');

  // Detailed Input State
  const [isDetailedInput, setIsDetailedInput] = useState(surveyData.isDetailedInput || false);
  const [detailedSkills, setDetailedSkills] = useState(surveyData.detailedSkills || {
    encore: '',
    member1: '',
    member2: '',
    member3: '',
    member4: ''
  });
  const [detailedSkillsB, setDetailedSkillsB] = useState(surveyData.detailedSkillsB || {
    encore: '',
    member1: '',
    member2: '',
    member3: '',
    member4: ''
  });

  // Fire Counts State
  const [fireCounts, setFireCounts] = useState(surveyData.fireCounts || {
    loAndFound: 5,
    envy: 5,
    omakase: 5,
    creationMyth: 1,
    mySekai: 1,
    custom: 5
  });

  const [multiEff, setMultiEff] = useState(0);
  const [soloEff, setSoloEff] = useState(0);
  const [autoEff, setAutoEff] = useState(0);
  const [mySekaiScore, setMySekaiScore] = useState('N/A');
  // Removed mySekaiEP state

  // Scores now hold objects { min, max }
  const [loAndFoundScore, setLoAndFoundScore] = useState({ min: 0, max: 0 });
  const [envyScore, setEnvyScore] = useState({ min: 0, max: 0 });
  const [creationMythScore, setCreationMythScore] = useState({ min: 0, max: 0 });
  const [omakaseScore, setOmakaseScore] = useState({ min: 0, max: 0 });
  const [customScore, setCustomScore] = useState({ min: 0, max: 0 });

  // Deck B Scores
  const [loAndFoundScoreB, setLoAndFoundScoreB] = useState({ min: 0, max: 0 });
  const [envyScoreB, setEnvyScoreB] = useState({ min: 0, max: 0 });
  const [creationMythScoreB, setCreationMythScoreB] = useState({ min: 0, max: 0 });
  const [omakaseScoreB, setOmakaseScoreB] = useState({ min: 0, max: 0 });
  const [mySekaiScoreB, setMySekaiScoreB] = useState('N/A');
  const [customScoreB, setCustomScoreB] = useState({ min: 0, max: 0 });

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [searchDifficulty, setSearchDifficulty] = useState('master');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchContainerRef = useRef(null);

  // Click Outside Effect for Search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search Effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const normalize = (str) => {
      if (!str) return '';
      return str.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[\u3041-\u3096]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));
    };

    const query = normalize(searchQuery);

    const results = SONG_OPTIONS.filter(song => {
      const name = normalize(song.name);
      const titleJp = normalize(song.title_jp);
      const titleEn = normalize(song.title_en);

      if (name.includes(query)) return true;

      if (language === 'ko') {
        if (titleJp && titleJp.includes(query)) return true;
        if (titleEn && titleEn.includes(query)) return true;
      } else if (language === 'ja') {
        if (titleJp && titleJp.includes(query)) return true;
      } else {
        if (titleEn && titleEn.includes(query)) return true;
      }

      return false;
    }).slice(0, 5);

    setSearchResults(results);
    setIsDropdownVisible(true);
  }, [searchQuery, language]);


  // Helper to get skills array based on input mode
  // Returns [Leader, M2, M3, M4, M5]
  const getSkillsArray = (isDetailed, skillsDetail, simpleVal) => {
    if (isDetailed) {
      return [
        parseFloat(skillsDetail.encore) || 0,
        parseFloat(skillsDetail.member1) || 0,
        parseFloat(skillsDetail.member2) || 0,
        parseFloat(skillsDetail.member3) || 0,
        parseFloat(skillsDetail.member4) || 0
      ];
    } else {
      const val = simpleVal === '' ? 200 : (parseFloat(simpleVal) || 0);
      return [val, val, val, val, val];
    }
  };

  const calculateAverage = (skillsDetail) => {
    const values = [
      parseFloat(skillsDetail.encore) || 0,
      parseFloat(skillsDetail.member1) || 0,
      parseFloat(skillsDetail.member2) || 0,
      parseFloat(skillsDetail.member3) || 0,
      parseFloat(skillsDetail.member4) || 0
    ];
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round((sum / 5) * 10) / 10;
  };

  const handleSelectSong = (song) => {
    setSelectedSong(song);
    setSearchQuery(language === 'ko' ? song.name : (language === 'ja' ? song.title_jp : song.name));
    setSearchResults([]);
    setIsDropdownVisible(false);
  };

  useEffect(() => {
    const newSurveyData = {
      ...surveyData,
      power,
      effi,
      internalValue,
      isComparisonMode,
      powerB,
      effiB,
      internalValueB,
      isDetailedInput,
      detailedSkills,
      detailedSkillsB,
      fireCounts
    };
    setSurveyData(newSurveyData);

    const inputsList = [
      {
        p: power, e: effi, i: internalValue, skills: detailedSkills,
        setLo: setLoAndFoundScore, setEn: setEnvyScore, setOm: setOmakaseScore, setCr: setCreationMythScore, setMs: setMySekaiScore, setCust: setCustomScore,
        calcEff: true
      }
    ];

    if (isComparisonMode) {
      inputsList.push({
        p: powerB, e: effiB, i: internalValueB, skills: detailedSkillsB,
        setLo: setLoAndFoundScoreB, setEn: setEnvyScoreB, setOm: setOmakaseScoreB, setCr: setCreationMythScoreB, setMs: setMySekaiScoreB, setCust: setCustomScoreB,
        calcEff: false
      });
    }

    inputsList.forEach(({ p, e, i, skills, setLo, setEn, setOm, setCr, setMs, setCust, calcEff }) => {
      const powerVal = parseFloat(p || '25.5');
      const effiVal = parseInt(e || '250', 10);
      const skillsArray = getSkillsArray(isDetailedInput, skills, i);

      // Helper functions for score calculation
      const getScoreRange = (pVal, skillsArr, songId, difficulty, liveType, fireCount) => {
        try {
          const input = {
            songId: songId,
            difficulty: difficulty,
            totalPower: pVal * 10000,
            skillLeader: skillsArr[0],
            skillMember2: skillsArr[1],
            skillMember3: skillsArr[2],
            skillMember4: skillsArr[3],
            skillMember5: skillsArr[4],
          };

          const result = calculateScoreRange(input, liveType);
          if (!result) return { min: 0, max: 0 };

          const musicMeta = musicMetas.find(m => m.music_id === songId && m.difficulty === difficulty);
          if (!musicMeta) return { min: 0, max: 0 };

          const multiplier = FIRE_MULTIPLIERS[fireCount] || 1;

          const minEP = EventCalculator.getEventPoint(
            liveType,
            EventType.MARATHON,
            result.min,
            musicMeta.event_rate,
            effiVal,
            multiplier
          );

          const maxEP = EventCalculator.getEventPoint(
            liveType,
            EventType.MARATHON,
            result.max,
            musicMeta.event_rate,
            effiVal,
            multiplier
          );

          return { min: minEP, max: maxEP };

        } catch (e) {
          console.error(e);
          return { min: 0, max: 0 };
        }
      };

      // 1. Lost and Found (ID 186, Hard, Multi)
      setLo(getScoreRange(powerVal, skillsArray, 226, 'hard', LiveType.MULTI, fireCounts.loAndFound));

      // 2. Envy (ID 74, Expert, Multi)
      setEn(getScoreRange(powerVal, skillsArray, 74, 'expert', LiveType.MULTI, fireCounts.envy));

      // 3. Omakase (ID 572, Master, Multi)
      setOm(getScoreRange(powerVal, skillsArray, 572, 'master', LiveType.MULTI, fireCounts.omakase));

      // 4. Creation Myth (ID 186, Master, Auto) - Fixed 100% skills
      setCr(getScoreRange(powerVal, [100, 100, 100, 100, 100], 186, 'master', LiveType.AUTO, fireCounts.creationMyth));

      // 5. Custom Song
      if (selectedSong) {
        setCust(getScoreRange(powerVal, skillsArray, selectedSong.id, searchDifficulty, LiveType.MULTI, fireCounts.custom || 5));
      } else {
        setCust({ min: 0, max: 0 });
      }

      if (calcEff) {
        // Calculate Efficiencies (Only for A)
        const loAndFoundPlus1 = getScoreRange(powerVal + 1, skillsArray, 186, 'hard', LiveType.MULTI, 5);
        const creationMythPlus1 = getScoreRange(powerVal + 1, [100, 100, 100, 100, 100], 186, 'master', LiveType.AUTO, 1);
        const appendPlus1 = getScoreRange(powerVal + 1, [100, 100, 100, 100, 100], 488, 'append', LiveType.SOLO, 1);

        const loAndFoundBase = getScoreRange(powerVal, skillsArray, 186, 'hard', LiveType.MULTI, 5);
        const creationMythBase = getScoreRange(powerVal, [100, 100, 100, 100, 100], 186, 'master', LiveType.AUTO, 1);
        const appendBase = getScoreRange(powerVal, [100, 100, 100, 100, 100], 488, 'append', LiveType.SOLO, 1);

        let newMultiEff = 0;
        if (loAndFoundBase.max > 0) {
          newMultiEff = (100 + effiVal) * (loAndFoundPlus1.max / loAndFoundBase.max - 1);
        }
        setMultiEff(newMultiEff);

        let newAutoEff = 0;
        if (creationMythBase.max > 0) {
          newAutoEff = (100 + effiVal) * (creationMythPlus1.max / creationMythBase.max - 1);
        }
        setAutoEff(newAutoEff);

        let newSoloEff = 0;
        if (appendBase.max > 0) {
          newSoloEff = (100 + effiVal) * (appendPlus1.max / appendBase.max - 1);
        }
        setSoloEff(newSoloEff);
      }

      // MySekai Score Logic
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
      setMs(highestPossibleScore);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [power, effi, internalValue, isDetailedInput, detailedSkills, detailedSkillsB, fireCounts, isComparisonMode, powerB, effiB, internalValueB, selectedSong, searchDifficulty]);

  const handleDetailedChange = (key, value) => {
    setDetailedSkills(prev => ({ ...prev, [key]: value }));
  };

  const handleDetailedChangeB = (key, value) => {
    setDetailedSkillsB(prev => ({ ...prev, [key]: value }));
  };

  const handleFireChange = (key, value) => {
    setFireCounts(prev => ({ ...prev, [key]: parseInt(value) }));
  };

  const formatScore = (scoreObj, forceSingle = false) => {
    if (scoreObj === 'N/A') return 'N/A';
    if (isDetailedInput && !forceSingle) {
      return `${scoreObj.min.toLocaleString()} ~ ${scoreObj.max.toLocaleString()}`;
    } else {
      return scoreObj.max.toLocaleString();
    }
  };

  const renderFireSelect = (key, minStart = 0) => {
    const options = [];
    for (let i = minStart; i <= 10; i++) {
      options.push(i);
    }
    return (
      <select
        value={fireCounts[key]}
        onChange={(e) => handleFireChange(key, e.target.value)}
        className="font-bold text-gray-700 text-center bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer hover:bg-gray-50 transition-colors block mx-auto translate-y-2"
        style={{
          padding: '4px 0px',
          fontSize: '14px',
          width: '60px',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          textAlign: 'center',
          textAlignLast: 'center',
        }}
      >
        {options.map(num => (
          <option key={num} value={num}>{num}</option>
        ))}
      </select>
    );
  };

  const checkboxElement = (
    <div style={{ marginBottom: '15px', marginTop: '-5px' }}>
      <label style={{ fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
        <input
          type="checkbox"
          checked={isDetailedInput}
          onChange={(e) => setIsDetailedInput(e.target.checked)}
          style={{ width: 'auto', margin: 0 }}
        />
        {t('power.detailed_input')}
      </label >
    </div >
  );

  const renderDetailedGrid = (skills, onChangeHandler, labelSuffix = "") => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center' }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>
          {t('power.encore')}
          {labelSuffix && <span className="text-[10px] text-gray-400 ml-1">{labelSuffix}</span>}
        </label>
        <input
          type="number"
          value={skills.encore}
          onChange={(e) => onChangeHandler('encore', e.target.value)}
          onFocus={(e) => e.target.select()}
          style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
        />
      </div>
      {['member1', 'member2', 'member3', 'member4'].map((memberKey, idx) => (
        <div key={memberKey}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>{t(`power.member_${idx + 1}`)}</label>
          <input
            type="number"
            value={skills[memberKey]}
            onChange={(e) => onChangeHandler(memberKey, e.target.value)}
            onFocus={(e) => e.target.select()}
            style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
          />
        </div>
      ))}
    </div>
  );

  const detailedGridElement = (
    <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      {isComparisonMode ? (
        <div className="flex gap-4">
          <div className="flex-1 border-r border-gray-200 pr-2">
            <div className="text-center mb-2 font-bold text-blue-500 text-xs">Deck A</div>
            {renderDetailedGrid(detailedSkills, handleDetailedChange)}
          </div>
          <div className="flex-1 pl-2">
            <div className="text-center mb-2 font-bold text-red-500 text-xs">Deck B</div>
            {renderDetailedGrid(detailedSkillsB, handleDetailedChangeB)}
          </div>
        </div>
      ) : (
        renderDetailedGrid(detailedSkills, handleDetailedChange)
      )}
    </div>
  );

  const descriptionElement = (
    <p style={{ fontSize: '12px', color: '#666', marginTop: '-10px', marginBottom: '10px', whiteSpace: 'pre-line' }}>
      {isDetailedInput
        ? t('power.desc_detailed')
        : t('power.desc_simple')
      }
    </p>
  );

  return (
    <div>
      <div id="power-tab-content">
        <InputTableWrapper>
          <InputRow
            label={t('power.total_power')}
            value={power}
            onChange={e => setPower(e.target.value)}
            suffix={t('power.suffix_man')}
            placeholder="25.5"
            max="45"
            comparisonMode={isComparisonMode}
            valueB={powerB}
            onChangeB={e => setPowerB(e.target.value)}
            showLabels={false}
            tabIndexA={1}
            tabIndexB={4}
          />
          <InputRow
            label={t('power.multiplier')}
            value={effi}
            onChange={e => setEffi(e.target.value)}
            suffix="%"
            placeholder="250"
            max="1000"
            comparisonMode={isComparisonMode}
            valueB={effiB}
            onChangeB={e => setEffiB(e.target.value)}
            showLabels={isDetailedInput}
            tabIndexA={2}
            tabIndexB={5}
          />
          {!isDetailedInput && (
            <InputRow
              label={t('power.internal_value')}
              value={internalValue}
              onChange={e => setInternalValue(e.target.value)}
              suffix="%"
              placeholder="200"
              max="2000"
              comparisonMode={isComparisonMode}
              valueB={internalValueB}
              onChangeB={e => setInternalValueB(e.target.value)}
              showLabels={true}
              tabIndexA={3}
              tabIndexB={6}
            />
          )}
        </InputTableWrapper>
        {isDetailedInput ? (
          <>
            {checkboxElement}
            {detailedGridElement}
            {descriptionElement}
          </>
        ) : (
          <>
            {checkboxElement}
            {descriptionElement}
          </>
        )}

        {/* Search Bar */}
        <div className={`transition-all duration-300 ${isSearchOpen ? 'max-h-40 opacity-100 mb-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div ref={searchContainerRef} className="bg-white rounded-xl shadow-sm border border-indigo-100 p-4 mx-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value) setSelectedSong(null);
                  }}
                  onFocus={() => setIsDropdownVisible(true)}
                  placeholder={t('challenge_score.song_name') || "곡 제목"}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
                {/* Autocomplete Dropdown */}
                {searchResults.length > 0 && isDropdownVisible && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 z-[100] max-h-60 overflow-y-auto">
                    {searchResults.map((song) => (
                      <div
                        key={song.id}
                        onClick={() => handleSelectSong(song)}
                        className="px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-gray-50 last:border-none flex justify-between items-center"
                      >
                        <span className="font-medium text-gray-700 truncate flex-1 min-w-0 mr-2">
                          {language === 'ko' ? song.name : (language === 'ja' ? song.title_jp : song.name)}
                        </span>
                        {language === 'ko' && (
                          <span className="text-xs text-gray-400">
                            {song.title_jp}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={searchDifficulty}
                onChange={(e) => setSearchDifficulty(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white font-medium text-gray-700"
              >
                <option value="easy">EASY</option>
                <option value="normal">NORMAL</option>
                <option value="hard">HARD</option>
                <option value="expert">EXPERT</option>
                <option value="master">MASTER</option>
                <option value="append">APPEND</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-center w-full mb-4 gap-2">
          {/* Search Toggle Button */}
          <button
            className={`px-4 py-2 font-bold rounded-lg shadow-md transition-all duration-200 border border-gray-200 flex items-center gap-1 ${isSearchOpen ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {t || "Search"}
          </button>

          {/* Comparison Mode Toggle */}
          <button
            className={`px-4 py-2 font-bold rounded-lg shadow-md transition-all duration-200 border border-gray-200 flex items-center gap-1 ${isComparisonMode ? 'bg-purple-500 text-white border-purple-600' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setIsComparisonMode(!isComparisonMode)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
              <line x1="10" y1="9" x2="10" y2="13"></line>
              <line x1="14" y1="9" x2="14" y2="13"></line>
            </svg>
            VS
          </button>

          <button
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-all duration-200"
            onClick={() => setShowMySekaiTable(!showMySekaiTable)}
          >
            {t('power.mysekai_table')}
          </button>
        </div>
        <div className={`overflow-hidden transition-all duration-200 ease-in-out ${showMySekaiTable ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <MySekaiTable />
        </div>

        <div className="w-full mt-4 mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-600 text-[10px] md:text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="px-1 py-1 md:px-4 md:py-2 font-bold text-center select-none" style={{ width: '25%' }}>{t('power.song')}</th>
                  <th className="px-1 py-1 md:px-4 md:py-2 font-bold text-center select-none">{t('power.fire')}</th>
                  {/* Result Header A */}
                  <th className={`px-1 py-1 md:px-4 md:py-2 font-extrabold text-center select-none text-sm md:text-base ${isComparisonMode ? 'text-blue-600' : ''}`}>
                    {isComparisonMode ? (
                      <div className="flex flex-col leading-tight">
                        <span>{power || '25.5'}{t('power.suffix_man')}/{effi || '250'}%</span>
                        <span className="text-[10px] md:text-xs text-blue-500 font-normal">
                          {t('power.internal_value')}:{isDetailedInput ? calculateAverage(detailedSkills) : (internalValue || '200')}%
                          {isDetailedInput && `(${t('power.average')})`}
                        </span>
                      </div>
                    ) : (
                      t('power.event_points')
                    )}
                  </th>
                  {isComparisonMode && (
                    <th className="px-1 py-1 md:px-4 md:py-2 font-extrabold text-center select-none text-red-500 text-xs md:text-base">
                      <div className="flex flex-col leading-tight">
                        <span>{powerB || '25.5'}{t('power.suffix_man')}/{effiB || '250'}%</span>
                        <span className="text-[10px] md:text-xs text-red-500 font-normal">
                          {t('power.internal_value')}:{isDetailedInput ? calculateAverage(detailedSkillsB) : (internalValueB || '200')}%
                          {isDetailedInput && `(${t('power.average')})`}
                        </span>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Custom Result Row */}
                {selectedSong && (
                  <tr className="hover:bg-indigo-50 transition-colors duration-200 group/row bg-indigo-50/30">
                    <td className="px-2 py-2 md:px-4 font-bold text-gray-800 text-[15px] md:text-base text-center align-middle relative">
                      <div className="flex flex-col items-center justify-center min-h-[40px]">
                        <span>{language === 'ko' ? selectedSong.name : selectedSong.title_jp}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide mt-1 ${searchDifficulty === 'master' || searchDifficulty === 'append' || searchDifficulty === 'expert' ? '' : 'bg-gray-100 text-gray-600 border border-gray-200 shadow-sm'
                            }`}
                          style={
                            searchDifficulty === 'master' ? { backgroundColor: '#cc33ff', color: '#FFFFFF' } :
                              searchDifficulty === 'append' ? { background: 'linear-gradient(to bottom right, #ad92fd, #fe7bde)', color: '#FFFFFF' } :
                                searchDifficulty === 'expert' ? { backgroundColor: '#ff4477', color: '#FFFFFF' } :
                                  searchDifficulty === 'hard' ? { border: '2px solid #ffcc00', backgroundColor: '#ffcc00', color: '#FFFFFF' } :
                                    searchDifficulty === 'normal' ? { border: '2px solid #33ccff', backgroundColor: '#33ccff', color: '#FFFFFF' } :
                                      searchDifficulty === 'easy' ? { border: '2px solid #13d675', backgroundColor: '#13d675', color: '#FFFFFF' } : {}
                          }
                        >
                          {searchDifficulty}
                        </span>
                      </div>
                      <button
                        onClick={() => { setSelectedSong(null); setSearchQuery(''); }}
                        className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                      {renderFireSelect('custom')}
                    </td>
                    <td className={`px-1 py-1 md:px-4 md:py-2 text-center align-middle ${isComparisonMode ? 'bg-blue-50/30' : ''}`}>
                      <span className="font-mono text-blue-600 text-base md:text-lg font-extrabold tracking-tight">
                        {formatScore(customScore)}
                      </span>
                    </td>
                    {isComparisonMode && (
                      <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle bg-red-50/30">
                        <span className="font-mono text-red-600 text-sm md:text-base font-bold tracking-tight">
                          {formatScore(customScoreB, true)}
                        </span>
                      </td>
                    )}
                  </tr>
                )}
                <tr className="hover:bg-gray-50 transition-colors duration-200 group/row">
                  <td className="px-1 py-1 md:px-4 md:py-2 font-bold text-gray-800 text-[15px] md:text-base text-center align-middle">
                    {t('power.songs.lost_and_found')}
                  </td>
                  <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                    {renderFireSelect('loAndFound')}
                  </td>
                  <td className={`px-1 py-1 md:px-4 md:py-2 text-center align-middle ${isComparisonMode ? 'bg-blue-50/30' : ''}`}>
                    <span className="font-mono text-blue-600 text-base md:text-lg font-extrabold tracking-tight">
                      {formatScore(loAndFoundScore)}
                    </span>
                  </td>
                  {isComparisonMode && (
                    <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle bg-red-50/30">
                      <span className="font-mono text-red-600 text-sm md:text-base font-bold tracking-tight">
                        {formatScore(loAndFoundScoreB, true)}
                      </span>
                    </td>
                  )}
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200 group/row">
                  <td className="px-1 py-1 md:px-4 md:py-2 font-bold text-gray-800 text-[15px] md:text-base text-center align-middle">
                    {t('power.songs.omakase')}
                  </td>
                  <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                    {renderFireSelect('omakase')}
                  </td>
                  <td className={`px-1 py-1 md:px-4 md:py-2 text-center align-middle ${isComparisonMode ? 'bg-blue-50/30' : ''}`}>
                    <span className="font-mono text-blue-600 text-base md:text-lg font-extrabold tracking-tight">
                      {formatScore(omakaseScore)}
                    </span>
                  </td>
                  {isComparisonMode && (
                    <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle bg-red-50/30">
                      <span className="font-mono text-red-600 text-sm md:text-base font-bold tracking-tight">
                        {formatScore(omakaseScoreB, true)}
                      </span>
                    </td>
                  )}
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200 group/row">
                  <td className="px-1 py-1 md:px-4 md:py-2 font-bold text-gray-800 text-[15px] md:text-base text-center align-middle">
                    {t('power.songs.envy')}
                  </td>
                  <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                    {renderFireSelect('envy')}
                  </td>
                  <td className={`px-1 py-1 md:px-4 md:py-2 text-center align-middle ${isComparisonMode ? 'bg-blue-50/30' : ''}`}>
                    <span className="font-mono text-blue-600 text-base md:text-lg font-extrabold tracking-tight">
                      {formatScore(envyScore)}
                    </span>
                  </td>
                  {isComparisonMode && (
                    <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle bg-red-50/30">
                      <span className="font-mono text-red-600 text-sm md:text-base font-bold tracking-tight">
                        {formatScore(envyScoreB, true)}
                      </span>
                    </td>
                  )}
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200 group/row">
                  <td className="px-4 py-3 font-bold text-gray-800 text-[15px] md:text-base text-center align-middle">
                    {t('power.songs.creation_myth')}
                  </td>
                  <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                    {renderFireSelect('creationMyth', 1)}
                  </td>
                  <td className={`px-1 py-1 md:px-4 md:py-2 text-center align-middle ${isComparisonMode ? 'bg-blue-50/30' : ''}`}>
                    <span className="font-mono text-blue-600 text-base md:text-lg font-extrabold tracking-tight">
                      {formatScore(creationMythScore, true)}
                    </span>
                  </td>
                  {isComparisonMode && (
                    <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle bg-red-50/30">
                      <span className="font-mono text-red-600 text-sm md:text-base font-bold tracking-tight">
                        {formatScore(creationMythScoreB, true)}
                      </span>
                    </td>
                  )}
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200 group/row">
                  <td className="px-1 py-1 md:px-4 md:py-2 font-bold text-gray-800 text-[15px] md:text-base text-center align-middle">
                    {t('power.songs.mysekai')}
                  </td>
                  <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                    <div className="flex justify-center items-center w-full h-full">
                      <span className="font-bold text-gray-700 text-center" style={{ fontSize: '14px', padding: '4px 0px', width: '60px', display: 'inline-block' }}>
                        1
                      </span>
                    </div>
                  </td>
                  <td className={`px-1 py-1 md:px-4 md:py-2 text-center align-middle ${isComparisonMode ? 'bg-blue-50/30' : ''}`}>
                    <span className="font-mono text-green-600 text-base md:text-lg font-extrabold tracking-tight">
                      {mySekaiScore > 0 ? mySekaiScore.toLocaleString() : 'N/A'}
                    </span>
                  </td>
                  {isComparisonMode && (
                    <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle bg-red-50/30">
                      <span className="font-mono text-green-600 text-sm md:text-base font-bold tracking-tight">
                        {mySekaiScoreB > 0 ? mySekaiScoreB.toLocaleString() : 'N/A'}
                      </span>
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>




        <br></br>
        <p id="multi-eff">{t('power.efficiency.multi')}: <span style={{ fontWeight: "bold", color: "blue" }}>{typeof multiEff === 'number' ? multiEff.toFixed(2) + '%' : multiEff}</span></p>
        <p id="solo-eff">{t('power.efficiency.solo')}: <span style={{ fontWeight: "bold", color: "blue" }}>{typeof soloEff === 'number' ? soloEff.toFixed(2) + '%' : soloEff}</span></p>
        <p id="auto-eff">{t('power.efficiency.auto')}: <span style={{ fontWeight: "bold", color: "blue" }}>{typeof autoEff === 'number' ? autoEff.toFixed(2) + '%' : autoEff}</span></p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '-10px', marginBottom: '10px', whiteSpace: 'pre-line' }}><br></br>{t('power.desc_bottom')}</p>
      </div>
    </div>
  );
};

export default PowerTab;
