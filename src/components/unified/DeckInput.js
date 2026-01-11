import React from 'react';
import { useTranslation } from '../../contexts/LanguageContext';

// InputTableWrapper component
const InputTableWrapper = ({ children }) => (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
        {children}
    </div>
);

// InputRow component
const InputRow = ({ label, value, onChange, suffix, placeholder, spacer, max }) => (
    <div className={`flex items-center justify-between w-full ${spacer ? 'mb-2' : ''}`}>
        <label className="text-sm font-bold text-gray-700 mr-4">{label}</label>
        <div className="flex items-center">
            <input
                type="number"
                className="w-20 text-center border rounded p-1 text-sm"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                max={max}
                onFocus={(e) => e.target.select()}
            />
            {suffix && <span className="text-xs text-gray-500 ml-1 font-bold">{suffix}</span>}
        </div>
    </div>
);

// SectionHeaderRow component
const SectionHeaderRow = ({ label, spacer }) => (
    <div className={`w-full ${spacer ? 'mb-2 mt-2' : ''}`}>
        <div className="text-xs font-bold text-gray-500 text-center border-b border-gray-200 pb-1">
            {label}
        </div>
    </div>
);

/**
 * DeckInput - Reusable deck input component
 * @param {Object} deck - Current deck values
 * @param {Function} updateDeck - Function to update deck values
 * @param {Number} activeDeckNum - Currently active deck number (1, 2, 3)
 * @param {Function} setActiveDeckNum - Function to set active deck number
 * @param {Boolean} showDeckSelector - Whether to show deck selector buttons
 */
function DeckInput({ deck, updateDeck, activeDeckNum, setActiveDeckNum, showDeckSelector = true }) {
    const { t } = useTranslation();

    const {
        totalPower = '',
        skillLeader = '',
        skillMember2 = '',
        skillMember3 = '',
        skillMember4 = '',
        skillMember5 = '',
        eventBonus = ''
    } = deck || {};

    return (
        <div className="deck-input">
            {/* Deck Selector */}
            {showDeckSelector && (
                <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3].map(num => (
                        <button
                            key={num}
                            onClick={() => setActiveDeckNum(num)}
                            className={`px-4 py-2 text-sm font-bold rounded-lg border transition-colors ${activeDeckNum === num
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {t('deck.deck_label') || '덱'} {num}
                        </button>
                    ))}
                </div>
            )}

            <InputTableWrapper>
                <InputRow
                    label={t('auto.total_power')}
                    value={totalPower}
                    onChange={(e) => {
                        const val = e.target.value;
                        updateDeck('totalPower', val === '' ? '' : Number(val));
                    }}
                    placeholder="293231"
                    spacer={true}
                />
                <SectionHeaderRow label={t('auto.member_skills')} spacer={true} />
                <InputRow
                    label={t('auto.leader')}
                    value={skillLeader}
                    onChange={(e) => {
                        const val = e.target.value;
                        updateDeck('skillLeader', val === '' ? '' : Number(val));
                    }}
                    suffix="%"
                    placeholder="120"
                    spacer={true}
                />
                {[
                    { label: t('auto.member_2'), val: skillMember2, key: 'skillMember2' },
                    { label: t('auto.member_3'), val: skillMember3, key: 'skillMember3' },
                    { label: t('auto.member_4'), val: skillMember4, key: 'skillMember4' },
                    { label: t('auto.member_5'), val: skillMember5, key: 'skillMember5' },
                ].map((m, i) => (
                    <InputRow
                        key={i}
                        label={m.label}
                        value={m.val}
                        onChange={(e) => {
                            const val = e.target.value;
                            updateDeck(m.key, val === '' ? '' : Number(val));
                        }}
                        suffix="%"
                        placeholder="100"
                        spacer={true}
                    />
                ))}
                <InputRow
                    label={t('auto.event_bonus')}
                    value={eventBonus}
                    onChange={(e) => {
                        const val = e.target.value;
                        updateDeck('eventBonus', val === '' ? '' : Number(val));
                    }}
                    suffix="%"
                    placeholder="250"
                    spacer={true}
                />
            </InputTableWrapper>
        </div>
    );
}

export default DeckInput;
export { InputTableWrapper, InputRow, SectionHeaderRow };
