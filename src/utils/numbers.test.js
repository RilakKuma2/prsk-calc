import { numberOrDefault } from './numbers';

describe('numberOrDefault', () => {
  test('keeps an explicit zero', () => {
    expect(numberOrDefault('0', 250)).toBe(0);
    expect(numberOrDefault(0, 250)).toBe(0);
  });

  test('uses the fallback for blank or invalid values', () => {
    expect(numberOrDefault('', 250)).toBe(250);
    expect(numberOrDefault(null, 250)).toBe(250);
    expect(numberOrDefault('invalid', 250)).toBe(250);
  });
});
