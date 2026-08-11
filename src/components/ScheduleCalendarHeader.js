import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { characterBirthdays } from '../data/characterBirthdays';
import useModalAccessibility from '../hooks/useModalAccessibility';
import UpcomingEvents from './UpcomingEvents';
import './ScheduleCalendarHeader.css';

const CALENDAR_URL = 'https://asset.rilaksekai.com/data/calendar/calendar.json';
const BIRTHDAY_MARK_URL = '/assets/card_style/rairity_birth.webp';

const UI_TEXT = {
  ko: {
    calendar: '일정 달력',
    close: '닫기',
    previousMonth: '이전 달',
    nextMonth: '다음 달',
    today: '오늘',
    loading: '일정을 불러오는 중…',
    loadError: '일정을 불러오지 못했습니다.',
    empty: '등록된 일정이 없습니다.',
    current: '현재',
    date: '일정',
    units: '유닛',
    characters: '캐릭터',
    details: '상세',
    original: '원문',
    related: '관련 일정',
    source: '자료 보기',
    more: '개 더',
    weekdays: ['일', '월', '화', '수', '목', '금', '토'],
  },
  ja: {
    calendar: 'スケジュール',
    close: '閉じる',
    previousMonth: '前の月',
    nextMonth: '次の月',
    today: '今日',
    loading: 'スケジュールを読み込み中…',
    loadError: 'スケジュールを読み込めませんでした。',
    empty: '登録された予定はありません。',
    current: '開催中',
    date: '日程',
    units: 'ユニット',
    characters: 'キャラクター',
    details: '詳細',
    original: '原文',
    related: '関連スケジュール',
    source: '資料を見る',
    more: '件',
    weekdays: ['日', '月', '火', '水', '木', '金', '土'],
  },
  en: {
    calendar: 'Schedule',
    close: 'Close',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    today: 'Today',
    loading: 'Loading schedule…',
    loadError: 'Could not load the schedule.',
    empty: 'No schedule is available.',
    current: 'Now',
    date: 'Date',
    units: 'Unit',
    characters: 'Character',
    details: 'Details',
    original: 'Original',
    related: 'Related schedule',
    source: 'Open source',
    more: 'more',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
};

const CATEGORY_META = {
  game_event: { icon: '★', className: 'event' },
  gacha: { icon: '◇', className: 'gacha' },
  paid_gacha: { icon: '◇', className: 'gacha' },
  reprint_gacha: { icon: '◇', className: 'gacha' },
  song: { icon: '♪', className: 'song' },
  birthday: { icon: '●', className: 'birthday' },
  anniversary: { icon: '●', className: 'anniversary' },
  real_event: { icon: '◆', className: 'real' },
  mysekai: { icon: '⌂', className: 'mysekai' },
};

const UNIT_META = {
  light_sound: { color: '#4455DD', logo: '/assets/event/units/Lnlogo.webp' },
  idol: { color: '#88DD44', logo: '/assets/event/units/MMJlogo.webp' },
  street: { color: '#EE1166', logo: '/assets/event/units/VBSlogo.webp' },
  theme_park: { color: '#FF9900', logo: '/assets/event/units/WxSlogo.webp' },
  school_refusal: { color: '#884499', logo: '/assets/event/units/25jilogo.webp' },
  piapro: { color: '#888888', logo: '/assets/event/units/Virtualsingerlogo.webp' },
};

const CHARACTER_COLOR_BY_ID = new Map(
  characterBirthdays.map((character) => [Number(character.image), character.color]),
);

const getContrastTextColor = (hexColor) => {
  const hex = String(hexColor || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#173c58';
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 >= 155 ? '#173c58' : '#fff';
};

const getCharacterColorStyle = (item) => {
  const characterId = Number(item?.characterIds?.[0] || item?.characters?.[0]?.id);
  const color = CHARACTER_COLOR_BY_ID.get(characterId);
  if (!color) return undefined;
  return {
    '--schedule-item-color': color,
    '--schedule-item-text-color': getContrastTextColor(color),
  };
};

const getUnitColorStyle = (item) => {
  const unitMeta = getUnitMeta(item);
  if (!unitMeta) return undefined;
  return {
    '--schedule-item-color': unitMeta.color,
    '--schedule-item-text-color': getContrastTextColor(unitMeta.color),
  };
};

const parseDate = (value) => {
  if (!value || typeof value !== 'string') return null;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const isSameDay = (left, right) => (
  left && right
  && left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth()
  && left.getDate() === right.getDate()
);

const isBetween = (date, start, end) => (
  date && start && end && date.getTime() >= start.getTime() && date.getTime() <= end.getTime()
);

const normalizeEntries = (payload) => {
  const documents = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.entries)
      ? payload.entries
      : [];
  const seen = new Set();

  return documents.flatMap((document) => {
    const items = Array.isArray(document?.items) ? document.items : [];
    return items.map((item, index) => ({
      ...item,
      calendarMonth: document.calendarMonth || '',
      calendarTitleJa: document.titleJa || '',
      calendarTitleKo: document.titleKo || '',
      calendarSource: document.source || null,
      _key: `${document.id || document.calendarMonth || 'calendar'}:${item.id || index}`,
    }));
  }).filter((item) => {
    const signature = [
      item.category,
      item.startDate,
      item.endDate || '',
      item.titleJa || '',
      item.titleKo || '',
    ].join('|');
    if (seen.has(signature)) return false;
    seen.add(signature);
    return Boolean(parseDate(item.startDate));
  });
};

const getItemTitle = (item, language) => {
  if (language === 'ja') return item.titleJa || item.titleKo || '';
  return item.titleKo || item.titleJa || '';
};

const getItemDetails = (item, language) => {
  if (language === 'ja') return item.detailsJa || item.detailsKo || '';
  return item.detailsKo || item.detailsJa || '';
};

const getCategoryLabel = (item, language) => {
  if (language === 'ja') return item.categoryJa || item.categoryKo || item.category || '';
  return item.categoryKo || item.categoryJa || item.category || '';
};

const getCategoryMeta = (category = '') => {
  if (CATEGORY_META[category]) return CATEGORY_META[category];
  if (category.includes('gacha')) return CATEGORY_META.gacha;
  return { icon: '•', className: 'other' };
};

const getUnitMeta = (item) => {
  const unitCode = item.unitCodes?.find((code) => code !== 'piapro') || item.unitCodes?.[0];
  return UNIT_META[unitCode] || null;
};

const formatDate = (value, language, includeYear = true) => {
  const date = typeof value === 'string' ? parseDate(value) : value;
  if (!date) return '';
  if (language === 'ja') {
    return `${includeYear ? `${date.getFullYear()}年` : ''}${date.getMonth() + 1}月${date.getDate()}日`;
  }
  if (language === 'en') {
    return date.toLocaleDateString('en-US', {
      ...(includeYear ? { year: 'numeric' } : {}),
      month: 'short',
      day: 'numeric',
    });
  }
  return `${includeYear ? `${date.getFullYear()}년 ` : ''}${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const formatRange = (item, language) => {
  const start = parseDate(item.startDate);
  const end = parseDate(item.endDate) || start;
  if (!start) return '';
  if (isSameDay(start, end)) return formatDate(start, language);
  return `${formatDate(start, language)} ~ ${formatDate(end, language)}`;
};

const buildCalendarDays = (cursor) => {
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = addDays(monthStart, -monthStart.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
};

const mergeBirthdayBackgrounds = (entries) => {
  const backgrounds = entries.filter((item) => item.category === 'mysekai');
  return entries
    .filter((item) => item.category !== 'mysekai')
    .map((item) => {
      if (!['birthday', 'anniversary'].includes(item.category)) return item;
      const related = backgrounds.find((background) => (
        background.startDate === item.startDate
        && background.characterCodes?.some((code) => item.characterCodes?.includes(code))
      ));
      return related ? { ...item, relatedSchedule: related } : item;
    });
};

const createAmatsuyuRanges = (entries) => entries
  .filter((item) => item.category === 'birthday')
  .map((item) => {
    const birthday = parseDate(item.startDate);
    return {
      ...item,
      _key: `${item._key}:amatsuyu`,
      category: 'amatsuyu',
      startDate: toDateKey(addDays(birthday, -3)),
      endDate: toDateKey(addDays(birthday, -1)),
      isAmatsuyu: true,
    };
  });

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
  </svg>
);

const ChevronIcon = ({ direction }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const ScheduleCalendarHeader = ({ children }) => {
  const { language } = useTranslation();
  const locale = UI_TEXT[language] ? language : 'ko';
  const text = UI_TEXT[locale];
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(CALENDAR_URL, {
          cache: 'no-cache',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Calendar request failed: ${response.status}`);
        const payload = await response.json();
        setEntries(normalizeEntries(payload));
        setLoadError(false);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setLoadError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, []);

  const calendarDialogRef = useModalAccessibility({
    isOpen: calendarOpen,
    onClose: () => setCalendarOpen(false),
  });
  const detailDialogRef = useModalAccessibility({
    isOpen: Boolean(selectedItem),
    onClose: () => setSelectedItem(null),
  });

  const displayEntries = useMemo(() => mergeBirthdayBackgrounds(entries), [entries]);
  const rangeEntries = useMemo(() => [
    ...displayEntries.filter((item) => {
      const start = parseDate(item.startDate);
      const end = parseDate(item.endDate);
      return end && !isSameDay(start, end);
    }),
    ...createAmatsuyuRanges(displayEntries),
  ], [displayEntries]);
  const singleEntries = useMemo(() => displayEntries.filter((item) => {
    const start = parseDate(item.startDate);
    const end = parseDate(item.endDate);
    return !end || isSameDay(start, end);
  }), [displayEntries]);

  const calendarDays = useMemo(() => buildCalendarDays(cursor), [cursor]);
  const visibleStart = calendarDays[0];
  const visibleEnd = calendarDays[calendarDays.length - 1];

  const moveMonth = (amount) => {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const openCalendar = () => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setCalendarOpen(true);
  };

  const openDetails = (item) => {
    if (item.isAmatsuyu) {
      const birthdayItem = displayEntries.find((candidate) => candidate._key === item._key.replace(':amatsuyu', ''));
      setSelectedItem(birthdayItem || item);
      return;
    }
    setSelectedItem(item);
  };

  const renderRangeSegment = (item, date) => {
    const start = parseDate(item.startDate);
    const end = parseDate(item.endDate) || start;
    if (!isBetween(date, start, end)) return null;
    const continuesBefore = date.getTime() > start.getTime();
    const continuesAfter = date.getTime() < end.getTime();
    const labelVisible = isSameDay(date, start) || (isSameDay(date, visibleStart) && start < visibleStart);
    const unitMeta = getUnitMeta(item);
    const bannerCharacterId = item.category === 'game_event'
      ? item.characterIds?.[0] || item.characters?.[0]?.id
      : null;
    const hasEventIconPair = Boolean(unitMeta?.logo && bannerCharacterId);
    const meta = item.isAmatsuyu
      ? { icon: '', className: 'amatsuyu' }
      : getCategoryMeta(item.category);
    const style = item.isAmatsuyu
      ? getCharacterColorStyle(item)
      : unitMeta && item.category === 'game_event'
        ? getUnitColorStyle(item)
        : undefined;

    return (
      <button
        key={`${item._key}:${toDateKey(date)}`}
        type="button"
        className={`schedule-range-segment schedule-tone-${meta.className} ${continuesBefore ? 'continues-before' : ''} ${continuesAfter ? 'continues-after' : ''}`}
        style={style}
        aria-label={`${getItemTitle(item, locale)} ${formatRange(item, locale)}`}
        onClick={() => openDetails(item)}
      >
        {labelVisible && (
          <span className="schedule-range-label">
            {!item.isAmatsuyu && unitMeta?.logo && (
              <img className="schedule-range-unit-logo" src={unitMeta.logo} alt="" aria-hidden="true" />
            )}
            {!item.isAmatsuyu && bannerCharacterId && (
              <img
                className="schedule-range-character-stamp"
                src={`/assets/stamps/${String(bannerCharacterId).padStart(2, '0')}.webp`}
                alt=""
                aria-hidden="true"
              />
            )}
            {(item.isAmatsuyu || !hasEventIconPair) && (
              <span>{item.isAmatsuyu ? (locale === 'ja' ? 'あまつゆ' : locale === 'en' ? 'Amatsuyu' : '아마츠유') : getItemTitle(item, locale)}</span>
            )}
          </span>
        )}
      </button>
    );
  };

  const selectedRelated = selectedItem?.relatedSchedule;
  const selectedMeta = selectedItem ? getCategoryMeta(selectedItem.category) : null;

  return (
    <>
      <section className="schedule-header" aria-label={text.calendar}>
        <UpcomingEvents calendarAction={(
          <button
            type="button"
            className="schedule-calendar-button"
            aria-label={text.calendar}
            title={text.calendar}
            onClick={openCalendar}
          >
            <CalendarIcon />
          </button>
        )}>
          {children}
        </UpcomingEvents>
      </section>

      {calendarOpen && (
        <div className="schedule-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCalendarOpen(false);
        }}>
          <section ref={calendarDialogRef} className="schedule-calendar-modal" role="dialog" aria-modal="true" aria-label={text.calendar} tabIndex={-1}>
            <header className="schedule-calendar-modal-header">
              <div>
                <span className="schedule-calendar-eyebrow">PROJECT SEKAI</span>
                <h2>{text.calendar}</h2>
              </div>
              <button type="button" className="schedule-icon-button close" aria-label={text.close} onClick={() => setCalendarOpen(false)}>
                <CloseIcon />
              </button>
            </header>

            <div className="schedule-month-toolbar">
              <button type="button" className="schedule-icon-button" aria-label={text.previousMonth} onClick={() => moveMonth(-1)}>
                <ChevronIcon direction="left" />
              </button>
              <button
                type="button"
                className="schedule-month-title"
                onClick={() => {
                  const now = new Date();
                  setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                }}
                title={text.today}
              >
                {locale === 'ja'
                  ? `${cursor.getFullYear()}年 ${cursor.getMonth() + 1}月`
                  : locale === 'en'
                    ? cursor.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                    : `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`}
              </button>
              <button type="button" className="schedule-icon-button" aria-label={text.nextMonth} onClick={() => moveMonth(1)}>
                <ChevronIcon direction="right" />
              </button>
            </div>

            {loading ? (
              <div className="schedule-calendar-state">{text.loading}</div>
            ) : loadError ? (
              <div className="schedule-calendar-state error">{text.loadError}</div>
            ) : (
              <div className="schedule-calendar-shell">
                <div className="schedule-weekdays">
                  {text.weekdays.map((weekday, index) => (
                    <div key={weekday} className={index === 0 ? 'sunday' : index === 6 ? 'saturday' : ''}>{weekday}</div>
                  ))}
                </div>
                <div className="schedule-calendar-grid">
                  {calendarDays.map((date) => {
                    const dateKey = toDateKey(date);
                    const daySingles = singleEntries.filter((item) => item.startDate === dateKey);
                    const dayRanges = rangeEntries.filter((item) => {
                      const start = parseDate(item.startDate);
                      const end = parseDate(item.endDate) || start;
                      return isBetween(date, start, end);
                    });
                    const inMonth = date.getMonth() === cursor.getMonth();
                    const today = isSameDay(date, startOfDay(new Date()));

                    return (
                      <div key={dateKey} className={`schedule-day ${inMonth ? '' : 'outside'} ${today ? 'today' : ''}`}>
                        <div className="schedule-day-number">{date.getDate()}</div>
                        <div className="schedule-day-ranges">
                          {dayRanges.slice(0, 2).map((item) => renderRangeSegment(item, date))}
                        </div>
                        <div className="schedule-day-items">
                          {daySingles.slice(0, 3).map((item) => {
                            const meta = getCategoryMeta(item.category);
                            const unitMeta = getUnitMeta(item);
                            const isCelebration = ['birthday', 'anniversary'].includes(item.category);
                            const itemStyle = isCelebration
                              ? getCharacterColorStyle(item)
                              : unitMeta && ['song', 'game_event'].includes(item.category)
                                ? getUnitColorStyle(item)
                                : undefined;
                            return (
                              <button
                                type="button"
                                key={item._key}
                                className={`schedule-day-item schedule-tone-${meta.className} ${isCelebration ? 'celebration' : ''}`}
                                style={itemStyle}
                                title={getItemTitle(item, locale)}
                                aria-label={getItemTitle(item, locale)}
                                onClick={() => openDetails(item)}
                              >
                                {isCelebration ? (
                                  item.characterIds?.[0] ? (
                                    <span className="schedule-celebration-face">
                                      <img className="schedule-character-icon" src={`/assets/characters/${String(item.characterIds[0]).padStart(2, '0')}.webp`} alt="" />
                                      <img className="schedule-birthday-mark" src={BIRTHDAY_MARK_URL} alt="" />
                                    </span>
                                  ) : <span className="schedule-day-item-icon">{meta.icon}</span>
                                ) : (
                                  <span className="schedule-day-item-icon">{meta.icon}</span>
                                )}
                                {!isCelebration && <span>{getItemTitle(item, locale)}</span>}
                              </button>
                            );
                          })}
                          {daySingles.length > 3 && (
                            <span className="schedule-day-overflow">+{daySingles.length - 3}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {displayEntries.filter((item) => {
                  const start = parseDate(item.startDate);
                  const end = parseDate(item.endDate) || start;
                  return start <= visibleEnd && end >= visibleStart;
                }).length === 0 && (
                  <div className="schedule-empty-month">{text.empty}</div>
                )}
                <div className="schedule-legend">
                  {['song', 'real_event', 'game_event', 'birthday', 'anniversary'].map((category) => {
                    const meta = getCategoryMeta(category);
                    const sample = displayEntries.find((item) => item.category === category);
                    if (!sample && category !== 'game_event') return null;
                    return (
                      <span key={category} className={`schedule-tone-${meta.className}`}>
                        <i /> {sample ? getCategoryLabel(sample, locale) : (locale === 'ja' ? 'イベント' : locale === 'en' ? 'Event' : '이벤트')}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {selectedItem && (
            <div className="schedule-detail-backdrop" role="presentation" onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedItem(null);
            }}>
              <section ref={detailDialogRef} className="schedule-detail-modal" role="dialog" aria-modal="true" aria-label={getItemTitle(selectedItem, locale)} tabIndex={-1}>
                <header className="schedule-detail-header">
                  <div className={`schedule-detail-category schedule-tone-${selectedMeta.className}`}>
                    <span>{selectedMeta.icon}</span> {getCategoryLabel(selectedItem, locale)}
                  </div>
                  <button type="button" className="schedule-icon-button close" aria-label={text.close} onClick={() => setSelectedItem(null)}>
                    <CloseIcon />
                  </button>
                </header>
                <div className="schedule-detail-body">
                  <h3>{getItemTitle(selectedItem, locale)}</h3>
                  {selectedItem.titleJa && selectedItem.titleJa !== getItemTitle(selectedItem, locale) && (
                    <p className="schedule-detail-japanese">{selectedItem.titleJa}</p>
                  )}
                  <dl className="schedule-detail-list">
                    <div>
                      <dt>{text.date}</dt>
                      <dd>{formatRange(selectedItem, locale)}</dd>
                    </div>
                    {getItemDetails(selectedItem, locale) && (
                      <div>
                        <dt>{text.details}</dt>
                        <dd>{getItemDetails(selectedItem, locale)}</dd>
                      </div>
                    )}
                    {selectedItem.units?.length > 0 && (
                      <div>
                        <dt>{text.units}</dt>
                        <dd>{selectedItem.units.map((unit) => locale === 'ja' ? unit.nameJa : unit.nameKo || unit.nameJa).join(', ')}</dd>
                      </div>
                    )}
                    {selectedItem.characters?.length > 0 && (
                      <div>
                        <dt>{text.characters}</dt>
                        <dd>{selectedItem.characters.map((character) => locale === 'ja' ? character.nameJa : character.nameKo || character.nameJa).join(', ')}</dd>
                      </div>
                    )}
                    {selectedItem.sourceText && (
                      <div>
                        <dt>{text.original}</dt>
                        <dd>{selectedItem.sourceText}</dd>
                      </div>
                    )}
                  </dl>

                  {selectedRelated && (
                    <div className="schedule-related-item">
                      <span>{text.related}</span>
                      <strong>{getItemTitle(selectedRelated, locale)}</strong>
                      <small>{formatRange(selectedRelated, locale)}</small>
                      {getItemDetails(selectedRelated, locale) && <p>{getItemDetails(selectedRelated, locale)}</p>}
                    </div>
                  )}

                  <div className="schedule-detail-links">
                    {Object.entries(selectedItem.wikiLinks || {})
                      .filter(([linkLocale]) => linkLocale !== 'ko' || locale === 'ko')
                      .map(([, link]) => link?.url ? (
                      <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.site || text.source}</a>
                    ) : null)}
                    {selectedItem.calendarSource?.url && (
                      <a href={selectedItem.calendarSource.url} target="_blank" rel="noreferrer">{text.source}</a>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ScheduleCalendarHeader;
