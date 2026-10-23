import React from 'react';
import { render, fireEvent, screen, within } from '@testing-library/react';
import CharacterRankTab from './CharacterRankTab';
import useCharacterRankTheory from '../hooks/useCharacterRankTheory';
import { bundledRankMaster } from '../utils/characterRankData';
import { useTranslation } from '../contexts/LanguageContext';
import ko from '../locales/ko';
import ja from '../locales/ja';
import en from '../locales/en';
jest.mock('../hooks/useCharacterRankTheory');
jest.mock('../contexts/LanguageContext', () => ({ useTranslation: jest.fn() }));

beforeEach(() => {
    localStorage.clear();
    useTranslation.mockReturnValue({ language: 'ko', t: key => key });
});
test('calculator stays editable while theory loads; popup shows the all-character theory table without changing inputs', () => {
    const state = { master: bundledRankMaster, theory: null, error: false, retry: jest.fn() };
    useCharacterRankTheory.mockImplementation(() => state);
    const { rerender } = render(<CharacterRankTab />);
    expect(screen.getByRole('button', { name: 'rank.theory_loading' }).disabled).toBe(true);
    const member = screen.getByText('rank.missions.member').closest('div.bg-white');
    expect(within(member).queryByRole('note')).toBeNull();
    const current = within(member).getAllByRole('spinbutton')[0];
    fireEvent.change(current, { target: { value: '9' } });
    expect(current.value).toBe('9');
    const result = { criteriaAt: Date.parse('2026-10-17T00:00:00+09:00'), rank: 170.2, totalExp: 1547, stats: [
        { type: 'read_area_talk', baseType: 'read_area_talk', count: 330, expCap: 300, exp: 35 },
        { type: 'collect_another_vocal', baseType: 'collect_another_vocal', count: 5, nextExpGoal: 6, expCap: 30, exp: 5 },
        { type: 'area_item_level_up_unit', baseType: 'area_item_level_up_unit', count: 40, expCap: 40, exp: 20 },
    ], challenge: { periods: [] } };
    state.theory = { included: { 1: result, 2: { rank: 171, criteriaAt: Date.parse('2026-11-01T00:00:00+09:00'), stats: [
        { type: 'play_live', baseType: 'play_live', count: 1000, expCap: 1000, exp: 50 },
        { type: 'play_live_ex', baseType: 'play_live', count: 2000, expCap: 2000, exp: 10 },
        { type: 'waiting_room', baseType: 'waiting_room', count: 200, expCap: 200, exp: 40 },
        { type: 'waiting_room_ex', baseType: 'waiting_room', count: 300, expCap: 300, exp: 10 },
        { type: 'challenge_stage', baseType: 'challenge_stage', count: 153, exp: 152 },
        { type: 'etc', count: 42, exp: 42 },
    ], challenge: { rank: 153, isEx: false } } }, excluded: { 1: { rank: 170.0 }, 2: { rank: 170.7 } }, common: { level: 4 }, now: Date.parse('2026-10-18T00:00:00+09:00') };
    rerender(<CharacterRankTab />);
    fireEvent.click(screen.getByRole('button', { name: 'rank.theory 170.2' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/2026-10-18/)).not.toBeNull();
    expect(within(dialog).queryByText('rank.theory_challenge')).toBeNull();
    const table = within(dialog).getByRole('table', { name: 'rank.theory_table' });
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(within(table).getAllByRole('columnheader').slice(0, 7).map(cell => cell.textContent)).toEqual([
        'rank.theory_character', 'rank.theory_rank', 'rank.theory_rank_no_kizuna',
        'rank.missions.member', 'rank.missions.costume', 'rank.missions.stamp', 'rank.missions.area_talk',
    ]);
    const ichika = within(table).getByRole('rowheader', { name: '호시노 이치카' }).closest('tr');
    expect(ichika.getAttribute('aria-current')).toBe('true');
    expect(within(ichika).getByText('330').style.color).toBe('rgb(139, 32, 43)');
    expect(within(ichika).getByText('40').style.color).toBe('');
    expect(within(ichika).getByText('5')).not.toBeNull();
    expect(within(ichika).getByText('170.0')).not.toBeNull();
    const saki = within(table).getByRole('rowheader', { name: '텐마 사키' }).closest('tr');
    expect(within(saki).getByText('3,000').style.color).toBe('');
    expect(within(saki).getByText('500').style.color).toBe('');
    expect(within(saki).getByText('Lv.153')).not.toBeNull();
    expect(within(saki).getByText('42')).not.toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: 'rank.close' }));
    expect(current.value).toBe('9');
    expect(JSON.parse(localStorage.getItem('charRankInputs'))['1'].collect_member).toBe(9);
});

