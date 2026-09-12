import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { characterBirthdays } from '../data/characterBirthdays';
import playerLevelData from '../data/player_levels.json';
import { getCardCharacterId as getSupportCardCharacterId } from '../utils/supportCardUtils';
import { API_BASE_URL, ASSET_BASE_URL, joinUrl } from '../config/env';
import CustomSelectDropdown from './common/CustomSelectDropdown';
import EventLiveDeckButton from './common/EventLiveDeckButton';
import useEventLiveEstimate from '../hooks/useEventLiveEstimate';
import { getEventLiveSource } from '../utils/eventLiveEstimate';
import { numberOrDefault } from '../utils/numbers';
import {
  readJsonStorage,
  removeStorageItem,
  writeJsonStorage,
} from '../utils/safeStorage';

const isPlainObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

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

export const getNaturalCalculationWindow = (summary, events, eventInfo, currentTime) => {
  const eventId = Number(summary?.eventId);
  const event = events.find(row => Number(row.id) === eventId)
    || (Number(eventInfo?.id) === eventId ? eventInfo : null);
  // Exchange shops stay open after event scoring has ended.
  const end = toTimestampMs(event?.aggregateAt, event?.endAt, event?.end);
  const start = Math.max(currentTime, toTimestampMs(event?.startAt, event?.start));
  return { start, end, active: end > start };
};

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
  return readJsonStorage(SHOP_ITEM_COUNTS_STORAGE_KEY, {}, isPlainObject);
};

