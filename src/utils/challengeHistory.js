import { prepareChallengeDecks, evaluateChallengeDecks } from './challengeTheory.js';
import { advanceChallenge, cardReleaseAt, challengeChangeDates, challengePoints, prepareCommonAreaAvailability,
    gameDay, gameDayStart, CHALLENGE_START, COMMON_AREA_START, DAY_MS, gameDate } from './progression.js';
import { characterMapping } from './characterMapping.js';
import { nuiStatsAt } from './nuiAvailability.js';
import { readChallengeBaseline } from './challengeBaseline.js';

// Wall-clock time within an unchanged game day cannot change the result. Keep
// actual release boundaries so returning after a same-day release still updates it.
export function challengeHistoryAsOf({ cards, rawCards, nuiReleases = [], difficulties, areaData, now }) {
    let asOf = gameDayStart(gameDay(now));
    const include = time => { if (Number(time) <= now) asOf = Math.max(asOf, Number(time) || 0); };
    include(COMMON_AREA_START);
    cards.forEach(card => include(cardReleaseAt(card)));
    rawCards.forEach(card => include(card.releaseAt));
    nuiReleases.forEach(row => include(row.releaseAt));
    const releasedRows = [...difficulties, ...areaData.musics, ...areaData.events,
        ...areaData.unitStories.flatMap(story => (story.chapters || []).flatMap(chapter => [chapter, ...(chapter.episodes || [])])),
        ...areaData.eventStories.flatMap(story => story.eventStoryEpisodes || [])];
    releasedRows.forEach(row => { include(row.publishedAt); include(row.startAt); });
    (areaData.worldBlooms || []).forEach(chapter => { include(chapter.chapterStartAt); include(chapter.aggregateAt); });
    areaData.releaseConditions.forEach(condition => {
        if (condition.releaseConditionType === 'time') include(condition.releaseConditionTypeQuantity || condition.releaseConditionTypeId);
    });
    return asOf;
}