const hintMaster = {
    missions: [
        { characterId: 1, characterMissionType: 'collect_member', parameterGroupId: 1 },
        { characterId: 1, characterMissionType: 'read_area_talk', parameterGroupId: 2 },
        { characterId: 1, characterMissionType: 'play_live', parameterGroupId: 3 },
        { characterId: 1, characterMissionType: 'play_live_ex', parameterGroupId: 4 },
    ],
    groups: [
        { id: 1, seq: 1, requirement: 1, exp: 1 },
        { id: 1, seq: 2, requirement: 3, exp: 1 },
        { id: 1, seq: 3, requirement: 5, exp: 2 },
        { id: 2, seq: 1, requirement: 2, exp: 1 },
        { id: 2, seq: 2, requirement: 4, exp: 2 },
        { id: 3, seq: 1, requirement: 5, exp: 2 },
        { id: 4, seq: 1, requirement: 10, exp: 2 },
        { id: 4, seq: 3, requirement: 20, exp: 0 },
    ],
    levels: [0, 1, 3, 7, 12].map((totalExp, index) => ({ levelType: 'character', level: index + 1, totalExp })),
    stages: [2, 1, 3, 1, 1].map((exp, index) => ({ characterId: 1, rank: index + 1, completeStageCharacterExp: exp })),
};

function renderHints(stats, current = {}, added = {}, language = 'ko') {
    localStorage.setItem('charRankInputs', JSON.stringify({ 1: current }));
    localStorage.setItem('charRankAddInputs', JSON.stringify({ 1: added }));
    const locale = { ko, ja, en }[language];
    useTranslation.mockReturnValue({ language, t: (key, values = {}) => {
        const text = key.split('.').reduce((value, part) => value?.[part], locale) || key;
        return typeof text === 'string' ? text.replace(/{{(\w+)}}/g, (_, name) => values[name] ?? '') : key;
    } });
    useCharacterRankTheory.mockReturnValue({ master: hintMaster, error: false, retry: jest.fn(), theory: {
        included: { 1: { rank: 5, stats, criteriaAt: Date.parse('2026-10-17T00:00:00+09:00') } },
        excluded: { 1: { rank: 4.8 } }, common: { level: 4 }, now: Date.parse('2026-10-18T00:00:00+09:00'),
    } });
    render(<CharacterRankTab />);
}

const missionCard = label => screen.getByText(label, { selector: 'h3' }).closest('div.bg-white');

test('inline theory gaps include additions and use mission EXP thresholds', () => {
    renderHints([{ type: 'collect_member', count: 5, exp: 4 }], { collect_member: 1 });
    const card = missionCard('멤버');
    const hint = card;
    expect(within(hint).getByText('5')).not.toBeNull();
    expect(within(hint).getByText('이론치까지 4')).not.toBeNull();
    expect(within(hint).getByText('이론치 시 +3 EXP')).not.toBeNull();

    fireEvent.change(within(card).getAllByRole('spinbutton')[1], { target: { value: '2' } });
    expect(within(hint).getByText('이론치까지 2')).not.toBeNull();
    expect(within(hint).getByText('이론치 시 +2 EXP')).not.toBeNull();

    fireEvent.change(within(card).getAllByRole('spinbutton')[0], { target: { value: '8' } });
    expect(within(hint).getByText('이론치까지 -5')).not.toBeNull();
    expect(within(hint).getByText('이론치 시 +0 EXP')).not.toBeNull();
});

test('rank edits notify the existing auto-save snapshot without publishing empty mount defaults', () => {
    useCharacterRankTheory.mockReturnValue({ master: bundledRankMaster, theory: null, error: false, retry: jest.fn() });
    const onAutoStorageChange = jest.fn();
    render(<CharacterRankTab onAutoStorageChange={onAutoStorageChange} />);
    expect(onAutoStorageChange).not.toHaveBeenCalled();
    expect(localStorage.getItem('charRankInputs')).toBeNull();
    expect(localStorage.getItem('charRankAddInputs')).toBeNull();
    const member = missionCard('rank.missions.member');
    fireEvent.change(within(member).getAllByRole('spinbutton')[0], { target: { value: '9' } });
    expect(onAutoStorageChange).toHaveBeenLastCalledWith({ charRankInputs: '{"1":{"collect_member":9}}' });
    fireEvent.change(within(member).getAllByRole('spinbutton')[1], { target: { value: '3' } });
    expect(onAutoStorageChange).toHaveBeenLastCalledWith({ charRankAddInputs: '{"1":{"collect_member":3}}' });
    expect(JSON.parse(localStorage.getItem('charRankInputs'))['1'].collect_member).toBe(9);
});

test.each(['ko', 'ja', 'en'])('values above theory retain negative counts and EXP (%s)', language => {
    const locale = { ko, ja, en }[language];
    renderHints([{ type: 'etc', count: 7, exp: 7 }], { etc: 8 }, { etc: 2 }, language);
    const other = missionCard(locale.rank.missions.etc);
    expect(within(other).getByText(locale.rank.theory_remaining.replace('{{count}}', '-3'))).not.toBeNull();
    expect(within(other).getByText(locale.rank.theory_exp_remaining.replace('{{count}}', '-3'))).not.toBeNull();
    expect(other.textContent).not.toContain('+-');
});

