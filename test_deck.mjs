import { calculateSlotSkillValues } from './src/utils/deckUtils.js';

const slots = [
    { card: { character: "미쿠", unit: "バーチャル・シンガー", support_unit: "Leo/need", skill_effect: "버싱한정", rarity: 4 }, skillLevel: 4 },
    { card: { character: "이치카", unit: "Leo/need", rarity: 4 }, skillLevel: 4 },
    { card: { character: "사키", unit: "Leo/need", rarity: 4 }, skillLevel: 4 },
    { card: { character: "호나미", unit: "Leo/need", rarity: 4 }, skillLevel: 4 },
    { card: { character: "시호", unit: "Leo/need", rarity: 4 }, skillLevel: 4 },
];

console.log(calculateSlotSkillValues(slots));
