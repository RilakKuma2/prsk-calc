import React, { useState } from 'react';
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import { EventCalculator } from 'sekai-calculator';
import AutoTab from './AutoTab';

jest.mock('../contexts/LanguageContext', () => ({
    useTranslation: () => ({
        language: 'ko',
        t: (key, values = {}) => {
            const translations = {
                'auto.energy': '불 설정',
                'auto.energy_option': '{{count}}불',
                'auto.song_name': '곡명',
                'auto.min_rank': '최저 랭크',
                'auto.min_score': '최저 점수',
                'auto.max_score': '최대 점수',
                'auto.my_sekai': '마이세카이',
            };
            return Object.entries(values).reduce(
                (text, [name, value]) => text.replace(`{{${name}}}`, String(value)),
                translations[key] || key,
            );
        },
    }),
}));

jest.mock('../utils/calculator', () => ({
    calculateScoreRange: () => ({ min: 100000, max: 200000 }),
}));

jest.mock('../utils/dataLoader', () => ({
    buildMusicMetaLookup: metas => new Map(
        (metas || []).map(meta => [`${meta.music_id}:${meta.difficulty}`, meta]),
    ),
    getSongOptionsSync: () => [{
        id: 11,
        name: '테스트곡',
        title_jp: 'テスト曲',
    }],
    getMusicMetas: () => Promise.resolve([{
        music_id: 11,
        difficulty: 'append',
        event_rate: 100,
    }]),
}));

jest.mock('sekai-calculator', () => ({
    EventCalculator: {
        getEventPoint: jest.fn((liveType, eventType, score, rate, bonus, multiplier) => (
            score * multiplier
        )),
    },
    LiveType: { AUTO: 'AUTO' },
    EventType: { MARATHON: 'MARATHON' },
}));

jest.mock('./AllSongsTable', () => () => null);

const AutoTabHarness = ({ initialEnergy }) => {
    const [surveyData, setSurveyData] = useState({
        autoDeck: {
            totalPower: 293231,
            skillLeader: 120,
            skillMember2: 100,
            skillMember3: 100,
            skillMember4: 100,
            skillMember5: 100,
            eventBonus: 250,
        },
        ...(initialEnergy === undefined ? {} : { autoEnergyUsed: initialEnergy }),
    });

    return (
        <AutoTab
            surveyData={surveyData}
            setSurveyData={setSurveyData}
            hideInputs
        />
    );
};

describe('AutoTab energy selection', () => {
    beforeEach(() => {
        EventCalculator.getEventPoint.mockImplementation(
            (liveType, eventType, score, rate, bonus, multiplier) => score * multiplier,
        );
    });

    test('offers 1–10 energy without a zero-energy option', async () => {
        render(<AutoTabHarness />);

        const dropdown = await screen.findByRole('combobox', { name: '불 설정' });
        expect(dropdown.textContent).toContain('1불');
        expect(dropdown.closest('th')).not.toBeNull();
        fireEvent.click(dropdown);
        expect(screen.getAllByRole('option').map(option => option.dataset.value)).toEqual(
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        );
        expect(screen.getByText('2,500 EP')).not.toBeNull();
    });

    test('updates regular auto EP and directly multiplies MySekai EP', async () => {
        render(<AutoTabHarness />);
        await screen.findByText('2,500 EP');
        const songNameHeader = screen.getByText('곡명').closest('th');
        expect(songNameHeader?.textContent).toContain('▼');

        fireEvent.click(screen.getByRole('combobox', { name: '불 설정' }));
        fireEvent.click(screen.getByRole('option', { name: '3불' }));

        expect(await screen.findByText('7,500 EP')).not.toBeNull();
        expect(screen.getByText('9,000EP :')).not.toBeNull();
        // Selecting the portaled energy option must not trigger the sortable song-name header.
        expect(songNameHeader?.textContent).toContain('▼');
        expect(songNameHeader?.textContent).not.toContain('▲');
        await waitFor(() => {
            expect(
                EventCalculator.getEventPoint.mock.calls.some(call => call[5] === 15),
            ).toBe(true);
        });
    });
});
