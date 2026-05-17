import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import CharacterSelector from './common/CharacterSelector';
import {
    calculateSupportCardBonus,
    formatSupportPercent,
    getCardCharacterId,
    getCardCharacterName,
    getSupportRarityKey,
    getSupportUnitMemberIds,
    getWorldLinkKoreanLabel,
    getWorldLinkSeason,
    isSupportBonusWorldLinkCard,
    parseSupportDate,
} from '../utils/supportCardUtils';

const SLOT_COUNT = 25;
const MAIN_DECK_SLOT_COUNT = 5;
const MASTER_RANK_OPTIONS = [0, 1, 2, 3, 4, 5];
const SKILL_LEVEL_OPTIONS = [1, 2, 3, 4];
const CARD_API_URL = 'https://api.rilaksekai.com/api/cards';
const MAIN_DECK_PREVIEW_FACE_URL = 'https://asset.rilaksekai.com/face/res021_no001_normal.webp';
const PICKER_GROUPS = [
    { key: 'rarity4', label: '4성', matches: (card) => Number(card?.rarity) === 4 && card?.type !== 'Birthday' && card?.type !== 'Anniversary' },
    { key: 'birthday', label: '생일', matches: (card) => card?.type === 'Birthday' || card?.type === 'Anniversary' },
    { key: 'rarity3', label: '3성', matches: (card) => Number(card?.rarity) === 3 && card?.type !== 'Birthday' && card?.type !== 'Anniversary' },
    { key: 'low', label: '2성이하', matches: (card) => Number(card?.rarity) <= 2 },
];
const MAIN_DECK_RARITY_OPTIONS = [
    { key: 'rarity4', label: '★4', typeBonus: 25, masterRankBonus: [10, 12.5, 15, 17.5, 20, 25], canPickup: true, memberBonus: 20, pickupBonus: 30 },
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

const createEmptySlots = () => (
    Array.from({ length: SLOT_COUNT }, () => ({
        cardId: null,
        masterRank: 0,
        skillLevel: 1,
    }))
);

const normalizeSlots = (slots) => {
    const normalized = createEmptySlots();
    if (!Array.isArray(slots)) return normalized;

    slots.slice(0, SLOT_COUNT).forEach((slot, index) => {
        normalized[index] = {
            cardId: slot?.cardId ?? null,
            masterRank: Number(slot?.masterRank) || 0,
            skillLevel: Number(slot?.skillLevel) || 1,
        };
    });

    return normalized;
};

const createEmptyMainDeckSlots = () => (
    Array.from({ length: MAIN_DECK_SLOT_COUNT }, () => ({
        rarityKey: 'rarity4',
        masterRank: 0,
        pickup: false,
        featured: true,
        typeMatched: true,
    }))
);

const normalizeMainDeckSlots = (slots) => {
    const normalized = createEmptyMainDeckSlots();
    if (!Array.isArray(slots)) return normalized;

    slots.slice(0, MAIN_DECK_SLOT_COUNT).forEach((slot, index) => {
        const rarityKey = MAIN_DECK_RARITY_MAP[slot?.rarityKey] ? slot.rarityKey : '';
        const hasRarity = Boolean(rarityKey);

        normalized[index] = {
            rarityKey,
            masterRank: Math.max(0, Math.min(5, Number(slot?.masterRank) || 0)),
            pickup: hasRarity && rarityKey === 'rarity4' ? Boolean(slot?.pickup) : false,
            featured: hasRarity ? Boolean(slot?.featured) : false,
            typeMatched: hasRarity ? Boolean(slot?.typeMatched) : false,
        };
    });

    return normalized;
};

const calculateMainDeckSlotBonus = (slot) => {
    const rarityOption = MAIN_DECK_RARITY_MAP[slot?.rarityKey] || MAIN_DECK_RARITY_MAP[''];
    if (!rarityOption.key) {
        return {
            member: 0,
            character: 0,
            type: 0,
            masterRank: 0,
            total: 0,
        };
    }

    const normalizedMasterRank = Math.max(0, Math.min(5, Number(slot.masterRank) || 0));
    const hasMemberBonus = rarityOption.canPickup && (slot.pickup || slot.featured);
    const breakdown = {
        member: hasMemberBonus ? (slot.pickup ? rarityOption.pickupBonus : rarityOption.memberBonus) : 0,
        character: slot.featured ? 25 : 0,
        type: slot.typeMatched ? rarityOption.typeBonus : 0,
        masterRank: rarityOption.masterRankBonus[normalizedMasterRank] || 0,
    };

    return {
        ...breakdown,
        total: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    };
};

const getMainDeckPreviewRarity = (rarityKey) => {
    if (rarityKey === 'birthday') return 4;
    if (rarityKey === 'rarity3') return 3;
    if (rarityKey === 'rarity2') return 2;
    if (rarityKey === 'rarity1') return 1;
    return rarityKey ? 4 : 0;
};

const getCardTitle = (card) => {
    if (!card) return '';
    return card.title_kr || card.title || `#${card.id}`;
};

const getFaceSuffix = (card) => {
    const rarity = Number(card?.rarity) || 0;
    if (rarity <= 2 || card?.type === 'Birthday' || card?.type === 'Anniversary') return 'normal';
    return 'after_training';
};

const getCardImageUrl = (card, suffix = getFaceSuffix(card)) => {
    const characterId = String(getCardCharacterId(card) || 1).padStart(2, '0');
    const cardImageId = String(card?.card_image_id || '001').padStart(3, '0');
    return `https://asset.rilaksekai.com/face/res0${characterId}_no${cardImageId}_${suffix}.webp`;
};

const SupportCardThumbnail = ({
    card,
    selected = false,
    compact = false,
    picker = false,
    showLevels = false,
    masterRank = 0,
    skillLevel = 1,
}) => {
    const [imageSrc, setImageSrc] = useState(() => getCardImageUrl(card));

    useEffect(() => {
        setImageSrc(getCardImageUrl(card));
    }, [card]);

    if (!card) return null;

    const rarity = Number(card.rarity) || 1;
    const isBirthday = card.type === 'Birthday' || card.type === 'Anniversary';
    const isLowRarity = rarity <= 2;
    const frameName = isBirthday ? 'cardFrame_bd.webp' : isLowRarity ? 'frame_2star.webp' : 'Frame.webp';
    const starName = isBirthday ? 'rairity_birth.webp' : getFaceSuffix(card) === 'after_training' ? 'afterstar.webp' : 'star_normal.webp';
    const wlLabel = getWorldLinkKoreanLabel(card);
    const publicUrl = process.env.PUBLIC_URL || '';
    const normalizedMasterRank = Math.max(0, Math.min(5, Number(masterRank) || 0));
    const normalizedSkillLevel = Math.max(1, Math.min(4, Number(skillLevel) || 1));

    return (
        <div className={`support-card-thumb ${selected ? 'selected' : ''} ${compact ? 'compact' : ''} ${picker ? 'picker' : ''} ${showLevels ? 'with-levels' : ''}`}>
            <img
                className="support-card-face"
                src={imageSrc}
                alt={getCardTitle(card)}
                loading="lazy"
                onError={() => {
                    if (imageSrc.includes('after_training')) {
                        setImageSrc(getCardImageUrl(card, 'normal'));
                    }
                }}
            />
            <img
                className="support-card-frame"
                src={`${publicUrl}/assets/card_style/${frameName}`}
                alt=""
                loading="lazy"
                aria-hidden="true"
            />
            <img
                className="support-card-attribute"
                src={`${publicUrl}/assets/card_style/${card.attribute}.webp`}
                alt={card.attribute}
                loading="lazy"
            />
            {isBirthday ? (
                <img
                    className="support-card-birthday"
                    src={`${publicUrl}/assets/card_style/${starName}`}
                    alt="birthday"
                    loading="lazy"
                />
            ) : (
                <div className="support-card-stars" aria-label={`${rarity} star`}>
                    {Array.from({ length: Math.max(1, rarity) }, (_, index) => (
                        <img
                            key={index}
                            src={`${publicUrl}/assets/card_style/${starName}`}
                            alt=""
                            loading="lazy"
                            aria-hidden="true"
                        />
                    ))}
                </div>
            )}
            {wlLabel && (
                <div className="support-wl-badge">
                    {wlLabel}
                </div>
            )}
            {showLevels && (
                <>
                    <div className="support-skill-badge">SLV.{normalizedSkillLevel}</div>
                    {normalizedMasterRank > 0 && (
                        <img
                            className="support-mastery-badge"
                            src={`${publicUrl}/assets/card_style/masterRank_S_${normalizedMasterRank}.webp`}
                            alt={`master rank ${normalizedMasterRank}`}
                            loading="lazy"
                        />
                    )}
                </>
            )}
        </div>
    );
};

const MainDeckPreviewCard = ({ rarityKey, masterRank = 0 }) => {
    const publicUrl = process.env.PUBLIC_URL || '';
    const rarity = getMainDeckPreviewRarity(rarityKey);
    const isBirthday = rarityKey === 'birthday';
    const isLowRarity = rarity > 0 && rarity <= 2;
    const frameName = isBirthday ? 'cardFrame_bd.webp' : isLowRarity ? 'frame_2star.webp' : 'Frame.webp';
    const starName = isBirthday ? 'rairity_birth.webp' : 'afterstar.webp';
    const normalizedMasterRank = Math.max(0, Math.min(5, Number(masterRank) || 0));

    return (
        <div className={`support-card-thumb support-main-preview-card with-levels ${rarityKey ? '' : 'empty'}`}>
            <img
                className="support-card-face"
                src={MAIN_DECK_PREVIEW_FACE_URL}
                alt="메인덱 미리보기"
                loading="lazy"
            />
            <img
                className="support-card-frame"
                src={`${publicUrl}/assets/card_style/${frameName}`}
                alt=""
                loading="lazy"
                aria-hidden="true"
            />
            <img
                className="support-card-attribute"
                src={`${publicUrl}/assets/card_style/pure.webp`}
                alt="pure"
                loading="lazy"
            />
            {rarityKey && isBirthday && (
                <img
                    className="support-card-birthday"
                    src={`${publicUrl}/assets/card_style/${starName}`}
                    alt="birthday"
                    loading="lazy"
                />
            )}
            {rarityKey && !isBirthday && (
                <div className="support-card-stars" aria-label={`${rarity} star`}>
                    {Array.from({ length: rarity }, (_, index) => (
                        <img
                            key={index}
                            src={`${publicUrl}/assets/card_style/${starName}`}
                            alt=""
                            loading="lazy"
                            aria-hidden="true"
                        />
                    ))}
                </div>
            )}
            <div className="support-skill-badge">{rarityKey ? 'SLV.4' : '비움'}</div>
            {normalizedMasterRank > 0 && (
                <img
                    className="support-mastery-badge"
                    src={`${publicUrl}/assets/card_style/masterRank_S_${normalizedMasterRank}.webp`}
                    alt={`master rank ${normalizedMasterRank}`}
                    loading="lazy"
                />
            )}
        </div>
    );
};

const NumberDropdown = ({ value, options, onChange, prefix, suffix = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleOutsideClick = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen]);

    return (
        <div className="support-select" ref={dropdownRef} style={{ zIndex: isOpen ? 80 : 1 }}>
            <button
                type="button"
                className={`support-select-button ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(prev => !prev)}
            >
                <span>{prefix}</span>
                <strong>{value}{suffix}</strong>
            </button>
            {isOpen && (
                <div className="support-select-menu">
                    {options.map(option => (
                        <button
                            key={option}
                            type="button"
                            className={option === value ? 'selected' : ''}
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}
                        >
                            {option}{suffix}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const OptionDropdown = ({ value, options, onChange, prefix }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const selectedOption = options.find(option => option.key === value) || options[0];

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleOutsideClick = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen]);

    return (
        <div className="support-select" ref={dropdownRef} style={{ zIndex: isOpen ? 80 : 1 }}>
            <button
                type="button"
                className={`support-select-button ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(prev => !prev)}
            >
                <span>{prefix}</span>
                <strong>{selectedOption.label}</strong>
            </button>
            {isOpen && (
                <div className="support-select-menu">
                    {options.map(option => (
                        <button
                            key={option.key || 'empty'}
                            type="button"
                            className={option.key === value ? 'selected' : ''}
                            onClick={() => {
                                onChange(option.key);
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const SupportDeckTab = () => {
    const { language, t } = useTranslation();
    const [selectedCharId, setSelectedCharId] = useState(1);
    const [decks, setDecks] = useState({});
    const [mainDeckSlots, setMainDeckSlots] = useState(() => createEmptyMainDeckSlots());
    const [finaleEnabled, setFinaleEnabled] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [cards, setCards] = useState([]);
    const [cardsLoading, setCardsLoading] = useState(true);
    const [cardsError, setCardsError] = useState('');
    const [activeSlotIndex, setActiveSlotIndex] = useState(null);
    const [isMainDeckOpen, setIsMainDeckOpen] = useState(false);
    const [pickerCharId, setPickerCharId] = useState(1);
    const [searchText, setSearchText] = useState('');
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkMasterRank, setBulkMasterRank] = useState(5);
    const [bulkSkillLevel, setBulkSkillLevel] = useState(4);
    const bulkRef = useRef(null);

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('supportDeckState') || '{}');
            if (saved.selectedCharId) setSelectedCharId(Number(saved.selectedCharId) || 1);
            if (saved.decks && typeof saved.decks === 'object') setDecks(saved.decks);
            if (saved.mainDeckSlots) setMainDeckSlots(normalizeMainDeckSlots(saved.mainDeckSlots));
            if (typeof saved.finaleEnabled === 'boolean') setFinaleEnabled(saved.finaleEnabled);
        } catch (error) {
            console.error('Failed to load support deck state', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('supportDeckState', JSON.stringify({ selectedCharId, decks, mainDeckSlots, finaleEnabled }));
    }, [decks, finaleEnabled, isLoaded, mainDeckSlots, selectedCharId]);

    useEffect(() => {
        setPickerCharId(Number(selectedCharId));
    }, [selectedCharId]);

    useEffect(() => {
        if (!bulkOpen) return undefined;
        const handleClick = (e) => {
            if (bulkRef.current && !bulkRef.current.contains(e.target)) {
                setBulkOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [bulkOpen]);

    useEffect(() => {
        let isMounted = true;

        const loadCards = async () => {
            setCardsLoading(true);
            setCardsError('');

            try {
                const response = await fetch(CARD_API_URL, { cache: 'reload' });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                if (isMounted) setCards(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to load support cards', error);
                if (isMounted) setCardsError('카드 목록을 불러오지 못했습니다.');
            } finally {
                if (isMounted) setCardsLoading(false);
            }
        };

        loadCards();

        return () => {
            isMounted = false;
        };
    }, []);

    const currentSlots = useMemo(() => normalizeSlots(decks[selectedCharId]), [decks, selectedCharId]);

    const cardsById = useMemo(() => {
        return cards.reduce((map, card) => {
            map.set(Number(card.id), card);
            return map;
        }, new Map());
    }, [cards]);

    const unitMemberIds = useMemo(() => getSupportUnitMemberIds(selectedCharId), [selectedCharId]);

    const pickerCharacterCards = useMemo(() => {
        return cards
            .filter(card => getCardCharacterId(card) === Number(pickerCharId))
            .sort((a, b) => {
                const dateA = parseSupportDate(a.available_from)?.getTime() || 0;
                const dateB = parseSupportDate(b.available_from)?.getTime() || 0;
                if (dateA !== dateB) return dateB - dateA;
                return Number(b.id) - Number(a.id);
            });
    }, [cards, pickerCharId]);

    const modalCards = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        if (!query) return pickerCharacterCards;

        return pickerCharacterCards.filter(card => {
            const fields = [
                card.title,
                card.title_kr,
                card.type,
                card.attribute,
                card.skill_effect,
                card.available_from,
                String(card.id),
            ];
            return fields.some(field => String(field || '').toLowerCase().includes(query));
        });
    }, [searchText, pickerCharacterCards]);

    const modalCardGroups = useMemo(() => {
        return PICKER_GROUPS.map(group => ({
            ...group,
            cards: modalCards.filter(group.matches),
        })).filter(group => group.cards.length > 0);
    }, [modalCards]);

    const { fourStarCount, hasWl3 } = useMemo(() => {
        let count = 0;
        let hasWl3 = false;
        cards.forEach(card => {
            if (getCardCharacterId(card) === Number(selectedCharId)
                && Number(card.rarity) === 4
                && card.type !== 'Birthday'
                && card.type !== 'Anniversary') {
                if (getWorldLinkSeason(card) === 3) {
                    hasWl3 = true;
                } else {
                    count++;
                }
            }
        });
        return { fourStarCount: count, hasWl3 };
    }, [cards, selectedCharId]);

    const slotResults = useMemo(() => {
        return currentSlots.map(slot => {
            const card = slot.cardId ? cardsById.get(Number(slot.cardId)) : null;
            const bonus = calculateSupportCardBonus(card, slot.masterRank, slot.skillLevel, selectedCharId);
            return { slot, card, bonus };
        });
    }, [cardsById, currentSlots, selectedCharId]);

    const totalBonus = useMemo(() => {
        return slotResults.reduce((sum, result) => sum + result.bonus.total, 0);
    }, [slotResults]);

    const mainDeckResults = useMemo(() => {
        return mainDeckSlots.map(slot => ({
            slot,
            rarityOption: MAIN_DECK_RARITY_MAP[slot.rarityKey] || MAIN_DECK_RARITY_MAP[''],
            bonus: calculateMainDeckSlotBonus(slot),
        }));
    }, [mainDeckSlots]);

    const mainDeckBonus = useMemo(() => {
        return mainDeckResults.reduce((sum, result) => sum + result.bonus.total, 0);
    }, [mainDeckResults]);

    const supportEventBonus = totalBonus + (finaleEnabled ? 50 : 0);
    const supportBadgeBonus = supportEventBonus / 2;
    const displayTotalBonus = mainDeckBonus + supportEventBonus;
    const displayBadgeBonus = mainDeckBonus + supportBadgeBonus;
    const hasMainDeckBonus = mainDeckBonus > 0;

    const selectedCount = useMemo(() => {
        return slotResults.filter(result => result.card).length;
    }, [slotResults]);

    const updateSlot = (index, updater) => {
        setDecks(prev => {
            const nextSlots = normalizeSlots(prev[selectedCharId]);
            const current = nextSlots[index];
            nextSlots[index] = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
            return {
                ...prev,
                [selectedCharId]: nextSlots,
            };
        });
    };

    const updateMainDeckSlot = (index, patch) => {
        setMainDeckSlots(prev => {
            const nextSlots = normalizeMainDeckSlots(prev);
            const current = nextSlots[index];
            const nextSlot = {
                ...current,
                ...patch,
            };

            if (Object.prototype.hasOwnProperty.call(patch, 'rarityKey')) {
                const hasRarity = Boolean(patch.rarityKey);
                nextSlot.masterRank = hasRarity ? current.masterRank : 0;
                nextSlot.featured = hasRarity;
                nextSlot.typeMatched = hasRarity;
                nextSlot.pickup = hasRarity && patch.rarityKey === 'rarity4' ? current.pickup : false;
            }

            if (nextSlot.rarityKey !== 'rarity4') {
                nextSlot.pickup = false;
            }

            nextSlots[index] = nextSlot;
            return nextSlots;
        });
    };

    const clearMainDeck = () => {
        setMainDeckSlots(createEmptyMainDeckSlots());
    };

    const applyMainTheoryDeck = () => {
        setMainDeckSlots(Array.from({ length: MAIN_DECK_SLOT_COUNT }, () => ({
            rarityKey: 'rarity4',
            masterRank: 5,
            pickup: true,
            featured: true,
            typeMatched: true,
        })));
    };

    const selectCard = (card) => {
        if (activeSlotIndex === null) return;
        updateSlot(activeSlotIndex, { cardId: card.id });
        setActiveSlotIndex(null);
        setSearchText('');
    };

    const openCardPicker = (index) => {
        setPickerCharId(Number(selectedCharId));
        setActiveSlotIndex(index);
    };

    const clearSlot = () => {
        if (activeSlotIndex === null) return;
        updateSlot(activeSlotIndex, { cardId: null });
        setActiveSlotIndex(null);
        setSearchText('');
    };

    const clearCurrentDeck = () => {
        if (!window.confirm(t('support.clear_confirm').replace('{{name}}', getCardCharacterName(selectedCharId, language)))) return;
        setDecks(prev => ({
            ...prev,
            [selectedCharId]: createEmptySlots(),
        }));
    };

    const applyTheoryDeck = () => {
        const rankedCards = cards
            .filter(card => (
                unitMemberIds.includes(getCardCharacterId(card))
                && getWorldLinkSeason(card) !== 3
            ))
            .map(card => ({
                card,
                bonus: calculateSupportCardBonus(card, 5, 4, selectedCharId).total,
                hasWorldLinkBonus: isSupportBonusWorldLinkCard(card, selectedCharId),
                date: parseSupportDate(card.available_from)?.getTime() || 0,
            }))
            .sort((a, b) => {
                if (b.bonus !== a.bonus) return b.bonus - a.bonus;
                if (Number(b.hasWorldLinkBonus) !== Number(a.hasWorldLinkBonus)) {
                    return Number(b.hasWorldLinkBonus) - Number(a.hasWorldLinkBonus);
                }
                if (b.date !== a.date) return b.date - a.date;
                return Number(b.card.id) - Number(a.card.id);
            });

        const nextSlots = createEmptySlots();
        rankedCards.slice(0, SLOT_COUNT).forEach(({ card }, index) => {
            nextSlots[index] = {
                cardId: card.id,
                masterRank: 5,
                skillLevel: 4,
            };
        });

        setDecks(prev => ({
            ...prev,
            [selectedCharId]: nextSlots,
        }));
    };

    const sortCurrentDeck = () => {
        setDecks(prev => {
            const sortedSlots = normalizeSlots(prev[selectedCharId]).sort((a, b) => {
                const cardA = a.cardId ? cardsById.get(Number(a.cardId)) : null;
                const cardB = b.cardId ? cardsById.get(Number(b.cardId)) : null;
                const bonusA = calculateSupportCardBonus(cardA, a.masterRank, a.skillLevel, selectedCharId).total;
                const bonusB = calculateSupportCardBonus(cardB, b.masterRank, b.skillLevel, selectedCharId).total;

                if (bonusB !== bonusA) return bonusB - bonusA;
                if (cardA && !cardB) return -1;
                if (!cardA && cardB) return 1;
                return Number(b.cardId || 0) - Number(a.cardId || 0);
            });

            return {
                ...prev,
                [selectedCharId]: sortedSlots,
            };
        });
    };

    const applyBulk = () => {
        setDecks(prev => {
            const nextSlots = normalizeSlots(prev[selectedCharId]).map(slot => {
                if (!slot.cardId) return slot;
                return { ...slot, masterRank: bulkMasterRank, skillLevel: bulkSkillLevel };
            });
            return { ...prev, [selectedCharId]: nextSlots };
        });
        setBulkOpen(false);
    };

    const activeSlot = activeSlotIndex !== null ? slotResults[activeSlotIndex] : null;

    return (
        <div id="support-tab-content" className="support-tab">
            <style>{`
                .support-tab {
                    --support-border: #dbe4ef;
                    --support-ink: #263445;
                    --support-muted: #64748b;
                    --support-blue: #2563eb;
                    --support-cyan: #0f9fbd;
                    --support-green: #0f9f6e;
                    --support-rose: #d94676;
                    color: var(--support-ink);
                    text-align: left;
                }

                .support-header {
                    display: grid;
                    grid-template-columns: minmax(220px, 1fr) auto;
                    gap: 14px;
                    align-items: end;
                    margin-bottom: 14px;
                }

                .support-title-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .support-title-row h2 {
                    margin: 0;
                    font-size: 22px;
                    line-height: 1.2;
                    color: var(--support-ink);
                }

                .support-summary {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(110px, 1fr));
                    gap: 8px;
                    min-width: 360px;
                }

                .support-summary-box {
                    border: 1px solid var(--support-border);
                    border-radius: 8px;
                    padding: 10px 12px;
                    background: #ffffff;
                    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
                }

                .support-summary-box span {
                    display: block;
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--support-muted);
                    margin-bottom: 3px;
                }

                .support-summary-box strong {
                    display: block;
                    font-size: 20px;
                    line-height: 1.1;
                    color: var(--support-ink);
                    font-variant-numeric: tabular-nums;
                }

                .support-summary-detail {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    margin-top: 4px;
                    color: #000;
                    font-size: 10px;
                    font-weight: 800;
                    line-height: 1.1;
                    font-variant-numeric: tabular-nums;
                    white-space: nowrap;
                    letter-spacing: -0.3px;
                }

                .support-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 8px;
                    margin: 8px 0 12px;
                    flex-wrap: wrap;
                }

                .support-action-group {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .support-chip {
                    display: inline-flex;
                    align-items: center;
                    margin-right: auto;
                    height: 30px;
                    padding: 0 10px;
                    border-radius: 8px;
                    border: 1px solid #cde7ef;
                    background: #f0fbff;
                    color: #0e7490;
                    font-size: 12px;
                    font-weight: 800;
                    white-space: nowrap;
                }

                .support-bulk-wrap {
                    position: relative;
                }

                .support-bulk-panel {
                    position: absolute;
                    top: calc(100% + 6px);
                    right: 0;
                    z-index: 100;
                    background: #ffffff;
                    border: 1px solid #bfdbfe;
                    border-radius: 10px;
                    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
                    padding: 12px 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    white-space: nowrap;
                    font-size: 12px;
                    font-weight: 800;
                    color: var(--support-ink);
                }

                .support-bulk-panel label {
                    color: var(--support-muted);
                    font-size: 11px;
                }

                .support-bulk-apply {
                    height: 30px;
                    padding: 0 12px;
                    border-radius: 8px;
                    border: 0;
                    background: var(--support-blue);
                    color: #ffffff;
                    font-size: 12px;
                    font-weight: 900;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }

                .support-bulk-apply:hover {
                    background: #1d4ed8;
                }

                .support-ghost-button {
                    height: 32px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #475569;
                    font-weight: 800;
                    font-size: 12px;
                    padding: 0 12px;
                    cursor: pointer;
                    transition: border-color 0.16s ease, color 0.16s ease, background 0.16s ease;
                }

                .support-ghost-button:hover {
                    border-color: #94a3b8;
                    color: #1e293b;
                    background: #f8fafc;
                }

                .support-ghost-button.active {
                    border-color: #22c55e;
                    background: #ecfdf5;
                    color: #047857;
                }

                .support-main-open-button,
                .support-main-open-button.active {
                    border-color: #0f766e;
                    background: #0f766e;
                    color: #ffffff;
                    box-shadow: 0 5px 14px rgba(15, 118, 110, 0.24);
                }

                .support-main-open-button:hover,
                .support-main-open-button.active:hover {
                    border-color: #115e59;
                    background: #115e59;
                    color: #ffffff;
                }

                .support-grid {
                    display: grid;
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                    gap: 10px;
                }

                .support-slot {
                    min-width: 0;
                    border: 1px solid var(--support-border);
                    border-radius: 8px;
                    background: #ffffff;
                    padding: 8px;
                    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
                }

                .support-slot-card {
                    display: block;
                    width: 100%;
                    aspect-ratio: 1 / 1;
                    border: 0;
                    padding: 0;
                    margin: 0;
                    border-radius: 8px;
                    background: #f8fafc;
                    cursor: pointer;
                    position: relative;
                    overflow: visible;
                }

                .support-empty-card {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    border: 1px dashed #b8c5d6;
                    border-radius: 8px;
                    color: #64748b;
                    background: #f8fafc;
                    font-size: 12px;
                    font-weight: 800;
                }

                .support-empty-card span:first-child {
                    font-size: 24px;
                    line-height: 1;
                    color: #94a3b8;
                }

                .support-slot-meta {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 6px;
                    margin-top: 7px;
                    min-height: 18px;
                    font-size: 11px;
                    font-weight: 800;
                    color: var(--support-muted);
                }

                .support-slot-meta strong {
                    color: var(--support-green);
                    font-variant-numeric: tabular-nums;
                }

                .support-slot-controls {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 5px;
                    margin-top: 7px;
                }

                .support-select {
                    position: relative;
                    min-width: 0;
                }

                .support-select-button {
                    width: 100%;
                    height: 32px;
                    border: 1px solid #d5deea;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #334155;
                    padding: 0 7px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 800;
                    white-space: nowrap;
                }

                .support-select-button.open,
                .support-select-button:hover {
                    border-color: #93c5fd;
                    color: var(--support-blue);
                }

                .support-select-button span {
                    color: #64748b;
                    font-weight: 700;
                }

                .support-select-menu {
                    position: absolute;
                    z-index: 200;
                    left: 0;
                    min-width: 100%;
                    width: max-content;
                    top: calc(100% + 4px);
                    border: 1px solid #bfdbfe;
                    border-radius: 8px;
                    background: #ffffff;
                    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
                    padding: 4px;
                }

                .support-select-menu button {
                    display: block;
                    width: 100%;
                    height: 28px;
                    border: 0;
                    border-radius: 6px;
                    background: transparent;
                    color: #334155;
                    font-size: 12px;
                    font-weight: 800;
                    cursor: pointer;
                }

                .support-select-menu button:hover,
                .support-select-menu button.selected {
                    background: #eff6ff;
                    color: var(--support-blue);
                }

                .support-card-thumb {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 8px;
                    overflow: hidden;
                    background: #e2e8f0;
                    box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
                }

                .support-card-thumb.selected {
                    box-shadow: 0 0 0 3px #22c55e, inset 0 0 0 1px rgba(15, 23, 42, 0.08);
                }

                .support-card-face,
                .support-card-frame {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .support-card-thumb.picker .support-card-face {
                    object-fit: contain;
                    background: #edf2f7;
                }

                .support-card-frame {
                    z-index: 2;
                    pointer-events: none;
                }

                .support-card-attribute {
                    position: absolute;
                    top: 2%;
                    left: 2%;
                    z-index: 3;
                    width: 22%;
                    height: 22%;
                    object-fit: contain;
                    pointer-events: none;
                }

                .support-card-stars {
                    position: absolute;
                    z-index: 3;
                    bottom: 4%;
                    left: 3%;
                    width: 94%;
                    display: flex;
                    gap: 1%;
                    pointer-events: none;
                }

                .support-card-thumb.with-levels .support-card-stars {
                    bottom: 18%;
                    left: 5%;
                    width: 74%;
                }

                .support-card-stars img {
                    width: 13%;
                    aspect-ratio: 1 / 1;
                    object-fit: contain;
                }

                .support-card-birthday {
                    position: absolute;
                    z-index: 3;
                    bottom: 3%;
                    left: 4%;
                    width: 22%;
                    height: auto;
                    pointer-events: none;
                }

                .support-card-thumb.with-levels .support-card-birthday {
                    bottom: 18%;
                }

                .support-wl-badge {
                    position: absolute;
                    z-index: 5;
                    top: 4px;
                    right: 4px;
                    max-width: calc(100% - 8px);
                    padding: 2px 5px;
                    border-radius: 5px;
                    background: rgba(14, 165, 164, 0.92);
                    color: #ffffff;
                    font-size: 10px;
                    font-weight: 900;
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
                    pointer-events: none;
                }

                .support-skill-badge {
                    position: absolute;
                    z-index: 1;
                    left: 0;
                    bottom: 0;
                    height: 19%;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    padding: 0 32% 0 7%;
                    border-radius: 0 0 7px 7px;
                    background: rgba(45, 48, 84, 0.9);
                    color: #ffffff;
                    font-size: 15px;
                    font-weight: 900;
                    line-height: 1;
                    letter-spacing: 0;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
                    pointer-events: none;
                    transform: translateY(-4%);
                }

                .support-mastery-badge {
                    position: absolute;
                    z-index: 6;
                    right: 4%;
                    bottom: 3%;
                    width: 30%;
                    height: auto;
                    object-fit: contain;
                    filter: drop-shadow(0 2px 4px rgba(15, 23, 42, 0.28));
                    pointer-events: none;
                }

                .support-modal.support-main-modal {
                    width: min(1120px, 100%);
                }

                .support-main-summary {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    padding: 12px 14px;
                    border-bottom: 1px solid #e8eef6;
                    background: #ffffff;
                    color: #334155;
                    font-size: 12px;
                    font-weight: 900;
                }

                .support-main-summary strong {
                    color: var(--support-green);
                    font-size: 18px;
                    font-variant-numeric: tabular-nums;
                }

                .support-main-deck-grid {
                    display: grid;
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                    gap: 12px;
                }

                .support-main-slot {
                    min-width: 0;
                    border: 1px solid var(--support-border);
                    border-radius: 8px;
                    background: #ffffff;
                    padding: 10px;
                    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
                }

                .support-main-preview-wrap {
                    width: 100%;
                    aspect-ratio: 1 / 1;
                    margin-bottom: 8px;
                }

                .support-main-preview-card.empty .support-card-face {
                    filter: grayscale(0.35);
                    opacity: 0.54;
                }

                .support-main-preview-card.empty .support-card-attribute,
                .support-main-preview-card.empty .support-card-frame {
                    opacity: 0.62;
                }

                .support-main-slot-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    margin-bottom: 8px;
                    font-size: 12px;
                    font-weight: 900;
                    color: var(--support-muted);
                }

                .support-main-slot-header strong {
                    color: var(--support-green);
                    font-variant-numeric: tabular-nums;
                }

                .support-main-toggle {
                    border: 1px solid #d5deea;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #475569;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 900;
                    white-space: nowrap;
                    transition: border-color 0.16s ease, color 0.16s ease, background 0.16s ease;
                }

                .support-main-toggle:hover {
                    border-color: #93c5fd;
                    color: var(--support-blue);
                    background: #f8fafc;
                }

                .support-main-toggle.active {
                    border-color: #22c55e;
                    background: #ecfdf5;
                    color: #047857;
                }

                .support-main-toggle::before {
                    content: '';
                    width: 12px;
                    height: 12px;
                    border: 1px solid currentColor;
                    border-radius: 3px;
                    background: #ffffff;
                    box-sizing: border-box;
                }

                .support-main-toggle.active::before {
                    background: #10b981;
                    border-color: #10b981;
                    box-shadow: inset 0 0 0 2px #ffffff;
                }

                .support-main-toggle:disabled {
                    cursor: not-allowed;
                    opacity: 0.48;
                    background: #f8fafc;
                    color: #94a3b8;
                }

                .support-main-control-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 6px;
                }

                .support-main-toggle-row {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 5px;
                    margin-top: 6px;
                }

                .support-main-toggle {
                    height: 32px;
                    padding: 0 6px;
                }

                .support-main-breakdown {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 4px;
                    margin-top: 8px;
                    color: #64748b;
                    font-size: 10px;
                    font-weight: 800;
                }

                .support-main-breakdown span {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 4px;
                    min-width: 0;
                    border-radius: 6px;
                    background: #f8fafc;
                    padding: 4px 5px;
                }

                .support-main-breakdown b {
                    color: #334155;
                    font-variant-numeric: tabular-nums;
                }

                .support-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 1000;
                    background: rgba(15, 23, 42, 0.58);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                }

                .support-modal {
                    width: min(1040px, 100%);
                    max-height: 100%;
                    border-radius: 8px;
                    background: #ffffff;
                    box-shadow: 0 26px 70px rgba(15, 23, 42, 0.34);
                    display: flex;
                    flex-direction: column;
                    overflow: visible;
                }

                .support-modal-header {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    align-items: start;
                    gap: 12px;
                    padding: 14px;
                    border-bottom: 1px solid var(--support-border);
                    background: #f8fbff;
                }

                .support-modal-header h3 {
                    margin: 0 0 4px;
                    font-size: 18px;
                    color: var(--support-ink);
                }

                .support-modal-header p {
                    margin: 0;
                    font-size: 12px;
                    color: var(--support-muted);
                    line-height: 1.4;
                }

                .support-modal-actions {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }

                .support-modal-close,
                .support-modal-clear {
                    height: 32px;
                    border-radius: 8px;
                    border: 1px solid #cbd5e1;
                    background: #ffffff;
                    color: #334155;
                    font-size: 12px;
                    font-weight: 900;
                    padding: 0 10px;
                    cursor: pointer;
                }

                .support-modal-clear {
                    color: var(--support-rose);
                    border-color: #f5bfd0;
                }

                .support-picker-character-bar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    border-bottom: 1px solid #e8eef6;
                    background: #ffffff;
                    overflow-x: auto;
                    scrollbar-width: none;
                }

                .support-picker-character-bar::-webkit-scrollbar {
                    display: none;
                }

                .support-picker-character-button {
                    width: 44px;
                    height: 44px;
                    flex: 0 0 auto;
                    border: 1px solid #d5deea;
                    border-radius: 50%;
                    padding: 2px;
                    background: #ffffff;
                    cursor: pointer;
                    overflow: hidden;
                    transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
                }

                .support-picker-character-button:hover {
                    transform: translateY(-1px);
                    border-color: #93c5fd;
                }

                .support-picker-character-button.selected {
                    border-color: var(--support-blue);
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
                }

                .support-picker-character-button img {
                    display: block;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .support-modal-tools {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 14px;
                    border-bottom: 1px solid #e8eef6;
                }

                .support-search {
                    flex: 1;
                    min-width: 160px;
                    width: auto !important;
                    margin: 0 !important;
                    border-radius: 8px;
                    text-align: left;
                    font-size: 14px;
                    padding: 8px 10px;
                }

                .support-count {
                    color: var(--support-muted);
                    font-size: 12px;
                    font-weight: 800;
                    white-space: nowrap;
                }

                .support-modal-scroll {
                    overflow-y: auto;
                    padding: 14px;
                }

                .support-picker-section + .support-picker-section {
                    margin-top: 18px;
                }

                .support-picker-heading {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 0 0 8px;
                    color: #334155;
                    font-size: 13px;
                    font-weight: 900;
                }

                .support-picker-heading span {
                    color: var(--support-muted);
                    font-size: 11px;
                    font-weight: 800;
                }

                .support-card-picker-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
                    gap: 10px;
                }

                .support-card-picker-button {
                    border: 0;
                    padding: 0;
                    background: transparent;
                    cursor: pointer;
                    text-align: left;
                    min-width: 0;
                    aspect-ratio: 1 / 1;
                }

                .support-empty-list {
                    padding: 40px 12px;
                    text-align: center;
                    color: #64748b;
                    font-size: 14px;
                    font-weight: 800;
                }

                @media (max-width: 920px) {
                    .support-header {
                        grid-template-columns: 1fr;
                    }

                    .support-summary {
                        min-width: 0;
                    }
                }

                @media (max-width: 768px) {
                    .support-tab {
                        padding: 0 2px;
                    }

                    .support-title-row h2 {
                        font-size: 19px;
                    }

                    .support-summary {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                    }

                    .support-summary-box {
                        padding: 8px 7px;
                    }

                    .support-summary-box span {
                        font-size: 10px;
                    }

                    .support-summary-box strong {
                        font-size: 16px;
                    }

                    .support-toolbar {
                        justify-content: space-between;
                    }

                    .support-chip {
                        margin-right: 0;
                    }

                    .support-action-group {
                        width: 100%;
                        justify-content: flex-end;
                        margin-top: 4px;
                    }

                    .support-grid {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 8px;
                    }

                    .support-slot {
                        padding: 6px;
                    }

                    .support-slot-controls {
                        gap: 4px;
                    }

                    .support-select-button {
                        height: 30px;
                        padding: 0 5px;
                        font-size: 10px !important;
                    }

                    .support-select-menu button {
                        font-size: 12px !important;
                    }

                    .support-modal-backdrop {
                        padding: 8px;
                    }

                    .support-modal-header {
                        grid-template-columns: 1fr;
                    }

                    .support-modal-actions {
                        justify-content: flex-end;
                    }

                    .support-picker-character-button {
                        width: 40px;
                        height: 40px;
                    }

                    .support-card-picker-grid {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 8px;
                    }

                    .support-main-deck-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }

                @media (max-width: 420px) {
                    .support-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }

                    .support-card-picker-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }

                    .support-main-deck-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div className="support-header">
                <div className="support-title-row">
                    <CharacterSelector
                        selectedId={selectedCharId}
                        onSelect={(id) => setSelectedCharId(Number(id))}
                        language={language}
                    />
                    <span className="support-chip">25칸</span>
                </div>

                <div className="support-summary">
                    <div className="support-summary-box">
                        <span>{t('support.selected')}</span>
                        <strong>{selectedCount}/{SLOT_COUNT}</strong>
                    </div>
                    <div className="support-summary-box">
                        <span>{t('support.event')}</span>
                        <strong>{formatSupportPercent(supportEventBonus)}</strong>
                        {hasMainDeckBonus && (
                            <small className="support-summary-detail" style={{ whiteSpace: 'nowrap' }}>
                                <span>+{formatSupportPercent(mainDeckBonus)} =</span>
                                <span style={{ color: 'var(--support-blue)' }}>{formatSupportPercent(displayTotalBonus)}</span>
                            </small>
                        )}
                    </div>
                    <div className="support-summary-box">
                        <span>{t('support.badge')}</span>
                        <strong>{formatSupportPercent(supportBadgeBonus)}</strong>
                        {hasMainDeckBonus && (
                            <small className="support-summary-detail" style={{ whiteSpace: 'nowrap' }}>
                                <span>+{formatSupportPercent(mainDeckBonus)} =</span>
                                <span style={{ color: 'var(--support-blue)' }}>{formatSupportPercent(displayBadgeBonus)}</span>
                            </small>
                        )}
                    </div>
                </div>
            </div>

            <div className="support-toolbar">
                <span className="support-chip">{hasWl3 ? t('support.four_star_cards_wl3').replace('{{name}}', getCardCharacterName(selectedCharId, language)).replace('{{count}}', fourStarCount) : t('support.four_star_cards').replace('{{name}}', getCardCharacterName(selectedCharId, language)).replace('{{count}}', fourStarCount)}</span>
                <button
                    type="button"
                    className={`support-ghost-button support-main-open-button ${hasMainDeckBonus ? 'active' : ''}`}
                    onClick={() => setIsMainDeckOpen(true)}
                >
                    {t('support.main_deck')}
                </button>
                <div className="support-action-group">
                    <button
                        type="button"
                        className={`support-ghost-button ${finaleEnabled ? 'active' : ''}`}
                        onClick={() => setFinaleEnabled(prev => !prev)}
                        aria-pressed={finaleEnabled}
                    >
                        {t('support.finale')}
                    </button>
                    <button type="button" className="support-ghost-button" onClick={applyTheoryDeck}>
                        {t('support.support_theory')}
                    </button>
                    <button type="button" className="support-ghost-button" onClick={sortCurrentDeck}>
                        {t('support.sort')}
                    </button>
                    <button type="button" className="support-ghost-button" onClick={clearCurrentDeck}>
                        {t('support.reset')}
                    </button>
                    <div className="support-bulk-wrap" ref={bulkRef}>
                        <button
                            type="button"
                            className={`support-ghost-button ${bulkOpen ? 'active' : ''}`}
                            onClick={() => setBulkOpen(prev => !prev)}
                        >
                            {t('support.bulk')}
                        </button>
                        {bulkOpen && (
                            <div className="support-bulk-panel">
                                <label>{t('support.master_rank')}</label>
                                <select
                                    value={bulkMasterRank}
                                    onChange={e => setBulkMasterRank(Number(e.target.value))}
                                    style={{ height: 30, width: 56, borderRadius: 7, border: '1px solid #d5deea', padding: '0 4px', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                                >
                                    {MASTER_RANK_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                                <label>{t('support.skill')}</label>
                                <select
                                    value={bulkSkillLevel}
                                    onChange={e => setBulkSkillLevel(Number(e.target.value))}
                                    style={{ height: 30, width: 72, borderRadius: 7, border: '1px solid #d5deea', padding: '0 4px', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                                >
                                    {SKILL_LEVEL_OPTIONS.map(v => <option key={v} value={v}>{t('support.skill_level').replace('{{v}}', v)}</option>)}
                                </select>
                                <button type="button" className="support-bulk-apply" onClick={applyBulk}>
                                    {t('support.apply')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="support-grid">
                {slotResults.map(({ slot, card, bonus }, index) => (
                    <div className="support-slot" key={index}>
                        <button
                            type="button"
                            className="support-slot-card"
                            onClick={() => openCardPicker(index)}
                            aria-label={`${index + 1}번 카드 선택`}
                        >
                            {card ? (
                                <SupportCardThumbnail
                                    card={card}
                                    showLevels
                                    masterRank={slot.masterRank}
                                    skillLevel={slot.skillLevel}
                                />
                            ) : (
                                <div className="support-empty-card">
                                    <span>+</span>
                                    <span>{index + 1}</span>
                                </div>
                            )}
                        </button>
                        <div className="support-slot-meta">
                            <span>{getSupportRarityKey(card) === 'birthday' ? 'BD' : card ? `★${card.rarity}` : '-'}</span>
                            <strong>{formatSupportPercent(bonus.total)}</strong>
                        </div>
                        <div className="support-slot-controls">
                            <NumberDropdown
                                value={slot.masterRank}
                                options={MASTER_RANK_OPTIONS}
                                onChange={(value) => updateSlot(index, { masterRank: value })}
                                prefix={t('support.master_rank')}
                            />
                            <NumberDropdown
                                value={slot.skillLevel}
                                options={SKILL_LEVEL_OPTIONS}
                                onChange={(value) => updateSlot(index, { skillLevel: value })}
                                prefix={t('support.skill')}
                                suffix="렙"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {isMainDeckOpen && (
                <div className="support-modal-backdrop" onMouseDown={() => setIsMainDeckOpen(false)}>
                    <div className="support-modal support-main-modal" onMouseDown={(event) => event.stopPropagation()}>
                        <div className="support-modal-header">
                            <div>
                                <h3>메인덱</h3>
                                <p>이벤트 {formatSupportPercent(displayTotalBonus)} · 배지 {formatSupportPercent(displayBadgeBonus)}</p>
                            </div>
                            <div className="support-modal-actions">
                                <button type="button" className="support-modal-close" onClick={applyMainTheoryDeck}>
                                    {t('support.main_theory')}
                                </button>
                                <button type="button" className="support-modal-clear" onClick={clearMainDeck}>
                                    {t('support.reset_short')}
                                </button>
                                <button type="button" className="support-modal-close" onClick={() => setIsMainDeckOpen(false)}>
                                    {t('support.close')}
                                </button>
                            </div>
                        </div>

                        <div className="support-main-summary">
                            <span>{t('support.main_deck_total')}</span>
                            <strong>{formatSupportPercent(mainDeckBonus)}</strong>
                        </div>

                        <div className="support-modal-scroll custom-scrollbar">
                            <div className="support-main-deck-grid">
                                {mainDeckResults.map(({ slot, rarityOption, bonus }, index) => {
                                    const hasRarity = Boolean(slot.rarityKey);
                                    const canPickup = rarityOption.canPickup;

                                    return (
                                        <div className="support-main-slot" key={index}>
                                            <div className="support-main-slot-header">
                                                <span>{index + 1}번</span>
                                                <strong>{formatSupportPercent(bonus.total)}</strong>
                                            </div>

                                            <div className="support-main-preview-wrap">
                                                <MainDeckPreviewCard
                                                    rarityKey={slot.rarityKey}
                                                    masterRank={slot.masterRank}
                                                />
                                            </div>

                                            <div className="support-main-control-grid">
                                                <OptionDropdown
                                                    value={slot.rarityKey}
                                                    options={MAIN_DECK_RARITY_OPTIONS}
                                                    onChange={(value) => updateMainDeckSlot(index, { rarityKey: value })}
                                                    prefix={t('support.rarity')}
                                                />
                                                <NumberDropdown
                                                    value={slot.masterRank}
                                                    options={MASTER_RANK_OPTIONS}
                                                    onChange={(value) => updateMainDeckSlot(index, { masterRank: value })}
                                                    prefix={t('support.master_rank')}
                                                />
                                            </div>
                                            <div className="support-main-toggle-row">
                                                <button
                                                    type="button"
                                                    className={`support-main-toggle ${slot.typeMatched ? 'active' : ''}`}
                                                    onClick={() => updateMainDeckSlot(index, { typeMatched: !slot.typeMatched })}
                                                    disabled={!hasRarity}
                                                    aria-pressed={slot.typeMatched}
                                                >
                                                    {t('support.type')}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`support-main-toggle ${slot.featured ? 'active' : ''}`}
                                                    onClick={() => updateMainDeckSlot(index, { featured: !slot.featured })}
                                                    disabled={!hasRarity}
                                                    aria-pressed={slot.featured}
                                                >
                                                    {t('support.featured')}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`support-main-toggle ${slot.pickup ? 'active' : ''}`}
                                                    onClick={() => updateMainDeckSlot(index, { pickup: !slot.pickup })}
                                                    disabled={!canPickup}
                                                    aria-pressed={slot.pickup}
                                                >
                                                    {t('support.pickup')}
                                                </button>
                                            </div>

                                            <div className="support-main-breakdown" aria-label={`${index + 1}번 메인덱 보너스`}>
                                                <span>{t('support.member')} <b>{formatSupportPercent(bonus.member)}</b></span>
                                                <span>{t('support.featured')} <b>{formatSupportPercent(bonus.character)}</b></span>
                                                <span>{t('support.type')} <b>{formatSupportPercent(bonus.type)}</b></span>
                                                <span>{t('support.master_rank')} <b>{formatSupportPercent(bonus.masterRank)}</b></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSlotIndex !== null && (
                <div className="support-modal-backdrop" onMouseDown={() => setActiveSlotIndex(null)}>
                    <div className="support-modal" onMouseDown={(event) => event.stopPropagation()}>
                        <div className="support-modal-header">
                            <div>
                                <h3>{getCardCharacterName(selectedCharId, language)} {t('support.card_select')}</h3>
                                <p>{t('support.slot').replace('{{n}}', activeSlotIndex + 1)}</p>
                            </div>
                            <div className="support-modal-actions">
                                <button type="button" className="support-modal-clear" onClick={clearSlot}>
                                    {t('support.deselect')}
                                </button>
                                <button type="button" className="support-modal-close" onClick={() => setActiveSlotIndex(null)}>
                                    {t('support.close')}
                                </button>
                            </div>
                        </div>

                        <div className="support-picker-character-bar">
                            {unitMemberIds.map(id => {
                                const idText = String(id).padStart(2, '0');
                                const name = getCardCharacterName(id, language);
                                return (
                                    <button
                                        type="button"
                                        key={id}
                                        className={`support-picker-character-button ${Number(pickerCharId) === Number(id) ? 'selected' : ''}`}
                                        onClick={() => {
                                            setPickerCharId(Number(id));
                                            setSearchText('');
                                        }}
                                        title={name}
                                        aria-label={`${name} 카드 보기`}
                                    >
                                        <img
                                            src={`${process.env.PUBLIC_URL}/assets/characters/${idText}.webp`}
                                            alt={name}
                                            loading="lazy"
                                        />
                                    </button>
                                );
                            })}
                        </div>

                        <div className="support-modal-tools">
                            <input
                                type="search"
                                className="support-search"
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder={t('support.search_placeholder')}
                                autoFocus
                            />
                            <span className="support-count">
                                {cardsLoading ? t('support.loading') : cardsError || `${modalCards.length}장`}
                            </span>
                        </div>

                        <div className="support-modal-scroll custom-scrollbar">
                            {!cardsLoading && !cardsError && modalCards.length > 0 && (
                                <>
                                    {modalCardGroups.map(group => (
                                        <section className="support-picker-section" key={group.key}>
                                            <h4 className="support-picker-heading">
                                                {group.label}
                                                <span>{group.cards.length}장</span>
                                            </h4>
                                            <div className="support-card-picker-grid">
                                                {group.cards.map(card => (
                                                    <button
                                                        type="button"
                                                        key={card.id}
                                                        className="support-card-picker-button"
                                                        onClick={() => selectCard(card)}
                                                        title={getCardTitle(card)}
                                                    >
                                                        <SupportCardThumbnail
                                                            card={card}
                                                            selected={Number(activeSlot?.slot.cardId) === Number(card.id)}
                                                            picker
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </>
                            )}
                            {!cardsLoading && !cardsError && modalCards.length === 0 && (
                                <div className="support-empty-list">{t('support.no_cards')}</div>
                            )}
                            {cardsLoading && (
                                <div className="support-empty-list">{t('support.loading_cards')}</div>
                            )}
                            {cardsError && (
                                <div className="support-empty-list">{cardsError}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportDeckTab;
