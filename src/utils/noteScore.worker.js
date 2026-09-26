/* eslint-env worker */
/* global globalThis */
import { prepareRules, prepareChart } from '../lib/liveScore';
import { calculateNoteResult, calculateNoteVariants } from './noteScoreCalculation';

const charts = new Map(), results = new Map();
let rulesPromise, localRulesPromise, challengeBundlePromise, bundledCharts;
const localChartKeys = new Set(['226-hard', '74-expert']);
async function load(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
        // Keep fresh HTTP cache entries, rather than revalidating every visit.
        const response = await fetch(url, { signal: controller.signal, cache: 'default' });
        if (!response.ok) throw new Error(`Note data HTTP ${response.status}`);
        return await response.json();
    } finally { clearTimeout(timer); }
}
function cache(map, key, value, limit) {
    map.delete(key); map.set(key, value);
    while (map.size > limit) map.delete(map.keys().next().value);
    return value;
}
function getRules(baseUrl) {
    if (!rulesPromise) rulesPromise = load(`${baseUrl}/rules.json?v=2`).then(prepareRules).catch(error => {
        rulesPromise = undefined;
        throw error;
    });
    return rulesPromise;
}
function getLocalRules(baseUrl) {
    if (!localRulesPromise) localRulesPromise = load(`${baseUrl}/rules.json`).then(prepareRules).catch(error => {
        localRulesPromise = undefined;
        throw error;
    });
    return localRulesPromise;
}
async function getChallengeBundle(baseUrl) {
    // One bundle attempt per worker; missing/failed bundles fall back to individual charts.
    if (!challengeBundlePromise) challengeBundlePromise = load(`${baseUrl}/challenge-top.json?v=1`).then(raw => {
        if (raw.schemaVersion !== 1 || !raw.charts || !raw.rules) throw new Error('Invalid challenge bundle');
        const rules = prepareRules(raw.rules);
        bundledCharts = raw.charts;
        rulesPromise = Promise.resolve(rules);
    }).catch(() => {});
    return challengeBundlePromise;
}
globalThis.onmessage = async ({ data: { id, baseUrl, localBaseUrl, input, mode } }) => {
    try {
        const resultKey = JSON.stringify([input, mode]);
        if (results.has(resultKey)) {
            globalThis.postMessage({ id, result: results.get(resultKey) }); return;
        }
        const key = `${input.songId}-${input.difficulty}`;
        let entry = charts.get(key);
        if (!entry) {
            const local = localChartKeys.has(key);
            if (!local && (mode === 'solo' || mode === 'challenge')) await getChallengeBundle(baseUrl);
            // The two main event charts and their rules ship with this site.
            const [rules, raw] = await Promise.all(local
                ? [getLocalRules(localBaseUrl), load(`${localBaseUrl}/charts/${key}.json`)]
                : [getRules(baseUrl), bundledCharts?.[key] ?? load(`${baseUrl}/charts/${key}.json?v=2`)]);
            if (raw.schemaVersion !== 2 || raw.musicId !== input.songId || raw.difficulty !== input.difficulty) throw new Error('Invalid note data');
            const chart = { ...raw, notes: raw.notes.map(([time, type]) => ({ time, type })) };
            entry = { chart, rules, prepared: prepareChart(chart, rules) };
        }
        cache(charts, key, entry, 192);
        const calculate = input.precomputeSkillPush ? calculateNoteVariants : calculateNoteResult;
        const result = calculate(entry.prepared, entry.chart, entry.rules, input, mode);
        cache(results, resultKey, result, 512);
        globalThis.postMessage({ id, result });
    } catch (error) { globalThis.postMessage({ id, error: error.message }); }
};
