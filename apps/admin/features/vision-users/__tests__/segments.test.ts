import { describe, expect, it } from 'bun:test';
import type { MockVisionUser } from '@lumiris/mock-data';
import {
    ARPU_NO_ACCOUNT_EUR,
    ARPU_WITH_ACCOUNT_EUR,
    DOCUMENT_TYPES,
    ESPR_CATEGORIES,
    SEGMENT_KEYS,
    computeTierKpis,
    formatBytes,
    getAffiliationCommissionsEur,
    getCategoryBreakdown,
    getDocuments,
    getRgpdStatus,
    getScans30d,
    getSegments,
    isMauActive,
    totalWardrobeSize,
} from '../segments';

const NOW = new Date('2026-04-30T12:00:00Z');

function makeUser(overrides: Partial<MockVisionUser> & { id: string }): MockVisionUser {
    return {
        role: 'consumer',
        anon: false,
        createdAt: '2025-01-01T08:00:00Z',
        lastSeenAt: '2026-04-25T08:00:00Z',
        wardrobePassportIds: [],
        scansCount: 5,
        consentNewsletter: false,
        consentAffiliation: false,
        ...overrides,
    } as MockVisionUser;
}

describe('SEGMENT_KEYS — 4 segments figés V0', () => {
    it('expose exactement les 4 keys (top_scanner, wardrobe_rich, churn_risk, affiliation_plus)', () => {
        expect([...SEGMENT_KEYS].sort()).toEqual(['affiliation_plus', 'churn_risk', 'top_scanner', 'wardrobe_rich']);
    });
});

describe('ESPR_CATEGORIES — Garde-Robe multi-secteurs', () => {
    it('couvre les 6 secteurs ESPR (textile + 5 autres)', () => {
        expect(ESPR_CATEGORIES).toEqual([
            'textile',
            'electronique',
            'electromenager',
            'mobilier',
            'batteries',
            'autres',
        ]);
    });
});

describe('ARPU constants', () => {
    it('compte créé > anonyme (différenciation 2-tier)', () => {
        expect(ARPU_WITH_ACCOUNT_EUR).toBeGreaterThan(ARPU_NO_ACCOUNT_EUR);
    });

    it('valeurs verrouillées : 2 € sans compte, 3,8 € avec compte', () => {
        expect(ARPU_NO_ACCOUNT_EUR).toBe(2);
        expect(ARPU_WITH_ACCOUNT_EUR).toBe(3.8);
    });
});

describe('getScans30d', () => {
    it('renvoie 0 si pas de lastSeen', () => {
        expect(getScans30d(makeUser({ id: 'U1', lastSeenAt: undefined as never, scansCount: 10 }), NOW)).toBe(0);
    });

    it('renvoie 0 si dernière visite > 30 j', () => {
        expect(getScans30d(makeUser({ id: 'U2', lastSeenAt: '2026-03-01T00:00:00Z', scansCount: 50 }), NOW)).toBe(0);
    });

    it('renvoie le compte intégral si dernière visite < 7 j', () => {
        expect(getScans30d(makeUser({ id: 'U3', lastSeenAt: '2026-04-29T00:00:00Z', scansCount: 22 }), NOW)).toBe(22);
    });

    it('décroît linéairement entre 7 j et 30 j', () => {
        const recent = getScans30d(makeUser({ id: 'U4', lastSeenAt: '2026-04-20T12:00:00Z', scansCount: 30 }), NOW);
        const older = getScans30d(makeUser({ id: 'U5', lastSeenAt: '2026-04-05T12:00:00Z', scansCount: 30 }), NOW);
        expect(recent).toBeGreaterThan(older);
        expect(older).toBeGreaterThan(0);
    });

    it('reste non-négatif sur les bornes hautes', () => {
        const out = getScans30d(makeUser({ id: 'U6', lastSeenAt: '2026-03-31T12:00:00Z', scansCount: 100 }), NOW);
        expect(out).toBeGreaterThanOrEqual(0);
    });
});

