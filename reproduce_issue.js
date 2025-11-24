const { calculateScoreRange } = require('./src/utils/calculator');
const { SONG_OPTIONS } = require('./src/utils/songs');

// Mock data
const input = {
    songId: 74,
    difficulty: 'master',
    totalPower: 200000,
    skillLeader: 100,
    skillMember2: 100,
    skillMember3: 100,
    skillMember4: 100,
    skillMember5: 100,
};

console.log('Testing single calculation...');
try {
    const result = calculateScoreRange(input);
    console.log('Result:', result);
} catch (e) {
    console.error('Error:', e);
}

console.log('\nTesting batch calculation (first 5 songs)...');
const difficulties = ['easy', 'normal', 'hard', 'expert', 'master', 'append'];
let count = 0;

SONG_OPTIONS.slice(0, 5).forEach(song => {
    difficulties.forEach(diff => {
        const batchInput = { ...input, songId: song.id, difficulty: diff };
        try {
            const res = calculateScoreRange(batchInput);
            if (res) {
                console.log(`[${song.name} - ${diff}] Min: ${res.min}, Max: ${res.max}`);
                count++;
            }
        } catch (e) {
            // console.error(`Failed: ${song.name} ${diff}`, e.message);
        }
    });
});

console.log(`\nSuccessfully calculated ${count} results.`);
