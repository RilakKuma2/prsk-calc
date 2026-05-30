import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { calculateRawInternalValue, calculateInternalValue, calculateSlotSkillValues } from '../utils/deckUtils';
import { loadDeckFromFriendCode } from '../utils/deckLoader';
import { characterBirthdays } from '../data/characterBirthdays';
import EventBonusCalculatorModal from './common/EventBonusCalculatorModal';
import EventOverrideDropdown from './common/EventOverrideDropdown';
import {
    EVENT_ATTRS, EVENT_UNITS, ORIGINAL_CHAR_UNIT, VS_CHAR_IDS,
    DEFAULT_AUTO_EVENT_OVERRIDE, loadAutoEventOverride, autoEventOverrideCache
} from '../utils/eventInfoUtils';

const AutoTab = lazy(() => import('./AutoTab'));
const PowerTab = lazy(() => import('./PowerTab'));

// Bloom Fes Awakening skill levels: [base%, max%]
const BLOOM_LEVELS = {
    0: null, // X - no bloom
    1: [60, 120],
    2: [65, 130],
    3: [70, 140],
    4: [80, 150]
};

const SKILL_LEVEL_OPTIONS = [1, 2, 3, 4];


const ResultTabFallback = () => (
    <div className="flex justify-center py-6 text-sm font-medium text-gray-400">
        불러오는 중...
    </div>
);

const DECK_INPUT_CLASS = 'deck-input-control w-28 text-center bg-gray-50 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500';
const DECK_LOADED_CONTROL_CLASS = 'deck-loaded-control w-28 text-center rounded-lg px-2 py-1.5 font-medium cursor-pointer transition-colors';

const DeckInputSection = ({ children, className = '' }) => (
    <div className={`deck-input-section ${className}`}>
        {children}
    </div>
);

const DeckInputHeader = ({ label, extraHeader }) => (
    <div className="deck-input-header">
        <div className="deck-input-label-cell" />
        <div className="deck-input-center-cell">
            <span className="font-bold text-gray-700">{label}</span>
        </div>
        <div className="deck-input-side-cell deck-input-header-side">
            {extraHeader && (
                <span className="font-bold text-xs text-indigo-600">{extraHeader}</span>
            )}
        </div>
    </div>
);

const DeckInputRow = ({ label, side, children }) => (
    <div className="deck-input-row">
        <div className="deck-input-label-cell">
            <label className="whitespace-nowrap font-bold text-gray-700">{label}</label>
        </div>
        <div className="deck-input-center-cell">
            {children}
        </div>
        <div className="deck-input-side-cell">
            {side && (
                <div className="deck-input-side-content">
                    {side}
                </div>
            )}
        </div>
    </div>
);

