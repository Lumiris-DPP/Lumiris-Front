'use client';

import { useState } from 'react';
import { DownloadCloud, FileSearch } from 'lucide-react';
import {
    isApiError,
    useAdminArtisansAll,
    useImportArtisanDirectory,
    useMarkArtisanKybIncomplete,
    useMarkArtisanKybOngoing,
    useRejectArtisan,
    useVerifyArtisan,
} from '@lumiris/api-client/react';
import type { ArtisanProfileResponse, ArtisanStatus } from '@lumiris/api-client';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { useToast } from '@lumiris/ui/hooks/use-toast';
import { usePermission } from '@/lib/auth/permissions';
import { EmptyState } from '../_shared/empty-state';
import { KybComparisonDrawer } from '../kyb-review/comparison-drawer';

const ACCOUNT_STATUS_LABEL: Record<ArtisanStatus, string> = {
    PENDING: 'En attente',
    VERIFIED: 'Vérifié',
    REJECTED: 'Rejeté',
    UNCLAIMED: 'Fiche annuaire',
};

const ACCOUNT_STATUS_TONE: Record<ArtisanStatus, string> = {
    PENDING: 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber',
    VERIFIED: 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald',
    REJECTED: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose',
    UNCLAIMED: 'border-border bg-muted text-muted-foreground',
};

function formatSiret(siret?: string) {
    return siret ? siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4') : '—';
}

