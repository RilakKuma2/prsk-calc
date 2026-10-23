// Heavy theory data is loaded only on the character-rank tab, independently of inputs.
import { fetchJsonWithTimeout, getMusicMetas } from './dataLoader';
import { rankAssetUrl, rankApiUrl, loadRankMaster, RANK_REFRESH_MS } from './characterRankData';
import { loadMysekaiTalkData } from '../components/mysekaiTalks/mysekaiTalkData';
import { characterMapping } from './characterMapping';
import { calculateCharacterRankTheory } from './characterRankTheory';
import { calculateChallengeHistory } from './challengeHistory';
import { buildNuiReleases } from './nuiAvailability';
import { cardReleaseAt, commonAreaAvailability, gameDay, gameDayStart } from './progression';
import rewards from '../data/progressionRewards.json';
import baseline from '../data/challengeBaseline20260930.json';

let cached;
export function loadCharacterRankTheory(now = Date.now()) {
    if (cached && now >= cached.at && now - cached.at < RANK_REFRESH_MS && gameDay(now) === gameDay(cached.at)) return cached.promise;
    const entry = { at: now };
    entry.promise = calculate(now).catch(error => { if (cached === entry) cached = null; throw error; });
    cached = entry;
    return entry.promise;
}
async function calculate(now) {
    const names = ['stamps', 'actionSets', 'characterArchiveVoices', 'musicVocals', 'cardEpisodes',
        'mysekaiFixtureTags', 'character2ds', 'ingameCutinCharacters', 'releaseConditions',
        'musics', 'unitStories', 'eventStories', 'events', 'storyMissions', 'worldBlooms',
        'cards', 'musicDifficulties', 'mysekaiMissionPasses', 'liveMissionPeriods', 'mysekaiLiveMissionRewardGameCharacters'];
    const [master, entries, apiCards, songs, catalog, metas, talks] = await Promise.all([
        loadRankMaster(),
        Promise.all(names.map(async name => [name, await fetchJsonWithTimeout(rankAssetUrl(`suite/${name}.json`))])),
        fetchJsonWithTimeout(rankApiUrl('cards')),
        fetchJsonWithTimeout(rankApiUrl('songs')),
        fetchJsonWithTimeout(rankAssetUrl('data/area_items.json')),
        getMusicMetas(),
        loadMysekaiTalkData({ language: 'ja' }),
    ]);
    const data = Object.fromEntries(entries);
    const cards = apiCards.map(card => ({ ...card, characterId: Number(characterMapping[card.character]?.id || card.characterId || 0),
        releaseAt: cardReleaseAt(card) })).filter(card => card.releaseAt <= now);
    const areaData = { ...data, songs, catalog, rewards };
    const common = commonAreaAvailability(areaData, now);
    const nuiReleases = buildNuiReleases({ passes: data.mysekaiMissionPasses, periods: data.liveMissionPeriods,
        characters: data.mysekaiLiveMissionRewardGameCharacters });
    const history = await calculateChallengeHistory({ cards, rawCards: data.cards, stages: master.stages, metas,
        difficulties: data.musicDifficulties, nuiReleases, areaData, now, baseline,
        yieldTask: () => new Promise(resolve => setTimeout(resolve, 0)) });
    const mySekaiTalkCounts = {};
    Object.values(talks.scenariosByFixture).flat().forEach(scenario => {
        (scenario.participantCharIds || [scenario.primaryCharacterId]).forEach(id => {
            (mySekaiTalkCounts[id] ||= new Set()).add(`${scenario.assetbundleName}:${scenario.lua}`);
        });
    });
    const calculationInputs = { cards, rawCards: data.cards, stamps: data.stamps, actionSets: data.actionSets,
        voices: data.characterArchiveVoices, musicVocals: data.musicVocals, cardEpisodes: data.cardEpisodes,
        mySekaiTalkCounts, ingameCutinCharacters: data.ingameCutinCharacters, releaseConditions: data.releaseConditions,
        sdToBaseIdMap: Object.fromEntries(data.character2ds.filter(row => row.characterType === 'game_character' && row.characterId).map(row => [row.id, row.characterId])),
        charIdToFixtureTagId: Object.fromEntries(data.mysekaiFixtureTags.filter(row => row.mysekaiFixtureTagType === 'game_character').map(row => [row.externalId, row.id])),
        fixtures: talks.fixtures, characterMissionsJP: master.missions, parameterGroups: master.groups, levelsData: master.levels,
        challengeState: { result: history }, commonArea: common, now, commonAreaLevel: common.level, rankDate: gameDayStart(gameDay(now)),
        texts: { MISSION: {}, UI: { CHALLENGE_EX: 'challenge_stage', ETC: 'etc' } },
    };
    const result = { included: {}, excluded: {} };
    for (let id = 1; id <= 26; id++) {
        await new Promise(resolve => setTimeout(resolve, 0));
        const character = calculateCharacterRankTheory({ ...calculationInputs, characterIds: [id] });
        Object.assign(result.included, character.included);
        Object.assign(result.excluded, character.excluded);
    }
    return { ...result, now, common, master };
}
