import React, { useState, useEffect, useRef } from 'react';
import { InputTableWrapper, InputRow, SelectRow } from './common/InputComponents';
import { useTranslation } from '../contexts/LanguageContext';
import { calculateScoreRange } from '../utils/calculator';
import { EventCalculator, LiveType, EventType } from 'sekai-calculator';
import musicMetas from '../data/music_metas.json';
import { mySekaiTableData, powerColumnThresholds, scoreRowKeys } from '../data/mySekaiTableData';

const FireTab = ({ surveyData, setSurveyData }) => {
  const { t, language } = useTranslation();
  const [score1, setScore1] = useState(surveyData.score1 || '');
  const [score2, setScore2] = useState(surveyData.score2 || '');
  const [score3, setScore3] = useState(surveyData.score3 || '');
  const [rounds1, setRounds1] = useState(surveyData.rounds1 || '');
  const [firea, setFirea] = useState(surveyData.firea || "25");
  const [fires2, setFires2] = useState(surveyData.fires2 || "none");

  const [neededRounds, setNeededRounds] = useState(0);
  const [neededFires, setNeededFires] = useState(0);
  const [neededTime, setNeededTime] = useState(0);

  const [predictionData, setPredictionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [eventInfo, setEventInfo] = useState(null);
  const [showTop50, setShowTop50] = useState(false);
  const [isRoomSearchOpen, setIsRoomSearchOpen] = useState(false);
  const [searchEngine, setSearchEngine] = useState(() => localStorage.getItem('roomSearchEngine') || 'yahoo');
  const [predictionOpen, setPredictionOpen] = useState(false);
  const [currentNaturalFire, setCurrentNaturalFire] = useState(surveyData.currentNaturalFire || '');
  const [challengeScore, setChallengeScore] = useState(surveyData.challengeScore || ''); // Default empty, used as 250 if empty
  const [worldPass, setWorldPass] = useState(surveyData.worldPass || false);
  const [mySekaiScore, setMySekaiScore] = useState(surveyData.mySekaiScore || ''); // Default empty, used as 2500 if empty
  const [importMenuOpen, setImportMenuOpen] = useState(false);

  // ... (existing code)

  const importMySekaiForPrediction = () => {
    if (!surveyData) return;

    // My Sekai Logic from handleImport, but returning raw score
    const powerVal = parseFloat(surveyData.power || '25.5');
    const effiVal = parseInt(surveyData.effi || '250', 10);

    let highestPossibleScore = null;
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
        const requiredEffiForThisScore = mySekaiTableData[currentScoreRow][columnIndex];
        if (requiredEffiForThisScore !== null && effiVal >= requiredEffiForThisScore) {
          highestPossibleScore = currentScoreRow; // e.g., "2,500" or "25,000"
          break;
        }
      }
    }

    if (highestPossibleScore) {
      const scoreStr = String(highestPossibleScore);
      const rawScore = scoreStr.replace(/,/g, '');
      setMySekaiScore(rawScore);
    }
  };
  const dropdownRef = useRef(null);
  const importMenuRef = useRef(null);

  // Persist Search Engine Preference
  useEffect(() => {
    localStorage.setItem('roomSearchEngine', searchEngine);
  }, [searchEngine]);

  // Click Outside Effect for Room Search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRoomSearchOpen(false);
      }
      if (importMenuRef.current && !importMenuRef.current.contains(event.target)) {
        setImportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  useEffect(() => {
    const fetchPredictionData = async () => {

      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/ranking`);
        const data = await response.json();

        if (data.data) {
          const processedData = data.data.map(item => ({
            rank: item.rank,
            currentScore: item.current,
            predictedScore: item.predicted
          }));
          setPredictionData(processedData);
          setLastUpdated(data.updatedAt);
          // Set event info if available (added from rank.py)
          if (data.event_info) {
            setEventInfo(data.event_info);
          }
          const now = Date.now();
          const diff = data.endsAt - now;
          setTimeRemaining(diff > 0 ? diff : 0);
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch prediction data:", error);
        setLoading(false);
      }
    };

    fetchPredictionData();
  }, []);

  const formatTime = (ms) => {
    if (!ms) return "-";
    const date = new Date(ms);
    return date.toLocaleString('ko-KR', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
    });
  };

  const formatDuration = (ms) => {
    if (!ms || ms <= 0) return "종료됨";
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    return `${days}일 ${hours}시간 ${minutes}분`;
  };

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
      28: 7,
      29: 7,
      30: 8,
      31: 9,
      32: 9,
      33: 10,
      34: 10,
      35: 10,
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
    const newSurveyData = {
      ...surveyData,
      score1, score2, score3, rounds1, firea, fires2,
      currentNaturalFire, challengeScore, worldPass, mySekaiScore
    };
    setSurveyData(newSurveyData);

    let currentScore = parseFloat(score1 || '217') || 0;
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
  }, [score1, score2, score3, rounds1, firea, fires2, currentNaturalFire, challengeScore, worldPass, mySekaiScore]);

  // Tooltip State
  const [tooltipHover, setTooltipHover] = useState(false);
  const [tooltipLock, setTooltipLock] = useState(false);
  const tooltipRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setTooltipLock(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isTooltipVisible = tooltipHover || tooltipLock;

  // Rank Interaction State
  const [activeRank, setActiveRank] = useState(null);
  const tableRef = React.useRef(null);
  // Remove unused popoverScore state if we pass it directly, but we might need it for consistent handling or just pass safely.
  // Actually simpler to just pass it in the render function since we have access to 'row'.

  useEffect(() => {
    const handleClickOutsideTable = (event) => {
      // Just unset activeRank if clicking outside row/button.
      if (activeRank && !event.target.closest('tr') && !event.target.closest('button')) {
        setActiveRank(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideTable);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideTable);
    };
  }, [activeRank]);

  const handleRowClick = (e, rank) => {
    // If clicking the button itself, don't toggle
    if (e.target.closest('button')) return;

    if (activeRank === rank) {
      setActiveRank(null);
    } else {
      setActiveRank(rank);
    }
  };

  const handleSetTarget = (score) => {
    const manScore = parseFloat((score / 10000).toFixed(4));
    setScore2(manScore.toString());
    setActiveRank(null);
  };

  const renderTargetButton = (rank, score) => {
    if (activeRank !== rank) return null;
    return (
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSetTarget(score);
          }}
          className="bg-indigo-600 text-white text-[10px] px-2 py-1.5 rounded shadow-lg whitespace-nowrap hover:bg-indigo-700 active:scale-95 transition-all animate-fade-in flex items-center gap-1"
        >
          {t('fire.set_target')}
        </button>
      </div>
    );
  };

  // Import Calculation Logic
  const handleImport = (type) => {
    // Check if data exists
    if (!surveyData) return;

    // Apply default values if inputs are empty
    const power = parseFloat(surveyData.power || '25.5') * 10000;
    const effi = parseFloat(surveyData.effi || '250');
    const isDetailed = surveyData.isDetailedInput;
    const internalVal = parseFloat(surveyData.internalValue || '200');

    // Default Fire Counts (matching PowerTab defaults)
    const savedFireCounts = surveyData.fireCounts || {
      loAndFound: 5,
      envy: 5,
      omakase: 5,
      creationMyth: 1,
      mySekai: 1,
      custom: 5
    };

    // Helper map to convert integer fire count (0~10) to option value string ("1", "5", "25"...)
    const fireCountToOptionValue = {
      0: "1", 1: "5", 2: "10", 3: "15", 4: "20", 5: "25",
      6: "27", 7: "29", 8: "31", 9: "33", 10: "35"
    };

    // Config based on type
    let songId = 0;
    let difficulty = 'master';
    let liveType = LiveType.MULTI;
    let shouldUseFixedSkills = false;
    let targetFireCount = 5; // Default fallback

    if (type === 'envy') {
      songId = 74; // Hitorinbo Envy
      difficulty = 'expert';
      liveType = LiveType.MULTI;
      targetFireCount = savedFireCounts.envy;
    } else if (type === 'lost') {
      songId = 226; // Lost and Found
      difficulty = 'hard';
      liveType = LiveType.MULTI;
      targetFireCount = savedFireCounts.loAndFound;
    } else if (type === 'creation_myth') {
      songId = 186; // Creation Myth
      difficulty = 'master';
      liveType = LiveType.AUTO;
      shouldUseFixedSkills = true;
      targetFireCount = savedFireCounts.creationMyth;
    } else if (type === 'omakase') {
      songId = 572; // Omakase
      difficulty = 'master';
      liveType = LiveType.MULTI;
      targetFireCount = savedFireCounts.omakase;
    } else if (type === 'my_sekai') {
      // My Sekai Logic (unchanged mostly, but no fire count sync usually needed)
      // ... Logic below
    }

    // Set the firea state to match the imported song's fire count
    if (type !== 'my_sekai') {
      const newFireOption = fireCountToOptionValue[targetFireCount] || "25";
      setFirea(newFireOption);
    }

    // Skills
    let skills = [0, 0, 0, 0, 0];
    if (isDetailed && surveyData.detailedSkills) {
      const getVal = (v) => (v === '' || v === null || v === undefined) ? 200 : (parseFloat(v) || 0);
      skills = [
        getVal(surveyData.detailedSkills.encore),
        getVal(surveyData.detailedSkills.member1),
        getVal(surveyData.detailedSkills.member2),
        getVal(surveyData.detailedSkills.member3),
        getVal(surveyData.detailedSkills.member4)
      ];
    } else {
      const val = internalVal || 200;
      skills = [val, val, val, val, val];
    }

    // Handle My Sekai Special Case
    if (type === 'my_sekai') {
      // Use re-parsed powerVal with default "25.5" to ensure safety. 
      // Note: "power" above is already multiplied by 10000, but logic below uses raw float.
      const powerVal = parseFloat(surveyData.power || '25.5');
      const effiVal = parseInt(surveyData.effi || '250', 10);

      let highestPossibleScore = null;
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
          const requiredEffiForThisScore = mySekaiTableData[currentScoreRow][columnIndex];
          if (requiredEffiForThisScore !== null && effiVal >= requiredEffiForThisScore) {
            highestPossibleScore = currentScoreRow; // e.g., "2,500" or "25,000"
            break;
          }
        }
      }

      if (highestPossibleScore) {
        // Convert to string safely before replace
        const scoreStr = String(highestPossibleScore);
        const rawScore = parseFloat(scoreStr.replace(/,/g, ''));
        // Convert to Man (assuming rawScore is actual EP)
        const epInMan = rawScore / 10000;
        setScore3(epInMan.toFixed(4));
        setImportMenuOpen(false);
      }
      return;
    }

    // Multiplier map
    const fireMultipliers = {
      0: 1, 1: 5, 2: 10, 3: 15, 4: 20, 5: 25,
      6: 27, 7: 29, 8: 31, 9: 33, 10: 35
    };
    const multiplier = fireMultipliers[targetFireCount] || 1;

    const inputInput = {
      songId,
      difficulty,
      totalPower: power,
      skillLeader: shouldUseFixedSkills ? 100 : skills[0],
      skillMember2: shouldUseFixedSkills ? 100 : skills[1],
      skillMember3: shouldUseFixedSkills ? 100 : skills[2],
      skillMember4: shouldUseFixedSkills ? 100 : skills[3],
      skillMember5: shouldUseFixedSkills ? 100 : skills[4],
    };

    const result = calculateScoreRange(inputInput, liveType);
    if (result) {
      const musicMeta = musicMetas.find(m => m.music_id === songId && m.difficulty === difficulty);
      if (musicMeta) {
        // Calculate EP
        const getEP = (score) => EventCalculator.getEventPoint(
          liveType,
          EventType.MARATHON,
          score,
          musicMeta.event_rate,
          effi,
          multiplier
        );
        // Use MAX EP as PowerTab result display defaults to Max (Simple Input) or Range (Detailed)
        // User requested to use MIN if available
        const targetResultScore = result.min > 0 ? result.min : result.max;
        const targetEP = getEP(targetResultScore);

        const epInMan = targetEP / 10000;
        setScore3(epInMan.toFixed(4));
        setImportMenuOpen(false);
      }
    }
  };

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
          placeholder="217"
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

        {/* Score Per Round with Import Button */}
        <InputRow
          label={
            <div className="flex items-center gap-1 relative">
              {t('fire.score_per_round')}
              <button
                onClick={() => setImportMenuOpen(!importMenuOpen)}
                className="text-gray-400 hover:text-indigo-600 transition-colors p-0.5"
                title={t('fire.import_title')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              {/* Import Menu Popover - Bottom Left */}
              {importMenuOpen && (
                <div ref={importMenuRef} className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-gray-100 p-2 w-40 animate-fade-in-down">
                  <div className="text-[9px] text-gray-400 mb-2 px-1 border-b border-gray-100 pb-1 leading-tight whitespace-normal">
                    {t('fire.import_desc')}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleImport('lost')} className="text-left text-xs font-medium text-gray-700 p-1.5 hover:bg-indigo-50 rounded hover:text-indigo-600 transition-colors">
                      {t('fire.import_lost')}
                    </button>
                    <button onClick={() => handleImport('omakase')} className="text-left text-xs font-medium text-gray-700 p-1.5 hover:bg-indigo-50 rounded hover:text-indigo-600 transition-colors">
                      {t('fire.import_omakase')}
                    </button>
                    <button onClick={() => handleImport('envy')} className="text-left text-xs font-medium text-gray-700 p-1.5 hover:bg-indigo-50 rounded hover:text-indigo-600 transition-colors">
                      {t('fire.import_envy')}
                    </button>
                    <button onClick={() => handleImport('creation_myth')} className="text-left text-xs font-medium text-gray-700 p-1.5 hover:bg-indigo-50 rounded hover:text-indigo-600 transition-colors">
                      {t('fire.import_creation_myth')}
                    </button>
                    <button onClick={() => handleImport('my_sekai')} className="text-left text-xs font-medium text-gray-700 p-1.5 hover:bg-indigo-50 rounded hover:text-indigo-600 transition-colors">
                      {t('fire.import_mysekai')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          }
          value={score3}
          onChange={e => setScore3(e.target.value)}
          suffix={t('fire.suffix_man')}
          placeholder="2.8"
          spacer={true}
        />

        <InputRow
          label={
            <div className="flex items-center justify-end gap-1" ref={tooltipRef}>
              {t('fire.rounds_per_interval')}
              <div
                className="relative"
                onMouseEnter={() => setTooltipHover(true)}
                onMouseLeave={() => setTooltipHover(false)}
                onClick={() => setTooltipLock(!tooltipLock)}
              >
                <div className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center cursor-help transition-colors ${isTooltipVisible ? 'bg-white text-indigo-600 shadow-sm' : 'bg-gray-400 text-white'}`}>?</div>

                {isTooltipVisible && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-3 bg-white text-gray-800 text-xs rounded-lg shadow-xl border border-gray-200 z-50 font-normal text-left whitespace-pre-line leading-relaxed">
                    <span className="font-bold block mb-1 border-b border-gray-100 pb-1">{t('fire.approx_rounds')}</span>
                    <div className="space-y-0.5">
                      <div className="flex justify-between"><span>{t('power.songs.envy')}:</span><span className="font-bold text-indigo-600">26 ~ 30</span></div>
                      <div className="flex justify-between"><span>{t('power.songs.lost_and_found')}:</span><span className="font-bold text-indigo-600">17 ~ 19</span></div>
                      <div className="flex justify-between"><span>{t('fire.cheerful')}:</span><span className="font-bold text-indigo-600">15 ~ 17</span></div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white drop-shadow-sm"></div>
                  </div>
                )}
              </div>
            </div>
          }
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
      {/* Natural Fire Prediction Button & Panel - Moved Here */}
      <div className="w-[85%] max-w-[280px] mx-auto space-y-2">
        {/* Button */}
        <button
          onClick={() => setPredictionOpen(!predictionOpen)}
          disabled={!eventInfo}
          className={`w-full py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm ${!eventInfo
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : predictionOpen
              ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-200'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
            }`}
        >
          {t('fire.predict_natural_btn')}
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${predictionOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Panel */}
        {predictionOpen && eventInfo && (() => {
          const now = Date.now();
          const end = eventInfo.end * 1000;
          const remainingMs = Math.max(0, end - now);

          const recoveryFire = Math.floor(remainingMs / (30 * 60 * 1000));

          let loginFire = 0;
          let checkTime = new Date(now);
          if (checkTime.getHours() >= 4) {
            checkTime.setDate(checkTime.getDate() + 1);
          }
          checkTime.setHours(4, 0, 0, 0);

          while (checkTime.getTime() < end) {
            loginFire += 10;
            checkTime.setDate(checkTime.getDate() + 1);
          }

          const days = loginFire / 10;
          const userCurrentNatural = parseInt(currentNaturalFire) || 0;
          const totalNaturalFire = recoveryFire + loginFire + userCurrentNatural;

          let currentScore = parseFloat(score1 || '217') || 0;
          let scPerRound = parseFloat(score3 || '2.8') || 0;
          let curFireBonus = parseInt(firea) || 0;
          let chgFireBonus = fires2;

          let fireConsumption = getFireaValue(curFireBonus);
          let finalScorePerRound = scPerRound;

          if (chgFireBonus !== "none") {
            const newFireBonus = parseInt(chgFireBonus);
            finalScorePerRound = (scPerRound / curFireBonus) * newFireBonus;
            fireConsumption = getFireaValue(newFireBonus);
          }

          if (fireConsumption === 0) fireConsumption = 1;

          const runs = Math.floor(totalNaturalFire / fireConsumption);
          const earnedScore = runs * finalScorePerRound;

          // Challenge Live Logic (4 AM Reset)
          // Input: Man unit. Default 250 if empty.
          const cScoreVal = challengeScore === '' ? 250 : parseFloat(challengeScore) || 0;
          const challengeEPPerDay = Math.floor((100 + cScoreVal / 2) * 120);
          const totalChallengeEP = challengeEPPerDay * days;

          // My Sekai Logic (5 AM Reset)
          let mySekaiDays = 0;
          let checkMs = new Date(now);
          if (checkMs.getHours() >= 5) {
            checkMs.setDate(checkMs.getDate() + 1);
          }
          checkMs.setHours(5, 0, 0, 0);

          while (checkMs.getTime() < end) {
            mySekaiDays++;
            checkMs.setDate(checkMs.getDate() + 1);
          }

          // Input: Raw unit. Default 2500 if empty.
          const mScoreVal = mySekaiScore === '' ? 2500 : parseFloat(mySekaiScore) || 0;
          const mySekaiMultiplier = worldPass ? 10 : 2;
          // Formula: 10 * (input / (pass?1:5))  => if pass: 10*input, else: 2*input
          // Wait, user said: "if pass: 10*(MySekaiScore), else: 10*(MySekaiScore/5)"
          // This implies the input IS "MySekaiScore".
          // Previous code multiplied by 10000 assuming Man. Removed that.
          const mySekaiEPPerDay = Math.floor(mySekaiMultiplier * mScoreVal);
          const totalMySekaiEP = mySekaiEPPerDay * mySekaiDays;

          const scoreAfter = currentScore + earnedScore + (totalChallengeEP / 10000) + (totalMySekaiEP / 10000);

          return (
            <div className="bg-indigo-50/50 rounded-lg p-3 shadow-sm border border-indigo-100 animate-fade-in-down text-[14px]">

              {/* Inputs Grid */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-2 mb-2 border-b border-indigo-100 pb-2">
                {/* Current Natural Fire Input */}
                <div className="flex flex-col items-center">
                  <span className="text-gray-600 mb-1 text-[11px]">{t('fire.current_natural_fire')}</span>
                  <input
                    type="number"
                    value={currentNaturalFire}
                    onChange={(e) => setCurrentNaturalFire(e.target.value)}
                    placeholder="0"
                    className={`w-20 px-2 py-1 text-center text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${currentNaturalFire === '' ? 'text-gray-400' : 'text-gray-900 bg-white'}`}
                  />
                </div>
                {/* Challenge Score Input (Man) */}
                <div className="flex flex-col items-center">
                  <span className="text-gray-600 mb-1 text-[11px]">{t('fire.challenge_live_score')} ({t('fire.suffix_man')})</span>
                  <input
                    type="number"
                    value={challengeScore}
                    onChange={(e) => setChallengeScore(e.target.value)}
                    placeholder="250"
                    className={`w-24 px-2 py-1 text-center text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${challengeScore === '' ? 'text-gray-400' : 'text-gray-900 bg-white'}`}
                  />
                </div>
                {/* My Sekai Score Input */}
                <div className="flex flex-col items-center relative">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-gray-600 text-[11px]">{t('fire.my_sekai_score')}</span>
                    <button
                      onClick={importMySekaiForPrediction}
                      className="text-gray-400 hover:text-indigo-600 transition-colors p-0.5"
                      title={t('fire.import_title')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="number"
                    value={mySekaiScore}
                    onChange={(e) => setMySekaiScore(e.target.value)}
                    placeholder="2500"
                    className={`w-24 px-2 py-1 text-center text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${mySekaiScore === '' ? 'text-gray-400' : 'text-gray-900 bg-white'}`}
                  />
                </div>
                {/* World Pass Toggle */}
                <div className="flex flex-col items-center justify-center">
                  <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={worldPass}
                        onChange={(e) => setWorldPass(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </div>
                    <span className="text-[11px] text-gray-600 font-medium select-none">{t('fire.world_pass')}</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <div className="grid grid-cols-2 items-center text-center">
                  <span className="text-gray-600">{t('fire.natural_fire')}</span>
                  <div className="flex flex-col items-center leading-none">
                    <span className="font-bold text-blue-600 text-base">{totalNaturalFire}{t('fire.fire_suffix')}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      ({recoveryFire} + {t('fire.ad_bonus')}{loginFire} {userCurrentNatural > 0 ? `+ ${userCurrentNatural}` : ''})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 items-center text-center">
                  <span className="text-gray-600">{t('fire.natural_score')}</span>
                  <span className="font-bold text-blue-600 text-base">
                    {Math.floor(earnedScore).toLocaleString()}
                    <span className="text-sm font-normal text-gray-500 ml-0.5">{t('fire.suffix_man')}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 items-center text-center">
                  <span className="text-gray-600">{t('fire.challenge_live_ep')}</span>
                  <div className="flex flex-col items-center leading-none">
                    <span className="font-bold text-blue-600 text-base">
                      {Math.floor(challengeEPPerDay).toLocaleString()}
                      <span className="text-sm font-normal text-gray-500 ml-0.5">P</span>
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      × {days}{t('fire.days_suffix')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 items-center text-center">
                  <span className="text-gray-600">{t('fire.my_sekai_ep')}</span>
                  <div className="flex flex-col items-center leading-none">
                    <span className="font-bold text-blue-600 text-base">
                      {Math.floor(mySekaiEPPerDay).toLocaleString()}
                      <span className="text-sm font-normal text-gray-500 ml-0.5">P</span>
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      × {mySekaiDays}{t('fire.days_suffix')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 items-center pt-1 border-t border-indigo-100 mt-1 text-center">
                  <span className="text-gray-600">{t('fire.score_after_natural')}</span>
                  <div className="flex flex-col items-center w-full">
                    <span className="text-gray-500 text-xs">
                      {Math.floor(currentScore).toLocaleString()}{t('fire.suffix_man')} + {Math.floor(earnedScore + (totalChallengeEP / 10000) + (totalMySekaiEP / 10000)).toLocaleString()}{t('fire.suffix_man')}
                    </span>
                    <span className="font-bold text-blue-600 text-base">
                      = {Math.floor(scoreAfter).toLocaleString()}
                      <span className="text-sm font-normal text-gray-500 ml-0.5">{t('fire.suffix_man')}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-[9px] text-gray-400 text-center mt-2 border-t border-indigo-50 pt-1">
                {t('fire.prediction_disclaimer')}
              </div>
            </div>
          );
        })()}
      </div>

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

      </div>

      {/* Room Search Dropdown (Below Result) - Minimal Margin */}
      <div className="w-[85%] max-w-[280px] mx-auto flex justify-end mt-0.5 items-center gap-2" ref={dropdownRef}>
        {/* Engine Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 h-full items-center">
          <button
            onClick={() => setSearchEngine('yahoo')}
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${searchEngine === 'yahoo' ? 'bg-white text-[#FF0033] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Yahoo
          </button>
          <button
            onClick={() => setSearchEngine('x')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${searchEngine === 'x' ? 'bg-black text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            X
          </button>
        </div>

        <div className="relative inline-block text-left">
          <button
            onClick={() => setIsRoomSearchOpen(!isRoomSearchOpen)}
            className="bg-white hover:bg-gray-50 text-gray-600 font-bold py-1 px-3 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-all text-xs flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {t('fire.room_search')}
          </button>

          {isRoomSearchOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-slide-down">
              <div className="py-1">
                <a href={searchEngine === 'yahoo' ? "https://search.yahoo.co.jp/realtime/search?p=%28%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8D%94%E5%8A%9B+OR+%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8B%9F%E9%9B%86%29&ei=UTF-8&ifr=tl_sc" : "https://x.com/search?q=%28%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8D%94%E5%8A%9B+OR+%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8B%9F%E9%9B%86%29"} target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-medium">
                  {t('fire.room_all')}
                </a>
                <a href={searchEngine === 'yahoo' ? "https://search.yahoo.co.jp/realtime/search?p=%28%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8D%94%E5%8A%9B+OR+%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8B%9F%E9%9B%86%29+-%E3%83%AD%E3%82%B9+-%E3%81%8A%E3%81%BE%E3%81%8B%E3%81%9B+-%E3%83%93%E3%83%90%E3%83%8F%E3%83%94+-sage&ei=UTF-8&ifr=tl_sc" : "https://x.com/search?q=%28%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8D%94%E5%8A%9B+OR+%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8B%9F%E9%9B%86%29+-%E3%83%AD%E3%82%B9+-%E3%81%8A%E3%81%BE%E3%81%8B%E3%81%9B+-%E3%83%93%E3%83%90%E3%83%8F%E3%83%94+-sage"} target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-medium">
                  {t('fire.room_envy')}
                </a>
                <a href={searchEngine === 'yahoo' ? "https://search.yahoo.co.jp/realtime/search?p=%28%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8D%94%E5%8A%9B+OR+%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8B%9F%E9%9B%86%29+%28%E3%83%AD%E3%82%B9+OR+sage%29&ei=UTF-8&ifr=tl_sc" : "https://x.com/search?q=%28%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8D%94%E5%8A%9B+OR+%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8B%9F%E9%9B%86%29+%28%E3%83%AD%E3%82%B9+OR+sage%29"} target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-medium">
                  {t('fire.room_lost_sage')}
                </a>
                <a href={searchEngine === 'yahoo' ? "https://search.yahoo.co.jp/realtime/search?p=(%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8D%94%E5%8A%9B%20OR%20%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8B%9F%E9%9B%86)%20%E3%81%8A%E3%81%BE%E3%81%8B%E3%81%9B" : "https://x.com/search?q=(%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8D%94%E5%8A%9B%20OR%20%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8B%9F%E9%9B%86)%20%E3%81%8A%E3%81%BE%E3%81%8B%E3%81%9B"} target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-medium">
                  {t('fire.room_omakase')}
                </a>
                <a href={searchEngine === 'yahoo' ? "https://search.yahoo.co.jp/realtime/search?p=%28%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8D%94%E5%8A%9B+OR+%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8B%9F%E9%9B%86%29+MV&ei=UTF-8&ifr=tl_sc" : "https://x.com/search?q=%28%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8D%94%E5%8A%9B+OR+%23%E3%83%97%E3%83%AD%E3%82%BB%E3%82%AB%E5%8B%9F%E9%9B%86%29+MV"} target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-medium">
                  {t('fire.room_mv')}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Jiiku Prediction Table - Clean Mobile/Desktop Style */}
      <div className="w-full max-w-2xl mx-auto mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" ref={tableRef}>
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            {eventInfo ? (
              <div className="mb-2">
                {/* Top Row: Last Updated | Event Name | Ends In */}
                <div className="flex justify-between items-center mb-2 gap-1 sm:gap-2">
                  {/* Last Updated (Left) */}
                  <div className="flex flex-col items-start min-w-max">
                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium leading-none mb-0.5 sm:mb-1">
                      {t('fire.last_updated')}
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-700 font-extrabold tracking-tight">
                      {lastUpdated ? formatTime(lastUpdated) : "-"}
                    </span>
                  </div>

                  {/* Event Name (Center) */}
                  <div className="flex-1 text-center px-0.5 sm:px-1 min-w-0">
                    <div className="font-bold text-indigo-600 text-sm sm:text-lg leading-tight break-keep line-clamp-2">
                      {eventInfo.name}
                    </div>
                  </div>

                  {/* Ends In (Right) */}
                  <div className="flex flex-col items-end min-w-max">
                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium leading-none mb-0.5 sm:mb-1">
                      {t('fire.ends_in')}
                    </span>
                    <span className="text-[10px] sm:text-xs text-indigo-600 font-extrabold tracking-tight">
                      {eventInfo && lastUpdated ? (
                        formatDuration((eventInfo.end * 1000) - lastUpdated)
                      ) : (
                        timeRemaining !== null && formatDuration(timeRemaining)
                      )}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {(() => {
                  const currentTs = lastUpdated ? lastUpdated / 1000 : Date.now() / 1000;
                  const elapsedHours = Math.max(0, (currentTs - eventInfo.start) / 3600);
                  const totalHours = eventInfo.len;
                  const progress = Math.min(100, Math.max(0, (elapsedHours / totalHours) * 100));

                  return (
                    <div className="relative w-full h-6 bg-gray-200 rounded-lg overflow-hidden shadow-inner mt-1">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] z-10 leading-none pb-[1px]">
                        {elapsedHours.toFixed(1)}h / {totalHours}h ({progress.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <h3 className="font-bold text-gray-700 text-center mb-2">{t('fire.event_predictions')}</h3>
            )}

            {/* Fallback Timing Info for when No Event Info (Optional, but kept for safety) */}
            {!eventInfo && (
              <div className="flex justify-between items-center text-xs mt-2 text-gray-500 px-1">
                <span>
                  {lastUpdated && `${t('fire.last_updated')}: ${formatTime(lastUpdated)}`}
                </span>
                <span>
                  {timeRemaining !== null && `${t('fire.ends_in')}: ${formatDuration(timeRemaining)}`}
                </span>
              </div>
            )}

          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500 animate-pulse">
              {t('fire.loading_prediction_data')}
            </div>
          ) : predictionData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 w-20">{t('fire.rank')}</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600">{t('fire.current')}</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600">{t('fire.predicted')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Top 50 Toggle Row */}
                  <tr
                    onClick={() => setShowTop50(!showTop50)}
                    className="bg-indigo-50/50 hover:bg-indigo-100/50 cursor-pointer transition-colors"
                  >
                    <td colSpan="3" className="px-3 py-2 text-center text-xs font-bold text-indigo-600 transition-all duration-300">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`transform transition-transform duration-300 ${showTop50 ? 'rotate-180' : 'rotate-0'}`}>▼</span>
                        {showTop50 ? t('fire.hide_top_50') : t('fire.show_top_50')}
                      </div>
                    </td>
                  </tr>

                  {/* Top 50 Animated Container */}
                  <tr>
                    <td colSpan="3" className="p-0 border-0">
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${showTop50 ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
                          }`}
                      >
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-gray-100">
                            {predictionData.filter(r => r.rank <= 50).map((row, index) => (
                              <tr
                                key={row.rank}
                                className={`transition-colors cursor-pointer active:bg-indigo-100 ${index % 2 === 0 ? 'bg-indigo-50/10 hover:bg-indigo-50/60' : 'bg-indigo-50/40 hover:bg-indigo-50/80'}`}
                                onClick={(e) => handleRowClick(e, row.rank)}
                              >
                                <td className="px-3 py-2 font-bold text-indigo-600 w-20 relative">
                                  #{row.rank}
                                  {renderTargetButton(row.rank, row.predictedScore)}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                                  {Math.floor(row.currentScore).toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums font-bold text-gray-900">
                                  {Math.floor(row.predictedScore).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>

                  {/* Rest of Rows */}
                  {predictionData.filter(r => r.rank > 50).map((row, index) => (
                    <tr
                      key={row.rank}
                      className={`transition-colors cursor-pointer active:bg-gray-200 ${index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}`}
                      onClick={(e) => handleRowClick(e, row.rank)}
                    >
                      <td className="px-3 py-2 font-bold text-indigo-600 relative">
                        #{row.rank}
                        {renderTargetButton(row.rank, row.predictedScore)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                        {Math.floor(row.currentScore).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-gray-900">
                        {Math.floor(row.predictedScore).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              {t('fire.no_prediction_data')}
            </div>
          )}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 flex flex-col sm:flex-row justify-between items-center gap-1">
            <span>
              {t('fire.data_provided')} <a href="https://jiiku.dev/" target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-500">Jiiku</a>
            </span>
            <span>
              {t('fire.predictions_disclaimer')}
            </span>
          </div>
        </div>
      </div>

      {language === 'ko' && (
        <div className="w-full max-w-2xl mx-auto mt-4 text-center">
          <button
            onClick={() => window.open('https://x.rilaksekai.com/', '_blank')}
            className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl shadow-sm hover:bg-gray-50 hover:text-indigo-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z" />
            </svg>
            주회글 생성기
          </button>
        </div>
      )}
    </div>
  );
};

export default FireTab;
