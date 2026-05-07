/**
 * deckLoader.js
 * profile_worker API를 호출해 파싱된 덱 데이터를 반환합니다.
 * 스킬 계산, 이벤트 보너스, 블페 감지 등 모든 로직은 워커에서 처리됩니다.
 *
 * 파싱 로직의 백업은 deckLoader_bak.js를 참고하세요.
 */

const WORKER_API = "https://papi.rilaksekai.com/api";
const FALLBACK_WORKER_API = "https://api2.rilaksekai.com/api";

// 오류코드:
// D01 = 서버 응답이 정상 HTTP 상태가 아님
// D02 = 서버가 에러 JSON을 반환함
// D03 = 네트워크 오류 또는 응답 파싱 실패
function buildDeckUrl(apiBase, friendCode, eventOverride = {}) {
    const params = new URLSearchParams();
    if (eventOverride.attr) params.set('eventAttr', eventOverride.attr);
    if (eventOverride.unit) params.set('eventUnit', eventOverride.unit);
    if (eventOverride.characters) {
        const chars = Object.entries(eventOverride.characters)
            .filter(([, unit]) => unit)
            .map(([charId, unit]) => Number(charId) >= 21 ? `${charId}:${unit}` : charId)
            .join(',');
        if (chars) params.set('eventCharacters', chars);
    }
    const query = params.toString();
    return `${apiBase}/${friendCode}${query ? `?${query}` : ''}`;
}

async function fetchDeckFromApi(apiBase, friendCode, eventOverride) {
    try {
        const res = await fetch(buildDeckUrl(apiBase, friendCode, eventOverride));
        if (!res.ok) return { ok: false, code: 'D01' };

        const data = await res.json();
        if (data.error) return { ok: false, code: 'D02' };

        return { ok: true, data };
    } catch (_err) {
        return { ok: false, code: 'D03' };
    }
}

/**
 * 친구코드로 덱 데이터를 불러옵니다.
 * 워커가 모든 계산을 수행하고 프론트 입력값에 바로 쓸 수 있는 형태로 반환합니다.
 *
 * @param {string} friendCode
 * @returns {Promise<{
 *   totalPower: number,
 *   eventBonus: number,
 *   skillValues: number[],          // Lv1 기준 [leader, m2, m3, m4, m5]
 *   loadedSkillRanges: object,      // { leader: [0,lv1,lv2,lv3,lv4], ... }
 *   loadedSkillLevels: object,      // { leader: 1, member2: 1, ... }
 *   loadedBloomFesOriginalMembers: object,
 *   loadedVSBloomFesMembers: object,
 * }>}
 */
export async function loadDeckFromFriendCode(friendCode, eventOverride = {}) {
    const primary = await fetchDeckFromApi(WORKER_API, friendCode, eventOverride);
    if (primary.ok) return primary.data;

    const fallback = await fetchDeckFromApi(FALLBACK_WORKER_API, friendCode, eventOverride);
    if (fallback.ok) return fallback.data;

    throw new Error(`${primary.code}/${fallback.code}`);
}
