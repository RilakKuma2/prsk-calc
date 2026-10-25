import React, { useEffect, useRef, useState } from 'react';

type GoogleIdentity = {
  initialize: (options: { client_id: string; nonce: string; callback: (response: { credential: string }) => void; auto_select: boolean; ux_mode: 'popup' }) => void;
  renderButton: (element: HTMLElement, options: { theme: string; size: string; text: string; locale: string }) => void;
};
type GoogleWindow = Window & { google?: { accounts?: { id?: GoogleIdentity } } };
let scriptPromise: Promise<GoogleIdentity> | null = null;

function loadGoogleIdentity(): Promise<GoogleIdentity> {
  // GIS needs an HTTP localhost referrer for its origin check. Keep this
  // development-only policy out of public HTTPS pages.
  if (window.location.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) {
    let referrer = document.querySelector<HTMLMetaElement>('meta[name="referrer"]');
    if (!referrer) {
      referrer = document.createElement('meta');
      referrer.name = 'referrer';
      document.head.appendChild(referrer);
    }
    referrer.content = 'no-referrer-when-downgrade';
  }
  const existing = (window as GoogleWindow).google?.accounts?.id;
  if (existing) return Promise.resolve(existing);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script');
    const fail = () => {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error('Google Identity Services unavailable'));
    };
    const timeout = window.setTimeout(fail, 15000);
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      window.clearTimeout(timeout);
      const identity = (window as GoogleWindow).google?.accounts?.id;
      if (identity) resolve(identity);
      else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  }).catch(error => { scriptPromise = null; throw error; });
  return scriptPromise;
}

export default function GoogleSignInButton({ clientId, locale, prepare, onCredential, loadingText, errorText, retryText }: {
  clientId: string;
  locale: string;
  prepare: () => Promise<{ nonce: string }>;
  onCredential: (credential: string) => Promise<void>;
  loadingText: string;
  errorText: string;
  retryText: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef({ prepare, onCredential });
  callbacksRef.current = { prepare, onCredential };
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    let busy = false;
    setLoading(true);
    setError('');
    const container = containerRef.current;
    const start = async () => {
      try {
        const [google, challenge] = await Promise.all([loadGoogleIdentity(), callbacksRef.current.prepare()]);
        if (cancelled || !container) return;
        google.initialize({
          client_id: clientId, nonce: challenge.nonce, auto_select: false, ux_mode: 'popup',
          callback: async response => {
            if (cancelled || busy) return;
            busy = true;
            setLoading(true);
            try {
              await callbacksRef.current.onCredential(response.credential);
            } catch (caught) {
              if (!cancelled) setError(caught instanceof Error ? caught.message : errorText);
            } finally {
              busy = false;
              if (!cancelled) setLoading(false);
            }
          },
        });
        google.renderButton(container, { theme: 'outline', size: 'large', text: 'continue_with', locale });
        setLoading(false);
      } catch (caught) {
        if (!cancelled) { setError(caught instanceof Error ? caught.message : errorText); setLoading(false); }
      }
    };
    void start();
    return () => { cancelled = true; container?.replaceChildren(); };
  }, [attempt, clientId, locale, errorText]);
  return (
    <div className="login-google-button">
      {loading && <p className="login-message notice" role="status">{loadingText}</p>}
      <div ref={containerRef} hidden={loading || Boolean(error)} />
      {error && <>
        <p className="login-message error" role="alert">{error === 'Google Identity Services unavailable' ? errorText : error}</p>
        <button className="login-text-button" type="button" onClick={() => setAttempt(value => value + 1)}>{retryText}</button>
      </>}
    </div>
  );
}
