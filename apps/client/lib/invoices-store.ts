'use client';

import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mockInvoices, mockPassports, mockPassportById, mockSuppliers } from '@lumiris/mock-data';
import type { Fiber, SupplierInvoice } from '@lumiris/types';
import { useDraftStore, draftToPassport } from './draft-store';

export type InvoiceStatus = 'extracted' | 'pending' | 'failed';

export interface InvoiceFiberLine {
    fiber: Fiber;
    pct: number;
    label?: string;
}

export interface InvoiceExtraction {
    status: InvoiceStatus;
    fibers: InvoiceFiberLine[];
}

export interface LocalInvoice {
    id: string;
    artisanId: string;
    fileDataUri: string;
    supplierId: string;
    issuedAt: string;
    totalAmount: number;
    notes?: string;
    extraction: InvoiceExtraction;
    addedAt: string;
}

export interface InvoiceView {
    id: string;
    artisanId: string;
    supplierId: string;
    supplierName: string;
    issuedAt: string;
    addedAt: string;
    totalAmount: number;
    status: InvoiceStatus;
    fibers: InvoiceFiberLine[];
    notes?: string;
    fileDataUri?: string;
    fileUrl?: string;
    isLocal: boolean;
}

interface InvoicesStoreState {
    byArtisan: Record<string, LocalInvoice[]>;
    addInvoice: (invoice: LocalInvoice) => void;
    updateExtraction: (id: string, fields: Partial<InvoiceExtraction>) => void;
    removeInvoice: (id: string) => void;
}

const noopStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
};

export const useInvoicesStore = create<InvoicesStoreState>()(
    persist(
        (set, get) => ({
            byArtisan: {},
            addInvoice: (invoice) => {
                const list = get().byArtisan[invoice.artisanId] ?? [];
                set({
                    byArtisan: {
                        ...get().byArtisan,
                        [invoice.artisanId]: [invoice, ...list],
                    },
                });
            },
            updateExtraction: (id, fields) => {
                const next: Record<string, LocalInvoice[]> = {};
                for (const [aid, list] of Object.entries(get().byArtisan)) {
                    next[aid] = list.map((inv) =>
                        inv.id === id ? { ...inv, extraction: { ...inv.extraction, ...fields } } : inv,
                    );
                }
                set({ byArtisan: next });
            },
            removeInvoice: (id) => {
                const next: Record<string, LocalInvoice[]> = {};
                for (const [aid, list] of Object.entries(get().byArtisan)) {
                    next[aid] = list.filter((inv) => inv.id !== id);
                }
                set({ byArtisan: next });
            },
        }),
        {
            name: 'atelier-invoices',
            storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
            version: 1,
        },
    ),
);

function supplierNameFor(supplierId: string): string {
    return mockSuppliers.find((s) => s.id === supplierId)?.name ?? supplierId;
}

export function mockInvoiceArtisanId(inv: SupplierInvoice): string | null {
    for (const pid of inv.linkedPassportIds) {
        const p = mockPassportById(pid);
        if (p) return p.artisanId;
    }
    return null;
}

function mockToView(inv: SupplierInvoice, artisanId: string): InvoiceView {
    const ocr = inv.ocrExtracted;
    const fibers: InvoiceFiberLine[] = ocr
        ? (() => {
              const totalQty = ocr.lineItems.reduce((sum, li) => sum + li.qty, 0) || 1;
              return ocr.lineItems.map((li) => ({
                  fiber: (li.fiber ?? 'other') as Fiber,
                  pct: Math.round((li.qty / totalQty) * 100),
                  label: li.label,
              }));
          })()
        : [];
    return {
        id: inv.id,
        artisanId,
        supplierId: inv.supplierId,
        supplierName: ocr?.supplierName ?? supplierNameFor(inv.supplierId),
        issuedAt: ocr?.invoiceDate ?? inv.uploadedAt.slice(0, 10),
        addedAt: inv.uploadedAt,
        totalAmount: ocr?.totalHt ?? 0,
        status: ocr ? 'extracted' : 'pending',
        fibers,
        fileUrl: inv.fileUrl,
        isLocal: false,
    };
}

function localToView(inv: LocalInvoice): InvoiceView {
    return {
        id: inv.id,
        artisanId: inv.artisanId,
        supplierId: inv.supplierId,
        supplierName: supplierNameFor(inv.supplierId),
        issuedAt: inv.issuedAt,
        addedAt: inv.addedAt,
        totalAmount: inv.totalAmount,
        status: inv.extraction.status,
        fibers: inv.extraction.fibers,
        notes: inv.notes,
        fileDataUri: inv.fileDataUri,
        isLocal: true,
    };
}

export function useInvoicesForArtisan(artisanId: string): readonly InvoiceView[] {
    const local = useInvoicesStore((s) => s.byArtisan[artisanId]);
    return useMemo(() => {
        const mockViews = mockInvoices
            .map((inv) => {
                const aid = mockInvoiceArtisanId(inv);
                return aid === artisanId ? mockToView(inv, aid) : null;
            })
            .filter((v): v is InvoiceView => v !== null);
        const localViews = (local ?? []).map(localToView);
        return [...localViews, ...mockViews].sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
    }, [artisanId, local]);
}

interface LinkedPassportRef {
    id: string;
    reference: string;
    status: 'Draft' | 'InCompletion' | 'Published';
}

export function usePassportsLinkedTo(invoiceId: string, artisanId: string): readonly LinkedPassportRef[] {
    const drafts = useDraftStore((s) => s.drafts);
    return useMemo(() => {
        const localPassports = Object.values(drafts)
            .filter((d) => d.artisanId === artisanId)
            .map(draftToPassport);
        const fixedPassports = mockPassports.filter((p) => p.artisanId === artisanId);
        return [...localPassports, ...fixedPassports]
            .filter((p) => p.materials.some((m) => m.invoiceRef === invoiceId))
            .map((p) => ({ id: p.id, reference: p.garment.reference || p.id, status: p.status }));
    }, [drafts, invoiceId, artisanId]);
}
