import missions from '../data/characterMissionV2s.json';
import groups from '../data/characterMissionV2ParameterGroups.json';
import levels from '../data/levels.json';
import { CHALL_MAX_STAGE } from '../data/challData';
import { fetchJsonWithTimeout } from './dataLoader';
import { API_BASE_URL, ASSET_BASE_URL, joinUrl } from '../config/env';

const stages = Array.from({ length: 26 }, (_, i) => Array.from({ length: CHALL_MAX_STAGE }, (_, j) => ({
    characterId: i + 1, rank: j + 1, completeStageCharacterExp: 1,
}))).flat();

export const rankAssetUrl = path => joinUrl(ASSET_BASE_URL || 'https://asset.rilaksekai.com', path);
export const rankApiUrl = path => joinUrl(API_BASE_URL || 'https://api.rilaksekai.com', `api/${path}`);
export const RANK_REFRESH_MS = 5 * 60_000;
export const bundledRankMaster = { missions, groups, levels, stages };
let masterCache;
export function loadRankMaster() {
    if (masterCache && Date.now() - masterCache.at < RANK_REFRESH_MS) return masterCache.promise;
    const entry = { at: Date.now() };
    entry.promise = Promise.all(['characterMissionV2s', 'characterMissionV2ParameterGroups', 'levels', 'challengeLiveStages']
        .map(name => fetchJsonWithTimeout(rankAssetUrl(`suite/${name}.json`))))
        .then(([missions, groups, levels, stages]) => ({ missions, groups, levels, stages }))
        .catch(error => { if (masterCache === entry) masterCache = null; throw error; });
    masterCache = entry;
    return entry.promise;
}

export function createRankMissionIndex(master) {
    const parameters = new Map();
    master.groups.forEach(row => {
        if (!parameters.has(row.id)) parameters.set(row.id, []);
        parameters.get(row.id).push(row);
    });
    parameters.forEach(rows => rows.sort((a, b) => a.seq - b.seq));
    return new Map(master.missions.map(m => [`${m.characterId}:${m.characterMissionType}`, parameters.get(m.parameterGroupId) || []]));
}

// Sparse EX rows repeat through the next sequence. The final zero-EXP reward
// keeps repeating, without requiring a loop for every entered live/room count.
export function rankMissionStatus(rows = [], value = 0, isEx = false) {
    const count = Math.max(0, Number(value) || 0);
    let exp = 0, expCap = null;
    if (!isEx) {
        rows.forEach(row => {
            if (row.exp > 0) expCap = Math.max(expCap || 0, row.requirement);
            if (row.requirement <= count) exp += row.exp || 0;
        });
        return { exp, expCap, capped: expCap !== null && count >= expCap };
    }
    let spent = 0, capSpent = 0, currentSeq = rows[0]?.seq || 1, currentProgress = count, required = 0;
    rows.forEach((row, index) => {
        const length = rows[index + 1] ? rows[index + 1].seq - row.seq : Infinity;
        if (row.exp > 0) expCap = Number.isFinite(length) ? capSpent + length * row.requirement : Infinity;
        capSpent += (Number.isFinite(length) ? length : 1) * row.requirement;
        if (required || row.requirement <= 0) return;
        const cleared = Math.min(length, Math.floor((count - spent) / row.requirement));
        exp += cleared * (row.exp || 0);
        spent += cleared * row.requirement;
        currentSeq = row.seq + cleared;
        if (cleared < length) {
            required = row.requirement;
            currentProgress = count - spent;
        }
    });
    return { exp, expCap, capped: expCap !== null && count >= expCap, currentSeq, currentProgress, required };
}

export const challengeRankExp = (stages, characterId, rank) => stages
    .filter(stage => stage.characterId === characterId && stage.rank < Math.max(0, Number(rank) || 0))
    .reduce((total, stage) => total + stage.completeStageCharacterExp, 0);