// Real artisan accounts (backend), distinct from the mock demo dataset shown above — this is
// where an admin looks up a specific real account's KYB dossier, doc-by-doc, outside the
// pending-only review queue on the Validation page.
export function RealArtisanAccounts() {
    const { toast } = useToast();
    const canVerify = usePermission('artisan.kyc_verify');
    const canReject = usePermission('artisan.kyc_reject');
    const [selected, setSelected] = useState<ArtisanProfileResponse | null>(null);

    const { data: accounts = [], isLoading } = useAdminArtisansAll();
    const verifyArtisan = useVerifyArtisan();
    const rejectArtisan = useRejectArtisan();
    const markOngoing = useMarkArtisanKybOngoing();
    const markIncomplete = useMarkArtisanKybIncomplete();
    const importDirectory = useImportArtisanDirectory();
    const [importDepts, setImportDepts] = useState('75, 92, 93');

    function runImport() {
        const departments = importDepts
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean);
        importDirectory.mutate(
            { source: 'SIRENE', departments },
            {
                onSuccess: (r) =>
                    toast({
                        title: 'Import SIRENE terminé',
                        description: `${r.created} créée(s), ${r.updated} mise(s) à jour, ${r.skipped} ignorée(s).`,
                    }),
                onError: (err) =>
                    toast({
                        title: "Échec de l'import",
                        description: isApiError(err) ? err.message : undefined,
                        variant: 'destructive',
                    }),
            },
        );
    }

    function name(acc: ArtisanProfileResponse) {
        return acc.companyName ?? acc.userName ?? acc.userEmail ?? 'Atelier';
    }

    function approve(req: ArtisanProfileResponse) {
        verifyArtisan.mutate(req.id, {
            onSuccess: () => {
                toast({ title: `${name(req)} approuvé`, description: 'Un e-mail de confirmation a été envoyé.' });
                setSelected(null);
            },
            onError: (err) =>
                toast({
                    title: 'Échec de la validation',
                    description: isApiError(err) ? err.message : undefined,
                    variant: 'destructive',
                }),
        });
    }

    function reject(req: ArtisanProfileResponse) {
        const reason = window.prompt(`Motif du refus pour ${name(req)} (optionnel) :`) ?? undefined;
        rejectArtisan.mutate(
            { id: req.id, reason },
            {
                onSuccess: () => {
                    toast({
                        title: `${name(req)} rejeté`,
                        description: "L'artisan a été notifié par e-mail.",
                        variant: 'destructive',
                    });
                    setSelected(null);
                },
                onError: (err) =>
                    toast({
                        title: 'Échec du rejet',
                        description: isApiError(err) ? err.message : undefined,
                        variant: 'destructive',
                    }),
            },
        );
    }

    function markOngoingAction(req: ArtisanProfileResponse) {
        markOngoing.mutate(req.id, {
            onError: (err) =>
                toast({
                    title: 'Échec',
                    description: isApiError(err) ? err.message : undefined,
                    variant: 'destructive',
                }),
        });
    }

    function markIncompleteAction(req: ArtisanProfileResponse) {
        const reason = window.prompt(`Qu'est-ce qui manque pour ${name(req)} ?`) ?? undefined;
        if (reason === undefined) return;
        markIncomplete.mutate(
            { id: req.id, reason },
            {
                onSuccess: () => {
                    toast({ title: 'Dossier renvoyé', description: `${name(req)} a été notifié par e-mail.` });
                    setSelected(null);
                },
                onError: (err) =>
                    toast({
                        title: 'Échec',
                        description: isApiError(err) ? err.message : undefined,
                        variant: 'destructive',
                    }),
            },
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-end gap-2">
                <Input
                    value={importDepts}
                    onChange={(e) => setImportDepts(e.target.value)}
                    placeholder="Départements (75, 92…)"
                    className="h-8 w-44 text-xs"
                    aria-label="Départements à importer"
                />
                <Button
                    size="sm"
                    variant="outline"
                    onClick={runImport}
                    disabled={importDirectory.isPending}
                    className="h-8 gap-1.5"
                >
                    <DownloadCloud className="h-3.5 w-3.5" />
                    {importDirectory.isPending ? 'Import…' : 'Importer SIRENE'}
                </Button>
            </div>

            {!isLoading && accounts.length === 0 ? (
                <EmptyState
                    title="Aucun compte artisan réel"
                    description="Aucun artisan ne s'est encore inscrit — lancez un import ou attendez une inscription."
                    icon={FileSearch}
                />
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader stickyHeader>
                                <TableRow>
                                    <TableHead>Artisan</TableHead>
                                    <TableHead>SIRET</TableHead>
                                    <TableHead>Compte</TableHead>
                                    <TableHead>Dossier KYB</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accounts.map((acc) => {
                                    const isUnclaimed = acc.status === 'UNCLAIMED' || !acc.userEmail;
                                    return (
                                        <TableRow key={acc.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{name(acc)}</p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {acc.userEmail ??
                                                            (acc.source ? `Annuaire ${acc.source}` : 'Sans compte')}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-xs">{formatSiret(acc.siret)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`font-mono text-[10px] ${ACCOUNT_STATUS_TONE[acc.status]}`}
                                                >
                                                    {ACCOUNT_STATUS_LABEL[acc.status]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground">
                                                    {isUnclaimed
                                                        ? '—'
                                                        : acc.kyb?.termsAcceptedAt
                                                          ? acc.kyb.kybStatus
                                                          : 'Non soumis'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end">
                                                    {!isUnclaimed ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setSelected(acc)}
                                                            className="h-8 gap-1.5"
                                                        >
                                                            <FileSearch className="h-3.5 w-3.5" />
                                                            Voir le dossier KYB
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            <KybComparisonDrawer
                open={selected != null}
                onClose={() => setSelected(null)}
                title={selected?.companyName ?? selected?.userName ?? 'Dossier'}
                subtitle={selected ? `${selected.userName} · ${selected.userEmail}` : undefined}
                siret={selected?.siret}
                kyb={selected?.kyb}
                onApprove={() => selected && approve(selected)}
                onReject={() => selected && reject(selected)}
                onMarkOngoing={() => selected && markOngoingAction(selected)}
                onMarkIncomplete={() => selected && markIncompleteAction(selected)}
                approving={verifyArtisan.isPending}
                rejecting={rejectArtisan.isPending}
                markingOngoing={markOngoing.isPending}
                markingIncomplete={markIncomplete.isPending}
                canApprove={canVerify}
                canReject={canReject}
            />
        </div>
    );
}
