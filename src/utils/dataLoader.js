// Fallback data
import localMusicMetas from '../data/music_metas.json';
import { SONG_OPTIONS as localSongOptions } from './songs';

let cachedMusicMetas = null;
let cachedSongOptions = null;

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
    };
}

/**
 * music_metas.json 가져오기
 * 외부 URL에서 fetch 시도 후 실패 시 로컬 파일 사용
 */
export async function getMusicMetas() {
    if (cachedMusicMetas) return cachedMusicMetas;

    try {
        const response = await fetch('https://asset.rilaksekai.com/music_metas.json');
        if (!response.ok) throw new Error('Fetch failed');
        cachedMusicMetas = await response.json();
        console.log('Loaded music_metas from external API');
        return cachedMusicMetas;
    } catch (error) {
        console.warn('Failed to fetch music_metas from API, using local fallback:', error.message);
        cachedMusicMetas = localMusicMetas;
        return cachedMusicMetas;
    }
}

/**
 * songs 데이터 가져오기
 * 외부 URL에서 fetch 시도 후 실패 시 로컬 파일 사용
 */
export async function getSongOptions() {
    if (cachedSongOptions) return cachedSongOptions;

    try {
        const response = await fetch('https://api.rilaksekai.com/api/songs');
        if (!response.ok) throw new Error('Fetch failed');
        const apiData = await response.json();
        // API 응답을 로컬 형식으로 변환
        cachedSongOptions = apiData.map(normalizeSong);
        console.log('Loaded songs from external API');
        return cachedSongOptions;
    } catch (error) {
        console.warn('Failed to fetch songs from API, using local fallback:', error.message);
        cachedSongOptions = localSongOptions;
        return cachedSongOptions;
    }
}

/**
 * 동기적으로 사용해야 할 때 캐시된 데이터 또는 로컬 fallback 반환
 */
export function getMusicMetasSync() {
    return cachedMusicMetas || localMusicMetas;
}

export function getSongOptionsSync() {
    return cachedSongOptions || localSongOptions;
}
