import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AmatsuyuTab from './AmatsuyuTab';

jest.mock('../contexts/LanguageContext', () => {
  const t = key => ({
      'amatsuyu.suffix_count': '개',
  }[key] || key);

  return {
    useTranslation: () => ({ language: 'ko', t }),
  };
});

const AmatsuyuTabHarness = () => {
  const [surveyData, setSurveyData] = useState({
    amatsuyuTargetLevel: '123',
  });

  return <AmatsuyuTab surveyData={surveyData} setSurveyData={setSurveyData} />;
};

test('keeps an emptied target level blank while calculating it as level 400', async () => {
  render(<AmatsuyuTabHarness />);

  const targetLevelInput = screen.getByPlaceholderText('400');
  fireEvent.change(targetLevelInput, { target: { value: '' } });

  expect(targetLevelInput.value).toBe('');
  await waitFor(() => {
    expect(screen.getByText('40,000개')).not.toBeNull();
  });
});

test('allows five past birthday cards and applies their full bonus', async () => {
  render(<AmatsuyuTabHarness />);

  const pastCardsSelect = screen.getByRole('combobox', { name: 'amatsuyu.past_cards_count' });
  fireEvent.click(pastCardsSelect);
  fireEvent.click(screen.getByRole('option', { name: '5' }));

  await waitFor(() => {
    expect(screen.getByText('75%')).not.toBeNull();
  });
});
