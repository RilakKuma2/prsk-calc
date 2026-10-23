/* global globalThis */
import { DEFAULT_CHALLENGE_BONUS } from './challengeTheory.js';

// Bump when the shared deck/scoring algorithm changes. Live master corrections,
// different cards, bonuses or music coefficients automatically invalidate a row.
export const CHALLENGE_BASELINE_VERSION = 4;
export async function challengeBaselineKey({ data, characterNames, autoMetas, commonAreaBonus, commonMultiUnitBonus, nuiStats }) {
    if (!globalThis.crypto?.subtle) return null;
    const value = JSON.stringify({
        version: CHALLENGE_BASELINE_VERSION, config: DEFAULT_CHALLENGE_BONUS,
        characterNames, commonAreaBonus, commonMultiUnitBonus, nuiStats: nuiStats.charSets,
        cards: data.map(c => [Number(c.id), c.character, c.unit, c.support_unit || null, c.type, c.attribute,
            Number(c.rarity), Number(c.power), c.skill_effect]).sort((a, b) => a[0] - b[0]),
        metas: ['viva', 'gunjo', 'polar'].map(key => {
            const m = autoMetas[key];
            return m ? [m.music_id, m.difficulty, m.base_score, m.skill_score_solo] : null;
        }),
    });
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
}

export async function readChallengeBaseline(baseline, date, characterId, inputs) {
    if (baseline?.version !== CHALLENGE_BASELINE_VERSION || baseline.date !== date) return null;
    const row = baseline.characters?.[characterId];
    if (!row || !row.inputKey || row.inputKey !== await challengeBaselineKey(inputs)) return null;
    return { envyScore: row.score, deckPower: row.power, members: row.cardIds.map(id => ({ id })) };
}
