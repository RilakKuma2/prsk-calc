import React, { useState, useEffect } from 'react';
import MySekaiTable from './MySekaiTable';
import { mySekaiTableData, powerColumnThresholds, scoreRowKeys } from '../data/mySekaiTableData';
import { LiveCalculator, EventCalculator, LiveType, EventType } from 'sekai-calculator';
import musicMetas from '../data/music_metas.json';
import { createDeckDetail } from '../utils/calculator';

const PowerTab = ({ surveyData, setSurveyData }) => {
  const [power, setPower] = useState(surveyData.power || '25');
  const [effi, setEffi] = useState(surveyData.effi || '250');
  const [internalValue, setInternalValue] = useState(surveyData.internalValue || '200');
  const [showMySekaiTable, setShowMySekaiTable] = useState(false);

  const [multiEff, setMultiEff] = useState(0);
  const [soloEff, setSoloEff] = useState(0);
  const [autoEff, setAutoEff] = useState(0);
  const [mySekaiScore, setMySekaiScore] = useState('N/A');
  const [loAndFoundScore, setLoAndFoundScore] = useState(0);
  const [envyScore, setEnvyScore] = useState(0);
  const [creationMythScore, setCreationMythScore] = useState(0);
  const [omakaseScore, setOmakaseScore] = useState(0);

  useEffect(() => {
    const newSurveyData = { ...surveyData, power, effi, internalValue };
    setSurveyData(newSurveyData);

    if (power === '' || effi === '') {
      setMultiEff('N/A');
      setSoloEff('N/A');
      setAutoEff('N/A');
      setMySekaiScore('N/A');
      setLoAndFoundScore('N/A');
      setEnvyScore('N/A');
      setCreationMythScore('N/A');
      setOmakaseScore('N/A');
      return;
    }

    const powerVal = parseFloat(power) || 0;
    const effiVal = parseInt(effi) || 0;
    const internalVal = parseFloat(internalValue) || 0;

    // Helper functions for score calculation
    const getLoAndFoundScore = (pVal, iVal) => {
      try {
        const targetSongId = 226;
        const targetDifficulty = 'hard';
        const musicMeta = musicMetas.find(m => m.music_id === targetSongId && m.difficulty === targetDifficulty);
        if (!musicMeta) return 0;

        const totalPowerRaw = pVal * 10000;
        const skills = [iVal, iVal, iVal, iVal, iVal];
        const deck = createDeckDetail(totalPowerRaw, skills);
        const skillDetails = deck.cards.map(card => ({ ...card, skill: card }));
        skillDetails.push({ ...deck.leader, skill: deck.leader });

        const liveDetail = LiveCalculator.getLiveDetailByDeck(
          deck,
          musicMeta,
          LiveType.MULTI,
          skillDetails
        );

        return EventCalculator.getEventPoint(
          LiveType.MULTI,
          EventType.MARATHON,
          liveDetail.score,
          musicMeta.event_rate,
          effiVal,
          25
        );
      } catch (e) {
        return 0;
      }
    };

    const getCreationMythScore = (pVal) => {
      try {
        const targetSongId = 186;
        const targetDifficulty = 'master';
        const musicMeta = musicMetas.find(m => m.music_id === targetSongId && m.difficulty === targetDifficulty);
        if (!musicMeta) return 0;

        const totalPowerRaw = pVal * 10000;
        const skills = [100, 100, 100, 100, 100];
        const deck = createDeckDetail(totalPowerRaw, skills);
        const skillDetails = deck.cards.map(card => ({ ...card, skill: card }));
        skillDetails.push({ ...deck.leader, skill: deck.leader });

        const liveDetail = LiveCalculator.getLiveDetailByDeck(
          deck,
          musicMeta,
          LiveType.AUTO,
          skillDetails
        );

        return EventCalculator.getEventPoint(
          LiveType.AUTO,
          EventType.MARATHON,
          liveDetail.score,
          musicMeta.event_rate,
          effiVal,
          5
        );
      } catch (e) {
        return 0;
      }
    };

    const getAppendScore = (pVal) => {
      try {
        const targetSongId = 488;
        const targetDifficulty = 'append';
        const musicMeta = musicMetas.find(m => m.music_id === targetSongId && m.difficulty === targetDifficulty);
        if (!musicMeta) return 0;

        const totalPowerRaw = pVal * 10000;
        const skills = [100, 100, 100, 100, 100];
        const deck = createDeckDetail(totalPowerRaw, skills);
        const skillDetails = deck.cards.map(card => ({ ...card, skill: card }));
        skillDetails.push({ ...deck.leader, skill: deck.leader });

        const liveDetail = LiveCalculator.getLiveDetailByDeck(
          deck,
          musicMeta,
          LiveType.SOLO,
          skillDetails
        );

        return EventCalculator.getEventPoint(
          LiveType.SOLO,
          EventType.MARATHON,
          liveDetail.score,
          musicMeta.event_rate,
          effiVal,
          5
        );
      } catch (e) {
        return 0;
      }
    };

    const getOmakaseScore = (pVal, iVal) => {
      try {
        const targetSongId = 572;
        const targetDifficulty = 'master';
        const musicMeta = musicMetas.find(m => m.music_id === targetSongId && m.difficulty === targetDifficulty);
        if (!musicMeta) return 0;

        const totalPowerRaw = pVal * 10000;
        const skills = [iVal, iVal, iVal, iVal, iVal];
        const deck = createDeckDetail(totalPowerRaw, skills);
        const skillDetails = deck.cards.map(card => ({ ...card, skill: card }));
        skillDetails.push({ ...deck.leader, skill: deck.leader });

        const liveDetail = LiveCalculator.getLiveDetailByDeck(
          deck,
          musicMeta,
          LiveType.MULTI,
          skillDetails
        );

        return EventCalculator.getEventPoint(
          LiveType.MULTI,
          EventType.MARATHON,
          liveDetail.score,
          musicMeta.event_rate,
          effiVal,
          25
        );
      } catch (e) {
        return 0;
      }
    };

    // Calculate Scores
    const currentLoAndFound = getLoAndFoundScore(powerVal, internalVal);
    const plus1LoAndFound = getLoAndFoundScore(powerVal + 1, internalVal);

    const currentCreationMyth = getCreationMythScore(powerVal);
    const plus1CreationMyth = getCreationMythScore(powerVal + 1);

    const currentAppend = getAppendScore(powerVal);
    const plus1Append = getAppendScore(powerVal + 1);

    // Calculate Efficiencies
    // Formula: (100 + effi) * (Score_plus1 / Score_current - 1)
    let newMultiEff = 0;
    if (currentLoAndFound > 0) {
      newMultiEff = (100 + effiVal) * (plus1LoAndFound / currentLoAndFound - 1);
    }
    setMultiEff(newMultiEff);

    let newAutoEff = 0;
    if (currentCreationMyth > 0) {
      newAutoEff = (100 + effiVal) * (plus1CreationMyth / currentCreationMyth - 1);
    }
    setAutoEff(newAutoEff);

    let newSoloEff = 0;
    if (currentAppend > 0) {
      newSoloEff = (100 + effiVal) * (plus1Append / currentAppend - 1);
    }
    setSoloEff(newSoloEff);

    setLoAndFoundScore(currentLoAndFound);
    setCreationMythScore(currentCreationMyth);
    setOmakaseScore(getOmakaseScore(powerVal, internalVal));

    // Envy Calculation (Keep as is, but maybe use helper if I want to clean up, but it's separate)
    // I'll just copy the Envy logic back or refactor it too.
    // Actually, I can just calculate Envy here too.
    try {
      const targetSongId = 74;
      const targetDifficulty = 'expert';
      const musicMeta = musicMetas.find(m => m.music_id === targetSongId && m.difficulty === targetDifficulty);
      if (musicMeta) {
        const totalPowerRaw = powerVal * 10000;
        const skills = [internalVal, internalVal, internalVal, internalVal, internalVal];
        const deck = createDeckDetail(totalPowerRaw, skills);
        const skillDetails = deck.cards.map(card => ({ ...card, skill: card }));
        skillDetails.push({ ...deck.leader, skill: deck.leader });
        const liveDetail = LiveCalculator.getLiveDetailByDeck(deck, musicMeta, LiveType.MULTI, skillDetails);
        const eventPoint = EventCalculator.getEventPoint(LiveType.MULTI, EventType.MARATHON, liveDetail.score, musicMeta.event_rate, effiVal, 25);
        setEnvyScore(eventPoint);
      }
    } catch (e) {
      setEnvyScore(0);
    }

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
    setMySekaiScore(highestPossibleScore);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [power, effi, internalValue]);

  return (
    <div>
      <div id="power-tab-content">
        <label htmlFor="power">종합력:</label>
        <input type="number" id="power" min="0" max="40" value={power} onChange={e => setPower(e.target.value)} onFocus={(e) => e.target.select()} />
        <span>만</span><br />

        <label htmlFor="effi">배수:</label>
        <input type="number" id="effi" min="0" max="1000" value={effi} onChange={e => setEffi(e.target.value)} onFocus={(e) => e.target.select()} />
        <span>%</span><br />

        <label htmlFor="internalValue">내부치:</label>
        <input type="number" id="internalValue" min="0" max="2000" value={internalValue} onChange={e => setInternalValue(e.target.value)} onFocus={(e) => e.target.select()} />
        <span>%</span><br />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '-10px', marginBottom: '10px' }}>5명이 모두 같은 내부치라 가정 후 점수 계산</p>

        <button
          className="action-button"
          style={{ marginTop: '10px', marginBottom: '10px' }}
          onClick={() => setShowMySekaiTable(!showMySekaiTable)}
        >
          마이세카이 테이블
        </button>
        {showMySekaiTable && <MySekaiTable />}

        <p id="lo-and-found-score">5불 로앤파 이벤포 : <span style={{ fontWeight: "bold", color: "purple" }}>{typeof loAndFoundScore === 'number' ? loAndFoundScore.toLocaleString() : loAndFoundScore}</span></p>
        <p id="omakase-score">5불 오마카세 점수 : <span style={{ fontWeight: "bold", color: "purple" }}>{typeof omakaseScore === 'number' ? omakaseScore.toLocaleString() : omakaseScore}</span></p>
        <p id="envy-score">5불 엔비 이벤포 : <span style={{ fontWeight: "bold", color: "purple" }}>{typeof envyScore === 'number' ? envyScore.toLocaleString() : envyScore}</span></p>
        <p id="creation-myth-score">1불 개벽 오토 : <span style={{ fontWeight: "bold", color: "purple" }}>{typeof creationMythScore === 'number' ? creationMythScore.toLocaleString() : creationMythScore}</span></p>
        <p id="my-sekai-score-display">마이세카이 1불 이벤포: <span style={{ fontWeight: "bold", color: "green" }}>{mySekaiScore}</span></p>
        <br></br>
        <p id="multi-eff">멀티효율: <span style={{ fontWeight: "bold", color: "blue" }}>{typeof multiEff === 'number' ? multiEff.toFixed(2) + '%' : multiEff}</span></p>
        <p id="solo-eff">솔로효율: <span style={{ fontWeight: "bold", color: "blue" }}>{typeof soloEff === 'number' ? soloEff.toFixed(2) + '%' : soloEff}</span></p>
        <p id="auto-eff">오토효율: <span style={{ fontWeight: "bold", color: "blue" }}>{typeof autoEff === 'number' ? autoEff.toFixed(2) + '%' : autoEff}</span></p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '-10px', marginBottom: '10px' }}><br></br>종합력 1만과 같은 효율의 배수<br />현 내부치 로앤파 점수 기준</p>
      </div>
    </div>
  );
};

export default PowerTab;
