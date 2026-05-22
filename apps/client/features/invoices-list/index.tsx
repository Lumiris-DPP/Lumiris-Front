'use client';

import { useMemo, useState } from 'react';
import { Plus, ReceiptText } from 'lucide-react';
import { mockSuppliers } from '@lumiris/mock-data';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { DataTableFilters } from '@lumiris/ui/components/data-table-filters';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { Toaster, toast } from '@lumiris/ui/components/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { type InvoiceView, useInvoicesForArtisan, useInvoicesStore } from '@/lib/invoices-store';
import { EmptyState } from '@/features/empty-state';
import { ImportInvoiceDialog } from './import-dialog';
import { InvoiceDetailDrawer } from './invoice-detail-drawer';
import { filterAndSortInvoices, INVOICE_SORT_OPTIONS, type InvoiceSortValue } from './invoice-filters';
import { InvoiceRow } from './invoice-row';
import { INVOICE_STATUS_FILTER_OPTIONS, type InvoiceStatusFilter } from './invoice-status';
import { useRescan } from './rescan-action';

export function InvoicesList() {
    const artisan = useCurrentArtisan();
    const invoices = useInvoicesForArtisan(artisan.id);
    const removeInvoice = useInvoicesStore((s) => s.removeInvoice);
    const rescan = useRescan();

    const [importOpen, setImportOpen] = useState(false);
    const [selected, setSelected] = useState<InvoiceView | null>(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<InvoiceStatusFilter>('all');
    const [supplier, setSupplier] = useState('all');
    const [sort, setSort] = useState<InvoiceSortValue>('recent');

    const supplierOptions = useMemo(() => {
        const ids = Array.from(new Set(invoices.map((i) => i.supplierId)));
        return [
            { label: 'Tous fournisseurs', value: 'all' },
            ...ids.map((id) => ({
                label: mockSuppliers.find((s) => s.id === id)?.name ?? id,
                value: id,
            })),
        ];
    }, [invoices]);

    const filtered = useMemo(
        () => filterAndSortInvoices(invoices, { search, status, supplier, sort }),
        [invoices, search, status, supplier, sort],
    );

    const reset = () => {
        setSearch('');
        setStatus('all');
        setSupplier('all');
        setSort('recent');
    };

    const handleDelete = (inv: InvoiceView) => {
        removeInvoice(inv.id);
        toast.success('Facture supprimée', { description: inv.supplierName });
    };

    if (invoices.length === 0) {
        return (
            <div className="p-8">
                <Toaster position="bottom-right" />
                <EmptyState
                    icon={ReceiptText}
                    title="Aucune facture importée"
                    description="Importez vos factures fournisseurs pour justifier la composition de vos passeports."
                    cta={{ label: 'Importer ma première facture', onClick: () => setImportOpen(true) }}
                />
                <ImportInvoiceDialog open={importOpen} onOpenChange={setImportOpen} artisanId={artisan.id} />
            </div>
        );
    }

    return (
        <div className="p-8">
            <Toaster position="bottom-right" />
            <FeatureLayout
                title="Factures"
                actions={
                    <Button onClick={() => setImportOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" /> Importer une facture
                    </Button>
                }
            >
                <div className="space-y-4">
                    <DataTableFilters
                        search={{
                            value: search,
                            onChange: setSearch,
                            placeholder: 'Référence, fournisseur, notes…',
                        }}
                        filters={[
                            {
                                label: 'Statut',
                                value: status,
                                onChange: (v) => setStatus(v as InvoiceStatusFilter),
                                options: INVOICE_STATUS_FILTER_OPTIONS,
                            },
                            { label: 'Fournisseur', value: supplier, onChange: setSupplier, options: supplierOptions },
                            {
                                label: 'Tri',
                                value: sort,
                                onChange: (v) => setSort(v as InvoiceSortValue),
                                options: INVOICE_SORT_OPTIONS,
                            },
                        ]}
                        onReset={reset}
                    />

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fournisseur</TableHead>
                                        <TableHead>Émise le</TableHead>
                                        <TableHead>Total HT</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-muted-foreground py-10 text-center text-sm"
                                            >
                                                Aucune facture ne correspond aux filtres.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filtered.map((inv) => (
                                            <InvoiceRow
                                                key={inv.id}
                                                invoice={inv}
                                                onView={() => setSelected(inv)}
                                                onRescan={() => rescan(inv)}
                                                onDelete={() => handleDelete(inv)}
                                            />
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </FeatureLayout>

            <ImportInvoiceDialog open={importOpen} onOpenChange={setImportOpen} artisanId={artisan.id} />
            <InvoiceDetailDrawer invoice={selected} artisanId={artisan.id} onClose={() => setSelected(null)} />
        </div>
    );
}
