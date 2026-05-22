import type { Fiber } from '@lumiris/types';
import type { InvoiceFiberLine } from '@/lib/invoices-store';

export function seedHash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return h >>> 0 || 1;
}

export function makeRng(seed: number): () => number {
    let state = seed;
    return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}

export function genFibers(supplierFibers: readonly string[], rng: () => number): InvoiceFiberLine[] {
    if (supplierFibers.length === 0) return [];
    if (supplierFibers.length === 1) return [{ fiber: supplierFibers[0] as Fiber, pct: 100 }];
    const weights = supplierFibers.map(() => rng() * 0.8 + 0.2);
    const sum = weights.reduce((a, b) => a + b, 0);
    const lines = supplierFibers.map((f, i) => ({
        fiber: f as Fiber,
        pct: Math.round(((weights[i] ?? 0) / sum) * 100),
    }));
    const drift = 100 - lines.reduce((a, l) => a + l.pct, 0);
    if (drift !== 0 && lines[0]) lines[0] = { ...lines[0], pct: lines[0].pct + drift };
    return lines;
}
