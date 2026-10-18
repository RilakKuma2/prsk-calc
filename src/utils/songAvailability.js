// Shared by the song list and common-area reward calculation.
export const LIMITED_SONG_IDS = [707, 708, 709];
export const isRegularSong = song => !LIMITED_SONG_IDS.includes(Number(song.id));

export function songReleaseAt(song) {
    if (Number(song.publishedAt) > 0) return Number(song.publishedAt);
    const date = String(song.release_date || song.publishedAt || '').match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    return date ? Date.parse(`${date[1]}-${date[2].padStart(2, '0')}-${date[3].padStart(2, '0')}T00:00:00+09:00`) : Infinity;
}

export function countSongAvailability(songs, now = Date.now()) {
    const regular = new Map(songs.filter(isRegularSong).map(song => [Number(song.id), song]));
    let released = 0, upcoming = 0;
    for (const song of regular.values()) {
        const releaseAt = songReleaseAt(song);
        if (releaseAt <= now) released++;
        else if (Number.isFinite(releaseAt)) upcoming++;
    }
    return { released, upcoming };
}
