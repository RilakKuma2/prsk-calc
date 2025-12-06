'use strict';

function findOrThrow(arr, p) {
    const result = arr.find(p);
    if (result === undefined)
        throw new Error('object not found');
    return result;
}
function getOrThrow(map, key) {
    const value = map.get(key);
    if (value === undefined)
        throw new Error('key not found');
    return value;
}
function getOrDefault(map, key, defaultValue) {
    const value = map.get(key);
    if (value === undefined)
        return defaultValue;
    return value;
}
function computeWithDefault(map, key, defaultValue, action) {
    map.set(key, action(getOrDefault(map, key, defaultValue)));
}
function duplicateObj(obj, times) {
    const ret = [];
    for (let i = 0; i < times; ++i)
        ret.push(obj);
    return ret;
}
function containsAny(collection, contains) {
    for (const c of contains) {
        if (collection.includes(c))
            return true;
    }
    return false;
}
function swap(arr, i, j) {
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
}
function mapToString(map) {
    const strings = [];
    for (const key of map.keys()) {
        const value = map.get(key);
        if (value === undefined)
            throw new Error('Map to string failed.');
        strings.push(`${key.toString()}->${value.toString()}`);
    }
    return strings.join(', ');
}

class CachedDataProvider {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    static globalCache = new Map();
    instanceCache = new Map();
    static runningPromise = new Map();
    async getData(cache, cacheKey, promise) {
        if (cache.has(cacheKey))
            return cache.get(cacheKey);
        while (CachedDataProvider.runningPromise.has(cacheKey)) {
            await CachedDataProvider.runningPromise.get(cacheKey);
        }
        if (cache.has(cacheKey))
            return cache.get(cacheKey);
        CachedDataProvider.runningPromise.set(cacheKey, promise());
        const data = await getOrThrow(CachedDataProvider.runningPromise, cacheKey).then(data => {
            cache.set(cacheKey, data);
            return data;
        });
        CachedDataProvider.runningPromise.delete(cacheKey);
        return data;
    }
    async getMasterData(key) {
        return await this.getData(CachedDataProvider.globalCache, key, async () => await this.dataProvider.getMasterData(key));
    }
    async getMusicMeta() {
        return await this.getData(CachedDataProvider.globalCache, 'musicMeta', async () => await this.dataProvider.getMusicMeta());
    }
    async getUserData(key) {
        const allData = await this.getUserDataAll();
        return allData[key];
    }
    async getUserDataAll() {
        return await this.getData(this.instanceCache, 'userData', async () => await this.dataProvider.getUserDataAll());
    }
    async preloadMasterData(keys) {
        return await Promise.all(keys.map(async (it) => await this.getMasterData(it)));
    }
}

class AreaItemService {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getAreaItemLevels() {
        const userAreas = await this.dataProvider.getUserData('userAreas');
        return await Promise.all(userAreas.flatMap(it => it.areaItems)
            .map(async (it) => await this.getAreaItemLevel(it.areaItemId, it.level)));
    }
    async getAreaItemLevel(areaItemId, level) {
        const areaItemLevels = await this.dataProvider.getMasterData('areaItemLevels');
        return findOrThrow(areaItemLevels, it => it.areaItemId === areaItemId && it.level === level);
    }
    async getAreaItemNextLevel(areaItem, areaItemLevel) {
        const level = areaItemLevel === undefined ? 1 : (areaItemLevel.level === 15 ? 15 : areaItemLevel.level + 1);
        return await this.getAreaItemLevel(areaItem.id, level);
    }
    async getShopItem(areaItemLevel) {
        const shopItems = await this.dataProvider.getMasterData('shopItems');
        const idOffset = areaItemLevel.level <= 10
            ? (1000 + (areaItemLevel.areaItemId - 1) * 10)
            : (1550 - 10 + (areaItemLevel.areaItemId - 1) * 5);
        const id = idOffset + areaItemLevel.level;
        return findOrThrow(shopItems, it => it.id === id);
    }
}

class CardService {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getCardUnits(card) {
        const gameCharacters = await this.dataProvider.getMasterData('gameCharacters');
        const units = [];
        if (card.supportUnit !== 'none')
            units.push(card.supportUnit);
        units.push(findOrThrow(gameCharacters, it => it.id === card.characterId).unit);
        return units;
    }
    async applyCardConfig(userCard, card, { rankMax = false, episodeRead = false, masterMax = false, skillMax = false } = {}) {
        if (!rankMax && !episodeRead && !masterMax && !skillMax)
            return userCard;
        const cardRarities = await this.dataProvider.getMasterData('cardRarities');
        const cardRarity = findOrThrow(cardRarities, it => it.cardRarityType === card.cardRarityType);
        const ret = JSON.parse(JSON.stringify(userCard));
        if (rankMax) {
            if (cardRarity.trainingMaxLevel !== undefined) {
                ret.level = cardRarity.trainingMaxLevel;
                ret.specialTrainingStatus = 'done';
            }
            else {
                ret.level = cardRarity.maxLevel;
            }
        }
        if (episodeRead && ret.episodes !== undefined) {
            ret.episodes.forEach(it => {
                it.scenarioStatus = 'already_read';
            });
        }
        if (masterMax) {
            ret.masterRank = 5;
        }
        if (skillMax) {
            ret.skillLevel = cardRarity.maxSkillLevel;
        }
        return ret;
    }
}

class DeckService {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getUserCard(cardId) {
        const userCards = await this.dataProvider.getUserData('userCards');
        return findOrThrow(userCards, it => it.cardId === cardId);
    }
    async getDeck(deckId) {
        const userDecks = await this.dataProvider.getUserData('userDecks');
        return findOrThrow(userDecks, it => it.deckId === deckId);
    }
    async getDeckCards(userDeck) {
        const cardIds = [userDeck.member1, userDeck.member2, userDeck.member3, userDeck.member4, userDeck.member5];
        return await Promise.all(cardIds.map(async (id) => await this.getUserCard(id)));
    }
    static toUserDeck(userCards, userId = 1145141919810, deckId = 1, name = 'ユニット01') {
        if (userCards.length !== 5)
            throw new Error('deck card should be 5');
        return {
            userId,
            deckId,
            name,
            leader: userCards[0].cardId,
            subLeader: userCards[1].cardId,
            member1: userCards[0].cardId,
            member2: userCards[1].cardId,
            member3: userCards[2].cardId,
            member4: userCards[3].cardId,
            member5: userCards[4].cardId
        };
    }
    async getChallengeLiveSoloDeck(characterId) {
        const userChallengeLiveSoloDecks = await this.dataProvider.getUserData('userChallengeLiveSoloDecks');
        return findOrThrow(userChallengeLiveSoloDecks, it => it.characterId === characterId);
    }
    async getChallengeLiveSoloDeckCards(deck) {
        const cardIds = [deck.leader, deck.support1, deck.support2, deck.support3, deck.support4];
        return await Promise.all(cardIds.filter(it => it !== undefined && it !== null)
            .map(async (id) => await this.getUserCard(id === null ? 0 : id)));
    }
    static toUserChallengeLiveSoloDeck(userCards, characterId) {
        if (userCards.length < 1)
            throw new Error('deck card should >= 1');
        if (userCards.length > 5)
            throw new Error('deck card should <= 5');
        return {
            characterId,
            leader: userCards[0].cardId,
            support1: userCards.length < 2 ? null : userCards[1].cardId,
            support2: userCards.length < 3 ? null : userCards[2].cardId,
            support3: userCards.length < 4 ? null : userCards[3].cardId,
            support4: userCards.length < 5 ? null : userCards[4].cardId
        };
    }
    static toUserWorldBloomSupportDeck(userCards, eventId, gameCharacterId) {
        if (userCards.length > 20)
            throw new Error('deck card should <= 20');
        return {
            gameCharacterId,
            eventId,
            member1: userCards.length < 1 ? 0 : userCards[0].cardId,
            member2: userCards.length < 2 ? 0 : userCards[1].cardId,
            member3: userCards.length < 3 ? 0 : userCards[2].cardId,
            member4: userCards.length < 4 ? 0 : userCards[3].cardId,
            member5: userCards.length < 5 ? 0 : userCards[4].cardId,
            member6: userCards.length < 6 ? 0 : userCards[5].cardId,
            member7: userCards.length < 7 ? 0 : userCards[6].cardId,
            member8: userCards.length < 8 ? 0 : userCards[7].cardId,
            member9: userCards.length < 9 ? 0 : userCards[8].cardId,
            member10: userCards.length < 10 ? 0 : userCards[9].cardId,
            member11: userCards.length < 11 ? 0 : userCards[10].cardId,
            member12: userCards.length < 12 ? 0 : userCards[11].cardId,
            member13: userCards.length < 13 ? 0 : userCards[12].cardId,
            member14: userCards.length < 14 ? 0 : userCards[13].cardId,
            member15: userCards.length < 15 ? 0 : userCards[14].cardId,
            member16: userCards.length < 16 ? 0 : userCards[15].cardId,
            member17: userCards.length < 17 ? 0 : userCards[16].cardId,
            member18: userCards.length < 18 ? 0 : userCards[17].cardId,
            member19: userCards.length < 19 ? 0 : userCards[18].cardId,
            member20: userCards.length < 20 ? 0 : userCards[19].cardId
        };
    }
}

