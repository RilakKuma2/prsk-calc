import React, { useState, useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { InputTableWrapper, InputRow } from '../common/InputComponents';
import { useTranslation } from '../../contexts/LanguageContext';

// Register the plugin
Chart.register(ChartDataLabels);

// Helper functions
function combination(n, k) {
    if (k > n) return 0;
    if (k === 0 || k === n) return 1;
    let result = 1;
    for (let i = 1; i <= k; i++) {
        result *= (n - i + 1) / i;
    }
    return result;
}

function calculatePickupProbability(pickupProbability, pickupCount, attemptCount, targetPickup) {
    const probabilityFactor = 1 - pickupProbability * (pickupCount - targetPickup);
    const result = Math.pow(probabilityFactor, attemptCount);
    return result;
}

function numberToKorean(number) {
    var inputNumber = number < 0 ? false : number;
    var unitWords = ['', '만', '억', '조', '경', '해', '자', '양'];
    var splitUnit = 10000;
    var splitCount = unitWords.length;
    var resultString = '';

    for (var i = splitCount - 1; i >= 0; i--) {
        var unitResult = (inputNumber % Math.pow(splitUnit, i + 1)) / Math.pow(splitUnit, i);
        unitResult = Math.floor(unitResult);
        if (unitResult > 0) {
            resultString = String(unitResult) + unitWords[i];
            break;
        }
    }

    return resultString;
}

const GachaProbability = ({ surveyData, setSurveyData }) => {
    const { t } = useTranslation();

    // State for inputs
    const [pickupProb, setPickupProb] = useState(surveyData.pickupProb || '');
    const [pickupCount, setPickupCount] = useState(surveyData.pickupCount || '');
    const [attemptCount, setAttemptCount] = useState(surveyData.attemptCount || '');
    const [pityCount, setPityCount] = useState(surveyData.pityCount || '');

    // State for results
    const [resultHtml, setResultHtml] = useState([]);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // Update surveyData when inputs change
    useEffect(() => {
        setSurveyData({
            ...surveyData,
            pickupProb,
            pickupCount,
            attemptCount,
            pityCount
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pickupProb, pickupCount, attemptCount, pityCount]);

    // Calculation and Chart Update Logic
    useEffect(() => {
        const probVal = parseFloat(pickupProb === '' ? '0.4' : pickupProb) / 100;
        const pickupCountVal = parseInt(pickupCount === '' ? '3' : pickupCount);
        const attemptCountVal = parseInt(attemptCount === '' ? '200' : attemptCount);
        const pityCountVal = parseInt(pityCount === '' ? '0' : pityCount);

        let newResultHtml = [];
        let pro = [];

        if (pickupCountVal > 29) {
            newResultHtml.push({ type: 'error', text: t('gacha.error_too_many_pickups') });
        } else {
            // Logic from calculate()
            let com = [];
            com[0] = calculatePickupProbability(probVal, pickupCountVal, attemptCountVal, 0);

            for (let n = 1; n <= pickupCountVal; n++) {
                let sum = 0;
                for (let k = 0; k < n; k++) {
                    sum += com[k] * combination(n, k);
                }
                com[n] = calculatePickupProbability(probVal, pickupCountVal, attemptCountVal, n) - sum;
            }

            for (let m = 0; m <= pickupCountVal; m++) {
                let probability = com[m - pityCountVal] * combination(pickupCountVal, m - pityCountVal) * 100;

                if (m === pickupCountVal) {
                    probability = 0;
                    for (let n = 0; n <= pityCountVal; n++) {
                        probability += com[m - n] * combination(pickupCountVal, m - n) * 100;
                    }
                }

                if (pityCountVal > m) probability = 0;
                if (attemptCountVal < m) probability = 0;

                pro[m] = probability;

                if (probability < 0.01 && probability > 0) {
                    let proba2 = 1 / probability * 100;
                    let numberText = numberToKorean(proba2);

                    newResultHtml.push({
                        type: 'fraction',
                        count: m,
                        val: numberText,
                    });
                } else if (probability === 0) {
                    newResultHtml.push({
                        type: 'none',
                        count: m
                    });
                } else {
                    newResultHtml.push({
                        type: 'percent',
                        count: m,
                        val: probability.toFixed(2)
                    });
                }
            }

            let maxpity = attemptCountVal / 200;
            if (pityCountVal > maxpity) {
                newResultHtml.push({ type: 'error', text: t('gacha.error_pity_too_high') });
            }
        }

        setResultHtml(newResultHtml);
        updateChart(pro, pickupCountVal);

    }, [pickupProb, pickupCount, attemptCount, pityCount, t]);

    const updateChart = (pro, pickupCountVal) => {
        if (!chartRef.current) return;

        const ctx = chartRef.current.getContext('2d');

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const total = pro.reduce((sum, value) => sum + value, 0);
        const percentages = pro.map(value => ((value / total) * 100).toFixed(2));

        let cumulative = total;
        const cumulativeData = pro.map(value => {
            const current = cumulative;
            cumulative -= value;
            return current;
        });

        // Background and Border Colors
        const bgColors = [
            'rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)',
            'rgba(255, 99, 71, 0.2)', 'rgba(60, 179, 113, 0.2)', 'rgba(106, 90, 205, 0.2)',
            'rgba(123, 104, 238, 0.2)'
        ];
        const borderColors = [
            'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 71, 1)', 'rgba(60, 179, 113, 1)', 'rgba(106, 90, 205, 1)',
            'rgba(123, 104, 238, 1)'
        ];

        const extendedBgColors = [...bgColors];
        const extendedBorderColors = [...borderColors];
        while (extendedBgColors.length < pro.length) {
            extendedBgColors.push(...bgColors);
            extendedBorderColors.push(...borderColors);
        }

        chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: percentages.map((value, index) => `${index}${t('gacha.suffix_pickup')}\n${((cumulativeData[index] / total) * 100).toFixed(1)}%`),
                datasets: [{
                    data: pro,
                    backgroundColor: extendedBgColors.slice(0, pro.length),
                    borderColor: extendedBorderColors.slice(0, pro.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: function (tooltipItem) {
                                const value = percentages[tooltipItem.dataIndex];
                                return `${value}%`;
                            }
                        }
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'start',
                        font: {
                            size: 11,
                            weight: 'bold',
                        },
                        display: function (context) {
                            return context.dataset.data[context.dataIndex] / context.chart._metasets[0].total * 100 >= 1;
                        },
                        formatter: function (value, context) {
                            return `${context.chart.data.labels[context.dataIndex]}`;
                        }
                    }
                }
            }
        });
    };

    return (
        <div id="gacha-probability-content" className="p-4 space-y-4">
            <InputTableWrapper>
                <InputRow
                    label={t('gacha.pickup_prob')}
                    value={pickupProb}
                    onChange={e => setPickupProb(e.target.value)}
                    placeholder="0.4"
                    suffix="%"
                />
                <InputRow
                    label={t('gacha.pickup_count')}
                    value={pickupCount}
                    onChange={e => setPickupCount(e.target.value)}
                    placeholder="3"
                    min="1"
                />
                <InputRow
                    label={t('gacha.attempt_count')}
                    value={attemptCount}
                    onChange={e => setAttemptCount(e.target.value)}
                    placeholder="200"
                    min="1"
                />
                <InputRow
                    label={t('gacha.pity_count')}
                    value={pityCount}
                    onChange={e => setPityCount(e.target.value)}
                    placeholder="0"
                    min="0"
                />
            </InputTableWrapper>

            <div className="text-center space-y-2 text-gray-700">
                {resultHtml.map((item, idx) => (
                    <div key={idx} className="text-lg">
                        {item.type === 'error' ? (
                            <span className="font-bold text-red-500">{item.text}</span>
                        ) : item.type === 'fraction' ? (
                            <>
                                <span className="font-bold">{item.count}</span>{t('gacha.pickup_probability')}: <span className="font-bold">{item.val} {t('gacha.fraction')}</span>
                            </>
                        ) : item.type === 'none' ? (
                            <>
                                <span className="font-bold">{item.count}</span>{t('gacha.pickup_probability')}: {t('gacha.none')}
                            </>
                        ) : (
                            <>
                                <span className="font-bold">{item.count}</span>{t('gacha.pickup_probability')}: <span className="font-bold">{item.val}%</span>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <div className="w-[85%] max-w-[400px] mx-auto relative h-64 sm:h-80">
                <canvas ref={chartRef} id="myPieChart"></canvas>
            </div>

            <div className="text-center text-gray-500 text-base mt-2">
                {t('gacha.chart_cumulative')}
            </div>
        </div>
    );
};

export default GachaProbability;
