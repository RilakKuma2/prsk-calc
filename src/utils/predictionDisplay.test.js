import {
  getDisplayedPrediction,
  parsePredictionTimestamp,
  PREDICTION_HIDE_DELAY_MS,
  resolvePredictionLastUpdated,
  shouldHideCompletedPrediction,
} from './predictionDisplay';

test('uses the new model when the legacy forecast has not been generated', () => {
  expect(getDisplayedPrediction({
    predictedScore: 0,
    eventcutPredicted: 123456789,
  })).toEqual({
    score: 123456789,
    isNewModel: true,
    jiikuScore: 0,
  });
});

test('uses the new model as primary and keeps Jiiku as secondary when both exist', () => {
  expect(getDisplayedPrediction({
    predictedScore: 111111111,
    eventcutPredicted: 123456789,
  })).toEqual({
    score: 123456789,
    isNewModel: true,
    jiikuScore: 111111111,
  });
});

test('falls back to Jiiku when the new model has not been generated', () => {
  expect(getDisplayedPrediction({
    predictedScore: 111111111,
    eventcutPredicted: 0,
  })).toEqual({
    score: 111111111,
    isNewModel: false,
    jiikuScore: 0,
  });
});

test('hides predictions beginning eleven minutes after completion', () => {
  const endAt = 1_000_000;
  expect(shouldHideCompletedPrediction(endAt, endAt + PREDICTION_HIDE_DELAY_MS - 1)).toBe(false);
  expect(shouldHideCompletedPrediction(endAt, endAt + PREDICTION_HIDE_DELAY_MS)).toBe(true);
});

test('does not hide predictions without a valid completion time', () => {
  expect(shouldHideCompletedPrediction(null, Date.now())).toBe(false);
  expect(shouldHideCompletedPrediction(0, Date.now())).toBe(false);
});

describe('resolvePredictionLastUpdated', () => {
  const jiikuTs = 1789881840000; // 14:24
  const eventcutIso = '2026-09-20T19:14:05+09:00';
  const eventcutTs = new Date(eventcutIso).getTime();

  test('uses main prediction model as-of time when main model predictions exist', () => {
    const mainData = {
      updatedAt: jiikuTs,
      eventcut_as_of: eventcutIso,
      data: [
        { rank: 1, current: 100, predicted: 150, eventcut_predicted: 160 },
        { rank: 2, current: 80, predicted: 120, eventcut_predicted: 130 },
      ],
    };

    expect(resolvePredictionLastUpdated(mainData)).toBe(eventcutTs);
  });

  test('falls back to Jiiku updatedAt when only Jiiku data exists and main model is absent', () => {
    const mainData = {
      updatedAt: jiikuTs,
      eventcut_as_of: eventcutIso,
      data: [
        { rank: 1, current: 100, predicted: 150, eventcut_predicted: 0 },
        { rank: 2, current: 80, predicted: 120, eventcut_predicted: null },
      ],
    };

    expect(resolvePredictionLastUpdated(mainData)).toBe(jiikuTs);
  });

  test('falls back to Jiiku updatedAt when eventcut_as_of is missing even if prediction values exist', () => {
    const mainData = {
      updatedAt: jiikuTs,
      data: [
        { rank: 1, current: 100, predicted: 150, eventcut_predicted: 160 },
      ],
    };

    expect(resolvePredictionLastUpdated(mainData)).toBe(jiikuTs);
  });

  test('reads as_of from forecast_comparison if eventcut_as_of is absent', () => {
    const mainData = {
      updatedAt: jiikuTs,
      forecast_comparison: { as_of: eventcutIso },
      data: [
        { rank: 1, current: 100, predicted: 150, eventcut_predicted: 160 },
      ],
    };

    expect(resolvePredictionLastUpdated(mainData)).toBe(eventcutTs);
  });

  test('checks dataRows parameter if passed explicitly', () => {
    const mainData = {
      updatedAt: jiikuTs,
      eventcut_as_of: eventcutIso,
      data: [],
    };
    const finalData = [
      { rank: 1, currentScore: 100, predictedScore: 150, eventcutPredicted: 160 },
    ];

    expect(resolvePredictionLastUpdated(mainData, finalData)).toBe(eventcutTs);
  });
});

