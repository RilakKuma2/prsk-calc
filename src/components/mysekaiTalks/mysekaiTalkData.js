const ASSET_BASE_URL = 'https://asset.rilaksekai.com';

const TALK_INDEX_RESOURCES = {
  fixtures: 'mysekaiFixtures.json',
  characterTalks: 'mysekaiCharacterTalks.json',
  talkConditions: 'mysekaiCharacterTalkConditions.json',
  talkConditionGroups: 'mysekaiCharacterTalkConditionGroups.json',
  characterUnitGroups: 'mysekaiGameCharacterUnitGroups.json',
  someCharacterTalks: 'mysekaiCharacterTalkSomeCharacterTalks.json',
  archiveTalkGroups: 'characterArchiveMysekaiCharacterTalkGroups.json',
};

const TALK_EXTRA_RESOURCES = {
  tweets: 'mysekaiCharacterTalkTweets.json',
  talkWithoutRelated: 'mysekaiCharacterTalkTweetWithoutRelatedTalks.json',
  talkPreActions: 'mysekaiCharacterTalkPreActions.json',
};

const dataCache = new Map();

export const getTalkDataResourcePaths = (includeDialogueExtras = false) => [
  ...Object.values(TALK_INDEX_RESOURCES),
  ...(includeDialogueExtras ? Object.values(TALK_EXTRA_RESOURCES) : []),
];

const fetchJson = async (path, signal, optional = false) => {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(`${ASSET_BASE_URL}/${path}`, {
        cache: 'force-cache',
        signal,
      });
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      const value = await response.json();
      return Array.isArray(value) ? value : [];
    } catch (error) {
      if (signal?.aborted) throw error;
      lastError = error;
    }
  }
  if (optional) return [];
  throw lastError;
};

const mergeTranslatedFixtures = (fixtures, translatedFixtures) => {
  if (!translatedFixtures.length) return fixtures;
  const translatedById = new Map(translatedFixtures.map((fixture) => [fixture.id, fixture]));
  return fixtures.map((fixture) => {
    const translated = translatedById.get(fixture.id);
    if (!translated) return fixture;
    return {
      ...fixture,
      name: translated.name?.trim() || fixture.name,
      flavorText: translated.flavorText?.trim() || fixture.flavorText,
    };
  });
};

const mergeTranslatedTweets = (tweets, translatedTweets) => {
  if (!translatedTweets.length) return tweets;
  const translatedById = new Map(translatedTweets.map((tweet) => [tweet.id, tweet]));
  return tweets.map((tweet) => ({
    ...tweet,
    text: translatedById.get(tweet.id)?.text?.trim() || tweet.text,
  }));
};

const buildCharactersByUnitGroup = (characterUnitGroups) => {
  const charactersByUnitGroup = {};
  characterUnitGroups.forEach((group) => {
    charactersByUnitGroup[group.id] = Object.entries(group)
      .filter(([key, value]) => (
        key.startsWith('gameCharacterUnitId')
        && Number.isSafeInteger(value)
        && value > 0
      ))
      .map(([, value]) => value)
      .sort((left, right) => left - right);
  });
  return charactersByUnitGroup;
};

const buildScenarioMap = (resources) => {
  const charactersByUnitGroup = buildCharactersByUnitGroup(
    resources.characterUnitGroups,
  );

  const fixtureByCondition = new Map(
    resources.talkConditions
      .filter((condition) => (
        condition.mysekaiCharacterTalkConditionType === 'mysekai_fixture_id'
      ))
      .map((condition) => [
        condition.id,
        condition.mysekaiCharacterTalkConditionTypeValue,
      ]),
  );
  const fixtureByConditionGroup = new Map();
  resources.talkConditionGroups.forEach((conditionGroup) => {
    const fixtureId = fixtureByCondition.get(
      conditionGroup.mysekaiCharacterTalkConditionId,
    );
    if (fixtureId) fixtureByConditionGroup.set(conditionGroup.groupId, fixtureId);
  });

  const sortOrderByTalkAndCharacter = new Map();
  resources.someCharacterTalks.forEach((row) => {
    if (!row.mysekaiCharacterTalkId || !row.mainGameCharacterUnitId) return;
    sortOrderByTalkAndCharacter.set(
      `${row.mainGameCharacterUnitId}:${row.mysekaiCharacterTalkId}`,
      row.id,
    );
  });
  const archiveOrderByGroup = new Map(
    resources.archiveTalkGroups.map((group) => [
      group.id,
      group.seq || Number.MAX_SAFE_INTEGER,
    ]),
  );

  const scenariosByFixture = {};
  resources.characterTalks.forEach((talk) => {
    const fixtureId = fixtureByConditionGroup.get(
      talk.mysekaiCharacterTalkConditionGroupId,
    );
    const participantCharIds = charactersByUnitGroup[
      talk.mysekaiGameCharacterUnitGroupId
    ] || [];
    if (
      !fixtureId
      || !participantCharIds.length
      || !talk.lua
      || !talk.assetbundleName
    ) return;

    if (!scenariosByFixture[fixtureId]) scenariosByFixture[fixtureId] = [];
    scenariosByFixture[fixtureId].push({
      lua: talk.lua,
      assetbundleName: talk.assetbundleName,
      talkId: talk.id,
      primaryCharacterId: participantCharIds[0],
      participantCharIds: participantCharIds.length > 1
        ? participantCharIds
        : null,
      archiveSeq: archiveOrderByGroup.get(
        talk.characterArchiveMysekaiCharacterTalkGroupId,
      ) || Number.MAX_SAFE_INTEGER,
      sortOrder: Math.min(
        ...participantCharIds.map((characterId) => (
          sortOrderByTalkAndCharacter.get(`${characterId}:${talk.id}`)
          || Number.MAX_SAFE_INTEGER
        )),
      ),
    });
  });

  return scenariosByFixture;
};

