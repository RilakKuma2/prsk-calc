const jpNames = ['一歌','咲希','穂波','志歩','みのり','遥','愛莉','雫','こはね','杏','彰人','冬弥','司','えむ','寧々','類','奏','まふゆ','絵名','瑞希','ミク','リン','レン','ルカ','MEIKO','KAITO'];

// Fixture rows have no release timestamp. A set's original release comes from
// mysekaiMissionPasses -> liveMissionPeriods.startAt and its reward character group,
// not the billing shop's later resale date. VS reward IDs include unit variants,
// so resolve the base character from the named reward rather than that numeric ID.
export function buildNuiReleases({ passes, periods, characters }) {
    const periodById = new Map(periods.map(row => [row.id, row]));
    const releases = new Map();
    for (const pass of passes) {
        const releaseAt = Number(periodById.get(pass.liveMissionPeriodId)?.startAt);
        if (!(releaseAt > 0)) throw new Error('누이구루미 미션 패스 출시일이 없습니다.');
        for (const reward of characters.filter(row => row.groupId === pass.mysekaiLiveMissionRewardGameCharacterGroupId)) {
            const characterId = jpNames.findIndex(name => reward.name?.includes(`${name}のぬいぐるみ`)) + 1;
            if (!characterId) continue;
            const setId = reward.mysekaiLiveMissionRewardMysekaiFixtureGroupId;
            const previous = releases.get(setId);
            if (!previous || releaseAt < previous.releaseAt) releases.set(setId, { setId, characterId, releaseAt });
        }
    }
    return [...releases.values()].sort((a, b) => a.releaseAt - b.releaseAt || a.setId - b.setId);
}

export function nuiStatsAt(releases, at) {
    const charSets = Object.fromEntries(jpNames.map((_, i) => [String(i + 1).padStart(2, '0'), 0]));
    // A complete S/M/L set contributes 1% in total (master bonus rates 1/3/6).
    // The theory assumes all obtainable sizes; it does not simulate pass grinding.
    for (const row of releases) {
        const key = String(row.characterId).padStart(2, '0');
        if (row.releaseAt <= at && key in charSets) charSets[key]++;
    }
    const groups = {};
    for (const [id, count] of Object.entries(charSets)) (groups[count] ??= []).push(id);
    return { charSets, groups, min: Math.min(...Object.values(charSets)), max: Math.max(...Object.values(charSets)) };
}
