interface MusicMeta {
    music_id: number;
    difficulty: string;
    music_time: number;
    event_rate: number;
    base_score: number;
    base_score_auto: number;
    skill_score_solo: number[];
    skill_score_auto: number[];
    skill_score_multi: number[];
    fever_score: number;
    fever_end_time: number;
    tap_count: number;
}

interface DataProvider {
    getMasterData: <T>(key: string) => Promise<T[]>;
    getUserDataAll: () => Promise<Record<string, any>>;
    getUserData: <T>(key: string) => Promise<T>;
    getMusicMeta: () => Promise<MusicMeta[]>;
}

declare class CachedDataProvider implements DataProvider {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    private static readonly globalCache;
    private readonly instanceCache;
    private static readonly runningPromise;
    private getData;
    getMasterData<T>(key: string): Promise<T[]>;
    getMusicMeta(): Promise<MusicMeta[]>;
    getUserData<T>(key: string): Promise<T>;
    getUserDataAll(): Promise<Record<string, any>>;
    preloadMasterData(keys: string[]): Promise<any[]>;
}

interface AreaItemLevel {
    areaItemId: number;
    level: number;
    targetUnit: string;
    targetCardAttr: string;
    targetGameCharacterId?: number;
    power1BonusRate: number;
    power1AllMatchBonusRate: number;
    power2BonusRate: number;
    power2AllMatchBonusRate: number;
    power3BonusRate: number;
    power3AllMatchBonusRate: number;
    sentence: string;
}

interface AreaItem {
    id: number;
    areaId: number;
    name: string;
    flavorText: string;
    spawnPoint: string;
    assetbundleName: string;
}

interface CommonResource {
    resourceId?: number;
    resourceType: string;
    resourceLevel?: number;
    quantity: number;
}

interface ShopItem {
    id: number;
    shopId: number;
    seq: number;
    releaseConditionId: number;
    resourceBoxId: number;
    costs: Array<{
        shopItemId: number;
        seq: number;
        cost: CommonResource;
    }>;
}

declare class AreaItemService {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    getAreaItemLevels(): Promise<AreaItemLevel[]>;
    getAreaItemLevel(areaItemId: number, level: number): Promise<AreaItemLevel>;
    getAreaItemNextLevel(areaItem: AreaItem, areaItemLevel?: AreaItemLevel): Promise<AreaItemLevel>;
    getShopItem(areaItemLevel: AreaItemLevel): Promise<ShopItem>;
}

interface Card {
    id: number;
    seq: number;
    characterId: number;
    cardRarityType: string;
    specialTrainingPower1BonusFixed: number;
    specialTrainingPower2BonusFixed: number;
    specialTrainingPower3BonusFixed: number;
    attr: string;
    supportUnit: string;
    skillId: number;
    cardSkillName: string;
    specialTrainingSkillId?: number;
    specialTrainingSkillName?: string;
    prefix: string;
    assetbundleName: string;
    gachaPhrase: string;
    flavorText: string;
    releaseAt: number;
    cardParameters: Array<{
        id: number;
        cardId: number;
        cardLevel: number;
        cardParameterType: string;
        power: number;
    }>;
    specialTrainingCosts: Array<{
        cardId: number;
        seq: number;
        cost: CommonResource;
    }>;
    masterLessonAchieveResources: {
        releaseConditionId: number;
        cardId: number;
        masterRank: number;
        resources: CommonResource[];
    };
}

interface UserCard {
    userId: number;
    cardId: number;
    level: number;
    exp?: number;
    totalExp: number;
    skillLevel: number;
    skillExp: number;
    totalSkillExp: number;
    masterRank: number;
    specialTrainingStatus: string;
    defaultImage: string;
    duplicateCount: number;
    createdAt: number;
    episodes?: Array<{
        cardEpisodeId: number;
        scenarioStatus: string;
        scenarioStatusReasons: string[];
        isNotSkipped: boolean;
    }>;
}

interface WorldBloomDifferentAttributeBonus {
    attributeCount: number;
    bonusRate: number;
}

