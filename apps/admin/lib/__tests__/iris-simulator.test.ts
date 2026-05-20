import { describe, expect, it } from 'bun:test';
import type { Material, Passport } from '@lumiris/types';
import { applySimulatorChanges } from '../iris-simulator';
import { makePassport } from '@/test/factories';

function makeMaterial(overrides: Partial<Material> = {}): Material {
    return {
        fiber: 'cotton',
        percentage: 100,
        supplierId: 'SUP-A',
        originCountry: 'FR',
        certifications: [
            {
                id: 'cert-1',
                kind: 'OEKO-TEX',
                issuer: 'Ecocert',
                issuedAt: '2024-01-01',
                expiresAt: '2026-12-31',
                verified: false,
                fileUrl: 'https://example.com/cert.pdf',
            },
        ],
        invoiceRef: 'INV-001',
        ...overrides,
    };
}

function makeBase(): Passport {
    return makePassport({
        materials: [makeMaterial({ fiber: 'cotton' }), makeMaterial({ fiber: 'linen' })],
        care: undefined,
        steps: [],
    });
}

describe('applySimulatorChanges — addGotsCertOnFiber', () => {
    it('ajoute une certif GOTS verified sur la fibre ciblée', () => {
        const result = applySimulatorChanges(makeBase(), { addGotsCertOnFiber: 0 });
        const certs = result.materials[0]!.certifications;
        const gots = certs.find((c) => c.kind === 'GOTS');
        expect(gots).toBeDefined();
        expect(gots?.verified).toBe(true);
    });

    it("n'altère pas les autres fibres", () => {
        const result = applySimulatorChanges(makeBase(), { addGotsCertOnFiber: 0 });
        const otherFiberCerts = result.materials[1]!.certifications;
        expect(otherFiberCerts.find((c) => c.kind === 'GOTS')).toBeUndefined();
    });

    it('ignore les index hors limites sans crasher', () => {
        const before = makeBase();
        const result = applySimulatorChanges(before, { addGotsCertOnFiber: 99 });
        expect(result.materials.length).toBe(before.materials.length);
        for (let i = 0; i < before.materials.length; i++) {
            expect(result.materials[i]!.certifications.length).toBe(before.materials[i]!.certifications.length);
        }
    });

    it("produit une copie (immutable — pas de mutation du passport d'origine)", () => {
        const base = makeBase();
        const snapshot = JSON.stringify(base);
        applySimulatorChanges(base, { addGotsCertOnFiber: 0 });
        expect(JSON.stringify(base)).toBe(snapshot);
    });

    it('preserve toutes les certifs préexistantes', () => {
        const result = applySimulatorChanges(makeBase(), { addGotsCertOnFiber: 0 });
        const ids = result.materials[0]!.certifications.map((c) => c.id);
        expect(ids).toContain('cert-1');
    });
});

describe('applySimulatorChanges — markInvoiceVerified', () => {
    it('marque toutes les certifs de tous les matériaux verified=true', () => {
        const result = applySimulatorChanges(makeBase(), { markInvoiceVerified: true });
        for (const m of result.materials) {
            for (const c of m.certifications) expect(c.verified).toBe(true);
        }
    });

    it('ignoré quand le flag est false / undefined', () => {
        const before = makeBase();
        const result = applySimulatorChanges(before, {});
        expect(result.materials[0]!.certifications[0]!.verified).toBe(false);
    });
});

describe('applySimulatorChanges — addProductionStep', () => {
    it('ajoute une étape "assembly" au tableau steps', () => {
        const result = applySimulatorChanges(makeBase(), { addProductionStep: true });
        expect(result.steps.length).toBe(1);
        expect(result.steps[0]?.kind).toBe('assembly');
    });

    it('laisse steps inchangé sans flag', () => {
        const result = applySimulatorChanges(makeBase(), {});
        expect(result.steps.length).toBe(0);
    });

    it("append (ne remplace pas) en présence d'étapes existantes", () => {
        const base = makePassport({
            materials: [makeMaterial()],
            steps: [
                {
                    id: 'step-existing',
                    kind: 'cutting',
                    label: 'Découpe',
                    performedBy: 'ART-001',
                    locationCity: 'Lyon',
                    locationCountry: 'FR',
                    photos: [],
                    performedAt: '2026-04-01T08:00:00Z',
                },
            ],
        });
        const result = applySimulatorChanges(base, { addProductionStep: true });
        expect(result.steps.length).toBe(2);
        expect(result.steps[0]?.id).toBe('step-existing');
    });
});

describe('applySimulatorChanges — fillCare', () => {
    it('remplit les 4 champs care quand le flag est true', () => {
        const result = applySimulatorChanges(makeBase(), { fillCare: true });
        expect(result.care?.washing).toBeDefined();
        expect(result.care?.drying).toBeDefined();
        expect(result.care?.ironing).toBeDefined();
        expect(result.care?.storage).toBeDefined();
    });

    it("preserve care=undefined quand le flag n'est pas armé", () => {
        const result = applySimulatorChanges(makeBase(), {});
        expect(result.care).toBeUndefined();
    });
});

describe('applySimulatorChanges — combinaisons', () => {
    it('applique plusieurs changements simultanément', () => {
        const result = applySimulatorChanges(makeBase(), {
            addGotsCertOnFiber: 0,
            markInvoiceVerified: true,
            addProductionStep: true,
            fillCare: true,
        });
        expect(result.materials[0]!.certifications.find((c) => c.kind === 'GOTS')).toBeDefined();
        expect(result.materials[0]!.certifications.every((c) => c.verified)).toBe(true);
        expect(result.steps.length).toBe(1);
        expect(result.care?.washing).toBeDefined();
    });
});