const writeShopItemCountsStorage = (value) => {
  if (typeof window === 'undefined') return;

  if (!value || Object.keys(value).length === 0) {
    removeStorageItem(SHOP_ITEM_COUNTS_STORAGE_KEY);
    return;
  }

  writeJsonStorage(SHOP_ITEM_COUNTS_STORAGE_KEY, value);
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
  roundsPerInterval,
  currentFireOption,
  naturalSettings = {},
  onNaturalSettingsChange,
  surveyData = {},
  setSurveyData,
}) => {
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [exchangeSummaries, setExchangeSummaries] = useState([]);
  const [events, setEvents] = useState([]);
  const [calculationTime, setCalculationTime] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setCalculationTime(Date.now());
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
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
  const menuRef = useRef(null);
  const [menuHeight, setMenuHeight] = useState(0);
  const [menuRevealed, setMenuRevealed] = useState(false);
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const observer = new ResizeObserver(() => setMenuHeight(menu.offsetHeight));
    observer.observe(menu);
    return () => observer.disconnect();
  }, []);

  const incomeSource = getEventLiveSource(surveyData).label;
  const localCurrentFireOption = surveyData.fires2 && surveyData.fires2 !== 'none' ? surveyData.fires2 : surveyData.firea || currentFireOption || '25';
  const setLocalCurrentFireOption = value => setSurveyData(prev => ({ ...prev, firea: value, fires2: 'none' }));
  const liveEstimate = useEventLiveEstimate(surveyData, localCurrentFireOption);
  const localScorePerRoundMan = liveEstimate.points === null ? '0' : String(liveEstimate.points / 10000);
  const [localRoundsPerInterval, setLocalRoundsPerInterval] = useState(roundsPerInterval || '28');

  const getNaturalSetting = (key, fallback) => (
    Object.prototype.hasOwnProperty.call(naturalSettings, key)
      ? naturalSettings[key]
      : fallback
  );
  
  const updateNaturalSetting = (key, value) => {
    if (onNaturalSettingsChange) {
      onNaturalSettingsChange({ [key]: value });
    }
  };
  const currentNaturalFire = getNaturalSetting('currentNaturalFire', surveyData.currentNaturalFire || '');
  const setCurrentNaturalFire = (value) => updateNaturalSetting('currentNaturalFire', value);
  const isLevelUpBonusEnabled = getNaturalSetting('isLevelUpBonusEnabled', surveyData.isLevelUpBonusEnabled || false);
  const setIsLevelUpBonusEnabled = (value) => updateNaturalSetting('isLevelUpBonusEnabled', value);
  const currentLevel = getNaturalSetting('currentLevel', surveyData.fireCurrentLevel || surveyData.currentLevel || '');
  const setCurrentLevel = (value) => updateNaturalSetting('currentLevel', value);
  const remainingExp = getNaturalSetting('remainingExp', surveyData.fireRemainingExp || surveyData.remainingExp || '');
  const setRemainingExp = (value) => updateNaturalSetting('remainingExp', value);
  const liveRank = getNaturalSetting('liveRank', surveyData.fireLiveRank || surveyData.liveRank || 'S');
  const challengeScore = getNaturalSetting('challengeScore', surveyData.challengeScore || '');
  const setChallengeScore = (value) => updateNaturalSetting('challengeScore', value);
  const mySekaiScore = getNaturalSetting('mySekaiScore', surveyData.mySekaiScore || '');
  const setMySekaiScore = (value) => updateNaturalSetting('mySekaiScore', value);
  const worldPass = getNaturalSetting('worldPass', surveyData.worldPass || false);
  const setWorldPass = (value) => updateNaturalSetting('worldPass', value);
  
  const isEventPointAdEnabled = surveyData.isEventPointAdEnabled || false;
  const setIsEventPointAdEnabled = (val) => {
    if (setSurveyData) {
      setSurveyData(prev => ({ ...prev, isEventPointAdEnabled: typeof val === 'function' ? val(prev.isEventPointAdEnabled || false) : val }));
    }
  };

  useEffect(() => {
    if (roundsPerInterval !== undefined) setLocalRoundsPerInterval(roundsPerInterval);
  }, [roundsPerInterval]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setBulkActionOpen(false);
      }
      if (presetMenuRef.current && !presetMenuRef.current.contains(event.target)) {
        setPresetMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


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
      fetchJson(`${SUITE_BASE_URL}/events.json`),
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
        eventRows,
      ]) => {
        if (cancelled) return;
        setExchangeSummaries(Array.isArray(summaries) ? summaries : []);
        setEvents(Array.isArray(eventRows) ? eventRows : []);
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
    const saved = readJsonStorage(SHOP_STATE_STORAGE_KEY, {}, isPlainObject);
    if (isPlainObject(saved.ownedBadgePointsByShop)) {
      setOwnedBadgePointsByShop(saved.ownedBadgePointsByShop);
    } else if (saved.ownedBadgePoints !== undefined) {
      setOwnedBadgePointsByShop({ default: saved.ownedBadgePoints || '' });
    }
  }, []);

  useEffect(() => {
    writeJsonStorage(SHOP_STATE_STORAGE_KEY, { ownedBadgePointsByShop });
  }, [ownedBadgePointsByShop]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = readJsonStorage(SHOP_PRESETS_STORAGE_KEY, [], Array.isArray);
    setShopPresets(normalizePresetSlots(saved));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    writeJsonStorage(SHOP_PRESETS_STORAGE_KEY, shopPresets);
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
    const fireOption = localCurrentFireOption;
    const firePerRound = getFireConsumption(fireOption);

    let naturalShopPoints = 0;
    const breakdown = [];
    const window = getNaturalCalculationWindow(selectedSummary, events, eventInfo, calculationTime);
    if (window.active) {
      const now = window.start;
      const end = window.end;
      const remainingMs = Math.max(0, end - now);
      const recoveryFire = Math.floor(remainingMs / (30 * 60 * 1000));

      let adBonusFire = 0;
      let checkTime = new Date(now);
      if (checkTime.getHours() >= 4) {
        checkTime.setDate(checkTime.getDate() + 1);
      }
      checkTime.setHours(4, 0, 0, 0);

      while (checkTime.getTime() < end) {
        adBonusFire += 10;
        checkTime.setDate(checkTime.getDate() + 1);
      }

      const userCurrentNatural = parseInt(currentNaturalFire) || 0;
      const baseNaturalFire = recoveryFire + adBonusFire + userCurrentNatural;

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

      const days = adBonusFire / 10;
      const cScoreVal = numberOrDefault(challengeScore, 250);
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

      const mScoreVal = numberOrDefault(mySekaiScore, 2500);
      const mySekaiMultiplier = worldPass ? 10 : 2;
      const mySekaiEPPerDay = Math.floor(mySekaiMultiplier * mScoreVal);
      const totalMySekaiEP = mScoreVal > 0 ? mySekaiEPPerDay * mySekaiDays : 0;

      const extraShopPoints = Math.floor((totalChallengeEP + totalMySekaiEP) / 10);
      const eventPointAdShopPoints = isEventPointAdEnabled ? days * 1000 : 0;
      naturalShopPoints += extraShopPoints + eventPointAdShopPoints;
      breakdown.push(
        { label: incomeSource, detail: `${totalNaturalFire.toLocaleString()}불 → ${naturalRounds.toLocaleString()}회 × ${perRoundPoints.toLocaleString()}포`, points: naturalRounds * perRoundPoints },
        { label: '챌린지 라이브', detail: `${days}일`, points: Math.floor(totalChallengeEP / 10) },
        { label: '마이세카', detail: `${mySekaiDays}일 · ${worldPass ? 10 : 2}배`, points: Math.floor(totalMySekaiEP / 10) },
        { label: '이벤트 포인트 광고', detail: `${isEventPointAdEnabled ? days : 0}일`, points: eventPointAdShopPoints },
      );
      window.fire = `현재 ${userCurrentNatural} + 자연회복 ${recoveryFire} + 광고 불 ${adBonusFire} + 레벨업 ${levelUpFire} = ${totalNaturalFire}불`;

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
      breakdown,
      calculationWindow: window,
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
  }, [incomeSource, events, calculationTime, visibleItems, currentOwnedBadgePoints, localScorePerRoundMan, localRoundsPerInterval, localCurrentFireOption, selectedSummary, eventInfo, currentNaturalFire, isLevelUpBonusEnabled, currentLevel, remainingExp, liveRank, challengeScore, mySekaiScore, worldPass, isEventPointAdEnabled]);

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
        .event-shop-simulator .shop-calculation{grid-column:1/-1;min-width:0;border:1px solid var(--theme-border);border-radius:12px;background:var(--theme-surface);color:var(--theme-text);font-size:13px;line-height:1.5;overflow:hidden}
        .shop-calculation>summary{display:flex;align-items:center;gap:10px;cursor:pointer;padding:12px 14px;list-style:none;background:var(--theme-surface-subtle)}
        .shop-calculation>summary::-webkit-details-marker{display:none}
        .shop-calculation>summary::before{content:'›';font-size:20px;line-height:1;color:var(--theme-text-muted);transition:transform .15s}
        .shop-calculation[open]>summary::before{transform:rotate(90deg)}
        .shop-calculation-title{font-size:13px;font-weight:800;white-space:nowrap}
        .shop-calculation-preview{margin-left:auto;font-size:11px;color:var(--theme-text-muted)}
        .shop-calculation-preview b{margin-left:5px;color:var(--theme-blue-text);font-size:12px}
        .shop-calculation-body{padding:12px 14px}
        .shop-calculation-period{display:flex;flex-wrap:wrap;gap:4px 10px;color:var(--theme-text-muted);font-size:11px}
        .shop-calculation-fire{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:8px;padding:8px 10px;border-radius:7px;background:var(--theme-surface-soft);font-size:11px;color:var(--theme-text-muted)}
        .shop-calculation-fire b{color:var(--theme-text);white-space:nowrap}
        .shop-calculation-notice{font-size:12px;margin-top:8px;color:var(--theme-text-muted)}
        .shop-calculation-columns{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:18px;margin-top:10px}
        .shop-calculation-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--theme-border)}
        .shop-calculation-row b{font-size:12px;font-weight:700}.shop-calculation-row small{display:block;color:var(--theme-text-muted);font-size:11px;line-height:1.5}
        .shop-calculation-row strong{font-size:13px;white-space:nowrap;font-variant-numeric:tabular-nums}.shop-calculation-row strong small{display:inline;margin-left:3px;font-weight:400}
        .shop-calculation-total{display:flex;justify-content:space-between;gap:8px;padding-top:10px;font-size:12px;font-weight:800;color:var(--theme-blue-text)}
        .shop-calculation-balance{align-self:start;background:var(--theme-surface-soft);border-radius:9px;padding:12px}
        .shop-calculation-balance>div{display:flex;justify-content:space-between;gap:10px;padding:5px 0;font-size:12px}.shop-calculation-balance b{white-space:nowrap;font-variant-numeric:tabular-nums}.shop-calculation-balance span{color:var(--theme-text-muted)}
        .shop-calculation-balance .shop-calculation-shortfall{border-top:1px solid var(--theme-border);margin-top:7px;padding-top:10px;font-weight:800;font-size:14px}.shop-calculation-shortfall span{color:var(--theme-text)}
        .shop-calculation-balance .shop-calculation-extra{margin-top:8px;padding:8px;border-radius:7px;background:var(--theme-blue-soft);color:var(--theme-blue-text)}.shop-calculation-extra span{color:inherit}
        @media(max-width:600px){.shop-calculation-columns{grid-template-columns:1fr;gap:12px}.shop-calculation-body{padding:10px}.shop-calculation>summary{padding:11px 10px}.shop-calculation-preview{font-size:10px}}
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
        .shop-menu-sticky{position:sticky;top:calc(-1 * var(--shop-menu-height));z-index:30;background:var(--theme-surface);border-radius:14px 14px 0 0;box-shadow:0 3px 8px #0001}
        .shop-menu-sticky.is-revealed{top:0}
        .shop-menu-content{overflow:visible}
        .event-shop-simulator .shop-menu-handle{display:flex;align-items:center;justify-content:center;gap:5px;width:100%;height:24px;min-height:24px;margin:0;padding:0;border:0;border-radius:0;background:var(--theme-surface-subtle);color:var(--theme-text-muted);font-size:11px;font-weight:600;cursor:pointer}
        .shop-menu-handle:hover{color:var(--theme-blue-text)}
        .shop-controls-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(135px,.55fr) auto;align-items:center;gap:6px;margin-top:6px;text-align:left}
        .shop-controls-row>div:first-child{grid-column:auto;min-height:44px}
        .shop-actions button{min-height:32px;white-space:nowrap}
        .shop-preset{width:80px}
        .event-shop-natural-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;align-items:center}
        .event-shop-natural-field{display:flex;align-items:center;justify-content:space-between;gap:5px;min-width:0;padding:4px 6px;border:1px solid #cfdafe;border-radius:7px;background:#fff}
        .event-shop-natural-label{font-size:11px;font-weight:700;color:#312e81;line-height:1.2}
        .event-shop-natural-value{display:flex;align-items:center;gap:2px;min-width:0}
        .event-shop-natural-input{width:64px!important;min-width:0!important;height:32px!important;margin:0!important;padding:0 5px!important;border:1px solid #cbd5e1!important;border-radius:6px!important;background:#fff!important;color:#312e81!important;font-size:14px!important;font-weight:700!important;text-align:right!important;box-sizing:border-box!important;-moz-appearance:textfield}
        .event-shop-natural-input::-webkit-outer-spin-button,.event-shop-natural-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
        .event-shop-natural-checks{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;gap:4px 14px;padding:2px 6px}
        .event-shop-natural-checks label{display:inline-flex;align-items:center;gap:5px;min-height:28px;color:#312e81;font-size:11px;font-weight:700;cursor:pointer}
        .event-shop-natural-checks input[type=checkbox]{width:18px!important;height:18px!important;min-width:18px!important;min-height:18px!important}
        @media(min-width:900px){.event-shop-natural-grid{grid-template-columns:repeat(3,minmax(0,1fr)) minmax(240px,1.5fr)}.event-shop-natural-checks{grid-column:auto}}
        @media(max-width:767px){.shop-controls-row{grid-template-columns:minmax(0,1fr) auto}.shop-controls-row>div:first-child{grid-column:1/-1}.event-shop-natural-field{flex-direction:column;align-items:stretch;gap:3px}.event-shop-natural-value{justify-content:flex-end}.event-shop-natural-input{width:100%!important}.shop-actions{gap:4px}.shop-preset{width:70px}}
      `}} />
      <div onScroll={() => setMenuRevealed(false)} onWheel={() => setMenuRevealed(false)} onTouchMove={() => setMenuRevealed(false)} className="event-shop-simulator rounded-2xl border border-pink-100 bg-gradient-to-b from-white to-pink-50/40 shadow-2xl overflow-x-hidden overflow-y-auto max-h-[calc(100vh-4.5rem)] supports-[height:100dvh]:max-h-[calc(100dvh-4.5rem)] sm:max-h-[88vh] sm:supports-[height:100dvh]:max-h-[88dvh]">
        <div className={`shop-menu-sticky${menuRevealed ? ' is-revealed' : ''}`} style={{ '--shop-menu-height': `${menuHeight}px` }}
          onMouseLeave={() => { if (!presetMenuOpen && !bulkActionOpen) setMenuRevealed(false); }}
          onWheel={() => setMenuRevealed(false)}
          onTouchMove={() => setMenuRevealed(false)}>
        <div ref={menuRef} className="shop-menu-content px-2 sm:px-4 py-1.5 sm:py-2.5 border-b border-pink-100 bg-white/95 shrink-0">

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
              <CustomSelectDropdown
                value={selectedSummaryId}
                onChange={setSelectedSummaryId}
                ariaLabel={t('fire.shop_simulator_title')}
                className="!w-full sm:!w-48 !mb-0"
                buttonClassName="!h-8 !w-full sm:!w-48 !rounded-lg !border-gray-200 !px-7 !text-xs !font-bold !text-gray-600"
                disabled={loading || visibleSummaries.length === 0}
                options={visibleSummaries.map(summary => ({
                  value: summary.id,
                  label: `#${summary.eventId} ${summary.assetbundleName || ''}`,
                }))}
              />
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

          <div>
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
              <div className="shop-controls-row">
                <div className="col-span-2 md:col-span-1 rounded-lg bg-white/80 border border-gray-100 relative flex min-h-[46px] sm:min-h-[52px]">
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2 px-2 py-1.5 border-r border-gray-100 relative">
                    <div className="flex items-center gap-1 min-w-0">
                      <div className="text-[10px] text-gray-400 font-bold whitespace-nowrap">판 당 이벤포</div>
                      <div className="relative flex items-center">
                        <EventLiveDeckButton surveyData={surveyData} setSurveyData={setSurveyData} bonus={localCurrentFireOption} estimate={liveEstimate} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          value={localScorePerRoundMan}
                          readOnly
                          title="덱·곡 설정에서 변경"
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
                    <CustomSelectDropdown
                      value={localCurrentFireOption}
                      onChange={setLocalCurrentFireOption}
                      ariaLabel="보너스"
                      className="w-14 sm:w-11"
                      buttonClassName="!h-7 !w-14 sm:!w-11 !rounded-md !border-gray-200 !bg-transparent !px-5 !text-[13px] !font-extrabold !text-gray-700"
                      options={[
                        { value: "1", label: "0불" }, { value: "5", label: "1불" }, { value: "10", label: "2불" },
                        { value: "15", label: "3불" }, { value: "20", label: "4불" }, { value: "25", label: "5불" },
                        { value: "27", label: "6불" }, { value: "29", label: "7불" }, { value: "31", label: "8불" },
                        { value: "33", label: "9불" }, { value: "35", label: "10불" }
                      ]}
                    />
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



                <div className="shop-actions flex flex-wrap items-center justify-end gap-1 sm:gap-1.5">
                <div className="shop-preset relative" ref={presetMenuRef}>
                  <button
                    type="button"
                    onClick={() => setPresetMenuOpen(open => !open)}
                    className={`h-8 w-full rounded-lg px-2 text-[10px] font-extrabold shadow-sm transition-all ${presetMenuOpen ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
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

                </div>
              </div>

                <div className="w-full mt-1.5">
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

              {(loading || loadError) && (
                <div className={`mt-2 rounded-lg px-3 py-2 text-xs font-bold ${loadError ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                  {loadError ? t('fire.shop_load_failed') : t('fire.shop_loading')}
                </div>
              )}
            </div>
          </div>
          <div className="mt-2">
                <details className="shop-calculation">
                  <summary><span className="shop-calculation-title">계산 과정</span><span className="shop-calculation-preview">예상 수입 <b>{totals.naturalShopPoints.toLocaleString()}포</b></span></summary>
                  <div className="shop-calculation-body">
                    <div className="shop-calculation-period"><span>계산 기간</span><span>{totals.calculationWindow.end ? `${new Date(totals.calculationWindow.start).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} → ${new Date(totals.calculationWindow.end).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}` : '이벤트 기간을 확인할 수 없습니다.'}</span></div>
                    {!totals.calculationWindow.active && <div className="shop-calculation-notice">남은 이벤트 기간이 없어 추가 수입은 0포입니다.</div>}
                    {totals.calculationWindow.fire && <div className="shop-calculation-fire"><b>사용 가능 불</b><span>{totals.calculationWindow.fire}</span></div>}
                    <div className="shop-calculation-columns">
                      <section className="shop-calculation-income" aria-label="예상 수입 내역">
                        {totals.breakdown.map(row => <div key={row.label} className="shop-calculation-row"><div><b>{row.label}</b><small>{row.detail}</small></div><strong>{row.points.toLocaleString()}<small>포</small></strong></div>)}
                        <div className="shop-calculation-total"><span>예상 수입 합계</span><b>{totals.naturalShopPoints.toLocaleString()}포</b></div>
                      </section>
                      <section className="shop-calculation-balance" aria-label="부족분 계산">
                        <div><span>구매 예정</span><b>{totals.plannedCost.toLocaleString()}포</b></div>
                        <div><span>보유 포인트 차감</span><b>− {totals.owned.toLocaleString()}포</b></div>
                        <div><span>예상 수입 차감</span><b>− {totals.naturalShopPoints.toLocaleString()}포</b></div>
                        <div className="shop-calculation-shortfall"><span>부족 포인트</span><b>{totals.needed.toLocaleString()}포</b></div>
                        <div className="shop-calculation-extra"><span>추가 라이브</span><b>{totals.additionalRounds?.toLocaleString() ?? '-'}회 · {totals.additionalFire?.toLocaleString() ?? '-'}불</b></div>
                      </section>
                    </div>
                  </div>
                </details>
          </div>
        </div>
          <button type="button" className="shop-menu-handle" aria-label="상점 메뉴 펼치기" aria-expanded={menuRevealed}
            onPointerEnter={event => { if (event.pointerType === 'mouse') setMenuRevealed(true); }}
            onClick={() => setMenuRevealed(value => !value)}>
            <span aria-hidden="true">{menuRevealed ? '⌃' : '⌄'}</span> 메뉴
          </button>
        </div>

        <div
          className="p-3 sm:p-4"

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
