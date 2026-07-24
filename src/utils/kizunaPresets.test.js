import {
  createKizunaPresets,
  getActiveKizunaPreset,
  mirrorActiveKizunaPreset,
  selectKizunaPreset,
  updateActiveKizunaPreset,
} from './kizunaPresets';

describe('kizunaPresets', () => {
  test('기존 키즈나 입력을 프리셋 1로 승계한다', () => {
    const presets = createKizunaPresets({
      kizunaCurrentLevel: '30',
      kizunaTargetLevel: '125',
      kizunaLevelUpEnabled: true,
    });

    expect(getActiveKizunaPreset(presets)).toEqual(expect.objectContaining({
      kizunaCurrentLevel: '30',
      kizunaTargetLevel: '125',
      kizunaLevelUpEnabled: true,
    }));
  });

  test('세 프리셋 입력을 독립적으로 유지한다', () => {
    let presets = createKizunaPresets({});
    presets = updateActiveKizunaPreset(presets, { kizunaCurrentLevel: '10' });
    presets = selectKizunaPreset(presets, 'P2');
    presets = updateActiveKizunaPreset(presets, { kizunaCurrentLevel: '20' });
    presets = selectKizunaPreset(presets, 'P3');
    presets = updateActiveKizunaPreset(presets, { kizunaCurrentLevel: '30' });

    expect(getActiveKizunaPreset(presets).kizunaCurrentLevel).toBe('30');
    presets = selectKizunaPreset(presets, 'P2');
    expect(getActiveKizunaPreset(presets).kizunaCurrentLevel).toBe('20');
    presets = selectKizunaPreset(presets, 'P1');
    expect(getActiveKizunaPreset(presets).kizunaCurrentLevel).toBe('10');
  });

  test('선택한 프리셋을 기존 키즈나 필드에도 반영한다', () => {
    let presets = createKizunaPresets({});
    presets = updateActiveKizunaPreset(presets, {
      kizunaRank: '150',
      kizunaFires: '5',
    });

    const surveyData = mirrorActiveKizunaPreset({ unrelated: true }, presets);
    expect(surveyData.unrelated).toBe(true);
    expect(surveyData.kizunaRank).toBe('150');
    expect(surveyData.kizunaFires).toBe('5');
  });
});
