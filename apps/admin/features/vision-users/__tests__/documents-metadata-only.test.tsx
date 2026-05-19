import { describe, expect, it } from 'bun:test';
import type { MockVisionUser } from '@lumiris/mock-data';
import { DOCUMENT_TYPES, getDocuments } from '../segments';

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

const FORBIDDEN_FIELDS = ['url', 'downloadUrl', 'href', 'src', 'blob', 'content', 'data', 'payload'] as const;

describe('Documents joints — métadonnées only (RGPD)', () => {
    it('chaque document expose EXACTEMENT 5 champs (id, type, productLabel, uploadedAt, sizeBytes)', () => {
        const docs = getDocuments(makeUser({ id: 'DOC-USER-1' }));
        expect(docs.length).toBeGreaterThan(0);
        for (const doc of docs) {
            expect(Object.keys(doc).sort()).toEqual(['id', 'productLabel', 'sizeBytes', 'type', 'uploadedAt']);
        }
    });

    it('aucun champ payload / url / href / src / blob / content', () => {
        const docs = getDocuments(makeUser({ id: 'DOC-USER-2' }));
        for (const doc of docs) {
            for (const field of FORBIDDEN_FIELDS) {
                expect(doc).not.toHaveProperty(field);
            }
        }
    });

    it("utilisateur anon → 0 document (jamais d'image / lien lié à anonyme)", () => {
        expect(getDocuments(makeUser({ id: 'DOC-ANON', anon: true })).length).toBe(0);
    });

    it('utilisateur erased → 0 document (cleared par effacement RGPD)', () => {
        expect(getDocuments(makeUser({ id: 'DOC-ERASED', erased: true })).length).toBe(0);
    });

    it('sizeBytes est un nombre fini > 0 (jamais une URL stringifiée)', () => {
        const docs = getDocuments(makeUser({ id: 'DOC-SIZE' }));
        for (const doc of docs) {
            expect(typeof doc.sizeBytes).toBe('number');
            expect(doc.sizeBytes).toBeGreaterThan(0);
            expect(Number.isFinite(doc.sizeBytes)).toBe(true);
        }
    });

    it('type appartient à DOCUMENT_TYPES (enum fermé : facture, garantie, assurance, reparation, autre)', () => {
        const docs = getDocuments(makeUser({ id: 'DOC-TYPE' }));
        for (const doc of docs) {
            expect(DOCUMENT_TYPES).toContain(doc.type);
        }
    });

    it('id est un string opaque (pas un slug URL exploitable)', () => {
        const docs = getDocuments(makeUser({ id: 'DOC-ID' }));
        for (const doc of docs) {
            expect(typeof doc.id).toBe('string');
            expect(doc.id).not.toMatch(/^https?:\/\//);
            expect(doc.id).not.toContain('.pdf');
            expect(doc.id).not.toContain('.jpg');
        }
    });
});
