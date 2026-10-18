// Shared character-rank theory engine. Also used by prsk-calc via sync-character-rank.mjs.
import { expandMissionParameters, birthdayRewardAvailable, cardReleaseAt, CHALLENGE_START } from './progression.js';
import { characterBirthdays } from '../data/characterBirthdays.js';

export const isMissionExpCapped = stat => stat.expCap != null && stat.count >= stat.expCap
    && !['collect_costume_3d', 'play_live', 'waiting_room'].includes(stat.baseType)
    && !stat.baseType?.startsWith('area_item_level_up_');

// Share display order, counts and birthday eligibility between totals and details.
export const ETC_REWARDS = [
    { key: 'BIRTHDAY_2027', count: 1, cycleEndYear: 2027 },
    { key: 'SOLO_LIVE_6', count: 3 },
    { key: 'MEMORIAL_6', count: 1 },
    { key: 'BIRTHDAY_2026', count: 1, cycleEndYear: 2026 },
    { key: 'PASS_MISSION_TICKET', count: 5 },
    { key: 'WLINK_3', count: 2 },
    { key: 'EXCHANGE_5_5', count: 3 },
    { key: 'NEW_YEAR_BAG_26', count: 3 },
    { key: 'MEMORIAL_5_ERROR', count: 1 },
    { key: 'MEMORIAL_5', count: 1 },
    { key: 'EXCHANGE_5', count: 2 },
    { key: 'WLINK_2', count: 2 },
    { key: 'EXCHANGE_4_5', count: 2 },
    { key: 'MOVIE_STAMP', count: 2 },
    { key: 'EXCHANGE_4', count: 2 },
    { key: 'MEMORIAL_4_DUP', count: 1 },
    { key: 'WLINK_1', count: 2 },
    { key: 'STAMP_3', count: 3 },
    { key: 'STAMP_2', count: 3 },
];

export function getCharacterRankRewards(characterId, now) {
    const birthday = characterBirthdays.find(row => Number(row.image) === characterId)?.date;
    return ETC_REWARDS.map(reward => ({ ...reward,
        isPassed: !reward.cycleEndYear || birthdayRewardAvailable(birthday, reward.cycleEndYear, now) }));
}

// VS Variants Map (Main ID -> Variant IDs including Self)
const VS_VARIANT_MAP = {
    21: [21, 27, 28, 29, 30, 31], // Miku
    22: [22, 32, 33, 34, 35, 36], // Rin
    23: [23, 37, 38, 39, 40, 41], // Len
    24: [24, 42, 43, 44, 45, 46], // Luka
    25: [25, 47, 48, 49, 50, 51], // MEIKO
    26: [26, 52, 53, 54, 55, 56], // KAITO
};


export function characterRankCriteriaAt({ cards, characterId, now, commonArea, challenge }) {
    const variants = VS_VARIANT_MAP[characterId] || [characterId];
    const birthday = characterBirthdays.find(row => Number(row.image) === characterId)?.date;
    const dates = [CHALLENGE_START, commonArea?.levelReachedAt, challenge?.lastRankUpAt,
        ...cards.filter(card => variants.includes(card.characterId)).map(cardReleaseAt)];
    if (birthday) {
        const [month, day] = birthday.split('.');
        for (const year of [2026, 2027]) dates.push(Date.parse(`${Number(month) >= 10 ? year - 1 : year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00+09:00`));
    }
    return Math.max(0, ...dates.filter(date => Number.isFinite(date) && date <= now));
}

