import { LiveCalculator, LiveType } from 'sekai-calculator';
import { getMusicMetasSync } from './dataLoader';

// Helper to create a dummy card
export const createDummyCard = (skillScoreUp, power) => {
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
        scoreUp: skillScoreUp, // Required by sekai-calculator for explicit skill details
    };
};

// Helper to create DeckDetail
export const createDeckDetail = (totalPower, skills) => {
    const avgPower = Math.floor(totalPower / 5);
    // Distribute remainder to first cards to match total exactly
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
        power: deckPower, // Required by sekai-calculator
    };
};

export const calculateScoreRange = (input, liveType = LiveType.AUTO) => {
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

    const musicMetas = getMusicMetasSync();
    const musicMeta = musicMetas.find(m => m.music_id === songId && m.difficulty === difficulty);

    if (!musicMeta) {
        console.error(`Calculator: Music meta not found for ID: ${songId}, Difficulty: ${difficulty}`);
        return null;
    }

    // Determine which skill score array to use
    let skillScoreCoeffs = [];
    if (liveType === LiveType.SOLO) {
        skillScoreCoeffs = musicMeta.skill_score_solo;
    } else if (liveType === LiveType.AUTO) {
        skillScoreCoeffs = musicMeta.skill_score_auto;
    } else {
        // Fallback or Multi
        skillScoreCoeffs = musicMeta.skill_score_multi;
    }

    // Check if coefficients exist and have enough data
    if (!skillScoreCoeffs || skillScoreCoeffs.length < 5) {
        console.warn(`Calculator: Missing or insufficient skill_score coefficients for ID: ${songId}, Type: ${liveType}`);
        return null;
    }

    // 1. Prepare Data
    // Use only the first 5 coefficients (1st to 5th value) as requested
    const skillCoeffs = skillScoreCoeffs.slice(0, 5).map((val, idx) => ({ val, idx }));

    // User's 5 skills
    const userSkills = [skillLeader, skillMember2, skillMember3, skillMember4, skillMember5];

    // Create a base deck with these skills to get Card objects
    // Order in deck: [Leader, M2, M3, M4, M5]
    const baseDeck = createDeckDetail(totalPower, userSkills);
    const baseCards = baseDeck.cards;

    // 2. Logic for MAX Score
    // Sort coefficients descending (Highest coeff first)
    const sortedCoeffsDesc = [...skillCoeffs].sort((a, b) => b.val - a.val);
    // Sort skills descending (Highest skill first)
    const sortedSkillsDesc = [...userSkills].sort((a, b) => b - a);

    // Map skills to slots: Highest Skill -> Highest Coeff Slot
    // "값이 가장 큰 쪽에 스킬이 가장 높은 쪽이 할당"
    const maxOrderSkills = new Array(5);
    for (let i = 0; i < 5; i++) {
        const slotIndex = sortedCoeffsDesc[i].idx;
        maxOrderSkills[slotIndex] = sortedSkillsDesc[i];
    }

    // Construct skillDetails for MAX
    const skillDetailsMax = constructSkillDetails(maxOrderSkills, baseCards);

    // 3. Logic for MIN Score
    // Sort skills ascending (Lowest skill first)
    const sortedSkillsAsc = [...userSkills].sort((a, b) => a - b);

    // Map skills to slots: Lowest Skill -> Highest Coeff Slot
    // "최소값은 스킬이 정반대로 배치" (Highest Coeff gets Lowest Skill)
    const minOrderSkills = new Array(5);
    for (let i = 0; i < 5; i++) {
        const slotIndex = sortedCoeffsDesc[i].idx;
        minOrderSkills[slotIndex] = sortedSkillsAsc[i];
    }

    // Construct skillDetails for MIN
    const skillDetailsMin = constructSkillDetails(minOrderSkills, baseCards);

    // 4. Calculate Scores using Library
    let minScore = 0;
    let maxScore = 0;

    try {
        const maxLiveDetail = LiveCalculator.getLiveDetailByDeck(
            baseDeck,
            musicMeta,
            liveType,
            skillDetailsMax
        );
        maxScore = maxLiveDetail.score;

        const minLiveDetail = LiveCalculator.getLiveDetailByDeck(
            baseDeck,
            musicMeta,
            liveType,
            skillDetailsMin
        );
        minScore = minLiveDetail.score;

    } catch (e) {
        console.error('Calculator: Error calculating score with library', e);
        return null;
    }

    return {
        min: minScore,
        max: maxScore,
        minPermutation: minOrderSkills,
        maxPermutation: maxOrderSkills,
        skillCoeffs: skillScoreCoeffs // Return raw coefficients for visualization
    };
};

// Helper to construct skillDetails array
const constructSkillDetails = (orderedSkills, baseCards) => {
    // orderedSkills: Array of 5 skill values for slots 0-4
    // baseCards: Array of 5 Card objects [Leader, M2, M3, M4, M5]

    const availableCards = [...baseCards];
    const skillDetails = [];

    // Fill slots 0-4
    for (let i = 0; i < 5; i++) {
        const targetVal = orderedSkills[i];
        // Find a card with this skill value
        const cardIndex = availableCards.findIndex(c => c.skillEffectValue === targetVal);
        if (cardIndex === -1) {
            console.error('Calculator: Could not find card for skill value', targetVal);
            // Fallback: use first available (should not happen)
            skillDetails.push({ ...availableCards[0], skill: availableCards[0] });
        } else {
            const card = availableCards[cardIndex];
            skillDetails.push({ ...card, skill: card });
            // Remove from available to handle duplicate skill values correctly if needed
            // (Though with dummy cards and simple logic, reusing might be fine, but removing is safer for 1:1 mapping)
            availableCards.splice(cardIndex, 1);
        }
    }

    // Slot 5: Leader (Always baseCards[0])
    // Note: Leader activates twice. Once in slots 0-4, and once at slot 5.
    // So we reuse the Leader card object.
    skillDetails.push({ ...baseCards[0], skill: baseCards[0] });

    return skillDetails;
};