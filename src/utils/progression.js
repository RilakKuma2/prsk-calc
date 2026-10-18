import { isRegularSong } from './songAvailability.js';

// JP game calendar (UTC+9). Each date includes its one available challenge play.
export const DAY_MS = 86_400_000;
export const CHALLENGE_START = Date.parse('2026-09-30T00:00:00+09:00');
export const COMMON_AREA_START = Date.parse('2026-09-30T15:00:00+09:00');
export const gameDay = time => Math.floor((Number(time) + 9 * 3_600_000) / DAY_MS);
export const gameDayStart = day => day * DAY_MS - 9 * 3_600_000;
export const gameDate = time => new Date(Number(time) + 9 * 3_600_000).toISOString().slice(0, 10);
export const cardReleaseAt = card => {
    if (Number(card.releaseAt) > 0) return Number(card.releaseAt);
    const parts = String(card.available_from || '').match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    return parts ? Date.parse(`${parts[1]}-${parts[2].padStart(2, '0')}-${parts[3].padStart(2, '0')}T00:00:00+09:00`) : Infinity;
};

// Birthday rewards use the anniversary cycle: October of the previous year through September.
export function birthdayRewardAvailable(birthday, cycleEndYear, now) {
    if (!birthday) return false;
    const [month, day] = birthday.split('.');
    const year = Number(month) >= 10 ? cycleEndYear - 1 : cycleEndYear;
    return Number(now) >= Date.parse(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00+09:00`);
}

// Same formula as prsk-calc/ChallengeStageTab, using score points rather than 만 units.
// Deluxe pass doubles both the base and score-derived challenge points.
export function challengePoints(score, pass = true) {
    return Math.floor((Math.floor(Number(score) * 24 / 100000) + 400
        + Math.floor(Number(score) / 200000) * 2) / (pass ? 1 : 2));
}

export function advanceChallenge(stages, gainedPoints, startRank = 151) {
    const rows = [...stages].sort((a, b) => a.rank - b.rank);
    if (!rows.some(row => row.rank === startRank)) throw new Error('챌린지 스테이지 데이터가 오래되었습니다.');
    let rank = startRank, remaining = Math.max(0, gainedPoints);
    let exp = rows.filter(row => row.rank < startRank).reduce((sum, row) => sum + row.completeStageCharacterExp, 0);
    for (const row of rows.filter(row => row.rank >= startRank)) {
        if (remaining < row.nextStageChallengePoint) break;
        remaining -= row.nextStageChallengePoint;
        exp += row.completeStageCharacterExp;
        rank = row.rank + 1;
    }
    const maxRank = rows.at(-1).rank;
    const isEx = rank > maxRank;
    return { rank, isEx, exp, points: isEx ? 0 : remaining,
        nextPoints: isEx ? 0 : rows.find(row => row.rank === rank).nextStageChallengePoint, maxRank };
}

// EX parameter groups store sparse ranges (seq .. next seq - 1), not cumulative requirements.
export function expandMissionParameters(rows, isEx = false) {
    const sorted = [...rows].sort((a, b) => a.seq - b.seq);
    if (!isEx) return sorted;
    let cumulative = 0;
    return sorted.flatMap((row, index) => Array.from({ length: (sorted[index + 1]?.seq ?? row.seq + 1) - row.seq }, (_, offset) => {
        cumulative += row.requirement;
        return { ...row, seq: row.seq + offset, requirement: cumulative };
    }));
}

// The same catalog powers automatic availability and manual theory-deck settings.
export function commonAreaEffect(catalog, requestedLevel) {
    const group = catalog.groups.find(g => g.category === 'common');
    if (!group) throw new Error('공용 에어리어 데이터가 없습니다.');
    const level = Math.min(Math.max(...group.rows.map(row => row.level)), Math.max(0, Math.trunc(Number(requestedLevel) || 0)));
    const row = group.rows.find(row => row.level === level);
    return { level, bonus: row?.effects.find(e => e.target === 'all')?.bonus[0] || 0,
        multiUnitBonus: row?.effects.find(e => e.target === 'multi_unit')?.bonus[0] || 0 };
}

// Compile release conditions once. Counting available content then takes binary
// searches instead of filtering all songs/stories again for every historical day.
export function prepareCommonAreaAvailability(data) {
    const { musics, songs, unitStories, eventStories, events, releaseConditions, storyMissions, catalog, rewards, worldBlooms = [] } = data;
    const conditions = new Map(releaseConditions.map(row => [row.id, row]));
    const finiteTime = value => Number.isFinite(Number(value)) ? Number(value) : Infinity;
    const rowTime = row => Math.max(row.publishedAt ? finiteTime(row.publishedAt) : -Infinity, row.startAt ? finiteTime(row.startAt) : -Infinity);
    const conditionTimes = new Map();
    const conditionTime = id => {
        if (conditionTimes.has(id)) return conditionTimes.get(id);
        const c = conditions.get(id);
        let time = -Infinity;
        if (c?.releaseConditionType === 'world_bloom_chapter_start' || c?.releaseConditionType === 'world_bloom_chapter_aggregate') {
            const chapters = worldBlooms.filter(ch => ch.eventId === c.releaseConditionTypeId && (!c.releaseConditionTypeId2 || ch.gameCharacterId === c.releaseConditionTypeId2));
            time = chapters.length ? Math.max(...chapters.map(ch => finiteTime(c.releaseConditionType === 'world_bloom_chapter_start' ? ch.chapterStartAt : ch.aggregateAt))) : Infinity;
        } else if (c?.releaseConditionType === 'time') time = finiteTime(c.releaseConditionTypeQuantity || c.releaseConditionTypeId);
        conditionTimes.set(id, time);
        return time;
    };
    const musicTimes = new Map(), mainTimes = new Map(), eventTimes = new Map();
    const add = (map, id, at) => map.set(id, Math.min(map.get(id) ?? Infinity, at));
    const eligible = new Set(songs.filter(isRegularSong).map(song => Number(song.id)));
    for (const music of musics) if (eligible.has(Number(music.id)) && music.publishedAt) add(musicTimes, Number(music.id), finiteTime(music.publishedAt));
    for (const unit of unitStories) for (const chapter of unit.chapters || []) {
        const chapterTime = rowTime(chapter);
        for (const episode of chapter.episodes || []) add(mainTimes, episode.id, Math.max(chapterTime, rowTime(episode), conditionTime(episode.releaseConditionId)));
    }
    const eventById = new Map(events.map(event => [event.id, event]));
    for (const story of eventStories) {
        const event = eventById.get(story.eventId);
        if (!event) continue;
        for (const episode of story.eventStoryEpisodes || []) add(eventTimes, episode.id,
            Math.max(finiteTime(event.startAt), rowTime(episode), conditionTime(episode.releaseConditionId)));
    }
    const sorted = map => [...map.values()].sort((a, b) => a - b);
    const musicDates = sorted(musicTimes), mainDates = sorted(mainTimes), eventDates = sorted(eventTimes);
    const storyDates = [...mainDates, ...eventDates].sort((a, b) => a - b);
    const countAt = (times, at) => {
        let lo = 0, hi = times.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (times[mid] <= at) lo = mid + 1; else hi = mid;
        }
        return lo;
    };
    const group = catalog.groups.find(g => g.category === 'common');
    if (!group) throw new Error('공용 에어리어 데이터가 없습니다.');
    const totals = { '283': 0, '284': 0 };
    const costs = [...group.rows].sort((a, b) => a.level - b.level).map(row => {
        for (const cost of row.costs) if (cost.resource in totals) totals[cost.resource] += cost.quantity;
        return { level: row.level, required: { ...totals },
            bonus: row.effects.find(e => e.target === 'all')?.bonus[0] || 0,
            multiUnitBonus: row.effects.find(e => e.target === 'multi_unit')?.bonus[0] || 0 };
    });
    const missions = [...storyMissions].sort((a, b) => a.requirement - b.requirement);
    let accumulated = 0;
    const missionTotals = missions.map(mission => accumulated += rewards.storyBoxes[mission.resourceBoxId] || 0);
    const requirements = missions.map(mission => mission.requirement);
    return (now = Date.now()) => {
        const musicCount = countAt(musicDates, now), mainStoryCount = countAt(mainDates, now), eventStoryCount = countAt(eventDates, now);
        const storyCount = mainStoryCount + eventStoryCount;
        const missionCount = countAt(requirements, storyCount);
        const available = { '283': musicCount * rewards.musicS, '284': missionCount ? missionTotals[missionCount - 1] : 0 };
        let level = 0, bonus = 0, multiUnitBonus = 0, used = { '283': 0, '284': 0 }, next = null;
        for (const row of costs) {
            if (now < COMMON_AREA_START || row.required['283'] > available['283'] || row.required['284'] > available['284']) {
                next = { level: row.level, required: { ...row.required }, missing: {
                    '283': Math.max(0, row.required['283'] - available['283']), '284': Math.max(0, row.required['284'] - available['284']) } };
                break;
            }
            ({ level, bonus, multiUnitBonus } = row);
            used = { ...row.required };
        }
        const musicNeeded = Math.ceil(used['283'] / rewards.musicS);
        const storyMission = used['284'] > 0 ? missionTotals.findIndex(total => total >= used['284']) : -1;
        const storiesNeeded = storyMission >= 0 ? requirements[storyMission] : 0;
        const levelReachedAt = level > 0 ? Math.max(COMMON_AREA_START,
            musicNeeded > 0 ? musicDates[musicNeeded - 1] : 0,
            storiesNeeded > 0 ? storyDates[storiesNeeded - 1] : 0) : null;
        return { level, levelReachedAt, bonus, multiUnitBonus, musicCount, mainStoryCount, eventStoryCount,
            storyCount, available, used, next, asOf: gameDate(now) };
    };
}

export function commonAreaAvailability(data, now = Date.now()) {
    return prepareCommonAreaAvailability(data)(now);
}

export const isFestival = card => ['블페', '페스(라이프)', '페스(판정)'].includes(card.skill_effect);
// Recompute only when a 4★ arrives in an attribute that already has a released festival
// for this character. A newly arriving festival establishes its own qualifying attribute.
export function challengeChangeDates(cards, now = Date.now()) {
    const festivals = cards.filter(isFestival);
    const days = new Set([gameDay(CHALLENGE_START)]);
    for (const card of cards) {
        const date = cardReleaseAt(card);
        if (Number(card.rarity) !== 4 || date <= CHALLENGE_START || date > now) continue;
        if (festivals.some(f => f.character === card.character && f.attribute === card.attribute && cardReleaseAt(f) <= date)) days.add(gameDay(date));
    }
    return [...days].sort((a, b) => a - b).map(gameDayStart);
}
