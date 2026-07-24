import {
    POWER_AUTO_SONG_OPTIONS,
    getPowerAutoSong,
} from './powerAutoSongs';

describe('power-table auto song options', () => {
    test('contains the requested five songs with their auto difficulties', () => {
        expect(POWER_AUTO_SONG_OPTIONS.map(({ key, songId, difficulty }) => ({
            key,
            songId,
            difficulty,
        }))).toEqual([
            { key: 'creation_myth', songId: 186, difficulty: 'master' },
            { key: 'sage', songId: 448, difficulty: 'master' },
            { key: 'cendrillon', songId: 104, difficulty: 'master' },
            { key: 'viva_happy', songId: 11, difficulty: 'append' },
            { key: 'envy', songId: 74, difficulty: 'master' },
        ]);
    });

    test('defaults invalid saved values to Creation Myth', () => {
        expect(getPowerAutoSong('missing').key).toBe('creation_myth');
    });
});
