import { LiveCalculator, LiveType } from 'sekai-calculator';
import fs from 'fs';

const musicMetas = JSON.parse(fs.readFileSync('./src/data/music_metas.json', 'utf8'));

// Helper to create a dummy card
const createDummyCard = (skillScoreUp, power) => {
    return {
        cardId: 1,
        level: 50,
        masterRank: 0,
        specialTrainingStatus: 'done',
        defaultPower: power,
        skillId: 1,
        skillLevel: 4,
        skillName: 'Score Up',
        skillShortDescription: `Score +${skillScoreUp}%`,
        skillDescription: `5초간 스코어가 ${skillScoreUp}% 상승한다`,
        skillEffectType: 'score_up',
        skillEffectValue: skillScoreUp,
        skillEffectDuration: 5,
        cardName: 'Dummy Card',
        characterName: 'Miku',
        characterId: 1,
        unitId: 1,
        attribute: 'cute',
        scoreUp: skillScoreUp,
    };
};

// Helper to create DeckDetail
const createDeckDetail = (totalPower, skills) => {
    const avgPower = Math.floor(totalPower / 5);
    const remainder = totalPower % 5;

    const cards = skills.map((skill, index) => {
        const power = avgPower + (index < remainder ? 1 : 0);
        return createDummyCard(skill, power);
    });

    const deckPower = {
        base: totalPower,
        areaItemBonus: 0,
        characterBonus: 0,
        honorBonus: 0,
        fixtureBonus: 0,
        gateBonus: 0,
        total: totalPower
    };

    return {
        deckId: 1,
        deckName: 'Auto Calc Deck',
        cards: cards,
        leader: cards[0],
        subLeader: cards[1],
        power: deckPower,
    };
};

const constructSkillDetails = (orderedSkills, baseCards) => {
    const availableCards = [...baseCards];
    const skillDetails = [];

    for (let i = 0; i < 5; i++) {
        const targetVal = orderedSkills[i];
        const cardIndex = availableCards.findIndex(c => c.skillEffectValue === targetVal);
        if (cardIndex === -1) {
            skillDetails.push({ ...availableCards[0], skill: availableCards[0] });
        } else {
            const card = availableCards[cardIndex];
            skillDetails.push({ ...card, skill: card });
            availableCards.splice(cardIndex, 1);
        }
    }

    skillDetails.push({ ...baseCards[0], skill: baseCards[0] });

    return skillDetails;
};

const calculateScoreRange = (input, liveType = LiveType.AUTO) => {
    const {
        songId,
        difficulty,
        totalPower,
        skillLeader,
        skillMember2,
        skillMember3,
        skillMember4,
        skillMember5,
    } = input;

    const musicMeta = musicMetas.find(m => m.music_id === songId && m.difficulty === difficulty);

    if (!musicMeta) return null;

    let skillScoreCoeffs = [];
    if (liveType === LiveType.SOLO) {
        skillScoreCoeffs = musicMeta.skill_score_solo;
    } else if (liveType === LiveType.AUTO) {
        skillScoreCoeffs = musicMeta.skill_score_auto;
    } else {
        skillScoreCoeffs = musicMeta.skill_score_multi;
    }

    if (!skillScoreCoeffs || skillScoreCoeffs.length < 6) return null;

    const skillCoeffs = skillScoreCoeffs.slice(0, 5).map((val, idx) => ({ val, idx }));
    const userSkills = [skillLeader, skillMember2, skillMember3, skillMember4, skillMember5];

    const baseDeck = createDeckDetail(totalPower, userSkills);
    const baseCards = baseDeck.cards;

    const sortedCoeffsDesc = [...skillCoeffs].sort((a, b) => b.val - a.val);
    const sortedSkillsDesc = [...userSkills].sort((a, b) => b - a);

    const maxOrderSkills = new Array(5);
    for (let i = 0; i < 5; i++) {
        const slotIndex = sortedCoeffsDesc[i].idx;
        maxOrderSkills[slotIndex] = sortedSkillsDesc[i];
    }

    const skillDetailsMax = constructSkillDetails(maxOrderSkills, baseCards);

    let maxScore = 0;
    try {
        const maxLiveDetail = LiveCalculator.getLiveDetailByDeck(
            baseDeck,
            musicMeta,
            liveType,
            skillDetailsMax
        );
        maxScore = maxLiveDetail.score;
    } catch (e) {
        return null;
    }

    return maxScore;
};

const run = () => {
    const totalPower = 413349;
    const skillLeader = 140;
    const skillMember2 = 120;
    const skillMember3 = 80;
    const skillMember4 = 100;
    const skillMember5 = 80;

    const results = [];

    musicMetas.forEach(meta => {
        if (meta.difficulty !== 'master' && meta.difficulty !== 'append') return;

        const score = calculateScoreRange({
            songId: meta.music_id,
            difficulty: meta.difficulty,
            totalPower,
            skillLeader,
            skillMember2,
            skillMember3,
            skillMember4,
            skillMember5,
        }, LiveType.SOLO);

        if (score) {
            results.push({
                id: meta.music_id,
                difficulty: meta.difficulty,
                score
            });
        }
    });

    results.sort((a, b) => b.score - a.score);
    const top50 = results.slice(0, 50);

    console.log('const TARGET_SONGS = [');
    top50.forEach(item => {
        console.log(`    { id: ${item.id}, difficulty: '${item.difficulty}' }, // Score: ${item.score}`);
    });
    console.log('];');
};

run();
