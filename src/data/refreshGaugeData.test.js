import {
  calculateRefreshGauge,
  calculateRefreshGaugeDecay,
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

  it('reports the last non-zero 30-minute checkpoint before the gauge reaches zero', () => {
    const result = calculateRefreshGaugeDecay({
      currentPercent: 96.8666666667,
    });

    expect(result.minutesToZero).toBe(360);
    expect(result.lastCheckpointMinutes).toBe(330);
    expect(result.remainingAtLastCheckpoint).toBeCloseTo(5.2, 1);
  });
});
