import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { characterBirthdays } from '../data/characterBirthdays';
import playerLevelData from '../data/player_levels.json';
import { getCardCharacterId as getSupportCardCharacterId } from '../utils/supportCardUtils';
import { API_BASE_URL, ASSET_BASE_URL, joinUrl } from '../config/env';

const findPlayerLevelInfo = (level) => playerLevelData.find(d => {
  if (d.range === String(level)) return true;
  if (d.range.includes('~')) {
    const [min, max] = d.range.split('~').map(Number);
    return level >= min && level <= max;
  }
  return false;
});

const getLiveRankExpBonus = (rank) => {
  if (rank === 'A') return 1400;
  if (rank === 'B') return 1200;
  if (rank === 'C') return 1000;
  return 1600;
};

const SUITE_BASE_URL = `${ASSET_BASE_URL}/suite`;
const THUMBNAIL_BASE_URL = `${ASSET_BASE_URL}/thumbnail`;
const EVENT_EXCHANGE_SUMMARIES_URL = `${SUITE_BASE_URL}/eventExchangeSummaries.json`;
const RESOURCE_BOXES_URL = `${SUITE_BASE_URL}/resourceBoxes.json`;
const MATERIALS_URL = `${SUITE_BASE_URL}/materials.json`;
const MYSEKAI_MATERIALS_URL = `${SUITE_BASE_URL}/mysekaiMaterials.json`;
const EVENT_ITEMS_URL = `${SUITE_BASE_URL}/eventItems.json`;
const PRACTICE_TICKETS_URL = `${SUITE_BASE_URL}/practiceTickets.json`;
const SKILL_PRACTICE_TICKETS_URL = `${SUITE_BASE_URL}/skillPracticeTickets.json`;
const BOOST_ITEMS_URL = `${SUITE_BASE_URL}/boostItems.json`;
const GAME_CHARACTERS_URL = `${SUITE_BASE_URL}/gameCharacters.json`;
const CARD_API_URL = joinUrl(API_BASE_URL, 'api/cards');

const SHOP_STATE_STORAGE_KEY = 'prskEventShopSimulatorStateV1';
const SHOP_PRESETS_STORAGE_KEY = 'prskEventShopSimulatorPresetsV1';
const SHOP_ITEM_COUNTS_STORAGE_KEY = 'prskEventShopSimulatorItemCountsV1';
const SHOP_PRESET_SLOT_COUNT = 3;
const DEFAULT_BADGE_IMAGE = `${THUMBNAIL_BASE_URL}/common_event/icon_point/icon_eventPoint_1.webp`;

const RESOURCE_NAME_FALLBACKS = {
  boost_item: 'ライブボーナスドリンク',
  card: 'メンバー',
  coin: 'コイン',
  event_item: 'イベントバッジ',
  jewel: 'クリスタル',
  material: 'アイテム',
  mysekai_material: 'マイセカイ素材',
  paid_jewel: '有償クリスタル',
  practice_ticket: '練習用スコア',
  skill_practice_ticket: 'スキルアップ用スコア',
  virtual_coin: 'バーチャルコイン',
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toPositiveInteger = (value, fallback = 0) => {
  const number = Math.floor(toNumber(value, fallback));
  return Math.max(0, number);
};

const toTimestampMs = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue;

    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric < 1000000000000 ? numeric * 1000 : numeric;
    }

    const parsed = new Date(value).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
};

const getNaturalCalculationEndMs = (summary, eventInfo) => (
  toTimestampMs(
    summary?.aggregateAt,
    summary?.endAt,
    summary?.end,
    eventInfo?.aggregateAt,
    eventInfo?.endAt,
    eventInfo?.end
  )
);

const getFireConsumption = (fireOption) => {
  const fireaMap = {
    '1': 0,
    '5': 1,
    '10': 2,
    '15': 3,
    '20': 4,
    '25': 5,
    '27': 6,
    '29': 7,
    '31': 8,
    '33': 9,
    '35': 10,
  };
  return fireaMap[String(fireOption)] ?? 0;
};

const buildLookup = (items) => new Map(
  (Array.isArray(items) ? items : [])
    .filter(item => item && item.id !== undefined)
    .map(item => [Number(item.id), item])
);

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return response.json();
};

const getCardRarityLabel = (card) => {
  const match = String(card?.cardRarityType || '').match(/rarity_(\d+)/);
  if (match) return `${match[1]}★`;
  const rarity = toPositiveInteger(card?.rarity, 0);
  return rarity > 0 ? `${rarity}★` : RESOURCE_NAME_FALLBACKS.card;
};

const getCardCharacterId = (card, lookups) => {
  if (card?.characterId) return String(card.characterId).padStart(3, '0');
  if (card?.gameCharacterId) return String(card.gameCharacterId).padStart(3, '0');

  const supportCharacterId = getSupportCardCharacterId(card);
  if (supportCharacterId) return String(supportCharacterId).padStart(3, '0');

  const characterName = String(card?.character || '');
  const character = Array.from(lookups.gameCharacters.values()).find(row => (
    row.givenName === characterName
    || row.givenNameEnglish === characterName
    || `${row.firstName || ''}${row.givenName || ''}` === characterName
  ));
  return character ? String(Number(character.id)).padStart(3, '0') : '';
};

const getCardAssetbundleName = (card, lookups) => {
  if (card?.assetbundleName) return card.assetbundleName;
  if (card?.assetBundleName) return card.assetBundleName;

  const characterId = getCardCharacterId(card, lookups);
  const cardImageId = card?.card_image_id || card?.cardImageId;
  return characterId && cardImageId ? `res${characterId}_no${cardImageId}` : '';
};

const getCardImageUrl = (card, lookups) => (
  getCardAssetbundleName(card, lookups)
    ? `${THUMBNAIL_BASE_URL}/chara/${getCardAssetbundleName(card, lookups)}_normal.webp`
    : ''
);

const getShopCardFaceSuffix = (card) => {
  const rarity = Number(card?.rarity) || 0;
  if (rarity <= 2 || card?.type === 'Birthday' || card?.type === 'Anniversary') return 'normal';
  return 'after_training';
};

const getShopCardCharacterId = (card) => {
  const supportCharacterId = getSupportCardCharacterId(card);
  if (supportCharacterId) return String(supportCharacterId).padStart(2, '0');

  const explicitCharacterId = card?.characterId ?? card?.gameCharacterId;
  if (explicitCharacterId) return String(Number(explicitCharacterId)).padStart(2, '0');

  const assetbundleName = String(card?.assetbundleName || card?.assetBundleName || '');
  const assetCharacterMatch = assetbundleName.match(/^res0?(\d+)_no/);
  if (assetCharacterMatch) return String(Number(assetCharacterMatch[1])).padStart(2, '0');

  return '';
};

const getShopCardFaceUrl = (card, suffix = getShopCardFaceSuffix(card)) => {
  const characterId = getShopCardCharacterId(card);
  const cardImageId = card?.card_image_id || card?.cardImageId;
  if (!characterId || !cardImageId) return '';
  return `${ASSET_BASE_URL}/face/res0${characterId}_no${String(cardImageId).padStart(3, '0')}_${suffix}.webp`;
};

const ShopCardThumbnail = ({ card }) => {
  const [imageSrc, setImageSrc] = useState(() => getShopCardFaceUrl(card));
  const publicUrl = process.env.PUBLIC_URL || '';

  useEffect(() => {
    setImageSrc(getShopCardFaceUrl(card));
  }, [card]);

  if (!card) return null;

  const rarity = toPositiveInteger(card.rarity, 0);
  const isBirthday = card.type === 'Birthday' || card.type === 'Anniversary';
  const isLowRarity = rarity > 0 && rarity <= 2;
  const frameName = isBirthday ? 'cardFrame_bd.webp' : isLowRarity ? 'frame_2star.webp' : 'Frame.webp';
  const starName = isBirthday ? 'rairity_birth.webp' : isLowRarity ? 'star_normal.webp' : 'afterstar.webp';
  const attrName = String(card.attr || card.attribute || 'pure').toLowerCase();

  return (
    <div className="event-shop-card-thumb">
      {imageSrc && (
        <img
          className="event-shop-card-face"
          src={imageSrc}
          alt={card.cardTitle || card.title || card.character || ''}
          loading="lazy"
          onError={() => {
            if (imageSrc.includes('after_training')) {
              setImageSrc(getShopCardFaceUrl(card, 'normal'));
            } else {
              setImageSrc('');
            }
          }}
        />
      )}
      <img className="event-shop-card-frame" src={`${publicUrl}/assets/card_style/${frameName}`} alt="" />
      <img className="event-shop-card-attribute" src={`${publicUrl}/assets/card_style/${attrName}.webp`} alt="" />
      {isBirthday && <img className="event-shop-card-birthday" src={`${publicUrl}/assets/card_style/${starName}`} alt="" />}
      {!isBirthday && rarity > 0 && (
        <div className="event-shop-card-stars">
          {Array.from({ length: rarity }).map((_, index) => (
            <img key={index} src={`${publicUrl}/assets/card_style/${starName}`} alt="" />
          ))}
        </div>
      )}
    </div>
  );
};

const getBadgeImageUrl = (eventItem) => (
  eventItem?.assetbundleName
    ? `${THUMBNAIL_BASE_URL}/common_event/${eventItem.assetbundleName}/icon_eventBadge_1.webp`
    : DEFAULT_BADGE_IMAGE
);

const getCommonMaterialImageUrl = (resourceType) => {
  if (resourceType === 'jewel') return `${THUMBNAIL_BASE_URL}/common_material/jewel.webp`;
  if (resourceType === 'paid_jewel') return `${THUMBNAIL_BASE_URL}/common_material/jewel.webp`;
  if (resourceType === 'coin') return `${THUMBNAIL_BASE_URL}/common_material/coin.webp`;
  if (resourceType === 'virtual_coin') return `${THUMBNAIL_BASE_URL}/common_material/virtual_coin.webp`;
  return '';
};

const getTicketImageUrl = (resourceType, resourceId) => {
  if (resourceType === 'practice_ticket') return `${THUMBNAIL_BASE_URL}/practice_ticket/ticket${resourceId}.webp`;
  if (resourceType === 'skill_practice_ticket') return `${THUMBNAIL_BASE_URL}/skill_practice_ticket/ticket${resourceId}.webp`;
  return '';
};

const getMySekaiMaterial = (resourceId, lookups) => {
  const id = Number(resourceId);
  return lookups.mysekaiMaterials?.get(id) || null;
};

