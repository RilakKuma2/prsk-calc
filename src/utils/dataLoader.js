// Fallback data
import { ESSENTIAL_MUSIC_METAS } from '../data/essentialMusicMetas';
import { SONG_OPTIONS as localSongOptions } from './songs';
import { API_BASE_URL, ASSET_BASE_URL, joinUrl } from '../config/env';

let cachedMusicMetas = null;
let musicMetasPromise = null;
let musicMetasIdlePreloadScheduled = false;
let cachedMiniMusicMetas = null;
let miniMusicMetasPromise = null;
let cachedSongOptions = null;
let musicMetaLookupSource = null;
let cachedMusicMetaLookup = null;
let filteredSongOptionsSource = null;
let cachedFilteredSongOptions = null;
let searchableSongOptionsSource = null;
let cachedSearchableSongOptions = null;

const MUSIC_METAS_URL = joinUrl(ASSET_BASE_URL, 'music_metas.json');
const LOCAL_MUSIC_METAS_URL = joinUrl(process.env.PUBLIC_URL || '', 'music_metas.json');
const MINI_MUSIC_METAS_URL = joinUrl(process.env.PUBLIC_URL || '', 'music_metas_min.json');
const MUSIC_METAS_TIMEOUT_MS = 6000;
const LOCAL_MUSIC_METAS_TIMEOUT_MS = 10000;
const MINI_MUSIC_METAS_TIMEOUT_MS = 3000;
const SONG_OPTIONS_TIMEOUT_MS = 2500;
const SONG_FILTER_DATE = new Date('2026-04-22T23:59:59+09:00');
const EXCLUDED_SONG_IDS = new Set([707, 708, 709]);
const makeMusicMetaKey = (songId, difficulty) => `${Number(songId)}:${difficulty}`;

function applyDateFilter(songs) {
    if (!songs) return songs;
    const now = new Date();
    if (now >= SONG_FILTER_DATE) {
        return songs;
    }
    if (filteredSongOptionsSource === songs && cachedFilteredSongOptions) {
        return cachedFilteredSongOptions;
    }
    filteredSongOptionsSource = songs;
    cachedFilteredSongOptions = songs.filter(song => !EXCLUDED_SONG_IDS.has(Number(song.id)));
    return cachedFilteredSongOptions;
}

export function normalizeSearchText(str) {
    if (!str) return '';
    return String(str).normalize('NFC').toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[\u3041-\u3096]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));
}

export function buildMusicMetaLookup(musicMetas) {
    const lookup = new Map();
    for (const meta of musicMetas || []) {
        lookup.set(makeMusicMetaKey(meta.music_id, meta.difficulty), meta);
    }
    return lookup;
}

function getCachedMusicMetaLookup(musicMetas = getMusicMetasSync()) {
    if (musicMetaLookupSource === musicMetas && cachedMusicMetaLookup) {
        return cachedMusicMetaLookup;
    }
    musicMetaLookupSource = musicMetas;
    cachedMusicMetaLookup = buildMusicMetaLookup(musicMetas);
    return cachedMusicMetaLookup;
}

function getSearchableSongOptionsSync() {
    const songs = getSongOptionsSync();
    if (searchableSongOptionsSource === songs && cachedSearchableSongOptions) {
        return cachedSearchableSongOptions;
    }

    searchableSongOptionsSource = songs;
    cachedSearchableSongOptions = songs.map(song => ({
        song,
        name: normalizeSearchText(song.name),
        titleJp: normalizeSearchText(song.title_jp),
        titleEn: normalizeSearchText(song.title_en),
        titleHi: normalizeSearchText(song.title_hi),
        titleHangul: normalizeSearchText(song.title_hangul),
    }));
    return cachedSearchableSongOptions;
}

