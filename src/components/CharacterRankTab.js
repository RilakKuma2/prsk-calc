
import React, { useState, useEffect, useMemo } from 'react';
import missionsJP from '../data/characterMissionV2s.json';
import missionsKR from '../data/characterMissionV2s_kr.json';
import missionsEN from '../data/characterMissionV2s_en.json';
import parameterGroups from '../data/characterMissionV2ParameterGroups.json';
import levels from '../data/levels.json';
import { useTranslation } from '../contexts/LanguageContext';

const CHARACTER_NAMES_KR = [
    "호시노 이치카", "텐마 사키", "모치즈키 호나미", "히노모리 시호",
    "하나사토 미노리", "키리타니 하루카", "모모이 아이리", "히노모리 시즈쿠",
    "아즈사와 코하네", "시라이시 안", "시노노메 아키토", "아오야기 토우야",
    "텐마 츠카사", "오토리 에무", "쿠사나기 네네", "카미시로 루이",
    "요이사키 카나데", "아사히나 마후유", "시노노메 에나", "아키야마 미즈키",
    "하츠네 미쿠", "카가미네 린", "카가미네 렌", "메구리네 루카", "MEIKO", "KAITO"
];

const CHARACTER_NAMES_JP = [
    "星乃一歌", "天馬咲希", "望月穂波", "日野森志歩",
    "花里みのり", "桐谷遥", "桃井愛莉", "日野森雫",
    "小豆沢こはね", "白石杏", "東雲彰人", "青柳冬弥",
    "天馬司", "鳳えむ", "草薙寧々", "神代類",
    "宵崎奏", "朝比奈まふゆ", "東雲絵名", "暁山瑞希",
    "初音ミク", "鏡音リン", "鏡音レン", "巡音ルカ", "MEIKO", "KAITO"
];

const CHARACTER_NAMES_EN = [
    "Hoshino Ichika", "Tenma Saki", "Mochizuki Honami", "Hinomori Shiho",
    "Hanasato Minori", "Kiritani Haruka", "Momoi Airi", "Hinomori Shizuku",
    "Azusawa Kohane", "Shiraishi An", "Shinonome Akito", "Aoyagi Toya",
    "Tenma Tsukasa", "Otori Emu", "Kusanagi Nene", "Kamishiro Rui",
    "Yoisaki Kanade", "Asahina Mafuyu", "Shinonome Ena", "Akiyama Mizuki",
    "Hatsune Miku", "Kagamine Rin", "Kagamine Len", "Megurine Luka", "MEIKO", "KAITO"
];

const MISSION_CONFIG = [
    { type: 'collect_member', tKey: 'member' },
    { type: 'collect_stamp', tKey: 'stamp' },
    { type: 'collect_costume_3d', tKey: 'costume' },
    { type: 'read_card_episode_first', tKey: 'side_story_1' },
    { type: 'read_card_episode_second', tKey: 'side_story_2' },
    { type: 'area_item_level_up_character', tKey: 'area_item_char' },
    { type: 'area_item_level_up_unit', tKey: 'area_item_unit' },
    { type: 'area_item_level_up_reality_world', tKey: 'area_item_type' },
    { type: 'skill_level_up_rare', tKey: 'skill_4' },
    { type: 'skill_level_up_standard', tKey: 'skill_3' },
    { type: 'master_rank_up_rare', tKey: 'mastery_4' },
    { type: 'master_rank_up_standard', tKey: 'mastery_3' },
    { type: 'collect_mysekai_fixture', tKey: 'mysekai_fixture' },
    { type: 'read_mysekai_fixture_unique_character_talk', tKey: 'mysekai_talk' },
    { type: 'collect_mysekai_canvas', tKey: 'canvas' },
    { type: 'collect_another_vocal', tKey: 'another_vocal' },
    { type: 'read_area_talk', tKey: 'area_talk' },
    { type: 'collect_character_archive_voice', tKey: 'voice' },
    { type: 'play_live', tKey: 'leader', exType: 'play_live_ex' },
    { type: 'waiting_room', tKey: 'waiting', exType: 'waiting_room_ex' },
    { type: 'challenge_stage', tKey: 'challenge_stage', isDirectExp: true },
    { type: 'etc', tKey: 'etc', isDirectExp: true },
];

