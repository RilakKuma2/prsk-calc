/**
 * deckLoader.js
 * profile_worker API를 호출해 파싱된 덱 데이터를 반환합니다.
 * 스킬 계산, 이벤트 보너스, 블페 감지 등 모든 로직은 워커에서 처리됩니다.
 *
 * 파싱 로직의 백업은 deckLoader_bak.js를 참고하세요.
 */

import { DECK_FALLBACK_WORKER_API_URL, DECK_WORKER_API_URL } from '../config/env';

const WORKER_API = DECK_WORKER_API_URL;
const FALLBACK_WORKER_API = DECK_FALLBACK_WORKER_API_URL;

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
    const serverName = apiBase === WORKER_API ? '기본 서버' : '보조 서버';
    const startedAt = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await fetch(buildDeckUrl(apiBase, friendCode, eventOverride), { signal: controller.signal });
        if (!res.ok) return { ok: false, code: `${serverName}: D01 (HTTP ${res.status})${res.status === 403 ? ' 접근이 차단되었습니다.' : ''}` };

        const data = await res.json();
        if (data?.error) return { ok: false, code: `${serverName}: D02 (${String(data.error).slice(0, 200)})` };

        if (!Array.isArray(data?.skillValues) || data.skillValues.length !== 5) return { ok: false, code: `${serverName}: D02 (덱 정보 없음)` };
        if (![data.totalPower, data.eventBonus, ...data.skillValues].every(value =>
            typeof value === 'number' && Number.isFinite(value) && value >= 0)) {
            return { ok: false, code: `${serverName}: D02 (종합력·배수·스킬 응답 형식 오류)` };
        }
        return { ok: true, data };
    } catch (_err) {
        return { ok: false, code: `${serverName}: ${controller.signal.aborted ? 'D04 (30초 응답 시간 초과)' : 'D03 (연결 오류 또는 CORS 차단)'}` };
    } finally {
        clearTimeout(timer);
        console.info('[친구코드 불러오기]', serverName, `${Date.now() - startedAt}ms`);
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
export async function loadDeckFromFriendCode(friendCode, eventOverride = {}, onProgress = () => {}) {
    onProgress('primary');
    const primary = await fetchDeckFromApi(WORKER_API, friendCode, eventOverride);
    if (primary.ok) return primary.data;

    onProgress('fallback');
    const fallback = await fetchDeckFromApi(FALLBACK_WORKER_API, friendCode, eventOverride);
    if (fallback.ok) return fallback.data;

    throw new Error(`${primary.code} / ${fallback.code}`);
}


export function describeDeckLoadError(error) {
    const message = String(error?.message || '');
    if (/404|not found|存在し|見つか|user.*invalid/i.test(message)) return '플레이어를 찾지 못했습니다. 일본 서버 친구코드인지 확인해 주세요.';
    if (/403/.test(message)) return '서버가 접근을 차단했습니다. 잠시 후 다시 시도해 주세요.';
    if (/429/.test(message)) return '요청이 많아 잠시 제한되었습니다. 조금 뒤 다시 시도해 주세요.';
    if (/D04|timeout|시간 초과/i.test(message)) return '서버 응답이 늦어 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    if (/D03|network|fetch/i.test(message)) return '서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.';
    if (/D02/.test(message)) return '서버에서 올바른 덱 정보를 받지 못했습니다. 친구코드를 확인하거나 잠시 후 다시 시도해 주세요.';
    return '플레이어 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
}
