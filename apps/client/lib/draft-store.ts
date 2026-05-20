'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
    Passport,
    CertificationRef,
    GS1Identifier,
    GarmentInfo,
    Material,
    PassportStatus,
    PassportWarranty,
    ProductionStep,
} from '@lumiris/types';
import { buildGS1Identifier } from '@lumiris/types';

export type WizardStep = 'identification' | 'composition' | 'invoice' | 'manufacturing' | 'certifications' | 'publish';

export const WIZARD_STEPS: readonly WizardStep[] = [
    'identification',
    'composition',
    'invoice',
    'manufacturing',
    'certifications',
    'publish',
] as const;

interface DraftPassport {
    id: string;
    status: PassportStatus;
    artisanId: string;
    createdAt: string;
    updatedAt: string;
    gs1: GS1Identifier;
    garment: GarmentInfo;
    materials: Material[];
    steps: ProductionStep[];
    certifications: CertificationRef[];
    warranty: PassportWarranty;
    lastStep?: WizardStep;
}

interface DraftStoreState {
    drafts: Record<string, DraftPassport>;
    createDraft: (artisanId: string) => string;
    getDraft: (id: string) => DraftPassport | undefined;
    setDraft: (id: string, patch: Partial<DraftPassport>) => void;
    setGarment: (id: string, garment: GarmentInfo) => void;
    setMaterials: (id: string, materials: Material[]) => void;
    setProductionSteps: (id: string, steps: ProductionStep[]) => void;
    setCertifications: (id: string, certs: CertificationRef[]) => void;
    setWarranty: (id: string, warranty: PassportWarranty) => void;
    setLastStep: (id: string, step: WizardStep) => void;
    publish: (id: string, opts: { gs1: GS1Identifier; status: PassportStatus }) => void;
    deleteDraft: (id: string) => void;
}

function newId(): string {
    return `draft-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyGarment(): GarmentInfo {
    return {
        kind: 'sweater',
        reference: '',
        mainPhotoUrl: '',
        dimensions: {},
        retailPrice: 0,
        currency: 'EUR',
    };
}

function emptyWarranty(): PassportWarranty {
    return { durationMonths: 0, terms: '' };
}

export const useDraftStore = create<DraftStoreState>()(
    persist(
        (set, get) => ({
            drafts: {},
            createDraft: (artisanId) => {
                const id = newId();
                const now = new Date().toISOString();
                const draft: DraftPassport = {
                    id,
                    status: 'Draft',
                    artisanId,
                    createdAt: now,
                    updatedAt: now,
                    gs1: buildGS1Identifier('0000000000000', id),
                    garment: emptyGarment(),
                    materials: [],
                    steps: [],
                    certifications: [],
                    warranty: emptyWarranty(),
                };
                set((s) => ({ drafts: { ...s.drafts, [id]: draft } }));
                return id;
            },
            getDraft: (id) => get().drafts[id],
            setDraft: (id, patch) => {
                const existing = get().drafts[id];
                if (!existing) return;
                set((s) => ({
                    drafts: {
                        ...s.drafts,
                        [id]: { ...existing, ...patch, updatedAt: new Date().toISOString() },
                    },
                }));
            },
            setGarment: (id, garment) => get().setDraft(id, { garment }),
            setMaterials: (id, materials) => get().setDraft(id, { materials }),
            setProductionSteps: (id, steps) => get().setDraft(id, { steps }),
            setCertifications: (id, certifications) => get().setDraft(id, { certifications }),
            setWarranty: (id, warranty) => get().setDraft(id, { warranty }),
            setLastStep: (id, step) => get().setDraft(id, { lastStep: step }),
            publish: (id, opts) => get().setDraft(id, { status: opts.status, gs1: opts.gs1 }),
            deleteDraft: (id) => {
                const next = { ...get().drafts };
                delete next[id];
                set({ drafts: next });
            },
        }),
        {
            name: 'atelier-drafts',
            storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
            version: 1,
        },
    ),
);

const noopStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
};

export function draftToPassport(draft: DraftPassport): Passport {
    return {
        id: draft.id,
        gs1: draft.gs1,
        status: draft.status,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
        artisanId: draft.artisanId,
        garment: draft.garment,
        materials: draft.materials,
        steps: draft.steps,
        certifications: draft.certifications,
        warranty: draft.warranty,
    };
}
