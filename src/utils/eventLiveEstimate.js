import { EventCalculator, LiveType, EventType } from 'sekai-calculator';
import { calculateScoreRange } from './calculator';
import { getMusicMetaSync } from './dataLoader';
import { EVENT_POINT_MULTIPLIERS, calculateMySekaiEnergyScore } from './autoEnergy';
import { mySekaiTableData, powerColumnThresholds, scoreRowKeys } from '../data/mySekaiTableData';
import { numberOrDefault } from './numbers';

export const EVENT_LIVE_SOURCES = [
  { value: 'lost', label: '로앤파', songId: 226, difficulty: 'hard', rounds: 18 },
  { value: 'omakase', label: '오마카세', songId: 572, difficulty: 'master', rounds: 20 },
  { value: 'envy', label: '엔비', songId: 74, difficulty: 'expert', rounds: 28 },
  { value: 'creation_myth', label: '개벽 오토', songId: 186, difficulty: 'master', rounds: 17, auto: true },
  { value: 'my_sekai', label: '마이세카', mySekai: true },
];
export const getEventLiveSource = data => EVENT_LIVE_SOURCES.find(row => row.value === data.eventLiveSong) || EVENT_LIVE_SOURCES[0];
export const getEventLiveEnergy = bonus => Number(Object.keys(EVENT_POINT_MULTIPLIERS).find(key => EVENT_POINT_MULTIPLIERS[key] === Number(bonus)) || 0);

export function calculateEventLiveEstimate(data, bonus) {
  const source = getEventLiveSource(data);
  const power = Math.max(0, numberOrDefault(data.power, 25.5));
  const eventBonus = Math.max(0, numberOrDefault(data.effi, 250));
  const energy = getEventLiveEnergy(bonus);
  if (source.mySekai) {
    let column = -1;
    powerColumnThresholds.forEach((threshold, index) => { if (threshold <= power) column = index; });
    const base = column < 0 ? 0 : [...scoreRowKeys].reverse().find(key => mySekaiTableData[key][column] !== null && eventBonus >= mySekaiTableData[key][column]);
    return energy === 0 ? 0 : calculateMySekaiEnergyScore(Number(String(base || 0).replace(/,/g, '')), energy);
  }
  const musicMeta = getMusicMetaSync(source.songId, source.difficulty);
  if (!musicMeta) return null;
  const room = Math.max(0, numberOrDefault(data.internalValue, 200));
  const skills = source.auto ? Array(5).fill(100) : data.isDetailedInput && data.detailedSkills
    ? ['encore', 'member1', 'member2', 'member3', 'member4'].map(key => numberOrDefault(data.detailedSkills[key], 200))
    : Array(5).fill(room);
  const liveType = source.auto ? LiveType.AUTO : LiveType.MULTI;
  const result = calculateScoreRange({ songId: source.songId, difficulty: source.difficulty, musicMeta, totalPower: Math.round(power * 10000),
    skillLeader: skills[0], skillMember2: skills[1], skillMember3: skills[2], skillMember4: skills[3], skillMember5: skills[4] }, liveType);
  if (!result) return null;
  return EventCalculator.getEventPoint(liveType, EventType.MARATHON, result.min > 0 ? result.min : result.max, musicMeta.event_rate, eventBonus, Number(bonus));
}

export function updateEventLiveDeck(previous, field, value) {
  const deckKey = `deck${previous.activeDeckNum || 1}`;
  const deckField = { power: 'totalPower', effi: 'eventBonus', internalValue: 'internalValue' }[field];
  return { ...previous, [field]: value,
    ...(field === 'internalValue' ? { isDetailedInput: false, isManualInternalEdit: true } : {}),
    unifiedDecks: { ...previous.unifiedDecks, [deckKey]: { ...previous.unifiedDecks?.[deckKey],
      [deckField]: field === 'power' ? (value === '' ? '' : Number(value) * 10000) : value,
      ...(field === 'internalValue' ? { isManualInternalEdit: true } : {}),
    } },
  };
}