const SkillLevelDropdown = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const close = () => setIsOpen(false);

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', close, { capture: true });
            window.addEventListener('resize', close);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', close, { capture: true });
            window.removeEventListener('resize', close);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className="min-w-[60px] h-[28px] inline-flex items-center justify-center gap-0.5 rounded-md border border-blue-200 bg-blue-50 px-1.5 text-xs font-medium text-blue-700 shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
                <span>SLv.{value}</span>
                <svg className={`w-2.5 h-2.5 text-blue-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute top-full left-1/2 z-50 mt-1 -translate-x-1/2 rounded-lg bg-white shadow-xl ring-1 ring-black/10 overflow-hidden animate-fade-in">
                    <div className="p-1">
                        {SKILL_LEVEL_OPTIONS.map(option => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className={`block w-[60px] rounded-md px-2 py-1.5 text-center text-xs font-medium transition-colors ${Number(value) === option
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                                    }`}
                            >
                                SLv.{option}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};



function DeckTab({ surveyData, setSurveyData, subPath }) {
    const { t, language } = useTranslation();
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

    // Load Friend Code Modal State
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [showEventBonusCalc, setShowEventBonusCalc] = useState(false);
    const [manualEventBonusDecks, setManualEventBonusDecks] = useState({});
    const [focusedManualSkill, setFocusedManualSkill] = useState(null);
    const [eventOverride, setEventOverride] = useState({ attr: '', unit: '', detailOpen: false, characters: {}, characterOrder: [] });
    const [autoEventOverride, setAutoEventOverride] = useState(DEFAULT_AUTO_EVENT_OVERRIDE);
    const [friendCode, setFriendCode] = useState(() => {
        return localStorage.getItem('savedFriendCode') || '';
    });

    useEffect(() => {
        localStorage.setItem('savedFriendCode', friendCode);
    }, [friendCode]);
    const [isLoadingFriend, setIsLoadingFriend] = useState(false);
    const [mountedResultViews, setMountedResultViews] = useState(() => ({
        [getViewFromSubPath(subPath)]: true,
    }));

    // Update activeResultView when subPath changes (e.g., browser back/forward)
    useEffect(() => {
        setActiveResultView(getViewFromSubPath(subPath));
    }, [subPath]);

    useEffect(() => {
        setMountedResultViews(prev => (
            prev[activeResultView] ? prev : { ...prev, [activeResultView]: true }
        ));
    }, [activeResultView]);

    useEffect(() => {
        let cancelled = false;
        let idleId = null;
        let timeoutId = null;
        let delayId = null;

        const prefetchCurrentEventInBackground = async () => {
            if (cancelled) return;
            try {
                await loadAutoEventOverride();
            } catch (err) {
                console.warn('Failed to load current event info', err);
            }
        };

        const scheduleIdlePrefetch = () => {
            if (cancelled) return;
            if ('requestIdleCallback' in window) {
                idleId = window.requestIdleCallback(prefetchCurrentEventInBackground, { timeout: 8000 });
            } else {
                timeoutId = window.setTimeout(prefetchCurrentEventInBackground, 2000);
            }
        };

        const scheduleAfterPageLoad = () => {
            if (cancelled) return;
            delayId = window.setTimeout(scheduleIdlePrefetch, 1500);
        };

        if (document.readyState === 'complete') {
            scheduleAfterPageLoad();
        } else {
            window.addEventListener('load', scheduleAfterPageLoad, { once: true });
        }

        return () => {
            cancelled = true;
            window.removeEventListener('load', scheduleAfterPageLoad);
            if (idleId !== null && 'cancelIdleCallback' in window) {
                window.cancelIdleCallback(idleId);
            }
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
            if (delayId !== null) {
                window.clearTimeout(delayId);
            }
        };
    }, []);

    useEffect(() => {
        if (!showLoadModal) return;
        let cancelled = false;

        if (autoEventOverrideCache) {
            setAutoEventOverride(autoEventOverrideCache);
            return undefined;
        }

        loadAutoEventOverride()
            .then(nextAutoEventOverride => {
                if (!cancelled) {
                    setAutoEventOverride(nextAutoEventOverride);
                }
            })
            .catch(err => {
                console.warn('Failed to load current event info', err);
            });

        return () => {
            cancelled = true;
        };
    }, [showLoadModal]);

    const getCharData = (charId) => {
        const id = String(charId).padStart(2, '0');
        return characterBirthdays.find(c => c.image === id);
    };

    const getCharName = (charId) => {
        const charData = getCharData(charId);
        if (!charData) return String(charId);
        if (language === 'ja') return charData.nameJa;
        if (language === 'en') return charData.nameEn;
        return charData.nameKo;
    };

    const buildEventOverrideForRequest = () => {
        const hasManualCharacters = Object.keys(eventOverride.characters || {}).length > 0;
        return {
            attr: eventOverride.attr,
            unit: eventOverride.unit,
            characters: hasManualCharacters ? eventOverride.characters : {},
        };
    };

    const updateEventUnit = (unitKey) => {
        setEventOverride(prev => {
            if (unitKey === 'mix') {
                return { ...prev, unit: '', detailOpen: true };
            }
            return {
                ...prev,
                unit: unitKey,
                detailOpen: false,
                characters: {},
                characterOrder: [],
            };
        });
    };

    const toggleEventCharacter = (charId) => {
        setEventOverride(prev => {
            const nextCharacters = { ...(prev.characters || {}) };
            let nextOrder = [...(prev.characterOrder || [])].filter(id => id !== charId);
            if (nextCharacters[charId]) {
                delete nextCharacters[charId];
            } else {
                if (nextOrder.length >= 5) {
                    const oldestId = nextOrder.shift();
                    delete nextCharacters[oldestId];
                }
                nextCharacters[charId] = charId >= 21 ? (prev.unit || EVENT_UNITS[0].key) : ORIGINAL_CHAR_UNIT[charId];
                nextOrder.push(charId);
            }
            return { ...prev, characters: nextCharacters, characterOrder: nextOrder };
        });
    };

    const updateVsEventUnit = (charId, unitKey) => {
        setEventOverride(prev => ({
            ...prev,
            characters: {
                ...(prev.characters || {}),
                [charId]: unitKey,
            },
        }));
    };

    // Manual internal value state for power view
    const [manualInternalValue, setManualInternalValue] = useState('');
    const activeDeckKey = `deck${activeDeckNum}`;
    const isManualInternalEdit = surveyData.unifiedDecks?.[activeDeckKey]?.isManualInternalEdit || false;
    const isManualEventBonusEdit = !!manualEventBonusDecks[activeDeckKey];
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
                bloomLevels: currentDeck?.bloomLevels || { leader: 0, member2: 0, member3: 0, member4: 0, member5: 0 }
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

    // Update loaded deck skill level for a specific member
    const updateDeckLoadedSkillLevel = (memberKey, level) => {
        setSurveyData(prev => {
            const currentDeckData = prev.unifiedDecks?.[`deck${activeDeckNum}`] || {};

            const updatedLoadedSkillLevels = {
                ...(currentDeckData.loadedSkillLevels || {}),
                [memberKey]: level
            };

            let skillVal = currentDeckData[`skill${memberKey === 'leader' ? 'Leader' : memberKey.charAt(0).toUpperCase() + memberKey.slice(1)}`];

            if (level !== null && currentDeckData.loadedSkillRanges?.[memberKey]) {
                skillVal = currentDeckData.loadedSkillRanges[memberKey][level];
            }

            const skillKey = memberKey === 'leader' ? 'skillLeader' : `skill${memberKey.charAt(0).toUpperCase() + memberKey.slice(1)}`;

            const updatedDeck = {
                ...currentDeckData,
                loadedSkillLevels: updatedLoadedSkillLevels,
                [skillKey]: skillVal
            };

            const preciseInternalVal = calculateInternalValueFromDeck(updatedDeck);
            const internalVal = Math.floor(preciseInternalVal / 10) * 10;

            return {
                ...prev,
                unifiedDecks: {
                    ...prev.unifiedDecks,
                    [`deck${activeDeckNum}`]: {
                        ...updatedDeck,
                        internalValue: String(internalVal),
                        isManualInternalEdit: false
                    }
                },
                autoDeck: updatedDeck,
                internalValue: String(internalVal),
                isManualInternalEdit: false
            };
        });
    };

    // Calculate bloom skill range based on other members' skills
    // Logic: base% + up to 50% of another random member's max skill
    // For min: use base only (random member could have 0 contribution)
    // For max: base + 50% of highest other member's skill (use bloom max if they have bloom)
    const getBloomSkillRange = (memberKey) => {
        if (!useBloomFes) return null;
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

    // Get bloom fes max cap from base skill value (for loaded bloom-fes-original cards)
    // BLOOM_LEVELS: 1→[60,120], 2→[65,130], 3→[70,140], 4→[80,150]
    const getBloomFesMaxCapFromBase = (base) => {
        if (base >= 80) return 150;
        if (base >= 70) return 140;
        if (base >= 65) return 130;
        return 120;
    };

    // Get bloom range for a loaded bloom-fes-original member (not using global useBloomFes)
    const getLoadedBloomFesRange = (memberKey) => {
        if (!currentDeck.loadedBloomFesOriginalMembers?.[memberKey]) return null;

        const skillValues = {
            leader: Number(skillLeader) || 0,
            member2: Number(skillMember2) || 0,
            member3: Number(skillMember3) || 0,
            member4: Number(skillMember4) || 0,
            member5: Number(skillMember5) || 0,
        };

        const baseVal = skillValues[memberKey];
        if (!baseVal) return null;

        const maxCap = getBloomFesMaxCapFromBase(baseVal);

        let minOther = Infinity;
        let maxOther = 0;
        Object.entries(skillValues).forEach(([k, v]) => {
            if (k === memberKey) return;
            minOther = Math.min(minOther, v || 0);
            maxOther = Math.max(maxOther, v || 0);
        });
        if (minOther === Infinity) minOther = 0;

        const minSkill = Math.min(baseVal + Math.floor(minOther * 0.5), maxCap);
        const maxSkill = Math.min(baseVal + Math.floor(maxOther * 0.5), maxCap);
        return { min: minSkill, max: maxSkill };
    };

    // Get bloom range for a loaded VS bloom-fes-original member
    // VS formula: base + 30 per different unit type (max 2 types) → range [base, base+unitBonus]
    const getLoadedVSBloomFesRange = (memberKey) => {
        const vsData = currentDeck.loadedVSBloomFesMembers?.[memberKey];
        if (!vsData) return null;

        const skillVals = {
            leader: Number(skillLeader) || 0,
            member2: Number(skillMember2) || 0,
            member3: Number(skillMember3) || 0,
            member4: Number(skillMember4) || 0,
            member5: Number(skillMember5) || 0,
        };
        const baseVal = skillVals[memberKey];
        if (!baseVal) return null;

        const unitBonus = vsData.unitBonus ?? 0;
        // VS bloom fes: deck composition is known at load time, so unitBonus is fixed
        // Show base + unitBonus as a single determined value (no range uncertainty)
        const fixedVal = Math.min(baseVal + unitBonus, baseVal + 60);
        return { min: fixedVal, max: fixedVal };
    };

    // Helper to get skill range for UI display (either bloom range or loaded fixed value)
    const getEffectiveSkillRange = (memberKey) => {
        const r = getBloomSkillRange(memberKey) || getLoadedBloomFesRange(memberKey) || getLoadedVSBloomFesRange(memberKey);
        if (r) return r;

        if (currentDeck.loadedSkillLevels?.[memberKey]) {
            const skillVals = {
                leader: Number(skillLeader),
                member2: Number(skillMember2),
                member3: Number(skillMember3),
                member4: Number(skillMember4),
                member5: Number(skillMember5),
            };
            const val = skillVals[memberKey] || 0;
            return { min: val, max: val, isLoaded: true };
        }
        return null;
    };

    // Calculate effective value range based on bloom skills
    // Returns { minEffective, maxEffective, minInternalSum, maxInternalSum, leaderMin, leaderMax }
    const getBloomEffectiveValueRange = () => {
        // Get effective skill values for each member (min and max if bloom)
        const getSkillRange = (memberKey, baseValue, defaultVal) => {
            const bloomRange = getBloomSkillRange(memberKey) || getLoadedBloomFesRange(memberKey) || getLoadedVSBloomFesRange(memberKey);
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

        const loadedBloomFesOriginal = deckData.loadedBloomFesOriginalMembers || {};
        const loadedVSBloomFes = deckData.loadedVSBloomFesMembers || {};
        const hasLoadedBloomFes = Object.values(loadedBloomFesOriginal).some(Boolean) || Object.values(loadedVSBloomFes).some(Boolean);

        if (!useBloom && !hasLoadedBloomFes) {
            // Standard formula: Leader + (Sum Others)*0.2
            return Math.floor(leaderVal + (m2Val + m3Val + m4Val + m5Val) * 0.2);
        }

        // With Bloom Fes (global or per-member loaded), we use MINIMUM effective value
        const allVals = { leader: leaderVal, member2: m2Val, member3: m3Val, member4: m4Val, member5: m5Val };

        const getSkillMin = (memberKey, baseVal) => {
            // Global bloom fes check
            if (useBloom) {
                const level = blooms[memberKey];
                if (level && BLOOM_LEVELS[level]) {
                    const [base, maxCap] = BLOOM_LEVELS[level];
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
                            effectiveSkill = BLOOM_LEVELS[data.bloomLevel][1];
                        }
                        minOtherSkill = Math.min(minOtherSkill, effectiveSkill);
                    });
                    return Math.min(base + Math.floor(minOtherSkill * 0.5), maxCap);
                }
            }
            // Loaded bloom-fes-original card check
            if (loadedBloomFesOriginal[memberKey] && baseVal) {
                const maxCap = baseVal >= 80 ? 150 : baseVal >= 70 ? 140 : baseVal >= 65 ? 130 : 120;
                let minOther = Infinity;
                Object.entries(allVals).forEach(([k, v]) => {
                    if (k !== memberKey) minOther = Math.min(minOther, v || 0);
                });
                if (minOther === Infinity) minOther = 0;
                return Math.min(baseVal + Math.floor(minOther * 0.5), maxCap);
            }
            // Loaded VS bloom-fes-original card check
            if (loadedVSBloomFes[memberKey] && baseVal) {
                const unitBonus = loadedVSBloomFes[memberKey].unitBonus ?? 0;
                return Math.min(baseVal + unitBonus, baseVal + 60);
            }
            return baseVal;
        };

        const lMin = getSkillMin('leader', leaderVal);
        const m2Min = getSkillMin('member2', m2Val);
        const m3Min = getSkillMin('member3', m3Val);
        const m4Min = getSkillMin('member4', m4Val);
        const m5Min = getSkillMin('member5', m5Val);

        return Math.floor(lMin + (m2Min + m3Min + m4Min + m5Min) * 0.2);
    };

    // Switch a loaded bloom-fes-original member to manual input mode
    // (removes the range display and clears the SLv dropdown for that member)
    const switchBloomFesToManual = (memberKey) => {
        setFocusedManualSkill(memberKey);
        setSurveyData(prev => {
            const currentDeckData = prev.unifiedDecks?.[`deck${activeDeckNum}`] || {};
            const updatedLoadedBloomFes = { ...(currentDeckData.loadedBloomFesOriginalMembers || {}) };
            delete updatedLoadedBloomFes[memberKey];
            const updatedLoadedVSBloomFes = { ...(currentDeckData.loadedVSBloomFesMembers || {}) };
            delete updatedLoadedVSBloomFes[memberKey];
            const updatedLoadedSkillLevels = { ...(currentDeckData.loadedSkillLevels || {}) };
            delete updatedLoadedSkillLevels[memberKey];
            const updatedDeck = {
                ...currentDeckData,
                loadedBloomFesOriginalMembers: updatedLoadedBloomFes,
                loadedVSBloomFesMembers: updatedLoadedVSBloomFes,
                loadedSkillLevels: updatedLoadedSkillLevels
            };
            const preciseInternalVal = calculateInternalValueFromDeck(updatedDeck);
            const internalVal = Math.floor(preciseInternalVal / 10) * 10;
            return {
                ...prev,
                unifiedDecks: {
                    ...prev.unifiedDecks,
                    [`deck${activeDeckNum}`]: {
                        ...updatedDeck,
                        internalValue: String(internalVal),
                        isManualInternalEdit: false
                    }
                }
            };
        });
    };

    // Reset all loaded friend data for the active deck
    const handleResetLoadedData = () => {
        setManualEventBonusDecks(prev => ({ ...prev, [activeDeckKey]: false }));
        setSurveyData(prev => {
            const currentDeckData = prev.unifiedDecks?.[`deck${activeDeckNum}`] || {};
            const updatedDeck = {
                ...currentDeckData,
                totalPower: '',
                skillLeader: '',
                skillMember2: '',
                skillMember3: '',
                skillMember4: '',
                skillMember5: '',
                eventBonus: '',
                loadedSkillRanges: undefined,
                loadedSkillLevels: undefined,
                loadedBloomFesOriginalMembers: undefined,
                loadedVSBloomFesMembers: undefined,
                internalValue: '',
                isManualInternalEdit: false
            };
            return {
                ...prev,
                unifiedDecks: {
                    ...prev.unifiedDecks,
                    [`deck${activeDeckNum}`]: updatedDeck
                },
                autoDeck: updatedDeck,
                power: '',
                effi: '',
                internalValue: '',
                isManualInternalEdit: false
            };
        });
    };

    // 불러온 데이터가 한 건이라도 있는지 (loadedSkillRanges 존재 여부)
    const hasLoadedData = !!(currentDeck.loadedSkillRanges && Object.keys(currentDeck.loadedSkillRanges).length > 0);

    // 현재 파란색으로 표시 중인 항목이 하나라도 있는지 (리셋 버튼 표시 조건)
    const hasAnyVisibleLoaded = hasLoadedData && (
        !!(totalPower) ||
        !!(eventBonus) ||
        Object.values(currentDeck.loadedSkillLevels || {}).some(v => v != null) ||
        Object.keys(currentDeck.loadedBloomFesOriginalMembers || {}).length > 0 ||
        Object.keys(currentDeck.loadedVSBloomFesMembers || {}).length > 0
    );
    const hasLoadedSkillButtons = Object.values(currentDeck.loadedSkillLevels || {}).some(v => v != null);
    const updateDeck = (key, value) => {
        if (key === 'eventBonus') {
            setManualEventBonusDecks(prev => ({ ...prev, [activeDeckKey]: true }));
        }
        setSurveyData(prev => {
            const currentDeckData = prev.unifiedDecks?.[`deck${activeDeckNum}`] || {};

            const isSkillUpdate = key.startsWith('skill') || key === 'skillLeader';
            let updatedLoadedSkillLevels = currentDeckData.loadedSkillLevels;

            if (isSkillUpdate && updatedLoadedSkillLevels) {
                const memberKey = key === 'skillLeader' ? 'leader' : key.replace('skill', '').toLowerCase();
                if (currentDeckData[key] !== value && updatedLoadedSkillLevels[memberKey]) {
                    updatedLoadedSkillLevels = { ...updatedLoadedSkillLevels, [memberKey]: null };
                }
            }

            const updatedDeck = {
                ...currentDeckData,
                [key]: value,
                ...(updatedLoadedSkillLevels ? { loadedSkillLevels: updatedLoadedSkillLevels } : {})
            };

            // Calculate internal value from skills
            const preciseInternalVal = calculateInternalValueFromDeck(updatedDeck);
            // Floor to 10 for Room Condition
            const internalVal = Math.floor(preciseInternalVal / 10) * 10;



            // If the updated key is one of the skill keys, we should force update the internal value
            // and reset the manual override flag.

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

    const handleLoadFriendCode = async () => {
        if (!friendCode) return;
        setIsLoadingFriend(true);
        setManualEventBonusDecks(prev => ({ ...prev, [activeDeckKey]: false }));
        try {
            const parsed = await loadDeckFromFriendCode(friendCode, buildEventOverrideForRequest());
            const {
                totalPower: fetchedTotalPower,
                skillValues,
                eventBonus,
                loadedSkillRanges,
                loadedSkillLevels,
                loadedBloomFesOriginalMembers,
                loadedVSBloomFesMembers,
            } = parsed;

            setSurveyData(prev => {
                const currentDeckData = prev.unifiedDecks?.[`deck${activeDeckNum}`] || {};
                const updatedDeck = {
                    ...currentDeckData,
                    totalPower: fetchedTotalPower ?? currentDeckData.totalPower,
                    skillLeader: skillValues[0],
                    skillMember2: skillValues[1],
                    skillMember3: skillValues[2],
                    skillMember4: skillValues[3],
                    skillMember5: skillValues[4],
                    eventBonus,
                    loadedSkillRanges,
                    loadedSkillLevels,
                    loadedBloomFesOriginalMembers,
                    loadedVSBloomFesMembers,
                };
                const preciseInternalVal = calculateInternalValueFromDeck(updatedDeck);
                const internalVal = Math.floor(preciseInternalVal / 10) * 10;
                return {
                    ...prev,
                    unifiedDecks: {
                        ...prev.unifiedDecks,
                        [`deck${activeDeckNum}`]: {
                            ...updatedDeck,
                            internalValue: String(internalVal),
                            isManualInternalEdit: false,
                        },
                    },
                    autoDeck: updatedDeck,
                    power: String((Number(updatedDeck.totalPower || 293231)) / 10000),
                    effi: String(updatedDeck.eventBonus || 250),
                    internalValue: String(internalVal),
                    isManualInternalEdit: false,
                };
            });
            setShowLoadModal(false);
        } catch (err) {
            console.error('Failed to load friend data', err);
            alert(`서버에서 덱을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.\n\n오류코드: ${err.message}`);
        } finally {
            setIsLoadingFriend(false);
        }
    };


    const autoAttrOption = EVENT_ATTRS.find(attr => attr.key === autoEventOverride.attr) || null;
    const autoUnitOption = autoEventOverride.unit
        ? EVENT_UNITS.find(unit => unit.key === autoEventOverride.unit)
        : (autoEventOverride.isMix ? { key: 'mix', label: '스까' } : null);
    const isEventBonusLoadedControl = hasLoadedData && eventBonus && !isManualEventBonusEdit;

    const renderBloomLevelSelect = (memberKey) => (
        useBloomFes ? (
            <select
                value={bloomLevels[memberKey] || 0}
                onChange={(e) => updateBloomLevel(memberKey, Number(e.target.value))}
                className="text-sm px-2 py-1 border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-300 min-w-[60px]"
            >
                <option value={0}>{t('auto.bloom_level_none') || 'X'}</option>
                <option value={1}>{t('auto.bloom_level_1') || 'LV.1'}</option>
                <option value={2}>{t('auto.bloom_level_2') || 'LV.2'}</option>
                <option value={3}>{t('auto.bloom_level_3') || 'LV.3'}</option>
                <option value={4}>{t('auto.bloom_level_4') || 'LV.4'}</option>
            </select>
        ) : null
    );

    const renderLoadedSkillLevel = (memberKey) => (
        currentDeck.loadedSkillLevels?.[memberKey] ? (
            <SkillLevelDropdown
                value={currentDeck.loadedSkillLevels[memberKey]}
                onChange={(level) => updateDeckLoadedSkillLevel(memberKey, level)}
            />
        ) : null
    );

    const renderSkillControl = (memberKey, value, deckKey, placeholder) => {
        const range = getEffectiveSkillRange(memberKey);
        if (range) {
            const isLoaded = !!(
                currentDeck.loadedSkillLevels?.[memberKey] ||
                currentDeck.loadedBloomFesOriginalMembers?.[memberKey] ||
                currentDeck.loadedVSBloomFesMembers?.[memberKey]
            );
            const colorClass = isLoaded
                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100';

            return (
                <div
                    className={`${DECK_LOADED_CONTROL_CLASS} ${colorClass}`}
                    onClick={() => isLoaded && switchBloomFesToManual(memberKey)}
                    title={isLoaded ? '클릭하여 직접 입력' : undefined}
                >
                    {range.min === range.max ? `${range.min}%` : `${range.min}~${range.max}%`}
                </div>
            );
        }

        return (
            <input
                type="number"
                value={value !== null && value !== undefined ? value : ''}
                onChange={(e) => {
                    let val = e.target.value;
                    if (val !== '' && Number(val) > 160) {
                        val = '160';
                    }
                    updateDeck(deckKey, val === '' ? '' : Number(val));
                }}
                onFocus={(e) => {
                    e.target.select();
                    setFocusedManualSkill(null);
                }}
                className={DECK_INPUT_CLASS}
                placeholder={placeholder}
                autoFocus={focusedManualSkill === memberKey}
            />
        );
    };

    const renderSkillSide = (memberKey) => (
        <>
            {!getEffectiveSkillRange(memberKey) && <span className="text-gray-600">%</span>}
            {renderBloomLevelSelect(memberKey)}
            {renderLoadedSkillLevel(memberKey)}
        </>
    );

    return (
        <div id="deck-tab-content">
            {/* Deck Selector */}
            <div className="flex justify-center gap-2 mb-4 items-center">
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
                {language === 'ko' && (
                    <div className="relative">
                        <button
                            onClick={() => {
                                if (!showLoadModal && autoEventOverrideCache) {
                                    setAutoEventOverride(autoEventOverrideCache);
                                }
                                setShowLoadModal(prev => !prev);
                            }}
                            className="px-4 py-2 text-sm font-medium rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-200"
                        >
                            {t('app.load') || '불러오기'}
                        </button>
                        {showLoadModal && (
                            <div className="absolute top-full right-0 z-50 mt-2 w-64 max-w-[calc(100vw-1rem)] translate-x-4 rounded-lg border border-gray-200 bg-white p-3 shadow-xl md:left-1/2 md:right-auto md:w-64 md:-translate-x-1/2">
                                <div className="mb-2 flex items-baseline gap-2 whitespace-nowrap">
                                    <span className="text-sm font-bold text-gray-700">친구코드 입력</span>
                                    <span className="text-[10px] font-bold text-red-500">* 일본 서버에서만 동작</span>
                                </div>
                                {(eventOverride.attr === 'wl' || (!eventOverride.attr && autoEventOverride.attr === 'wl')) && (
                                    <div className="mb-2 text-left text-xs font-bold text-red-500">
                                        * 월드 링크 서폿덱 미반영
                                    </div>
                                )}
                                <div className="mb-2 grid grid-cols-2 gap-2">
                                    <div>
                                        <div className="mb-1 text-left text-xs font-bold text-gray-600">속성</div>
                                        <EventOverrideDropdown
                                            value={eventOverride.attr}
                                            options={EVENT_ATTRS}
                                            assetPath="attributes"
                                            iconOnly
                                            autoOption={autoAttrOption}
                                            onChange={(nextAttr) => setEventOverride(prev => ({ ...prev, attr: nextAttr }))}
                                        />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-left text-xs font-bold text-gray-600">유닛</div>
                                        <EventOverrideDropdown
                                            value={eventOverride.detailOpen ? 'mix' : eventOverride.unit}
                                            options={EVENT_UNITS}
                                            assetPath="units"
                                            iconOnly
                                            extraOptions={[{ key: 'mix', label: '스까' }]}
                                            autoOption={autoUnitOption}
                                            onChange={updateEventUnit}
                                        />
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={friendCode}
                                    onChange={e => setFriendCode(e.target.value)}
                                    placeholder="예: 3939393939393939"
                                    className="w-full border border-gray-300 rounded px-2 py-1 mb-3 text-sm focus:outline-none focus:border-blue-500"
                                    style={{ width: '100%' }}
                                />
                                {eventOverride.detailOpen && (
                                    <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-2">
                                        <div className="mb-1 text-right text-[10px] font-bold text-gray-400">
                                            {(eventOverride.characterOrder || []).length}/5
                                        </div>
                                        <div className="mb-2 grid grid-cols-7 gap-1">
                                            {[...Array(26)].map((_, idx) => {
                                                const charId = idx + 1;
                                                const charData = getCharData(charId);
                                                const selected = !!eventOverride.characters?.[charId];
                                                return (
                                                    <button
                                                        key={charId}
                                                        type="button"
                                                        onClick={() => toggleEventCharacter(charId)}
                                                        className={`h-8 w-8 overflow-hidden rounded-full border transition-all ${selected ? 'ring-2 ring-indigo-500 ring-offset-1 scale-105' : 'border-gray-200 opacity-70'}`}
                                                        title={getCharName(charId)}
                                                    >
                                                        <img
                                                            src={`${process.env.PUBLIC_URL}/assets/characters/${String(charId).padStart(2, '0')}.webp`}
                                                            alt={getCharName(charId)}
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                        />
                                                        {!charData && <span className="text-[10px]">{charId}</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {VS_CHAR_IDS.some(charId => eventOverride.characters?.[charId]) && (
                                            <div className="space-y-1">
                                                {VS_CHAR_IDS.filter(charId => eventOverride.characters?.[charId]).map(charId => (
                                                    <div key={charId} className="flex items-center gap-1">
                                                        <span className="w-10 text-left text-[10px] font-bold text-gray-500">{getCharName(charId)}</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {EVENT_UNITS.map(unit => (
                                                                <button
                                                                    key={unit.key}
                                                                    type="button"
                                                                    onClick={() => updateVsEventUnit(charId, unit.key)}
                                                                    className={`h-6 w-7 rounded border bg-white p-0.5 ${eventOverride.characters?.[charId] === unit.key ? 'ring-2 ring-indigo-500' : 'border-gray-200'}`}
                                                                    title={unit.label}
                                                                >
                                                                    <img src={`${process.env.PUBLIC_URL}/assets/event/units/${unit.file}`} alt={unit.label} className="h-full w-full object-contain" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <button
                                    onClick={handleLoadFriendCode}
                                    disabled={isLoadingFriend}
                                    className="w-full bg-blue-500 text-white rounded py-1.5 text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {isLoadingFriend ? '불러오는 중...' : '불러오기'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Shared Input Section */}
            <DeckInputSection className={hasLoadedSkillButtons ? 'deck-input-loaded-skills' : ''}>
                <DeckInputRow label={t('auto.total_power')}>
                    {hasLoadedData && totalPower ? (
                        <div
                            className={`${DECK_LOADED_CONTROL_CLASS} bg-indigo-50 text-indigo-700 hover:bg-indigo-100`}
                            onClick={() => updateDeck('totalPower', '')}
                            title="클릭하여 직접 입력"
                        >
                            {totalPower}
                        </div>
                    ) : (
                        <input
                            type="number"
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
                            onFocus={(e) => e.target.select()}
                            className={DECK_INPUT_CLASS}
                        />
                    )}
                </DeckInputRow>

                <DeckInputHeader
                    label={t('auto.member_skills')}
                    extraHeader={useBloomFes ? (t('auto.bloom_skill') || '블룸각전') : null}
                />

                <DeckInputRow
                    label={t('auto.leader')}
                    side={renderSkillSide('leader')}
                >
                    {renderSkillControl('leader', skillLeader, 'skillLeader', '120')}
                </DeckInputRow>

                {[
                    { label: t('auto.member_2'), val: skillMember2, key: 'skillMember2', bloomKey: 'member2' },
                    { label: t('auto.member_3'), val: skillMember3, key: 'skillMember3', bloomKey: 'member3' },
                    { label: t('auto.member_4'), val: skillMember4, key: 'skillMember4', bloomKey: 'member4' },
                    { label: t('auto.member_5'), val: skillMember5, key: 'skillMember5', bloomKey: 'member5' },
                ].map((m, i) => (
                    <DeckInputRow
                        key={i}
                        label={m.label}
                        side={renderSkillSide(m.bloomKey)}
                    >
                        {renderSkillControl(m.bloomKey, m.val, m.key, '100')}
                    </DeckInputRow>
                ))}

                <DeckInputRow
                    label={t('auto.event_bonus')}
                    side={
                        <div className="flex items-center gap-1.5">
                            {!isEventBonusLoadedControl && <span className="text-gray-600">%</span>}
                            <button 
                                onClick={() => setShowEventBonusCalc(true)}
                                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700 transition-colors"
                                title="이벤트 배율 계산기"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    }
                >
                    {isEventBonusLoadedControl ? (
                        <div
                            className={`${DECK_LOADED_CONTROL_CLASS} bg-indigo-50 text-indigo-700 hover:bg-indigo-100`}
                            onClick={() => setManualEventBonusDecks(prev => ({ ...prev, [activeDeckKey]: true }))}
                            title="클릭하여 직접 입력"
                        >
                            {eventBonus}<span className="text-xs ml-0.5">%</span>
                        </div>
                    ) : (
                        <input
                            type="number"
                            value={eventBonus !== null && eventBonus !== undefined ? eventBonus : ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                updateDeck('eventBonus', val === '' ? '' : Number(val));
                            }}
                            placeholder="250"
                            onFocus={(e) => e.target.select()}
                            className={DECK_INPUT_CLASS}
                            autoFocus={isManualEventBonusEdit}
                        />
                    )}
                </DeckInputRow>

                <div className="deck-input-actions">
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-medium transition-colors duration-200 ${useBloomFes ? 'text-indigo-600' : 'text-gray-400'}`}>
                                {t('auto.bloom_fes_awakening') || '블룸페스 각전'}
                            </span>
                            <button
                                role="switch"
                                aria-checked={useBloomFes}
                                onClick={() => updateUseBloomFes(!useBloomFes)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 ${useBloomFes
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                        : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${useBloomFes ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                        {hasAnyVisibleLoaded && (
                            <button
                                onClick={handleResetLoadedData}
                                title="불러온 값 초기화"
                                className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-500 hover:text-red-600 transition-all duration-150 shadow-sm hover:shadow"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-3.5 h-3.5"
                                >
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                    <path d="M3 3v5h5" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </DeckInputSection>

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

            <div className="deck-results-container">
                <Suspense fallback={<ResultTabFallback />}>
                    {mountedResultViews.auto && (
                        <div style={{ display: activeResultView === 'auto' ? 'block' : 'none' }}>
                            <AutoTab
                                surveyData={surveyData}
                                setSurveyData={wrappedSetSurveyData}
                                hideInputs={true}
                            />
                        </div>
                    )}

                    {mountedResultViews.power && (
                        <div style={{ display: activeResultView === 'power' ? 'block' : 'none' }}>
                            <PowerTab
                                surveyData={surveyData}
                                setSurveyData={wrappedSetSurveyData}
                                hideInputs={true}
                            />
                        </div>
                    )}
                </Suspense>
            </div>
            <EventBonusCalculatorModal
                isOpen={showEventBonusCalc}
                onClose={() => setShowEventBonusCalc(false)}
                onApply={(totalBonus) => {
                    updateDeck('eventBonus', Number(totalBonus.toFixed(1)));
                    setShowEventBonusCalc(false);
                }}
                onLoadSkill={(slots) => {
                    if (slots && slots.length === 5) {
                        const nextSkillLevels = {};
                        const nextSkillRanges = {};
                        const skillValues = [];

                        const keys = ['leader', 'member2', 'member3', 'member4', 'member5'];
                        const computedSkills = calculateSlotSkillValues(slots);

                        slots.forEach((slot, index) => {
                            const key = keys[index];
                            const slv = Number(slot.skillLevel) || 1;
                            nextSkillLevels[key] = slv;

                            const { ranges, skillValue } = computedSkills[index];
                            nextSkillRanges[key] = ranges;
                            skillValues.push(skillValue);
                        });

                        setSurveyData(prev => {
                            const currentDeckData = prev.unifiedDecks?.[`deck${activeDeckNum}`] || {};
                            return {
                                ...prev,
                                unifiedDecks: {
                                    ...prev.unifiedDecks,
                                    [`deck${activeDeckNum}`]: {
                                        ...currentDeckData,
                                        skillLeader: skillValues[0],
                                        skillMember2: skillValues[1],
                                        skillMember3: skillValues[2],
                                        skillMember4: skillValues[3],
                                        skillMember5: skillValues[4],
                                        loadedSkillLevels: nextSkillLevels,
                                        loadedSkillRanges: nextSkillRanges,
                                        loadedBloomFesOriginalMembers: {},
                                        loadedVSBloomFesMembers: {},
                                        useBloomFes: false,
                                    }
                                }
                            };
                        });
                        setManualEventBonusDecks(prev => ({ ...prev, [`deck${activeDeckNum}`]: true }));
                    }
                }}
            />
        </div>
    );
}

export default DeckTab;
