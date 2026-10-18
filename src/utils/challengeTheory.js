import { characterMapping } from './characterMapping.js';

export const DEFAULT_CHALLENGE_BONUS = {
    characterAreaLevel: 20, unitAreaLevel_1: 20, unitAreaLevel_2: 20,
    attributeAreaLevel_1: 20, attributeAreaLevel_2: 20,
    masterSekaiGateLevel: 70, masterSekaiNuiPercent: null, titleBonus: 260,
};
export const challengeAreaBonus = c => c.characterAreaLevel * 2 + c.unitAreaLevel_1 + c.unitAreaLevel_2
    + c.attributeAreaLevel_1 + c.attributeAreaLevel_2 + c.masterSekaiGateLevel * .1 + c.masterSekaiNuiPercent + 5;
export const normalizeChallengeName = name => name === 'MEIKO' ? '메이코' : name === 'KAITO' ? '카이토' : name;
export function challengeSkillScore(effect, isBfOff = false, charRank = 60) {
    if (effect === '블페') return isBfOff ? Math.min(160, Math.floor(charRank / 2) + 110) : 160;
    return ({ '버싱한정': 150, '페스(라이프)': 140, '페스(판정)': 140, '퍼스업': 130, '스업': 120 })[effect] || 100;
}
// Keep the operation order used by the original calculator, including integer
// truncation and song/skill ties. The preparation step is independent of bonuses.
const ATTRIBUTES = ['cute', 'cool', 'pure', 'happy', 'mysterious'];
const roundSkill = score => Math.round(score * 10) / 10;
const metaCoefficients = meta => meta?.skill_score_solo
    ? { meta, coefficients: meta.skill_score_solo.slice(0, 5).sort((a, b) => a - b), leader: meta.skill_score_solo[5] } : null;
const skillRate = (skills, prepared) => {
    if (!prepared) return 0;
    let weighted = 0;
    for (let i = 0; i < skills.length; i++) weighted += skills[skills.length - 1 - i] * prepared.coefficients[i];
    weighted += skills[0] * prepared.leader;
    return prepared.meta.base_score + weighted / 100;
};
export const calculateSoloScore = (members, power, meta) => {
    if (!meta?.skill_score_solo || !members.length || power <= 0) return 0;
    const skills = members.map(c => c.score).sort((a, b) => a - b);
    const prepared = metaCoefficients(meta);
    let weighted = 0;
    for (let i = 0; i < Math.min(5, skills.length); i++) weighted += skills[i] * prepared.coefficients[i];
    weighted += members[0].score * prepared.leader;
    return Math.floor((meta.base_score + weighted / 100) * power * 4);
};

function prepareGroup(cards, attribute, getSkillScore, previous) {
    const potential = c => c.skill_effect === '버싱한정' ? 140 : getSkillScore(c.skill_effect);
    const candidates = [...cards].sort((a, b) => potential(b) - potential(a) || Number(b.power) - Number(a.power) || Number(b.id) - Number(a.id)).slice(0, 15);
    if (previous && candidates.length === previous.candidates.length && candidates.every((card, i) => card === previous.candidates[i])) return previous;
    const patterns = [], patternIds = new Map();
    const k = Math.min(5, candidates.length);
    let count = 1;
    for (let i = 1; i <= k; i++) count = count * (candidates.length - i + 1) / i;
    const powers = new Float64Array(count), patternIndex = new Uint16Array(count);
    const multiUnit = new Uint8Array(count), members = new Uint8Array(count * k);
    const units = candidates.map(c => c.support_unit || c.unit);
    const numericIds = candidates.map(c => parseInt(c.id));
    const rawPowers = candidates.map(c => Number(c.power) || 0);
    const fixedSkills = candidates.map(c => c.type === 'Birthday' || c.type === 'Anniversary' ? 80
        : c.skill_effect === '버싱한정' ? null : getSkillScore(c.skill_effect));
    const indices = Array.from({ length: k }, (_, i) => i), ordered = new Array(k), scores = new Array(k);
    let row = 0;
    do {
        // Only five small numeric indices are sorted, never five copied cards.
        for (let i = 0; i < k; i++) {
            const index = indices[i];
            let skill = fixedSkills[index];
            if (skill === null) {
                let sameUnit = 0;
                for (let j = 0; j < k; j++) if (units[indices[j]] === units[index]) sameUnit++;
                skill = 90 + sameUnit * 10;
            }
            scores[i] = skill;
            ordered[i] = i;
        }
        ordered.sort((a, b) => scores[b] - scores[a] || numericIds[indices[b]] - numericIds[indices[a]]);
        const skills = ordered.map(i => scores[i]);
        const key = skills.join(',');
        let pattern = patternIds.get(key);
        if (pattern === undefined) {
            pattern = patterns.length;
            patternIds.set(key, pattern);
            const total = skills[0] + skills.slice(1).reduce((sum, score) => sum + score, 0) * .2;
            patterns.push({ skills, total, roundedTotal: roundSkill(total) });
        }
        patternIndex[row] = pattern;
        let raw = 0, multi = false;
        for (let j = 0; j < k; j++) {
            const index = indices[ordered[j]];
            members[row * k + j] = index;
            raw = raw + rawPowers[index] + 1500;
            if (units[index] !== units[indices[0]]) multi = true;
        }
        powers[row] = raw;
        multiUnit[row] = Number(multi);
        row++;
        // Lexicographic order matches the former recursive combination traversal.
        let pos = k - 1;
        while (pos >= 0 && indices[pos] === candidates.length - k + pos) pos--;
        if (pos < 0) break;
        indices[pos]++;
        for (let j = pos + 1; j < k; j++) indices[j] = indices[j - 1] + 1;
    } while (true);
    return { attribute, candidates, patterns, k, count, powers, patternIndex, multiUnit, members };
}

