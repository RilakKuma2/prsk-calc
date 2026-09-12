import { calculatePlayerLevel, getPlayerLevelExp } from './playerLevelCalculator';

test('uses remaining EXP for the first level and full EXP for subsequent levels', () => {
    expect(calculatePlayerLevel({ current: 2, target: 4, remaining: 100, energy: 1 })).toEqual({ required: 8600, perLive: 1600, runs: 6, spent: 6 });
});
test('supports ranged levels through the maximum level', () => {
    expect(getPlayerLevelExp(799)).toBe(586295);
    expect(calculatePlayerLevel({ current: 799, target: 800 }).required).toBe(586295);
    expect(calculatePlayerLevel({ current: 800, target: 800 }).required).toBe(0);
    expect(calculatePlayerLevel({ current: 799, target: 801 })).toBeNull();
});
test('uses EXP multipliers for ten energy and permits zero-energy lives', () => {
    expect(calculatePlayerLevel({ current: 2, target: 3, energy: 10 }).perLive).toBe(9600);
    expect(calculatePlayerLevel({ current: 2, target: 3, energy: 0 })).toEqual({ required: 8010, perLive: 320, runs: 26, spent: 0 });
});
test('rejects invalid or out-of-range inputs without displaying misleading results', () => {
    for (const override of [{ current: '' }, { current: 2.5 }, { target: 1 }, { remaining: -1 }, { remaining: 8011 }, { energy: 11 }]) {
        expect(calculatePlayerLevel({ current: 2, target: 3, ...override })).toBeNull();
    }
});