test('expanded and collapsed EX hints retain red negative amounts without a plus-minus prefix', () => {
    renderHints([{ type: 'play_live', count: 1, exp: 0 }, { type: 'play_live_ex', count: 10, exp: 2 }],
        { play_live: 5, play_live_ex: 20 });
    const leader = missionCard('리더 라이브');
    expect(within(leader).getByText('이론치까지 -10').classList.contains('text-red-600')).toBe(true);
    const exExp = within(leader).getAllByText('이론치 시 -2 EXP').find(el => el.classList.contains('text-red-600'));
    expect(exExp).not.toBeUndefined();
    fireEvent.click(within(leader).getByRole('button', { name: 'EX' }));
    expect(within(leader).getByLabelText('EX -10').parentElement.textContent).toBe('이론치까지 -4 -10');
    expect(within(leader).getByLabelText('EX -2').parentElement.textContent).toBe('이론치 시 -2 -2 EXP');
    expect(leader.textContent).not.toContain('+-');
});

test('counts beyond the EXP cap can remain missing without promising more rank EXP', () => {
    renderHints([{ type: 'read_area_talk', count: 6, exp: 3 }], { read_area_talk: 4 });
    const hint = missionCard('에어리어 대화');
    expect(within(hint).getByText('이론치까지 2')).not.toBeNull();
    expect(within(hint).getByText('이론치 시 +0 EXP')).not.toBeNull();
});

test('challenge hints count completed-stage rewards while other rewards use EXP directly', () => {
    renderHints([{ type: 'challenge_stage', count: 4, exp: 6 }, { type: 'etc', count: 7, exp: 7 }],
        { challenge_stage: 2, etc: 4 }, { etc: 1 });
    const challenge = missionCard(ko.rank.missions.challenge_stage);
    expect(within(challenge).getByText('Lv.4')).not.toBeNull();
    expect(within(challenge).getByText('이론치까지 2')).not.toBeNull();
    expect(within(challenge).getByText('이론치 시 +4 EXP')).not.toBeNull();
    const other = missionCard(ko.rank.missions.etc);
    expect(within(other).getByText('7 EXP')).not.toBeNull();
    expect(within(other).getByText('이론치까지 2')).not.toBeNull();
    expect(within(other).getByText('이론치 시 +2 EXP')).not.toBeNull();
});

test('normal and EX theory gaps are separate', () => {
    renderHints([{ type: 'play_live', count: 5, exp: 2 }, { type: 'play_live_ex', count: 20, exp: 4 }],
        { play_live: 5, play_live_ex: 10 });
    const standard = missionCard('리더 라이브'), ex = standard;
    expect(within(standard).getByText('이론치까지 0')).not.toBeNull();
    expect(within(standard).getByText('이론치 시 +0 EXP')).not.toBeNull();
    expect(within(ex).getByText('이론치까지 10').classList.contains('text-red-600')).toBe(true);
    expect(within(ex).getByText('이론치 시 +2 EXP').classList.contains('text-red-600')).toBe(true);
    expect(within(ex).getByText('20').classList.contains('text-red-600')).toBe(true);
    expect(within(ex).queryByText('+20')).toBeNull();

    fireEvent.click(within(standard).getByRole('button', { name: 'EX' }));
    expect(within(standard).getByText('+20').classList.contains('text-red-600')).toBe(true);
    expect(within(standard).queryByText('20')).toBeNull();
    const exRemaining = within(standard).getByLabelText('EX +10');
    const exExp = within(standard).getByLabelText('EX +2');
    expect(exRemaining.classList.contains('text-red-600')).toBe(true);
    expect(exRemaining.parentElement.textContent).toBe('이론치까지 0 +10');
    expect(exExp.classList.contains('text-red-600')).toBe(true);
    expect(exExp.parentElement.textContent).toBe('이론치 시 +0 +2 EXP');

    fireEvent.click(within(standard).getByRole('button', { name: 'EX' }));
    expect(within(standard).queryByText('+20')).toBeNull();
    expect(within(standard).getAllByText('20')).toHaveLength(1);
    expect(within(standard).queryByLabelText('EX +10')).toBeNull();
    expect(within(standard).queryByLabelText('EX +2')).toBeNull();
});


test.each(['ko', 'ja', 'en'])('the theory table uses the calculator language (%s)', language => {
    const locale = { ko, ja, en }[language];
    renderHints([{ type: 'collect_member', count: 5, exp: 4 }], {}, {}, language);
    const other = missionCard(locale.rank.missions.etc);
    expect(within(other).getByText(locale.rank.missions.etc_input_help.replace(/\n/g, ' '))).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: `${locale.rank.theory} 5.0` }));
    const dialog = screen.getByRole('dialog', { name: locale.rank.theory_table });
    const table = within(dialog).getByRole('table', { name: locale.rank.theory_table });
    expect(within(table).getByRole('columnheader', { name: locale.rank.theory_character })).not.toBeNull();
    expect(within(dialog).getByText(locale.rank.theory_area_note)).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
});
