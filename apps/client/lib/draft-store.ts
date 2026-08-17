'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    GarmentInfo,
    CareInstructionCode,
    DppCertification,
    DppMaterial,
    TraceabilityInfo,
    EcoInfo,
    Passport,
    PassportStatus,
} from '@lumiris/types';
import { buildGS1Identifier } from '@lumiris/types';
import { safeJSONStorage } from './persist-storage';
import { makeHydratedHook } from './use-store-hydrated';

export type WizardStep = 'product' | 'care' | 'traceability' | 'eco';

export const WIZARD_STEPS: readonly WizardStep[] = ['product', 'care', 'traceability', 'eco'] as const;

/** Descripteur d'un document déjà envoyé au backend (pas de `File` récupérable). */
export interface ExistingDoc {
    filename?: string | null;
    url?: string | null;
}

export interface DraftPassport {
    id: string;
    // Set when this local draft mirrors an existing backend DRAFT being edited.
    // Its presence switches the wizard's final step from create (POST) to update (PUT)/publish.
    backendId?: string;
    artisanId: string;
    createdAt: string;
    updatedAt: string;
    garment: GarmentInfo;
    materials: DppMaterial[];
    careInstructions: CareInstructionCode[];
    certifications: DppCertification[];
    careNotes: string;
    traceability: TraceabilityInfo;
    eco: EcoInfo;
    files: Partial<Record<string, File>>;
    // Documents déjà stockés côté backend, indexés par DocumentType (PRODUCT_PHOTO inclus).
    // Un `File` n'est ni sérialisable ni reconstructible : c'est ce descripteur qui permet aux
    // champs d'upload d'afficher « déjà envoyé » à la reprise d'un brouillon. Un nouveau fichier
    // dans `files` prime et remplacera le document au prochain PUT.
    existingDocs?: Partial<Record<string, ExistingDoc>>;
    lastStep?: WizardStep;
    // Set true on rehydrate when this draft had uploaded files that couldn't be persisted
    // (File objects aren't serialisable) — the wizard uses it to prompt a re-upload.
    filesDropped?: boolean;
}

interface DraftStoreState {
    drafts: Record<string, DraftPassport>;
    createDraft: (artisanId: string, id?: string) => string;
    getDraft: (id: string) => DraftPassport | undefined;
    setDraft: (id: string, patch: Partial<DraftPassport>) => void;
    setGarment: (id: string, garment: GarmentInfo) => void;
    setMaterials: (id: string, materials: DppMaterial[]) => void;
    setCareInstructions: (id: string, careInstructions: CareInstructionCode[]) => void;
    setCertifications: (id: string, certifications: DppCertification[]) => void;
    setCareNotes: (id: string, careNotes: string) => void;
    setTraceability: (id: string, traceability: TraceabilityInfo) => void;
    setEco: (id: string, eco: EcoInfo) => void;
    setFile: (id: string, docType: string, file: File | null) => void;
    setLastStep: (id: string, step: WizardStep) => void;
    clearFilesDropped: (id: string) => void;
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

export const useDraftStore = create<DraftStoreState>()(
    persist(
        (set, get) => ({
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
                    certifications: [],
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
            setCertifications: (id, certifications) => set((s) => patch(s, id, { certifications })),
            setCareNotes: (id, careNotes) => set((s) => patch(s, id, { careNotes })),
            setTraceability: (id, traceability) => set((s) => patch(s, id, { traceability })),
            setEco: (id, eco) => set((s) => patch(s, id, { eco })),
            setFile: (id, docType, file) =>
                set((s) => {
                    const draft = s.drafts[id];
                    if (!draft) return s;
                    const files = { ...draft.files };
                    if (file === null) delete files[docType];
                    else files[docType] = file;
                    // Selecting a file resolves the "re-upload needed" prompt for this draft.
                    const filesDropped = file !== null ? false : draft.filesDropped;
                    return {
                        ...s,
                        drafts: {
                            ...s.drafts,
                            [id]: { ...draft, files, filesDropped, updatedAt: new Date().toISOString() },
                        },
                    };
                }),
            setLastStep: (id, step) => set((s) => patch(s, id, { lastStep: step })),
            clearFilesDropped: (id) => set((s) => patch(s, id, { filesDropped: false })),

            deleteDraft: (id) => {
                const next = { ...get().drafts };
                delete next[id];
                set((s) => ({ ...s, drafts: next }));
            },
        }),
        {
            name: 'atelier-draft',
            version: 1,
            storage: safeJSONStorage,
            // File objects can't be serialised — persist only the scalar/text fields so a hard
            // refresh mid-wizard keeps everything except uploads. `filesDropped` records that
            // a draft had files at save time so the wizard can prompt a re-upload on reload.
            partialize: (state) => ({
                drafts: Object.fromEntries(
                    Object.entries(state.drafts).map(([id, draft]) => [
                        id,
                        { ...draft, files: {}, filesDropped: Object.keys(draft.files).length > 0 },
                    ]),
                ),
            }),
        },
    ),
);

/** True once the persisted wizard drafts have been rehydrated from storage. */
export const useDraftHydrated = makeHydratedHook(useDraftStore);

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
            durationMonths: draft.eco.warrantyMonths ?? 0,
            terms: draft.eco.warrantyDescription ?? '',
            repairabilityCommitment: draft.eco.isRepairable ? 'Facilement réparable' : undefined,
        },
    };
}
