import {
  calculateRefreshGauge,
  calculateRefreshGaugeDecay,
  calculateRequiredRefreshRest,
  getRefreshTargetPercent,
  REFRESH_GAUGE_CONFIG,
} from './refreshGaugeData';

describe('calculateRefreshGauge', () => {
  it('uses the locally bundled refresh constants', () => {
    const result = calculateRefreshGauge({
      durationSeconds: 74,
      currentPercent: 0,
      playsPerHour: 30,
    });

    const gain = ((74 + REFRESH_GAUGE_CONFIG.offsetSeconds) * REFRESH_GAUGE_CONFIG.basePoint)
      / REFRESH_GAUGE_CONFIG.maximum * 100;
    expect(result.gainPerPlay).toBeCloseTo(gain);
    expect(result.playsNeeded).toBeCloseTo(100 / gain);
    expect(result.hoursNeeded).toBeCloseTo((100 / gain) / 30);
  });

  it('does not calculate from an invalid plays-per-hour input', () => {
    expect(calculateRefreshGauge({ durationSeconds: 74, playsPerHour: 0 })).toBeNull();
  });

  it('uses 100% only when the target gauge is blank', () => {
    expect(getRefreshTargetPercent('')).toBe(100);
    expect(getRefreshTargetPercent(0)).toBe(0);

    const result = calculateRefreshGauge({
      durationSeconds: 74,
      currentPercent: 20,
      targetPercent: 60,
      playsPerHour: 30,
    });
    const gain = ((74 + REFRESH_GAUGE_CONFIG.offsetSeconds) * REFRESH_GAUGE_CONFIG.basePoint)
      / REFRESH_GAUGE_CONFIG.maximum * 100;

    expect(result.targetPercent).toBe(60);
    expect(result.playsNeeded).toBeCloseTo(40 / gain);
  });

  it('requires no plays when the target gauge is already reached', () => {
    const result = calculateRefreshGauge({
      durationSeconds: 74,
      currentPercent: 80,
      targetPercent: 50,
      playsPerHour: 30,
    });

    expect(result.playsNeeded).toBe(0);
    expect(result.hoursNeeded).toBe(0);
  });

  it('chooses the 30-minute rest plan that allows the most plays', () => {
    const result = calculateRequiredRefreshRest({
      durationSeconds: 74,
      currentPercent: 20,
      playsPerHour: 28,
      remainingMinutes: 24 * 60,
    });
    const gainPerPlay = ((74 + REFRESH_GAUGE_CONFIG.offsetSeconds) * REFRESH_GAUGE_CONFIG.basePoint)
      / REFRESH_GAUGE_CONFIG.maximum * 100;
    const noRestPlayableRounds = Math.floor((100 - 20) / gainPerPlay);

    expect(result.canReach).toBe(true);
    expect(result.restBlocks).toBeGreaterThan(0);
    expect(result.maxPlayableRounds).toBeGreaterThan(noRestPlayableRounds);
    expect(result.restHoursNeeded).toBe(result.restBlocks * 0.5);
    expect((result.restHoursNeeded * 60) % 30).toBe(0);
    expect(result.finalGaugePercent).toBeLessThanOrEqual(100);
  });

  it('prefers no rest when filling the gauge allows more plays', () => {
    const result = calculateRequiredRefreshRest({
      durationSeconds: 74,
      currentPercent: 99,
      playsPerHour: 28,
      remainingMinutes: 30,
    });

    expect(result.restBlocks).toBe(0);
    expect(result.restHoursNeeded).toBe(0);
    expect(result.maxPlayableRounds).toBe(5);
    expect(result.finalGaugePercent).toBeGreaterThan(99.9);
    expect(result.finalGaugePercent).toBeLessThanOrEqual(100);
  });

  it('uses all available time without resting when the gauge stays below 100%', () => {
    const result = calculateRequiredRefreshRest({
      durationSeconds: 74,
      currentPercent: 0,
      playsPerHour: 28,
      remainingMinutes: 60,
    });

    expect(result.restBlocks).toBe(0);
    expect(result.maxPlayableRounds).toBe(28);
    expect(result.finalGaugePercent).toBeLessThan(100);
  });

  it('reports the last non-zero 30-minute checkpoint before the gauge reaches zero', () => {
    const result = calculateRefreshGaugeDecay({
      currentPercent: 96.8666666667,
    });

    expect(result.minutesToZero).toBe(360);
    expect(result.lastCheckpointMinutes).toBe(330);
    expect(result.remainingAtLastCheckpoint).toBeCloseTo(5.2, 1);
  });
});
