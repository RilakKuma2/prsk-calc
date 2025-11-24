import { LiveCalculator, LiveType } from 'sekai-calculator';
import musicMetas from '../data/music_metas.json';

// Initialize calculator with data provider
const dataProvider = {
    getMasterData: async (key) => [],
    getUserDataAll: async () => ({}),
    getUserData: async (key) => null,
    getMusicMeta: async () => musicMetas,
};

// const liveCalculator = new LiveCalculator(dataProvider);

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
        scoreUp: skillScoreUp, // Required by sekai-calculator for explicit skill details
    };
};

// Helper to create DeckDetail
const createDeckDetail = (totalPower, skills) => {
    const avgPower = Math.floor(totalPower / 5);
    // Distribute remainder to first cards to match total exactly
    const remainder = totalPower % 5;

    const cards = skills.map((skill, index) => {
        const power = avgPower + (index < remainder ? 1 : 0);
        return createDummyCard(skill, power);
    });

    return {
        deckId: 1,
        deckName: 'Auto Calc Deck',
        cards: cards,
        leader: cards[0],
        subLeader: cards[1], // Not used for score logic directly in this simplified view but required by type
    };
};

// Generate permutations of an array
const getPermutations = (arr) => {
    if (arr.length <= 1) return [arr];
    const result = [];
    for (let i = 0; i < arr.length; i++) {
        const current = arr[i];
        const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
        const remainingPerms = getPermutations(remaining);
        for (const perm of remainingPerms) {
            result.push([current, ...perm]);
        }
    }
    return result;
};

export const calculateScoreRange = (input) => {
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

    if (!musicMeta) {
        console.error(`Calculator: Music meta not found for ID: ${songId}, Difficulty: ${difficulty}`);
        return null;
    }

    // Skills: Leader is fixed at index 0. Members 2-5 are at indices 1-4.
    const memberSkills = [skillMember2, skillMember3, skillMember4, skillMember5];

    // Generate all permutations of member skills
    const memberPermutations = getPermutations(memberSkills);

    let minScore = Infinity;
    let maxScore = -Infinity;
    let minPermutation = [];
    let maxPermutation = [];

    // For each permutation, calculate score
    for (const perm of memberPermutations) {
        // Construct the full skill list: [Leader, ...Permutation]
        // But wait, DeckDetail expects cards in order.
        // We will construct the deck such that Card 0 has Leader Skill,
        // Card 1 has Perm[0], Card 2 has Perm[1], etc.
        const currentSkills = [skillLeader, ...perm];

        const deckDetail = createDeckDetail(totalPower, currentSkills);

        // IMPORTANT: LiveCalculator.getLiveDetailByDeck sorts skills internally by default.
        // To test permutations, we must explicitly pass the skill order we want.
        // The 'skillDetails' argument for getLiveDetailByDeck expects an array of skills.
        // The order matters for the activation sequence.
        // In Solo/Auto live:
        // Skill 1: Member 2 (Index 1)
        // Skill 2: Member 3 (Index 2)
        // Skill 3: Member 4 (Index 3)
        // Skill 4: Member 5 (Index 4)
        // Skill 5: Leader (Index 0)
        // Skill 6: Leader (Index 0)

        // So we need to map our deck's cards to this sequence.
        // Our deck cards are created in order [Leader, M2, M3, M4, M5].
        // So deck.cards[0] is Leader, deck.cards[1] is M2, etc.

        // We need to construct the skillDetails array corresponding to the activation order.
        // Activation Order: M2, M3, M4, M5, Leader, Leader
        // Indices in our deck: 1, 2, 3, 4, 0, 0

        const cards = deckDetail.cards;
        const skillDetails = [
            { ...cards[1], skill: cards[1] }, // Member 2
            { ...cards[2], skill: cards[2] }, // Member 3
            { ...cards[3], skill: cards[3] }, // Member 4
            { ...cards[4], skill: cards[4] }, // Member 5
            { ...cards[0], skill: cards[0] }, // Leader
            { ...cards[0], skill: cards[0] }, // Leader
        ];

        // Use LiveType.AUTO to simulate Auto Live scoring
        let score = 0;
        try {
            const liveDetail = LiveCalculator.getLiveDetailByDeck(
                deckDetail,
                musicMeta,
                LiveType.AUTO, // Use AUTO to match user intent
                skillDetails // Explicitly pass skill order to bypass internal sorting
            );
            score = liveDetail.score;
        } catch (e) {
            // Fallback calculation if sekai-calculator fails (e.g. missing note_counts)
            // Formula: TotalPower * 3 * (BaseScoreAuto + Sum(Skill% * SkillScoreAuto[i]))

            if (musicMeta.base_score_auto && musicMeta.skill_score_auto) {
                const baseScore = musicMeta.base_score_auto;
                const skillScores = musicMeta.skill_score_auto;

                // Activation Order: M2, M3, M4, M5, Leader, Leader
                // currentSkills is [Leader, M2, M3, M4, M5]
                // M2 = currentSkills[1]
                // M3 = currentSkills[2]
                // M4 = currentSkills[3]
                // M5 = currentSkills[4]
                // Leader = currentSkills[0]

                const skillMultipliers = [
                    currentSkills[1], // M2
                    currentSkills[2], // M3
                    currentSkills[3], // M4
                    currentSkills[4], // M5
                    currentSkills[0], // Leader
                    currentSkills[0]  // Leader
                ];

                let skillContribution = 0;
                for (let i = 0; i < 6; i++) {
                    // Skill value is percentage (e.g. 100). We assume coefficient is for 100%? 
                    // Or maybe coefficient is per 1.0?
                    // Usually skill 100% means 1.0 multiplier.
                    // If input is 100, we divide by 100.
                    skillContribution += (skillMultipliers[i] / 100) * skillScores[i];
                }

                score = Math.floor(totalPower * 3 * (baseScore + skillContribution));
            } else {
                console.error('Fallback failed: missing base_score_auto or skill_score_auto');
                continue; // Skip this permutation
            }
        }

        if (score < minScore) {
            minScore = score;
            minPermutation = perm;
        }
        if (score > maxScore) {
            maxScore = score;
            maxPermutation = perm;
        }
    }

    return {
        min: minScore,
        max: maxScore,
        minPermutation: [skillLeader, ...minPermutation],
        maxPermutation: [skillLeader, ...maxPermutation],
    };
};
