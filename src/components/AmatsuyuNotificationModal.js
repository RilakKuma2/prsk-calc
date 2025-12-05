import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

const AmatsuyuNotificationModal = ({ onClose, settings, onSave }) => {
    const { t } = useTranslation();
    const [localSettings, setLocalSettings] = useState(settings);
    const [permission, setPermission] = useState(Notification.permission);

    const handleToggle = (key) => {
        setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (localSettings.enabled && permission !== 'granted') {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result !== 'granted') {
                alert(t('amatsuyu.permission_denied'));
                return;
            }
        }
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

                            {/* Time Picker */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{t('amatsuyu.notify_time')}</span>
                                <input
                                    type="time"
                                    value={localSettings.time}
                                    onChange={(e) => handleChange('time', e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 text-base focus:outline-none focus:border-purple-500 w-32 text-center bg-gray-50"
                                />
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
