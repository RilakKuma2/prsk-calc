import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { InputTableWrapper, InputRow, SectionHeaderRow } from './common/InputComponents';

// Import result components (we'll create these from existing tabs)
import AutoTab from './AutoTab';
import InternalTab from './InternalTab';
import PowerTab from './PowerTab';

function DeckTab({ surveyData, setSurveyData }) {
    const { t } = useTranslation();

    // Active deck selector (1, 2, 3)
    const [activeDeckNum, setActiveDeckNum] = useState(1);

    // Result view selector
    const [activeResultView, setActiveResultView] = useState('auto'); // 'auto', 'internal', 'power'

    // Initialize unified decks if not exists
    useEffect(() => {
        if (!surveyData.unifiedDecks) {
            setSurveyData(prev => ({
                ...prev,
                unifiedDecks: {
                    deck1: {
                        totalPower: prev.autoDeck?.totalPower || '',
                        skillLeader: prev.autoDeck?.skillLeader || '',
                        skillMember2: prev.autoDeck?.skillMember2 || '',
                        skillMember3: prev.autoDeck?.skillMember3 || '',
                        skillMember4: prev.autoDeck?.skillMember4 || '',
                        skillMember5: prev.autoDeck?.skillMember5 || '',
                        eventBonus: prev.autoDeck?.eventBonus || ''
                    },
                    deck2: { totalPower: '', skillLeader: '', skillMember2: '', skillMember3: '', skillMember4: '', skillMember5: '', eventBonus: '' },
                    deck3: { totalPower: '', skillLeader: '', skillMember2: '', skillMember3: '', skillMember4: '', skillMember5: '', eventBonus: '' },
                    activeDeck: 1
                }
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Get current deck values
    const currentDeck = surveyData.unifiedDecks?.[`deck${activeDeckNum}`] || {};
    const { totalPower, skillLeader, skillMember2, skillMember3, skillMember4, skillMember5, eventBonus } = currentDeck;

    // Update current deck
    const updateDeck = (key, value) => {
        setSurveyData(prev => {
            const newUnifiedDecks = {
                ...prev.unifiedDecks,
                [`deck${activeDeckNum}`]: {
                    ...prev.unifiedDecks?.[`deck${activeDeckNum}`],
                    [key]: value
                }
            };
            // Also sync to autoDeck for compatibility
            return {
                ...prev,
                unifiedDecks: newUnifiedDecks,
                autoDeck: newUnifiedDecks[`deck${activeDeckNum}`]
            };
        });
    };

    // Sync autoDeck when switching decks
    useEffect(() => {
        if (surveyData.unifiedDecks?.[`deck${activeDeckNum}`]) {
            setSurveyData(prev => ({
                ...prev,
                autoDeck: { ...prev.unifiedDecks[`deck${activeDeckNum}`] }
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeDeckNum]);

    // Calculate internal value from skills (floored to 10)
    const calculateInternalValue = () => {
        const leader = Number(skillLeader || 120);
        const m2 = Number(skillMember2 || 100);
        const m3 = Number(skillMember3 || 100);
        const m4 = Number(skillMember4 || 100);
        const m5 = Number(skillMember5 || 100);
        const rawValue = leader + (m2 + m3 + m4 + m5) * 0.2;
        return Math.floor(rawValue / 10) * 10;
    };

    // Wrapped setSurveyData that also updates power/effi/internalValue for PowerTab compatibility
    const wrappedSetSurveyData = (updater) => {
        setSurveyData(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;

            // Get current deck values
            const deck = next.unifiedDecks?.[`deck${activeDeckNum}`] || currentDeck;
            const leader = Number(deck.skillLeader || 120);
            const m2 = Number(deck.skillMember2 || 100);
            const m3 = Number(deck.skillMember3 || 100);
            const m4 = Number(deck.skillMember4 || 100);
            const m5 = Number(deck.skillMember5 || 100);
            const internalVal = Math.floor((leader + (m2 + m3 + m4 + m5) * 0.2) / 10) * 10;

            return {
                ...next,
                // For PowerTab compatibility
                power: String((Number(deck.totalPower || 293231)) / 10000),
                effi: String(deck.eventBonus || 250),
                internalValue: String(internalVal),
                // Sync autoDeck
                autoDeck: deck
            };
        });
    };

    return (
        <div id="deck-tab-content">
            {/* Deck Selector */}
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

            {/* Shared Input Section */}
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

            {/* Result View Selector */}
            <div className="flex justify-center gap-2 my-6">
                {[
                    { key: 'auto', label: t('deck.auto') || '오토' },
                    { key: 'internal', label: t('deck.internal') || '내부치' },
                    { key: 'power', label: t('deck.power') || '이벤포' }
                ].map(view => (
                    <button
                        key={view.key}
                        onClick={() => setActiveResultView(view.key)}
                        className={`px-4 py-2 text-sm font-bold rounded-lg border transition-colors ${activeResultView === view.key
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {view.label}
                    </button>
                ))}
            </div>

            {/* Render Selected Result (hiding input sections of child tabs) */}
            <div className="deck-results-container">
                {activeResultView === 'auto' && (
                    <AutoTab
                        surveyData={surveyData}
                        setSurveyData={wrappedSetSurveyData}
                        hideInputs={true}
                    />
                )}
                {activeResultView === 'internal' && (
                    <InternalTab
                        surveyData={surveyData}
                        setSurveyData={wrappedSetSurveyData}
                        hideInputs={true}
                    />
                )}
                {activeResultView === 'power' && (
                    <PowerTab
                        surveyData={surveyData}
                        setSurveyData={wrappedSetSurveyData}
                        hideInputs={true}
                    />
                )}
            </div>
        </div>
    );
}

export default DeckTab;
