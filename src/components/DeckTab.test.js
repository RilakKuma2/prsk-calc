import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import DeckTab from './DeckTab';
import { loadAutoEventOverride } from '../utils/eventInfoUtils';
import { loadDeckFromFriendCode } from '../utils/deckLoader';
jest.mock('../utils/eventInfoUtils', () => ({ ...jest.requireActual('../utils/eventInfoUtils'), loadAutoEventOverride: jest.fn().mockResolvedValue({ attr: '', unit: '', characters: {} }) }));
jest.mock('../utils/deckLoader', () => ({ ...jest.requireActual('../utils/deckLoader'), loadDeckFromFriendCode: jest.fn() }));

jest.mock('../contexts/LanguageContext', () => ({
    useTranslation: () => ({
        language: 'ko',
        t: key => ({
            'deck.deck_label': '덱',
        }[key] || key),
    }),
}));

jest.mock('../login', () => ({
    useAuth: () => ({ user: null, updateFriendCode: jest.fn() }),
}));

jest.mock('react-router-dom', () => ({
    useNavigate: () => jest.fn(),
}));

jest.mock('./AutoTab', () => () => null);
jest.mock('./PowerTab', () => ({ surveyData }) => (
    <output data-testid="calculation-inputs">
        {`${surveyData.power}|${surveyData.effi}|${surveyData.internalValue}`}
    </output>
));

const deck = (totalPower, eventBonus, internalValue) => ({
    totalPower,
    eventBonus,
    internalValue,
    skillLeader: 120,
    skillMember2: 100,
    skillMember3: 100,
    skillMember4: 100,
    skillMember5: 100,
});

let notices;
const recordNotice = event => notices.push(event.detail);
beforeEach(() => { notices = []; window.addEventListener('show-toast', recordNotice); });
afterEach(() => window.removeEventListener('show-toast', recordNotice));

const DeckTabHarness = ({ delayUpdate } = {}) => {
    const [surveyData, setSurveyData] = useState({
        activeDeckNum: 2,
        power: '42',
        effi: '500',
        internalValue: '250',
        autoDeck: deck(420000, 500, '250'),
        unifiedDecks: {
            deck1: deck(310000, 210, '190'),
            deck2: deck(420000, 500, '250'),
            deck3: deck(280000, 160, '170'),
        },
    });

    return <DeckTab surveyData={surveyData} setSurveyData={delayUpdate ? updater => delayUpdate(() => setSurveyData(updater)) : setSurveyData} subPath="power" />;
};

test('switching away from a loaded deck updates the power calculation inputs', async () => {
    render(<DeckTabHarness />);

    expect((await screen.findByTestId('calculation-inputs')).textContent).toBe('42|500|250');

    fireEvent.click(screen.getByRole('button', { name: '덱 1' }));

    await waitFor(() => {
        expect(screen.getByTestId('calculation-inputs').textContent).toBe('31|210|190');
    });

    fireEvent.click(screen.getByRole('button', { name: '덱 3' }));

    await waitFor(() => {
        expect(screen.getByTestId('calculation-inputs').textContent).toBe('28|160|170');
    });
});

test('friend import closes immediately and reports readable failure without altering the deck', async () => {
    loadAutoEventOverride.mockResolvedValue({ attr: '', unit: '', characters: {} });
    let rejectLoad;
    loadDeckFromFriendCode.mockImplementationOnce(() => new Promise((resolve, reject) => { rejectLoad = reject; }));
    render(<DeckTabHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'app.load' }));
    fireEvent.change(screen.getByPlaceholderText('예: 3939393939393939'), { target: { value: '1234567890' } });
    fireEvent.click(screen.getByRole('button', { name: '불러오기', exact: true }));
    expect(notices.at(-1)).toMatchObject({ type: 'loading', duration: 0 });
    expect(screen.queryByPlaceholderText('예: 3939393939393939')).toBeNull();
    expect(screen.getByRole('button', { name: '덱 1' }).disabled).toBe(true);
    rejectLoad(new Error('응답 시간 초과'));
    await waitFor(() => expect(notices.at(-1).type).toBe('error'));
    expect(notices.at(-1).message).toContain('서버 응답이 늦어');
    expect(screen.getByRole('button', { name: 'app.load' }).disabled).toBe(false);
    expect(screen.getByTestId('calculation-inputs').textContent).toBe('42|500|250');
});

test('friend import reports success only after applying the returned deck', async () => {
    loadAutoEventOverride.mockResolvedValue({ attr: '', unit: '', characters: {} });
    let resolveLoad;
    loadDeckFromFriendCode.mockImplementationOnce(() => new Promise(resolve => { resolveLoad = resolve; }));
    render(<DeckTabHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'app.load' }));
    fireEvent.change(screen.getByPlaceholderText('예: 3939393939393939'), { target: { value: '1234567890' } });
    fireEvent.click(screen.getByRole('button', { name: '불러오기', exact: true }));
    expect(screen.queryByPlaceholderText('예: 3939393939393939')).toBeNull();
    resolveLoad({ totalPower: 350000, eventBonus: 300, skillValues: [120, 100, 100, 100, 100] });
    await waitFor(() => expect(notices.at(-1).type).toBe('success'));
    expect(screen.getByTestId('calculation-inputs').textContent).toMatch(/^35\|300\|/);
    expect(notices.at(-1).message).toContain('불러오기 완료 · 덱 2');
});


test('finishes the notification even if account restoration remounts the deck tab during the request', async () => {
    loadAutoEventOverride.mockResolvedValue({ attr: '', unit: '', characters: {} });
    let resolveLoad;
    loadDeckFromFriendCode.mockImplementationOnce(() => new Promise(resolve => { resolveLoad = resolve; }));
    function RemountHarness() {
        const [version, setVersion] = useState(0);
        const [data, setData] = useState({ activeDeckNum: 1, unifiedDecks: { deck1: deck(420000, 500, '250') } });
        return <><button onClick={() => setVersion(v => v + 1)}>계정 복원</button>
            <DeckTab key={version} surveyData={data} setSurveyData={setData} subPath="power" /></>;
    }
    render(<RemountHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'app.load' }));
    fireEvent.change(screen.getByPlaceholderText('예: 3939393939393939'), { target: { value: '1234567890' } });
    fireEvent.click(screen.getByRole('button', { name: '불러오기', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: '계정 복원' }));
    await act(async () => resolveLoad({ totalPower: 439272, eventBonus: 435, skillValues: [130, 80, 110, 80, 130] }));
    await waitFor(() => expect(notices.at(-1).type).toBe('success'));
    expect(screen.getByTestId('calculation-inputs').textContent).toMatch(/^43.9272\|435\|/);
});
