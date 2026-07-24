import { isAutoAccountStorageKey } from './autoAccountStorage';
import {
  createMysekaiStorageAdapter,
  getMysekaiSnapshotStats,
  mergeMysekaiSnapshots,
  MYSEKAI_DIRTY_KEY,
  normalizeMysekaiSnapshot,
} from './mysekaiChecklist';

export const MANUAL_SAVE_STORAGE_KEY = 'prskCalcManualSavedSnapshotV2';

const EXTRA_MANUAL_STORAGE_KEYS = new Set([
  'savedFriendCode',
  'sekai-theme',
  'mysekai_ownedTamagotchi',
  'mysekai_hideDuplicateFurniture',
]);

const isRecord = (value) => (
  Boolean(value)
  && typeof value === 'object'
  && !Array.isArray(value)
);

export const isManualSaveStorageKey = (key) => (
  isAutoAccountStorageKey(key) || EXTRA_MANUAL_STORAGE_KEYS.has(key)
);

const normalizeManualEntries = (value) => {
  if (!isRecord(value)) return null;
  const entries = {};
  Object.keys(value).sort().forEach((key) => {
    if (isManualSaveStorageKey(key) && typeof value[key] === 'string') {
      entries[key] = value[key];
    }
  });
  return entries;
};

export const normalizeManualSaveSnapshot = (rawValue) => {
  const value = rawValue?.__wrapped === true ? rawValue.payload : rawValue;
  const data = isRecord(value?.data) ? value.data : {};
  const entries = normalizeManualEntries(value?.entries);
  const mysekai = isRecord(value?.mysekai)
    ? normalizeMysekaiSnapshot(value.mysekai)
    : null;

  return {
    schemaVersion: 2,
    data,
    entries,
    mysekai,
  };
};

export const isManualSaveSnapshot = (value) => {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== 1 && value.schemaVersion !== 2) return false;
  if (!isRecord(value.data)) return false;
  if (value.entries !== undefined && value.entries !== null && !isRecord(value.entries)) {
    return false;
  }
  if (value.mysekai !== undefined && value.mysekai !== null && !isRecord(value.mysekai)) {
    return false;
  }
  return true;
};

export const readManualStorageEntries = () => {
  if (typeof window === 'undefined') return {};
  const entries = {};
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !isManualSaveStorageKey(key)) continue;
    const value = window.localStorage.getItem(key);
    if (value !== null) entries[key] = value;
  }
  return normalizeManualEntries(entries) || {};
};

export const restoreManualStorageEntries = (rawEntries) => {
  if (typeof window === 'undefined') return;
  const entries = normalizeManualEntries(rawEntries);
  if (entries === null) return;

  const existingKeys = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && isManualSaveStorageKey(key)) existingKeys.push(key);
  }
  existingKeys.forEach((key) => {
    if (!(key in entries)) window.localStorage.removeItem(key);
  });
  Object.entries(entries).forEach(([key, value]) => {
    window.localStorage.setItem(key, value);
  });
};

export const createManualSaveSnapshot = (data) => {
  const mysekaiStorage = createMysekaiStorageAdapter();
  return normalizeManualSaveSnapshot({
    schemaVersion: 2,
    data,
    entries: readManualStorageEntries(),
    mysekai: mysekaiStorage.read(),
  });
};

export const restoreManualSaveSnapshot = (rawSnapshot) => {
  const snapshot = normalizeManualSaveSnapshot(rawSnapshot);
  restoreManualStorageEntries(snapshot.entries);
  if (snapshot.mysekai && typeof window !== 'undefined') {
    createMysekaiStorageAdapter().write(snapshot.mysekai);
    window.localStorage.setItem(MYSEKAI_DIRTY_KEY, '1');
  }
  return snapshot.data;
};

export const mergeManualSaveSnapshots = (rawLocal, rawRemote) => {
  const local = normalizeManualSaveSnapshot(rawLocal);
  const remote = normalizeManualSaveSnapshot(rawRemote);
  return normalizeManualSaveSnapshot({
    schemaVersion: 2,
    data: { ...remote.data, ...local.data },
    entries: local.entries === null && remote.entries === null
      ? null
      : { ...(remote.entries || {}), ...(local.entries || {}) },
    mysekai: local.mysekai && remote.mysekai
      ? mergeMysekaiSnapshots(local.mysekai, remote.mysekai)
      : local.mysekai || remote.mysekai,
  });
};

export const getManualSaveSnapshotStats = (rawSnapshot) => {
  const snapshot = normalizeManualSaveSnapshot(rawSnapshot);
  const mysekaiStats = snapshot.mysekai
    ? getMysekaiSnapshotStats(snapshot.mysekai)
    : { total: 0 };
  return {
    surveyFields: Object.keys(snapshot.data).length,
    localEntries: Object.keys(snapshot.entries || {}).length,
    mysekaiItems: mysekaiStats.total,
    total: Object.keys(snapshot.data).length
      + Object.keys(snapshot.entries || {}).length
      + mysekaiStats.total,
  };
};
