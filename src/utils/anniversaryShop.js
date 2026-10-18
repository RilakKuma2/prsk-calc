import { characterBirthdays } from '../data/characterBirthdays';
import { numberOrDefault } from './numbers';

// 6th anniversary official notices; all deadlines are JST (also UTC+9 in Korea).
export const ANNIVERSARY_END = Date.parse('2026-10-24T00:00:00+09:00');
export const anniversaryVisible = (now = Date.now()) => now < ANNIVERSARY_END;
export const NOTICE_BASE = 'https://production-web.sekai.colorfulpalette.org/information/index.html?id=';
export const SHOP_NOTICE = `${NOTICE_BASE}info_6th_annive_yellcampaign_notice`;
export const MISSION_NOTICE = `${NOTICE_BASE}info_6th_annive_stampmission_broom_notice`;
export const integer = (value, max = 1000000) => Math.min(max, Math.max(0, Math.floor(numberOrDefault(value, 0))));
export const CATEGORIES = ['live', 'songs', 'mysekai', 'event', 'gacha'];
export const TIERS = ['casual', 'regular', 'unlimited'];
export const GACHA_TIERS = ['standard', 'gold', 'diamond'];
export const SHOP_ITEMS = [
  { id: 'shirt', cost: 200, max: 26 },
  { id: 'fan', cost: 50, max: 26 },
  { id: 'stamp', cost: 200, max: 26 },
  { id: 'banner', cost: 100, max: 26 },
  { id: 'crystals', cost: 500, max: 5 },
  { id: 'furniture', cost: 1000, max: 1 },
];
export const ANNIVERSARY_CHARACTERS = [...characterBirthdays].sort((a, b) => Number(a.image) - Number(b.image));
export const CHARACTER_ITEMS = ['shirt', 'fan', 'stamp', 'banner'];
export const LOGIN_COINS_PER_DAY = 500;
export const EVENT_COIN_STEP = 500;
export const LIVE_TARGETS = [300, 900, 1500, 3000, 4500, 6000, 7500];
export const LIVE_STEPS = [0, ...LIVE_TARGETS];
export const normalizeSoloCoins = value => LIVE_STEPS.reduce((result, target) => target <= integer(value, 7500) ? target : result, 0);
const STEPS = [
  [35, 35, 35, 35, 70, 70, 70],
  [70, 70, 100, 100, 120, 120, 120],
  [120, 120, 120, 145, 145, 200, 200],
];
export const REQUIREMENTS = {
  songs: [[1, 2, 3, 4, 5, 7, 10], [1, 3, 5, 10, 15, 20, 25], [1, 5, 10, 20, 30, 40, 50]],
  mysekai: [[10, 50, 100, 300, 500, 700, 1000], [50, 100, 300, 500, 700, 1000, 1500], [100, 300, 500, 700, 1000, 1500, 2000]],
  event: [[10000, 100000, 200000, 300000, 500000, 700000, 1000000], [100000, 200000, 300000, 500000, 1000000, 1500000, 2000000], [300000, 500000, 1000000, 1500000, 2000000, 2500000, 3000000]],
};
export const missionRewards = (category, tier) => {
  if (category === 'gacha') return [
    { steps: [200, 200, 200, 200, 200, 250, 250], bonus: 500 },
    { steps: [250, 250, 500, 500, 250, 250, 500], bonus: 1000 },
    { steps: [500, 500, 500, 500, 500, 500, 500], bonus: 1500 },
  ][tier];
  return { steps: category === 'live' ? Array(7).fill((tier + 1) * 50) : STEPS[tier], bonus: (tier + 1) * 150 };
};
export const missionCoins = (category, tier, completed) => {
  const { steps, bonus } = missionRewards(category, tier);
  return steps.reduce((sum, coins, index) => sum + (completed[index] ? coins : 0), 0)
    + (steps.every((_, index) => completed[index]) ? bonus : 0);
};
export const defaultAnniversaryPlan = () => ({
  tiers: Object.fromEntries(CATEGORIES.map(category => [category, 0])),
  completed: Object.fromEntries(CATEGORIES.map(category => [category, Array(7).fill(true)])),
  login: 3500, eventCoins: 7500, special: 28,
  select: false, memorial: false, costume: 0,
  purchases: Object.fromEntries(SHOP_ITEMS.map(item => [item.id, 0])),
  characters: Object.fromEntries(CHARACTER_ITEMS.map(id => [id, []])),
  solo: {}, legacyLive: 0,
});
export const normalizeAnniversaryPlan = (raw) => {
  const defaults = defaultAnniversaryPlan();
  if (!raw || typeof raw !== 'object') return defaults;
  return {
    tiers: Object.fromEntries(CATEGORIES.map(c => [c, integer(raw.tiers?.[c], 2)])),
    completed: Object.fromEntries(CATEGORIES.map(c => [c, Array.from({ length: 7 }, (_, i) => typeof raw.completed?.[c]?.[i] === 'boolean' ? raw.completed[c][i] : true)])),
    login: Math.round(integer(raw.login ?? defaults.login, 3500) / LOGIN_COINS_PER_DAY) * LOGIN_COINS_PER_DAY,
    eventCoins: Math.round(integer(raw.eventCoins ?? defaults.eventCoins, 7500) / EVENT_COIN_STEP) * EVENT_COIN_STEP,
    special: integer(raw.special ?? defaults.special, 28), select: raw.select === true, memorial: raw.memorial === true,
    costume: integer(raw.costume, 6),
    characters: Object.fromEntries(CHARACTER_ITEMS.filter(id => Array.isArray(raw.characters?.[id])).map(id => [id, [...new Set(raw.characters[id].map(Number).filter(n => n >= 1 && n <= 26 && Number.isInteger(n)))]])),
    solo: Object.fromEntries(ANNIVERSARY_CHARACTERS.map(c => [Number(c.image), normalizeSoloCoins(raw.solo?.[Number(c.image)])])),
    legacyLive: raw.legacyLive !== undefined ? integer(raw.legacyLive) : LIVE_TARGETS.reduce((sum, target) => sum + target * integer(raw.live?.[target], 26), 0),
    purchases: Object.fromEntries(SHOP_ITEMS.map(item => [item.id, integer(raw.purchases?.[item.id], item.max)])),

  };
};
export const calculateAnniversary = (raw) => {
  const plan = normalizeAnniversaryPlan(raw);
  const missions = CATEGORIES.reduce((sum, c) => sum + missionCoins(c, plan.tiers[c], plan.completed[c]), 0) + plan.special * 200;
  const gacha = (plan.select ? 3500 : 0) + (plan.memorial ? 2500 : 0) + plan.costume * 2500;
  const income = plan.login + plan.eventCoins + missions + gacha;
  const shop = SHOP_ITEMS.reduce((sum, item) => sum + item.cost * (plan.characters[item.id]?.length ?? plan.purchases[item.id]), 0);
  const live = Object.values(plan.solo).reduce((sum, coins) => sum + coins, 0) + plan.legacyLive;
  return { missions, gacha, income, shop, live, balance: income - shop - live };
};
