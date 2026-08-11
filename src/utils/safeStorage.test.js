import {
  readJsonStorage,
  readStorageEntries,
  readStorageItem,
  removeStorageItem,
  writeJsonStorage,
  writeStorageItem,
} from './safeStorage';

describe('safeStorage', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  test('reads and writes strings and JSON', () => {
    expect(writeStorageItem('plain', 'value')).toBe(true);
    expect(readStorageItem('plain')).toBe('value');

    expect(writeJsonStorage('json', { enabled: true })).toBe(true);
    expect(readJsonStorage('json', null)).toEqual({ enabled: true });
    expect(readStorageEntries()).toMatchObject({ plain: 'value', json: '{"enabled":true}' });
    expect(removeStorageItem('plain')).toBe(true);
    expect(readStorageItem('plain', 'fallback')).toBe('fallback');
  });

  test('falls back for malformed or unexpected JSON', () => {
    window.localStorage.setItem('broken', '{not-json');
    window.localStorage.setItem('array', '[]');

    expect(readJsonStorage('broken', { safe: true })).toEqual({ safe: true });
    expect(readJsonStorage('array', {}, value => value && !Array.isArray(value))).toEqual({});
  });

  test('does not throw when browser storage access fails', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(readStorageItem('blocked', 'fallback')).toBe('fallback');
    expect(readJsonStorage('blocked', { safe: true })).toEqual({ safe: true });
  });

  test('reports quota and removal failures without throwing', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    expect(writeStorageItem('full', 'value')).toBe(false);
    expect(writeJsonStorage('full-json', { value: true })).toBe(false);
    expect(removeStorageItem('blocked')).toBe(false);
  });
});