export async function calculateChallengeHistory({ cards, rawCards, stages, metas, difficulties, nuiReleases = [], areaData, now,
    baseline = null, onDeckCalculated, yieldTask = () => Promise.resolve(), cancelled = () => false }) {
    const releaseMap = new Map(rawCards.map(c => [Number(c.id), c.releaseAt]));
    const datedCards = cards.map(c => ({ ...c, releaseAt: releaseMap.get(Number(c.id)) || cardReleaseAt(c) }));
    const uniqueNames = Object.keys(characterMapping).filter((name, index, all) => all.findIndex(n => characterMapping[n].id === characterMapping[name].id) === index);
    const histories = {};
    const commonAt = prepareCommonAreaAvailability(areaData);
    let lastYield = performance.now();
    const contextByDay = new Map();
    const chartMetas = [[11, 'append'], [141, 'append'], [610, 'master']].map(([id, difficulty]) => ({
        chart: difficulties.find(d => d.musicId === id && d.musicDifficulty === difficulty),
        meta: metas.find(m => m.music_id === id && m.difficulty === difficulty),
    }));
    const getContext = day => {
        if (!contextByDay.has(day)) {
            const at = Math.min(now, gameDayStart(day + 1) - 1);
            const [viva, gunjo, polar] = chartMetas.map(({ chart, meta }) =>
                chart && (!chart.publishedAt || chart.publishedAt <= at) ? meta : null);
            contextByDay.set(day, { common: commonAt(at), autoMetas: { viva, gunjo, polar }, at });
        }
        return contextByDay.get(day);
    };
    // Card candidates change only on qualifying releases. Common-area growth can
    // change independently as songs/stories launch, so split those periods too.
    const areaDates = [];
    let previousArea = null;
    for (let day = gameDay(CHALLENGE_START); day <= gameDay(now); day++) {
        const area = getContext(day).common;
        if (area.level !== previousArea) areaDates.push(gameDayStart(day));
        previousArea = area.level;
    }
    for (const name of uniqueNames) {
        if (cancelled()) return null;
        const charId = Number(characterMapping[name].id);
        const charCards = datedCards.filter(c => Number(c.characterId || characterMapping[c.character]?.id) === charId);
        const cardDates = challengeChangeDates(charCards, now);
        const nuiDates = nuiReleases.filter(row => row.characterId === charId && row.releaseAt > CHALLENGE_START && row.releaseAt <= now)
            .map(row => gameDayStart(gameDay(row.releaseAt)));
        const dates = [...new Set([...cardDates, ...areaDates, ...nuiDates])].sort((a, b) => a - b);
        let points = 0;
        let prepared = null, preparedDate = null;
        const periods = [];
        for (let i = 0; i < dates.length; i++) {
            if (cancelled()) return null;
            const context = getContext(gameDay(dates[i]));
            // Include releases during this date, never a card from a later date.
            const lastCardDate = cardDates.filter(date => date <= dates[i]).at(-1);
            const cardsAt = Math.min(now, lastCardDate + DAY_MS - 1);
            const eligible = charCards.filter(c => cardReleaseAt(c) <= cardsAt);
            const { common, autoMetas, at } = context;
            if (!autoMetas.viva && !autoMetas.gunjo && !autoMetas.polar) throw new Error('해당 날짜의 챌린지 메타데이터가 없습니다.');
            context.nuiStats ??= nuiStatsAt(nuiReleases, at);
            const inputs = { data: eligible, characterNames: [name], autoMetas,
                commonAreaBonus: common.bonus, commonMultiUnitBonus: common.multiUnitBonus, nuiStats: context.nuiStats };
            const saved = await readChallengeBaseline(baseline, gameDate(dates[i]), charId, inputs);
            if (!saved && preparedDate !== lastCardDate) {
                prepared = prepareChallengeDecks({ ...inputs, previous: prepared });
                preparedDate = lastCardDate;
            }
            const deck = saved || evaluateChallengeDecks(prepared, inputs)[0];
            if (!deck || deck.envyScore <= 0) throw new Error(`${name}의 당시 이론덱을 계산하지 못했습니다.`);
            await onDeckCalculated?.({ characterId: charId, date: gameDate(dates[i]), inputs, deck, cached: Boolean(saved) });
            const until = i + 1 < dates.length ? dates[i + 1] - 1 : now;
            const days = gameDay(until) - gameDay(dates[i]) + 1;
            const dailyPoints = challengePoints(deck.envyScore);
            points += days * dailyPoints;
            periods.push({ from: gameDate(dates[i]), to: gameDate(until), days, score: deck.envyScore, dailyPoints,
                cardIds: deck.members.map(c => c.id), commonLevel: common.level, nuiPercent: context.nuiStats.charSets[String(charId).padStart(2, '0')] });
            // Yield by elapsed work rather than delaying every character. This
            // also bounds long histories within one character on slower phones.
            if (performance.now() - lastYield >= 8) {
                await yieldTask();
                if (cancelled()) return null;
                lastYield = performance.now();
            }
        }
        const characterStages = stages.filter(s => s.characterId === charId);
        const progress = advanceChallenge(characterStages, points);
        const lastRankUpAt = challengeLastRankUpAt(characterStages, progress.rank, periods);
        histories[charId] = { ...progress, lastRankUpAt, gainedPoints: points, periods };
    }
    return histories;
}


// Locate the play that crossed the final completed-stage threshold, rather than
// using the last card release or the last day in the score history.
export function challengeLastRankUpAt(stages, rank, periods) {
    let remaining = stages.filter(stage => stage.rank >= 151 && stage.rank < rank)
        .reduce((sum, stage) => sum + stage.nextStageChallengePoint, 0);
    if (remaining <= 0) return CHALLENGE_START;
    for (const period of periods) {
        if (period.dailyPoints > 0 && remaining <= period.days * period.dailyPoints) {
            const offset = Math.ceil(remaining / period.dailyPoints) - 1;
            return Date.parse(`${period.from}T00:00:00+09:00`) + offset * DAY_MS;
        }
        remaining -= period.days * period.dailyPoints;
    }
    return CHALLENGE_START;
}
