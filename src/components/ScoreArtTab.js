
import React, { useState, useEffect } from 'react';
import { InputTableWrapper, InputRow } from './common/InputComponents';
import { parseEnvyCsv, generateOptions, solveScoreArt, sortSolutions, MY_SEKAI_POWERS, MY_SEKAI_REQ_MULTIPLIERS } from '../utils/scoreArtLogic';
import { useTranslation } from '../contexts/LanguageContext';

const ScoreArtTab = ({ surveyData, setSurveyData }) => {
    const { t } = useTranslation();
    const [currentEP, setCurrentEP] = useState(surveyData.currentEP || '');
    const [targetEP, setTargetEP] = useState(surveyData.targetEP || '');
    const [maxBonus, setMaxBonus] = useState(surveyData.maxBonus || '300');
    const [maxPower, setMaxPower] = useState(surveyData.maxPower || '');
    const [maxEnvyScore, setMaxEnvyScore] = useState(surveyData.maxEnvyScore || '');
    const [zeroScoreOnly, setZeroScoreOnly] = useState(surveyData.zeroScoreOnly || false);
    const [allowNonMod5, setAllowNonMod5] = useState(surveyData.allowNonMod5 || false);

    const [csvData, setCsvData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [hasCalculated, setHasCalculated] = useState(false);
    const [solutions, setSolutions] = useState([]);
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Load CSV
    useEffect(() => {
        fetch(process.env.PUBLIC_URL + '/envy.csv')
            .then(response => response.text())
            .then(text => {
                const parsed = parseEnvyCsv(text);
                setCsvData(parsed);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load envy.csv", err);
                setError(t('score_art.load_error'));
                setLoading(false);
            });
    }, [t]);

    useEffect(() => {
        setSurveyData(prev => ({
            ...prev,
            currentEP,
            targetEP,
            maxBonus,
            maxPower,
            maxEnvyScore,
            zeroScoreOnly,
            allowNonMod5
        }));
    }, [currentEP, targetEP, maxBonus, maxPower, maxEnvyScore, zeroScoreOnly, allowNonMod5, setSurveyData]);

    const calculate = () => {
        setError('');
        setSolutions([]);
        setHasCalculated(false);
        setCurrentPage(1);

        if (!csvData) {
            setError(t('score_art.data_not_loaded'));
            return;
        }

        const cur = parseInt(currentEP, 10);
        const tgt = parseInt(targetEP, 10);
        const bonus = parseInt(maxBonus || '300', 10);
        const power = parseFloat(maxPower || '25.5');
        const envyLimit = parseFloat(maxEnvyScore || '80');

        if (isNaN(cur) || isNaN(tgt)) {
            setError(t('score_art.input_error'));
            return;
        }
        if (tgt <= cur) {
            setError(t('score_art.target_error'));
            return;
        }

        const gap = tgt - cur;

        if (gap >= 100000) {
            setError(t('score_art.gap_error'));
            return;
        }
        setCalculating(true);

        // Async calculation to prevent UI freeze
        setTimeout(() => {
            try {
                const options = generateOptions(csvData, bonus, zeroScoreOnly, power, envyLimit);
                const rawSolutions = solveScoreArt(gap, options, allowNonMod5);
                const sorted = sortSolutions(rawSolutions, allowNonMod5);
                setSolutions(sorted);
                setHasCalculated(true);
                setCalculating(false);
            } catch (err) {
                console.error(err);
                setError(t('score_art.calc_error'));
                setCalculating(false);
            }
        }, 50);
    };

    // Helper to group items
    const groupItems = (combination) => {
        const map = new Map();
        combination.forEach(item => {
            const key = item.ep;
            if (!map.has(key)) {
                map.set(key, { item, count: 0 });
            }
            map.get(key).count++;
        });
        return Array.from(map.values()).sort((a, b) => {
            // MySekai first
            if (a.item.type === 'mysekai' && b.item.type !== 'mysekai') return -1;
            if (a.item.type !== 'mysekai' && b.item.type === 'mysekai') return 1;
            return b.item.ep - a.item.ep;
        });
    };

    // Modal Logic
    const openDetails = (groupedItem) => {
        setSelectedItem(groupedItem);
    };

    const closeDetails = () => {
        setSelectedItem(null);
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSolutions = solutions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(solutions.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="w-full max-w-3xl mx-auto pb-2">
            <div className="bg-white rounded-2xl p-6 mb-2">
                <InputTableWrapper>
                    <InputRow
                        label={t('score_art.current_ep')}
                        value={currentEP}
                        onChange={(e) => setCurrentEP(e.target.value)}
                        suffix="pt"
                        placeholder="171923316"
                    />
                    <InputRow
                        label={t('score_art.target_ep')}
                        value={targetEP}
                        onChange={(e) => setTargetEP(e.target.value)}
                        suffix="pt"
                        placeholder="172000414"
                    />
                    <InputRow
                        label={t('score_art.max_bonus')}
                        value={maxBonus}
                        onChange={(e) => setMaxBonus(e.target.value)}
                        placeholder="300"
                        suffix="%"
                    />
                    <InputRow
                        label={t('score_art.max_power')}
                        value={maxPower}
                        onChange={(e) => setMaxPower(e.target.value)}
                        placeholder="25.5"
                        suffix={t('score_art.suffix_man')}
                    />
                    <InputRow
                        label={t('score_art.max_envy_score')}
                        value={maxEnvyScore}
                        onChange={(e) => setMaxEnvyScore(e.target.value)}
                        placeholder="80"
                        suffix={t('score_art.suffix_man')}
                    />
                    <tr>
                        <td colSpan={2} className="text-center text-xs text-gray-400 pb-1 align-top leading-none">
                            {t('score_art.envy_tip')}
                        </td>
                    </tr>
                </InputTableWrapper>


                <div className="flex flex-col gap-1 items-center mt-3 mb-2">
                    <label className="flex items-start gap-2 cursor-pointer select-none text-left">
                        <input
                            type="checkbox"
                            checked={zeroScoreOnly}
                            onChange={(e) => setZeroScoreOnly(e.target.checked)}
                            className="w-4 h-4 mt-1 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <div className="flex flex-col">
                            <span className="text-gray-700">{t('score_art.zero_score_only')}</span>
                            <span className="text-xs text-gray-400">{t('score_art.zero_score_desc')}</span>
                        </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={allowNonMod5}
                            onChange={(e) => setAllowNonMod5(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-gray-700">{t('score_art.allow_non_mod5')}</span>
                    </label>
                </div>

                <div className="text-center">
                    <div
                        className="text-sm text-rose-500 mb-4 leading-relaxed bg-rose-50 py-2 px-4 rounded-lg inline-block"
                        dangerouslySetInnerHTML={{ __html: t('score_art.warning_text') }}
                    />
                    <div className="mb-6">
                        <a
                            href="https://docs.google.com/spreadsheets/d/1om--O7_NqvvQ6TDg1jrsjKMVBR_s1j1o/edit?usp=sharing&ouid=113023731854367624519&rtpof=true&sd=true"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ms text-blue-500 hover:text-blue-700 underline decoration-blue-300 hover:decoration-blue-700 underline-offset-2 transition-all font-bold"
                        >
                            {t('score_art.envy_table')}
                        </a>
                    </div>
                    <button
                        onClick={calculate}
                        disabled={loading || calculating}
                        className={`
                            px-8 py-3 text-base font-bold text-white rounded-xl shadow-md transition-all duration-200
                            ${loading || calculating
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                            }
                        `}
                    >
                        {calculating ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t('score_art.calculating')}
                            </span>
                        ) : t('score_art.calculate')}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-center mb-6 animate-fade-in-up">
                    {error}
                </div>
            )}

            {!loading && !calculating && hasCalculated && solutions.length === 0 && !error && (
                <div className="bg-gray-50 border border-gray-200 text-gray-500 px-4 py-8 rounded-xl text-center mb-6 animate-fade-in-up">
                    <div className="text-4xl mb-2">🤔</div>
                    <p className="font-bold text-lg">{t('score_art.no_results')}</p>
                    <p className="text-sm">{t('score_art.retry_tip')}</p>
                </div>
            )}

            {solutions.length > 0 && (
                <div className="space-y-4">
                    {currentSolutions.map((sol, idx) => {
                        const grouped = groupItems(sol.combination);
                        return (
                            <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-400 hover:shadow-md transition-all duration-200">
                                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-sm font-medium border border-emerald-100">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        {t('score_art.mysekai')} {sol.totalFire}{t('score_art.fire')}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-sm font-medium border border-gray-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                        {(() => {
                                            const envyItems = grouped.filter(g => g.item.type === 'envy');
                                            const hasOptimizable = envyItems.some(g => g.count >= 5);

                                            if (hasOptimizable) {
                                                let fire1 = 0;
                                                let fire0 = 0;
                                                envyItems.forEach(g => {
                                                    if (g.count >= 5) {
                                                        fire1 += Math.floor(g.count / 5);
                                                        fire0 += g.count % 5;
                                                    } else {
                                                        fire0 += g.count;
                                                    }
                                                });
                                                return t('score_art.envy_mix', { 0: fire1, 1: fire0 }).replace('{0}', fire1).replace('{1}', fire0);
                                            }
                                            return t('score_art.envy_solo', { 0: sol.envyGames }).replace('{0}', sol.envyGames);
                                        })()}
                                    </span>
                                </div>
                                <div className="p-4 flex flex-wrap gap-2">
                                    {grouped.map((g, gIdx) => (
                                        <div
                                            key={gIdx}
                                            onClick={() => openDetails(g)}
                                            className={`
                                                cursor-pointer px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-200 flex items-center gap-2
                                                ${g.item.type === 'mysekai'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                                }
                                            `}
                                        >
                                            <span>{g.item.ep.toLocaleString()} pt</span>
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${g.item.type === 'mysekai' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                                                x{g.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                <button
                                    key={number}
                                    onClick={() => paginate(number)}
                                    className={`
                                        w-10 h-10 rounded-lg text-sm font-bold transition-all duration-200
                                        ${currentPage === number
                                            ? 'bg-indigo-600 text-white shadow-md scale-105'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    {number}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Detail Modal */}
            {selectedItem && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in"
                    onClick={closeDetails}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {selectedItem.item.ep.toLocaleString()} pt {t('score_art.details')}
                            </h3>
                            <button onClick={closeDetails} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {selectedItem.item.type === 'mysekai' && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="w-2 h-8 rounded-full bg-teal-500"></span>
                                        <h4 className="font-bold text-teal-700 text-lg">{t('score_art.mysekai_full')}</h4>
                                    </div>
                                    <div className="overflow-hidden rounded-xl border border-gray-200">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-600 font-semibold">
                                                <tr>
                                                    <th className="px-4 py-3 border-b border-gray-200">{t('score_art.total_power')}</th>
                                                    <th className="px-4 py-3 border-b border-gray-200 text-right">{t('score_art.req_multiplier')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedItem.item.mySekaiDetails[0].validReqs.map((req, idx) => {
                                                    const power = MY_SEKAI_POWERS[req.powerIdx];
                                                    const nextPower = MY_SEKAI_POWERS[req.powerIdx + 1];
                                                    const powerRange = nextPower
                                                        ? `${power}${t('score_art.suffix_man')} ~ ${nextPower - 0.1}${t('score_art.suffix_man')}`
                                                        : `${power}${t('score_art.suffix_man')} ${t('score_art.or_more')}`;

                                                    const nextEp = selectedItem.item.ep + 500;
                                                    const nextReqs = MY_SEKAI_REQ_MULTIPLIERS[nextEp];
                                                    const nextMult = nextReqs ? nextReqs[req.powerIdx] : null;

                                                    const multDisplay = nextMult
                                                        ? `${req.reqMult}% ~ ${nextMult - 1}%`
                                                        : `${req.reqMult}% ~`;

                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 text-gray-700 font-medium">{powerRange}</td>
                                                            <td className="px-4 py-3 text-right text-indigo-600 font-bold">{multDisplay}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {selectedItem.item.type === 'envy' && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="w-2 h-8 rounded-full bg-blue-500"></span>
                                        <h4 className="font-bold text-blue-700 text-lg flex items-center">
                                            {t('score_art.envy_easy_solo')}
                                            <span className="ml-4 text-base font-bold text-emerald-600">
                                                {selectedItem.count < 5
                                                    ? t('score_art.envy_solo', { 0: selectedItem.count }).replace('{0}', selectedItem.count)
                                                    : t('score_art.envy_mix', { 0: Math.floor(selectedItem.count / 5), 1: selectedItem.count % 5 }).replace('{0}', Math.floor(selectedItem.count / 5)).replace('{1}', selectedItem.count % 5)
                                                }
                                            </span>
                                        </h4>
                                    </div>
                                    <div className="overflow-hidden rounded-xl border border-gray-200">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-600 font-semibold">
                                                <tr>
                                                    <th className="px-4 py-3 border-b border-gray-200 text-center">{t('score_art.fire')}</th>
                                                    <th className="px-4 py-3 border-b border-gray-200 text-center">{t('score_art.bonus')}</th>
                                                    <th className="px-4 py-3 border-b border-gray-200 text-right">{t('score_art.score_range')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedItem.item.envyDetails.map((d, idx) => (
                                                    d.details.map((sub, subIdx) => (
                                                        <tr key={`${idx}-${subIdx}`} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 text-center text-gray-700">{d.energy}</td>
                                                            <td className="px-4 py-3 text-center text-gray-700">{sub.bonus}%</td>
                                                            <td className="px-4 py-3 text-right text-indigo-600 font-bold font-mono">
                                                                {sub.minScore.toLocaleString()} ~ {sub.maxScore.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={closeDetails}
                                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition-colors"
                            >
                                {t('score_art.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScoreArtTab;
