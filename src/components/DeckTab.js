import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { InputTableWrapper, InputRow, SectionHeaderRow } from './common/InputComponents';
import { calculateRawInternalValue, calculateInternalValue } from '../utils/deckUtils';

// Import result components
import AutoTab from './AutoTab';
import PowerTab from './PowerTab';

// Bloom Fes Awakening skill levels: [base%, max%]
const BLOOM_LEVELS = {
    0: null, // X - no bloom
    1: [60, 120],
    2: [65, 130],
    3: [70, 140],
    4: [80, 150]
};

function DeckTab({ surveyData, setSurveyData, subPath }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Map subPath to view key
    const getViewFromSubPath = (sp) => {
        if (sp === 'auto') return 'auto';
        return 'power'; // default to 'power' (ep)
    };

    // Active deck selector (1, 2, 3) - Default to value from surveyData or 1
    const [activeDeckNum, setActiveDeckNum] = useState(surveyData.activeDeckNum || 1);

    // Result view selector - Sync with URL subPath
    const [activeResultView, setActiveResultView] = useState(getViewFromSubPath(subPath)); // 'auto', 'power'

    // Update activeResultView when subPath changes (e.g., browser back/forward)
    useEffect(() => {
        setActiveResultView(getViewFromSubPath(subPath));
    }, [subPath]);

    // Manual internal value state for power view
    const [manualInternalValue, setManualInternalValue] = useState('');
    const activeDeckKey = `deck${activeDeckNum}`;
    const isManualInternalEdit = surveyData.unifiedDecks?.[activeDeckKey]?.isManualInternalEdit || false;
    // Detailed room skills input state
    const showDetailedInput = surveyData.unifiedDecks?.[activeDeckKey]?.isDetailedInput || false;
    const detailedRoomSkills = surveyData.unifiedDecks?.[activeDeckKey]?.detailedSkills || {
        encore: '',
        member1: '',
        member2: '',
        member3: '',
        member4: ''
    };

    // Update detailed room skill and sync to surveyData
    const updateDetailedRoomSkill = (key, value) => {
        const newSkills = { ...detailedRoomSkills, [key]: value };
        // Update surveyData and unifiedDecks
        setSurveyData(prev => ({
            ...prev,
            unifiedDecks: {
                ...prev.unifiedDecks,
                [activeDeckKey]: {
                    ...prev.unifiedDecks[activeDeckKey],
                    detailedSkills: newSkills,
                    isDetailedInput: true
                }
            },
            detailedSkills: newSkills,
            isDetailedInput: true
        }));
    };

    // Toggle detailed input visibility
    const setShowDetailedInput = (show) => {
        setSurveyData(prev => ({
            ...prev,
            unifiedDecks: {
                ...prev.unifiedDecks,
                [activeDeckKey]: {
                    ...prev.unifiedDecks[activeDeckKey],
                    isDetailedInput: show
                }
            },
            isDetailedInput: show
        }));
    };

    // Get current deck for calculations
    const getActiveDeck = () => surveyData.unifiedDecks?.[`deck${activeDeckNum}`] || {};

    // Sync manualInternalValue with unifiedDecks internalValue
    useEffect(() => {
        const deckInternalValue = surveyData.unifiedDecks?.[activeDeckKey]?.internalValue;
        if (deckInternalValue) {
            setManualInternalValue(deckInternalValue);
        }
    }, [surveyData.unifiedDecks, activeDeckKey]);

    // Initialize unified decks if not exists
    useEffect(() => {
        if (!surveyData.unifiedDecks) {
            setSurveyData(prev => ({
                ...prev,
                unifiedDecks: {
                    deck1: {
                        totalPower: prev.autoDeck?.totalPower || '',
                        skillLeader: prev.autoDeck?.skillLeader || '',
                        skillMember2: prev.autoDeck?.skillMember2 || '',
                        skillMember3: prev.autoDeck?.skillMember3 || '',
                        skillMember4: prev.autoDeck?.skillMember4 || '',
                        skillMember5: prev.autoDeck?.skillMember5 || '',
                        eventBonus: prev.autoDeck?.eventBonus || '',
                        internalValue: '',
                        isManualInternalEdit: false,
                        detailedSkills: { encore: '', member1: '', member2: '', member3: '', member4: '' },
                        isDetailedInput: false
                    },
                    deck2: { totalPower: '', skillLeader: '', skillMember2: '', skillMember3: '', skillMember4: '', skillMember5: '', eventBonus: '', internalValue: '', isManualInternalEdit: false, detailedSkills: { encore: '', member1: '', member2: '', member3: '', member4: '' }, isDetailedInput: false },
                    deck3: { totalPower: '', skillLeader: '', skillMember2: '', skillMember3: '', skillMember4: '', skillMember5: '', eventBonus: '', internalValue: '', isManualInternalEdit: false, detailedSkills: { encore: '', member1: '', member2: '', member3: '', member4: '' }, isDetailedInput: false },
                    activeDeck: 1
                }
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Get current deck values
    const currentDeck = surveyData.unifiedDecks?.[`deck${activeDeckNum}`] || {};
    const { totalPower, skillLeader, skillMember2, skillMember3, skillMember4, skillMember5, eventBonus } = currentDeck;

    // Bloom Fes Awakening state
    const useBloomFes = currentDeck.useBloomFes || false;
    const bloomLevels = currentDeck.bloomLevels || { leader: 0, member2: 0, member3: 0, member4: 0, member5: 0 };

    // Update bloom fes toggle
    const updateUseBloomFes = (checked) => {
        setSurveyData(prev => {
            const currentDeck = prev.unifiedDecks?.[`deck${activeDeckNum}`];
            const updatedDeck = {
                ...currentDeck,
                useBloomFes: checked,
                bloomLevels: checked ? (currentDeck?.bloomLevels || { leader: 0, member2: 0, member3: 0, member4: 0, member5: 0 }) : { leader: 0, member2: 0, member3: 0, member4: 0, member5: 0 }
            };

            // Recalculate internal value when toggling bloom fes
            const preciseInternalVal = calculateInternalValueFromDeck(updatedDeck);
            const internalVal = Math.floor(preciseInternalVal / 10) * 10;

            // If manual override is active, checking logic might be complex.
            // But usually toggling a feature like this implies we want to see the effect.
            // However, to be consistent with updateDeck, we respect manual override unless it's considered a "skill update".
            // Toggling bloom fes IS a skill update effectively.
            const isManual = currentDeck?.isManualInternalEdit || false;
            // Let's force update if it affects skills.
            const finalInternalValue = String(internalVal);
            // We force update and reset manual flag because this is a significant mode change affecting skills

            return {
                ...prev,
                unifiedDecks: {
                    ...prev.unifiedDecks,
                    [`deck${activeDeckNum}`]: {
                        ...updatedDeck,
                        internalValue: finalInternalValue,
                        isManualInternalEdit: false // Reset manual edit on toggle
                    }
                }
            };
        });
    };

    // Update bloom level for a specific member
    const updateBloomLevel = (memberKey, level) => {
        setSurveyData(prev => {
            const currentDeck = prev.unifiedDecks?.[`deck${activeDeckNum}`];
            const updatedDeck = {
                ...currentDeck,
                bloomLevels: {
                    ...currentDeck?.bloomLevels,
                    [memberKey]: level
                }
            };

            // Recalculate internal value
            const preciseInternalVal = calculateInternalValueFromDeck(updatedDeck);
            const internalVal = Math.floor(preciseInternalVal / 10) * 10;

            return {
                ...prev,
                unifiedDecks: {
                    ...prev.unifiedDecks,
                    [`deck${activeDeckNum}`]: {
                        ...updatedDeck,
                        internalValue: String(internalVal),
                        isManualInternalEdit: false // Reset manual edit on change
                    }
                }
            };
        });
    };

    // Calculate bloom skill range based on other members' skills
    // Logic: base% + up to 50% of another random member's max skill
    // For min: use base only (random member could have 0 contribution)
    // For max: base + 50% of highest other member's skill (use bloom max if they have bloom)
    const getBloomSkillRange = (memberKey) => {
        const level = bloomLevels[memberKey];
        if (!level || !BLOOM_LEVELS[level]) return null;
        const [base, maxCap] = BLOOM_LEVELS[level];

        // Get all member skills with their effective values
        const memberSkills = {
            leader: { val: Number(skillLeader) || 120, bloomLevel: bloomLevels.leader },
            member2: { val: Number(skillMember2) || 100, bloomLevel: bloomLevels.member2 },
            member3: { val: Number(skillMember3) || 100, bloomLevel: bloomLevels.member3 },
            member4: { val: Number(skillMember4) || 100, bloomLevel: bloomLevels.member4 },
            member5: { val: Number(skillMember5) || 100, bloomLevel: bloomLevels.member5 },
        };

        // Find the highest skill value among OTHER members
        let maxOtherSkill = 0;
        let minOtherSkill = Infinity;

        Object.entries(memberSkills).forEach(([key, data]) => {
            if (key === memberKey) return; // Skip self

            // Get effective skill value (use bloom max if they have bloom awakening)
            let effectiveSkill = data.val;
            if (data.bloomLevel && BLOOM_LEVELS[data.bloomLevel]) {
                effectiveSkill = BLOOM_LEVELS[data.bloomLevel][1]; // Use max value for bloom members
            }

            maxOtherSkill = Math.max(maxOtherSkill, effectiveSkill);
            minOtherSkill = Math.min(minOtherSkill, effectiveSkill);
        });

        // Calculate actual range: base + otherSkill/2
        const minSkill = Math.min(base + Math.floor(minOtherSkill * 0.5), maxCap);
        const maxSkill = Math.min(base + Math.floor(maxOtherSkill * 0.5), maxCap);

        return { min: minSkill, max: maxSkill };
    };

    // Calculate effective value range based on bloom skills
    // Returns { minEffective, maxEffective, minInternalSum, maxInternalSum, leaderMin, leaderMax }
    const getBloomEffectiveValueRange = () => {
        // Get effective skill values for each member (min and max if bloom)
        const getSkillRange = (memberKey, baseValue, defaultVal) => {
            const bloomRange = getBloomSkillRange(memberKey);
            if (bloomRange) {
                return { min: bloomRange.min, max: bloomRange.max };
            }
            const val = Number(baseValue) || defaultVal;
            return { min: val, max: val };
        };

        const leader = getSkillRange('leader', skillLeader, 120);
        const m2 = getSkillRange('member2', skillMember2, 100);
        const m3 = getSkillRange('member3', skillMember3, 100);
        const m4 = getSkillRange('member4', skillMember4, 100);
        const m5 = getSkillRange('member5', skillMember5, 100);

        // Calculate min and max internal sum
        const minInternalSum = leader.min + m2.min + m3.min + m4.min + m5.min;
        const maxInternalSum = leader.max + m2.max + m3.max + m4.max + m5.max;

        // Calculate effective value: leader + (sum of others) * 0.2
        const minEffective = Math.floor(leader.min + (m2.min + m3.min + m4.min + m5.min) * 0.2);
        const maxEffective = Math.floor(leader.max + (m2.max + m3.max + m4.max + m5.max) * 0.2);

        return {
            minEffective,
            maxEffective,
            minInternalSum,
            maxInternalSum,
            leaderMin: leader.min,
            leaderMax: leader.max,
            hasRange: minEffective !== maxEffective
        };
    };

    // Calculate effective internal value from deck data (handling Bloom Fes)
    const calculateInternalValueFromDeck = (deckData) => {
        // Prepare data for getBloomSkillRange logic
        // We can't reuse getBloomEffectiveValueRange because it uses component state consts
        // So we reimplement the logic here using passed deckData

        const useBloom = deckData.useBloomFes || false;
        const blooms = deckData.bloomLevels || { leader: 0, member2: 0, member3: 0, member4: 0, member5: 0 };

        const leaderVal = Number(deckData.skillLeader || 120);
        const m2Val = Number(deckData.skillMember2 || 100);
        const m3Val = Number(deckData.skillMember3 || 100);
        const m4Val = Number(deckData.skillMember4 || 100);
        const m5Val = Number(deckData.skillMember5 || 100);

        if (!useBloom) {
            // Standard formula: Leader + (Sum Others)*0.2
            // No flooring here, allow precise value? Original code floored to 10.
            // Wait, previous code: Math.floor((leader + (m2 + m3 + m4 + m5) * 0.2) / 10) * 10;
            // But recent user request fixed effective val 1s digit. 
            // So we should just floor to integer: Math.floor(...)
            return Math.floor(leaderVal + (m2Val + m3Val + m4Val + m5Val) * 0.2);
        }

        // With Bloom Fes, we use MINIMUM effective value
        const getSkillMin = (memberKey, baseVal) => {
            const level = blooms[memberKey];
            if (!level || !BLOOM_LEVELS[level]) return baseVal;

            const [base, maxCap] = BLOOM_LEVELS[level];

            // Calculate minOtherSkill
            const memberSkills = {
                leader: { val: leaderVal, bloomLevel: blooms.leader },
                member2: { val: m2Val, bloomLevel: blooms.member2 },
                member3: { val: m3Val, bloomLevel: blooms.member3 },
                member4: { val: m4Val, bloomLevel: blooms.member4 },
                member5: { val: m5Val, bloomLevel: blooms.member5 },
            };

            let minOtherSkill = Infinity;
            Object.entries(memberSkills).forEach(([k, data]) => {
                if (k === memberKey) return;
                let effectiveSkill = data.val;
                if (data.bloomLevel && BLOOM_LEVELS[data.bloomLevel]) {
                    effectiveSkill = BLOOM_LEVELS[data.bloomLevel][1]; // Blooms reference max
                }
                minOtherSkill = Math.min(minOtherSkill, effectiveSkill);
            });

            return Math.min(base + Math.floor(minOtherSkill * 0.5), maxCap);
        };

        const lMin = getSkillMin('leader', leaderVal);
        const m2Min = getSkillMin('member2', m2Val);
        const m3Min = getSkillMin('member3', m3Val);
        const m4Min = getSkillMin('member4', m4Val);
        const m5Min = getSkillMin('member5', m5Val);

        return Math.floor(lMin + (m2Min + m3Min + m4Min + m5Min) * 0.2);
    };

    // Update current deck and sync power/effi/internalValue for PowerTab
    const updateDeck = (key, value) => {
        setSurveyData(prev => {
            const currentDeckData = prev.unifiedDecks?.[`deck${activeDeckNum}`] || {};
            const updatedDeck = {
                ...currentDeckData,
                [key]: value
            };

            // Calculate internal value from skills
            const preciseInternalVal = calculateInternalValueFromDeck(updatedDeck);
            // Floor to 10 for Room Condition
            const internalVal = Math.floor(preciseInternalVal / 10) * 10;



            // If the updated key is one of the skill keys, we should force update the internal value
            // and reset the manual override flag.
            const isSkillUpdate = key.startsWith('skill') || key === 'skillLeader';
            // Actually 'skillLeader' starts with 'skill', so startsWith is enough.

            // Wait, we need to respect existing isManualInternalEdit if it's NOT a skill update (e.g. power update)
            // But 'isManualInternalEdit' comes from top scope?
            // Actually, we should check `prev.unifiedDecks[activeDeckKey].isManualInternalEdit`.
            // But let's look at how it was: `isManualInternalEdit ? updatedDeck.internalValue : String(internalVal)`
            // `isManualInternalEdit` is a variable activeDeck's property.

            const prevIsManual = prev.unifiedDecks?.[`deck${activeDeckNum}`]?.isManualInternalEdit || false;
            const effectiveIsManual = isSkillUpdate ? false : prevIsManual;

            // If it's a skill update, we use the calculated internalVal.
            // If it's NOT a skill update, and we were in manual mode, we keep the existing internalValue (from updatedDeck, which copied currentDeckData).
            // If it's NOT a skill update, and we were NOT in manual mode, we use calculated internalVal (which should be same as before if skills didn't change).

            const finalInternalValue = effectiveIsManual ? (updatedDeck.internalValue || String(internalVal)) : String(internalVal);

            return {
                ...prev,
                unifiedDecks: {
                    ...prev.unifiedDecks,
                    [`deck${activeDeckNum}`]: {
                        ...updatedDeck,
                        internalValue: finalInternalValue,
                        isManualInternalEdit: effectiveIsManual
                    }
                },
                autoDeck: updatedDeck,
                // For PowerTab real-time update
                power: String((Number(updatedDeck.totalPower || 293231)) / 10000),
                effi: String(updatedDeck.eventBonus || 250),
                internalValue: finalInternalValue,
                isManualInternalEdit: effectiveIsManual
            };
        });
    };

    // Sync autoDeck when switching decks
    useEffect(() => {
        if (surveyData.unifiedDecks?.[`deck${activeDeckNum}`]) {
            setSurveyData(prev => {
                const targetDeck = prev.unifiedDecks?.[`deck${activeDeckNum}`];
                return {
                    ...prev,
                    autoDeck: { ...targetDeck },
                    internalValue: targetDeck?.internalValue || '',
                    isManualInternalEdit: targetDeck?.isManualInternalEdit || false,
                    detailedSkills: targetDeck?.detailedSkills || { encore: '', member1: '', member2: '', member3: '', member4: '' },
                    isDetailedInput: targetDeck?.isDetailedInput || false
                };
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeDeckNum]);

    // Wrapped setSurveyData that also updates power/effi/internalValue for PowerTab compatibility
    const wrappedSetSurveyData = (updater) => {
        setSurveyData(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            const deck = next.unifiedDecks?.[`deck${activeDeckNum}`] || currentDeck;
            const internalVal = calculateInternalValue(deck);

            const activeDeckObjInNext = next.unifiedDecks?.[activeDeckKey];
            const activeDeckObjInPrev = prev.unifiedDecks?.[activeDeckKey];
            const currentDeckData = activeDeckObjInNext || currentDeck;

            // Check if active deck changed (simple reference check)
            if (activeDeckObjInNext === activeDeckObjInPrev && activeDeckObjInPrev) {
                // Active deck unchanged - just sync top-level values
                return {
                    ...next,
                    internalValue: activeDeckObjInNext.internalValue,
                    autoDeck: activeDeckObjInNext,
                    power: String((Number(activeDeckObjInNext.totalPower || 293231)) / 10000),
                    effi: String(activeDeckObjInNext.eventBonus || 250)
                };
            }

            // Determine internal value and manual edit flag
            const internalValueChanged = activeDeckObjInNext?.internalValue !== activeDeckObjInPrev?.internalValue;
            const newIsManualInternalEdit = activeDeckObjInNext?.isManualInternalEdit ??
                (next.isManualInternalEdit ?? isManualInternalEdit);
            const newInternalValue = internalValueChanged && activeDeckObjInNext
                ? activeDeckObjInNext.internalValue
                : (newIsManualInternalEdit ? next.internalValue : String(internalVal));

            return {
                ...next,
                unifiedDecks: {
                    ...next.unifiedDecks,
                    [`deck${activeDeckNum}`]: {
                        ...currentDeckData,
                        internalValue: newInternalValue,
                        isManualInternalEdit: newIsManualInternalEdit,
                        detailedSkills: (next.detailedSkills ?? detailedRoomSkills),
                        isDetailedInput: (next.isDetailedInput ?? showDetailedInput)
                    }
                },
                power: String((Number(deck.totalPower || 293231)) / 10000),
                effi: String(deck.eventBonus || 250),
                internalValue: newInternalValue,
                autoDeck: deck
            };
        });
    };

    return (
        <div id="deck-tab-content">
            {/* Deck Selector */}
            <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3].map(num => (
                    <button
                        key={num}
                        onClick={() => {
                            setActiveDeckNum(num);
                            // Persist selection
                            setSurveyData(prev => ({ ...prev, activeDeckNum: num }));
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${activeDeckNum === num
                            ? 'bg-indigo-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {t('deck.deck_label') || '덱'} {num}
                    </button>
                ))}
            </div>

            {/* Shared Input Section */}
            <InputTableWrapper>
                <InputRow
                    label={t('auto.total_power')}
                    value={totalPower !== null && totalPower !== undefined ? totalPower : ''}
                    onChange={(e) => {
                        let val = e.target.value;
                        if (val !== '' && Number(val) >= 500000) {
                            val = '480000';
                        }
                        updateDeck('totalPower', val === '' ? '' : Number(val));
                    }}
                    onBlur={(e) => {
                        const valStr = e.target.value;
                        if (valStr === '') return;
                        const val = Number(valStr);
                        if (val > 0 && val <= 50) {
                            updateDeck('totalPower', val * 10000);
                        } else if (val >= 100 && val <= 500) {
                            updateDeck('totalPower', val * 1000);
                        } else if (val >= 1000 && val <= 5000) {
                            updateDeck('totalPower', val * 100);
                        } else if (val >= 10000 && val <= 47000) {
                            updateDeck('totalPower', val * 10);
                        }
                    }}
                    placeholder="293231"
                    spacer={true}
                />
                <SectionHeaderRow
                    label={t('auto.member_skills')}
                    spacer={!useBloomFes}
                    extraHeader={useBloomFes ? (t('auto.bloom_skill') || '블룸각전') : null}
                />

                {/* Leader skill input with bloom selector */}
                <tr>
                    <td className="text-right pr-2 py-0" style={{ verticalAlign: 'middle' }}>
                        <label className="whitespace-nowrap font-bold text-gray-700">{t('auto.leader')}</label>
                    </td>
                    <td className="text-left py-0">
                        <div className="flex items-center gap-1">
                            {/* Show input OR range based on bloom selection */}
                            {getBloomSkillRange('leader') ? (
                                <div className="w-28 text-center bg-indigo-50 rounded-lg px-2 py-1.5 text-indigo-700 font-medium">
                                    {getBloomSkillRange('leader').min}~{getBloomSkillRange('leader').max}%
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="number"
                                        value={skillLeader !== null && skillLeader !== undefined ? skillLeader : ''}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (val !== '' && Number(val) > 160) {
                                                val = '160';
                                            }
                                            updateDeck('skillLeader', val === '' ? '' : Number(val));
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        className="w-28 text-center bg-gray-50 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="120"
                                    />
                                    <span className="ml-1 text-gray-600">%</span>
                                </>
                            )}
                        </div>
                    </td>
                    {useBloomFes && (
                        <td className="pl-1">
                            <select
                                value={bloomLevels.leader || 0}
                                onChange={(e) => updateBloomLevel('leader', Number(e.target.value))}
                                className="text-sm px-2 py-1 border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-300 min-w-[60px]"
                            >
                                <option value={0}>{t('auto.bloom_level_none') || 'X'}</option>
                                <option value={1}>{t('auto.bloom_level_1') || 'LV.1'}</option>
                                <option value={2}>{t('auto.bloom_level_2') || 'LV.2'}</option>
                                <option value={3}>{t('auto.bloom_level_3') || 'LV.3'}</option>
                                <option value={4}>{t('auto.bloom_level_4') || 'LV.4'}</option>
                            </select>
                        </td>
                    )}
                    {!useBloomFes && <td className="w-8"></td>}
                </tr>

                {/* Member skill inputs with bloom selectors */}
                {[
                    { label: t('auto.member_2'), val: skillMember2, key: 'skillMember2', bloomKey: 'member2' },
                    { label: t('auto.member_3'), val: skillMember3, key: 'skillMember3', bloomKey: 'member3' },
                    { label: t('auto.member_4'), val: skillMember4, key: 'skillMember4', bloomKey: 'member4' },
                    { label: t('auto.member_5'), val: skillMember5, key: 'skillMember5', bloomKey: 'member5' },
                ].map((m, i) => (
                    <tr key={i}>
                        <td className="text-right pr-2 py-0" style={{ verticalAlign: 'middle' }}>
                            <label className="whitespace-nowrap font-bold text-gray-700">{m.label}</label>
                        </td>
                        <td className="text-left py-0">
                            <div className="flex items-center gap-1">
                                {/* Show input OR range based on bloom selection */}
                                {getBloomSkillRange(m.bloomKey) ? (
                                    <div className="w-28 text-center bg-indigo-50 rounded-lg px-2 py-1.5 text-indigo-700 font-medium">
                                        {getBloomSkillRange(m.bloomKey).min}~{getBloomSkillRange(m.bloomKey).max}%
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="number"
                                            value={m.val !== null && m.val !== undefined ? m.val : ''}
                                            onChange={(e) => {
                                                let val = e.target.value;
                                                if (val !== '' && Number(val) > 160) {
                                                    val = '160';
                                                }
                                                updateDeck(m.key, val === '' ? '' : Number(val));
                                            }}
                                            onFocus={(e) => e.target.select()}
                                            className="w-28 text-center bg-gray-50 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="100"
                                        />
                                        <span className="ml-1 text-gray-600">%</span>
                                    </>
                                )}
                            </div>
                        </td>
                        {useBloomFes && (
                            <td className="pl-1">
                                <select
                                    value={bloomLevels[m.bloomKey] || 0}
                                    onChange={(e) => updateBloomLevel(m.bloomKey, Number(e.target.value))}
                                    className="text-sm px-2 py-1 border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-300 min-w-[60px]"
                                >
                                    <option value={0}>{t('auto.bloom_level_none') || 'X'}</option>
                                    <option value={1}>{t('auto.bloom_level_1') || 'LV.1'}</option>
                                    <option value={2}>{t('auto.bloom_level_2') || 'LV.2'}</option>
                                    <option value={3}>{t('auto.bloom_level_3') || 'LV.3'}</option>
                                    <option value={4}>{t('auto.bloom_level_4') || 'LV.4'}</option>
                                </select>
                            </td>
                        )}
                        {!useBloomFes && <td className="w-8"></td>}
                    </tr>
                ))}
                <InputRow
                    label={t('auto.event_bonus')}
                    value={eventBonus !== null && eventBonus !== undefined ? eventBonus : ''}
                    onChange={(e) => {
                        const val = e.target.value;
                        updateDeck('eventBonus', val === '' ? '' : Number(val));
                    }}
                    suffix="%"
                    placeholder="250"
                    spacer={true}
                />

                {/* Bloom Fes Awakening Checkbox */}
                <tr>
                    <td colSpan="3" className="pt-2 pb-0">
                        <label className="flex items-center justify-center gap-2 cursor-pointer text-sm">
                            <input
                                type="checkbox"
                                checked={useBloomFes}
                                onChange={(e) => updateUseBloomFes(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <span className="text-gray-700">{t('auto.bloom_fes_awakening') || '블룸페스 각전 사용'}</span>
                        </label>
                    </td>
                </tr>
            </InputTableWrapper>

            {/* Result View Selector */}
            <div className="flex justify-center gap-2 mb-2 mt-1">
                {[
                    { key: 'power', label: t('deck.power') || '이벤포', urlPath: 'ep' },
                    { key: 'auto', label: t('deck.auto') || '오토', urlPath: 'auto' }
                ].map(view => (
                    <button
                        key={view.key}
                        onClick={() => {
                            const scrollY = window.scrollY;
                            setActiveResultView(view.key);
                            // Update URL without scroll reset
                            navigate(`/event/${view.urlPath}`, { replace: true, preventScrollReset: true });
                            // Restore scroll position after DOM fully updates (double rAF)
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    window.scrollTo(0, scrollY);
                                });
                            });
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${activeResultView === view.key
                            ? 'bg-indigo-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {view.label}
                    </button>
                ))}
            </div>

            {/* Internal Value Input for Power view (hidden in VS mode) */}
            {activeResultView === 'power' && !surveyData.isComparisonMode && (() => {
                const bloomRange = getBloomEffectiveValueRange();
                return (
                    <div className="flex flex-col items-center mb-4 mt-2">
                        <div className="flex flex-col items-center gap-1 mb-2">
                            <div className="flex items-center gap-4 text-base font-medium">
                                <div>
                                    <span className="text-gray-500">{t('deck.my_internal_value')}: </span>
                                    <span className="text-blue-600 font-bold">
                                        {bloomRange.hasRange
                                            ? `${bloomRange.minEffective}~${bloomRange.maxEffective}%`
                                            : `${bloomRange.minEffective}%`
                                        }
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">{t('internal.internal_sum')}: </span>
                                    <span className="text-blue-600 font-bold">
                                        {bloomRange.leaderMin}/{bloomRange.minInternalSum}
                                    </span>
                                </div>
                            </div>
                            <div className="text-[10px] text-gray-400">
                                ({t('deck.formula_explanation')})
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">{t('power.internal_value') || '방 실효치'}</span>
                            <input
                                type="number"
                                value={manualInternalValue}
                                onChange={(e) => {
                                    const newVal = e.target.value;
                                    setManualInternalValue(newVal);
                                    // Update surveyData
                                    setSurveyData(prev => {
                                        const update = { ...prev };

                                        // In DeckTab, this input always refers to the active deck.
                                        // The instruction about `isComparisonMode` and `deck1` seems to be for PowerTab.js.
                                        // For DeckTab, we always update the active deck and the top-level internalValue.
                                        update.unifiedDecks = {
                                            ...prev.unifiedDecks,
                                            [activeDeckKey]: {
                                                ...prev.unifiedDecks?.[activeDeckKey],
                                                internalValue: newVal,
                                                isManualInternalEdit: true
                                            }
                                        };
                                        update.internalValue = newVal;
                                        update.isManualInternalEdit = true;

                                        return update;
                                    });
                                }}
                                onFocus={(e) => e.target.select()}
                                className={`w-20 text-center border rounded px-2 py-1 text-sm font-bold ${isManualInternalEdit ? 'text-blue-600 border-blue-300' : 'text-gray-700 border-gray-300'
                                    }`}
                                placeholder={String(calculateInternalValue(getActiveDeck()))}
                            />
                            <span className="text-sm text-gray-500">%</span>
                        </div>
                    </div>
                )
            })()}

            {/* Render Both Tabs, Toggle Visibility with CSS (prevents scroll jump on switch) */}
            <div className="deck-results-container">
                <div style={{ display: activeResultView === 'auto' ? 'block' : 'none' }}>
                    <AutoTab
                        surveyData={surveyData}
                        setSurveyData={wrappedSetSurveyData}
                        hideInputs={true}
                    />
                </div>

                <div style={{ display: activeResultView === 'power' ? 'block' : 'none' }}>
                    <PowerTab
                        surveyData={surveyData}
                        setSurveyData={wrappedSetSurveyData}
                        hideInputs={true}
                    />
                </div>
            </div>
        </div>
    );
}

export default DeckTab;

