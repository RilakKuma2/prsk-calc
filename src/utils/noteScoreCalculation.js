import { calculateScore, generateMusicMeta, makeSkillWindows, skillPushExtension } from '../lib/liveScore';

// Explore the actual note accumulation for every distinct skill order (<=120).
// The leader always supplies the sixth activation, including after a permutation.
export function calculateNoteResult(prepared, chart, rules, input, mode) {
    const skills = ['skillLeader', 'skillMember2', 'skillMember3', 'skillMember4', 'skillMember5'].map(key => Number(input[key]));
    const options = { power: Math.round(Number(input.totalPower)), mode, skills,
        skillPush: mode !== 'auto' && input.skillPush === true };
    if (mode === 'multi') {
        const delay = Math.max(0, Math.min(30000, Number(input.skillFeverDelayMs) || 0)) / 1000;
        options.skillDelay = delay;
        if (chart.fever) options.fever = { ...chart.fever,
            start: chart.fever.start + delay, end: chart.fever.end + delay };
    }
    if (input.orderedSkills) {
        const available = skills.map((value, index) => ({ value, index }));
        const order = input.orderedSkills.map(value => {
            const i = available.findIndex(item => item.value === value);
            if (i < 0) throw new Error('Invalid skill order');
            return available.splice(i, 1)[0].index;
        });
        if (order.length !== 5) throw new Error('Invalid skill order');
        return { score: calculateScore(prepared, { ...options, order: [...order, 0] }) };
    }
    let min = Infinity, max = -Infinity, minPermutation, maxPermutation;
    function visit(order, remaining) {
        if (!remaining.length) {
            const score = calculateScore(prepared, { ...options, order: [...order, 0] });
            if (score < min) { min = score; minPermutation = order.map(i => skills[i]); }
            if (score > max) { max = score; maxPermutation = order.map(i => skills[i]); }
            return;
        }
        const seen = new Set();
        remaining.forEach((index, position) => {
            if (seen.has(skills[index])) return;
            seen.add(skills[index]);
            visit([...order, index], remaining.filter((_, i) => i !== position));
        });
    }
    visit([], [0, 1, 2, 3, 4]);
    // These coefficients only feed the existing skill-coverage visualization.
    const meta = generateMusicMeta(chart, rules, { musicTime: 1, eventRate: 1 });
    const field = mode === 'multi' ? 'skill_score_multi' : 'skill_score_solo';
    return { min, max, minPermutation, maxPermutation,
        skillCoeffs: input.skillPush ? meta[`${field}_inclusive`] ?? meta[field] : meta[field],
        noteCalculated: true };
}

// Compare one activation at a time against the same unsqueezed skill order.
// Keep full note accumulation, including the original float32 rounding.
function squeezeGains(prepared, chart, rules, input, orderedSkills) {
    const skills = [...orderedSkills, Number(input.skillLeader)];
    const windows = makeSkillWindows(chart, skills, { order: [0, 1, 2, 3, 4, 5] });
    const options = { power: Math.round(Number(input.totalPower)), mode: 'solo', windows };
    const baseline = calculateScore(prepared, options);
    return windows.map((window, index) => calculateScore(prepared, { ...options,
        windows: windows.map((item, i) => i === index
            ? { ...item, end: item.end + skillPushExtension(chart, rules, item.start) } : item),
    }) - baseline);
}

export function calculateNoteVariants(prepared, chart, rules, input, mode) {
    const normal = calculateNoteResult(prepared, chart, rules, { ...input, skillPush: false }, mode);
    const squeezed = calculateNoteResult(prepared, chart, rules, { ...input, skillPush: true }, mode);
    if (mode === 'solo') {
        const normalOrder = input.orderedSkills ?? normal.maxPermutation;
        const squeezedOrder = input.orderedSkills ?? squeezed.maxPermutation;
        normal.skillPushGains = squeezeGains(prepared, chart, rules, input, normalOrder);
        squeezed.skillPushGains = JSON.stringify(normalOrder) === JSON.stringify(squeezedOrder)
            ? normal.skillPushGains : squeezeGains(prepared, chart, rules, input, squeezedOrder);
    }
    return { normal, squeezed };
}
