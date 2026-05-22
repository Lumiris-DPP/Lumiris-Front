import type { InvoiceStatus } from '@/lib/invoices-store';

export type InvoiceStatusFilter = InvoiceStatus | 'all';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
    extracted: 'Extracted',
    pending: 'À traiter',
    failed: 'Échec',
};

export const INVOICE_STATUS_FILTER_OPTIONS: ReadonlyArray<{ label: string; value: InvoiceStatusFilter }> = [
    { label: 'Tous statuts', value: 'all' },
    { label: 'Extracted', value: 'extracted' },
    { label: 'À traiter', value: 'pending' },
    { label: 'Échec', value: 'failed' },
];

export const INVOICE_BADGE_TONE: Record<InvoiceStatus, string> = {
    extracted: 'border-lumiris-emerald/30 bg-lumiris-emerald/10 text-lumiris-emerald',
    pending: 'border-border text-muted-foreground',
    failed: 'border-destructive/40 text-destructive',
};
