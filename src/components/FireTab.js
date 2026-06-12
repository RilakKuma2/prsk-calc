import React, { useState, useEffect, useRef } from 'react';

import { formatDuration } from '../utils/time';
import RankingGraphModal from './RankingGraphModal';
import { useTranslation } from '../contexts/LanguageContext';
import { calculateScoreRange } from '../utils/calculator';
import { EventCalculator, LiveType, EventType } from 'sekai-calculator';
import { getMusicMetasSync } from '../utils/dataLoader';
import { mySekaiTableData, powerColumnThresholds, scoreRowKeys } from '../data/mySekaiTableData';
import playerLevelData from '../data/player_levels.json';
import { characterBirthdays } from '../data/characterBirthdays';

const GENERAL_ALLOWED_RANKS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  20, 30, 40, 50,
  100, 200, 300, 400, 500,
  1000, 1500, 2000, 2500, 3000, 4000, 5000, 10000
];

const WORLD_LINK_CHAPTER_ALLOWED_RANKS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  20, 30, 40, 50,
  100, 200, 300, 400, 500,
  1000, 2000, 3000, 4000, 5000, 7000, 10000
];

const getAllowedRanksSet = (includeWorldLinkChapterRanks = false) => new Set(
  includeWorldLinkChapterRanks ? WORLD_LINK_CHAPTER_ALLOWED_RANKS : GENERAL_ALLOWED_RANKS
);

const normalizeEventLengthHours = (len) => {
  const numericLen = Number(len || 0);
  if (!Number.isFinite(numericLen) || numericLen <= 0) return 0;
  return numericLen > 1000 ? numericLen / 3600 : numericLen;
};

const latestEventLengthHours = (latestEvent) => {
  const startAt = latestEvent?.startAt || 0;
  const aggregateAt = latestEvent?.aggregateAt || 0;
  return startAt && aggregateAt ? (aggregateAt - startAt) / 3600000 : 0;
};

const normalizeEventInfo = (eventInfo, latestEvent) => {
  if (eventInfo) {
    return {
      ...eventInfo,
      event_type: eventInfo.event_type || eventInfo.eventType,
      len: normalizeEventLengthHours(eventInfo.len),
      asname: eventInfo.asname || eventInfo.assetbundleName,
    };
  }
  if (!latestEvent) return null;

  const startAt = latestEvent.startAt || 0;
  const aggregateAt = latestEvent.aggregateAt || 0;
  return {
    id: latestEvent.id,
    event_type: latestEvent.eventType || latestEvent.event_type,
    name: latestEvent.name,
    start: startAt ? startAt / 1000 : 0,
    end: aggregateAt ? aggregateAt / 1000 : 0,
    len: latestEventLengthHours(latestEvent),
    asname: latestEvent.assetbundleName,
  };
};

const applyLatestEventToEventInfo = (eventInfo, latestEvent, now = Date.now()) => {
  if (!eventInfo || !latestEvent?.startAt || latestEvent.startAt > now) return eventInfo;
  return {
    ...eventInfo,
    id: latestEvent.id || eventInfo.id,
    asname: latestEvent.assetbundleName || eventInfo.asname,
    event_type: latestEvent.eventType || latestEvent.event_type || eventInfo.event_type,
    end: latestEvent.aggregateAt ? latestEvent.aggregateAt / 1000 : eventInfo.end,
    start: latestEvent.startAt ? latestEvent.startAt / 1000 : eventInfo.start,
    len: latestEventLengthHours(latestEvent) || normalizeEventLengthHours(eventInfo.len),
  };
};

const mergeRankingsByHighestScore = (rankings = []) => {
  const byRank = new Map();

  for (const item of rankings) {
    const rank = Number(item?.rank);
    if (!Number.isFinite(rank)) continue;

    const score = Number(item?.score || 0);
    const previous = byRank.get(rank);
    const previousScore = Number(previous?.score || 0);

    if (!previous || score > previousScore) {
      byRank.set(rank, { ...item, rank });
    }
  }

  return Array.from(byRank.values()).sort((a, b) => a.rank - b.rank);
};

const formatScoreDelta1h = (delta) => {
  if (delta === null || delta === undefined || delta === '') return null;
  const value = Number(delta);
  if (!Number.isFinite(value)) return null;
  const rounded = Math.floor(value);
  const sign = rounded >= 0 ? '+' : '';
  return `(${sign}${rounded.toLocaleString()})`;
};

const CURRENT_SCORE_COLUMN_RATIO = 0.48;
const CURRENT_SCORE_CELL_HORIZONTAL_PADDING = 8;
const SCORE_DELTA_INLINE_GAP = 4;

