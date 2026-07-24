import { calculateScoreRange } from './calculator';
import { ESSENTIAL_MUSIC_METAS } from '../data/essentialMusicMetas';

const baseInput = {
    totalPower: 200000,
    skillLeader: 100,
    skillMember2: 100,
    skillMember3: 100,
    skillMember4: 100,
    skillMember5: 100,
};

describe('calculateScoreRange', () => {
    test('calculates score for a specific song and difficulty', () => {
        const musicMeta = ESSENTIAL_MUSIC_METAS[0];
        const input = {
            ...baseInput,
            songId: musicMeta.music_id,
            difficulty: musicMeta.difficulty,
            musicMeta,
        };

        const result = calculateScoreRange(input);
        expect(result).not.toBeNull();
        expect(result.min).toBeGreaterThan(0);
        expect(result.max).toBeGreaterThanOrEqual(result.min);
    });

    test('batch calculation for first 5 songs', () => {
        const results = ESSENTIAL_MUSIC_METAS.map(musicMeta => {
            return calculateScoreRange({
                ...baseInput,
                songId: musicMeta.music_id,
                difficulty: musicMeta.difficulty,
                musicMeta,
            });
        });
        expect(results).toHaveLength(ESSENTIAL_MUSIC_METAS.length);
        expect(results.every(Boolean)).toBe(true);
        expect(results.every(result => result.max >= result.min && result.min > 0)).toBe(true);
    });
});