const buildUnmatchedTalks = (resources, scenariosByFixture) => {
  const matchedTalkIds = new Set(
    Object.values(scenariosByFixture)
      .flat()
      .map((scenario) => scenario.talkId),
  );
  const charactersByUnitGroup = buildCharactersByUnitGroup(
    resources.characterUnitGroups,
  );
  return resources.characterTalks
    .filter((talk) => !matchedTalkIds.has(talk.id))
    .map((talk) => {
      const charIds = charactersByUnitGroup[talk.mysekaiGameCharacterUnitGroupId] || [];
      return {
        ...talk,
        charIds,
        primaryCharId: charIds[0] || null,
      };
    })
    .filter((talk) => talk.primaryCharId);
};

const buildTalkIdToTweets = (tweets, talkPreActions) => {
  const textByTweetId = new Map(tweets.map((tweet) => [tweet.id, tweet.text]));
  const result = {};
  talkPreActions.forEach((action) => {
    const text = textByTweetId.get(action.mysekaiCharacterTalkTweetId);
    if (!text) return;
    if (!result[action.mysekaiCharacterTalkId]) {
      result[action.mysekaiCharacterTalkId] = [];
    }
    result[action.mysekaiCharacterTalkId].push(text);
  });
  return result;
};

export const buildTalkCardsByCharacter = ({ fixtures, scenariosByFixture }) => {
  const fixtureById = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  const groupedByCharacter = {};

  Object.entries(scenariosByFixture).forEach(([rawFixtureId, scenarios]) => {
    const fixture = fixtureById.get(Number(rawFixtureId));
    if (!fixture) return;

    scenarios.forEach((scenario) => {
      const dialogueKey = `${scenario.assetbundleName}:${scenario.lua}`;
      const characterIds = scenario.participantCharIds
        || [scenario.primaryCharacterId];

      characterIds.forEach((characterId) => {
        if (!groupedByCharacter[characterId]) groupedByCharacter[characterId] = new Map();
        const cards = groupedByCharacter[characterId];
        const existing = cards.get(dialogueKey);
        const duplicateFixture = { fixture, scenario };
        if (existing) {
          if (!existing.duplicateFixtures.some((item) => item.fixture.id === fixture.id)) {
            existing.duplicateFixtures.push(duplicateFixture);
          }
          return;
        }
        cards.set(dialogueKey, {
          fixture,
          scenario,
          dialogueKey,
          duplicateFixtures: [duplicateFixture],
        });
      });
    });
  });

  return Object.fromEntries(Object.entries(groupedByCharacter).map(
    ([characterId, cards]) => [
      characterId,
      [...cards.values()].sort((left, right) => (
        left.scenario.archiveSeq - right.scenario.archiveSeq
        || left.scenario.sortOrder - right.scenario.sortOrder
        || (left.fixture.seq || left.fixture.id) - (right.fixture.seq || right.fixture.id)
      )),
    ],
  ));
};

