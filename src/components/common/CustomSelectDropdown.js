import React, {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

const valuesMatch = (left, right) => String(left) === String(right);

const CustomSelectDropdown = ({
    value,
    options,
    onChange,
    ariaLabel,
    className = '',
    buttonClassName = '',
    menuClassName = '',
    showChevron = true,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState(null);
    const containerRef = useRef(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const menuId = useId();
    const selectedOption = options.find(option => valuesMatch(option.value, value)) || options[0];

    const positionMenu = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const triggerRect = trigger.getBoundingClientRect();
        const menu = menuRef.current;
        const menuWidth = Math.max(triggerRect.width, menu?.offsetWidth || 0);
        const menuHeight = menu?.offsetHeight || Math.min(options.length * 36 + 8, 240);
        const viewportPadding = 8;
        const gap = 4;
        const availableBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
        const availableAbove = triggerRect.top - viewportPadding;
        const openUpward = availableBelow < menuHeight && availableAbove > availableBelow;
        const unclampedLeft = triggerRect.left;
        const left = Math.max(
            viewportPadding,
            Math.min(unclampedLeft, window.innerWidth - menuWidth - viewportPadding),
        );
        const unclampedTop = openUpward
            ? Math.max(viewportPadding, triggerRect.top - menuHeight - gap)
            : Math.min(window.innerHeight - menuHeight - viewportPadding, triggerRect.bottom + gap);
        const top = Math.max(viewportPadding, unclampedTop);

        setMenuPosition({
            left,
            minWidth: triggerRect.width,
            top,
        });
    }, [options.length]);

    useLayoutEffect(() => {
        if (!isOpen) {
            setMenuPosition(null);
            return undefined;
        }

        positionMenu();
        const frame = window.requestAnimationFrame(positionMenu);
        window.addEventListener('resize', positionMenu);
        window.addEventListener('scroll', positionMenu, true);

        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener('resize', positionMenu);
            window.removeEventListener('scroll', positionMenu, true);
        };
    }, [isOpen, positionMenu]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handlePointerDown = (event) => {
            if (
                !containerRef.current?.contains(event.target)
                && !menuRef.current?.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleSelect = (nextValue) => {
        onChange(nextValue);
        setIsOpen(false);
        triggerRef.current?.focus();
    };

    const menu = isOpen && (
        <div
            ref={menuRef}
            id={menuId}
            role="listbox"
            aria-label={ariaLabel}
            className={`fixed z-[1000] max-h-60 min-w-max overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl ring-1 ring-black/5 ${menuClassName}`}
            style={{
                left: menuPosition?.left ?? -9999,
                minWidth: menuPosition?.minWidth,
                top: menuPosition?.top ?? -9999,
                visibility: menuPosition ? 'visible' : 'hidden',
            }}
        >
            {options.map(option => {
                const isSelected = valuesMatch(option.value, value);
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        data-value={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={`flex w-full items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-bold transition-colors ${
                            isSelected
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div ref={containerRef} className={`relative inline-block ${className}`}>
            <button
                ref={triggerRef}
                type="button"
                role="combobox"
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-controls={menuId}
                aria-expanded={isOpen}
                onClick={(event) => {
                    event.stopPropagation();
                    setIsOpen(open => !open);
                }}
                className={`relative inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg border border-gray-300 bg-white ${showChevron ? 'px-7' : 'px-2'} text-sm font-bold normal-case text-gray-700 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${buttonClassName}`}
            >
                <span className="grid place-items-center">
                    {options.map(option => {
                        const isSelected = valuesMatch(option.value, selectedOption?.value);
                        return (
                            <span
                                key={option.value}
                                aria-hidden={!isSelected}
                                className={`col-start-1 row-start-1 whitespace-nowrap ${
                                    isSelected ? '' : 'invisible'
                                }`}
                            >
                                {option.label}
                            </span>
                        );
                    })}
                </span>
                {showChevron && (
                    <svg
                        className={`absolute right-2 h-3 w-3 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </button>
            {typeof document !== 'undefined' && menu ? createPortal(menu, document.body) : null}
        </div>
    );
};

export default CustomSelectDropdown;
