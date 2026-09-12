import { waitFor } from '@testing-library/react';
import { loadDeckFromFriendCode } from './deckLoader';

jest.mock('../config/env', () => ({ DECK_WORKER_API_URL: 'https://primary.test', DECK_FALLBACK_WORKER_API_URL: 'https://fallback.test' }));
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

test('waits for fallback JSON and reports fallback progress before resolving', async () => {
    let resolveJson;
    const data = { totalPower: 350000, eventBonus: 300, skillValues: [120, 100, 100, 100, 100] };
    global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: false, status: 503 })
        .mockResolvedValueOnce({ ok: true, json: () => new Promise(resolve => { resolveJson = resolve; }) });
    const stages = [];
    let finished = false;
    const pending = loadDeckFromFriendCode('123', {}, stage => stages.push(stage)).then(result => { finished = true; return result; });
    await waitFor(() => expect(typeof resolveJson).toBe('function'));
    expect(stages).toEqual(['primary', 'fallback']);
    expect(finished).toBe(false);
    resolveJson(data);
    await expect(pending).resolves.toEqual(data);
});

test('reports both failures instead of silently returning an empty deck', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network'));
    await expect(loadDeckFromFriendCode('123')).rejects.toThrow('기본 서버: D03 (연결 오류 또는 CORS 차단) / 보조 서버: D03 (연결 오류 또는 CORS 차단)');
});


test('rejects incomplete successful HTTP responses instead of applying invalid values', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ skillValues: [null, 100, 100, 100, 100] }) });
    await expect(loadDeckFromFriendCode('123')).rejects.toThrow('응답 형식 오류');
});
