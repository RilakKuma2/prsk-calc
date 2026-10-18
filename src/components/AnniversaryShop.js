import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../contexts/LanguageContext';
import rewardAssets from '../data/anniversaryRewards.json';
import { ASSET_BASE_URL, joinUrl } from '../config/env';
import useModalAccessibility from '../hooks/useModalAccessibility';
import { readJsonStorage, writeJsonStorage } from '../utils/safeStorage';
import {
  ANNIVERSARY_CHARACTERS, CHARACTER_ITEMS, LOGIN_COINS_PER_DAY, EVENT_COIN_STEP, ANNIVERSARY_END, anniversaryVisible, calculateAnniversary, CATEGORIES,
  defaultAnniversaryPlan, GACHA_TIERS, LIVE_STEPS, LIVE_TARGETS,
  missionCoins, missionRewards, normalizeAnniversaryPlan, REQUIREMENTS,
  SHOP_ITEMS, TIERS,
} from '../utils/anniversaryShop';
import './AnniversaryShop.css';

const SPECIAL_CHARACTERS = [[21, 26, 1, 7, 11, 15, 20], [22, 25, 2, 5, 9, 16, 18], [23, 4, 6, 12, 14, 19], [24, 3, 8, 10, 13, 17]];
const STORAGE_KEY = 'anniversary_shop_2026_v1';
const UNITS = ['Leo/need', 'MORE MORE JUMP!', 'Vivid BAD SQUAD', 'ワンダーランズ×ショウタイム', '25時、ナイトコードで。', 'バーチャル・シンガー'];
const LOCAL_UNITS = {
  ko: ['Leo/need', 'MORE MORE JUMP!', 'Vivid BAD SQUAD', '원더랜즈×쇼타임', '25시, 나이트코드에서.', '버추얼 싱어'],
  en: ['Leo/need', 'MORE MORE JUMP!', 'Vivid BAD SQUAD', 'Wonderlands×Showtime', 'Nightcord at 25:00', 'Virtual Singer'],
};

const assetBase = ASSET_BASE_URL || 'https://asset.rilaksekai.com';
const charName = (character, language) => character[language === 'ja' ? 'nameJa' : language === 'en' ? 'nameEn' : 'nameKo'];

function RewardImage({ path, alt }) {
  const [fallback, setFallback] = useState(0);
  useEffect(() => setFallback(0), [path]);
  if (fallback > 1) return <span className="anniv-image-placeholder" title={alt}>◇</span>;
  return <img src={joinUrl(fallback ? 'https://asset2.rilaksekai.com' : assetBase, path)} alt={alt}
    onError={() => setFallback(value => value + 1)} loading="lazy" />;
}

function RangeField({ label, value, max, step = 1, onChange, valueText, coins, help }) {
  const id = useId();
  return <div className="anniv-range-field">
    <div className="anniv-section-row"><label htmlFor={id}>{label}</label><span>{valueText} <b className="anniv-cost">{coins.toLocaleString()}</b></span></div>
    <input id={id} type="range" min="0" max={max} step={step} value={value} aria-valuetext={valueText}
      onChange={e => onChange(Number(e.target.value))} />
    {help && <p className="anniv-hint">{help}</p>}
  </div>;
}

function CharacterPurchase({ item, selected, count, onChange }) {
  const { t, language } = useTranslation();
  const a = (key, values) => t(`anniversary.${key}`, values);
  return <details className="anniv-character-purchase">
    <summary><span>{a(item.id)}</span><span>{a('itemCount', { count })} <b className="anniv-cost">{(count * item.cost).toLocaleString(language)}</b></span></summary>
    <p className="anniv-hint">{a('unitCost', { cost: item.cost, max: item.max })}</p>
    {!selected && count > 0 && <p className="anniv-hint">{a('legacyPurchase', { count })}</p>}
    <div className="anniv-character-grid">{ANNIVERSARY_CHARACTERS.map(character => {
      const id = Number(character.image);
      const active = selected?.includes(id) || false;
      return <button type="button" key={id} aria-pressed={active} onClick={() => onChange(active ? selected.filter(value => value !== id) : [...(selected || []), id])}>
        <img src={`${process.env.PUBLIC_URL || ''}/assets/characters/${character.image}.webp`} alt="" loading="lazy" />
        <span>{charName(character, language)}</span>
      </button>;
    })}</div>
    <div className="anniv-actions"><button type="button" onClick={() => onChange(ANNIVERSARY_CHARACTERS.map(c => Number(c.image)))}>{a('selectAll')}</button><button type="button" onClick={() => onChange([])}>{a('clearShop')}</button></div>
  </details>;
}