class EventService {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getEventType(eventId) {
        const events = await this.dataProvider.getMasterData('events');
        const event = findOrThrow(events, it => it.id === eventId);
        switch (event.eventType) {
            case 'marathon':
                return exports.EventType.MARATHON;
            case 'cheerful_carnival':
                return exports.EventType.CHEERFUL;
            case 'world_bloom':
                return exports.EventType.BLOOM;
            default:
                throw new Error(`Event type ${event.eventType} not found.`);
        }
    }
    async getEventConfig(eventId, specialCharacterId) {
        const eventType = await this.getEventType(eventId);
        const isWorldBloom = eventType === exports.EventType.BLOOM;
        const worldBloomType = isWorldBloom ? await this.getWorldBloomType(eventId) : undefined;
        const isWorldBloomFinale = EventService.isWorldBloomFinale(worldBloomType);
        return {
            eventId,
            eventType,
            eventUnit: await this.getEventBonusUnit(eventId),
            specialCharacterId,
            cardBonusCountLimit: isWorldBloomFinale ? await this.getEventCardBonusCountLimit(eventId) : 5,
            skillScoreUpLimit: Number.MAX_SAFE_INTEGER,
            mysekaiFixtureLimit: isWorldBloomFinale ? await this.getMysekaiFixtureLimit(eventId) : Number.MAX_SAFE_INTEGER,
            worldBloomDifferentAttributeBonuses: isWorldBloom ? await this.getWorldBloomDifferentAttributeBonuses() : undefined,
            worldBloomType,
            worldBloomSupportUnit: isWorldBloom ? await this.getWorldBloomSupportUnit(specialCharacterId) : undefined
        };
    }
    async getEventBonusUnit(eventId) {
        const eventDeckBonuses = await this.dataProvider.getMasterData('eventDeckBonuses');
        const gameCharacterUnits = await this.dataProvider.getMasterData('gameCharacterUnits');
        const gameCharacters = await this.dataProvider.getMasterData('gameCharacters');
        const bonuses = eventDeckBonuses
            .filter(it => it.eventId === eventId && it.gameCharacterUnitId !== undefined)
            .map(it => findOrThrow(gameCharacterUnits, a => a.id === it.gameCharacterUnitId));
        const map = new Map();
        bonuses.forEach(gcu => {
            const gameCharacter = findOrThrow(gameCharacters, it => it.id === gcu.gameCharacterId);
            map.set(gameCharacter.unit, (map.get(gameCharacter.unit) ?? 0) + 1);
            if (gameCharacter.unit !== gcu.unit) {
                map.set(gcu.unit, (map.get(gcu.unit) ?? 0) + 1);
            }
        });
        for (const [key, value] of map) {
            if (value === bonuses.length) {
                return key;
            }
        }
        return undefined;
    }
    async getWorldBloomDifferentAttributeBonuses() {
        return await this.dataProvider
            .getMasterData('worldBloomDifferentAttributeBonuses');
    }
    async getEventCardBonusCountLimit(eventId) {
        const limits = await this.dataProvider
            .getMasterData('eventCardBonusLimits');
        const limit = limits.find(it => it.eventId === eventId);
        return limit?.memberCountLimit ?? 5;
    }
    async getEventSkillScoreUpLimit(eventId) {
        const limits = await this.dataProvider.getMasterData('eventSkillScoreUpLimits');
        const limit = limits.find(it => it.eventId === eventId);
        if (limit === undefined) {
            return Number.MAX_SAFE_INTEGER;
        }
        return limit.scoreUpRateLimit;
    }
    async getMysekaiFixtureLimit(eventId) {
        const limits = await this.dataProvider
            .getMasterData('eventMysekaiFixtureGameCharacterPerformanceBonusLimits');
        const limit = limits.find(it => it.eventId === eventId);
        return limit?.bonusRateLimit ?? Number.MAX_SAFE_INTEGER;
    }
    async getWorldBloomType(eventId) {
        const worldBlooms = await this.dataProvider.getMasterData('worldBlooms');
        const worldBloom = worldBlooms.find(it => it.eventId === eventId);
        return worldBloom?.worldBloomChapterType;
    }
    async getWorldBloomSupportUnit(specialCharacterId) {
        if (specialCharacterId === undefined) {
            return undefined;
        }
        const gameCharacters = await this.dataProvider.getMasterData('gameCharacters');
        const gameCharacter = findOrThrow(gameCharacters, it => it.id === specialCharacterId);
        return gameCharacter.unit;
    }
    static isWorldBloomFinale(worldBloomType) {
        return worldBloomType === 'finale';
    }
}
exports.EventType = void 0;
(function (EventType) {
    EventType["NONE"] = "none";
    EventType["MARATHON"] = "marathon";
    EventType["CHEERFUL"] = "cheerful_carnival";
    EventType["BLOOM"] = "world_bloom";
})(exports.EventType || (exports.EventType = {}));

class CardDetailMap {
    min = Number.MAX_SAFE_INTEGER;
    max = Number.MIN_SAFE_INTEGER;
    values = new Map();
    set(unit, unitMember, attrMember, cmpValue, value) {
        this.updateMinMax(cmpValue);
        this.values.set(CardDetailMap.getKey(unit, unitMember, attrMember), value);
    }
    updateMinMax(cmpValue) {
        this.min = Math.min(this.min, cmpValue);
        this.max = Math.max(this.max, cmpValue);
    }
    getInternal(unit, unitMember, attrMember) {
        return this.values.get(CardDetailMap.getKey(unit, unitMember, attrMember));
    }
    static getKey(unit, unitMember, attrMember) {
        return `${unit}-${unitMember}-${attrMember}`;
    }
    isCertainlyLessThen(another) {
        return this.max < another.min;
    }
}

class CardDetailMapPower extends CardDetailMap {
    setPower(unit, sameUnit, sameAttr, value) {
        super.set(unit, sameUnit ? 5 : 1, sameAttr ? 5 : 1, value.total, value);
    }
    getPower(unit, unitMember, attrMember) {
        const unitMember0 = unitMember === 5 ? 5 : 1;
        const attrMember0 = attrMember === 5 ? 5 : 1;
        const best = super.getInternal(unit, unitMember0, attrMember0);
        if (best !== undefined) {
            return best;
        }
        throw new Error('case not found');
    }
}

class CardPowerCalculator {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getCardPower(userCard, card, cardUnits, userAreaItemLevels, hasCanvasBonus, userGateBonuses, mysekaiFixtureLimit = Number.MAX_SAFE_INTEGER) {
        const ret = new CardDetailMapPower();
        const basePower = await this.getCardBasePowers(userCard, card, hasCanvasBonus);
        const characterBonus = await this.getCharacterBonusPower(basePower, card.characterId);
        const fixtureBonus = await this.getFixtureBonusPower(basePower, card.characterId, mysekaiFixtureLimit);
        const gateBonus = await this.getGateBonusPower(basePower, userGateBonuses, cardUnits);
        for (const unit of cardUnits) {
            for (let i = 0; i < 4; ++i) {
                const sameUnit = (i & 1) === 1;
                const sameAttr = (i & 2) === 2;
                const power = await this.getPower(card, basePower, characterBonus, fixtureBonus, gateBonus, userAreaItemLevels, unit, sameUnit, sameAttr);
                ret.setPower(unit, sameUnit, sameAttr, power);
            }
        }
        return ret;
    }
    async getPower(card, basePower, characterBonus, fixtureBonus, gateBonus, userAreaItemLevels, unit, sameUnit, sameAttr) {
        const base = CardPowerCalculator.sumPower(basePower);
        const areaItemBonus = await this.getAreaItemBonusPower(userAreaItemLevels, basePower, card.characterId, unit, sameUnit, card.attr, sameAttr);
        return {
            base,
            areaItemBonus,
            characterBonus,
            fixtureBonus,
            gateBonus,
            total: base + areaItemBonus + characterBonus + fixtureBonus + gateBonus
        };
    }
    async getCardBasePowers(userCard, card, hasMysekaiCanvas) {
        const [cardEpisodes, masterLessons] = await Promise.all([
            await this.dataProvider.getMasterData('cardEpisodes'),
            await this.dataProvider.getMasterData('masterLessons')
        ]);
        const ret = [0, 0, 0];
        const cardParameters = card.cardParameters
            .filter(it => it.cardLevel === userCard.level);
        const params = ['param1', 'param2', 'param3'];
        params.forEach((param, i) => {
            ret[i] = findOrThrow(cardParameters, it => it.cardParameterType === param).power;
        });
        if (userCard.specialTrainingStatus === 'done') {
            ret[0] += card.specialTrainingPower1BonusFixed;
            ret[1] += card.specialTrainingPower2BonusFixed;
            ret[2] += card.specialTrainingPower3BonusFixed;
        }
        const episodes = userCard.episodes === undefined
            ? []
            : userCard.episodes.filter(it => it.scenarioStatus === 'already_read')
                .map(it => findOrThrow(cardEpisodes, e => e.id === it.cardEpisodeId));
        for (const episode of episodes) {
            ret[0] += episode.power1BonusFixed;
            ret[1] += episode.power2BonusFixed;
            ret[2] += episode.power3BonusFixed;
        }
        const usedMasterLessons = masterLessons
            .filter((it) => it.cardRarityType === card.cardRarityType && it.masterRank <= userCard.masterRank);
        for (const masterLesson of usedMasterLessons) {
            ret[0] += masterLesson.power1BonusFixed;
            ret[1] += masterLesson.power2BonusFixed;
            ret[2] += masterLesson.power3BonusFixed;
        }
        if (hasMysekaiCanvas) {
            const cardMysekaiCanvasBonuses = await this.dataProvider.getMasterData('cardMysekaiCanvasBonuses');
            const canvasBonus = findOrThrow(cardMysekaiCanvasBonuses, it => it.cardRarityType === card.cardRarityType);
            ret[0] += canvasBonus.power1BonusFixed;
            ret[1] += canvasBonus.power2BonusFixed;
            ret[2] += canvasBonus.power3BonusFixed;
        }
        return ret;
    }
    async getAreaItemBonusPower(userAreaItemLevels, basePower, characterId, unit, sameUnit, attr, sameAttr) {
        const usedAreaItems = userAreaItemLevels.filter(it => (it.targetUnit === 'any' || it.targetUnit === unit) &&
            (it.targetCardAttr === 'any' || it.targetCardAttr === attr) &&
            (it.targetGameCharacterId === undefined || it.targetGameCharacterId === characterId));
        const areaItemBonus = [0, 0, 0];
        for (const areaItem of usedAreaItems) {
            const allMatch = (areaItem.targetUnit !== 'any' && sameUnit) ||
                (areaItem.targetCardAttr !== 'any' && sameAttr);
            const rates = [
                allMatch ? areaItem.power1AllMatchBonusRate : areaItem.power1BonusRate,
                allMatch ? areaItem.power2AllMatchBonusRate : areaItem.power2BonusRate,
                allMatch ? areaItem.power3AllMatchBonusRate : areaItem.power3BonusRate
            ];
            rates.forEach((rate, i) => {
                areaItemBonus[i] = Math.fround(areaItemBonus[i] +
                    Math.fround(Math.fround(Math.fround(rate) * Math.fround(0.01)) * basePower[i]));
            });
        }
        return areaItemBonus.reduce((v, it) => v + Math.floor(it), 0);
    }
    async getCharacterBonusPower(basePower, characterId) {
        const characterRanks = await this.dataProvider.getMasterData('characterRanks');
        const userCharacters = await this.dataProvider.getUserData('userCharacters');
        const userCharacter = findOrThrow(userCharacters, it => it.characterId === characterId);
        const characterRank = findOrThrow(characterRanks, it => it.characterId === userCharacter.characterId &&
            it.characterRank === userCharacter.characterRank);
        const rates = [
            characterRank.power1BonusRate,
            characterRank.power2BonusRate,
            characterRank.power3BonusRate
        ];
        return rates
            .reduce((v, it, i) => v +
            Math.floor(Math.fround(Math.fround(Math.fround(it) * Math.fround(0.01)) * basePower[i])), 0);
    }
    async getFixtureBonusPower(basePower, characterId, mysekaiFixtureLimit = Number.MAX_SAFE_INTEGER) {
        const userFixtureBonuses = await this.dataProvider.getUserData('userMysekaiFixtureGameCharacterPerformanceBonuses');
        if (userFixtureBonuses === undefined || userFixtureBonuses === null || userFixtureBonuses.length === 0) {
            return 0;
        }
        const fixtureBonus = userFixtureBonuses
            .find(it => it.gameCharacterId === characterId);
        if (fixtureBonus === undefined) {
            return 0;
        }
        const bonus = Math.min(fixtureBonus.totalBonusRate, mysekaiFixtureLimit);
        return Math.floor(Math.fround(CardPowerCalculator.sumPower(basePower) *
            Math.fround(Math.fround(bonus) * Math.fround(0.001))));
    }
    async getGateBonusPower(basePower, userGateBonuses, cardUnits) {
        const isOnlyPiapro = cardUnits.length === 1 && cardUnits[0] === 'piapro';
        let powerBonusRate = 0;
        for (const bonus of userGateBonuses) {
            if (isOnlyPiapro || cardUnits.includes(bonus.unit)) {
                powerBonusRate = Math.max(powerBonusRate, bonus.powerBonusRate);
            }
        }
        return Math.floor(Math.fround(CardPowerCalculator.sumPower(basePower) *
            Math.fround(Math.fround(powerBonusRate) * Math.fround(0.01))));
    }
    static sumPower(power) {
        return power.reduce((v, it) => v + it, 0);
    }
}

