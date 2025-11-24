import React, { useState, useEffect, useMemo } from 'react';
import { calculateScoreRange } from '../utils/calculator';
import { SONG_OPTIONS } from '../utils/songs';

const DIFFICULTIES = ['easy', 'normal', 'hard', 'expert', 'master', 'append'];

function AutoTab() {
    // Default values
    const [songId, setSongId] = useState(74);
    const [difficulty, setDifficulty] = useState('master');
    const [totalPower, setTotalPower] = useState(200000);
    const [skillLeader, setSkillLeader] = useState(100);
    const [skillMember2, setSkillMember2] = useState(100);
    const [skillMember3, setSkillMember3] = useState(100);
    const [skillMember4, setSkillMember4] = useState(100);
    const [skillMember5, setSkillMember5] = useState(100);

    const [result, setResult] = useState(null);
    const [batchResults, setBatchResults] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'max', direction: 'desc' });
    const [message, setMessage] = useState(null);

    // Clear message after 3 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleManualSave = () => {
        const deckState = { totalPower, skillLeader, skillMember2, skillMember3, skillMember4, skillMember5 };
        localStorage.setItem('sekai-score-manual-save', JSON.stringify(deckState));
        setMessage('덱 정보가 저장되었습니다!');
    };

    const handleManualLoad = () => {
        const saved = localStorage.getItem('sekai-score-manual-save');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.totalPower) setTotalPower(parsed.totalPower);
                if (parsed.skillLeader) setSkillLeader(parsed.skillLeader);
                if (parsed.skillMember2) setSkillMember2(parsed.skillMember2);
                if (parsed.skillMember3) setSkillMember3(parsed.skillMember3);
                if (parsed.skillMember4) setSkillMember4(parsed.skillMember4);
                if (parsed.skillMember5) setSkillMember5(parsed.skillMember5);
                setMessage('덱 정보를 불러왔습니다!');
            } catch (e) {
                console.error("Failed to load saved state", e);
                setMessage('저장된 정보를 불러오는데 실패했습니다.');
            }
        } else {
            setMessage('저장된 덱 정보가 없습니다.');
        }
    };

    // Load from localStorage on mount (Auto-save)
    useEffect(() => {
        const saved = localStorage.getItem('sekai-score-deck');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.totalPower) setTotalPower(parsed.totalPower);
                if (parsed.skillLeader) setSkillLeader(parsed.skillLeader);
                if (parsed.skillMember2) setSkillMember2(parsed.skillMember2);
                if (parsed.skillMember3) setSkillMember3(parsed.skillMember3);
                if (parsed.skillMember4) setSkillMember4(parsed.skillMember4);
                if (parsed.skillMember5) setSkillMember5(parsed.skillMember5);
            } catch (e) {
                console.error("Failed to load saved state", e);
            }
        }
    }, []);

    // Save to localStorage and Auto-calculate
    useEffect(() => {
        // Save state
        const deckState = { totalPower, skillLeader, skillMember2, skillMember3, skillMember4, skillMember5 };
        localStorage.setItem('sekai-score-deck', JSON.stringify(deckState));

        // Auto-calculate
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

        try {
            const res = calculateScoreRange(input);
            if (res) {
                setResult(res);
            } else {
                setResult(null);
            }
        } catch (e) {
            console.error(e);
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
                                        onChange={(e) => setSongId(Number(e.target.value))}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none transition-shadow"
                                    >
                                        {SONG_OPTIONS.map(song => (
                                            <option key={song.id} value={song.id}>{song.name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-400">난이도</label>
                                <div className="relative">
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none transition-shadow"
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="normal">Normal</option>
                                        <option value="hard">Hard</option>
                                        <option value="expert">Expert</option>
                                        <option value="master">Master</option>
                                        <option value="append">Append</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
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
                                        onChange={(e) => setTotalPower(Number(e.target.value))}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-shadow font-mono"
                                    />
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button
                                        onClick={handleManualSave}
                                        className="flex-1 md:flex-none bg-gray-700 hover:bg-green-600 text-white font-medium py-3 px-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-gray-600 hover:border-green-500 group"
                                        title="현재 덱 정보 저장"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586l-1.293-1.293z" />
                                            <path d="M5 18a2 2 0 002 2h6a2 2 0 002-2V8a2 2 0 00-2-2H7a2 2 0 00-2 2v10z" />
                                        </svg>
                                        <span className="whitespace-nowrap">저장</span>
                                    </button>
                                    <button
                                        onClick={handleManualLoad}
                                        className="flex-1 md:flex-none bg-gray-700 hover:bg-blue-600 text-white font-medium py-3 px-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-gray-600 hover:border-blue-500 group"
                                        title="저장된 덱 정보 불러오기"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        <span className="whitespace-nowrap">불러오기</span>
                                    </button>
                                </div>
                            </div>

                            {message && (
                                <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-lg text-center text-sm font-medium animate-fade-in flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {message}
                                </div>
                            )}
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
                                        onChange={(e) => setSkillLeader(Number(e.target.value))}
                                        className="w-full bg-gray-900 border border-yellow-500/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-lg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: '멤버 2', val: skillMember2, set: setSkillMember2 },
                                    { label: '멤버 3', val: skillMember3, set: setSkillMember3 },
                                    { label: '멤버 4', val: skillMember4, set: setSkillMember4 },
                                    { label: '멤버 5', val: skillMember5, set: setSkillMember5 },
                                ].map((m, i) => (
                                    <div key={i} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                        <label className="block text-sm font-medium text-gray-400 mb-2">{m.label}</label>
                                        <input
                                            type="number"
                                            value={m.val}
                                            onChange={(e) => m.set(Number(e.target.value))}
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