function SoloLive({ plan, update }) {
  const { t, language } = useTranslation();
  const a = (key, values) => t(`anniversary.${key}`, values);
  const [characterId, setCharacterId] = useState(null);
  const panelRef = useRef(null);
  useEffect(() => {
    if (characterId === null) return undefined;
    const closeOutside = event => {
      if (!panelRef.current?.contains(event.target)) setCharacterId(null);
    };
    document.addEventListener('click', closeOutside, true);
    return () => document.removeEventListener('click', closeOutside, true);
  }, [characterId]);
  const [columns, setColumns] = useState(() => window.matchMedia('(max-width: 400px)').matches ? 4 : 6);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 400px)');
    const updateColumns = () => setColumns(query.matches ? 4 : 6);
    updateColumns();
    query.addEventListener('change', updateColumns);
    return () => query.removeEventListener('change', updateColumns);
  }, []);
  const [metadata, setMetadata] = useState({});
  const sliderId = useId();
  useEffect(() => {
    const controller = new AbortController();
    const load = async (name) => {
      for (const base of [assetBase, 'https://asset2.rilaksekai.com']) {
        try {
          const response = await fetch(joinUrl(base, `suite/${name}.json`), { signal: controller.signal });
          if (!response.ok) continue;
          const data = await response.json();
          if (!Array.isArray(data)) continue;
          if (!controller.signal.aborted) setMetadata(previous => ({ ...previous, [name]: data }));
          return;
        } catch { if (controller.signal.aborted) return; }
      }
    };
    ['materials', 'skillPracticeTickets', 'mysekaiMaterials'].forEach(load);
    return () => controller.abort();
  }, []);
  const coins = plan.solo[characterId] || 0;
  const setCoins = value => update('solo', { ...plan.solo, [characterId]: value });
  const name = characterId === null ? '' : charName(ANNIVERSARY_CHARACTERS.find(c => Number(c.image) === characterId), language);
  const pathFor = target => {
    const asset = rewardAssets[characterId][target];
    const row = metadata[asset.source]?.find(item => item.id === asset.id);
    return row?.iconAssetbundleName
      ? `mysekai/thumbnail/material/${row.iconAssetbundleName}/${row.iconAssetbundleName}.webp` : asset.path;
  };
  const reached = LIVE_TARGETS.filter(target => coins >= target);
  const selectedIndex = ANNIVERSARY_CHARACTERS.findIndex(character => Number(character.image) === characterId);
  const panelAfterIndex = Math.min(Math.floor(selectedIndex / columns) * columns + columns - 1, ANNIVERSARY_CHARACTERS.length - 1);
  const panel = characterId !== null && <div ref={panelRef} id={`${sliderId}-panel`} className="anniv-solo-panel">
    <div className="anniv-section-row"><strong>{name}</strong><b className="anniv-cost">{coins.toLocaleString(language)}</b></div>
    <div className="anniv-live-track">
      <label className="sr-only" htmlFor={sliderId}>{name} · {a('liveTitle')}</label>
      <input id={sliderId} type="range" min="0" max={LIVE_STEPS.length - 1} step="1" value={LIVE_STEPS.indexOf(coins)}
        aria-valuetext={`${coins.toLocaleString(language)} ${a('coin')}`} onChange={e => setCoins(LIVE_STEPS[Number(e.target.value)])} />
      <div className="anniv-live-milestones">{LIVE_TARGETS.map((target, index) => <button type="button" key={target}
        className={coins >= target ? 'is-reached' : ''} style={{ left: `${(index + 1) / (LIVE_STEPS.length - 1) * 100}%`, top: `${index % 2 * 61}px` }}
        onClick={() => setCoins(target)} title={`${target.toLocaleString(language)} · ${a(`reward${target}`)}`}
        aria-label={`${name} · ${target.toLocaleString(language)} · ${a(`reward${target}`)}`}>
        <RewardImage path={pathFor(target)} alt={a(`reward${target}`)} /><small>{target.toLocaleString(language)}</small>
      </button>)}</div>
    </div>
    <div className="anniv-earned">{reached.map(target => <span key={target}><RewardImage path={pathFor(target)} alt="" />{a(`reward${target}`)}</span>)}</div>
    </div>;
  return <section className="anniv-section anniv-purchase-section">
    <h3>{a('liveTitle')}</h3>
    <p className="anniv-live-warning">{a('liveWarning')}</p>
    <div className="anniv-character-grid anniv-solo-grid" role="group" aria-label={a('liveTitle')}>
      {ANNIVERSARY_CHARACTERS.map((character, index) => {
        const id = Number(character.image);
        return <React.Fragment key={id}><button type="button" aria-pressed={characterId === id}
          aria-expanded={characterId === id} aria-controls={characterId === id ? `${sliderId}-panel` : undefined}
          onClick={() => setCharacterId(characterId === id ? null : id)}>
          <img src={`${process.env.PUBLIC_URL || ''}/assets/characters/${character.image}.webp`} alt="" loading="lazy" />
          <span>{charName(character, language)}</span><b className="anniv-cost">{(plan.solo[id] || 0).toLocaleString(language)}</b>
        </button>
        {index === panelAfterIndex && panel}
        </React.Fragment>;
      })}
    </div>
    {plan.legacyLive > 0 && <div className="anniv-hint">{a('legacyLive', { count: plan.legacyLive.toLocaleString(language) })}<button type="button" onClick={() => update('legacyLive', 0)}>{a('clearLegacy')}</button></div>}
    <p className="anniv-hint">{a('livePeriod')}</p><p className="anniv-hint">{a('liveOverflow')}</p>
  </section>;
}