declare class EventService {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    getEventType(eventId: number): Promise<EventType>;
    getEventConfig(eventId: number, specialCharacterId?: number): Promise<EventConfig>;
    getEventBonusUnit(eventId: number): Promise<string | undefined>;
    getWorldBloomDifferentAttributeBonuses(): Promise<WorldBloomDifferentAttributeBonus[]>;
    getEventCardBonusCountLimit(eventId: number): Promise<number>;
    getEventSkillScoreUpLimit(eventId: number): Promise<number>;
    getMysekaiFixtureLimit(eventId: number): Promise<number>;
    getWorldBloomType(eventId: number): Promise<string | undefined>;
    getWorldBloomSupportUnit(specialCharacterId?: number): Promise<string | undefined>;
    static isWorldBloomFinale(worldBloomType?: string): boolean;
}
declare enum EventType {
    NONE = "none",
    MARATHON = "marathon",
    CHEERFUL = "cheerful_carnival",
    BLOOM = "world_bloom"
}
interface EventConfig {
    eventId?: number;
    eventType?: EventType;
    eventUnit?: string;
    specialCharacterId?: number;
    cardBonusCountLimit?: number;
    skillScoreUpLimit?: number;
    mysekaiFixtureLimit?: number;
    worldBloomDifferentAttributeBonuses?: WorldBloomDifferentAttributeBonus[];
    worldBloomType?: string;
    worldBloomSupportUnit?: string;
}

interface MysekaiGateBonus {
    unit: string;
    powerBonusRate: number;
}

declare class CardDetailMap<T> {
    private min;
    private max;
    private readonly values;
    protected set(unit: string, unitMember: number, attrMember: number, cmpValue: number, value: T): void;
    protected updateMinMax(cmpValue: number): void;
    protected getInternal(unit: string, unitMember: number, attrMember: number): T | undefined;
    protected static getKey(unit: string, unitMember: number, attrMember: number): string;
    isCertainlyLessThen(another: CardDetailMap<T>): boolean;
}

declare class DeckCalculator {
    private readonly dataProvider;
    private readonly cardCalculator;
    private readonly eventCalculator;
    constructor(dataProvider: DataProvider);
    getHonorBonusPower(): Promise<number>;
    static getDeckDetailByCards(cardDetails: CardDetail[], allCards: CardDetail[], honorBonus: number, cardBonusCountLimit?: number, worldBloomDifferentAttributeBonuses?: WorldBloomDifferentAttributeBonus[]): DeckDetail;
    private static sumPower;
    getDeckDetail(deckCards: UserCard[], allCards: UserCard[], eventConfig?: EventConfig, areaItemLevels?: AreaItemLevel[]): Promise<DeckDetail>;
}
interface DeckDetail {
    power: DeckPowerDetail;
    eventBonus?: number;
    supportDeckBonus?: number;
    cards: DeckCardDetail[];
}
interface DeckCardDetail {
    cardId: number;
    level: number;
    skillLevel: number;
    masterRank: number;
    power: DeckCardPowerDetail;
    eventBonus?: string;
    skill: DeckCardSkillDetail;
}
interface DeckPowerDetail {
    base: number;
    areaItemBonus: number;
    characterBonus: number;
    honorBonus: number;
    fixtureBonus: number;
    gateBonus: number;
    total: number;
}
interface DeckCardPowerDetail {
    base: number;
    areaItemBonus: number;
    characterBonus: number;
    fixtureBonus: number;
    gateBonus: number;
    total: number;
}
interface DeckCardSkillDetail {
    scoreUp: number;
    lifeRecovery: number;
}

declare class CardDetailMapPower extends CardDetailMap<DeckCardPowerDetail> {
    setPower(unit: string, sameUnit: boolean, sameAttr: boolean, value: DeckCardPowerDetail): void;
    getPower(unit: string, unitMember: number, attrMember: number): DeckCardPowerDetail;
}

declare class CardSkillCalculator {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    getCardSkill(userCard: UserCard, card: Card, scoreUpLimit?: number): Promise<CardDetailMapSkill>;
    private static updateSkillDetailMap;
    private getSkillDetails;
    private static getSkillDetail;
    private getSkills;
    private getCharacterRank;
    private static getScoreUpSelfFixed;
}
interface DeckCardSkillDetailPrepare {
    scoreUpFixed: number;
    scoreUpToReference: number;
    scoreUpReference?: {
        base: number;
        rate: number;
        max: number;
    };
    lifeRecovery: number;
}

