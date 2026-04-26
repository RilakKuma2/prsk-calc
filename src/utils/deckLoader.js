/**
 * deckLoader.js
 * profile_worker API를 호출해 파싱된 덱 데이터를 반환합니다.
 * 스킬 계산, 이벤트 보너스, 블페 감지 등 모든 로직은 워커에서 처리됩니다.
 *
 * 파싱 로직의 백업은 deckLoader_bak.js를 참고하세요.
 */

const WORKER_API = "https://api2.rilaksekai.com/api";

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
export async function loadDeckFromFriendCode(friendCode) {
    const res = await fetch(`${WORKER_API}/${friendCode}`);
    if (!res.ok) throw new Error(`API 응답 오류: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
}
