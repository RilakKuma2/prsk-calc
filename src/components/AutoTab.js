import React, { useState, useEffect, useMemo } from 'react';
import { calculateScoreRange } from '../utils/calculator';
import { SONG_OPTIONS } from '../utils/songs';

// Fixed configuration for batch calculation
const TARGET_SONGS = [
    { id: 11, difficulty: 'master' },   // 비바
    { id: 104, difficulty: 'master' },  // 샹드
    { id: 74, difficulty: 'master' },   // 엔비
    { id: 448, difficulty: 'master' },  // 사게
    { id: 488, difficulty: 'append' },  // 메모리아
    { id: 48, difficulty: 'master' },   // 월이마
    { id: 186, difficulty: 'master' },  // 개벽
];

function AutoTab({ surveyData, setSurveyData }) {
    // Initialize or read from surveyData
    const deck = surveyData.autoDeck || {
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
            autoDeck: {
                ...prev.autoDeck,
                [key]: value
            }
        }));
    };

    const { totalPower, skillLeader, skillMember2, skillMember3, skillMember4, skillMember5 } = deck;

    const [batchResults, setBatchResults] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'min', direction: 'asc' });

    // Ensure default data exists
    useEffect(() => {
        if (!surveyData.autoDeck) {
            setSurveyData(prev => ({
                ...prev,
                autoDeck: {
                    totalPower: 200000,
                    skillLeader: 100,
                    skillMember2: 100,
                    skillMember3: 100,
                    skillMember4: 100,
                    skillMember5: 100
                }
            }));
        }
    }, []);

    // Auto-calculate batch results whenever inputs change
    useEffect(() => {
        const results = [];

        TARGET_SONGS.forEach(target => {
            const song = SONG_OPTIONS.find(s => s.id === target.id);
            if (!song) return;

            const input = {
                songId: target.id,
                difficulty: target.difficulty,
                totalPower,
                skillLeader,
                skillMember2,
                skillMember3,
                skillMember4,
                skillMember5,
            };

            try {
                const res = calculateScoreRange(input);
                if (res) {
                    results.push({
                        ...res,
                        songName: song.name,
                        songId: song.id,
                        difficulty: target.difficulty
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

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 font-sans selection:bg-pink-500/30">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Main Calculator Card */}
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
                    <div className="bg-gradient-to-r from-pink-600 to-purple-700 p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white relative z-10 tracking-tight">오토 라이브 점수 계산기</h1>
                        <p className="text-pink-100 mt-2 relative z-10 font-medium opacity-90">덱 정보를 입력하면 자동으로 계산됩니다</p>
                    </div>

                    <div className="p-6 md:p-8 space-y-8">
                        {/* Deck Power & Management */}
                        <div className="space-y-4 bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                                <div className="flex-1 w-full">
                                    <label className="block text-sm font-semibold text-gray-400 mb-2">종합력 (Total Deck Power)</label>
                                    <input
                                        type="number"
                                        value={totalPower}
                                        onChange={(e) => updateDeck('totalPower', Number(e.target.value))}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-shadow font-mono text-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-bold text-gray-200">멤버 스킬</h3>
                                <div className="h-px flex-1 bg-gray-700"></div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Score Up %</span>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/30">
                                    <label className="block text-sm font-bold text-yellow-400 mb-2">리더 (고정)</label>
                                    <input
                                        type="number"
                                        value={skillLeader}
                                        onChange={(e) => updateDeck('skillLeader', Number(e.target.value))}
                                        className="w-full bg-gray-900 border border-yellow-500/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-lg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: '멤버 2', val: skillMember2, key: 'skillMember2' },
                                    { label: '멤버 3', val: skillMember3, key: 'skillMember3' },
                                    { label: '멤버 4', val: skillMember4, key: 'skillMember4' },
                                    { label: '멤버 5', val: skillMember5, key: 'skillMember5' },
                                ].map((m, i) => (
                                    <div key={i} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                        <label className="block text-sm font-medium text-gray-400 mb-2">{m.label}</label>
                                        <input
                                            type="number"
                                            value={m.val}
                                            onChange={(e) => updateDeck(m.key, Number(e.target.value))}
                                            className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Batch Calculation Results */}
                {sortedBatchResults && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-800/50 text-gray-300 text-xs uppercase tracking-wider border-b border-gray-700">
                                            <th className="p-4 font-bold cursor-pointer hover:text-white transition-colors text-center select-none" onClick={() => handleSort('songName')}>
                                                <div className="flex items-center justify-center gap-1">
                                                    곡명 {sortConfig.key === 'songName' && <span className="text-pink-500">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                                                </div>
                                            </th>
                                            <th className="p-4 font-bold text-center select-none">
                                                난이도
                                            </th>
                                            <th className="p-4 font-bold cursor-pointer hover:text-white transition-colors text-center select-none" onClick={() => handleSort('min')}>
                                                <div className="flex items-center justify-center gap-1">
                                                    최저 점수 {sortConfig.key === 'min' && <span className="text-blue-400">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                                                </div>
                                            </th>
                                            <th className="p-4 font-bold cursor-pointer hover:text-white transition-colors text-center select-none" onClick={() => handleSort('max')}>
                                                <div className="flex items-center justify-center gap-1">
                                                    최고 점수 {sortConfig.key === 'max' && <span className="text-pink-400">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {sortedBatchResults.map((res, idx) => (
                                            <tr key={`${res.songId}-${res.difficulty}-${idx}`} className="hover:bg-white/5 transition-colors duration-200 group/row">
                                                <td className="p-4 font-bold text-white group-hover/row:text-pink-400 transition-colors text-base text-center">
                                                    {res.songName}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide shadow-sm ${res.difficulty === 'master' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-purple-500/10' :
                                                            res.difficulty === 'append' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-pink-500/10' :
                                                                'bg-gray-700 text-gray-300 border border-gray-600'
                                                        }`}>
                                                        {res.difficulty}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="font-mono text-blue-400 text-lg font-bold tracking-tight group-hover/row:text-blue-300 transition-colors">
                                                        {res.min.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="font-mono text-pink-500 text-lg font-black tracking-tight group-hover/row:text-pink-400 transition-colors drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]">
                                                        {res.max.toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default AutoTab;
