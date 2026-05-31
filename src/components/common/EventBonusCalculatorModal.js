import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { getCardCharacterId, SUPPORT_CHARACTERS } from '../../utils/supportCardUtils';
import SupportCardPickerModal from './SupportCardPickerModal';
import EventOverrideDropdown from './EventOverrideDropdown';
import { calculateSlotSkillValues } from '../../utils/deckUtils';
import {
    EVENT_ATTRS, EVENT_UNITS, ORIGINAL_CHAR_UNIT, VS_CHAR_IDS,
    DEFAULT_AUTO_EVENT_OVERRIDE, loadAutoEventOverride
} from '../../utils/eventInfoUtils';

const CARD_API_URL = 'https://api.rilaksekai.com/api/cards';
const MASTER_RANK_OPTIONS = [0, 1, 2, 3, 4, 5];
const MAIN_DECK_SLOT_COUNT = 5;

const MAIN_DECK_RARITY_OPTIONS = [
    { key: 'rarity4', label: '★4', typeBonus: 25, masterRankBonus: [10, 12.5, 15, 17.5, 20, 25], canPickup: true, memberBonus: 20 },
    { key: 'birthday', label: 'BN/AN', typeBonus: 25, masterRankBonus: [5, 7, 9, 11, 13, 15], canPickup: false },
    { key: 'rarity3', label: '★3', typeBonus: 25, masterRankBonus: [0, 1, 2, 3, 4, 5], canPickup: false },
    { key: 'rarity2', label: '★2', typeBonus: 25, masterRankBonus: [0, 0.2, 0.4, 0.6, 0.8, 1], canPickup: false },
    { key: 'rarity1', label: '★1', typeBonus: 25, masterRankBonus: [0, 0.1, 0.2, 0.3, 0.4, 0.5], canPickup: false },
];

const MAIN_DECK_RARITY_MAP = MAIN_DECK_RARITY_OPTIONS.reduce((acc, option) => {
    acc[option.key] = option;
    return acc;
}, {
    '': { key: '', label: '비움', typeBonus: 0, masterRankBonus: [0, 0, 0, 0, 0, 0], canPickup: false }
});

const createEmptyMainDeckSlots = () => (
    Array.from({ length: MAIN_DECK_SLOT_COUNT }, () => ({
        rarityKey: 'rarity4',
        masterRank: 0,
        pickup: false,
        featured: true,
        typeMatched: true,
        isAwakened: true,
        skillLevel: 1,
    }))
);

const calculateMainDeckSlotBonus = (slot, isWorldLink) => {
    const rarityOption = MAIN_DECK_RARITY_MAP[slot?.rarityKey] || MAIN_DECK_RARITY_MAP[''];
    if (!rarityOption.key) {
        return { member: 0, character: 0, type: 0, masterRank: 0, total: 0 };
    }

    const normalizedMasterRank = Math.max(0, Math.min(5, Number(slot.masterRank) || 0));
    const currentPickupBonus = isWorldLink ? 30 : 20;

    const breakdown = {
        member: (rarityOption.canPickup && slot.pickup) ? currentPickupBonus : 0,
        character: slot.featured ? 25 : 0,
        type: slot.typeMatched ? rarityOption.typeBonus : 0,
        masterRank: rarityOption.masterRankBonus[normalizedMasterRank] || 0,
    };

    return {
        ...breakdown,
        total: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    };
};

