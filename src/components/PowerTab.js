import React, { useState, useEffect } from 'react';
import MySekaiTable from './MySekaiTable';
import { mySekaiTableData, powerColumnThresholds, scoreRowKeys } from '../data/mySekaiTableData';
import { LiveCalculator, EventCalculator, LiveType, EventType } from 'sekai-calculator';
import musicMetas from '../data/music_metas.json';
import { InputTableWrapper, InputRow, SelectRow } from './common/InputComponents';
import { calculateScoreRange } from '../utils/calculator';

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
  const [power, setPower] = useState(surveyData.power || '25');
  const [effi, setEffi] = useState(surveyData.effi || '250');
  const [internalValue, setInternalValue] = useState(surveyData.internalValue || '200');
  const [showMySekaiTable, setShowMySekaiTable] = useState(false);

  // Detailed Input State
  const [isDetailedInput, setIsDetailedInput] = useState(surveyData.isDetailedInput || false);
  const [detailedSkills, setDetailedSkills] = useState(surveyData.detailedSkills || {
    encore: '200',
    member1: '200',
    member2: '200',
    member3: '200',
    member4: '200'
  });

  // Fire Counts State
  const [fireCounts, setFireCounts] = useState(surveyData.fireCounts || {
    loAndFound: 5,
    envy: 5,
    omakase: 5,
    creationMyth: 1,
    mySekai: 1
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

  // Helper to get skills array based on input mode
  // Returns [Leader, M2, M3, M4, M5]
  const getSkillsArray = () => {
    if (isDetailedInput) {
      return [
        parseFloat(detailedSkills.encore) || 0,
        parseFloat(detailedSkills.member1) || 0,
        parseFloat(detailedSkills.member2) || 0,
        parseFloat(detailedSkills.member3) || 0,
        parseFloat(detailedSkills.member4) || 0
      ];
    } else {
      const val = parseFloat(internalValue) || 0;
      return [val, val, val, val, val];
    }
  };

  useEffect(() => {
    const newSurveyData = {
      ...surveyData,
      power,
      effi,
      internalValue,
      isDetailedInput,
      detailedSkills,
      fireCounts
    };
    setSurveyData(newSurveyData);

    if (power === '' || effi === '') {
      setMultiEff('N/A');
      setSoloEff('N/A');
      setAutoEff('N/A');
      setMySekaiScore('N/A');
      setLoAndFoundScore({ min: 0, max: 0 });
      setEnvyScore({ min: 0, max: 0 });
      setCreationMythScore({ min: 0, max: 0 });
      setOmakaseScore({ min: 0, max: 0 });
      return;
    }

    const powerVal = parseFloat(power) || 0;
    const effiVal = parseInt(effi) || 0;
    const skillsArray = getSkillsArray();

    // Helper functions for score calculation
    const getScoreRange = (pVal, skills, songId, difficulty, liveType, fireCount) => {
      try {
        const input = {
          songId: songId,
          difficulty: difficulty,
          totalPower: pVal * 10000,
          skillLeader: skills[0],
          skillMember2: skills[1],
          skillMember3: skills[2],
          skillMember4: skills[3],
          skillMember5: skills[4],
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
    const loAndFound = getScoreRange(powerVal, skillsArray, 186, 'hard', LiveType.MULTI, fireCounts.loAndFound);

    // 2. Envy (ID 74, Expert, Multi)
    const envy = getScoreRange(powerVal, skillsArray, 74, 'expert', LiveType.MULTI, fireCounts.envy);

    // 3. Omakase (ID 572, Master, Multi)
    const omakase = getScoreRange(powerVal, skillsArray, 572, 'master', LiveType.MULTI, fireCounts.omakase);

    // 4. Creation Myth (ID 186, Master, Auto) - Fixed 100% skills
    const creationMyth = getScoreRange(powerVal, [100, 100, 100, 100, 100], 186, 'master', LiveType.AUTO, fireCounts.creationMyth);

    // 5. Append (ID 488, Append, Solo) - Fixed 100% skills for Efficiency Calc
    const append = getScoreRange(powerVal, [100, 100, 100, 100, 100], 488, 'append', LiveType.SOLO, 1);


    // Calculate Efficiencies
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

    setLoAndFoundScore(loAndFound);
    setEnvyScore(envy);
    setOmakaseScore(omakase);
    setCreationMythScore(creationMyth);

    // MySekai Score (Original Logic)
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
    // Removed MySekai EP calculation block

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [power, effi, internalValue, isDetailedInput, detailedSkills, fireCounts]);

  const handleDetailedChange = (key, value) => {
    setDetailedSkills(prev => ({ ...prev, [key]: value }));
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
      <div className="flex justify-center w-full">
        <select
          value={fireCounts[key]}
          onChange={(e) => handleFireChange(key, e.target.value)}
          className="font-bold text-gray-700 text-center bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer hover:bg-gray-50 transition-colors"
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
      </div>
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
        내부치 상세 입력
      </label>
    </div>
  );

  const detailedGridElement = (
    <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>앵콜</label>
          <input
            type="number"
            value={detailedSkills.encore}
            onChange={(e) => handleDetailedChange('encore', e.target.value)}
            onFocus={(e) => e.target.select()}
            style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>멤버 1</label>
          <input
            type="number"
            value={detailedSkills.member1}
            onChange={(e) => handleDetailedChange('member1', e.target.value)}
            onFocus={(e) => e.target.select()}
            style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>멤버 2</label>
          <input
            type="number"
            value={detailedSkills.member2}
            onChange={(e) => handleDetailedChange('member2', e.target.value)}
            onFocus={(e) => e.target.select()}
            style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>멤버 3</label>
          <input
            type="number"
            value={detailedSkills.member3}
            onChange={(e) => handleDetailedChange('member3', e.target.value)}
            onFocus={(e) => e.target.select()}
            style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>멤버 4</label>
          <input
            type="number"
            value={detailedSkills.member4}
            onChange={(e) => handleDetailedChange('member4', e.target.value)}
            onFocus={(e) => e.target.select()}
            style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
          />
        </div>
      </div>
    </div>
  );

  const descriptionElement = (
    <p style={{ fontSize: '12px', color: '#666', marginTop: '-10px', marginBottom: '10px' }}>
      {isDetailedInput
        ? (
          <>
            종합력이 가장 높은 사람이 앵콜<br />
            세부판정 및 1픽 회선에 따라 점수 변동
          </>
        )
        : (
          <>
            5명이 모두 같은 내부치라 가정 후 점수 계산<br />
            자신의 내부치보단 주회방 조건 입력
          </>
        )
      }
    </p>
  );

  return (
    <div>
      <div id="power-tab-content">
        <InputTableWrapper>
          <InputRow
            label="종합력"
            value={power}
            onChange={e => setPower(e.target.value)}
            suffix="만"
            max="40"
          />
          <InputRow
            label="배수"
            value={effi}
            onChange={e => setEffi(e.target.value)}
            suffix="%"
            max="1000"
          />
          {!isDetailedInput && (
            <InputRow
              label="내부치"
              value={internalValue}
              onChange={e => setInternalValue(e.target.value)}
              suffix="%"
              max="2000"
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

        <div className="flex justify-center w-full mb-4">
          <button
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-all duration-200"
            onClick={() => setShowMySekaiTable(!showMySekaiTable)}
          >
            마이세카이 테이블
          </button>
        </div>
        {showMySekaiTable && <MySekaiTable />}

        <div className="w-full mt-4 mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-600 text-[10px] md:text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="px-1 py-1 md:px-4 md:py-2 font-bold text-center select-none">곡명</th>
                  <th className="px-1 py-1 md:px-4 md:py-2 font-bold text-center select-none">불</th>
                  <th className="px-1 py-1 md:px-4 md:py-2 font-bold text-center select-none">이벤포</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50 transition-colors duration-200 group/row">
                  <td className="px-1 py-1 md:px-4 md:py-2 font-bold text-gray-800 text-xs md:text-base text-center align-middle">
                    로앤파
                  </td>
                  <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                    {renderFireSelect('loAndFound')}
                  </td>
                  <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                    <span className="font-mono text-purple-600 text-sm md:text-base font-bold tracking-tight">
                      {formatScore(loAndFoundScore)}
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200 group/row">
                  <td className="px-1 py-1 md:px-4 md:py-2 font-bold text-gray-800 text-xs md:text-base text-center align-middle">
                    오마카세
                  </td>
                  <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                    {renderFireSelect('omakase')}
                  </td>
                  <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                    <span className="font-mono text-purple-600 text-sm md:text-base font-bold tracking-tight">
                      {formatScore(omakaseScore)}
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200 group/row">
                  <td className="px-1 py-1 md:px-4 md:py-2 font-bold text-gray-800 text-xs md:text-base text-center align-middle">
                    엔비
                  </td>
                  <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                    {renderFireSelect('envy')}
                  </td>
                  <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                    <span className="font-mono text-purple-600 text-sm md:text-base font-bold tracking-tight">
                      {formatScore(envyScore)}
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200 group/row">
                  <td className="px-4 py-3 font-bold text-gray-800 text-xs md:text-base text-center align-middle">
                    개벽 오토
                  </td>
                  <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                    {renderFireSelect('creationMyth', 1)}
                  </td>
                  <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                    <span className="font-mono text-purple-600 text-sm md:text-base font-bold tracking-tight">
                      {formatScore(creationMythScore, true)}
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors duration-200 group/row">
                  <td className="px-1 py-1 md:px-4 md:py-2 font-bold text-gray-800 text-xs md:text-base text-center align-middle">
                    마이세카이
                  </td>
                  <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                    <div className="flex justify-center w-full">
                      <span className="font-bold text-gray-700 text-center" style={{ fontSize: '14px', padding: '4px 0px', width: '60px', display: 'inline-block' }}>
                        1
                      </span>
                    </div>
                  </td>
                  <td className="px-1 py-1 md:px-4 md:py-2 text-center align-middle">
                    <span className="font-mono text-green-600 text-sm md:text-base font-bold tracking-tight">
                      {mySekaiScore > 0 ? mySekaiScore.toLocaleString() : 'N/A'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>



        <br></br>
        <p id="multi-eff">멀티효율: <span style={{ fontWeight: "bold", color: "blue" }}>{typeof multiEff === 'number' ? multiEff.toFixed(2) + '%' : multiEff}</span></p>
        <p id="solo-eff">솔로효율: <span style={{ fontWeight: "bold", color: "blue" }}>{typeof soloEff === 'number' ? soloEff.toFixed(2) + '%' : soloEff}</span></p>
        <p id="auto-eff">오토효율: <span style={{ fontWeight: "bold", color: "blue" }}>{typeof autoEff === 'number' ? autoEff.toFixed(2) + '%' : autoEff}</span></p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '-10px', marginBottom: '10px' }}><br></br>종합력 1만과 같은 효율의 배수<br />현 내부치 로앤파 점수 기준 효율</p>
      </div>
    </div>
  );
};

export default PowerTab;