describe('isMauActive', () => {
    it('anon → toujours false', () => {
        expect(isMauActive(makeUser({ id: 'U7', anon: true, lastSeenAt: '2026-04-29T08:00:00Z' }), NOW)).toBe(false);
    });

    it('erased → toujours false', () => {
        expect(isMauActive(makeUser({ id: 'U8', erased: true, lastSeenAt: '2026-04-29T08:00:00Z' }), NOW)).toBe(false);
    });

    it('actif si lastSeen ≤ 30 j', () => {
        expect(isMauActive(makeUser({ id: 'U9', lastSeenAt: '2026-04-15T08:00:00Z' }), NOW)).toBe(true);
    });

    it('inactif si lastSeen > 30 j', () => {
        expect(isMauActive(makeUser({ id: 'U10', lastSeenAt: '2026-03-20T08:00:00Z' }), NOW)).toBe(false);
    });

    it('inactif si pas de lastSeen', () => {
        expect(isMauActive(makeUser({ id: 'U11', lastSeenAt: undefined as never }), NOW)).toBe(false);
    });
});

describe('getSegments', () => {
    it('anon → liste vide', () => {
        const u = makeUser({ id: 'S1', anon: true, scansCount: 100 });
        expect(getSegments(u, NOW)).toEqual([]);
    });

    it('erased → liste vide', () => {
        const u = makeUser({ id: 'S2', erased: true, scansCount: 100 });
        expect(getSegments(u, NOW)).toEqual([]);
    });

    it('top_scanner si scans 30 j > 20', () => {
        const u = makeUser({ id: 'S3', lastSeenAt: '2026-04-29T00:00:00Z', scansCount: 25 });
        expect(getSegments(u, NOW)).toContain('top_scanner');
    });

    it('churn_risk si lastSeen > 60 j', () => {
        const u = makeUser({ id: 'S4', lastSeenAt: '2026-02-01T00:00:00Z' });
        expect(getSegments(u, NOW)).toContain('churn_risk');
    });

    it('wardrobe_rich si total products > 30', () => {
        const u = makeUser({
            id: 'S5',
            wardrobePassportIds: Array.from({ length: 50 }, (_, i) => `p-${i}`),
            scansCount: 12,
        });
        expect(getSegments(u, NOW)).toContain('wardrobe_rich');
    });
});

describe('getRgpdStatus — états figés', () => {
    it('erased → completed', () => {
        const u = makeUser({ id: 'R1', erased: true });
        expect(getRgpdStatus(u)).toBe('completed');
    });

    it('aucune demande → none', () => {
        const u = makeUser({ id: 'R2' });
        expect(getRgpdStatus(u)).toBe('none');
    });

    it('erase pending → pending_deletion', () => {
        const u = makeUser({
            id: 'R3',
            rgpdRequests: [{ kind: 'erase', requestedAt: NOW.toISOString(), status: 'pending' }],
        });
        expect(getRgpdStatus(u)).toBe('pending_deletion');
    });

    it('export pending → requested', () => {
        const u = makeUser({
            id: 'R4',
            rgpdRequests: [{ kind: 'export', requestedAt: NOW.toISOString(), status: 'pending' }],
        });
        expect(getRgpdStatus(u)).toBe('requested');
    });

    it('demande complétée → completed', () => {
        const u = makeUser({
            id: 'R5',
            rgpdRequests: [{ kind: 'export', requestedAt: NOW.toISOString(), status: 'completed' }],
        });
        expect(getRgpdStatus(u)).toBe('completed');
    });
});

describe('getAffiliationCommissionsEur', () => {
    it('anon → 0', () => {
        expect(getAffiliationCommissionsEur(makeUser({ id: 'A1', anon: true, consentAffiliation: true }))).toBe(0);
    });

    it('sans consent → 0', () => {
        expect(getAffiliationCommissionsEur(makeUser({ id: 'A2', consentAffiliation: false }))).toBe(0);
    });

    it('avec consent → positive et déterministe', () => {
        const u = makeUser({ id: 'A3', consentAffiliation: true, scansCount: 10 });
        const first = getAffiliationCommissionsEur(u);
        const second = getAffiliationCommissionsEur(u);
        expect(first).toBeGreaterThan(0);
        expect(first).toBe(second);
    });

    it('croît avec scansCount', () => {
        const low = getAffiliationCommissionsEur(makeUser({ id: 'A4', consentAffiliation: true, scansCount: 1 }));
        const high = getAffiliationCommissionsEur(makeUser({ id: 'A4', consentAffiliation: true, scansCount: 50 }));
        expect(high).toBeGreaterThan(low);
    });

    it('reste entier (€ arrondi)', () => {
        const v = getAffiliationCommissionsEur(makeUser({ id: 'A5', consentAffiliation: true, scansCount: 7 }));
        expect(Number.isInteger(v)).toBe(true);
    });
});

