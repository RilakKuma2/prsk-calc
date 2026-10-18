import React from 'react';
import { render, fireEvent, screen, within } from '@testing-library/react';
import CharacterRankTab from './CharacterRankTab';
import useCharacterRankTheory from '../hooks/useCharacterRankTheory';
import { bundledRankMaster } from '../utils/characterRankData';
jest.mock('../hooks/useCharacterRankTheory');
jest.mock('../contexts/LanguageContext', () => ({ useTranslation: () => ({ language: 'ko', t: key => key }) }));

beforeEach(() => { localStorage.clear(); });
test('calculator remains editable while theory loads; details open without changing saved inputs', () => {
    const state = { master: bundledRankMaster, theory: null, error: false, retry: jest.fn() };
    useCharacterRankTheory.mockImplementation(() => state);
    const { rerender } = render(<CharacterRankTab />);
    expect(screen.getByRole('button', { name: 'rank.theory_loading' }).disabled).toBe(true);
    const member = screen.getByText('rank.missions.member').closest('div.bg-white');
    const current = within(member).getAllByRole('spinbutton')[0];
    fireEvent.change(current, { target: { value: '9' } });
    expect(current.value).toBe('9');
    const result = { criteriaAt: Date.parse('2026-10-17T00:00:00+09:00'), rank: 170.2, totalExp: 1547, stats: [
        { type: 'read_area_talk', baseType: 'read_area_talk', count: 330, expCap: 300, exp: 35 },
        { type: 'collect_another_vocal', baseType: 'collect_another_vocal', count: 5, nextExpGoal: 6, expCap: 30, exp: 5 },
        { type: 'area_item_level_up_unit', baseType: 'area_item_level_up_unit', count: 40, expCap: 40, exp: 20 },
    ], challenge: { periods: [] } };
    state.theory = { included: { 1: result }, excluded: { 1: { rank: 170.0 } }, common: { level: 4 }, now: Date.parse('2026-10-18T00:00:00+09:00') };
    rerender(<CharacterRankTab />);
    fireEvent.click(screen.getByRole('button', { name: 'rank.theory 170.2' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/2026-10-17/)).not.toBeNull();
    expect(within(dialog).queryByText('rank.theory_challenge')).toBeNull();
    expect(within(dialog).getByText('330 / —').style.color).toBe('rgb(139, 32, 43)');
    expect(within(dialog).getByText('40 / —').style.color).toBe('');
    expect(within(dialog).getByText('5 / 6')).not.toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: 'rank.close' }));
    expect(current.value).toBe('9');
    expect(JSON.parse(localStorage.getItem('charRankInputs'))['1'].collect_member).toBe(9);
});
