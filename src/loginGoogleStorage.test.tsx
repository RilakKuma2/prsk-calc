import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LoginProvider, useAccountState, useAuth, type AuthUser } from './login';

const source: AuthUser = { id: 'source', username: 'user_random', email: null, role: 'user', mustChangePassword: false, canAccessModeling: false };
const target: AuthUser = { ...source, id: 'target', username: 'existing_user', hasGoogleBackup: true };
const originalFetch = global.fetch;
const namespace = 'test-data';
const adapter = {
  keys: ['test-entry-*'], dirtyKey: 'test-data:dirty',
  read: (): string[] => JSON.parse(localStorage.getItem('test-entry-data') || '[]'),
  write: (data: string[]) => localStorage.setItem('test-entry-data', JSON.stringify(data)),
};

function Probe() {
  const { user, googleAccountAction } = useAuth();
  const sync = useAccountState({ namespace, storage: adapter, isEmpty: value => value.length === 0, hasLocalOnly: () => true, merge: local => local, saveDelayMs: 60000 });
  return <>
    <output data-testid="state">{user?.id}:{sync.status}:{sync.value.join(',')}</output>
    <button onClick={() => sync.setValue(['unsynced-source'])}>edit</button>
    <button onClick={() => void googleAccountAction('link-existing', { identifier: target.username, currentPassword: 'target-password', confirm: true })}>connect</button>
  </>;
}
function Wrapper() {
  return <LoginProvider authBaseUrl="https://auth.test" storageBaseUrl="https://storage.test" cacheKey="restore-auth"><Probe /></LoginProvider>;
}

beforeEach(() => { localStorage.clear(); });
afterEach(() => { global.fetch = originalFetch; });

test.each([
  ['existing same-browser data', ['target-data']],
  ['empty remote data', []],
  ['missing remote namespace', null],
] as const)('connecting preserves %s and archives unsynced local data across reload', async (_name, remoteTarget) => {
  let serverUser = source;
  const targetWrites: unknown[] = [];
  localStorage.setItem('restore-auth', JSON.stringify({ user: source, expiresAt: Date.now() + 60000 }));
  localStorage.setItem('login-instance-id', 'same-browser');
  adapter.write(['source-data']);
  global.fetch = jest.fn(async (input, init) => {
    const path = new URL(String(input)).pathname;
    let body: unknown;
    if (path === '/api/auth/session') body = { user: serverUser };
    else if (path === '/api/auth/storage-token') body = { userId: serverUser.id, accessToken: serverUser.id, expiresIn: 3600 };
    else if (path === '/api/account/google/link-existing') { serverUser = target; body = { user: target, message: 'connected' }; }
    else if (path === `/v1/states/${namespace}`) {
      const owner = new Headers(init?.headers).get('Authorization')?.replace('Bearer ', '');
      if (init?.method === 'PUT') {
        if (owner === target.id) targetWrites.push(JSON.parse(String(init.body)));
      }
      const payload = owner === source.id ? ['source-data'] : remoteTarget;
      body = { state: payload === null ? null : { namespace, revision: 1, data: { __wrapped: true, instanceId: 'same-browser', payload }, updatedAt: new Date().toISOString() } };
    } else throw new Error(`Unexpected request ${path}`);
    return { ok: true, status: 200, json: async () => body } as Response;
  });
  const mounted = render(<Wrapper />);
  await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('source:ready:source-data'));
  fireEvent.click(screen.getByRole('button', { name: 'edit' }));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'connect' })); });
  await waitFor(() => expect(screen.getByTestId('state').textContent).toBe(`target:ready:${(remoteTarget || []).join(',')}`));
  expect(targetWrites).toEqual([]);
  const backup = JSON.parse(localStorage.getItem('restore-auth:google-backup:target') || '{}');
  expect(backup['source:test-data'].data).toEqual(['unsynced-source']);
  expect(localStorage.getItem(adapter.dirtyKey)).toBeNull();
  expect(adapter.read()).toEqual(remoteTarget || []);
  mounted.unmount();
  render(<Wrapper />);
  await waitFor(() => expect(screen.getByTestId('state').textContent).toBe(`target:ready:${(remoteTarget || []).join(',')}`));
  // A missing/empty target may initialize its empty default on later normal
  // bootstrap, but it must never receive the source account's local snapshot.
  expect(JSON.stringify(targetWrites)).not.toContain('source');
  expect(JSON.parse(localStorage.getItem('restore-auth:google-backup:target') || '{}')).toEqual(backup);
});
