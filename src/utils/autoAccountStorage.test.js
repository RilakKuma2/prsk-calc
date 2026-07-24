import {
  isAutoAccountStorageKey,
  normalizeAutoAccountSnapshot,
} from './autoAccountStorage';

describe('calculator automatic account storage', () => {
  it('excludes the friend code because it has its own opt-in account storage', () => {
    expect(isAutoAccountStorageKey('savedFriendCode')).toBe(false);
    expect(normalizeAutoAccountSnapshot({
      schemaVersion: 1,
      entries: {
        savedFriendCode: '1234567890123456',
        language: 'ko',
        ebc_support_bonus: '15',
      },
    })).toEqual({
      schemaVersion: 1,
      entries: {
        ebc_support_bonus: '15',
        language: 'ko',
      },
    });
  });
});
