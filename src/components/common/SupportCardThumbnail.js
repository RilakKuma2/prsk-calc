import React, { useState, useEffect } from 'react';
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
    const publicUrl = process.env.PUBLIC_URL || '';

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
    const starName = isBirthday ? 'rairity_birth.webp' : 'afterstar.webp';
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
            {isBirthday && <img className="support-card-birthday" src={`${publicUrl}/assets/card_style/${starName}`} alt="" />}
            {!isBirthday && rarity > 0 && (
                <div className="support-card-stars">
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
        </div>
    );
};

export default SupportCardThumbnail;
