import React, { useState, useEffect } from 'react';
import { InputTableWrapper, InputRow, SelectRow } from './common/InputComponents';

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
    { level: 25, rewards: { '생일 칭호': '기본 3', '작캔': 3, '중급 스킬북': 1, '캐릭 메모리아': 1 } },
    { level: 29, rewards: { '카게라': 50 } },
    { level: 33, rewards: { '전용 카게라': 50 } },
    { level: 37, rewards: { '카게라': 50 } },
    { level: 41, rewards: { '전용 카게라': 50 } },
    { level: 45, rewards: { '생일 칭호': '날개 1', '작캔': 5, '중급 스코어': 10, '미션 가챠 티켓': 1 } },
    { level: 50, rewards: { '카게라': 50 } },
    { level: 55, rewards: { '전용 카게라': 50 } },
    { level: 60, rewards: { '카게라': 50 } },
    { level: 65, rewards: { '전용 카게라': 50 } },
    { level: 70, rewards: { '생일 칭호': '날개 2', '작캔': 5, '중급 스킬북': 1, '캐릭 메모리아': 1 } },
    { level: 79, rewards: { '카게라': 50 } },
    { level: 88, rewards: { '전용 카게라': 50 } },
    { level: 97, rewards: { '카게라': 50 } },
    { level: 106, rewards: { '전용 카게라': 50 } },
    { level: 115, rewards: { '생일 칭호': '날개 3', '작캔': 5, '중급 스코어': 10, '미션 가챠 티켓': 2 } },
    { level: 125, rewards: { '카게라': 50 } },
    { level: 135, rewards: { '전용 카게라': 50 } },
    { level: 145, rewards: { '카게라': 50 } },
    { level: 155, rewards: { '전용 카게라': 50 } },
    { level: 165, rewards: { '생일 칭호': '꽃 1', '작캔': 7, '중급 스킬북': 1, '캐릭 메모리아': 2 } },
    { level: 177, rewards: { '카게라': 50 } },
    { level: 189, rewards: { '전용 카게라': 50 } },
    { level: 201, rewards: { '카게라': 50 } },
    { level: 213, rewards: { '전용 카게라': 50 } },
    { level: 225, rewards: { '생일 칭호': '꽃 2', '작캔': 7, '중급 스코어': 10, '미션 가챠 티켓': 3 } },
    { level: 240, rewards: { '카게라': 50 } },
    { level: 255, rewards: { '전용 카게라': 50 } },
    { level: 270, rewards: { '카게라': 50 } },
    { level: 285, rewards: { '전용 카게라': 50 } },
    { level: 300, rewards: { '생일 칭호': '꽃 3', '작캔': 7, '중급 스킬북': 1, '캐릭 메모리아': 3 } },
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
    <div id="amatsuyu-tab-content" className="p-4 space-y-4">
      {/* Input Section - Reverted to Default Style (Exact Match with AutoTab) */}
      <InputTableWrapper>
        <SelectRow
          label="올해생카 보유"
          value={hasCurrentYearCard}
          onChange={e => setHasCurrentYearCard(e.target.value)}
          options={[
            { value: "Y", label: "Y" },
            { value: "N", label: "N" },
          ]}
          spacer={true}
        />
        <SelectRow
          label="과거생카 보유 수"
          value={pastCardsOwned}
          onChange={e => setPastCardsOwned(e.target.value)}
          options={[0, 1, 2, 3, 4].map(num => ({ value: num, label: num }))}
          spacer={true}
        />
        <InputRow
          label="현재 레벨"
          value={currentLevel}
          onChange={e => setCurrentLevel(e.target.value)}
          spacer={true}
        />
        <InputRow
          label="목표 레벨"
          value={targetLevel}
          onChange={e => { const value = parseInt(e.target.value); setTargetLevel(isNaN(value) ? 0 : Math.min(400, Math.max(0, value))); }}
          spacer={true}
        />
      </InputTableWrapper>

      {/* Result Sections Wrapper - Slightly Reduced Width (340px max, 85% mobile) */}
      <div className="w-[85%] max-w-[340px] mx-auto space-y-4">
        {/* Summary - Compact, No Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 ">
          <div className="grid grid-cols-2 items-center mb-1 text-center max-[375px]:text-sm">
            <span className="text-gray-600">생카 배율</span>
            <span className="font-bold text-purple-600">{birthdayCardBonus}%</span>
          </div>
          <div className="grid grid-cols-2 items-center mb-1 text-center max-[375px]:text-sm">
            <span className="text-gray-600">아마츠유 개당 포인트</span>
            <span className="font-bold text-purple-600 ">{Math.floor(amatsuyuPointsPerItem).toLocaleString()}pt</span>
          </div>
          <div className="grid grid-cols-2 items-center pt-1 border-t mt-1 text-center">
            <span className="text-gray-900 font-bold">필요 아마츠유</span>
            <span className="font-bold text-lg text-purple-600">{neededAmatsuyu.toLocaleString()}개</span>
          </div>
        </div>

        {/* Strategy Cards - Always 2 columns, Font Reduced to text-sm */}
        <div className="grid grid-cols-2 gap-3 text-sm ">
          {/* MySekai Card */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-3 ">
            <h4 className="font-bold text-green-800 mb-1 flex items-center">
              <span className="mr-1">🌱</span> 마이세카이
            </h4>
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span className="text-green-700">필요 불</span>
                <span className="font-bold text-green-900">{mySekaiStones.toLocaleString()}불</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">바퀴 수</span>
                <span className="font-bold text-green-900">{mySekaiLaps.toLocaleString()}바퀴</span>
              </div>
            </div>
          </div>

          {/* 5-Fire Card */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
            <h4 className="font-bold text-blue-800 mb-1 flex items-center">
              <span className="mr-1">🔥</span> 5불런/가챠
            </h4>
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span className="text-blue-700">필요 불</span>
                <span className="font-bold text-blue-900">{fiveFireStones.toLocaleString()}불</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">시간</span>
                <span className="font-bold text-blue-900">{fiveFireHours}시간</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reference Text - Moved here */}
        <div className="text-xs text-gray-500 text-center">
          마셐: 2.5불 당 42개 / 5불런: 5불 당 25개 기준
        </div>

        {/* Rewards Section - Compact, No Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          {highestBirthdayTitle && (
            <div className="mb-2 text-center bg-yellow-50 border border-yellow-200 rounded p-2 flex justify-center items-center gap-2">
              <span className="text-sm font-bold text-yellow-800">칭호:</span>
              <span className="text-sm font-bold text-yellow-800">{highestBirthdayTitle}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm max-[375px]:text-xs">
            {Object.entries(cumulativeRewards).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[60%_40%] items-center text-center border-b border-gray-100 pb-1 last:border-0">
                <span className="text-gray-600">{key}</span>
                <span className="font-bold text-gray-900">{value.toLocaleString()}</span>
              </div>
            ))}
            {Object.keys(cumulativeRewards).length === 0 && (
              <div className="col-span-2 text-center text-gray-400 py-1">보상 없음</div>
            )}
          </div>
        </div>

        {/* Info & Reference Table */}
        <div className="text-base text-gray-500 space-y-4">
          <p className="text-center">
            <a href="https://m.dcinside.com/board/pjsekai/2278357" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-bold">
              아마츠유 정리
            </a>
          </p>

          <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm ">
            <table className="w-full text-center border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 font-bold text-gray-700 border-b border-gray-200">칭호</th>
                  <th className="p-2 font-bold text-gray-700 border-b border-gray-200" colSpan="3">레벨 조건</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr>
                  <td className="p-2 font-bold text-gray-900 bg-gray-50 border-r border-b border-gray-100">기본</td>
                  <td className="p-2 border-b border-gray-100 border-r">2</td>
                  <td className="p-2 border-b border-gray-100 border-r">10</td>
                  <td className="p-2 border-b border-gray-100">25</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-gray-900 bg-gray-50 border-r border-b border-gray-100">날개</td>
                  <td className="p-2 border-b border-gray-100 border-r">45</td>
                  <td className="p-2 border-b border-gray-100 border-r">70</td>
                  <td className="p-2 border-b border-gray-100">115</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-gray-900 bg-gray-50 border-r border-b border-gray-100">꽃</td>
                  <td className="p-2 border-b border-gray-100 border-r">165</td>
                  <td className="p-2 border-b border-gray-100 border-r">225</td>
                  <td className="p-2 border-b border-gray-100">300</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-gray-900 bg-gray-50 border-r border-gray-100">별꽃</td>
                  <td className="p-2" colSpan="3">400</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmatsuyuTab;