const MISSION_GROUP_1 = [
    'collect_member', 'collect_stamp', 'collect_costume_3d',
    'collect_character_archive_voice', 'collect_another_vocal',
    'read_mysekai_fixture_unique_character_talk', 'read_area_talk'
];

const MISSION_GROUP_2 = [
    'play_live', 'waiting_room', 'read_card_episode_first', 'read_card_episode_second',
    'area_item_level_up_character', 'area_item_level_up_unit', 'area_item_level_up_reality_world',
    'skill_level_up_rare', 'skill_level_up_standard', 'master_rank_up_rare', 'master_rank_up_standard',
    'collect_mysekai_fixture', 'collect_mysekai_canvas'
];

const MISSION_GROUP_DIRECT = ['challenge_stage', 'etc'];

// Helper to chunk array
const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

const CharacterRankTab = ({ surveyData, setSurveyData }) => {
    const { t, language } = useTranslation();
    const [selectedCharId, setSelectedCharId] = useState(1);
    const [inputs, setInputs] = useState({}); // { charId: { missionType: value } }
    const [addInputs, setAddInputs] = useState({}); // { charId: { missionType: value } }
    const [isLoaded, setIsLoaded] = useState(false);
    const [expandedEx, setExpandedEx] = useState({}); // { type: boolean }

    // Load saved state from localStorage
    useEffect(() => {
        try {
            const savedInputs = JSON.parse(localStorage.getItem('charRankInputs') || '{}');
            const savedAddInputs = JSON.parse(localStorage.getItem('charRankAddInputs') || '{}');
            const savedCharId = JSON.parse(localStorage.getItem('charRankSelectedId') || '1');

            const savedExpandedEx = JSON.parse(localStorage.getItem('charRankExpandedEx') || '{}');
            setInputs(savedInputs);
            setAddInputs(savedAddInputs);
            setSelectedCharId(Number(savedCharId) || 1);
            setExpandedEx(savedExpandedEx);
        } catch (e) {
            console.error("Failed to load character rank data", e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (!isLoaded) return;
        try {
            localStorage.setItem('charRankInputs', JSON.stringify(inputs));
            localStorage.setItem('charRankAddInputs', JSON.stringify(addInputs));
            localStorage.setItem('charRankSelectedId', JSON.stringify(selectedCharId));
            localStorage.setItem('charRankExpandedEx', JSON.stringify(expandedEx));
        } catch (e) {
            console.error("Failed to save character rank data", e);
        }
    }, [inputs, addInputs, selectedCharId, expandedEx, isLoaded]);

    const toggleEx = (type) => {
        setExpandedEx(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    // Character names for current language
    const activeCharNames = useMemo(() => {
        if (language === 'ja') return CHARACTER_NAMES_JP;
        if (language === 'en') return CHARACTER_NAMES_EN;
        return CHARACTER_NAMES_KR;
    }, [language]);

    // Select active missions based on language
    const activeMissions = useMemo(() => {
        if (language === 'ja') return missionsJP;
        if (language === 'en') return missionsEN;
        return missionsKR;
    }, [language]);

    // Filter character levels
    const characterLevels = useMemo(() => {
        return levels
            .filter(l => l.levelType === 'character')
            .sort((a, b) => a.level - b.level);
    }, []);

    // Group parameters by ID for fast lookup
    const parameterMap = useMemo(() => {
        const map = {};
        parameterGroups.forEach(p => {
            if (!map[p.id]) map[p.id] = [];
            map[p.id].push(p);
        });
        // Sort by requirement
        Object.values(map).forEach(list => list.sort((a, b) => a.requirement - b.requirement));
        return map;
    }, []);

    const handleInputChange = (type, value, isAdd = false) => {
        const targetSet = isAdd ? setAddInputs : setInputs;
        targetSet(prev => ({
            ...prev,
            [selectedCharId]: {
                ...prev[selectedCharId],
                [type]: parseInt(value) || 0
            }
        }));
    };

    const calculateTotalExp = (charId, currentVals, addedVals = {}) => {
        let totalExp = 0;
        const charInputs = currentVals[charId] || {};
        const charAddInputs = addedVals[charId] || {};

        MISSION_CONFIG.forEach(config => {
            const baseVal = charInputs[config.type] || 0;
            const addVal = charAddInputs[config.type] || 0;
            const totalVal = baseVal + addVal;

            if (config.isDirectExp) {
                if (config.type === 'challenge_stage') {
                    const totalValCapped = Math.min(totalVal, 151);
                    totalExp += Math.max(0, totalValCapped - 1);
                } else {
                    totalExp += totalVal;
                }
                return;
            }

            // Normal Mission Calculation
            const mission = activeMissions.find(m => m.characterId === charId && m.characterMissionType === config.type);
            if (mission) {
                const params = parameterMap[mission.parameterGroupId] || [];
                const cleared = params.filter(p => p.requirement <= totalVal);
                const exp = cleared.reduce((sum, p) => sum + p.exp, 0);
                totalExp += exp;
            }

            // EX Mission Calculation
            if (config.exType) {
                const exType = config.exType;
                const exVal = charInputs[exType] || 0;
                const exAddVal = charAddInputs[exType] || 0;
                const totalExVal = exVal + exAddVal;

                const exMission = activeMissions.find(m => m.characterId === charId && m.characterMissionType === exType);
                if (exMission) {
                    const rawParams = parameterMap[exMission.parameterGroupId] || [];
                    const sortedParams = [...rawParams].sort((a, b) => a.seq - b.seq);

                    let remaining = totalExVal;
                    let currentSeq = 1;

                    // Simulate leveling up step by step
                    while (true) {
                        // Find the parameter entry that applies to the current sequence
                        // (Entry with param.seq <= currentSeq. We use the largest such seq)
                        let activeParam = sortedParams[0];
                        for (let i = 0; i < sortedParams.length; i++) {
                            if (sortedParams[i].seq <= currentSeq) {
                                activeParam = sortedParams[i];
                            } else {
                                break;
                            }
                        }

                        if (!activeParam) break;

                        const req = activeParam.requirement;

                        if (remaining >= req) {
                            remaining -= req;
                            // Add EXP from the parameter data (+1 for normal steps, 0 for kakera steps)
                            totalExp += (activeParam.exp || 0);
                            currentSeq++;
                        } else {
                            break;
                        }
                    }
                }
            }
        });
        return totalExp;
    };

    const getNextRequirement = (charId, type, currentVal) => {
        const config = MISSION_CONFIG.find(c => c.type === type);
        if (!config) return null;
        if (config.isDirectExp) return null;

        const mission = activeMissions.find(m => m.characterId === charId && m.characterMissionType === type);
        if (mission) {
            const params = parameterMap[mission.parameterGroupId] || [];
            const nextParam = params.find(p => p.requirement > currentVal);
            return nextParam ? { requirement: nextParam.requirement, exp: nextParam.exp } : null;
        }
        return null;
    }

    // Helper for EX Calculations (Dry run to get UI data)
    const getExStatus = (charId, type, currentTotal) => {
        const mission = activeMissions.find(m => m.characterId === charId && m.characterMissionType === type);
        if (!mission) return { currentSeq: 1, currentProgress: 0, required: 0 };

        const rawParams = parameterMap[mission.parameterGroupId] || [];
        if (rawParams.length === 0) return { currentSeq: 1, currentProgress: 0, required: 0 };

        const sortedParams = [...rawParams].sort((a, b) => a.seq - b.seq);

        let remaining = currentTotal;
        let currentSeq = 1;

        while (true) {
            let activeParam = sortedParams[0];
            for (let i = 0; i < sortedParams.length; i++) {
                if (sortedParams[i].seq <= currentSeq) {
                    activeParam = sortedParams[i];
                } else {
                    break;
                }
            }
            // Fallback to last param for infinite EX support
            if (!activeParam) {
                activeParam = sortedParams[sortedParams.length - 1];
            }
            if (!activeParam) break; // Should not happen if params exist
            const req = activeParam.requirement;

            if (remaining >= req) {
                remaining -= req;
                currentSeq++;
            } else {
                return { currentSeq, currentProgress: remaining, required: req };
            }
        }
        return { currentSeq, currentProgress: remaining, required: 0 };
    }

    const getRankInfo = (totalExp) => {
        let currentLevelObj = characterLevels[0];
        let nextLevelObj = null;

        for (let i = 0; i < characterLevels.length; i++) {
            if (totalExp >= characterLevels[i].totalExp) {
                currentLevelObj = characterLevels[i];
                if (i + 1 < characterLevels.length) {
                    nextLevelObj = characterLevels[i + 1];
                } else {
                    nextLevelObj = null;
                }
            } else {
                break;
            }
        }

        if (!currentLevelObj) return { rank: 1, remainder: 0, required: 1 };
        const rank = currentLevelObj.level;

        if (!nextLevelObj) {
            return { rank, isMax: true };
        }

        const levelExpBase = currentLevelObj.totalExp;
        const levelExpNext = nextLevelObj.totalExp;
        const remainder = totalExp - levelExpBase;
        const required = levelExpNext - levelExpBase;

        return { rank, remainder, required, isMax: false };
    };

    const currentTotalExp = calculateTotalExp(selectedCharId, inputs);
    const expectedTotalExp = calculateTotalExp(selectedCharId, inputs, addInputs);

    const currentRankInfo = getRankInfo(currentTotalExp);
    const expectedRankInfo = getRankInfo(expectedTotalExp);

    const [modalConfig, setModalConfig] = useState(null);

    const openMissionInfo = (type) => {
        const config = MISSION_CONFIG.find(c => c.type === type);
        if (!config) return;

        const typesToCheck = [config.type];
        if (config.exType) typesToCheck.push(config.exType);

        const missionDetails = typesToCheck.map(t => {
            const m = activeMissions.find(mission => mission.characterId === selectedCharId && mission.characterMissionType === t);
            if (!m) return null;

            const params = parameterMap[m.parameterGroupId] || [];
            const sortedParams = [...params].sort((a, b) => a.seq - b.seq);
            const groupedLevels = [];
            let currentGroup = null;
            let runningExCumulative = 0;
            sortedParams.forEach((lvl, idx) => {
                const isExType = t === 'play_live_ex' || t === 'waiting_room_ex';

                if (!isExType) {
                    const prevReq = idx === 0 ? 0 : sortedParams[idx - 1].requirement;
                    const delta = lvl.requirement - prevReq;
                    if (currentGroup && !currentGroup.isEx && currentGroup.delta === delta && currentGroup.exp === lvl.exp) {
                        currentGroup.levels.push(lvl.seq);
                        currentGroup.requirements.push(lvl.requirement);
                    } else {
                        if (currentGroup) groupedLevels.push(currentGroup);
                        currentGroup = {
                            isEx: false,
                            delta: delta,
                            exp: lvl.exp,
                            levels: [lvl.seq],
                            requirements: [lvl.requirement]
                        };
                    }
                } else {
                    if (currentGroup) groupedLevels.push(currentGroup);
                    currentGroup = null;

                    const nextSeq = idx < sortedParams.length - 1 ? sortedParams[idx + 1].seq : lvl.seq + 1;
                    const stepCount = nextSeq - lvl.seq;
                    const stepCumulatives = [];
                    const stepRequirements = [];
                    for (let s = 0; s < stepCount; s++) {
                        runningExCumulative += lvl.requirement;
                        stepCumulatives.push(runningExCumulative);
                        stepRequirements.push(lvl.requirement);
                    }
                    groupedLevels.push({
                        isEx: true,
                        exp: lvl.exp,
                        quantity: lvl.quantity || 0,
                        cumulatives: stepCumulatives,
                        requirements: stepRequirements
                    });
                }
            });
            if (currentGroup) groupedLevels.push(currentGroup);

            const isEx = t.includes('_ex') || config.isDirectExp || false;
            let sentence = m.sentence || "";
            const charName = activeCharNames[selectedCharId - 1] || "";

            sentence = sentence
                .replace(/'호시노 이치카'/g, charName)
                .replace(/호시노 이치카/g, charName)
                .replace(/｢星乃一歌｣/g, charName)
                .replace(/\[캐릭터\]/g, charName)
                .replace(/\[Character\]/g, charName)
                .replace(/\[Unit\]/g, charName);

            const maxReq = sortedParams.length > 0 ? sortedParams[sortedParams.length - 1].requirement : 0;
            sentence = sentence.replace(/{requirement}|\[목표값\]/g, maxReq.toLocaleString());

            // Calculate total EXP for display row
            const totalExpForType = sortedParams.reduce((sum, p) => {
                const isExType = t === 'play_live_ex' || t === 'waiting_room_ex';
                return sum + (isExType ? Math.max(0, p.seq - 1) : p.exp);
            }, 0);

            return {
                type: t,
                isEx,
                sentence,
                groupedLevels,
                totalRequirement: maxReq,
                totalExp: totalExpForType
            };
        }).filter(Boolean);

        setModalConfig({
            title: t(`rank.missions.${config.tKey}`),
            data: missionDetails,
            charName: activeCharNames[selectedCharId - 1]
        });
    };

    const renderCard = (type) => {
        const config = MISSION_CONFIG.find(c => c.type === type);
        if (!config) return null;

        const currentVal = (inputs[selectedCharId] || {})[config.type] || 0;
        const addVal = (addInputs[selectedCharId] || {})[config.type] || 0;
        let nextReq = getNextRequirement(selectedCharId, config.type, currentVal);

        // If Maxed (no next param), use the last param's requirement to allow overflow display
        if (!nextReq && !config.isDirectExp) {
            const mission = activeMissions.find(m => m.characterId === selectedCharId && m.characterMissionType === config.type);
            const params = mission ? (parameterMap[mission.parameterGroupId] || []) : [];
            if (params.length > 0) {
                const lastParam = params[params.length - 1];
                nextReq = { requirement: lastParam.requirement };
            }
        }

        let percent = 0;
        let addedPercent = 0;

        if (nextReq) {
            const totalVal = currentVal + addVal;
            percent = Math.min(100, (currentVal / nextReq.requirement) * 100);
            addedPercent = Math.min(100, (totalVal / nextReq.requirement) * 100);
        } else {
            percent = 100;
            addedPercent = 100;
        }

        const isChallenge = config.type === 'challenge_stage';
        const displayVal = isChallenge && currentVal >= 151 ? 'EX' : (currentVal === 0 ? '' : currentVal);
        const displayAddVal = addVal === 0 ? '' : addVal;

        const getChallengeExp = (val) => Math.max(0, Math.min(val, 151) - 1);
        const currentExp = isChallenge ? getChallengeExp(currentVal) : currentVal;
        const addTotalExp = isChallenge ? getChallengeExp(currentVal + addVal) : (currentVal + addVal);

        // EX Mode variables
        const hasExMode = !!config.exType;
        const isExExpanded = expandedEx[config.type];

        let exCurrentVal = 0, exAddVal = 0, exNextReq = null, exPercent = 0, exAddedPercent = 0;
        let exCurrentSeq = 0;

        if (hasExMode) {
            exCurrentVal = (inputs[selectedCharId] || {})[config.exType] || 0;
            exAddVal = (addInputs[selectedCharId] || {})[config.exType] || 0;

            const exStatusBase = getExStatus(selectedCharId, config.exType, exCurrentVal);
            const exStatusTotal = getExStatus(selectedCharId, config.exType, exCurrentVal + exAddVal);

            exCurrentSeq = exStatusBase.currentSeq;
            exNextReq = { requirement: exStatusBase.required, seq: exStatusBase.currentSeq };
            exPercent = Math.min(100, (exStatusBase.currentProgress / exStatusBase.required) * 100);

            const isSameSeq = exStatusBase.currentSeq === exStatusTotal.currentSeq;
            exAddedPercent = isSameSeq
                ? Math.min(100, (exStatusTotal.currentProgress / exStatusBase.required) * 100)
                : 100;

            // If we have added value overlapping to next level, just show full bar with indication?
            // For now, simpler visual: 
            // If seq changes, the added bar simply fills to the end.
        }

        return (
            <div key={config.type} className="bg-white rounded-xl shadow-md p-4 border border-gray-100 flex flex-col h-full relative">
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-gray-700 text-sm">{t(`rank.missions.${config.tKey}`)}</h3>
                            <button
                                onClick={() => openMissionInfo(config.type)}
                                className="text-gray-400 hover:text-indigo-500 transition-colors focus:outline-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </button>
                        </div>
                        {hasExMode && (
                            <button
                                onClick={() => toggleEx(config.type)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${isExExpanded ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-pink-500 border-pink-200 hover:bg-pink-50'}`}
                            >
                                EX
                            </button>
                        )}
                    </div>

                    {/* Standard Input */}
                    <div className="flex flex-col gap-0.5 mb-1">
                        <div className="flex items-center justify-between bg-gray-50 rounded px-1 py-0.5">
                            <label className="text-[10px] text-gray-500 px-1 whitespace-nowrap">{t('rank.current')}</label>
                            <input
                                type={isChallenge ? "text" : "number"}
                                min="0"
                                className={`w-full bg-transparent outline-none text-right font-mono text-sm ${isChallenge && currentVal >= 151 ? 'font-bold text-pink-500' : ''}`}
                                value={displayVal}
                                placeholder="0"
                                onChange={(e) => handleInputChange(config.type, e.target.value)}
                            />
                        </div>

                        <div className="text-gray-400 font-bold text-center text-[10px] leading-none">+</div>

                        <div className="flex items-center justify-between bg-indigo-50 rounded px-1 py-0.5">
                            <label className="text-[10px] text-indigo-500 px-1 whitespace-nowrap">{t('rank.added')}</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full bg-transparent outline-none text-right font-mono text-sm text-indigo-700"
                                value={displayAddVal}
                                placeholder="0"
                                onChange={(e) => handleInputChange(config.type, e.target.value, true)}
                            />
                        </div>
                    </div>

                    {/* Standard Progress Display - Rendered inline between inputs if EX exists or at bottom of standard input */}
                    {!config.isDirectExp && nextReq && (
                        <div className="mt-2 text-[10px]">
                            <div className="flex justify-between items-end text-gray-500 mb-1">
                                <span className="font-medium text-emerald-600">{t('rank.next')}</span>
                                <div className="text-right">
                                    <div>{currentVal} / {nextReq.requirement}</div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                {/* Current Bar */}
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-emerald-400 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                                {/* Added Bar */}
                                {addVal > 0 && (
                                    <div className="h-1.5 bg-indigo-50 rounded-full overflow-hidden relative">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-indigo-400 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${addedPercent}%` }}
                                        ></div>
                                    </div>
                                )}

                                {/* EXP Gain Display */}
                                {addVal > 0 && (
                                    <div className="flex justify-between items-start mt-0.5">
                                        <div className="text-[10px] text-indigo-500 font-medium whitespace-nowrap">
                                            {(() => {
                                                const mission = activeMissions.find(m => m.characterId === selectedCharId && m.characterMissionType === config.type);
                                                if (!mission) return '';
                                                const params = parameterMap[mission.parameterGroupId] || [];
                                                const clearedBase = params.filter(p => p.requirement <= currentVal);
                                                const expBase = clearedBase.reduce((sum, p) => sum + p.exp, 0);
                                                const clearedTotal = params.filter(p => p.requirement <= currentVal + addVal);
                                                const expTotal = clearedTotal.reduce((sum, p) => sum + p.exp, 0);
                                                const diff = expTotal - expBase;
                                                return `+${diff} EXP`;
                                            })()}
                                        </div>
                                        <div className="text-[10px] text-right text-indigo-500 font-medium">
                                            {currentVal + addVal} / {nextReq.requirement}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* EX Input Section */}
                    {hasExMode && isExExpanded && (
                        <div className="mt-2 pt-2 border-t border-dashed border-pink-100 animate-fadeIn">
                            <div className="text-[10px] text-pink-500 font-bold mb-1 flex justify-between">
                                <span>EX</span>
                                <span>{t('rank.cycle', { count: exCurrentSeq })}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center justify-between bg-pink-50/30 rounded px-1 py-0.5 border border-pink-100">
                                    <label className="text-[10px] text-pink-400 px-1 whitespace-nowrap">{t('rank.current')}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full bg-transparent outline-none text-right font-mono text-sm text-pink-600"
                                        value={exCurrentVal === 0 ? '' : exCurrentVal}
                                        placeholder="0"
                                        onChange={(e) => handleInputChange(config.exType, e.target.value)}
                                    />
                                </div>
                                <div className="text-pink-300 font-bold text-center text-[10px] leading-none">+</div>
                                <div className="flex items-center justify-between bg-indigo-50/50 rounded px-1 py-0.5 border border-indigo-100">
                                    <label className="text-[10px] text-indigo-400 px-1 whitespace-nowrap">{t('rank.added')}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full bg-transparent outline-none text-right font-mono text-sm text-indigo-600"
                                        value={exAddVal === 0 ? '' : exAddVal}
                                        placeholder="0"
                                        onChange={(e) => handleInputChange(config.exType, e.target.value, true)}
                                    />
                                </div>
                            </div>

                            {/* EX Progress Bar */}
                            <div className="mt-2">
                                <div className="flex justify-between items-end text-[10px] text-pink-400 mb-0.5">
                                    <span>Next: {t('rank.cycle', { count: exNextReq.seq + 1 })}</span>
                                    {/* Use getExStatus result for display */}
                                    {(() => {
                                        const status = getExStatus(selectedCharId, config.exType, exCurrentVal);
                                        return <span>{status.currentProgress} / {status.required}</span>;
                                    })()}
                                </div>

                                <div className="space-y-1">
                                    <div className="h-1 bg-pink-100 rounded-full overflow-hidden relative">
                                        <div className="absolute top-0 left-0 h-full bg-pink-400 transition-all" style={{ width: `${exPercent}%` }}></div>
                                    </div>
                                    {exAddVal > 0 && (
                                        <div className="h-1 bg-indigo-50 rounded-full overflow-hidden relative">
                                            <div className="absolute top-0 left-0 h-full bg-indigo-400 transition-all" style={{ width: `${exAddedPercent}%` }}></div>
                                        </div>
                                    )}
                                </div>

                                {/* EX Exp Gain */}
                                {exAddVal > 0 && (
                                    <div className="text-[10px] text-right text-indigo-500 font-medium mt-0.5">
                                        {(() => {
                                            const statusBase = getExStatus(selectedCharId, config.exType, exCurrentVal);
                                            const statusTotal = getExStatus(selectedCharId, config.exType, exCurrentVal + exAddVal);
                                            const expBase = Math.min(30, Math.max(0, statusBase.currentSeq - 1));
                                            const expTotal = Math.min(30, Math.max(0, statusTotal.currentSeq - 1));
                                            const diff = expTotal - expBase;
                                            return `+${diff} EXP`;
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Standard Progress Display Removed from here, moved to above EX block */}
                {/* Remove the MAX block as requested, we now always show progress (handled by nextReq failover) */}
            </div>
        );
    };

    const expDiff = expectedTotalExp - currentTotalExp;
    const rankDiff = expectedRankInfo.rank - currentRankInfo.rank;

    return (
        <div className="px-4 pt-2 max-w-4xl mx-auto">
            {modalConfig && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setModalConfig(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 text-lg">{modalConfig.title}</h3>
                            <button onClick={() => setModalConfig(null)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar">
                            {modalConfig.data.map((detail, idx) => (
                                <div key={idx} className="relative">
                                    {detail.isEx && (
                                        <span className="absolute -top-2 left-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">EX</span>
                                    )}
                                    <div className={`border rounded-lg p-4 ${detail.isEx ? 'border-pink-100 bg-pink-50/10 mt-2' : 'border-gray-100 bg-white'}`}>
                                        <p className="text-sm text-gray-600 mb-3 leading-relaxed break-keep">{detail.sentence}</p>

                                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                                            <table className="w-full text-xs text-center whitespace-nowrap">
                                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                                    <tr>
                                                        <th className="px-3 py-2 border-b border-r border-gray-200">
                                                            {t('rank.modal.cumulative')}
                                                        </th>
                                                        <th className="px-3 py-2 border-b border-r border-gray-200">
                                                            {t('rank.modal.req_per_lvl')}
                                                        </th>
                                                        <th className="px-3 py-2 border-b border-gray-200">{t('rank.modal.exp_gain')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {detail.groupedLevels.map((group, gIdx) => {
                                                        let cumulativeText = "";
                                                        let perLevelText = "";

                                                        if (group.isEx) {
                                                            cumulativeText = group.cumulatives.map(v => v.toLocaleString()).join('/');
                                                            perLevelText = group.requirements[0].toLocaleString();
                                                        } else {
                                                            // Standard range formatting for Cumulative column
                                                            cumulativeText = group.requirements[0].toLocaleString();
                                                            if (group.requirements.length > 1) {
                                                                if (group.requirements.length <= 4) {
                                                                    cumulativeText = group.requirements.map(r => r.toLocaleString()).join('/');
                                                                } else {
                                                                    const start = group.requirements.slice(0, 2).map(r => r.toLocaleString()).join('/');
                                                                    const end = group.requirements.slice(-2).map(r => r.toLocaleString()).join('/');
                                                                    cumulativeText = `${start}...${end}`;
                                                                }
                                                            }
                                                            perLevelText = group.delta > 0 ? group.delta.toLocaleString() : '-';
                                                        }

                                                        return (
                                                            <tr key={gIdx} className="hover:bg-gray-50/50">
                                                                <td className="px-3 py-2 border-r border-gray-100">{cumulativeText}</td>
                                                                <td className="px-3 py-2 border-r border-gray-100 text-gray-500">
                                                                    {perLevelText}
                                                                </td>
                                                                <td className={`px-3 py-2 font-medium ${group.exp === 0 && group.quantity > 0 ? 'text-pink-600' : 'text-emerald-600'}`}>
                                                                    {group.exp === 0 && group.quantity > 0
                                                                        ? `+${group.quantity}${t('rank.modal.kakera')}`
                                                                        : `+${group.exp}`}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <div className="mb-2 flex justify-center">
                <select
                    className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-lg font-medium min-w-[200px]"
                    value={selectedCharId}
                    onChange={(e) => setSelectedCharId(parseInt(e.target.value))}
                >
                    {activeCharNames.map((name, index) => (
                        <option key={index + 1} value={index + 1}>
                            {name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                {MISSION_GROUP_1.map(type => renderCard(type))}
            </div>

            <div className="space-y-3 mb-3">
                {chunkArray(MISSION_GROUP_2, 6).map((chunk, i) => {
                    const isFullChunk = chunk.length === 6;
                    return (
                        <div
                            key={i}
                            className={isFullChunk ? "grid grid-cols-2 grid-flow-col grid-rows-[auto_auto_auto] gap-3" : "grid grid-cols-2 gap-3"}
                        >
                            {chunk.map(type => renderCard(type))}
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-2">
                {MISSION_GROUP_DIRECT.map(type => renderCard(type))}
            </div>

            <div className="text-[10px] text-gray-400 text-right mb-4 px-1">
                {t('rank.missions.etc_note')}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 border-t border-gray-200 z-[100] safe-area-bottom">
                <div className="max-w-4xl mx-auto flex items-center justify-between px-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">{t('rank.current_rank')}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-gray-800 leading-none">{currentRankInfo.rank}</span>
                            {!currentRankInfo.isMax && (
                                <span className="text-xs text-gray-400 font-normal">
                                    ({currentRankInfo.remainder}/{currentRankInfo.required})
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-2xl text-gray-300">➜</div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-indigo-500 font-bold">{t('rank.expected_rank')}</span>
                        <div className="flex items-baseline gap-2">
                            <div className="flex items-baseline gap-1">
                                <span className={`text-3xl font-black leading-none ${rankDiff > 0 ? 'text-indigo-600' : 'text-gray-800'}`}>
                                    {expectedRankInfo.rank}
                                </span>
                                {!expectedRankInfo.isMax && (
                                    <span className="text-xs text-gray-400 font-normal">
                                        ({expectedRankInfo.remainder}/{expectedRankInfo.required})
                                    </span>
                                )}
                            </div>
                            {expDiff > 0 && (
                                <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                                    <span>+{rankDiff}</span>
                                    <span className="text-[10px] font-normal opacity-90">({expDiff} EXP)</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterRankTab;
