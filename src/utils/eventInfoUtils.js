export const EVENT_ATTRS = [
    { key: 'cool', label: '쿨', file: 'cool.webp', color: 'bg-blue-50 border-blue-200' },
    { key: 'pure', label: '퓨어', file: 'pure.webp', color: 'bg-green-50 border-green-200' },
    { key: 'mysterious', label: '미스', file: 'mysterious.webp', color: 'bg-purple-50 border-purple-200' },
    { key: 'happy', label: '해피', file: 'happy.webp', color: 'bg-orange-50 border-orange-200' },
    { key: 'cute', label: '큐트', file: 'cute.webp', color: 'bg-pink-50 border-pink-200' },
    { key: 'wl', label: 'WL' },
];

export const EVENT_UNITS = [
    { key: 'light_sound', label: 'L/n', file: 'Lnlogo.webp', chars: [1, 2, 3, 4] },
    { key: 'idol', label: 'MMJ', file: 'MMJlogo.webp', chars: [5, 6, 7, 8] },
    { key: 'street', label: 'VBS', file: 'VBSlogo.webp', chars: [9, 10, 11, 12] },
    { key: 'theme_park', label: 'WxS', file: 'WxSlogo.webp', chars: [13, 14, 15, 16] },
    { key: 'school_refusal', label: '25시', file: '25jilogo.webp', chars: [17, 18, 19, 20] },
];

export const ORIGINAL_CHAR_UNIT = {
    1: 'light_sound', 2: 'light_sound', 3: 'light_sound', 4: 'light_sound',
    5: 'idol', 6: 'idol', 7: 'idol', 8: 'idol',
    9: 'street', 10: 'street', 11: 'street', 12: 'street',
    13: 'theme_park', 14: 'theme_park', 15: 'theme_park', 16: 'theme_park',
    17: 'school_refusal', 18: 'school_refusal', 19: 'school_refusal', 20: 'school_refusal',
};

export const VS_CHAR_IDS = [21, 22, 23, 24, 25, 26];
export const EVENT_ASSET_BASE = 'https://asset.rilaksekai.com/suite';
export const EVENT_API_URL = 'https://api.rilaksekai.com/api/events';
export const CARD_API_URL = 'https://api.rilaksekai.com/api/cards';
export const DEFAULT_AUTO_EVENT_OVERRIDE = { attr: '', unit: '', isMix: false, eventCardIds: [] };

export let autoEventOverrideCache = null;
let autoEventOverridePromise = null;

export const selectCurrentOrLatestEvent = (events, now = Date.now()) => {
    const normalEvents = events.filter(event => event && event.eventType !== 'chapter');
    const ongoingEvents = normalEvents.filter(event => (event.startAt || 0) <= now && now <= (event.aggregateAt || 0));
    const candidates = ongoingEvents.length > 0 ? ongoingEvents : normalEvents;
    return candidates
        .slice()
        .sort((a, b) => (b.startAt || 0) - (a.startAt || 0) || (b.id || 0) - (a.id || 0))[0];
};

export const getCurrentEventBonusRows = (eventBonuses, currentEvent) => {
    if (!currentEvent) return [];
    return eventBonuses.filter(row => row.eventId === currentEvent.id);
};

export const getEventUnitFromEvent = (event) => (
    EVENT_UNITS.some(unit => unit.key === event?.unit) ? event.unit : ''
);

export const getCardAttr = (card) => card?.cardAttr || card?.attr || card?.attribute || '';

export const getCardRarity = (card) => {
    if (!card) return 0;
    if (card.cardRarityType === 'rarity_birthday') return 5;
    if (card.cardRarityType) return Number(String(card.cardRarityType).replace('rarity_', '')) || 0;
    return Number(card.rarity) || 0;
};

