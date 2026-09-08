import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DeckTab from './DeckTab';

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

const DeckTabHarness = () => {
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

    return <DeckTab surveyData={surveyData} setSurveyData={setSurveyData} subPath="power" />;
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
