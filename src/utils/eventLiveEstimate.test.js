import { calculateEventLiveEstimate, updateEventLiveDeck } from './eventLiveEstimate';
import { calculateScoreRange } from './calculator';
import { getMusicMetaSync } from './dataLoader';

jest.mock('./calculator', () => ({ calculateScoreRange: jest.fn() }));
jest.mock('./dataLoader', () => ({ getMusicMetaSync: jest.fn() }));
beforeEach(() => {
  getMusicMetaSync.mockReturnValue({ event_rate: 100 });
  calculateScoreRange.mockReturnValue({ min: 1000000, max: 1200000 });
});
const data = { power: '30', effi: '250', internalValue: '200', eventLiveSong: 'lost' };
test('changing bonus recalculates points without changing the deck or importing again', () => {
  const five = calculateEventLiveEstimate(data, '25');
  const ten = calculateEventLiveEstimate(data, '35');
  expect(five).toBeGreaterThan(0);
  expect(ten).toBe(five / 25 * 35);
  expect(calculateScoreRange.mock.calls[0][0]).toMatchObject({ songId: 226, totalPower: 300000, skillLeader: 200 });
});
test('song and room skill changes use the shared score calculator', () => {
  calculateEventLiveEstimate({ ...data, eventLiveSong: 'envy', internalValue: '180' }, '15');
  expect(calculateScoreRange.mock.calls[0][0]).toMatchObject({ songId: 74, difficulty: 'expert', skillLeader: 180, skillMember5: 180 });
});
test('zero input remains zero rather than being replaced with default deck values', () => {
  calculateEventLiveEstimate({ ...data, power: '0', internalValue: '0' }, '1');
  expect(calculateScoreRange.mock.calls[0][0]).toMatchObject({ totalPower: 0, skillLeader: 0 });
});
test('missing song metadata is explicit instead of keeping a stale per-round score', () => {
  getMusicMetaSync.mockReturnValue(null);
  expect(calculateEventLiveEstimate(data, '25')).toBeNull();
});
test('mini deck edits update only the active shared deck and preserve card details', () => {
  const initial = { activeDeckNum: 2, unifiedDecks: { deck1: { totalPower: 100000 }, deck2: { totalPower: 250000, skillLeader: 140 } } };
  const result = updateEventLiveDeck(initial, 'power', '32.5');
  expect(result.power).toBe('32.5');
  expect(result.unifiedDecks.deck2).toEqual({ totalPower: 325000, skillLeader: 140 });
  expect(result.unifiedDecks.deck1).toBe(initial.unifiedDecks.deck1);
  expect(initial.unifiedDecks.deck2.totalPower).toBe(250000);
});
