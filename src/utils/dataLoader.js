// Fallback data
import { ESSENTIAL_MUSIC_METAS } from '../data/essentialMusicMetas';
import { SONG_OPTIONS as localSongOptions } from './songs';

let cachedMusicMetas = null;
let musicMetasPromise = null;
let cachedSongOptions = null;

const MUSIC_METAS_URL = 'https://asset.rilaksekai.com/music_metas.json';
const MUSIC_METAS_TIMEOUT_MS = 6000;

function applyDateFilter(songs) {
    if (!songs) return songs;
    const now = new Date();
    const filterDate = new Date('2026-04-22T23:59:59+09:00');
    if (now > filterDate) {
        return songs.filter(song => ![707, 708, 709].includes(song.id));
    }
    return songs;
}

/**
 * API 응답 형식을 로컬 파일 형식으로 변환
 */
function normalizeSong(apiSong) {
    // length 변환: "2:03" -> 123 (초), 빈 문자열이면 0
    let lengthInSeconds = 0;
    if (apiSong.length && typeof apiSong.length === 'string' && apiSong.length.includes(':')) {
        const [min, sec] = apiSong.length.split(':').map(Number);
        lengthInSeconds = (min * 60) + (sec || 0);
    } else if (typeof apiSong.length === 'number') {
        lengthInSeconds = apiSong.length;
    }

    // mv_type 변환: "3D" -> 3, 그 외 -> undefined
    let mv = undefined; if (/3D/.test(apiSong.mv_type)) { mv = 3; }

    return {
        id: Number(apiSong.id),
        name: apiSong.title_ko || apiSong.title_jp, // title_ko를 name으로
        title_jp: apiSong.title_jp,
        title_hi: apiSong.title_hi,
        title_hangul: apiSong.title_hangul,
        length: lengthInSeconds,
        mv: mv,
        unit: apiSong.unit_code || apiSong.unit,
        levels: apiSong.levels || {},
    };
}

async function fetchJsonWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        return response.json();
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * music_metas.json 가져오기
 * 1. 외부 URL (Remote)
 * 2. 로컬 JSON lazy chunk (Fallback)
 */
export async function getMusicMetas() {
    if (cachedMusicMetas) return cachedMusicMetas;
    if (musicMetasPromise) return musicMetasPromise;

    musicMetasPromise = (async () => {
        try {
            // 1. Try Remote
            cachedMusicMetas = await fetchJsonWithTimeout(MUSIC_METAS_URL, MUSIC_METAS_TIMEOUT_MS);
            console.log('Loaded music_metas from REMOTE API');
            return cachedMusicMetas;
        } catch (remoteError) {
            console.warn('Failed to fetch music_metas from REMOTE, using lazy LOCAL fallback:', remoteError.message);
            const localMusicMetasModule = await import('../data/music_metas.json');
            cachedMusicMetas = localMusicMetasModule.default || localMusicMetasModule;
            return cachedMusicMetas;
        }
    })();

    return musicMetasPromise;
}

export function preloadMusicMetas() {
    return getMusicMetas().catch(error => {
        console.warn('Failed to preload music_metas:', error.message);
        musicMetasPromise = null;
        return ESSENTIAL_MUSIC_METAS;
    });
}

/**
 * songs 데이터 가져오기
 * 외부 URL에서 fetch 시도 후 실패 시 로컬 파일 사용
 */
export async function getSongOptions() {
    if (cachedSongOptions) return applyDateFilter(cachedSongOptions);

    try {
        const response = await fetch('https://api.rilaksekai.com/api/songs');
        if (!response.ok) throw new Error('Fetch failed');
        const apiData = await response.json();
        // API 응답을 로컬 형식으로 변환
        cachedSongOptions = apiData.map(normalizeSong);
        console.log('Loaded songs from external API');
        return applyDateFilter(cachedSongOptions);
    } catch (error) {
        console.warn('Failed to fetch songs from API, using local fallback:', error.message);
        cachedSongOptions = localSongOptions;
        return applyDateFilter(cachedSongOptions);
    }
}

/**
 * 동기적으로 사용해야 할 때 캐시된 데이터 또는 로컬 fallback 반환
 */
export function getMusicMetasSync() {
    return cachedMusicMetas || ESSENTIAL_MUSIC_METAS;
}

export function getSongOptionsSync() {
    return applyDateFilter(cachedSongOptions || localSongOptions);
}
