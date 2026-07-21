'use client';

import { CheckCircle2, ClipboardCheck, XCircle } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { useToast } from '@lumiris/ui/hooks/use-toast';
import { isApiError, useAdminArtisansList, useRejectArtisan, useVerifyArtisan } from '@lumiris/api-client/react';
import type { ArtisanProfileResponse } from '@lumiris/api-client';
import { usePermission } from '@/lib/auth/permissions';
import { EmptyState } from '../_shared/empty-state';

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

    const { data: rawPending = [], isLoading } = useAdminArtisansList();
    // Backend lists every PENDING profile, including empty shells auto-created at signup
    // before the artisan ever touches onboarding — only show ones actually submitted for review.
    const pending = rawPending.filter((req) => req.declarationSigned);
    const verifyArtisan = useVerifyArtisan();
    const rejectArtisan = useRejectArtisan();

    function approve(req: ArtisanProfileResponse) {
        verifyArtisan.mutate(req.id, {
            onSuccess: () =>
                toast({ title: `${req.userName} approuvé`, description: 'Un e-mail de confirmation a été envoyé.' }),
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
                onSuccess: () =>
                    toast({
                        title: `${req.userName} rejeté`,
                        description: "L'artisan a été notifié par e-mail.",
                        variant: 'destructive',
                    }),
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
                <div className="border-border bg-card overflow-hidden rounded-xl border">
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
                                                <p className="text-foreground text-sm font-medium">
                                                    {req.companyName ?? req.userName}
                                                </p>
                                                <p className="text-muted-foreground text-[11px]">
                                                    {req.userName} · {req.userEmail}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs">{formatSiret(req.siret)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-muted-foreground text-xs">
                                                {formatDate(req.createdAt)}
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
                                                    disabled={!canReject || rejectArtisan.isPending}
                                                    onClick={() => reject(req)}
                                                    className="h-8 gap-1.5 bg-lumiris-rose text-white hover:bg-lumiris-rose/90 disabled:opacity-40"
                                                >
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    Rejeter
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    disabled={!canVerify || verifyArtisan.isPending}
                                                    onClick={() => approve(req)}
                                                    className="h-8 gap-1.5 bg-lumiris-emerald text-white hover:bg-lumiris-emerald/90 disabled:opacity-40"
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
        </FeatureLayout>
    );
}
