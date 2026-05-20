import { mockInvoices, mockPassportsByArtisan } from '@lumiris/mock-data';
import type { Fiber, Material, SupplierInvoice } from '@lumiris/types';

const ATELIER_INVOICES_KEY = 'atelier-invoices';

const ALLOWED_FIBERS: ReadonlySet<Fiber> = new Set<Fiber>([
    'wool',
    'linen',
    'cotton',
    'silk',
    'hemp',
    'cashmere',
    'recycled-polyester',
    'other',
]);

export interface DraftRow {
    fiber: Fiber;
    percentage: number;
    supplierId: string;
}

export interface ExtractedRow extends DraftRow {
    invoiceRef: string;
}

export function listArtisanInvoices(artisanId: string): readonly SupplierInvoice[] {
    const passportIds = new Set(mockPassportsByArtisan(artisanId).map((p) => p.id));
    const baseFromMock = mockInvoices.filter((i) => i.linkedPassportIds.some((pid) => passportIds.has(pid)));

    let extras: readonly SupplierInvoice[] = [];
    if (typeof window !== 'undefined') {
        try {
            const raw = window.localStorage.getItem(ATELIER_INVOICES_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as SupplierInvoice[];
                extras = parsed.filter(
                    (i) =>
                        i &&
                        Array.isArray(i.linkedPassportIds) &&
                        i.linkedPassportIds.some((pid: string) => passportIds.has(pid)),
                );
            }
        } catch {
            extras = [];
        }
    }

    const seen = new Set<string>();
    const out: SupplierInvoice[] = [];
    for (const inv of [...baseFromMock, ...extras]) {
        if (seen.has(inv.id)) continue;
        seen.add(inv.id);
        out.push(inv);
    }
    return out;
}

export function buildInitialRows(invoice: SupplierInvoice): DraftRow[] {
    const ocr = invoice.ocrExtracted;
    if (!ocr || ocr.lineItems.length === 0) {
        return [{ fiber: 'linen', percentage: 0, supplierId: invoice.supplierId }];
    }
    const evenPct = Math.round(100 / ocr.lineItems.length);
    return ocr.lineItems.map((item) => {
        const candidate = (item.fiber ?? 'other') as Fiber;
        return {
            fiber: ALLOWED_FIBERS.has(candidate) ? candidate : 'other',
            percentage: evenPct,
            supplierId: invoice.supplierId,
        };
    });
}

export function mergeMaterials(existing: readonly Material[], extracted: readonly ExtractedRow[]): Material[] {
    const map = new Map<string, Material>();
    for (const m of existing) {
        map.set(`${m.fiber}::${m.supplierId}`, { ...m });
    }
    for (const row of extracted) {
        const key = `${row.fiber}::${row.supplierId}`;
        const existingEntry = map.get(key);
        if (existingEntry) {
            map.set(key, {
                ...existingEntry,
                percentage: existingEntry.percentage + row.percentage,
                invoiceRef: existingEntry.invoiceRef ?? row.invoiceRef,
            });
        } else {
            map.set(key, {
                fiber: row.fiber,
                percentage: row.percentage,
                supplierId: row.supplierId,
                originCountry: 'FR',
                certifications: [],
                invoiceRef: row.invoiceRef,
            });
        }
    }
    const all = Array.from(map.values());
    const total = all.reduce((s, m) => s + m.percentage, 0);
    if (total <= 100) return all;
    const factor = 100 / total;
    return all.map((m) => ({ ...m, percentage: Math.round(m.percentage * factor) }));
}
