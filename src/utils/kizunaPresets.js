export const KIZUNA_PRESETS = ['P1', 'P2', 'P3'];

export const KIZUNA_PRESET_FIELDS = [
  'kizunaCurrentLevel',
  'kizunaCurrentExp',
  'kizunaTargetLevel',
  'kizunaRank',
  'kizunaFires',
  'kizunaLevelUpEnabled',
  'kizunaPlayerLevel',
  'kizunaPlayerRemainingExp',
  'kizunaPlayerLiveRank',
];

const isRecord = (value) => (
  Boolean(value)
  && typeof value === 'object'
  && !Array.isArray(value)
);

const normalizePreset = (value) => (
  KIZUNA_PRESETS.includes(value) ? value : 'P1'
);

const normalizePresetData = (value) => {
  if (!isRecord(value)) return {};
  return KIZUNA_PRESET_FIELDS.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(value, field)) {
      result[field] = value[field];
    }
    return result;
  }, {});
};

const extractLegacyPreset = (surveyData) => (
  normalizePresetData(surveyData)
);

export const createKizunaPresets = (surveyData = {}) => {
  const source = isRecord(surveyData.kizunaPresets)
    ? surveyData.kizunaPresets
    : {};
  const currentPreset = normalizePreset(source.currentPreset);
  const sourcePresets = isRecord(source.presets) ? source.presets : {};
  const presets = Object.fromEntries(
    KIZUNA_PRESETS.map((preset) => [
      preset,
      normalizePresetData(sourcePresets[preset]),
    ]),
  );

  if (!isRecord(surveyData.kizunaPresets)) {
    presets.P1 = extractLegacyPreset(surveyData);
  }

  return {
    schemaVersion: 1,
    currentPreset,
    presets,
  };
};

export const getActiveKizunaPreset = (presets) => {
  const normalized = createKizunaPresets({ kizunaPresets: presets });
  return normalized.presets[normalized.currentPreset];
};

export const selectKizunaPreset = (presets, preset) => {
  const normalized = createKizunaPresets({ kizunaPresets: presets });
  return {
    ...normalized,
    currentPreset: normalizePreset(preset),
  };
};

export const updateActiveKizunaPreset = (presets, updater) => {
  const normalized = createKizunaPresets({ kizunaPresets: presets });
  const preset = normalized.currentPreset;
  const currentData = normalized.presets[preset];
  const nextData = normalizePresetData(
    typeof updater === 'function' ? updater(currentData) : updater,
  );

  return {
    ...normalized,
    presets: {
      ...normalized.presets,
      [preset]: nextData,
    },
  };
};

export const mirrorActiveKizunaPreset = (surveyData, presets) => {
  const activeData = getActiveKizunaPreset(presets);
  const nextSurveyData = {
    ...surveyData,
    kizunaPresets: presets,
  };

  KIZUNA_PRESET_FIELDS.forEach((field) => {
    nextSurveyData[field] = Object.prototype.hasOwnProperty.call(activeData, field)
      ? activeData[field]
      : field === 'kizunaLevelUpEnabled'
        ? false
        : '';
  });

  return nextSurveyData;
};
