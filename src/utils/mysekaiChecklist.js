export const MYSEKAI_SYNC_NAMESPACE = 'mysekai-checklist';
export const MYSEKAI_PRESETS = ['P1', 'P2', 'P3'];
export const MYSEKAI_DIRTY_KEY = 'sekai-cloud-mysekai-dirty-v1';

const fixtureStorageKey = (preset) => (
  preset === 'P1' ? 'mysekai-owned-fixtures' : `mysekai-owned-fixtures_${preset}`
);

const dialogueStorageKey = (preset) => (
  preset === 'P1' ? 'mysekai_seenDialogues' : `mysekai_seenDialogues_${preset}`
);

const normalizeOwnedFixtures = (value) => {
  const result = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;

  Object.entries(value).forEach(([rawId, owned]) => {
    const fixtureId = Number(rawId);
    if (owned && Number.isSafeInteger(fixtureId) && fixtureId > 0) {
      result[String(fixtureId)] = true;
    }
  });
  return result;
};

const normalizeSeenDialogues = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((entry) => (
      typeof entry === 'string'
      && entry.length > 0
      && entry.length <= 512
      && entry.includes(':')
    ))
    .slice(0, 10_000))];
};

export const createEmptyMysekaiSnapshot = () => ({
  schemaVersion: 1,
  currentPreset: 'P1',
  presets: Object.fromEntries(MYSEKAI_PRESETS.map((preset) => [
    preset,
    { ownedFixtures: {}, seenDialogues: [] },
  ])),
});

export const normalizeMysekaiSnapshot = (rawValue) => {
  const value = rawValue?.__wrapped === true ? rawValue.payload : rawValue;
  const empty = createEmptyMysekaiSnapshot();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return empty;

  const currentPreset = MYSEKAI_PRESETS.includes(value.currentPreset)
    ? value.currentPreset
    : 'P1';
  const presets = {};
  MYSEKAI_PRESETS.forEach((preset) => {
    const presetValue = value.presets?.[preset];
    presets[preset] = {
      ownedFixtures: normalizeOwnedFixtures(presetValue?.ownedFixtures),
      seenDialogues: normalizeSeenDialogues(presetValue?.seenDialogues),
    };
  });

  return { schemaVersion: 1, currentPreset, presets };
};

export const isMysekaiSnapshot = (value) => {
  const snapshot = value?.__wrapped === true ? value.payload : value;
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return false;
  return snapshot.schemaVersion === 1
    && MYSEKAI_PRESETS.includes(snapshot.currentPreset)
    && MYSEKAI_PRESETS.every((preset) => (
      snapshot.presets?.[preset]
      && typeof snapshot.presets[preset].ownedFixtures === 'object'
      && !Array.isArray(snapshot.presets[preset].ownedFixtures)
      && Array.isArray(snapshot.presets[preset].seenDialogues)
    ));
};

const parseStoredJson = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const createMysekaiStorageAdapter = () => ({
  keys: [
    'mysekai_currentPreset',
    ...MYSEKAI_PRESETS.flatMap((preset) => [
      fixtureStorageKey(preset),
      dialogueStorageKey(preset),
    ]),
  ],
  dirtyKey: MYSEKAI_DIRTY_KEY,
  read: () => {
    if (typeof window === 'undefined') return createEmptyMysekaiSnapshot();
    const currentPreset = window.localStorage.getItem('mysekai_currentPreset') || 'P1';
    return normalizeMysekaiSnapshot({
      schemaVersion: 1,
      currentPreset,
      presets: Object.fromEntries(MYSEKAI_PRESETS.map((preset) => [
        preset,
        {
          ownedFixtures: parseStoredJson(fixtureStorageKey(preset), {}),
          seenDialogues: parseStoredJson(dialogueStorageKey(preset), []),
        },
      ])),
    });
  },
  write: (rawSnapshot) => {
    if (typeof window === 'undefined') return;
    const snapshot = normalizeMysekaiSnapshot(rawSnapshot);
    window.localStorage.setItem('mysekai_currentPreset', snapshot.currentPreset);
    MYSEKAI_PRESETS.forEach((preset) => {
      window.localStorage.setItem(
        fixtureStorageKey(preset),
        JSON.stringify(snapshot.presets[preset].ownedFixtures),
      );
      window.localStorage.setItem(
        dialogueStorageKey(preset),
        JSON.stringify(snapshot.presets[preset].seenDialogues),
      );
    });
  },
});

const collectSnapshotItems = (rawSnapshot) => {
  const snapshot = normalizeMysekaiSnapshot(rawSnapshot);
  const items = new Set();
  MYSEKAI_PRESETS.forEach((preset) => {
    const presetState = snapshot.presets[preset];
    Object.keys(presetState.ownedFixtures).forEach((fixtureId) => {
      items.add(`${preset}:fixture:${fixtureId}`);
    });
    presetState.seenDialogues.forEach((dialogueKey) => {
      items.add(`${preset}:dialogue:${dialogueKey}`);
    });
  });
  return items;
};

export const getMysekaiSnapshotStats = (rawSnapshot) => {
  const snapshot = normalizeMysekaiSnapshot(rawSnapshot);
  let ownedFixtures = 0;
  let seenDialogues = 0;
  MYSEKAI_PRESETS.forEach((preset) => {
    ownedFixtures += Object.keys(snapshot.presets[preset].ownedFixtures).length;
    seenDialogues += snapshot.presets[preset].seenDialogues.length;
  });
  return {
    ownedFixtures,
    seenDialogues,
    total: ownedFixtures + seenDialogues,
  };
};

export const hasLocalMysekaiItems = (local, remote) => {
  const localItems = collectSnapshotItems(local);
  const remoteItems = collectSnapshotItems(remote);
  return [...localItems].some((item) => !remoteItems.has(item));
};

export const hasMysekaiConflict = (local, remote, dirty) => {
  if (!dirty) return false;
  const localItems = collectSnapshotItems(local);
  const remoteItems = collectSnapshotItems(remote);
  if (localItems.size === 0 || remoteItems.size === 0) return false;
  const localOnly = [...localItems].some((item) => !remoteItems.has(item));
  const remoteOnly = [...remoteItems].some((item) => !localItems.has(item));
  return localOnly && remoteOnly;
};

export const mergeMysekaiSnapshots = (rawLocal, rawRemote) => {
  const local = normalizeMysekaiSnapshot(rawLocal);
  const remote = normalizeMysekaiSnapshot(rawRemote);
  const presets = {};

  MYSEKAI_PRESETS.forEach((preset) => {
    presets[preset] = {
      ownedFixtures: {
        ...remote.presets[preset].ownedFixtures,
        ...local.presets[preset].ownedFixtures,
      },
      seenDialogues: [
        ...new Set([
          ...remote.presets[preset].seenDialogues,
          ...local.presets[preset].seenDialogues,
        ]),
      ],
    };
  });

  return normalizeMysekaiSnapshot({
    schemaVersion: 1,
    currentPreset: local.currentPreset,
    presets,
  });
};

export const canUseFixtureDialogues = (user) => Boolean(user?.canAccessModeling);
