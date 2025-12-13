import React, { useState, useEffect, useRef } from 'react';
import { InputTableWrapper, InputRow, SelectRow } from './common/InputComponents';
import { useTranslation } from '../contexts/LanguageContext';

const FireTab = ({ surveyData, setSurveyData }) => {
  const { t, language } = useTranslation();
  const [score1, setScore1] = useState(surveyData.score1 || '');
  const [score2, setScore2] = useState(surveyData.score2 || '');
  const [score3, setScore3] = useState(surveyData.score3 || '');
  const [rounds1, setRounds1] = useState(surveyData.rounds1 || '');
  const [firea, setFirea] = useState(surveyData.firea || '25');
  const [fires2, setFires2] = useState(surveyData.fires2 || 'none');

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
  const dropdownRef = useRef(null);

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
                    <span className="font-bold block mb-1 border-b border-gray-100 pb-1">대략적인 간 당 판수</span>
                    <div className="space-y-0.5">
                      <div className="flex justify-between"><span>엔비:</span><span className="font-bold text-indigo-600">26 ~ 30</span></div>
                      <div className="flex justify-between"><span>로앤파:</span><span className="font-bold text-indigo-600">17 ~ 19</span></div>
                      <div className="flex justify-between"><span>치어풀:</span><span className="font-bold text-indigo-600">15 ~ 17</span></div>
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
