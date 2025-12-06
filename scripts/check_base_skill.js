const SekaiCalculator = require('sekai-calculator');

console.log('--- SekaiCalculator Exports ---');
console.log(Object.keys(SekaiCalculator));

const { LiveCalculator, LiveType, MusicTag, NoteType, Judgment, Chart } = SekaiCalculator;

console.log('--- LiveCalculator Prototype/Methods ---');
try {
    console.log(Object.getOwnPropertyNames(LiveCalculator.prototype || LiveCalculator));
} catch (e) {
    console.log('Error inspecting LiveCalculator:', e.message);
}

console.log('--- Checking for specific calculation methods ---');
// Check if we can find anything related to 'base' or 'skill' score
function checkProperties(obj, name) {
    if (!obj) return;
    const props = Object.getOwnPropertyNames(obj);
    const relevant = props.filter(p =>
        p.toLowerCase().includes('base') ||
        p.toLowerCase().includes('skill') ||
        p.toLowerCase().includes('score')
    );
    if (relevant.length > 0) {
        console.log(`Relevant properties in ${name}:`, relevant);
    }
}

checkProperties(LiveCalculator, 'LiveCalculator');
checkProperties(SekaiCalculator, 'SekaiCalculator');

// If there is a Chart parser or similar
if (Chart) {
    console.log('--- Chart Exports ---');
    console.log(Object.keys(Chart));
}

// Try to calculate score breakdown if possible
console.log('--- Attempting to create a calculation to see results ---');
try {
    const dummyDeck = {
        totalPower: 200000,
        skills: [{ effect: 'score_up', value: 100, duration: 5 }]
    };
    // This is hypothetical usage
    // const result = LiveCalculator.calculate(...) 
} catch (e) { }
