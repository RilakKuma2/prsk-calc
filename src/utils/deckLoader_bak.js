/**
 * deckLoader.js
 * 친구코드로 덱 데이터를 불러오고 파싱하는 로직 모듈
 */

import { API_BASE_URL, SUITE_ASSET_BASE_URL, joinUrl } from '../config/env';

// ── 상수 ──────────────────────────────────────────────────────────────────────

const CHAR_NAME_TO_ID = {
    "이치카": 1, "사키": 2, "호나미": 3, "시호": 4,
    "미노리": 5, "하루카": 6, "아이리": 7, "시즈쿠": 8,
    "코하네": 9, "안": 10, "아키토": 11, "토우야": 12,
    "츠카사": 13, "에무": 14, "네네": 15, "루이": 16,
    "카나데": 17, "마후유": 18, "에나": 19, "미즈키": 20,
    "미쿠": 21, "린": 22, "렌": 23, "루카": 24, "MEIKO": 25, "KAITO": 26
};

const UNIT_NAME_TO_KEY = {
    "Leo/need": "light_sound",
    "MORE MORE JUMP！": "idol",
    "Vivid BAD SQUAD": "street",
    "ワンダーランズ×ショウタイム": "theme_park",
    "25時、ナイトコードで。": "school_refusal"
};

const SCORE_UP_TYPES = ['score_up', 'score_up_keep', 'score_up_condition_life'];

// charId → unit key (non-VS chars only)
function charIdToUnit(cid) {
    if (cid >= 1 && cid <= 4) return 'light_sound';
    if (cid >= 5 && cid <= 8) return 'idol';
    if (cid >= 9 && cid <= 12) return 'street';
    if (cid >= 13 && cid <= 16) return 'theme_park';
    if (cid >= 17 && cid <= 20) return 'school_refusal';
    return null; // VS chars: use cardSupportUnit
}

// ── API 데이터 fetch ──────────────────────────────────────────────────────────

/**
 * 덱 파싱에 필요한 외부 데이터를 모두 fetch해 반환
 */
export async function fetchDeckAssets() {
    const [cardsRes, skillsRes, eventsRes, eventBonusesRes, gcUnitsRes, eventCardsRes] = await Promise.all([
        fetch(joinUrl(API_BASE_URL, 'api/cards')),
        fetch(joinUrl(SUITE_ASSET_BASE_URL, 'skills.json')),
        fetch(joinUrl(SUITE_ASSET_BASE_URL, 'events.json')),
        fetch(joinUrl(SUITE_ASSET_BASE_URL, 'eventDeckBonuses.json')),
        fetch(joinUrl(SUITE_ASSET_BASE_URL, 'gameCharacterUnits.json')),
        fetch(joinUrl(SUITE_ASSET_BASE_URL, 'eventCards.json')).catch(() => null)
    ]);

    if (!cardsRes.ok || !skillsRes.ok || !eventsRes.ok || !eventBonusesRes.ok || !gcUnitsRes.ok) {
        throw new Error("일부 데이터를 불러오지 못했습니다.");
    }

    const [cards, skills, events, eventBonuses, gcUnits, eventCardsData] = await Promise.all([
        cardsRes.json(),
        skillsRes.json(),
        eventsRes.json(),
        eventBonusesRes.json(),
        gcUnitsRes.json(),
        eventCardsRes && eventCardsRes.ok ? eventCardsRes.json().catch(() => []) : []
    ]);

    const eventCards = Array.isArray(eventCardsData) ? eventCardsData : [];

    let eventRarityBonusRates = [];
    try {
        const errRes = await fetch(joinUrl(SUITE_ASSET_BASE_URL, 'eventRarityBonusRates.json'));
        if (errRes.ok) eventRarityBonusRates = await errRes.json();
    } catch (e) { /* fallback to hardcoded */ }

    let worldBloomDifferentAttributeBonuses = [];
    try {
        const wbRes = await fetch(joinUrl(SUITE_ASSET_BASE_URL, 'worldBloomDifferentAttributeBonuses.json'));
        if (wbRes.ok) worldBloomDifferentAttributeBonuses = await wbRes.json();
    } catch (e) { /* fallback */ }

    return { cards, skills, events, eventBonuses, gcUnits, eventCards, eventRarityBonusRates, worldBloomDifferentAttributeBonuses };
}

// ── 이벤트 보너스 계산 헬퍼 ──────────────────────────────────────────────────

