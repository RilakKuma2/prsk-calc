import React, { useState, useEffect, useMemo } from 'react';
import { calculateScoreRange } from '../utils/calculator';
import { SONG_OPTIONS } from '../utils/songs';
import { LiveType } from 'sekai-calculator';

// Fixed configuration for batch calculation with levels
const TARGET_SONGS = [
    { id: 6, difficulty: 'append' },
    { id: 141, difficulty: 'append' },
    { id: 627, difficulty: 'append' },
    { id: 671, difficulty: 'append' },
    { id: 540, difficulty: 'master' },
    { id: 644, difficulty: 'append' },
    { id: 104, difficulty: 'master' },
    { id: 72, difficulty: 'master' },
    { id: 11, difficulty: 'master' },
    { id: 134, difficulty: 'append' },
    { id: 154, difficulty: 'append' },
    { id: 62, difficulty: 'master' },
    { id: 410, difficulty: 'master' },
    { id: 190, difficulty: 'master' },
    { id: 539, difficulty: 'master' },
    { id: 566, difficulty: 'master' },
    { id: 627, difficulty: 'master' },
    { id: 605, difficulty: 'master' },
    { id: 91, difficulty: 'master' },
    { id: 227, difficulty: 'append' },
    { id: 489, difficulty: 'append' },
    { id: 671, difficulty: 'master' },
    { id: 427, difficulty: 'master' },
    { id: 117, difficulty: 'master' },
    { id: 160, difficulty: 'append' },
    { id: 6, difficulty: 'master' },
    { id: 585, difficulty: 'master' },
    { id: 150, difficulty: 'append' },
    { id: 538, difficulty: 'master' },
    { id: 671, difficulty: 'expert' },
    { id: 585, difficulty: 'append' },
    { id: 382, difficulty: 'master' },
    { id: 583, difficulty: 'master' },
    { id: 691, difficulty: 'append' },
    { id: 74, difficulty: 'master' },
    { id: 141, difficulty: 'master' },
    { id: 62, difficulty: 'expert' },
    { id: 622, difficulty: 'append' },
    { id: 26, difficulty: 'master' },
    { id: 74, difficulty: 'expert' },
    { id: 100, difficulty: 'append' },
    { id: 578, difficulty: 'master' },
    { id: 539, difficulty: 'expert' },
    { id: 320, difficulty: 'master' },
    { id: 89, difficulty: 'append' },
    { id: 554, difficulty: 'append' },
    { id: 264, difficulty: 'master' },
    { id: 11, difficulty: 'expert' },
    { id: 374, difficulty: 'master' },
    { id: 366, difficulty: 'append' },
];

