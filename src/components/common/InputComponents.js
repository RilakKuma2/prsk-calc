import React from 'react';
import { useTranslation } from '../../contexts/LanguageContext';

export const SectionHeaderRow = ({ label, spacer }) => (
    <tr>
        <td colSpan={spacer ? 3 : 2} className="text-center pt-1 pb-2">
            <span className="font-bold text-gray-700">{label}</span>
        </td>
    </tr>
);


export const InputTableWrapper = ({ children, alignLeft = false }) => (
    <div className="flex justify-center mb-1" style={alignLeft ? { marginRight: '45px' } : {}}>
        <table className="border-none border-collapse">
            <tbody>
                {children}
            </tbody>
        </table>
    </div>
);

export const InputRow = ({ label, value, onChange, type = "number", min, max, suffix, suffixB, className = "", onFocus, onBlur, spacer, placeholder, placeholderB, comparisonMode, valueB, onChangeB, showLabels, tabIndexA, tabIndexB }) => {
    const { t } = useTranslation();
    return (
        <tr>
            <td className="text-right pr-2 py-0" style={{ verticalAlign: 'middle' }}>
                <label className="whitespace-nowrap font-bold text-gray-700">{label}</label>
            </td>
            <td className="text-left py-0">
                <div className="flex items-center gap-1">
                    {comparisonMode ? (
                        <>
                            {/* Input A */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-center">
                                    <input
                                        type={type}
                                        value={value}
                                        onChange={onChange}
                                        min={min}
                                        max={max}
                                        placeholder={placeholder}
                                        onFocus={onFocus || ((e) => e.target.select())}
                                        className={`w-20 text-center bg-gray-50 rounded-lg px-1 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm ${className}`}
                                        tabIndex={tabIndexA}
                                        onBlur={onBlur}
                                    />
                                    {suffix && <span className="ml-0.5 text-xs text-gray-500">{suffix}</span>}
                                </div>
                                {showLabels && (
                                    <div className="w-full h-0.5 bg-blue-200 mt-0.5 relative">
                                        <span className="absolute top-1 left-1/2 transform -translate-x-1/2 text-[9px] text-blue-400 font-bold leading-none">{t('common.deck1')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Input B */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-center">
                                    <input
                                        type={type}
                                        value={valueB}
                                        onChange={onChangeB}
                                        min={min}
                                        max={max}
                                        placeholder={placeholderB || placeholder}
                                        onFocus={onFocus || ((e) => e.target.select())}
                                        className={`w-20 text-center bg-gray-50 rounded-lg px-1 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm ${className}`}
                                        tabIndex={tabIndexB}
                                    />
                                    {(suffixB || suffix) && <span className="ml-0.5 text-xs text-gray-500">{suffixB || suffix}</span>}
                                </div>
                                {showLabels && (
                                    <div className="w-full h-0.5 bg-red-200 mt-0.5 relative">
                                        <span className="absolute top-1 left-1/2 transform -translate-x-1/2 text-[9px] text-red-400 font-bold leading-none">{t('common.deck2')}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <input
                                type={type}
                                value={value}
                                onChange={onChange}
                                min={min}
                                max={max}
                                placeholder={placeholder}
                                onFocus={onFocus || ((e) => e.target.select())}
                                className={`w-28 text-center bg-gray-50 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
                                onBlur={onBlur}
                            />
                            {suffix && <span className="ml-1 text-gray-600">{suffix}</span>}
                        </>
                    )}
                </div>
            </td>
            {spacer && <td className="w-8"></td>}
        </tr>
    );
};

export const SelectRow = ({ label, value, onChange, options, className = "", spacer }) => (
    <tr>
        <td className="text-right pr-2 py-0.5">
            <label className="whitespace-nowrap font-bold text-gray-700">{label}</label>
        </td>
        <td className="text-left py-0.5">
            <select
                value={value}
                onChange={onChange}
                className={`w-28 text-center border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </td>
        {spacer && <td className="w-8"></td>}
    </tr>
);