export const inferEventAttrFromCards = (event, cards = []) => {
    const eventCardIds = new Set((event?.eventCards || []).map(card => Number(card?.id ?? card)));
    if (eventCardIds.size === 0) return '';

    const eventCards = cards.filter(card => eventCardIds.has(Number(card.id)));
    const highRarityCards = eventCards.filter(card => getCardRarity(card) >= 3);
    const attrCards = highRarityCards.length > 0 ? highRarityCards : eventCards;
    const counts = attrCards.reduce((acc, card) => {
        const attr = getCardAttr(card);
        if (attr) acc[attr] = (acc[attr] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
};

export const inferCurrentEventOverride = (events, eventBonuses, gameCharacterUnits, cards = []) => {
    const currentEvent = selectCurrentOrLatestEvent(events);
    if (!currentEvent) return { attr: '', unit: '', isMix: false };

    const gameCharacterUnitById = new Map(gameCharacterUnits.map(unit => [unit.id, unit]));
    const rows = getCurrentEventBonusRows(eventBonuses, currentEvent);
    const fallbackUnit = getEventUnitFromEvent(currentEvent);
    const attr = currentEvent.eventType === 'world_bloom'
        ? 'wl'
        : (rows.find(row => row.cardAttr)?.cardAttr || inferEventAttrFromCards(currentEvent, cards));
    const characterUnits = rows
        .map(row => gameCharacterUnitById.get(row.gameCharacterUnitId))
        .filter(Boolean);
    const originalUnits = new Set(
        characterUnits
            .map(unit => ORIGINAL_CHAR_UNIT[unit.gameCharacterId])
            .filter(Boolean)
    );
    const virtualSingerUnits = new Set(
        characterUnits
            .filter(unit => unit.gameCharacterId >= 21 && EVENT_UNITS.some(eventUnit => eventUnit.key === unit.unit))
            .map(unit => unit.unit)
    );
    const unit = originalUnits.size === 1
        ? [...originalUnits][0]
        : (originalUnits.size === 0 && virtualSingerUnits.size === 1 ? [...virtualSingerUnits][0] : '');

    const eventCardIds = (currentEvent?.eventCards || []).map(card => Number(card?.id ?? card));

    // Build characters map: charId -> unit key (for mixed events / VS chars)
    // This lets checkCardBonus know which unit each character participates as
    const characters = {};
    characterUnits.forEach(unitInfo => {
        const charId = unitInfo.gameCharacterId;
        const unitKey = ORIGINAL_CHAR_UNIT[charId] || (
            (unitInfo.unit === 'none' || EVENT_UNITS.some(u => u.key === unitInfo.unit)) ? unitInfo.unit : null
        );
        if (charId && unitKey) {
            characters[charId] = unitKey;
        }
    });

    return {
        attr,
        unit: unit || fallbackUnit,
        isMix: !unit && !fallbackUnit && characterUnits.length > 0,
        eventCardIds,
        characters: Object.keys(characters).length > 0 ? characters : null,
    };
};

export const loadAutoEventOverride = async () => {
    if (autoEventOverrideCache) return autoEventOverrideCache;
    if (!autoEventOverridePromise) {
        autoEventOverridePromise = Promise.all([
            fetch(EVENT_API_URL, { cache: 'no-store' }).then(res => res.json()),
            fetch(`${EVENT_ASSET_BASE}/eventDeckBonuses.json`).then(res => res.json()),
            fetch(`${EVENT_ASSET_BASE}/gameCharacterUnits.json`).then(res => res.json()),
        ]).then(([events, eventBonuses, gameCharacterUnits]) => {
            const currentEvent = selectCurrentOrLatestEvent(events);
            if (getCurrentEventBonusRows(eventBonuses, currentEvent).length > 0) {
                autoEventOverrideCache = inferCurrentEventOverride(events, eventBonuses, gameCharacterUnits);
                return autoEventOverrideCache;
            }
            return fetch(CARD_API_URL, { cache: 'no-store' })
                .then(res => res.json())
                .then(cards => {
                    autoEventOverrideCache = inferCurrentEventOverride(events, eventBonuses, gameCharacterUnits, cards);
                    return autoEventOverrideCache;
                });
        }).catch(err => {
            autoEventOverridePromise = null;
            throw err;
        });
    }
    return autoEventOverridePromise;
};