declare class CardDetailMapSkill extends CardDetailMap<DeckCardSkillDetailPrepare> {
    private fixedSkill?;
    setFixedSkill(value: DeckCardSkillDetailPrepare): void;
    setReferenceSkill(value: DeckCardSkillDetailPrepare): void;
    setSameUnitSkill(unit: string, unitMember: number, value: DeckCardSkillDetailPrepare): void;
    setDiffUnitSkill(unitMember: number, value: DeckCardSkillDetailPrepare): void;
    getSkill(unit: string, unitMember: number): DeckCardSkillDetailPrepare;
}

declare class CardEventCalculator {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    private getEventDeckBonus;
    getCardEventBonus(userCard: UserCard, eventId: number): Promise<CardDetailMapEventBonus>;
    private getCardLeaderBonus;
}
interface CardEventBonusDetail {
    fixedBonus: number;
    cardBonus: number;
    leaderBonus: number;
}

declare class CardDetailMapEventBonus extends CardDetailMap<CardEventBonusDetail> {
    private bonus?;
    setBonus(value: CardEventBonusDetail): void;
    getBonus(): CardEventBonusDetail;
    getBonusForDisplay(leader: boolean): string;
    getMaxBonus(leader: boolean): number;
}

declare class CardCalculator {
    private readonly dataProvider;
    private readonly powerCalculator;
    private readonly skillCalculator;
    private readonly eventCalculator;
    private readonly bloomEventCalculator;
    private readonly areaItemService;
    private readonly cardService;
    private readonly mysekaiService;
    constructor(dataProvider: DataProvider);
    getCardDetail(userCard: UserCard, userAreaItemLevels: AreaItemLevel[], config: Record<string, CardConfig> | undefined, eventConfig: EventConfig | undefined, hasCanvasBonus: boolean, userGateBonuses: MysekaiGateBonus[]): Promise<CardDetail | undefined>;
    batchGetCardDetail(userCards: UserCard[], config?: Record<string, CardConfig>, eventConfig?: EventConfig, areaItemLevels?: AreaItemLevel[]): Promise<CardDetail[]>;
    static isCertainlyLessThan(cardDetail0: CardDetail, cardDetail1: CardDetail): boolean;
}
interface CardDetail {
    cardId: number;
    level: number;
    skillLevel: number;
    masterRank: number;
    cardRarityType: string;
    characterId: number;
    units: string[];
    attr: string;
    power: CardDetailMapPower;
    skill: CardDetailMapSkill;
    eventBonus?: CardDetailMapEventBonus;
    supportDeckBonus?: number;
    hasCanvasBonus: boolean;
}
interface CardConfig {
    disable?: boolean;
    rankMax?: boolean;
    episodeRead?: boolean;
    masterMax?: boolean;
    skillMax?: boolean;
}

declare class CardService {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    getCardUnits(card: Card): Promise<string[]>;
    applyCardConfig(userCard: UserCard, card: Card, { rankMax, episodeRead, masterMax, skillMax }?: CardConfig): Promise<UserCard>;
}

interface UserDeck {
    userId: number;
    deckId: number;
    name: string;
    leader: number;
    subLeader: number;
    member1: number;
    member2: number;
    member3: number;
    member4: number;
    member5: number;
}

interface UserChallengeLiveSoloDeck {
    characterId: number;
    leader: number | null;
    support1: number | null;
    support2: number | null;
    support3: number | null;
    support4: number | null;
}

interface UserWorldBloomSupportDeck {
    gameCharacterId: number;
    eventId: number;
    member1: number;
    member2: number;
    member3: number;
    member4: number;
    member5: number;
    member6: number;
    member7: number;
    member8: number;
    member9: number;
    member10: number;
    member11: number;
    member12: number;
    member13: number;
    member14: number;
    member15: number;
    member16: number;
    member17: number;
    member18: number;
    member19: number;
    member20: number;
}

