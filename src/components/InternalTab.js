import React, { useState, useEffect } from 'react';

const InternalTab = ({ surveyData, setSurveyData }) => {
  const [leader, setLeader] = useState(surveyData.leader || '');
  const [member2, setMember2] = useState(surveyData.member2 || '');
  const [member3, setMember3] = useState(surveyData.member3 || '');
  const [member4, setMember4] = useState(surveyData.member4 || '');
  const [member5, setMember5] = useState(surveyData.member5 || '');

  const [internalSum, setInternalSum] = useState(0);
  const [effectiveValue, setEffectiveValue] = useState(0);

  useEffect(() => {
    const newSurveyData = { ...surveyData, leader, member2, member3, member4, member5 };
    setSurveyData(newSurveyData);

    const leaderVal = parseInt(leader) || 0;
    const member2Val = parseInt(member2) || 0;
    const member3Val = parseInt(member3) || 0;
    const member4Val = parseInt(member4) || 0;
    const member5Val = parseInt(member5) || 0;

    const sum = leaderVal + member2Val + member3Val + member4Val + member5Val;
    setInternalSum(sum);

    const effective = Math.floor(leaderVal + (member2Val + member3Val + member4Val + member5Val) * 0.2);
    setEffectiveValue(effective);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leader, member2, member3, member4, member5]);

  return (
    <div id="internal-tab-content">
      <label htmlFor="leader">리더 스킬:</label>
      <input type="number" id="leader" min="0" value={leader} onChange={e => setLeader(e.target.value)} onFocus={(e) => e.target.select()} />
      <span>%</span><br />

      <label htmlFor="member2">멤버2 스킬:</label>
      <input type="number" id="member2" min="0" value={member2} onChange={e => setMember2(e.target.value)} onFocus={(e) => e.target.select()} />
      <span>%</span><br />

      <label htmlFor="member3">멤버3 스킬:</label>
      <input type="number" id="member3" min="0" value={member3} onChange={e => setMember3(e.target.value)} onFocus={(e) => e.target.select()} />
      <span>%</span><br />

      <label htmlFor="member4">멤버4 스킬:</label>
      <input type="number" id="member4" min="0" value={member4} onChange={e => setMember4(e.target.value)} onFocus={(e) => e.target.select()} />
      <span>%</span><br />

      <label htmlFor="member5">멤버5 스킬:</label>
      <input type="number" id="member5" min="0" value={member5} onChange={e => setMember5(e.target.value)} onFocus={(e) => e.target.select()} />
      <span>%</span>


      <p id="internal-effective">실효치: <span style={{ fontWeight: "bold", color: "blue" }}>{effectiveValue.toFixed(0)}%</span> = <span style={{ fontWeight: "bold", color: "blue" }}>{(effectiveValue / 100 + 1).toFixed(2)}배</span></p>
      <p id="internal-sum">내부합: <span style={{ fontWeight: "bold", color: "blue" }}>{internalSum}</span></p>
      <p id="internal-calculation-text">실효치 = 리더 + (나머지멤버) * 0.2</p>
    </div>
  );
};

export default InternalTab;
