import {
  ANNIVERSARY_END, anniversaryVisible, calculateAnniversary, defaultAnniversaryPlan,
  missionCoins, normalizeAnniversaryPlan, normalizeSoloCoins, LIVE_STEPS, SHOP_ITEMS,
} from './anniversaryShop';

const all = Array(7).fill(true);

test('official full-card coin totals for all 15 selectable mission cards', () => {
  for (const category of ['live', 'songs', 'mysekai', 'event']) {
    expect([0, 1, 2].map(tier => missionCoins(category, tier, all))).toEqual([500, 1000, 1500]);
  }
  expect([0, 1, 2].map(tier => missionCoins('gacha', tier, all))).toEqual([2000, 3500, 5000]);
});

test('partial completion excludes the full-card bonus', () => {
  expect(missionCoins('live', 2, [true, true, true, true, true, true, false])).toBe(900);
  expect(missionCoins('songs', 0, [true, false, false, false, false, false, false])).toBe(35);
  expect(missionCoins('gacha', 1, [false, false, true, true, false, false, false])).toBe(1000);
});

test('free default plan, full exchange, and costume bonus use official prices', () => {
  const plan = defaultAnniversaryPlan();
  expect(calculateAnniversary(plan).income).toBe(20600);
  plan.purchases = Object.fromEntries(SHOP_ITEMS.map(item => [item.id, item.max]));
  plan.characters = Object.fromEntries(['shirt', 'fan', 'stamp', 'banner'].map(id => [id, Array.from({ length: 26 }, (_, i) => i + 1)]));
  expect(calculateAnniversary(plan)).toMatchObject({ shop: 17800, balance: 2800 });
  plan.costume = 2;
  plan.select = true;
  plan.memorial = true;
  expect(calculateAnniversary(plan)).toMatchObject({ gacha: 11000, income: 31600, balance: 13800 });
});

test('solo allocations accumulate by character and removed spending no longer affects the balance', () => {
  const plan = { ...defaultAnniversaryPlan(), solo: { 1: 7500, 2: 4500, 3: 1510 }, spent: 500 };
  expect(calculateAnniversary(plan)).toMatchObject({ live: 13500, balance: 7100 });
});

test('character purchases count unique valid characters with correct item prices', () => {
  const plan = { ...defaultAnniversaryPlan(), characters: { shirt: [1, 2, 3, 4, 4, 99], fan: [2, 3] } };
  expect(calculateAnniversary(plan).shop).toBe(900);
});

test('legacy anonymous counts are kept until the user chooses characters', () => {
  const raw = { purchases: { shirt: 4 }, live: { 7500: 2 } };
  const plan = normalizeAnniversaryPlan(raw);
  expect(calculateAnniversary(plan)).toMatchObject({ shop: 800, live: 15000 });
  plan.characters.shirt = [1, 3];
  plan.legacyLive = 0;
  plan.solo = { 1: 900 };
  expect(calculateAnniversary(plan)).toMatchObject({ shop: 400, live: 900 });
});

test('stored inputs are bounded and malformed data cannot produce NaN or exceed limits', () => {
  const plan = normalizeAnniversaryPlan({ login: -20, eventCoins: 999999, special: 29, costume: 'oops', purchases: { shirt: 99, furniture: -1, crystals: 3.9 }, live: { 300: 25, 7500: 20 }, tiers: { live: 99 } });
  expect(plan).toMatchObject({ login: 0, eventCoins: 7500, special: 28, costume: 0, purchases: { shirt: 26, furniture: 0, crystals: 3 }, legacyLive: 157500, tiers: { live: 2 } });
  expect(Number.isFinite(calculateAnniversary(plan).balance)).toBe(true);
  expect(normalizeAnniversaryPlan(null)).toEqual(defaultAnniversaryPlan());
});

test('button expires exactly at midnight after October 23 in JST, irrespective of device timezone', () => {
  expect(anniversaryVisible(Date.parse('2026-10-23T23:59:59.999+09:00'))).toBe(true);
  expect(anniversaryVisible(ANNIVERSARY_END)).toBe(false);
  expect(anniversaryVisible(Date.parse('2027-10-01T00:00:00+09:00'))).toBe(false);
});


test('solo spending snaps down to reward milestones and costume draws are capped at six', () => {
  expect([0, 300, 301, 899, 900, 1501, 8000].map(normalizeSoloCoins)).toEqual([0, 300, 300, 300, 900, 1500, 7500]);
  expect(LIVE_STEPS.map(normalizeSoloCoins)).toEqual(LIVE_STEPS);
  const plan = normalizeAnniversaryPlan({ costume: 12, solo: { 1: 301, 2: 910 } });
  expect(plan.costume).toBe(6);
  expect(plan.solo).toMatchObject({ 1: 300, 2: 900 });
  expect(calculateAnniversary(plan)).toMatchObject({ gacha: 15000, live: 1200 });
});