class CardDetailMapSkill extends CardDetailMap {
    fixedSkill = undefined;
    setFixedSkill(value) {
        super.set('any', 1, 1, value.scoreUpFixed, value);
        this.fixedSkill = value;
    }
    setReferenceSkill(value) {
        if (value.scoreUpReference === undefined) {
            throw new Error('scoreUpReference is not defined');
        }
        super.updateMinMax(value.scoreUpReference.base + Math.floor(10 * value.scoreUpReference.rate / 100));
        super.set('any', 1, 1, value.scoreUpReference.max, value);
        this.fixedSkill = value;
    }
    setSameUnitSkill(unit, unitMember, value) {
        super.set(unit, unitMember, 1, value.scoreUpFixed, value);
        this.fixedSkill = undefined;
    }
    setDiffUnitSkill(unitMember, value) {
        this.setSameUnitSkill('diff', unitMember, value);
    }
    getSkill(unit, unitMember) {
        if (this.fixedSkill !== undefined) {
            return this.fixedSkill;
        }
        let best = this.getInternal(unit, unitMember, 1);
        if (best !== undefined) {
            return best;
        }
        if (unit === 'diff') {
            best = this.getInternal('diff', Math.min(2, unitMember), 1);
            if (best !== undefined) {
                return best;
            }
        }
        best = this.getInternal('any', 1, 1);
        if (best !== undefined) {
            return best;
        }
        throw new Error('case not found');
    }
}

class CardSkillCalculator {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getCardSkill(userCard, card, scoreUpLimit = Number.MAX_SAFE_INTEGER) {
        const skillMap = new CardDetailMapSkill();
        const details = await this.getSkillDetails(userCard, card);
        let maxScoreUpBasic = details
            .reduce((v, it) => Math.max(v, CardSkillCalculator.getScoreUpSelfFixed(it)), 0);
        maxScoreUpBasic = Math.min(maxScoreUpBasic, scoreUpLimit);
        const maxLife = details
            .reduce((v, it) => Math.max(v, it.lifeRecovery), 0);
        skillMap.setFixedSkill({
            scoreUpFixed: maxScoreUpBasic,
            scoreUpToReference: maxScoreUpBasic,
            lifeRecovery: maxLife
        });
        details.forEach(it => {
            CardSkillCalculator.updateSkillDetailMap(skillMap, it, maxScoreUpBasic, scoreUpLimit);
        });
        return skillMap;
    }
    static updateSkillDetailMap(skillMap, detail, maxScoreUpBasic, scoreUpLimit) {
        const scoreUpSelfFixed = CardSkillCalculator.getScoreUpSelfFixed(detail);
        if (detail.scoreUpSameUnit !== undefined) {
            for (let i = 1; i <= 5; ++i) {
                let scoreUpFixed = scoreUpSelfFixed +
                    (i === 5 ? 5 : (i - 1)) * detail.scoreUpSameUnit.value;
                scoreUpFixed = Math.min(scoreUpFixed, scoreUpLimit);
                skillMap.setSameUnitSkill(detail.scoreUpSameUnit.unit, i, {
                    scoreUpFixed,
                    scoreUpToReference: scoreUpFixed,
                    lifeRecovery: detail.lifeRecovery
                });
            }
        }
        if (detail.scoreUpReference !== undefined) {
            let maxValue = scoreUpSelfFixed + detail.scoreUpReference.max;
            maxValue = Math.min(maxValue, scoreUpLimit);
            if (maxValue > maxScoreUpBasic) {
                skillMap.setReferenceSkill({
                    scoreUpFixed: maxScoreUpBasic,
                    scoreUpToReference: maxValue,
                    scoreUpReference: {
                        base: scoreUpSelfFixed,
                        rate: detail.scoreUpReference.rate,
                        max: maxValue
                    },
                    lifeRecovery: detail.lifeRecovery
                });
            }
        }
        if (detail.scoreUpDifferentUnit !== undefined) {
            for (const [key, value] of detail.scoreUpDifferentUnit) {
                let current = scoreUpSelfFixed + value;
                current = Math.min(current, scoreUpSelfFixed);
                if (current > maxScoreUpBasic) {
                    skillMap.setDiffUnitSkill(key, {
                        scoreUpFixed: current,
                        scoreUpToReference: current,
                        lifeRecovery: detail.lifeRecovery
                    });
                }
            }
        }
    }
    async getSkillDetails(userCard, card) {
        const skills = await this.getSkills(userCard, card);
        const characterRank = await this.getCharacterRank(card.characterId);
        return skills.map(it => CardSkillCalculator.getSkillDetail(userCard, it, characterRank));
    }
    static getSkillDetail(userCard, skill, characterRank) {
        const ret = { scoreUpBasic: 0, scoreUpCharacterRank: 0, lifeRecovery: 0 };
        for (const skillEffect of skill.skillEffects) {
            const skillEffectDetail = findOrThrow(skillEffect.skillEffectDetails, it => it.level === userCard.skillLevel);
            if (skillEffect.skillEffectType === 'score_up' ||
                skillEffect.skillEffectType === 'score_up_condition_life' ||
                skillEffect.skillEffectType === 'score_up_keep') {
                const current = skillEffectDetail.activateEffectValue;
                if (skillEffect.skillEnhance !== undefined) {
                    ret.scoreUpSameUnit = {
                        unit: skillEffect.skillEnhance.skillEnhanceCondition.unit,
                        value: skillEffect.skillEnhance.activateEffectValue
                    };
                }
                ret.scoreUpBasic = Math.max(ret.scoreUpBasic, current);
            }
            else if (skillEffect.skillEffectType === 'life_recovery') {
                ret.lifeRecovery += skillEffectDetail.activateEffectValue;
            }
            else if (skillEffect.skillEffectType === 'score_up_character_rank') {
                if (skillEffect.activateCharacterRank !== undefined &&
                    skillEffect.activateCharacterRank <= characterRank) {
                    ret.scoreUpCharacterRank =
                        Math.max(ret.scoreUpCharacterRank, skillEffectDetail.activateEffectValue);
                }
            }
            else if (skillEffect.skillEffectType === 'other_member_score_up_reference_rate') {
                ret.scoreUpReference = {
                    rate: skillEffectDetail.activateEffectValue, max: skillEffectDetail.activateEffectValue2 ?? 0
                };
            }
            else if (skillEffect.skillEffectType === 'score_up_unit_count') {
                if (ret.scoreUpDifferentUnit === undefined) {
                    ret.scoreUpDifferentUnit = new Map();
                }
                if (skillEffect.activateUnitCount !== undefined) {
                    ret.scoreUpDifferentUnit.set(skillEffect.activateUnitCount, skillEffectDetail.activateEffectValue);
                }
            }
        }
        return ret;
    }
    async getSkills(userCard, card) {
        const skillIds = [card.skillId];
        if (card.specialTrainingSkillId !== undefined && userCard.specialTrainingStatus === 'done') {
            skillIds.push(card.specialTrainingSkillId);
        }
        const skills = await this.dataProvider.getMasterData('skills');
        return skills.filter(it => skillIds.includes(it.id));
    }
    async getCharacterRank(characterId) {
        const userCharacters = await this.dataProvider.getUserData('userCharacters');
        const userCharacter = findOrThrow(userCharacters, it => it.characterId === characterId);
        return userCharacter.characterRank;
    }
    static getScoreUpSelfFixed(detail) {
        return detail.scoreUpBasic + detail.scoreUpCharacterRank;
    }
}