declare class DeckService {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    getUserCard(cardId: number): Promise<UserCard>;
    getDeck(deckId: number): Promise<UserDeck>;
    getDeckCards(userDeck: UserDeck): Promise<UserCard[]>;
    static toUserDeck(userCards: DeckCardDetail[], userId?: number, deckId?: number, name?: string): UserDeck;
    getChallengeLiveSoloDeck(characterId: number): Promise<UserChallengeLiveSoloDeck>;
    getChallengeLiveSoloDeckCards(deck: UserChallengeLiveSoloDeck): Promise<UserCard[]>;
    static toUserChallengeLiveSoloDeck(userCards: DeckCardDetail[], characterId: number): UserChallengeLiveSoloDeck;
    static toUserWorldBloomSupportDeck(userCards: CardDetail[], eventId: number, gameCharacterId: number): UserWorldBloomSupportDeck;
}

declare class CardPowerCalculator {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    getCardPower(userCard: UserCard, card: Card, cardUnits: string[], userAreaItemLevels: AreaItemLevel[], hasCanvasBonus: boolean, userGateBonuses: MysekaiGateBonus[], mysekaiFixtureLimit?: number): Promise<CardDetailMapPower>;
    private getPower;
    private getCardBasePowers;
    private getAreaItemBonusPower;
    private getCharacterBonusPower;
    private getFixtureBonusPower;
    private getGateBonusPower;
    private static sumPower;
}

declare class BaseDeckRecommend {
    private readonly dataProvider;
    private readonly cardCalculator;
    private readonly deckCalculator;
    private readonly areaItemService;
    constructor(dataProvider: DataProvider);
    private static findBestCards;
    recommendHighScoreDeck(userCards: UserCard[], scoreFunc: ScoreFunction, { musicMeta, limit, member, leaderCharacter, cardConfig, debugLog }: DeckRecommendConfig, liveType: LiveType, eventConfig?: EventConfig): Promise<RecommendDeck[]>;
}
type ScoreFunction = (musicMeta: MusicMeta, deckDetail: DeckDetail) => number;
interface RecommendDeck extends DeckDetail {
    score: number;
}
interface DeckRecommendConfig {
    musicMeta: MusicMeta;
    limit?: number;
    member?: number;
    leaderCharacter?: number;
    cardConfig?: Record<string, CardConfig>;
    debugLog?: (str: string) => void;
}

declare class LiveCalculator {
    private readonly dataProvider;
    private readonly deckCalculator;
    private readonly eventService;
    constructor(dataProvider: DataProvider);
    getMusicMeta(musicId: number, musicDiff: string): Promise<MusicMeta>;
    private static getBaseScore;
    private static getSkillScore;
    private static getSortedSkillDetails;
    private static getSortedSkillRate;
    static getLiveDetailByDeck(deckDetail: DeckDetail, musicMeta: MusicMeta, liveType: LiveType, skillDetails?: DeckCardSkillDetail[] | undefined, multiPowerSum?: number): LiveDetail;
    static getMultiActiveBonus(powerSum: number): number;
    private static getMultiLiveSkill;
    private static getSoloLiveSkill;
    getLiveDetail(deckCards: UserCard[], musicMeta: MusicMeta, liveType: LiveType, liveSkills?: LiveSkill[] | undefined, eventId?: number): Promise<LiveDetail>;
    static getLiveScoreByDeck(deckDetail: DeckDetail, musicMeta: MusicMeta, liveType: LiveType): number;
    static getLiveScoreFunction(liveType: LiveType): ScoreFunction;
}
interface LiveDetail {
    score: number;
    time: number;
    life: number;
    tap: number;
    deck?: DeckDetail;
}
interface LiveSkill {
    seq?: number;
    cardId: number;
}
declare enum LiveType {
    SOLO = "solo",
    AUTO = "auto",
    CHALLENGE = "challenge",
    MULTI = "multi",
    CHEERFUL = "cheerful"
}

