import React, { useState, useEffect } from 'react';
import { InputTableWrapper, InputRow } from './common/InputComponents';
import { useTranslation } from '../contexts/LanguageContext';

const InternalTab = ({ surveyData, setSurveyData }) => {
  const { t } = useTranslation();
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

    const leaderVal = parseInt(leader || '120') || 0;
    const member2Val = parseInt(member2 || '100') || 0;
    const member3Val = parseInt(member3 || '100') || 0;
    const member4Val = parseInt(member4 || '100') || 0;
    const member5Val = parseInt(member5 || '100') || 0;

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
          label={t('internal.leader_skill')}
          value={leader}
          onChange={e => setLeader(e.target.value)}
          placeholder="120"
          suffix="%"
        />
        <InputRow
          label={t('internal.member_2')}
          value={member2}
          onChange={e => setMember2(e.target.value)}
          placeholder="100"
          suffix="%"
        />
        <InputRow
          label={t('internal.member_3')}
          value={member3}
          onChange={e => setMember3(e.target.value)}
          placeholder="100"
          suffix="%"
        />
        <InputRow
          label={t('internal.member_4')}
          value={member4}
          onChange={e => setMember4(e.target.value)}
          placeholder="100"
          suffix="%"
        />
        <InputRow
          label={t('internal.member_5')}
          value={member5}
          onChange={e => setMember5(e.target.value)}
          placeholder="100"
          suffix="%"
        />
      </InputTableWrapper>

      {/* Result Section - Amatsuyu Style */}
      <div className="w-[85%] max-w-[240px] mx-auto space-y-4">
        <div className="bg-white rounded-lg p-3">
          <div className="grid grid-cols-2 items-center mb-1 text-center">
            <span className="text-gray-600">{t('internal.effective_value')}</span>
            <div>
              <span className="font-bold text-blue-600 text-lg mr-1">{effectiveValue.toFixed(0)}%</span>
              <span className="text-sm text-gray-500">({(effectiveValue / 100 + 1).toFixed(2)}{t('internal.multiplier')})</span>
            </div>
          </div>
          <div className="grid grid-cols-2 items-center pt-1 mt-1 text-center">
            <span className="text-gray-600">{t('internal.internal_sum')}</span>
            <span className="font-bold text-blue-600">{internalSum}%</span>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center">
          {t('internal.formula')}
        </div>
      </div>
    </div>
  );
};

export default InternalTab;
