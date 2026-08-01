import React, { useState } from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { EventCalculator, LiveType } from 'sekai-calculator';
import { calculateScoreRange } from '../utils/calculator';
import PowerTab from './PowerTab';

jest.mock('../contexts/LanguageContext', () => ({
  useTranslation: () => ({
    language: 'ko',
    t: key => ({
      'power.song': '곡명',
      'power.fire': '불',
      'power.auto_song_select': '오토 곡 선택',
      'power.auto_energy': '오토 불',
      'power.mysekai_energy': '마이세카이 불',
      'power.songs.lost_and_found': '로앤파',
      'power.songs.omakase': '오마카세',
      'power.songs.envy': '엔비',
      'power.songs.mysekai': '마이세카이',
      'power.songs.auto_creation_myth': '개벽',
      'power.songs.auto_sage': '사게',
      'power.songs.auto_cendrillon': '샹드',
      'power.songs.auto_viva_happy': '비바',
      'power.songs.auto_envy': '엔비',
      'power.suffix_man': '만',
    }[key] || key),
  }),
}));

jest.mock('../utils/dataLoader', () => ({
  getMusicMetaSync: () => ({ event_rate: 100 }),
  getMusicMetas: () => Promise.resolve(),
  preloadMiniMusicMetas: () => Promise.resolve(),
  preloadMusicMetasWhenIdle: () => {},
  searchSongOptionsSync: () => [],
}));

jest.mock('../utils/calculator', () => ({
  calculateScoreRange: jest.fn(),
}));

jest.mock('sekai-calculator', () => ({
  EventCalculator: {
    getEventPoint: jest.fn(),
  },
  LiveType: {
    AUTO: 'AUTO',
    MULTI: 'MULTI',
    SOLO: 'SOLO',
  },
  EventType: {
    MARATHON: 'MARATHON',
  },
}));

jest.mock('./MySekaiTable', () => () => null);
jest.mock('./AllSongsTable', () => () => null);

const PowerTabHarness = () => {
  const [surveyData, setSurveyData] = useState({
    power: '29.3231',
    effi: '250',
    internalValue: '200',
    fireCounts: {
      loAndFound: 5,
      envy: 5,
      omakase: 5,
      creationMyth: 1,
      mySekai: 1,
      custom: 5,
    },
  });

  return (
    <PowerTab
      surveyData={surveyData}
      setSurveyData={setSurveyData}
      hideInputs
    />
  );
};

describe('PowerTab auto song and MySekai energy controls', () => {
  beforeEach(() => {
    calculateScoreRange.mockImplementation(input => ({
      min: 100000 + Number(input.songId),
      max: 200000 + Number(input.songId),
    }));
    EventCalculator.getEventPoint.mockImplementation(
      (liveType, eventType, score, eventRate, bonus, multiplier) => score * multiplier,
    );
  });

  test('switches the auto calculation among the requested five songs', async () => {
    render(<PowerTabHarness />);

    const select = screen.getByRole('combobox', { name: '오토 곡 선택' });
    fireEvent.click(select);
    const songListbox = screen.getByRole('listbox', { name: '오토 곡 선택' });
    expect(within(songListbox).getAllByRole('option').map(option => ({
      value: option.dataset.value,
      label: option.textContent,
    }))).toEqual([
      { value: 'creation_myth', label: '개벽' },
      { value: 'sage', label: '사게' },
      { value: 'cendrillon', label: '샹드' },
      { value: 'viva_happy', label: '비바' },
      { value: 'envy', label: '엔비' },
    ]);

    fireEvent.click(within(songListbox).getByRole('option', { name: '사게' }));
    await waitFor(() => {
      expect(calculateScoreRange.mock.calls.some(([input, liveType]) => (
        input.songId === 448
        && input.difficulty === 'master'
        && liveType === LiveType.AUTO
      ))).toBe(true);
    });

    fireEvent.click(select);
    fireEvent.click(
      within(screen.getByRole('listbox', { name: '오토 곡 선택' }))
        .getByRole('option', { name: '비바' }),
    );
    await waitFor(() => {
      expect(calculateScoreRange.mock.calls.some(([input, liveType]) => (
        input.songId === 11
        && input.difficulty === 'append'
        && liveType === LiveType.AUTO
      ))).toBe(true);
    });

    const autoEnergySelect = screen.getByRole('combobox', { name: '오토 불' });
    fireEvent.click(autoEnergySelect);
    const autoEnergyListbox = screen.getByRole('listbox', { name: '오토 불' });
    expect(within(autoEnergyListbox).getAllByRole('option').map(option => option.dataset.value)).toEqual(
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    );
    fireEvent.click(within(autoEnergyListbox).getByRole('option', { name: '4' }));
    await waitFor(() => {
      expect(EventCalculator.getEventPoint.mock.calls.some(call => (
        call[0] === LiveType.AUTO && call[5] === 20
      ))).toBe(true);
    });
  });

  test('offers 1–10 MySekai energy and multiplies the displayed score directly', async () => {
    render(<PowerTabHarness />);

    const select = screen.getByRole('combobox', { name: '마이세카이 불' });
    fireEvent.click(select);
    const mySekaiListbox = screen.getByRole('listbox', { name: '마이세카이 불' });
    expect(within(mySekaiListbox).getAllByRole('option').map(option => option.dataset.value)).toEqual(
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    );

    const row = screen.getByText('마이세카이').closest('tr');
    expect(within(row).getByText('2,500')).not.toBeNull();

    fireEvent.click(within(mySekaiListbox).getByRole('option', { name: '3' }));

    await waitFor(() => {
      expect(within(row).getByText('7,500')).not.toBeNull();
      expect(within(row).getByText('9,000EP :')).not.toBeNull();
    });
  });
});