declare class EventCalculator {
    private readonly dataProvider;
    private readonly cardEventCalculator;
    private readonly eventService;
    constructor(dataProvider: DataProvider);
    getDeckEventBonus(deckCards: UserCard[], eventId: number): Promise<number>;
    static getEventPoint(liveType: LiveType, eventType: EventType, selfScore: number, musicRate?: number, deckBonus?: number, boostRate?: number, otherScore?: number, life?: number): number;
    static getDeckBonus(deckCards: Array<{
        attr: string;
        eventBonus?: CardDetailMapEventBonus;
    }>, cardBonusCountLimit?: number, worldBloomDifferentAttributeBonuses?: WorldBloomDifferentAttributeBonus[]): number | undefined;
    static getSupportDeckBonus(deckCards: Array<{
        cardId: number;
    }>, allCards: CardDetail[]): {
        bonus: number;
        cards: CardDetail[];
    };
    static getDeckEventPoint(deckDetail: DeckDetail, musicMeta: MusicMeta, liveType: LiveType, eventType: EventType): number;
    static getEventPointFunction(liveType: LiveType, eventType: EventType): ScoreFunction;
}

interface MusicScore {
    notes: MusicNote[];
    skills: MusicNoteBase[];
    fevers: MusicNoteBase[];
}
interface MusicNoteBase {
    time: number;
}
interface MusicNote extends MusicNoteBase {
    type: number;
    longId?: number;
}

declare class LiveExactCalculator {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    calculate(power: number, skills: number[], liveType: LiveType, musicScore: MusicScore, multiSumPower?: number, feverMusicScore?: MusicScore): Promise<LiveExactDetail>;
    private static getSkillDetails;
    private static getFeverDetail;
}
interface LiveExactDetail {
    total: number;
    activeBonus: number;
    notes: LiveNoteDetail[];
}
interface LiveNoteDetail {
    noteCoefficient: number;
    comboCoefficient: number;
    judgeCoefficient: number;
    effectBonuses: number[];
    score: number;
}

interface Area {
    id: number;
    assetbundleName: string;
    areaType: string;
    viewType: string;
    name: string;
    releaseConditionId: number;
}

declare class AreaItemRecommend {
    private readonly dataProvider;
    private readonly areaItemService;
    private readonly deckCalculator;
    constructor(dataProvider: DataProvider);
    private static findCost;
    private getRecommendAreaItem;
    recommendAreaItem(userCards: UserCard[]): Promise<RecommendAreaItem[]>;
}
interface RecommendAreaItem {
    area: Area;
    areaItem: AreaItem;
    areaItemLevel: AreaItemLevel;
    shopItem: ShopItem;
    cost: {
        coin: number;
        seed: number;
        szk: number;
    };
    power: number;
}

declare class BloomSupportDeckRecommend {
    private readonly dataProvider;
    private readonly cardCalculator;
    private readonly eventService;
    constructor(dataProvider: DataProvider);
    recommendBloomSupportDeck(mainDeck: Array<{
        cardId: number;
    }>, eventId: number, specialCharacterId: number): Promise<CardDetail[]>;
}

declare class ChallengeLiveDeckRecommend {
    private readonly dataProvider;
    private readonly baseRecommend;
    constructor(dataProvider: DataProvider);
    recommendChallengeLiveDeck(characterId: number, config: DeckRecommendConfig): Promise<RecommendDeck[]>;
}

declare class EventDeckRecommend {
    private readonly dataProvider;
    private readonly baseRecommend;
    private readonly eventService;
    constructor(dataProvider: DataProvider);
    recommendEventDeck(eventId: number, liveType: LiveType, config: DeckRecommendConfig, specialCharacterId?: number): Promise<RecommendDeck[]>;
}

declare class MusicRecommend {
    private readonly dataProvider;
    private readonly deckCalculator;
    constructor(dataProvider: DataProvider);
    private getRecommendMusic;
    recommendMusic(deck: DeckDetail, liveType: LiveType, eventType?: EventType): Promise<RecommendMusic[]>;
}
interface RecommendMusic {
    musicId: number;
    difficulty: string;
    liveScore: Map<LiveType, number>;
    eventPoint: Map<LiveType, number>;
}

interface CardEpisode {
    id: number;
    seq: number;
    cardId: number;
    title: string;
    scenarioId: string;
    assetbundleName: string;
    releaseConditionId: number;
    power1BonusFixed: number;
    power2BonusFixed: number;
    power3BonusFixed: number;
    rewardResourceBoxIds: number[];
    costs: CommonResource[];
    cardEpisodePartType: string;
}

interface CardRarity {
    cardRarityType: string;
    seq: number;
    maxLevel: number;
    trainingMaxLevel?: number;
    maxSkillLevel: number;
}

