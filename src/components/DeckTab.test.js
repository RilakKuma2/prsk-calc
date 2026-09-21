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


test('switching to deck 2 and loading friend code updates deck 2 correctly', async () => {
    loadAutoEventOverride.mockResolvedValue({ attr: '', unit: '', characters: {} });
    let resolveLoad;
    loadDeckFromFriendCode.mockImplementationOnce(() => new Promise(resolve => { resolveLoad = resolve; }));
    
    let capturedSurveyData = null;
    const TestComponent = () => {
        const [data, setData] = useState({
            activeDeckNum: 1,
            power: '31',
            effi: '210',
            internalValue: '190',
            autoDeck: deck(310000, 210, '190'),
            unifiedDecks: {
                deck1: deck(310000, 210, '190'),
                deck2: deck(0, 0, '0'),
                deck3: deck(0, 0, '0'),
            },
        });
        capturedSurveyData = data;
        return <DeckTab surveyData={data} setSurveyData={setData} subPath="power" />;
    };

    render(<TestComponent />);

    // Switch to deck 2
    fireEvent.click(screen.getByRole('button', { name: '덱 2' }));

    // Open load modal
    fireEvent.click(screen.getByRole('button', { name: 'app.load' }));
    fireEvent.change(screen.getByPlaceholderText('예: 3939393939393939'), { target: { value: '1234567890' } });
    fireEvent.click(screen.getByRole('button', { name: '불러오기', exact: true }));

    // Resolve friend load
    await act(async () => {
        resolveLoad({
            totalPower: 350000,
            eventBonus: 300,
            skillValues: [130, 110, 110, 110, 110],
            loadedSkillRanges: { leader: [0, 130, 130, 130, 130] },
            loadedSkillLevels: { leader: 4, member2: 4, member3: 4, member4: 4, member5: 4 },
            loadedBloomFesOriginalMembers: {},
            loadedVSBloomFesMembers: {},
        });
    });

    await waitFor(() => expect(notices.at(-1).type).toBe('success'));
    expect(notices.at(-1).message).toContain('불러오기 완료 · 덱 2');

    // Check UI elements for deck 2
    expect(screen.getByText('350000')).toBeTruthy();
    expect(screen.getByText('300')).toBeTruthy();
    expect(capturedSurveyData.unifiedDecks.deck2.totalPower).toBe(350000);
    expect(capturedSurveyData.unifiedDecks.deck2.eventBonus).toBe(300);

    // Switch to deck 1
    fireEvent.click(screen.getByRole('button', { name: '덱 1' }));
    expect(capturedSurveyData.unifiedDecks.deck2.totalPower).toBe(350000);

    // Switch back to deck 2
    fireEvent.click(screen.getByRole('button', { name: '덱 2' }));
    expect(screen.getByText('350000')).toBeTruthy();
    expect(screen.getByText('300')).toBeTruthy();
});

test('switching to deck 3 and loading friend code updates deck 3 correctly', async () => {
    loadAutoEventOverride.mockResolvedValue({ attr: '', unit: '', characters: {} });
    let resolveLoad;
    loadDeckFromFriendCode.mockImplementationOnce(() => new Promise(resolve => { resolveLoad = resolve; }));
    
    let capturedSurveyData = null;
    const TestComponent = () => {
        const [data, setData] = useState({
            activeDeckNum: 1,
            power: '31',
            effi: '210',
            internalValue: '190',
            autoDeck: deck(310000, 210, '190'),
            unifiedDecks: {
                deck1: deck(310000, 210, '190'),
                deck2: deck(0, 0, '0'),
                deck3: deck(0, 0, '0'),
            },
        });
        capturedSurveyData = data;
        return <DeckTab surveyData={data} setSurveyData={setData} subPath="power" />;
    };

    render(<TestComponent />);

    // Switch to deck 3
    fireEvent.click(screen.getByRole('button', { name: '덱 3' }));

    // Open load modal
    fireEvent.click(screen.getByRole('button', { name: 'app.load' }));
    fireEvent.change(screen.getByPlaceholderText('예: 3939393939393939'), { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: '불러오기', exact: true }));

    // Resolve friend load
    await act(async () => {
        resolveLoad({
            totalPower: 380000,
            eventBonus: 360,
            skillValues: [140, 120, 120, 120, 120],
            loadedSkillRanges: { leader: [0, 140, 140, 140, 140] },
            loadedSkillLevels: { leader: 4, member2: 4, member3: 4, member4: 4, member5: 4 },
            loadedBloomFesOriginalMembers: {},
            loadedVSBloomFesMembers: {},
        });
    });

    await waitFor(() => expect(notices.at(-1).type).toBe('success'));
    expect(notices.at(-1).message).toContain('불러오기 완료 · 덱 3');

    // Check UI elements for deck 3
    expect(screen.getByText('380000')).toBeTruthy();
    expect(screen.getByText('360')).toBeTruthy();
    expect(capturedSurveyData.unifiedDecks.deck3.totalPower).toBe(380000);
    expect(capturedSurveyData.unifiedDecks.deck3.eventBonus).toBe(360);

    // Switch to deck 2 then back to deck 3
    fireEvent.click(screen.getByRole('button', { name: '덱 2' }));
    fireEvent.click(screen.getByRole('button', { name: '덱 3' }));
    expect(screen.getByText('380000')).toBeTruthy();
    expect(screen.getByText('360')).toBeTruthy();
});


