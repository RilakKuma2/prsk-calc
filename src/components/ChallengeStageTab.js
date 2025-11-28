import React, { useState, useEffect } from 'react';
import { InputTableWrapper, InputRow, SelectRow } from './common/InputComponents';
import { challData } from '../data/challData';

const ChallengeStageTab = ({ surveyData, setSurveyData }) => {
    const [currentStage, setCurrentStage] = useState(surveyData.currentStage || '');
    const [remainingScore, setRemainingScore] = useState(surveyData.remainingScore || '');
    const [targetStage, setTargetStage] = useState(surveyData.targetStage || '');
    const [challengeScore, setChallengeScore] = useState(surveyData.challengeScore || '');
    const [pass, setPass] = useState(surveyData.pass || '1');

    const [result, setResult] = useState('');

    useEffect(() => {
        const newSurveyData = { ...surveyData, currentStage, remainingScore, targetStage, challengeScore, pass };
        setSurveyData(newSurveyData);

        const currentStageVal = parseInt(currentStage) || 0;
        let targetStageVal = targetStage;
        const challengeScoreVal = parseInt(challengeScore) || 0;
        const remainingScoreVal = parseInt(remainingScore) || 0;
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
<span style="font-weight: bold; color: red;">올바른 스테이지 값을 입력해주세요.</span><br><br>
목표 스테이지 151 이상 입력 시 EX로 자동변환
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
판당 점수: <span style="font-weight: bold; color: blue;">${scorePerPlay}</span><br><br>
필요 점수: <span style="font-weight: bold; color: blue;">${neededScore}</span><br><br>
남은 일수: <span style="font-weight: bold; color: blue;">${neededPlays}</span><br><br>
<span style="font-weight: bold"><a target="_blank" rel="noopener noreferrer" href="https://3-3.dev/sekai/top-deck">챌라 이론덱</a></span><br>
<span style="font-weight: bold"><a target="_blank" rel="noopener noreferrer" href="https://m.dcinside.com/board/pjsekai/1893145">챌라 스킬 순서</a></span><br>
<span style="font-weight: bold"><a target="_blank" rel="noopener noreferrer" href="https://m.dcinside.com/board/pjsekai/2262136">군청찬가 초고점 뽑기</a></span><br><br>
목표 스테이지 151 이상 입력 시 EX로 자동변환
`);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStage, remainingScore, targetStage, challengeScore, pass]);

    return (
        <div id="challenge-stage-tab-content" className="p-4 space-y-4">
            {/* Input Section */}
            <InputTableWrapper>
                <InputRow
                    label="현재 스테이지"
                    value={currentStage}
                    onChange={e => setCurrentStage(e.target.value)}
                    placeholder="예: 102"
                    min="1"
                />
                <InputRow
                    label="남은 점수"
                    value={remainingScore}
                    onChange={e => setRemainingScore(e.target.value)}
                    placeholder="예: 4518"
                    min="0"
                />
                <InputRow
                    label="목표 스테이지"
                    value={targetStage}
                    onChange={e => setTargetStage(e.target.value)}
                    type="text"
                    placeholder="예: 140"
                    min="1"
                />
                <InputRow
                    label="챌라 점수"
                    value={challengeScore}
                    onChange={e => setChallengeScore(e.target.value)}
                    suffix="만"
                    placeholder="예: 260"
                    min="0"
                    max="300"
                />
                <SelectRow
                    label="컬패 여부"
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
                {result && result.includes("올바른 스테이지") ? (
                    <div className="text-red-500 font-bold text-center text-sm">
                        올바른 스테이지 값을 입력해주세요.<br />
                        <span className="text-gray-500 font-normal text-xs">목표 스테이지 151 이상 입력 시 EX로 자동변환</span>
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
                                const currentStageVal = parseInt(currentStage) || 0;
                                let targetStageVal = targetStage;
                                const challengeScoreVal = parseInt(challengeScore) || 0;
                                const remainingScoreVal = parseInt(remainingScore) || 0;
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
                                            <span className="text-gray-600">필요 점수</span>
                                            <span className="font-bold text-blue-600">{neededScore.toLocaleString()}</span>
                                        </div>
                                        <div className="grid grid-cols-2 items-center mb-1 text-center">
                                            <span className="text-gray-600">판당 점수</span>
                                            <span className="font-bold text-blue-600">{Math.floor(scorePerPlay).toLocaleString()}</span>
                                        </div>
                                        <div className="grid grid-cols-2 items-center pt-1 border-t mt-1 text-center">
                                            <span className="text-gray-600">남은 일수</span>
                                            <span className="font-bold text-blue-600">{neededPlays.toLocaleString()}일</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        <div className="text-sm text-gray-600 text-center space-y-2">
                            <div className="flex flex-col space-y-1">
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                                목표 스테이지 151 이상 입력 시 EX로 자동변환
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChallengeStageTab;
