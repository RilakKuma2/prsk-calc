import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

const AmatsuyuNotificationModal = ({ onClose, settings, onSave }) => {
    const { t } = useTranslation();
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

    const handleToggle = async (key) => {
        if (key === 'enabled') {
            const newValue = !localSettings.enabled;

            if (newValue === true) {
                // User trying to enable notifications
                if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                    alert("이 브라우저는 푸시 알림을 지원하지 않습니다.");
                    return;
                }

                const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

                if (isIOS && !isStandalone) {
                    alert("아이폰에서는 홈 화면에 추가된 앱에서만 알림을 사용할 수 있습니다.\n\n사파리 하단 공유 버튼 누름 -> '홈 화면에 추가'를 통해 앱을 설치한 뒤 실행해주세요.");
                    return;
                }

                if (permission !== 'granted') {
                    try {
                        const result = await Notification.requestPermission();
                        setPermission(result);

                        if (result === 'granted') {
                            // 1. Check/Register SW
                            // Add timeout to prevent hanging if SW is dead
                            const getRegistration = async () => {
                                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Service Worker Timeout")), 3000));
                                const ready = navigator.serviceWorker.ready;
                                return Promise.race([ready, timeout]);
                            };

                            let registration;
                            try {
                                registration = await getRegistration();
                            } catch (e) {
                                alert("서비스 워커 로드 실패: 새로고침 후 다시 시도해주세요. (로컬/HTTPS 문제일 수 있습니다)");
                                setLocalSettings(prev => ({ ...prev, [key]: false }));
                                return;
                            }

                            // 2. Subscribe
                            if (VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY_HERE') {
                                alert("개발자 설정 필요: VAPID Public Key가 설정되지 않았습니다.");
                                return;
                            }

                            const subscription = await registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                            });

                            // 3. Send to Backend
                            const cleanUrl = WORKER_URL.endsWith('/') ? WORKER_URL.slice(0, -1) : WORKER_URL;
                            const response = await fetch(`${cleanUrl}/subscribe`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(subscription)
                            });

                            if (!response.ok) {
                                const errData = await response.json().catch(() => ({}));
                                throw new Error(errData.error || `서버 응답 오류: ${response.status}`);
                            }

                            setLocalSettings(prev => ({ ...prev, [key]: true }));

                            if (isIOS) {
                                alert("알림이 허용되었습니다.\n매일 오후 6시에 획득 기간 및 생일 알림이 발송됩니다.");
                            }
                        } else {
                            if (isIOS) {
                                alert("알림 권한이 거부되었습니다.\n아이폰 설정 > 알림에서앱을 찾아 켜주세요.");
                            } else {
                                alert(t('amatsuyu.permission_denied'));
                            }
                            setLocalSettings(prev => ({ ...prev, [key]: false }));
                        }
                    } catch (error) {
                        console.error("Subscription error:", error);
                        // Distinguish SW timeout from other errors
                        if (error.message === "Service Worker Timeout") {
                            alert("서비스 워커 로드 실패: 새로고침 후 다시 시도해주세요.");
                        } else {
                            alert("알림 설정 실패: " + error.message);
                        }
                        setLocalSettings(prev => ({ ...prev, [key]: false }));
                    }
                } else {
                    // Already granted - Retry Subscription to ensure backend is synced
                    try {
                        const getRegistration = async () => {
                            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Service Worker Timeout")), 3000));
                            const ready = navigator.serviceWorker.ready;
                            return Promise.race([ready, timeout]);
                        };
                        const registration = await getRegistration();

                        const subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                        });

                        const cleanUrl = WORKER_URL.endsWith('/') ? WORKER_URL.slice(0, -1) : WORKER_URL;
                        const response = await fetch(`${cleanUrl}/subscribe`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(subscription)
                        });

                        if (!response.ok) {
                            const errData = await response.json().catch(() => ({}));
                            throw new Error(errData.error || `서버 응답 오류: ${response.status}`);
                        }

                        setLocalSettings(prev => ({ ...prev, [key]: true }));
                        alert("알림이 다시 활성화되었습니다. (테스트 알림이 전송됩니다)");

                    } catch (error) {
                        console.error("Re-subscription error:", error);
                        alert("알림 재설정 실패: " + error.message);
                        setLocalSettings(prev => ({ ...prev, [key]: false })); // FIX: Turn off on error
                    }
                }
            } else {
                // Disable
                setLocalSettings(prev => ({ ...prev, [key]: false }));
                // Ideally call /unsubscribe on worker
            }
        } else {
            setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
        }
    };

    const handleChange = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        // Just save whatever state we have
        onSave(localSettings);
        onClose();
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

                            {/* Time Picker - Removed as it's now handled by Cloudflare Worker at 18:00 KST */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{t('amatsuyu.notify_time')}</span>
                                <span className="text-sm font-bold text-gray-800">18:00</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 transition-colors shadow-sm"
                    >
                        {t('app.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AmatsuyuNotificationModal;
