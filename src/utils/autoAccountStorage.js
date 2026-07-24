export const AUTO_ACCOUNT_STORAGE_KEYS = new Set([
  'language',
  'amatsuyu_notify_settings',
  'roomSearchEngine',
  'showRecentHourlySpeed',
  // savedFriendCode is intentionally excluded: it has a separate, explicit
  // account-profile opt-in and must not create an automatic-sync conflict.
  'charRankInputs',
  'charRankAddInputs',
  'charRankSelectedId',
  'calcPreviewCharId',
  'supportDeckState',
  'prskCalcSurveyData',
  'prskEventShopSimulatorStateV1',
  'prskEventShopSimulatorPresetsV1',
  'prskEventShopSimulatorItemCountsV1',
]);

export const isAutoAccountStorageKey = (key) => (
  AUTO_ACCOUNT_STORAGE_KEYS.has(key) || key.startsWith('ebc_')
);

export const normalizeAutoAccountSnapshot = (value) => {
  const source = value && typeof value.entries === 'object' && !Array.isArray(value.entries)
    ? value.entries
    : {};
  const entries = {};
  Object.keys(source).sort().forEach((key) => {
    if (isAutoAccountStorageKey(key) && typeof source[key] === 'string') {
      entries[key] = source[key];
    }
  });
  return { schemaVersion: 1, entries };
};
