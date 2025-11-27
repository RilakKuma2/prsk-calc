import React from 'react';

export const SectionHeaderRow = ({ label, spacer }) => (
    <tr>
        <td colSpan={spacer ? 3 : 2} className="text-center pt-1 pb-2">
            <span className="font-bold text-gray-700">{label}</span>
        </td>
    </tr>
);

export const InputTableWrapper = ({ children }) => (
    <div className="flex justify-center mb-4">
        <table className="border-none border-collapse">
            <tbody>
                {children}
            </tbody>
        </table>
    </div>
);

export const InputRow = ({ label, value, onChange, type = "number", min, max, suffix, className = "", onFocus, spacer, placeholder }) => (
    <tr>
        <td className="text-right pr-2 py-0.5">
            <label className="whitespace-nowrap font-bold text-gray-700">{label}</label>
        </td>
        <td className="text-left py-0.5">
            <div className="flex items-center">
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    min={min}
                    max={max}
                    placeholder={placeholder}
                    onFocus={onFocus || ((e) => e.target.select())}
                    className={`w-28 text-center border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
                />
                {suffix && <span className="ml-1 text-gray-600">{suffix}</span>}
            </div>
        </td>
        {spacer && <td className="w-8"></td>}
    </tr>
);

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
