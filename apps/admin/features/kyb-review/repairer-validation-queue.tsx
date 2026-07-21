'use client';

import { useState } from 'react';
import { CheckCircle2, ClipboardCheck, FileSearch, XCircle } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { useToast } from '@lumiris/ui/hooks/use-toast';
import { isApiError, useAdminRepairersList, useRejectRepairer, useVerifyRepairer } from '@lumiris/api-client/react';
import type { RepairerProfileResponse } from '@lumiris/api-client';
import { usePermission } from '@/lib/auth/permissions';
import { EmptyState } from '../_shared/empty-state';
import { KybComparisonDrawer } from './comparison-drawer';

function formatSiret(siret?: string) {
    return siret ? siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4') : '—';
}

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export function RepairerValidationQueue() {
    const { toast } = useToast();
    const canVerify = usePermission('retoucheur.kyc_verify');
    const canReject = usePermission('retoucheur.kyc_reject');
    const [selected, setSelected] = useState<RepairerProfileResponse | null>(null);

    const { data: rawPending = [], isLoading } = useAdminRepairersList();
    // Only show dossiers that actually completed the KYB step, not empty shells created at
    // the fast SIRET-only registration.
    const pending = rawPending.filter((req) => req.kyb?.termsAcceptedAt);
    const verifyRepairer = useVerifyRepairer();
    const rejectRepairer = useRejectRepairer();

    function approve(req: RepairerProfileResponse) {
        verifyRepairer.mutate(req.id, {
            onSuccess: () => {
                toast({
                    title: `${req.displayName ?? req.userEmail} approuvé`,
                    description: 'Un e-mail de confirmation a été envoyé.',
                });
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

    function reject(req: RepairerProfileResponse) {
        const reason =
            window.prompt(`Motif du refus pour ${req.displayName ?? req.userEmail} (optionnel) :`) ?? undefined;
        rejectRepairer.mutate(
            { id: req.id, reason },
            {
                onSuccess: () => {
                    toast({
                        title: `${req.displayName ?? req.userEmail} rejeté`,
                        description: 'Le réparateur a été notifié par e-mail.',
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

    if (!isLoading && pending.length === 0) {
        return (
            <EmptyState
                title="Aucune demande en attente"
                description="Toutes les inscriptions retoucheur ont été traitées."
                icon={ClipboardCheck}
            />
        );
    }

    return (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader stickyHeader>
                        <TableRow>
                            <TableHead>Retoucheur</TableHead>
                            <TableHead>SIRET</TableHead>
                            <TableHead>Inscription</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pending.map((req) => (
                            <TableRow key={req.id}>
                                <TableCell>
                                    <div>
                                        <p className="text-foreground text-sm font-medium">
                                            {req.companyName ?? req.displayName ?? req.userEmail}
                                        </p>
                                        <p className="text-muted-foreground text-[11px]">{req.userEmail}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono text-xs">{formatSiret(req.siret)}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-muted-foreground text-xs">{formatDate(req.createdAt)}</span>
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
                                            onClick={() => setSelected(req)}
                                            className="h-8 gap-1.5"
                                        >
                                            <FileSearch className="h-3.5 w-3.5" />
                                            Dossier
                                        </Button>
                                        <Button
                                            size="sm"
                                            disabled={!canReject || rejectRepairer.isPending}
                                            onClick={() => reject(req)}
                                            className="bg-lumiris-rose hover:bg-lumiris-rose/90 h-8 gap-1.5 text-white disabled:opacity-40"
                                        >
                                            <XCircle className="h-3.5 w-3.5" />
                                            Rejeter
                                        </Button>
                                        <Button
                                            size="sm"
                                            disabled={!canVerify || verifyRepairer.isPending}
                                            onClick={() => approve(req)}
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

            <KybComparisonDrawer
                open={selected != null}
                onClose={() => setSelected(null)}
                title={selected?.companyName ?? selected?.displayName ?? 'Dossier'}
                subtitle={selected?.userEmail}
                siret={selected?.siret}
                kyb={selected?.kyb}
                onApprove={() => selected && approve(selected)}
                onReject={() => selected && reject(selected)}
                approving={verifyRepairer.isPending}
                rejecting={rejectRepairer.isPending}
                canApprove={canVerify}
                canReject={canReject}
            />
        </div>
    );
}
