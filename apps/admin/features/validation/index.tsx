'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, FileSearch, Store, Wrench, XCircle } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { useToast } from '@lumiris/ui/hooks/use-toast';
import {
    isApiError,
    useAdminArtisansList,
    useAdminRepairersList,
    useMarkArtisanKybIncomplete,
    useMarkArtisanKybOngoing,
    useMarkRepairerKybIncomplete,
    useMarkRepairerKybOngoing,
    useRejectArtisan,
    useRejectRepairer,
    useVerifyArtisan,
    useVerifyRepairer,
} from '@lumiris/api-client/react';
import type { ArtisanProfileResponse, RepairerProfileResponse } from '@lumiris/api-client';
import { usePermission } from '@/lib/auth/permissions';
import { EmptyState } from '../_shared/empty-state';
import { KybComparisonDrawer } from '../kyb-review/comparison-drawer';

type PendingItem =
    | { type: 'artisan'; data: ArtisanProfileResponse }
    | { type: 'repairer'; data: RepairerProfileResponse };

function formatSiret(siret?: string) {
    return siret ? siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4') : '—';
}

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function itemName(item: PendingItem): string {
    return item.type === 'artisan'
        ? (item.data.companyName ?? item.data.userName)
        : (item.data.companyName ?? item.data.displayName ?? item.data.userEmail ?? 'Retoucheur');
}

function itemSubtitle(item: PendingItem): string {
    return item.type === 'artisan' ? `${item.data.userName} · ${item.data.userEmail}` : (item.data.userEmail ?? '—');
}

export function ValidationQueue() {
    const { toast } = useToast();
    const canVerifyArtisan = usePermission('artisan.kyc_verify');
    const canRejectArtisan = usePermission('artisan.kyc_reject');
    const canVerifyRepairer = usePermission('retoucheur.kyc_verify');
    const canRejectRepairer = usePermission('retoucheur.kyc_reject');
    const [selected, setSelected] = useState<PendingItem | null>(null);

    const { data: rawArtisans = [], isLoading: artisansLoading } = useAdminArtisansList();
    const { data: rawRepairers = [], isLoading: repairersLoading } = useAdminRepairersList();
    const isLoading = artisansLoading || repairersLoading;

    const verifyArtisan = useVerifyArtisan();
    const rejectArtisan = useRejectArtisan();
    const markArtisanOngoing = useMarkArtisanKybOngoing();
    const markArtisanIncomplete = useMarkArtisanKybIncomplete();

    const verifyRepairer = useVerifyRepairer();
    const rejectRepairer = useRejectRepairer();
    const markRepairerOngoing = useMarkRepairerKybOngoing();
    const markRepairerIncomplete = useMarkRepairerKybIncomplete();

    // Backend lists every PENDING profile, including empty shells auto-created at signup
    // before onboarding is even touched — only show ones that actually completed the full
    // dossier (declaration + KYB for artisans, KYB alone for repairers).
    const pending: PendingItem[] = useMemo(() => {
        const artisans: PendingItem[] = rawArtisans
            .filter((a) => a.declarationSigned && a.kyb?.termsAcceptedAt)
            .map((data) => ({ type: 'artisan' as const, data }));
        const repairers: PendingItem[] = rawRepairers
            .filter((r) => r.kyb?.termsAcceptedAt)
            .map((data) => ({ type: 'repairer' as const, data }));
        return [...artisans, ...repairers].sort((a, b) => b.data.createdAt.localeCompare(a.data.createdAt));
    }, [rawArtisans, rawRepairers]);

    function approve(item: PendingItem) {
        const mutation = item.type === 'artisan' ? verifyArtisan : verifyRepairer;
        mutation.mutate(item.data.id, {
            onSuccess: () => {
                toast({ title: `${itemName(item)} approuvé`, description: 'Un e-mail de confirmation a été envoyé.' });
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

    function reject(item: PendingItem) {
        const reason = window.prompt(`Motif du refus pour ${itemName(item)} (optionnel) :`) ?? undefined;
        const mutation = item.type === 'artisan' ? rejectArtisan : rejectRepairer;
        mutation.mutate(
            { id: item.data.id, reason },
            {
                onSuccess: () => {
                    toast({
                        title: `${itemName(item)} rejeté`,
                        description: 'Un e-mail de notification a été envoyé.',
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

    function markOngoingAction(item: PendingItem) {
        const mutation = item.type === 'artisan' ? markArtisanOngoing : markRepairerOngoing;
        mutation.mutate(item.data.id, {
            onError: (err) =>
                toast({
                    title: 'Échec',
                    description: isApiError(err) ? err.message : undefined,
                    variant: 'destructive',
                }),
        });
    }

    function markIncompleteAction(item: PendingItem) {
        const reason = window.prompt(`Qu'est-ce qui manque pour ${itemName(item)} ?`) ?? undefined;
        if (reason === undefined) return;
        const mutation = item.type === 'artisan' ? markArtisanIncomplete : markRepairerIncomplete;
        mutation.mutate(
            { id: item.data.id, reason },
            {
                onSuccess: () => {
                    toast({ title: 'Dossier renvoyé', description: `${itemName(item)} a été notifié par e-mail.` });
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

    const canVerify = selected?.type === 'repairer' ? canVerifyRepairer : canVerifyArtisan;
    const canReject = selected?.type === 'repairer' ? canRejectRepairer : canRejectArtisan;
    const approving = verifyArtisan.isPending || verifyRepairer.isPending;
    const rejecting = rejectArtisan.isPending || rejectRepairer.isPending;
    const markingOngoing = markArtisanOngoing.isPending || markRepairerOngoing.isPending;
    const markingIncomplete = markArtisanIncomplete.isPending || markRepairerIncomplete.isPending;

    return (
        <FeatureLayout
            title="File de validation"
            description={`${pending.length} demande${pending.length !== 1 ? 's' : ''} en attente (artisans + retoucheurs)`}
        >
            {!isLoading && pending.length === 0 ? (
                <EmptyState
                    title="Aucune demande en attente"
                    description="Toutes les inscriptions ont été traitées."
                    icon={ClipboardCheck}
                />
            ) : (
                <div className="border-border bg-card overflow-hidden rounded-xl border">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader stickyHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Compte</TableHead>
                                    <TableHead>SIRET</TableHead>
                                    <TableHead>Inscription</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pending.map((item) => (
                                    <TableRow key={`${item.type}-${item.data.id}`}>
                                        <TableCell>
                                            <Badge variant="outline" className="gap-1 text-[10px]">
                                                {item.type === 'artisan' ? (
                                                    <Store className="h-3 w-3" />
                                                ) : (
                                                    <Wrench className="h-3 w-3" />
                                                )}
                                                {item.type === 'artisan' ? 'Artisan' : 'Retoucheur'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="text-foreground text-sm font-medium">{itemName(item)}</p>
                                                <p className="text-muted-foreground text-[11px]">
                                                    {itemSubtitle(item)}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs">{formatSiret(item.data.siret)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-muted-foreground text-xs">
                                                {formatDate(item.data.createdAt)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber font-mono text-[10px]"
                                            >
                                                En attente
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelected(item)}
                                                    className="h-8 gap-1.5"
                                                >
                                                    <FileSearch className="h-3.5 w-3.5" />
                                                    Dossier
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    disabled={
                                                        (item.type === 'artisan'
                                                            ? !canRejectArtisan
                                                            : !canRejectRepairer) || rejecting
                                                    }
                                                    onClick={() => reject(item)}
                                                    className="bg-lumiris-rose hover:bg-lumiris-rose/90 h-8 gap-1.5 text-white disabled:opacity-40"
                                                >
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    Rejeter
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    disabled={
                                                        (item.type === 'artisan'
                                                            ? !canVerifyArtisan
                                                            : !canVerifyRepairer) || approving
                                                    }
                                                    onClick={() => approve(item)}
                                                    className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 h-8 gap-1.5 text-white disabled:opacity-40"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Approuver
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            <KybComparisonDrawer
                open={selected != null}
                onClose={() => setSelected(null)}
                title={selected ? itemName(selected) : 'Dossier'}
                subtitle={selected ? itemSubtitle(selected) : undefined}
                siret={selected?.data.siret}
                kyb={selected?.data.kyb}
                onApprove={() => selected && approve(selected)}
                onReject={() => selected && reject(selected)}
                onMarkOngoing={() => selected && markOngoingAction(selected)}
                onMarkIncomplete={() => selected && markIncompleteAction(selected)}
                approving={approving}
                rejecting={rejecting}
                markingOngoing={markingOngoing}
                markingIncomplete={markingIncomplete}
                canApprove={canVerify}
                canReject={canReject}
            />
        </FeatureLayout>
    );
}
