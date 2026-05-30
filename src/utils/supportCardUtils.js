export const SUPPORT_CHARACTERS = [
    { id: 1, name: '이치카', aliases: ['이치카', '호시노 이치카'] },
    { id: 2, name: '사키', aliases: ['사키', '텐마 사키'] },
    { id: 3, name: '호나미', aliases: ['호나미', '모치즈키 호나미'] },
    { id: 4, name: '시호', aliases: ['시호', '히노모리 시호'] },
    { id: 5, name: '미노리', aliases: ['미노리', '하나사토 미노리'] },
    { id: 6, name: '하루카', aliases: ['하루카', '키리타니 하루카'] },
    { id: 7, name: '아이리', aliases: ['아이리', '모모이 아이리'] },
    { id: 8, name: '시즈쿠', aliases: ['시즈쿠', '히노모리 시즈쿠'] },
    { id: 9, name: '코하네', aliases: ['코하네', '아즈사와 코하네'] },
    { id: 10, name: '안', aliases: ['안', '시라이시 안'] },
    { id: 11, name: '아키토', aliases: ['아키토', '시노노메 아키토'] },
    { id: 12, name: '토우야', aliases: ['토우야', '아오야기 토우야'] },
    { id: 13, name: '츠카사', aliases: ['츠카사', '텐마 츠카사'] },
    { id: 14, name: '에무', aliases: ['에무', '오오토리 에무', '오토리 에무'] },
    { id: 15, name: '네네', aliases: ['네네', '쿠사나기 네네'] },
    { id: 16, name: '루이', aliases: ['루이', '카미시로 루이'] },
    { id: 17, name: '카나데', aliases: ['카나데', '요이사키 카나데'] },
    { id: 18, name: '마후유', aliases: ['마후유', '아사히나 마후유'] },
    { id: 19, name: '에나', aliases: ['에나', '시노노메 에나'] },
    { id: 20, name: '미즈키', aliases: ['미즈키', '아키야마 미즈키'] },
    { id: 21, name: '미쿠', aliases: ['미쿠', '하츠네 미쿠'] },
    { id: 22, name: '린', aliases: ['린', '카가미네 린'] },
    { id: 23, name: '렌', aliases: ['렌', '카가미네 렌'] },
    { id: 24, name: '루카', aliases: ['루카', '메구리네 루카'] },
    { id: 25, name: '메이코', aliases: ['메이코', 'MEIKO'] },
    { id: 26, name: '카이토', aliases: ['카이토', 'KAITO'] },
];

const SUPPORT_UNIT_GROUPS = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
    [17, 18, 19, 20],
    [21, 22, 23, 24, 25, 26],
];

const CHARACTER_NAME_TO_ID = SUPPORT_CHARACTERS.reduce((acc, character) => {
    character.aliases.forEach(alias => {
        acc[alias] = character.id;
    });
    return acc;
}, {});