// Reuse until cards or skill settings change; area/gate/nui/meta changes do not
// require building combinations again. Storage is compact numeric buffers.
// `previous` can reuse unaffected groups across releases of immutable card rows.
export function prepareChallengeDecks({ data, isBfOff = false, charRank = 60, characterNames = null, previous = null }) {
    const byName = new Map();
    for (const card of data) {
        if (Number(card.rarity) !== 4 && card.type !== 'Birthday' && card.type !== 'Anniversary') continue;
        const name = normalizeChallengeName(card.character);
        if (!byName.has(name)) byName.set(name, []);
        byName.get(name).push(card);
    }
    const seen = new Set(), prepared = [];
    const getSkillScore = effect => challengeSkillScore(effect, isBfOff, charRank);
    for (const name of characterNames || Object.keys(characterMapping)) {
        const config = characterMapping[name];
        if (!config || seen.has(config.id)) continue;
        seen.add(config.id);
        const cards = byName.get(normalizeChallengeName(name)) || [];
        if (!cards.length) continue;
        const prior = previous?.find(character => character.config.id === config.id && character.isBfOff === isBfOff && character.charRank === charRank);
        const groups = [], bfCards = {};
        for (const attribute of ATTRIBUTES) {
            const matching = cards.filter(c => c.attribute === attribute);
            if (!matching.length) continue;
            const bf = matching.find(c => c.skill_effect === '블페');
            if (bf) bfCards[attribute] = { ...bf, score: getSkillScore(bf.skill_effect) };
            groups.push(prepareGroup(matching, attribute, getSkillScore, prior?.groups.find(group => group.attribute === attribute)));
        }
        groups.push(prepareGroup(cards, 'mixed', getSkillScore, prior?.groups.find(group => group.attribute === 'mixed')));
        prepared.push({ name, config, groups, bfCards, isBfOff, charRank });
    }
    return prepared.sort((a, b) => parseInt(a.config.id) - parseInt(b.config.id));
}