function MissionCard({ category, tier, completed, onTier, onCompleted }) {
  const { t, language } = useTranslation();
  const a = (key, values) => t(`anniversary.${key}`, values);
  const [detail, setDetail] = useState(null);
  const detailId = useId();
  const names = category === 'gacha' ? GACHA_TIERS : TIERS;
  const rewards = detail === null ? null : missionRewards(category, detail);
  const requirement = (index) => {
    if (category === 'live') return index === 6
      ? a('emerald', { count: [1, 5, 10][detail] })
      : a('liveRequirement', { unit: (LOCAL_UNITS[language] || UNITS)[index], count: [5, 15, 25][detail] });
    if (category !== 'gacha') return a(`${category}Requirement`, { count: REQUIREMENTS[category][detail][index].toLocaleString(language) });
    if (detail === 0) return a('pullRequirement', { count: [1, 5, 10, 20, 30, 40, 50][index] });
    return [
      a('pullRequirement', { count: detail === 1 ? 100 : 200 }),
      a('bloomRequirement', { count: detail === 1 ? 50 : 100 }),
      a('selectRequirement'), a('memorialRequirement'),
      a('costumeRequirement', { count: detail }), a('setRequirement', { count: detail }), a('passRequirement'),
    ][index];
  };
  const extraReward = () => {
    const count = detail + 1;
    const items = category === 'live'
      ? (LOCAL_UNITS[language] || UNITS).map((unit, index) => ({
        path: `thumbnail/material/material${127 + index}.webp`,
        label: a('unitPieces', { unit }), count: [50, 100, 300][detail],
      }))
      : category === 'gacha'
        ? [
          { path: 'thumbnail/gacha_ticket/gacha_ticket.webp', label: a('freeTicket'), count: count * 10 },
          { path: 'thumbnail/material/material57.webp', label: a('drop'), count },
          ...(detail > 0 ? [{ path: 'thumbnail/common_material/jewel.webp', label: a('crystalName'), count: detail * 1000 }] : []),
        ]
        : [
          { path: 'thumbnail/boost_item/boost_item2.webp', label: a('largeDrink'), count },
          { path: `thumbnail/material/material${category === 'mysekai' ? 168 : 57}.webp`, label: a(category === 'mysekai' ? 'memoria' : 'drop'), count },
        ];
    return <div className="anniv-extra-rewards">
      <p className="anniv-hint">{a('extraRewardTitle')}</p>
      <div className="anniv-extra-items">{items.map(item => <span className="anniv-extra-item" key={item.path}>
        <RewardImage path={item.path} alt="" />
        <span>{item.label} <b>×{item.count.toLocaleString(language)}</b></span>
      </span>)}</div>
    </div>;
  };
  return (
    <div className="anniv-mission">
      <div className="anniv-section-row"><h4>{a(category)}</h4><small>{missionCoins(category, tier, completed).toLocaleString(language)}</small></div>
      <div className="anniv-tier-options" role="group" aria-label={a(category)}>
        {names.map((name, index) => (
          <div key={name} className={`anniv-tier ${tier === index ? 'is-selected' : ''}`}>
            <button type="button" aria-pressed={tier === index} onClick={() => onTier(index)}>{a(name)}</button>
            <button type="button" className="anniv-info" aria-label={`${a(category)} · ${a(name)} · ${a('details')}`}
              aria-expanded={detail === index} aria-controls={detail === index ? detailId : undefined}
              onClick={() => setDetail(detail === index ? null : index)}>i</button>
          </div>
        ))}
      </div>
      {detail !== null && <div className="anniv-mission-detail" id={detailId}>
        <div className="anniv-section-row"><strong>{a(names[detail])}</strong><span>{a('full', { count: (rewards.steps.reduce((x, y) => x + y, 0) + rewards.bonus).toLocaleString(language) })}</span></div>
        <ul>{rewards.steps.map((coins, index) => <li key={index}>
          {detail === tier ? <label><input type="checkbox" checked={completed[index]} onChange={event => onCompleted(index, event.target.checked)} /><span>{requirement(index)}</span><b>+{coins}</b></label>
            : <div><span>{requirement(index)}</span><b>+{coins}</b></div>}
        </li>)}</ul>
        <p>{a('bonus')} <b>+{rewards.bonus}</b></p>
        {extraReward()}
        {category === 'event' && <p className="anniv-hint">{a('eventDeadline')}</p>}
      </div>}
    </div>
  );
}

