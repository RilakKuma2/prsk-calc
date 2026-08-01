import React, { act } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AccountPanel, LoginProvider, useAccountState, useAuth } from './login';
import {
  createMysekaiStorageAdapter,
  getMysekaiSnapshotStats,
  hasLocalMysekaiItems,
  hasMysekaiConflict,
  isMysekaiSnapshot,
  mergeMysekaiSnapshots,
  MYSEKAI_SYNC_NAMESPACE,
  normalizeMysekaiSnapshot,
} from './utils/mysekaiChecklist';

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
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
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

  it('does not make account-state requests for anonymous focus events', () => {
    global.fetch = jest.fn();
    const storage = {
      keys: ['anonymous-setting'],
      read: () => ({ value: 'local' }),
      write: jest.fn(),
    };

    function Probe() {
      useAccountState({
        namespace: 'anonymous-setting',
        storage,
        isEmpty: () => false,
        hasLocalOnly: () => false,
        merge: (local) => local,
        refreshOnFocus: true,
        refreshDelayMs: 0,
        refreshMinIntervalMs: 0,
        flushOnHide: true,
      });
      return null;
    }

    render(
      <LoginProvider
        authBaseUrl="https://apil.rilaksekai.com"
        storageBaseUrl="https://api.rilakbest.com"
        cacheKey="anonymous-sync-auth"
      >
        <Probe />
      </LoginProvider>,
    );

    fireEvent.focus(window);
    fireEvent(document, new Event('visibilitychange'));
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(global.fetch).not.toHaveBeenCalled();
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
    jest.restoreAllMocks();
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

  it('forces the password-change dialog back open for a restored temporary-password session', async () => {
    const temporaryPasswordUser = {
      ...cachedUser,
      mustChangePassword: true,
    };
    window.localStorage.setItem('reload-auth', JSON.stringify({
      user: temporaryPasswordUser,
      expiresAt: Date.now() + 60_000,
    }));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: temporaryPasswordUser }),
    });

    render(
      <LoginProvider
        authBaseUrl="https://api.rilakbest.com"
        storageBaseUrl=""
        cacheKey="reload-auth"
      >
        <AccountPanel />
      </LoginProvider>,
    );

    expect(await screen.findByRole('heading', { name: '새 비밀번호 설정' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '닫기' })).toBeNull();
    expect(screen.getByRole('button', { name: '비밀번호 변경' })).toBeTruthy();
  });
});

