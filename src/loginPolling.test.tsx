import React, { act } from 'react';
import { render, screen } from '@testing-library/react';
import { LoginProvider, useAccountState } from './login';

describe('shared account-state polling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('detects same-tab adapter changes without saving on every poll', () => {
    let backingValue = { value: 'initial' };
    let writes = 0;
    const storage = {
      keys: ['test-setting'],
      dirtyKey: 'test-setting:dirty',
      read: () => backingValue,
      write: (value: { value: string }) => {
        backingValue = value;
        writes += 1;
      },
    };

    function Probe() {
      const sync = useAccountState({
        namespace: 'test-settings',
        storage,
        isEmpty: () => false,
        hasLocalOnly: () => false,
        merge: (local) => local,
        localPollMs: 250,
      });
      return <output data-testid="value">{sync.value.value}</output>;
    }

    render(
      <LoginProvider authBaseUrl="" storageBaseUrl="" cacheKey="poll-test-auth">
        <Probe />
      </LoginProvider>,
    );

    expect(screen.getByTestId('value').textContent).toBe('initial');
    backingValue = { value: 'changed' };

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(screen.getByTestId('value').textContent).toBe('changed');
    expect(window.localStorage.getItem('test-setting:dirty')).toBe('1');
    expect(writes).toBe(1);

    act(() => {
      jest.advanceTimersByTime(2_000);
    });

    expect(writes).toBe(1);
  });
});
