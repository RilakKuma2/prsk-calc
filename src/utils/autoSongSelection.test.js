import {
    isAutoSongExcluded,
    keepBestAutoSongPerWholeSecond,
} from './autoSongSelection';

describe('auto song selection', () => {
    test('excludes the movie-only Disappearance song', () => {
        expect(isAutoSongExcluded(709)).toBe(true);
        expect(isAutoSongExcluded({ id: '709' })).toBe(true);
        expect(isAutoSongExcluded(708)).toBe(false);
    });

    test('keeps only the highest score for the same integer duration', () => {
        const results = keepBestAutoSongPerWholeSecond([
            { songId: 1, durationSeconds: 120.1, score: 900 },
            { songId: 2, durationSeconds: 120.9, score: 1100 },
            { songId: 3, durationSeconds: 121.0, score: 800 },
        ]);

        expect(results.map(result => result.songId)).toEqual([2, 3]);
    });

    test('always keeps Creation Myth over Melt in the same duration bucket', () => {
        const creationFirst = keepBestAutoSongPerWholeSecond([
            { songId: 186, durationSeconds: 182.1, score: 900 },
            { songId: 47, durationSeconds: 182.9, score: 1100 },
            { songId: 48, durationSeconds: 183.0, score: 800 },
        ]);
        const meltFirst = keepBestAutoSongPerWholeSecond([
            { songId: 47, durationSeconds: 182.9, score: 1100 },
            { songId: 186, durationSeconds: 182.1, score: 900 },
        ]);

        expect(creationFirst.map(result => result.songId)).toEqual([186, 48]);
        expect(meltFirst.map(result => result.songId)).toEqual([186]);
    });
});