describe('rilaksekai ↔ rilakbest MySekai account state', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useRealTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('loads the unwrapped rilakbest snapshot and uploads a compatible calculator snapshot', async () => {
    const remoteSnapshot = normalizeMysekaiSnapshot({
      schemaVersion: 1,
      currentPreset: 'P2',
      presets: {
        P1: { ownedFixtures: {}, seenDialogues: [] },
        P2: {
          ownedFixtures: { 2201: true },
          seenDialogues: ['bundle:remote-talk'],
        },
        P3: { ownedFixtures: {}, seenDialogues: [] },
      },
    });
    const putBodies: any[] = [];
    let remoteData: unknown = remoteSnapshot;

    window.localStorage.setItem('mysekai-sync-auth', JSON.stringify({
      user: cachedUser,
      expiresAt: Date.now() + 60_000,
    }));

    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/auth/session')) {
        return mockJsonResponse({ user: cachedUser });
      }
      if (url.endsWith('/api/auth/storage-token')) {
        return mockJsonResponse({
          accessToken: 'storage-token',
          expiresIn: 3600,
          userId: cachedUser.id,
        });
      }
      if (url.endsWith(`/v1/states/${MYSEKAI_SYNC_NAMESPACE}`) && init?.method === 'PUT') {
        putBodies.push(JSON.parse(String(init.body)));
        return mockJsonResponse({
          state: {
            namespace: MYSEKAI_SYNC_NAMESPACE,
            data: putBodies[putBodies.length - 1]?.data,
            revision: 2,
            updatedAt: new Date().toISOString(),
          },
        });
      }
      if (url.endsWith(`/v1/states/${MYSEKAI_SYNC_NAMESPACE}`)) {
        return mockJsonResponse({
          state: {
            namespace: MYSEKAI_SYNC_NAMESPACE,
            data: remoteData,
            revision: 1,
            updatedAt: new Date().toISOString(),
          },
        });
      }
      throw new Error(`Unexpected request: ${url}`);
    }) as jest.Mock;

    function Probe() {
      const sync = useAccountState({
        namespace: MYSEKAI_SYNC_NAMESPACE,
        storage: createMysekaiStorageAdapter(),
        normalize: normalizeMysekaiSnapshot,
        validate: (
          value: unknown,
        ): value is ReturnType<typeof normalizeMysekaiSnapshot> => isMysekaiSnapshot(value),
        isEmpty: (value) => getMysekaiSnapshotStats(value).total === 0,
        hasLocalOnly: hasLocalMysekaiItems,
        isConflict: hasMysekaiConflict,
        merge: mergeMysekaiSnapshots,
        saveDelayMs: 60_000,
        refreshOnFocus: true,
        refreshDelayMs: 0,
        refreshMinIntervalMs: 0,
        flushOnHide: true,
      });
      const snapshot = normalizeMysekaiSnapshot(sync.value);
      return (
        <>
          <output data-testid="sync-status">{sync.status}</output>
          <output data-testid="sync-preset">{snapshot.currentPreset}</output>
          <output data-testid="sync-fixtures">
            {Object.keys(snapshot.presets.P2.ownedFixtures).join(',')}
          </output>
          <button
            type="button"
            onClick={() => sync.setValue((previous) => {
              const next = normalizeMysekaiSnapshot(previous);
              return {
                ...next,
                presets: {
                  ...next.presets,
                  P2: {
                    ...next.presets.P2,
                    ownedFixtures: {
                      ...next.presets.P2.ownedFixtures,
                      2202: true,
                    },
                  },
                },
              };
            })}
          >
            add fixture
          </button>
        </>
      );
    }

    render(
      <LoginProvider
        authBaseUrl="https://apil.rilaksekai.com"
        storageBaseUrl="https://api.rilakbest.com"
        cacheKey="mysekai-sync-auth"
      >
        <Probe />
      </LoginProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('sync-status').textContent).toBe('ready');
      expect(screen.getByTestId('sync-preset').textContent).toBe('P2');
      expect(screen.getByTestId('sync-fixtures').textContent).toBe('2201');
    });

    fireEvent.click(screen.getByRole('button', { name: 'add fixture' }));
    expect(window.localStorage.getItem('sekai-cloud-mysekai-dirty-v1')).toBe('1');
    const visibilityState = jest
      .spyOn(document, 'visibilityState', 'get')
      .mockReturnValue('hidden');
    fireEvent(document, new Event('visibilitychange'));

    await waitFor(() => {
      expect(putBodies).toHaveLength(1);
    });
    expect(putBodies[0]).toMatchObject({
      data: {
        __wrapped: true,
        payload: {
          schemaVersion: 1,
          currentPreset: 'P2',
          presets: {
            P2: {
              ownedFixtures: {
                2201: true,
                2202: true,
              },
              seenDialogues: ['bundle:remote-talk'],
            },
          },
        },
      },
    });

    remoteData = normalizeMysekaiSnapshot({
      ...remoteSnapshot,
      presets: {
        ...remoteSnapshot.presets,
        P2: {
          ...remoteSnapshot.presets.P2,
          ownedFixtures: {
            2201: true,
            2202: true,
            2203: true,
          },
        },
      },
    });
    visibilityState.mockReturnValue('visible');
    fireEvent(document, new Event('visibilitychange'));

    await waitFor(() => {
      expect(screen.getByTestId('sync-fixtures').textContent).toBe('2201,2202,2203');
    });
  });
});

function mockJsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}
