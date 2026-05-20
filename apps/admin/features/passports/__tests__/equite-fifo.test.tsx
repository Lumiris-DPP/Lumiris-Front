import { describe, expect, it } from 'bun:test';
import { makePassport } from '../../../test/factories';

function fifoCompare<T extends { passport: { createdAt: string } }>(a: T, b: T): number {
    return new Date(a.passport.createdAt).getTime() - new Date(b.passport.createdAt).getTime();
}

describe('FIFO equity — un ATELIER+ soumis APRÈS un Solo passe quand même APRÈS', () => {
    it('Solo soumis à 12:00, ATELIER+ soumis à 12:01 → Solo en tête', () => {
        const solo = {
            passport: makePassport({ createdAt: '2026-04-29T12:00:00Z' }),
            isAtelierPlus: false,
        };
        const plus = {
            passport: makePassport({ createdAt: '2026-04-29T12:01:00Z' }),
            isAtelierPlus: true,
        };
        const sorted = [plus, solo].sort(fifoCompare);
        expect(sorted[0]).toBe(solo);
        expect(sorted[1]).toBe(plus);
    });

    it('ordre indépendant de isAtelierPlus (même createdAt → ordre stable)', () => {
        const a = {
            passport: makePassport({ id: 'P-A', createdAt: '2026-04-29T12:00:00Z' }),
            isAtelierPlus: true,
        };
        const b = {
            passport: makePassport({ id: 'P-B', createdAt: '2026-04-29T12:00:00Z' }),
            isAtelierPlus: false,
        };
        const sortedAB = [a, b].sort(fifoCompare);
        const sortedBA = [b, a].sort(fifoCompare);
        expect(sortedAB[0]?.passport.id).toBe('P-A');
        expect(sortedBA[0]?.passport.id).toBe('P-B');
    });

    it('5 passeports en désordre → tous classés par createdAt croissant', () => {
        const items = [
            { passport: makePassport({ id: 'P1', createdAt: '2026-04-30T08:00:00Z' }), isAtelierPlus: true },
            { passport: makePassport({ id: 'P2', createdAt: '2026-04-28T08:00:00Z' }), isAtelierPlus: false },
            { passport: makePassport({ id: 'P3', createdAt: '2026-04-29T08:00:00Z' }), isAtelierPlus: true },
            { passport: makePassport({ id: 'P4', createdAt: '2026-04-27T08:00:00Z' }), isAtelierPlus: false },
            { passport: makePassport({ id: 'P5', createdAt: '2026-05-01T08:00:00Z' }), isAtelierPlus: true },
        ];
        const sorted = items.sort(fifoCompare);
        expect(sorted.map((x) => x.passport.id)).toEqual(['P4', 'P2', 'P3', 'P1', 'P5']);
    });

    it("si ATELIER+ est PUBLIÉ avant un Solo soumis plus tôt → c'est détecté comme violation FIFO", () => {
        const solo = {
            passport: makePassport({ id: 'P-SOLO', createdAt: '2026-04-29T12:00:00Z' }),
            isAtelierPlus: false,
            publishedTime: new Date('2026-04-30T16:00:00Z').getTime(),
        };
        const plus = {
            passport: makePassport({ id: 'P-PLUS', createdAt: '2026-04-29T12:30:00Z' }),
            isAtelierPlus: true,
            publishedTime: new Date('2026-04-30T08:00:00Z').getTime(),
        };
        const enqueued = [solo, plus].sort(fifoCompare);
        const enqueuedRank = new Map<string, number>();
        enqueued.forEach((row, i) => enqueuedRank.set(row.passport.id, i + 1));
        const plusEnq = enqueuedRank.get('P-PLUS')!;
        const violation = enqueuedRank.get('P-SOLO')! < plusEnq && solo.publishedTime > plus.publishedTime;
        expect(violation).toBe(true);
    });

    it("ATELIER+ et Solo publiés DANS l'ordre FIFO → aucune violation", () => {
        const solo = {
            passport: makePassport({ id: 'P-SOLO', createdAt: '2026-04-29T12:00:00Z' }),
            publishedTime: new Date('2026-04-30T08:00:00Z').getTime(),
            isAtelierPlus: false,
        };
        const plus = {
            passport: makePassport({ id: 'P-PLUS', createdAt: '2026-04-29T12:30:00Z' }),
            publishedTime: new Date('2026-04-30T16:00:00Z').getTime(),
            isAtelierPlus: true,
        };
        const enqueued = [solo, plus].sort(fifoCompare);
        const enqueuedRank = new Map<string, number>();
        enqueued.forEach((row, i) => enqueuedRank.set(row.passport.id, i + 1));
        const violation =
            enqueuedRank.get('P-SOLO')! < enqueuedRank.get('P-PLUS')! && solo.publishedTime > plus.publishedTime;
        expect(violation).toBe(false);
    });
});
