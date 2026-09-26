/** Standalone live scoring. No DOM, network, master fetching, or deck calculation. */
export const VERSION = '0.2.0';
// User-selected practical squeeze allowance, halved when activation overlaps a hold.
export const DEFAULT_SKILL_PUSH_SECONDS = 0.065;
const MODES = new Set(['solo', 'challenge', 'auto', 'multi', 'cheerful']);
const PERFECT = new Set(['perfect', 'just_perfect']);
const KEEP_COMBO = new Set(['perfect', 'just_perfect', 'great']);

function number(value, name, min = 0, max = Infinity) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name}: expected a finite number in [${min}, ${max}]`);
  }
  return value;
}

export function prepareRules(master) {
  const weights = Object.fromEntries(master.notes.map(row => [row.id, number(row.scoreCoefficient, 'note coefficient')]));
  const judges = Object.fromEntries(master.judges.map(row => [row.ingameNoteJadgeType, number(row.scoreCoefficient, 'judge coefficient')]));
  judges.just_perfect = judges.perfect;
  for (const judge of ['perfect', 'great', 'good', 'bad', 'miss', 'auto']) {
    number(judges[judge], `missing judge ${judge}`);
  }
  const combos = [...master.combos].sort((a, b) => a.fromCount - b.fromCount);
  for (const row of combos) number(row.scoreCoefficient, 'combo coefficient');
  const skillPushSeconds = DEFAULT_SKILL_PUSH_SECONDS;
  return { weights, judges, combos, skillPushSeconds };
}

/** Fixed-duration squeeze approximation; any hold overlapping activation halves it.
 * Include head/tail instants and simultaneous tap+hold conservatively.
 * Require spans rather than guessing from type 2 (shared by heads and releases).
 */
export function skillPushExtension(chart, rules, start) {
  if (!Array.isArray(chart.longNoteRanges)) throw new Error('Skill squeezing requires longNoteRanges; re-export the chart');
  const time = Math.fround(start);
  const holding = chart.longNoteRanges.some(([head, tail]) =>
    Math.fround(head) <= time && time <= Math.fround(tail));
  return (rules.skillPushSeconds ?? DEFAULT_SKILL_PUSH_SECONDS) / (holding ? 2 : 1);
}

function comboFactor(rules, combo) {
  if (combo === 0) return 1;
  const row = rules.combos.find(row => row.fromCount <= combo && combo <= row.toCount);
  if (!row) throw new RangeError(`No master combo coefficient for ${combo}`);
  return row.scoreCoefficient;
}

function validateChart(chart, rules) {
  number(chart.level, 'chart.level', 1);
  if (!Array.isArray(chart.notes) || !chart.notes.length) throw new Error('Chart has no notes');
  if (chart.expectedNoteCount != null && chart.expectedNoteCount !== chart.notes.length) {
    throw new Error('Parsed note count differs from master data');
  }
  let last = -Infinity;
  for (const note of chart.notes) {
    number(note.time, 'note.time', -3600);
    if (note.time < last) throw new Error('Notes must be sorted by time');
    last = note.time;
    number(rules.weights[note.type], `unknown note type ${note.type}`);
  }
  for (const time of chart.skills) number(time, 'skill time', -3600);
}

// Prepared inputs own their snapshot; caller mutations cannot invalidate cached data.
const preparedCharts = new WeakMap();
export function prepareChart(chart, rules) {
  validateChart(chart, rules);
  const snapshot = {
    ...chart, notes: chart.notes.map(note => ({ ...note })), skills: [...chart.skills],
    longNoteRanges: chart.longNoteRanges?.map(range => [...range]),
    fever: chart.fever ? { ...chart.fever } : null,
  };
  const ruleSnapshot = { skillPushSeconds: rules.skillPushSeconds, weights: { ...rules.weights }, judges: { ...rules.judges },
    combos: rules.combos.map(row => ({ ...row })) };
  const count = snapshot.notes.length;
  const times = new Float64Array(count), floatTimes = new Float32Array(count);
  let weightTotal = 0, floatWeightTotal = 0;
  snapshot.notes.forEach((note, i) => {
    times[i] = note.time + 0; floatTimes[i] = note.time + 0;
    const weight = ruleSnapshot.weights[note.type];
    weightTotal += weight;
    floatWeightTotal = Math.fround(Math.fround(floatWeightTotal) + Math.fround(weight));
  });
  const prepared = Object.freeze({ noteCount: count });
  preparedCharts.set(prepared, { chart: snapshot, rules: ruleSnapshot, times, floatTimes,
    weightTotal, floatWeightTotal, comboFactors: [] });
  return prepared;
}

function preparedData(prepared) {
  const data = preparedCharts.get(prepared);
  if (!data) throw new TypeError('Expected a chart returned by prepareChart');
  return data;
}

/** Same detailed result as calculateLive, with reusable chart preparation. */
export function calculatePreparedLive(prepared, options = {}) {
  const data = preparedData(prepared);
  return runLive(data.chart, data.rules, options, data, false);
}

/** Exact same note accumulation; omit timeline/statistics work for batch scoring. */
export function calculateScore(prepared, options = {}) {
  const data = preparedData(prepared);
  return runLive(data.chart, data.rules, options, data, true);
}

/** Effective score-up values, NOT card IDs. Multi slots take each player's effective %.
 * Windows may instead be supplied explicitly for replay/latency investigations.
 */
export function makeSkillWindows(chart, skills, { order = [0, 1, 2, 3, 4, 0], skillDelay = 0 } = {}) {
  number(skillDelay, 'skillDelay', -30, 30);
  if (order.length !== chart.skills.length) throw new Error('One skill order slot is required per chart event');
  return chart.skills.map((time, slot) => {
    const source = skills[order[slot]];
    if (source === undefined) throw new Error(`Missing skill at slot ${slot + 1}`);
    const skill = typeof source === 'number' ? { scoreUp: source } : source;
    const start = time + skillDelay;
    return {
      start, end: start + number(skill.duration ?? 5, 'duration', 0, 60),
      scoreUp: number(skill.scoreUp, 'scoreUp', 0, 10000),
      perfectOnly: !!skill.perfectOnly,
      fallbackScoreUp: number(skill.fallbackScoreUp ?? 0, 'fallbackScoreUp', 0, 10000),
      slot, card: order[slot],
    };
  });
}

export function multiEffectiveSkill(leader, members) {
  number(leader, 'leader scoreUp');
  if (members.length !== 4) throw new Error('Provide the four non-leader member skill values');
  return leader + members.reduce((total, value) => total + number(value, 'member scoreUp') / 5, 0);
}

/**
 * Approximation to ScoreLogic with float32 at arithmetic/accumulation boundaries.
 * Includes real note types, combo breaks, additive skills, fever and timed bonuses.
 * Assumes supplied effective skill strengths; card/life-dependent skills must be
 * resolved by caller. Simultaneous note order and boundary frames are not bit-exact.
 * judgmentOverrides[index] = { judgment: 'great', offset: 0.02 }.
 * activeBonuses = [{ time, score }] lets the caller provide actual multi activations.
 */
export function calculateLive(chart, rules, options = {}) {
  validateChart(chart, rules);
  return runLive(chart, rules, options, null, false);
}

function runLive(chart, rules, options, prepared, scoreOnly) {
  const mode = options.mode ?? 'solo';
  if (!MODES.has(mode)) throw new Error(`Unknown live mode: ${mode}`);
  const power = number(options.power, 'power', 1, 100000000);
  if (!Number.isInteger(power)) throw new Error('power must be an integer');
  const round = options.precision === 'double' ? value => value : Math.fround;
  const mul = (a, b) => round(round(a) * round(b));
  const add = (a, b) => round(round(a) + round(b));
  const weightTotal = prepared
    ? (options.precision === 'double' ? prepared.weightTotal : prepared.floatWeightTotal)
    : chart.notes.reduce((total, note) => add(total, rules.weights[note.type]), 0);
  if (weightTotal <= 0) throw new Error('Total note weight must be positive');
  const levelFactor = add(1, mul(chart.level - 5, 0.005));
  const baseTotal = Math.floor(mul(power * 4, levelFactor));
  const baseNoteScore = round(baseTotal / weightTotal);
  const rawWindows = options.windows ?? makeSkillWindows(chart, options.skills ?? [0, 0, 0, 0, 0], options);
  const windows = options.skillPush && mode !== 'auto'
    ? rawWindows.map(window => ({ ...window, end: window.end + skillPushExtension(chart, rules, window.start) }))
    : rawWindows;
  windows.forEach(window => {
    number(window.start, 'window.start', -3600);
    number(window.end, 'window.end', window.start);
    number(window.scoreUp, 'window.scoreUp', 0, 10000);
    number(window.fallbackScoreUp ?? 0, 'window.fallbackScoreUp', 0, 10000);
  });
  const multi = mode === 'multi' || mode === 'cheerful';
  const fever = multi && options.feverEnabled !== false ? (options.fever ?? chart.fever) : null;
  if (fever) {
    number(fever.start, 'fever.start', -3600);
    number(fever.end, 'fever.end', fever.start);
  }
  // Round endpoints/skill multipliers once, preserving the original operation order.
  const compiledWindows = windows.map(window => ({
    start: round(window.start), end: round(window.end),
    percent: window.scoreUp, ratio: mul(window.scoreUp, 0.01),
    fallback: window.fallbackScoreUp ?? 0, fallbackRatio: mul(window.fallbackScoreUp ?? 0, 0.01),
    perfectOnly: window.perfectOnly,
  }));
  const endInclusive = options.endInclusive === true;
  const feverStart = fever ? round(fever.start) : 0, feverEnd = fever ? round(fever.end) : 0;
  const cap = options.skillFactorCap == null ? Infinity : number(options.skillFactorCap, 'skillFactorCap', 1);
  const overrides = options.judgmentOverrides ?? {};
  const defaultJudgment = mode === 'auto' ? 'auto' : 'perfect';
  const times = prepared && (options.precision === 'double' ? prepared.times : prepared.floatTimes);
  // Judgment-only edits and skill delay never change note order. Timing edits may.
  const needsSort = Object.values(overrides).some(override => (override?.offset ?? 0) !== 0);
  const events = needsSort ? chart.notes.map((note, index) => {
    const override = overrides[index] ?? {};
    const offset = number(override.offset ?? 0, 'judgment offset', -30, 30);
    return { index, time: round(note.time + offset), judgment: override.judgment ?? defaultJudgment };
  }).sort((a, b) => a.time - b.time || a.index - b.index) : null;

  const bonuses = [...(options.activeBonuses ?? [])];
  // Five activations are an ideal multiplayer scenario, not guaranteed in actual play.
  if (mode === 'multi' && options.activeBonuses === undefined) {
    const teamPower = number(options.multiPowerSum ?? power * 5, 'multiPowerSum');
    const count = number(options.activeBonusCount ?? 5, 'activeBonusCount', 0, 5);
    if (!Number.isInteger(count)) throw new Error('activeBonusCount must be an integer');
    for (let i = 0; i < count; i++) bonuses.push({ time: chart.skills[i], score: Math.floor(mul(teamPower, 0.015)) });
  }
  bonuses.forEach(bonus => { number(bonus.time, 'bonus time', -3600); number(bonus.score, 'bonus score'); });
  bonuses.sort((a, b) => a.time - b.time);
  let total = 0, combo = 0, maxCombo = 0, bonusIndex = 0, activeBonus = 0;
  const judgments = {}, timeline = [], skillCoverage = windows.map(() => ({ notes: 0, addedScore: 0 }));
  let baseContribution = 0, skillContribution = 0, feverContribution = 0;
  function applyBonuses(time) {
    while (bonusIndex < bonuses.length && bonuses[bonusIndex].time <= time) {
      const bonus = bonuses[bonusIndex++].score;
      total = add(total, bonus);
      activeBonus += bonus;
    }
  }
  const activeIndices = [], activePercents = [];
  for (let position = 0; position < chart.notes.length; position++) {
    const event = events?.[position];
    const index = event ? event.index : position;
    const note = chart.notes[index];
    const time = event ? event.time : times ? times[index] : round(note.time + 0);
    const judgment = event ? event.judgment : overrides[index]?.judgment ?? defaultJudgment;
    if (!(judgment in rules.judges)) throw new Error(`Unknown judgment ${judgment}`);
    applyBonuses(time);
    if (!scoreOnly) judgments[judgment] = (judgments[judgment] ?? 0) + 1;
    const nextCombo = KEEP_COMBO.has(judgment) ? combo + 1 : 0;
    // LongHoldCombo.OnUnSpawnNote updates score BEFORE combo; NoteBase reverses this.
    const scoreCombo = note.type === 9 ? combo : nextCombo;
    const coefficient = prepared
      ? (prepared.comboFactors[scoreCombo] ??= comboFactor(rules, scoreCombo))
      : comboFactor(rules, scoreCombo);
    const comboCoefficient = round(coefficient);
    const judgeCoefficient = round(rules.judges[judgment]);
    const weight = round(rules.weights[note.type]);
    let activeCount = 0, percentSum = 0, skillFactor = 1;
    for (let i = 0; i < compiledWindows.length; i++) {
      const window = compiledWindows[i];
      if (time < window.start || (endInclusive ? time > window.end : time >= window.end)) continue;
      const fallback = window.perfectOnly && !PERFECT.has(judgment);
      const percent = fallback ? window.fallback : window.percent;
      skillFactor = add(skillFactor, fallback ? window.fallbackRatio : window.ratio);
      if (!scoreOnly) {
        activeIndices[activeCount] = i; activePercents[activeCount++] = percent;
        percentSum += percent;
      }
    }
    skillFactor = Math.min(skillFactor, cap);
    // Ideal fever includes the note that completes its note-count quota. Actual
    // event/input ordering at this frame can be inspected with an exclusive end.
    const isFever = !!fever && time >= feverStart &&
      (options.feverEndInclusive !== false ? time <= feverEnd : time < feverEnd);
    const base = !scoreOnly && judgeCoefficient > 0 ? Math.max(1, mul(mul(mul(judgeCoefficient, weight), comboCoefficient), baseNoteScore)) : 0;
    let gained = judgeCoefficient > 0
      ? Math.max(1, mul(mul(mul(mul(judgeCoefficient, weight), skillFactor), comboCoefficient), baseNoteScore)) : 0;
    const withSkill = gained;
    if (isFever) gained = mul(gained, 1.5);
    if (!scoreOnly) {
      baseContribution += base;
      skillContribution += withSkill - base;
      feverContribution += gained - withSkill;
      for (let i = 0; i < activeCount; i++) {
        const coverage = skillCoverage[activeIndices[i]];
        coverage.notes++;
        // Display only; preserve the same per-window addition order.
        if (percentSum) coverage.addedScore += (withSkill - base) * activePercents[i] / percentSum * (isFever ? 1.5 : 1);
      }
    }
    total = add(total, gained);
    combo = nextCombo;
    maxCombo = Math.max(maxCombo, combo);
    if (!scoreOnly && options.includeTimeline !== false) timeline.push({ index, time, type: note.type, judgment,
      combo, scoreCombo, weight, comboCoefficient, skillFactor, fever: isFever,
      gained, cumulative: Math.floor(total), activeSlots: activeIndices.slice(0, activeCount) });
  }
  applyBonuses(Infinity);
  if (scoreOnly) return Math.floor(total);
  return { score: Math.floor(total), rawScore: total, baseNoteScore, baseTotal,
    weightTotal, noteCount: chart.notes.length, maxCombo, judgments, activeBonus,
    contributions: { base: baseContribution, skill: skillContribution, fever: feverContribution },
    windows, skillCoverage, timeline, mode, precision: options.precision ?? 'float32' };
}

/** AP coefficient export compatible with sekai-calculator's MusicMeta schema.
 * Duration and event rate are separate metadata, not inferable exactly from SUS.
 * The coefficient representation deliberately omits power-specific float rounding.
 * Timing boundaries still use the same float32 precision as default note scoring.
 */
export function generateMusicMeta(chart, rules, { musicTime, eventRate, duration = 5, endInclusive = false } = {}) {
  validateChart(chart, rules);
  number(musicTime, 'musicTime', 0.01);
  number(eventRate, 'eventRate', 0.01);
  number(duration, 'duration', 0, 60);
  const total = chart.notes.reduce((value, note) => value + rules.weights[note.type], 0);
  const level = 1 + (chart.level - 5) * 0.005;
  // Match runLive: round each endpoint after computing it, not the duration or
  // start before addition. SUS doubles can place an exact end note a few ulps
  // inside its skill window (e.g. SHANTI EASY 11.666666666666666).
  const windows = chart.skills.map(start => ({
    start: Math.fround(start), end: Math.fround(start + duration),
    squeezeEnd: Math.fround(start + duration + skillPushExtension(chart, rules, start)),
  }));
  const feverStart = chart.fever ? Math.fround(chart.fever.start) : 0;
  const feverEnd = chart.fever ? Math.fround(chart.fever.end) : 0;
  let base = 0, auto = 0, feverScore = 0;
  const soloSkill = chart.skills.map(() => 0), autoSkill = chart.skills.map(() => 0), multiSkill = chart.skills.map(() => 0);
  const soloInclusive = chart.skills.map(() => 0), multiInclusive = chart.skills.map(() => 0);
  chart.notes.forEach((note, index) => {
    const combo = note.type === 9 ? index : index + 1;
    const amount = rules.weights[note.type] / total * level;
    const soloAmount = amount * comboFactor(rules, combo);
    const autoAmount = amount * rules.judges.auto;
    const time = Math.fround(note.time);
    const fever = chart.fever && time >= feverStart && time <= feverEnd;
    base += soloAmount; auto += autoAmount;
    if (fever) feverScore += soloAmount;
    windows.forEach(({ start, end, squeezeEnd }, i) => {
      if (time < start) return;
      if (endInclusive ? time <= end : time < end) {
        soloSkill[i] += soloAmount;
        autoSkill[i] += autoAmount;
        multiSkill[i] += soloAmount * (fever ? 1.5 : 1);
      }
      if (time < squeezeEnd) {
        soloInclusive[i] += soloAmount;
        multiInclusive[i] += soloAmount * (fever ? 1.5 : 1);
      }
    });
  });
  return { music_id: chart.musicId, difficulty: chart.difficulty, music_time: musicTime,
    event_rate: eventRate, base_score: base, base_score_auto: auto,
    skill_score_solo: soloSkill, skill_score_auto: autoSkill, skill_score_multi: multiSkill,
    // Legacy field names retained; these now extend duration, not just include the end instant.
    ...(soloInclusive.some((value, i) => value !== soloSkill[i]) ? {
      skill_score_solo_inclusive: soloInclusive, skill_score_multi_inclusive: multiInclusive,
      skill_push_extensions: chart.skills.map(start => skillPushExtension(chart, rules, start)),
    } : {}),
    fever_score: feverScore, fever_end_time: chart.fever?.end ?? 0,
    tap_count: chart.notes.filter(note => note.requiresTap).length };
}

/** Arithmetic used by the legacy coefficient calculator, for side-by-side checks. */
export function coefficientScore(meta, { power, mode = 'solo', skills, multiPowerSum = power * 5, activeBonusCount = 5, skillPush = false }) {
  const multi = mode === 'multi' || mode === 'cheerful';
  const base = mode === 'auto' ? meta.base_score_auto : meta.base_score + (multi ? meta.fever_score * 0.5 : 0);
  const coefficients = mode === 'auto' ? meta.skill_score_auto : multi
    ? (skillPush ? meta.skill_score_multi_inclusive ?? meta.skill_score_multi : meta.skill_score_multi)
    : (skillPush ? meta.skill_score_solo_inclusive ?? meta.skill_score_solo : meta.skill_score_solo);
  if (skills.length !== coefficients.length) throw new Error('Legacy comparison requires 6 effective skill values');
  const rate = skills.reduce((sum, percent, index) => sum + percent * coefficients[index] / 100, base);
  return Math.floor(rate * power * 4 + (mode === 'multi' ? activeBonusCount * 0.015 * multiPowerSum : 0));
}


/** Shared shortlist used by the calculator and its downloadable chart bundle. */
export const CHALLENGE_SONG_LIMIT = 150;
export const CHALLENGE_REFERENCE_DECK = Object.freeze({
  totalPower: 410520, skillLeader: 140, skillMember2: 120,
  skillMember3: 100, skillMember4: 100, skillMember5: 100,
});
export function rankChallengeMetas(metas, { skillPush = false, limit = CHALLENGE_SONG_LIMIT } = {}) {
  const candidates = [];
  for (const meta of metas) {
    const coefficients = skillPush ? meta.skill_score_solo_inclusive ?? meta.skill_score_solo : meta.skill_score_solo;
    if (!Array.isArray(coefficients) || coefficients.length !== 6) continue;
    const ranked = coefficients.slice(0, 5).map((value, i) => ({ value, i })).sort((a, b) => b.value - a.value);
    const skills = [140, 120, 100, 100, 100], order = Array(6);
    ranked.forEach(({ i }, rank) => { order[i] = skills[rank]; });
    order[5] = CHALLENGE_REFERENCE_DECK.skillLeader;
    // Same arithmetic/order as sekai-calculator's initial coefficient ranking.
    const skillRate = order.reduce((sum, value, i) => sum + value * coefficients[i] / 100, 0);
    const referenceMax = Math.floor((meta.base_score + skillRate) * CHALLENGE_REFERENCE_DECK.totalPower * 4);
    candidates.push({ musicId: Number(meta.music_id), difficulty: meta.difficulty, referenceMax });
  }
  return candidates.sort((a, b) => b.referenceMax - a.referenceMax || a.musicId - b.musicId).slice(0, limit);
}
