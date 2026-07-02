const trimTrailingSlash = (value = '') => String(value).trim().replace(/\/+$/, '');

export function joinUrl(baseUrl, path = '') {
    const normalizedBase = trimTrailingSlash(baseUrl);
    if (!path) return normalizedBase;
    const normalizedPath = String(path).startsWith('/') ? String(path) : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
}

export const AUTH_BASE_URL = trimTrailingSlash(process.env.REACT_APP_AUTH_BASE_URL);
export const STORAGE_BASE_URL = trimTrailingSlash(process.env.REACT_APP_STORAGE_BASE_URL);
export const API_BASE_URL = trimTrailingSlash(process.env.REACT_APP_API_BASE_URL);
export const ASSET_BASE_URL = trimTrailingSlash(process.env.REACT_APP_ASSET_BASE_URL);
export const SUITE_ASSET_BASE_URL = joinUrl(ASSET_BASE_URL, 'suite');
export const DECK_WORKER_API_URL = trimTrailingSlash(process.env.REACT_APP_DECK_WORKER_API_URL);
export const DECK_FALLBACK_WORKER_API_URL = trimTrailingSlash(process.env.REACT_APP_DECK_FALLBACK_WORKER_API_URL);
export const NOTIFICATION_WORKER_URL = trimTrailingSlash(
    process.env.REACT_APP_NOTIFICATION_WORKER_URL || process.env.REACT_APP_WORKER_URL
);

export const VAPID_PUBLIC_KEY = String(process.env.REACT_APP_VAPID_PUBLIC_KEY || '').trim();
export const DISCORD_CLIENT_ID = String(process.env.REACT_APP_DISCORD_CLIENT_ID || '').trim();
export const TELEGRAM_BOT_USERNAME = String(process.env.REACT_APP_TELEGRAM_BOT_USERNAME || 'prsk_bd_bot').trim();