export function AnniversaryShopModal({ onClose }) {
  const { t, language } = useTranslation();
  const a = (key, values) => t(`anniversary.${key}`, values);
  const format = value => value.toLocaleString(language);
  const dialogRef = useModalAccessibility({ isOpen: true, onClose });
  const [plan, setPlan] = useState(() => normalizeAnniversaryPlan(readJsonStorage(STORAGE_KEY, defaultAnniversaryPlan())));
  useEffect(() => { writeJsonStorage(STORAGE_KEY, plan); }, [plan]);
  const update = (key, value) => setPlan(previous => ({ ...previous, [key]: value }));
  const result = calculateAnniversary(plan);


  return createPortal(
    <div className="anniv-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="anniv-title" tabIndex={-1} className="anniv-modal">
        <header className="anniv-header">
          <div><h2 id="anniv-title">{a('title')}</h2><p>{a('period')}</p></div>
          <button type="button" className="anniv-close" onClick={onClose} aria-label={a('close')}>×</button>
        </header>
        <div className="anniv-body">
          <details className="anniv-income-group" open><summary>{a('income')} <b>{format(result.income)}</b></summary>
          <section className="anniv-section">
            <div className="anniv-mission-heading"><h3>{a('missions')}</h3><span>{a('missionDeadline')}</span></div><p className="anniv-hint">{a('missionHint')}</p>
            {CATEGORIES.map(category => <MissionCard key={category} category={category} tier={plan.tiers[category]} completed={plan.completed[category]}
              onTier={tier => setPlan(previous => ({ ...previous, tiers: { ...previous.tiers, [category]: tier }, completed: { ...previous.completed, [category]: tier === previous.tiers[category] ? previous.completed[category] : Array(7).fill(true) } }))}
              onCompleted={(index, checked) => setPlan(previous => ({ ...previous, completed: { ...previous.completed, [category]: previous.completed[category].map((value, i) => i === index ? checked : value) } }))} />)}
            <p className="anniv-special-explanation">{a('specialIntro')}</p>
            <RangeField label={a('special')} value={plan.special} max={28} valueText={a('itemCount', { count: plan.special })} coins={plan.special * 200} onChange={value => update('special', value)} />
            <details className="anniv-details"><summary>{a('special')} · {a('details')}</summary><p>{a('specialHint')}</p><ol>{SPECIAL_CHARACTERS.map((ids, index) => <li key={index}>
              <div className="anniv-special-characters">{ids.map(id => {
                const character = ANNIVERSARY_CHARACTERS.find(c => Number(c.image) === id);
                return <img key={id} src={`${process.env.PUBLIC_URL || ''}/assets/characters/${character.image}.webp`}
                  alt={charName(character, language)} title={charName(character, language)} loading="lazy" />;
              })}</div>
              <span>{a(`specialCard${index + 1}`)}</span>
            </li>)}</ol><p>{a('specialBonus')}</p></details>
          </section>
          <section className="anniv-section">
            <h3>{a('incomeTitle')}</h3><p className="anniv-hint">{a('incomeHint')}</p>
            <RangeField label={a('login')} value={plan.login / LOGIN_COINS_PER_DAY} max={7} valueText={a('days', { count: plan.login / LOGIN_COINS_PER_DAY })} coins={plan.login} onChange={value => update('login', value * LOGIN_COINS_PER_DAY)} />
            <RangeField label={a('eventCoins')} value={plan.eventCoins} max={7500} step={EVENT_COIN_STEP} valueText={a('coinStep', { count: EVENT_COIN_STEP })} coins={plan.eventCoins} onChange={value => update('eventCoins', value)} />
            {['select', 'memorial'].map(key => <label className="anniv-check" key={key}><input type="checkbox" checked={plan[key]} onChange={event => update(key, event.target.checked)} />{a(key)}</label>)}
            <RangeField label={a('costume')} value={plan.costume} max={6} valueText={a('times', { count: plan.costume })} coins={plan.costume * 2500} onChange={value => update('costume', value)} help={a('costumeHint')} />
          </section>
          </details>
          <section className="anniv-section anniv-purchase-section">
            <div className="anniv-section-row"><h3>{a('shopTitle')}</h3><b>{format(result.shop)}</b></div>
            <p className="anniv-hint">{a('shopHint')}</p>
            {SHOP_ITEMS.map(item => CHARACTER_ITEMS.includes(item.id) ? <CharacterPurchase key={item.id} item={item} selected={plan.characters[item.id]} count={plan.characters[item.id]?.length ?? plan.purchases[item.id]} onChange={selected => update('characters', { ...plan.characters, [item.id]: selected })} /> : item.id === 'crystals' ?
              <RangeField key={item.id} label={<span className="anniv-item-label"><RewardImage path="thumbnail/common_material/jewel.webp" alt={a(item.id)} /><span aria-hidden="true">×100</span></span>} value={plan.purchases[item.id]} max={item.max}
                valueText={a('itemCount', { count: plan.purchases[item.id] })} coins={plan.purchases[item.id] * item.cost}
                onChange={value => update('purchases', { ...plan.purchases, [item.id]: value })} /> :
              <label key={item.id} className="anniv-check anniv-furniture-check">
                <input type="checkbox" checked={plan.purchases[item.id] === 1}
                  onChange={event => update('purchases', { ...plan.purchases, [item.id]: event.target.checked ? 1 : 0 })} />
                <span>{a(item.id)}</span><b className="anniv-cost">{format(plan.purchases[item.id] * item.cost)}</b>
              </label>)}
            <div className="anniv-actions">
              <button type="button" onClick={() => setPlan(previous => ({ ...previous, purchases: Object.fromEntries(SHOP_ITEMS.map(item => [item.id, item.max])), characters: Object.fromEntries(CHARACTER_ITEMS.map(id => [id, ANNIVERSARY_CHARACTERS.map(c => Number(c.image))])) }))}>{a('allShop')}</button>
              <button type="button" onClick={() => setPlan(previous => ({ ...previous, purchases: Object.fromEntries(SHOP_ITEMS.map(item => [item.id, 0])), characters: Object.fromEntries(CHARACTER_ITEMS.map(id => [id, []])) }))}>{a('clearShop')}</button>
            </div>
          </section>
          <SoloLive plan={plan} update={update} />
          <details className="anniv-details anniv-notes"><summary>{a('notes')}</summary>
            <p>{a('missionPeriod')}</p><p>{a('incomeDates')}</p><p>{a('loginEntryDeadline')}</p><p>{a('missionRules')}</p><p>{a('notesText')}</p><p>{a('convert')}</p>
          </details>
        </div>
        <footer className="anniv-summary" aria-label={a('summary')} aria-live="polite" aria-atomic="true">
          <div><span>{a('income')}</span><strong>{format(result.income)}</strong></div>
          <div><span>{a('expense')}</span><strong>{format(result.shop + result.live)}</strong></div>
          <div className={result.balance < 0 ? 'anniv-shortage' : 'anniv-balance'}><span>{a(result.balance < 0 ? 'shortage' : 'balance')}</span><strong>{format(Math.abs(result.balance))}</strong></div>
          <small>{a('coin')}</small>
        </footer>
      </section>
    </div>, document.body,
  );
}

export default function AnniversaryShop() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(anniversaryVisible);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let timer;
    const refresh = () => {
      window.clearTimeout(timer);
      const remaining = ANNIVERSARY_END - Date.now();
      setVisible(remaining > 0);
      if (remaining > 0) timer = window.setTimeout(refresh, Math.min(remaining, 86400000));
    };
    refresh();
    window.addEventListener('focus', refresh);
    return () => { window.clearTimeout(timer); window.removeEventListener('focus', refresh); };
  }, []);
  if (!visible) return null;
  return <>
    <button type="button" className="anniv-launcher" aria-label={t('anniversary.title')} onClick={() => setOpen(true)}>{t('anniversary.button')}</button>
    {open && <AnniversaryShopModal onClose={() => setOpen(false)} />}
  </>;
}