interface CharacterRank {
    id: number;
    characterId: number;
    characterRank: number;
    power1BonusRate: number;
    power2BonusRate: number;
    power3BonusRate: number;
    rewardResourceBoxIds: number[];
    characterRankAchieveResources: Array<{
        releaseConditionId: number;
        characterId: number;
        characterRank: number;
        resources: CommonResource[];
    }>;
}

interface Event {
    id: number;
    eventType: string;
    name: string;
    assetbundleName: string;
    bgmAssetbundleName: string;
    startAt: any;
    aggregateAt: any;
    rankingAnnounceAt: any;
    distributionStartAt: any;
    closedAt: any;
    distributionEndAt: any;
    virtualLiveId: number;
    eventRankingRewardRanges: Array<{
        id: number;
        eventId: number;
        fromRank: number;
        toRank: number;
        eventRankingRewards: Array<{
            id: number;
            eventRankingRewardRangeId: number;
            resourceBoxId: number;
        }>;
    }>;
}

interface EventCard {
    id: number;
    cardId: number;
    eventId: number;
    bonusRate: number;
    leaderBonusRate: number;
    isDisplayCardStory: boolean;
}

interface EventDeckBonus {
    id: number;
    eventId: number;
    gameCharacterUnitId?: number;
    cardAttr?: string;
    bonusRate: number;
}

interface EventExchange {
    id: number;
    resourceBoxId: number;
    exchangeLimit: number;
    eventExchangeCost: {
        id: number;
        eventExchangeId: number;
        resourceType: string;
        resourceId: number;
        resourceQuantity: number;
    };
}

interface EventItem {
    id: number;
    eventId: number;
    gameCharacterId?: number;
    name: string;
    flavorText: string;
    assetbundleName?: string;
}

interface EventRarityBonusRate {
    id: number;
    cardRarityType: string;
    masterRank: number;
    bonusRate: number;
}

interface GameCharacter {
    id: number;
    seq: number;
    resourceId: number;
    firstName?: string;
    givenName: string;
    firstNameRuby?: string;
    givenNameRuby: string;
    gender: string;
    height: number;
    live2dHeightAdjustment: number;
    figure: string;
    breastSize: string;
    modelName: string;
    unit: string;
    supportUnitType: string;
}

interface GameCharacterUnit {
    id: number;
    gameCharacterId: number;
    unit: string;
    colorCode: string;
    skinColorCode: string;
    skinShadowColorCode1: string;
    skinShadowColorCode2: string;
}

interface Honor {
    id: number;
    seq: number;
    groupId: number;
    honorRarity: string;
    name: string;
    assetbundleName: string;
    levels: Array<{
        honorId: number;
        level: number;
        bonus: number;
        description: string;
    }>;
}

interface MasterLesson {
    cardRarityType: string;
    masterRank: number;
    power1BonusFixed: number;
    power2BonusFixed: number;
    power3BonusFixed: number;
    characterRankExp: number;
    costs: CommonResource[];
    rewards: CommonResource[];
}

interface Music {
    id: number;
    seq: number;
    releaseConditionId: number;
    categories: string[];
    title: string;
    pronunciation: string;
    creator: string;
    lyricist: string;
    composer: string;
    arranger: string;
    dancerCount: number;
    selfDancerPosition: number;
    assetbundleName: string;
    liveTalkBackgroundAssetbundleName: string;
    publishedAt: number;
    liveStageId: number;
    fillerSec: number;
}

interface MusicDifficulty {
    id: number;
    musicId: number;
    musicDifficulty: string;
    playLevel: number;
    releaseConditionId: number;
    totalNoteCount: number;
}

interface MusicVocal {
    id: number;
    musicId: number;
    musicVocalType: string;
    seq: number;
    releaseConditionId: number;
    caption: string;
    characters: Array<{
        id: number;
        musicId: number;
        musicVocalId: number;
        characterType: string;
        characterId: number;
        seq: number;
    }>;
    assetbundleName: string;
    archivePublishedAt: number;
}

