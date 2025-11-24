import { calculateScoreRange } from './calculator';
import { SONG_OPTIONS } from './songs';

describe('calculateScoreRange', () => {
    test('calculates score for a specific song and difficulty', () => {
        const input = {
            songId: 74, // Envy
            difficulty: 'master',
            totalPower: 200000,
            skillLeader: 100,
            skillMember2: 100,
            skillMember3: 100,
            skillMember4: 100,
            skillMember5: 100,
        };

        const result = calculateScoreRange(input);
        expect(result).not.toBeNull();
        expect(result.min).toBeGreaterThan(0);
        expect(result.max).toBeGreaterThanOrEqual(result.min);
        console.log('Result:', result);
    });

    test('batch calculation for first 5 songs', () => {
        const difficulties = ['easy', 'normal', 'hard', 'expert', 'master', 'append'];
        let successCount = 0;

        SONG_OPTIONS.slice(0, 5).forEach(song => {
            difficulties.forEach(diff => {
                const input = {
                    songId: song.id,
                    difficulty: diff,
                    totalPower: 200000,
                    skillLeader: 100,
                    skillMember2: 100,
                    skillMember3: 100,
                    skillMember4: 100,
                    skillMember5: 100,
                };

                // Some songs might not have 'append' difficulty, so we expect null for those
                // But for standard difficulties it should work
                const result = calculateScoreRange(input);
                if (result) {
                    successCount++;
                }
            });
        });

        console.log(`Successfully calculated ${successCount} results`);
        expect(successCount).toBeGreaterThan(0);
    });
});
