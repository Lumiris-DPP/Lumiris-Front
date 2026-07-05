'use client';

import { create } from 'zustand';
import type {
    GarmentInfo,
    CareInstructionCode,
    DppMaterial,
    TraceabilityInfo,
    EcoInfo,
    Passport,
    PassportStatus,
} from '@lumiris/types';
import { buildGS1Identifier } from '@lumiris/types';

export type WizardStep = 'product' | 'care' | 'traceability' | 'eco';

export const WIZARD_STEPS: readonly WizardStep[] = ['product', 'care', 'traceability', 'eco'] as const;

export interface DraftPassport {
    id: string;
    artisanId: string;
    createdAt: string;
    updatedAt: string;
    garment: GarmentInfo;
    materials: DppMaterial[];
    careInstructions: CareInstructionCode[];
    careNotes: string;
    traceability: TraceabilityInfo;
    eco: EcoInfo;
    files: Partial<Record<string, File>>;
    lastStep?: WizardStep;
}

interface DraftStoreState {
    drafts: Record<string, DraftPassport>;
    createDraft: (artisanId: string, id?: string) => string;
    getDraft: (id: string) => DraftPassport | undefined;
    setDraft: (id: string, patch: Partial<DraftPassport>) => void;
    setGarment: (id: string, garment: GarmentInfo) => void;
    setMaterials: (id: string, materials: DppMaterial[]) => void;
    setCareInstructions: (id: string, careInstructions: CareInstructionCode[]) => void;
    setCareNotes: (id: string, careNotes: string) => void;
    setTraceability: (id: string, traceability: TraceabilityInfo) => void;
    setEco: (id: string, eco: EcoInfo) => void;
    setFile: (id: string, docType: string, file: File | null) => void;
    setLastStep: (id: string, step: WizardStep) => void;
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

function emptyTraceability(): TraceabilityInfo {
    return {
        manufacturedAt: new Date().toISOString().slice(0, 10),
        reachCompliant: false,
    };
}

function patch(state: DraftStoreState, id: string, fields: Partial<DraftPassport>): DraftStoreState {
    const draft = state.drafts[id];
    if (!draft) return state;
    return {
        ...state,
        drafts: {
            ...state.drafts,
            [id]: { ...draft, ...fields, updatedAt: new Date().toISOString() },
        },
    };
}

export const useDraftStore = create<DraftStoreState>()((set, get) => ({
    drafts: {},

    createDraft: (artisanId, id) => {
        const draftId = id ?? newId();
        const now = new Date().toISOString();
        const draft: DraftPassport = {
            id: draftId,
            artisanId,
            createdAt: now,
            updatedAt: now,
            garment: emptyGarment(),
            materials: [],
            careInstructions: [],
            careNotes: '',
            traceability: emptyTraceability(),
            eco: {},
            files: {},
        };
        set((s) => ({ ...s, drafts: { ...s.drafts, [draftId]: draft } }));
        return draftId;
    },

    getDraft: (id) => get().drafts[id],

    setDraft: (id, fields) => set((s) => patch(s, id, fields)),
    setGarment: (id, garment) => set((s) => patch(s, id, { garment })),
    setMaterials: (id, materials) => set((s) => patch(s, id, { materials })),
    setCareInstructions: (id, careInstructions) => set((s) => patch(s, id, { careInstructions })),
    setCareNotes: (id, careNotes) => set((s) => patch(s, id, { careNotes })),
    setTraceability: (id, traceability) => set((s) => patch(s, id, { traceability })),
    setEco: (id, eco) => set((s) => patch(s, id, { eco })),
    setFile: (id, docType, file) =>
        set((s) => {
            const draft = s.drafts[id];
            if (!draft) return s;
            const files = { ...draft.files };
            if (file === null) {
                delete files[docType];
            } else {
                files[docType] = file;
            }
            return { ...s, drafts: { ...s.drafts, [id]: { ...draft, files, updatedAt: new Date().toISOString() } } };
        }),
    setLastStep: (id, step) => set((s) => patch(s, id, { lastStep: step })),

    deleteDraft: (id) => {
        const next = { ...get().drafts };
        delete next[id];
        set((s) => ({ ...s, drafts: next }));
    },
}));

export function draftToPassport(draft: DraftPassport): Passport {
    return {
        id: draft.id,
        gs1: buildGS1Identifier('0000000000000', draft.id),
        status: 'Draft' as PassportStatus,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
        artisanId: draft.artisanId,
        garment: draft.garment,
        materials: draft.materials.map((m) => ({
            fiber: m.fiber,
            percentage: m.percentage,
            originCountry: m.originCountry,
            supplierId: '',
            certifications: [],
        })),
        steps: [],
        certifications: [],
        warranty: {
            durationMonths: 0,
            terms: draft.eco.warrantyDescription ?? '',
            repairabilityCommitment: draft.eco.isRepairable ? 'Facilement réparable' : undefined,
        },
    };
}