interface Skill {
    id: number;
    shortDescription: string;
    description: string;
    descriptionSpriteName: string;
    skillFilterId: number;
    skillEffects: Array<{
        id: number;
        skillEffectType: string;
        activateNotesJudgmentType: string;
        activateCharacterRank?: number;
        activateUnitCount?: number;
        conditionType?: string;
        skillEffectDetails: Array<{
            id: number;
            level: number;
            activateEffectDuration: number;
            activateEffectValueType: string;
            activateEffectValue: number;
            activateEffectValue2?: number;
        }>;
        skillEnhance?: {
            id: number;
            skillEnhanceType: string;
            activateEffectValueType: string;
            activateEffectValue: number;
            skillEnhanceCondition: {
                id: number;
                seq: number;
                unit: string;
            };
        };
    }>;
}

interface WorldBloom {
    id: number;
    eventId: number;
    gameCharacterId: number;
    worldBloomChapterType: string;
    chapterNo: number;
    chapterStartAt: number;
    aggregateAt: number;
    chapterEndAt: number;
    isSupplemental: boolean;
}

interface WorldBloomSupportDeckBonus {
    cardRarityType: string;
    worldBloomSupportDeckCharacterBonuses: Array<{
        id: number;
        worldBloomSupportDeckCharacterType: string;
        bonusRate: number;
    }>;
    worldBloomSupportDeckMasterRankBonuses: Array<{
        id: number;
        masterRank: number;
        bonusRate: number;
    }>;
    worldBloomSupportDeckSkillLevelBonuses: Array<{
        id: number;
        skillLevel: number;
        bonusRate: number;
    }>;
}

interface User {
    userRegistration: {
        userId: number;
        signature: string;
        platform: string;
        deviceModel: string;
        operatingSystem: string;
        yearOfBirth: number;
        monthOfBirth: number;
        dayOfBirth: number;
        age: number;
        billableLimitAgeType: string;
        registeredAt: number;
    };
    userGamedata: {
        userId: number;
        name: string;
        deck: number;
        customProfileId: number;
        rank: number;
        exp: number;
        totalExp: number;
        coin: number;
        virtualCoin: number;
        lastLoginAt: number;
        chargedCurrency: {
            paid: number;
            free: number;
            paidUnitPrices: Array<{
                remaining: number;
                unitPrice: number;
            }>;
        };
        boost: {
            current: number;
            recoveryAt: number;
        };
    };
}

interface UserArea {
    areaId: number;
    actionSets: Array<{
        id: number;
        status: string;
    }>;
    areaItems: Array<{
        areaItemId: number;
        level: number;
    }>;
    userAreaStatus: {
        areaId: number;
        status: string;
    };
}

interface UserCharacter {
    characterId: number;
    characterRank: number;
}

interface UserHonor {
    honorId: number;
    level: number;
}

export { Area, AreaItem, AreaItemLevel, AreaItemRecommend, AreaItemService, BaseDeckRecommend, BloomSupportDeckRecommend, CachedDataProvider, Card, CardCalculator, CardConfig, CardDetail, CardEpisode, CardEventBonusDetail, CardEventCalculator, CardPowerCalculator, CardRarity, CardService, CardSkillCalculator, ChallengeLiveDeckRecommend, CharacterRank, DataProvider, DeckCalculator, DeckCardDetail, DeckCardPowerDetail, DeckCardSkillDetail, DeckCardSkillDetailPrepare, DeckDetail, DeckPowerDetail, DeckRecommendConfig, DeckService, Event, EventCalculator, EventCard, EventConfig, EventDeckBonus, EventDeckRecommend, EventExchange, EventItem, EventRarityBonusRate, EventService, EventType, GameCharacter, GameCharacterUnit, Honor, LiveCalculator, LiveDetail, LiveExactCalculator, LiveExactDetail, LiveNoteDetail, LiveSkill, LiveType, MasterLesson, Music, MusicDifficulty, MusicMeta, MusicRecommend, MusicVocal, RecommendAreaItem, RecommendDeck, ScoreFunction, ShopItem, Skill, User, UserArea, UserCard, UserChallengeLiveSoloDeck, UserCharacter, UserDeck, UserHonor, UserWorldBloomSupportDeck, WorldBloom, WorldBloomDifferentAttributeBonus, WorldBloomSupportDeckBonus };