const getMySekaiMaterialImageUrl = (resourceId, lookups) => {
  const material = getMySekaiMaterial(resourceId, lookups);
  const iconAssetbundleName = material?.iconAssetbundleName;
  if (iconAssetbundleName) {
    return `${ASSET_BASE_URL}/mysekai/thumbnail/material/${iconAssetbundleName}/${iconAssetbundleName}.webp`;
  }
  return `${THUMBNAIL_BASE_URL}/material/material${resourceId}.webp`;
};

const getResourceImageUrl = (resourceType, resourceId, lookups) => {
  if (resourceType === 'mysekai_material') {
    return getMySekaiMaterialImageUrl(resourceId, lookups);
  }
  if (resourceType === 'material') {
    return `${THUMBNAIL_BASE_URL}/material/material${resourceId}.webp`;
  }
  if (resourceType === 'card') {
    return getCardImageUrl(lookups.cards.get(Number(resourceId)), lookups);
  }
  if (resourceType === 'event_item') {
    return getBadgeImageUrl(lookups.eventItems.get(Number(resourceId)));
  }
  if (resourceType === 'boost_item') {
    return `${THUMBNAIL_BASE_URL}/boost_item/boost_item${resourceId}.webp`;
  }
  if (resourceType === 'practice_ticket' || resourceType === 'skill_practice_ticket') {
    return getTicketImageUrl(resourceType, resourceId);
  }
  return getCommonMaterialImageUrl(resourceType);
};

const getResourceName = (resourceType, resourceId, lookups) => {
  if (resourceType === 'mysekai_material') {
    return getMySekaiMaterial(resourceId, lookups)?.name || `${RESOURCE_NAME_FALLBACKS.mysekai_material} ${resourceId || ''}`.trim();
  }
  if (resourceType === 'material') {
    return lookups.materials.get(Number(resourceId))?.name || `${RESOURCE_NAME_FALLBACKS[resourceType]} ${resourceId || ''}`.trim();
  }
  if (resourceType === 'card') {
    const card = lookups.cards.get(Number(resourceId));
    const cardName = card?.prefix || card?.title;
    if (cardName) return `${getCardRarityLabel(card)} ${cardName}`;
    return `${RESOURCE_NAME_FALLBACKS.card} ${resourceId || ''}`.trim();
  }
  if (resourceType === 'event_item') {
    return lookups.eventItems.get(Number(resourceId))?.name || RESOURCE_NAME_FALLBACKS.event_item;
  }
  if (resourceType === 'practice_ticket') {
    return lookups.practiceTickets.get(Number(resourceId))?.name || `${RESOURCE_NAME_FALLBACKS.practice_ticket} ${resourceId || ''}`.trim();
  }
  if (resourceType === 'skill_practice_ticket') {
    return lookups.skillPracticeTickets.get(Number(resourceId))?.name || `${RESOURCE_NAME_FALLBACKS.skill_practice_ticket} ${resourceId || ''}`.trim();
  }
  if (resourceType === 'boost_item') {
    return lookups.boostItems.get(Number(resourceId))?.name || RESOURCE_NAME_FALLBACKS.boost_item;
  }
  return RESOURCE_NAME_FALLBACKS[resourceType] || resourceType || 'Item';
};

const normalizeResource = (detail, lookups) => {
  const resourceType = detail?.resourceType || 'material';
  const resourceId = detail?.resourceId;
  const itemQuantity = toPositiveInteger(detail?.resourceQuantity, 1) || 1;
  const card = resourceType === 'card'
    ? lookups.cards.get(Number(resourceId)) || null
    : null;

  return {
    resourceType,
    resourceId: resourceId ?? '',
    itemQuantity,
    name: getResourceName(resourceType, resourceId, lookups),
    imageUrl: getResourceImageUrl(resourceType, resourceId, lookups),
    card,
  };
};

const getEventExchangeBoxes = (resourceBoxes) => (
  (Array.isArray(resourceBoxes) ? resourceBoxes : [])
    .filter(box => box?.resourceBoxPurpose === 'event_exchange')
);

const createExchangeItems = (summary, resourceBoxes, lookups) => {
  const boxesById = new Map(getEventExchangeBoxes(resourceBoxes).map(box => [Number(box.id), box]));

  return (summary?.eventExchanges || [])
    .slice()
    .sort((a, b) => (a.seq || 0) - (b.seq || 0))
    .map(exchange => {
      const cost = exchange.eventExchangeCost || {};
      const box = boxesById.get(Number(exchange.resourceBoxId));
      const resource = normalizeResource(box?.details?.[0] || {}, lookups);
      const costResourceId = cost.resourceId ?? '';
      const costResourceType = cost.resourceType || 'event_item';
      const limitValue = exchange.exchangeLimit === undefined || exchange.exchangeLimit === null
        ? ''
        : toPositiveInteger(exchange.exchangeLimit, 0);
      return {
        uid: `exchange-${exchange.id}`,
        id: exchange.id,
        seq: exchange.seq || 0,
        name: resource.name,
        imageUrl: resource.imageUrl,
        card: resource.card,
        itemQuantity: resource.itemQuantity,
        price: toPositiveInteger(cost.resourceQuantity, 0),
        limit: limitValue,
        bought: 0,
        desired: 0,
        resourceType: resource.resourceType,
        resourceId: resource.resourceId,
        costResourceType,
        costResourceId,
      };
    });
};

const makeManualItem = (shopKey = '') => ({
  uid: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  id: null,
  seq: 9999,
  name: '',
  imageUrl: `${THUMBNAIL_BASE_URL}/material/material14.webp`,
  card: null,
  itemQuantity: 1,
  price: 0,
  limit: '',
  bought: 0,
  desired: 0,
  resourceType: 'material',
  resourceId: '',
  costResourceType: 'event_item',
  costResourceId: shopKey,
});

const formatNumber = (value) => toPositiveInteger(value).toLocaleString();

const getCharacterName = (gameCharacterId, language, lookups) => {
  const character = lookups.gameCharacters.get(Number(gameCharacterId));
  if (!character) return '';
  if (language === 'en') {
    const name = String(character.givenNameEnglish || character.givenName || '').toLowerCase();
    return name ? `${name.charAt(0).toUpperCase()}${name.slice(1)}` : '';
  }
  return character.givenName || '';
};

const getShopKey = (value) => String(value ?? '');

const isSameShop = (item, shopKey) => getShopKey(item?.costResourceId) === getShopKey(shopKey);

const getCardPresetKey = (item, lookups) => {
  const card = item?.card || lookups.cards.get(Number(item?.resourceId)) || {};
  const rarityMatch = String(card.cardRarityType || '').match(/rarity_(\d+)/);
  const rarity = rarityMatch ? Number(rarityMatch[1]) : toPositiveInteger(card.rarity, 0);
  return rarity > 0 ? `card:rarity_${rarity}` : 'card:unknown';
};

const getPresetItemKey = (item, lookups) => {
  if (!item) return '';
  if (item.resourceType === 'card') return getCardPresetKey(item, lookups);
  return [
    item.resourceType || 'item',
    item.resourceId ?? '',
    toPositiveInteger(item.itemQuantity, 1) || 1,
  ].join(':');
};

const clampPresetCounts = (item, presetEntry) => {
  if (!presetEntry) return { bought: 0, desired: 0 };

  const limit = item.limit === '' ? null : toPositiveInteger(item.limit, 0);
  const rawBought = toPositiveInteger(presetEntry.bought, 0);
  const bought = limit === null ? rawBought : Math.min(rawBought, limit);
  const rawDesired = toPositiveInteger(presetEntry.desired, 0);
  const maxDesired = limit === null ? null : Math.max(0, limit - bought);

  return {
    bought,
    desired: maxDesired === null ? rawDesired : Math.min(rawDesired, maxDesired),
  };
};

const createPresetSlots = () => Array.from({ length: SHOP_PRESET_SLOT_COUNT }, (_, index) => ({
  id: `P${index + 1}`,
  label: `P${index + 1}`,
  entries: null,
  updatedAt: null,
}));

const normalizePresetSlots = (value) => {
  const slots = createPresetSlots();
  if (!Array.isArray(value)) return slots;

  value.slice(0, SHOP_PRESET_SLOT_COUNT).forEach((preset, index) => {
    if (!Array.isArray(preset?.entries)) return;
    slots[index] = {
      ...slots[index],
      entries: preset.entries,
      updatedAt: preset.updatedAt || preset.createdAt || null,
    };
  });

  return slots;
};

const hasPresetEntries = (preset) => Array.isArray(preset?.entries) && preset.entries.length > 0;

const getShopEventStorageKey = (summary) => {
  if (!summary) return '';
  const eventId = summary.eventId ?? summary.event_id;
  if (eventId !== undefined && eventId !== null && eventId !== '') return String(eventId);
  return summary.id !== undefined && summary.id !== null ? `summary:${summary.id}` : '';
};

const getShopItemStorageKey = (item) => {
  if (!item) return '';
  if (item.id !== undefined && item.id !== null) return String(item.id);
  return item.uid ? String(item.uid) : '';
};

