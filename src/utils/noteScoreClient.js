import { ASSET_BASE_URL, joinUrl } from '../config/env';

let worker, active, sequence = 0;
const queue = [];
export function noteInput(input) {
    return { songId: Number(input.songId), difficulty: input.difficulty, totalPower: Math.round(Number(input.totalPower)),
        ...Object.fromEntries(['skillLeader', 'skillMember2', 'skillMember3', 'skillMember4', 'skillMember5'].map(key => [key, Number(input[key])])),
        skillPush: input.precomputeSkillPush ? false : input.skillPush === true,
        precomputeSkillPush: input.precomputeSkillPush === true,
        skillFeverDelayMs: Math.max(0, Math.min(30000, Number(input.skillFeverDelayMs) || 0)),
        ...(input.orderedSkills ? { orderedSkills: input.orderedSkills.map(Number) } : {}) };
}
function start() {
    if (active || !queue.length) return;
    queue.sort((a, b) => b.priority - a.priority || a.id - b.id);
    active = queue.shift();
    try {
        if (!worker) {
            worker = new Worker(new URL('./noteScore.worker.js', import.meta.url));
            worker.onmessage = ({ data }) => {
                if (data.id !== active?.id) return;
                const job = active; active = null; job.cleanup();
                if (data.error) job.reject(new Error(data.error)); else job.resolve(data.result);
                start();
            };
            worker.onerror = () => {
                worker.terminate(); worker = null;
                const jobs = [active, ...queue.splice(0)]; active = null;
                jobs.filter(Boolean).forEach(job => { job.cleanup(); job.reject(new Error('Note score worker failed')); });
            };
        }
        worker.postMessage({ id: active.id, input: active.input, mode: active.mode,
            localBaseUrl: new URL(joinUrl(process.env.PUBLIC_URL || '', 'live-score'), window.location.href).href,
            baseUrl: joinUrl(ASSET_BASE_URL || 'https://asset.rilaksekai.com', 'data/live-score') });
    } catch (error) {
        const job = active; active = null; job.cleanup(); job.reject(error); start();
    }
}
export function calculateNoteScore(input, mode = 'solo', { signal, priority = 0 } = {}) {
    return new Promise((resolve, reject) => {
        const abort = () => {
            const i = queue.indexOf(job);
            if (i >= 0) queue.splice(i, 1);
            job.cleanup(); reject(new DOMException('Cancelled', 'AbortError'));
            // An already running calculation can finish and populate the worker cache.
        };
        const job = { id: ++sequence, input: noteInput(input), mode, priority, resolve, reject,
            cleanup: () => signal?.removeEventListener('abort', abort) };
        if (signal?.aborted) { abort(); return; }
        signal?.addEventListener('abort', abort, { once: true });
        queue.push(job); start();
    });
}