const NumberDropdown = ({ value, options, onChange, prefix, suffix = '', hidePrefixOnMobile = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleOutsideClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen]);

    return (
        <div className="ebc-select" ref={dropdownRef}>
            <button type="button" className={`ebc-select-button ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <span className={`ebc-prefix-label ${hidePrefixOnMobile ? 'hide-on-mobile' : ''}`}>{prefix}</span>
                <strong>{value}{suffix}</strong>
            </button>
            {isOpen && (
                <div className="ebc-select-menu">
                    {options.map(opt => (
                        <button key={opt} type="button" className={opt === value ? 'selected' : ''} onClick={() => { onChange(opt); setIsOpen(false); }}>
                            {opt}{suffix}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const OptionDropdown = ({ value, options, onChange, prefix, hidePrefixOnMobile = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const selectedOption = options.find(opt => opt.key === value) || options[0];

    useEffect(() => {
        if (!isOpen) return;
        const handleOutsideClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen]);

    return (
        <div className="ebc-select" ref={dropdownRef}>
            <button type="button" className={`ebc-select-button ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <span className={`ebc-prefix-label ${hidePrefixOnMobile ? 'hide-on-mobile' : ''}`}>{prefix}</span>
                <strong>{selectedOption.label}</strong>
            </button>
            {isOpen && (
                <div className="ebc-select-menu">
                    {options.map(opt => (
                        <button key={opt.key || 'empty'} type="button" className={opt.key === value ? 'selected' : ''} onClick={() => { onChange(opt.key); setIsOpen(false); }}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const MainDeckPreviewCard = ({ rarityKey, masterRank = 0, skillLevel = 1, emptyText = '비움', previewCharId = 21, card = null, isAwakened = true }) => {
    const publicUrl = process.env.PUBLIC_URL || '';
    
    const getMainDeckPreviewRarity = (key) => {
        if (key === 'birthday') return 4;
        if (key === 'rarity3') return 3;
        if (key === 'rarity2') return 2;
        if (key === 'rarity1') return 1;
        return key ? 4 : 0;
    };
    
    const rarity = getMainDeckPreviewRarity(rarityKey);
    const isBirthday = rarityKey === 'birthday';
    const isLowRarity = rarity > 0 && rarity <= 2;
    const frameName = isBirthday ? 'cardFrame_bd.webp' : isLowRarity ? 'frame_2star.webp' : 'Frame.webp';
    
    const hasAfterTraining = card 
        ? (Number(card.rarity) > 2 && card.type !== 'Birthday' && card.type !== 'Anniversary')
        : (rarityKey === 'rarity4' || rarityKey === 'rarity3');
        
    const actualAwakened = hasAfterTraining ? isAwakened : false;
    const suffix = actualAwakened ? 'after_training' : 'normal';
    const starName = isBirthday ? 'rairity_birth.webp' : actualAwakened ? 'afterstar.webp' : 'star_normal.webp';
    const normalizedMasterRank = Math.max(0, Math.min(5, Number(masterRank) || 0));
    
    // Determine attribute icon: use card's actual attr if available
    const attrName = card ? (card.attr || card.cardAttr || card.attribute || 'pure').toLowerCase() : null;
    
    const faceUrl = card 
        ? `https://asset.rilaksekai.com/face/res0${String(getCardCharacterId(card) || 1).padStart(2, '0')}_no${String(card?.card_image_id || '001').padStart(3, '0')}_${suffix}.webp`
        : `https://asset.rilaksekai.com/face/res0${String(previewCharId).padStart(2, '0')}_no001_${suffix}.webp`;

    return (
        <div className={`ebc-preview-card ${rarityKey ? '' : 'empty'}`}>
            <img 
                className="ebc-card-face" 
                src={faceUrl} 
                alt="" 
                onError={(e) => {
                    e.target.src = `https://asset.rilaksekai.com/face/res021_no001_normal.webp`;
                }}
            />
            <img className="ebc-card-frame" src={`${publicUrl}/assets/card_style/${frameName}`} alt="" />
            {attrName && <img className="ebc-card-attribute" src={`${publicUrl}/assets/card_style/${attrName}.webp`} alt="" />}
            {rarityKey && isBirthday && <img className="ebc-card-birthday" src={`${publicUrl}/assets/card_style/${starName}`} alt="" />}
            {rarityKey && !isBirthday && (
                <div className="ebc-card-stars">
                    {Array.from({ length: rarity }, (_, i) => (
                        <img key={i} src={`${publicUrl}/assets/card_style/${starName}`} alt="" />
                    ))}
                </div>
            )}
            <div className="ebc-skill-badge">{rarityKey ? `SLV.${skillLevel}` : emptyText}</div>
            {normalizedMasterRank > 0 && (
                <img className="ebc-mastery-badge" src={`${publicUrl}/assets/card_style/masterRank_S_${normalizedMasterRank}.webp`} alt="" />
            )}
        </div>
    );
};

const EventBonusCalculatorModal = ({ isOpen, onClose, onApply, onLoadSkill }) => {
    const { t, language } = useTranslation();
    const [isWorldLink, setIsWorldLink] = useState(() => {
        const saved = localStorage.getItem('ebc_is_world_link');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [supportBonus, setSupportBonus] = useState(() => {
        return localStorage.getItem('ebc_support_bonus') || '';
    });
    const [eventOverride, setEventOverride] = useState(() => {
        const saved = localStorage.getItem('ebc_event_override');
        const base = saved ? JSON.parse(saved) : DEFAULT_AUTO_EVENT_OVERRIDE;
        // Ensure detailOpen/characters/characterOrder fields exist
        return { detailOpen: false, characters: {}, characterOrder: [], ...base };
    });
    const [autoEventOverride, setAutoEventOverride] = useState(DEFAULT_AUTO_EVENT_OVERRIDE);
    const [isManualEvent, setIsManualEvent] = useState(() => {
        const saved = localStorage.getItem('ebc_is_manual_event');
        return saved ? JSON.parse(saved) : false;
    });
    const [activePreset, setActivePreset] = useState(() => {
        const saved = localStorage.getItem('ebc_active_preset');
        return saved ? Number(saved) : 1;
    });
    const [slots, setSlots] = useState(() => {
        const activeNum = localStorage.getItem('ebc_active_preset') ? Number(localStorage.getItem('ebc_active_preset')) : 1;
        const saved = localStorage.getItem(`ebc_preset_${activeNum}`);
        if (saved) return JSON.parse(saved);
        const generalSaved = localStorage.getItem('ebc_main_deck_slots');
        return generalSaved ? JSON.parse(generalSaved) : createEmptyMainDeckSlots();
    });
    const [isCharPickerOpen, setIsCharPickerOpen] = useState(false);
    const [activeMainSlotIndex, setActiveMainSlotIndex] = useState(null);
    const [pickerCharId, setPickerCharId] = useState(() => {
        const saved = localStorage.getItem('ebc_last_char_id');
        return saved ? Number(saved) : 21;
    });
    const [cards, setCards] = useState([]);
    const [cardsLoading, setCardsLoading] = useState(false);
    const [cardsError, setCardsError] = useState('');

    useEffect(() => {
        let isMounted = true;
        if (isOpen && cards.length === 0) {
            setCardsLoading(true);
            fetch(CARD_API_URL, { cache: 'reload' })
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    if (isMounted) {
                        setCards(Array.isArray(data) ? data : []);
                        setCardsLoading(false);
                    }
                })
                .catch(err => {
                    console.error('Failed to load cards:', err);
                    if (isMounted) {
                        setCardsError('카드 목록을 불러오지 못했습니다.');
                        setCardsLoading(false);
                    }
                });
        }
        return () => { isMounted = false; };
    }, [isOpen, cards.length]);

    useEffect(() => {
        localStorage.setItem('ebc_is_world_link', JSON.stringify(isWorldLink));
    }, [isWorldLink]);

    useEffect(() => {
        localStorage.setItem('ebc_support_bonus', supportBonus);
    }, [supportBonus]);

    useEffect(() => {
        localStorage.setItem('ebc_main_deck_slots', JSON.stringify(slots));
        localStorage.setItem(`ebc_preset_${activePreset}`, JSON.stringify(slots));
    }, [slots, activePreset]);



    useEffect(() => {
        localStorage.setItem('ebc_is_manual_event', JSON.stringify(isManualEvent));
    }, [isManualEvent]);

    useEffect(() => {
        localStorage.setItem('ebc_event_override', JSON.stringify(eventOverride));
    }, [eventOverride]);

    useEffect(() => {
        let cancelled = false;
        if (isOpen && !isManualEvent) {
            loadAutoEventOverride()
                .then(autoData => {
                    if (!cancelled && autoData) {
                        setAutoEventOverride(autoData);
                        setEventOverride(autoData);
                    }
                })
                .catch(err => console.warn('Failed to auto load event override', err));
        }
        return () => { cancelled = true; };
    }, [isOpen, isManualEvent]);

    const updateEventUnit = useCallback((unitKey) => {
        setEventOverride(prev => {
            if (unitKey === 'mix') {
                return { ...prev, unit: '', detailOpen: true };
            }
            return { ...prev, unit: unitKey, detailOpen: false, characters: {}, characterOrder: [] };
        });
    }, []);

    const toggleEventCharacter = useCallback((charId) => {
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
                nextCharacters[charId] = charId >= 21
                    ? 'none'  // VS chars default to Virtual Singer (pure VS / no specific unit)
                    : ORIGINAL_CHAR_UNIT[charId];
                nextOrder.push(charId);
            }
            return { ...prev, characters: nextCharacters, characterOrder: nextOrder };
        });
    }, []);

    const updateVsEventUnit = useCallback((charId, unitKey) => {
        setEventOverride(prev => ({
            ...prev,
            characters: { ...(prev.characters || {}), [charId]: unitKey },
        }));
    }, []);

    const getCharName = useCallback((charId) => {
        const char = SUPPORT_CHARACTERS.find(c => c.id === charId);
        return char ? char.name : String(charId);
    }, []);

    const checkCardBonus = (card, overrideConfig) => {
        if (!card || !overrideConfig) return { typeMatched: false, featured: false };
        const cardAttr = card.attr || card.cardAttr || card.attribute || '';
        const charId = getCardCharacterId(card);
        const isWorldLink = overrideConfig.attr === 'wl';
        
        // Resolve card's support unit for VS chars (mirror profile-server logic)
        // Priority: supportUnit field > unit field (converted via UNIT_NAME_TO_KEY)
        const UNIT_NAME_TO_KEY = {
            'Leo/need': 'light_sound', 'MORE MORE JUMP！': 'idol',
            'Vivid BAD SQUAD': 'street', 'ワンダーランズ×ショウタイム': 'theme_park',
            '25時、ナイトコードで。': 'school_refusal',
        };
        let cardSupportUnit = card.supportUnit || card.support_unit || '';
        if (UNIT_NAME_TO_KEY[cardSupportUnit]) cardSupportUnit = UNIT_NAME_TO_KEY[cardSupportUnit];
        if (!cardSupportUnit && charId >= 21) {
            // Fallback: check card.unit field
            cardSupportUnit = UNIT_NAME_TO_KEY[card.unit] || card.unit || 'none';
        }

        let isFeatured = false;
        if (overrideConfig.characters && Object.keys(overrideConfig.characters).length > 0) {
            if (overrideConfig.characters[charId]) {
                if (charId >= 21) {
                    // 스까(Mixed Event)의 경우 VS 캐릭터 인선 보너스:
                    const targetUnit = overrideConfig.characters[charId];
                    if (targetUnit === 'none') {
                        // VS(버추얼싱어)로 참가: 서브유닛이 없는(순수 VS) 카드만 매칭
                        isFeatured = (cardSupportUnit === 'none' || !cardSupportUnit);
                    } else {
                        // 특정 유닛으로 참가: 해당 유닛 서브유닛 카드 OR 순수 VS 카드(none) 매칭
                        isFeatured = (cardSupportUnit === targetUnit || cardSupportUnit === 'none' || !cardSupportUnit);
                    }
                } else {
                    isFeatured = true;
                }
            } else {
                isFeatured = false;
            }
        } else if (overrideConfig.unit) {
            if (charId >= 21) {
                // 유닛 이벤트의 경우: 서브유닛이 이벤트 유닛과 일치하거나 or 서브유닛이 버추얼 싱어(none)인 경우
                isFeatured = (cardSupportUnit === overrideConfig.unit || cardSupportUnit === 'none');
            } else {
                isFeatured = (ORIGINAL_CHAR_UNIT[charId] === overrideConfig.unit);
            }
        }
        
        // WL event: typeMatched is determined at deck level (first card per attribute), not per-card
        // For non-WL events: match by attribute
        const isTypeMatched = isWorldLink
            ? false  // WL: overridden in slotResults (first unique attr per deck)
            : (overrideConfig.attr ? (cardAttr === overrideConfig.attr) : false);
        
        return { typeMatched: isTypeMatched, featured: isFeatured };
    };

    const shouldCardBePickup = (card, overrideConfig) => {
        if (!card || !overrideConfig) return false;
        const rarity = Number(card.rarity) || 0;
        if (rarity !== 4) return false;

        // Check if both attribute and unit are automatic (either isManualEvent is false, or both override fields are empty)
        const isBothAuto = !isManualEvent || (!overrideConfig.attr && !overrideConfig.unit);
        if (!isBothAuto) return false;

        const eventCardIds = overrideConfig.eventCardIds || [];
        return eventCardIds.includes(Number(card.id));
    };

    useEffect(() => {
        if (isOpen && eventOverride) {
            setSlots(prev => prev.map(slot => {
                if (!slot.card) return slot;
                const bonus = checkCardBonus(slot.card, eventOverride);
                const autoPickup = shouldCardBePickup(slot.card, eventOverride);
                
                // Only update if changed to avoid unnecessary renders
                if (
                    slot.typeMatched === bonus.typeMatched && 
                    slot.featured === bonus.featured &&
                    slot.pickup === autoPickup
                ) {
                    return slot;
                }
                return { 
                    ...slot, 
                    typeMatched: bonus.typeMatched, 
                    featured: bonus.featured,
                    pickup: autoPickup 
                };
            }));
        }
    }, [eventOverride, isOpen, isManualEvent]);

    const updateSlot = (index, patch) => {
        setSlots(prev => {
            const nextSlots = [...prev];
            const current = nextSlots[index];
            const nextSlot = { ...current, ...patch };

            // Save skillLevel/masterRank if changed while NOT in manual event
            if (!isManualEvent && current.card && ('skillLevel' in patch || 'masterRank' in patch)) {
                const savedKey = `ebc_card_stats_${current.card.id}`;
                const savedData = JSON.parse(localStorage.getItem(savedKey) || '{}');
                if ('skillLevel' in patch) savedData.skillLevel = patch.skillLevel;
                if ('masterRank' in patch) savedData.masterRank = patch.masterRank;
                localStorage.setItem(savedKey, JSON.stringify(savedData));
            }

            if (Object.prototype.hasOwnProperty.call(patch, 'rarityKey')) {
                const hasRarity = Boolean(patch.rarityKey);
                nextSlot.masterRank = hasRarity ? current.masterRank : 0;
                
                // When picking a new card, calculate bonus automatically
                if (patch.card) {
                    const autoBonus = checkCardBonus(patch.card, eventOverride);
                    nextSlot.typeMatched = autoBonus.typeMatched;
                    nextSlot.featured = autoBonus.featured;
                    
                    const autoPickup = shouldCardBePickup(patch.card, eventOverride);
                    nextSlot.pickup = autoPickup;
                    
                    // Load saved skillLevel/masterRank if available
                    if (!isManualEvent) {
                        const savedKey = `ebc_card_stats_${patch.card.id}`;
                        const savedData = JSON.parse(localStorage.getItem(savedKey) || '{}');
                        if (savedData.skillLevel !== undefined) nextSlot.skillLevel = savedData.skillLevel;
                        if (savedData.masterRank !== undefined) nextSlot.masterRank = savedData.masterRank;
                    }
                } else if (!hasRarity) {
                    nextSlot.featured = false;
                    nextSlot.typeMatched = false;
                    nextSlot.pickup = false;
                } else {
                    nextSlot.pickup = hasRarity && patch.rarityKey === 'rarity4' ? current.pickup : false;
                }
            }
            if (nextSlot.rarityKey !== 'rarity4') {
                nextSlot.pickup = false;
            }
            nextSlots[index] = nextSlot;
            return nextSlots;
        });
    };

    const slotResults = useMemo(() => {
        if (isWorldLink) {
            // WL: typeMatched = first card per attribute in deck order gets the type bonus
            const seenAttrs = new Set();
            return slots.map(slot => {
                const cardAttr = (slot.card?.attr || slot.card?.attribute || '').toLowerCase();
                const isFirstWithAttr = Boolean(cardAttr) && !seenAttrs.has(cardAttr);
                if (cardAttr) seenAttrs.add(cardAttr);
                const effectiveSlot = { ...slot, typeMatched: slot.rarityKey ? isFirstWithAttr : false };
                return {
                    slot: effectiveSlot,
                    rarityOption: MAIN_DECK_RARITY_MAP[slot.rarityKey] || MAIN_DECK_RARITY_MAP[''],
                    bonus: calculateMainDeckSlotBonus(effectiveSlot, isWorldLink),
                };
            });
        }
        return slots.map(slot => ({
            slot,
            rarityOption: MAIN_DECK_RARITY_MAP[slot.rarityKey] || MAIN_DECK_RARITY_MAP[''],
            bonus: calculateMainDeckSlotBonus(slot, isWorldLink),
        }));
    }, [slots, isWorldLink]);

    const mainDeckBonus = useMemo(() => {
        return slotResults.reduce((sum, result) => sum + result.bonus.total, 0);
    }, [slotResults]);

    const totalBonus = mainDeckBonus + (isWorldLink ? (Number(supportBonus) || 0) : 0);

    const effectiveValue = useMemo(() => {
        if (isManualEvent) return null;
        if (!slots.every(slot => slot.card != null)) return null;

        const skillValuesObj = calculateSlotSkillValues(slots);
        const skillValues = skillValuesObj.map(obj => obj.skillValue);

        return skillValues[0] + (skillValues[1] + skillValues[2] + skillValues[3] + skillValues[4]) * 0.2;
    }, [slots, isManualEvent]);

    if (!isOpen) return null;

    return (
        <div className="ebc-backdrop" onMouseDown={onClose}>
            <div className={`ebc-modal ${language === 'ja' ? 'lang-ja' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
                <div className="ebc-header">
                    <h2>{t('support.event_bonus_calculator')}</h2>
                    <button type="button" className="ebc-close-btn" onClick={onClose}>✕</button>
                </div>
                
                <div className="ebc-content">
                    {/* Event Config Row */}
                    <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                        {/* Checkboxes Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                            <label className="ebc-checkbox-label" style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center' }}>
                                <input 
                                    type="checkbox" 
                                    checked={isManualEvent} 
                                    onChange={(e) => setIsManualEvent(e.target.checked)} 
                                />
                                <span className="ebc-checkbox-text" style={{ marginLeft: '8px', lineHeight: 'normal', transform: 'translateY(1px)' }}>{t('support.manual_input') || '수동 입력'}</span>
                            </label>
                            
                            <label className="ebc-checkbox-label" style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center' }}>
                                <input 
                                    type="checkbox" 
                                    checked={isWorldLink} 
                                    onChange={(e) => setIsWorldLink(e.target.checked)} 
                                />
                                <span className="ebc-checkbox-text" style={{ marginLeft: '8px', lineHeight: 'normal', transform: 'translateY(1px)' }}>{t('support.world_link_mode')}</span>
                            </label>
                        </div>
                        
                        {/* Options Row (Dropdowns & Inputs) */}
                        {(!isManualEvent || isWorldLink) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                                {!isManualEvent && (() => {
                                    const autoAttrOption = EVENT_ATTRS.find(a => a.key === autoEventOverride.attr) || null;
                                    const autoUnitOption = autoEventOverride.unit
                                        ? EVENT_UNITS.find(u => u.key === autoEventOverride.unit)
                                        : (autoEventOverride.isMix ? { key: 'mix', label: t('support.mix') || '스까' } : null);
                                    return (
                                        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '200px' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ marginBottom: '4px', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>{t('support.attribute') || '속성'}</div>
                                                <EventOverrideDropdown
                                                    value={eventOverride.attr}
                                                    options={EVENT_ATTRS}
                                                    assetPath="attributes"
                                                    iconOnly
                                                    autoOption={autoAttrOption}
                                                    onChange={(val) => setEventOverride(prev => ({ ...prev, attr: val }))}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ marginBottom: '4px', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>{t('support.unit') || '유닛'}</div>
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
                                    );
                                })()}

                                {/* 스까 캐릭터 선택 패널 */}
                                {!isManualEvent && eventOverride.detailOpen && (
                                    <div style={{ width: '100%', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', marginTop: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>스까 인선 선택</span>
                                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6366f1' }}>{(eventOverride.characterOrder || []).length}/5</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: '3px', marginBottom: '8px' }}>
                                            {Array.from({ length: 26 }, (_, idx) => {
                                                const charId = idx + 1;
                                                const selected = !!(eventOverride.characters?.[charId]);
                                                return (
                                                    <button
                                                        key={charId}
                                                        type="button"
                                                        onClick={() => toggleEventCharacter(charId)}
                                                        title={getCharName(charId)}
                                                        style={{
                                                            width: '100%',
                                                            aspectRatio: '1/1',
                                                            borderRadius: '50%',
                                                            border: selected ? '2px solid #6366f1' : '1px solid #cbd5e1',
                                                            overflow: 'hidden',
                                                            padding: 0,
                                                            background: '#fff',
                                                            cursor: 'pointer',
                                                            transform: selected ? 'scale(1.1)' : 'scale(1)',
                                                            opacity: selected ? 1 : 0.6,
                                                            transition: 'all 0.1s',
                                                            boxSizing: 'border-box',
                                                        }}
                                                    >
                                                        <img
                                                            src={`${process.env.PUBLIC_URL}/assets/characters/${String(charId).padStart(2, '0')}.webp`}
                                                            alt={getCharName(charId)}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                        />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {VS_CHAR_IDS.some(cid => eventOverride.characters?.[cid]) && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
                                                {VS_CHAR_IDS.filter(cid => eventOverride.characters?.[cid]).map(cid => (
                                                    <div key={cid} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', minWidth: '28px' }}>{getCharName(cid)}</span>
                                                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                                                            {/* 버추얼싱어 (none) 옵션 */}
                                                            <button
                                                                key="none"
                                                                type="button"
                                                                onClick={() => updateVsEventUnit(cid, 'none')}
                                                                title="버추얼싱어"
                                                                style={{
                                                                    height: '20px',
                                                                    padding: '0 5px',
                                                                    border: eventOverride.characters?.[cid] === 'none' ? '2px solid #6366f1' : '1px solid #cbd5e1',
                                                                    borderRadius: '4px',
                                                                    background: eventOverride.characters?.[cid] === 'none' ? '#e0e7ff' : '#fff',
                                                                    cursor: 'pointer',
                                                                    fontSize: '9px',
                                                                    fontWeight: 'bold',
                                                                    color: eventOverride.characters?.[cid] === 'none' ? '#4f46e5' : '#64748b',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                VS
                                                            </button>
                                                            {/* 5개 유닛 옵션 */}
                                                            {EVENT_UNITS.map(unit => (
                                                                <button
                                                                    key={unit.key}
                                                                    type="button"
                                                                    onClick={() => updateVsEventUnit(cid, unit.key)}
                                                                    title={unit.label}
                                                                    style={{
                                                                        width: '24px', height: '20px',
                                                                        border: eventOverride.characters?.[cid] === unit.key ? '2px solid #6366f1' : '1px solid #cbd5e1',
                                                                        borderRadius: '4px',
                                                                        background: '#fff',
                                                                        padding: '1px',
                                                                        cursor: 'pointer',
                                                                    }}
                                                                >
                                                                    <img src={`${process.env.PUBLIC_URL}/assets/event/units/${unit.file}`} alt={unit.label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {isWorldLink && (
                                    <div className="ebc-support-bonus-inline" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '150px' }}>
                                        <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b', whiteSpace: 'nowrap' }}>{t('support.support_bonus')}</label>
                                        <div className="ebc-input-wrapper" style={{ flex: 1 }}>
                                            <input 
                                                type="number" 
                                                value={supportBonus} 
                                                onChange={(e) => setSupportBonus(e.target.value)} 
                                                placeholder="0"
                                                className="ebc-support-input"
                                                style={{ margin: 0, padding: 0, lineHeight: '1' }}
                                            />
                                            <span className="ebc-input-suffix">%</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="ebc-deck-section">
                        <div className="ebc-deck-header">
                            <h3>{t('support.main_deck')}</h3>
                            <span className="ebc-main-total">{t('amatsuyu.total')}: <strong className="text-emerald-600">{mainDeckBonus.toFixed(1)}%</strong></span>
                        </div>

                        <div className="ebc-deck-grid">
                            {slotResults.map(({ slot, bonus }, index) => {
                                const hasRarity = Boolean(slot.rarityKey);
                                const canPickup = MAIN_DECK_RARITY_MAP[slot.rarityKey]?.canPickup;

                                return (
                                    <div className="ebc-slot" key={index}>
                                        <div className="ebc-slot-header">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {(() => {
                                                    const hasAfterTraining = slot.card 
                                                        ? (Number(slot.card.rarity) > 2 && slot.card.type !== 'Birthday' && slot.card.type !== 'Anniversary')
                                                        : (slot.rarityKey === 'rarity4' || slot.rarityKey === 'rarity3');
                                                    return hasAfterTraining ? (
                                                        <button 
                                                            type="button" 
                                                            className={`ebc-awaken-toggle ${slot.isAwakened ? 'awakened' : 'unawakened'}`}
                                                            onClick={(e) => { e.stopPropagation(); updateSlot(index, { isAwakened: !slot.isAwakened }); }}
                                                            title={slot.isAwakened ? t('support.awakened') : t('support.unawakened')}
                                                        >
                                                            {slot.isAwakened ? t('support.awakened') : t('support.unawakened')}
                                                        </button>
                                                    ) : null;
                                                })()}
                                            </div>
                                            <strong>+{bonus.total}%</strong>
                                        </div>
                                        <div 
                                            className="ebc-preview-wrap" 
                                            style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                                            onClick={() => {
                                                const slotCard = slot.card;
                                                if (slotCard) {
                                                    setPickerCharId(getCardCharacterId(slotCard) || 21);
                                                } else {
                                                    setPickerCharId(21);
                                                }
                                                setActiveMainSlotIndex(index);
                                                setIsCharPickerOpen(true);
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            title="카드 선택"
                                        >
                                            <MainDeckPreviewCard rarityKey={slot.rarityKey} masterRank={slot.masterRank} skillLevel={slot.skillLevel || 1} emptyText={t('support.empty')} card={slot.card} isAwakened={slot.isAwakened !== false} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px', padding: '0 2px' }}>
                                            <span>{t('support.rarity') || '레어'}</span>
                                            <span>{t('support.skill') || '스킬'}</span>
                                            <span>{t('support.master_rank') || '마랭'}</span>
                                        </div>
                                        <div className="ebc-control-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                            <OptionDropdown value={slot.rarityKey} options={MAIN_DECK_RARITY_OPTIONS} onChange={v => updateSlot(index, { rarityKey: v })} />
                                            <NumberDropdown value={slot.skillLevel || 1} options={[1, 2, 3, 4]} onChange={v => updateSlot(index, { skillLevel: v })} />
                                            <NumberDropdown value={slot.masterRank} options={MASTER_RANK_OPTIONS} onChange={v => updateSlot(index, { masterRank: v })} />
                                        </div>
                                        <div className="ebc-toggle-row">
                                            <button type="button" className={`ebc-toggle ${slot.typeMatched ? 'active' : ''} ${isWorldLink ? 'wl-auto' : ''}`} onClick={() => !isWorldLink && updateSlot(index, { typeMatched: !slot.typeMatched })} disabled={!hasRarity || isWorldLink} title={isWorldLink ? 'WL: 속성별 첫 번째 카드 자동 적용' : ''}>{t('support.type')}</button>
                                            <button type="button" className={`ebc-toggle ${slot.featured ? 'active' : ''}`} onClick={() => updateSlot(index, { featured: !slot.featured })} disabled={!hasRarity}>{t('support.featured')}</button>
                                            <button type="button" className={`ebc-toggle ${slot.pickup ? 'active' : ''}`} onClick={() => updateSlot(index, { pickup: !slot.pickup })} disabled={!canPickup}>{t('support.pickup')}</button>
                                        </div>
                                        <div className="ebc-breakdown">
                                            <span>{t('support.member')} <b>{bonus.member}%</b></span>
                                            <span>{t('support.featured')} <b>{bonus.character}%</b></span>
                                            <span>{t('support.type')} <b>{bonus.type}%</b></span>
                                            <span>{t('support.master_rank')} <b>{bonus.masterRank}%</b></span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                            <button
                                type="button"
                                className="ebc-btn-reset"
                                style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}
                                onClick={() => {
                                    if (onLoadSkill) {
                                        onLoadSkill(slots);
                                        window.dispatchEvent(new CustomEvent('show-toast', { detail: t('app.toast.skill_loaded') || '스킬 정보가 입력되었습니다.' }));
                                    }
                                }}
                            >
                                {t('support.skill') ? `${t('support.skill')} ${t('app.load') || '불러오기'}` : '스킬 불러오기'}
                            </button>
                        </div>

                        <div className="ebc-deck-toolbar">
                            <div className="ebc-toolbar-presets">
                                {[1, 2, 3].map(presetNum => {
                                    const isActive = activePreset === presetNum;
                                    return (
                                        <button
                                            key={presetNum}
                                            type="button"
                                            className={`ebc-preset-load-btn ${isActive ? 'active' : ''}`}
                                            onClick={() => {
                                                const saved = localStorage.getItem(`ebc_preset_${presetNum}`);
                                                const nextSlots = saved ? JSON.parse(saved) : createEmptyMainDeckSlots();
                                                setActivePreset(presetNum);
                                                localStorage.setItem('ebc_active_preset', String(presetNum));
                                                setSlots(nextSlots);
                                            }}
                                            title={`프리셋 ${presetNum}`}
                                        >
                                            P{presetNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                className="ebc-btn-reset"
                                onClick={() => {
                                    if (window.confirm('현재 설정한 덱을 모두 초기화하시겠습니까?')) {
                                        setSlots(createEmptyMainDeckSlots());
                                    }
                                }}
                            >
                                {t('support.reset') || '리셋'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="ebc-footer-wrapper">
                    {isWorldLink && (
                        <div className="ebc-footer-info">
                            {t('support.world_link_mode_desc')}
                        </div>
                    )}
                    <div className="ebc-footer">
                        <div className="ebc-footer-total">
                            {t('support.final_event_bonus')} <strong>{totalBonus.toFixed(1)}%</strong>
                            {effectiveValue !== null && (
                                <span style={{ marginLeft: '12px', fontSize: '13px', color: '#64748b' }}>
                                    {t('internal.effective_value') || '실효치'}: <strong>{effectiveValue.toFixed(1)}%</strong>
                                </span>
                            )}
                        </div>
                        <div className="ebc-footer-actions">
                            <button type="button" className="ebc-btn-cancel" onClick={onClose}>{t('rank.cancel') || '취소'}</button>
                            <button type="button" className="ebc-btn-apply" style={{ background: '#0ea5e9' }} onClick={() => onApply(totalBonus)}>{t('support.apply') || '적용'}</button>
                        </div>
                    </div>
                </div>
            </div>

            <SupportCardPickerModal
                isOpen={isCharPickerOpen}
                isMain={true}
                activeIndex={activeMainSlotIndex !== null ? activeMainSlotIndex : 0}
                onClose={() => setIsCharPickerOpen(false)}
                onClear={() => {
                    if (activeMainSlotIndex !== null) {
                        updateSlot(activeMainSlotIndex, { card: null, rarityKey: '' });
                    }
                    setIsCharPickerOpen(false);
                }}
                onSelectCard={(card) => {
                    if (activeMainSlotIndex !== null) {
                        const rarityKey = card.type === 'Birthday' || card.type === 'Anniversary' ? 'birthday' : `rarity${card.rarity}`;
                        updateSlot(activeMainSlotIndex, { card, rarityKey });
                    }
                    setIsCharPickerOpen(false);
                }}
                selectedCharId={null}
                pickerCharId={pickerCharId}
                setPickerCharId={(id) => {
                    setPickerCharId(id);
                    localStorage.setItem('ebc_last_char_id', String(id));
                }}
                cards={cards}
                cardsLoading={cardsLoading}
                cardsError={cardsError}
                unitMemberIds={[]}
                activeSlotCardId={activeMainSlotIndex !== null ? slots[activeMainSlotIndex]?.card?.id : null}
                eventOverride={eventOverride}
                isManualEvent={isManualEvent}
            />


            <style>{`
                .ebc-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 2000;
                    background: rgba(15, 23, 42, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .ebc-modal {
                    width: 100%;
                    max-width: 760px;
                    background: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    max-height: 90vh;
                }
                .ebc-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    border-bottom: 2px solid #f1f5f9;
                    background: #f8fafc;
                }
                .ebc-header h2 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 800;
                    color: #1e293b;
                }
                .ebc-close-btn {
                    background: transparent;
                    border: none;
                    font-size: 20px;
                    color: #64748b;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    transition: background 0.15s;
                }
                .ebc-close-btn:hover {
                    background: #e2e8f0;
                    color: #334155;
                }
                .ebc-content {
                    padding: 20px;
                    overflow-y: auto;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .ebc-wl-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                .ebc-checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-weight: 800;
                    color: #334155;
                    font-size: 15px;
                }
                .ebc-checkbox-label input {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                    accent-color: #6366f1;
                }
                .ebc-support-bonus-inline {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .ebc-support-bonus-inline label {
                    font-weight: 700;
                    color: #475569;
                    font-size: 14px;
                }
                .ebc-input-wrapper {
                    display: flex;
                    align-items: center;
                    background: #ffffff;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    padding: 0 8px;
                    width: 100px;
                    height: 32px;
                }
                .ebc-support-input {
                    border: none;
                    background: transparent;
                    width: 100%;
                    font-weight: 800;
                    color: #1e293b;
                    outline: none;
                    text-align: right;
                    box-sizing: border-box;
                }
                .ebc-input-suffix {
                    color: #64748b;
                    font-weight: 700;
                    margin-left: 4px;
                }
                
                .ebc-deck-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                .ebc-deck-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 800;
                    color: #1e293b;
                }
                .ebc-main-total {
                    font-size: 14px;
                    font-weight: 800;
                    color: #475569;
                }
                .ebc-deck-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 8px 16px;
                    gap: 12px;
                    margin-top: 16px;
                }
                .ebc-toolbar-presets {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .ebc-preset-load-btn {
                    background: #ffffff;
                    color: #64748b;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    padding: 5px 14px;
                    font-size: 13px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.15s;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .ebc-preset-load-btn.active {
                    background: #6366f1;
                    color: #ffffff;
                    border-color: #4f46e5;
                    box-shadow: 0 1px 3px rgba(99, 102, 241, 0.3);
                }
                .ebc-preset-load-btn:hover {
                    background: #f1f5f9;
                    color: #334155;
                }
                .ebc-preset-load-btn.active:hover {
                    background: #4f46e5;
                    color: #ffffff;
                }
                .ebc-btn-reset {
                    background: #fef2f2;
                    color: #ef4444;
                    border: 1px solid #fecaca;
                    border-radius: 6px;
                    padding: 5px 14px;
                    font-size: 13px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.15s;
                    box-shadow: 0 1px 2px rgba(239, 68, 68, 0.05);
                }
                .ebc-btn-reset:hover {
                    background: #fee2e2;
                    border-color: #fca5a5;
                }
                .ebc-deck-grid {
                    display: grid;
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                    gap: 12px;
                }
                .ebc-slot {
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 10px;
                    background: #ffffff;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.02);
                }
                .ebc-slot-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    margin-bottom: 8px;
                    font-size: 13px;
                    font-weight: 900;
                    color: #64748b;
                }
                .ebc-awaken-toggle {
                    font-size: 10px;
                    padding: 1px 4px;
                    border-radius: 4px;
                    border: 1px solid #cbd5e1;
                    background: #f8fafc;
                    color: #475569;
                    cursor: pointer;
                    line-height: 1.2;
                }
                .ebc-awaken-toggle.awakened {
                    background: #ecfdf5;
                    border-color: #10b981;
                    color: #059669;
                }
                .ebc-awaken-toggle.unawakened {
                    background: #fef2f2;
                    border-color: #ef4444;
                    color: #dc2626;
                }
                .ebc-awaken-toggle:hover {
                    filter: brightness(0.95);
                }
                .ebc-slot-header strong {
                    color: #059669;
                }
                .ebc-preview-wrap {
                    width: 100%;
                    aspect-ratio: 1/1;
                    margin-bottom: 10px;
                }
                .ebc-preview-card {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 6px;
                    background: #e2e8f0;
                    overflow: hidden;
                }
                .ebc-preview-card.empty .ebc-card-face { filter: grayscale(0.5); opacity: 0.5; }
                .ebc-card-face, .ebc-card-frame { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
                .ebc-card-frame { z-index: 2; }
                .ebc-card-attribute { position: absolute; top: 2%; left: 2%; z-index: 3; width: 22%; height: 22%; object-fit: contain; }
                .ebc-card-stars { position: absolute; bottom: 18%; left: 5%; z-index: 3; width: 74%; display: flex; gap: 1%; }
                .ebc-card-stars img { width: 13%; object-fit: contain; }
                .ebc-card-birthday { position: absolute; bottom: 18%; left: 4%; z-index: 3; width: 22%; height: auto; }
                .ebc-skill-badge { position: absolute; left: 0; bottom: 0; height: 19%; width: 100%; z-index: 1; display: flex; align-items: center; padding-left: 7%; border-radius: 0 0 6px 6px; background: rgba(45,48,84,0.9); color: #fff; font-size: 13px; font-weight: 900; transform: translateY(-4%); }
                .ebc-mastery-badge { position: absolute; right: 4%; bottom: 3%; z-index: 6; width: 30%; height: auto; }
                
                .ebc-control-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin-bottom: 4px; }
                .ebc-toggle-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin-bottom: 6px; }
                
                .ebc-select { position: relative; }
                .ebc-select-button { width: 100%; height: 26px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; display: flex; align-items: center; justify-content: center; padding: 0 4px; font-size: 11px; font-weight: 800; cursor: pointer; color: #334155; }
                .ebc-select-button span { display: none; }
                .ebc-select-button.open { border-color: #6366f1; color: #4f46e5; }
                .ebc-select-menu { position: absolute; z-index: 100; left: 0; top: calc(100% + 4px); background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 4px; min-width: 100%; text-align: center; }
                .ebc-select-menu button { display: block; width: 100%; height: 26px; border: none; background: transparent; font-size: 12px; font-weight: 800; color: #334155; border-radius: 4px; cursor: pointer; text-align: center; padding: 0 8px; }
                .ebc-select-menu button:hover, .ebc-select-menu button.selected { background: #e0e7ff; color: #4f46e5; }
                
                .ebc-toggle { height: 26px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; color: #475569; font-size: 11px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .ebc-toggle.active { border-color: #10b981; background: #ecfdf5; color: #059669; }
                .ebc-toggle:disabled { opacity: 0.5; cursor: not-allowed; background: #f8fafc; }
                .ebc-toggle.wl-auto { opacity: 1; cursor: default; }
                .ebc-toggle.wl-auto.active { border-color: #0ea5e9; background: #e0f2fe; color: #0284c7; }
                
                .ebc-breakdown { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; font-size: 9px; font-weight: 800; color: #64748b; }
                .ebc-breakdown span { display: flex; justify-content: space-between; background: #f8fafc; padding: 3px 4px; border-radius: 4px; }
                .ebc-breakdown b { color: #334155; }
                
                .ebc-footer-wrapper {
                    background: #f8fafc;
                    border-top: 2px solid #f1f5f9;
                }
                .ebc-footer-info {
                    padding: 12px 20px 0;
                    font-size: 13px;
                    color: #0ea5e9;
                    font-weight: 800;
                }
                .ebc-footer { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; }
                .ebc-footer-total { font-size: 16px; font-weight: 800; color: #334155; }
                .ebc-footer-total strong { font-size: 24px; color: #4f46e5; margin-left: 8px; }
                .ebc-footer-actions { display: flex; gap: 8px; }
                .ebc-btn-cancel, .ebc-btn-apply { height: 40px; padding: 0 20px; border-radius: 8px; font-size: 15px; font-weight: 800; cursor: pointer; border: none; }
                .ebc-btn-cancel { background: #e2e8f0; color: #475569; }
                .ebc-btn-cancel:hover { background: #cbd5e1; }
                .ebc-btn-apply { background: #6366f1; color: #fff; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
                .ebc-btn-apply:hover { background: #4f46e5; }
                
                @media (max-width: 768px) {
                    .ebc-backdrop { padding: 12px; }
                    .ebc-modal { border-radius: 8px; max-height: 95vh; }
                    .ebc-deck-grid { grid-template-columns: repeat(3, 1fr); }
                    .ebc-footer { flex-direction: column; gap: 12px; }
                    .ebc-footer-total, .ebc-footer-actions { width: 100%; text-align: center; justify-content: center; }
                    .ebc-btn-cancel, .ebc-btn-apply { flex: 1; }
                    .lang-ja .ebc-slot-header { font-size: 10px; letter-spacing: -0.5px; white-space: nowrap; overflow: hidden; }
                    .lang-ja .ebc-toggle { font-size: 9px; padding: 0 2px; letter-spacing: -0.5px; }
                    .lang-ja .ebc-breakdown { font-size: 8px; letter-spacing: -0.5px; }
                    .lang-ja .ebc-breakdown span { white-space: nowrap; overflow: hidden; }
                    .lang-ja .ebc-select-button { font-size: 10px; padding: 0 4px; }
                    .lang-ja .ebc-prefix-label { font-size: 9px; }
                    .lang-ja .ebc-awaken-toggle { font-size: 9px; letter-spacing: -0.5px; padding: 1px 2px; }
                }
                @media (max-width: 480px) {
                    .ebc-backdrop { padding: 4px; }
                    .ebc-modal { border-radius: 6px; max-height: 98vh; }
                    .ebc-deck-grid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
                    .ebc-slot { padding: 4px; }
                    .ebc-breakdown { font-size: 8px; }
                    .ebc-prefix-label.hide-on-mobile { display: none; }
                    .lang-ja .ebc-slot-header { font-size: 9px; }
                    .lang-ja .ebc-toggle { font-size: 8px; letter-spacing: -1px; }
                    .lang-ja .ebc-prefix-label { font-size: 8px; letter-spacing: -0.5px; }
                    .lang-ja .ebc-select-button { font-size: 9px; padding: 0 3px; }
                    .lang-ja .ebc-breakdown { font-size: 7px; }
                }
            `}</style>
        </div>
    );
};

export default EventBonusCalculatorModal;
