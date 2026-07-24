import {
  createManualSaveSnapshot,
  MANUAL_SAVE_STORAGE_KEY,
  mergeManualSaveSnapshots,
  normalizeManualSaveSnapshot,
  restoreManualSaveSnapshot,
} from './manualSaveSnapshot';

describe('manualSaveSnapshot', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('기존 surveyData 전용 스냅샷을 호환한다', () => {
    expect(normalizeManualSaveSnapshot({
      schemaVersion: 1,
      data: { score: 123 },
    })).toEqual({
      schemaVersion: 2,
      data: { score: 123 },
      entries: null,
      mysekai: null,
    });
  });

  test('허용된 자동 로컬 데이터만 저장한다', () => {
    window.localStorage.setItem('charRankInputs', '{"1":{"rank":50}}');
    window.localStorage.setItem('supportDeckState', '{"selectedCharId":15}');
    window.localStorage.setItem('savedFriendCode', '12345678');
    window.localStorage.setItem('sekai-auth-cache-v2', 'secret');
    window.localStorage.setItem('login-instance-id', 'private-instance');

    const snapshot = createManualSaveSnapshot({ challengeScore: '260' });

    expect(snapshot.data.challengeScore).toBe('260');
    expect(snapshot.entries).toEqual(expect.objectContaining({
      charRankInputs: '{"1":{"rank":50}}',
      supportDeckState: '{"selectedCharId":15}',
      savedFriendCode: '12345678',
    }));
    expect(snapshot.entries['sekai-auth-cache-v2']).toBeUndefined();
    expect(snapshot.entries['login-instance-id']).toBeUndefined();
    expect(window.localStorage.getItem(MANUAL_SAVE_STORAGE_KEY)).toBeNull();
  });

  test('불러오기 시 저장 시점에 없던 허용 키도 제거한다', () => {
    window.localStorage.setItem('charRankInputs', '{"old":true}');
    window.localStorage.setItem('supportDeckState', '{"old":true}');

    const data = restoreManualSaveSnapshot({
      schemaVersion: 2,
      data: { currentStage: '120' },
      entries: {
        charRankInputs: '{"restored":true}',
      },
      mysekai: null,
    });

    expect(data).toEqual({ currentStage: '120' });
    expect(window.localStorage.getItem('charRankInputs')).toBe('{"restored":true}');
    expect(window.localStorage.getItem('supportDeckState')).toBeNull();
  });

  test('병합 시 계산 데이터와 로컬 자동 저장 데이터를 모두 보존한다', () => {
    const merged = mergeManualSaveSnapshots(
      {
        schemaVersion: 2,
        data: { local: 1 },
        entries: { charRankInputs: '{"local":true}' },
      },
      {
        schemaVersion: 2,
        data: { remote: 2 },
        entries: { supportDeckState: '{"remote":true}' },
      },
    );

    expect(merged.data).toEqual({ remote: 2, local: 1 });
    expect(merged.entries).toEqual({
      charRankInputs: '{"local":true}',
      supportDeckState: '{"remote":true}',
    });
  });
});
