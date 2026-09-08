export const getDisplayedPrediction = (row) => {
  const eventcutPrediction = Number(row?.eventcutPredicted) || 0;
  const legacyPrediction = Number(row?.predictedScore) || 0;
  if (eventcutPrediction > 0) {
    return {
      score: eventcutPrediction,
      isNewModel: true,
      jiikuScore: legacyPrediction > 0 ? legacyPrediction : 0,
    };
  }

  return {
    score: legacyPrediction > 0 ? legacyPrediction : 0,
    isNewModel: false,
    jiikuScore: 0,
  };
};

export const PREDICTION_HIDE_DELAY_MS = 11 * 60 * 1000;

export const shouldHideCompletedPrediction = (endAtMs, nowMs = Date.now()) => {
  const normalizedEndAt = Number(endAtMs);
  const normalizedNow = Number(nowMs);
  if (!Number.isFinite(normalizedEndAt) || normalizedEndAt <= 0) return false;
  if (!Number.isFinite(normalizedNow)) return false;
  return normalizedNow >= normalizedEndAt + PREDICTION_HIDE_DELAY_MS;
};
