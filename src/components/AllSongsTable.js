import React, { useState, useEffect, useMemo } from 'react';
import { calculateScoreRange } from '../utils/calculator';
import { SONG_OPTIONS } from '../utils/songs';
import musicMetas from '../data/music_metas.json';
import { LiveType, EventCalculator, EventType } from 'sekai-calculator';
import { useTranslation } from '../contexts/LanguageContext';

const FIRE_MULTIPLIERS = {
    0: 1,
    1: 5,
    2: 10,
    3: 15,
    4: 20,
    5: 25,
    6: 27,
    7: 29,
    8: 31,
    9: 33,
    10: 35
};
const DIFFICULTY_COLORS = {
    master: { backgroundColor: '#cc33ff', color: '#FFFFFF' },
    append: { background: 'linear-gradient(to bottom right, #ad92fd, #fe7bde)', color: '#FFFFFF' },
    expert: { backgroundColor: '#ff4477', color: '#FFFFFF' },
    hard: { backgroundColor: '#ffcc00', color: '#FFFFFF' },
    normal: { backgroundColor: '#33ccff', color: '#FFFFFF' },
    easy: { backgroundColor: '#13d675', color: '#FFFFFF' },
    best: { backgroundColor: '#9ca3af', color: '#FFFFFF' } // Gray for Best
};

const DIFFICULTY_LABELS = {
    master: 'MAS',
    append: 'APD',
    expert: 'EX',
    hard: 'HRD',
    normal: 'NRM',
    easy: 'EASY',
    best: '난이도 설정'
};


const UNIT_COLORS = {
    'L/n': '#4455dd',       // Leo/need
    'MMJ': '#88dd44',                   // MORE MORE JUMP!
    'VBS': '#ee1166',                 // Vivid BAD SQUAD
    'WxS': '#ff9900',             // Wonderlands×Showtime
    'N25': '#884499',         // 25-ji, Nightcord de.                // VIRTUAL SINGER
    'Oth': '#333333',
    'none': '#999999',                   // Other/Instrumental
};

