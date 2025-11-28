import React, { useState, useEffect } from 'react';
import { InputTableWrapper, InputRow } from './common/InputComponents';

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
    <div id="internal-tab-content" className="p-4 space-y-4">
      {/* Input Section */}
      <InputTableWrapper>
        <InputRow
          label="리더 스킬"
          value={leader}
          onChange={e => setLeader(e.target.value)}
          placeholder="예: 120"
          suffix="%"
        />
        <InputRow
          label="멤버 2"
          value={member2}
          onChange={e => setMember2(e.target.value)}
          placeholder="예: 120"
          suffix="%"
        />
        <InputRow
          label="멤버 3"
          value={member3}
          onChange={e => setMember3(e.target.value)}
          placeholder="예: 120"
          suffix="%"
        />
        <InputRow
          label="멤버 4"
          value={member4}
          onChange={e => setMember4(e.target.value)}
          placeholder="예: 120"
          suffix="%"
        />
        <InputRow
          label="멤버 5"
          value={member5}
          onChange={e => setMember5(e.target.value)}
          placeholder="예: 120"
          suffix="%"
        />
      </InputTableWrapper>

      {/* Result Section - Amatsuyu Style */}
      <div className="w-[85%] max-w-[240px] mx-auto space-y-4">
        <div className="bg-white rounded-lg p-3">
          <div className="grid grid-cols-2 items-center mb-1 text-center">
            <span className="text-gray-600">실효치</span>
            <div>
              <span className="font-bold text-blue-600 text-lg mr-1">{effectiveValue.toFixed(0)}%</span>
              <span className="text-sm text-gray-500">({(effectiveValue / 100 + 1).toFixed(2)}배)</span>
            </div>
          </div>
          <div className="grid grid-cols-2 items-center pt-1 mt-1 text-center">
            <span className="text-gray-600">내부합</span>
            <span className="font-bold text-blue-600">{internalSum}%</span>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center">
          실효치 = 리더 + (나머지멤버) * 0.2
        </div>
      </div>
    </div>
  );
};

export default InternalTab;
