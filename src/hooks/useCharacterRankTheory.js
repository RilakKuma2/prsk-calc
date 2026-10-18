import { useEffect, useState } from 'react';
import { bundledRankMaster, loadRankMaster, RANK_REFRESH_MS } from '../utils/characterRankData';

export default function useCharacterRankTheory() {
    const [master, setMaster] = useState(bundledRankMaster);
    const [theory, setTheory] = useState(null);
    const [error, setError] = useState(false);
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        let active = true;
        const refresh = () => {
            if (document.visibilityState === 'hidden') return;
            loadRankMaster().then(next => { if (active) setMaster(next); }).catch(() => {});
            import('../utils/characterRankTheoryLoader').then(module => module.loadCharacterRankTheory()).then(next => {
                if (active) { setTheory(next); setMaster(next.master); setError(false); }
            }).catch(() => { if (active) setError(true); });
        };
        // Let the calculator paint before starting even the data downloads.
        let idleHandle;
        const initialTimer = setTimeout(() => {
            if (window.requestIdleCallback) idleHandle = window.requestIdleCallback(refresh, { timeout: 2000 });
            else refresh();
        }, 250);
        const interval = setInterval(refresh, RANK_REFRESH_MS);
        document.addEventListener('visibilitychange', refresh);
        return () => { active = false; clearTimeout(initialTimer); if (idleHandle != null) window.cancelIdleCallback?.(idleHandle); clearInterval(interval); document.removeEventListener('visibilitychange', refresh); };
    }, [revision]);
    return { master, theory, error, retry: () => { setError(false); setRevision(value => value + 1); } };
}
