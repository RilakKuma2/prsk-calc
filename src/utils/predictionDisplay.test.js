import {
  getDisplayedPrediction,
  PREDICTION_HIDE_DELAY_MS,
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
