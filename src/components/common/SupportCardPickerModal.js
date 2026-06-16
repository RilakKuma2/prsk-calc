import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { getCardCharacterName, getCardTitle, getCardCharacterId } from '../../utils/supportCardUtils';
import SupportCardThumbnail from './SupportCardThumbnail';

const PICKER_GROUPS = [
    { key: 'rarity4', label: '4성', matches: (card) => Number(card?.rarity) === 4 && card?.type !== 'Birthday' && card?.type !== 'Anniversary' },
    { key: 'birthday', label: '생일', matches: (card) => card?.type === 'Birthday' || card?.type === 'Anniversary' },
    { key: 'rarity3', label: '3성', matches: (card) => Number(card?.rarity) === 3 && card?.type !== 'Birthday' && card?.type !== 'Anniversary' },
    { key: 'low', label: '2성이하', matches: (card) => Number(card?.rarity) <= 2 && card?.type !== 'Birthday' && card?.type !== 'Anniversary' },
];

const SupportCardPickerModal = ({
    isOpen,
    isMain,
    activeIndex,
    onClose,
    onClear,
    onSelectCard,
    selectedCharId,
    pickerCharId,
    setPickerCharId,
    cards,
    cardsLoading,
    cardsError,
    unitMemberIds,
    activeSlotCardId,
    eventOverride,
    isManualEvent,
    showSkillBadge = false,
}) => {
    const { t, language } = useTranslation();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsScrolled(false);
        }
    }, [isOpen]);

    const handleScroll = (eSc) => {
        const scrollTop = eSc.currentTarget.scrollTop;
        setIsScrolled(scrollTop > 10);
    };

    const charIdsToShow = isMain ? Array.from({ length: 26 }, (_, i) => i + 1) : unitMemberIds;
    const shouldWrap = isMain && !isScrolled;

    // Prioritize attribute-matching cards when not in manual mode and event attr is set (non-WL)
    const priorityAttr = (!isManualEvent && eventOverride?.attr && eventOverride.attr !== 'wl')
        ? eventOverride.attr.toLowerCase()
        : null;

    const modalCards = useMemo(() => {
        if (!cards || !cards.length) return [];
        return cards
            .filter(card => getCardCharacterId(card) === Number(pickerCharId))
            .sort((a, b) => {
                const dateA = a.available_from ? new Date(a.available_from).getTime() : 0;
                const dateB = b.available_from ? new Date(b.available_from).getTime() : 0;
                if (dateA !== dateB) return dateB - dateA;
                return Number(b.id) - Number(a.id);
            });
    }, [cards, pickerCharId]);

    const modalCardGroups = useMemo(() => {
        if (!modalCards.length) return [];
        return PICKER_GROUPS.map(group => {
            let groupCards = modalCards.filter(group.matches);
            // Sort: attribute-matching cards first
            if (priorityAttr) {
                groupCards = [
                    ...groupCards.filter(c => (c.attr || c.attribute || '').toLowerCase() === priorityAttr),
                    ...groupCards.filter(c => (c.attr || c.attribute || '').toLowerCase() !== priorityAttr),
                ];
            }
            return { ...group, cards: groupCards };
        }).filter(group => group.cards.length > 0);
    }, [modalCards, priorityAttr]);

    if (!isOpen) return null;

    return (
        <div className="support-modal-backdrop ebc-backdrop" onMouseDown={onClose} style={{ zIndex: 10000 }}>
            <div className="support-modal ebc-modal" onMouseDown={(event) => event.stopPropagation()} style={{ maxWidth: '1040px', padding: 0 }}>
                <div className="support-modal-header" style={{ padding: '14px', borderBottom: '1px solid #e2e8f0', background: '#f8fbff', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f172a' }}>
                            {isMain ? t('support.card_select', '카드 선택') : `${getCardCharacterName(selectedCharId, language)} ${t('support.card_select', '카드 선택')}`}
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                            {isMain ? t('support.slot_label', { n: activeIndex + 1 }) : t('support.slot', { n: activeIndex + 1 })}
                        </p>
                    </div>
                    <div className="support-modal-actions" style={{ display: 'flex', gap: '6px' }}>
                        {!isMain && (
                            <button type="button" className="support-modal-clear" onClick={onClear}>
                                {t('support.deselect', '선택 해제')}
                            </button>
                        )}
                        <button type="button" className="support-modal-close" onClick={onClose}>
                            {t('support.close', '닫기')}
                        </button>
                    </div>
                </div>

                <div className={`support-picker-character-bar ${shouldWrap ? 'wrapped' : 'collapsed'}`}>
                    {charIdsToShow.map(id => {
                        const idText = String(id).padStart(2, '0');
                        const name = getCardCharacterName(id, language);
                        return (
                            <button
                                type="button"
                                key={id}
                                className={`support-picker-character-button ${Number(pickerCharId) === Number(id) ? 'selected' : ''}`}
                                onClick={() => setPickerCharId(Number(id))}
                                title={name}
                            >
                                <img src={`${process.env.PUBLIC_URL}/assets/characters/${idText}.webp`} alt={name} loading="lazy" />
                            </button>
                        );
                    })}
                </div>

                <div className="support-modal-tools" style={{ padding: '8px 14px', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid #e8eef6' }}>
                    <span className="support-count" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                        {cardsLoading ? t('support.loading', '불러오는 중') : cardsError || t('support.count_cards', { count: modalCards.length })}
                    </span>
                </div>

                <div className="support-modal-scroll custom-scrollbar" onScroll={handleScroll} style={{ padding: '10px', overflowY: 'auto', flex: 1, minHeight: '300px' }}>
                    {!cardsLoading && !cardsError && modalCards.length > 0 && (
                        <>
                            {modalCardGroups.map(group => (
                                <section className="support-picker-section" key={group.key} style={{ marginBottom: '24px' }}>
                                    <h4 className="support-picker-heading" style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                        {t(`support.filter_${group.key}`, group.label)}
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>{t('support.count_cards', { count: group.cards.length })}</span>
                                    </h4>
                                    <div className="support-card-picker-grid">
                                        {group.cards.map(card => (
                                            <button
                                                type="button"
                                                key={card.id}
                                                className="support-card-picker-button"
                                                onClick={() => onSelectCard(card)}
                                                title={getCardTitle(card)}
                                                style={{ padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'transform 0.1s' }}
                                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                <SupportCardThumbnail 
                                                    card={card} 
                                                    selected={Number(activeSlotCardId) === Number(card.id)} 
                                                    picker 
                                                    showSkillBadge={showSkillBadge}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </>
                    )}
                    {cardsLoading && (
                        <div className="support-empty-list" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>{t('support.loading_cards', '카드 목록 불러오는 중...')}</div>
                    )}
                    {cardsError && (
                        <div className="support-empty-list" style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{cardsError}</div>
                    )}
                    {!cardsLoading && !cardsError && modalCards.length === 0 && (
                        <div className="support-empty-list" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>{t('support.no_cards', '조건에 맞는 카드가 없습니다.')}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupportCardPickerModal;
