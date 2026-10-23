import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';
import { loadDeckFromFriendCode } from './utils/deckLoader';

jest.mock('react-router-dom', () => {
  const navigate = jest.fn();
  return { useNavigate: () => navigate, useLocation: () => ({ pathname: '/event' }) };
});
jest.mock('./contexts/LanguageContext', () => {
  const translation = { language: 'ko', t: key => key === 'deck.deck_label' ? '덱' : key, changeLanguage: jest.fn() };
  return { LanguageProvider: ({ children }) => children, useTranslation: () => translation };
});
jest.mock('./contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }) => children,
  useTheme: () => ({ themePreference: 'light', setThemePreference: jest.fn() }),
}));
jest.mock('./config/env', () => ({
  ...jest.requireActual('./config/env'),
  AUTH_BASE_URL: 'https://auth.example.test',
  STORAGE_BASE_URL: 'https://storage.example.test',
}));
jest.mock('./components/Tabs', () => () => null);
jest.mock('./components/ScheduleCalendarHeader', () => ({ children }) => children);
jest.mock('./components/AutoTab', () => () => null);
jest.mock('./components/PowerTab', () => ({ surveyData }) => (
  <output data-testid="calculation-inputs">{`${surveyData.power}|${surveyData.effi}`}</output>
));
jest.mock('./utils/dataLoader', () => ({ getSongOptions: async () => [] }));
jest.mock('./utils/eventInfoUtils', () => ({
  ...jest.requireActual('./utils/eventInfoUtils'),
  loadAutoEventOverride: async () => ({ attr: '', unit: '', characters: {} }),
}));
jest.mock('./utils/deckLoader', () => ({
  ...jest.requireActual('./utils/deckLoader'),
  loadDeckFromFriendCode: jest.fn(),
}));

const user = {
  id: 'friend-import-user', username: 'player', role: 'user',
  saveFriendCode: true, friendCode: '1234567890',
};
const makeDeck = totalPower => ({
  totalPower, eventBonus: 250, internalValue: '200',
  skillLeader: 100, skillMember2: 100, skillMember3: 100, skillMember4: 100, skillMember5: 100,
});
const originalFetch = global.fetch;

beforeEach(() => {
  window.localStorage.clear();
  loadDeckFromFriendCode.mockReset();
});
afterEach(() => { global.fetch = originalFetch; });

test.each([
  [2, 'before'], [2, 'after'], [3, 'before'], [3, 'after'],
])('deck %i stays selected when account refresh finishes %s friend import', async (deckNum, refreshOrder) => {
  const preference = { schemaVersion: 1, ownerUserId: user.id, enabled: true };
  const snapshot = {
    schemaVersion: 1, ownerUserId: user.id,
    data: {
      autoDeck: makeDeck(310000), power: '31', effi: '250', internalValue: '200',
      unifiedDecks: { deck1: makeDeck(310000), deck2: makeDeck(320000), deck3: makeDeck(330000) },
    },
  };
  window.localStorage.setItem('sekai-auth-cache-v2', JSON.stringify({ user, expiresAt: Date.now() + 60_000 }));
  window.localStorage.setItem('prskCalcAutoSavePreferenceV1', JSON.stringify(preference));
  window.localStorage.setItem('prskCalcAutoSurveyDataV1', JSON.stringify(snapshot));
  const remote = {
    'prsk-calc-autoload-preference': true,
    'prsk-calc-auto-save-preference': preference,
    'prsk-calc-auto-survey-data': snapshot,
    'prsk-calc-auto-settings': { schemaVersion: 1, entries: {} },
    'prsk-calc-survey-data': { schemaVersion: 2, data: {}, entries: null, mysekai: null },
  };
  const response = body => ({ ok: true, status: 200, json: async () => body });
  let resolveProfile;
  let resolvePreference;
  let refreshingProfile = false;
  global.fetch = jest.fn(async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === '/api/auth/session') return response({ user });
    if (path === '/api/auth/storage-token') {
      return response({ accessToken: 'test-token', expiresIn: 3600, userId: user.id });
    }
    if (path === '/api/account/friend-code') {
      return new Promise(resolve => { resolveProfile = () => {
        refreshingProfile = true;
        resolve(response({ user: { ...user } }));
      }; });
    }
    const namespace = decodeURIComponent(path.replace('/v1/states/', ''));
    if (!(namespace in remote)) throw new Error(`Unexpected request: ${path}`);
    if (init.method === 'PUT') {
      remote[namespace] = JSON.parse(init.body).data;
    } else if (refreshingProfile && namespace === 'prsk-calc-auto-save-preference') {
      return new Promise(resolve => { resolvePreference = () => resolve(response({ state: { data: remote[namespace] } })); });
    }
    return response({ state: { data: remote[namespace] } });
  });
  let resolveDeck;
  loadDeckFromFriendCode.mockImplementationOnce(() => new Promise(resolve => { resolveDeck = resolve; }));
  render(<App />);
  await screen.findByTestId('calculation-inputs');
  await act(async () => {});

  fireEvent.click(screen.getByRole('button', { name: `덱 ${deckNum}` }));
  const deckView = () => within(document.getElementById('deck-tab-content'));
  const expectSelected = () => {
    expect(screen.getByRole('button', { name: `덱 ${deckNum}` }).className).toContain('bg-indigo-500');
  };
  expectSelected();
  fireEvent.click(deckView().getByRole('button', { name: 'app.load' }));
  fireEvent.click(deckView().getByRole('button', { name: '불러오기', exact: true }));
  expectSelected();

  const completeImport = async () => {
    await act(async () => resolveDeck({ totalPower: 380000, eventBonus: 360, skillValues: [140, 120, 120, 120, 120] }));
    expectSelected();
    expect(screen.getByTestId('calculation-inputs').textContent).toBe('38|360');
  };
  if (refreshOrder === 'after') await completeImport();

  await act(async () => resolveProfile());
  await waitFor(() => expect(resolvePreference).toBeDefined());
  expectSelected();
  await act(async () => resolvePreference());
  expectSelected();
  if (refreshOrder === 'before') await completeImport();
  else expect(screen.getByTestId('calculation-inputs').textContent).toBe('38|360');

  // Other decks retain their data, and the imported deck survives switching away and back.
  fireEvent.click(screen.getByRole('button', { name: '덱 1' }));
  expect(screen.getByTestId('calculation-inputs').textContent).toBe('31|250');
  fireEvent.click(screen.getByRole('button', { name: `덱 ${deckNum}` }));
  expect(screen.getByTestId('calculation-inputs').textContent).toBe('38|360');
});