class CardDetailMapEventBonus extends CardDetailMap {
    bonus = undefined;
    setBonus(value) {
        super.updateMinMax(value.fixedBonus);
        super.updateMinMax(value.fixedBonus + value.cardBonus + value.leaderBonus);
        this.bonus = value;
    }
    getBonus() {
        if (this.bonus !== undefined) {
            return this.bonus;
        }
        throw new Error('bonus not found');
    }
    getBonusForDisplay(leader) {
        return this.getMaxBonus(leader).toString();
    }
    getMaxBonus(leader) {
        const bonus = this.getBonus();
        return bonus.fixedBonus + bonus.cardBonus + (leader ? bonus.leaderBonus : 0);
    }
}

class CardEventCalculator {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getEventDeckBonus(eventId, card) {
        const eventDeckBonuses = await this.dataProvider.getMasterData('eventDeckBonuses');
        const gameCharacterUnits = await this.dataProvider.getMasterData('gameCharacterUnits');
        return eventDeckBonuses.filter(it => it.eventId === eventId &&
            (it.cardAttr === undefined || it.cardAttr === card.attr))
            .reduce((v, eventDeckBonus) => {
            if (eventDeckBonus.gameCharacterUnitId === undefined)
                return Math.max(v, eventDeckBonus.bonusRate);
            const gameCharacterUnit = findOrThrow(gameCharacterUnits, unit => unit.id === eventDeckBonus.gameCharacterUnitId);
            if (gameCharacterUnit.gameCharacterId !== card.characterId)
                return v;
            if (card.characterId < 21 || card.supportUnit === gameCharacterUnit.unit || card.supportUnit === 'none') {
                return Math.max(v, eventDeckBonus.bonusRate);
            }
            return v;
        }, 0);
    }
    async getCardEventBonus(userCard, eventId) {
        const cards = await this.dataProvider.getMasterData('cards');
        const eventCards = await this.dataProvider.getMasterData('eventCards');
        const eventRarityBonusRates = await this.dataProvider.getMasterData('eventRarityBonusRates');
        const card = findOrThrow(cards, it => it.id === userCard.cardId);
        let fixedBonus = await this.getEventDeckBonus(eventId, card);
        const masterRankBonus = findOrThrow(eventRarityBonusRates, it => it.cardRarityType === card.cardRarityType && it.masterRank === userCard.masterRank);
        fixedBonus += masterRankBonus.bonusRate;
        const cardBonus0 = eventCards
            .find((it) => it.eventId === eventId && it.cardId === card.id);
        const cardBonus = cardBonus0?.bonusRate ?? 0;
        const leaderBonus = await this.getCardLeaderBonus(eventId, card.characterId, cardBonus0?.leaderBonusRate ?? 0);
        const bonus = new CardDetailMapEventBonus();
        bonus.setBonus({
            fixedBonus,
            cardBonus,
            leaderBonus
        });
        return bonus;
    }
    async getCardLeaderBonus(eventId, characterId, cardLeaderBonus) {
        const eventHonorBonuses = await this.dataProvider.getMasterData('eventHonorBonuses');
        const bonuses = eventHonorBonuses
            .filter(it => it.eventId === eventId && it.leaderGameCharacterId === characterId);
        if (bonuses.length === 0) {
            return cardLeaderBonus;
        }
        const userHonors = await this.dataProvider.getUserData('userHonors');
        return userHonors
            .map(honor => bonuses.find(it => it.honorId === honor.honorId))
            .filter(it => it !== undefined)
            .reduce((p, it) => p + (it?.bonusRate ?? 0), cardLeaderBonus);
    }
}

class CardBloomEventCalculator {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getCardSupportDeckBonus(userCard, card, units, { eventId = 0, worldBloomSupportUnit, specialCharacterId = 0 }) {
        if (specialCharacterId <= 0 || worldBloomSupportUnit === undefined)
            return undefined;
        if (!units.includes(worldBloomSupportUnit)) {
            return undefined;
        }
        const worldBloomSupportDeckBonuses = await this.dataProvider.getMasterData('worldBloomSupportDeckBonuses');
        const bonus = findOrThrow(worldBloomSupportDeckBonuses, it => it.cardRarityType === card.cardRarityType);
        let total = 0;
        const type = card.characterId === specialCharacterId ? 'specific' : 'others';
        total += findOrThrow(bonus.worldBloomSupportDeckCharacterBonuses, it => it.worldBloomSupportDeckCharacterType === type).bonusRate;
        total += findOrThrow(bonus.worldBloomSupportDeckMasterRankBonuses, it => it.masterRank === userCard.masterRank).bonusRate;
        total += findOrThrow(bonus.worldBloomSupportDeckSkillLevelBonuses, it => it.skillLevel === userCard.skillLevel).bonusRate;
        const worldBloomSupportDeckUnitEventLimitedBonuses = await this.dataProvider.getMasterData('worldBloomSupportDeckUnitEventLimitedBonuses');
        const cardBonus = worldBloomSupportDeckUnitEventLimitedBonuses
            .find(it => it.eventId === eventId && it.gameCharacterId === specialCharacterId && it.cardId === card.id);
        if (cardBonus !== undefined) {
            total += cardBonus.bonusRate;
        }
        return total;
    }
}

function safeNumber(num) {
    if (num === undefined || isNaN(num))
        return 0;
    return num;
}

class MysekaiService {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getMysekaiCanvasBonusCards() {
        const userMysekaiCanvas = await this.dataProvider.getUserData('userMysekaiCanvases');
        if (userMysekaiCanvas === undefined || userMysekaiCanvas === null) {
            return new Set();
        }
        return new Set(userMysekaiCanvas.map(it => it.cardId));
    }
    async getMysekaiFixtureBonuses() {
        return await this.dataProvider.getUserData('userMysekaiFixtureGameCharacterPerformanceBonuses');
    }
    async getMysekaiGateBonuses() {
        const userMysekaiGates = await this.dataProvider.getUserData('userMysekaiGates');
        if (userMysekaiGates === undefined || userMysekaiGates === null || userMysekaiGates.length === 0) {
            return [];
        }
        const mysekaiGates = await this.dataProvider.getMasterData('mysekaiGates');
        const mysekaiGateLevels = await this.dataProvider.getMasterData('mysekaiGateLevels');
        return userMysekaiGates.map(it => {
            const gate = findOrThrow(mysekaiGates, g => g.id === it.mysekaiGateId);
            const level = findOrThrow(mysekaiGateLevels, l => l.mysekaiGateId === it.mysekaiGateId && l.level === it.mysekaiGateLevel);
            return {
                unit: gate.unit,
                powerBonusRate: level.powerBonusRate
            };
        });
    }
}

class CardCalculator {
    dataProvider;
    powerCalculator;
    skillCalculator;
    eventCalculator;
    bloomEventCalculator;
    areaItemService;
    cardService;
    mysekaiService;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.powerCalculator = new CardPowerCalculator(dataProvider);
        this.skillCalculator = new CardSkillCalculator(dataProvider);
        this.eventCalculator = new CardEventCalculator(dataProvider);
        this.bloomEventCalculator = new CardBloomEventCalculator(dataProvider);
        this.areaItemService = new AreaItemService(dataProvider);
        this.cardService = new CardService(dataProvider);
        this.mysekaiService = new MysekaiService(dataProvider);
    }
    async getCardDetail(userCard, userAreaItemLevels, config = {}, eventConfig = {}, hasCanvasBonus, userGateBonuses) {
        const { eventId = 0 } = eventConfig;
        const cards = await this.dataProvider.getMasterData('cards');
        const card = findOrThrow(cards, it => it.id === userCard.cardId);
        const config0 = config[card.cardRarityType];
        if (config0 !== undefined && config0.disable === true)
            return undefined;
        const userCard0 = await this.cardService.applyCardConfig(userCard, card, config0);
        const units = await this.cardService.getCardUnits(card);
        const skill = await this.skillCalculator.getCardSkill(userCard0, card, eventConfig.skillScoreUpLimit);
        const power = await this.powerCalculator.getCardPower(userCard0, card, units, userAreaItemLevels, hasCanvasBonus, userGateBonuses, eventConfig.mysekaiFixtureLimit);
        const eventBonus = eventId === 0
            ? undefined
            : await this.eventCalculator.getCardEventBonus(userCard0, eventId);
        const supportDeckBonus = await this.bloomEventCalculator.getCardSupportDeckBonus(userCard0, card, units, eventConfig);
        return {
            cardId: card.id,
            level: userCard0.level,
            skillLevel: userCard0.skillLevel,
            masterRank: userCard0.masterRank,
            cardRarityType: card.cardRarityType,
            characterId: card.characterId,
            units,
            attr: card.attr,
            power,
            skill,
            eventBonus,
            supportDeckBonus,
            hasCanvasBonus
        };
    }
    async batchGetCardDetail(userCards, config = {}, eventConfig = {}, areaItemLevels) {
        const areaItemLevels0 = areaItemLevels === undefined
            ? await this.areaItemService.getAreaItemLevels()
            : areaItemLevels;
        const userCanvasBonusCards = await this.mysekaiService.getMysekaiCanvasBonusCards();
        const userGateBonuses = await this.mysekaiService.getMysekaiGateBonuses();
        const ret = await Promise.all(userCards.map(async (it) => await this.getCardDetail(it, areaItemLevels0, config, eventConfig, userCanvasBonusCards.has(it.cardId), userGateBonuses))).then(it => it.filter(it => it !== undefined));
        if (eventConfig?.specialCharacterId !== undefined && eventConfig.specialCharacterId > 0) {
            return ret.sort((a, b) => safeNumber(b.supportDeckBonus) - safeNumber(a.supportDeckBonus));
        }
        return ret;
    }
    static isCertainlyLessThan(cardDetail0, cardDetail1) {
        return cardDetail0.power.isCertainlyLessThen(cardDetail1.power) &&
            cardDetail0.skill.isCertainlyLessThen(cardDetail1.skill) &&
            (cardDetail0.eventBonus === undefined || cardDetail1.eventBonus === undefined ||
                cardDetail0.eventBonus.isCertainlyLessThen(cardDetail1.eventBonus));
    }
}

