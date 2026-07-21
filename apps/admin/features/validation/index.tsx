'use client';

import { useState } from 'react';
import { CheckCircle2, ClipboardCheck, FileSearch, XCircle } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { useToast } from '@lumiris/ui/hooks/use-toast';
import { isApiError, useAdminArtisansList, useRejectArtisan, useVerifyArtisan } from '@lumiris/api-client/react';
import type { ArtisanProfileResponse } from '@lumiris/api-client';
import { usePermission } from '@/lib/auth/permissions';
import { EmptyState } from '../_shared/empty-state';
import { KybComparisonDrawer } from '../kyb-review/comparison-drawer';

function formatSiret(siret?: string) {
    return siret ? siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4') : '—';
}

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export function ValidationQueue() {
    const { toast } = useToast();
    const canVerify = usePermission('artisan.kyc_verify');
    const canReject = usePermission('artisan.kyc_reject');
    const [selected, setSelected] = useState<ArtisanProfileResponse | null>(null);

    const { data: rawPending = [], isLoading } = useAdminArtisansList();
    // Backend lists every PENDING profile, including empty shells auto-created at signup
    // before the artisan ever touches onboarding, or ones that stopped after the declaration
    // step — only show ones that actually completed the full dossier (declaration + KYB).
    const pending = rawPending.filter((req) => req.declarationSigned && req.kyb?.termsAcceptedAt);
    const verifyArtisan = useVerifyArtisan();
    const rejectArtisan = useRejectArtisan();

    function approve(req: ArtisanProfileResponse) {
        verifyArtisan.mutate(req.id, {
            onSuccess: () => {
                toast({ title: `${req.userName} approuvé`, description: 'Un e-mail de confirmation a été envoyé.' });
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
        const reason = window.prompt(`Motif du refus pour ${req.userName} (optionnel) :`) ?? undefined;
        rejectArtisan.mutate(
            { id: req.id, reason },
            {
                onSuccess: () => {
                    toast({
                        title: `${req.userName} rejeté`,
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

    return (
        <FeatureLayout
            title="File de validation"
            description={`${pending.length} demande${pending.length !== 1 ? 's' : ''} en attente`}
        >
            {!isLoading && pending.length === 0 ? (
                <EmptyState
                    title="Aucune demande en attente"
                    description="Toutes les inscriptions ont été traitées."
                    icon={ClipboardCheck}
                />
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader stickyHeader>
                                <TableRow>
                                    <TableHead>Artisan</TableHead>
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
                                                <p className="text-sm font-medium text-foreground">
                                                    {req.companyName ?? req.userName}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {req.userName} · {req.userEmail}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs">{formatSiret(req.siret)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(req.createdAt)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="border-lumiris-amber/40 bg-lumiris-amber/10 font-mono text-[10px] text-lumiris-amber"
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
                                                    disabled={!canReject || rejectArtisan.isPending}
                                                    onClick={() => reject(req)}
                                                    className="bg-lumiris-rose hover:bg-lumiris-rose/90 h-8 gap-1.5 text-white disabled:opacity-40"
                                                >
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    Rejeter
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    disabled={!canVerify || verifyArtisan.isPending}
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
                approving={verifyArtisan.isPending}
                rejecting={rejectArtisan.isPending}
                canApprove={canVerify}
                canReject={canReject}
            />
        </FeatureLayout>
    );
}
