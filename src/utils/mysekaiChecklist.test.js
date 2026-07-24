import {
  canUseFixtureDialogues,
  createMysekaiStorageAdapter,
  hasMysekaiConflict,
  mergeMysekaiSnapshots,
  normalizeMysekaiSnapshot,
} from './mysekaiChecklist';
import {
  buildTalkCardsByCharacter,
  getTalkDataResourcePaths,
  parseFixtureDialogueLua,
} from '../components/mysekaiTalks/mysekaiTalkData';

const snapshot = ({
  preset = 'P1',
  p1Fixtures = {},
  p1Dialogues = [],
  p2Fixtures = {},
  p2Dialogues = [],
} = {}) => ({
  schemaVersion: 1,
  currentPreset: preset,
  presets: {
    P1: { ownedFixtures: p1Fixtures, seenDialogues: p1Dialogues },
    P2: { ownedFixtures: p2Fixtures, seenDialogues: p2Dialogues },
    P3: { ownedFixtures: {}, seenDialogues: [] },
  },
});

describe('MySekai shared checklist state', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('normalizes the wrapped payload written by the calculator account-state client', () => {
    const value = normalizeMysekaiSnapshot({
      __wrapped: true,
      payload: snapshot({
        preset: 'P2',
        p1Fixtures: { 101: true, invalid: true, 102: false },
        p1Dialogues: ['bundle:talk_1', 'bundle:talk_1', 'invalid'],
      }),
    });

    expect(value.currentPreset).toBe('P2');
    expect(value.presets.P1.ownedFixtures).toEqual({ 101: true });
    expect(value.presets.P1.seenDialogues).toEqual(['bundle:talk_1']);
  });

  it('uses the same localStorage keys as sekai-statics /mysekai', () => {
    window.localStorage.setItem('mysekai_currentPreset', 'P2');
    window.localStorage.setItem('mysekai-owned-fixtures', JSON.stringify({ 11: true }));
    window.localStorage.setItem('mysekai-owned-fixtures_P2', JSON.stringify({ 22: true }));
    window.localStorage.setItem('mysekai_seenDialogues_P2', JSON.stringify(['bundle:talk_2']));

    const adapter = createMysekaiStorageAdapter();
    const loaded = adapter.read();

    expect(loaded.currentPreset).toBe('P2');
    expect(loaded.presets.P1.ownedFixtures).toEqual({ 11: true });
    expect(loaded.presets.P2.ownedFixtures).toEqual({ 22: true });
    expect(loaded.presets.P2.seenDialogues).toEqual(['bundle:talk_2']);

    adapter.write(snapshot({ preset: 'P1', p1Fixtures: { 33: true } }));
    expect(JSON.parse(window.localStorage.getItem('mysekai-owned-fixtures'))).toEqual({ 33: true });
  });

  it('merges owned fixtures and seen dialogues without dropping either site data', () => {
    const merged = mergeMysekaiSnapshots(
      snapshot({ p1Fixtures: { 1: true }, p1Dialogues: ['bundle:local'] }),
      snapshot({ p1Fixtures: { 2: true }, p1Dialogues: ['bundle:remote'] }),
    );

    expect(merged.presets.P1.ownedFixtures).toEqual({ 1: true, 2: true });
    expect(merged.presets.P1.seenDialogues).toEqual(
      expect.arrayContaining(['bundle:local', 'bundle:remote']),
    );
    expect(hasMysekaiConflict(
      snapshot({ p1Fixtures: { 1: true } }),
      snapshot({ p1Fixtures: { 2: true } }),
      true,
    )).toBe(true);
  });

  it('uses the same invite permission flag as the existing rilakbest link', () => {
    expect(canUseFixtureDialogues(null)).toBe(false);
    expect(canUseFixtureDialogues({ canAccessModeling: false })).toBe(false);
    expect(canUseFixtureDialogues({ canAccessModeling: true })).toBe(true);

    const indexPaths = getTalkDataResourcePaths();
    expect(indexPaths).toContain('mysekaiCharacterTalks.json');
    expect(indexPaths).not.toContain('mysekaiCharacterTalkTweets.json');
    expect(indexPaths.some((path) => path.endsWith('.lua'))).toBe(false);
  });

  it('builds the character-first dialogue list and groups duplicate fixtures', () => {
    const scenario = {
      assetbundleName: 'mysekai/talk/scenario/talk',
      lua: 'talk_1',
      primaryCharacterId: 1,
      participantCharIds: [1, 2],
      archiveSeq: 1,
      sortOrder: 1,
    };
    const talksByCharacter = buildTalkCardsByCharacter({
      fixtures: [
        { id: 10, seq: 1, name: 'A' },
        { id: 11, seq: 2, name: 'B' },
      ],
      scenariosByFixture: {
        10: [scenario],
        11: [scenario],
      },
    });

    expect(talksByCharacter[1]).toHaveLength(1);
    expect(talksByCharacter[2]).toHaveLength(1);
    expect(talksByCharacter[1][0].duplicateFixtures).toHaveLength(2);
  });

  it('parses fixture Lua as safe structured dialogue text', () => {
    const lines = parseFixtureDialogueLua(`
label("一歌")
voice("talk", "voice_001", Characters.Ichika)
text("<ruby>綺麗<rt>きれい</rt></ruby>だね。\\nかわいい")
`);

    expect(lines).toEqual([{
      speaker: '一歌',
      speakerId: 1,
      voiceName: 'voice_001',
      text: '<ruby>綺麗<rt>きれい</rt></ruby>だね。\nかわいい',
    }]);
  });
});
