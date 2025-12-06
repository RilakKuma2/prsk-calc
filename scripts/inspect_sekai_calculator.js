const SekaiCalculator = require('sekai-calculator');
console.log('--- All Exports ---');
console.log(Object.keys(SekaiCalculator));

const { LiveCalculator, LiveType } = SekaiCalculator;
const musicMetas = require('./src/data/music_metas.json');

// Mock Music Meta (first one)
const musicMeta = musicMetas[0];

// Mock Card
const dummyCard = {
    cardId: 1,
    level: 50,
    masterRank: 0,
    specialTrainingStatus: 'done',
    defaultPower: 30000,
    skillId: 1,
    skillLevel: 4,
    skillName: 'Score Up',
    skillShortDescription: `Score +100%`,
    skillDescription: `5초간 스코어가 100% 상승한다`,
    skillEffectType: 'score_up',
    skillEffectValue: 100,
    skillEffectDuration: 5,
    cardName: 'Dummy Card',
    characterName: 'Miku',
    characterId: 1,
    unitId: 1,
    attribute: 'cute',
    scoreUp: 100,
};

// Mock Deck
const deck = {
    deckId: 1,
    deckName: 'Auto Calc Deck',
    cards: [dummyCard, dummyCard, dummyCard, dummyCard, dummyCard],
    leader: dummyCard,
    subLeader: dummyCard,
    power: {
        base: 150000,
        areaItemBonus: 0,
        characterBonus: 0,
        honorBonus: 0,
        fixtureBonus: 0,
        gateBonus: 0,
        total: 150000
    }
};

const skillDetails = [
    { ...deck.cards[1], skill: deck.cards[1] },
    { ...deck.cards[2], skill: deck.cards[2] },
    { ...deck.cards[3], skill: deck.cards[3] },
    { ...deck.cards[4], skill: deck.cards[4] },
    { ...deck.cards[0], skill: deck.cards[0] },
    { ...deck.cards[0], skill: deck.cards[0] },
];

const { EventCalculator, EventType } = SekaiCalculator;

console.log('--- EventType ---');
console.log(EventType);

console.log('--- Testing getEventPoint ---');
try {
    // Signature: getEventPoint(liveType, eventType, selfScore, musicRate = 100, deckBonus = 0, boostRate = 1, otherScore = 0, life = 1000)

    const score = 1000000;
    const musicRate = 100;
    const bonus = 2.5; // 250%? Or 250?
    const boost = 15; // 3 energy = 15x?

    // Test SOLO vs AUTO
    const resultSolo = EventCalculator.getEventPoint(LiveType.SOLO, 'marathon', score, musicRate, 250, 15);
    console.log('Result SOLO (250%, 15x):', resultSolo);

    const resultAuto = EventCalculator.getEventPoint(LiveType.AUTO, 'marathon', score, musicRate, 250, 15);
    console.log('Result AUTO (250%, 15x):', resultAuto);

    // Test Boost Rate 3 vs 15
    const resultBoost3 = EventCalculator.getEventPoint(LiveType.AUTO, 'marathon', score, musicRate, 250, 3);
    console.log('Result AUTO (250%, 3x?):', resultBoost3);

} catch (e) {
    console.log('Error testing getEventPoint:', e.message);
}
