export const AUTO_ENERGY_OPTIONS = Object.freeze(
    Array.from({ length: 10 }, (_, index) => index + 1)
);

const AUTO_EVENT_POINT_MULTIPLIERS = Object.freeze({
    1: 5,
    2: 10,
    3: 15,
    4: 19,
    5: 23,
    6: 26,
    7: 29,
    8: 31,
    9: 33,
    10: 35,
});

export const normalizeAutoEnergy = (value) => {
    const energy = Number(value);
    return AUTO_ENERGY_OPTIONS.includes(energy) ? energy : 1;
};

export const getAutoEventPointMultiplier = (energy) => (
    AUTO_EVENT_POINT_MULTIPLIERS[normalizeAutoEnergy(energy)]
);

export const calculateMySekaiEnergyScore = (baseScore, energy) => {
    const score = Number(baseScore);
    if (!Number.isFinite(score)) return 0;
    return score * normalizeAutoEnergy(energy);
};