export const loadMysekaiTalkData = async ({
  language,
  includeDialogueExtras = false,
  signal,
}) => {
  const sourceLanguage = language === 'ko' ? 'ko' : 'ja';
  const cacheKey = `${sourceLanguage}:${includeDialogueExtras ? 'full' : 'index'}`;
  if (dataCache.has(cacheKey)) return dataCache.get(cacheKey);

  const entries = await Promise.all(
    Object.entries({
      ...TALK_INDEX_RESOURCES,
      ...(includeDialogueExtras ? TALK_EXTRA_RESOURCES : {}),
    }).map(async ([key, file]) => [
      key,
      await fetchJson(`suite/${file}`, signal),
    ]),
  );
  const resources = Object.fromEntries(entries);
  if (sourceLanguage === 'ko') {
    const translatedFixtures = await fetchJson(
      `suite_kr/${TALK_INDEX_RESOURCES.fixtures}`,
      signal,
      true,
    );
    resources.fixtures = mergeTranslatedFixtures(
      resources.fixtures,
      translatedFixtures,
    );
    if (includeDialogueExtras) {
      const translatedTweets = await fetchJson(
        `suite_kr/${TALK_EXTRA_RESOURCES.tweets}`,
        signal,
        true,
      );
      resources.tweets = mergeTranslatedTweets(resources.tweets, translatedTweets);
    }
  }

  const scenariosByFixture = buildScenarioMap(resources);
  const result = {
    fixtures: resources.fixtures,
    scenariosByFixture,
    talksByCharacter: buildTalkCardsByCharacter({
      fixtures: resources.fixtures,
      scenariosByFixture,
    }),
    unmatchedTalks: includeDialogueExtras
      ? buildUnmatchedTalks(resources, scenariosByFixture)
      : [],
    talkIdToTweets: includeDialogueExtras
      ? buildTalkIdToTweets(resources.tweets, resources.talkPreActions)
      : {},
    talkWithoutRelated: resources.talkWithoutRelated || [],
    tweets: resources.tweets || [],
  };
  dataCache.set(cacheKey, result);
  return result;
};

export const getFixtureThumbnailUrl = (fixture) => {
  if (!fixture?.assetbundleName) return '';
  if (fixture.mysekaiFixtureType === 'surface_appearance') {
    return `${ASSET_BASE_URL}/mysekai/thumbnail/surface_appearance/${fixture.assetbundleName}/tex_${fixture.assetbundleName}_${fixture.mysekaiSettableLayoutType}_1.webp`;
  }
  return `${ASSET_BASE_URL}/mysekai/thumbnail/fixture/${fixture.assetbundleName}_1/${fixture.assetbundleName}_1.webp`;
};

export const getTalkVoiceUrl = (lua, voiceName) => (
  `https://asset2.rilaksekai.com/mysekai/talk/voice/${lua}/${lua}_${voiceName}.m4a`
);

export const getCharacterStampUrl = (rawId) => {
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1 || id > 56) return '';
  let stampId = id;
  if (id >= 32 && id <= 36) stampId = 22;
  else if (id >= 37 && id <= 41) stampId = 23;
  else if (id >= 42 && id <= 46) stampId = 24;
  else if (id >= 47 && id <= 51) stampId = 25;
  else if (id >= 52 && id <= 56) stampId = 26;
  return `https://rilakbest.com/av_stamps/${String(stampId).padStart(2, '0')}.webp`;
};

const BASE_CHARACTER_NAMES = {
  ko: [
    '', '이치카', '사키', '호나미', '시호', '미노리', '하루카', '아이리', '시즈쿠',
    '코하네', '안', '아키토', '토우야', '츠카사', '에무', '네네', '루이',
    '카나데', '마후유', '에나', '미즈키', '미쿠', '린', '렌', '루카', 'MEIKO', 'KAITO',
  ],
  ja: [
    '', '一歌', '咲希', '穂波', '志歩', 'みのり', '遥', '愛莉', '雫',
    'こはね', '杏', '彰人', '冬弥', '司', 'えむ', '寧々', '類',
    '奏', 'まふゆ', '絵名', '瑞希', 'ミク', 'リン', 'レン', 'ルカ', 'MEIKO', 'KAITO',
  ],
  en: [
    '', 'Ichika', 'Saki', 'Honami', 'Shiho', 'Minori', 'Haruka', 'Airi', 'Shizuku',
    'Kohane', 'An', 'Akito', 'Toya', 'Tsukasa', 'Emu', 'Nene', 'Rui',
    'Kanade', 'Mafuyu', 'Ena', 'Mizuki', 'Miku', 'Rin', 'Len', 'Luka', 'MEIKO', 'KAITO',
  ],
};

const UNIT_NAMES = ['L/n', 'MMJ', 'VBS', 'WxS', 'N25'];

