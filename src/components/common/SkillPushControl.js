import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../../contexts/LanguageContext';
import './SkillPushControl.css';

export function SkillPushHelp({ label, description }) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState(null);
    const buttonRef = useRef(null);
    const tooltipRef = useRef(null);
    const tooltipId = useId();
    useLayoutEffect(() => {
        if (!open) return undefined;
        const update = () => {
            const anchor = buttonRef.current?.getBoundingClientRect();
            if (!anchor) return;
            const viewport = window.visualViewport;
            const leftEdge = (viewport?.offsetLeft ?? 0) + 12;
            const topEdge = (viewport?.offsetTop ?? 0) + 12;
            const width = Math.min(288, (viewport?.width ?? window.innerWidth) - 24);
            const bottomEdge = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 12;
            const height = Math.min(tooltipRef.current?.scrollHeight ?? 100, bottomEdge - topEdge);
            const left = Math.max(leftEdge, Math.min(anchor.left + anchor.width / 2 - width / 2,
                leftEdge + (viewport?.width ?? window.innerWidth) - 24 - width));
            const top = anchor.bottom + 8 + height <= bottomEdge ? anchor.bottom + 8
                : Math.max(topEdge, anchor.top - height - 8);
            setPosition({ left, top, width, maxHeight: Math.max(40, bottomEdge - top) });
        };
        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        window.visualViewport?.addEventListener('resize', update);
        window.visualViewport?.addEventListener('scroll', update);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
            window.visualViewport?.removeEventListener('resize', update);
            window.visualViewport?.removeEventListener('scroll', update);
        };
    }, [open, description]);
    useEffect(() => {
        if (!open) return undefined;
        const outside = event => {
            if (!buttonRef.current?.contains(event.target) && !tooltipRef.current?.contains(event.target)) setOpen(false);
        };
        const escape = event => { if (event.key === 'Escape') setOpen(false); };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('pointerdown', outside);
            document.removeEventListener('keydown', escape);
        };
    }, [open]);
    return <span className="skill-push-help-container">
        <button ref={buttonRef} type="button" className="skill-push-help" aria-label={label}
            aria-expanded={open} aria-controls={tooltipId} aria-describedby={open ? tooltipId : undefined}
            onClick={() => setOpen(value => !value)}>?</button>
        {open && createPortal(<div ref={tooltipRef} id={tooltipId} role="tooltip" className="skill-push-tooltip"
            style={{ ...position, visibility: position ? 'visible' : 'hidden' }}>{description}</div>, document.body)}
    </span>;
}

export default function SkillPushControl({ checked, onChange, label, helpLabel, description }) {
    const { t } = useTranslation();
    return <div className="skill-push-control">
        <label>
            <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
            <span>{label ?? t('power.skill_push')}</span>
        </label>
        <SkillPushHelp label={helpLabel ?? t('power.skill_push_help_label')}
            description={description ?? t('power.skill_push_description')} />
    </div>;
}
