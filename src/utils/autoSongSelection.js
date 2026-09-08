export const AUTO_EXCLUDED_SONG_IDS = new Set([709]);

export const isAutoSongExcluded = (songOrId) => {
    const songId = typeof songOrId === 'object' ? songOrId?.id : songOrId;
    return AUTO_EXCLUDED_SONG_IDS.has(Number(songId));
};

/**
 * Auto cannot benefit from listing several songs whose durations fall in the
 * same whole-second bucket. Keep only the highest-scoring result in each
 * bucket; song id is the stable tie-breaker.
 */
export const keepBestAutoSongPerWholeSecond = (
    results = [],
    {
        getDuration = result => result.durationSeconds,
        getScore = result => result.score,
        getSongId = result => result.song?.id ?? result.songId ?? result.id,
    } = {},
) => {
    const bestBySecond = new Map();
    const resultsWithoutDuration = [];

    for (const result of results) {
        const duration = Number(getDuration(result));
        const score = Number(getScore(result));
        if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(score)) {
            // Missing metadata must not make an otherwise valid existing row disappear.
            resultsWithoutDuration.push(result);
            continue;
        }

        const wholeSecond = Math.floor(duration);
        const current = bestBySecond.get(wholeSecond);
        const songId = Number(getSongId(result)) || Number.MAX_SAFE_INTEGER;
        const currentSongId = current
            ? (Number(getSongId(current)) || Number.MAX_SAFE_INTEGER)
            : Number.MAX_SAFE_INTEGER;

        if (!current || score > Number(getScore(current)) || (score === Number(getScore(current)) && songId < currentSongId)) {
            bestBySecond.set(wholeSecond, result);
        }
    }

    return [...bestBySecond.values(), ...resultsWithoutDuration];
};
