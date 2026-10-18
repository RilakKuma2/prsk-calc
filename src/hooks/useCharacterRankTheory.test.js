import { renderHook, act } from '@testing-library/react';
import useCharacterRankTheory from './useCharacterRankTheory';
import { loadRankMaster, bundledRankMaster } from '../utils/characterRankData';
import { loadCharacterRankTheory } from '../utils/characterRankTheoryLoader';
jest.mock('../utils/characterRankData', () => ({ bundledRankMaster: { missions: [] }, RANK_REFRESH_MS: 300000, loadRankMaster: jest.fn() }));
jest.mock('../utils/characterRankTheoryLoader', () => ({ loadCharacterRankTheory: jest.fn() }));

test('paints with bundled rules before downloading theory and does not reload on input renders', async () => {
    jest.useFakeTimers();
    let resolveTheory;
    loadRankMaster.mockResolvedValue(bundledRankMaster);
    loadCharacterRankTheory.mockReturnValue(new Promise(resolve => { resolveTheory = resolve; }));
    const { result, rerender, unmount } = renderHook(() => useCharacterRankTheory());
    expect(result.current.master).toBe(bundledRankMaster);
    expect(loadRankMaster).not.toHaveBeenCalled();
    expect(loadCharacterRankTheory).not.toHaveBeenCalled();
    await act(async () => { jest.advanceTimersByTime(250); });
    expect(loadCharacterRankTheory).toHaveBeenCalledTimes(1);
    expect(result.current.theory).toBeNull();
    rerender();
    expect(loadCharacterRankTheory).toHaveBeenCalledTimes(1);
    await act(async () => { resolveTheory({ master: bundledRankMaster, included: {} }); });
    expect(result.current.theory.included).toEqual({});
    unmount();
    jest.useRealTimers();
});