export const getCharacterName = (rawId, language = 'ko') => {
  const id = Number(rawId);
  const names = BASE_CHARACTER_NAMES[language] || BASE_CHARACTER_NAMES.ko;
  if (id >= 1 && id <= 26) return names[id];
  if (id >= 27 && id <= 56) {
    const singerIndex = Math.floor((id - 27) / 5);
    const unitIndex = (id - 27) % 5;
    return `${names[21 + singerIndex]} (${UNIT_NAMES[unitIndex]})`;
  }
  return String(id);
};

const CHARACTER_COLORS = [
  '#33AAEE', '#FFDD44', '#EE6666', '#CCFF99', '#FFCCAA', '#99CCFF', '#FFAACC',
  '#99EEDD', '#FF6699', '#00BBDD', '#FF7722', '#0077DD', '#FFBB00', '#FF66BB',
  '#33DD99', '#BB88EE', '#BB6688', '#8888CC', '#CCAA88', '#DDAACC', '#33CCBB',
  '#FFCC11', '#FFEE11', '#FFBBCC', '#DD4444', '#3366CC',
];

export const getCharacterColor = (rawId) => {
  const id = Number(rawId);
  const baseId = id <= 26 ? id : 21 + Math.floor((id - 27) / 5);
  return CHARACTER_COLORS[baseId - 1] || '#94a3b8';
};

const CHARACTER_CONSTANT_IDS = {
  Ichika: 1,
  Saki: 2,
  Honami: 3,
  Shiho: 4,
  Minori: 5,
  Haruka: 6,
  Airi: 7,
  Shizuku: 8,
  Kohane: 9,
  An: 10,
  Akito: 11,
  Toya: 12,
  Tsukasa: 13,
  Emu: 14,
  Nene: 15,
  Rui: 16,
  Kanade: 17,
  Mafuyu: 18,
  Ena: 19,
  Mizuki: 20,
  Miku: 21,
  Rin: 22,
  Len: 23,
  Luka: 24,
  Meiko: 25,
  Kaito: 26,
  LnMiku: 27,
  MmjMiku: 28,
  VbsMiku: 29,
  WnsMiku: 30,
  N25Miku: 31,
  LnRin: 32,
  MmjRin: 33,
  VbsRin: 34,
  WnsRin: 35,
  N25Rin: 36,
  LnLen: 37,
  MmjLen: 38,
  VbsLen: 39,
  WnsLen: 40,
  N25Len: 41,
  LnLuka: 42,
  MmjLuka: 43,
  VbsLuka: 44,
  WnsLuka: 45,
  N25Luka: 46,
  LnMeiko: 47,
  MmjMeiko: 48,
  VbsMeiko: 49,
  WnsMeiko: 50,
  N25Meiko: 51,
  LnKaito: 52,
  MmjKaito: 53,
  VbsKaito: 54,
  WnsKaito: 55,
  N25Kaito: 56,
};

export const parseFixtureDialogueLua = (luaText) => {
  const dialogues = [];
  let speaker = '';
  let speakerId = null;
  let voiceName = null;

  luaText.split('\n').forEach((line) => {
    const labelMatch = line.match(/label\s*\(\s*["']([^"']+)["']\s*\)/);
    if (labelMatch) {
      speaker = labelMatch[1];
      speakerId = null;
      voiceName = null;
    }
    const voiceMatch = line.match(
      /voice\s*\(\s*["']talk["']\s*,\s*["']([^"']+)["']\s*,\s*Characters\.([A-Za-z0-9_]+)\s*\)/,
    );
    if (voiceMatch) {
      voiceName = voiceMatch[1];
      speakerId = CHARACTER_CONSTANT_IDS[voiceMatch[2]] || null;
    }
    const textMatch = line.match(/text\s*\(\s*["'](.+?)["']\s*\)/);
    if (textMatch) {
      dialogues.push({
        speaker,
        speakerId,
        voiceName,
        text: textMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\'),
      });
      voiceName = null;
    }
  });
  return dialogues;
};

export const loadFixtureDialogue = async ({
  assetbundleName,
  lua,
  language,
  signal,
}) => {
  const candidates = [];
  if (language === 'ko') {
    candidates.push(assetbundleName.replace(/^mysekai\//, 'mysekai_kr/'));
  }
  candidates.push(
    assetbundleName
      .replace(/^mysekai\//, 'mysekai_ruby/')
      .replace(/^actionset\//, 'actionset_ruby/'),
    assetbundleName,
  );

  for (const bundle of [...new Set(candidates)]) {
    try {
      const response = await fetch(`${ASSET_BASE_URL}/${bundle}/${lua}.lua`, {
        cache: 'force-cache',
        signal,
      });
      if (!response.ok) continue;
      return parseFixtureDialogueLua(await response.text());
    } catch (error) {
      if (signal?.aborted) throw error;
    }
  }
  return [];
};
