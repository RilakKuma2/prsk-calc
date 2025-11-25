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

  useEffect(() => {
    const newSurveyData = { ...surveyData, power, effi, internalValue };
    setSurveyData(newSurveyData);

    const powerVal = parseFloat(power) || 0;
    const effiVal = parseInt(effi) || 0;
    const internalVal = parseFloat(internalValue) || 0;

    const multiConstant = 4.877;
    const soloConstant = 2.8;
    const autoConstant = 1.84;

    const multiEfficiency =
      ((100 + (powerVal + 1) * multiConstant) /
        (100 + powerVal * multiConstant) -
        1) *
      (100 + effiVal);
    setMultiEff(multiEfficiency);

    const soloEfficiency =
      ((100 + (powerVal + 1) * soloConstant) /
        (100 + powerVal * soloConstant) -
        1) *
      (100 + effiVal);
    setSoloEff(soloEfficiency);

    const autoEfficiency =
      ((100 + (powerVal + 1) * autoConstant) /
        (100 + powerVal * autoConstant) -
        1) *
      (100 + effiVal);
    setAutoEff(autoEfficiency);

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

    // Lost and Found Calculation
    try {
      const targetSongId = 226; // Lost and Found
      const targetDifficulty = 'hard';
      const musicMeta = musicMetas.find(m => m.music_id === targetSongId && m.difficulty === targetDifficulty);

      if (musicMeta) {
        const totalPowerRaw = powerVal * 10000; // Convert 'man' to raw power
        // Assume 5 players with internalValue skills
        const skills = [internalVal, internalVal, internalVal, internalVal, internalVal];
        const deck = createDeckDetail(totalPowerRaw, skills);

        // For Multi Live, we need to simulate the score contribution.
        // Assuming getLiveDetailByDeck with LiveType.MULTI calculates the score based on the deck's power and skills.
        // However, in a real multi-live, other players contribute.
        // The request says "all users 200%". If we assume the calculator treats the input deck as the "player"
        // and we want to know the event points for THIS player in that room condition.
        // But sekai-calculator might not simulate the whole room.
        // Let's assume we calculate the score for ONE player (this deck) assuming optimal activation?
        // Or does the user mean the TOTAL score of the room?
        // "5불 점수" usually means Event Points per 5 energy.
        // Let's calculate the score for this deck first.

        // Construct skillDetails for the deck (all 200%)
        const skillDetails = deck.cards.map(card => ({ ...card, skill: card }));
        // Leader skill activates twice in solo/auto, but in multi?
        // In multi, each player's leader skill activates once (plus fever).
        // Let's stick to the standard skillDetails construction which includes the 6th activation (Leader)
        // just to be safe with the library's expectation, although for Multi it might be different.
        // Actually, for Multi, the library might expect just the cards.
        // Let's try passing the standard 6-item skillDetails (5 members + leader extra).
        skillDetails.push({ ...deck.leader, skill: deck.leader });

        const liveDetail = LiveCalculator.getLiveDetailByDeck(
          deck,
          musicMeta,
          LiveType.MULTI, // Using MULTI as requested
          skillDetails
        );

        const eventPoint = EventCalculator.getEventPoint(
          LiveType.MULTI,
          EventType.MARATHON,
          liveDetail.score,
          musicMeta.event_rate,
          effiVal,
          25 // Fixed 25x multiplier (5 energy)
        );

        setLoAndFoundScore(eventPoint);
      }
    } catch (e) {
      console.error("Error calculating Lo&Found score", e);
      setLoAndFoundScore(0);
    }

    // Envy Calculation
    try {
      const targetSongId = 74; // Hitorinbo Envy
      const targetDifficulty = 'expert';
      const musicMeta = musicMetas.find(m => m.music_id === targetSongId && m.difficulty === targetDifficulty);

      if (musicMeta) {
        const totalPowerRaw = powerVal * 10000;
        const skills = [internalVal, internalVal, internalVal, internalVal, internalVal];
        const deck = createDeckDetail(totalPowerRaw, skills);
        const skillDetails = deck.cards.map(card => ({ ...card, skill: card }));
        skillDetails.push({ ...deck.leader, skill: deck.leader });

        const liveDetail = LiveCalculator.getLiveDetailByDeck(
          deck,
          musicMeta,
          LiveType.MULTI,
          skillDetails
        );

        const eventPoint = EventCalculator.getEventPoint(
          LiveType.MULTI,
          EventType.MARATHON,
          liveDetail.score,
          musicMeta.event_rate,
          effiVal,
          25
        );

        setEnvyScore(eventPoint);
      }
    } catch (e) {
      console.error("Error calculating Envy score", e);
      setEnvyScore(0);
    }

    // Creation Myth Auto Calculation
    try {
      const targetSongId = 186; // Creation Myth
      const targetDifficulty = 'master';
      const musicMeta = musicMetas.find(m => m.music_id === targetSongId && m.difficulty === targetDifficulty);

      if (musicMeta) {
        const totalPowerRaw = powerVal * 10000;
        // All skills 100%
        const skills = [100, 100, 100, 100, 100];
        const deck = createDeckDetail(totalPowerRaw, skills);

        // For Auto, we construct skillDetails.
        // Since all skills are 100%, order doesn't matter for the set of values.
        const skillDetails = deck.cards.map(card => ({ ...card, skill: card }));
        skillDetails.push({ ...deck.leader, skill: deck.leader });

        const liveDetail = LiveCalculator.getLiveDetailByDeck(
          deck,
          musicMeta,
          LiveType.AUTO,
          skillDetails
        );

        const eventPoint = EventCalculator.getEventPoint(
          LiveType.AUTO,
          EventType.MARATHON,
          liveDetail.score,
          musicMeta.event_rate,
          effiVal,
          5 // 1 energy = 5x multiplier
        );

        setCreationMythScore(eventPoint);
      }
    } catch (e) {
      console.error("Error calculating Creation Myth score", e);
      setCreationMythScore(0);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [power, effi, internalValue]);

  return (
    <div>
      <div id="power-tab-content">
        <label htmlFor="power">종합력:</label>
        <input type="number" id="power" min="0" max="40" value={power} onChange={e => setPower(e.target.value)} />
        <span>만</span><br />

        <label htmlFor="effi">배수:</label>
        <input type="number" id="effi" min="0" max="1000" value={effi} onChange={e => setEffi(e.target.value)} />
        <span>%</span><br />

        <label htmlFor="internalValue">내부치:</label>
        <input type="number" id="internalValue" min="0" max="2000" value={internalValue} onChange={e => setInternalValue(e.target.value)} />
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


        <p id="multi-eff">멀티효율: <span style={{ fontWeight: "bold", color: "blue" }}>{multiEff.toFixed(2)}%</span></p>
        <p id="solo-eff">솔로효율: <span style={{ fontWeight: "bold", color: "blue" }}>{soloEff.toFixed(2)}%</span></p>
        <p id="auto-eff">오토효율: <span style={{ fontWeight: "bold", color: "blue" }}>{autoEff.toFixed(2)}%</span></p>
        <p id="my-sekai-score-display">마이세카이 불 당 이벤포: <span style={{ fontWeight: "bold", color: "green" }}>{mySekaiScore}</span></p>
        <p id="lo-and-found-score">5불 로앤파 점수 : <span style={{ fontWeight: "bold", color: "purple" }}>{loAndFoundScore.toLocaleString()}</span></p>
        <p id="envy-score">5불 엔비 점수 : <span style={{ fontWeight: "bold", color: "purple" }}>{envyScore.toLocaleString()}</span></p>
        <p id="creation-myth-score">1불 개벽 오토 : <span style={{ fontWeight: "bold", color: "purple" }}>{creationMythScore.toLocaleString()}</span></p>
        <p id="power-calculation-text"><br />종합력 1만과 같은 효율의 배수<br /><br />대략적인 값으로 곡이나 스킬에 따라 달라짐</p>
      </div>
    </div>
  );
};

export default PowerTab;
