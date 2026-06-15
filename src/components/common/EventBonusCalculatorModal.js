import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { getCardCharacterId, SUPPORT_CHARACTERS } from '../../utils/supportCardUtils';
import SupportCardPickerModal from './SupportCardPickerModal';
import EventOverrideDropdown from './EventOverrideDropdown';
import { calculateSlotSkillValues, resolveSupportUnit } from '../../utils/deckUtils';
import {
    EVENT_ATTRS, EVENT_UNITS, ORIGINAL_CHAR_UNIT, VS_CHAR_IDS,
    DEFAULT_AUTO_EVENT_OVERRIDE, loadAutoEventOverride
} from '../../utils/eventInfoUtils';

export const DEFAULT_AREA_VALUES = {
    unit: 10,
    gate: 0,
    attr: 10,
    titlePower: 250,
    characterArea: 20,
    characterRank: 51,
    characterNui: 0,
};

const CARD_API_URL = 'https://api.rilaksekai.com/api/cards';
const MASTER_RANK_OPTIONS = [0, 1, 2, 3, 4, 5];
const MAIN_DECK_SLOT_COUNT = 5;
const getCanvasPowerBonus = (card) => {
    if (!card) return 0;
    const type = String(card.type || '').toLowerCase();
    if (type === 'birthday') return 1200;

    const rarity = String(card.rarity || card.cardRarity || '').toLowerCase();
    if (rarity === 'birthday') return 1200;
    if (rarity === '4') return 1500;
    if (rarity === '3') return 900;
    if (rarity === '2') return 600;
    if (rarity === '1') return 300;
    return 0;
};
const DEFAULT_CHARACTER_RANK = 51;
const GATE_LEVEL_POWER_BONUS = 0.1;
const UNIT_EVENT_LIMITED_CHARACTER_RANK_OFFSET = 40;
const POWER_PARAM_KEYS = ['param1', 'param2', 'param3'];

const MASTER_RANK_POWER_BONUS_BY_RARITY = {
    rarity1: 150,
    rarity2: 300,
    rarity3: 450,
    birthday: 540,
    rarity4: 600,
};

const AREA_UNIT_OPTIONS = [
    { key: 'none', label: 'VS', file: 'Virtualsingerlogo.webp' },
    ...EVENT_UNITS,
];

const AREA_ATTR_OPTIONS = EVENT_ATTRS.filter(attr => attr.key !== 'wl');

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
        canvas: false,
    }))
);

const clampNumber = (value, min, max) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '';
    return Math.max(min, Math.min(max, numeric));
};

const normalizeBonusInput = (value, max) => {
    if (value === '') return '';
    return clampNumber(value, 0, max);
};

const normalizeLevelInput = (value, max) => {
    if (value === '') return '';
    const numeric = Number(String(value).replace(/[^\d]/g, ''));
    if (!Number.isFinite(numeric)) return '';
    return Math.max(0, Math.min(max, numeric));
};

const normalizePowerInput = (value) => {
    if (value === '') return '';
    const numeric = Number(String(value).replace(/[^\d]/g, ''));
    if (!Number.isFinite(numeric)) return '';
    return Math.max(0, numeric);
};

const normalizeRankInput = (value) => {
    if (value === '') return '';
    const numeric = Number(String(value).replace(/[^\d]/g, ''));
    if (!Number.isFinite(numeric)) return '';
    return Math.max(0, numeric > 50 ? DEFAULT_CHARACTER_RANK : Math.min(50, numeric));
};

const formatBonus = (value) => {
    const numeric = Number(value || 0);
    return numeric.toFixed(1).replace(/\.0$/, '');
};

const formatCharacterRank = (value) => {
    if (value === '') return '';
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '';
    return numeric > 50 ? '50+' : String(numeric);
};

const getMasterRankPowerBonusStep = (slot) => {
    if (!slot?.card) return 0;
    const cardType = slot.card.type || slot.card.cardRarityType || '';
    if (slot.rarityKey === 'birthday' || cardType === 'Birthday' || cardType === 'Anniversary') {
        return MASTER_RANK_POWER_BONUS_BY_RARITY.birthday;
    }
    const rarityKey = slot.rarityKey || `rarity${Number(slot.card.rarity) || 4}`;
    return MASTER_RANK_POWER_BONUS_BY_RARITY[rarityKey] || MASTER_RANK_POWER_BONUS_BY_RARITY.rarity4;
};

const getFallbackPowerParams = (power) => {
    const totalPower = Math.max(0, Math.floor(Number(power) || 0));
    const basePower = Math.floor(totalPower / POWER_PARAM_KEYS.length);
    const remainder = totalPower % POWER_PARAM_KEYS.length;
    return POWER_PARAM_KEYS.map((_, index) => basePower + (index < remainder ? 1 : 0));
};

const getCardPowerParams = (card) => {
    if (!card) return getFallbackPowerParams(0);
    const nestedParams = card.params || card.parameters || {};
    const paramValues = POWER_PARAM_KEYS.map((key, index) => {
        const value = card[key] ?? nestedParams[key] ?? nestedParams[`power${index + 1}`];
        const numeric = Math.floor(Number(value) || 0);
        return Math.max(0, numeric);
    });
    const paramTotal = paramValues.reduce((sum, value) => sum + value, 0);
    if (paramTotal > 0) {
        return paramValues;
    }
    return getFallbackPowerParams(card.power || card.defaultPower || 0);
};

const applyPowerDeltaToParams = (params, delta) => {
    const numericDelta = Math.trunc(Number(delta) || 0);
    if (numericDelta === 0) return params;
    const sign = numericDelta < 0 ? -1 : 1;
    const absoluteDelta = Math.abs(numericDelta);
    const baseDelta = Math.floor(absoluteDelta / POWER_PARAM_KEYS.length);
    const remainder = absoluteDelta % POWER_PARAM_KEYS.length;
    return params.map((value, index) => (
        Math.max(0, value + sign * (baseDelta + (index < remainder ? 1 : 0)))
    ));
};

const sumPowerParams = (params) => params.reduce((sum, value) => sum + value, 0);

const calculateCardPercentBonus = (power, percent) => {
    const numericPercent = Number(percent) || 0;
    return Math.floor(Math.max(0, Number(power) || 0) * numericPercent / 100);
};

const calculateSeparatedPercentBonus = (power, percent) => {
    const numericPercent = Number(percent) || 0;
    const wholePercent = Math.trunc(numericPercent);
    const fractionalPercent = Number((numericPercent - wholePercent).toFixed(6));
    return calculateCardPercentBonus(power, wholePercent)
        + (fractionalPercent > 0 ? calculateCardPercentBonus(power, fractionalPercent) : 0);
};

const calculateAreaItemPowerBonus = (power, characterAreaPercent, unitBonus, attrBonus) => {
    return calculateCardPercentBonus(power, characterAreaPercent)
        + calculateCardPercentBonus(power, unitBonus)
        + calculateSeparatedPercentBonus(power, attrBonus);
};

const isUnitEventLimitedCard = (card) => {
    const cardType = card?.type || card?.cardType || '';
    return cardType === 'Unit Event Limited' || Number(card?.cardSupplyId) === 6;
};

const createDefaultAreaSettings = () => ({
    units: AREA_UNIT_OPTIONS.reduce((acc, unit) => ({ ...acc, [unit.key]: DEFAULT_AREA_VALUES.unit }), {}),
    gates: AREA_UNIT_OPTIONS.reduce((acc, unit) => ({ ...acc, [unit.key]: DEFAULT_AREA_VALUES.gate }), {}),
    attrs: AREA_ATTR_OPTIONS.reduce((acc, attr) => ({ ...acc, [attr.key]: DEFAULT_AREA_VALUES.attr }), {}),
    titlePower: DEFAULT_AREA_VALUES.titlePower,
    characters: SUPPORT_CHARACTERS.reduce((acc, character) => ({
        ...acc,
        [character.id]: {
            area: DEFAULT_AREA_VALUES.characterArea,
            rank: DEFAULT_AREA_VALUES.characterRank,
            nui: DEFAULT_AREA_VALUES.characterNui,
        },
    }), {}),
});

const mergeAreaSettings = (settings = {}) => {
    const defaults = createDefaultAreaSettings();
    return {
        titlePower: settings.titlePower === undefined || settings.titlePower === '' ? defaults.titlePower : settings.titlePower,
        units: AREA_UNIT_OPTIONS.reduce((acc, unit) => {
            const saved = settings.units?.[unit.key];
            return {
                ...acc,
                [unit.key]: saved === undefined || saved === '' ? defaults.units[unit.key] : saved,
            };
        }, {}),
        gates: AREA_UNIT_OPTIONS.reduce((acc, unit) => {
            const saved = settings.gates?.[unit.key];
            return {
                ...acc,
                [unit.key]: saved === undefined || saved === '' ? defaults.gates[unit.key] : saved,
            };
        }, {}),
        attrs: AREA_ATTR_OPTIONS.reduce((acc, attr) => {
            const saved = settings.attrs?.[attr.key];
            return {
                ...acc,
                [attr.key]: saved === undefined || saved === '' ? defaults.attrs[attr.key] : saved,
            };
        }, {}),
        characters: SUPPORT_CHARACTERS.reduce((acc, character) => {
            const saved = settings.characters?.[character.id] || {};
            return {
                ...acc,
                [character.id]: {
                    ...defaults.characters[character.id],
                    ...saved,
                    area: saved.area === undefined || saved.area === '' ? defaults.characters[character.id].area : saved.area,
                    nui: saved.nui === undefined || saved.nui === '' ? defaults.characters[character.id].nui : saved.nui,
                },
            };
        }, {}),
    };
};

