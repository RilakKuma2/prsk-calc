import React, { useState, useEffect, useMemo } from 'react';
import { calculateScoreRange } from '../utils/calculator';
import { SONG_OPTIONS } from '../utils/songs';

const DIFFICULTIES = ['easy', 'normal', 'hard', 'expert', 'master', 'append'];

function AutoTab({ surveyData, setSurveyData }) {
    // Initialize or read from surveyData
    const deck = surveyData.autoDeck || {
        songId: 74,
        difficulty: 'master',
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

    const { songId, difficulty, totalPower, skillLeader, skillMember2, skillMember3, skillMember4, skillMember5 } = deck;

    const [result, setResult] = useState(null);
    const [batchResults, setBatchResults] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'max', direction: 'desc' });
    // Auto-save is handled by App.js via surveyData
    // We just need to ensure default data exists if not present
    useEffect(() => {
        if (!surveyData.autoDeck) {
            setSurveyData(prev => ({
                ...prev,
                autoDeck: {
                    songId: 74,
                    difficulty: 'master',
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

    // Auto-calculate
    useEffect(() => {
        // Removed early return to allow calculation with default values
        // if (!surveyData.autoDeck) return;

        const input = {
            songId,
            difficulty,
            totalPower,
            skillLeader,
            skillMember2,
            skillMember3,
            skillMember4,
            skillMember5,
        };

        console.log('AutoTab: Calculating with input:', input);

        try {
            const res = calculateScoreRange(input);
            if (res) {
                console.log('AutoTab: Calculation success:', res);
                setResult(res);
            } else {
                console.warn('AutoTab: Calculation returned null');
                setResult(null);
            }
        } catch (e) {
            console.error('AutoTab: Calculation error:', e);
        }
    }, [songId, difficulty, totalPower, skillLeader, skillMember2, skillMember3, skillMember4, skillMember5]);

    const handleCalculateAll = () => {
        const results = [];
        SONG_OPTIONS.forEach(song => {
            DIFFICULTIES.forEach(diff => {
                const input = {
                    songId: song.id,
                    difficulty: diff,
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
                        results.push({ ...res, songName: song.name, songId: song.id, difficulty: diff });
                    }
                } catch (e) {
                    // console.error(`Failed to calculate for ${song.name} ${diff}`, e);
                }
            });
        });
        setBatchResults(results);
    };

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedBatchResults = useMemo(() => {
        if (!batchResults) return null;

        // Group by songId
        const grouped = new Map();
        batchResults.forEach(res => {
            if (!grouped.has(res.songId)) grouped.set(res.songId, []);
            grouped.get(res.songId).push(res);
        });

        // Filter to keep only the "best" difficulty per song
        const filtered = [];
        grouped.forEach(results => {
            const best = results.reduce((prev, current) => {
                if (sortConfig.key === 'min') {
                    return current.min > prev.min ? current : prev;
                } else {
                    return current.max > prev.max ? current : prev;
                }
            });
            filtered.push(best);
        });

        return filtered.sort((a, b) => {
            let aValue = 0;
            let bValue = 0;

            if (sortConfig.key === 'songName') {
                aValue = a.songName;
                bValue = b.songName;
            } else if (sortConfig.key === 'difficulty') {
                aValue = DIFFICULTIES.indexOf(a.difficulty);
                bValue = DIFFICULTIES.indexOf(b.difficulty);
            } else if (sortConfig.key === 'min') {
                aValue = a.min;
                bValue = b.min;
            } else if (sortConfig.key === 'max') {
                aValue = a.max;
                bValue = b.max;
            } else if (sortConfig.key === 'diff') {
                aValue = a.max - a.min;
                bValue = b.max - b.min;
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
                        <p className="text-pink-100 mt-2 relative z-10 font-medium opacity-90">최적의 덱 순서를 찾아 점수를 극대화하세요</p>
                    </div>

                    <div className="p-6 md:p-8 space-y-8">
                        {/* Song Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-400">곡 선택</label>
                                <div className="relative">
                                    <select
                                        value={songId}
                                        onChange={(e) => updateDeck('songId', Number(e.target.value))}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-shadow"
                                    >
                                        {SONG_OPTIONS.map(song => (
                                            <option key={song.id} value={song.id}>{song.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-400">난이도</label>
                                <div className="relative">
                                    <select
                                        value={difficulty}
                                        onChange={(e) => updateDeck('difficulty', e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-shadow"
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="normal">Normal</option>
                                        <option value="hard">Hard</option>
                                        <option value="expert">Expert</option>
                                        <option value="master">Master</option>
                                        <option value="append">Append</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Deck Power & Management */}
                        <div className="space-y-4 bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                                <div className="flex-1 w-full">
                                    <label className="block text-sm font-semibold text-gray-400 mb-2">종합력 (Total Deck Power)</label>
                                    <input
                                        type="number"
                                        value={totalPower}
                                        onChange={(e) => updateDeck('totalPower', Number(e.target.value))}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-shadow font-mono"
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

                        {/* Single Result */}
                        {result && (
                            <div className="bg-gray-800 rounded-2xl p-6 md:p-8 space-y-6 animate-fade-in border border-gray-700 shadow-lg">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white">계산 결과</h3>
                                    <span className="px-3 py-1 rounded-full bg-gray-700 text-xs text-gray-300 font-medium">Auto Live</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-900/50 p-5 rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-colors">
                                        <div className="text-sm font-semibold text-gray-400 mb-2">최저 점수</div>
                                        <div className="text-3xl font-mono font-bold text-blue-400 tracking-tight">{result.min.toLocaleString()}</div>
                                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-900 rounded px-2 py-1 w-fit">
                                            <span className="uppercase tracking-wider font-semibold">Order</span>
                                            <span className="font-mono text-gray-300">{result.minPermutation.join(', ')}%</span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-900/50 p-5 rounded-xl border border-pink-500/30 shadow-[0_0_20px_rgba(236,72,153,0.1)] hover:border-pink-500/50 transition-colors">
                                        <div className="text-sm font-semibold text-pink-400 mb-2">최고 점수</div>
                                        <div className="text-3xl font-mono font-bold text-pink-400 tracking-tight">{result.max.toLocaleString()}</div>
                                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-900 rounded px-2 py-1 w-fit">
                                            <span className="uppercase tracking-wider font-semibold">Order</span>
                                            <span className="font-mono text-gray-300">{result.maxPermutation.join(', ')}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-700 flex justify-between items-center text-sm">
                                    <span className="text-gray-400">점수 차이</span>
                                    <span className="font-mono font-bold text-white">{(result.max - result.min).toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Batch Calculation Section */}
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-800 overflow-hidden p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white">일괄 계산</h2>
                            <p className="text-gray-400 text-sm mt-1">모든 곡에 대해 최적의 난이도를 계산합니다</p>
                        </div>
                        <button
                            onClick={handleCalculateAll}
                            className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 transform hover:-translate-y-0.5"
                        >
                            전체 계산하기
                        </button>
                    </div>

                    {sortedBatchResults && (
                        <div className="overflow-hidden rounded-xl border border-gray-700 shadow-inner bg-gray-900">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                                            <th className="p-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('songName')}>
                                                곡명 {sortConfig.key === 'songName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('difficulty')}>
                                                난이도 {sortConfig.key === 'difficulty' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 font-semibold cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort('min')}>
                                                최저 점수 {sortConfig.key === 'min' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 font-semibold cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort('max')}>
                                                최고 점수 {sortConfig.key === 'max' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 font-semibold cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort('diff')}>
                                                차이 {sortConfig.key === 'diff' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {sortedBatchResults.map((res, idx) => (
                                            <tr key={`${res.songId}-${res.difficulty}-${idx}`} className="hover:bg-gray-800/50 transition-colors group">
                                                <td className="p-4 font-medium text-white group-hover:text-pink-400 transition-colors">{res.songName}</td>
                                                <td className="p-4 capitalize text-gray-400">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${res.difficulty === 'master' ? 'bg-purple-500/20 text-purple-300' :
                                                        res.difficulty === 'expert' ? 'bg-red-500/20 text-red-300' :
                                                            res.difficulty === 'append' ? 'bg-pink-500/20 text-pink-300' :
                                                                'bg-gray-700 text-gray-300'
                                                        }`}>
                                                        {res.difficulty}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-mono text-blue-400">{res.min.toLocaleString()}</td>
                                                <td className="p-4 text-right font-mono text-pink-400 font-bold">{res.max.toLocaleString()}</td>
                                                <td className="p-4 text-right font-mono text-gray-500 group-hover:text-gray-300">{(res.max - res.min).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default AutoTab;
