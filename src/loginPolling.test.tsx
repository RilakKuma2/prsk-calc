import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { LoginProvider, useAccountState, useAuth } from './login';

const cachedUser = {
  id: 'reload-user',
  username: 'saved-user',
  email: null,
  role: 'user' as const,
  mustChangePassword: false,
  canAccessModeling: false,
};

function AuthProbe() {
  const { user, loading } = useAuth();
  return <output data-testid="auth-state">{loading ? 'loading' : user?.username || 'signed-out'}</output>;
}

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

describe('shared login session restoration', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useRealTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('restores the cached user on reload and verifies the server session', async () => {
    window.localStorage.setItem('reload-auth', JSON.stringify({
      user: cachedUser,
      expiresAt: Date.now() + 60_000,
    }));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: cachedUser }),
    });

    render(
      <LoginProvider
        authBaseUrl="https://api.rilakbest.com"
        storageBaseUrl=""
        cacheKey="reload-auth"
      >
        <AuthProbe />
      </LoginProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('saved-user');
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.rilakbest.com/api/auth/session',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('does not request a session when the local display cache is missing', () => {
    global.fetch = jest.fn();

    render(
      <LoginProvider
        authBaseUrl="https://api.rilakbest.com"
        storageBaseUrl=""
        cacheKey="empty-auth"
      >
        <AuthProbe />
      </LoginProvider>,
    );

    expect(screen.getByTestId('auth-state').textContent).toBe('signed-out');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('keeps the cached user when session verification fails transiently', async () => {
    window.localStorage.setItem('reload-auth', JSON.stringify({
      user: cachedUser,
      expiresAt: Date.now() + 60_000,
    }));
    global.fetch = jest.fn().mockRejectedValue(new TypeError('temporary network failure'));

    render(
      <LoginProvider
        authBaseUrl="https://api.rilakbest.com"
        storageBaseUrl=""
        cacheKey="reload-auth"
      >
        <AuthProbe />
      </LoginProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('saved-user');
    });
    expect(JSON.parse(window.localStorage.getItem('reload-auth') || 'null')?.user)
      .toEqual(cachedUser);
  });

  it('clears the cached user after the server confirms there is no session', async () => {
    window.localStorage.setItem('reload-auth', JSON.stringify({
      user: cachedUser,
      expiresAt: Date.now() + 60_000,
    }));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: null }),
    });

    render(
      <LoginProvider
        authBaseUrl="https://api.rilakbest.com"
        storageBaseUrl=""
        cacheKey="reload-auth"
      >
        <AuthProbe />
      </LoginProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('signed-out');
    });
    expect(window.localStorage.getItem('reload-auth')).toBeNull();
  });
});
