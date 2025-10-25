import React, { useState, useEffect } from 'react';

const AmatsuyuTab = ({ surveyData, setSurveyData }) => {
  const [hasCurrentYearCard, setHasCurrentYearCard] = useState(surveyData.hasCurrentYearCard || 'N');
  const [pastCardsOwned, setPastCardsOwned] = useState(surveyData.pastCardsOwned || '0');
  const [currentLevel, setCurrentLevel] = useState(surveyData.amatsuyuCurrentLevel || '0');
  const [targetLevel, setTargetLevel] = useState(surveyData.amatsuyuTargetLevel || '400');

  const rewardTable = [
    { level: 2, rewards: { '생일 칭호': '기본 1', '작캔': 3, '중급 스킬북': 1, '포토 필름': 5 } },
    { level: 3, rewards: { '카게라': 50 } },
    { level: 4, rewards: { '전용 카게라': 50 } },
    { level: 6, rewards: { '카게라': 50 } },
    { level: 8, rewards: { '전용 카게라': 50 } },
    { level: 10, rewards: { '생일 칭호': '기본 2', '작캔': 3, '중급 스코어': 10, '미션 가챠 티켓': 1 } },
    { level: 13, rewards: { '카게라': 50 } },
    { level: 16, rewards: { '전용 카게라': 50 } },
    { level: 19, rewards: { '카게라': 50 } },
    { level: 22, rewards: { '전용 카게라': 50 } },
    { level: 25, rewards: { '생일 칭호': '기본 3', '작캔': 3, '중급 스킬북': 1, '전용 메모리아': 1 } },
    { level: 29, rewards: { '카게라': 50 } },
    { level: 33, rewards: { '전용 카게라': 50 } },
    { level: 37, rewards: { '카게라': 50 } },
    { level: 41, rewards: { '전용 카게라': 50 } },
    { level: 45, rewards: { '생일 칭호': '날개 1', '작캔': 5, '중급 스코어': 10, '미션 가챠 티켓': 1 } },
    { level: 50, rewards: { '카게라': 50 } },
    { level: 55, rewards: { '전용 카게라': 50 } },
    { level: 60, rewards: { '카게라': 50 } },
    { level: 65, rewards: { '전용 카게라': 50 } },
    { level: 70, rewards: { '생일 칭호': '날개 2', '작캔': 5, '중급 스킬북': 1, '전용 메모리아': 1 } },
    { level: 79, rewards: { '카게라': 50 } },
    { level: 88, rewards: { '전용 카게라': 50 } },
    { level: 97, rewards: { '카게라': 50 } },
    { level: 106, rewards: { '전용 카게라': 50 } },
    { level: 115, rewards: { '생일 칭호': '날개 3', '작캔': 5, '중급 스코어': 10, '미션 가챠 티켓': 2 } },
    { level: 125, rewards: { '카게라': 50 } },
    { level: 135, rewards: { '전용 카게라': 50 } },
    { level: 145, rewards: { '카게라': 50 } },
    { level: 155, rewards: { '전용 카게라': 50 } },
    { level: 165, rewards: { '생일 칭호': '꽃 1', '작캔': 7, '중급 스킬북': 1, '전용 메모리아': 2 } },
    { level: 177, rewards: { '카게라': 50 } },
    { level: 189, rewards: { '전용 카게라': 50 } },
    { level: 201, rewards: { '카게라': 50 } },
    { level: 213, rewards: { '전용 카게라': 50 } },
    { level: 225, rewards: { '생일 칭호': '꽃 2', '작캔': 7, '중급 스코어': 10, '미션 가챠 티켓': 3 } },
    { level: 240, rewards: { '카게라': 50 } },
    { level: 255, rewards: { '전용 카게라': 50 } },
    { level: 270, rewards: { '카게라': 50 } },
    { level: 285, rewards: { '전용 카게라': 50 } },
    { level: 300, rewards: { '생일 칭호': '꽃 3', '작캔': 7, '중급 스킬북': 1, '전용 메모리아': 3 } },
    { level: 320, rewards: { '카게라': 50 } },
    { level: 340, rewards: { '전용 카게라': 50 } },
    { level: 360, rewards: { '카게라': 50 } },
    { level: 380, rewards: { '전용 카게라': 50 } },
    { level: 400, rewards: { '생일 칭호': '별꽃 3', '작캔': 10, '중급 스코어': 10, '미션 가챠 티켓': 3 } },
  ];

  const [birthdayCardBonus, setBirthdayCardBonus] = useState(0);
  const [amatsuyuPointsPerItem, setAmatsuyuPointsPerItem] = useState(0);
  const [neededAmatsuyu, setNeededAmatsuyu] = useState(0);
  const [mySekaiStones, setMySekaiStones] = useState(0);
  const [mySekaiLaps, setMySekaiLaps] = useState(0);
  const [fiveFireStones, setFiveFireStones] = useState(0);
  const [fiveFireHours, setFiveFireHours] = useState(0);
  const [cumulativeRewards, setCumulativeRewards] = useState({});
  const [highestBirthdayTitle, setHighestBirthdayTitle] = useState('');

  useEffect(() => {
    const newSurveyData = { ...surveyData, hasCurrentYearCard, pastCardsOwned, amatsuyuCurrentLevel: currentLevel, amatsuyuTargetLevel: targetLevel };
    setSurveyData(newSurveyData);

    // Calculate Birthday Card Bonus
    let bonus = 0;
    if (hasCurrentYearCard === 'Y') {
      bonus += 50;
    }
    bonus += parseInt(pastCardsOwned) * 15;
    setBirthdayCardBonus(bonus);

    // Calculate Amatsuyu Points per Item
    const basePoints = 100;
    const pointsPerItem = basePoints * (1 + bonus / 100);
    setAmatsuyuPointsPerItem(pointsPerItem);

    // Calculate Needed Amatsuyu
    const currentLvl = parseInt(currentLevel);
    const targetLvl = parseInt(targetLevel);
    const pointsPerLevel = 10000;

    if (targetLvl <= currentLvl) {
      setNeededAmatsuyu(0);
      setMySekaiStones(0);
      setMySekaiLaps(0);
      setFiveFireStones(0);
      setFiveFireHours(0);
      setCumulativeRewards({});
      setHighestBirthdayTitle('');
      return;
    }

    const totalPointsNeeded = (targetLvl - currentLvl) * pointsPerLevel;
    const needed = Math.ceil(totalPointsNeeded / pointsPerItem);
    setNeededAmatsuyu(needed);

    // My Sekai Calculations
    const mySekaiAmatsuyuPerStone = 42 / 2.5; // 42 Amatsuyu per 25 stones
    const mySekaiAmatsuyuPerLap = 1162;

    const msStones = Math.ceil(needed / mySekaiAmatsuyuPerStone);
    setMySekaiStones(msStones);
    const msLaps = Math.ceil(needed / mySekaiAmatsuyuPerLap);
    setMySekaiLaps(msLaps);

    // 5-Fire Run Calculations
    const fiveFireAmatsuyuPerStone = 25 / 5; // 25 Amatsuyu per 50 stones
    const fiveFireAmatsuyuPerHour = 675;

    const ffStones = Math.ceil(needed / fiveFireAmatsuyuPerStone);
    setFiveFireStones(ffStones);
    const ffHours = (needed / fiveFireAmatsuyuPerHour).toFixed(1);
    setFiveFireHours(ffHours);

    // Calculate Cumulative Rewards
    const rewards = {};
    let currentHighestTitle = '';
    rewardTable.forEach(item => {
      if (targetLvl >= item.level) {
        for (const [key, value] of Object.entries(item.rewards)) {
          if (key.includes('생일 칭호')) {
            currentHighestTitle = value;
          } else {
            rewards[key] = (rewards[key] || 0) + value;
          }
        }
      }
    });
    setCumulativeRewards(rewards);
    setHighestBirthdayTitle(currentHighestTitle);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCurrentYearCard, pastCardsOwned, currentLevel, targetLevel]);

  return (
    <div id="amatsuyu-tab-content">
      <label htmlFor="hasCurrentYearCard">올해생카 보유:</label>
      <select id="hasCurrentYearCard" value={hasCurrentYearCard} onChange={e => setHasCurrentYearCard(e.target.value)}>
        <option value="Y">Y</option>
        <option value="N">N</option>
      </select><br />

      <label htmlFor="pastCardsOwned">과거생카 보유 수:</label>
      <select id="pastCardsOwned" value={pastCardsOwned} onChange={e => setPastCardsOwned(e.target.value)}>
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select><br />

      <label htmlFor="amatsuyuCurrentLevel">현재 레벨:</label>
      <input type="number" id="amatsuyuCurrentLevel" min="0" value={currentLevel} onChange={e => setCurrentLevel(e.target.value)} /><br />

      <label htmlFor="amatsuyuTargetLevel">목표 레벨:</label>
      <input type="number" id="amatsuyuTargetLevel" min="0" max="400" value={targetLevel} onChange={e => { const value = parseInt(e.target.value); setTargetLevel(isNaN(value) ? 0 : Math.min(400, Math.max(0, value))); }} /><br />


      <p style={{margin: '4px 0'}}>생카 배율: <span style={{fontWeight: "bold", color: "blue"}}>{birthdayCardBonus}%</span></p>
      <p style={{margin: '4px 0'}}>아마츠유 개 당 포인트: <span style={{fontWeight: "bold", color: "blue"}}>{Math.floor(amatsuyuPointsPerItem)}</span></p>
      <p style={{margin: '4px 0'}}>필요 아마츠유: <span style={{fontWeight: "bold", color: "blue"}}>{neededAmatsuyu}</span>개</p>

      <h3 style={{ marginBottom: '5px' }}>마이세카이(생일 꽃)</h3>

      <p style={{ marginTop: '0' }}><span style={{fontWeight: "bold", color: "blue"}}>{mySekaiStones}</span>불 / <span style={{fontWeight: "bold", color: "blue"}}>{mySekaiLaps}</span>바퀴</p>

      <h3 style={{ marginBottom: '5px' }}>5불런/생카가챠</h3>

      <p style={{ marginTop: '0' }}><span style={{fontWeight: "bold", color: "blue"}}>{fiveFireStones}</span>불 / 엔비 <span style={{fontWeight: "bold", color: "blue"}}>{fiveFireHours}</span>시간</p>

      {highestBirthdayTitle && <p style={{ textAlign: 'center', fontWeight: 'bold', color: 'green', fontSize: '1.2em' }}>생일 칭호: {highestBirthdayTitle}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', maxWidth: '300px', margin: '0 auto' }}>
        {Object.entries(cumulativeRewards).map(([key, value]) => (
          <div key={key} style={{ textAlign: 'left' }}>{key}: <span style={{fontWeight: "bold", color: "green"}}>{value}</span></div>
        ))}
      </div>
      <p>마셐:2.5불 당 42개 / 5불런:5불 당 25개<br />
      <a href="https://m.dcinside.com/board/pjsekai/2278357" target="_blank" rel="noopener noreferrer"><strong>아마츠유 정리</strong></a></p>
      <table style={{ width: '100%', maxWidth: '400px', margin: '10px auto', borderCollapse: 'collapse', textAlign: 'center' }}>
        <tbody style={{ border: '1px solid #ccc' }}>
          <tr>
            <td style={{ border: '1px solid #eee', padding: '2px', fontWeight: 'bold' }}>기본</td>
            <td style={{ border: '1px solid #eee', padding: '2px' }}>2레벨</td>
            <td style={{ border: '1px solid #eee', padding: '2px' }}>10레벨</td>
            <td style={{ border: '1px solid #eee', padding: '2px' }}>25레벨</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #eee', padding: '2px', fontWeight: 'bold' }}>날개</td>
            <td style={{ border: '1px solid #eee', padding: '2px' }}>45레벨</td>
            <td style={{ border: '1px solid #eee', padding: '2px' }}>70레벨</td>
            <td style={{ border: '1px solid #eee', padding: '2px' }}>115레벨</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #eee', padding: '2px', fontWeight: 'bold' }}>꽃</td>
            <td style={{ border: '1px solid #eee', padding: '2px' }}>165레벨</td>
            <td style={{ border: '1px solid #eee', padding: '2px' }}>225레벨</td>
            <td style={{ border: '1px solid #eee', padding: '2px' }}>300레벨</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #eee', padding: '2px', fontWeight: 'bold' }}>별꽃</td>
            <td colSpan="3" style={{ border: '1px solid #eee', padding: '2px' }}>400레벨</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AmatsuyuTab;
