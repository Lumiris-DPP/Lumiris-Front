'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import { mockCertificates } from '@lumiris/mock-data';
import { ARTISAN_PASSPORT_LIMIT } from '@lumiris/types';
import type { ArtisanTier, Passport, IrisGrade as IrisGradeLetter, PassportStatus } from '@lumiris/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@lumiris/ui/components/alert-dialog';
import { Button } from '@lumiris/ui/components/button';
import { DataTableFilters } from '@lumiris/ui/components/data-table-filters';
import { Toaster, toast } from '@lumiris/ui/components/sonner';
import { useBillingStore } from '@/lib/billing-store';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { useDraftStore } from '@/lib/draft-store';
import { usePassports } from '@/lib/passports-source';
import { activePassportCount, isQuotaNearLimit, isQuotaReached } from '@/lib/quota';
import { EmptyState } from './empty-state';
import { useDuplicatePassport } from './hooks';
import { PassportTable, type ScoredRow } from './passport-table';
import { QrDialog } from './qr-dialog';
import { QuotaBanner } from './quota-banner';
import { GRADE_OPTIONS, STATUS_OPTIONS } from './status';

const PAGE_SIZE = 25;

export function PassportsList() {
    const artisan = useCurrentArtisan();
    const passports = usePassports(artisan.id);
    const deleteDraft = useDraftStore((s) => s.deleteDraft);
    const duplicatePassport = useDuplicatePassport(artisan.id);

    const [statusFilter, setStatusFilter] = useState<PassportStatus | 'all'>('all');
    const [gradeFilter, setGradeFilter] = useState<IrisGradeLetter | 'all'>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [qrPassport, setQrPassport] = useState<Passport | null>(null);
    const [pendingDelete, setPendingDelete] = useState<Passport | null>(null);

    const rows: readonly ScoredRow[] = useMemo(() => {
        const now = new Date();
        return passports.map((passport) => ({
            passport,
            score: computeScore(passport, { artisan, certificates: mockCertificates, now }),
        }));
    }, [artisan, passports]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return rows.filter(({ passport, score }) => {
            if (statusFilter !== 'all' && passport.status !== statusFilter) return false;
            if (gradeFilter !== 'all' && score.grade !== gradeFilter) return false;
            if (!term) return true;
            const ref = passport.garment.reference?.toLowerCase() ?? '';
            return ref.includes(term) || passport.garment.kind.toLowerCase().includes(term);
        });
    }, [rows, statusFilter, gradeFilter, search]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, pageCount);
    const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const billing = useBillingStore((s) => s.byArtisan[artisan.id]);
    const tier: ArtisanTier | null = billing?.tier ?? null;
    const quotaTotal = tier ? ARTISAN_PASSPORT_LIMIT[tier] : Number.NaN;
    const activeCount = activePassportCount(passports);
    const quotaReached = tier ? isQuotaReached(passports, tier) : false;
    const showQuotaWarning = tier ? !quotaReached && isQuotaNearLimit(passports, tier) : false;
    const showQuotaBanner = quotaReached || showQuotaWarning;

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setGradeFilter('all');
        setPage(1);
    };

    const handleDelete = () => {
        if (!pendingDelete) return;
        const ref = pendingDelete.garment.reference || pendingDelete.id;
        deleteDraft(pendingDelete.id);
        setPendingDelete(null);
        toast.success('Brouillon supprimé', { description: `"${ref}" a été retiré de votre liste.` });
    };

    const openPreview = (id: string) => window.open(`/preview/${id}`, '_blank', 'noopener,noreferrer');

    if (passports.length === 0) {
        return (
            <div className="space-y-6 p-8">
                <Toaster position="bottom-right" />
                <EmptyState />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-8">
            <Toaster position="bottom-right" />

            {showQuotaBanner && tier && <QuotaBanner used={activeCount} total={quotaTotal} reached={quotaReached} />}

            <DataTableFilters
                search={{
                    value: search,
                    onChange: (v) => {
                        setSearch(v);
                        setPage(1);
                    },
                    placeholder: 'Rechercher par référence ou type',
                }}
                filters={[
                    {
                        label: 'Statut',
                        value: statusFilter,
                        onChange: (v) => {
                            setStatusFilter(v as PassportStatus | 'all');
                            setPage(1);
                        },
                        options: STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
                    },
                    {
                        label: 'Grade',
                        value: gradeFilter,
                        onChange: (v) => {
                            setGradeFilter(v as IrisGradeLetter | 'all');
                            setPage(1);
                        },
                        options: GRADE_OPTIONS,
                    },
                ]}
                onReset={resetFilters}
            />

            <PassportTable
                rows={visible}
                onShowQr={setQrPassport}
                onDuplicate={duplicatePassport}
                onPreview={openPreview}
                onDelete={setPendingDelete}
            />

            {filtered.length > PAGE_SIZE && (
                <div className="text-muted-foreground flex items-center justify-between text-sm">
                    <p>
                        {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} sur{' '}
                        {filtered.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={safePage === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-mono text-xs">
                            {safePage} / {pageCount}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={safePage === pageCount}
                            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {qrPassport && <QrDialog passport={qrPassport} onClose={() => setQrPassport(null)} />}

            <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce brouillon ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingDelete?.garment.reference || pendingDelete?.id} sera retiré définitivement de votre
                            atelier. Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