class LiveCalculator {
    dataProvider;
    deckCalculator;
    eventService;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.deckCalculator = new DeckCalculator(dataProvider);
        this.eventService = new EventService(dataProvider);
    }
    async getMusicMeta(musicId, musicDiff) {
        const musicMetas = await this.dataProvider.getMusicMeta();
        return findOrThrow(musicMetas, it => it.music_id === musicId && it.difficulty === musicDiff);
    }
    static getBaseScore(musicMeta, liveType) {
        switch (liveType) {
            case exports.LiveType.SOLO:
            case exports.LiveType.CHALLENGE:
                return musicMeta.base_score;
            case exports.LiveType.MULTI:
            case exports.LiveType.CHEERFUL:
                return musicMeta.base_score + musicMeta.fever_score * 0.5;
            case exports.LiveType.AUTO:
                return musicMeta.base_score_auto;
        }
    }
    static getSkillScore(musicMeta, liveType) {
        switch (liveType) {
            case exports.LiveType.SOLO:
            case exports.LiveType.CHALLENGE:
                return musicMeta.skill_score_solo;
            case exports.LiveType.MULTI:
            case exports.LiveType.CHEERFUL:
                return musicMeta.skill_score_multi;
            case exports.LiveType.AUTO:
                return musicMeta.skill_score_auto;
        }
    }
    static getSortedSkillDetails(deckDetail, liveType, skillDetails = undefined) {
        if (skillDetails !== undefined && skillDetails.length === 6 && skillDetails[5].scoreUp > 0) {
            return {
                details: skillDetails,
                sorted: false
            };
        }
        if (liveType === exports.LiveType.MULTI) {
            return {
                details: duplicateObj(LiveCalculator.getMultiLiveSkill(deckDetail), 6),
                sorted: false
            };
        }
        const sortedSkill = [...deckDetail.cards].map(it => it.skill)
            .sort((a, b) => a.scoreUp - b.scoreUp);
        const emptySkill = duplicateObj({
            scoreUp: 0,
            lifeRecovery: 0
        }, 5 - sortedSkill.length);
        return {
            details: [...sortedSkill, ...emptySkill, deckDetail.cards[0].skill],
            sorted: true
        };
    }
    static getSortedSkillRate(sorted, cardLength, skillScores) {
        if (!sorted) {
            return skillScores;
        }
        return [
            ...skillScores.slice(0, cardLength).sort((a, b) => a - b),
            ...skillScores.slice(cardLength)
        ];
    }
    static getLiveDetailByDeck(deckDetail, musicMeta, liveType, skillDetails = undefined, multiPowerSum = 0) {
        const skills = this.getSortedSkillDetails(deckDetail, liveType, skillDetails);
        const baseRate = LiveCalculator.getBaseScore(musicMeta, liveType);
        const skillScores = [...LiveCalculator.getSkillScore(musicMeta, liveType)];
        const skillRate = LiveCalculator.getSortedSkillRate(skills.sorted, deckDetail.cards.length, skillScores);
        const rate = baseRate + skills.details
            .reduce((v, it, i) => v + it.scoreUp * skillRate[i] / 100, 0);
        const life = skills.details.reduce((v, it) => v + it.lifeRecovery, 0);
        const powerSum = multiPowerSum === 0 ? 5 * deckDetail.power.total : multiPowerSum;
        const activeBonus = liveType === exports.LiveType.MULTI ? 5 * LiveCalculator.getMultiActiveBonus(powerSum) : 0;
        return {
            score: Math.floor(rate * deckDetail.power.total * 4 + activeBonus),
            time: musicMeta.music_time,
            life: Math.min(2000, life + 1000),
            tap: musicMeta.tap_count
        };
    }
    static getMultiActiveBonus(powerSum) {
        return 0.015 * powerSum;
    }
    static getMultiLiveSkill(deckDetail) {
        const scoreUp = deckDetail.cards.reduce((v, it, i) => v + (i === 0 ? it.skill.scoreUp : (it.skill.scoreUp / 5)), 0);
        const lifeRecovery = deckDetail.cards[0].skill.lifeRecovery;
        return {
            scoreUp,
            lifeRecovery
        };
    }
    static getSoloLiveSkill(liveSkills, skillDetails) {
        if (liveSkills === undefined)
            return undefined;
        const skills = liveSkills.map(liveSkill => findOrThrow(skillDetails, it => it.cardId === liveSkill.cardId).skill);
        const ret = [];
        for (let i = 0; i < 6; ++i) {
            ret.push({
                scoreUp: 0,
                lifeRecovery: 0
            });
        }
        for (let i = 0; i < skills.length - 1; ++i) {
            ret[i] = skills[i];
        }
        ret[5] = skills[skills.length - 1];
        return ret;
    }
    async getLiveDetail(deckCards, musicMeta, liveType, liveSkills = undefined, eventId) {
        const eventConfig = eventId === undefined
            ? undefined
            : await this.eventService.getEventConfig(eventId);
        const deckDetail = await this.deckCalculator.getDeckDetail(deckCards, deckCards, eventConfig);
        const skills = liveType === exports.LiveType.MULTI
            ? undefined
            : LiveCalculator.getSoloLiveSkill(liveSkills, deckDetail.cards);
        const ret = LiveCalculator.getLiveDetailByDeck(deckDetail, musicMeta, liveType, skills);
        ret.deck = deckDetail;
        return ret;
    }
    static getLiveScoreByDeck(deckDetail, musicMeta, liveType) {
        return LiveCalculator.getLiveDetailByDeck(deckDetail, musicMeta, liveType).score;
    }
    static getLiveScoreFunction(liveType) {
        return (musicMeta, deckDetail) => LiveCalculator.getLiveScoreByDeck(deckDetail, musicMeta, liveType);
    }
}
exports.LiveType = void 0;
(function (LiveType) {
    LiveType["SOLO"] = "solo";
    LiveType["AUTO"] = "auto";
    LiveType["CHALLENGE"] = "challenge";
    LiveType["MULTI"] = "multi";
    LiveType["CHEERFUL"] = "cheerful";
})(exports.LiveType || (exports.LiveType = {}));

class EventCalculator {
    dataProvider;
    cardEventCalculator;
    eventService;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.cardEventCalculator = new CardEventCalculator(dataProvider);
        this.eventService = new EventService(dataProvider);
    }
    async getDeckEventBonus(deckCards, eventId) {
        const masterCards = await this.dataProvider.getMasterData('cards');
        const cardDetails = await Promise.all(deckCards
            .map(async (userCard) => {
            const card = findOrThrow(masterCards, it => it.id === userCard.cardId);
            const eventBonus = await this.cardEventCalculator.getCardEventBonus(userCard, eventId);
            return {
                attr: card.attr,
                eventBonus
            };
        }));
        const event = await this.eventService.getEventConfig(eventId);
        return EventCalculator.getDeckBonus(cardDetails, event.cardBonusCountLimit, event.worldBloomDifferentAttributeBonuses) ?? 0;
    }
    static getEventPoint(liveType, eventType, selfScore, musicRate = 100, deckBonus = 0, boostRate = 1, otherScore = 0, life = 1000) {
        const musicRate0 = musicRate / 100;
        const deckRate = deckBonus / 100 + 1;
        const otherScore0 = otherScore === 0 ? 4 * selfScore : otherScore;
        let baseScore = 0;
        let lifeRate = 0;
        switch (liveType) {
            case exports.LiveType.SOLO:
            case exports.LiveType.AUTO:
                baseScore = 100 + Math.floor(selfScore / 20000);
                return Math.floor(baseScore * musicRate0 * deckRate) * boostRate;
            case exports.LiveType.CHALLENGE:
                baseScore = 100 + Math.floor(selfScore / 20000);
                return baseScore * 120;
            case exports.LiveType.MULTI:
                if (eventType === exports.EventType.CHEERFUL)
                    throw new Error('Multi live is not playable in cheerful event.');
                baseScore = (110 + Math.floor(selfScore / 17000) + Math.min(13, Math.floor(otherScore0 / 340000)));
                return Math.floor(baseScore * musicRate0 * deckRate) * boostRate;
            case exports.LiveType.CHEERFUL:
                if (eventType !== exports.EventType.CHEERFUL)
                    throw new Error('Cheerful live is only playable in cheerful event.');
                baseScore = (110 + Math.floor(selfScore / 17000) + Math.min(13, Math.floor(otherScore0 / 340000)));
                lifeRate = 1.15 + Math.min(Math.max(life / 5000, 0.1), 0.2);
                return Math.floor(Math.floor(baseScore * musicRate0 * deckRate) * lifeRate) * boostRate;
        }
    }
    static getDeckBonus(deckCards, cardBonusCountLimit = 5, worldBloomDifferentAttributeBonuses) {
        let bonus = 0;
        let cardBonusCount = 0;
        for (let i = 0; i < deckCards.length; i++) {
            const card = deckCards[i];
            if (card.eventBonus === undefined)
                return undefined;
            const bonusDetail = card.eventBonus.getBonus();
            bonus += bonusDetail.fixedBonus;
            if (bonusDetail.cardBonus > 0 && cardBonusCount < cardBonusCountLimit) {
                bonus += bonusDetail.cardBonus;
                cardBonusCount++;
            }
            if (i === 0) {
                bonus += bonusDetail.leaderBonus;
            }
        }
        if (worldBloomDifferentAttributeBonuses === undefined)
            return bonus;
        const set = new Set();
        deckCards.forEach(it => set.add(it.attr));
        return bonus + findOrThrow(worldBloomDifferentAttributeBonuses, it => it.attributeCount === set.size).bonusRate;
    }
    static getSupportDeckBonus(deckCards, allCards) {
        const deckCardIds = new Set(deckCards.map(it => it.cardId));
        let bonus = 0;
        const cards = [];
        for (const card of allCards) {
            if (card.supportDeckBonus === undefined)
                continue;
            if (deckCardIds.has(card.cardId))
                continue;
            bonus += card.supportDeckBonus;
            cards.push(card);
            if (cards.length >= 20)
                break;
        }
        return { bonus, cards };
    }
    static getDeckEventPoint(deckDetail, musicMeta, liveType, eventType) {
        const deckBonus = deckDetail.eventBonus;
        if (liveType !== exports.LiveType.CHALLENGE && deckBonus === undefined)
            throw new Error('Deck bonus is undefined');
        const supportDeckBonus = deckDetail.supportDeckBonus;
        if (eventType === exports.EventType.BLOOM && supportDeckBonus === undefined)
            throw new Error('Support deck bonus is undefined');
        const score = LiveCalculator.getLiveScoreByDeck(deckDetail, musicMeta, liveType);
        return EventCalculator.getEventPoint(liveType, eventType, score, musicMeta.event_rate, safeNumber(deckBonus) + safeNumber((supportDeckBonus)));
    }
    static getEventPointFunction(liveType, eventType) {
        return (musicMeta, deckDetail) => EventCalculator.getDeckEventPoint(deckDetail, musicMeta, liveType, eventType);
    }
}

