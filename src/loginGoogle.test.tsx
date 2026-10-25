import React, { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { AccountPanel, AuthModal, LoginProvider, ProfileModal, useAuth, type AuthUser } from './login';

const clientId = 'test.apps.googleusercontent.com';
const credential = 'test-google-credential-never-persist';
const baseUser: AuthUser = { id: 'existing', username: 'existing_user', email: 'owner@gmail.com', role: 'user', mustChangePassword: false, canAccessModeling: false, hasPassword: true, googleLinked: false };
const newUser: AuthUser = { ...baseUser, id: 'new', username: 'user_1234567890abcdef12', email: null, hasPassword: false, googleLinked: true, googleCreated: true, canChangeUsername: true, googleSessionVerified: true };
const originalFetch = global.fetch;
let googleCallback: (response: { credential: string }) => void;
let initialize: jest.Mock;
let serverUser: AuthUser | null;
let requests: { path: string; body: Record<string, unknown> }[];

function Probe() {
  const { user } = useAuth();
  return <output data-testid="user">{user?.username || 'anonymous'}</output>;
}
function Wrapper({ children, enabled = true }: { children: React.ReactNode; enabled?: boolean }) {
  return <LoginProvider authBaseUrl="https://auth.test" storageBaseUrl="" cacheKey="google-test-auth" googleClientId={enabled ? clientId : ''}>
    {children}<Probe />
  </LoginProvider>;
}
function seed(user: AuthUser) {
  serverUser = user;
  window.localStorage.setItem('google-test-auth', JSON.stringify({ user, expiresAt: Date.now() + 60000 }));
}

beforeEach(() => {
  window.localStorage.clear(); serverUser = null; requests = [];
  initialize = jest.fn(options => { googleCallback = options.callback; });
  Object.defineProperty(window, 'google', { configurable: true, value: { accounts: { id: {
    initialize,
    renderButton: (container: HTMLElement) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Continue with Google';
      button.onclick = () => googleCallback({ credential }); container.appendChild(button);
    },
  } } } });
  global.fetch = jest.fn(async (url, init) => {
    const path = new URL(String(url)).pathname;
    const input = init?.body ? JSON.parse(String(init.body)) : {};
    requests.push({ path, body: input });
    let body: unknown; let status = 200;
    if (path === '/api/auth/session') body = { user: serverUser };
    else if (path === '/api/auth/google/challenge') body = { nonce: 'browser-nonce' };
    else if (path === '/api/auth/google') {
      serverUser = input.action === 'login' ? newUser : { ...serverUser!, googleLinked: true, hasPassword: true };
      body = { status: 'active', message: '완료', user: serverUser };
    } else if (path === '/api/account/google/verify-password') {
      if (input.currentPassword !== 'existing-password') { status = 401; body = { message: '현재 비밀번호가 올바르지 않습니다.' }; }
      else { serverUser = { ...serverUser!, canLinkGoogle: true }; body = { message: '확인 완료', user: serverUser }; }
    } else if (path === '/api/account/google/password') {
      serverUser = { ...serverUser!, hasPassword: true }; body = { message: '설정 완료', user: serverUser };
    } else if (path === '/api/account/google/username') {
      serverUser = { ...serverUser!, username: input.username, canChangeUsername: false }; body = { message: '변경 완료', user: serverUser };
    } else if (path === '/api/account/google/link-existing') {
      serverUser = { ...baseUser, googleLinked: true, googleSessionVerified: true, hasGoogleBackup: true };
      body = { message: '연결 완료', user: serverUser };
    } else throw new Error(`Unexpected request: ${path}`);
    return { ok: status < 400, status, json: async () => body } as Response;
  });
});
afterEach(() => { global.fetch = originalFetch; Reflect.deleteProperty(window, 'google'); });
async function clickGoogle() {
  const button = await screen.findByRole('button', { name: 'Continue with Google' });
  await act(async () => { fireEvent.click(button); });
}
async function submit(name: string) {
  await act(async () => { fireEvent.submit(screen.getByRole('button', { name }).closest('form')!); });
}

