const SekaiCalculator = require('sekai-calculator');

console.log('--- SekaiCalculator Exports Keys ---');
console.log(Object.keys(SekaiCalculator));

try {
    const { NoteType, Judgment, MusicNoteType } = SekaiCalculator; // Guessing names
    console.log('--- NoteType ---');
    console.log(NoteType);

    console.log('--- Judgment ---');
    console.log(Judgment);

} catch (e) {
    console.log(e);
}

// Check what MusicMeta looks like for a real song to see units
const { LiveCalculator } = SekaiCalculator;
// Mock data provider
const mockProvider = {
    getMusicMeta: async () => [],
    getMasterData: async () => [],
    getUserData: async () => ({}),
    getUserDataAll: async () => ({})
};

const calc = new LiveCalculator(mockProvider);
// We can't really call getMusicMeta without real data provider, but we can check if there are static properties or enums attached to classes?
