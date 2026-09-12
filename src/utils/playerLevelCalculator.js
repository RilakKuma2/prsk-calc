import playerLevels from '../data/player_levels.json';

export const MAX_PLAYER_LEVEL = 800;
// Game master boosts.json: EXP and event-point rates diverge above five energy.
export const PLAYER_EXP_MULTIPLIERS = [1, 5, 10, 15, 20, 25, 26, 27, 28, 29, 30];
export const PLAYER_RANK_EXP = { S: 320, A: 280, B: 240, C: 200 };

export function getPlayerLevelExp(level) {
    const row = playerLevels.find(({ range }) => {
        const [start, end = start] = range.split('~').map(Number);
        return level >= start && level <= end;
    });
    return row?.exp ?? null;
}

export function calculatePlayerLevel({ current, target, remaining = '', rank = 'S', energy = 5 }) {
    if ([current, target, energy].some(value => value === '' || value == null)) return null;
    const from = Number(current);
    const to = Number(target);
    const fire = Number(energy);
    const fullExp = getPlayerLevelExp(from);
    const left = remaining === '' ? (fullExp ?? 0) : Number(remaining);
    if (![from, to, fire, left].every(Number.isInteger)
        || from < 1 || to < from || to > MAX_PLAYER_LEVEL
        || fire < 0 || fire > 10 || !PLAYER_RANK_EXP[rank]
        || left < 0 || left > (fullExp ?? 0)) return null;
    let required = to === from ? 0 : left;
    for (let level = from + 1; level < to; level += 1) {
        const exp = getPlayerLevelExp(level);
        if (exp == null) return null;
        required += exp;
    }
    const perLive = PLAYER_RANK_EXP[rank] * PLAYER_EXP_MULTIPLIERS[fire];
    const runs = Math.ceil(required / perLive);
    return { required, perLive, runs, spent: runs * fire };
}
