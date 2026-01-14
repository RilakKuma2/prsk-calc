/**
 * Deck calculation utility functions
 * Shared between DeckTab, PowerTab, and other components
 */

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
