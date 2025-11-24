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
        <div id="auto-tab-content">
            <label>종합력:</label>
            <input
                type="number"
                value={totalPower}
                onChange={(e) => updateDeck('totalPower', Number(e.target.value))}
            />
            <br />

            <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>멤버 스킬</h3>

            <label>리더:</label>
            <input
                type="number"
                value={skillLeader}
                onChange={(e) => updateDeck('skillLeader', Number(e.target.value))}
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
                        onChange={(e) => updateDeck(m.key, Number(e.target.value))}
                    />
                    <br />
                </React.Fragment>
            ))}

            <div className="flex items-center justify-center mb-4 mt-8">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                    오토 라이브 스코어
                </h3>
            </div>

            {/* Batch Calculation Results */}
            {sortedBatchResults && (
                <div className="w-full mt-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                                    <th className="p-4 font-bold cursor-pointer hover:text-gray-900 transition-colors text-center select-none group" onClick={() => handleSort('songName')}>
                                        <div className="flex items-center justify-center gap-2">
                                            곡명
                                            <span className={`transition-opacity duration-200 ${sortConfig.key === 'songName' ? 'opacity-100 text-pink-500' : 'opacity-0 group-hover:opacity-50'}`}>
                                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </th>
                                    <th className="p-4 font-bold text-center select-none">
                                        난이도
                                    </th>
                                    <th className="p-4 font-bold cursor-pointer hover:text-gray-900 transition-colors text-center select-none group" onClick={() => handleSort('min')}>
                                        <div className="flex items-center justify-center gap-2">
                                            최저 점수
                                            <span className={`transition-opacity duration-200 ${sortConfig.key === 'min' ? 'opacity-100 text-blue-500' : 'opacity-0 group-hover:opacity-50'}`}>
                                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </th>
                                    <th className="p-4 font-bold cursor-pointer hover:text-gray-900 transition-colors text-center select-none group" onClick={() => handleSort('max')}>
                                        <div className="flex items-center justify-center gap-2">
                                            최고 점수
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
                                        <td className="p-4 font-bold text-gray-800 group-hover/row:text-pink-600 transition-colors text-base text-center">
                                            {res.songName}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide shadow-sm ${res.difficulty === 'master' ? 'bg-purple-100 text-purple-600 border border-purple-200' :
                                                res.difficulty === 'append' ? 'bg-pink-100 text-pink-600 border border-pink-200' :
                                                    'bg-gray-100 text-gray-600 border border-gray-200'
                                                }`}>
                                                {res.difficulty}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-mono text-blue-500 text-lg font-bold tracking-tight group-hover/row:text-blue-600 transition-colors">
                                                {res.min.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-mono text-pink-500 text-lg font-black tracking-tight group-hover/row:text-pink-600 transition-colors">
                                                {res.max.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AutoTab;