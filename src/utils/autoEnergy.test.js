import {
    AUTO_ENERGY_OPTIONS,
    calculateMySekaiEnergyScore,
    getAutoEventPointMultiplier,
    getEventPointMultiplier,
    normalizeAutoEnergy,
} from './autoEnergy';

describe('auto energy calculation', () => {
    test('offers only valid energy values from 1 through 10', () => {
        expect(AUTO_ENERGY_OPTIONS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(AUTO_ENERGY_OPTIONS).not.toContain(0);
    });

    test('falls back to 1 energy for zero or invalid saved values', () => {
        expect(normalizeAutoEnergy(0)).toBe(1);
        expect(normalizeAutoEnergy('invalid')).toBe(1);
        expect(normalizeAutoEnergy(11)).toBe(1);
    });

    test('uses the game event-point multiplier for regular auto lives', () => {
        expect(getEventPointMultiplier(0)).toBe(1);
        expect(getAutoEventPointMultiplier(1)).toBe(5);
        expect(getAutoEventPointMultiplier(3)).toBe(15);
        expect(getAutoEventPointMultiplier(4)).toBe(20);
        expect(getAutoEventPointMultiplier(5)).toBe(25);
        expect(getAutoEventPointMultiplier(6)).toBe(27);
        expect(getAutoEventPointMultiplier(10)).toBe(35);
        expect(getAutoEventPointMultiplier(5)).toBe(getEventPointMultiplier(5));
    });

    test('multiplies MySekai score directly by the selected energy', () => {
        expect(calculateMySekaiEnergyScore(2500, 1)).toBe(2500);
        expect(calculateMySekaiEnergyScore(2500, 3)).toBe(7500);
        expect(calculateMySekaiEnergyScore(2500, 10)).toBe(25000);
    });
});