function makeGetEventDeckBonus(eventBonuses, gcUnits, currentEvent) {
    return (cardAttr, charId, cardSupportUnit) =>
        eventBonuses
            .filter(it => it.eventId === currentEvent.id &&
                (it.cardAttr === undefined || it.cardAttr === cardAttr))
            .reduce((v, b) => {
                if (b.gameCharacterUnitId === undefined) return Math.max(v, b.bonusRate);
                const gcu = gcUnits.find(u => u.id === b.gameCharacterUnitId);
                if (!gcu || gcu.gameCharacterId !== charId) return v;
                if (charId < 21 || cardSupportUnit === gcu.unit || cardSupportUnit === 'none') {
                    return Math.max(v, b.bonusRate);
                }
                return v;
            }, 0);
}

function makeGetMrBonus(eventRarityBonusRates) {
    return (rarityType, masterRank) => {
        if (eventRarityBonusRates.length > 0) {
            const entry = eventRarityBonusRates.find(
                it => it.cardRarityType === rarityType && it.masterRank === masterRank
            );
            if (entry) return entry.bonusRate;
        }
        const mr = masterRank || 0;
        if (rarityType === 'rarity_4') return mr === 5 ? 25 : (10 + 2.5 * mr);
        if (rarityType === 'rarity_birthday') return 5 + 2 * mr;
        if (rarityType === 'rarity_3') return mr;
        return 0;
    };
}

// ── 카드 스킬 레벨 배열 계산 ──────────────────────────────────────────────────

/**
 * suite 스킬 API에서 Lv1~4 스킬값 배열 계산
 * @returns {number[]} [0, lv1, lv2, lv3, lv4]
 */
function computeLevelsFromSkill(skill, isAfterBloomFes, charRank) {
    const levelsArr = [0, 0, 0, 0, 0];
    for (let lv = 1; lv <= 4; lv++) {
        let maxVal = 0;
        let charRankBonus = 0;
        for (const effect of skill.skillEffects) {
            const detail = effect.skillEffectDetails?.find(d => d.level === lv);
            if (!detail) continue;
            if (SCORE_UP_TYPES.includes(effect.skillEffectType)) {
                maxVal = Math.max(maxVal, detail.activateEffectValue || 0);
            }
            if (isAfterBloomFes && effect.skillEffectType === 'score_up_character_rank') {
                const threshold = effect.activateCharacterRank;
                if (threshold !== undefined && threshold <= charRank) {
                    charRankBonus = Math.max(charRankBonus, detail.activateEffectValue || 0);
                }
            }
        }
        levelsArr[lv] = maxVal + charRankBonus;
    }
    return levelsArr;
}

/**
 * skill_effect 문자열 기반 fallback 스킬값 배열 계산
 */
function computeLevelsFromSkillEffect(card, isTraining, charRank) {
    const effect = card.skill_effect;
    if (!effect) return [0, 100, 105, 110, 120]; // generic fallback

    const rarityNum = Number(card.cardRarityType?.replace('rarity_', '') || card.rarity || 4);
    const isBirthday = card.type === 'Birthday' || card.type === 'Anniversary' ||
        card.rarity === 'birthday' || card.cardRarityType === 'rarity_birthday';

    let scoreDiff = 0;
    if (isBirthday) scoreDiff = 20;
    else if (rarityNum === 3) scoreDiff = 40;
    else if (rarityNum === 2) scoreDiff = 70;
    else if (rarityNum <= 1) scoreDiff = 80;

    const calc = (arr) => {
        const r = [0];
        arr.forEach(v => r.push(Math.max(0, parseInt(v) - scoreDiff)));
        return r;
    };

    if (effect === '퍼스업') return calc(['110', '115', '120', '130']);
    if (effect === '스업') return calc(['100', '105', '110', '120']);
    if (effect === '힐' || effect === '힐카') return calc(['80', '85', '90', '100']);
    if (effect === '판강') return calc(['80', '85', '90', '100']);
    if (effect === '페스(판정)' || effect === '페스') return calc(['120', '125', '130', '140']);
    if (effect === '페스(라이프)') return calc(['120', '125', '130', '140']);
    if (effect === '버싱한정') return calc(['80', '85', '90', '100']);

    if (effect === '블페') {
        if (isTraining) {
            // 각전 후: base + floor(charRank/2), Lv1:90→140, Lv2:95→145, Lv3:100→150, Lv4:110→160
            const bonus = Math.floor(charRank / 2);
            return [
                0,
                Math.min(90 + bonus - scoreDiff, 140 - scoreDiff),
                Math.min(95 + bonus - scoreDiff, 145 - scoreDiff),
                Math.min(100 + bonus - scoreDiff, 150 - scoreDiff),
                Math.min(110 + bonus - scoreDiff, 160 - scoreDiff),
            ];
        }
        // 각전 전 - charId로 VS 여부 판단
        const cId = card.characterId || (card.character && CHAR_NAME_TO_ID[card.character]);
        if (cId >= 21) {
            // VS 블룸페스 각전 전: Lv1=70, Lv2=75, Lv3=80, Lv4=90
            return calc(['70', '75', '80', '90']);
        }
        // 일반 블룸페스 각전 전: Lv1=60, Lv2=65, Lv3=70, Lv4=80
        return calc(['60', '65', '70', '80']);
    }

    return calc(['100', '105', '110', '120']); // default
}

