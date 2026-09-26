import { useEffect, useRef, useState } from 'react';
import { calculateNoteScore, noteInput } from '../utils/noteScoreClient';

// Keep meta ordering stable. Page changes reprioritize the next pending chart,
// without restarting downloads or accepting results for obsolete deck inputs.
export default function useProgressiveNoteScores(rows, visibleKeys, mode = 'solo') {
    const priority = useRef(visibleKeys);
    priority.current = visibleKeys;
    const signature = JSON.stringify(rows.map(row => ({ key: row.key, input: noteInput(row.input) })));
    const [state, setState] = useState({ signature: '', results: {} });
    useEffect(() => {
        const controller = new AbortController();
        const pending = JSON.parse(signature);
        setState({ signature, results: {} });
        (async () => {
            while (pending.length && !controller.signal.aborted) {
                const index = pending.findIndex(row => priority.current.includes(row.key));
                const row = pending.splice(index < 0 ? 0 : index, 1)[0];
                let result;
                try { result = await calculateNoteScore(row.input, mode, { signal: controller.signal, priority: index < 0 ? 0 : 10 }); }
                catch (error) {
                    if (controller.signal.aborted) break;
                    result = { noteError: true };
                }
                if (controller.signal.aborted) break;
                setState(previous => ({ signature, results: { ...previous.results, [row.key]: result } }));
                // Worker messages already yield to the browser; avoid an extra timer for every row.
            }
        })();
        return () => controller.abort();
    }, [signature, mode]);
    return state.signature === signature ? state.results : {};
}
