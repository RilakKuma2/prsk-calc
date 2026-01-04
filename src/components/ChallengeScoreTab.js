import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InputTableWrapper, InputRow, SectionHeaderRow } from './common/InputComponents';
import { calculateScoreRange } from '../utils/calculator';
import { getSongOptionsSync } from '../utils/dataLoader';
import { LiveType } from 'sekai-calculator';
import { useTranslation } from '../contexts/LanguageContext';

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
    { id: 610, difficulty: 'master' },
    { id: 320, difficulty: 'master' },
    { id: 89, difficulty: 'append' },
    { id: 554, difficulty: 'append' },
    { id: 264, difficulty: 'master' },
    { id: 11, difficulty: 'expert' },
    { id: 374, difficulty: 'master' },
    { id: 366, difficulty: 'append' },
];

function ChallengeScoreTab({ surveyData, setSurveyData }) {
    const { t, language } = useTranslation();
    // Initialize or read from surveyData
    // Using 'challengeDeck' to separate from 'autoDeck'
    const deck = surveyData.challengeDeck || {
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
            challengeDeck: {
                ...prev.challengeDeck,
                [key]: value
            }
        }));
    };

    const { totalPower, skillLeader, skillMember2, skillMember3, skillMember4, skillMember5 } = deck;

    const [batchResults, setBatchResults] = useState(null);
    const [scoreData, setScoreData] = useState([]);
    const [difficulty, setDifficulty] = useState(surveyData.difficulty || 'master');
    const [sortConfig, setSortConfig] = useState({ key: 'max', direction: 'desc' });

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedSong, setSelectedSong] = useState(null);
    const [searchDifficulty, setSearchDifficulty] = useState('master');
    const [customResult, setCustomResult] = useState(null);
    const searchContainerRef = useRef(null);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    // Click Outside Effect
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setIsDropdownVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search Effect
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const normalize = (str) => {
            if (!str) return '';
            return str.toLowerCase()
                .replace(/\s+/g, '')
                .replace(/[\u3041-\u3096]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));
        };

        const query = normalize(searchQuery);

        const results = getSongOptionsSync().filter(song => {
            const name = normalize(song.name);
            const titleJp = normalize(song.title_jp);
            const titleEn = normalize(song.title_en);
            const titleHi = normalize(song.title_hi);
            const titleHangul = normalize(song.title_hangul);

            if (name.includes(query)) return true;
            if (titleHi && titleHi.includes(query)) return true;
            if (titleHangul && titleHangul.includes(query)) return true;

            if (language === 'ko') {
                if (titleJp && titleJp.includes(query)) return true;
                if (titleEn && titleEn.includes(query)) return true;
            } else if (language === 'ja') {
                if (titleJp && titleJp.includes(query)) return true;
            } else {
                if (titleEn && titleEn.includes(query)) return true;
            }

            return false;
        }).slice(0, 5);

        setSearchResults(results);
        setIsDropdownVisible(true);
    }, [searchQuery, language]);

    const handleSelectSong = (song) => {
        setSelectedSong(song);
        setSearchQuery(language === 'ko' ? song.name : song.title_jp);
        setSearchResults([]);

        // Calculate result immediately
        if (song) {
            const input = {
                songId: song.id,
                difficulty: searchDifficulty,
                totalPower: Number(deck.totalPower || '410520'),
                skillLeader: Number(deck.skillLeader || '140'),
                skillMember2: Number(deck.skillMember2 || '120'),
                skillMember3: Number(deck.skillMember3 || '100'),
                skillMember4: Number(deck.skillMember4 || '100'),
                skillMember5: Number(deck.skillMember5 || '100'),
            };

            try {
                const res = calculateScoreRange(input, LiveType.SOLO);
                if (res) {
                    setCustomResult({
                        ...res,
                        songName: language === 'ko' ? song.name : song.title_jp,
                        songId: song.id,
                        difficulty: searchDifficulty,
                        // level: ??? (Need to fetch level if possible, but might not be in SONG_OPTIONS directly without song data lookup, handled by calculator?)
                        // Calculator doesn't return level usually, it takes inputs. 
                        // But for display we might want it. 
                        // However, we just need score range.
                    });
                }
            } catch (e) {
                console.error(`Failed to calculate for ${song.name}`, e);
            }
        }
    };

    // Re-calculate custom result when difficulty or deck changes if a song is selected
    useEffect(() => {
        if (selectedSong) {
            handleSelectSong(selectedSong);
        }
    }, [searchDifficulty, deck, selectedSong]);
    // ^ Warning: handleSelectSong calls setSelectedSong, likely loop if not careful. 
    // Better to extract calculation to separate function or use specific effect.
    // Simpler: Just make handleSelectSong set song, and an effect watches [selectedSong, searchDifficulty, deck].

    useEffect(() => {
        if (!selectedSong) return;

        const input = {
            songId: selectedSong.id,
            difficulty: searchDifficulty,
            totalPower: Number(deck.totalPower || '410520'),
            skillLeader: Number(deck.skillLeader || '140'),
            skillMember2: Number(deck.skillMember2 || '120'),
            skillMember3: Number(deck.skillMember3 || '100'),
            skillMember4: Number(deck.skillMember4 || '100'),
            skillMember5: Number(deck.skillMember5 || '100'),
        };

        try {
            const res = calculateScoreRange(input, LiveType.SOLO);
            if (res) {
                setCustomResult({
                    ...res,
                    songName: language === 'ko' ? selectedSong.name : selectedSong.title_jp,
                    songId: selectedSong.id,
                    difficulty: searchDifficulty,
                });
            }
        } catch (e) {
            console.error(e);
        }

    }, [selectedSong, searchDifficulty, deck, language]);


    // Ensure default data exists
    useEffect(() => {
        if (!surveyData.challengeDeck) {
            setSurveyData(prev => ({
                ...prev,
                challengeDeck: {
                    totalPower: '',
                    skillLeader: '',
                    skillMember2: '',
                    skillMember3: '',
                    skillMember4: '',
                    skillMember5: ''
                }
            }));
        }
    }, [surveyData.challengeDeck, setSurveyData]);

    // Auto-calculate batch results whenever inputs change
    useEffect(() => {
        const results = [];

        TARGET_SONGS.forEach(target => {
            const song = getSongOptionsSync().find(s => s.id === target.id);
            if (!song) return;

            const input = {
                songId: target.id,
                difficulty: target.difficulty,
                totalPower: Number(totalPower || '410520'),
                skillLeader: Number(skillLeader || '140'),
                skillMember2: Number(skillMember2 || '120'),
                skillMember3: Number(skillMember3 || '100'),
                skillMember4: Number(skillMember4 || '100'),
                skillMember5: Number(skillMember5 || '100'),
            };

            try {
                // Use LiveType.SOLO for calculation
                const res = calculateScoreRange(input, LiveType.SOLO);
                if (res) {
                    results.push({
                        ...res,
                        songName: language === 'ko' ? song.name : song.title_jp,
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
    }, [totalPower, skillLeader, skillMember2, skillMember3, skillMember4, skillMember5, language]);

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
            <InputTableWrapper>
                <InputRow
                    label={t('challenge_score.total_power')}
                    value={totalPower}
                    placeholder="410520"
                    onChange={(e) => {
                        let val = parseInt(e.target.value) || 0;
                        if (val > 460000) {
                            val = 460000;
                        }
                        updateDeck('totalPower', val > 0 ? val : '');
                    }}
                />
                <SectionHeaderRow label={t('challenge_score.member_skills')} />
                <InputRow
                    label={t('challenge_score.leader')}
                    value={skillLeader}
                    placeholder="140"
                    onChange={(e) => {
                        let val = parseInt(e.target.value) || 0;
                        if (val > 160) val = 160;
                        updateDeck('skillLeader', val > 0 ? val : '');
                    }}
                />
                {[
                    { label: t('challenge_score.member_2'), val: skillMember2, key: 'skillMember2', placeholder: '120' },
                    { label: t('challenge_score.member_3'), val: skillMember3, key: 'skillMember3', placeholder: '100' },
                    { label: t('challenge_score.member_4'), val: skillMember4, key: 'skillMember4', placeholder: '100' },
                    { label: t('challenge_score.member_5'), val: skillMember5, key: 'skillMember5', placeholder: '100' },
                ].map((m, i) => (
                    <InputRow
                        key={i}
                        label={m.label}
                        value={m.val}
                        placeholder={m.placeholder}
                        onChange={(e) => {
                            let val = parseInt(e.target.value) || 0;
                            if (val > 160) val = 160;
                            updateDeck(m.key, val > 0 ? val : '');
                        }}
                    />
                ))}
            </InputTableWrapper>
            <div className="text-xs text-gray-500 text-center" dangerouslySetInnerHTML={{ __html: t('challenge_score.description') }}>
            </div>

            <div className="flex flex-col items-center justify-center mt-4 mb-4">
                <div className="text-[11px] font-bold text-indigo-500 mb-3 animate-pulse-slow">
                    {t('challenge_score.click_guide')}
                </div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                    {t('challenge_score.title')}
                </h3>
            </div>

            {/* Search Bar */}
            <div className={`transition-all duration-300 ${isSearchOpen ? 'max-h-40 opacity-100 mb-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div ref={searchContainerRef} className="bg-white rounded-xl shadow-sm border border-indigo-100 p-4 mx-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (!e.target.value) setSelectedSong(null);
                                }}
                                onFocus={() => setIsDropdownVisible(true)}
                                placeholder={t('challenge_score.song_name')}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            />
                            {/* Autocomplete Dropdown */}
                            {searchResults.length > 0 && isDropdownVisible && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 z-[100] max-h-60 overflow-y-auto">
                                    {searchResults.map((song) => (
                                        <div
                                            key={song.id}
                                            onClick={() => handleSelectSong(song)}
                                            className={`px-4 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-gray-50 last:border-none ${language === 'ko'
                                                ? 'py-1.5 flex flex-col justify-center items-start'
                                                : 'py-3 flex justify-between items-center'
                                                }`}
                                        >
                                            <span className="font-medium text-gray-700 truncate w-full">
                                                {language === 'ko' ? song.name : song.title_jp}
                                            </span>
                                            {language === 'ko' && (
                                                <span className="text-[10px] text-gray-400 truncate w-full -mt-0.5">
                                                    {song.title_jp}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <select
                            value={searchDifficulty}
                            onChange={(e) => setSearchDifficulty(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white font-medium text-gray-700"
                        >
                            <option value="easy">EASY</option>
                            <option value="normal">NORMAL</option>
                            <option value="hard">HARD</option>
                            <option value="expert">EXPERT</option>
                            <option value="master">MASTER</option>
                            <option value="append">APPEND</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Custom Search Result */}
            {customResult && (
                <div className="w-full mb-6 px-4 animate-fade-in-up">
                    <div className="bg-indigo-50 rounded-xl border border-indigo-200 overflow-hidden shadow-sm">
                        <div className="px-4 py-2 bg-indigo-100 border-b border-indigo-200 flex justify-between items-center">
                            <span className="font-bold text-indigo-700 text-sm">SEARCH RESULT</span>
                            <button onClick={() => { setCustomResult(null); setSelectedSong(null); setSearchQuery(''); }} className="text-indigo-400 hover:text-indigo-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        {/* Reuse Row Structure for Custom Result */}
                        <div className="bg-white">
                            <table className="w-full text-left">
                                <tbody>
                                    <tr
                                        className="cursor-pointer"
                                        onClick={() => handleRowClick('custom-result')}
                                    >
                                        <td className="px-4 py-4 font-bold text-gray-800 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {customResult.songName}
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${customResult.difficulty === 'master' || customResult.difficulty === 'append' || customResult.difficulty === 'expert' ? '' : 'bg-gray-100 text-gray-600 border border-gray-200 shadow-sm'
                                                        }`}
                                                    style={
                                                        customResult.difficulty === 'master' ? { backgroundColor: '#cc33ff', color: '#FFFFFF' } :
                                                            customResult.difficulty === 'append' ? { background: 'linear-gradient(to bottom right, #ad92fd, #fe7bde)', color: '#FFFFFF' } :
                                                                customResult.difficulty === 'expert' ? { backgroundColor: '#ff4477', color: '#FFFFFF' } :
                                                                    customResult.difficulty === 'hard' ? { border: '2px solid #ffcc00', backgroundColor: '#ffcc00', color: '#FFFFFF' } :
                                                                        customResult.difficulty === 'normal' ? { border: '2px solid #33ccff', backgroundColor: '#33ccff', color: '#FFFFFF' } :
                                                                            customResult.difficulty === 'easy' ? { border: '2px solid #13d675', backgroundColor: '#13d675', color: '#FFFFFF' } : {}
                                                    }
                                                >
                                                    {customResult.difficulty === 'master' ? 'MAS' : customResult.difficulty === 'append' ? 'APD' : customResult.difficulty === 'expert' ? ' EX ' : customResult.difficulty}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="font-mono text-pink-500 font-black tracking-tight">{customResult.max.toLocaleString()}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="font-mono text-blue-500 font-bold tracking-tight">{customResult.min.toLocaleString()}</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            {expandedRow === 'custom-result' && (
                                <div className="bg-gray-50 border-t border-gray-100 p-4">
                                    {/* Details (Copy of row details) */}
                                    <div className="flex flex-col gap-6 max-w-[calc(100vw-60px)] md:max-w-none mx-auto">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-700 mb-2">{t('challenge_score.optimal_skill_order')}</h4>
                                            <div className="flex gap-0.5 md:gap-2 justify-between overflow-x-auto pb-2">
                                                {customResult.maxPermutation.map((skill, i) => (
                                                    <div key={i} className="flex flex-col items-center">
                                                        <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold shadow-sm border bg-white text-gray-700 border-gray-200">
                                                            {skill}%
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 mt-1 font-medium">{i + 1}{t('challenge_score.suffix_order')}</span>
                                                    </div>
                                                ))}
                                                <div className="flex flex-col items-center">
                                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold shadow-sm border bg-gray-100 text-gray-400 border-gray-200">
                                                        {skillLeader}%
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 mt-1 font-medium">{t('challenge_score.encore')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Skill Coefficients Graph (Horizontal Stacked Bar) */}
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-700 mb-2">{t('challenge_score.skill_score_ratio')}</h4>
                                            {(() => {
                                                const targetCoeffs = customResult.skillCoeffs.slice(0, 5);
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
                                                    label: `${i + 1}${t('challenge_score.suffix_order')}`,
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
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Calculation Results */}
            {sortedBatchResults && (
                <div className="w-full mt-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white text-gray-600 text-[10px] md:text-xs uppercase tracking-wider border-b border-gray-200">
                                    <th className="w-10 md:w-12 px-1 py-2 md:p-4 font-bold cursor-pointer hover:bg-gray-50 hover:text-indigo-600 transition-colors text-center select-none" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                                        <div className="flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </th>
                                    <th className="px-1 py-2 md:p-4 font-bold cursor-pointer hover:text-gray-900 transition-colors text-center select-none group" onClick={() => handleSort('songName')}>
                                        <div className="flex items-center justify-center gap-1 md:gap-2">
                                            {t('challenge_score.song_name')}
                                            <span className={`transition-opacity duration-200 ${sortConfig.key === 'songName' ? 'opacity-100 text-pink-500' : 'opacity-0 group-hover:opacity-50'}`}>
                                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </th>
                                    <th className="px-1 py-2 md:p-4 font-bold cursor-pointer hover:text-gray-900 transition-colors text-center select-none group" onClick={() => handleSort('max')}>
                                        <div className="flex items-center justify-center gap-1 md:gap-2">
                                            {t('challenge_score.max_score')}
                                            <span className={`transition-opacity duration-200 ${sortConfig.key === 'max' ? 'opacity-100 text-pink-500' : 'opacity-0 group-hover:opacity-50'}`}>
                                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </th>
                                    <th className="px-1 py-2 md:p-4 font-bold cursor-pointer hover:text-gray-900 transition-colors text-center select-none group" onClick={() => handleSort('min')}>
                                        <div className="flex items-center justify-center gap-1 md:gap-2">
                                            {t('challenge_score.min_score')}
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
                                                <td className="px-1 py-4 md:p-4 text-center text-gray-400">
                                                    {isExpanded ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto text-pink-500" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </td>
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
                                                                } : res.difficulty === 'hard' ? {
                                                                    border: '2px solid #ffcc00',
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
                                                    <td colSpan="4" className="p-2 md:p-4 border-t border-gray-100">
                                                        <div className="flex flex-col gap-6 max-w-[calc(100vw-60px)] md:max-w-none mx-auto">
                                                            {/* Optimal Skill Order */}
                                                            <div>
                                                                <h4 className="text-sm font-bold text-gray-700 mb-2">{t('challenge_score.optimal_skill_order')}</h4>
                                                                <div className="flex gap-0.5 md:gap-2 overflow-x-auto pb-2 justify-between md:justify-start">
                                                                    {/* Slots 1-5 */}
                                                                    {res.maxPermutation.map((skill, i) => (
                                                                        <div key={i} className="flex flex-col items-center flex-1 min-w-0">
                                                                            <div className="w-11 h-11 max-[375px]:w-9 max-[375px]:h-9 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-bold text-sm max-[375px]:text-xs md:text-base shadow-sm border bg-white text-gray-700 border-gray-200">
                                                                                {skill}%
                                                                            </div>
                                                                            <span className="text-[10px] max-[375px]:text-[9px] text-gray-500 mt-1 font-medium whitespace-nowrap">
                                                                                {i + 1}{t('challenge_score.suffix_order')}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                    {/* Encore Slot */}
                                                                    <div className="flex flex-col items-center flex-1 min-w-0">
                                                                        <div className="w-11 h-11 max-[375px]:w-9 max-[375px]:h-9 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-bold text-sm max-[375px]:text-xs md:text-base shadow-sm border bg-gray-100 text-gray-400 border-gray-200">
                                                                            {skillLeader}%
                                                                        </div>
                                                                        <span className="text-[10px] max-[375px]:text-[9px] text-gray-400 mt-1 font-medium whitespace-nowrap">
                                                                            {t('challenge_score.encore')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Skill Coefficients Graph (Horizontal Stacked Bar) */}
                                                            <div>
                                                                <h4 className="text-sm font-bold text-gray-700 mb-2">{t('challenge_score.skill_score_ratio')}</h4>
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
                                                                        label: `${i + 1}${t('challenge_score.suffix_order')}`,
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
                                {t('challenge_score.prev')}
                            </button>
                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`w-8 h-8 rounded-md text-sm font-bold transition-all duration-200 ${currentPage === page
                                            ? 'bg-blue-500 text-white shadow-md scale-105'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-blue-200'
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
                                {t('challenge_score.next')}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-6 text-center text-lg">
                <span style={{ fontWeight: 'bold' }}>
                    <a target="_blank" rel="noopener noreferrer" href={language === 'ko' ? "https://card.rilaksekai.com/card/theory/challenge" : "https://3-3.dev/sekai/top-deck"} className="text-blue-500 hover:underline">
                        {t('challenge_score.theory_deck_link')}
                    </a>
                </span>
                <br />
                <span style={{ fontWeight: 'bold' }}>
                    <a target="_blank" rel="noopener noreferrer" href="https://youtu.be/Vj1XXx1uemQ" className="text-blue-500 hover:underline">
                        {t('challenge_score.high_score_link')}
                    </a>
                </span>
                <br /><br />
            </div>
        </div>
    );
}

export default ChallengeScoreTab;
