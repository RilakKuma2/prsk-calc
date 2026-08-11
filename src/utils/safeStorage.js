const getLocalStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const readStorageItem = (key, fallback = null) => {
  try {
    return getLocalStorage()?.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

export const writeStorageItem = (key, value) => {
  try {
    const storage = getLocalStorage();
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const removeStorageItem = (key) => {
  try {
    const storage = getLocalStorage();
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const readStorageEntries = () => {
  const entries = {};
  try {
    const storage = getLocalStorage();
    if (!storage) return entries;
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key) continue;
      const value = storage.getItem(key);
      if (value !== null) entries[key] = value;
    }
  } catch {
    return entries;
  }
  return entries;
};

/**
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @param {(value: unknown) => boolean} [validate]
 * @returns {T}
 */
export const readJsonStorage = (key, fallback, validate = () => true) => {
  const raw = readStorageItem(key);
  if (raw === null) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export const writeJsonStorage = (key, value) => (
  writeStorageItem(key, JSON.stringify(value))
);
