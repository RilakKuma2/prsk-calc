import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { getCardCharacterId } from '../../utils/supportCardUtils';

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

const getSkillBadgeInfo = (effect) => {
    if (!effect) return null;
    if (effect.includes('페스')) return { type: 'color_fes', bg: '#ff3388' };
    if (effect.includes('블페') || effect.includes('월링')) return { type: 'bloom_fes', bg: '#8b5cf6' };
    if (effect.includes('퍼스업')) return { type: 'perfect', bg: '#06b6d4' };
    if (effect.includes('스업') || effect === '스코어') return { type: 'score', bg: '#3b82f6' };
    if (effect.includes('힐') || effect.includes('회복') || effect.includes('라이프')) return { type: 'heal', bg: '#22c55e' };
    if (effect.includes('판강') || effect.includes('판정')) return { type: 'judgment', bg: '#f59e0b' };
    if (effect.includes('버싱한정') || effect.includes('결정')) return { type: 'decision', bg: '#6366f1' };
    return { label: effect, bg: '#64748b' };
};

const SupportCardThumbnail = ({
    card,
    selected = false,
    compact = false,
    picker = false,
    showLevels = false,
    showSkillBadge = false,
    masterRank = 0,
    skillLevel = 1,
}) => {
    const { t } = useTranslation();
    const [imageSrc, setImageSrc] = useState(() => getCardImageUrl(card));
    const publicUrl = process.env.PUBLIC_URL || '';
    const skillBadgeLabels = {
        color_fes: t('support.skill_badge_color_fes'),
        bloom_fes: t('support.skill_badge_bloom_fes'),
        perfect: t('support.skill_badge_perfect'),
        score: t('support.skill_badge_score'),
        heal: t('support.skill_badge_heal'),
        judgment: t('support.skill_badge_judgment'),
        decision: t('support.skill_badge_decision'),
    };

    useEffect(() => {
        setImageSrc(getCardImageUrl(card));
    }, [card]);

    if (!card) {
        return (
            <div className={`support-card-thumb empty ${compact ? 'compact' : ''} ${picker ? 'picker' : ''}`}>
                <div className="support-card-placeholder">
                    {compact ? '+' : '비어있음'}
                </div>
            </div>
        );
    }

    const rarity = Number(card.rarity);
    const isBirthday = card.type === 'Birthday' || card.type === 'Anniversary';
    const isLowRarity = rarity > 0 && rarity <= 2;
    const frameName = isBirthday ? 'cardFrame_bd.webp' : isLowRarity ? 'frame_2star.webp' : 'Frame.webp';
    const starName = isBirthday ? 'rairity_birth.webp' : isLowRarity ? 'star_normal.webp' : 'afterstar.webp';
    const attrName = (card.attr || card.attribute || '').toLowerCase() || 'pure';

    const normalizedMasterRank = Math.max(0, Math.min(5, Number(masterRank) || 0));
    const normalizedSkillLevel = Math.max(1, Math.min(4, Number(skillLevel) || 1));

    return (
        <div className={`support-card-thumb ${selected ? 'selected' : ''} ${compact ? 'compact' : ''} ${picker ? 'picker' : ''} ${showLevels ? 'with-levels' : ''}`}>
            <img
                className="support-card-face"
                src={imageSrc}
                alt={card.cardTitle || card.character}
                loading="lazy"
                onError={() => {
                    if (imageSrc.includes('after_training')) {
                        setImageSrc(getCardImageUrl(card, 'normal'));
                    }
                }}
            />
            <img className="support-card-frame" src={`${publicUrl}/assets/card_style/${frameName}`} alt="" />
            <img className="support-card-attribute" src={`${publicUrl}/assets/card_style/${attrName}.webp`} alt="" />
            {isBirthday && <img className={`support-card-birthday${showLevels ? ' thumbnail-with-levels' : ''}`} src={`${publicUrl}/assets/card_style/${starName}`} alt="" />}
            {!isBirthday && rarity > 0 && (
                <div className={`support-card-stars${showLevels ? ' thumbnail-with-levels' : ''}`}>
                    {Array.from({ length: rarity }).map((_, i) => (
                        <img key={i} src={`${publicUrl}/assets/card_style/${starName}`} alt="" />
                    ))}
                </div>
            )}
            {showLevels && (
                <>
                    {normalizedMasterRank > 0 && (
                        <div className="support-card-master-rank">
                            <img src={`${publicUrl}/assets/card_style/master_rank_${normalizedMasterRank}.webp`} alt={`MR${normalizedMasterRank}`} />
                        </div>
                    )}
                    <div className="support-card-skill-level">Lv.{normalizedSkillLevel}</div>
                </>
            )}
            {picker && showSkillBadge && card?.skill_effect && (() => {
                const badge = getSkillBadgeInfo(card.skill_effect);
                if (!badge) return null;
                const label = badge.type ? skillBadgeLabels[badge.type] : badge.label;
                return (
                    <div style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        backgroundColor: badge.bg,
                        color: 'white',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '900',
                        textShadow: '-0.5px -0.5px 0 #000, 0.5px -0.5px 0 #000, -0.5px 0.5px 0 #000, 0.5px 0.5px 0 #000',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        zIndex: 10,
                        lineHeight: '1.2'
                    }}>
                        {label}
                    </div>
                );
            })()}
        </div>
    );
};

export default SupportCardThumbnail;
