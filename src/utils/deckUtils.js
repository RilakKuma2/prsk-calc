/**
 * Deck calculation utility functions
 * Shared between DeckTab, PowerTab, and other components
 */
import { getCardCharacterId } from './supportCardUtils';

/**
 * Calculate raw internal value (effective skill value before flooring)
 * Formula: Leader + (M2 + M3 + M4 + M5) * 0.2
 * @param {Object} deck - Deck object with skill properties
 * @returns {number} Raw internal value
 */
export const calculateRawInternalValue = (deck) => {
    const leader = Number(deck?.skillLeader || 120);
    const m2 = Number(deck?.skillMember2 || 100);
    const m3 = Number(deck?.skillMember3 || 100);
    const m4 = Number(deck?.skillMember4 || 100);
    const m5 = Number(deck?.skillMember5 || 100);
    return leader + (m2 + m3 + m4 + m5) * 0.2;
};

/**
 * Calculate internal value floored to nearest 10
 * @param {Object} deck - Deck object with skill properties
 * @returns {number} Internal value floored to 10
 */
export const calculateInternalValue = (deck) => {
    return Math.floor(calculateRawInternalValue(deck) / 10) * 10;
};

/**
 * Get deck value with empty string check
 * @param {Object} deck - Deck object
 * @param {string} key - Property key
 * @param {*} fallback - Fallback value if empty
 * @returns {*} Value or fallback
 */
export const getDeckValue = (deck, key, fallback) => {
    const val = deck?.[key];
    if (val === undefined || val === null || val === '') {
        return fallback;
    }
    return val;
};

/**
 * Calculate the sum of all skills in a deck
 * @param {Object} deck - Deck object with skill properties
 * @returns {number} Sum of all skills
 */
export const calculateSkillSum = (deck) => {
    const leader = Number(deck?.skillLeader || 120);
    const m2 = Number(deck?.skillMember2 || 100);
    const m3 = Number(deck?.skillMember3 || 100);
    const m4 = Number(deck?.skillMember4 || 100);
    const m5 = Number(deck?.skillMember5 || 100);
    return leader + m2 + m3 + m4 + m5;
};

/**
 * Calculate skill level values based on card's skill_effect string
 * @param {Object} card - Card object
 * @param {boolean} isTraining - Is card awakened/trained
 * @param {number} charRank - Character rank (default 0)
 * @returns {number[]} Array of skill values at [Lv0(dummy), Lv1, Lv2, Lv3, Lv4]
 */
export const computeLevelsFromSkillEffect = (card, isTraining, charRank = 0, unitBonus = 0) => {
    const effect = card?.skill_effect;
    if (!effect) return [0, 100, 105, 110, 120];

    const rarityNum = Number(card.cardRarityType?.replace('rarity_', '') || card.rarity || 4);
    const isBirthday = card.type === 'Birthday' || card.type === 'Anniversary' ||
        card.rarity === 'birthday' || card.cardRarityType === 'rarity_birthday';

    let scoreDiff = 0;
    if (isBirthday) scoreDiff = 20;
    else if (rarityNum === 3) scoreDiff = 40;
    else if (rarityNum === 2) scoreDiff = 70;
    else if (rarityNum <= 1) scoreDiff = 80;

    const calc = (arr) => {
        const r = [0];
        arr.forEach(v => r.push(Math.max(0, parseInt(v) - scoreDiff)));
        return r;
    };

    if (effect === '퍼스업') return calc(['110', '115', '120', '130']);
    if (effect === '스업') return calc(['100', '105', '110', '120']);
    if (effect === '힐' || effect === '힐카') return calc(['80', '85', '90', '100']);
    if (effect === '판강') return calc(['80', '85', '90', '100']);
    if (effect === '페스(판정)' || effect === '페스') return calc(['120', '125', '130', '140']);
    if (effect === '페스(라이프)') return calc(['120', '125', '130', '140']);
    
    if (effect === '버싱한정') {
        const base = calc(['80', '85', '90', '100']);
        return [0, base[1] + unitBonus, base[2] + unitBonus, base[3] + unitBonus, base[4] + unitBonus];
    }

    if (effect === '블페') {
        if (isTraining) {
            const bonus = Math.floor(charRank / 2);
            return [
                0,
                Math.min(90 + bonus - scoreDiff, 140 - scoreDiff),
                Math.min(95 + bonus - scoreDiff, 145 - scoreDiff),
                Math.min(100 + bonus - scoreDiff, 150 - scoreDiff),
                Math.min(110 + bonus - scoreDiff, 160 - scoreDiff),
            ];
        }
        
        // Before awakening: Check VS via characterId (VS are 21-26)
        const cId = card.characterId;
        if (cId >= 21) {
            return calc(['70', '75', '80', '90']);
        }
        return calc(['60', '65', '70', '80']);
    }

    return calc(['100', '105', '110', '120']);
};

export const charIdToUnit = (cid) => {
    if (cid >= 1  && cid <= 4)  return "light_sound";
    if (cid >= 5  && cid <= 8)  return "idol";
    if (cid >= 9  && cid <= 12) return "street";
    if (cid >= 13 && cid <= 16) return "theme_park";
    if (cid >= 17 && cid <= 20) return "school_refusal";
    return null;
};

export const resolveSupportUnit = (card) => {
    if (!card) return null;
    const UNIT_NAME_TO_KEY = {
        "Leo/need": "light_sound",
        "MORE MORE JUMP！": "idol",
        "Vivid BAD SQUAD": "street",
        "ワンダーランズ×ショウタイム": "theme_park",
        "25時、ナイトコードで。": "school_refusal",
    };
    let su = card?.supportUnit ?? card?.support_unit ?? null;
    if (su && UNIT_NAME_TO_KEY[su]) su = UNIT_NAME_TO_KEY[su];
    
    const cid = getCardCharacterId(card) || card.characterId;
    if (cid >= 21 && su == null) {
        su = (card.unit && UNIT_NAME_TO_KEY[card.unit]) || "none";
    }
    
    if (cid >= 21) return su;
    return charIdToUnit(cid) || (card.unit && UNIT_NAME_TO_KEY[card.unit]) || null;
};

export const calculateSlotSkillValues = (slots) => {
    const supportUnits = slots.map(slot => resolveSupportUnit(slot.card));
    
    return slots.map((slot, i) => {
        const card = slot.card || {};
        let unitBonus = 0;
        
        if (card.skill_effect === '버싱한정') {
            const ownUnit = supportUnits[i];
            const otherUnits = supportUnits.filter((_, idx) => idx !== i);
            const sameUnitCount = otherUnits.filter(u => u != null && u === ownUnit).length;
            const allSame = sameUnitCount === 4;
            unitBonus = sameUnitCount * 10 + (allSame ? 10 : 0);
        }
        
        const ranges = computeLevelsFromSkillEffect(card, slot.isAwakened !== false, 0, unitBonus);
        return { ranges, skillValue: ranges[slot.skillLevel || 1] || ranges[1] };
    });
};