// ── 메인 파싱 함수 ────────────────────────────────────────────────────────────

/**
 * 친구 API 응답 + 자산 데이터로부터 덱 정보를 파싱해 반환
 *
 * @param {object} data          - 친구 API 응답 (data.userDeck, data.userCards, ...)
 * @param {object} assets        - fetchDeckAssets() 결과
 * @returns {object} 파싱된 덱 정보
 *   {
 *     totalPower,
 *     skillValues: [lv1×5],
 *     eventBonus,
 *     loadedSkillRanges,
 *     loadedSkillLevels,
 *     loadedBloomFesOriginalMembers,
 *     loadedVSBloomFesMembers,
 *   }
 */
export function parseDeckData(data, assets) {
    const {
        cards, skills, events, eventBonuses, gcUnits, eventCards,
        eventRarityBonusRates, worldBloomDifferentAttributeBonuses
    } = assets;

    const deckData = data.userDeck || data;
    const userCards = data.userCards || data.profile?.userCards || [];
    const userCharacters = data.userCharacters || data.profile?.userCharacters || [];

    const now = Date.now();
    const currentEvent = events.find(e => e.startAt <= now && now <= e.aggregateAt) || events[events.length - 1];
    const isWorldBloom = currentEvent?.eventType === 'world_bloom';

    const getEventDeckBonus = makeGetEventDeckBonus(eventBonuses, gcUnits, currentEvent);
    const getMrBonus = makeGetMrBonus(eventRarityBonusRates);

    let totalBonus = 0;
    const skillValues = [];
    const loadedSkillRanges = {};
    const loadedSkillLevels = {};
    const loadedBloomFesOriginalMembers = {};
    const loadedVSBloomFesMembers = {};
    const memberSupportUnits = {};
    const uniqueDeckAttrs = new Set();

    // ── 멤버별 파싱 루프 ──
    for (let i = 1; i <= 5; i++) {
        const memberKey = i === 1 ? 'leader' : `member${i}`;
        const cardId = deckData[`member${i}`] || (deckData.deck && deckData.deck[i - 1]);

        let levelsArr = [0, 0, 0, 0, 0];
        let card = null;
        let charRank = 0;

        if (cardId) {
            card = cards.find(c => c.id === cardId);
            if (card) {
                const userCard0 = userCards.find(c => c.cardId === cardId);
                const useSpecialSkill = userCard0?.defaultImage === 'special_training' && card.specialTrainingSkillId != null;
                const skillId = useSpecialSkill ? card.specialTrainingSkillId : card.skillId;
                const skill = skills.find(s => s.id === skillId);

                const isAfterBloomFes = userCard0?.defaultImage === 'special_training' &&
                    ((card.specialTrainingSkillId != null) || card?.skill_effect === '블페');
                if (isAfterBloomFes) {
                    const cId = card.characterId || (card.character && CHAR_NAME_TO_ID[card.character]);
                    const userChar = userCharacters.find(c => c.characterId === cId);
                    charRank = userChar?.characterRank ?? 0;
                }

                if (skill) {
                    levelsArr = computeLevelsFromSkill(skill, isAfterBloomFes, charRank);
                }
            }
        }

        // suite API에서 값을 못 가져온 경우 skill_effect 기반 fallback
        if (levelsArr[1] === 0) {
            if (card?.skill_effect) {
                const userCard0 = userCards.find(c => c.cardId === cardId);
                const isTraining = userCard0?.defaultImage === 'special_training';
                // bloom fes after의 charRank가 아직 0이면 여기서 계산
                if (isTraining && charRank === 0 && card) {
                    const cId = card.characterId || (card.character && CHAR_NAME_TO_ID[card.character]);
                    const uc = userCharacters.find(c => c.characterId === cId);
                    charRank = uc?.characterRank ?? 0;
                }
                levelsArr = computeLevelsFromSkillEffect(card, isTraining, charRank);
            } else {
                levelsArr = [0, 100, 105, 110, 120]; // generic fallback
            }
        }

        loadedSkillRanges[memberKey] = levelsArr;
        loadedSkillLevels[memberKey] = 1;
        skillValues.push(levelsArr[1]);

        // charId / supportUnit 해석
        const charId = card?.characterId || (card?.character && CHAR_NAME_TO_ID[card.character]);
        const cardAttr = card?.attr || card?.attribute;
        if (cardAttr) uniqueDeckAttrs.add(cardAttr);

        let cardSupportUnit = card?.supportUnit ?? card?.support_unit ?? null;
        if (charId >= 21 && cardSupportUnit == null) {
            cardSupportUnit = (card?.unit && UNIT_NAME_TO_KEY[card.unit]) || 'none';
        }

        // 유닛 다양성 계산용으로 모든 멤버 유닛 저장
        memberSupportUnits[memberKey] = charId >= 21
            ? cardSupportUnit
            : (charIdToUnit(charId) || (card?.unit && UNIT_NAME_TO_KEY[card.unit]) || null);

        // 이벤트 보너스
        const fixedBonus = getEventDeckBonus(cardAttr, charId, cardSupportUnit);

        let rarityType = card?.cardRarityType;
        if (!rarityType) {
            if (card?.type === 'Birthday' || card?.rarity === 'birthday') rarityType = 'rarity_birthday';
            else if (card?.rarity === 3) rarityType = 'rarity_3';
            else rarityType = 'rarity_4';
        }
        const userCard = userCards.find(c => c.cardId === cardId);
        const mr = userCard?.masterRank ?? 0;
        const mrBonus = getMrBonus(rarityType, mr);

        const eventCardRule = eventCards.find(ec => ec.eventId === currentEvent.id && ec.cardId === cardId);
        const cardBonus = eventCardRule?.bonusRate ?? 0;
        const leaderBonus = (i === 1) ? (eventCardRule?.leaderBonusRate ?? 0) : 0;

        const cardTotalBonus = fixedBonus + mrBonus + cardBonus + leaderBonus;
        console.log(`[Card ${cardId}] charId=${charId} su=${cardSupportUnit} attr=${cardAttr} fixed=${fixedBonus} mr=${mrBonus} card=${cardBonus} leader=${leaderBonus} total=${cardTotalBonus}`);
        totalBonus += cardTotalBonus;

        // 블룸페스 각전 전 감지
        const isBloomFesCard = (card?.specialTrainingSkillId != null) || (card?.skill_effect === '블페');
        if (isBloomFesCard && userCard?.defaultImage === 'original') {
            if (charId >= 21) {
                loadedVSBloomFesMembers[memberKey] = { supportUnit: cardSupportUnit, base: levelsArr[1] };
                console.log(`[VSBloomFes-original] ${memberKey} cardId=${cardId} su=${cardSupportUnit} base=${levelsArr[1]}`);
            } else {
                loadedBloomFesOriginalMembers[memberKey] = true;
                console.log(`[BloomFes-original] ${memberKey} cardId=${cardId} levelsArr[1]=${levelsArr[1]}`);
            }
        }
    }

    // VS 블룸페스 유닛 다양성 계산
    for (const [memberKey, vsData] of Object.entries(loadedVSBloomFesMembers)) {
        const ownUnit = vsData.supportUnit;
        const otherUnits = Object.entries(memberSupportUnits)
            .filter(([k]) => k !== memberKey)
            .map(([, su]) => su)
            .filter(Boolean);
        const differentUnitCount = new Set(otherUnits.filter(u => u !== ownUnit && u !== 'none')).size;
        const unitBonus = Math.min(differentUnitCount, 2) * 30;
        loadedVSBloomFesMembers[memberKey] = { ...vsData, unitBonus };
        console.log(`[VSBloomFes] ${memberKey} ownUnit=${ownUnit} differentTypes=${differentUnitCount} unitBonus=${unitBonus}`);
    }

    // 월드블룸 속성 다양성 보너스
    let wlAttrBonus = 0;
    if (isWorldBloom) {
        if (worldBloomDifferentAttributeBonuses.length > 0) {
            const entry = worldBloomDifferentAttributeBonuses.find(it => it.attributeCount === uniqueDeckAttrs.size);
            wlAttrBonus = entry?.bonusRate ?? 0;
        } else {
            const fallback = [0, 0, 0, 75, 100, 125];
            wlAttrBonus = fallback[uniqueDeckAttrs.size] || 0;
        }
        totalBonus += wlAttrBonus;
    }
    console.log(`[Deck] eventId=${currentEvent.id} type=${currentEvent.eventType} attrs=${uniqueDeckAttrs.size} wlBonus=${wlAttrBonus} finalTotal=${totalBonus}`);

    const totalPower = data.totalPower?.totalPower ?? data.totalPower ?? deckData.totalPower;

    return {
        totalPower,
        skillValues,
        eventBonus: totalBonus,
        loadedSkillRanges,
        loadedSkillLevels,
        loadedBloomFesOriginalMembers,
        loadedVSBloomFesMembers,
    };
}