const getAreaPowerSummary = (slots, areaSettings) => {
    const filledSlots = slots.filter(slot => slot?.card);
    const attrs = filledSlots.map(slot => (slot.card.attr || slot.card.cardAttr || slot.card.attribute || '').toLowerCase()).filter(Boolean);
    const units = filledSlots.map(slot => resolveSupportUnit(slot.card)).filter(Boolean);
    const allSameAttr = attrs.length === MAIN_DECK_SLOT_COUNT && new Set(attrs).size === 1;
    const allSameUnit = units.length === MAIN_DECK_SLOT_COUNT && new Set(units).size === 1;

    const slotPowers = slots.map(slot => {
        const rawPowerParams = getCardPowerParams(slot?.card);
        const rawCardPower = sumPowerParams(rawPowerParams);
        const masterRank = Math.max(0, Math.min(5, Number(slot?.masterRank) || 0));
        const masterRankPower = slot?.card ? (masterRank - 5) * getMasterRankPowerBonusStep(slot) : 0;
        const canvasPower = slot?.card && slot.canvas ? getCanvasPowerBonus(slot.card) : 0;
        const masterRankParams = applyPowerDeltaToParams(rawPowerParams, masterRankPower);
        const basePowerParams = applyPowerDeltaToParams(masterRankParams, canvasPower);
        const basePower = sumPowerParams(basePowerParams);
        if (!slot?.card || basePower <= 0) {
            return {
                rawCardPower: 0,
                masterRankPower: 0,
                canvasPower: 0,
                basePower: 0,
                totalPower: 0,
                areaPercent: 0,
                areaItemBonus: 0,
                characterRankBonus: 0,
                titleBonus: 0,
                furnitureBonus: 0,
                gateBonus: 0,
            };
        }

        const charId = getCardCharacterId(slot.card);
        const attr = (slot.card.attr || slot.card.cardAttr || slot.card.attribute || '').toLowerCase();
        const unit = resolveSupportUnit(slot.card);
        const charSettings = areaSettings.characters?.[charId] || {};
        const charRank = Number(charSettings.rank);
        const charRankBonus = Math.min(Number.isFinite(charRank) ? charRank : 0, 50) * 0.1;
        const characterAreaPercent = Number(charSettings.area || 0);
        const furniturePercent = Number(charSettings.nui || 0);
        const unitBonus = Number(areaSettings.units?.[unit] || 0) * (allSameUnit ? 2 : 1);
        const attrBonus = Number(areaSettings.attrs?.[attr] || 0) * (allSameAttr ? 2 : 1);
        const gateBonusPercent = Number(areaSettings.gates?.[unit] || 0) * GATE_LEVEL_POWER_BONUS;
        const areaItemPercent = characterAreaPercent + unitBonus + attrBonus;
        const areaPercent = areaItemPercent + charRankBonus + gateBonusPercent;
        const areaItemBonus = calculateAreaItemPowerBonus(basePower, characterAreaPercent, unitBonus, attrBonus);
        const characterRankBasePower = Math.max(0, basePower - (isUnitEventLimitedCard(slot.card) ? UNIT_EVENT_LIMITED_CHARACTER_RANK_OFFSET : 0));
        const characterRankPowerBonus = calculateCardPercentBonus(characterRankBasePower, charRankBonus);
        const gateBonus = Math.floor(basePower * gateBonusPercent / 100);
        const furnitureBonus = Math.floor(basePower * furniturePercent / 100);
        const titleBonus = 0;
        const totalPower = basePower + areaItemBonus + characterRankPowerBonus + titleBonus + furnitureBonus + gateBonus;

        return {
            rawCardPower,
            masterRankPower,
            canvasPower,
            basePower,
            totalPower,
            areaPercent,
            areaItemPercent,
            charRankBonus,
            unitBonus,
            attrBonus,
            gateBonusPercent,
            furniturePercent,
            areaItemBonus,
            characterRankBonus: characterRankPowerBonus,
            titleBonus,
            furnitureBonus,
            gateBonus,
        };
    });
    const sumSlotPower = key => slotPowers.reduce((sum, slot) => sum + (slot[key] || 0), 0);
    const titleBonus = Math.max(0, Math.floor(Number(areaSettings.titlePower || 0)));
    const totalPower = sumSlotPower('totalPower') + titleBonus;
    const basePower = sumSlotPower('basePower');

    return {
        allSameAttr,
        allSameUnit,
        slotPowers,
        rawCardPower: sumSlotPower('rawCardPower'),
        masterRankPower: sumSlotPower('masterRankPower'),
        canvasPower: sumSlotPower('canvasPower'),
        basePower,
        totalPower,
        areaItemBonus: sumSlotPower('areaItemBonus'),
        characterRankBonus: sumSlotPower('characterRankBonus'),
        titleBonus,
        furnitureBonus: sumSlotPower('furnitureBonus'),
        gateBonus: sumSlotPower('gateBonus'),
    };
};

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
    const [activeAreaPreset, setActiveAreaPreset] = useState(() => {
        return localStorage.getItem('ebc_active_area_preset') ? Number(localStorage.getItem('ebc_active_area_preset')) : 1;
    });
    const [areaSettings, setAreaSettings] = useState(() => {
        const activeNum = localStorage.getItem('ebc_active_area_preset') ? Number(localStorage.getItem('ebc_active_area_preset')) : 1;
        
        if (activeNum === 1 && !localStorage.getItem('ebc_area_preset_1')) {
            const oldSettings = localStorage.getItem('ebc_area_settings');
            if (oldSettings) {
                localStorage.setItem('ebc_area_preset_1', oldSettings);
            }
        }
        
        const saved = localStorage.getItem(`ebc_area_preset_${activeNum}`);
        if (saved) {
            try {
                return mergeAreaSettings(JSON.parse(saved));
            } catch (e) {
                return createDefaultAreaSettings();
            }
        }
        return createDefaultAreaSettings();
    });
    const [isAreaPanelOpen, setIsAreaPanelOpen] = useState(false);
    const [isPowerDetailOpen, setIsPowerDetailOpen] = useState(false);
    const [isCharPickerOpen, setIsCharPickerOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    const [loadJsonText, setLoadJsonText] = useState('');
    const [isBatchAreaModalOpen, setIsBatchAreaModalOpen] = useState(false);
    const [batchAreaSettings, setBatchAreaSettings] = useState({
        unit: DEFAULT_AREA_VALUES.unit,
        gate: DEFAULT_AREA_VALUES.gate,
        attr: DEFAULT_AREA_VALUES.attr,
        characterArea: DEFAULT_AREA_VALUES.characterArea,
        characterRank: DEFAULT_AREA_VALUES.characterRank,
        characterNui: DEFAULT_AREA_VALUES.characterNui,
    });
    const [activeMainSlotIndex, setActiveMainSlotIndex] = useState(null);
    const [activeCharTab, setActiveCharTab] = useState('area');
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
        if (!cards.length) return;
        const cardsById = new Map(cards.map(card => [Number(card.id), card]));
        setSlots(prev => {
            let changed = false;
            const nextSlots = prev.map(slot => {
                if (!slot.card?.id) return slot;
                const latestCard = cardsById.get(Number(slot.card.id));
                if (!latestCard) return slot;
                const needsRefresh = POWER_PARAM_KEYS.some(key => slot.card[key] !== latestCard[key])
                    || slot.card.power !== latestCard.power;
                if (!needsRefresh) return slot;
                changed = true;
                return {
                    ...slot,
                    card: {
                        ...slot.card,
                        ...latestCard,
                    },
                };
            });
            return changed ? nextSlots : prev;
        });
    }, [cards]);

    const [nuiStats, setNuiStats] = useState(null);

    useEffect(() => {
        let mounted = true;
        fetch('https://asset.rilaksekai.com/suite/mysekaiFixtures.json', { cache: 'no-cache' })
            .then(res => res.json())
            .then(fixtures => {
                if (!mounted) return;
                const chars = {
                    1: '一歌', 2: '咲希', 3: '穂波', 4: '志歩',
                    5: 'みのり', 6: '遥', 7: '愛莉', 8: '雫',
                    9: 'こはね', 10: '杏', 11: '彰人', 12: '冬弥',
                    13: '司', 14: 'えむ', 15: '寧々', 16: '類',
                    17: '奏', 18: 'まふゆ', 19: '絵名', 20: '瑞希',
                    21: 'ミク', 22: 'リン', 23: 'レン', 24: 'ルカ', 25: 'MEIKO', 26: 'KAITO'
                };
                
                let min = 999;
                let max = -1;
                
                for (let i = 1; i <= 26; i++) {
                    const jpName = chars[i];
                    if (!jpName) continue;
                    
                    const count = fixtures.filter(f => 
                        f.name && f.name.includes(`${jpName}のぬいぐるみ`)
                    ).length;
                    
                    const sets = Math.floor(count / 3);
                    if (sets < min) min = sets;
                    if (sets > max) max = sets;
                }

                if (min === 999) min = 0;
                if (max === -1) max = 0;
                setNuiStats({ min, max });
            })
            .catch(err => console.warn("Failed to fetch mysekaiFixtures.json", err));
            
        return () => { mounted = false; };
    }, []);

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
        localStorage.setItem(`ebc_area_preset_${activeAreaPreset}`, JSON.stringify(areaSettings));
    }, [areaSettings, activeAreaPreset]);



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
                        setIsWorldLink(autoData.attr === 'wl');
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

    const shouldCardBePickup = useCallback((card, overrideConfig) => {
        if (!card || !overrideConfig) return false;
        const rarity = Number(card.rarity) || 0;
        if (rarity !== 4) return false;

        // Check if both attribute and unit are automatic (either isManualEvent is false, or both override fields are empty)
        const isBothAuto = !isManualEvent || (!overrideConfig.attr && !overrideConfig.unit);
        if (!isBothAuto) return false;

        const eventCardIds = overrideConfig.eventCardIds || [];
        return eventCardIds.includes(Number(card.id));
    }, [isManualEvent]);

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
    }, [eventOverride, isOpen, isManualEvent, shouldCardBePickup]);

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

    const updateAreaUnit = (unitKey, value) => {
        setAreaSettings(prev => ({
            ...prev,
            units: {
                ...prev.units,
                [unitKey]: normalizeBonusInput(value, 20),
            },
        }));
    };

    const updateAreaGate = (unitKey, value) => {
        setAreaSettings(prev => ({
            ...prev,
            gates: {
                ...prev.gates,
                [unitKey]: normalizeLevelInput(value, 40),
            },
        }));
    };

    const updateAreaAttr = (attrKey, value) => {
        setAreaSettings(prev => ({
            ...prev,
            attrs: {
                ...prev.attrs,
                [attrKey]: normalizeBonusInput(value, 20),
            },
        }));
    };

    const updateTitlePower = (value) => {
        setAreaSettings(prev => ({
            ...prev,
            titlePower: normalizePowerInput(value),
        }));
    };

    const updateCharacterArea = (charId, key, value) => {
        const maxByKey = { area: 40, nui: 10 };
        const nextValue = key === 'rank'
            ? normalizeRankInput(value)
            : normalizeBonusInput(value, maxByKey[key] || 30);

        setAreaSettings(prev => ({
            ...prev,
            characters: {
                ...prev.characters,
                [charId]: {
                    ...prev.characters?.[charId],
                    [key]: nextValue,
                },
            },
        }));
    };



    const downloadJson = (dataStr) => {
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'area_settings.json';
        a.click();
    };

    const handleAreaPresetClick = (num) => {
        if (num === activeAreaPreset) return;
        const saved = localStorage.getItem(`ebc_area_preset_${num}`);
        if (saved) {
            try {
                setAreaSettings(mergeAreaSettings(JSON.parse(saved)));
            } catch(e) {
                setAreaSettings(createDefaultAreaSettings());
            }
        } else {
            setAreaSettings(createDefaultAreaSettings());
        }
        setActiveAreaPreset(num);
        localStorage.setItem('ebc_active_area_preset', String(num));
    };

    const applyBatchAreaSettings = () => {
        setAreaSettings(prev => ({
            ...prev,
            units: AREA_UNIT_OPTIONS.reduce((acc, unit) => ({ ...acc, [unit.key]: batchAreaSettings.unit }), {}),
            gates: AREA_UNIT_OPTIONS.reduce((acc, unit) => ({ ...acc, [unit.key]: batchAreaSettings.gate }), {}),
            attrs: AREA_ATTR_OPTIONS.reduce((acc, attr) => ({ ...acc, [attr.key]: batchAreaSettings.attr }), {}),
            characters: SUPPORT_CHARACTERS.reduce((acc, character) => ({
                ...acc,
                [character.id]: {
                    ...prev.characters?.[character.id],
                    area: batchAreaSettings.characterArea,
                    rank: batchAreaSettings.characterRank,
                    nui: batchAreaSettings.characterNui,
                },
            }), {}),
        }));
        setIsBatchAreaModalOpen(false);
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

    const powerSummary = useMemo(() => {
        return getAreaPowerSummary(slots, areaSettings);
    }, [slots, areaSettings]);

    const isAreaDefault = useMemo(() => {
        try {
            if (areaSettings.titlePower !== DEFAULT_AREA_VALUES.titlePower) return false;
            for (const key of Object.keys(areaSettings.units || {})) {
                if (areaSettings.units[key] !== DEFAULT_AREA_VALUES.unit) return false;
            }
            for (const key of Object.keys(areaSettings.attrs || {})) {
                if (areaSettings.attrs[key] !== DEFAULT_AREA_VALUES.attr) return false;
            }
            for (const charId of Object.keys(areaSettings.characters || {})) {
                const charS = areaSettings.characters[charId] || {};
                if (Number(charS.area) !== DEFAULT_AREA_VALUES.characterArea) return false;
                if (Number(charS.rank) !== DEFAULT_AREA_VALUES.characterRank) return false;
                if (Number(charS.nui) !== DEFAULT_AREA_VALUES.characterNui) return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    }, [areaSettings]);

    const powerDetailRows = useMemo(() => {
        return [
            { label: t('support.base_power') || '퍼포먼스', value: powerSummary.basePower || 0 },
            { label: t('support.area_item_bonus') || '에어리어 아이템보너스', value: powerSummary.areaItemBonus || 0 },
            { label: t('support.character_rank_bonus') || '캐릭터 랭크 보너스', value: powerSummary.characterRankBonus || 0 },
            { label: t('support.title_bonus') || '칭호 보너스', value: powerSummary.titleBonus || 0 },
            { label: t('support.furniture_bonus') || '가구 보너스', value: powerSummary.furnitureBonus || 0 },
            { label: t('support.gate_bonus') || '게이트 보너스', value: powerSummary.gateBonus || 0 },
        ];
    }, [powerSummary]);

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
                    <h2>{t('support.deck_simulator') || '덱 시뮬레이터'}</h2>
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

                            <button
                                type="button"
                                className={`ebc-area-open-btn ${isAreaPanelOpen ? 'active' : ''}`}
                                onClick={() => setIsAreaPanelOpen(prev => !prev)}
                            >
                                <span>{t('support.area_settings') || '에어리어'}</span>
                            </button>
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
                                                    onChange={(val) => {
                                                        setEventOverride(prev => ({ ...prev, attr: val }));
                                                        setIsWorldLink(val === 'wl');
                                                    }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ marginBottom: '4px', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>{t('support.unit') || '유닛'}</div>
                                                <EventOverrideDropdown
                                                    value={eventOverride.detailOpen ? 'mix' : eventOverride.unit}
                                                    options={EVENT_UNITS}
                                                    assetPath="units"
                                                    iconOnly
                                                    extraOptions={[{ key: 'mix', label: t('support.mix') || '스까' }]}
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
                                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>{t('support.select_mix_characters') || '스까 인선 선택'}</span>
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
                                                                title={t('support.virtual_singer') || "버추얼싱어"}
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
                            <span className="ebc-power-total">
                                <span>{t('support.total_power') || '종합력'}</span>
                                <strong>{powerSummary.totalPower.toLocaleString()}</strong>
                                <button
                                    type="button"
                                    className="ebc-power-info-btn"
                                    onClick={() => setIsPowerDetailOpen(true)}
                                    aria-label={t('support.power_detail') || "종합력 상세"}
                                >
                                    i
                                </button>
                                {isAreaDefault && (
                                    <span style={{ marginLeft: '8px', fontSize: '11px', color: '#ec4899', fontWeight: '800' }}>
                                        {t('support.area_default_warning') || '상단 메뉴로 에어리어 조건 입력'}
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="ebc-deck-grid">
                            {slotResults.map(({ slot, bonus }, index) => {
                                const hasRarity = Boolean(slot.rarityKey);
                                const canPickup = MAIN_DECK_RARITY_MAP[slot.rarityKey]?.canPickup;
                                const powerResult = powerSummary.slotPowers[index] || {};

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
                                            title={t('support.select_card') || "카드 선택"}
                                        >
                                            <MainDeckPreviewCard rarityKey={slot.rarityKey} masterRank={slot.masterRank} skillLevel={slot.skillLevel || 1} emptyText={t('support.empty')} card={slot.card} isAwakened={slot.isAwakened !== false} />
                                        </div>
                                        <div className="ebc-slot-power-row">
                                            <button
                                                type="button"
                                                className={`ebc-canvas-toggle ${slot.canvas ? 'active' : ''}`}
                                                onClick={() => updateSlot(index, { canvas: !slot.canvas })}
                                                disabled={!slot.card}
                                                style={language === 'ja' ? { fontSize: '10px', letterSpacing: '-0.5px' } : undefined}
                                            >
                                                {t('support.canvas') || '캔버스'}
                                            </button>
                                            <span
                                                className="ebc-slot-base-power"
                                                title={`${t('support.after_area_bonus') || '에어리어 적용 후'} ${(powerResult.totalPower || 0).toLocaleString()} (${formatBonus(powerResult.areaPercent || 0)}%)`}
                                            >
                                                <strong>{(powerResult.basePower || 0).toLocaleString()}</strong>
                                            </span>
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
                                            <button type="button" className={`ebc-toggle ${slot.typeMatched ? 'active' : ''} ${isWorldLink ? 'wl-auto' : ''}`} onClick={() => !isWorldLink && updateSlot(index, { typeMatched: !slot.typeMatched })} disabled={!hasRarity || isWorldLink} title={isWorldLink ? t('support.wl_auto_apply') : ''}>{t('support.type')}</button>
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
                                {t('support.load_skill') || '스킬 불러오기'}
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
                                            title={`${t('support.preset') || '프리셋'} ${presetNum}`}
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
                                    if (window.confirm(t('support.reset_confirm') || '현재 설정한 덱을 모두 초기화하시겠습니까?')) {
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
                            <button
                                type="button"
                                className="ebc-btn-apply"
                                style={{ background: '#0ea5e9' }}
                                onClick={() => onApply(totalBonus, powerSummary.totalPower || null)}
                            >
                                {t('support.apply') || '적용'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isAreaPanelOpen && (
                <div
                    className="ebc-area-floating-backdrop"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        if (e.target === e.currentTarget) setIsAreaPanelOpen(false);
                    }}
                >
                    <div className="ebc-area-floating-modal" onMouseDown={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="ebc-area-floating-close"
                            onClick={() => setIsAreaPanelOpen(false)}
                            aria-label={t('support.close') || '닫기'}
                        >
                            ×
                        </button>

                        <div className="ebc-area-floating-scroll">
                            <div className="ebc-area-floating-head">
                                <h3>{t('support.area_settings') || '에어리어'}</h3>
                                <div className="ebc-area-floating-totals" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button type="button" onClick={() => setIsBatchAreaModalOpen(true)} className="ebc-btn-batch">{t('support.batch_apply') || '일괄적용'}</button>
                                        <button type="button" onClick={() => setIsSaveModalOpen(true)} className="ebc-btn-save">{t('app.save') || '저장'}</button>
                                        <button type="button" onClick={() => { setLoadJsonText(''); setIsLoadModalOpen(true); }} className="ebc-btn-load">{t('app.load') || '불러오기'}</button>
                                    </div>
                                    <div className="ebc-toolbar-presets" style={{ margin: 0 }}>
                                        {[1, 2, 3].map(presetNum => {
                                            const isActive = activeAreaPreset === presetNum;
                                            return (
                                                <button
                                                    type="button"
                                                    key={presetNum}
                                                    className={`ebc-preset-load-btn ${isActive ? 'active' : ''}`}
                                                    onClick={() => handleAreaPresetClick(presetNum)}
                                                    title={`${t('support.area_preset') || '에어리어 프리셋'} ${presetNum}`}
                                                >
                                                    P{presetNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="ebc-title-power-editor">
                                    <span>{t('support.title_bonus') || '칭호 보너스'}</span>
                                    <label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={areaSettings.titlePower ?? ''}
                                            onChange={(e) => updateTitlePower(e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            aria-label={`${t('support.title_bonus')} ${t('support.total_power')}`}
                                        />
                                        <b>{t('support.total_power') || '종합력'}</b>
                                    </label>
                                </div>
                            </div>

                            <section className="ebc-area-game-section">
                                <div className="ebc-area-game-title">
                                    <span>{t('support.unit_effect') || '유닛 효과'}</span>
                                    {powerSummary.allSameUnit && <strong>×2</strong>}
                                </div>
                                <div className="ebc-area-unit-header">
                                    <span />
                                    <span>{t('support.area') || '에어리어'}</span>
                                    <span>{t('support.gate') || '게이트'}</span>
                                </div>
                                <div className="ebc-area-game-grid units">
                                    {AREA_UNIT_OPTIONS.map(unit => (
                                        <label key={unit.key} className="ebc-area-game-pill">
                                            <span className="ebc-area-pill-media">
                                                <img src={`${process.env.PUBLIC_URL}/assets/event/units/${unit.file}`} alt={unit.label} />
                                            </span>
                                            <span className="ebc-area-pill-input">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="20"
                                                    step="0.1"
                                                    value={areaSettings.units?.[unit.key] ?? ''}
                                                    onChange={(e) => updateAreaUnit(unit.key, e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    aria-label={`${unit.label} ${t('support.unit_effect') || '유닛 효과'}`}
                                                />
                                                <b>%</b>
                                            </span>
                                            <span className="ebc-area-pill-input gate">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="40"
                                                    step="1"
                                                    value={areaSettings.gates?.[unit.key] ?? ''}
                                                    onChange={(e) => updateAreaGate(unit.key, e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    aria-label={`${unit.label} ${t('support.gate') || '게이트'}`}
                                                />
                                                <b>Lv</b>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </section>

                            <section className="ebc-area-game-section">
                                <div className="ebc-area-game-title">
                                    <span>{t('support.type_effect') || '타입 효과'}</span>
                                    {powerSummary.allSameAttr && <strong>×2</strong>}
                                </div>
                                <div className="ebc-area-game-grid attrs">
                                    {AREA_ATTR_OPTIONS.map(attr => (
                                        <label key={attr.key} className="ebc-area-game-pill attr">
                                            <span className="ebc-area-pill-media icon">
                                                <img src={`${process.env.PUBLIC_URL}/assets/event/attributes/${attr.file}`} alt={attr.label} />
                                            </span>
                                            <span className="ebc-area-pill-input">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="20"
                                                    step="0.1"
                                                    value={areaSettings.attrs?.[attr.key] ?? ''}
                                                    onChange={(e) => updateAreaAttr(attr.key, e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    aria-label={`${attr.label} ${t('support.type_effect') || '타입 효과'}`}
                                                />
                                                <b>%</b>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </section>

                            <section className="ebc-area-game-section">
                                <div className="ebc-area-game-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button type="button" className={`ebc-char-tab ${activeCharTab === 'area' ? 'active' : ''}`} onClick={() => setActiveCharTab('area')}>{t('support.area') || '에어리어'}</button>
                                        <button type="button" className={`ebc-char-tab ${activeCharTab === 'nui' ? 'active' : ''}`} onClick={() => setActiveCharTab('nui')}>{t('support.nui') || '누이'}</button>
                                        <button type="button" className={`ebc-char-tab ${activeCharTab === 'rank' ? 'active' : ''}`} onClick={() => setActiveCharTab('rank')}>{t('support.character_rank_short') || '캐랭'}</button>
                                    </div>
                                    {nuiStats && (
                                        <span style={{ fontSize: '13px', color: '#6366f1', fontWeight: 'bold' }}>
                                            현재 누이 {nuiStats.min === nuiStats.max ? `${nuiStats.min}세트` : `${nuiStats.min}~${nuiStats.max}세트`}
                                        </span>
                                    )}
                                </div>
                                <div className="ebc-area-character-grid">
                                    {SUPPORT_CHARACTERS.map(character => {
                                        const charSettings = areaSettings.characters?.[character.id] || {};
                                        return (
                                            <div key={character.id} className="ebc-area-character-pill">
                                                <div className="ebc-area-character-face">
                                                    <img
                                                        src={`${process.env.PUBLIC_URL}/assets/stamps/${String(character.id).padStart(2, '0')}.webp`}
                                                        alt={character.name}
                                                    />
                                                </div>
                                                <div className="ebc-area-character-fields">
                                                    {activeCharTab === 'area' && (
                                                        <label>
                                                            <span>{t('support.area') || '에어리어'}</span>
                                                            <div className="ebc-area-character-input">
                                                                <b>+</b>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="40"
                                                                    step="0.1"
                                                                    value={charSettings.area ?? ''}
                                                                    onChange={(e) => updateCharacterArea(character.id, 'area', e.target.value)}
                                                                    onFocus={(e) => e.target.select()}
                                                                    aria-label={`${character.name} ${t('support.area') || '에어리어'}`}
                                                                />
                                                                <b>%</b>
                                                            </div>
                                                        </label>
                                                    )}
                                                    {activeCharTab === 'rank' && (
                                                        <label>
                                                            <span>{t('support.character_rank_short') || '캐랭'}</span>
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={formatCharacterRank(charSettings.rank)}
                                                                onChange={(e) => updateCharacterArea(character.id, 'rank', e.target.value)}
                                                                onFocus={(e) => e.target.select()}
                                                                aria-label={`${character.name} ${t('support.character_rank_short') || '캐랭'}`}
                                                            />
                                                        </label>
                                                    )}
                                                    {activeCharTab === 'nui' && (
                                                        <label>
                                                            <span>{t('support.nui') || '누이'}</span>
                                                            <div className="ebc-area-character-input">
                                                                <b>+</b>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="10"
                                                                    step="0.1"
                                                                    value={charSettings.nui ?? ''}
                                                                    onChange={(e) => updateCharacterArea(character.id, 'nui', e.target.value)}
                                                                    onFocus={(e) => e.target.select()}
                                                                    aria-label={`${character.name} ${t('support.nui') || '누이'}`}
                                                                />
                                                                <b>%</b>
                                                            </div>
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>

                        <div className="ebc-area-floating-footer">
                            <button type="button" onClick={() => setIsAreaPanelOpen(false)}>
                                {t('support.close') || '닫기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isBatchAreaModalOpen && (
                <div className="ebc-area-floating-backdrop" onMouseDown={(e) => {
                    e.stopPropagation();
                    if (e.target === e.currentTarget) setIsBatchAreaModalOpen(false);
                }}>
                    <div className="ebc-area-floating-modal" onMouseDown={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="ebc-area-floating-close"
                            onClick={() => setIsBatchAreaModalOpen(false)}
                            aria-label={t('support.close') || '닫기'}
                        >
                            ×
                        </button>
                        <div className="ebc-area-floating-scroll">
                            <div className="ebc-area-floating-head">
                                <h3>{t('support.batch_apply') || '일괄 적용'}</h3>
                            </div>
                            <div className="ebc-area-floating-body">
                                <section className="ebc-area-game-section">
                                    <div className="ebc-area-game-title">
                                        <span>{t('support.unit_gate_effect') || '유닛 / 게이트 효과'}</span>
                                    </div>
                                    <div className="ebc-area-game-grid units" style={{ gridTemplateColumns: '1fr' }}>
                                        <div className="ebc-area-game-pill unit">
                                            <div className="ebc-area-pill-media">
                                                <img src={`${process.env.PUBLIC_URL}/assets/event/units/Lnlogo.webp`} alt="Leo/need" />
                                            </div>
                                            <label className="ebc-area-pill-input">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="30"
                                                    step="0.1"
                                                    value={batchAreaSettings.unit ?? ''}
                                                    onChange={(e) => setBatchAreaSettings(p => ({ ...p, unit: normalizeBonusInput(e.target.value, 30) }))}
                                                />
                                                <b>%</b>
                                            </label>
                                            <label className="ebc-area-pill-input gate">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="3"
                                                    step="1"
                                                    value={batchAreaSettings.gate ?? ''}
                                                    onChange={(e) => setBatchAreaSettings(p => ({ ...p, gate: clampNumber(e.target.value, 0, 3) }))}
                                                />
                                                <b>LV</b>
                                            </label>
                                        </div>
                                    </div>
                                </section>

                                <section className="ebc-area-game-section">
                                    <div className="ebc-area-game-title">
                                        <span>타입 효과</span>
                                    </div>
                                    <div className="ebc-area-game-grid attrs" style={{ gridTemplateColumns: '1fr' }}>
                                        <div className="ebc-area-game-pill attr">
                                            <div className="ebc-area-pill-media">
                                                <img src={`${process.env.PUBLIC_URL}/assets/event/attributes/cool.webp`} alt="Cool" />
                                            </div>
                                            <label className="ebc-area-pill-input">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="30"
                                                    step="0.1"
                                                    value={batchAreaSettings.attr ?? ''}
                                                    onChange={(e) => setBatchAreaSettings(p => ({ ...p, attr: normalizeBonusInput(e.target.value, 30) }))}
                                                />
                                                <b>%</b>
                                            </label>
                                        </div>
                                    </div>
                                </section>

                                <section className="ebc-area-game-section">
                                    <div className="ebc-area-game-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <button type="button" className={`ebc-char-tab ${activeCharTab === 'area' ? 'active' : ''}`} onClick={() => setActiveCharTab('area')}>{t('support.area') || '에어리어'}</button>
                                            <button type="button" className={`ebc-char-tab ${activeCharTab === 'nui' ? 'active' : ''}`} onClick={() => setActiveCharTab('nui')}>{t('support.nui') || '누이'}</button>
                                            <button type="button" className={`ebc-char-tab ${activeCharTab === 'rank' ? 'active' : ''}`} onClick={() => setActiveCharTab('rank')}>{t('support.character_rank_short') || '캐랭'}</button>
                                        </div>
                                        {nuiStats && (
                                            <span style={{ fontSize: '13px', color: '#6366f1', fontWeight: 'bold' }}>
                                                현재 누이 {nuiStats.min === nuiStats.max ? `${nuiStats.min}세트` : `${nuiStats.min}~${nuiStats.max}세트`}
                                            </span>
                                        )}
                                    </div>
                                    <div className="ebc-area-character-grid" style={{ gridTemplateColumns: '1fr' }}>
                                        <div className="ebc-area-character-pill">
                                            <div className="ebc-area-character-face">
                                                <img src={`${process.env.PUBLIC_URL}/assets/stamps/01.webp`} alt="Miku" />
                                            </div>
                                            <div className="ebc-area-character-fields">
                                                {activeCharTab === 'area' && (
                                                    <label>
                                                        <span>{t('support.area') || '에어리어'}</span>
                                                        <div className="ebc-area-character-input">
                                                            <b>+</b>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="40"
                                                                step="0.1"
                                                                value={batchAreaSettings.characterArea ?? ''}
                                                                onChange={(e) => setBatchAreaSettings(p => ({ ...p, characterArea: normalizeBonusInput(e.target.value, 40) }))}
                                                            />
                                                            <b>%</b>
                                                        </div>
                                                    </label>
                                                )}
                                                {activeCharTab === 'rank' && (
                                                    <label>
                                                        <span>{t('support.character_rank_short') || '캐랭'}</span>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={formatCharacterRank(batchAreaSettings.characterRank)}
                                                            onChange={(e) => setBatchAreaSettings(p => ({ ...p, characterRank: normalizeRankInput(e.target.value) }))}
                                                        />
                                                    </label>
                                                )}
                                                {activeCharTab === 'nui' && (
                                                    <label>
                                                        <span>{t('support.nui') || '누이'}</span>
                                                        <div className="ebc-area-character-input">
                                                            <b>+</b>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="10"
                                                                step="0.1"
                                                                value={batchAreaSettings.characterNui ?? ''}
                                                                onChange={(e) => setBatchAreaSettings(p => ({ ...p, characterNui: normalizeBonusInput(e.target.value, 10) }))}
                                                            />
                                                            <b>%</b>
                                                        </div>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                        <div className="ebc-area-floating-footer" style={{ gap: '12px' }}>
                            <button type="button" onClick={() => setIsBatchAreaModalOpen(false)}>
                                {t('support.close') || '닫기'}
                            </button>
                            <button type="button" className="ebc-btn-apply" onClick={applyBatchAreaSettings}>
                                {t('support.batch_apply') || '일괄적용'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isSaveModalOpen && (
                <div className="ebc-area-floating-backdrop" onMouseDown={(e) => {
                    e.stopPropagation();
                    if (e.target === e.currentTarget) setIsSaveModalOpen(false);
                }}>
                    <div className="ebc-area-floating-modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <button type="button" className="ebc-area-floating-close" onClick={() => setIsSaveModalOpen(false)}>×</button>
                        <div className="ebc-area-floating-scroll" style={{ padding: '24px 24px 0' }}>
                            <div className="ebc-area-floating-head">
                                <h3>{t('support.save_area_settings') || '에어리어 설정 저장'}</h3>
                            </div>
                            <div className="ebc-area-floating-body" style={{ padding: '0 0 16px' }}>
                                <p style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>{t('support.save_area_desc') || '현재 설정을 텍스트로 복사하거나 파일로 다운로드합니다.'}</p>
                                <textarea
                                    readOnly
                                    value={JSON.stringify(areaSettings)}
                                    style={{ width: '100%', height: '150px', fontSize: '11px', fontFamily: 'monospace', borderRadius: '8px', border: '1px solid #ccc', padding: '8px', boxSizing: 'border-box', whiteSpace: 'pre-wrap', wordBreak: 'break-all', resize: 'none' }}
                                />
                            </div>
                        </div>
                        <div className="ebc-area-floating-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 24px 20px', background: 'linear-gradient(to bottom, rgba(240,240,248,0.75), #f0f0f8 42%)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                <button type="button" style={{ flex: 1, minWidth: 0, height: '48px', padding: '0 8px', borderRadius: '999px', background: '#ffffff', color: '#474967', fontSize: '15px', fontWeight: 900, border: 'none', cursor: 'pointer', boxSizing: 'border-box', boxShadow: '0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => {
                                    navigator.clipboard.writeText(JSON.stringify(areaSettings)).then(() => alert('복사되었습니다.'));
                                }}>
                                    {t('support.text_copy') || '텍스트 복사'}
                                </button>
                                <button type="button" style={{ flex: 1, minWidth: 0, height: '48px', padding: '0 8px', borderRadius: '999px', background: '#ffffff', color: '#474967', fontSize: '15px', fontWeight: 900, border: 'none', cursor: 'pointer', boxSizing: 'border-box', boxShadow: '0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => downloadJson(JSON.stringify(areaSettings))}>
                                    {t('support.file_download') || '파일 다운로드'}
                                </button>
                            </div>
                            <button type="button" onClick={() => setIsSaveModalOpen(false)} style={{ width: '100%', minWidth: 0, height: '48px', padding: '0', borderRadius: '999px', background: '#ffffff', color: '#474967', fontSize: '15px', fontWeight: 900, border: 'none', cursor: 'pointer', boxSizing: 'border-box', boxShadow: '0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)' }}>
                                {t('support.close') || '닫기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLoadModalOpen && (
                <div className="ebc-area-floating-backdrop" onMouseDown={(e) => {
                    e.stopPropagation();
                    if (e.target === e.currentTarget) setIsLoadModalOpen(false);
                }}>
                    <div className="ebc-area-floating-modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <button type="button" className="ebc-area-floating-close" onClick={() => setIsLoadModalOpen(false)}>×</button>
                        <div className="ebc-area-floating-scroll" style={{ padding: '24px 24px 0' }}>
                            <div className="ebc-area-floating-head">
                                <h3>{t('support.load_area_settings') || '에어리어 설정 불러오기'}</h3>
                            </div>
                            <div className="ebc-area-floating-body" style={{ padding: '0 0 16px' }}>
                                <p style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>{t('support.load_area_desc') || '복사한 텍스트를 아래에 붙여넣거나 파일을 업로드하세요.'}</p>
                                <textarea
                                    value={loadJsonText}
                                    onChange={(e) => setLoadJsonText(e.target.value)}
                                    placeholder={t('support.paste_json_placeholder') || '여기에 텍스트를 붙여넣으세요...'}
                                    style={{ width: '100%', height: '150px', fontSize: '11px', fontFamily: 'monospace', borderRadius: '8px', border: '1px solid #ccc', padding: '8px', boxSizing: 'border-box', whiteSpace: 'pre-wrap', wordBreak: 'break-all', resize: 'none' }}
                                />
                            </div>
                        </div>
                        <div className="ebc-area-floating-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 24px 20px', background: 'linear-gradient(to bottom, rgba(240,240,248,0.75), #f0f0f8 42%)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                <label style={{ flex: 1, minWidth: 0, height: '48px', padding: '0 8px', borderRadius: '999px', background: '#ffffff', color: '#474967', fontSize: '15px', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', boxShadow: '0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)' }}>
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('support.file_upload') || '파일 업로드'}</span>
                                    <input type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (event) => setLoadJsonText(event.target.result);
                                        reader.readAsText(file);
                                    }} />
                                </label>
                                <button type="button" style={{ flex: 1, minWidth: 0, height: '48px', padding: '0 8px', borderRadius: '999px', background: '#ffffff', color: '#474967', fontSize: '15px', fontWeight: 900, border: 'none', cursor: 'pointer', boxSizing: 'border-box', boxShadow: '0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => {
                                    try {
                                        const parsed = JSON.parse(loadJsonText);
                                        if (parsed && parsed.characters) {
                                            setAreaSettings(parsed);
                                            alert('불러왔습니다.');
                                            setIsLoadModalOpen(false);
                                        } else {
                                            alert('올바른 설정 데이터가 아닙니다.');
                                        }
                                    } catch (err) {
                                        alert('JSON 파싱 오류입니다. 텍스트를 확인해주세요.');
                                    }
                                }}>
                                    {t('support.apply') || '적용'}
                                </button>
                            </div>
                            <button type="button" onClick={() => setIsLoadModalOpen(false)} style={{ width: '100%', minWidth: 0, height: '48px', padding: '0', borderRadius: '999px', background: '#ffffff', color: '#474967', fontSize: '15px', fontWeight: 900, border: 'none', cursor: 'pointer', boxSizing: 'border-box', boxShadow: '0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)' }}>
                                {t('support.close') || '닫기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isPowerDetailOpen && (
                <div
                    className="ebc-power-detail-backdrop"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        if (e.target === e.currentTarget) setIsPowerDetailOpen(false);
                    }}
                >
                    <div className="ebc-power-detail-modal" onMouseDown={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="ebc-power-detail-close"
                            onClick={() => setIsPowerDetailOpen(false)}
                            aria-label={t('support.close') || '닫기'}
                        >
                            ×
                        </button>
                        <div className="ebc-power-detail-body">
                            <div className="ebc-power-detail-total">
                                <span>{t('support.total_power') || '종합력'}</span>
                                <strong>{powerSummary.totalPower.toLocaleString()}</strong>
                            </div>
                            <div className="ebc-power-detail-box">
                                {powerDetailRows.map(row => (
                                    <div className="ebc-power-detail-row" key={row.label}>
                                        <span>{row.label}</span>
                                        <i aria-hidden="true" />
                                        <strong>{row.value.toLocaleString()}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="ebc-power-detail-footer">
                            <button type="button" onClick={() => setIsPowerDetailOpen(false)}>
                                {t('support.close') || '닫기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    max-width: 880px;
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
                .ebc-area-open-btn {
                    min-height: 34px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #334155;
                    padding: 4px 10px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 900;
                    transition: all 0.15s;
                }
                .ebc-area-open-btn.active {
                    border-color: #0ea5e9;
                    background: #e0f2fe;
                    color: #0369a1;
                }
                .ebc-area-floating-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 2200;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 18px;
                    background: rgba(31, 35, 60, 0.28);
                }
                .ebc-area-floating-modal {
                    position: relative;
                    width: min(960px, 100%);
                    max-height: min(92vh, 820px);
                    border-radius: 18px;
                    background: #f0f0f8;
                    box-shadow: 0 24px 60px rgba(31, 35, 60, 0.28), inset 0 0 0 1px rgba(255,255,255,0.72);
                    color: #474967;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .ebc-area-floating-close {
                    position: absolute;
                    top: 12px;
                    right: 18px;
                    z-index: 3;
                    width: 44px;
                    height: 44px;
                    border: none;
                    background: transparent;
                    color: #474967;
                    font-size: 48px;
                    line-height: 38px;
                    font-weight: 900;
                    text-shadow: 0 2px 4px rgba(31, 35, 60, 0.15);
                    cursor: pointer;
                }
                .ebc-area-floating-scroll {
                    padding: 34px 44px 26px;
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: #535577 #d7d8e7;
                }
                .ebc-area-floating-scroll::-webkit-scrollbar {
                    width: 10px;
                }
                .ebc-area-floating-scroll::-webkit-scrollbar-track {
                    background: #d7d8e7;
                    border-radius: 999px;
                }
                .ebc-area-floating-scroll::-webkit-scrollbar-thumb {
                    background: #535577;
                    border-radius: 999px;
                }
                .ebc-area-floating-head {
                    margin-bottom: 22px;
                }
                .ebc-area-floating-head h3 {
                    margin: 0 0 10px;
                    font-size: 28px;
                    font-weight: 1000;
                    color: #3f415f;
                    letter-spacing: 0;
                    border-bottom: 3px solid #a9abc1;
                    padding: 0 0 10px 6px;
                }
                .ebc-area-floating-totals {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 8px;
                    padding-left: 6px;
                    font-size: 12px;
                    font-weight: 900;
                    color: #686a87;
                }
                .ebc-area-floating-totals span,
                .ebc-area-floating-totals button {
                    height: 30px;
                    border: none;
                    border-radius: 999px;
                    background: #ffffff;
                    box-shadow: 0 2px 6px rgba(31, 35, 60, 0.10);
                    display: inline-flex;
                    align-items: center;
                    padding: 0 12px;
                }
                .ebc-area-floating-totals strong {
                    margin-left: 6px;
                    color: #3f415f;
                }
                .ebc-area-floating-totals button {
                    cursor: pointer;
                    color: #000000;
                    font-weight: 1000;
                }
                .ebc-area-floating-totals button.ebc-btn-save,
                .ebc-area-floating-totals button.ebc-btn-load {
                    border-radius: 6px;
                }
                .ebc-title-power-editor {
                    display: inline-grid;
                    grid-template-columns: auto 150px;
                    align-items: center;
                    gap: 10px;
                    margin: 10px 0 0 6px;
                    color: #555776;
                    font-size: 13px;
                    font-weight: 1000;
                }
                .ebc-title-power-editor label {
                    height: 34px;
                    border-radius: 10px;
                    background: #ffffff;
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    align-items: center;
                    gap: 4px;
                    padding: 0 8px;
                    box-shadow: inset 0 0 0 1px rgba(71,73,103,0.05);
                }
                .ebc-title-power-editor input {
                    min-width: 0;
                    width: 100%;
                    border: none;
                    background: transparent;
                    color: #555776;
                    font-size: 18px;
                    font-weight: 900;
                    text-align: center;
                    outline: none;
                    letter-spacing: 0;
                }
                .ebc-title-power-editor b {
                    color: #555776;
                    font-size: 12px;
                    font-weight: 900;
                }
                .ebc-area-game-section {
                    margin-top: 26px;
                }
                .ebc-area-game-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #3f415f;
                    font-size: 25px;
                    font-weight: 1000;
                    letter-spacing: 0;
                    border-bottom: 3px solid #a9abc1;
                    padding: 0 0 8px 6px;
                    margin-bottom: 18px;
                }
                .ebc-area-game-title strong {
                    border-radius: 999px;
                    background: #e4f9ef;
                    color: #18a66a;
                    font-size: 14px;
                    padding: 4px 10px;
                    box-shadow: inset 0 0 0 1px rgba(24,166,106,0.16);
                }
                .ebc-area-game-grid {
                    display: grid;
                    gap: 12px 14px;
                }
                .ebc-area-game-grid.units {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }
                .ebc-area-game-grid.attrs {
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                }
                .ebc-area-unit-header {
                    width: calc((100% - 28px) / 3);
                    min-width: 260px;
                    display: grid;
                    grid-template-columns: minmax(70px, 1fr) minmax(92px, 102px) minmax(78px, 88px);
                    gap: 8px;
                    align-items: center;
                    padding: 0 9px 4px;
                    color: #777993;
                    font-size: 12px;
                    font-weight: 1000;
                    text-align: center;
                }
                .ebc-area-game-pill {
                    min-width: 0;
                    height: 50px;
                    border-radius: 14px;
                    background: #dedfeb;
                    display: grid;
                    grid-template-columns: minmax(70px, 1fr) minmax(92px, 102px) minmax(78px, 88px);
                    gap: 8px;
                    align-items: center;
                    padding: 0 9px;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.52);
                }
                .ebc-area-game-pill.attr {
                    grid-template-columns: 44px minmax(106px, 118px);
                    gap: 8px;
                    justify-content: center;
                }
                .ebc-area-pill-media {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .ebc-area-pill-media img {
                    max-width: 112px;
                    max-height: 38px;
                    object-fit: contain;
                    filter: drop-shadow(0 1px 1px rgba(31,35,60,0.18));
                }
                .ebc-area-pill-media.icon img {
                    width: 42px;
                    height: 42px;
                }
                .ebc-area-pill-input {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    min-width: 0;
                    height: 34px;
                    border-radius: 10px;
                    background: #ffffff;
                    padding: 0 9px;
                    box-sizing: border-box;
                    overflow: hidden;
                    box-shadow: inset 0 0 0 1px rgba(71,73,103,0.05);
                    color: #555776;
                    font-size: 22px;
                    font-weight: 900;
                }
                .ebc-area-pill-input input {
                    flex: 1 1 auto;
                    width: 0;
                    min-width: 0;
                    height: 100%;
                    border: none;
                    background: transparent;
                    color: #555776;
                    font-size: 22px;
                    font-weight: 900;
                    text-align: center;
                    outline: none;
                    padding: 0;
                    box-sizing: border-box;
                    letter-spacing: 0;
                }
                .ebc-area-floating-modal input[type="number"] {
                    appearance: textfield;
                    -moz-appearance: textfield;
                }
                .ebc-area-floating-modal input[type="number"]::-webkit-outer-spin-button,
                .ebc-area-floating-modal input[type="number"]::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .ebc-area-pill-input b {
                    flex: 0 0 auto;
                    display: inline-flex;
                    align-items: baseline;
                    justify-content: center;
                    min-width: 18px;
                    font-size: 18px;
                    font-weight: 900;
                    text-align: center;
                    line-height: 1;
                    white-space: nowrap;
                }
                .ebc-area-pill-input.gate {
                    padding: 0 8px;
                }
                .ebc-area-pill-input.gate input {
                    font-size: 18px;
                }
                .ebc-area-pill-input.gate b {
                    min-width: 24px;
                    font-size: 12px;
                }
                .ebc-area-character-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 12px;
                    align-items: center;
                }
                .ebc-area-character-pill {
                    min-width: 0;
                    width: 100%;
                    box-sizing: border-box;
                    border-radius: 28px;
                    background: #dedfeb;
                    padding: 3px 14px 3px 3px;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 8px;
                    height: fit-content;
                }
                .ebc-area-character-face {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 0 0 auto;
                }
                .ebc-area-character-face img {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    object-fit: cover;
                    box-shadow: 0 0 0 1px rgba(255,255,255,0.4), 0 1px 4px rgba(31,35,60,0.15);
                    flex: 0 0 auto;
                }
                .ebc-area-character-fields {
                    display: flex;
                    flex: 1 1 auto;
                    min-width: 0;
                }
                .ebc-area-character-pill label {
                    flex: 1 1 auto;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 2px;
                    min-width: 0;
                    height: auto;
                    margin: 0;
                }
                .ebc-area-character-pill label > span {
                    display: none;
                }
                .ebc-area-character-input,
                .ebc-area-character-pill label > input {
                    width: 100%;
                    min-width: 0;
                    height: 44px;
                    border-radius: 16px;
                    background: transparent;
                    box-sizing: border-box;
                    overflow: hidden;
                    box-shadow: none;
                    margin: 0;
                }
                .ebc-area-character-input {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 4px;
                    padding: 0 6px;
                }
                .ebc-area-character-pill input {
                    width: 100%;
                    min-width: 0;
                    height: 44px;
                    line-height: 44px;
                    border: none;
                    border-radius: 16px;
                    background: transparent;
                    color: #555776;
                    font-size: 22px;
                    font-weight: 700;
                    text-align: center;
                    outline: none;
                    padding: 0;
                    margin: 0;
                    box-sizing: border-box;
                    letter-spacing: 0;
                    -moz-appearance: textfield;
                    -webkit-appearance: none;
                    appearance: none;
                }
                .ebc-area-character-input input {
                    flex: 1 1 auto;
                    width: 0;
                    min-width: 0;
                    background: transparent;
                    text-align: center;
                }
                .ebc-area-character-input b {
                    flex: 0 0 auto;
                    color: #555776;
                    font-size: 20px;
                    font-weight: 700;
                    line-height: 44px;
                    white-space: nowrap;
                }
                .ebc-char-tab {
                    background: transparent;
                    border: none;
                    font-size: 13px;
                    font-weight: 800;
                    color: #777993;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 6px;
                }
                .ebc-char-tab.active {
                    background: #dedfeb;
                    color: #474967;
                }
                    line-height: 1;
                    white-space: nowrap;
                }
                .ebc-area-floating-footer {
                    padding: 18px 24px 22px;
                    display: flex;
                    justify-content: center;
                    background: linear-gradient(to bottom, rgba(240,240,248,0.75), #f0f0f8 42%);
                    box-shadow: 0 -10px 18px rgba(240,240,248,0.88);
                }
                .ebc-area-floating-footer button {
                    min-width: 220px;
                    height: 56px;
                    border: none;
                    border-radius: 999px;
                    background: #ffffff;
                    color: #474967;
                    font-size: 22px;
                    font-weight: 1000;
                    box-shadow: 0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08);
                    cursor: pointer;
                }
                .ebc-power-detail-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 2250;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 22px;
                    background: rgba(31, 35, 60, 0.36);
                    backdrop-filter: blur(2px);
                }
                .ebc-power-detail-modal {
                    position: relative;
                    width: min(820px, 100%);
                    min-height: min(640px, 88vh);
                    border-radius: 18px;
                    background: #f0f0f8;
                    box-shadow: 0 24px 60px rgba(31, 35, 60, 0.32), inset 0 0 0 1px rgba(255,255,255,0.72);
                    color: #474967;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .ebc-power-detail-close {
                    position: absolute;
                    top: 16px;
                    right: 20px;
                    z-index: 2;
                    width: 46px;
                    height: 46px;
                    border: none;
                    background: transparent;
                    color: #474967;
                    font-size: 52px;
                    line-height: 40px;
                    font-weight: 1000;
                    text-shadow: 0 2px 4px rgba(31, 35, 60, 0.15);
                    cursor: pointer;
                }
                .ebc-power-detail-body {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 34px;
                    padding: 76px 42px 34px;
                }
                .ebc-power-detail-total {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    color: #3f415f;
                    font-size: 24px;
                    font-weight: 1000;
                    letter-spacing: 0;
                }
                .ebc-power-detail-total strong {
                    color: #555776;
                    font-size: 30px;
                    font-weight: 800;
                    letter-spacing: 3px;
                }
                .ebc-power-detail-box {
                    width: min(520px, 100%);
                    border-radius: 12px;
                    background: #dedfeb;
                    padding: 22px 28px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .ebc-power-detail-row {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 1px minmax(96px, auto);
                    align-items: center;
                    gap: 24px;
                    color: #555776;
                    font-size: 21px;
                    font-weight: 1000;
                    letter-spacing: 0;
                }
                .ebc-power-detail-row i {
                    width: 1px;
                    height: 28px;
                    background: #a9abc1;
                }
                .ebc-power-detail-row strong {
                    color: #555776;
                    font-size: 23px;
                    font-weight: 700;
                    text-align: right;
                    letter-spacing: 1px;
                }
                .ebc-power-detail-footer {
                    padding: 18px 24px 24px;
                    display: flex;
                    justify-content: center;
                    background: linear-gradient(to bottom, rgba(240,240,248,0.75), #f0f0f8 42%);
                }
                .ebc-power-detail-footer button {
                    min-width: 220px;
                    height: 56px;
                    border: none;
                    border-radius: 999px;
                    background: #ffffff;
                    color: #474967;
                    font-size: 22px;
                    font-weight: 1000;
                    box-shadow: 0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08);
                    cursor: pointer;
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
                    text-align: center;
                    box-sizing: border-box;
                }
                .ebc-input-suffix {
                    color: #64748b;
                    font-weight: 700;
                    margin-left: 4px;
                }
                .ebc-deck-section {
                    background: #eef0fa;
                    border-radius: 14px;
                    padding: 14px 16px 16px;
                    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.28);
                }
                .ebc-deck-header {
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                .ebc-power-total {
                    min-height: 34px;
                    color: #525575;
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 10px;
                    padding: 0;
                    font-size: 18px;
                    font-weight: 900;
                    text-align: left;
                }
                .ebc-power-total strong {
                    color: #525575;
                    font-size: 19px;
                    font-weight: 700;
                    letter-spacing: 2px;
                }
                .ebc-power-info-btn {
                    width: 30px;
                    height: 30px;
                    border: none;
                    border-radius: 50%;
                    background: #ffffff;
                    color: #525575;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: 1000;
                    line-height: 1;
                    box-shadow: 0 2px 7px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.06);
                    cursor: pointer;
                }
                .ebc-power-info-btn:hover {
                    background: #f8fafc;
                    transform: translateY(-1px);
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
                    border: none;
                    border-radius: 8px;
                    padding: 0;
                    background: transparent;
                    box-shadow: none;
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
                    margin-bottom: 6px;
                }
                .ebc-preview-card {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 4px;
                    background: #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 2px 7px rgba(31,35,60,0.16);
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
                .ebc-slot-power-row {
                    display: grid;
                    grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
                    gap: 6px;
                    align-items: center;
                    margin-bottom: 8px;
                    min-height: 28px;
                }
                .ebc-canvas-toggle {
                    height: 28px;
                    border: 1px solid #cbd5e1;
                    border-radius: 999px;
                    background: #ffffff;
                    color: #64748b;
                    font-size: 10px;
                    font-weight: 900;
                    cursor: pointer;
                    padding: 0 4px;
                }
                .ebc-canvas-toggle.active {
                    border-color: #0ea5e9;
                    background: #e0f2fe;
                    color: #0369a1;
                }
                .ebc-canvas-toggle:disabled {
                    opacity: 0.45;
                    cursor: not-allowed;
                }
                .ebc-slot-power-row .ebc-slot-base-power {
                    min-width: 0;
                    overflow: hidden;
                    height: 28px;
                    border-radius: 999px;
                    background: #ffffff;
                    color: #525575;
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 4px;
                    padding: 0 8px;
                    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.20);
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 0;
                }
                .ebc-slot-base-power strong {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
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
                    .ebc-deck-section { padding: 12px; }
                    .ebc-deck-header { align-items: flex-start; flex-direction: column; }
                    .ebc-deck-grid { grid-template-columns: repeat(3, 1fr); }
                    .ebc-area-floating-backdrop { padding: 10px; }
                    .ebc-area-floating-modal { max-height: 96vh; border-radius: 14px; }
                    .ebc-area-floating-scroll { padding: 28px 22px 18px; }
                    .ebc-area-floating-head h3,
                    .ebc-area-game-title { font-size: 22px; }
                    .ebc-area-game-grid.units,
                    .ebc-area-game-grid.attrs { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
                    .ebc-area-unit-header { width: calc((100% - 12px) / 2); min-width: 0; }
                    .ebc-area-unit-header { width: calc((100% - 12px) / 2); min-width: 0; }
                    .ebc-power-detail-modal { min-height: min(560px, 92vh); border-radius: 14px; }
                    .ebc-power-detail-body { padding: 62px 24px 24px; gap: 24px; }
                    .ebc-power-detail-total { font-size: 22px; gap: 12px; }
                    .ebc-power-detail-total strong { font-size: 27px; letter-spacing: 2px; }
                    .ebc-power-detail-row { font-size: 18px; gap: 18px; grid-template-columns: minmax(0, 1fr) 1px minmax(82px, auto); }
                    .ebc-power-detail-row strong { font-size: 19px; }
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
                    .ebc-deck-section { padding: 8px; border-radius: 10px; }
                    .ebc-power-total { min-height: 34px; gap: 6px; padding: 0; font-size: 14px; }
                    .ebc-power-total strong { font-size: 15px; }
                    .ebc-power-info-btn { width: 26px; height: 26px; font-size: 17px; }
                    .ebc-slot { padding: 4px; }
                    .ebc-area-floating-backdrop { padding: 4px; }
                    .ebc-area-floating-scroll { padding: 24px 12px 12px; }
                    .ebc-area-floating-close { top: 8px; right: 10px; font-size: 38px; width: 34px; height: 34px; line-height: 30px; }
                    .ebc-area-floating-head { padding-right: 36px; }
                    .ebc-area-floating-head h3,
                    .ebc-area-game-title { font-size: 19px; border-bottom-width: 2px; }
                    .ebc-area-floating-totals { gap: 6px; font-size: 10px; }
                    .ebc-area-floating-totals span,
                    .ebc-area-floating-totals button { height: 26px; padding: 0 8px; }
                    .ebc-title-power-editor { grid-template-columns: 1fr; align-items: stretch; width: calc(100% - 6px); gap: 5px; font-size: 12px; }
                    .ebc-title-power-editor label { height: 30px; }
                    .ebc-title-power-editor input { font-size: 16px; }
                    .ebc-area-game-grid.units { grid-template-columns: 1fr; gap: 8px; }
                    .ebc-area-game-grid.attrs { grid-template-columns: repeat(2, 1fr); gap: 8px; }
                    .ebc-area-unit-header { width: 100%; min-width: 0; grid-template-columns: minmax(74px, 1fr) minmax(80px, 92px) minmax(66px, 76px); gap: 5px; padding: 0 9px 3px; }
                    .ebc-area-game-pill { height: 46px; border-radius: 13px; grid-template-columns: minmax(74px, 1fr) minmax(80px, 92px) minmax(66px, 76px); gap: 5px; }
                    .ebc-area-game-pill.attr { grid-template-columns: 42px minmax(96px, 112px); gap: 6px; }
                    .ebc-area-pill-media img { max-height: 30px; }
                    .ebc-area-pill-media.icon img { width: 34px; height: 34px; }
                    .ebc-area-pill-input { height: 30px; padding: 0 7px; gap: 3px; }
                    .ebc-area-pill-input input { font-size: 18px; }
                    .ebc-area-pill-input b { font-size: 15px; min-width: 15px; }
                    .ebc-area-pill-input.gate { padding: 0 6px; }
                    .ebc-area-pill-input.gate input { font-size: 15px; }
                    .ebc-area-pill-input.gate b { font-size: 10px; min-width: 20px; }
                    .ebc-area-character-grid { grid-template-columns: repeat(4, 1fr); gap: 4px; align-items: start; justify-items: stretch; }
                    .ebc-area-character-pill { width: 100%; padding: 1px 4px 1px 1px; gap: 4px; border-radius: 14px; }
                    .ebc-area-character-face { min-width: 20px; flex: 0 0 auto; }
                    .ebc-area-character-face img { width: 20px; height: 20px; }
                    .ebc-area-character-input, .ebc-area-character-pill label > input { height: 20px; }
                    .ebc-area-character-pill input { font-size: 10px; font-weight: 700; height: 20px; line-height: 20px; }
                    .ebc-area-character-input b { font-size: 10px; font-weight: 700; line-height: 20px; }
                    .ebc-area-floating-footer { padding: 12px 14px 14px; flex-wrap: wrap; }
                    .ebc-power-detail-backdrop { padding: 8px; }
                    .ebc-power-detail-modal { min-height: min(500px, 94vh); border-radius: 14px; }
                    .ebc-power-detail-close { top: 8px; right: 10px; font-size: 38px; width: 34px; height: 34px; line-height: 30px; }
                    .ebc-power-detail-body { padding: 48px 12px 18px; gap: 18px; }
                    .ebc-power-detail-total { font-size: 17px; gap: 8px; }
                    .ebc-power-detail-total strong { font-size: 21px; letter-spacing: 1px; }
                    .ebc-power-detail-box { padding: 16px 14px; gap: 12px; border-radius: 10px; }
                    .ebc-power-detail-row { font-size: 14px; gap: 10px; grid-template-columns: minmax(0, 1fr) 1px minmax(68px, auto); }
                    .ebc-power-detail-row i { height: 22px; }
                    .ebc-power-detail-row strong { font-size: 15px; letter-spacing: 0; }
                    .ebc-power-detail-footer { padding: 12px 14px 14px; }
                    .ebc-power-detail-footer button { min-width: 180px; height: 46px; font-size: 18px; }
                    .ebc-canvas-toggle { font-size: 9px; }
                    .ebc-slot-power-row .ebc-slot-base-power { font-size: 10px; padding: 0 5px; }
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