const AllSongsTable = ({ isVisible, language, power, effi, skills }) => {
    const { t } = useTranslation();
    const [results, setResults] = useState([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [usedParams, setUsedParams] = useState(null); // { power, effi, skillLeader }
    const [targetDifficulty, setTargetDifficulty] = useState('best'); // 'best', 'easy', ...
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc'
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const itemsPerPage = 10;

    useEffect(() => {
        if (isVisible) {
            handleRefresh();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible, targetDifficulty, sortOrder]); // Added targetDifficulty and sortOrder to dependencies

    // Reset pagination when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const normalize = (str) => {
        if (!str) return '';
        return str.normalize('NFC').toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[\u3041-\u3096]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));
    };

    const filteredResults = useMemo(() => {
        if (!searchQuery) return results;
        const term = normalize(searchQuery);
        return results.filter(row =>
            (row.name && normalize(row.name).includes(term)) ||
            (row.title_jp && normalize(row.title_jp).includes(term)) ||
            (row.title_hi && normalize(row.title_hi).includes(term)) ||
            (row.title_hangul && normalize(row.title_hangul).includes(term))
        );
    }, [results, searchQuery]);

    // Re-trigger calculation
    const handleRefresh = () => {
        setIsCalculating(true);
        setResults([]);
        setUsedParams(null);
        setCurrentPage(1); // Reset page on refresh
        setTimeout(() => {
            calculateAll();
        }, 100);
    };

    const calculateAll = () => {
        // Defaults if empty
        // Power: 25.5k -> 255000
        // Effi: 250%
        // Skills: 200% (If skills array is all 0 or empty, we assume a default distribution? 
        // The prop 'skills' passed from PowerTab should already handle the "200" logic if we pass the right internal value default there.
        // However, if we do it here:

        let powerVal = parseFloat(power);
        if (isNaN(powerVal) || powerVal === 0) powerVal = 25.5; // 25.5 man = 255000. Input is usually regular number? PowerTab input is raw number?
        // Wait, PowerTab inputs are usually raw. If input is '255000', parsFloat is 255000.
        // If user inputs nothing, `power` prop is ''.
        // User said "25.5만 250 200".
        // 25.5만 = 255000. PowerTab usually takes "Total Power".

        // Let's handle the extraction:
        let finalPower = (power === '' || power === null || isNaN(parseFloat(power))) ? 255000 : parseFloat(power);
        if (finalPower < 1000 && finalPower > 0) finalPower *= 10000;

        const finalEffi = (effi === '' || effi === null || isNaN(parseFloat(effi))) ? 250 : parseFloat(effi);

        // Skills: The prop `skills` is an array [leader, m2, m3, m4, m5].
        // If we assume "200" default means Internal Value 200, we need to know how that maps.
        // If PowerTab handles the default before passing `skills`, that's better. 
        // But if we need to enforce "200" here when `skills` is "empty":
        // If the user cleared inputs, `skills` might be [0,0,0,0,0] or similar.
        // We will trust `PowerTab` to pass the correct array for "200" if inputs are empty.
        // BUT, checking for [0,0,0,0,0] might be safe.
        let finalSkills = skills;
        if (!skills || skills.every(s => !s)) {
            // "200" typically might mean 120% leader + 20% * 4? Or 100% * 5? 
            // For "internal value 200", getSkillsArray usually does: Leader 100 + (IV - 100)/4? No.
            // Let's assume standard meta: 130/110/110/110/110 or something?
            // User said "200". Standard "Internal Value" usually means the simple single number input.
            // If simple input is 200.
            // We'll calculate it: 
            // Actually, let's implement the default override in PowerTab where we generate the prop.
            // So here we use finalSkills as passed.
        }

        // Skills: passed prop is array. If simplistic "200" logic was needed if empty, PowerTab handles it or we trust input.
        // But we need to know what to display.
        // If it's simple mode, all skills are same.
        const skillLeader = finalSkills && finalSkills.length > 0 ? finalSkills[0] : 0; // Display purpose

        // We assume 5 Fire for efficiency calculation as requested
        const fireMultiplier = FIRE_MULTIPLIERS[5];

        const calculatedResults = [];
        const diffsToCheck = targetDifficulty === 'best'
            ? ['easy', 'normal', 'hard', 'expert', 'master', 'append']
            : [targetDifficulty];

        SONG_OPTIONS.forEach(song => {
            const songResults = [];

            diffsToCheck.forEach(diff => {
                // Check if meta exists for this diff
                const meta = musicMetas.find(m => m.music_id === song.id && m.difficulty === diff);
                if (!meta) return;

                try {
                    const input = {
                        songId: song.id,
                        difficulty: diff,
                        totalPower: finalPower,
                        skillLeader: finalSkills[0],
                        skillMember2: finalSkills[1],
                        skillMember3: finalSkills[2],
                        skillMember4: finalSkills[3],
                        skillMember5: finalSkills[4],
                    };

                    const range = calculateScoreRange(input, LiveType.MULTI);
                    if (range) {
                        const minEP = EventCalculator.getEventPoint(
                            LiveType.MULTI,
                            EventType.MARATHON,
                            range.min,
                            meta.event_rate,
                            finalEffi,
                            fireMultiplier
                        );
                        const maxEP = EventCalculator.getEventPoint(
                            LiveType.MULTI,
                            EventType.MARATHON,
                            range.max,
                            meta.event_rate,
                            finalEffi,
                            fireMultiplier
                        );

                        songResults.push({
                            difficulty: diff,
                            minEP,
                            maxEP,
                            range
                        });
                    }
                } catch (e) {
                    // Ignore errors
                }
            });

            if (songResults.length > 0) {
                // Determine representation based on logic
                // If specific diff, songResults has 1 item (or 0).
                // If best, sort by maxEP desc.
                songResults.sort((a, b) => b.maxEP - a.maxEP);
                const best = songResults[0];

                // ... inside AllSongsTable component ...

                calculatedResults.push({
                    id: song.id,
                    name: song.name,
                    title_jp: song.title_jp,
                    title_hi: song.title_hi,
                    title_hangul: song.title_hangul,
                    length: song.length,
                    mv: song.mv,
                    unit: song.unit, // Pass unit info
                    ...best,
                    allDiffs: songResults
                });
            }
        });

        // Set used params state
        setUsedParams({
            power: finalPower,
            effi: finalEffi,
            skills: finalSkills
        });

        // Initial Sort
        sortResults(calculatedResults, sortOrder);
        setIsCalculating(false);
    };

    const sortResults = (data, order) => {
        const sorted = [...data].sort((a, b) => {
            if (order === 'desc') return b.maxEP - a.maxEP;
            return a.maxEP - b.maxEP;
        });
        setResults(sorted);
    };

    const handleSortToggle = () => {
        const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        setSortOrder(newOrder);
        sortResults(results, newOrder);
    };

    const handleRowClick = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const currentItems = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredResults.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredResults, currentPage]);

    const totalPages = Math.ceil(filteredResults.length / itemsPerPage);



    if (!isVisible) return null;

    return (
        <div className="w-full mt-2 animate-fade-in">
            {/* Deck Spec Display */}

            <div className="w-full">
                {/* Header Control */}
                {/* Search Input Row (New Line) */}
                {isSearchOpen && (
                    <div className="bg-white px-4 py-2 rounded-t-lg border-b border-gray-200 animate-fade-in-down flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={
                                language === 'ko'
                                    ? '곡 제목, 히라가나, 한글 발음으로 검색...'
                                    : language === 'ja'
                                        ? '樂曲名'
                                        : 'Search by title...'
                            }
                            className="w-full text-sm outline-none bg-transparent"
                            autoFocus
                        />
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setIsSearchOpen(false);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Header Control */}
                <div className={`flex justify-between items-center bg-gray-50 px-4 py-2 border-b border-gray-200 ${isSearchOpen ? '' : 'rounded-t-lg'}`}>
                    <div className="flex items-center gap-2 relative">
                        {/* Search Trigger (Left of Difficulty) */}
                        {!isSearchOpen && (
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                title="Search"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        )}
                        {/* Badge Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="outline-none focus:ring-2 focus:ring-indigo-200 rounded-full"
                            >
                                <span
                                    className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide leading-tight shadow-sm w-auto whitespace-nowrap"
                                    style={DIFFICULTY_COLORS[targetDifficulty]}
                                >
                                    {targetDifficulty === 'best' ? t('power.difficulty_setting') : DIFFICULTY_LABELS[targetDifficulty]}
                                </span>
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsDropdownOpen(false)}
                                    ></div>
                                    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 p-2 z-20 flex flex-col gap-1 min-w-[100px]">
                                        {['best', 'master', 'expert', 'hard', 'normal', 'easy', 'append'].map(diff => (
                                            <button
                                                key={diff}
                                                onClick={() => {
                                                    setTargetDifficulty(diff);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-md w-full text-left transition-colors"
                                            >
                                                <span
                                                    className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide leading-tight shadow-sm w-auto min-w-[36px]"
                                                    style={DIFFICULTY_COLORS[diff]}
                                                >
                                                    {diff === 'best' ? t('power.difficulty_setting') : DIFFICULTY_LABELS[diff]}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>


                        <button
                            onClick={handleRefresh}
                            disabled={(() => {
                                if (!usedParams) return false;
                                let currentPower = (power === '' || power === null || isNaN(parseFloat(power))) ? 255000 : parseFloat(power);
                                if (currentPower < 1000 && currentPower > 0) currentPower *= 10000;
                                const currentEffi = (effi === '' || effi === null || isNaN(parseFloat(effi))) ? 250 : parseFloat(effi);

                                const isSame = (
                                    usedParams.power === currentPower &&
                                    usedParams.effi === currentEffi &&
                                    JSON.stringify(usedParams.skills) === JSON.stringify(skills)
                                );
                                return isSame;
                            })()}
                            className={`p-1.5 rounded transition-colors ${(() => {
                                if (!usedParams) return "text-indigo-600 hover:bg-indigo-50";
                                let currentPower = (power === '' || power === null || isNaN(parseFloat(power))) ? 255000 : parseFloat(power);
                                if (currentPower < 1000 && currentPower > 0) currentPower *= 10000;
                                const currentEffi = (effi === '' || effi === null || isNaN(parseFloat(effi))) ? 250 : parseFloat(effi);

                                const isSame = (
                                    usedParams.power === currentPower &&
                                    usedParams.effi === currentEffi &&
                                    JSON.stringify(usedParams.skills) === JSON.stringify(skills)
                                );
                                return isSame ? "text-gray-300 cursor-not-allowed" : "text-indigo-600 hover:bg-indigo-50";
                            })()}`}
                            title="Refresh"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        {/* Refresh Label */}
                        <span className="text-[10px] md:text-xs text-gray-500 font-medium ml-1">
                            {(() => {
                                if (!usedParams) return "조건 수정 후 새로고침"; // Fallback if t not available yet? Add t as prop or hook check.
                                // Wait, AllSongsTable doesn't use t hook directly? Just language prop.
                                const labels = {
                                    ko: '조건 수정 후 새로고침',
                                    en: 'Refresh after modifying',
                                    ja: '条件変更後に更新'
                                };
                                return labels[language] || labels.ko;
                            })()}
                        </span>
                    </div>

                    {usedParams && (() => {
                        const { power, effi, skills } = usedParams;
                        let pDisplay = (power / 10000).toFixed(1);
                        if (pDisplay.endsWith('.0')) pDisplay = pDisplay.slice(0, -2);
                        const suffixMap = { ko: '만', ja: '万', en: '0k' };
                        const suffix = suffixMap[language] || '만';
                        const internalLabel = { ko: '내부치', ja: '実効値', en: 'Skill' }[language] || '내부치';

                        // Calculate average if detailed
                        let displayedSkill = 0;
                        let isAvg = false;
                        if (skills && skills.length > 0) {
                            const sum = skills.reduce((a, b) => a + b, 0);
                            const avg = Math.round((sum / skills.length) * 10) / 10;
                            // Check if all are same
                            const allSame = skills.every(s => s === skills[0]);
                            if (allSame) {
                                displayedSkill = skills[0];
                            } else {
                                displayedSkill = avg;
                                isAvg = true;
                            }
                        }

                        return (
                            <div className="flex flex-col items-end justify-center leading-tight">
                                <div className="text-sm md:text-base font-black text-blue-600 tracking-tighter" style={{ fontFamily: 'sans-serif' }}>
                                    {pDisplay}{suffix}/{effi}%
                                </div>
                                <div className="text-[10px] md:text-xs font-bold text-blue-500">
                                    {internalLabel}:{displayedSkill}%{isAvg && <span className="text-[9px] font-normal ml-0.5">({language === 'ko' ? '평균' : 'avg'})</span>}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                <div className="overflow-hidden rounded-b-lg border border-gray-200 border-t-0">
                    {isCalculating ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-medium animate-pulse">Calculating...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-white text-gray-600 text-[10px] md:text-xs uppercase tracking-wider border-b border-gray-200">
                                    <th className="px-1 py-1 md:px-2 md:py-2 font-bold text-center select-none w-8">#</th>
                                    <th className="px-1 py-1 md:px-2 md:py-2 font-bold text-left select-none w-auto">{language === 'ko' ? '곡명' : 'Song'}</th>
                                    <th className="px-1 py-1 md:px-2 md:py-2 font-bold text-center select-none w-[50px] min-w-[50px] md:w-[70px] md:min-w-[70px]">{language === 'ko' ? '난이도' : 'Diff'}</th>
                                    <th className="px-1 py-1 md:px-2 md:py-2 font-bold text-center select-none w-[40px] min-w-[40px] md:w-[50px] md:min-w-[50px]">{language === 'ko' ? '길이' : 'Len'}</th>
                                    <th
                                        className="px-1 py-1 md:px-2 md:py-2 font-bold text-center select-none cursor-pointer hover:bg-gray-50 transition-colors group w-[80px] min-w-[80px] md:w-[140px] md:min-w-[140px]"
                                        onClick={handleSortToggle}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            {language === 'ko' ? '최대 이벤포' : 'Max EP'}
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {currentItems.map((res, idx) => {
                                    const rank = (currentPage - 1) * itemsPerPage + idx + 1;
                                    const isExpanded = expandedRow === res.id;
                                    return (
                                        <React.Fragment key={res.id}>
                                            <tr
                                                className={`hover:bg-gray-50 transition-colors duration-200 group/row cursor-pointer ${isExpanded ? 'bg-indigo-50/50' : ''}`}
                                                onClick={() => handleRowClick(res.id)}
                                            >
                                                <td
                                                    className="px-1 py-1 md:px-2 md:py-2 text-center text-white text-xs font-bold shadow-sm"
                                                    style={{ backgroundColor: UNIT_COLORS[res.unit] || '#9ca3af' }}
                                                >
                                                    {rank}
                                                </td>
                                                <td className="px-1 py-1 md:px-2 md:py-2 text-left align-middle max-w-[120px] md:max-w-[200px]">
                                                    <div className="flex items-center gap-1 w-full">
                                                        <span className="text-gray-800 text-[13px] md:text-base font-medium block truncate">
                                                            {language === 'ko' ? res.name : res.title_jp}
                                                        </span>
                                                        {res.mv === 3 && (
                                                            <span className="shrink-0 inline-flex items-center justify-center px-1 py-[1px] rounded text-[9px] font-bold border border-yellow-400 text-yellow-400 bg-slate-700 leading-none select-none">
                                                                3D
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-1 py-1 md:px-2 md:py-2 text-center align-middle">
                                                    <span
                                                        className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide leading-tight shadow-sm"
                                                        style={DIFFICULTY_COLORS[res.difficulty]}
                                                    >
                                                        {DIFFICULTY_LABELS[res.difficulty]}
                                                    </span>
                                                </td>
                                                <td className="px-1 py-1 md:px-2 md:py-2 text-center align-middle">
                                                    <span className="text-gray-500 text-xs font-medium">
                                                        {(() => {
                                                            if (!res.length) return '-';
                                                            const min = Math.floor(res.length / 60);
                                                            const sec = res.length % 60;
                                                            return `${min}:${sec.toString().padStart(2, '0')}`;
                                                        })()}
                                                    </span>
                                                </td>
                                                <td className="px-1 py-1 md:px-2 md:py-2 text-center align-middle">
                                                    <span className="text-blue-600 text-sm md:text-lg font-bold tracking-tight">
                                                        {res.maxEP.toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan="5" className="p-3">
                                                        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm max-w-sm mx-auto">
                                                            <table className="w-full text-xs">
                                                                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                                                    <tr>
                                                                        <th className="py-2 px-2 text-center">Diff</th>
                                                                        <th className="py-2 px-2 text-center">Min EP</th>
                                                                        <th className="py-2 px-2 text-center">Max EP</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {res.allDiffs.map(d => (
                                                                        <tr key={d.difficulty} className={d.difficulty === res.difficulty ? "bg-indigo-50" : ""}>
                                                                            <td className="py-1.5 px-2 text-center">
                                                                                <span
                                                                                    className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] text-white font-bold"
                                                                                    style={DIFFICULTY_COLORS[d.difficulty]}
                                                                                >
                                                                                    {DIFFICULTY_LABELS[d.difficulty]}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-1.5 px-2 text-center text-gray-500">
                                                                                {d.minEP.toLocaleString()}
                                                                            </td>
                                                                            <td className="py-1.5 px-2 text-center font-bold text-indigo-600">
                                                                                {d.maxEP.toLocaleString()}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                {filteredResults.length > 0 && !isCalculating && (
                    <div className="px-4 py-3 border border-t-0 border-gray-200 rounded-b-lg bg-gray-50 flex justify-center items-center gap-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <span className="text-xs font-medium text-gray-600">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllSongsTable;
