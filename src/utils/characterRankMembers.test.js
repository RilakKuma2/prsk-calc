import { strict as assert } from 'assert';
import { calculateCharacterRankTheory } from './characterRankTheory';

const now = Date.parse('2026-10-20T00:00:00+09:00');
const card = (id, characterId, rarity = 4, type = 'Normal') => ({ id, characterId, rarity, type, releaseAt: now });
const master = (card, initialSpecialTrainingStatus = 'not_doing', specialTrainingCosts = [{ seq: 1 }]) => ({
    id: card.id, cardRarityType: `rarity_${card.rarity}`, initialSpecialTrainingStatus, specialTrainingCosts,
});
function calculate(cards, rawCards, characterIds = [...new Set(cards.map(c => c.characterId))]) {
    return calculateCharacterRankTheory({
        cards, rawCards, characterIds, rankDate: now,
        characterMissionsJP: characterIds.map(characterId => ({ characterId,
            characterMissionType: 'collect_member', parameterGroupId: 1 })),
        parameterGroups: Array.from({ length: 30 }, (_, i) => ({ id: 1, seq: i + 1, requirement: i + 1, exp: 1 })),
        levelsData: [{ levelType: 'character', level: 1, totalExp: 0 }, { levelType: 'character', level: 200, totalExp: 2000 }],
        challengeState: { result: Object.fromEntries(characterIds.map(id => [id, { rank: 1, maxRank: 200, exp: 0 }])) },
        texts: { MISSION: {}, UI: {} },
    });
}
function checkMembers(result, id, count) {
    for (const mode of ['included', 'excluded']) {
        const stat = result[mode][id].stats.find(row => row.type === 'collect_member');
        assert.equal(stat.count, count, `${mode}: character ${id} member count`);
        assert.equal(stat.exp, count, `${mode}: corrected count must feed mission EXP`);
    }
}

test('Touhou and every pre-trained Vocaloid collaboration card each count once', () => {
    const cards = [[1167, 21], [1458, 1], [1459, 8], [1460, 10], [1461, 13], [1462, 17], [1463, 25]]
        .map(([id, characterId]) => card(id, characterId, 4, 'Collaboration Limited'));
    // API cards omit training metadata; the suite master supplies it separately.
    const result = calculate(cards, cards.map(c => master(c, 'done', [])));
    for (const c of cards) checkMembers(result, c.characterId, 1);
});

test('ordinary 3/4-star cards count twice; low rarities and birthdays count once', () => {
    const cards = [card(1096, 21), card(2, 21, 3), card(3, 21, 2), card(4, 21, 1),
        card(5, 21, 4, 'Birthday'), card(6, 21, 4, 'Anniversary')];
    const result = calculate(cards, cards.map(c => master(c)));
    checkMembers(result, 21, 8); // No unconditional Miku subtraction.
});

test('new single-art cards and VS variants use master data without an ID exception list', () => {
    const cards = [card(9001, 27), card(9002, 27), card(9003, 21), card(9004, 1)];
    const rawCards = [master(cards[0], 'done', []), master(cards[1]), master(cards[2], 'not_doing', []), master(cards[3])];
    const result = calculate(cards, rawCards, [21, 1]);
    checkMembers(result, 21, 4);
    checkMembers(result, 1, 2);
    // Unreleased/master-only records never enter the owned-member total.
    const extraMaster = master(card(9005, 21));
    assert.deepEqual(calculate(cards, [...rawCards, extraMaster], [21, 1]), result);
});
