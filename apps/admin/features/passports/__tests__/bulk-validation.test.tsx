import { describe, expect, it } from 'bun:test';
import { makePassport } from '../../../test/factories';

interface BulkLogEntry {
    action: 'passport.curate';
    targetType: 'passport';
    targetId: string;
    payload: { decision: 'validated'; bulk: true; publishedAt: string; artisanId: string };
}

function bulkValidate(
    rows: ReadonlyArray<{ passport: ReturnType<typeof makePassport> }>,
    log: (entry: BulkLogEntry) => void,
    publishedAt: string,
): void {
    for (const row of rows) {
        log({
            action: 'passport.curate',
            targetType: 'passport',
            targetId: row.passport.id,
            payload: {
                decision: 'validated',
                bulk: true,
                publishedAt,
                artisanId: row.passport.artisanId,
            },
        });
    }
}

describe('bulk validate — 1 entrée audit log par passeport', () => {
    it('5 passeports → exactement 5 entries', () => {
        const rows = Array.from({ length: 5 }, (_, i) => ({ passport: makePassport({ id: `PASS-${i}` }) }));
        const entries: BulkLogEntry[] = [];
        bulkValidate(rows, (e) => entries.push(e), '2026-04-30T10:00:00Z');
        expect(entries.length).toBe(5);
    });

    it('chaque entry cible le bon passportId', () => {
        const rows = ['P1', 'P2', 'P3'].map((id) => ({ passport: makePassport({ id }) }));
        const entries: BulkLogEntry[] = [];
        bulkValidate(rows, (e) => entries.push(e), '2026-04-30T10:00:00Z');
        expect(entries.map((e) => e.targetId)).toEqual(['P1', 'P2', 'P3']);
    });

    it('payload.bulk = true sur chaque entry (distingue bulk vs validate unitaire)', () => {
        const rows = [{ passport: makePassport({ id: 'P-X' }) }];
        const entries: BulkLogEntry[] = [];
        bulkValidate(rows, (e) => entries.push(e), '2026-04-30T10:00:00Z');
        expect(entries[0]?.payload.bulk).toBe(true);
    });

    it("publishedAt identique pour tous (même tick d'horloge)", () => {
        const rows = ['P1', 'P2'].map((id) => ({ passport: makePassport({ id }) }));
        const entries: BulkLogEntry[] = [];
        const publishedAt = '2026-04-30T10:00:00Z';
        bulkValidate(rows, (e) => entries.push(e), publishedAt);
        expect(entries.every((e) => e.payload.publishedAt === publishedAt)).toBe(true);
    });

    it('liste vide → aucun audit log (rien à valider, rien à logger)', () => {
        const entries: BulkLogEntry[] = [];
        bulkValidate([], (e) => entries.push(e), '2026-04-30T10:00:00Z');
        expect(entries.length).toBe(0);
    });

    it('action toujours = "passport.curate" (cohérence audit log enum)', () => {
        const rows = [{ passport: makePassport() }, { passport: makePassport() }];
        const entries: BulkLogEntry[] = [];
        bulkValidate(rows, (e) => entries.push(e), '2026-04-30T10:00:00Z');
        expect(entries.every((e) => e.action === 'passport.curate')).toBe(true);
    });
});