describe('getCategoryBreakdown', () => {
    it('erased → tous comptes à 0', () => {
        const breakdown = getCategoryBreakdown(makeUser({ id: 'B1', erased: true }));
        expect(breakdown.every((e) => e.count === 0)).toBe(true);
    });

    it('couvre les 6 secteurs ESPR', () => {
        const breakdown = getCategoryBreakdown(makeUser({ id: 'B2' }));
        expect(breakdown).toHaveLength(6);
        expect(breakdown.map((e) => e.category).sort()).toEqual([...ESPR_CATEGORIES].sort());
    });

    it('textile = wardrobePassportIds.length exact', () => {
        const u = makeUser({ id: 'B3', wardrobePassportIds: ['p1', 'p2', 'p3'] });
        const textile = getCategoryBreakdown(u).find((e) => e.category === 'textile');
        expect(textile?.count).toBe(3);
    });

    it('totalWardrobeSize = somme des 6 secteurs', () => {
        const u = makeUser({ id: 'B4', scansCount: 8, wardrobePassportIds: ['p1', 'p2'] });
        const breakdown = getCategoryBreakdown(u);
        const sum = breakdown.reduce((s, e) => s + e.count, 0);
        expect(totalWardrobeSize(u)).toBe(sum);
    });
});

describe('getDocuments — metadata only, jamais de payload', () => {
    it('anon → aucun document (RGPD)', () => {
        expect(getDocuments(makeUser({ id: 'D1', anon: true })).length).toBe(0);
    });

    it('erased → aucun document', () => {
        expect(getDocuments(makeUser({ id: 'D2', erased: true })).length).toBe(0);
    });

    it('chaque doc expose uniquement metadata (id/type/productLabel/uploadedAt/sizeBytes)', () => {
        const docs = getDocuments(makeUser({ id: 'D3' }));
        expect(docs.length).toBeGreaterThan(0);
        for (const doc of docs) {
            const keys = Object.keys(doc).sort();
            expect(keys).toEqual(['id', 'productLabel', 'sizeBytes', 'type', 'uploadedAt']);
            expect(doc).not.toHaveProperty('url');
            expect(doc).not.toHaveProperty('downloadUrl');
            expect(doc).not.toHaveProperty('blob');
            expect(doc).not.toHaveProperty('content');
        }
    });

    it('type doit appartenir à DOCUMENT_TYPES', () => {
        const docs = getDocuments(makeUser({ id: 'D4' }));
        for (const doc of docs) {
            expect(DOCUMENT_TYPES).toContain(doc.type);
        }
    });

    it('produit déterministe : 2 appels = même output', () => {
        const u = makeUser({ id: 'D5' });
        expect(getDocuments(u)).toEqual(getDocuments(u));
    });
});

describe('formatBytes', () => {
    it('< 1 ko → "X o"', () => {
        expect(formatBytes(500)).toBe('500 o');
    });

    it('< 1 Mo → "X ko"', () => {
        expect(formatBytes(2048)).toBe('2 ko');
    });

    it('≥ 1 Mo → "X.X Mo"', () => {
        expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 Mo');
    });

    it('0 octets → "0 o"', () => {
        expect(formatBytes(0)).toBe('0 o');
    });
});

describe('computeTierKpis', () => {
    it('sépare bien anon / account', () => {
        const users: MockVisionUser[] = [
            makeUser({ id: 'T1', anon: true, lastSeenAt: '2026-04-25T08:00:00Z' }),
            makeUser({ id: 'T2', anon: false, lastSeenAt: '2026-04-25T08:00:00Z' }),
            makeUser({ id: 'T3', anon: false, erased: true }),
        ];
        const kpis = computeTierKpis(users, NOW);
        expect(kpis.anon.count).toBe(1);
        expect(kpis.account.count).toBe(1);
    });

    it('expose 3 tuiles par tier', () => {
        const kpis = computeTierKpis([makeUser({ id: 'T4' })], NOW);
        expect(kpis.anon.tiles).toHaveLength(3);
        expect(kpis.account.tiles).toHaveLength(3);
    });

    it('ARPU exposé sur les tiles', () => {
        const kpis = computeTierKpis([], NOW);
        expect(kpis.anon.arpuEur).toBe(ARPU_NO_ACCOUNT_EUR);
        expect(kpis.account.arpuEur).toBe(ARPU_WITH_ACCOUNT_EUR);
    });

    it('liste vide → counts = 0 et tiles toujours présentes', () => {
        const kpis = computeTierKpis([], NOW);
        expect(kpis.anon.count).toBe(0);
        expect(kpis.account.count).toBe(0);
        expect(kpis.anon.tiles.length).toBe(3);
    });
});
