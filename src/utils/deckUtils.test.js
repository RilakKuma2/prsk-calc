import { calculateRawInternalValue, calculateSkillSum, getDeckValue } from './deckUtils';

describe('deckUtils numeric defaults', () => {
  test('preserves explicit zero skill values', () => {
    const zeroDeck = {
      skillLeader: 0,
      skillMember2: 0,
      skillMember3: 0,
      skillMember4: 0,
      skillMember5: 0,
    };

    expect(calculateRawInternalValue(zeroDeck)).toBe(0);
    expect(calculateSkillSum(zeroDeck)).toBe(0);
    expect(getDeckValue({ eventBonus: 0 }, 'eventBonus', 250)).toBe(0);
  });

  test('uses defaults only for empty values', () => {
    expect(calculateRawInternalValue({})).toBe(200);
    expect(getDeckValue({ eventBonus: '' }, 'eventBonus', 250)).toBe(250);
  });
});