class DeckCalculator {
    dataProvider;
    cardCalculator;
    eventCalculator;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.cardCalculator = new CardCalculator(dataProvider);
        this.eventCalculator = new EventCalculator(dataProvider);
    }
    async getHonorBonusPower() {
        const honors = await this.dataProvider.getMasterData('honors');
        const userHonors = await this.dataProvider.getUserData('userHonors');
        return userHonors
            .map(userHonor => {
            const honor = findOrThrow(honors, it => it.id === userHonor.honorId);
            return findOrThrow(honor.levels, it => it.level === userHonor.level);
        })
            .reduce((v, it) => v + it.bonus, 0);
    }
    static getDeckDetailByCards(cardDetails, allCards, honorBonus, cardBonusCountLimit, worldBloomDifferentAttributeBonuses) {
        const map = new Map();
        for (const cardDetail of cardDetails) {
            computeWithDefault(map, cardDetail.attr, 0, it => it + 1);
            cardDetail.units.forEach(key => {
                computeWithDefault(map, key, 0, it => it + 1);
            });
        }
        const cardPower = new Map();
        cardDetails.forEach(cardDetail => {
            cardPower.set(cardDetail.cardId, cardDetail.units.reduce((vv, unit) => {
                const current = cardDetail.power.getPower(unit, getOrThrow(map, unit), getOrThrow(map, cardDetail.attr));
                return current.total > vv.total ? current : vv;
            }, cardDetail.power.getPower(cardDetail.units[0], getOrThrow(map, cardDetail.units[0]), getOrThrow(map, cardDetail.attr))));
        });
        const base = DeckCalculator.sumPower(cardDetails, cardPower, it => it.base);
        const areaItemBonus = DeckCalculator.sumPower(cardDetails, cardPower, it => it.areaItemBonus);
        const characterBonus = DeckCalculator.sumPower(cardDetails, cardPower, it => it.characterBonus);
        const fixtureBonus = DeckCalculator.sumPower(cardDetails, cardPower, it => it.fixtureBonus);
        const gateBonus = DeckCalculator.sumPower(cardDetails, cardPower, it => it.gateBonus);
        const total = DeckCalculator.sumPower(cardDetails, cardPower, it => it.total) + honorBonus;
        const power = {
            base,
            areaItemBonus,
            characterBonus,
            honorBonus,
            fixtureBonus,
            gateBonus,
            total
        };
        const cardsPrepare = cardDetails.map(cardDetail => {
            const skillPrepare = cardDetail.units.reduce((vv, unit) => {
                const current = cardDetail.skill.getSkill(unit, getOrThrow(map, unit));
                return current.scoreUpFixed > vv.scoreUpFixed ? current : vv;
            }, cardDetail.skill.getSkill('diff', map.size - 1));
            return {
                cardDetail,
                skillPrepare
            };
        });
        const cards = cardsPrepare.map((it, i) => {
            const { cardDetail, skillPrepare } = it;
            let scoreUp = skillPrepare.scoreUpFixed;
            if (skillPrepare.scoreUpReference !== undefined) {
                const otherCardSkillMax = cardsPrepare
                    .filter(it => it.cardDetail.cardId !== cardDetail.cardId)
                    .reduce((v, it) => Math.max(v, it.skillPrepare.scoreUpToReference), 0);
                const { scoreUpReference } = skillPrepare;
                let newScoreUp = scoreUpReference.base + Math.floor(otherCardSkillMax * scoreUpReference.rate / 100);
                newScoreUp = Math.min(newScoreUp, scoreUpReference.max);
                scoreUp = Math.max(scoreUp, newScoreUp);
            }
            return {
                cardId: cardDetail.cardId,
                level: cardDetail.level,
                skillLevel: cardDetail.skillLevel,
                masterRank: cardDetail.masterRank,
                power: getOrThrow(cardPower, cardDetail.cardId),
                eventBonus: cardDetail.eventBonus?.getBonusForDisplay(i === 0),
                skill: {
                    scoreUp,
                    lifeRecovery: skillPrepare.lifeRecovery
                }
            };
        });
        const eventBonus = EventCalculator.getDeckBonus(cardDetails, cardBonusCountLimit, worldBloomDifferentAttributeBonuses);
        const supportDeckBonus = worldBloomDifferentAttributeBonuses !== undefined
            ? EventCalculator.getSupportDeckBonus(cardDetails, allCards).bonus
            : 0;
        return {
            power,
            eventBonus,
            supportDeckBonus,
            cards
        };
    }
    static sumPower(cardDetails, cardPower, attr) {
        return cardDetails.reduce((v, cardDetail) => v + attr(getOrThrow(cardPower, cardDetail.cardId)), 0);
    }
    async getDeckDetail(deckCards, allCards, eventConfig, areaItemLevels) {
        const allCards0 = await this.cardCalculator.batchGetCardDetail(allCards, {}, eventConfig, areaItemLevels);
        return DeckCalculator.getDeckDetailByCards(await this.cardCalculator.batchGetCardDetail(deckCards, {}, eventConfig, areaItemLevels), allCards0, await this.getHonorBonusPower(), eventConfig?.cardBonusCountLimit, eventConfig?.worldBloomDifferentAttributeBonuses);
    }
}

class LiveExactCalculator {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async calculate(power, skills, liveType, musicScore, multiSumPower = power * 5, feverMusicScore = musicScore) {
        const effects = LiveExactCalculator.getSkillDetails(skills, musicScore.skills);
        if (liveType === exports.LiveType.MULTI || liveType === exports.LiveType.CHEERFUL) {
            const feverDetail = LiveExactCalculator.getFeverDetail(feverMusicScore);
            effects.push(feverDetail);
        }
        const ingameNodes = await this.dataProvider.getMasterData('ingameNodes');
        const noteCoefficients = musicScore.notes
            .map(note => findOrThrow(ingameNodes, it => it.id === note.type).scoreCoefficient);
        const coefficientTotal = noteCoefficients.reduce((total, it) => total + it, 0);
        const ingameCombos = await this.dataProvider.getMasterData('ingameCombos');
        const notes = musicScore.notes.map((note, i) => {
            const noteCoefficient = noteCoefficients[i];
            const combo = i + 1;
            const comboCoefficient = findOrThrow(ingameCombos, it => it.fromCount <= combo && combo <= it.toCount).scoreCoefficient;
            const judgeCoefficient = 1;
            const effectBonuses = effects
                .filter(it => it.startTime <= note.time && note.time <= it.endTime)
                .map(it => it.effect);
            const effectCoefficient = effectBonuses
                .reduce((total, it) => total * (it / 100), 1);
            const score = noteCoefficient * comboCoefficient * judgeCoefficient * effectCoefficient * power * 4 / coefficientTotal;
            return {
                noteCoefficient,
                comboCoefficient,
                judgeCoefficient,
                effectBonuses,
                score
            };
        });
        const noteTotal = notes.reduce((a, b) => a + b.score, 0);
        const activeBonus = liveType === exports.LiveType.MULTI
            ? 5 * LiveCalculator.getMultiActiveBonus(multiSumPower)
            : 0;
        return {
            total: noteTotal + activeBonus,
            activeBonus,
            notes
        };
    }
    static getSkillDetails(skills, musicSkills) {
        return musicSkills.map((it, i) => {
            return {
                startTime: it.time,
                endTime: it.time + 5,
                effect: skills[i]
            };
        });
    }
    static getFeverDetail(musicScore) {
        if (musicScore.fevers === undefined || musicScore.fevers.length === 0) {
            return {
                startTime: 0,
                endTime: 0,
                effect: 0
            };
        }
        const startTime = musicScore.fevers
            .reduce((v, it) => Math.max(v, it.time), 0);
        const notesAfterFever = musicScore.notes
            .filter(note => note.time >= startTime);
        const feverNoteCount = Math.min(notesAfterFever.length, Math.floor(musicScore.notes.length / 10));
        const endTime = notesAfterFever[feverNoteCount - 1].time;
        return {
            startTime,
            endTime,
            effect: 50
        };
    }
}

class AreaItemRecommend {
    dataProvider;
    areaItemService;
    deckCalculator;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.areaItemService = new AreaItemService(dataProvider);
        this.deckCalculator = new DeckCalculator(dataProvider);
    }
    static findCost(shopItem, resourceType, resourceId) {
        const cost = shopItem.costs.map(it => it.cost)
            .find(it => it.resourceType === resourceType && it.resourceId === resourceId);
        return cost === undefined ? 0 : cost.quantity;
    }
    async getRecommendAreaItem(areaItem, areaItemLevel, power) {
        const areas = await this.dataProvider.getMasterData('areas');
        const area = findOrThrow(areas, it => it.id === areaItem.areaId);
        const shopItem = await this.areaItemService.getShopItem(areaItemLevel);
        return {
            area,
            areaItem,
            areaItemLevel,
            shopItem,
            cost: {
                coin: AreaItemRecommend.findCost(shopItem, 'coin', 0),
                seed: AreaItemRecommend.findCost(shopItem, 'material', 17),
                szk: AreaItemRecommend.findCost(shopItem, 'material', 57)
            },
            power
        };
    }
    async recommendAreaItem(userCards) {
        const areaItems = await this.dataProvider.getMasterData('areaItems');
        const currentAreaItemLevels = await this.areaItemService.getAreaItemLevels();
        const { power: currentPower } = await this.deckCalculator.getDeckDetail(userCards, userCards, {}, currentAreaItemLevels);
        const recommend = await Promise.all(areaItems.map(async (areaItem) => {
            const newAreaItemLevel = await this.areaItemService.getAreaItemNextLevel(areaItem, currentAreaItemLevels.find(it => it.areaItemId === areaItem.id));
            const newAreaItemLevels = [
                ...currentAreaItemLevels.filter(it => it.areaItemId !== areaItem.id), newAreaItemLevel
            ];
            const { power: newPower } = await this.deckCalculator.getDeckDetail(userCards, userCards, {}, newAreaItemLevels);
            return await this.getRecommendAreaItem(areaItem, newAreaItemLevel, newPower.total - currentPower.total);
        }));
        return recommend.filter(it => it.power > 0)
            .sort((a, b) => b.power / b.cost.coin - a.power / a.cost.coin);
    }
}

