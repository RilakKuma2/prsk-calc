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

export const parsePredictionTimestamp = (value) => {
  if (!value) return null;
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      return Number.isFinite(num) && num > 0 ? num : null;
    }
    const normalized = trimmed.includes(' ') && !trimmed.includes('T')
      ? trimmed.replace(' ', 'T')
      : trimmed;
    const parsed = new Date(normalized).getTime();
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
};

export const resolvePredictionLastUpdated = (mainData, dataRows) => {
  if (!mainData) return null;

  const rows = Array.isArray(dataRows)
    ? dataRows
    : (Array.isArray(mainData.data) ? mainData.data : []);

  const hasMainModelPrediction = rows.some((row) => (
    (Number(row?.eventcutPredicted ?? row?.eventcut_predicted) || 0) > 0
  ));

  const eventcutAsOfTs = parsePredictionTimestamp(mainData.eventcut_as_of)
    || parsePredictionTimestamp(mainData.forecast_comparison?.as_of)
    || parsePredictionTimestamp(mainData.forecast_comparison?.generated_at);

  if (hasMainModelPrediction && eventcutAsOfTs) {
    return eventcutAsOfTs;
  }

  return parsePredictionTimestamp(mainData.updatedAt);
};