export const parseSupportDate = (dateStr) => {
    if (!dateStr) return null;

    const parts = String(dateStr)
        .split('.')
        .map(part => part.trim())
        .filter(Boolean);

    if (parts.length < 3) return null;

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

export const getCardCharacterId = (card) => {
    if (!card) return null;
    return CHARACTER_NAME_TO_ID[card.character] || null;
};

const CHAR_NAMES = {
    1:  { ko: '\uc774\uce58\uce74',  ja: '\u4e00\u6b4c',   en: 'Ichika'  },
    2:  { ko: '\uc0ac\ud0a4',   ja: '\u54b2\u5e0c',   en: 'Saki'    },
    3:  { ko: '\ud638\ub098\ubbf8',  ja: '\u7a42\u6ce2',   en: 'Honami'  },
    4:  { ko: '\uc2dc\ud638',   ja: '\u5fd7\u6b69',   en: 'Shiho'   },
    5:  { ko: '\ubbf8\ub178\ub9ac',  ja: '\u307f\u306e\u308a',  en: 'Minori'  },
    6:  { ko: '\ud558\ub8e8\uce74',  ja: '\u6625\u6f14',   en: 'Haruka'  },
    7:  { ko: '\uc544\uc774\ub9ac',  ja: '\u611b\u308a',   en: 'Airi'    },
    8:  { ko: '\uc2dc\uc988\ucfe0',  ja: '\u5c0f\u96f9',   en: 'Shizuku' },
    9:  { ko: '\ucf54\ud558\ub124',  ja: '\u5c0f\u5e0c',   en: 'Kohane'  },
    10: { ko: '\uc548',      ja: '\u9752\u5c71',   en: 'An'      },
    11: { ko: '\uc544\ud0a4\ud1a0',  ja: '\u57ce\u4e43',   en: 'Akito'   },
    12: { ko: '\ud1a0\uc6b0\uc57c',  ja: '\u5f39\u538b',   en: 'Touya'   },
    13: { ko: '\uce20\uce74\uc0ac',  ja: '\u53f8',    en: 'Tsukasa' },
    14: { ko: '\uc5d0\ubb34',   ja: '\u9060\u5c71',   en: 'Emu'     },
    15: { ko: '\ub124\ub124',   ja: '\u3082\u3082',   en: 'Nene'    },
    16: { ko: '\ub8e8\uc774',   ja: '\u7c89\u96ea',   en: 'Rui'     },
    17: { ko: '\uce74\ub098\ub370',  ja: '\u594f',    en: 'Kanade'  },
    18: { ko: '\ub9c8\ud6c4\uc720',  ja: '\u771f\u586b',   en: 'Mafuyu'  },
    19: { ko: '\uc5d0\ub098',   ja: '\u7d75\u5948',   en: 'Ena'     },
    20: { ko: '\ubbf8\uc988\ud0a4',  ja: '\u745e\u5e0c',   en: 'Mizuki'  },
    21: { ko: '\ubbf8\ucfe0',   ja: '\u307f\u304f',   en: 'Miku'    },
    22: { ko: '\ub9b0',      ja: '\u308a\u3093',   en: 'Rin'     },
    23: { ko: '\ub80c',      ja: '\u308c\u3093',   en: 'Len'     },
    24: { ko: '\ub8e8\uce74',   ja: '\u308b\u304b',   en: 'Luka'    },
    25: { ko: '\uba54\uc774\ucf54',  ja: 'MEIKO',  en: 'MEIKO'   },
    26: { ko: '\uce74\uc774\ud1a0',  ja: 'KAITO',  en: 'KAITO'   },
};

export const getCardCharacterName = (id, language) => {
    const entry = CHAR_NAMES[Number(id)];
    if (!entry) return '';
    if (language === 'ja') return entry.ja;
    if (language === 'en') return entry.en;
    return entry.ko;
};


export const getSupportUnitMemberIds = (id) => {
    const numericId = Number(id);
    return SUPPORT_UNIT_GROUPS.find(group => group.includes(numericId)) || [numericId];
};

export const isWorldLinkCard = (card) => {
    if (!card || !card.available_from) return false;
    const date = parseSupportDate(card.available_from);
    if (!date) return false;

    if (card.type === 'World Link' || card.type === 'Unit Event Limited') return true;

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // 월링 이벤트는 2023년 10월(3주년 이후)부터 시작
    if (year < 2023 || (year === 2023 && month < 10)) return false;

    if (card.type === 'Term Limited') {
        const day = date.getDate();
        const lastDay = new Date(year, month, 0).getDate();
        return day > 7 && day <= lastDay - 7;
    }

    return false;
};

export const getWorldLinkSeason = (card) => {
    if (!card || !card.available_from) return null;

    const date = parseSupportDate(card.available_from);
    if (!date) return null;

    const type = card.type;
    const isExplicitWorldLink = type === 'World Link' || type === 'Unit Event Limited';
    if (!isExplicitWorldLink && !isWorldLinkCard(card)) return null;

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    // 주년(9월 30일)을 기점으로 게임 사이클이 변경되므로 10월(month >= 10)을 기준 분기로 설정
    const season = month >= 10 ? year - 2022 : year - 2023;

    return season >= 1 ? season : null;
};

export const getWorldLinkKoreanLabel = (card) => {
    const season = getWorldLinkSeason(card);
    return season ? `월링${season}` : null;
};

export const isSupportBonusWorldLinkCard = (card, selectedCharId = null) => {
    const cardCharacterId = getCardCharacterId(card);
    const worldLinkSeason = getWorldLinkSeason(card);

    return Boolean(
        selectedCharId
        && cardCharacterId === Number(selectedCharId)
        && (worldLinkSeason === 1 || worldLinkSeason === 2)
    );
};

export const getSupportRarityKey = (card) => {
    if (!card) return 'empty';
    if (card.type === 'Birthday' || card.type === 'Anniversary') return 'birthday';
    return String(card.rarity || 1);
};

const RARITY_BONUS = {
    '4': 7.0,
    birthday: 4.5,
    '3': 1.5,
    '2': 1.0,
    '1': 0.5,
};

const MASTER_RANK_BONUS = {
    '4': [0, 0.5, 1.0, 1.5, 2.0, 2.5],
    birthday: [0, 0.4, 0.8, 1.2, 1.6, 2.0],
    '3': [0, 0.3, 0.4, 0.6, 0.8, 1.0],
    '2': [0, 0.2, 0.2, 0.3, 0.4, 0.5],
    '1': [0, 0.1, 0.1, 0.2, 0.2, 0.3],
};

const SKILL_LEVEL_BONUS = {
    '4': [0, 0.25, 1.0, 2.5],
    birthday: [0, 0.2, 0.8, 2.0],
    '3': [0, 0.15, 0.4, 1.0],
    '2': [0, 0.1, 0.2, 0.5],
    '1': [0, 0.05, 0.1, 0.3],
};

export const calculateSupportCardBonus = (card, masterRank = 0, skillLevel = 1, selectedCharId = null) => {
    if (!card) {
        return {
            character: 0,
            worldLink: 0,
            rarity: 0,
            masterRank: 0,
            skillLevel: 0,
            total: 0,
        };
    }

    const rarityKey = getSupportRarityKey(card);
    const normalizedMasterRank = Math.max(0, Math.min(5, Number(masterRank) || 0));
    const normalizedSkillLevel = Math.max(1, Math.min(4, Number(skillLevel) || 1));
    const cardCharacterId = getCardCharacterId(card);

    const breakdown = {
        character: selectedCharId && cardCharacterId === Number(selectedCharId) ? 5 : 0,
        worldLink: isSupportBonusWorldLinkCard(card, selectedCharId) ? 20 : 0,
        rarity: RARITY_BONUS[rarityKey] || 0,
        masterRank: MASTER_RANK_BONUS[rarityKey]?.[normalizedMasterRank] || 0,
        skillLevel: SKILL_LEVEL_BONUS[rarityKey]?.[normalizedSkillLevel - 1] || 0,
    };

    return {
        ...breakdown,
        total: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    };
};

export const formatSupportPercent = (value) => {
    return `${Number(value || 0).toFixed(2).replace(/\.?0+$/, '')}%`;
};

export const getCardTitle = (card) => {
    if (!card) return '';
    return card.title_kr || card.title || `#${card.id}`;
};
