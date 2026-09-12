import React from 'react';
import { InputTableWrapper, InputRow, SelectRow } from './common/InputComponents';
import { useTranslation } from '../contexts/LanguageContext';
import { calculatePlayerLevel, getPlayerLevelExp, MAX_PLAYER_LEVEL, PLAYER_RANK_EXP } from '../utils/playerLevelCalculator';

export default function PlayerLevelTab({ surveyData, setSurveyData }) {
    const { t } = useTranslation();
    const values = { current: '1', target: '100', remaining: '', rank: 'S', energy: '5', ...surveyData.playerLevelCalculator };
    const update = (key, value) => setSurveyData(previous => ({
        ...previous,
        playerLevelCalculator: {
            ...previous.playerLevelCalculator,
            [key]: value,
            ...(key === 'current' ? { remaining: '' } : {}),
        },
    }));
    const result = calculatePlayerLevel(values);
    const label = key => t(`player_level.${key}`);
    return <section className="p-4 space-y-4" aria-label={label('title')}>
        <InputTableWrapper>
            <InputRow label={label('current')} value={values.current} min="1" max={MAX_PLAYER_LEVEL} onChange={event => update('current', event.target.value)} />
            <InputRow label={label('remaining')} value={values.remaining} min="0" max={getPlayerLevelExp(Number(values.current)) ?? 0} placeholder={String(getPlayerLevelExp(Number(values.current)) ?? 0)} onChange={event => update('remaining', event.target.value)} />
            <InputRow label={label('target')} value={values.target} min={values.current} max={MAX_PLAYER_LEVEL} onChange={event => update('target', event.target.value)} />
            <SelectRow label={label('rank')} value={values.rank} options={Object.keys(PLAYER_RANK_EXP).map(rank => ({ value: rank, label: rank }))} onChange={event => update('rank', event.target.value)} />
            <SelectRow label={label('energy')} value={values.energy} options={Array.from({ length: 11 }, (_, energy) => ({ value: String(energy), label: String(energy) }))} onChange={event => update('energy', event.target.value)} />
        </InputTableWrapper>
        <p className="text-xs text-gray-500 text-center">{label('hint')}</p>
        {result ? <div className="max-w-lg mx-auto rounded-xl border border-indigo-100 bg-indigo-50 p-4" aria-live="polite">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-700">
                {['required', 'perLive', 'runs', 'spent'].map((key, index) => <React.Fragment key={key}>
                    <dt>{label(['required', 'per_live', 'runs', 'spent'][index])}</dt>
                    <dd className="text-right font-bold text-indigo-700 tabular-nums">{result[key].toLocaleString()}</dd>
                </React.Fragment>)}
            </dl>
        </div> : <p role="alert" className="text-center text-sm text-red-500">{label('error')}</p>}
        <p className="max-w-lg mx-auto text-xs text-gray-500">{label('note')}</p>
    </section>;
}