const CurrentScoreWithDelta = ({ score, delta, stacked = false }) => {
  const formattedDelta = formatScoreDelta1h(delta);
  const layoutClass = stacked
    ? 'flex-col items-center justify-center gap-y-0'
    : 'flex-row flex-nowrap items-baseline justify-center gap-x-1';

  return (
    <span className={`inline-flex max-w-full ${layoutClass}`}>
      <span className="whitespace-nowrap leading-tight">{Math.floor(score || 0).toLocaleString()}</span>
      {formattedDelta && (
        <span className={`whitespace-nowrap text-[9px] sm:text-[10px] font-extrabold leading-tight ${Number(delta) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {formattedDelta}
        </span>
      )}
    </span>
  );
};

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
  const [currentScoreLastUpdated, setCurrentScoreLastUpdated] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [eventInfo, setEventInfo] = useState(null);
  const [showTop50, setShowTop50] = useState(false);
  const [chaptersData, setChaptersData] = useState([]);
  const [worldBloomsInfo, setWorldBloomsInfo] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState('all');
  const isWorldBloomChapterSelected = eventInfo?.event_type === 'world_bloom' && selectedChapter !== 'all';
  const allowedRanksSet = getAllowedRanksSet(isWorldBloomChapterSelected);
  const [chapterLiveData, setChapterLiveData] = useState([]);
  const [chapterScoreLastUpdated, setChapterScoreLastUpdated] = useState(null);
  const [isRoomSearchOpen, setIsRoomSearchOpen] = useState(false);
  const [searchEngine, setSearchEngine] = useState(() => localStorage.getItem('roomSearchEngine') || 'yahoo');
  const [showRecentHourlySpeed, setShowRecentHourlySpeed] = useState(() => localStorage.getItem('showRecentHourlySpeed') !== 'false');
  const [currentNaturalFire, setCurrentNaturalFire] = useState(surveyData.currentNaturalFire || '');
  const [challengeScore, setChallengeScore] = useState(surveyData.challengeScore || ''); // Default empty, used as 250 if empty
  const [worldPass, setWorldPass] = useState(surveyData.worldPass || false);
  const [mySekaiScore, setMySekaiScore] = useState(surveyData.mySekaiScore || ''); // Default empty, used as 2500 if empty
  const [importMenuOpen, setImportMenuOpen] = useState(false);

  // Level Up Bonus State (토글은 항상 OFF로 시작, 나머지 값은 저장됨)
  const [isLevelUpBonusEnabled, setIsLevelUpBonusEnabled] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(surveyData.fireCurrentLevel || '');
  const [remainingExp, setRemainingExp] = useState(surveyData.fireRemainingExp || '');
  const [liveRank, setLiveRank] = useState(surveyData.fireLiveRank || 'S');

  // Next Event Fire State
  const [isNextEventFireEnabled, setIsNextEventFireEnabled] = useState(false);
  const [manualNextEventDate, setManualNextEventDate] = useState('');
  const [manualNextEventTime, setManualNextEventTime] = useState('');
  const [remainingFireMinutes, setRemainingFireMinutes] = useState(30);

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
  // Ranking Graph State
  const [graphRank, setGraphRank] = useState(null);

  // Ref for tooltips
  const dropdownRef = useRef(null);
  const importMenuRef = useRef(null);
  const hasAutoSelected = useRef(false);
  const rankingTableContainerRef = useRef(null);
  const [stackScoreDeltas, setStackScoreDeltas] = useState(false);

  // Persist Search Engine Preference
  useEffect(() => {
    localStorage.setItem('roomSearchEngine', searchEngine);
  }, [searchEngine]);

  useEffect(() => {
    localStorage.setItem('showRecentHourlySpeed', showRecentHourlySpeed ? 'true' : 'false');
  }, [showRecentHourlySpeed]);

  // World Link Chapter Auto-selection
  useEffect(() => {
    if (!hasAutoSelected.current) {
      let selected = null;
      const now = Date.now();

      // 1. worldBloomsInfo에서 먼저 찾기
      if (worldBloomsInfo && worldBloomsInfo.length > 0 && eventInfo?.id) {
        const eventChapters = worldBloomsInfo.filter(wb => wb.eventId == eventInfo.id);
        const currentChapter = eventChapters.find(ch => {
          const start = ch.chapterStartAt || 0;
          const end = ch.chapterEndAt || 0;
          return now >= start && now < end;
        });
        if (currentChapter) {
          // chaptersData에 해당 챕터가 있는지 확인하고 chapter_id 가져오기
          const matchedChapter = chaptersData.find(ch => ch.chapter_id?.split('-')[1] == currentChapter.chapterNo);
          selected = matchedChapter?.chapter_id || `wl-${currentChapter.chapterNo}`;
        }
      }

      // 2. 못 찾았으면 chaptersData에서 찾기
      if (!selected && chaptersData.length > 0) {
        const currentChapter = chaptersData.find(ch => {
          const start = (ch.start || 0) * 1000;
          const end = (ch.end || 0) * 1000;
          return now >= start && now < end;
        });
        if (currentChapter) {
          selected = currentChapter.chapter_id;
        }
      }

      if (selected) {
        setSelectedChapter(selected);
        hasAutoSelected.current = true;
      }
    }
  }, [chaptersData, worldBloomsInfo, eventInfo]);

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


  // Stale Data Warning State
  const [staleWarning, setStaleWarning] = useState(false);

  useEffect(() => {
    const fetchPredictionData = async () => {

      try {
        const [mainResponse, assetResponse] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_BASE_URL}/api/ranking`),
          fetch('https://api.rilaksekai.com/api/latest_ranking', { cache: 'reload' }).catch(e => null) // Allow asset fetch to fail gently
        ]);

        const mainData = await mainResponse.json();
        let assetJson = null;
        if (assetResponse && assetResponse.ok) {
          try {
            assetJson = await assetResponse.json();
          } catch (e) { console.error(e); }
        }

        const assetTop100 = assetJson?.top100?.rankings || [];
        const assetBorders = assetJson?.border?.borderRankings || assetJson?.border?.eventRankingBorders || [];
        const assetData = mergeRankingsByHighestScore([...assetBorders, ...assetTop100]);

        if (assetJson?.fetchedAt) {
          const formattedDateStr = assetJson.fetchedAt.replace(' ', 'T') + '+09:00';
          setCurrentScoreLastUpdated(new Date(formattedDateStr).getTime());
        } else if (assetData.length > 0 && assetData[0].timestamp) {
          setCurrentScoreLastUpdated(new Date(assetData[0].timestamp).getTime());
        }

        // 1. Determine Event IDs
        const mainEventInfo = normalizeEventInfo(mainData.event_info, mainData.latest_event);
        const assetEventInfo = normalizeEventInfo(assetJson?.event_info, assetJson?.latest_event);
        const mainEventId = Number(mainEventInfo?.id || 0);
        const assetEventId = assetJson?.eventId
          ? Number(assetJson.eventId)
          : Number(assetEventInfo?.id || ((assetData.length > 0 && assetData[0].eventId) ? assetData[0].eventId : 0));

        let finalData = [];
        let mergedEventInfo = mainEventInfo;
        let mergedUpdatedAt = mainData.updatedAt;
        let isStale = false;

        // 2. Logic: Compare Event IDs
        if (assetEventId > mainEventId) {
          // Asset data is newer event
          finalData = assetData.map(item => ({
            rank: item.rank,
            currentScore: item.score,
            predictedScore: 0, // No prediction
            scoreDelta1h: item.scoreDelta1h
          })).sort((a, b) => a.rank - b.rank);
          // Can't really update eventInfo properly without metadata, but we follow instruction "display higher event number"
          // We'll keep mainData.event_info if available (might be old), or maybe we should just not show outdated event info?
          // Since we have no metadata for the new event, we might just have to live with old or empty metadata.
          // But we update timestamps.
          if (assetJson?.fetchedAt) {
            mergedUpdatedAt = new Date(assetJson.fetchedAt.replace(' ', 'T') + '+09:00').getTime();
          } else if (assetData.length > 0 && assetData[0].timestamp) {
            mergedUpdatedAt = new Date(assetData[0].timestamp).getTime();
          }
          if (assetEventInfo) {
            mergedEventInfo = assetEventInfo;
          }
        } else if (mainEventId > assetEventId) {
          // Main API is newer (or asset data is old)
          if (mainData.data) {
            finalData = mainData.data.map(item => ({
              rank: item.rank,
              currentScore: item.current,
              predictedScore: item.predicted,
              scoreDelta1h: item.scoreDelta1h
            })).sort((a, b) => a.rank - b.rank);
          }
        } else {
          if (assetEventInfo) {
            mergedEventInfo = { ...(mergedEventInfo || {}), ...assetEventInfo };
          }
          // Same Event - Merge
          const mainMap = new Map((mainData.data || []).map(i => [i.rank, i]));
          const assetMap = new Map(assetData.map(i => [i.rank, i]));

          // Map to store latest range from mainData.ranks
          const rankRangeMap = new Map();
          if (mainData.ranks) {
            mainData.ranks.forEach(rankObj => {
              const r = rankObj.rank;
              // Find the latest point with type 'p' (prediction)
              const predictionPoints = (rankObj.points || []).filter(p => p.type === 'p');
              if (predictionPoints.length > 0) {
                const latest = predictionPoints.reduce((prev, current) => (prev.ts > current.ts) ? prev : current);
                rankRangeMap.set(r, { l: latest.l || 0, u: latest.u || 0 });
              }
            });
          }

          const allRanks = new Set([...mainMap.keys(), ...assetMap.keys(), ...rankRangeMap.keys()]);

          finalData = Array.from(allRanks).map(rank => {
            const mainItem = mainMap.get(rank);
            const assetItem = assetMap.get(rank);
            const rangeItem = rankRangeMap.get(rank);

            let currentScore = 0;
            let predictedScore = 0;
            let scoreDelta1h = null;

            if (mainItem) {
              currentScore = mainItem.current;
              predictedScore = mainItem.predicted;
              scoreDelta1h = mainItem.scoreDelta1h ?? null;
            }

            const mainTs = mainData.updatedAt || 0;
            const assetTs = assetJson?.fetchedAt ? new Date(assetJson.fetchedAt.replace(' ', 'T') + '+09:00').getTime() : (assetData.length > 0 && assetData[0].timestamp ? new Date(assetData[0].timestamp).getTime() : 0);

            if (assetItem) {
              scoreDelta1h = assetItem.scoreDelta1h ?? scoreDelta1h;
              if (mainTs > assetTs) {
                if (!currentScore) currentScore = assetItem.score;
              } else {
                if (assetItem.score > currentScore) currentScore = assetItem.score;
              }
            }

            return {
              rank,
              currentScore,
              predictedScore,
              scoreDelta1h,
              l: rangeItem?.l || (mainItem?.l) || 0,
              u: rangeItem?.u || (mainItem?.u) || 0
            };
          }).sort((a, b) => a.rank - b.rank);

          // Check Stale
          if (assetData.length > 0 && mainData.updatedAt) {
            const assetTime = assetJson?.fetchedAt ? new Date(assetJson.fetchedAt.replace(' ', 'T') + '+09:00').getTime() : new Date(assetData[0].timestamp).getTime();
            const mainTime = mainData.updatedAt;
            const diff = Math.abs(assetTime - mainTime);
            // 1 day = 24 * 60 * 60 * 1000 = 86400000
            if (diff > 86400000) {
              isStale = true;
            }
          }
        }

        const latestEventForRanks = assetEventId >= mainEventId
          ? (assetJson?.latest_event || mainData.latest_event)
          : mainData.latest_event;
        const eventAllowedRanksSet = getAllowedRanksSet(false);
        finalData = finalData.filter(item => eventAllowedRanksSet.has(item.rank));
        mergedEventInfo = applyLatestEventToEventInfo(mergedEventInfo, latestEventForRanks);

        setLastUpdated(mainData.updatedAt);
        setPredictionData(finalData);
        setStaleWarning(isStale);

        // [추가] World Link 챕터 데이터 처리
        if (mergedEventInfo && mergedEventInfo.event_type === 'world_bloom') {
          try {
            setChaptersData([]);
            const [wlResponse, wbResponse] = await Promise.all([
              fetch(`${process.env.REACT_APP_API_BASE_URL}/api/wlranking`).catch(() => null),
              fetch(`https://asset.rilaksekai.com/suite/worldBlooms.json`).catch(() => null)
            ]);

            if (wbResponse && wbResponse.ok) {
              const wbData = await wbResponse.json();
              setWorldBloomsInfo(Array.isArray(wbData) ? wbData : (wbData.data || []));
            }

            // 챕터 라이브 랭킹 (latest_ranking의 userWorldBloomChapterRankings 활용)
            const currentEventId = Number(mergedEventInfo.id || 0);
            const isCurrentEventChapter = (ch) => (
              !currentEventId || !ch.eventId || Number(ch.eventId) === currentEventId
            );
            const top100Chapters = (assetJson?.top100?.userWorldBloomChapterRankings || []).filter(isCurrentEventChapter);
            const borderChapters = (assetJson?.border?.userWorldBloomChapterRankingBorders || []).filter(isCurrentEventChapter);

            const mergedChaptersMap = new Map();
            for (const ch of top100Chapters) {
              mergedChaptersMap.set(ch.gameCharacterId, {
                ...ch,
                rankings: ch.rankings || [],
                borderRankings: []
              });
            }
            for (const ch of borderChapters) {
              if (mergedChaptersMap.has(ch.gameCharacterId)) {
                mergedChaptersMap.get(ch.gameCharacterId).borderRankings = ch.borderRankings || [];
              } else {
                mergedChaptersMap.set(ch.gameCharacterId, {
                  ...ch,
                  rankings: [],
                  borderRankings: ch.borderRankings || []
                });
              }
            }

            const mergedChapters = Array.from(mergedChaptersMap.values());
            if (mergedChapters.length > 0) {
              setChapterLiveData(mergedChapters);
              if (assetJson?.fetchedAt) {
                const formattedDateStr = assetJson.fetchedAt.replace(' ', 'T') + '+09:00';
                setChapterScoreLastUpdated(new Date(formattedDateStr).getTime());
              }
            }

            if (wlResponse && wlResponse.ok) {
              const wlData = await wlResponse.json();
              const wlEventInfo = normalizeEventInfo(wlData.event_info, wlData.latest_event);
              if (
                Number(wlEventInfo?.id || 0) === currentEventId &&
                wlData.chapters &&
                wlData.chapters.length > 0
              ) {
                setChaptersData(wlData.chapters);
              }
            }
          } catch (err) {
            console.error("Failed to fetch world link ranking data:", err);
          }
        } else if (mainData.chapters && mainData.chapters.length > 0) {
          setChaptersData(mainData.chapters);
        } else {
          setChaptersData([]);
          setChapterLiveData([]);
        }

        if (mergedEventInfo) {
          // [추가] latest_event가 있고, 이미 시작했으면 그 정보를 사용 (배너 이미지, 종료 시간)
          const latestEvent = latestEventForRanks;
          const now = Date.now();
          if (latestEvent && latestEvent.startAt && latestEvent.startAt <= now) {
            // asname은 latest_event의 assetbundleName 사용
            mergedEventInfo.asname = latestEvent.assetbundleName || mergedEventInfo.asname;
            mergedEventInfo.event_type = latestEvent.eventType || latestEvent.event_type || mergedEventInfo.event_type;
            // aggregateAt은 밀리초 단위, end는 초 단위라서 변환
            if (latestEvent.aggregateAt) {
              mergedEventInfo.end = latestEvent.aggregateAt / 1000;
            }
            // start도 업데이트 (진행률 계산용)
            mergedEventInfo.start = latestEvent.startAt / 1000;
            mergedEventInfo.len = latestEventLengthHours(latestEvent) || normalizeEventLengthHours(mergedEventInfo.len);
          }
          // latest_event가 아직 시작 전이면 event_info 그대로 사용
          setEventInfo(mergedEventInfo);
          const endMs = mergedEventInfo.end ? mergedEventInfo.end * 1000 : mainData.endsAt;
          const timeDiff = endMs ? endMs - now : 0;
          setTimeRemaining(timeDiff > 0 ? timeDiff : 0);
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch prediction data:", error);
        setLoading(false);
      }
    };

    fetchPredictionData();

    // 2분마다 자동으로 데이터 갱신
    const intervalId = setInterval(fetchPredictionData, 120000);

    // 탭으로 다시 돌아왔을 때 즉시 갱신
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPredictionData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const formatTime = (ms) => {
    if (!ms) return "-";
    const date = new Date(ms);
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${m}. ${d}. ${h}:${min}`;
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
      currentNaturalFire, challengeScore, worldPass, mySekaiScore,
      fireCurrentLevel: currentLevel, fireRemainingExp: remainingExp, fireLiveRank: liveRank
    };
    setSurveyData(newSurveyData);

    let currentScore = parseFloat(score1 || '0') || 0;
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
  }, [score1, score2, score3, rounds1, firea, fires2, currentNaturalFire, challengeScore, worldPass, mySekaiScore, isLevelUpBonusEnabled, currentLevel, remainingExp, liveRank]);

  // Tooltip State
  const [tooltipHover, setTooltipHover] = useState(false);
  const [tooltipLock, setTooltipLock] = useState(false);
  const [naturalTooltipHover, setNaturalTooltipHover] = useState(false); // Natural Fire Result Tooltip hover
  const [naturalTooltipLock, setNaturalTooltipLock] = useState(false);   // Natural Fire Result Tooltip click lock
  const [isNaturalFireOpen, setIsNaturalFireOpen] = useState(false);     // Natural Fire Collapsible State
  const tooltipRef = React.useRef(null);
  const naturalTooltipRef = React.useRef(null);

  // Natural Fire Calculation Logic
  const calculateNaturalFireStats = () => {
    if (!eventInfo) return null;

    const now = Date.now();
    const end = eventInfo.end * 1000;

    let isWaitingForNextEvent = false;
    let fireAtNextEvent = null;
    let nextEventStartMs = null;
    let manualTargetMs = null;
    const startMs = eventInfo.start ? eventInfo.start * 1000 : 0;

    if (isNextEventFireEnabled && manualNextEventDate && manualNextEventTime) {
      // Manual Mode
      let targetDate;
      // Handle YY/MM/DD format
      if (manualNextEventDate.includes('/')) {
        const parts = manualNextEventDate.split('/');
        if (parts.length === 3) {
          const year = parseInt(parts[0].length === 2 ? '20' + parts[0] : parts[0]);
          const month = parseInt(parts[1]) - 1;
          const day = parseInt(parts[2]);
          targetDate = new Date(year, month, day);
          const [hours, minutes] = manualNextEventTime.split(':');
          targetDate.setHours(hours, minutes, 0, 0);
        }
      } else {
        // Fallback for standard YYYY-MM-DD if user somehow inputs that
        targetDate = new Date(`${manualNextEventDate}T${manualNextEventTime}`);
      }

      if (targetDate && !isNaN(targetDate.getTime())) {
        manualTargetMs = targetDate.getTime();
        if (manualTargetMs > now) {
          isWaitingForNextEvent = true;
          // For calculation, fireAtNextEvent is the accumulated natural fire until that time
          const diff = manualTargetMs - now;
          // First fire charges after remainingFireMinutes, then every 30 min
          const remainingMs = remainingFireMinutes * 60 * 1000;
          const afterFirstFire = Math.max(0, diff - remainingMs);
          const rec = afterFirstFire > 0 ? 1 + Math.floor(afterFirstFire / (30 * 60 * 1000)) : (diff >= remainingMs ? 1 : 0);
          const cur = parseInt(currentNaturalFire) || 0;
          fireAtNextEvent = cur + rec + (isLevelUpBonusEnabled ? 10 : 0);
          nextEventStartMs = manualTargetMs;
        }
      }
    } else if (!isNextEventFireEnabled) {
      // Auto Mode Logic (Only if Manual Toggle is OFF)
      let nextChapterStartMs = null;
      if (eventInfo.event_type === 'world_bloom') {
        let allChapters = [];
        if (worldBloomsInfo && worldBloomsInfo.length > 0 && eventInfo.id) {
          allChapters = worldBloomsInfo.filter(wb => wb.eventId == eventInfo.id).map(c => c.chapterStartAt);
        }
        if (allChapters.length === 0 && chaptersData && chaptersData.length > 0) {
          allChapters = chaptersData.map(c => c.start * 1000);
        }
        const upcoming = allChapters.filter(t => t > now).sort((a, b) => a - b);
        if (upcoming.length > 0) {
          nextChapterStartMs = upcoming[0];
        }
      }

      if (nextChapterStartMs) {
        nextEventStartMs = nextChapterStartMs;
        isWaitingForNextEvent = true;
      } else if (now > end) {
        const endDate = new Date(end);
        endDate.setDate(endDate.getDate() + 2);
        endDate.setHours(15, 0, 0, 0);
        nextEventStartMs = endDate.getTime();
        isWaitingForNextEvent = true;
      } else if (now < startMs) {
        // Calculate next amatsuyu acquisition start based on character birthdays
        // Acquisition period: birthday - 3 days at 0:00 to birthday at 23:59
        const today = new Date(now);
        let nextAmatsuyuStartMs = null;

        // Find the next acquisition start (birthday - 3 days at 0:00)
        for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
          for (const char of characterBirthdays) {
            const [bMonth, bDay] = char.date.split('.').map(Number);
            const bdDate = new Date(today.getFullYear() + yearOffset, bMonth - 1, bDay);
            const acqStartDate = new Date(bdDate);
            acqStartDate.setDate(acqStartDate.getDate() - 3);
            acqStartDate.setHours(0, 0, 0, 0);
            const acqStartMs = acqStartDate.getTime();

            if (acqStartMs > now) {
              if (!nextAmatsuyuStartMs || acqStartMs < nextAmatsuyuStartMs) {
                nextAmatsuyuStartMs = acqStartMs;
              }
            }
          }
          if (nextAmatsuyuStartMs) break;
        }

        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

        // If event start is 3+ days away AND amatsuyu start is within 2 days
        if (nextAmatsuyuStartMs && (startMs - now) >= threeDaysMs && (nextAmatsuyuStartMs - now) <= twoDaysMs) {
          nextEventStartMs = nextAmatsuyuStartMs;
        } else {
          nextEventStartMs = startMs;
        }
        isWaitingForNextEvent = true;
      }

      if (isWaitingForNextEvent && nextEventStartMs && nextEventStartMs > now) {
        const diff = nextEventStartMs - now;
        const rec = Math.floor(diff / (30 * 60 * 1000));
        const cur = parseInt(currentNaturalFire) || 0;
        fireAtNextEvent = cur + rec + (isLevelUpBonusEnabled ? 10 : 0);
      }
    }

    const remainingMs = Math.max(0, end - now);

    // 현재 이벤트 동안의 자연불 회복 (30분마다 1개)
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
    const baseNaturalFire = recoveryFire + loginFire + userCurrentNatural; // Base without level up

    let currentScoreVal = parseFloat(score1 || '0') || 0;
    let scPerRound = parseFloat(score3 || '2.8') || 0;
    let curFireBonus = parseInt(firea) || 0;
    let chgFireBonus = fires2;

    let fireConsumption = getFireaValue(curFireBonus);
    let finalScorePerRound = scPerRound;

    // Logic for setting up simulation parameters
    let nextConsumption = fireConsumption;
    if (chgFireBonus !== "none") {
      const newFireBonus = parseInt(chgFireBonus);
      finalScorePerRound = (scPerRound / curFireBonus) * newFireBonus;
      // Assume we use the new fire consumption for simulation if simulation is enabled
      // If user sets "Change Fire" to 3, they likely mean they are running at 3 fires.
      nextConsumption = getFireaValue(newFireBonus);
    }

    if (nextConsumption === 0) nextConsumption = 1;

    let runs = 0;
    let earnedScore = 0;
    let levelUpFire = 0;
    let totalNaturalFire = baseNaturalFire;

    // Simulation for Level Up Bonus
    if (isLevelUpBonusEnabled && currentLevel && remainingExp) {
      let simFire = baseNaturalFire;
      let simLevel = parseInt(currentLevel);
      let simExp = parseInt(remainingExp);
      let simEarnedScore = 0;

      // Rank Bonus
      let rankExpBonus = 1600; // S
      if (liveRank === 'A') rankExpBonus = 1400;
      if (liveRank === 'B') rankExpBonus = 1200;
      if (liveRank === 'C') rankExpBonus = 1000;

      let safeGuard = 0;
      const MAX_LOOPS = 20000; // Protection

      while (simFire >= nextConsumption && safeGuard < MAX_LOOPS) {
        safeGuard++;

        const xpPerRun = nextConsumption * rankExpBonus;
        // Runs needed to level up
        // Avoid division by zero
        if (xpPerRun === 0) break;

        const runsToLevel = Math.ceil(simExp / xpPerRun);
        const fireNeeded = runsToLevel * nextConsumption;

        if (simFire >= fireNeeded) {
          // Can Level Up
          simFire -= fireNeeded;
          simEarnedScore += runsToLevel * finalScorePerRound;

          // Calculate overflow exp
          const xpGained = runsToLevel * xpPerRun;
          const overflow = xpGained - simExp;

          simLevel++;
          levelUpFire += 10;
          totalNaturalFire += 10; // Included in total tracking
          simFire += 10; // Usage tracking

          // Get next level exp
          const levelData = playerLevelData.find(d => {
            // Check range
            if (d.range === String(simLevel)) return true;
            if (d.range.includes('~')) {
              const [min, max] = d.range.split('~').map(Number);
              if (simLevel >= min && simLevel <= max) return true;
            }
            return false;
          });

          if (levelData && levelData.exp) {
            simExp = levelData.exp - overflow;
            // Handle multi-level up if overflow is massive (unlikely with normal fire usage but possible)
            // For simplicity, assume one level up per batch for now as XP req scales up usually.
            if (simExp <= 0) simExp = 1;
          } else {
            // Max level or unknown
            simExp = 999999999;
          }
        } else {
          // Cannot Level Up, use all fire
          const possibleRuns = Math.floor(simFire / nextConsumption);
          simFire -= possibleRuns * nextConsumption;
          simEarnedScore += possibleRuns * finalScorePerRound;
          simExp -= possibleRuns * xpPerRun;
          // Remainder simFire is left unused (less than consumption)
        }
      }
      earnedScore = simEarnedScore;
      // recalculate runs for display if needed? 
      // Logic below uses runs = totalNaturalFire / fireConsumption for standard mode.
      // For simulation mode, earnedScore is exact.
    } else {
      runs = baseNaturalFire / nextConsumption;
      earnedScore = runs * finalScorePerRound;
    }

    if (isLevelUpBonusEnabled && currentLevel) {
      // If simulation ran, 'earnedScore' checks out.
      // We tracked 'totalNaturalFire' correctly (base + levelUpFire).
    } else {
      // Standard
      totalNaturalFire = baseNaturalFire;
    }

    // Challenge Live Logic
    const cScoreVal = parseFloat(challengeScore) || 250;
    const challengeEPPerDay = Math.floor((100 + cScoreVal / 2) * 120);
    const totalChallengeEP = challengeEPPerDay * days;

    // My Sekai Logic
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

    const mScoreVal = parseFloat(mySekaiScore) || 2500;
    const mySekaiMultiplier = worldPass ? 10 : 2;
    const mySekaiEPPerDay = Math.floor(mySekaiMultiplier * mScoreVal);
    const totalMySekaiEP = mySekaiEPPerDay * mySekaiDays;

    const scoreAfter = currentScoreVal + earnedScore + (totalChallengeEP / 10000) + (totalMySekaiEP / 10000);

    return {
      recoveryFire,
      loginFire,
      userCurrentNatural,
      totalNaturalFire,
      earnedScore,
      challengeEPPerDay,
      days,
      totalChallengeEP,
      mySekaiEPPerDay,
      mySekaiDays,
      totalMySekaiEP,
      scoreAfter,
      currentScoreVal,
      scoreAfter,
      currentScoreVal,
      levelUpFire,
      isWaitingForNextEvent,
      fireAtNextEvent,
      nextEventStartMs
    };
  };

  const naturalStats = calculateNaturalFireStats();

  const formatTargetTime = (ms) => {
    if (!ms) return '';
    const date = new Date(ms);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

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

  useEffect(() => {
    const handleClickOutsideNatural = (event) => {
      if (naturalTooltipRef.current && !naturalTooltipRef.current.contains(event.target)) {
        setNaturalTooltipLock(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideNatural);
    return () => document.removeEventListener('mousedown', handleClickOutsideNatural);
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

  const formatKoreanScore = (score) => {
    if (!score || score <= 0) return '';
    const eok = Math.floor(score / 100000000);
    const man = Math.floor((score % 100000000) / 10000);

    if (eok > 0) {
      return `${eok}억${man > 0 ? man.toLocaleString() + '만' : ''}`;
    }
    return `${man.toLocaleString()}만`;
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
      liveType = LiveType.MULTI;
      targetFireCount = savedFireCounts.envy;
      setRounds1(28);
    } else if (type === 'lost') {
      songId = 226; // Lost and Found
      difficulty = 'hard';
      liveType = LiveType.MULTI;
      liveType = LiveType.MULTI;
      targetFireCount = savedFireCounts.loAndFound;
      setRounds1(18);
    } else if (type === 'creation_myth') {
      songId = 186; // Creation Myth
      difficulty = 'master';
      liveType = LiveType.AUTO;
      shouldUseFixedSkills = true;
      shouldUseFixedSkills = true;
      targetFireCount = savedFireCounts.creationMyth;
      setRounds1(17);
    } else if (type === 'omakase') {
      songId = 572; // Omakase
      difficulty = 'master';
      liveType = LiveType.MULTI;
      liveType = LiveType.MULTI;
      targetFireCount = savedFireCounts.omakase;
      setRounds1(20);
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
      const musicMeta = getMusicMetasSync().find(m => m.music_id === songId && m.difficulty === difficulty);
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

  // [추가] 월드링크: 선택된 챕터에 따라 표시할 예측 데이터 결정
  const activePredictionData = (() => {
    if (selectedChapter === 'all' || eventInfo?.event_type !== 'world_bloom') {
      return predictionData;
    }
    const chapter = chaptersData.find(ch => ch.chapter_id === selectedChapter);
    const chapterData = chapter?.data || [];

    const rankRangeMap = new Map();
    if (chapter?.ranks) {
      chapter.ranks.forEach(rankObj => {
        const r = rankObj.rank;
        const predictionPoints = (rankObj.points || []).filter(p => p.type === 'p');
        if (predictionPoints.length > 0) {
          const latest = predictionPoints.reduce((prev, current) => (prev.ts > current.ts) ? prev : current);
          rankRangeMap.set(r, { l: latest.l || 0, u: latest.u || 0 });
        }
      });
    }

    // live_chapter_rankings 데이터를 맵으로 변환 (종합의 eventlivejp와 동일한 역할)
    let currentChapterRankings = [];
    const currentEventId = Number(eventInfo?.id || 0);
    const eventChapterLiveData = chapterLiveData.filter(ch => (
      !currentEventId || !ch.eventId || Number(ch.eventId) === currentEventId
    ));

    if (worldBloomsInfo && worldBloomsInfo.length > 0) {
      const chNum = selectedChapter.split('-')[1];
      const wbChapter = worldBloomsInfo.find(wb => (
        (!currentEventId || Number(wb.eventId) === currentEventId) &&
        Number(wb.chapterNo) === Number(chNum)
      ));
      if (wbChapter && wbChapter.gameCharacterId) {
        const chapterLiveInfo = eventChapterLiveData.find(c => (
          (c.chapterNo != null && Number(c.chapterNo) === Number(wbChapter.chapterNo)) ||
          (c.worldBloomChapterNo != null && Number(c.worldBloomChapterNo) === Number(wbChapter.chapterNo)) ||
          (c.gameCharacterId != null && Number(c.gameCharacterId) === Number(wbChapter.gameCharacterId))
        ));
        if (chapterLiveInfo) {
          const top100 = chapterLiveInfo.rankings || [];
          const borders = chapterLiveInfo.borderRankings || [];
          currentChapterRankings = [...borders, ...top100];
        }
      }
    }

    // 만약 worldBloomsInfo를 불러오지 못했거나 매핑 실패시 순서대로 폴백 (chapterLiveData가 새로운 포맷인 경우)
    if (currentChapterRankings.length === 0 && eventChapterLiveData.length > 0 && eventChapterLiveData[0].gameCharacterId) {
      const chNumStr = selectedChapter.split('-')[1];
      const chIndex = parseInt(chNumStr, 10) - 1;
      if (!isNaN(chIndex) && chIndex >= 0 && chIndex < eventChapterLiveData.length) {
        const fallbackInfo = eventChapterLiveData[chIndex];
        const top100 = fallbackInfo.rankings || [];
        const borders = fallbackInfo.borderRankings || [];
        currentChapterRankings = [...borders, ...top100];
      }
    } else if (currentChapterRankings.length === 0 && eventChapterLiveData.length > 0 && !eventChapterLiveData[0].gameCharacterId) {
      // 기존 포맷(단일 배열) 폴백
      currentChapterRankings = eventChapterLiveData;
    }
    const chapterLiveMap = new Map(currentChapterRankings.map(i => [i.rank, i]));

    // 챕터 데이터를 predictionData 형식으로 변환 및 필터링
    const chapterDataMap = new Map(
      chapterData.filter(d => allowedRanksSet.has(d.rank)).map(d => [d.rank, d])
    );

    // 모든 rank 합치기 (예측 데이터 + 라이브 데이터)
    const allRanks = new Set([...chapterDataMap.keys(), ...[...chapterLiveMap.keys()].filter(r => allowedRanksSet.has(r))]);

    return Array.from(allRanks).map(rank => {
      const chapterItem = chapterDataMap.get(rank);
      const liveItem = chapterLiveMap.get(rank);
      const rangeItem = rankRangeMap.get(rank);

      let currentScore = chapterItem?.current || 0;
      let predictedScore = chapterItem?.predicted || 0;
      let scoreDelta1h = chapterItem?.scoreDelta1h ?? null;

      const liveTs = chapterScoreLastUpdated || 0;
      const mainTs = lastUpdated || 0;

      if (liveItem) {
        scoreDelta1h = liveItem.scoreDelta1h ?? scoreDelta1h;
        if (mainTs > liveTs) {
          if (!currentScore) currentScore = liveItem.score;
        } else {
          if (liveItem.score > currentScore) currentScore = liveItem.score;
        }
      }

      return {
        rank,
        currentScore,
        predictedScore,
        scoreDelta1h,
        l: rangeItem?.l || 0,
        u: rangeItem?.u || 0
      };
    }).sort((a, b) => a.rank - b.rank);
  })();

  const scoreDeltaLayoutSignature = JSON.stringify(
    activePredictionData.map(row => [
      Math.floor(row.currentScore || 0).toLocaleString(),
      showRecentHourlySpeed ? (formatScoreDelta1h(row.scoreDelta1h) || '') : ''
    ])
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const container = rankingTableContainerRef.current;
    if (!container || !showRecentHourlySpeed) {
      setStackScoreDeltas(false);
      return undefined;
    }

    let layoutRows = [];
    try {
      layoutRows = JSON.parse(scoreDeltaLayoutSignature);
    } catch (error) {
      layoutRows = [];
    }

    if (!layoutRows.some(([, deltaText]) => deltaText)) {
      setStackScoreDeltas(false);
      return undefined;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    let animationFrameId = null;
    const evaluate = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        const tableWidth = container.getBoundingClientRect().width;
        if (!tableWidth) {
          setStackScoreDeltas(false);
          return;
        }

        const fontFamily = window.getComputedStyle(container).fontFamily || 'system-ui, sans-serif';
        const deltaFontSize = window.matchMedia('(min-width: 640px)').matches ? 10 : 9;
        const currentScoreContentWidth = (tableWidth * CURRENT_SCORE_COLUMN_RATIO) - CURRENT_SCORE_CELL_HORIZONTAL_PADDING;

        const shouldStack = layoutRows.some(([scoreText, deltaText]) => {
          context.font = `400 14px ${fontFamily}`;
          const scoreWidth = context.measureText(scoreText).width;
          if (!deltaText) return scoreWidth > currentScoreContentWidth;

          context.font = `800 ${deltaFontSize}px ${fontFamily}`;
          const deltaWidth = context.measureText(deltaText).width;
          return scoreWidth + SCORE_DELTA_INLINE_GAP + deltaWidth > currentScoreContentWidth;
        });

        setStackScoreDeltas(shouldStack);
      });
    };

    evaluate();

    const observer = window.ResizeObserver ? new window.ResizeObserver(evaluate) : null;
    if (observer) observer.observe(container);
    window.addEventListener('resize', evaluate);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', evaluate);
    };
  }, [scoreDeltaLayoutSignature, showRecentHourlySpeed]);

  return (

    <div id="fire-tab-content" className="p-4 space-y-4">


      {/* Input Section */}
      {/* Input Section - 2 Column Grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 w-[85%] max-w-[260px] mx-auto mb-2">

        {/* Row 1 */}
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-1">
            <label className="text-gray-600 text-xs font-bold leading-none">{t('fire.current_score')}</label>
          </div>
          <div className="flex items-center gap-1 w-full justify-center">
            <input
              type="number"
              value={score1}
              onChange={e => {
                const val = parseFloat(e.target.value);
                if (val > 40000) {
                  setScore1('40000');
                } else {
                  setScore1(e.target.value);
                }
              }}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-shadow"
            />
            <span className="text-xs text-gray-500 whitespace-nowrap">{t('fire.suffix_man')}</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-1">
            <label className="text-gray-600 text-xs font-bold leading-none">{t('fire.target_score')}</label>
          </div>
          <div className="flex items-center gap-1 w-full justify-center">
            <input
              type="number"
              value={score2}
              onChange={e => {
                const val = parseFloat(e.target.value);
                if (val > 40000) {
                  setScore2('40000');
                } else {
                  setScore2(e.target.value);
                }
              }}
              onFocus={(e) => e.target.select()}
              placeholder="3000"
              className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-shadow"
            />
            <span className="text-xs text-gray-500 whitespace-nowrap">{t('fire.suffix_man')}</span>
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex flex-col items-center relative z-20"> {/* z-20 for dropdown */}
          <div className="flex items-center justify-center gap-1 relative">
            <label className="text-gray-600 text-xs font-bold leading-none">{t('fire.score_per_round')}</label>
            <button
              onClick={() => setImportMenuOpen(!importMenuOpen)}
              className="text-gray-400 hover:text-indigo-600 transition-colors"
              title={t('fire.import_title')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            {/* Import Menu Popover */}
            {importMenuOpen && (
              <div ref={importMenuRef} className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-gray-100 p-2 w-40 animate-fade-in-down text-left">
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
          <div className="flex items-center gap-1 w-full justify-center">
            <input
              type="number"
              value={score3}
              onChange={e => {
                const val = parseFloat(e.target.value);
                if (val > 14) {
                  setScore3('14');
                } else {
                  setScore3(e.target.value);
                }
              }}
              onFocus={(e) => e.target.select()}
              placeholder="2.8"
              className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-shadow"
            />
            <span className="text-xs text-gray-500 whitespace-nowrap">{t('fire.suffix_man')}</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-1 mb-1.5 relative" ref={tooltipRef}>
            <label className="text-gray-600 text-xs font-bold leading-none">{t('fire.rounds_per_interval')}</label>
            <div
              className="cursor-pointer"
              onMouseEnter={() => setTooltipHover(true)}
              onMouseLeave={() => setTooltipHover(false)}
              onClick={() => setTooltipLock(!tooltipLock)}
            >
              <div className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center transition-colors ${isTooltipVisible ? 'bg-indigo-100 text-indigo-600 font-bold' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>?</div>

              {isTooltipVisible && (
                <div className="absolute bottom-full mb-2 right-[-20px] w-48 p-3 bg-white text-gray-800 text-xs rounded-lg shadow-xl border border-gray-200 z-50 font-normal text-left whitespace-pre-line leading-relaxed">
                  <span className="font-bold block mb-1 border-b border-gray-100 pb-1">{t('fire.approx_rounds')}</span>
                  <div className="space-y-0.5">
                    <div className="flex justify-between"><span>{t('power.songs.envy')}:</span><span className="font-bold text-indigo-600">26 ~ 30</span></div>
                    <div className="flex justify-between"><span>{t('power.songs.lost_and_found')}:</span><span className="font-bold text-indigo-600">17 ~ 19</span></div>
                    <div className="flex justify-between"><span>{t('fire.cheerful')}:</span><span className="font-bold text-indigo-600">15 ~ 17</span></div>
                  </div>
                  <div className="absolute top-full right-[26px] border-8 border-transparent border-t-white drop-shadow-sm"></div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 w-full justify-center">
            <input
              type="number"
              value={rounds1}
              onChange={e => {
                const val = parseInt(e.target.value);
                if (val > 40) {
                  setRounds1('40');
                } else {
                  setRounds1(e.target.value);
                }
              }}
              onFocus={(e) => e.target.select()}
              placeholder="28"
              className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-shadow"
            />
            <span className="text-xs text-gray-500 whitespace-nowrap">{t('fire.rounds_suffix')}</span>
          </div>
        </div>

        {/* Row 3 */}
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-1">
            <label className="text-gray-600 text-xs font-bold leading-none">{t('fire.current_fire')}</label>
          </div>
          <select
            value={firea}
            onChange={e => setFirea(e.target.value)}
            className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium appearance-none"
            style={{ backgroundImage: 'none' }} // Remove default arrow if needed, or keep standard
          >
            {[
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
            ].map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-1">
            <label className="text-gray-600 text-xs font-bold leading-none">{t('fire.change_fire')}</label>
          </div>
          <select
            value={fires2}
            onChange={e => setFires2(e.target.value)}
            className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium appearance-none"
          >
            {[
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
            ].map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

      </div>
      {/* Natural Fire Input Box - New Blue Box */}
      {/* Natural Fire Toggle Button */}
      <div className="w-[85%] max-w-[260px] mx-auto mb-2">
        <button
          onClick={() => setIsNaturalFireOpen(!isNaturalFireOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors border border-indigo-100 group"
        >
          <span className="text-xs font-bold flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.398-2.354 0-.468-.314-.688-.61-.644a1.005 1.005 0 00-.154.032c-.31.08-.605.178-.885.29-.832.332-1.574.87-2.072 1.543-.523.708-.758 1.59-.653 2.547.098.895.503 1.706 1.055 2.373a4.034 4.034 0 002.328 1.48c.066.302.164.594.296.87.567 1.185 1.547 1.956 2.618 2.327.35.122.707.198 1.065.232a4.43 4.43 0 00.322.012c.16 0 .32-.008.48-.024a4.444 4.444 0 003.575-2.274 4.07 4.07 0 00-.472-4.475c-.328-.358-.57-.753-.733-1.157a5.534 5.534 0 01-.322-1.565c0-.66.075-1.306.216-1.93.14-.626.347-1.233.615-1.81.258-.553.535-1.026.82-1.42s.562-.693.811-.884zM7.5 13a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clipRule="evenodd" />
            </svg>
            {t('fire.natural_fire')}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transform transition-transform duration-200 ${isNaturalFireOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Natural Fire Input Box - New Blue Box */}
      {isNaturalFireOpen && (
        <div className="w-[85%] max-w-[260px] mx-auto mb-2 animate-fade-in">
          <div className="bg-indigo-50 rounded-xl p-2 border border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-200"></div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-1">
              {/* Current Natural Fire Input */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center gap-1">
                  <label className="text-gray-600 text-xs font-bold leading-none">{t('fire.current_natural_fire')}</label>
                </div>
                <input
                  type="number"
                  value={currentNaturalFire}
                  onChange={(e) => setCurrentNaturalFire(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                  className={`w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-shadow ${currentNaturalFire === '' ? 'text-gray-400' : 'text-gray-900'}`}
                />
              </div>
              {/* Challenge Score Input (Man) */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center gap-1">
                  <label className="text-gray-600 text-xs font-bold leading-none">{t('fire.challenge_live_score')}</label>
                </div>
                <div className="flex items-center gap-1 w-full justify-center">
                  <input
                    type="number"
                    value={challengeScore}
                    onChange={(e) => setChallengeScore(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="250"
                    className={`w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-shadow ${challengeScore === '' ? 'text-gray-400' : 'text-gray-900'}`}
                  />
                  <span className="text-xs text-gray-500 whitespace-nowrap">{t('fire.suffix_man')}</span>
                </div>
              </div>

              {/* My Sekai Score Input */}
              <div className="flex flex-col items-center relative col-span-2">
                <div className="flex items-center gap-4 w-full justify-center">
                  <div className="flex flex-col items-center w-1/2 max-w-[100px]">
                    <div className="flex items-center justify-center">
                      <label className="text-gray-600 text-xs font-bold leading-none">{t('fire.my_sekai_score')}</label>
                      <button
                        onClick={importMySekaiForPrediction}
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
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
                      onFocus={(e) => e.target.select()}
                      placeholder="2500"
                      className={`w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-shadow ${mySekaiScore === '' ? 'text-gray-400' : 'text-gray-900'}`}
                    />
                  </div>

                  {/* World Pass Toggle */}
                  <div className="flex flex-col items-center justify-end h-full w-1/2 max-w-[100px] pb-1">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-600 font-bold select-none whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={worldPass}
                        onChange={(e) => setWorldPass(e.target.checked)}
                        className="h-3.5 w-3.5 accent-indigo-600"
                      />
                      {t('fire.world_pass')}
                    </label>
                  </div>
                </div>
              </div>
            </div>
            {/* Toggles Row */}
            <div className="border-t border-indigo-100 pt-2 mt-2 pb-1 flex justify-center items-center gap-4">
              {/* Level Up Bonus Toggle */}
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isLevelUpBonusEnabled}
                  onChange={(e) => setIsLevelUpBonusEnabled(e.target.checked)}
                  className="h-3.5 w-3.5 accent-indigo-600"
                />
                {t('fire.levelup_bonus_toggle')}
              </label>

              <div className="h-4 w-px bg-gray-200"></div>

              {/* Next Event Fire Toggle */}
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isNextEventFireEnabled}
                  onChange={(e) => {
                    const checked = e.target.value === 'true' || e.target.checked;
                    setIsNextEventFireEnabled(checked);

                    // Auto-fill logic when manually enabling
                    if (checked && eventInfo) {
                      const now = Date.now();
                      const end = eventInfo.end * 1000;
                      // Calculate target: If event ended, or during event -> End + 2 days 15:00
                      // If before event -> Actual next start
                      let targetMs = null;
                      const startMs = eventInfo.start ? eventInfo.start * 1000 : 0;

                        let nextChapterStartMs = null;
                        if (eventInfo.event_type === 'world_bloom') {
                          let allChapters = [];
                          if (worldBloomsInfo && worldBloomsInfo.length > 0 && eventInfo.id) {
                            allChapters = worldBloomsInfo.filter(wb => wb.eventId == eventInfo.id).map(c => c.chapterStartAt);
                          }
                          if (allChapters.length === 0 && chaptersData && chaptersData.length > 0) {
                            allChapters = chaptersData.map(c => c.start * 1000);
                          }
                          const upcoming = allChapters.filter(t => t > now).sort((a, b) => a - b);
                          if (upcoming.length > 0) {
                            nextChapterStartMs = upcoming[0];
                          }
                        }

                        if (nextChapterStartMs) {
                          targetMs = nextChapterStartMs;
                        } else if (now < startMs) {
                          // Before event - check if we should show amatsuyu start instead
                          const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
                          const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

                          // Find next amatsuyu acquisition start (birthday - 3 days at 0:00)
                          let nextAmatsuyuStartMs = null;
                          const today = new Date(now);

                          for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
                            for (const char of characterBirthdays) {
                              const [bMonth, bDay] = char.date.split('.').map(Number);
                              const bdDate = new Date(today.getFullYear() + yearOffset, bMonth - 1, bDay);
                              const acqStartDate = new Date(bdDate);
                              acqStartDate.setDate(acqStartDate.getDate() - 3);
                              acqStartDate.setHours(0, 0, 0, 0);
                              const acqStartMs = acqStartDate.getTime();

                              if (acqStartMs > now) {
                                if (!nextAmatsuyuStartMs || acqStartMs < nextAmatsuyuStartMs) {
                                  nextAmatsuyuStartMs = acqStartMs;
                                }
                              }
                            }
                            if (nextAmatsuyuStartMs) break;
                          }

                          // If event start is 3+ days away AND amatsuyu start is within 2 days
                          if (nextAmatsuyuStartMs && (startMs - now) >= threeDaysMs && (nextAmatsuyuStartMs - now) <= twoDaysMs) {
                            targetMs = nextAmatsuyuStartMs;
                          } else {
                            targetMs = startMs;
                          }
                        } else {
                          // During or After event -> Check amatsuyu first, else End + 2 days
                          const endDate = new Date(end);
                          endDate.setDate(endDate.getDate() + 2);
                          endDate.setHours(15, 0, 0, 0);
                          const defaultTargetMs = endDate.getTime();

                          const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
                          const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

                          // Find next amatsuyu acquisition start (birthday - 3 days at 0:00)
                          let nextAmatsuyuStartMs = null;
                          const today = new Date(now);

                          for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
                            for (const char of characterBirthdays) {
                              const [bMonth, bDay] = char.date.split('.').map(Number);
                              const bdDate = new Date(today.getFullYear() + yearOffset, bMonth - 1, bDay);
                              const acqStartDate = new Date(bdDate);
                              acqStartDate.setDate(acqStartDate.getDate() - 3);
                              acqStartDate.setHours(0, 0, 0, 0);
                              const acqStartMs = acqStartDate.getTime();

                              if (acqStartMs > now) {
                                if (!nextAmatsuyuStartMs || acqStartMs < nextAmatsuyuStartMs) {
                                  nextAmatsuyuStartMs = acqStartMs;
                                }
                              }
                            }
                            if (nextAmatsuyuStartMs) break;
                          }

                          // If default target is 3+ days away AND amatsuyu start is within 2 days
                          if (nextAmatsuyuStartMs && (defaultTargetMs - now) >= threeDaysMs && (nextAmatsuyuStartMs - now) <= twoDaysMs) {
                            targetMs = nextAmatsuyuStartMs;
                          } else {
                            targetMs = defaultTargetMs;
                          }
                        }

                        if (targetMs) {
                          const date = new Date(targetMs);
                          const yy = String(date.getFullYear()).slice(-2);
                          const mm = String(date.getMonth() + 1).padStart(2, '0');
                          const dd = String(date.getDate()).padStart(2, '0');
                          setManualNextEventDate(`${yy}/${mm}/${dd}`);
                          const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                          setManualNextEventTime(timeStr);
                        }
                      }
                  }}
                  className="h-3.5 w-3.5 accent-purple-500"
                />
                {t('fire.next_event_fire_toggle')}
              </label>
            </div>

            {/* Level Up Inputs */}
            {isLevelUpBonusEnabled && (
              <div className="grid grid-cols-3 gap-2 animate-fade-in px-1 mb-2">
                {/* Current Level */}
                <div className="flex flex-col items-center">
                  <label className="text-[9px] text-gray-500 font-bold mb-0.5">{t('fire.player_level')}</label>
                  <input
                    type="number"
                    value={currentLevel}
                    onChange={(e) => setCurrentLevel(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="300"
                    className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-1 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {/* XP Left */}
                <div className="flex flex-col items-center">
                  <label className="text-[9px] text-gray-500 font-bold mb-0.5">{t('fire.player_remaining_exp')}</label>
                  <input
                    type="number"
                    value={remainingExp}
                    onChange={(e) => setRemainingExp(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="5000"
                    className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-1 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {/* Live Rank */}
                <div className="flex flex-col items-center">
                  <label className="text-[9px] text-gray-500 font-bold mb-0.5">{t('fire.player_live_rank')}</label>
                  <select
                    value={liveRank}
                    onChange={(e) => setLiveRank(e.target.value)}
                    className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-1 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 h-[26px]"
                  >
                    <option value="S">S</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>
            )}

            {/* Next Event Fire Inputs - Manual Date/Time */}
            {isNextEventFireEnabled && (
              <div className="flex flex-col gap-1.5 animate-fade-in px-3 mb-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-gray-600 font-bold whitespace-nowrap">{t('fire.next_event_date')}</label>
                  <input
                    type="date"
                    value={(() => {
                      if (!manualNextEventDate) return '';
                      const parts = manualNextEventDate.split('/');
                      if (parts.length === 3) {
                        return `20${parts[0]}-${parts[1]}-${parts[2]}`;
                      }
                      return '';
                    })()}
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value);
                        const yy = String(date.getFullYear()).slice(-2);
                        const mm = String(date.getMonth() + 1).padStart(2, '0');
                        const dd = String(date.getDate()).padStart(2, '0');
                        setManualNextEventDate(`${yy}/${mm}/${dd}`);
                      }
                    }}
                    className="flex-1 max-w-[140px] text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 h-[26px]"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-gray-600 font-bold whitespace-nowrap">{t('fire.next_event_time')}</label>
                  <input
                    type="time"
                    value={manualNextEventTime}
                    onChange={(e) => setManualNextEventTime(e.target.value)}
                    className="flex-1 max-w-[140px] text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 h-[26px]"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-gray-600 font-bold whitespace-nowrap">{t('fire.remaining_fire_time')}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={remainingFireMinutes === 30 ? '' : remainingFireMinutes}
                      placeholder="30"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const rawVal = e.target.value;
                        if (rawVal === '') {
                          setRemainingFireMinutes(30);
                        } else {
                          const val = Math.min(30, Math.max(1, parseInt(rawVal) || 1));
                          setRemainingFireMinutes(val);
                        }
                      }}
                      className="w-16 text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 h-[26px] placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs text-gray-600">{t('fire.minutes_suffix')}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
          <div className="text-[9px] text-gray-400 text-center mt-2">
            {t('fire.prediction_disclaimer')}
            <div className="mt-0.5">{t('fire.prediction_disclaimer_note')}</div>
          </div>
        </div>
      )
      }

      {/* Result Section - Amatsuyu Style */}
      <div className="w-[85%] max-w-[300px] mx-auto space-y-4">
        <div className="bg-white rounded-lg p-3">
          {/* Natural Fire Score Result Row */}
          {naturalStats && isNaturalFireOpen && (
            <div className="grid grid-cols-2 items-center mb-1 text-center border-b border-gray-100 pb-1 animate-fade-in">
              <div className="flex items-center justify-center gap-1 relative" ref={naturalTooltipRef}>
                <span className="text-gray-600">{t('fire.natural_score_row')}</span>
                <div
                  className="cursor-pointer"
                  onMouseEnter={() => setNaturalTooltipHover(true)}
                  onMouseLeave={() => setNaturalTooltipHover(false)}
                  onClick={() => setNaturalTooltipLock(!naturalTooltipLock)}
                >
                  <div className={`w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center transition-colors ${(naturalTooltipHover || naturalTooltipLock) ? 'bg-indigo-100 text-indigo-600 font-bold' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>?</div>

                  {/* Detailed Tooltip */}
                  {(naturalTooltipHover || naturalTooltipLock) && (
                    <div className="absolute bottom-full mb-2 left-0 w-64 p-3 bg-white text-gray-800 text-xs rounded-lg shadow-xl border border-gray-200 z-50 font-normal text-left whitespace-nowrap leading-relaxed">
                      <div className="space-y-1.5">
                        {/* Current EP */}
                        <div>
                          <span className="text-gray-600 block">{t('fire.current_ep')} <span className="text-gray-900 font-bold">{Math.floor(naturalStats.currentScoreVal).toLocaleString()}</span>{t('fire.suffix_man')}</span>
                        </div>

                        {/* Natural Fire Live EP */}
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-indigo-600 font-bold">{t('fire.natural_live_ep')}</span>
                            <span className="font-bold">{naturalStats.earnedScore.toFixed(1)}{t('fire.suffix_man')}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 pl-1">
                            {naturalStats.recoveryFire}{t('fire.fire_suffix')} + {t('fire.ad_bonus')} {naturalStats.loginFire}{t('fire.fire_suffix')} {naturalStats.userCurrentNatural > 0 ? `+ ${naturalStats.userCurrentNatural}${t('fire.fire_suffix')} ` : ''} {naturalStats.levelUpFire > 0 ? `+ ${t('fire.levelup_bonus')} ${naturalStats.levelUpFire}${t('fire.fire_suffix')} ` : ''}
                          </div>
                        </div>

                        {/* Challenge EP */}
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-indigo-600 font-bold">{t('fire.challenge_ep')}</span>
                            <span className="font-bold">{(naturalStats.totalChallengeEP / 10000).toFixed(1)}{t('fire.suffix_man')}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 pl-1">
                            {Math.floor(naturalStats.challengeEPPerDay).toLocaleString()}P × {naturalStats.days}{t('fire.days_suffix')}
                          </div>
                        </div>

                        {/* MySekai EP */}
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-indigo-600 font-bold">{t('fire.mysekai_ep')}</span>
                            <span className="font-bold">{(naturalStats.totalMySekaiEP / 10000).toFixed(1)}{t('fire.suffix_man')}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 pl-1">
                            {Math.floor(naturalStats.mySekaiEPPerDay).toLocaleString()}P × {naturalStats.mySekaiDays}{t('fire.days_suffix')}
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-full left-[14px] border-8 border-transparent border-t-white drop-shadow-sm"></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="font-bold text-indigo-600 leading-none">{naturalStats.scoreAfter.toFixed(1)}{t('fire.suffix_man')}</span>
                <span className="text-[10px] text-gray-400 mt-0.5 leading-none">
                  {(naturalStats.currentScoreVal).toFixed(1)} + {(naturalStats.earnedScore + (naturalStats.totalChallengeEP / 10000) + (naturalStats.totalMySekaiEP / 10000)).toFixed(1)}
                </span>
              </div>
            </div>
          )}

          {/* Next Event Fire Row - Separate from Natural Fire Score */}
          {naturalStats && isNaturalFireOpen && naturalStats.isWaitingForNextEvent && naturalStats.fireAtNextEvent !== null && (
            <div className="grid grid-cols-2 items-center mb-1 text-center border-b border-gray-100 pb-1 animate-fade-in">
              <span className="text-gray-600">{t('fire.next_event_fire_row')}</span>
              <div className="flex flex-col items-center">
                {(() => {
                  // Calculate how many fire to use to reach 50 within 30 min of event start
                  const cur = parseInt(currentNaturalFire) || 0;
                  const eventStartMs = naturalStats.nextEventStartMs;
                  const targetTime30AfterStart = eventStartMs + 30 * 60 * 1000;

                  // Time from now until 30 min after event start
                  const msUntilTarget = targetTime30AfterStart - Date.now();
                  if (msUntilTarget <= 0) {
                    return (
                      <>
                        <span className="text-xs text-pink-400">
                          {t('fire.event_started')}
                        </span>
                        <span className="text-[8px] text-pink-400">
                          ({formatTargetTime(eventStartMs)} {t('fire.basis')})
                        </span>
                      </>
                    );
                  }

                  // remainingFireMinutes: 첫 불 충전까지 남은 분
                  // 불 사용하면 타이머가 remainingFireMinutes 후 첫 충전, 이후 30분마다 충전
                  const firstFireMs = remainingFireMinutes * 60 * 1000;

                  // msUntilTarget 동안 회복되는 불: 첫 불(remainingFireMinutes 후) + 이후 30분마다
                  let recoveryFromNow = 0;
                  if (msUntilTarget >= firstFireMs) {
                    recoveryFromNow = 1 + Math.floor((msUntilTarget - firstFireMs) / (30 * 60 * 1000));
                  }

                  // To reach 50 at event+30min:
                  // Final = (cur - X) + recoveryFromNow = 50
                  // X = cur + recoveryFromNow - 50
                  const optimalUse = Math.max(0, cur + recoveryFromNow - 50);
                  const afterUse = cur - optimalUse;

                  // Calculate when exactly we reach 50 after using optimalUse
                  const neededRecovery = 50 - afterUse;
                  // 첫 불은 remainingFireMinutes 후, 이후로는 30분마다
                  const msToReach50 = firstFireMs + Math.max(0, (neededRecovery - 1) * 30 * 60 * 1000);
                  const timeAt50 = Date.now() + msToReach50;

                  // Format time for target (either 50 or max reachable)
                  const reach50Time = new Date(Math.min(timeAt50, targetTime30AfterStart));
                  const timeStr = `${reach50Time.getHours().toString().padStart(2, '0')}:${reach50Time.getMinutes().toString().padStart(2, '0')}`;

                  // Calculate actual fire at displayed time (if cannot reach 50)
                  const finalFire = afterUse + recoveryFromNow;
                  const displayFire = Math.min(50, finalFire);

                  return (
                    <>
                      <span className="text-xs text-pink-600">
                        <span className="font-bold">{optimalUse}{t('fire.fire_suffix')}</span> {t('fire.use_to_cap')}
                      </span>
                      <span className="text-xs text-pink-600">
                        <span className="font-bold">{timeStr}</span>{t('fire.fire_cap_time').replace('50', displayFire.toString())}
                      </span>
                      <span className="text-[8px] text-pink-600">
                        ({formatTargetTime(eventStartMs)} {t('fire.basis')})
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="text-center text-[10px] text-gray-400 mt-2 mb-1 pt-1 w-full block">
            {t('fire.until_target')}
          </div>

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
      <div className={`w-[95%] sm:w-[90%] max-w-[340px] mx-auto flex justify-between mt-0.5 items-center gap-2`} ref={dropdownRef}>
        <div className="flex gap-1 sm:gap-1.5">
          {/* Ranking Board Button */}
          <button
            onClick={() => window.open('https://run.rilaksekai.com/', '_blank')}
            className="bg-white hover:bg-pink-50 text-pink-500 hover:text-pink-600 border border-pink-100 hover:border-pink-200 px-1.5 sm:px-2 py-1.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1 sm:gap-1.5"
            title={t('fire.ranking_board')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span className="text-[10px] font-bold leading-none pt-[1px]">{t('fire.ranking_board')}</span>
          </button>
          {/* Refresh Button */}
          <button
            onClick={() => window.open('https://run.rilaksekai.com/refresh', '_blank')}
            className="bg-white hover:bg-blue-50 text-blue-500 hover:text-blue-600 border border-blue-100 hover:border-blue-200 px-1.5 sm:px-2 py-1.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1 sm:gap-1.5"
            title={t('fire.refresh')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            <span className="text-[10px] font-bold leading-none pt-[1px]">{t('fire.refresh')}</span>
          </button>
        </div>
        <div className="flex gap-1 sm:gap-2 items-center">

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
                  <div className="flex flex-col items-start min-w-max gap-1">
                    <div className="flex flex-col w-full">
                      <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium leading-none mb-0.5">
                        {t('fire.last_updated')}
                      </span>
                      <span className="text-[10px] sm:text-xs text-black font-extrabold tabular-nums">
                        {lastUpdated ? formatTime(lastUpdated) : "-"}
                      </span>
                    </div>
                    {currentScoreLastUpdated && (
                      <div className="flex flex-col pt-1 border-t border-gray-100 w-full">
                        <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium leading-none mb-0.5">
                          {t('fire.current_score_updated')}
                        </span>
                        <span className="text-[10px] sm:text-xs text-black font-extrabold tabular-nums">
                          {formatTime(
                            selectedChapter !== 'all' && chapterScoreLastUpdated
                              ? Math.max(chapterScoreLastUpdated, lastUpdated || 0)
                              : Math.max(currentScoreLastUpdated, lastUpdated || 0)
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Event Name (Center) - Replaced with Banner */}
                  <div className="flex-1 text-center px-0.5 sm:px-1 min-w-0 flex justify-center z-10 -my-3 relative">
                    <img
                      src={`https://asset.rilaksekai.com/event_story/${eventInfo.asname}/screen_image/banner_event_story.webp`}
                      alt={eventInfo.name}
                      className="h-[80px] w-auto max-w-[140%] sm:max-w-lg shadow-lg object-cover transform scale-105"
                      style={{
                        clipPath: 'inset(5px round 15px)',
                        maskImage: 'linear-gradient(to bottom, transparent 5%, black 15%, black 85%, transparent 95%), linear-gradient(to right, transparent 5%, black 15%, black 85%, transparent 95%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 5%, black 15%, black 85%, transparent 95%), linear-gradient(to right, transparent 5%, black 15%, black 85%, transparent 95%)',
                        maskComposite: 'intersect',
                        WebkitMaskComposite: 'source-in'
                      }}
                    />
                  </div>

                  {/* Ends In (Right) */}
                  <div className="flex flex-col items-end min-w-max">
                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium leading-none mb-0.5 sm:mb-1">
                      {(() => {
                        if (selectedChapter !== 'all') {
                          const now = Date.now();
                          let chStartMs = null;
                          let chEndMs = null;
                          const selChapter = chaptersData.find(ch => ch.chapter_id === selectedChapter);
                          if (selChapter && selChapter.start && selChapter.end) {
                            chStartMs = selChapter.start * 1000;
                            chEndMs = selChapter.end * 1000;
                          } else if (eventInfo?.id) {
                            const chNum = selectedChapter.split('-')[1];
                            const wbChapter = worldBloomsInfo.find(wb => wb.eventId == eventInfo.id && wb.chapterNo == chNum);
                            if (wbChapter) {
                              chStartMs = wbChapter.chapterStartAt;
                              chEndMs = wbChapter.chapterEndAt;
                            }
                          }

                          if (chStartMs && now < chStartMs) return t('fire.chapter_starts_in');
                          if (chEndMs && now >= chEndMs) return t('fire.chapter_ended');
                          return t('fire.chapter_ends_in') || t('fire.ends_in');
                        }
                        return t('fire.ends_in');
                      })()}
                    </span>
                    <span className="text-[10px] sm:text-xs text-indigo-600 font-extrabold tracking-tight">
                      {(() => {
                        if (selectedChapter !== 'all') {
                          const now = Date.now();
                          let chStartMs = null;
                          let chEndMs = null;
                          const selChapter = chaptersData.find(ch => ch.chapter_id === selectedChapter);
                          if (selChapter && selChapter.start && selChapter.end) {
                            chStartMs = selChapter.start * 1000;
                            chEndMs = selChapter.end * 1000;
                          } else if (eventInfo?.id) {
                            const chNum = selectedChapter.split('-')[1];
                            const wbChapter = worldBloomsInfo.find(wb => wb.eventId == eventInfo.id && wb.chapterNo == chNum);
                            if (wbChapter) {
                              chStartMs = wbChapter.chapterStartAt;
                              chEndMs = wbChapter.chapterEndAt;
                            }
                          }

                          if (chStartMs && now < chStartMs) {
                            return formatDuration(chStartMs - now);
                          } else if (chEndMs && now < chEndMs) {
                            const refTime = Math.max(lastUpdated || 0, chapterScoreLastUpdated || 0) || now;
                            return formatDuration(chEndMs - refTime);
                          } else if (chEndMs && now >= chEndMs) {
                            return '-';
                          }
                        }
                        // 종합 (기존 로직)
                        if (eventInfo && lastUpdated) {
                          return formatDuration((eventInfo.end * 1000) - lastUpdated);
                        }
                        return timeRemaining !== null ? formatDuration(timeRemaining) : null;
                      })()}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {(() => {
                  let startSec, totalHours, currentTs;

                  // 챕터 선택 시 해당 챕터의 시간 범위 사용
                  if (selectedChapter !== 'all') {
                    // 1) chaptersData에서 찾기
                    const selChapter = chaptersData.find(ch => ch.chapter_id === selectedChapter);
                    if (selChapter && selChapter.start && selChapter.end) {
                      startSec = selChapter.start;
                      totalHours = (selChapter.end - selChapter.start) / 3600;
                      const maxTs = Math.max(lastUpdated || 0, chapterScoreLastUpdated || 0);
                      currentTs = maxTs > 0 ? maxTs / 1000 : Date.now() / 1000;
                    }

                    // 2) worldBloomsInfo에서 찾기 (fallback)
                    if (!startSec && eventInfo?.id) {
                      const chNum = selectedChapter.split('-')[1];
                      const wbChapter = worldBloomsInfo.find(wb => wb.eventId == eventInfo.id && wb.chapterNo == chNum);
                      if (wbChapter && wbChapter.chapterStartAt && wbChapter.chapterEndAt) {
                        startSec = wbChapter.chapterStartAt / 1000;
                        totalHours = (wbChapter.chapterEndAt - wbChapter.chapterStartAt) / 3600000;
                        const maxTs = Math.max(lastUpdated || 0, chapterScoreLastUpdated || 0);
                        currentTs = maxTs > 0 ? maxTs / 1000 : Date.now() / 1000;
                      }
                    }
                  }

                  // 종합 (기존 로직)
                  if (!startSec) {
                    startSec = eventInfo.start;
                    totalHours = eventInfo.len;
                    const maxTs = Math.max(lastUpdated || 0, currentScoreLastUpdated || 0);
                    currentTs = maxTs > 0 ? maxTs / 1000 : Date.now() / 1000;
                  }

                  const rawElapsedHours = Math.max(0, (currentTs - startSec) / 3600);
                  const elapsedHours = Math.min(rawElapsedHours, totalHours);
                  const progress = totalHours > 0 ? Math.min(100, Math.max(0, (elapsedHours / totalHours) * 100)) : 0;

                  return (
                    <div className="relative w-full h-6 bg-gray-200 rounded-lg overflow-hidden shadow-inner mt-0">
                      <div
                        className={`absolute top-0 left-0 h-full transition-all duration-500 ${selectedChapter !== 'all'
                            ? 'bg-gradient-to-r from-purple-400 to-fuchsia-500'
                            : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                          }`}
                        style={{ width: `${progress}% ` }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] z-10 leading-none pb-[1px]">
                        {elapsedHours.toFixed(1)}h / {totalHours.toFixed(1)}h ({progress.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })()}

                {/* Stale Warning */}
                {staleWarning && (
                  <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-600 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold text-center animate-pulse flex items-center justify-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{language === 'ko' ? '데이터 갱신 시간이 1일 이상 차이나 예측이 부정확할 수 있습니다.' : 'Prediction data might be outdated due to sync delay (>24h).'}</span>
                  </div>
                )}
              </div>
            ) : (
              <h3 className="font-bold text-gray-700 text-center mb-2">{t('fire.event_predictions')}</h3>
            )}

            {/* Fallback Timing Info for when No Event Info (Optional, but kept for safety) */}
            {!eventInfo && (
              <div className="flex justify-between items-center text-xs mt-2 text-gray-500 px-1">
                <span>
                  <div className="text-[10px] text-black font-medium tabular-nums">
                    {lastUpdated && <div>{`${t('fire.last_updated')}: ${formatTime(lastUpdated)}`}</div>}
                    {currentScoreLastUpdated && <div>{`${t('fire.current_score_updated')}: ${formatTime(currentScoreLastUpdated)}`}</div>}
                  </div>
                </span>
                <span>
                  {timeRemaining !== null && `${t('fire.ends_in')}: ${formatDuration(timeRemaining)} `}
                </span>
              </div>
            )}

          </div>

          {/* [추가] World Link Chapter Selector */}
          {/* [추가] World Link Chapter Selector — worldBloomsInfo 기반 전체 챕터 표시 */}
          {(() => {
            // worldBloomsInfo에서 현재 이벤트의 모든 챕터 추출
            const eventChaptersFromWB = eventInfo?.id
              ? worldBloomsInfo
                .filter(wb => wb.eventId == eventInfo.id)
                .sort((a, b) => a.chapterNo - b.chapterNo)
              : [];

            // 챕터 목록: worldBloomsInfo 우선, 없으면 chaptersData 사용
            const hasWBChapters = eventChaptersFromWB.length > 0;
            const showSelector = hasWBChapters || chaptersData.length > 0;

            if (!showSelector) return null;

            return (
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-purple-600">🌐 {t('fire.world_link_chapters')}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedChapter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${selectedChapter === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {t('fire.chapter_all')}
                  </button>

                  {hasWBChapters ? (
                    // worldBloomsInfo 기반: 이벤트의 모든 챕터 표시
                    eventChaptersFromWB.map((wbChapter) => {
                      const now = Date.now();
                      const chStart = wbChapter.chapterStartAt || 0;
                      const chEnd = wbChapter.chapterEndAt || 0;
                      const isActive = now >= chStart && now < chEnd;
                      const isEnded = now >= chEnd;
                      const chapterNum = wbChapter.chapterNo;

                      // chaptersData에서 매칭되는 챕터 찾기 (선택 시 데이터 표시용)
                      const matchedChapter = chaptersData.find(ch => {
                        const chNum = ch.chapter_id?.split('-')[1];
                        return chNum == chapterNum;
                      });
                      const chapterId = matchedChapter?.chapter_id || `wl-${chapterNum}`;

                      // gameCharacterId로 캐릭터 데이터 찾기
                      let charData = null;
                      if (wbChapter.gameCharacterId) {
                        const charIdStr = String(wbChapter.gameCharacterId).padStart(2, '0');
                        charData = characterBirthdays.find(b => b.image === charIdStr);
                      }

                      const displayName = charData
                        ? (language === 'en' ? charData.nameEn : (language === 'ja' ? charData.nameJa : charData.nameKo))
                        : `Ch.${chapterNum}`;

                      return (
                        <button
                          key={wbChapter.id || chapterId}
                          onClick={() => setSelectedChapter(chapterId)}
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 border-b-[3px] active:border-b-0 active:translate-y-[3px] ${selectedChapter === chapterId
                              ? 'text-white border-transparent translate-y-[3px]'
                              : isActive
                                ? 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 shadow-sm ring-1 ring-purple-300'
                                : isEnded
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm opacity-60'
                            }`}
                          style={selectedChapter === chapterId ? { backgroundColor: charData?.color || '#9333ea', borderColor: charData?.color || '#9333ea' } : {}}
                        >
                          {charData && (
                            <div className="w-5 h-5 -my-1 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                              <img
                                src={`/assets/characters/${charData.image}.webp`}
                                alt={displayName}
                                className={`w-full h-full object-contain ${isEnded && selectedChapter !== chapterId ? 'opacity-50 grayscale' : ''
                                  }${!isActive && !isEnded ? 'opacity-40' : ''}`}
                              />
                            </div>
                          )}
                          <span>{displayName}</span>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-0.5" />}
                          {!isActive && !isEnded && <span className="text-[9px] text-gray-400 ml-0.5">⏳</span>}
                        </button>
                      );
                    })
                  ) : (
                    // Fallback: chaptersData 기반 (기존 로직)
                    chaptersData.map((ch, idx) => {
                      const now = Date.now();
                      const chStart = (ch.start || 0) * 1000;
                      const chEnd = (ch.end || 0) * 1000;
                      const isActive = now >= chStart && now < chEnd;
                      const isEnded = now >= chEnd;
                      const chapterNum = ch.chapter_id.split('-')[1] || (idx + 1);

                      let charData = null;
                      const eventWorldBloom = worldBloomsInfo.find(wb => wb.id == ch.world_bloom_id || wb.eventId == eventInfo?.id);
                      if (eventWorldBloom && eventWorldBloom.worldBloomChapters) {
                        const targetIdx = parseInt(chapterNum) - 1;
                        const wbChapter = eventWorldBloom.worldBloomChapters.find(c => c.id == chapterNum)
                          || eventWorldBloom.worldBloomChapters[targetIdx];
                        if (wbChapter && wbChapter.characterId) {
                          const charIdStr = String(wbChapter.characterId).padStart(2, '0');
                          charData = characterBirthdays.find(b => b.image === charIdStr);
                        }
                      }

                      const charMatch = (ch.nick || '').match(/\(([^)]+)\)/);
                      const fallbackName = charMatch ? charMatch[1] : `Ch.${chapterNum}`;
                      if (!charData && fallbackName) {
                        const charDataByName = characterBirthdays.find(b =>
                          b.nameEn.toLowerCase() === fallbackName.toLowerCase() ||
                          b.nameKo === fallbackName ||
                          b.nameJa === fallbackName
                        );
                        if (charDataByName) charData = charDataByName;
                      }

                      const displayName = charData
                        ? (language === 'en' ? charData.nameEn : (language === 'ja' ? charData.nameJa : charData.nameKo))
                        : fallbackName;

                      return (
                        <button
                          key={ch.chapter_id}
                          onClick={() => setSelectedChapter(ch.chapter_id)}
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 border-b-[3px] active:border-b-0 active:translate-y-[3px] ${selectedChapter === ch.chapter_id
                              ? 'text-white border-transparent translate-y-[3px]'
                              : isActive
                                ? 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 shadow-sm ring-1 ring-purple-300'
                                : isEnded
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm'
                            }`}
                          style={selectedChapter === ch.chapter_id ? { backgroundColor: charData?.color || '#9333ea', borderColor: charData?.color || '#9333ea' } : {}}
                        >
                          {charData && (
                            <div className="w-5 h-5 -my-1 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                              <img
                                src={`/assets/characters/${charData.image}.webp`}
                                alt={displayName}
                                className={`w-full h-full object-contain ${isEnded && selectedChapter !== ch.chapter_id ? 'opacity-50 grayscale' : ''}`}
                              />
                            </div>
                          )}
                          <span>{displayName}</span>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-0.5" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

          {loading ? (
            <div className="p-8 text-center text-gray-500 animate-pulse">
              {t('fire.loading_prediction_data')}
            </div>
          ) : activePredictionData.length > 0 ? (
            <div className="overflow-x-auto" ref={rankingTableContainerRef}>
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-[26%]" />
                  <col className="w-[48%]" />
                  <col className="w-[26%]" />
                </colgroup>
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="pl-3 pr-1 py-2 text-left font-semibold text-gray-600">{t('fire.rank')}</th>
                    <th className="px-1 py-2 text-center font-semibold text-gray-600">{t('fire.current')}</th>
                    <th className="pl-1 pr-3 py-2 text-right font-semibold text-gray-600">{t('fire.predicted')}</th>
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
                        <table className="w-full text-sm table-fixed">
                          <colgroup>
                            <col className="w-[26%]" />
                            <col className="w-[48%]" />
                            <col className="w-[26%]" />
                          </colgroup>
                          <tbody className="divide-y divide-gray-100">
                            {activePredictionData.filter(r => r.rank <= 50).map((row, index) => (
                              <React.Fragment key={row.rank}>
                                <tr
                                  className={`transition-colors cursor-pointer active:bg-indigo-100 ${index % 2 === 0 ? 'bg-indigo-50/10 hover:bg-indigo-50/60' : 'bg-indigo-50/40 hover:bg-indigo-50/80'} ${activeRank === row.rank ? 'bg-indigo-100/70 hover:bg-indigo-100/70' : ''}`}
                                  onClick={(e) => handleRowClick(e, row.rank)}
                                >
                                  <td className="pl-3 pr-1 py-2 text-left font-bold text-indigo-600 relative">
                                    #{row.rank}
                                  </td>
                                  <td className="px-1 py-2 text-center tabular-nums text-gray-700">
                                    <CurrentScoreWithDelta score={row.currentScore} delta={showRecentHourlySpeed ? row.scoreDelta1h : null} stacked={stackScoreDeltas} />
                                  </td>
                                  <td className="pl-1 pr-3 py-2 text-right tabular-nums font-bold text-gray-900">
                                    {Math.floor(row.predictedScore).toLocaleString()}
                                  </td>
                                </tr>
                                {activeRank === row.rank && (
                                  <tr className="bg-indigo-50/80 animate-fade-in shadow-inner">
                                    <td colSpan="3" className="px-3 py-2">
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="flex gap-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSetTarget(row.predictedScore);
                                            }}
                                            className="bg-indigo-600 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg shadow-sm hover:bg-indigo-700 active:scale-95 transition-all text-center whitespace-nowrap"
                                          >
                                            {t('fire.set_target')}
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setGraphRank(row.rank);
                                            }}
                                            className="bg-pink-500 text-white px-2 py-1 rounded-lg shadow-sm hover:bg-pink-600 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                            title="View Graph"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                              <line x1="18" y1="20" x2="18" y2="10"></line>
                                              <line x1="12" y1="20" x2="12" y2="4"></line>
                                              <line x1="6" y1="20" x2="6" y2="14"></line>
                                            </svg>
                                            <span className="text-[10px] sm:text-xs font-bold leading-none">{t('fire.graph')}</span>
                                          </button>
                                        </div>
                                        {row.l > 0 && row.u > 0 && (
                                          <div className="text-sm sm:text-base text-indigo-700 font-bold pr-1">
                                            {t('fire.prediction_cut_range')}: {formatKoreanScore(row.l)} ~ {formatKoreanScore(row.u)}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>

                  {/* Rest of Rows */}
                  {activePredictionData.filter(r => r.rank > 50).map((row, index) => (
                    <React.Fragment key={row.rank}>
                      <tr
                        className={`transition-colors cursor-pointer active:bg-gray-200 ${index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'} ${activeRank === row.rank ? 'bg-gray-200 hover:bg-gray-200' : ''}`}
                        onClick={(e) => handleRowClick(e, row.rank)}
                      >
                        <td className="pl-3 pr-1 py-2 text-left font-bold text-indigo-600 relative">
                          #{row.rank}
                        </td>
                        <td className="px-1 py-2 text-center tabular-nums text-gray-700">
                          <CurrentScoreWithDelta score={row.currentScore} delta={showRecentHourlySpeed ? row.scoreDelta1h : null} stacked={stackScoreDeltas} />
                        </td>
                        <td className="pl-1 pr-3 py-2 text-right tabular-nums font-bold text-gray-900">
                          {Math.floor(row.predictedScore).toLocaleString()}
                        </td>
                      </tr>
                      {activeRank === row.rank && (
                        <tr className="bg-gray-100 animate-fade-in border-b border-gray-200 shadow-inner">
                          <td colSpan="3" className="px-3 py-2">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetTarget(row.predictedScore);
                                  }}
                                  className="bg-indigo-600 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg shadow-sm hover:bg-indigo-700 active:scale-95 transition-all text-center whitespace-nowrap"
                                >
                                  {t('fire.set_target')}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGraphRank(row.rank);
                                  }}
                                  className="bg-pink-500 text-white px-2 py-1 rounded-lg shadow-sm hover:bg-pink-600 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                  title="View Graph"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="20" x2="18" y2="10"></line>
                                    <line x1="12" y1="20" x2="12" y2="4"></line>
                                    <line x1="6" y1="20" x2="6" y2="14"></line>
                                  </svg>
                                  <span className="text-[10px] sm:text-xs font-bold leading-none">{t('fire.graph')}</span>
                                </button>
                              </div>
                              {row.l > 0 && row.u > 0 && (
                                <div className="text-sm sm:text-base text-gray-600 font-bold pr-1">
                                  {t('fire.prediction_cut_range')}: {formatKoreanScore(row.l)} ~ {formatKoreanScore(row.u)}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
              {t('fire.data_provided')} <a href="https://jiiku831.github.io/sekarun.html" target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-500">Jiiku</a>
            </span>
            <span className="self-center sm:self-auto">
              {t('fire.predictions_disclaimer')}
            </span>
          </div>
        </div>
      </div>



      <div className="w-full max-w-2xl mx-auto mt-3 flex justify-end">
        <label className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold text-gray-500">
          <input
            type="checkbox"
            checked={showRecentHourlySpeed}
            onChange={(e) => setShowRecentHourlySpeed(e.target.checked)}
            className="h-3 w-3 accent-emerald-500"
          />
          {t('fire.recent_hourly_speed') || '최근 시속'}
        </label>
      </div>

      {
        language === 'ko' && (
          <div className="w-full max-w-2xl mx-auto mt-2 text-center">
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
        )
      }

      <RankingGraphModal
        isOpen={!!graphRank}
        onClose={() => setGraphRank(null)}
        rank={graphRank}
        t={t}
        selectedChapter={selectedChapter}
      />
    </div >
  );
};

export default FireTab;