test('no configured client ID does not request a Google script or challenge', () => {
  render(<Wrapper enabled={false}><AuthModal onClose={jest.fn()} /></Wrapper>);
  expect(screen.queryByRole('button', { name: 'Continue with Google' })).toBeNull();
  expect(initialize).not.toHaveBeenCalled(); expect(global.fetch).not.toHaveBeenCalled();
  expect(document.querySelector('script[src*="accounts.google.com"]')).toBeNull();
});

test('Google consent is visible before immediate signup and StrictMode requests one challenge', async () => {
  const onAuthenticated = jest.fn();
  render(<StrictMode><Wrapper><AuthModal onClose={jest.fn()} onAuthenticated={onAuthenticated} /></Wrapper></StrictMode>);
  expect(screen.getByText(/Google로 계속하면 이용약관/)).toBeTruthy();
  await clickGoogle();
  expect(document.querySelector('meta[name="referrer"]')?.getAttribute('content')).toBe('no-referrer-when-downgrade');
  expect(requests.filter(r => r.path.endsWith('/google/challenge'))).toHaveLength(1);
  expect(requests.find(r => r.path === '/api/auth/google')?.body).toEqual({ action: 'login', credential, termsAccepted: true });
  expect(screen.getByTestId('user').textContent).toBe(newUser.username);
  expect(onAuthenticated).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(window.localStorage)).not.toContain(credential);
});

test('automatic Google signup opens profile setup while already logged in', async () => {
  render(<Wrapper><AccountPanel /></Wrapper>);
  fireEvent.click(screen.getByRole('button', { name: '로그인 · 회원가입' }));
  await clickGoogle();
  expect(screen.getByTestId('user').textContent).toBe(newUser.username);
  expect(await screen.findByRole('button', { name: '새 아이디·비밀번호 설정' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '기존 계정 연동' })).toBeTruthy();
  expect(screen.queryByLabelText('새 비밀번호')).toBeNull();
  expect(screen.queryByLabelText('아이디 또는 이메일')).toBeNull();
  expect(screen.queryByRole('button', { name: '가입하기' })).toBeNull();
});

test('link button reveals password verification, which unlocks Google for the current session', async () => {
  seed(baseUser);
  const mounted = render(<Wrapper><ProfileModal onClose={jest.fn()} /></Wrapper>);
  expect(screen.queryByLabelText('비밀번호')).toBeNull();
  expect(initialize).not.toHaveBeenCalled();
  const linkButton = screen.getByRole('button', { name: 'Google 계정 연결' });
  expect(linkButton.querySelector('img')?.getAttribute('alt')).toBe('');
  fireEvent.click(linkButton);
  fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } });
  await submit('비밀번호 확인');
  expect(screen.getByRole('alert').textContent).toContain('올바르지');
  expect(initialize).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'existing-password' } });
  await submit('비밀번호 확인');
  expect(await screen.findByRole('button', { name: 'Continue with Google' })).toBeTruthy();
  expect(JSON.stringify(window.localStorage)).not.toContain('existing-password');
  mounted.unmount();
  render(<Wrapper><ProfileModal onClose={jest.fn()} /></Wrapper>);
  expect(screen.queryByRole('button', { name: '비밀번호 확인' })).toBeNull();
  await clickGoogle();
  expect(requests.find(r => r.path === '/api/auth/google')?.body).toEqual({ action: 'link', credential });
  expect(screen.getByTestId('user').textContent).toBe(baseUser.username);
});