export function calculateCharacterRankTheory({ cards, stamps, actionSets, voices, musicVocals, cardEpisodes, mySekaiTalkCounts, ingameCutinCharacters, releaseConditions, sdToBaseIdMap, charIdToFixtureTagId, fixtures, characterMissionsJP, parameterGroups, levelsData, challengeState, commonAreaLevel, rankDate, texts, commonArea = null, now = rankDate, characterIds = Array.from({ length: 26 }, (_, i) => i + 1) }) {
        const charIds = characterIds;
        const result = { included: {}, excluded: {} };


        // Helper to calculate rank from total EXP
        const calculateRank = (totalExp) => {
            let rank = 1;
            for (const levelData of levelsData.filter(l => l.levelType === 'character').sort((a, b) => a.level - b.level)) {
                if (totalExp >= levelData.totalExp) {
                    rank = levelData.level;
                } else {
                    break;
                }
            }
            return rank;
        };

        const activeMissions = characterMissionsJP;
        // Group missions by char
        const charMissions = {};
        activeMissions.forEach(m => {
            if (!charMissions[m.characterId]) charMissions[m.characterId] = [];
            charMissions[m.characterId].push(m);
        });



        const activeLevelsData = levelsData
            .filter(l => l.levelType === 'character')
            .sort((a, b) => a.level - b.level); // Ensure sorted by Level for correct reduce logic

        charIds.forEach(charId => {
            // Only stamps and archive voices differ. Reuse all other asset counts
            // so displaying both ranks does not repeat the expensive scans.
            const sharedCounts = new Map();
            for (const excludeKizuna of [false, true]) {
                const challenge = challengeState.result[charId];
                const missions = charMissions[charId] || []; // default to empty if missing (e.g. VS?) VS are 21-26, they are in JSON.
                // If charId 1 missions are used as template (as in missions tab), we should replicate that?
                // Missions tab: `if (m.characterId === 1)` logic used to display LIST.
                // But for calculation we need ACTUAL missions for that character if they differ?
                // Usually structure is identical.
                // Use specific char missions if available, else fallback to Char 1 structure adapted?
                // `characterMissionsV2s.json` contains missions for all chars 1-26.
                // So we iterate `missions`.

                // Include other rewards when checking rank-gated stamps too.
                const etcRewards = getCharacterRankRewards(charId, rankDate);
                const etcExp = etcRewards.reduce((sum, reward) => sum + (reward.isPassed ? reward.count : 0), 0);

                const missionStats = [];
                let grandTotalExp = 0;

                let stampInfo = { safeCount: 0, totalCount: 0, rank168Count: 0 };
                missions.forEach(m => {
                    const type = m.characterMissionType;
                    const isEx = type.endsWith('_ex');
                    const baseType = isEx ? type.replace('_ex', '') : type;
                    const pGroup = parameterGroups.filter(g => g.id === m.parameterGroupId).sort((a, b) => a.seq - b.seq);

                    // 1. Determine "My Count" (The Theoretical Max Count for this user/world)
                    let myCount = 0;
                    let isGrind = false;

                    const sharesCount = !['collect_stamp', 'collect_character_archive_voice'].includes(baseType);
                    const cachedCount = sharesCount && sharedCounts.get(m);
                    if (cachedCount) {
                        myCount = cachedCount.count;
                        isGrind = cachedCount.isGrind;
                    } else switch (baseType) {
                        case 'play_live':
                        case 'waiting_room':
                        case 'area_item_level_up_character':
                        case 'area_item_level_up_unit':
                        case 'area_item_level_up_reality_world':
                            myCount = Math.max(0, ...expandMissionParameters(pGroup, isEx).filter(row => row.exp > 0).map(row => row.requirement));
                            isGrind = true;
                            break;
                        case 'area_item_level_up_all_character':
                            myCount = commonAreaLevel;
                            break;

                        case 'collect_mysekai_fixture':
                            // User Request: Count fixtures with specific Character Tag.
                            {
                                const tagId = charIdToFixtureTagId[charId];
                                if (tagId) {
                                    myCount = fixtures.filter(f => {
                                        if (!f.mysekaiFixtureTagGroup) return false;
                                        const g = f.mysekaiFixtureTagGroup;
                                        return g.mysekaiFixtureTagId1 === tagId ||
                                            g.mysekaiFixtureTagId2 === tagId ||
                                            g.mysekaiFixtureTagId3 === tagId ||
                                            g.mysekaiFixtureTagId4 === tagId;
                                    }).length;
                                } else {
                                    myCount = 0;
                                }
                            }
                            break;

                        case 'collect_mysekai_canvas':
                            // User Request: Use Card Count
                            // Fix: VS Variants
                            {
                                const variants = VS_VARIANT_MAP[charId] || [charId];
                                myCount = cards.filter(c => variants.includes(c.characterId)).length;
                            }
                            break;

                        case 'read_mysekai_fixture_unique_character_talk':
                            // User Request: Use MySekai Talks count
                            // Fix: Aggregate VS Variants for VS chars (21-26) and count UNIQUE talks
                            {
                                const variants = VS_VARIANT_MAP[charId] || [charId];
                                const uniqueTalks = new Set();
                                variants.forEach(vid => {
                                    if (mySekaiTalkCounts[vid]) {
                                        mySekaiTalkCounts[vid].forEach(talkId => uniqueTalks.add(talkId));
                                    }
                                });
                                myCount = uniqueTalks.size;
                            }
                            break;

                        case 'collect_member':
                            {
                                // Weighted Count:
                                // 3★/4★: 2
                                // 1★/2★/Birthday: 1
                                // Fix: Aggregate VS Variants and proper Birthday check
                                const variants = VS_VARIANT_MAP[charId] || [charId];
                                const weightedCount = cards.reduce((acc, c) => {
                                    if (!variants.includes(c.characterId)) return acc;
                                    const r = c.rarity;
                                    const type = c.type;
                                    const isBirthday = r === 'birthday' || c.cardRarityType === 'birthday' || type === 'Birthday' || type === 'Anniversary';
                                    if (isBirthday) return acc + 1;
                                    if (Number(r) >= 3) return acc + 2;
                                    return acc + 1;
                                }, 0);

                                myCount = weightedCount;
                                if (charId === 21) myCount -= 1; // Miku Exception
                            }
                            break;

                        case 'collect_costume_3d':
                            // Fix: User request "Just show MAX".
                            // Use Theoretical Max Requirement.
                            if (pGroup.length > 0) {
                                myCount = pGroup[pGroup.length - 1].requirement;
                            }
                            isGrind = true;
                            break;

                        case 'collect_stamp':
                            {
                                const variants = VS_VARIANT_MAP[charId] || [charId];

                                // 1. Get all valid stamps for this character
                                const charStamps = stamps.filter(s => {
                                    if (excludeKizuna && s.characterId2) return false;
                                    return variants.includes(s.characterId1) ||
                                        variants.includes(s.characterId2) ||
                                        variants.includes(s.characterId3);
                                });

                                // 2. Separate Rank 168 stamps
                                const rank168Stamps = charStamps.filter(s => s.description && s.description.includes('キャラクターランク') && s.description.includes('168'));
                                const safeStamps = charStamps.filter(s => !rank168Stamps.includes(s));

                                // 3. Count for initial calculation (Safe only)
                                myCount = safeStamps.length;

                                // Store for potential upgrade later
                                stampInfo.safeCount = safeStamps.length;
                                stampInfo.totalCount = charStamps.length;
                                stampInfo.rank168Count = rank168Stamps.length;
                            }
                            break;

                        case 'read_area_talk':
                                // Fix: Use dynamic sdToBaseIdMap to handle all variant IDs/Next Grade versions.
                                // Filters based on AreaTalkTab.jsx logic.
                                if (actionSets && actionSets.length > 0) {
                                    myCount = actionSets.filter(as => {
                                        // 1. Basic Type Filter (Exclude event specialized ones if any, but include limited/normal/etc)
                                        const isValidType = (!as.actionSetType ||
                                            as.actionSetType === 'normal' ||
                                            as.actionSetType === 'piapro_unit_not_mixed_in_area' ||
                                            as.actionSetType === 'limited');

                                        if (!isValidType || !as.scenarioId) return false;

                                        // 2. Character Matching
                                        // Check if target charId is involved in this talk by mapping all its variant IDs to base ID.
                                        if (as.characterIds) {
                                            return as.characterIds.some(sid => sdToBaseIdMap[sid] === charId);
                                        }
                                        if (as.characters) {
                                            return as.characters.some(c => sdToBaseIdMap[c.gameCharacterId] === charId);
                                        }
                                        return false;
                                    }).length;
                                } else {
                                    myCount = 0;
                                }
                            isGrind = false;
                            break;

                        case 'read_card_episode_first':
                            // Use `cardEpisodes` (Side Story Front) from suite
                            // Fix: VS Variants
                            {
                                const variants = VS_VARIANT_MAP[charId] || [charId];
                                myCount = cardEpisodes.filter(e => {
                                    const c = cards.find(card => card.id === e.cardId);
                                    return c && variants.includes(c.characterId) && e.cardEpisodePartType === 'first_part';
                                }).length;
                            }
                            break;

                        case 'read_card_episode_second':
                            // Fix: VS Variants
                            {
                                const variants = VS_VARIANT_MAP[charId] || [charId];
                                myCount = cardEpisodes.filter(e => {
                                    const c = cards.find(card => card.id === e.cardId);
                                    return c && variants.includes(c.characterId) && e.cardEpisodePartType === 'second_part';
                                }).length;
                            }
                            break;

                        case 'collect_another_vocal':
                            // Fix: VS Variants
                            {
                                const variants = VS_VARIANT_MAP[charId] || [charId];
                                myCount = musicVocals.filter(v => {
                                    const isAV = v.musicVocalType === 'another_vocal' ||
                                        (v.assetbundleName && v.assetbundleName.startsWith('an_')) ||
                                        (v.caption && v.caption.includes('アナザー'));
                                    if (!isAV) return false;
                                    return v.characters && v.characters.some(c => variants.includes(c.characterId));
                                }).length;
                            }
                            break;

                        case 'collect_character_archive_voice':
                            // Archive Voices
                            // Fix: VS Variants
                            {
                                const variants = VS_VARIANT_MAP[charId] || [charId];
                                const validTypes = ['live_cutin_normal', 'live_cutin_pair', 'live_result', 'collect_card'];
                                myCount = voices.filter(v => {
                                    if (!variants.includes(v.gameCharacterId) || !validTypes.includes(v.characterArchiveVoiceType)) return false;

                                    if (excludeKizuna && v.characterArchiveVoiceType === 'live_cutin_pair') {
                                        if (v.externalId) {
                                            const cutinInfo = ingameCutinCharacters.find(c => c.id === v.externalId);
                                            if (cutinInfo && cutinInfo.releaseConditionId) {
                                                const condition = releaseConditions.find(rc => rc.id === cutinInfo.releaseConditionId);
                                                // Check for "Kizuna Rank" (Japanese) in release condition
                                                if (condition && condition.sentence && condition.sentence.includes('キズナランク')) {
                                                    return false;
                                                }
                                            }
                                        }
                                    }
                                    return true;
                                }).length;
                            }
                            isGrind = false;
                            break;

                        case 'skill_level_up_rare':
                            // 4*/BD/AN. Max Skill Lv 4 -> 4 points per card?
                            // Mission: "Skill Level Up" (Count of level ups).
                            // Lv 1 -> 4 = 3 level ups.
                            // So (Count of rarity>=4) * 3 ?
                            // Wait, mission usually says "Cumulative Skill Level" or "Level Up Count"?
                            // "Skill Level Up" usually means number of times you leveled up.
                            // Start at 1. Max 4. So 3 upgrades per card.
                            {
                                const variants = VS_VARIANT_MAP[charId] || [charId];
                                const count = cards.filter(c =>
                                    variants.includes(c.characterId) &&
                                    (c.rarity === 'birthday' || c.cardRarityType === 'birthday' || c.type === 'birthday' || c.type === 'Birthday' || c.type === 'Anniversary' || Number(c.rarity) >= 4)
                                ).length;
                                myCount = count * 3;
                            }
                            break;

                        case 'skill_level_up_standard':
                            // 1*~3*.
                            // Exclude Birthday types (which might have rarity 3 but are treated as Rare/4* equivalent for Rank).
                            {
                                const variants = VS_VARIANT_MAP[charId] || [charId];
                                myCount = cards.filter(c =>
                                    variants.includes(c.characterId) &&
                                    Number(c.rarity) <= 3 &&
                                    c.rarity !== 'birthday' &&
                                    c.cardRarityType !== 'birthday' &&
                                    c.type !== 'birthday' &&
                                    c.type !== 'Birthday' &&
                                    c.type !== 'Anniversary'
                                ).length * 3;
                            }
                            break;

                        case 'master_rank_up_rare':
                            // 4*/BD/AN. Max MR 5.
                            // Fix: Include Birthday.
                            {
                                const variants = VS_VARIANT_MAP[charId] || [charId];
                                myCount = cards.filter(c =>
                                    variants.includes(c.characterId) &&
                                    (c.rarity === 'birthday' || c.cardRarityType === 'birthday' || c.type === 'birthday' || c.type === 'Birthday' || c.type === 'Anniversary' || Number(c.rarity) >= 4)
                                ).length * 5;
                            }
                            break;

                        case 'master_rank_up_standard':
                            // 1*~3*. Max MR 5?
                            // Exclude Birthday types.
                            {
                                const variants = VS_VARIANT_MAP[charId] || [charId];
                                myCount = cards.filter(c =>
                                    variants.includes(c.characterId) &&
                                    Number(c.rarity) <= 3 &&
                                    c.rarity !== 'birthday' &&
                                    c.cardRarityType !== 'birthday' &&
                                    c.type !== 'birthday' &&
                                    c.type !== 'Birthday' &&
                                    c.type !== 'Anniversary'
                                ).length * 5;
                            }
                            break;
                        default:
                            break;
                    }

                    if (sharesCount && !cachedCount) sharedCounts.set(m, { count: myCount, isGrind });

                    // 2. Calculate EXP based on myCount and pGroup
                    let exp = 0;
                    let nextGoal = '-'; // Default
                    const expSteps = (isEx ? expandMissionParameters(pGroup, true) : pGroup).filter(row => row.exp > 0);
                    const expCap = expSteps.length ? Math.max(...expSteps.map(row => row.requirement)) : null;

                    if (isEx && pGroup.length > 0) {
                        const steps = expSteps;
                        exp = steps.filter(row => row.requirement <= myCount).reduce((sum, row) => sum + row.exp, 0);
                        nextGoal = steps.at(-1)?.requirement || 0;
                    } else if (isGrind) {
                        // Normal Grind (Dense Data): Sum of EXP
                        exp = pGroup.reduce((sum, lvl) => sum + lvl.exp, 0);
                        nextGoal = pGroup[pGroup.length - 1].requirement; // Show Max Req e.g. 50000
                    } else {
                        // Asset Logic
                        pGroup.forEach((lvl) => {
                            if (myCount >= lvl.requirement) {
                                exp += lvl.exp;
                            }
                        });
                        // Find next requirement
                        const nextLvl = pGroup.find(lvl => lvl.requirement > myCount);
                        if (nextLvl) {
                            nextGoal = nextLvl.requirement;
                        } else if (pGroup.length > 0) {
                            nextGoal = pGroup[pGroup.length - 1].requirement;
                        }
                    }

                    grandTotalExp += exp;

                    missionStats.push({
                        type, // e.g. play_live, play_live_ex
                        baseType, // e.g. play_live
                        name: texts.MISSION[baseType] || baseType,
                        count: myCount,
                        nextGoal, // Pass Next Goal
                        expCap,
                        nextExpGoal: expSteps.find(row => row.requirement > myCount)?.requirement ?? null,
                        isGrind,
                        isEx,
                        exp
                    });
                });

                // 2.5 Iterative Rank Calculation for Stamps
                // The rank calculation logic needs to be run to determine if Rank 168 stamps should be included.
                // Calculate Base Rank (Standard logic)
                const baseTotalExpForCheck = grandTotalExp + challenge.exp + etcExp;
                const currentRank = calculateRank(baseTotalExpForCheck);

                if (stampInfo.rank168Count > 0 && currentRank >= 168) {
                    // Find stamp mission
                    const stampMission = missions.find(m => m.characterMissionType === 'collect_stamp');
                    if (stampMission) {
                        const pGroup = parameterGroups.filter(g => g.id === stampMission.parameterGroupId).sort((a, b) => a.seq - b.seq);

                        // Calculate Old EXP (Safe Count)
                        let oldExp = 0;
                        pGroup.forEach(lvl => { if (stampInfo.safeCount >= lvl.requirement) oldExp += lvl.exp; });

                        // Calculate New EXP (Total Count)
                        let newExp = 0;
                        pGroup.forEach(lvl => { if (stampInfo.totalCount >= lvl.requirement) newExp += lvl.exp; });

                        // Add Difference
                        const diff = newExp - oldExp;
                        grandTotalExp += diff;

                        // Update Mission Stats for Display
                        const statEntry = missionStats.find(s => s.baseType === 'collect_stamp');
                        if (statEntry) {
                            statEntry.count = stampInfo.totalCount;
                            statEntry.exp = newExp;
                            statEntry.nextExpGoal = pGroup.find(row => row.exp > 0 && row.requirement > stampInfo.totalCount)?.requirement ?? null;
                            // re-calc next goal
                            const nextLvl = pGroup.find(lvl => lvl.requirement > stampInfo.totalCount);
                            if (nextLvl) statEntry.nextGoal = nextLvl.requirement;
                            else if (pGroup.length > 0) statEntry.nextGoal = pGroup[pGroup.length - 1].requirement;
                        }
                    }
                }

                // Rank EXP is awarded on stage completion, not on entering a stage.
                grandTotalExp += challenge.exp;
                missionStats.push({
                    type: 'challenge_stage', baseType: 'challenge_stage', name: texts.UI.CHALLENGE_EX,
                    count: challenge.rank, nextGoal: challenge.maxRank + 1,
                    isGrind: false, isEx: challenge.isEx, exp: challenge.exp
                });

                // Sort mission breakdowns before appending other rewards.
                // ... (Existing Etc Logic below) ...

                // Custom Sort Order
                const SORT_PRIORITY = {
                    'collect_member': 1,
                    'collect_costume_3d': 2,
                    'collect_another_vocal': 3,
                    'read_area_talk': 4,
                    'collect_stamp': 5,
                    'collect_character_archive_voice': 6,
                    'read_mysekai_fixture_unique_character_talk': 7,
                    'play_live': 8, // Leader Live
                    'waiting_room': 9, // Waiting Room
                    // Others follow
                };

                const getPriority = (type) => SORT_PRIORITY[type] || 99;

                missionStats.sort((a, b) => {
                    // 1. Primary Sort by Base Type Priority
                    const pA = getPriority(a.baseType || a.type);
                    const pB = getPriority(b.baseType || b.type);
                    if (pA !== pB) return pA - pB;

                    // 2. Secondary Sort: Normal before EX
                    if (a.baseType === b.baseType) {
                        if (a.isEx && !b.isEx) return 1;
                        if (!a.isEx && b.isEx) return -1;
                    }

                    return 0;
                });

                if (etcExp > 0) {
                    grandTotalExp += etcExp;
                    missionStats.push({
                        type: 'etc',
                        name: texts.UI.ETC,
                        count: etcExp,
                        nextGoal: etcExp,
                        isGrind: false,
                        isEx: false,
                        exp: etcExp,
                        isEtc: true,
                        rewards: etcRewards
                    });
                }

                // 4. Calculate Final Rank from GrandTotalExp
                const currentLevelObj = activeLevelsData.reduce((prev, curr) => {
                    if (curr.totalExp <= grandTotalExp) return curr;
                    return prev;
                }, activeLevelsData[0]);

                const currentLevel = currentLevelObj ? currentLevelObj.level : 1;
                const excessExp = grandTotalExp - (currentLevelObj ? currentLevelObj.totalExp : 0);

                // Decimal Rank: Calculate linear increase (0.1 per 1 EXP) as requested
                const decimalRank = Math.min(activeLevelsData.at(-1).level, currentLevel + (excessExp / 10));

                result[excludeKizuna ? 'excluded' : 'included'][charId] = {
                    criteriaAt: characterRankCriteriaAt({ cards, characterId: charId, now, commonArea, challenge }),
                    rank: decimalRank,
                    baseRank: currentLevel,
                    totalExp: grandTotalExp,
                    stats: missionStats,
                    challenge
                };
            }
        });

        return result;
}