const readShopItemCountsStorage = () => {
  if (typeof window === 'undefined') return {};

  try {
    const saved = JSON.parse(localStorage.getItem(SHOP_ITEM_COUNTS_STORAGE_KEY) || '{}');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch (error) {
    return {};
  }
};

const writeShopItemCountsStorage = (value) => {
  if (typeof window === 'undefined') return;

  if (!value || Object.keys(value).length === 0) {
    localStorage.removeItem(SHOP_ITEM_COUNTS_STORAGE_KEY);
    return;
  }

  localStorage.setItem(SHOP_ITEM_COUNTS_STORAGE_KEY, JSON.stringify(value));
};

const getStoredShopItemCounts = (item, storedCounts) => {
  const key = getShopItemStorageKey(item);
  const entry = key ? storedCounts?.[key] : null;
  if (!entry || typeof entry !== 'object') return null;

  const limit = item.limit === '' ? null : toPositiveInteger(item.limit, 0);
  const rawBought = toPositiveInteger(entry.bought, 0);
  const bought = limit === null ? rawBought : Math.min(rawBought, limit);
  const rawDesired = toPositiveInteger(entry.desired, 0);
  const maxDesired = limit === null ? null : Math.max(0, limit - bought);

  return {
    bought,
    desired: maxDesired === null ? rawDesired : Math.min(rawDesired, maxDesired),
  };
};

const applyStoredShopItemCounts = (items, eventStorageKey) => {
  if (!eventStorageKey) return items;

  const storage = readShopItemCountsStorage();
  const storedCounts = storage[eventStorageKey];
  if (!storedCounts || typeof storedCounts !== 'object' || Array.isArray(storedCounts)) return items;

  return items.map(item => {
    const counts = getStoredShopItemCounts(item, storedCounts);
    return counts ? { ...item, ...counts } : item;
  });
};

const persistShopItemCounts = (eventStorageKey, items) => {
  if (!eventStorageKey || typeof window === 'undefined') return;

  const storage = readShopItemCountsStorage();
  const eventCounts = {};

  items.forEach(item => {
    const key = getShopItemStorageKey(item);
    if (!key) return;

    const bought = toPositiveInteger(item.bought, 0);
    const desired = toPositiveInteger(item.desired, 0);
    if (bought > 0 || desired > 0) {
      eventCounts[key] = { bought, desired };
    }
  });

  if (Object.keys(eventCounts).length > 0) {
    storage[eventStorageKey] = eventCounts;
  } else {
    delete storage[eventStorageKey];
  }

  writeShopItemCountsStorage(storage);
};

const getCharacterNameByBirthdays = (gameCharacterId, language) => {
  const charIdStr = String(gameCharacterId).padStart(2, '0');
  const char = characterBirthdays.find(c => c.image === charIdStr);
  if (char) {
    if (language === 'ko') return char.nameKo;
    if (language === 'en') return char.nameEn;
    return char.nameJa;
  }
  return null;
};

const getShopGroupLabel = (eventItem, index, language, t, lookups) => {
  if (!eventItem) return `${t('fire.shop_group')} ${index + 1}`;

  const chapterMatch = String(eventItem.name || '').match(/チャプター(\d+)/);
  if (chapterMatch) {
    const charName = getCharacterNameByBirthdays(eventItem.gameCharacterId, language);
    if (charName) return charName;
    const characterNameFallback = getCharacterName(eventItem.gameCharacterId, language, lookups);
    return characterNameFallback ? characterNameFallback : `${chapterMatch[1]}${t('fire.shop_chapter_suffix')}`;
  }

  if (String(eventItem.name || '').includes('ワールド') || String(eventItem.name || '').includes('フィナーレ')) {
    return t('fire.shop_overall');
  }

  return eventItem.name || t('fire.shop_overall');
};

const EventShopSimulator = ({
  eventInfo,
  scorePerRoundMan,
  roundsPerInterval,
  currentFireOption,
  changedFireOption,
  naturalSettings = {},
  onNaturalSettingsChange,
  onImport,
}) => {
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [exchangeSummaries, setExchangeSummaries] = useState([]);
  const [resourceBoxes, setResourceBoxes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [mysekaiMaterials, setMysekaiMaterials] = useState([]);
  const [eventItems, setEventItems] = useState([]);
  const [cards, setCards] = useState([]);
  const [practiceTickets, setPracticeTickets] = useState([]);
  const [skillPracticeTickets, setSkillPracticeTickets] = useState([]);
  const [boostItems, setBoostItems] = useState([]);
  const [gameCharacters, setGameCharacters] = useState([]);
  const [selectedSummaryId, setSelectedSummaryId] = useState('');
  const [selectedShopKey, setSelectedShopKey] = useState('');
  const [items, setItems] = useState([]);
  const [ownedBadgePointsByShop, setOwnedBadgePointsByShop] = useState({});
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const [shopPresets, setShopPresets] = useState(() => createPresetSlots());
  const dropdownRef = useRef(null);
  const presetMenuRef = useRef(null);
  const topMenuTouchRef = useRef({ x: 0, y: 0, handled: false });

  const [localScorePerRoundMan, setLocalScorePerRoundMan] = useState(scorePerRoundMan || '2.8');
  const [localRoundsPerInterval, setLocalRoundsPerInterval] = useState(roundsPerInterval || '28');
  const [localCurrentFireOption, setLocalCurrentFireOption] = useState(currentFireOption || '15');
  const [localChangedFireOption, setLocalChangedFireOption] = useState(changedFireOption || 'none');
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const [isTopSectionCollapsed, setIsTopSectionCollapsed] = useState(false);

  const PRSK_CALC_DATA_KEY = 'prskCalcSurveyData';
  const surveyData = useMemo(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PRSK_CALC_DATA_KEY);
      if (saved) return JSON.parse(saved);
    }
    return {};
  }, []);
  const [localCurrentNaturalFire, setLocalCurrentNaturalFire] = useState(surveyData.currentNaturalFire || '');
  const [localIsLevelUpBonusEnabled, setLocalIsLevelUpBonusEnabled] = useState(surveyData.isLevelUpBonusEnabled || false);
  const [localCurrentLevel, setLocalCurrentLevel] = useState(surveyData.fireCurrentLevel || surveyData.currentLevel || '');
  const [localRemainingExp, setLocalRemainingExp] = useState(surveyData.fireRemainingExp || surveyData.remainingExp || '');
  const [localLiveRank] = useState(surveyData.fireLiveRank || surveyData.liveRank || 'S');
  const [localChallengeScore, setLocalChallengeScore] = useState(surveyData.challengeScore || '');
  const [localMySekaiScore, setLocalMySekaiScore] = useState(surveyData.mySekaiScore || '');
  const [localWorldPass, setLocalWorldPass] = useState(surveyData.worldPass || false);
  const [localIsEventPointAdEnabled, setLocalIsEventPointAdEnabled] = useState(surveyData.isEventPointAdEnabled || false);
  const [isNaturalFireOpen, setIsNaturalFireOpen] = useState(false);
  const getNaturalSetting = (key, fallback) => (
    Object.prototype.hasOwnProperty.call(naturalSettings, key)
      ? naturalSettings[key]
      : fallback
  );
  const updateNaturalSetting = (key, value, localSetter) => {
    localSetter(value);
    if (onNaturalSettingsChange) {
      onNaturalSettingsChange({ [key]: value });
    }
  };
  const currentNaturalFire = getNaturalSetting('currentNaturalFire', localCurrentNaturalFire);
  const setCurrentNaturalFire = (value) => updateNaturalSetting('currentNaturalFire', value, setLocalCurrentNaturalFire);
  const isLevelUpBonusEnabled = getNaturalSetting('isLevelUpBonusEnabled', localIsLevelUpBonusEnabled);
  const setIsLevelUpBonusEnabled = (value) => updateNaturalSetting('isLevelUpBonusEnabled', value, setLocalIsLevelUpBonusEnabled);
  const currentLevel = getNaturalSetting('currentLevel', localCurrentLevel);
  const setCurrentLevel = (value) => updateNaturalSetting('currentLevel', value, setLocalCurrentLevel);
  const remainingExp = getNaturalSetting('remainingExp', localRemainingExp);
  const setRemainingExp = (value) => updateNaturalSetting('remainingExp', value, setLocalRemainingExp);
  const liveRank = getNaturalSetting('liveRank', localLiveRank);
  const challengeScore = getNaturalSetting('challengeScore', localChallengeScore);
  const setChallengeScore = (value) => updateNaturalSetting('challengeScore', value, setLocalChallengeScore);
  const mySekaiScore = getNaturalSetting('mySekaiScore', localMySekaiScore);
  const setMySekaiScore = (value) => updateNaturalSetting('mySekaiScore', value, setLocalMySekaiScore);
  const worldPass = getNaturalSetting('worldPass', localWorldPass);
  const setWorldPass = (value) => updateNaturalSetting('worldPass', value, setLocalWorldPass);
  const isEventPointAdEnabled = localIsEventPointAdEnabled;
  const setIsEventPointAdEnabled = setLocalIsEventPointAdEnabled;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentData = JSON.parse(localStorage.getItem(PRSK_CALC_DATA_KEY) || '{}');
    const newData = {
      ...currentData,
      currentNaturalFire,
      isLevelUpBonusEnabled,
      fireCurrentLevel: currentLevel,
      fireRemainingExp: remainingExp,
      fireLiveRank: liveRank,
      challengeScore,
      mySekaiScore,
      worldPass,
      isEventPointAdEnabled
    };
    localStorage.setItem(PRSK_CALC_DATA_KEY, JSON.stringify(newData));
  }, [currentNaturalFire, isLevelUpBonusEnabled, currentLevel, remainingExp, liveRank, challengeScore, mySekaiScore, worldPass, isEventPointAdEnabled]);

  useEffect(() => {
    if (scorePerRoundMan !== undefined) setLocalScorePerRoundMan(scorePerRoundMan);
    if (roundsPerInterval !== undefined) setLocalRoundsPerInterval(roundsPerInterval);
    if (currentFireOption !== undefined) setLocalCurrentFireOption(currentFireOption);
    if (changedFireOption !== undefined) setLocalChangedFireOption(changedFireOption);
  }, [scorePerRoundMan, roundsPerInterval, currentFireOption, changedFireOption]);
  const [tooltipHover, setTooltipHover] = useState(false);
  const [tooltipLock, setTooltipLock] = useState(false);
  const isTooltipVisible = tooltipHover || tooltipLock;
  const importMenuRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setBulkActionOpen(false);
      }
      if (importMenuRef.current && !importMenuRef.current.contains(event.target)) {
        setImportMenuOpen(false);
      }
      if (presetMenuRef.current && !presetMenuRef.current.contains(event.target)) {
        setPresetMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImport = (type) => {
    if (onImport) {
      onImport(type);
    }
    setImportMenuOpen(false);
  };

  const isMobileViewport = () => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );

  const handleTopMenuTouchStart = (event) => {
    if (!isMobileViewport()) return;
    const touch = event.touches?.[0];
    if (!touch) return;

    topMenuTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      handled: false,
    };
  };

  const handleTopMenuTouchMove = (event) => {
    if (!isMobileViewport() || isTopSectionCollapsed) return;
    const touch = event.touches?.[0];
    const start = topMenuTouchRef.current;
    if (!touch || start.handled) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const isVerticalSwipeUp = deltaY < -32 && Math.abs(deltaY) > Math.abs(deltaX) * 1.15;

    if (isVerticalSwipeUp) {
      topMenuTouchRef.current = { ...start, handled: true };
      setIsTopSectionCollapsed(true);
    }
  };

  const lookups = useMemo(() => ({
    materials: buildLookup(materials),
    mysekaiMaterials: buildLookup(mysekaiMaterials),
    eventItems: buildLookup(eventItems),
    cards: buildLookup(cards),
    practiceTickets: buildLookup(practiceTickets),
    skillPracticeTickets: buildLookup(skillPracticeTickets),
    boostItems: buildLookup(boostItems),
    gameCharacters: buildLookup(gameCharacters),
  }), [boostItems, cards, eventItems, gameCharacters, materials, mysekaiMaterials, practiceTickets, skillPracticeTickets]);

  const selectedSummary = useMemo(() => (
    exchangeSummaries.find(summary => String(summary.id) === String(selectedSummaryId)) || null
  ), [exchangeSummaries, selectedSummaryId]);
  const selectedEventStorageKey = useMemo(() => (
    getShopEventStorageKey(selectedSummary)
  ), [selectedSummary]);

  const shopGroups = useMemo(() => {
    const orderedKeys = [];
    items.forEach(item => {
      const key = getShopKey(item.costResourceId);
      if (key && !orderedKeys.includes(key)) orderedKeys.push(key);
    });

    return orderedKeys.map((key, index) => {
      const eventItem = eventItems.find(item => Number(item.id) === Number(key));
      const groupItems = items.filter(item => isSameShop(item, key));
      return {
        key,
        eventItem,
        label: getShopGroupLabel(eventItem, index, language, t, lookups),
        imageUrl: getBadgeImageUrl(eventItem),
        itemCount: groupItems.length,
      };
    });
  }, [eventItems, items, language, lookups, t]);

  const activeShopGroup = useMemo(() => (
    shopGroups.find(group => group.key === selectedShopKey) || shopGroups[0] || null
  ), [shopGroups, selectedShopKey]);

  const badgeImageUrl = activeShopGroup?.imageUrl || DEFAULT_BADGE_IMAGE;
  const visibleItems = useMemo(() => (
    activeShopGroup
      ? items.filter(item => isSameShop(item, activeShopGroup.key))
      : items
  ), [activeShopGroup, items]);
  const currentOwnedBadgePoints = activeShopGroup
    ? (
      ownedBadgePointsByShop[activeShopGroup.key]
      ?? (shopGroups[0]?.key === activeShopGroup.key ? ownedBadgePointsByShop.default : '')
      ?? ''
    )
    : (ownedBadgePointsByShop.default ?? '');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');

    Promise.all([
      fetchJson(EVENT_EXCHANGE_SUMMARIES_URL),
      fetchJson(RESOURCE_BOXES_URL),
      fetchJson(MATERIALS_URL),
      fetchJson(MYSEKAI_MATERIALS_URL),
      fetchJson(EVENT_ITEMS_URL),
      fetchJson(CARD_API_URL),
      fetchJson(PRACTICE_TICKETS_URL),
      fetchJson(SKILL_PRACTICE_TICKETS_URL),
      fetchJson(BOOST_ITEMS_URL),
      fetchJson(GAME_CHARACTERS_URL),
    ])
      .then(([
        summaries,
        resourceBoxRows,
        materialRows,
        mysekaiMaterialRows,
        eventItemRows,
        cardRows,
        practiceTicketRows,
        skillPracticeTicketRows,
        boostItemRows,
        gameCharacterRows,
      ]) => {
        if (cancelled) return;
        setExchangeSummaries(Array.isArray(summaries) ? summaries : []);
        setResourceBoxes(Array.isArray(resourceBoxRows) ? resourceBoxRows : []);
        setMaterials(Array.isArray(materialRows) ? materialRows : []);
        setMysekaiMaterials(Array.isArray(mysekaiMaterialRows) ? mysekaiMaterialRows : []);
        setEventItems(Array.isArray(eventItemRows) ? eventItemRows : []);
        setCards(Array.isArray(cardRows) ? cardRows : []);
        setPracticeTickets(Array.isArray(practiceTicketRows) ? practiceTicketRows : []);
        setSkillPracticeTickets(Array.isArray(skillPracticeTicketRows) ? skillPracticeTicketRows : []);
        setBoostItems(Array.isArray(boostItemRows) ? boostItemRows : []);
        setGameCharacters(Array.isArray(gameCharacterRows) ? gameCharacterRows : []);
      })
      .catch(error => {
        if (cancelled) return;
        console.error('Failed to load event shop data:', error);
        setLoadError('shop_load_failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!exchangeSummaries.length || selectedSummaryId) return;

    const eventId = Number(eventInfo?.id || 0);
    const now = Date.now();
    const matchedByEvent = eventId
      ? exchangeSummaries.find(summary => Number(summary.eventId) === eventId)
      : null;
    const activeSummary = exchangeSummaries.find(summary => (
      toNumber(summary.startAt) <= now && now <= toNumber(summary.endAt)
    ));
    const fallbackSummary = exchangeSummaries[exchangeSummaries.length - 1];
    const initialSummary = matchedByEvent || activeSummary || fallbackSummary;

    if (initialSummary) setSelectedSummaryId(String(initialSummary.id));
  }, [eventInfo, exchangeSummaries, selectedSummaryId]);

  useEffect(() => {
    if (!selectedSummary || !resourceBoxes.length) return;
    const createdItems = createExchangeItems(selectedSummary, resourceBoxes, lookups);
    setItems(applyStoredShopItemCounts(createdItems, selectedEventStorageKey));
  }, [selectedSummary, selectedEventStorageKey, resourceBoxes, lookups]);

  useEffect(() => {
    if (shopGroups.length === 0) return;
    if (!shopGroups.some(group => group.key === selectedShopKey)) {
      setSelectedShopKey(shopGroups[0].key);
    }
  }, [shopGroups, selectedShopKey]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SHOP_STATE_STORAGE_KEY) || '{}');
      if (saved && typeof saved === 'object') {
        if (saved.ownedBadgePointsByShop && typeof saved.ownedBadgePointsByShop === 'object') {
          setOwnedBadgePointsByShop(saved.ownedBadgePointsByShop);
        } else if (saved.ownedBadgePoints !== undefined) {
          setOwnedBadgePointsByShop({ default: saved.ownedBadgePoints || '' });
        }
      }
    } catch (error) {
      // Ignore malformed previous state.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SHOP_STATE_STORAGE_KEY, JSON.stringify({ ownedBadgePointsByShop }));
  }, [ownedBadgePointsByShop]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(localStorage.getItem(SHOP_PRESETS_STORAGE_KEY) || '[]');
      setShopPresets(normalizePresetSlots(saved));
    } catch (error) {
      setShopPresets(createPresetSlots());
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SHOP_PRESETS_STORAGE_KEY, JSON.stringify(shopPresets));
  }, [shopPresets]);

  const visibleSummaries = useMemo(() => {
    const latest = exchangeSummaries.slice(-50).reverse();
    if (!selectedSummary) return latest;
    if (latest.some(summary => String(summary.id) === String(selectedSummary.id))) return latest;
    return [selectedSummary, ...latest];
  }, [exchangeSummaries, selectedSummary]);

  const totals = useMemo(() => {
    const plannedCost = visibleItems.reduce((sum, item) => {
      const price = toPositiveInteger(item.price, 0);
      const desired = toPositiveInteger(item.desired, 0);
      return sum + (price * desired);
    }, 0);
    const usedCost = visibleItems.reduce((sum, item) => {
      const price = toPositiveInteger(item.price, 0);
      const bought = toPositiveInteger(item.bought, 0);
      return sum + (price * bought);
    }, 0);
    const owned = toPositiveInteger(currentOwnedBadgePoints, 0);
    const perRoundPoints = Math.max(0, toNumber(localScorePerRoundMan || '2.8', 0) * 1000);
    const fireOption = localChangedFireOption && localChangedFireOption !== 'none' ? localChangedFireOption : localCurrentFireOption;
    const firePerRound = getFireConsumption(fireOption);

    let naturalShopPoints = 0;
    if (selectedSummary || eventInfo) {
      const now = new Date().getTime();
      const end = getNaturalCalculationEndMs(selectedSummary, eventInfo);
      const remainingMs = Math.max(0, end - now);
      const recoveryFire = Math.floor(remainingMs / (30 * 60 * 1000));

      let loginFire = 0;
      let checkTime = new Date(now);
      if (checkTime.getHours() >= 4) {
        checkTime.setDate(checkTime.getDate() + 1);
      }
      checkTime.setHours(4, 0, 0, 0);

      while (checkTime.getTime() < end) {
        loginFire += 10;
        checkTime.setDate(checkTime.getDate() + 1);
      }

      const userCurrentNatural = parseInt(currentNaturalFire) || 0;
      const baseNaturalFire = recoveryFire + loginFire + userCurrentNatural;

      let levelUpFire = 0;
      let simFire = baseNaturalFire;
      let fireConsumption = firePerRound;
      if (fireConsumption === 0) fireConsumption = 1;

      if (isLevelUpBonusEnabled && currentLevel && remainingExp) {
        let simLevel = parseInt(currentLevel);
        let simExp = parseInt(remainingExp);
        const rankExpBonus = getLiveRankExpBonus(liveRank);

        let safeGuard = 0;
        const MAX_LOOPS = 20000;

        while (simFire >= fireConsumption && safeGuard < MAX_LOOPS) {
          safeGuard++;
          const xpPerRun = fireConsumption * rankExpBonus;
          if (xpPerRun === 0) break;

          const runsToLevel = Math.ceil(simExp / xpPerRun);
          const fireNeeded = runsToLevel * fireConsumption;

          if (simFire >= fireNeeded) {
            simFire -= fireNeeded;
            const xpGained = runsToLevel * xpPerRun;
            const overflow = xpGained - simExp;

            simLevel++;
            levelUpFire += 10;
            simFire += 10;

            const levelData = findPlayerLevelInfo(simLevel);
            if (levelData && levelData.exp) {
              simExp = levelData.exp - overflow;
              if (simExp <= 0) simExp = 1;
            } else {
              simExp = 999999999;
            }
          } else {
            simFire = 0;
          }
        }
      }

      const totalNaturalFire = baseNaturalFire + levelUpFire;
      const naturalRounds = Math.floor(totalNaturalFire / fireConsumption);
      naturalShopPoints = naturalRounds * perRoundPoints;

      const days = loginFire / 10;
      const cScoreVal = parseFloat(challengeScore) || 250;
      const challengeEPPerDay = Math.floor((100 + cScoreVal / 2) * 120);
      const totalChallengeEP = cScoreVal > 0 ? challengeEPPerDay * days : 0;

      let mySekaiDays = 0;
      let checkMs = new Date(now);
      if (checkMs.getHours() >= 5) {
        checkMs.setDate(checkMs.getDate() + 1);
      }
      checkMs.setHours(5, 0, 0, 0);

      while (checkMs.getTime() < end) {
        mySekaiDays++;
        checkMs.setDate(checkMs.getDate() + 1);
      }

      const mScoreVal = parseFloat(mySekaiScore) || 2500;
      const mySekaiMultiplier = worldPass ? 10 : 2;
      const mySekaiEPPerDay = Math.floor(mySekaiMultiplier * mScoreVal);
      const totalMySekaiEP = mScoreVal > 0 ? mySekaiEPPerDay * mySekaiDays : 0;

      const extraShopPoints = Math.floor((totalChallengeEP + totalMySekaiEP) / 10);
      const eventPointAdShopPoints = isEventPointAdEnabled ? days * 1000 : 0;
      naturalShopPoints += extraShopPoints + eventPointAdShopPoints;
    }

    const neededBeforeNatural = Math.max(0, plannedCost - owned);
    const needed = Math.max(0, neededBeforeNatural - naturalShopPoints);
    const additionalRoundsBeforeNatural = perRoundPoints > 0 ? Math.ceil(neededBeforeNatural / perRoundPoints) : null;
    const additionalFireBeforeNatural = additionalRoundsBeforeNatural === null ? null : additionalRoundsBeforeNatural * firePerRound;
    const additionalRounds = perRoundPoints > 0 ? Math.ceil(needed / perRoundPoints) : null;
    const additionalFire = additionalRounds === null ? null : additionalRounds * firePerRound;
    const roundSpeed = toNumber(localRoundsPerInterval || '28', 0);
    const additionalHours = additionalRounds !== null && roundSpeed > 0 ? additionalRounds / roundSpeed : null;

    return {
      plannedCost,
      usedCost,
      owned,
      naturalShopPoints,
      neededBeforeNatural,
      needed,
      perRoundPoints,
      additionalRoundsBeforeNatural,
      additionalFireBeforeNatural,
      additionalRounds,
      additionalFire,
      additionalHours,
    };
  }, [visibleItems, currentOwnedBadgePoints, localScorePerRoundMan, localRoundsPerInterval, localCurrentFireOption, localChangedFireOption, selectedSummary, eventInfo, currentNaturalFire, isLevelUpBonusEnabled, currentLevel, remainingExp, liveRank, challengeScore, mySekaiScore, worldPass, isEventPointAdEnabled]);

  const updateItemsWithCountPersistence = (updater) => {
    setItems(prev => {
      const next = updater(prev);
      persistShopItemCounts(selectedEventStorageKey, next);
      return next;
    });
  };

  const updateItem = (uid, updates) => {
    const shouldPersistCounts = (
      Object.prototype.hasOwnProperty.call(updates, 'bought')
      || Object.prototype.hasOwnProperty.call(updates, 'desired')
    );

    setItems(prev => {
      const next = prev.map(item => item.uid === uid ? { ...item, ...updates } : item);
      if (shouldPersistCounts) {
        persistShopItemCounts(selectedEventStorageKey, next);
      }
      return next;
    });
  };

  const updateNumericItem = (uid, key, rawValue) => {
    const value = rawValue === '' ? '' : toPositiveInteger(rawValue, 0);
    updateItem(uid, { [key]: value });
  };

  const updateCurrentOwnedBadgePoints = (value) => {
    const key = activeShopGroup?.key || 'default';
    setOwnedBadgePointsByShop(prev => ({ ...prev, [key]: value }));
  };

  const fillDesiredZero = () => {
    updateItemsWithCountPersistence(prev => prev.map(item => (
      activeShopGroup && isSameShop(item, activeShopGroup.key)
        ? { ...item, desired: 0 }
        : item
    )));
    setBulkActionOpen(false);
  };

  const fillDesiredMax = () => {
    updateItemsWithCountPersistence(prev => prev.map(item => {
      if (activeShopGroup && isSameShop(item, activeShopGroup.key)) {
        const limit = item.limit === '' ? null : toPositiveInteger(item.limit, 0);
        const bought = toPositiveInteger(item.bought, 0);
        return { ...item, desired: limit === null ? 0 : Math.max(0, limit - bought) };
      }
      return item;
    }));
    setBulkActionOpen(false);
  };

  const fillBoughtZero = () => {
    updateItemsWithCountPersistence(prev => prev.map(item => {
      if (activeShopGroup && isSameShop(item, activeShopGroup.key)) {
        const limit = item.limit === '' ? null : toPositiveInteger(item.limit, 0);
        const desired = toPositiveInteger(item.desired, 0);
        const newDesired = limit === null ? desired : Math.min(desired, limit);
        return { ...item, bought: 0, desired: newDesired };
      }
      return item;
    }));
    setBulkActionOpen(false);
  };

  const fillBoughtMax = () => {
    updateItemsWithCountPersistence(prev => prev.map(item => {
      if (activeShopGroup && isSameShop(item, activeShopGroup.key)) {
        const limit = item.limit === '' ? null : toPositiveInteger(item.limit, 0);
        if (limit === null) return item;
        return { ...item, bought: limit, desired: 0 };
      }
      return item;
    }));
    setBulkActionOpen(false);
  };

  const resetAllToZero = () => {
    if (!activeShopGroup) return;
    updateItemsWithCountPersistence(prev => prev.map(item => (
      isSameShop(item, activeShopGroup.key)
        ? { ...item, bought: 0, desired: 0 }
        : item
    )));
  };

  const setBoughtClamped = (item, bought) => {
    const value = toPositiveInteger(bought, 0);
    const limit = item.limit === '' ? null : toPositiveInteger(item.limit, 0);
    const clampedBought = limit === null ? value : Math.min(value, limit);
    const currentDesired = toPositiveInteger(item.desired, 0);
    const newDesired = limit === null ? currentDesired : Math.min(currentDesired, limit - clampedBought);
    updateItem(item.uid, { bought: clampedBought, desired: newDesired });
  };

  const setDesiredClamped = (item, desired) => {
    const value = toPositiveInteger(desired, 0);
    const limit = item.limit === '' ? null : toPositiveInteger(item.limit, 0);
    const currentBought = toPositiveInteger(item.bought, 0);
    const maxDesired = limit === null ? null : Math.max(0, limit - currentBought);
    updateItem(item.uid, { desired: maxDesired === null ? value : Math.min(value, maxDesired) });
  };

  const saveCurrentPreset = (slotIndex) => {
    if (!activeShopGroup || visibleItems.length === 0) return;

    const entries = visibleItems.map(item => ({
      key: getPresetItemKey(item, lookups),
      bought: toPositiveInteger(item.bought, 0),
      desired: toPositiveInteger(item.desired, 0),
    })).filter(entry => entry.key);

    setShopPresets(prev => {
      const next = normalizePresetSlots(prev);
      next[slotIndex] = {
        ...next[slotIndex],
        entries,
        updatedAt: Date.now(),
      };
      return next;
    });
  };

  const applyPreset = (preset) => {
    if (!activeShopGroup || !preset?.entries) return;

    const entryMap = new Map(preset.entries.map(entry => [entry.key, entry]));
    updateItemsWithCountPersistence(prev => prev.map(item => {
      if (!isSameShop(item, activeShopGroup.key)) return item;
      const counts = clampPresetCounts(item, entryMap.get(getPresetItemKey(item, lookups)));
      return { ...item, ...counts };
    }));
    setPresetMenuOpen(false);
  };

  const renderSummaryDate = (summary) => {
    if (!summary?.startAt) return `#${summary?.eventId || summary?.id || '-'}`;
    const start = new Date(summary.startAt);
    return `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, '0')}.${String(start.getDate()).padStart(2, '0')}`;
  };

  const naturalPointBalance = totals.naturalShopPoints - totals.neededBeforeNatural;
  const isNaturalPointSurplus = naturalPointBalance > 0;

  return (
    <div className="w-full text-left animate-fade-in">
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-range {
          -webkit-appearance: none !important;
          appearance: none !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .custom-range:focus {
          outline: none !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .custom-range::-webkit-slider-runnable-track {
          -webkit-appearance: none;
          background: transparent;
          border: none;
        }
        .custom-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 22px;
          border-radius: 6px;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          cursor: pointer;
        }
        .custom-range::-moz-range-track {
          background: transparent;
          border: none;
        }
        .custom-range::-moz-range-thumb {
          width: 14px;
          height: 22px;
          border-radius: 6px;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          cursor: pointer;
          border: none;
        }
        .event-shop-card-thumb {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 4px;
          background: #e2e8f0;
          overflow: hidden;
          box-shadow: 0 2px 7px rgba(31,35,60,0.16);
        }
        .event-shop-card-face,
        .event-shop-card-frame {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .event-shop-card-frame {
          z-index: 2;
          pointer-events: none;
        }
        .event-shop-card-attribute {
          position: absolute;
          top: 2%;
          left: 2%;
          z-index: 3;
          width: 22%;
          height: 22%;
          object-fit: contain;
          pointer-events: none;
        }
        .event-shop-card-stars {
          position: absolute;
          z-index: 3;
          bottom: 4%;
          left: 3%;
          width: 94%;
          display: flex;
          gap: 1%;
          pointer-events: none;
        }
        .event-shop-card-stars img {
          width: 13%;
          aspect-ratio: 1 / 1;
          object-fit: contain;
        }
        .event-shop-card-birthday {
          position: absolute;
          z-index: 3;
          bottom: 3%;
          left: 4%;
          width: 22%;
          height: auto;
          pointer-events: none;
        }
        .event-shop-group-scroll {
          position: relative;
          overflow: hidden;
        }
        .event-shop-group-strip {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          overscroll-behavior-x: contain;
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .event-shop-group-strip::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 767px) {
          .event-shop-group-scroll::before,
          .event-shop-group-scroll::after {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            z-index: 2;
            width: 18px;
            pointer-events: none;
          }
          .event-shop-group-scroll::before {
            left: 0;
            background: linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,255,255,0));
          }
          .event-shop-group-scroll::after {
            right: 0;
            background: linear-gradient(270deg, rgba(255,255,255,0.95), rgba(255,255,255,0));
          }
        }
        .event-shop-natural-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 4px;
          align-items: stretch;
        }
        .event-shop-natural-field,
        .event-shop-natural-checks {
          min-height: 44px;
          border-radius: 8px;
          border: 1px solid #cfdafe;
          background: #ffffff;
        }
        .event-shop-natural-field {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 3px;
          padding: 4px 6px;
          min-width: 0;
        }
        .event-shop-natural-label {
          min-width: 0;
          color: #312e81;
          font-size: 9px;
          font-weight: 900;
          line-height: 1;
          white-space: nowrap;
        }
        .event-shop-natural-value {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 2px;
          min-width: 0;
          flex-shrink: 0;
        }
        .event-shop-natural-input {
          width: 46px !important;
          min-width: 46px !important;
          height: 30px !important;
          margin: 0 !important;
          padding: 0 5px !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          color: #312e81 !important;
          font-size: 13px !important;
          font-weight: 900 !important;
          line-height: 1 !important;
          text-align: right !important;
          box-sizing: border-box !important;
          -moz-appearance: textfield;
        }
        .event-shop-natural-input::-webkit-outer-spin-button,
        .event-shop-natural-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .event-shop-natural-checks {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, max-content));
          align-items: center;
          align-content: center;
          justify-content: center;
          gap: 6px 12px;
          padding: 6px 8px;
        }
        .event-shop-natural-checks label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #312e81;
          font-size: 9px;
          font-weight: 900;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
        }
        .event-shop-natural-checks input[type="checkbox"] {
          width: 18px !important;
          height: 18px !important;
          min-width: 18px !important;
          min-height: 18px !important;
          border-radius: 6px;
        }
        @media (min-width: 768px) {
          .event-shop-natural-grid {
            grid-template-columns: repeat(3, minmax(150px, 1fr)) minmax(230px, 1.05fr);
            gap: 6px;
          }
          .event-shop-natural-field,
          .event-shop-natural-checks {
            min-height: 58px;
          }
          .event-shop-natural-field {
            gap: 4px;
            padding: 6px 10px;
          }
          .event-shop-natural-label {
            font-size: 10px;
          }
          .event-shop-natural-checks {
            grid-column: auto;
            justify-content: start;
            gap: 8px 12px;
            padding: 8px 12px;
          }
          .event-shop-natural-checks label {
            gap: 6px;
            font-size: 10px;
          }
          .event-shop-natural-checks input[type="checkbox"] {
            width: 22px !important;
            height: 22px !important;
            min-width: 22px !important;
            min-height: 22px !important;
            border-radius: 7px;
          }
          .event-shop-natural-input {
            width: 76px !important;
            min-width: 76px !important;
            height: 42px !important;
            padding: 0 8px !important;
            border-radius: 10px !important;
            font-size: 18px !important;
          }
        }
      `}} />
      <div className="rounded-2xl border border-pink-100 bg-gradient-to-b from-white to-pink-50/40 shadow-2xl overflow-hidden max-h-[calc(100vh-4.5rem)] sm:max-h-[88vh] flex flex-col">
        <div
          className="px-2 sm:px-4 py-1.5 sm:py-2.5 border-b border-pink-100 bg-white/95 shrink-0"
          onTouchStart={handleTopMenuTouchStart}
          onTouchMove={handleTopMenuTouchMove}
        >
          <div className="hidden sm:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0">
                <img src={badgeImageUrl} alt="" className="w-7 h-7 object-contain" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-gray-800 leading-tight">{t('fire.shop_simulator_title')}</div>
                <div className="text-[10px] text-gray-400 font-bold truncate">
                  {selectedSummary ? `${selectedSummary.assetbundleName || `Event ${selectedSummary.eventId}`} · ${renderSummaryDate(selectedSummary)}` : t('fire.shop_loading')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSummaryId}
                onChange={(event) => setSelectedSummaryId(event.target.value)}
                className="!w-full sm:!w-48 !mb-0 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-300"
                disabled={loading || visibleSummaries.length === 0}
              >
                {visibleSummaries.map(summary => (
                  <option key={summary.id} value={summary.id}>
                    {`#${summary.eventId} ${summary.assetbundleName || ''}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {shopGroups.length > 1 && (
            <div className="event-shop-group-scroll -mx-2 sm:mx-0 mt-1.5 sm:mt-2">
              <div className="event-shop-group-strip px-2 sm:px-0">
                {shopGroups.map(group => {
                  const isActive = group.key === activeShopGroup?.key;
                  return (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => setSelectedShopKey(group.key)}
                      className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-lg border flex items-center gap-1.5 text-[10px] font-extrabold transition-all snap-start shrink-0 ${isActive
                        ? 'bg-pink-500 border-pink-500 text-white shadow-sm'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-500'
                        }`}
                    >
                      <img src={group.imageUrl} alt="" className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0" />
                      <span className="whitespace-nowrap">{group.label}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {group.itemCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isTopSectionCollapsed && (
            <div className="mt-1.5 sm:mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTopSectionCollapsed(false)}
                className="px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-extrabold hover:bg-gray-200 active:scale-95 transition-all"
              >
                ▼ 메뉴 펴기
              </button>
            </div>
          )}

          <div className={`transition-all duration-300 ease-in-out origin-top ${isTopSectionCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[760px] opacity-100 overflow-visible'}`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-1.5 mt-1.5 sm:mt-2 z-10 relative">
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-1.5 sm:px-2 py-1 sm:py-1.5 min-h-[42px] sm:min-h-[50px]">
                <div className="text-[10px] font-bold text-gray-400 leading-none">{t('fire.shop_owned_points')}</div>
                <div className="flex items-center gap-1 mt-1 sm:mt-1.5">
                  <img src={badgeImageUrl} alt="" className="w-4 h-4 object-contain shrink-0" />
                  <input
                    type="number"
                    value={currentOwnedBadgePoints}
                    onChange={(event) => updateCurrentOwnedBadgePoints(event.target.value)}
                    onFocus={(event) => event.target.select()}
                    placeholder="0"
                    className="!w-full !mb-0 bg-white border border-gray-200 rounded-md px-1.5 py-0.5 text-right text-xs font-extrabold text-gray-700 focus:outline-none focus:ring-1 focus:ring-pink-300"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-white border border-gray-100 px-1.5 sm:px-2 py-1 sm:py-1.5 min-h-[42px] sm:min-h-[50px] flex flex-col justify-center">
                <div className="text-[10px] font-bold text-gray-400 leading-none">현재 사용 포인트</div>
                <div className="text-[13px] sm:text-sm font-extrabold text-gray-800 tabular-nums mt-1 sm:mt-1.5 leading-none">{formatNumber(totals.usedCost)}</div>
              </div>
              <div className="rounded-lg bg-white border border-gray-100 px-1.5 sm:px-2 py-1 sm:py-1.5 min-h-[42px] sm:min-h-[50px] flex flex-col justify-center">
                <div className="text-[10px] font-bold text-gray-400 leading-none">예정 필요 포인트</div>
                <div className="text-[13px] sm:text-sm font-extrabold text-gray-800 tabular-nums mt-1 sm:mt-1.5 leading-none">{formatNumber(totals.plannedCost)}</div>
              </div>
              <div className="rounded-lg bg-pink-50 border border-pink-100 px-1.5 sm:px-2 py-1 sm:py-1.5 min-h-[46px] sm:min-h-[58px] flex flex-col justify-center">
                <div className="text-[10px] font-bold text-pink-400 leading-none">부족 포인트</div>
                <div className="text-[13px] sm:text-sm font-extrabold text-pink-600 tabular-nums mt-1 sm:mt-1.5 leading-none">{formatNumber(totals.neededBeforeNatural)}</div>
                {totals.naturalShopPoints > 0 && (
                  <div className={`text-[9px] font-bold whitespace-nowrap leading-none mt-1 ${isNaturalPointSurplus ? 'text-emerald-500' : 'text-pink-400'}`}>
                    {isNaturalPointSurplus
                      ? t('fire.shop_natural_surplus', { points: formatNumber(naturalPointBalance) })
                      : t('fire.shop_natural_shortage', { points: formatNumber(totals.needed) })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="order-2 md:order-1 grid grid-cols-2 md:grid-cols-[minmax(260px,360px)_minmax(145px,190px)_92px_minmax(0,1fr)] gap-1 sm:gap-1.5 mt-1 sm:mt-1.5 text-left items-stretch">
                <div className="col-span-2 md:col-span-1 rounded-lg bg-white/80 border border-gray-100 relative flex min-h-[46px] sm:min-h-[52px]">
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2 px-2 py-1.5 border-r border-gray-100 relative">
                    <div className="flex items-center gap-1 min-w-0">
                      <div className="text-[10px] text-gray-400 font-bold whitespace-nowrap">판 당 이벤포</div>
                      <div className="relative flex items-center" ref={importMenuRef}>
                        <button
                          type="button"
                          onClick={() => setImportMenuOpen(open => !open)}
                          className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 transition-colors rounded p-0.5 shadow-sm shrink-0"
                          title="불러오기"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        {importMenuOpen && (
                          <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-gray-100 p-1 w-[92px] animate-fade-in-down text-left">
                            <div className="flex flex-col gap-0.5">
                              <button onClick={() => handleImport('lost')} className="text-left text-[10px] font-bold text-gray-700 p-1.5 hover:bg-red-50 rounded hover:text-red-600 transition-colors">로엔</button>
                              <button onClick={() => handleImport('omakase')} className="text-left text-[10px] font-bold text-gray-700 p-1.5 hover:bg-red-50 rounded hover:text-red-600 transition-colors">오마카세</button>
                              <button onClick={() => handleImport('envy')} className="text-left text-[10px] font-bold text-gray-700 p-1.5 hover:bg-red-50 rounded hover:text-red-600 transition-colors">엔비</button>
                              <button onClick={() => handleImport('creation_myth')} className="text-left text-[10px] font-bold text-gray-700 p-1.5 hover:bg-red-50 rounded hover:text-red-600 transition-colors">개벽오토</button>
                              <button onClick={() => handleImport('my_sekai')} className="text-left text-[10px] font-bold text-gray-700 p-1.5 hover:bg-red-50 rounded hover:text-red-600 transition-colors">마이세카이</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          value={localScorePerRoundMan}
                          onChange={e => setLocalScorePerRoundMan(e.target.value)}
                          onFocus={e => e.target.select()}
                          className="w-[5.5rem] sm:w-[6.25rem] text-right text-[16px] font-extrabold text-gray-700 bg-transparent border-b border-gray-200 focus:outline-none focus:border-red-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[10px] text-gray-500 font-bold">만</span>
                      </div>
                      <div className="text-[9px] text-indigo-400 font-bold leading-none mt-0.5">
                        {Math.max(parseFloat(localScorePerRoundMan || '0') * 1000, 0).toLocaleString()}포
                      </div>
                    </div>
                  </div>
                  <div className="w-[104px] sm:w-[82px] flex items-center justify-between gap-1 px-2.5 sm:px-2 py-1.5">
                    <div className="text-[10px] text-gray-400 font-bold whitespace-nowrap">보너스</div>
                    <select
                      value={localCurrentFireOption}
                      onChange={e => setLocalCurrentFireOption(e.target.value)}
                      className="w-14 sm:w-11 text-[14px] sm:text-[13px] font-extrabold text-gray-700 bg-transparent border-b border-gray-200 focus:outline-none focus:border-indigo-400 text-right text-center-last appearance-none cursor-pointer"
                    >
                      {[
                        { value: "1", label: "0불" }, { value: "5", label: "1불" }, { value: "10", label: "2불" },
                        { value: "15", label: "3불" }, { value: "20", label: "4불" }, { value: "25", label: "5불" },
                        { value: "27", label: "6불" }, { value: "29", label: "7불" }, { value: "31", label: "8불" },
                        { value: "33", label: "9불" }, { value: "35", label: "10불" }
                      ].map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-1.5 sm:px-2 py-1 sm:py-1.5 min-h-[46px] sm:min-h-[52px] flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-indigo-400 leading-none">{t('fire.shop_extra_rounds')}</div>
                  <div className="text-[13px] text-indigo-600 font-extrabold tabular-nums mt-1.5 leading-none whitespace-nowrap">
                    {totals.additionalRoundsBeforeNatural === null
                      ? '-'
                      : t('fire.shop_rounds_fire_value', {
                        rounds: totals.additionalRoundsBeforeNatural.toLocaleString(),
                        fire: totals.additionalFireBeforeNatural.toLocaleString(),
                        roundsSuffix: t('fire.rounds_suffix'),
                        fireSuffix: t('fire.fire_suffix'),
                      })}
                  </div>
                  {totals.naturalShopPoints > 0 && totals.additionalRounds !== null && (
                    <div className="text-[9px] font-bold text-indigo-400 leading-tight mt-1">
                      {t('fire.shop_natural_extra_required', {
                        rounds: totals.additionalRounds.toLocaleString(),
                        fire: totals.additionalFire.toLocaleString(),
                        roundsSuffix: t('fire.rounds_suffix'),
                        fireSuffix: t('fire.fire_suffix'),
                      })}
                    </div>
                  )}
                </div>

                <div className="relative col-span-1 md:col-span-1" ref={presetMenuRef}>
                  <button
                    type="button"
                    onClick={() => setPresetMenuOpen(open => !open)}
                    className={`h-full min-h-[46px] sm:min-h-[52px] w-full md:w-[92px] rounded-lg px-2 text-[10px] font-extrabold shadow-sm transition-all ${presetMenuOpen ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {t('fire.shop_preset')} ▼
                  </button>
                  {presetMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 w-[210px] rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl animate-fade-in-down">
                      <div className="flex flex-col gap-1">
                        {shopPresets.map((preset, index) => (
                          <div key={preset.id} className="grid grid-cols-[32px_1fr_1fr] items-center gap-1 rounded-lg bg-gray-50 p-1">
                            <div className="text-center text-[11px] font-black text-gray-700">
                              {preset.label || `P${index + 1}`}
                            </div>
                            <button
                              type="button"
                              onClick={() => saveCurrentPreset(index)}
                              disabled={!visibleItems.length}
                              className="h-7 rounded-md bg-pink-500 px-2 text-[10px] font-extrabold text-white shadow-sm hover:bg-pink-600 disabled:bg-gray-200 disabled:text-gray-400"
                            >
                              {t('fire.shop_preset_save')}
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPreset(preset)}
                              disabled={!hasPresetEntries(preset)}
                              className="h-7 rounded-md bg-indigo-50 px-2 text-[10px] font-extrabold text-indigo-600 hover:bg-indigo-100 disabled:bg-gray-100 disabled:text-gray-300"
                            >
                              {t('fire.shop_preset_load')}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-2 md:col-span-1 flex flex-wrap items-center justify-end gap-1 sm:gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsNaturalFireOpen(!isNaturalFireOpen)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold shadow-sm transition-all flex items-center gap-1 ${isNaturalFireOpen ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-50 text-indigo-500 border border-indigo-100 hover:bg-indigo-100'
                      }`}
                  >
                    자연불 {isNaturalFireOpen ? '▲' : '▼'}
                  </button>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setBulkActionOpen(!bulkActionOpen)}
                      className="px-2.5 py-1.5 rounded-lg bg-pink-500 text-white text-[10px] font-extrabold shadow-sm hover:bg-pink-600 active:scale-95 transition-all flex items-center gap-1"
                    >
                      일괄 ▼
                    </button>
                    {bulkActionOpen && (
                      <div className="absolute right-0 top-full mt-1 w-28 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden flex flex-col">
                        <button onClick={fillBoughtMax} className="w-full text-left px-3 py-2 text-[10px] font-bold text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors">현재 MAX</button>
                        <button onClick={fillBoughtZero} className="w-full text-left px-3 py-2 text-[10px] font-bold text-gray-700 hover:bg-gray-50 transition-colors">현재 0</button>
                        <div className="h-px bg-gray-100 my-0.5"></div>
                        <button onClick={fillDesiredMax} className="w-full text-left px-3 py-2 text-[10px] font-bold text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors">예정 MAX</button>
                        <button onClick={fillDesiredZero} className="w-full text-left px-3 py-2 text-[10px] font-bold text-gray-700 hover:bg-gray-50 transition-colors">예정 0</button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={resetAllToZero}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-[10px] font-extrabold hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    리셋
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTopSectionCollapsed(!isTopSectionCollapsed)}
                    className="px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-extrabold hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    {isTopSectionCollapsed ? '▼ 메뉴 펴기' : '▲ 메뉴 접기'}
                  </button>
                </div>
              </div>

              {isNaturalFireOpen && (
                <div className="order-1 md:order-2 w-full mb-1 md:mb-0 md:mt-1.5 animate-fade-in-down">
                  <div className="bg-indigo-50/80 rounded-lg p-1 sm:p-1.5 border border-indigo-100 shadow-sm">
                    <div className="event-shop-natural-grid">
                      <div className="event-shop-natural-field">
                        <label className="event-shop-natural-label">보유 불</label>
                        <div className="event-shop-natural-value">
                          <input
                            type="number"
                            value={currentNaturalFire}
                            onChange={(e) => setCurrentNaturalFire(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className="event-shop-natural-input"
                          />
                        </div>
                      </div>
                      <div className="event-shop-natural-field">
                        <label className="event-shop-natural-label">챌린지</label>
                        <div className="event-shop-natural-value">
                          <input
                            type="number"
                            value={challengeScore}
                            onChange={(e) => setChallengeScore(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="250"
                            className="event-shop-natural-input"
                          />
                          <span className="text-[10px] text-indigo-400 font-bold">만</span>
                        </div>
                      </div>
                      <div className="event-shop-natural-field">
                        <label className="event-shop-natural-label">마이세카이</label>
                        <div className="event-shop-natural-value">
                          <input
                            type="number"
                            value={mySekaiScore}
                            onChange={(e) => setMySekaiScore(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="2500"
                            className="event-shop-natural-input"
                          />
                        </div>
                      </div>
                      <div className="event-shop-natural-checks">
                        <label>
                          <input
                            type="checkbox"
                            checked={worldPass}
                            onChange={(e) => setWorldPass(e.target.checked)}
                          />
                          {t('fire.world_pass')}
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={isLevelUpBonusEnabled}
                            onChange={(e) => setIsLevelUpBonusEnabled(e.target.checked)}
                          />
                          {t('fire.levelup_bonus_toggle')}
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={isEventPointAdEnabled}
                            onChange={(e) => setIsEventPointAdEnabled(e.target.checked)}
                          />
                          {t('fire.event_point_ad')}
                        </label>
                      </div>

                      {isLevelUpBonusEnabled && (
                        <>
                          <div className="event-shop-natural-field animate-fade-in">
                            <label className="event-shop-natural-label">현재 레벨</label>
                            <div className="event-shop-natural-value">
                              <input
                                type="number"
                                value={currentLevel}
                                onChange={(e) => setCurrentLevel(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                placeholder="100"
                                className="event-shop-natural-input"
                              />
                            </div>
                          </div>
                          <div className="event-shop-natural-field animate-fade-in">
                            <label className="event-shop-natural-label">남은 경험치</label>
                            <div className="event-shop-natural-value">
                              <input
                                type="number"
                                value={remainingExp}
                                onChange={(e) => setRemainingExp(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                placeholder="200"
                                className="event-shop-natural-input"
                              />
                            </div>
                          </div>
                        </>
                      )}

                    </div>
                    <div className="mt-1 sm:mt-1.5 px-1 text-center text-[8px] sm:text-[9px] font-bold text-indigo-400 leading-tight">
                      {t('fire.shop_natural_calc_note')}
                    </div>
                  </div>
                </div>
              )}

              {(loading || loadError) && (
                <div className={`mt-2 rounded-lg px-3 py-2 text-xs font-bold ${loadError ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                  {loadError ? t('fire.shop_load_failed') : t('fire.shop_loading')}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="p-3 sm:p-4 overflow-y-auto flex-1 min-h-0"
          onScroll={(e) => {
            if (e.target.scrollTop > 30 && !isTopSectionCollapsed) {
              setIsTopSectionCollapsed(true);
            } else if (e.target.scrollTop <= 10 && isTopSectionCollapsed) {
              setIsTopSectionCollapsed(false);
            }
          }}
        >
          {visibleItems.length === 0 && !loading ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white p-6 text-center text-xs text-gray-400 font-bold">
              {t('fire.shop_no_items')}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {visibleItems.map(item => {
                const limit = item.limit === '' ? null : toPositiveInteger(item.limit, 0);
                const bought = toPositiveInteger(item.bought, 0);
                const desired = toPositiveInteger(item.desired, 0);
                const isMaxed = limit !== null && limit > 0 && bought >= limit;
                const isDesiredMaxed = limit !== null && limit > 0 && !isMaxed && desired > 0 && desired >= Math.max(0, limit - bought);
                const itemCard = item.resourceType === 'card'
                  ? item.card || lookups.cards.get(Number(item.resourceId)) || null
                  : null;

                return (
                  <div key={item.uid} className="relative flex flex-col gap-1.5 group">
                    {/* Game-like Shop Card */}
                    <div className="relative w-full rounded-[16px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col items-center p-2 pb-3 transition-transform">
                      {/* Top Right Limit Pill */}
                      {limit !== null && (
                        <div className="absolute top-1 right-1 z-10 bg-[#ff6b9e] text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                          あと{Math.max(0, limit - bought)}回
                        </div>
                      )}

                      {/* Item Icon */}
                      <div className="relative mt-4 mb-1 w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] flex items-center justify-center">
                        {itemCard ? (
                          <div className="w-full h-full">
                            <ShopCardThumbnail card={itemCard} />
                          </div>
                        ) : item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="max-w-full max-h-full object-contain"
                            onError={(event) => { event.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        {/* Quantity overlay */}
                        {!itemCard && toPositiveInteger(item.itemQuantity, 1) > 0 && (
                          <div
                            className="absolute -bottom-1 -right-1 text-[#333] text-[13px] sm:text-[15px] font-black tracking-tighter"
                            style={{ textShadow: '-1.5px -1.5px 0 #fff, 1.5px -1.5px 0 #fff, -1.5px 1.5px 0 #fff, 1.5px 1.5px 0 #fff' }}
                          >
                            ×{toPositiveInteger(item.itemQuantity, 1).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Item Name */}
                      <div className="w-full px-1 mt-1 mb-1.5 flex-grow flex items-center justify-center">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(event) => updateItem(item.uid, { name: event.target.value })}
                          className="w-full text-center text-[11px] sm:text-[12px] font-bold text-[#444] bg-transparent border-0 focus:ring-0 p-0 leading-tight"
                        />
                      </div>

                      {/* Price Pill */}
                      <div className="mt-auto w-full px-1">
                        <div className="w-full rounded-full bg-[#e8ebf5] flex items-center justify-center py-0.5 sm:py-1 gap-1">
                          <img src={badgeImageUrl} alt="" className="w-4 h-4 object-contain shrink-0" />
                          <div className="text-center text-[12px] sm:text-[13px] font-bold text-[#555] px-1 truncate">
                            {formatNumber(item.price)}
                          </div>
                        </div>
                      </div>

                      {/* SOLD OUT Overlay */}
                      {isMaxed && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                          <div className="absolute inset-0 bg-[#333]/40"></div>
                          <div className="relative w-full bg-[#4a4a4a]/90 py-1.5 text-center text-white text-[13px] sm:text-[15px] font-bold tracking-wider shadow-lg border-y border-white/20">
                            SOLD OUT
                          </div>
                        </div>
                      )}
                      {isDesiredMaxed && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                          <div className="relative w-full bg-pink-400/90 py-1.5 text-center text-white text-[13px] sm:text-[15px] font-black tracking-wider shadow-md border-y border-white/50">
                            MAX
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Simulator Controls (Outside Card) */}
                    <div className="flex flex-col px-0 sm:px-1 w-full mt-1 gap-1">
                      <div className="sm:hidden flex flex-col gap-1">
                        <div className="grid grid-cols-[2rem_1fr_2.4rem_1fr] items-center gap-1">
                          <div className="h-7 rounded-md bg-white/90 border border-gray-100 flex items-center justify-center text-[10px] font-black text-gray-600">현재</div>
                          <button
                            type="button"
                            onClick={() => setBoughtClamped(item, 0)}
                            disabled={bought <= 0}
	                            className="h-7 rounded-md bg-gray-100 text-[9px] font-black text-gray-600 disabled:text-gray-300 active:scale-95"
	                          >
	                            {t('fire.shop_min')}
	                          </button>
                          <input
                            type="number"
                            value={item.bought}
                            onChange={(event) => setBoughtClamped(item, event.target.value)}
                            onFocus={(event) => event.target.select()}
                            className="h-7 w-full rounded-md bg-[#cbccd6] border-0 text-center text-[11px] font-black text-[#4f5366] focus:ring-1 focus:ring-[#00e6c3] p-0"
                          />
                          <button
                            type="button"
                            onClick={() => setBoughtClamped(item, limit ?? bought)}
                            disabled={limit === null || bought >= limit}
	                            className="h-7 rounded-md bg-gray-100 text-[9px] font-black text-gray-600 disabled:text-gray-300 active:scale-95"
	                          >
	                            {t('fire.shop_max')}
	                          </button>
                        </div>
                        <div className="grid grid-cols-[2rem_1fr_2.4rem_1fr] items-center gap-1">
                          <div className="h-7 rounded-md bg-white/90 border border-pink-100 flex items-center justify-center text-[10px] font-black text-pink-500">예정</div>
                          <button
                            type="button"
                            onClick={() => setDesiredClamped(item, 0)}
                            disabled={desired <= 0}
	                            className="h-7 rounded-md bg-pink-50 text-[9px] font-black text-pink-500 disabled:text-pink-200 active:scale-95"
	                          >
	                            {t('fire.shop_min')}
	                          </button>
                          <input
                            type="number"
                            value={item.desired}
                            onChange={(event) => setDesiredClamped(item, event.target.value)}
                            onFocus={(event) => event.target.select()}
                            className="h-7 w-full rounded-md bg-[#cbccd6] border-0 text-center text-[11px] font-black text-[#4f5366] focus:ring-1 focus:ring-[#00e6c3] p-0"
                          />
                          <button
                            type="button"
                            onClick={() => setDesiredClamped(item, limit === null ? desired : Math.max(0, limit - bought))}
                            disabled={limit === null || desired >= Math.max(0, limit - bought)}
	                            className="h-7 rounded-md bg-pink-50 text-[9px] font-black text-pink-500 disabled:text-pink-200 active:scale-95"
	                          >
	                            {t('fire.shop_max')}
	                          </button>
                        </div>
                      </div>
                      {/* Bought (현재) Row */}
                      <div className="hidden sm:flex items-center gap-1.5 w-full">
                        <div className="w-10 h-8 bg-white/90 rounded-md shadow-sm border border-gray-100 flex items-center justify-center shrink-0">
                          <span className="text-[12px] sm:text-[13px] font-black text-gray-600 tracking-widest">현재</span>
                        </div>
                        <div className="flex items-center flex-1 min-w-0 bg-[#f0f1f5] rounded-lg p-1 gap-1">
                          <button
                            onClick={() => setBoughtClamped(item, bought - 1)}
                            disabled={bought <= 0}
                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors z-10 ${bought <= 0 ? 'bg-[#82869a]' : 'bg-white shadow-sm active:scale-95'
                              }`}
                          >
                            <div className={`w-2.5 h-[2px] rounded-full ${bought <= 0 ? 'bg-[#2c2f42]' : 'bg-[#4f5366]'}`}></div>
                          </button>

                          <div className="relative flex-1 flex items-center h-6">
                            <div className="absolute top-1/2 -translate-y-1/2 left-[7px] right-[7px] h-1.5 bg-[#4f5366] rounded-full pointer-events-none">
                              <div
                                className="absolute top-0 left-0 h-full bg-[#00e6c3] rounded-full"
                                style={{ width: `${limit === null || limit === 0 ? 0 : (bought / limit) * 100}%` }}
                              />
                            </div>
                            <input
                              type="range"
                              min="0"
                              max={limit === null ? Math.max(bought, 999) : limit}
                              value={bought}
                              onChange={(event) => setBoughtClamped(item, event.target.value)}
                              className="custom-range absolute inset-0 w-full h-full appearance-none bg-transparent outline-none focus:outline-none focus:ring-0 z-10 m-0 p-0"
                            />
                          </div>

                          <button
                            onClick={() => setBoughtClamped(item, bought + 1)}
                            disabled={limit !== null && bought >= limit}
                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors z-10 ${(limit !== null && bought >= limit) ? 'bg-[#82869a]' : 'bg-white shadow-sm active:scale-95'
                              }`}
                          >
                            <div className="relative w-2.5 h-2.5">
                              <div className={`absolute top-1/2 left-0 w-full h-[2px] rounded-full -translate-y-1/2 ${(limit !== null && bought >= limit) ? 'bg-[#2c2f42]' : 'bg-[#4f5366]'}`}></div>
                              <div className={`absolute top-0 left-1/2 w-[2px] h-full rounded-full -translate-x-1/2 ${(limit !== null && bought >= limit) ? 'bg-[#2c2f42]' : 'bg-[#4f5366]'}`}></div>
                            </div>
                          </button>

                          <input
                            type="number"
                            value={item.bought}
                            onChange={(event) => setBoughtClamped(item, event.target.value)}
                            onFocus={(event) => event.target.select()}
                            className="w-9 h-6 bg-[#cbccd6] border-0 rounded-md text-center text-[10px] font-bold text-[#4f5366] focus:ring-1 focus:ring-[#00e6c3] p-0 shrink-0 z-10"
                          />
                        </div>
                      </div>

                      {/* Desired (예정) Row */}
                      <div className="hidden sm:flex items-center gap-1.5 w-full">
                        <div className="w-10 h-8 bg-white/90 rounded-md shadow-sm border border-pink-100 flex items-center justify-center shrink-0">
                          <span className="text-[12px] sm:text-[13px] font-black text-pink-500 tracking-widest">예정</span>
                        </div>
                        <div className="flex items-center flex-1 min-w-0 bg-[#f0f1f5] rounded-lg p-1 gap-1">
                          <button
                            onClick={() => setDesiredClamped(item, desired - 1)}
                            disabled={desired <= 0}
                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors z-10 ${desired <= 0 ? 'bg-[#82869a]' : 'bg-white shadow-sm active:scale-95'
                              }`}
                          >
                            <div className={`w-2.5 h-[2px] rounded-full ${desired <= 0 ? 'bg-[#2c2f42]' : 'bg-[#4f5366]'}`}></div>
                          </button>

                          <div className="relative flex-1 flex items-center h-6">
                            <div className="absolute top-1/2 -translate-y-1/2 left-[7px] right-[7px] h-1.5 bg-[#4f5366] rounded-full pointer-events-none">
                              <div
                                className="absolute top-0 left-0 h-full bg-[#00e6c3] rounded-full"
                                style={{ width: `${(limit === null || limit - bought <= 0) ? 0 : (desired / (limit - bought)) * 100}%` }}
                              />
                            </div>
                            <input
                              type="range"
                              min="0"
                              max={limit === null ? Math.max(desired, 999) : Math.max(limit - bought, 0)}
                              value={desired}
                              onChange={(event) => setDesiredClamped(item, event.target.value)}
                              className="custom-range absolute inset-0 w-full h-full appearance-none bg-transparent outline-none focus:outline-none focus:ring-0 z-10 m-0 p-0"
                            />
                            {limit !== null && desired > 0 && desired >= limit - bought && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                <span className="text-[9px] bg-pink-500 text-white px-1.5 py-0.5 rounded shadow-sm font-bold tracking-widest">MAX</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => setDesiredClamped(item, desired + 1)}
                            disabled={limit !== null && desired >= Math.max(0, limit - bought)}
                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors z-10 ${(limit !== null && desired >= Math.max(0, limit - bought)) ? 'bg-[#82869a]' : 'bg-white shadow-sm active:scale-95'
                              }`}
                          >
                            <div className="relative w-2.5 h-2.5">
                              <div className={`absolute top-1/2 left-0 w-full h-[2px] rounded-full -translate-y-1/2 ${(limit !== null && desired >= Math.max(0, limit - bought)) ? 'bg-[#2c2f42]' : 'bg-[#4f5366]'}`}></div>
                              <div className={`absolute top-0 left-1/2 w-[2px] h-full rounded-full -translate-x-1/2 ${(limit !== null && desired >= Math.max(0, limit - bought)) ? 'bg-[#2c2f42]' : 'bg-[#4f5366]'}`}></div>
                            </div>
                          </button>

                          <input
                            type="number"
                            value={item.desired}
                            onChange={(event) => setDesiredClamped(item, event.target.value)}
                            onFocus={(event) => event.target.select()}
                            className="w-9 h-6 bg-[#cbccd6] border-0 rounded-md text-center text-[10px] font-bold text-[#4f5366] focus:ring-1 focus:ring-[#00e6c3] p-0 shrink-0 z-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 text-[10px] text-gray-400 text-center font-medium">
            {t('fire.shop_calc_note', { locale: language })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventShopSimulator;
