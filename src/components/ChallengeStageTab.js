import React, { useState, useEffect } from 'react';
import { InputTableWrapper, InputRow, SelectRow } from './common/InputComponents';
import { challData } from '../data/challData';
import { useTranslation } from '../contexts/LanguageContext';

const ChallengeStageTab = ({ surveyData, setSurveyData }) => {
    const { t } = useTranslation();
    const [currentStage, setCurrentStage] = useState(surveyData.currentStage || '');
    const [remainingScore, setRemainingScore] = useState(surveyData.remainingScore || '');
    const [targetStage, setTargetStage] = useState(surveyData.targetStage || '');
    const [challengeScore, setChallengeScore] = useState(surveyData.challengeScore || '');
    const [pass, setPass] = useState(surveyData.pass || '1');

    const [result, setResult] = useState('');

    useEffect(() => {
        const newSurveyData = { ...surveyData, currentStage, remainingScore, targetStage, challengeScore, pass };
        setSurveyData(newSurveyData);

        const currentStageVal = parseInt(currentStage || '120') || 0;
        let targetStageVal = targetStage || 'EX';
        const challengeScoreVal = parseInt(challengeScore || '260') || 0;
        const remainingScoreVal = parseInt(remainingScore || '4518') || 0;
        const passVal = parseInt(pass);

        if (!isNaN(targetStageVal) && parseInt(targetStageVal) > 150) {
            setTargetStage("EX");
            targetStageVal = "EX";
        }

        targetStageVal =
            targetStageVal === "EX" ? 151 : parseInt(targetStageVal) || 0;

        if (
            currentStageVal < 1 ||
            targetStageVal < 1 ||
            currentStageVal >= targetStageVal
        ) {
            setResult(`
<span style="font-weight: bold; color: red;">${t('challenge_stage.error_stage')}</span><br><br>
${t('challenge_stage.ex_stage_desc')}
`);
            return;
        }

        const currentCumulative = challData[currentStageVal].cumulative;
        const targetCumulative = challData[targetStageVal - 1].cumulative;

        const scorePerPlay =
            (Math.floor((challengeScoreVal * 24) / 10) +
                400 +
                Math.floor(challengeScoreVal / 20) * 2) /
            passVal;

        const neededScore = targetCumulative - currentCumulative + remainingScoreVal;

        const neededPlays = Math.ceil(neededScore / scorePerPlay);

        setResult(`
${t('challenge_stage.score_per_round')}: <span style="font-weight: bold; color: blue;">${scorePerPlay}</span><br><br>
${t('challenge_stage.needed_score')}: <span style="font-weight: bold; color: blue;">${neededScore}</span><br><br>
${t('challenge_stage.remaining_days')}: <span style="font-weight: bold; color: blue;">${neededPlays}</span><br><br>
<span style="font-weight: bold"><a target="_blank" rel="noopener noreferrer" href="https://3-3.dev/sekai/top-deck">${t('challenge_stage.theory_deck_link')}</a></span><br>
<span style="font-weight: bold"><a target="_blank" rel="noopener noreferrer" href="https://m.dcinside.com/board/pjsekai/1893145">${t('challenge_stage.skill_order_link')}</a></span><br>
<span style="font-weight: bold"><a target="_blank" rel="noopener noreferrer" href="https://m.dcinside.com/board/pjsekai/2262136">${t('challenge_stage.high_score_link')}</a></span><br><br>
${t('challenge_stage.ex_stage_desc')}
`);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStage, remainingScore, targetStage, challengeScore, pass, t]);

    return (
        <div id="challenge-stage-tab-content" className="p-4 space-y-4">
            {/* Input Section */}
            <InputTableWrapper>
                <InputRow
                    label={t('challenge_stage.current_stage')}
                    value={currentStage}
                    onChange={e => setCurrentStage(e.target.value)}
                    placeholder="120"
                    min="1"
                />
                <InputRow
                    label={t('challenge_stage.remaining_score')}
                    value={remainingScore}
                    onChange={e => setRemainingScore(e.target.value)}
                    placeholder="4518"
                    min="0"
                />
                <InputRow
                    label={t('challenge_stage.target_stage')}
                    value={targetStage}
                    onChange={e => setTargetStage(e.target.value)}
                    type="text"
                    placeholder="EX"
                    min="1"
                />
                <InputRow
                    label={t('challenge_stage.challenge_score')}
                    value={challengeScore}
                    onChange={e => setChallengeScore(e.target.value)}
                    suffix={t('challenge_stage.suffix_man')}
                    placeholder="260"
                    min="0"
                    max="300"
                />
                <SelectRow
                    label={t('challenge_stage.pass_status')}
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    options={[
                        { value: "1", label: "Y" },
                        { value: "2", label: "N" },
                    ]}
                />
            </InputTableWrapper>

            {/* Result Section - Amatsuyu Style */}
            <div className="w-[85%] max-w-[280px] mx-auto space-y-4">
                {result && result.includes(t('challenge_stage.error_stage')) ? (
                    <div className="text-red-500 font-bold text-center text-sm">
                        {t('challenge_stage.error_stage')}<br />
                        <span className="text-gray-500 font-normal text-xs">{t('challenge_stage.ex_stage_desc')}</span>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-lg  p-3">
                            {/* Extract values from the logic instead of parsing HTML string if possible, 
                  but since the logic is inside useEffect and sets 'result' string, 
                  we should ideally refactor the logic to set state variables. 
                  For now, I will assume the logic is simple enough to replicate or I'll just use the state if I refactored it.
                  Wait, I didn't refactor the logic to set state variables in the previous steps.
                  I should probably use the variables calculated in the render if I move the logic there, or parse the result.
                  Actually, looking at the previous file content, the logic was in useEffect setting 'result' string.
                  I should move the calculation logic to the body of the component or a helper to get values.
                  
                  Let's quickly check the logic again. 
                  It uses `currentStage`, `targetStage`, `challengeScore`, `pass`.
                  I can recalculate these in the render function to display them cleanly.
              */}
                            {(() => {
                                const currentStageVal = parseInt(currentStage || '120') || 0;
                                let targetStageVal = targetStage || 'EX';
                                const challengeScoreVal = parseInt(challengeScore || '260') || 0;
                                const remainingScoreVal = parseInt(remainingScore || '4518') || 0;
                                const passVal = parseInt(pass);

                                if (!isNaN(targetStageVal) && parseInt(targetStageVal) > 150) {
                                    targetStageVal = "EX";
                                }
                                const targetStageNum = targetStageVal === "EX" ? 151 : parseInt(targetStageVal) || 0;

                                if (currentStageVal < 1 || targetStageNum < 1 || currentStageVal >= targetStageNum) {
                                    return null; // Handled by error check above
                                }

                                // Import challData is needed but it's already imported.
                                // I need to access challData here. It is available in the scope.

                                const currentCumulative = challData[currentStageVal]?.cumulative || 0;
                                const targetCumulative = challData[targetStageNum - 1]?.cumulative || 0;

                                const scorePerPlay = (Math.floor((challengeScoreVal * 24) / 10) + 400 + Math.floor(challengeScoreVal / 20) * 2) / passVal;
                                const neededScore = targetCumulative - currentCumulative + remainingScoreVal;
                                const neededPlays = Math.ceil(neededScore / scorePerPlay);

                                return (
                                    <>
                                        <div className="grid grid-cols-2 items-center mb-1 text-center">
                                            <span className="text-gray-600">{t('challenge_stage.needed_score')}</span>
                                            <span className="font-bold text-blue-600">{neededScore.toLocaleString()}</span>
                                        </div>
                                        <div className="grid grid-cols-2 items-center mb-1 text-center">
                                            <span className="text-gray-600">{t('challenge_stage.score_per_round')}</span>
                                            <span className="font-bold text-blue-600">{Math.floor(scorePerPlay).toLocaleString()}</span>
                                        </div>
                                        <div className="grid grid-cols-2 items-center pt-1 border-t mt-1 text-center">
                                            <span className="text-gray-600">{t('challenge_stage.remaining_days')}</span>
                                            <span className="font-bold text-blue-600">{neededPlays.toLocaleString()}{t('challenge_stage.suffix_day')}</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        <div className="text-sm text-gray-600 text-center space-y-2">
                            <div className="flex flex-col space-y-1">
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                                {t('challenge_stage.ex_stage_desc')}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChallengeStageTab;
