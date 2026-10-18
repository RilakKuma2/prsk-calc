import { bundledRankMaster, createRankMissionIndex, rankMissionStatus, challengeRankExp } from './characterRankData';
import { expandMissionParameters } from './progression';
import { getCharacterRankRewards, isMissionExpCapped } from './characterRankTheory';
const index = createRankMissionIndex(bundledRankMaster);
const status = (id, type, count) => rankMissionStatus(index.get(`${id}:${type}`), count, type.endsWith('_ex'));

test('updated mission caps and VS area requirements use each character’s master group', () => {
    expect(status(1, 'read_area_talk', 1000)).toMatchObject({ exp: 35, expCap: 300, capped: true });
    expect(status(1, 'collect_character_archive_voice', 1000)).toMatchObject({ exp: 35, expCap: 350 });
    expect(status(1, 'area_item_level_up_unit', 40).exp).toBe(20);
    expect(status(21, 'area_item_level_up_unit', 40).exp).toBe(8);
    for (let id = 21; id <= 26; id++) expect(status(id, 'area_item_level_up_unit', 100).exp).toBe(20);
    expect(status(1, 'area_item_level_up_all_character', 4).exp).toBe(4);
});

test('EX progress matches the expanded master and stops EXP at the cap', () => {
    for (const type of ['play_live_ex', 'waiting_room_ex']) {
        const rows = index.get(`1:${type}`);
        const expanded = expandMissionParameters(rows, true);
        for (const row of expanded) for (const count of [row.requirement - 1, row.requirement, row.requirement + 1]) {
            expect(status(1, type, count).exp).toBe(expanded.filter(step => step.requirement <= count).reduce((sum, step) => sum + step.exp, 0));
        }
        expect(status(1, type, 1e12).exp).toBe(expanded.reduce((sum, row) => sum + row.exp, 0));
    }
});

test('challenge EXP belongs to the selected character and only completed stages count', () => {
    expect(challengeRankExp(bundledRankMaster.stages, 1, 151)).toBe(150);
    expect(challengeRankExp(bundledRankMaster.stages, 21, 201)).toBe(200);
    expect(challengeRankExp(bundledRankMaster.stages, 21, 9999)).toBe(200);
});

test('cap color exempts costumes, leader, waiting room and every area type', () => {
    expect(isMissionExpCapped({ baseType: 'read_area_talk', count: 300, expCap: 300 })).toBe(true);
    expect(isMissionExpCapped({ baseType: 'read_area_talk', count: 299, expCap: 300 })).toBe(false);
    for (const baseType of ['collect_costume_3d', 'play_live', 'waiting_room', 'area_item_level_up_character', 'area_item_level_up_unit', 'area_item_level_up_reality_world', 'area_item_level_up_all_character']) {
        expect(isMissionExpCapped({ baseType, count: 999, expCap: 20 })).toBe(false);
    }
});

test('anniversary rewards include WL3 and distinguish 2027 birthdays by date', () => {
    const now = Date.parse('2026-10-18T12:00:00+09:00');
    const haruka = getCharacterRankRewards(6, now), honami = getCharacterRankRewards(3, now);
    expect(haruka.slice(0, 4).map(row => row.key)).toEqual(['BIRTHDAY_2027', 'SOLO_LIVE_6', 'MEMORIAL_6', 'BIRTHDAY_2026']);
    expect(haruka[0].isPassed).toBe(true);
    expect(honami[0].isPassed).toBe(false);
    expect(haruka.find(row => row.key === 'WLINK_3')).toMatchObject({ count: 2, isPassed: true });
});
