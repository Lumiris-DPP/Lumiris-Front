'use client';

import { useMemo, useState } from 'react';
import { Clock, Plus, ShieldCheck } from 'lucide-react';
import type { CertificationKind } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { DataTableFilters } from '@lumiris/ui/components/data-table-filters';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { Toaster, toast } from '@lumiris/ui/components/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { useCurrentArtisan } from '@/lib/current-artisan';
import {
    CERTIFICATION_KINDS,
    useCertificatesForArtisan,
    useCertificatesStore,
    type ArtisanCertificate,
} from '@/lib/certificates-store';
import { EmptyState } from '@/features/empty-state';
import { AddCertificateDialog } from './add-dialog';
import { CertificationDetailDrawer } from './certification-detail-drawer';
import { CertificationRow } from './certification-row';
import {
    CERT_STATUS_FILTER_OPTIONS,
    certLabel,
    isExpiringSoon,
    KIND_LABEL,
    matchesStatusFilter,
    type CertStatusFilter,
} from './certification-status';
import { DeleteCertificateDialog } from './delete-confirm-dialog';
import { RenewCertificateDialog } from './renew-dialog';

type KindFilter = CertificationKind | 'all';

const KIND_OPTIONS: ReadonlyArray<{ label: string; value: KindFilter }> = [
    { label: 'Tous types', value: 'all' },
    ...CERTIFICATION_KINDS.map((k) => ({ label: KIND_LABEL[k], value: k as KindFilter })),
];

export function CertificationsList() {
    const artisan = useCurrentArtisan();
    const [now] = useState(() => new Date());
    const certs = useCertificatesForArtisan(artisan.id);
    const removeCertificate = useCertificatesStore((s) => s.removeCertificate);

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<CertStatusFilter>('all');
    const [kind, setKind] = useState<KindFilter>('all');
    const [addOpen, setAddOpen] = useState(false);
    const [selected, setSelected] = useState<ArtisanCertificate | null>(null);
    const [renewing, setRenewing] = useState<ArtisanCertificate | null>(null);
    const [pendingDelete, setPendingDelete] = useState<ArtisanCertificate | null>(null);

    const expiringCount = useMemo(() => certs.filter((c) => isExpiringSoon(c, now)).length, [certs, now]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return certs.filter((cert) => {
            if (kind !== 'all' && cert.kind !== kind) return false;
            if (!matchesStatusFilter(cert, status, now)) return false;
            if (term) {
                const hay = `${cert.issuer} ${cert.scope ?? ''} ${cert.customName ?? ''}`.toLowerCase();
                if (!hay.includes(term)) return false;
            }
            return true;
        });
    }, [certs, search, status, kind, now]);

    function handleDelete() {
        if (!pendingDelete) return;
        const ref = `${certLabel(pendingDelete)} — ${pendingDelete.issuer}`;
        removeCertificate(pendingDelete.artisanId, pendingDelete.id);
        setPendingDelete(null);
        toast.success('Certificat supprimé', { description: ref });
    }

    const reset = () => {
        setSearch('');
        setStatus('all');
        setKind('all');
    };

    if (certs.length === 0) {
        return (
            <div className="p-8">
                <Toaster position="bottom-right" />
                <EmptyState
                    icon={ShieldCheck}
                    title="Aucun certificat dans votre atelier"
                    description="Centralisez vos certifications (GOTS, OEKO-TEX, EPV…) pour les réutiliser sur l’ensemble de vos passeports."
                    cta={{ label: 'Ajouter mon premier certificat', onClick: () => setAddOpen(true) }}
                />
                <AddCertificateDialog open={addOpen} onOpenChange={setAddOpen} artisanId={artisan.id} />
            </div>
        );
    }

    return (
        <div className="p-8">
            <Toaster position="bottom-right" />
            <FeatureLayout
                title="Certifications"
                actions={
                    <Button onClick={() => setAddOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" /> Ajouter un certificat
                    </Button>
                }
            >
                <div className="space-y-4">
                    {expiringCount > 0 ? (
                        <div className="border-lumiris-amber/40 bg-lumiris-amber/10 text-foreground flex items-center justify-between gap-3 rounded-xl border p-3">
                            <span className="inline-flex items-center gap-2 text-sm">
                                <Clock className="text-lumiris-amber h-4 w-4" />
                                {expiringCount} certificat{expiringCount > 1 ? 's' : ''} expire
                                {expiringCount > 1 ? 'nt' : ''} dans les 90 prochains jours.
                            </span>
                            <Button size="sm" variant="outline" onClick={() => setStatus('expiring')}>
                                Voir
                            </Button>
                        </div>
                    ) : null}

                    <DataTableFilters
                        search={{ value: search, onChange: setSearch, placeholder: 'Émetteur, portée, nom…' }}
                        filters={[
                            {
                                label: 'Statut',
                                value: status,
                                onChange: (v) => setStatus(v as CertStatusFilter),
                                options: CERT_STATUS_FILTER_OPTIONS,
                            },
                            {
                                label: 'Type',
                                value: kind,
                                onChange: (v) => setKind(v as KindFilter),
                                options: KIND_OPTIONS,
                            },
                        ]}
                        onReset={reset}
                    />

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Label</TableHead>
                                        <TableHead>Émis par</TableHead>
                                        <TableHead>Valide jusqu’au</TableHead>
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
                                                Aucun certificat ne correspond aux filtres.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filtered.map((cert) => (
                                            <CertificationRow
                                                key={cert.id}
                                                cert={cert}
                                                now={now}
                                                onView={() => setSelected(cert)}
                                                onRenew={() => setRenewing(cert)}
                                                onDelete={() => setPendingDelete(cert)}
                                            />
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </FeatureLayout>

            <AddCertificateDialog open={addOpen} onOpenChange={setAddOpen} artisanId={artisan.id} />
            <RenewCertificateDialog
                open={!!renewing}
                onOpenChange={(o) => (!o ? setRenewing(null) : undefined)}
                cert={renewing}
            />
            <CertificationDetailDrawer cert={selected} onClose={() => setSelected(null)} />
            <DeleteCertificateDialog
                cert={pendingDelete}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