export function searchSongOptionsSync(searchQuery, language, limit = 5) {
    const query = normalizeSearchText(searchQuery);
    if (!query) return [];

    const results = [];
    for (const entry of getSearchableSongOptionsSync()) {
        if (entry.name.includes(query) || entry.titleHi.includes(query) || entry.titleHangul.includes(query)) {
            results.push(entry.song);
        } else if (language === 'ko') {
            if (entry.titleJp.includes(query) || entry.titleEn.includes(query)) {
                results.push(entry.song);
            }
        } else if (language === 'ja') {
            if (entry.titleJp.includes(query)) {
                results.push(entry.song);
            }
        } else if (entry.titleEn.includes(query)) {
            results.push(entry.song);
        }

        if (limit && results.length >= limit) break;
    }
    return results;
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
        release_date: apiSong.release_date,
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
 * 2. public의 정적 JSON (Fallback)
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
            console.warn('Failed to fetch music_metas from REMOTE, using public fallback:', remoteError.message);
            try {
                cachedMusicMetas = await fetchJsonWithTimeout(
                    LOCAL_MUSIC_METAS_URL,
                    LOCAL_MUSIC_METAS_TIMEOUT_MS,
                );
                console.log('Loaded music_metas from PUBLIC fallback');
                return cachedMusicMetas;
            } catch (localError) {
                console.warn('Failed to fetch public music_metas fallback, using essential data:', localError.message);
                cachedMusicMetas = ESSENTIAL_MUSIC_METAS;
                return cachedMusicMetas;
            }
        }
    })();

    return musicMetasPromise;
}

/**
 * 이벤덱 초기 화면에서 사용하는 고정 곡 메타만 가져온다.
 * 전체 메타 캐시가 이미 있으면 네트워크 요청 없이 그 캐시를 재사용한다.
 */
export async function getMiniMusicMetas() {
    if (cachedMusicMetas) return cachedMusicMetas;
    if (cachedMiniMusicMetas) return cachedMiniMusicMetas;
    if (miniMusicMetasPromise) return miniMusicMetasPromise;

    miniMusicMetasPromise = fetchJsonWithTimeout(
        MINI_MUSIC_METAS_URL,
        MINI_MUSIC_METAS_TIMEOUT_MS,
    ).then(metas => {
        cachedMiniMusicMetas = metas;
        return cachedMiniMusicMetas;
    }).catch(error => {
        console.warn('Failed to fetch mini music_metas, using essential data:', error.message);
        cachedMiniMusicMetas = ESSENTIAL_MUSIC_METAS;
        return cachedMiniMusicMetas;
    });

    return miniMusicMetasPromise;
}

export function preloadMusicMetas() {
    return getMusicMetas().catch(error => {
        console.warn('Failed to preload music_metas:', error.message);
        musicMetasPromise = null;
        return ESSENTIAL_MUSIC_METAS;
    });
}

export function preloadMusicMetasWhenIdle() {
    if (cachedMusicMetas || musicMetasPromise || musicMetasIdlePreloadScheduled) return;

    musicMetasIdlePreloadScheduled = true;
    const load = () => {
        musicMetasIdlePreloadScheduled = false;
        preloadMusicMetas();
    };

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(load, { timeout: 3000 });
    } else {
        setTimeout(load, 1000);
    }
}

export function preloadMiniMusicMetas() {
    return getMiniMusicMetas();
}

/**
 * songs 데이터 가져오기
 * 외부 URL에서 fetch 시도 후 실패 시 로컬 파일 사용
 */
export async function getSongOptions() {
    if (cachedSongOptions) return applyDateFilter(cachedSongOptions);

    try {
        const apiData = await fetchJsonWithTimeout(
            joinUrl(API_BASE_URL, 'api/songs'),
            SONG_OPTIONS_TIMEOUT_MS,
        );
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
    return cachedMusicMetas || cachedMiniMusicMetas || ESSENTIAL_MUSIC_METAS;
}

export function getMusicMetaSync(songId, difficulty) {
    return getCachedMusicMetaLookup().get(makeMusicMetaKey(songId, difficulty));
}

export function getSongOptionsSync() {
    return applyDateFilter(cachedSongOptions || localSongOptions);
}
