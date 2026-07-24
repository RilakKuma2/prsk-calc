import {
  createChallengeProfiles,
  getActiveChallengePreset,
  mirrorActiveChallengePreset,
  selectChallengeCharacter,
  selectChallengePreset,
  updateActiveChallengePreset,
} from './challengeProfiles';

describe('challengeProfiles', () => {
  test('기존 챌라 입력을 첫 캐릭터의 프리셋 1로 승계한다', () => {
    const profiles = createChallengeProfiles({
      challengeDeck: { totalPower: 410520 },
      currentStage: '120',
      challengeScore: '260',
    });

    expect(profiles.selectedCharacterId).toBe(1);
    expect(getActiveChallengePreset(profiles)).toEqual(expect.objectContaining({
      challengeDeck: { totalPower: 410520 },
      currentStage: '120',
      challengeScore: '260',
    }));
  });

  test('캐릭터와 프리셋별 입력을 서로 독립적으로 유지한다', () => {
    let profiles = createChallengeProfiles({});
    profiles = updateActiveChallengePreset(profiles, { challengeScore: '250' });
    profiles = selectChallengePreset(profiles, 'P2');
    profiles = updateActiveChallengePreset(profiles, { challengeScore: '270' });
    profiles = selectChallengeCharacter(profiles, 2);
    profiles = updateActiveChallengePreset(profiles, { challengeScore: '290' });

    expect(getActiveChallengePreset(profiles).challengeScore).toBe('290');

    profiles = selectChallengeCharacter(profiles, 1);
    expect(getActiveChallengePreset(profiles).challengeScore).toBe('270');

    profiles = selectChallengePreset(profiles, 'P1');
    expect(getActiveChallengePreset(profiles).challengeScore).toBe('250');
  });

  test('현재 프리셋 값을 기존 전역 필드에도 반영한다', () => {
    let profiles = createChallengeProfiles({});
    profiles = updateActiveChallengePreset(profiles, {
      challengeDeck: { totalPower: 430000 },
      challengeScore: '280',
    });

    const surveyData = mirrorActiveChallengePreset({ unrelated: true }, profiles);
    expect(surveyData.unrelated).toBe(true);
    expect(surveyData.challengeDeck.totalPower).toBe(430000);
    expect(surveyData.challengeScore).toBe('280');
  });
});
