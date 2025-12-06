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

  const [predictionData, setPredictionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [eventInfo, setEventInfo] = useState(null);
  const [showTop50, setShowTop50] = useState(false);

  useEffect(() => {
    const fetchPredictionData = async () => {
      try {
        const response = await fetch("https://api.rilaksekai.com/api/ranking");
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
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  const tableRef = React.useRef(null);
  const [popoverScore, setPopoverScore] = useState(0);

  useEffect(() => {
    const handleClickOutsideTable = (event) => {
      // Close if clicking outside the table but allow clicking the popover itself (which is not in tableRef)
      // We'll handle popover clicks separately or ensure they don't propagate if needed.
      // Actually, since the popover is rendered separately, we need to check if the click target is the popover.
      // But simpler: just unset activeRank if clicking outside row/popover.
      // For now, let's just use a window click listener that clears if not on the button.
      if (activeRank && !event.target.closest('.target-popover') && !event.target.closest('tr')) {
        setActiveRank(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideTable);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideTable);
    };
  }, [activeRank]);

  const handleRowClick = (e, rank, predictedScore) => {
    // Prevent toggling off immediately if clicking the same row? 
    // Or allow toggling.
    // If clicking a different row, switch to it.
    if (activeRank === rank) {
      setActiveRank(null);
    } else {
      const x = e.clientX;
      const y = e.clientY;
      setPopoverPos({ x, y });
      setActiveRank(rank);
      // Store the score to use in the popover
      setPopoverScore(predictedScore);
    }
  };

  const handleSetTarget = (score) => {
    const manScore = parseFloat((score / 10000).toFixed(4));
    setScore2(manScore.toString());
    setActiveRank(null);
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

      {/* Jiiku Prediction Table - Clean Mobile/Desktop Style */}
      <div className="w-full max-w-2xl mx-auto mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" ref={tableRef}>
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            {eventInfo ? (
              <div className="mb-2">
                {/* Top Row: Last Updated | Event Name | Ends In */}
                <div className="flex justify-between items-center mb-2 gap-2">
                  {/* Last Updated (Left) */}
                  <div className="flex flex-col items-start min-w-max">
                    <span className="text-[10px] text-gray-400 font-medium leading-none mb-1">
                      {t('fire.last_updated')}
                    </span>
                    <span className="text-xs text-gray-700 font-extrabold tracking-tight">
                      {lastUpdated ? formatTime(lastUpdated) : "-"}
                    </span>
                  </div>

                  {/* Event Name (Center) */}
                  <div className="flex-1 text-center px-1">
                    <div className="font-bold text-indigo-600 text-base leading-tight break-keep">
                      {eventInfo.name}
                    </div>
                  </div>

                  {/* Ends In (Right) */}
                  <div className="flex flex-col items-end min-w-max">
                    <span className="text-[10px] text-gray-400 font-medium leading-none mb-1">
                      {t('fire.ends_in')}
                    </span>
                    <span className="text-xs text-indigo-600 font-extrabold tracking-tight">
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
                        className={`overflow-hidden transition-all duration-700 ease-in-out ${showTop50 ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
                          }`}
                      >
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-gray-100">
                            {predictionData.filter(r => r.rank <= 50).map((row, index) => (
                              <tr
                                key={row.rank}
                                className={`transition-colors cursor-pointer active:bg-indigo-100 ${index % 2 === 0 ? 'bg-indigo-50/10 hover:bg-indigo-50/60' : 'bg-indigo-50/40 hover:bg-indigo-50/80'}`}
                                onClick={(e) => handleRowClick(e, row.rank, row.predictedScore)}
                              >
                                <td className="px-3 py-2 font-bold text-indigo-600 w-20">#{row.rank}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                                  {Math.floor(row.currentScore).toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-900">
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
                      onClick={(e) => handleRowClick(e, row.rank, row.predictedScore)}
                    >
                      <td className="px-3 py-2 font-bold text-indigo-600">#{row.rank}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                        {Math.floor(row.currentScore).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-900">
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

      {/* Floating Popover Button */}
      {activeRank && (
        <div
          className="fixed z-[100] target-popover animate-scale-in"
          style={{
            top: popoverPos.y + 10,
            left: popoverPos.x,
            transform: 'translateX(-50%)'
          }}
        >
          <button
            onClick={() => handleSetTarget(popoverScore)}
            className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1 ring-2 ring-white"
          >
            <span>{t('fire.set_target')}</span>
            <span className="opacity-75 text-[10px]">#{activeRank}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FireTab;