const challengeLiveCardPriorities = [
    {
        eventBonus: 0,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 0
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_birthday',
        masterRank: 0,
        priority: 10
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_3',
        masterRank: 0,
        priority: 20
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_2',
        masterRank: 0,
        priority: 30
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_1',
        masterRank: 0,
        priority: 40
    }
];

const bloomCardPriorities = [
    {
        eventBonus: 25 + 10 + 20,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 0
    },
    {
        eventBonus: 25 + 25,
        cardRarityType: 'rarity_4',
        masterRank: 5,
        priority: 5
    },
    {
        eventBonus: 25 + 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 10
    }, {
        eventBonus: 25 + 15,
        cardRarityType: 'rarity_birthday',
        masterRank: 5,
        priority: 10
    }, {
        eventBonus: 25 + 5,
        cardRarityType: 'rarity_birthday',
        masterRank: 0,
        priority: 20
    }, {
        eventBonus: 25 + 5,
        cardRarityType: 'rarity_3',
        masterRank: 5,
        priority: 20
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_4',
        masterRank: 5,
        priority: 21
    }, {
        eventBonus: 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 22
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_3',
        masterRank: 0,
        priority: 30
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_2',
        masterRank: 0,
        priority: 40
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_1',
        masterRank: 0,
        priority: 50
    }, {
        eventBonus: 5,
        cardRarityType: 'rarity_birthday',
        masterRank: 0,
        priority: 70
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_3',
        masterRank: 0,
        priority: 80
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_2',
        masterRank: 0,
        priority: 90
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_1',
        masterRank: 0,
        priority: 100
    }
];

const marathonCheerfulCardPriorities = [
    {
        eventBonus: 25 + 25 + 20 + 25,
        cardRarityType: 'rarity_4',
        masterRank: 5,
        priority: 0
    }, {
        eventBonus: 25 + 25 + 20 + 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 10
    }, {
        eventBonus: 25 + 25 + 25,
        cardRarityType: 'rarity_4',
        masterRank: 5,
        priority: 10
    }, {
        eventBonus: 25 + 15 + 25,
        cardRarityType: 'rarity_4',
        masterRank: 5,
        priority: 30
    }, {
        eventBonus: 25 + 25 + 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 40
    }, {
        eventBonus: 25 + 25,
        cardRarityType: 'rarity_4',
        masterRank: 5,
        priority: 40
    }, {
        eventBonus: 25 + 25 + 15,
        cardRarityType: 'rarity_birthday',
        masterRank: 5,
        priority: 40
    }, {
        eventBonus: 25 + 15 + 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 50
    }, {
        eventBonus: 25 + 25 + 5,
        cardRarityType: 'rarity_birthday',
        masterRank: 0,
        priority: 50
    }, {
        eventBonus: 25 + 25 + 5,
        cardRarityType: 'rarity_3',
        masterRank: 5,
        priority: 50
    }, {
        eventBonus: 25 + 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 60
    }, {
        eventBonus: 25 + 15,
        cardRarityType: 'rarity_birthday',
        masterRank: 5,
        priority: 60
    }, {
        eventBonus: 25 + 25,
        cardRarityType: 'rarity_3',
        masterRank: 0,
        priority: 60
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_4',
        masterRank: 5,
        priority: 60
    }, {
        eventBonus: 15 + 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 70
    }, {
        eventBonus: 25 + 5,
        cardRarityType: 'rarity_birthday',
        masterRank: 0,
        priority: 70
    }, {
        eventBonus: 25 + 5,
        cardRarityType: 'rarity_3',
        masterRank: 5,
        priority: 70
    }, {
        eventBonus: 25 + 25,
        cardRarityType: 'rarity_2',
        masterRank: 0,
        priority: 70
    }, {
        eventBonus: 25 + 25,
        cardRarityType: 'rarity_1',
        masterRank: 0,
        priority: 70
    }, {
        eventBonus: 15 + 5,
        cardRarityType: 'rarity_birthday',
        masterRank: 0,
        priority: 80
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_3',
        masterRank: 0,
        priority: 80
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_2',
        masterRank: 0,
        priority: 80
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_1',
        masterRank: 0,
        priority: 80
    }, {
        eventBonus: 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 80
    }, {
        eventBonus: 5,
        cardRarityType: 'rarity_birthday',
        masterRank: 0,
        priority: 90
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_3',
        masterRank: 0,
        priority: 100
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_2',
        masterRank: 0,
        priority: 100
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_1',
        masterRank: 0,
        priority: 100
    }
];

function checkAttrForBloomDfs(attrMap, attrs, chars, visit, round, attr) {
    visit.set(attr, round);
    const charForAttr = attrMap.get(attr);
    if (charForAttr === undefined)
        throw new Error(`${attr} not found in map ${mapToString(attrMap)}`);
    for (const char of charForAttr) {
        if (!chars.has(char)) {
            chars.set(char, attr);
            attrs.set(attr, char);
            return true;
        }
    }
    for (const char of charForAttr) {
        const attrForChar = chars.get(char);
        if (attrForChar === undefined)
            throw new Error(`${char} not found in map ${mapToString(chars)}`);
        const attrForCharRound = visit.get(attrForChar);
        if (attrForCharRound === undefined)
            throw new Error(`${attrForChar} not found in map ${mapToString(visit)}`);
        if (attrForCharRound !== round && checkAttrForBloomDfs(attrMap, attrs, chars, visit, round, attrForChar)) {
            chars.set(char, attr);
            attrs.set(attr, char);
            return true;
        }
    }
    return false;
}
function checkAttrForBloom(attrMap) {
    if (attrMap.size < 5)
        return false;
    let min = 114514;
    for (const v of attrMap.values()) {
        min = Math.min(min, v.size);
    }
    if (min >= 5)
        return true;
    const attrs = new Map();
    const chars = new Map();
    const visit = new Map();
    let ans = 0;
    let round = 0;
    while (true) {
        round++;
        let count = 0;
        for (const attr of attrMap.keys()) {
            if (!visit.has(attr) && checkAttrForBloomDfs(attrMap, attrs, chars, visit, round, attr)) {
                count++;
            }
        }
        if (count === 0)
            break;
        ans += count;
    }
    return ans === 5;
}
function canMakeDeck(liveType, eventType, cardDetails, member = 5) {
    const attrMap = new Map();
    const unitMap = new Map();
    for (const cardDetail of cardDetails) {
        computeWithDefault(attrMap, cardDetail.attr, new Set(), it => it.add(liveType === exports.LiveType.CHALLENGE ? cardDetail.cardId : cardDetail.characterId));
        for (const unit of cardDetail.units) {
            computeWithDefault(unitMap, unit, new Set(), it => it.add(cardDetail.characterId));
        }
    }
    if (liveType === exports.LiveType.CHALLENGE) {
        if (member < 5) {
            return cardDetails.length >= member;
        }
        for (const v of attrMap.values()) {
            if (v.size < 5)
                return false;
        }
        return true;
    }
    switch (eventType) {
        case exports.EventType.MARATHON:
        case exports.EventType.CHEERFUL:
            for (const v of attrMap.values()) {
                if (v.size >= 5)
                    return true;
            }
            for (const v of unitMap.values()) {
                if (v.size >= 5)
                    return true;
            }
            return false;
        case exports.EventType.BLOOM:
            for (const v of unitMap.values()) {
                if (v.size >= 5)
                    return true;
            }
            if (!checkAttrForBloom(attrMap))
                return false;
            return false;
        default:
            return false;
    }
}
function filterCardPriority(liveType, eventType, cardDetails, preCardDetails, member = 5, leader = 0) {
    const cardPriorities = getCardPriorities(liveType, eventType);
    let cards = [];
    let latestPriority = Number.MIN_SAFE_INTEGER;
    const cardIds = new Set();
    for (const cardPriority of cardPriorities) {
        if (cardPriority.priority > latestPriority && cards.length > preCardDetails.length && canMakeDeck(liveType, eventType, cards, member)) {
            return cards;
        }
        latestPriority = cardPriority.priority;
        const filtered = cardDetails
            .filter(it => !cardIds.has(it.cardId) &&
            it.cardRarityType === cardPriority.cardRarityType &&
            it.masterRank >= cardPriority.masterRank &&
            (it.eventBonus === undefined ||
                it.eventBonus.getMaxBonus(leader <= 0 || leader === it.characterId) >= cardPriority.eventBonus));
        filtered.forEach(it => cardIds.add(it.cardId));
        cards = [...cards, ...filtered];
    }
    return cardDetails;
}
function getCardPriorities(liveType, eventType) {
    if (liveType === exports.LiveType.CHALLENGE)
        return challengeLiveCardPriorities;
    if (eventType === exports.EventType.BLOOM)
        return bloomCardPriorities;
    if (eventType === exports.EventType.MARATHON || eventType === exports.EventType.CHEERFUL)
        return marathonCheerfulCardPriorities;
    return [];
}

function compareDeck(deck1, deck2) {
    if (deck1.score !== deck2.score)
        return deck2.score - deck1.score;
    if (deck1.power !== deck2.power)
        return deck2.power.total - deck1.power.total;
    return deck1.cards[0].cardId - deck2.cards[0].cardId;
}
function removeSameDeck(it, i, arr) {
    if (i === 0)
        return true;
    const pre = arr[i - 1];
    if (pre.score !== it.score || pre.power.total !== it.power.total)
        return true;
    return pre.cards[0].cardId !== it.cards[0].cardId;
}
function updateDeck(pre, result, limit) {
    let ans = [...pre, ...result].sort(compareDeck);
    ans = ans.filter(removeSameDeck);
    if (ans.length > limit)
        ans = ans.slice(0, limit);
    return ans;
}
function toRecommendDeck(deckDetail, score) {
    const ret = deckDetail;
    ret.score = score;
    return [ret];
}
function isDeckAttrLessThan3(deckCards, cardDetail) {
    if (deckCards.length <= 2) {
        return false;
    }
    const set = new Set();
    set.add(cardDetail.attr);
    for (const card of deckCards) {
        set.add(card.attr);
    }
    if (deckCards.length === 3) {
        return set.size < 2;
    }
    return set.size < 3;
}

