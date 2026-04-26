const fs = require('fs');

const deckData = { member1: 348, member2: 1170, member3: 509, member4: 242, member5: 762 };
const userCards = [
  { cardId: 348, masterRank: 5 },
  { cardId: 1170, masterRank: 5 },
  { cardId: 509, masterRank: 5 },
  { cardId: 242, masterRank: 5 },
  { cardId: 762, masterRank: 5 }
];
const cards = JSON.parse(fs.readFileSync('/Users/kuma/Documents/scripts/프로세카계산기/cards.json'));
const currentEvent = { id: 202, eventType: 'world_bloom' };
const eventCards = [];
const currentBonuses = [
  { gameCharacterUnitId: undefined, bonusRate: 25 } // Just simulate Haruka/MMJ bonus for now
];

let totalBonus = 0;
const uniqueDeckAttrs = new Set();
for (let i = 1; i <= 5; i++) {
    const cardId = deckData[`member${i}`];
    const card = cards.find(c => c.id === cardId);
    let maxBonus = 0;
    const cardAttr = card?.attr || card?.attribute; 
    if (cardAttr) uniqueDeckAttrs.add(cardAttr);
    // Simulating bonus logic
    if (cardId === 242) maxBonus = 25; // Haruka gets 25% char bonus
    
    // MR bonus
    const userCard = userCards.find(c => c.cardId === cardId);
    maxBonus += 25; // MR5 for 4-star is 25%

    totalBonus += maxBonus;
}
let wlAttrBonus = 0;
if (currentEvent?.eventType === 'world_bloom') {
    const diffAttrBonuses = [0, 0, 0, 75, 100, 125];
    wlAttrBonus = diffAttrBonuses[uniqueDeckAttrs.size] || 0;
    totalBonus += wlAttrBonus;
}
console.log(`Unique Attrs: ${uniqueDeckAttrs.size}, WL Attr Bonus: ${wlAttrBonus}, Final Total: ${totalBonus}`);
