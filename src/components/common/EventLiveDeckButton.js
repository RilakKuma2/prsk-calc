import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import useModalAccessibility from '../../hooks/useModalAccessibility';
import { useTranslation } from '../../contexts/LanguageContext';
import CustomSelectDropdown from './CustomSelectDropdown';
import SkillPushControl from './SkillPushControl';
import { EVENT_LIVE_SOURCES, getEventLiveSource, getEventLiveEnergy, updateEventLiveDeck } from '../../utils/eventLiveEstimate';
import { EVENT_POINT_MULTIPLIERS } from '../../utils/autoEnergy';
import { calculateInternalValueFromDeck } from '../../utils/deckUtils';
import './EventLiveDeckButton.css';

export default function EventLiveDeckButton({ surveyData, setSurveyData, bonus, estimate, isWorldLink, className = '' }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useModalAccessibility({ isOpen: open, onClose: () => setOpen(false) });
  const source = getEventLiveSource(surveyData);
  const activeDeckNum = surveyData.activeDeckNum || 1;
  const ownEffectiveValue = calculateInternalValueFromDeck(surveyData.unifiedDecks?.[`deck${activeDeckNum}`] || {});
  return <>
    <button type="button" className={`event-live-deck-button ${className}`.trim()} aria-label="덱·곡 설정" title="덱·곡 설정" onClick={() => setOpen(true)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 7h6m4 0h6M4 17h10m4 0h2" />
        <circle cx="12" cy="7" r="2" /><circle cx="16" cy="17" r="2" />
      </svg>
    </button>
    {open && createPortal(<div className="event-live-deck-overlay" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section ref={ref} role="dialog" aria-modal="true" aria-label="판당 이벤트 포인트 설정" tabIndex={-1} className="event-live-deck-dialog">
        <button className="event-live-deck-close" type="button" aria-label="설정 닫기" onClick={() => setOpen(false)}>×</button>
        <div className="event-live-deck-body">
          <div className="event-live-deck-fields">
            <label key="power">종합력<div><input type="number" min="0" step="any" aria-label="종합력" value={surveyData.power ?? ''} placeholder="25.5" onFocus={e => e.target.select()} onChange={e => setSurveyData(prev => updateEventLiveDeck(prev, 'power', e.target.value))} /><span>만</span></div></label>
            <label key="effi">이벤트 배수<div><input type="number" min="0" step="any" aria-label="이벤트 배수" value={surveyData.effi ?? ''} placeholder="250" onFocus={e => e.target.select()} onChange={e => setSurveyData(prev => updateEventLiveDeck(prev, 'effi', e.target.value))} /><span>%</span></div></label>
            {isWorldLink && (
              <label key="shopEffi">
                {t('fire.shop_bonus_rate', { defaultValue: '상점 배수' })}
                <div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    aria-label={t('fire.shop_bonus_rate', { defaultValue: '상점 배수' })}
                    value={surveyData.shopEffi ?? ''}
                    placeholder={surveyData.effi || '200'}
                    onFocus={e => e.target.select()}
                    onChange={e => setSurveyData(prev => ({ ...prev, shopEffi: e.target.value }))}
                  />
                  <span>%</span>
                </div>
              </label>
            )}
            <label key="internalValue">방 실효치<div><input type="number" min="0" step="any" aria-label="방 실효치" value={surveyData.internalValue ?? ''} placeholder="200" onFocus={e => e.target.select()} onChange={e => setSurveyData(prev => updateEventLiveDeck(prev, 'internalValue', e.target.value))} /><span>%</span></div></label>
          </div>
          <small className="event-live-deck-own-value">덱{activeDeckNum} · 내 실효치 {ownEffectiveValue.toLocaleString()}%</small>
          {surveyData.isDetailedInput && <small>방 실효치는 이벤덱의 상세 입력을 사용 중입니다. 위 값을 수정하면 단일 실효치로 전환됩니다.</small>}
          <div className="event-live-deck-song"><CustomSelectDropdown
            value={String(bonus)} ariaLabel="보너스 불" className="event-live-deck-energy"
            options={Object.entries(EVENT_POINT_MULTIPLIERS).map(([energy, multiplier]) => ({ value: String(multiplier), label: `${energy}불` }))}
            onChange={value => setSurveyData(prev => ({ ...prev, firea: value, fires2: 'none' }))}
          /><CustomSelectDropdown value={source.value} options={EVENT_LIVE_SOURCES} ariaLabel="곡·플레이 방식" className="event-live-deck-source" onChange={value => setSurveyData(prev => { const selected = EVENT_LIVE_SOURCES.find(row => row.value === value); return { ...prev, eventLiveSong: value, ...(selected?.rounds ? { rounds1: String(selected.rounds) } : {}) }; })} /></div>
          {!source.auto && !source.mySekai && <div className="flex justify-center my-3">
            <SkillPushControl checked={surveyData.skillPush === true} onChange={value => setSurveyData(prev => ({ ...prev, skillPush: value }))} />
          </div>}
          <div className="event-live-deck-result">
            <span>{source.label} · {getEventLiveEnergy(bonus)}불</span>
            {estimate.loading ? (
              <strong>계산 중…</strong>
            ) : estimate.points === null ? (
              <strong>계산 불가</strong>
            ) : isWorldLink ? (
              <div className="event-live-deck-scores">
                <span className="event-live-deck-ep">{estimate.points.toLocaleString()}EP</span>
                <span className="event-live-deck-sep">/</span>
                <span className="event-live-deck-sp">
                  {estimate.shopPoints !== null && estimate.shopPoints !== undefined
                    ? `${estimate.shopPoints.toLocaleString()}P`
                    : `${Math.floor(estimate.points / 10).toLocaleString()}P`}
                </span>
              </div>
            ) : (
              <strong>{`${estimate.points.toLocaleString()} EP / 판`}</strong>
            )}
          </div>
          {estimate.error && <div role="alert">{estimate.error}</div>}
        </div>
      </section>
    </div>, document.body)}
  </>;
}
