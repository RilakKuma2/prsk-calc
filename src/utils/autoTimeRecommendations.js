import { EventCalculator, EventType, LiveType } from 'sekai-calculator';
import { calculateScoreRange } from './calculator';
import { buildMusicMetaLookup } from './dataLoader';
import { getAutoEventPointMultiplier, normalizeAutoEnergy } from './autoEnergy';

export const AUTO_PLAY_LIMIT = 99;
export const AUTO_BETWEEN_PLAY_SECONDS = 30;

const AUTO_DIFFICULTIES = ['easy', 'normal', 'hard', 'expert', 'master', 'append'];
const AUTO_DIFFICULTY_PRIORITY = AUTO_DIFFICULTIES.reduce((priorities, difficulty, index) => {
    priorities[difficulty] = index;
    return priorities;
}, {});

const normalizePower = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 293231;
    return parsed < 1000 ? parsed * 10000 : parsed;
};

const normalizeSkill = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const normalizeEventBonus = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 250;
};

/**
 * Uses the same score / EP calculation as the Auto tab's all-songs view.
 * The 30-second inter-song time matches the Auto tab's 99-play duration.
 */
export const getAutoTimeSongPerformances = ({
    songs = [],
    musicMetas = [],
    autoDeck = {},
    energyUsed = 1,
}) => {
    const musicMetaLookup = buildMusicMetaLookup(musicMetas);
    const totalPower = normalizePower(autoDeck.totalPower);
    const skills = [
        normalizeSkill(autoDeck.skillLeader, 120),
        normalizeSkill(autoDeck.skillMember2, 100),
        normalizeSkill(autoDeck.skillMember3, 100),
        normalizeSkill(autoDeck.skillMember4, 100),
        normalizeSkill(autoDeck.skillMember5, 100),
    ];
    const eventBonus = normalizeEventBonus(autoDeck.eventBonus);
    const autoMultiplier = getAutoEventPointMultiplier(normalizeAutoEnergy(energyUsed));

    return songs.flatMap(song => {
        const songLength = Math.floor(Number(song.length) || 0);
        const playDurationSeconds = songLength + AUTO_BETWEEN_PLAY_SECONDS;
        if (songLength <= 0 || playDurationSeconds <= 0) return [];

        let best = null;
        for (const difficulty of AUTO_DIFFICULTIES) {
            const musicMeta = musicMetaLookup.get(`${Number(song.id)}:${difficulty}`);
            if (!musicMeta) continue;

            try {
                const range = calculateScoreRange({
                    songId: song.id,
                    difficulty,
                    totalPower,
                    skillLeader: skills[0],
                    skillMember2: skills[1],
                    skillMember3: skills[2],
                    skillMember4: skills[3],
                    skillMember5: skills[4],
                    musicMeta,
                }, LiveType.AUTO);
                if (!range) continue;

                const eventPoint = Number(EventCalculator.getEventPoint(
                    LiveType.AUTO,
                    EventType.MARATHON,
                    range.max,
                    musicMeta.event_rate,
                    eventBonus,
                    autoMultiplier,
                ));
                if (!Number.isFinite(eventPoint) || eventPoint <= 0) continue;

                // The calculated score can be identical on several difficulties.
                // In that case keep the highest available chart (MAS over EX, APD over MAS).
                if (
                    !best
                    || eventPoint > best.eventPoint
                    || (
                        eventPoint === best.eventPoint
                        && AUTO_DIFFICULTY_PRIORITY[difficulty] > AUTO_DIFFICULTY_PRIORITY[best.difficulty]
                    )
                ) {
                    best = { difficulty, eventPoint };
                }
            } catch {
                // Keep the all-songs calculation resilient when a song has incomplete metadata.
            }
        }

        if (!best) return [];

        return [{
            song,
            difficulty: best.difficulty,
            eventPointPerPlay: best.eventPoint,
            playDurationSeconds,
        }];
    });
};

// Mirrors AutoTab's "Hide Inefficient Songs" rule: a song is omitted when a
// faster-or-equal song already earns at least as many event points per play.
export const filterInefficientAutoTimePerformances = (performances = []) => {
    const efficiencySorted = [...performances].sort((a, b) => (
        b.eventPointPerPlay - a.eventPointPerPlay
        || a.playDurationSeconds - b.playDurationSeconds
        || a.song.id - b.song.id
    ));
    const efficient = [];
    let shortestDuration = Infinity;

    for (const performance of efficiencySorted) {
        if (performance.playDurationSeconds <= shortestDuration) {
            efficient.push(performance);
            shortestDuration = performance.playDurationSeconds;
        }
    }

    return efficient;
};

export const rankAutoTimeRecommendations = ({
    performances = [],
    availableSeconds = 0,
    hideInefficient = false,
}) => {
    const timeLimit = Math.max(0, Math.floor(Number(availableSeconds) || 0));
    if (!timeLimit) return [];

    const visiblePerformances = hideInefficient
        ? filterInefficientAutoTimePerformances(performances)
        : performances;

    return visiblePerformances.map(performance => {
        const playCount = Math.min(
            AUTO_PLAY_LIMIT,
            Math.floor(timeLimit / performance.playDurationSeconds),
        );
        if (playCount <= 0) return null;

        return {
            ...performance,
            totalEventPoint: performance.eventPointPerPlay * playCount,
            playCount,
            totalDurationSeconds: performance.playDurationSeconds * playCount,
        };
    }).filter(Boolean).sort((a, b) => (
        b.totalEventPoint - a.totalEventPoint
        || b.eventPointPerPlay - a.eventPointPerPlay
        || a.playDurationSeconds - b.playDurationSeconds
    ));
};

export const getAutoTimeRecommendations = ({ availableSeconds, ...settings }) => (
    rankAutoTimeRecommendations({
        performances: getAutoTimeSongPerformances(settings),
        availableSeconds,
    })
);
