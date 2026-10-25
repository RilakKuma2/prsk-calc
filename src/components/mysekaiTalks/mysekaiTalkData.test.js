describe('MySekai fixture list freshness', () => {
  let loadMysekaiTalkData;
  let maxAge;
  let currentTime;
  let updated;
  let unavailable;
  let originalFetch;

  const oldFixture = { id: 101, name: '기존 가구', seq: 1 };
  const coffin = { id: 1819, name: '할로윈 관 침대', seq: 2 };

  const resources = (includeNew) => {
    const fixtures = includeNew ? [oldFixture, coffin] : [oldFixture];
    return {
      'mysekaiFixtures.json': fixtures,
      'mysekaiCharacterTalks.json': fixtures.map((fixture) => ({
        id: fixture.id,
        mysekaiCharacterTalkConditionGroupId: fixture.id,
        mysekaiGameCharacterUnitGroupId: 1,
        assetbundleName: 'mysekai/talk/scenario/talk',
        lua: `talk_${fixture.id}`,
      })),
      'mysekaiCharacterTalkConditions.json': fixtures.map((fixture) => ({
        id: fixture.id,
        mysekaiCharacterTalkConditionType: 'mysekai_fixture_id',
        mysekaiCharacterTalkConditionTypeValue: fixture.id,
      })),
      'mysekaiCharacterTalkConditionGroups.json': fixtures.map((fixture) => ({
        groupId: fixture.id,
        mysekaiCharacterTalkConditionId: fixture.id,
      })),
      'mysekaiGameCharacterUnitGroups.json': [{ id: 1, gameCharacterUnitId1: 1 }],
    };
  };

  beforeEach(() => {
    jest.resetModules();
    const module = require('./mysekaiTalkData');
    loadMysekaiTalkData = module.loadMysekaiTalkData;
    maxAge = module.MYSEKAI_TALK_DATA_MAX_AGE_MS;
    currentTime = 1_000_000;
    updated = false;
    unavailable = false;
    jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
    originalFetch = global.fetch;
    global.fetch = jest.fn(async (url, options) => {
      if (unavailable) throw new Error('offline');
      // An old HTTP-cache entry remains unless the request revalidates it.
      const includeNew = updated && options.cache === 'no-cache';
      const data = resources(includeNew)[url.split('/').pop()] || [];
      return {
        ok: true,
        json: async () => (url.includes('/suite_kr/') ? [oldFixture] : data),
      };
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('revalidates expired lists and includes new furniture and its dialogue even before translation', async () => {
    const initial = await loadMysekaiTalkData({ language: 'ko' });
    expect(initial.fixtures.map(({ id }) => id)).toEqual([101]);
    const requestCount = global.fetch.mock.calls.length;
    updated = true;
    currentTime += maxAge - 1;
    expect(await loadMysekaiTalkData({ language: 'ko' })).toBe(initial);
    expect(global.fetch).toHaveBeenCalledTimes(requestCount);

    currentTime += 1;
    const refreshed = await loadMysekaiTalkData({ language: 'ko' });
    expect(refreshed.fixtures.map(({ id }) => id)).toEqual([101, 1819]);
    expect(refreshed.talksByCharacter[1].map(({ fixture }) => fixture.id))
      .toEqual([101, 1819]);
  });

  it('retries an expired list after a failed refresh instead of caching the failure', async () => {
    await loadMysekaiTalkData({ language: 'ja' });
    currentTime += maxAge;
    unavailable = true;
    await expect(loadMysekaiTalkData({ language: 'ja' })).rejects.toThrow('offline');

    unavailable = false;
    updated = true;
    const recovered = await loadMysekaiTalkData({ language: 'ja' });
    expect(recovered.talksByCharacter[1].some(({ fixture }) => fixture.id === 1819)).toBe(true);
  });
});