class BaseDeckRecommend {
    dataProvider;
    cardCalculator;
    deckCalculator;
    areaItemService;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.cardCalculator = new CardCalculator(dataProvider);
        this.deckCalculator = new DeckCalculator(dataProvider);
        this.areaItemService = new AreaItemService(dataProvider);
    }
    static findBestCards(cardDetails, allCards, scoreFunc, limit = 1, isChallengeLive = false, member = 5, leaderCharacter = 0, honorBonus = 0, eventConfig = {}, deckCards = []) {
        if (isChallengeLive) {
            member = Math.min(member, cardDetails.length);
        }
        if (deckCards.length === member) {
            const deckDetail = DeckCalculator.getDeckDetailByCards(deckCards, allCards, honorBonus, eventConfig.cardBonusCountLimit, eventConfig.worldBloomDifferentAttributeBonuses);
            const score = scoreFunc(deckDetail);
            if (leaderCharacter > 0) {
                return toRecommendDeck(deckDetail, score);
            }
            const cards = deckDetail.cards;
            let bestScoreUp = cards[0].skill.scoreUp;
            let bestScoreIndex = 0;
            cards.forEach((it, i) => {
                if (it.skill.scoreUp > bestScoreUp) {
                    bestScoreUp = it.skill.scoreUp;
                    bestScoreIndex = i;
                }
            });
            if (bestScoreIndex === 0) {
                return toRecommendDeck(deckDetail, score);
            }
            swap(deckCards, 0, bestScoreIndex);
            return BaseDeckRecommend.findBestCards(cardDetails, allCards, scoreFunc, limit, isChallengeLive, member, leaderCharacter, honorBonus, eventConfig, deckCards);
        }
        let ans = [];
        let preCard = null;
        for (const card of cardDetails) {
            if (deckCards.some(it => it.cardId === card.cardId)) {
                continue;
            }
            if (!isChallengeLive && deckCards.some(it => it.characterId === card.characterId)) {
                continue;
            }
            if (leaderCharacter > 0 && deckCards.length === 0 && card.characterId !== leaderCharacter) {
                continue;
            }
            if (leaderCharacter <= 0 && deckCards.length >= 1 && deckCards[0].skill.isCertainlyLessThen(card.skill)) {
                continue;
            }
            if (deckCards.length >= 1 && card.attr !== deckCards[0].attr && !containsAny(deckCards[0].units, card.units)) {
                continue;
            }
            if (eventConfig.worldBloomDifferentAttributeBonuses !== undefined && isDeckAttrLessThan3(deckCards, card)) {
                continue;
            }
            if (deckCards.length >= 2 && CardCalculator.isCertainlyLessThan(deckCards[deckCards.length - 1], card)) {
                continue;
            }
            if (deckCards.length >= 2 && !CardCalculator.isCertainlyLessThan(card, deckCards[deckCards.length - 1]) &&
                card.cardId < deckCards[deckCards.length - 1].cardId) {
                continue;
            }
            if (preCard !== null && CardCalculator.isCertainlyLessThan(card, preCard)) {
                continue;
            }
            preCard = card;
            const result = BaseDeckRecommend.findBestCards(cardDetails, allCards, scoreFunc, limit, isChallengeLive, member, leaderCharacter, honorBonus, eventConfig, [...deckCards, card]);
            ans = updateDeck(ans, result, limit);
        }
        if (deckCards.length === 0 && ans.length === 0) {
            console.warn(`Cannot find deck in ${cardDetails.length} cards(${cardDetails.map(it => it.cardId).toString()})`);
            return [];
        }
        return ans;
    }
    async recommendHighScoreDeck(userCards, scoreFunc, { musicMeta, limit = 1, member = 5, leaderCharacter = undefined, cardConfig = {}, debugLog = (_) => {
    } }, liveType, eventConfig = {}) {
        const { eventType = exports.EventType.NONE, eventUnit, specialCharacterId, worldBloomType, worldBloomSupportUnit } = eventConfig;
        const honorBonus = await this.deckCalculator.getHonorBonusPower();
        const areaItemLevels = await this.areaItemService.getAreaItemLevels();
        let cards = await this.cardCalculator.batchGetCardDetail(userCards, cardConfig, eventConfig, areaItemLevels);
        let filterUnit = eventUnit;
        if (worldBloomSupportUnit !== undefined) {
            filterUnit = worldBloomSupportUnit;
        }
        if (filterUnit !== undefined) {
            const originCardsLength = cards.length;
            cards = cards.filter(it => (it.units.length === 1 && it.units[0] === 'piapro') ||
                filterUnit === undefined || it.units.includes(filterUnit));
            debugLog(`Cards filtered with unit ${filterUnit}: ${cards.length}/${originCardsLength}`);
            debugLog(cards.map(it => it.cardId).toString());
        }
        if (worldBloomType === 'finale') {
            leaderCharacter = specialCharacterId;
        }
        let preCardDetails = [];
        while (true) {
            const cardDetails = filterCardPriority(liveType, eventType, cards, preCardDetails, member, leaderCharacter);
            if (cardDetails.length === preCardDetails.length) {
                throw new Error(`Cannot recommend any deck in ${cards.length} cards`);
            }
            preCardDetails = cardDetails;
            const cards0 = cardDetails.sort((a, b) => a.cardId - b.cardId);
            debugLog(`Recommend deck with ${cards0.length}/${cards.length} cards `);
            debugLog(cards0.map(it => it.cardId).toString());
            const recommend = BaseDeckRecommend.findBestCards(cards0, cards, deckDetail => scoreFunc(musicMeta, deckDetail), limit, liveType === exports.LiveType.CHALLENGE, member, leaderCharacter, honorBonus, eventConfig);
            if (recommend.length >= limit)
                return recommend;
        }
    }
}

class BloomSupportDeckRecommend {
    dataProvider;
    cardCalculator;
    eventService;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.cardCalculator = new CardCalculator(dataProvider);
        this.eventService = new EventService(dataProvider);
    }
    async recommendBloomSupportDeck(mainDeck, eventId, specialCharacterId) {
        const userCards = await this.dataProvider.getUserData('userCards');
        const eventConfig = await this.eventService.getEventConfig(eventId, specialCharacterId);
        const allCards = await this.cardCalculator.batchGetCardDetail(userCards, {}, eventConfig);
        return EventCalculator.getSupportDeckBonus(mainDeck, allCards).cards;
    }
}

class ChallengeLiveDeckRecommend {
    dataProvider;
    baseRecommend;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.baseRecommend = new BaseDeckRecommend(dataProvider);
    }
    async recommendChallengeLiveDeck(characterId, config) {
        const userCards = await this.dataProvider.getUserData('userCards');
        const cards = await this.dataProvider.getMasterData('cards');
        const characterCards = userCards
            .filter(userCard => findOrThrow(cards, it => it.id === userCard.cardId).characterId === characterId);
        return await this.baseRecommend.recommendHighScoreDeck(characterCards, LiveCalculator.getLiveScoreFunction(exports.LiveType.SOLO), config, exports.LiveType.CHALLENGE);
    }
}

class EventDeckRecommend {
    dataProvider;
    baseRecommend;
    eventService;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.baseRecommend = new BaseDeckRecommend(dataProvider);
        this.eventService = new EventService(dataProvider);
    }
    async recommendEventDeck(eventId, liveType, config, specialCharacterId = 0) {
        const eventConfig = await this.eventService.getEventConfig(eventId, specialCharacterId);
        if (eventConfig.eventType === undefined)
            throw new Error(`Event type not found for ${eventId}`);
        const userCards = await this.dataProvider.getUserData('userCards');
        return await this.baseRecommend.recommendHighScoreDeck(userCards, EventCalculator.getEventPointFunction(liveType, eventConfig.eventType), config, liveType, eventConfig);
    }
}

class MusicRecommend {
    dataProvider;
    deckCalculator;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.deckCalculator = new DeckCalculator(dataProvider);
    }
    getRecommendMusic(deck, musicMeta, liveType, eventType) {
        const liveScore = new Map();
        const eventPoint = new Map();
        const deckBonus = deck.eventBonus;
        const score = LiveCalculator.getLiveDetailByDeck(deck, musicMeta, liveType).score;
        liveScore.set(liveType, score);
        if (deck.eventBonus !== undefined || liveType === exports.LiveType.CHALLENGE) {
            const point = EventCalculator.getEventPoint(liveType, eventType, score, musicMeta.event_rate, deckBonus);
            eventPoint.set(liveType, point);
        }
        return {
            musicId: musicMeta.music_id,
            difficulty: musicMeta.difficulty,
            liveScore,
            eventPoint
        };
    }
    async recommendMusic(deck, liveType, eventType = exports.EventType.NONE) {
        const musicMetas = await this.dataProvider.getMusicMeta();
        return musicMetas.map(it => this.getRecommendMusic(deck, it, liveType, eventType));
    }
}

exports.AreaItemRecommend = AreaItemRecommend;
exports.AreaItemService = AreaItemService;
exports.BaseDeckRecommend = BaseDeckRecommend;
exports.BloomSupportDeckRecommend = BloomSupportDeckRecommend;
exports.CachedDataProvider = CachedDataProvider;
exports.CardCalculator = CardCalculator;
exports.CardEventCalculator = CardEventCalculator;
exports.CardPowerCalculator = CardPowerCalculator;
exports.CardService = CardService;
exports.CardSkillCalculator = CardSkillCalculator;
exports.ChallengeLiveDeckRecommend = ChallengeLiveDeckRecommend;
exports.DeckCalculator = DeckCalculator;
exports.DeckService = DeckService;
exports.EventCalculator = EventCalculator;
exports.EventDeckRecommend = EventDeckRecommend;
exports.EventService = EventService;
exports.LiveCalculator = LiveCalculator;
exports.LiveExactCalculator = LiveExactCalculator;
exports.MusicRecommend = MusicRecommend;
