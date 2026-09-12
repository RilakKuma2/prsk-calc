import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import useModalAccessibility from '../../hooks/useModalAccessibility';
import CustomSelectDropdown from './CustomSelectDropdown';
import { EVENT_LIVE_SOURCES, getEventLiveSource, getEventLiveEnergy, updateEventLiveDeck } from '../../utils/eventLiveEstimate';
import { EVENT_POINT_MULTIPLIERS } from '../../utils/autoEnergy';
import { calculateInternalValueFromDeck } from '../../utils/deckUtils';
import './EventLiveDeckButton.css';

export default function EventLiveDeckButton({ surveyData, setSurveyData, bonus, estimate }) {
  const [open, setOpen] = useState(false);
  const ref = useModalAccessibility({ isOpen: open, onClose: () => setOpen(false) });
  const source = getEventLiveSource(surveyData);
  const activeDeckNum = surveyData.activeDeckNum || 1;
  const ownEffectiveValue = calculateInternalValueFromDeck(surveyData.unifiedDecks?.[`deck${activeDeckNum}`] || {});
  return <>
    <button type="button" className="event-live-deck-button" aria-label="덱·곡 설정" title="덱·곡 설정" onClick={() => setOpen(true)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 7h6m4 0h6M4 17h10m4 0h2" />
        <circle cx="12" cy="7" r="2" /><circle cx="16" cy="17" r="2" />
      </svg>
    </button>
    {open && createPortal(<div className="event-live-deck-overlay" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section ref={ref} role="dialog" aria-modal="true" aria-label="판당 이벤트 포인트 설정" tabIndex={-1} className="event-live-deck-dialog">
        <button className="event-live-deck-close" type="button" aria-label="설정 닫기" onClick={() => setOpen(false)}>×</button>
        <div className="event-live-deck-body">
          <div className="event-live-deck-fields">{[['power', '종합력', '만', '25.5'], ['effi', '이벤트 배수', '%', '250'], ['internalValue', '방 실효치', '%', '200']].map(([key, label, unit, fallback]) => <label key={key}>{label}<div><input type="number" min="0" step="any" aria-label={label} value={surveyData[key] ?? ''} placeholder={fallback} onFocus={e => e.target.select()} onChange={e => setSurveyData(prev => updateEventLiveDeck(prev, key, e.target.value))} /><span>{unit}</span></div></label>)}</div>
          <small className="event-live-deck-own-value">덱{activeDeckNum} · 내 실효치 {ownEffectiveValue.toLocaleString()}%</small>
          {surveyData.isDetailedInput && <small>방 실효치는 이벤덱의 상세 입력을 사용 중입니다. 위 값을 수정하면 단일 실효치로 전환됩니다.</small>}
          <div className="event-live-deck-song"><CustomSelectDropdown
            value={String(bonus)} ariaLabel="보너스 불" className="event-live-deck-energy"
            options={Object.entries(EVENT_POINT_MULTIPLIERS).map(([energy, multiplier]) => ({ value: String(multiplier), label: `${energy}불` }))}
            onChange={value => setSurveyData(prev => ({ ...prev, firea: value, fires2: 'none' }))}
          /><CustomSelectDropdown value={source.value} options={EVENT_LIVE_SOURCES} ariaLabel="곡·플레이 방식" className="event-live-deck-source" onChange={value => setSurveyData(prev => { const selected = EVENT_LIVE_SOURCES.find(row => row.value === value); return { ...prev, eventLiveSong: value, ...(selected?.rounds ? { rounds1: String(selected.rounds) } : {}) }; })} /></div>
          <div className="event-live-deck-result"><span>{source.label} · {getEventLiveEnergy(bonus)}불</span><strong>{estimate.loading ? '계산 중…' : estimate.points === null ? '계산 불가' : `${estimate.points.toLocaleString()} EP / 판`}</strong></div>
          {estimate.error && <div role="alert">{estimate.error}</div>}
        </div>
      </section>
    </div>, document.body)}
  </>;
}
