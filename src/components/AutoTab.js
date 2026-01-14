import React, { useState, useEffect, useMemo } from 'react';
import { InputTableWrapper, InputRow, SectionHeaderRow } from './common/InputComponents';
import { calculateScoreRange } from '../utils/calculator';
import { getSongOptionsSync, getMusicMetasSync } from '../utils/dataLoader';
import { EventCalculator, LiveType, EventType } from 'sekai-calculator';
import { useTranslation } from '../contexts/LanguageContext';
import { mySekaiTableData, powerColumnThresholds, scoreRowKeys } from '../data/mySekaiTableData';

const ENERGY_MULTIPLIERS = {
    0: 1,
    1: 5,
    2: 10,
    3: 15,
    4: 19,
    5: 23,
    6: 26,
    7: 29,
    8: 31,
    9: 33,
    10: 35
};

// Fixed configuration for batch calculation with levels
const TARGET_SONGS = [
    { id: 11, difficulty: 'master', level: 24 },   // 비바
    { id: 104, difficulty: 'master', level: 25 },  // 샹드
    { id: 74, difficulty: 'master', level: 22 },   // 엔비
    { id: 448, difficulty: 'master', level: 29 },  // 사게 (Sage)
    { id: 488, difficulty: 'append', level: 31 },  // 메모리아
    { id: 48, difficulty: 'master', level: 24 },   // 월이마
    { id: 186, difficulty: 'master', level: 28 },  // 개벽 (Creation Myth)
];

const calculateRank = (score, level) => {
    const sRank = 1040000 + 5200 * (level - 5);
    const aRank = 840000 + 4200 * (level - 5);
    const bRank = 400000 + 2000 * (level - 5);
    const cRank = 20000 + 100 * (level - 5);

    if (score >= sRank) return 'S';
    if (score >= aRank) return 'A';
    if (score >= bRank) return 'B';
    if (score >= cRank) return 'C';
    return 'D';
};

const getNextRankCutoff = (score, level) => {
    const sRank = 1040000 + 5200 * (level - 5);
    const aRank = 840000 + 4200 * (level - 5);
    const bRank = 400000 + 2000 * (level - 5);
    const cRank = 20000 + 100 * (level - 5);

    if (score < cRank) return cRank;
    if (score < bRank) return bRank;
    if (score < aRank) return aRank;
    if (score < sRank) return sRank;
    return null;
};