export function evaluateChallengeDecks(prepared, { bonusConfig = DEFAULT_CHALLENGE_BONUS,
    areaItemBonus = challengeAreaBonus(bonusConfig), titleBonus = bonusConfig.titleBonus,
    nuiStats = null, commonAreaBonus = 0, commonMultiUnitBonus = commonAreaBonus, musicMeta = null, autoMetas = null,
    selectedSong = { musicId: 'auto' } } = {}) {
    const automatic = selectedSong.musicId === 'auto' && autoMetas;
    const metas = automatic ? [autoMetas.viva, autoMetas.gunjo, autoMetas.polar] : [musicMeta];
    const coefficients = metas.map(metaCoefficients);
    const attrTotal = (bonusConfig.attributeAreaLevel_1 || 0) + (bonusConfig.attributeAreaLevel_2 || 0);
    const title = parseInt(String(titleBonus)) || 0;
    return prepared.map(character => {
        const { name, config, groups, bfCards } = character;
        // null selects each character's released S/M/L sets; an explicit value
        // must remain manual even when release data has already loaded.
        const nui = bonusConfig.masterSekaiNuiPercent ?? nuiStats?.charSets?.[config.id] ?? 0;
        const area = (parseFloat(String(areaItemBonus)) || 0) - (bonusConfig.masterSekaiNuiPercent ?? 0) + nui;
        // The same skill multiset often occurs thousands of times. Compute its
        // music coefficients once, then only power and floor() per candidate.
        let bestMono = null, bestMixed = null;
        const attrBest = {};
        const result = (group, index, score, power, metaIndex) => ({ group, index, envyScore: score, deckPower: power,
            totalScore: group.patterns[group.patternIndex[index]].roundedTotal, metaUsed: metaIndex < 0 ? null : metas[metaIndex] });
        for (const group of groups) {
            const patterns = group.patterns;
            const rates = patterns.map(pattern => coefficients.map(meta => skillRate(pattern.skills, meta)));
            const base = group.attribute === 'mixed' ? area - attrTotal * .5 : area;
            // Keep the original arithmetic order: do not distribute multiplication.
            const factors = [0, 1].map(multi => 1 + ((base + (commonAreaBonus + (multi ? commonMultiUnitBonus : 0))) / 100));
            for (let index = 0; index < group.count; index++) {
                const pattern = group.patternIndex[index];
                let power = 0, score = 0, metaIndex = -1;
                if (group.k === 5) {
                    power = Math.floor(group.powers[index] * factors[group.multiUnit[index]] + title);
                    if (automatic) {
                        const v = power > 0 ? Math.floor(rates[pattern][0] * power * 4) : 0;
                        const g = power > 0 ? Math.floor(rates[pattern][1] * power * 4) : 0;
                        const p = power > 0 ? Math.floor(rates[pattern][2] * power * 4) : 0;
                        score = Math.max(v, g, p);
                        metaIndex = score === p ? 2 : score === v ? 0 : 1;
                    } else {
                        score = power > 0 ? Math.floor(rates[pattern][0] * power * 4) : 0;
                        metaIndex = 0;
                    }
                }
                let best = group.attribute === 'mixed' ? bestMixed : bestMono;
                // Preserve the old rounded-total tie comparison and first winner
                // for each attribute (used by the within-1% Bloom preference).
                if (!best || score > best.envyScore || (score === best.envyScore && patterns[pattern].total > best.totalScore)) {
                    best = result(group, index, score, power, metaIndex);
                    if (group.attribute === 'mixed') bestMixed = best;
                    else bestMono = best;
                }
                if (group.attribute !== 'mixed' && (!attrBest[group.attribute] || score > (attrBest[group.attribute].envyScore || -1))) {
                    attrBest[group.attribute] = result(group, index, score, power, metaIndex);
                }
            }
        }
        let winner = bestMono;
        if (!winner || (bestMixed && (bestMixed.envyScore > winner.envyScore
            || (bestMixed.envyScore === winner.envyScore && bestMixed.totalScore > winner.totalScore)))) winner = bestMixed;
        const materialize = selected => {
            const { group, index } = selected;
            const skills = group.patterns[group.patternIndex[index]].skills;
            return { totalScore: selected.totalScore, envyScore: selected.envyScore, deckPower: selected.deckPower,
                attribute: group.attribute, metaUsed: selected.metaUsed,
                members: skills.map((score, i) => ({ ...group.candidates[group.members[index * group.k + i]], score })) };
        };
        let altBfScore = 0, altBfCard = null, bestBf = null;
        for (const attribute of Object.keys(bfCards)) {
            const deck = attrBest[attribute];
            if (deck && (!bestBf || deck.envyScore > bestBf.envyScore)) bestBf = deck;
        }
        if (bestBf && winner.envyScore > bestBf.envyScore) {
            if ((winner.envyScore - bestBf.envyScore) / bestBf.envyScore <= .01) {
                altBfScore = winner.envyScore;
                altBfCard = materialize(winner).members[0];
                winner = bestBf;
            } else {
                altBfScore = bestBf.envyScore;
                altBfCard = bfCards[bestBf.group.attribute];
            }
        }
        return { name, unit: config.unit, altBfScore, altBfCard, ...materialize(winner) };
    });
}

// Same public entry point for callers that need a single calculation.
export function calculateChallengeDecks(options) {
    return evaluateChallengeDecks(prepareChallengeDecks(options), options);
}
