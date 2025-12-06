import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

const AmatsuyuNotificationModal = ({ onClose, settings, onSave }) => {
    const { t, language } = useTranslation();
    const [localSettings, setLocalSettings] = useState(settings);
    const [permission, setPermission] = useState(() => {
        // Safe check for Notification API
        return (typeof Notification !== 'undefined') ? Notification.permission : 'default';
    });


    // VAPID Public Key - User needs to replace this!
    const VAPID_PUBLIC_KEY = 'BA_OF5pmVPIDSJx5ByCNUf3zIodBRi069ihknUmR3f5FWiESg79F6wg5vJKloaorfJaFbc0bb-ArdMbTe3LbsPY';
    const WORKER_URL = 'https://noti.rilaksekai.com/'; // User needs to replace this!

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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Case 1: Disable Notifications (Unsubscribe)
            if (!localSettings.enabled) {
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.getSubscription();
                    if (subscription) {
                        // Call backend to remove key
                        const cleanUrl = WORKER_URL.endsWith('/') ? WORKER_URL.slice(0, -1) : WORKER_URL;
                        await fetch(`${cleanUrl}/unsubscribe`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ endpoint: subscription.endpoint })
                        });
                        // Local unsubscribe
                        await subscription.unsubscribe();
                    }
                }
                onSave(localSettings);
                onClose();
                return;
            }

            // Case 2: Enable/Update Notifications (Subscribe/Sync)
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

            if (permission !== 'granted') {
                const result = await Notification.requestPermission();
                setPermission(result);
                if (result !== 'granted') {
                    if (isIOS) {
                        alert(t('amatsuyu.alerts.permission_denied_ios'));
                    } else if (/Android/i.test(navigator.userAgent)) {
                        alert(t('amatsuyu.alerts.permission_denied_android'));
                    } else {
                        alert(t('amatsuyu.permission_denied'));
                    }
                    return; // Stop saving
                }
            }

            // Register/Get SW
            const getRegistration = async () => {
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Service Worker Timeout")), 3000));
                const ready = navigator.serviceWorker.ready;
                return Promise.race([ready, timeout]);
            };

            const registration = await getRegistration();

            // Get or Create Subscription
            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                if (VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY_HERE') {
                    alert(t('amatsuyu.alerts.vapid_missing'));
                    return;
                }
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
            }

            // Sync to Backend
            const cleanUrl = WORKER_URL.endsWith('/') ? WORKER_URL.slice(0, -1) : WORKER_URL;
            const response = await fetch(`${cleanUrl}/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription,
                    lang: language,
                    settings: {
                        notifyBd: localSettings.notifyBd,
                        notifyAcq: localSettings.notifyAcq,
                        notifyTimes: localSettings.notifyTimes || [18],
                        notifySameDay: localSettings.notifySameDay || false
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || t('amatsuyu.alerts.sync_fail') + response.status);
            }

            // Validate Success
            if (isIOS && !settings.enabled) { // Only show alert on initial enable
                alert(t('amatsuyu.alerts.saved'));
            }

            onSave(localSettings);
            onClose();

        } catch (error) {
            console.error("Save error:", error);
            if (error.message === "Service Worker Timeout") {
                alert(t('amatsuyu.alerts.sw_timeout'));
            } else {
                alert(t('amatsuyu.alerts.save_fail') + error.message);
            }
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

                <div className="p-5 space-y-4">
                    {/* Master Switch */}
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{t('amatsuyu.enable_notifications')}</span>
                        <button
                            onClick={() => handleToggle('enabled')}
                            className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.enabled ? 'bg-purple-500' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${localSettings.enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Description Text (Always visible) */}
                    <div className="text-xs text-gray-400 whitespace-pre-line leading-relaxed">
                        {t('amatsuyu.notification_desc')}
                    </div>

                    {localSettings.enabled && (
                        <div className="space-y-4 pt-2 border-t border-gray-100">
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
                        {isSaving ? 'Saving...' : t('app.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AmatsuyuNotificationModal;
