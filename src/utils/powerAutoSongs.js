export const POWER_AUTO_SONG_OPTIONS = Object.freeze([
    Object.freeze({
        key: 'creation_myth',
        songId: 186,
        difficulty: 'master',
        translationKey: 'power.songs.auto_creation_myth',
    }),
    Object.freeze({
        key: 'sage',
        songId: 448,
        difficulty: 'master',
        translationKey: 'power.songs.auto_sage',
    }),
    Object.freeze({
        key: 'cendrillon',
        songId: 104,
        difficulty: 'master',
        translationKey: 'power.songs.auto_cendrillon',
    }),
    Object.freeze({
        key: 'viva_happy',
        songId: 11,
        difficulty: 'append',
        translationKey: 'power.songs.auto_viva_happy',
    }),
    Object.freeze({
        key: 'envy',
        songId: 74,
        difficulty: 'master',
        translationKey: 'power.songs.auto_envy',
    }),
]);

const DEFAULT_POWER_AUTO_SONG = POWER_AUTO_SONG_OPTIONS[0];

export const getPowerAutoSong = (key) => (
    POWER_AUTO_SONG_OPTIONS.find(option => option.key === key)
    || DEFAULT_POWER_AUTO_SONG
);
