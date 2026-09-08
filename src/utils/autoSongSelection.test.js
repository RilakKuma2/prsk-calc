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
});
