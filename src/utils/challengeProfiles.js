export const CHALLENGE_PRESETS = ['P1', 'P2', 'P3'];

export const CHALLENGE_PROFILE_FIELDS = [
  'challengeDeck',
  'currentStage',
  'remainingScore',
  'targetStage',
  'challengeScore',
  'pass',
];

const isRecord = (value) => (
  Boolean(value)
  && typeof value === 'object'
  && !Array.isArray(value)
);

const normalizeCharacterId = (value) => {
  const characterId = Number(value);
  return Number.isInteger(characterId) && characterId >= 1 && characterId <= 26
    ? characterId
    : 1;
};

const normalizePreset = (value) => (
  CHALLENGE_PRESETS.includes(value) ? value : 'P1'
);

const normalizePresetData = (value) => {
  if (!isRecord(value)) return {};

  return CHALLENGE_PROFILE_FIELDS.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(value, field)) {
      if (field !== 'challengeDeck' || isRecord(value[field])) {
        result[field] = value[field];
      }
    }
    return result;
  }, {});
};

const extractLegacyPreset = (surveyData) => (
  CHALLENGE_PROFILE_FIELDS.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(surveyData, field)) {
      if (field !== 'challengeDeck' || isRecord(surveyData[field])) {
        result[field] = surveyData[field];
      }
    }
    return result;
  }, {})
);

const normalizeCharacter = (value) => {
  const source = isRecord(value) ? value : {};
  const currentPreset = normalizePreset(source.currentPreset);
  const sourcePresets = isRecord(source.presets) ? source.presets : {};

  return {
    currentPreset,
    presets: Object.fromEntries(
      CHALLENGE_PRESETS.map((preset) => [
        preset,
        normalizePresetData(sourcePresets[preset]),
      ]),
    ),
  };
};

export const createChallengeProfiles = (surveyData = {}) => {
  const selectedCharacterId = normalizeCharacterId(
    surveyData.challengeProfiles?.selectedCharacterId,
  );
  const sourceCharacters = isRecord(surveyData.challengeProfiles?.characters)
    ? surveyData.challengeProfiles.characters
    : {};
  const characters = Object.fromEntries(
    Object.entries(sourceCharacters)
      .filter(([characterId]) => normalizeCharacterId(characterId) === Number(characterId))
      .map(([characterId, value]) => [characterId, normalizeCharacter(value)]),
  );

  if (!characters[selectedCharacterId]) {
    characters[selectedCharacterId] = normalizeCharacter();
  }

  if (!isRecord(surveyData.challengeProfiles)) {
    characters[selectedCharacterId].presets.P1 = extractLegacyPreset(surveyData);
  }

  return {
    schemaVersion: 1,
    selectedCharacterId,
    characters,
  };
};

export const getActiveChallengePreset = (profiles) => {
  const selectedCharacterId = normalizeCharacterId(profiles?.selectedCharacterId);
  const character = normalizeCharacter(profiles?.characters?.[selectedCharacterId]);
  return character.presets[character.currentPreset];
};

export const selectChallengeCharacter = (profiles, characterId) => {
  const normalized = createChallengeProfiles({ challengeProfiles: profiles });
  const selectedCharacterId = normalizeCharacterId(characterId);
  return {
    ...normalized,
    selectedCharacterId,
    characters: {
      ...normalized.characters,
      [selectedCharacterId]: normalizeCharacter(
        normalized.characters[selectedCharacterId],
      ),
    },
  };
};

export const selectChallengePreset = (profiles, preset) => {
  const normalized = createChallengeProfiles({ challengeProfiles: profiles });
  const selectedCharacterId = normalized.selectedCharacterId;
  const character = normalizeCharacter(normalized.characters[selectedCharacterId]);

  return {
    ...normalized,
    characters: {
      ...normalized.characters,
      [selectedCharacterId]: {
        ...character,
        currentPreset: normalizePreset(preset),
      },
    },
  };
};

export const updateActiveChallengePreset = (profiles, updater) => {
  const normalized = createChallengeProfiles({ challengeProfiles: profiles });
  const selectedCharacterId = normalized.selectedCharacterId;
  const character = normalizeCharacter(normalized.characters[selectedCharacterId]);
  const preset = character.currentPreset;
  const currentData = character.presets[preset];
  const nextData = normalizePresetData(
    typeof updater === 'function' ? updater(currentData) : updater,
  );

  return {
    ...normalized,
    characters: {
      ...normalized.characters,
      [selectedCharacterId]: {
        ...character,
        presets: {
          ...character.presets,
          [preset]: nextData,
        },
      },
    },
  };
};

export const mirrorActiveChallengePreset = (surveyData, profiles) => {
  const activeData = getActiveChallengePreset(profiles);
  const nextSurveyData = {
    ...surveyData,
    challengeProfiles: profiles,
  };

  CHALLENGE_PROFILE_FIELDS.forEach((field) => {
    nextSurveyData[field] = Object.prototype.hasOwnProperty.call(activeData, field)
      ? activeData[field]
      : field === 'challengeDeck'
        ? {}
        : '';
  });

  return nextSurveyData;
};
