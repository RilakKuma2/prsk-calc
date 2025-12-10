import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

const AmatsuyuNotificationModal = ({ onClose, settings, onSave }) => {
    const { t, language } = useTranslation();
    const [localSettings, setLocalSettings] = useState(settings);
    const [activeTab, setActiveTab] = useState('web'); // web, discord, telegram

    // VAPID Public Key - User needs to replace this!
    const VAPID_PUBLIC_KEY = 'BA_OF5pmVPIDSJx5ByCNUf3zIodBRi069ihknUmR3f5FWiESg79F6wg5vJKloaorfJaFbc0bb-ArdMbTe3LbsPY';
    const WORKER_URL = 'https://noti.rilaksekai.com/';

    // Discord Client ID - User needs to replace this!
    const DISCORD_CLIENT_ID = '1448258116264398931'; // Replace with your Application ID

    // Telegram Bot Username - User needs to replace this!
    const TELEGRAM_BOT_USERNAME = 'prsk_bd_bot'; // Replace with your Bot Username (without @)

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    const [isSaving, setIsSaving] = useState(false);

    // Load existing specific settings if any
    const [discordWebhook, setDiscordWebhook] = useState(settings?.discordWebhook || '');
    const [telegramChatId, setTelegramChatId] = useState(settings?.telegramChatId || '');

    const handleToggle = (key) => {
        if (key === 'enabled') {
            setLocalSettings(prev => ({ ...prev, enabled: !prev.enabled }));
        } else {
            setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
        }
    };

    const handleChange = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    // Update localSettings when auth changes
    useEffect(() => {
        setLocalSettings(prev => ({
            ...prev,
            discordWebhook,
            telegramChatId
        }));
    }, [discordWebhook, telegramChatId]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const cleanUrl = WORKER_URL.endsWith('/') ? WORKER_URL.slice(0, -1) : WORKER_URL;
            const commonSettings = {
                notifyBd: localSettings.notifyBd,
                notifyAcq: localSettings.notifyAcq,
                notifyTimes: localSettings.notifyTimes || [18],
                notifySameDay: localSettings.notifySameDay || false
            };

            // 1. Web Push Logic
            if (activeTab === 'web') {
                if (!localSettings.enabled) {
                    // Unsubscribe Logic
                    if ('serviceWorker' in navigator && 'PushManager' in window) {
                        const registration = await navigator.serviceWorker.ready;
                        const subscription = await registration.pushManager.getSubscription();
                        if (subscription) {
                            await fetch(`${cleanUrl}/unsubscribe`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ endpoint: subscription.endpoint })
                            });
                            await subscription.unsubscribe();
                        }
                    }
                } else {
                    // Subscribe Logic
                    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                        alert(t('amatsuyu.alerts.unsupported'));
                        return;
                    }

                    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

                    if (isIOS && !isStandalone) {
                        alert(t('amatsuyu.alerts.ios_standalone'));
                        return;
                    }

                    const permission = await Notification.requestPermission();
                    if (permission !== 'granted') {
                        if (isIOS) alert(t('amatsuyu.alerts.permission_denied_ios'));
                        else if (/Android/i.test(navigator.userAgent)) alert(t('amatsuyu.alerts.permission_denied_android'));
                        else alert(t('amatsuyu.permission_denied'));
                        return;
                    }

                    const registration = await navigator.serviceWorker.ready;
                    let subscription = await registration.pushManager.getSubscription();

                    if (!subscription) {
                        subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                        });
                    }

                    const response = await fetch(`${cleanUrl}/subscribe`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            subscription,
                            lang: language,
                            settings: commonSettings
                        })
                    });

                    if (!response.ok) throw new Error(t('amatsuyu.alerts.sync_fail') + response.status);
                    if (isIOS && !settings.enabled) alert(t('amatsuyu.alerts.saved'));
                }
            }
            // 2. Discord Logic
            else if (activeTab === 'discord') {
                if (!discordWebhook.startsWith('https://discord.com/api/webhooks/')) {
                    alert(t('amatsuyu.alerts.invalid_webhook'));
                    return;
                }
                const response = await fetch(`${cleanUrl}/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'discord',
                        webhookUrl: discordWebhook,
                        lang: language,
                        settings: commonSettings
                    })
                });
                if (!response.ok) throw new Error(t('amatsuyu.alerts.sync_fail') + response.status);
                alert(t('amatsuyu.alerts.saved'));
            }
            // 3. Telegram Logic
            else if (activeTab === 'telegram') {
                if (!telegramChatId) {
                    alert(t('amatsuyu.alerts.missing_chat_id'));
                    return;
                }
                const response = await fetch(`${cleanUrl}/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'telegram',
                        chatId: telegramChatId,
                        lang: language,
                        settings: commonSettings
                    })
                });
                if (!response.ok) throw new Error(t('amatsuyu.alerts.sync_fail') + response.status);
                alert(t('amatsuyu.alerts.saved'));
            }

            onSave(localSettings);
            onClose();

        } catch (error) {
            console.error("Save error:", error);
            alert(t('amatsuyu.alerts.save_fail') + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm w-[90%] relative font-sans" onClick={e => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">{t('amatsuyu.notification_settings')}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'web' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('web')}
                    >
                        {t('amatsuyu.tabs.web')}
                        {activeTab === 'web' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600" />}
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'discord' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('discord')}
                    >
                        {t('amatsuyu.tabs.discord')}
                        {activeTab === 'discord' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'telegram' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('telegram')}
                    >
                        {t('amatsuyu.tabs.telegram')}
                        {activeTab === 'telegram' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />}
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {activeTab === 'web' && (
                        <>
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-700">{t('amatsuyu.enable_notifications')}</span>
                                <button
                                    onClick={() => handleToggle('enabled')}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.enabled ? 'bg-purple-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${localSettings.enabled ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="text-xs text-gray-400 whitespace-pre-line leading-relaxed">
                                {t('amatsuyu.notification_desc')}
                            </div>
                        </>
                    )}

                    {activeTab === 'discord' && (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-500 text-justify leading-relaxed mb-2">
                                {t('amatsuyu.discord.desc')}
                            </p>
                            {!discordWebhook ? (
                                <div className="text-center py-2">
                                    <button
                                        onClick={() => {
                                            const width = 500;
                                            const height = 800;
                                            const left = (window.screen.width - width) / 2;
                                            const top = (window.screen.height - height) / 2;

                                            // 1. Open Popup
                                            const cleanUrl = WORKER_URL.endsWith('/') ? WORKER_URL.slice(0, -1) : WORKER_URL;
                                            const popup = window.open(
                                                `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(cleanUrl + '/auth/discord/callback')}&response_type=code&scope=webhook.incoming`,
                                                'Discord Auth',
                                                `width=${width},height=${height},top=${top},left=${left}`
                                            );

                                            // 2. Message Listener
                                            const listener = (event) => {
                                                if (event.data.type === 'DISCORD_WEBHOOK') {
                                                    setDiscordWebhook(event.data.webhook.url);
                                                    window.removeEventListener('message', listener);
                                                }
                                            };
                                            window.addEventListener('message', listener);
                                        }}
                                        className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 2.081 2.081 0 0 0-.24.515 22.267 22.267 0 0 0-5.226 0 2.057 2.057 0 0 0-.235-.515.074.074 0 0 0-.078-.037 19.736 19.736 0 0 0-4.885 1.515.074.074 0 0 0-.035.103c1.935 2.84 4.095 5.233 6.135 7.425a1.077 1.077 0 0 0 1.25.074 12.016 12.016 0 0 0 1.956-.99.074.074 0 0 1 .12.022 17.65 17.65 0 0 1 1.63 1.96.074.074 0 0 1-.09.116 11.233 11.233 0 0 1-5.697 1.488 12.378 12.378 0 0 1-5.696-1.488.074.074 0 0 1-.09-.116 18.067 18.067 0 0 1 1.63-1.96.074.074 0 0 1 .12-.022c.628.37 1.282.7 1.956.99a1.076 1.076 0 0 0 1.25-.074c.915-1.01 1.83-2.02 2.653-3.03.823-1.01 1.527-2.02 2.105-3.03a.074.074 0 0 0-.035-.103z" /></svg>
                                        {t('amatsuyu.discord.connect_btn')}
                                    </button>
                                </div>
                            ) : (
                                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
                                    <span className="text-sm text-indigo-700 font-medium truncate max-w-[200px]">
                                        {t('amatsuyu.discord.connected')} {discordWebhook.slice(0, 30)}...
                                    </span>
                                    <button onClick={() => setDiscordWebhook('')} className="text-xs text-red-500 hover:text-red-700 font-bold px-2">
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'telegram' && (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-500 text-justify leading-relaxed mb-2">
                                {t('amatsuyu.telegram.desc')}
                            </p>
                            {!telegramChatId ? (
                                <div className="text-center py-2">
                                    <button
                                        onClick={async () => {
                                            const session = Math.random().toString(36).substring(2, 10);
                                            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                                            // Open Telegram
                                            if (isMobile) {
                                                window.location.href = `tg://resolve?domain=${TELEGRAM_BOT_USERNAME}&start=${session}`;
                                            } else {
                                                window.open(`https://t.me/${TELEGRAM_BOT_USERNAME}?start=${session}`, '_blank');
                                            }

                                            // Start Polling
                                            const poll = setInterval(async () => {
                                                try {
                                                    const cleanUrl = WORKER_URL.endsWith('/') ? WORKER_URL.slice(0, -1) : WORKER_URL;
                                                    const res = await fetch(`${cleanUrl}/auth/telegram/poll?session=${session}`);
                                                    const data = await res.json();
                                                    if (data.status === 'success' && data.chatId) {
                                                        setTelegramChatId(data.chatId);
                                                        clearInterval(poll);
                                                    }
                                                } catch (e) { console.error(e); }
                                            }, 2000);

                                            // Stop polling after 2 min
                                            setTimeout(() => clearInterval(poll), 120000);
                                        }}
                                        className="w-full bg-[#24A1DE] hover:bg-[#1B8ABF] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.203.203 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z" /></svg>
                                        {t('amatsuyu.telegram.connect_btn')}
                                    </button>
                                    <p className="text-xs text-gray-400 mt-2">{t('amatsuyu.telegram.connecting')}</p>
                                </div>
                            ) : (
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                                    <span className="text-sm text-blue-700 font-medium">
                                        {t('amatsuyu.telegram.connected')} {telegramChatId}
                                    </span>
                                    <button onClick={() => setTelegramChatId('')} className="text-xs text-red-500 hover:text-red-700 font-bold px-2">
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Common Settings (Time, Options) - Shown if Web Enabled or other tabs are active */}
                    {(localSettings.enabled || activeTab !== 'web') && (
                        <div className="space-y-4 pt-2 border-t border-gray-100 mt-2">
                            {/* Notify Acq Start */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{t('amatsuyu.notify_acq_prev')}</span>
                                <input
                                    type="checkbox"
                                    checked={localSettings.notifyAcq}
                                    onChange={() => handleToggle('notifyAcq')}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                />
                            </div>

                            {/* Notify Birthday */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{t('amatsuyu.notify_bd_prev')}</span>
                                <input
                                    type="checkbox"
                                    checked={localSettings.notifyBd}
                                    onChange={() => handleToggle('notifyBd')}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                />
                            </div>

                            {/* Notification Time Selector */}
                            <div className="pt-2">
                                <span className="text-xs font-semibold text-gray-500 block mb-2">{t('amatsuyu.notify_time_select')}</span>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => (
                                        <button
                                            key={hour}
                                            onClick={() => {
                                                const current = localSettings.notifyTimes || [18];
                                                const isSelected = current.includes(hour);
                                                const newTimes = isSelected
                                                    ? current.filter(h => h !== hour)
                                                    : [...current, hour];
                                                handleChange('notifyTimes', newTimes);
                                            }}
                                            className={`py-1 text-xs rounded border transition-colors ${(localSettings.notifyTimes || [18]).includes(hour)
                                                ? 'bg-purple-100 border-purple-300 text-purple-700 font-bold'
                                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {`${String(hour).padStart(2, '0')}:00`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Same Day Notification */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-sm text-gray-600">{t('amatsuyu.notify_daily_0')}</span>
                                <input
                                    type="checkbox"
                                    checked={localSettings.notifySameDay || false}
                                    onChange={() => handleToggle('notifySameDay')}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-4 pb-2 text-center">
                    <p className="text-xs text-gray-400">{t('amatsuyu.notify_timezone')}</p>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors ${isSaving
                            ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                    >
                        {isSaving ? t('amatsuyu.alerts.saving') : t('app.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AmatsuyuNotificationModal;
