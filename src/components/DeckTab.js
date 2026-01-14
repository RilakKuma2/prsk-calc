import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { InputTableWrapper, InputRow, SectionHeaderRow } from './common/InputComponents';
import { calculateRawInternalValue, calculateInternalValue } from '../utils/deckUtils';

// Import result components
import AutoTab from './AutoTab';
import PowerTab from './PowerTab';

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

    // Update current deck and sync power/effi/internalValue for PowerTab
    const updateDeck = (key, value) => {
        setSurveyData(prev => {
            const currentDeckData = prev.unifiedDecks?.[`deck${activeDeckNum}`] || {};
            const updatedDeck = {
                ...currentDeckData,
                [key]: value
            };

            // Calculate internal value from skills (floored to 10)
            const leader = Number(updatedDeck.skillLeader || 120);
            const m2 = Number(updatedDeck.skillMember2 || 100);
            const m3 = Number(updatedDeck.skillMember3 || 100);
            const m4 = Number(updatedDeck.skillMember4 || 100);
            const m5 = Number(updatedDeck.skillMember5 || 100);
            const internalVal = Math.floor((leader + (m2 + m3 + m4 + m5) * 0.2) / 10) * 10;



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
                <SectionHeaderRow label={t('auto.member_skills')} spacer={true} />
                <InputRow
                    label={t('auto.leader')}
                    value={skillLeader !== null && skillLeader !== undefined ? skillLeader : ''}
                    onChange={(e) => {
                        let val = e.target.value;
                        if (val !== '' && Number(val) > 160) {
                            val = '160';
                        }
                        updateDeck('skillLeader', val === '' ? '' : Number(val));
                    }}
                    suffix="%"
                    placeholder="120"
                    spacer={true}
                />
                {[
                    { label: t('auto.member_2'), val: skillMember2, key: 'skillMember2' },
                    { label: t('auto.member_3'), val: skillMember3, key: 'skillMember3' },
                    { label: t('auto.member_4'), val: skillMember4, key: 'skillMember4' },
                    { label: t('auto.member_5'), val: skillMember5, key: 'skillMember5' },
                ].map((m, i) => (
                    <InputRow
                        key={i}
                        label={m.label}
                        value={m.val !== null && m.val !== undefined ? m.val : ''}
                        onChange={(e) => {
                            let val = e.target.value;
                            if (val !== '' && Number(val) > 160) {
                                val = '160';
                            }
                            updateDeck(m.key, val === '' ? '' : Number(val));
                        }}
                        suffix="%"
                        placeholder="100"
                        spacer={true}
                    />
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
            </InputTableWrapper>

            {/* Result View Selector */}
            <div className="flex justify-center gap-2 my-2">
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
            {activeResultView === 'power' && !surveyData.isComparisonMode && (
                <div className="flex flex-col items-center mb-4 mt-2">
                    <div className="flex flex-col items-center gap-1 mb-2">
                        <div className="flex items-center gap-4 text-base font-medium">
                            <div>
                                <span className="text-gray-500">{t('deck.my_internal_value')}: </span>
                                <span className="text-blue-600 font-bold">{Math.floor(calculateRawInternalValue(getActiveDeck()))}%</span>
                            </div>
                            <div>
                                <span className="text-gray-500">{t('internal.internal_sum')}: </span>
                                <span className="text-blue-600 font-bold">
                                    {Number(surveyData.unifiedDecks?.[activeDeckKey]?.skillLeader || 120)}
                                    /
                                    {(Number(surveyData.unifiedDecks?.[activeDeckKey]?.skillLeader || 120) +
                                        Number(surveyData.unifiedDecks?.[activeDeckKey]?.skillMember2 || 100) +
                                        Number(surveyData.unifiedDecks?.[activeDeckKey]?.skillMember3 || 100) +
                                        Number(surveyData.unifiedDecks?.[activeDeckKey]?.skillMember4 || 100) +
                                        Number(surveyData.unifiedDecks?.[activeDeckKey]?.skillMember5 || 100))
                                    }
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
            )}

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