function ChallengeScoreTab({ surveyData, setSurveyData }) {
    // Initialize or read from surveyData
    // Using 'challengeDeck' to separate from 'autoDeck'
    const deck = surveyData.challengeDeck || {
        totalPower: 200000,
        skillLeader: 100,
        skillMember2: 100,
        skillMember3: 100,
        skillMember4: 100,
        skillMember5: 100
    };

    const updateDeck = (key, value) => {
        setSurveyData(prev => ({
            ...prev,
            challengeDeck: {
                ...prev.challengeDeck,
                [key]: value
            }
        }));
    };

    const { totalPower, skillLeader, skillMember2, skillMember3, skillMember4, skillMember5 } = deck;

    const [batchResults, setBatchResults] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'max', direction: 'desc' });

    // Ensure default data exists
    useEffect(() => {
        if (!surveyData.challengeDeck) {
            setSurveyData(prev => ({
                ...prev,
                challengeDeck: {
                    totalPower: 200000,
                    skillLeader: 100,
                    skillMember2: 100,
                    skillMember3: 100,
                    skillMember4: 100,
                    skillMember5: 100
                }
            }));
        }
    }, [surveyData.challengeDeck, setSurveyData]);

    // Auto-calculate batch results whenever inputs change
    useEffect(() => {
        const results = [];

        TARGET_SONGS.forEach(target => {
            const song = SONG_OPTIONS.find(s => s.id === target.id);
            if (!song) return;

            const input = {
                songId: target.id,
                difficulty: target.difficulty,
                totalPower: Number(totalPower) || 0,
                skillLeader: Number(skillLeader) || 0,
                skillMember2: Number(skillMember2) || 0,
                skillMember3: Number(skillMember3) || 0,
                skillMember4: Number(skillMember4) || 0,
                skillMember5: Number(skillMember5) || 0,
            };

            try {
                // Use LiveType.SOLO for calculation
                const res = calculateScoreRange(input, LiveType.SOLO);
                if (res) {
                    results.push({
                        ...res,
                        songName: song.name,
                        songId: song.id,
                        difficulty: target.difficulty,
                        level: target.level,
                    });
                }
            } catch (e) {
                console.error(`Failed to calculate for ${song.name}`, e);
            }
        });

        setBatchResults(results);
    }, [totalPower, skillLeader, skillMember2, skillMember3, skillMember4, skillMember5]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const [expandedRow, setExpandedRow] = useState(null);

    const handleRowClick = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
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
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [batchResults, sortConfig]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const currentItems = useMemo(() => {
        if (!sortedBatchResults) return [];
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return sortedBatchResults.slice(indexOfFirstItem, indexOfLastItem);
    }, [sortedBatchResults, currentPage]);

    const totalPages = sortedBatchResults ? Math.ceil(sortedBatchResults.length / itemsPerPage) : 0;

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div id="challenge-score-tab-content">
            <label>종합력:</label>
            <input
                type="number"
                value={totalPower}
                onChange={(e) => {
                    const val = e.target.value;
                    updateDeck('totalPower', val === '' ? '' : Number(val));
                }}
                onFocus={(e) => e.target.select()}
            />
            <br />

            <h3 style={{ marginTop: '5px', marginBottom: '10px' }}>멤버 스킬</h3>

            <label>리더:</label>
            <input
                type="number"
                value={skillLeader}
                onChange={(e) => {
                    const val = e.target.value;
                    updateDeck('skillLeader', val === '' ? '' : Number(val));
                }}
                onFocus={(e) => e.target.select()}
            />
            <br />

            {[
                { label: '멤버 2:', val: skillMember2, key: 'skillMember2' },
                { label: '멤버 3:', val: skillMember3, key: 'skillMember3' },
                { label: '멤버 4:', val: skillMember4, key: 'skillMember4' },
                { label: '멤버 5:', val: skillMember5, key: 'skillMember5' },
            ].map((m, i) => (
                <React.Fragment key={i}>
                    <label>{m.label}</label>
                    <input
                        type="number"
                        value={m.val}
                        onChange={(e) => {
                            const val = e.target.value;
                            updateDeck(m.key, val === '' ? '' : Number(val));
                        }}
                        onFocus={(e) => e.target.select()}
                    />
                    <br />
                </React.Fragment>
            ))}

            <div className="flex items-center justify-center mb-4 mt-8">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                    챌린지 라이브 스코어
                </h3>
            </div>

            {/* Batch Calculation Results */}
            {sortedBatchResults && (
                <div className="w-full mt-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white text-gray-600 text-[10px] md:text-xs uppercase tracking-wider border-b border-gray-200">
                                    <th className="px-1 py-2 md:p-4 font-bold cursor-pointer hover:text-gray-900 transition-colors text-center select-none group" onClick={() => handleSort('songName')}>
                                        <div className="flex items-center justify-center gap-1 md:gap-2">
                                            곡명
                                            <span className={`transition-opacity duration-200 ${sortConfig.key === 'songName' ? 'opacity-100 text-pink-500' : 'opacity-0 group-hover:opacity-50'}`}>
                                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </th>
                                    <th className="px-1 py-2 md:p-4 font-bold cursor-pointer hover:text-gray-900 transition-colors text-center select-none group" onClick={() => handleSort('max')}>
                                        <div className="flex items-center justify-center gap-1 md:gap-2">
                                            최고 점수
                                            <span className={`transition-opacity duration-200 ${sortConfig.key === 'max' ? 'opacity-100 text-pink-500' : 'opacity-0 group-hover:opacity-50'}`}>
                                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </th>
                                    <th className="px-1 py-2 md:p-4 font-bold cursor-pointer hover:text-gray-900 transition-colors text-center select-none group" onClick={() => handleSort('min')}>
                                        <div className="flex items-center justify-center gap-1 md:gap-2">
                                            최저 점수
                                            <span className={`transition-opacity duration-200 ${sortConfig.key === 'min' ? 'opacity-100 text-blue-500' : 'opacity-0 group-hover:opacity-50'}`}>
                                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {currentItems.map((res, idx) => {
                                    const rowId = `${res.songId}-${res.difficulty}-${idx}`;
                                    const isExpanded = expandedRow === rowId;

                                    return (
                                        <React.Fragment key={rowId}>
                                            <tr
                                                className={`hover:bg-gray-50 transition-colors duration-200 group/row cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
                                                onClick={() => handleRowClick(rowId)}
                                            >
                                                <td className="px-1 py-4 md:p-4 font-bold text-gray-800 group-hover/row:text-pink-600 transition-colors text-xs md:text-base text-center">
                                                    <div className="flex items-center justify-center gap-1 md:gap-2">
                                                        {res.songName}
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${res.difficulty === 'master' || res.difficulty === 'append' || res.difficulty === 'expert' ? '' : 'bg-gray-100 text-gray-600 border border-gray-200 shadow-sm'
                                                                }`}
                                                            style={
                                                                res.difficulty === 'master' ? {
                                                                    backgroundColor: '#cc33ff',
                                                                    color: '#FFFFFF',
                                                                } : res.difficulty === 'append' ? {
                                                                    background: 'linear-gradient(to bottom right, #ad92fd, #fe7bde)',
                                                                    color: '#FFFFFF',
                                                                } : res.difficulty === 'expert' ? {
                                                                    backgroundColor: '#ff4477',
                                                                    color: '#FFFFFF',
                                                                } : {}
                                                            }
                                                        >
                                                            {res.difficulty === 'master' ? 'MAS' : res.difficulty === 'append' ? 'APD' : res.difficulty === 'expert' ? ' EX ' : res.difficulty}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-1 py-4 md:p-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-mono text-pink-500 text-sm md:text-base font-black tracking-tight group-hover/row:text-pink-600 transition-colors">
                                                            {res.max.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-1 py-4 md:p-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-mono text-blue-500 text-sm md:text-base font-bold tracking-tight group-hover/row:text-blue-600 transition-colors">
                                                            {res.min.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan="3" className="p-2 md:p-4 border-t border-gray-100">
                                                        <div className="flex flex-col gap-6 max-w-[calc(100vw-60px)] md:max-w-none mx-auto">
                                                            {/* Optimal Skill Order */}
                                                            <div>
                                                                <h4 className="text-sm font-bold text-gray-700 mb-2">최적 스킬 순서</h4>
                                                                <div className="flex gap-0.5 md:gap-2 overflow-x-auto pb-2 justify-between md:justify-start">
                                                                    {/* Slots 1-5 */}
                                                                    {res.maxPermutation.map((skill, i) => (
                                                                        <div key={i} className="flex flex-col items-center flex-1 min-w-0">
                                                                            <div className="w-11 h-11 max-[375px]:w-9 max-[375px]:h-9 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-bold text-sm max-[375px]:text-xs md:text-base shadow-sm border bg-white text-gray-700 border-gray-200">
                                                                                {skill}%
                                                                            </div>
                                                                            <span className="text-[10px] max-[375px]:text-[9px] text-gray-500 mt-1 font-medium whitespace-nowrap">
                                                                                {i + 1}번째
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                    {/* Encore Slot */}
                                                                    <div className="flex flex-col items-center flex-1 min-w-0">
                                                                        <div className="w-11 h-11 max-[375px]:w-9 max-[375px]:h-9 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-bold text-sm max-[375px]:text-xs md:text-base shadow-sm border bg-gray-100 text-gray-400 border-gray-200">
                                                                            {skillLeader}%
                                                                        </div>
                                                                        <span className="text-[10px] max-[375px]:text-[9px] text-gray-400 mt-1 font-medium whitespace-nowrap">
                                                                            앵콜
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Skill Coefficients Graph (Horizontal Stacked Bar) */}
                                                            <div>
                                                                <h4 className="text-sm font-bold text-gray-700 mb-2">스킬 구간 점수 비중</h4>
                                                                {(() => {
                                                                    const targetCoeffs = res.skillCoeffs.slice(0, 5);
                                                                    const totalCoeff = targetCoeffs.reduce((a, b) => a + b, 0);
                                                                    const colors = [
                                                                        'bg-red-400',
                                                                        'bg-orange-400',
                                                                        'bg-yellow-400',
                                                                        'bg-green-400',
                                                                        'bg-blue-400'
                                                                    ];

                                                                    const segments = targetCoeffs.map((coeff, i) => ({
                                                                        widthPercent: (coeff / totalCoeff) * 100,
                                                                        color: colors[i],
                                                                        label: `${i + 1}번째`,
                                                                        coeff: coeff
                                                                    }));

                                                                    return (
                                                                        <div className="w-full">
                                                                            {/* Bar Graph */}
                                                                            <div className="w-full h-8 flex rounded-lg overflow-hidden shadow-sm">
                                                                                {segments.map((seg, i) => (
                                                                                    <div
                                                                                        key={i}
                                                                                        className={`${seg.color} h-full flex items-center justify-center text-white text-[10px] font-bold relative group/segment`}
                                                                                        style={{ width: `${seg.widthPercent}%` }}
                                                                                    >
                                                                                        <span className="drop-shadow-md">{Math.round(seg.widthPercent)}%</span>
                                                                                        {/* Tooltip */}
                                                                                        <div className="opacity-0 group-hover/segment:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
                                                                                            {seg.label}: {(seg.coeff * 100).toFixed(1)}%
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                            {/* Labels below graph */}
                                                                            <div className="w-full flex mt-1">
                                                                                {segments.map((seg, i) => (
                                                                                    <div
                                                                                        key={i}
                                                                                        className="text-center text-[10px] text-gray-500 font-medium truncate px-0.5"
                                                                                        style={{ width: `${seg.widthPercent}%` }}
                                                                                    >
                                                                                        {seg.label}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-6 mb-4">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded-md bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                이전
                            </button>
                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`w-8 h-8 rounded-md text-sm font-bold transition-all duration-200 ${currentPage === page
                                            ? 'bg-pink-500 text-white shadow-md scale-105'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-pink-200'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded-md bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                다음
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-6 text-center text-lg">
                <span style={{ fontWeight: 'bold' }}>
                    <a target="_blank" rel="noopener noreferrer" href="https://3-3.dev/sekai/top-deck" className="text-blue-500 hover:underline">
                        챌라 이론덱
                    </a>
                </span>
                <br />
                <span style={{ fontWeight: 'bold' }}>
                    <a target="_blank" rel="noopener noreferrer" href="https://m.dcinside.com/board/pjsekai/2262136" className="text-blue-500 hover:underline">
                        군청찬가 초고점 뽑기
                    </a>
                </span>
                <br /><br />
            </div>
        </div>
    );
}

export default ChallengeScoreTab;
