
import React, { useState, useEffect } from 'react';
import { InputTableWrapper, InputRow } from './common/InputComponents';
import { parseEnvyCsv, generateOptions, solveScoreArt, sortSolutions, MY_SEKAI_POWERS, MY_SEKAI_REQ_MULTIPLIERS } from '../utils/scoreArtLogic';

const ScoreArtTab = ({ surveyData, setSurveyData }) => {
    const [currentEP, setCurrentEP] = useState(surveyData.currentEP || '');
    const [targetEP, setTargetEP] = useState(surveyData.targetEP || '');
    const [maxBonus, setMaxBonus] = useState(surveyData.maxBonus || '300');
    const [zeroScoreOnly, setZeroScoreOnly] = useState(surveyData.zeroScoreOnly || false);
    const [allowNonMod5, setAllowNonMod5] = useState(surveyData.allowNonMod5 || false);

    const [csvData, setCsvData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
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
                setError('데이터 파일을 불러오는데 실패했습니다.');
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        setSurveyData(prev => ({
            ...prev,
            currentEP,
            targetEP,
            maxBonus,
            zeroScoreOnly,
            allowNonMod5
        }));
    }, [currentEP, targetEP, maxBonus, zeroScoreOnly, allowNonMod5, setSurveyData]);

    const calculate = () => {
        setError('');
        setSolutions([]);
        setCurrentPage(1);

        if (!csvData) {
            setError('데이터가 로드되지 않았습니다.');
            return;
        }

        const cur = parseInt(currentEP, 10);
        const tgt = parseInt(targetEP, 10);
        const bonus = parseInt(maxBonus, 10);

        if (isNaN(cur) || isNaN(tgt)) {
            setError('현재 점수와 목표 점수를 입력해주세요.');
            return;
        }
        if (tgt <= cur) {
            setError('목표 점수는 현재 점수보다 커야 합니다.');
            return;
        }

        const gap = tgt - cur;
        setCalculating(true);

        // Async calculation to prevent UI freeze
        setTimeout(() => {
            try {
                const options = generateOptions(csvData, bonus, zeroScoreOnly);
                const rawSolutions = solveScoreArt(gap, options, allowNonMod5);
                const sorted = sortSolutions(rawSolutions, allowNonMod5);
                setSolutions(sorted);
                setCalculating(false);
            } catch (err) {
                console.error(err);
                setError('계산 중 오류가 발생했습니다.');
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
    const openDetails = (item) => {
        setSelectedItem(item);
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
        <div className="score-art-tab">
            <InputTableWrapper>
                <InputRow
                    label="현재 포인트"
                    value={currentEP}
                    onChange={(e) => setCurrentEP(e.target.value)}
                    placeholder="예: 10000"
                />
                <InputRow
                    label="목표 포인트"
                    value={targetEP}
                    onChange={(e) => setTargetEP(e.target.value)}
                    placeholder="예: 12000"
                />
                <InputRow
                    label="최대 배수 (%)"
                    value={maxBonus}
                    onChange={(e) => setMaxBonus(e.target.value)}
                    placeholder="예: 300"
                />
            </InputTableWrapper>

            <div style={{ margin: '15px 0', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={zeroScoreOnly}
                        onChange={(e) => setZeroScoreOnly(e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                    />
                    엔비 0점만 사용 (노트 치지 않기)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={allowNonMod5}
                        onChange={(e) => setAllowNonMod5(e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                    />
                    배수가 5의 배수가 아닌 경우도 계산
                </label>
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8rem', color: '#e74c3c', marginBottom: '10px', lineHeight: '1.4' }}>
                    배수에 소수점이 생기지 않도록 주의(월링 서폿덱 or 1,3 마랭) <br />
                    마이세카이 1불만 써보고 점수 확인 후 진행
                </div>
                <a
                    href="https://docs.google.com/spreadsheets/d/1om--O7_NqvvQ6TDg1jrsjKMVBR_s1j1o/edit?usp=sharing&ouid=113023731854367624519&rtpof=true&sd=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-block', marginBottom: '10px', fontSize: '0.9rem', color: '#3498db', textDecoration: 'underline' }}
                >
                    엔비 점수표
                </a>
                <br />
                <button
                    onClick={calculate}
                    disabled={loading || calculating}
                    style={{
                        padding: '10px 20px',
                        fontSize: '1rem',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        opacity: (loading || calculating) ? 0.7 : 1
                    }}
                >
                    {calculating ? '계산 중...' : '계산하기'}
                </button>
            </div>

            {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}

            {solutions.length > 0 && (
                <div className="results-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '10px', color: '#2c3e50', fontWeight: 'bold' }}>

                    </h3>
                    {currentSolutions.map((sol, idx) => {
                        const grouped = groupItems(sol.combination);
                        return (
                            <div key={idx} className="result-item" style={{
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                backgroundColor: '#ffffff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    padding: '12px 15px',
                                    borderBottom: '1px solid #f0f0f0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: '#fafafa'
                                }}>
                                    <span style={{ fontWeight: 'bold', color: '#555' }}>#{indexOfFirstItem + idx + 1}</span>
                                    <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                                        엔비 {sol.envyGames}판 | {sol.totalFire}불
                                    </div>
                                </div>
                                <div style={{ padding: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                    {grouped.map((g, gIdx) => (
                                        <div
                                            key={gIdx}
                                            onClick={() => openDetails(g.item)}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                backgroundColor: g.item.type === 'mysekai' ? '#e8f8f5' : '#f3e5f5',
                                                color: g.item.type === 'mysekai' ? '#16a085' : '#8e44ad',
                                                border: `1px solid ${g.item.type === 'mysekai' ? '#a3e4d7' : '#d7bde2'}`,
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            {g.item.ep}pt <span style={{ fontSize: '1.0em', opacity: 0.8, fontWeigh: 'bold' }}>x{g.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '10px' }}>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                <button
                                    key={number}
                                    onClick={() => paginate(number)}
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid #ddd',
                                        backgroundColor: currentPage === number ? '#3498db' : 'white',
                                        color: currentPage === number ? 'white' : '#333',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        fontWeight: currentPage === number ? 'bold' : 'normal'
                                    }}
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
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    backdropFilter: 'blur(2px)'
                }} onClick={closeDetails}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        maxWidth: '90%',
                        maxHeight: '85%',
                        width: '500px',
                        overflowY: 'auto',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        display: 'flex',
                        flexDirection: 'column'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                            <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.2rem' }}>
                                {selectedItem.ep}pt 상세 정보
                            </h3>
                        </div>

                        <div style={{ padding: '20px' }}>
                            {selectedItem.type === 'mysekai' && (
                                <div>
                                    <p style={{ marginBottom: '15px', fontWeight: 'bold', color: '#16a085', fontSize: '1rem' }}>
                                        마이세카이
                                    </p>
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.95rem' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                                <th style={{ padding: '12px', borderBottom: '2px solid #e9ecef', textAlign: 'left', color: '#495057' }}>종합력</th>
                                                <th style={{ padding: '12px', borderBottom: '2px solid #e9ecef', textAlign: 'right', color: '#495057' }}>필요 배수</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedItem.mySekaiDetails[0].validReqs.map((req, idx) => {
                                                const power = MY_SEKAI_POWERS[req.powerIdx];
                                                const nextPower = MY_SEKAI_POWERS[req.powerIdx + 1];
                                                const powerRange = nextPower
                                                    ? `${power}만 ~ ${nextPower - 0.1}만`
                                                    : `${power}만 이상`;

                                                const nextEp = selectedItem.ep + 500;
                                                const nextReqs = MY_SEKAI_REQ_MULTIPLIERS[nextEp];
                                                const nextMult = nextReqs ? nextReqs[req.powerIdx] : null;

                                                const multDisplay = nextMult
                                                    ? `${req.reqMult}% ~ ${nextMult - 1}%`
                                                    : `${req.reqMult}% ~`;

                                                return (
                                                    <tr key={idx}>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f3f5', color: '#333' }}>{powerRange}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f3f5', textAlign: 'right', fontWeight: 'bold', color: '#2c3e50' }}>{multDisplay}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {selectedItem.type === 'envy' && (
                                <div>
                                    <p style={{ marginBottom: '15px', fontWeight: 'bold', color: '#8e44ad', fontSize: '1rem' }}>
                                        엔비 (이지 솔로)
                                    </p>
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.95rem' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                                <th style={{ padding: '12px', borderBottom: '2px solid #e9ecef', textAlign: 'center', color: '#495057' }}>불</th>
                                                <th style={{ padding: '12px', borderBottom: '2px solid #e9ecef', textAlign: 'center', color: '#495057' }}>보너스</th>
                                                <th style={{ padding: '12px', borderBottom: '2px solid #e9ecef', textAlign: 'right', color: '#495057' }}>점수 범위</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedItem.envyDetails.map((d, idx) => (
                                                d.details.map((sub, subIdx) => (
                                                    <tr key={`${idx}-${subIdx}`}>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f3f5', textAlign: 'center', color: '#333' }}>{d.energy}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f3f5', textAlign: 'center', color: '#333' }}>{sub.bonus}%</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f3f5', textAlign: 'right', fontWeight: 'bold', color: '#2c3e50' }}>
                                                            {sub.minScore} ~ {sub.maxScore}
                                                        </td>
                                                    </tr>
                                                ))
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '15px 20px', borderTop: '1px solid #eee', textAlign: 'right', backgroundColor: '#fafafa', borderRadius: '0 0 12px 12px' }}>
                            <button
                                onClick={closeDetails}
                                style={{
                                    padding: '8px 24px',
                                    backgroundColor: '#95a5a6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '0.9rem',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#7f8c8d'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#95a5a6'}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScoreArtTab;