test('Google session sets its initial password without asking for another Google login', async () => {
  seed(newUser); render(<Wrapper><ProfileModal onClose={jest.fn()} /></Wrapper>);
  expect((document.getElementById('profile-email') as HTMLInputElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: '새 아이디·비밀번호 설정' }));
  fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'new-password' } });
  fireEvent.change(screen.getByLabelText('새 비밀번호 확인'), { target: { value: 'new-password' } });
  await submit('비밀번호 설정');
  expect(requests.find(r => r.path.endsWith('/google/password'))?.body).toEqual({ newPassword: 'new-password' });
  expect(initialize).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog', { name: '새 아이디·비밀번호 설정' })).toBeNull();
  // Setting a password first must not consume the one-time username change.
  fireEvent.click(screen.getByRole('button', { name: '아이디 변경 (1회)' }));
  expect(screen.getByPlaceholderText(newUser.username)).toBeTruthy();
  await waitFor(() => expect((document.getElementById('profile-email') as HTMLInputElement).disabled).toBe(false));
});

test('successful username change removes the one-time control', async () => {
  seed(newUser); render(<Wrapper><ProfileModal onClose={jest.fn()} /></Wrapper>);
  fireEvent.click(screen.getByRole('button', { name: '새 아이디·비밀번호 설정' }));
  fireEvent.change(screen.getByPlaceholderText(newUser.username), { target: { value: 'chosen_name' } });
  await submit('아이디 변경 (1회)');
  expect(screen.getByTestId('user').textContent).toBe('chosen_name');
  expect(screen.queryByRole('button', { name: '아이디 변경 (1회)' })).toBeNull();
});

test('existing-account connection explains backup and switches to the existing profile', async () => {
  seed(newUser); render(<Wrapper><ProfileModal onClose={jest.fn()} /></Wrapper>);
  fireEvent.click(screen.getByRole('button', { name: '기존 계정 연동' }));
  expect(screen.getByText(/기존 저장 데이터는 유지되며/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('아이디 또는 이메일'), { target: { value: 'existing_user' } });
  fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'existing-password' } });
  fireEvent.click(screen.getByRole('checkbox'));
  const dialog = screen.getByRole('dialog', { name: '기존 계정 연동' });
  await act(async () => { fireEvent.submit(within(dialog).getByRole('button', { name: '기존 계정 연동' }).closest('form')!); });
  expect(requests.find(r => r.path.endsWith('/google/link-existing'))?.body).toEqual({ identifier: 'existing_user', password: 'existing-password', confirm: true });
  expect(screen.getByTestId('user').textContent).toBe(baseUser.username);
  expect(await screen.findByRole('button', { name: '연결 전 Google 계정 데이터 내려받기' })).toBeTruthy();
  expect(JSON.stringify(window.localStorage)).not.toContain('existing-password');
});


test('setup dialogs close independently, restore focus, and clear unsaved passwords', async () => {
  seed(newUser);
  const onClose = jest.fn();
  render(<Wrapper><ProfileModal onClose={onClose} /></Wrapper>);
  const opener = screen.getByRole('button', { name: '새 아이디·비밀번호 설정' });
  await act(async () => { await new Promise(resolve => window.requestAnimationFrame(resolve)); });
  opener.focus();
  fireEvent.click(opener);
  const setup = screen.getByRole('dialog', { name: '새 아이디·비밀번호 설정' });
  fireEvent.mouseDown(within(setup).getByLabelText('새 비밀번호'));
  fireEvent.change(within(setup).getByLabelText('새 비밀번호'), { target: { value: 'unsaved-password' } });
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog', { name: '새 아이디·비밀번호 설정' })).toBeNull();
  expect(onClose).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(opener);
  fireEvent.click(opener);
  expect((screen.getByLabelText('새 비밀번호') as HTMLInputElement).value).toBe('');
  fireEvent.mouseDown(screen.getByRole('dialog', { name: '새 아이디·비밀번호 설정' }).parentElement!);
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog', { name: '새 아이디·비밀번호 설정' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '기존 계정 연동' }));
  const existing = screen.getByRole('dialog', { name: '기존 계정 연동' });
  fireEvent.click(within(existing).getByRole('button', { name: '닫기' }));
  expect(screen.queryByRole('dialog', { name: '기존 계정 연동' })).toBeNull();
  expect(onClose).not.toHaveBeenCalled();
});
