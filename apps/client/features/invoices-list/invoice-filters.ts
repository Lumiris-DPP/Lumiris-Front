import type { InvoiceView } from '@/lib/invoices-store';
import type { InvoiceStatusFilter } from './invoice-status';

export type InvoiceSortValue = 'recent' | 'oldest' | 'amount-desc' | 'amount-asc';

export const INVOICE_SORT_OPTIONS: ReadonlyArray<{ label: string; value: InvoiceSortValue }> = [
    { label: 'Plus récente', value: 'recent' },
    { label: 'Plus ancienne', value: 'oldest' },
    { label: 'Montant ↓', value: 'amount-desc' },
    { label: 'Montant ↑', value: 'amount-asc' },
];

export interface InvoiceFilterState {
    search: string;
    status: InvoiceStatusFilter;
    supplier: string;
    sort: InvoiceSortValue;
}

export function filterAndSortInvoices(list: readonly InvoiceView[], f: InvoiceFilterState): readonly InvoiceView[] {
    const q = f.search.trim().toLowerCase();
    const next = list.filter((inv) => {
        if (f.status !== 'all' && inv.status !== f.status) return false;
        if (f.supplier !== 'all' && inv.supplierId !== f.supplier) return false;
        if (q) {
            const hay = `${inv.id} ${inv.notes ?? ''} ${inv.supplierName}`.toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });
    return [...next].sort((a, b) => compare(a, b, f.sort));
}

function compare(a: InvoiceView, b: InvoiceView, sort: InvoiceSortValue): number {
    switch (sort) {
        case 'recent':
            return a.addedAt < b.addedAt ? 1 : -1;
        case 'oldest':
            return a.addedAt < b.addedAt ? -1 : 1;
        case 'amount-desc':
            return b.totalAmount - a.totalAmount;
        case 'amount-asc':
            return a.totalAmount - b.totalAmount;
    }
}
