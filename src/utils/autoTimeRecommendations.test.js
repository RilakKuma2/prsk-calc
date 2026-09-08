import {
    AUTO_PLAY_LIMIT,
    filterInefficientAutoTimePerformances,
    getEfficientAutoHourlyPerformances,
    getAutoTimeSongPerformances,
    getAutoTimeRecommendations,
} from './autoTimeRecommendations';
import { calculateScoreRange } from './calculator';
import { EventCalculator } from 'sekai-calculator';

jest.mock('sekai-calculator', () => ({
    EventCalculator: {
        getEventPoint: jest.fn((liveType, eventType, score, rate, bonus, multiplier) => score * multiplier),
    },
    EventType: { MARATHON: 'MARATHON' },
    LiveType: { AUTO: 'AUTO' },
}));

jest.mock('./calculator', () => ({
    calculateScoreRange: jest.fn(({ songId }) => ({ min: songId * 100, max: songId * 100 })),
}));

jest.mock('./dataLoader', () => ({
    buildMusicMetaLookup: metas => new Map(
        metas.map(meta => [`${meta.music_id}:${meta.difficulty}`, meta]),
    ),
}));

jest.mock('./autoEnergy', () => ({
    getAutoEventPointMultiplier: () => 5,
    normalizeAutoEnergy: value => Number(value) || 1,
}));

const songs = [
    { id: 1, name: '짧은 곡', length: 60 },
    { id: 2, name: '긴 곡', length: 120 },
];

const musicMetas = songs.map(song => ({
    music_id: song.id,
    difficulty: 'easy',
    event_rate: 100,
    skill_score_auto: [1, 1, 1, 1, 1],
}));

describe('getAutoTimeRecommendations', () => {
    beforeEach(() => {
        calculateScoreRange.mockImplementation(({ songId }) => ({ min: songId * 100, max: songId * 100 }));
        EventCalculator.getEventPoint.mockImplementation((liveType, eventType, score, rate, bonus, multiplier) => score * multiplier);
    });

    test('ranks songs by EP obtainable within the entered time', () => {
        const results = getAutoTimeRecommendations({
            songs,
            musicMetas,
            availableSeconds: 60 * 60 * 2,
        });

        expect(calculateScoreRange).toHaveBeenCalled();
        expect(EventCalculator.getEventPoint).toHaveBeenCalled();
        expect(results.map(result => result.song.id)).toEqual([2, 1]);
        expect(results[0]).toMatchObject({
            playCount: 48,
            playDurationSeconds: 150,
            totalDurationSeconds: 7200,
            totalEventPoint: 48000,
        });
        expect(results[1]).toMatchObject({
            playCount: 80,
            playDurationSeconds: 90,
            totalDurationSeconds: 7200,
            totalEventPoint: 40000,
        });
    });

    test('never schedules more than 99 auto plays', () => {
        const results = getAutoTimeRecommendations({
            songs,
            musicMetas,
            availableSeconds: 60 * 60 * 24,
        });

        expect(results).toHaveLength(2);
        expect(results.every(result => result.playCount === AUTO_PLAY_LIMIT)).toBe(true);
    });

    test('uses the highest difficulty when auto event points are tied', () => {
        const sameScoreMetas = ['expert', 'master'].map(difficulty => ({
            music_id: 1,
            difficulty,
            event_rate: 100,
            skill_score_auto: [1, 1, 1, 1, 1],
        }));

        const results = getAutoTimeRecommendations({
            songs: [songs[0]],
            musicMetas: sameScoreMetas,
            availableSeconds: 600,
        });

        expect(results[0].difficulty).toBe('master');
    });

    test('hides a strictly slower and lower-point auto song', () => {
        const visible = filterInefficientAutoTimePerformances([
            { song: { id: 1 }, eventPointPerPlay: 1000, playDurationSeconds: 120 },
            { song: { id: 2 }, eventPointPerPlay: 900, playDurationSeconds: 150 },
            { song: { id: 3 }, eventPointPerPlay: 800, playDurationSeconds: 90 },
        ]);

        expect(visible.map(result => result.song.id)).toEqual([1, 3]);
    });

    test('excludes movie-only songs and keeps the best score per integer duration', () => {
        calculateScoreRange.mockImplementation(({ songId }) => ({ min: songId, max: songId }));
        const selectionSongs = [
            { id: 709, name: '기간 한정곡', length: 100.2 },
            { id: 10, name: '낮은 점수', length: 120.1 },
            { id: 11, name: '높은 점수', length: 120.9 },
            { id: 12, name: '다른 길이', length: 121.0 },
        ];
        const selectionMetas = selectionSongs.map(song => ({
            music_id: song.id,
            difficulty: 'easy',
            event_rate: 100,
            skill_score_auto: [1, 1, 1, 1, 1],
        }));

        const performances = getAutoTimeSongPerformances({
            songs: selectionSongs,
            musicMetas: selectionMetas,
        });

        expect(performances.map(result => result.song.id)).toEqual([11, 12]);
    });

    test('reports hourly plays and points only for efficient songs', () => {
        const hourly = getEfficientAutoHourlyPerformances([
            { song: { id: 1 }, difficulty: 'master', eventPointPerPlay: 1000, playDurationSeconds: 120 },
            { song: { id: 2 }, difficulty: 'master', eventPointPerPlay: 900, playDurationSeconds: 150 },
            { song: { id: 3 }, difficulty: 'expert', eventPointPerPlay: 800, playDurationSeconds: 90 },
        ], 'plays');

        expect(hourly.map(result => result.song.id)).toEqual([3, 1]);
        expect(hourly[0]).toMatchObject({ playsPerHour: 40, eventPointsPerHour: 32000 });
        expect(hourly[1]).toMatchObject({ playsPerHour: 30, eventPointsPerHour: 30000 });
    });
});
