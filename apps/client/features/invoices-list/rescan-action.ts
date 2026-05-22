'use client';

import { useCallback } from 'react';
import { mockSuppliers } from '@lumiris/mock-data';
import { toast } from '@lumiris/ui/components/sonner';
import { type InvoiceView, useInvoicesStore } from '@/lib/invoices-store';
import { genFibers, makeRng, seedHash } from './extraction-utils';

export function useRescan(): (inv: InvoiceView) => void {
    const updateExtraction = useInvoicesStore((s) => s.updateExtraction);
    return useCallback(
        (inv) => {
            if (!inv.isLocal) return;
            const supplier = mockSuppliers.find((s) => s.id === inv.supplierId);
            if (!supplier) return;
            toast('Rescan demandé', { description: inv.supplierName });
            const rng = makeRng(seedHash(`${inv.id}|${Date.now()}`));
            const fibers = genFibers(supplier.fibers, rng);
            updateExtraction(inv.id, { status: 'extracted', fibers });
            toast.success('Rescan terminé', { description: `${fibers.length} fibre(s) détectée(s).` });
        },
        [updateExtraction],
    );
}
