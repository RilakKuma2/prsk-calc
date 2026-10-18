export const AUTO_EXCLUDED_SONG_IDS = new Set([709]);
export const MELT_SONG_ID = 47;
export const CREATION_MYTH_SONG_ID = 186;

export const isAutoSongExcluded = (songOrId) => {
    const songId = typeof songOrId === 'object' ? songOrId?.id : songOrId;
    return AUTO_EXCLUDED_SONG_IDS.has(Number(songId));
};

const getAutoSongId = result => Number(result?.song?.id ?? result?.songId ?? result?.id);

// 개벽과 멜트가 같은 길이 묶음에 들어오면 점수와 관계없이 개벽을 남긴다.
export const compareCreationMythMeltPriority = (a, b) => {
    const aId = getAutoSongId(a);
    const bId = getAutoSongId(b);
    if (aId === CREATION_MYTH_SONG_ID && bId === MELT_SONG_ID) return -1;
    if (aId === MELT_SONG_ID && bId === CREATION_MYTH_SONG_ID) return 1;
    return 0;
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
        compareTiedResults,
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
        const specialPriority = current
            ? compareCreationMythMeltPriority(result, current)
            : 0;

        const tiedResultOrder = current && typeof compareTiedResults === 'function'
            ? Number(compareTiedResults(result, current))
            : songId - currentSongId;

        if (
            !current
            || specialPriority < 0
            || (
                specialPriority === 0
                && (score > Number(getScore(current)) || (score === Number(getScore(current)) && tiedResultOrder < 0))
            )
        ) {
            bestBySecond.set(wholeSecond, result);
        }
    }

    return [...bestBySecond.values(), ...resultsWithoutDuration];
};