function AutoTab({ surveyData, setSurveyData, hideInputs = false }) {
    const { t, language } = useTranslation();
    // Initialize or read from surveyData
    const deck = surveyData.autoDeck || {
        totalPower: '',
        skillLeader: '',
        skillMember2: '',
        skillMember3: '',
        skillMember4: '',
        skillMember5: ''
    };

    const updateDeck = (key, value) => {
        setSurveyData(prev => ({
            ...prev,
            autoDeck: {
                ...prev.autoDeck,
                [key]: value
            }
        }));
    };

    const { totalPower, skillLeader, skillMember2, skillMember3, skillMember4, skillMember5, eventBonus = '' } = deck;
    const energyUsed = 1; // Fixed to 1 as per request

    const [batchResults, setBatchResults] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'eventPoint', direction: 'desc' });

    // Auto-calculate batch results whenever inputs change
    useEffect(() => {
        const results = [];

        TARGET_SONGS.forEach(target => {
            const song = getSongOptionsSync().find(s => s.id === target.id);
            if (!song) return;

            const input = {
                songId: target.id,
                difficulty: target.difficulty,
                totalPower: Number(totalPower || '293231'),
                skillLeader: Number(skillLeader || '120'),
                skillMember2: Number(skillMember2 || '100'),
                skillMember3: Number(skillMember3 || '100'),
                skillMember4: Number(skillMember4 || '100'),
                skillMember5: Number(skillMember5 || '100'),
            };

            try {
                const res = calculateScoreRange(input);
                if (res) {
                    const minRank = calculateRank(res.min, target.level);

                    // Event Point Calculation
                    const musicMeta = getMusicMetasSync().find(m => m.music_id === target.id && m.difficulty === target.difficulty);
                    const eventRate = musicMeta ? musicMeta.event_rate : 100;
                    const boostRate = ENERGY_MULTIPLIERS[energyUsed] || 1;

                    const minEventPoint = EventCalculator.getEventPoint(
                        LiveType.AUTO,
                        EventType.MARATHON,
                        res.min,
                        eventRate,
                        Number(eventBonus || '250'),
                        boostRate
                    );

                    const maxEventPoint = EventCalculator.getEventPoint(
                        LiveType.AUTO,
                        EventType.MARATHON,
                        res.max,
                        eventRate,
                        Number(eventBonus || '250'),
                        boostRate
                    );

                    results.push({
                        ...res,
                        songName: (language === 'ja' || language === 'en') ? song.title_jp : song.name,
                        songId: song.id,
                        difficulty: target.difficulty,
                        level: target.level,
                        minRank,
                        minEventPoint,
                        maxEventPoint
                    });
                }
            } catch (e) {
                console.error(`Failed to calculate for ${song.name}`, e);
            }
        });

        setBatchResults(results);
    }, [totalPower, skillLeader, skillMember2, skillMember3, skillMember4, skillMember5, eventBonus, language]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedBatchResults = useMemo(() => {
        if (!batchResults) return null;

        return [...batchResults].sort((a, b) => {
            let aValue = 0;
            let bValue = 0;

            if (sortConfig.key === 'songName') {
                aValue = a.songName;
                bValue = b.songName;
            } else if (sortConfig.key === 'min') {
                aValue = a.min;
                bValue = b.min;
            } else if (sortConfig.key === 'max') {
                aValue = a.max;
                bValue = b.max;
            } else if (sortConfig.key === 'rank') {
                // Sort ranks: S > A > B > C > D
                const rankOrder = { 'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
                aValue = rankOrder[a.minRank] || 0;
                bValue = rankOrder[b.minRank] || 0;
            } else if (sortConfig.key === 'eventPoint') {
                aValue = a.minEventPoint;
                bValue = b.minEventPoint;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [batchResults, sortConfig]);

    return (
        <div id="auto-tab-content">
            {!hideInputs && (
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
            )}

            {/* Batch Calculation Results */}
            {sortedBatchResults && (
                <div className="w-full mt-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`bg-white text-gray-600 uppercase tracking-wider border-b border-gray-200 ${language === 'ja' ? 'text-[9px] md:text-[11px]' : 'text-[10px] md:text-xs'}`}>
                                    <th className="px-1 py-2 md:p-4 font-bold cursor-pointer hover:text-gray-900 transition-colors text-center select-none group" onClick={() => handleSort('songName')}>
                                        <div className="flex items-center justify-center gap-1 md:gap-2">
                                            {t('auto.song_name')}
                                            <span className={`transition-opacity duration-200 ${sortConfig.key === 'songName' ? 'opacity-100 text-pink-500' : 'opacity-0 group-hover:opacity-50'}`}>
                                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </th>
                                    <th className="px-1 py-2 md:p-4 font-bold text-center min-w-[50px] md:min-w-[80px]">
                                        <div className="flex items-center justify-center whitespace-pre-line leading-tight">
                                            {t('auto.min_rank')}
                                        </div>
                                    </th>
                                    <th className="px-1 py-2 md:p-4 font-bold cursor-pointer hover:text-gray-900 transition-colors text-center select-none group" onClick={() => handleSort('min')}>
                                        <div className="flex items-center justify-center gap-1 md:gap-2">
                                            {t('auto.min_score')}
                                            <span className={`transition-opacity duration-200 ${sortConfig.key === 'min' ? 'opacity-100 text-blue-500' : 'opacity-0 group-hover:opacity-50'}`}>
                                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </th>
                                    <th className="px-1 py-2 md:p-4 font-bold cursor-pointer hover:text-gray-900 transition-colors text-center select-none group" onClick={() => handleSort('max')}>
                                        <div className="flex items-center justify-center gap-1 md:gap-2">
                                            {t('auto.max_score')}
                                            <span className={`transition-opacity duration-200 ${sortConfig.key === 'max' ? 'opacity-100 text-pink-500' : 'opacity-0 group-hover:opacity-50'}`}>
                                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sortedBatchResults.map((res, idx) => (
                                    <tr key={`${res.songId}-${res.difficulty}-${idx}`} className="hover:bg-gray-50 transition-colors duration-200 group/row">
                                        <td className="px-1 py-2 md:py-1.5 md:px-4 font-bold text-gray-800 group-hover/row:text-pink-600 transition-colors text-xs md:text-base text-center">
                                            <div className="relative flex flex-col items-center justify-center">
                                                <div className="flex items-center justify-center gap-1 md:gap-2">
                                                    {res.songName}
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${res.difficulty === 'master' || res.difficulty === 'append' ? '' : 'bg-gray-100 text-gray-600 border border-gray-200 shadow-sm'
                                                            }`}
                                                        style={
                                                            res.difficulty === 'master' ? {
                                                                backgroundColor: '#cc33ff',
                                                                color: '#FFFFFF',
                                                            } : res.difficulty === 'append' ? {
                                                                background: 'linear-gradient(to bottom right, #ad92fd, #fe7bde)',
                                                                color: '#FFFFFF',
                                                            } : res.difficulty === 'hard' ? {
                                                                border: '2px solid #ffcc00', // Adjusted border width for balance
                                                                backgroundColor: '#ffcc00',
                                                                color: '#FFFFFF',
                                                            } : res.difficulty === 'normal' ? {
                                                                border: '2px solid #33ccff',
                                                                backgroundColor: '#33ccff',
                                                                color: '#FFFFFF',
                                                            } : res.difficulty === 'easy' ? {
                                                                border: '2px solid #13d675',
                                                                backgroundColor: '#13d675',
                                                                color: '#FFFFFF',
                                                            } : {}
                                                        }
                                                    >
                                                        {res.difficulty === 'master' ? 'MAS' : res.difficulty === 'append' ? 'APD' : res.difficulty}
                                                    </span>
                                                </div>
                                                {res.songId === 488 && (
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 md:-mt-1.5 w-max">
                                                        <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap">
                                                            {t('auto.recommend_0034')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-1 py-2 md:py-1.5 md:px-4 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                {(() => {
                                                    const nextCutoff = getNextRankCutoff(res.min, res.level);
                                                    return (
                                                        <>
                                                            {nextCutoff && (
                                                                <span className="text-[10px] md:text-xs text-gray-400 font-medium mb-0.5">
                                                                    {nextCutoff.toLocaleString()}
                                                                </span>
                                                            )}
                                                            <span className={`text-sm md:text-lg font-bold ${res.minRank === 'S' ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500' :
                                                                res.minRank === 'A' ? 'text-pink-500' :
                                                                    res.minRank === 'B' ? 'text-blue-500' :
                                                                        'text-gray-500'
                                                                }`}>
                                                                {res.minRank}
                                                            </span>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-1 py-2 md:py-1.5 md:px-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-blue-600 text-base md:text-lg font-bold tracking-tight group-hover/row:text-blue-600 transition-colors">
                                                    {res.min.toLocaleString()}
                                                </span>
                                                <span className="text-green-600 text-sm md:text-base font-bold tracking-tight mt-0.5">
                                                    {res.minEventPoint.toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-1 py-2 md:py-1.5 md:px-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-pink-600 text-base md:text-lg font-bold tracking-tight group-hover/row:text-pink-600 transition-colors">
                                                    {res.max.toLocaleString()}
                                                </span>
                                                <span className="text-green-600 text-sm md:text-base font-bold tracking-tight mt-0.5">
                                                    {res.maxEventPoint.toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {/* My Sekai Row */}
                                {(() => {
                                    const powerVal = Number(totalPower || '293231') / 10000;
                                    const effiVal = Number(eventBonus || '250');

                                    // Find current My Sekai score
                                    let highestPossibleScore = null;
                                    let columnIndex = -1;

                                    if (powerVal >= 0) {
                                        for (let j = powerColumnThresholds.length - 1; j >= 0; j--) {
                                            if (powerColumnThresholds[j] <= powerVal) {
                                                columnIndex = j;
                                                break;
                                            }
                                        }
                                    }

                                    if (columnIndex !== -1) {
                                        for (let i = scoreRowKeys.length - 1; i >= 0; i--) {
                                            const currentScoreRow = scoreRowKeys[i];
                                            const requiredEffiForThisScore = mySekaiTableData[currentScoreRow][columnIndex];
                                            if (requiredEffiForThisScore !== null && effiVal >= requiredEffiForThisScore) {
                                                highestPossibleScore = currentScoreRow;
                                                break;
                                            }
                                        }
                                    }

                                    // Calculate next score requirements (2 options)
                                    let nextScoreOptions = null;
                                    if (highestPossibleScore !== null) {
                                        const currentScoreIdx = scoreRowKeys.indexOf(highestPossibleScore);
                                        if (currentScoreIdx < scoreRowKeys.length - 1) {
                                            const nextScore = scoreRowKeys[currentScoreIdx + 1];

                                            // Option 1: Keep power, increase effi
                                            const effiNeededSamePower = mySekaiTableData[nextScore][columnIndex];

                                            // Option 2: Increase power by one step, get required effi
                                            let effiNeededNextPower = null;
                                            let nextPowerThreshold = null;
                                            if (columnIndex < powerColumnThresholds.length - 1) {
                                                nextPowerThreshold = powerColumnThresholds[columnIndex + 1];
                                                effiNeededNextPower = mySekaiTableData[nextScore][columnIndex + 1];
                                            }

                                            nextScoreOptions = {
                                                nextScore,
                                                option1: effiNeededSamePower !== null ? { power: powerColumnThresholds[columnIndex], effi: effiNeededSamePower } : null,
                                                option2: effiNeededNextPower !== null ? { power: nextPowerThreshold, effi: effiNeededNextPower } : null
                                            };
                                        }
                                    }

                                    // My Sekai score = EP (no multiplier)
                                    const mySekaiEP = highestPossibleScore || 0;

                                    return (
                                        <tr className="hover:bg-gray-50 transition-colors duration-200 group/row">
                                            <td className="px-1 py-2 md:py-1.5 md:px-4 text-center" colSpan={2}>
                                                <span className="font-bold text-gray-800 text-xs md:text-base">{t('auto.my_sekai') || '마이세카이'}</span>
                                            </td>
                                            <td className="px-1 py-2 md:py-1.5 md:px-4 text-center" colSpan={2}>
                                                <div className="flex flex-col items-center">
                                                    {nextScoreOptions && (
                                                        <div className="text-[10px] md:text-xs text-gray-500 mb-0.5">
                                                            <span className="font-medium">{nextScoreOptions.nextScore.toLocaleString()}EP :</span>{' '}
                                                            {nextScoreOptions.option1 && (
                                                                <span className="text-blue-600 font-bold">
                                                                    {nextScoreOptions.option1.power}/{nextScoreOptions.option1.effi}
                                                                </span>
                                                            )}
                                                            {nextScoreOptions.option1 && nextScoreOptions.option2 && ' or '}
                                                            {nextScoreOptions.option2 && (
                                                                <span className="text-pink-600 font-bold">
                                                                    {nextScoreOptions.option2.power}/{nextScoreOptions.option2.effi}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <span className="text-green-600 text-base md:text-lg font-bold">
                                                        {mySekaiEP.toLocaleString()} EP
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-2 text-[11px] text-gray-500 text-right px-1">
                        * {t('auto.excluded_song_note')}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AutoTab;