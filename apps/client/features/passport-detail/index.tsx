'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Copy, Loader2, Pencil, Trash2 } from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import { mockCertificates } from '@lumiris/mock-data';
import type { Passport } from '@lumiris/types';
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
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Toaster, toast } from '@lumiris/ui/components/sonner';
import { IrisScoreCard } from '@lumiris/scoring-ui';
import { useDeleteDppForm, useDppForm, useDuplicateDppForm, useRepairerRequests } from '@lumiris/api-client/react';
import { isApiError, type DppFormDto } from '@lumiris/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { useAuthRole } from '@/lib/use-auth';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { useEditDraft } from '@/lib/use-edit-draft';
import { draftToPassport, useDraftStore } from '@/lib/draft-store';
import { dppToPassport } from '@/lib/passport-adapter';
import {
    BlockchainAnchorCard,
    CompositionCard,
    IdentityCard,
    ScoreAside,
    SustainabilityCard,
    TraceabilityCard,
} from './detail-cards';
import { DocumentsCard } from './documents-card';
import { EventFormCard } from './event-form-card';
import { EventHistoryCard } from './event-history-card';
import { RepairerRequestCard } from './repairer-request-card';
import { AccessQrCard } from './access-qr-card';
import { buildDetailView } from './view-model';

export function PassportDetail({ passportId }: { passportId: string }) {
    const artisan = useCurrentArtisan();
    const role = useAuthRole();
    const isRepairerViewer = role === 'repairer';
    const token = useAuthStore((s) => s.token);
    // Le backend (DppEventService) ne laisse le retoucheur écrire un événement / voir l'historique
    // que s'il a réellement été en charge de la demande (ACCEPTED/IN_PROGRESS, ou COMPLETED sans
    // avoir été refusé/décliné) — quoteRefusedAt/repairerDeclinedAt distinguent un COMPLETED
    // "jamais honoré" d'un COMPLETED "intervention terminée".
    const { data: repairerRequests = [] } = useRepairerRequests({ enabled: isRepairerViewer });
    const repairerRequest = isRepairerViewer ? repairerRequests.find((r) => r.dppFormId === passportId) : undefined;
    const canManageEvents =
        !isRepairerViewer ||
        (repairerRequest !== undefined &&
            ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(repairerRequest.status) &&
            !repairerRequest.quoteRefusedAt &&
            !repairerRequest.repairerDeclinedAt);
    const drafts = useDraftStore((s) => s.drafts);
    const draft = drafts[passportId];

    // Fetched only when this isn't a local draft.
    const dppQuery = useDppForm(passportId, { enabled: !draft && Boolean(token) });
    const apiDpp: DppFormDto | null = dppQuery.data ?? null;
    const loading = dppQuery.isLoading;
    const notFound = dppQuery.isError;

    const apiPassport = useMemo<Passport | null>(
        () => (apiDpp ? dppToPassport(apiDpp, artisan.id) : null),
        [apiDpp, artisan.id],
    );

    const passport = useMemo<Passport | null>(
        () => (draft ? draftToPassport(draft) : apiPassport),
        [draft, apiPassport],
    );

    const now = useMemo(() => new Date(), []);
    // Le score client ne sert qu'au brouillon local. Un DPP enregistré expose son vrai score Iris
    // (IrisScoreCard), calculé par le backend.
    // TODO(fiche-07): les certificats du brouillon viennent encore des fixtures.
    const score = useMemo(
        () => (passport && !apiDpp ? computeScore(passport, { artisan, certificates: mockCertificates, now }) : null),
        [artisan, passport, apiDpp, now],
    );

    if (loading) {
        return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;
    }

    if (notFound || !passport) {
        return (
            <div className="p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>DPP introuvable</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline">
                            <Link href="/passports">
                                <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour à la liste
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const view = buildDetailView(passport, apiDpp);
    const isDraft = apiDpp?.status === 'DRAFT';

    return (
        <>
            <Toaster position="bottom-right" />
            <div className="grid gap-6 p-8 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={isRepairerViewer ? '/repairer-passports' : '/passports'}>
                                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Liste
                            </Link>
                        </Button>
                    </div>

                    {isRepairerViewer && <RepairerRequestCard passportId={passportId} />}

                    <IdentityCard view={view} />
                    <CompositionCard view={view} />
                    <TraceabilityCard view={view} />
                    <SustainabilityCard view={view} />
                    {/* Se masque automatiquement tant qu'aucun ancrage n'existe (brouillon/démo). */}
                    <BlockchainAnchorCard view={view} />
                    {apiDpp && (
                        <>
                            {/* Le backend ne renvoie déjà que les documents visibles pour ce rôle (opérateur
                                circulaire pour un retoucheur, tout pour le propriétaire). */}
                            <DocumentsCard documents={apiDpp.documents ?? []} />
                            {/* Events and Iris score only exist once a DPP is published. */}
                            {!isDraft && canManageEvents && (
                                <>
                                    <EventFormCard
                                        passportId={passportId}
                                        defaultActorType={isRepairerViewer ? 'REPAIRER' : 'MANUFACTURER'}
                                    />
                                    <EventHistoryCard passportId={passportId} />
                                </>
                            )}
                        </>
                    )}
                </div>

                {apiDpp ? (
                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        {isDraft ? (
                            <div className="space-y-4">
                                <DraftAside dppId={passportId} />
                                <DeleteDraftCard dppId={passportId} />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <IrisScoreCard dppId={passportId} />
                                {/* Un retoucheur voit ses propres QR Public + Opérateur (il peut en avoir besoin
                                    pour ses propres usages), mais jamais le niveau Autorités. La duplication
                                    reste un outil de gestion du propriétaire uniquement. */}
                                {apiDpp.publicCode && (
                                    <AccessQrCard
                                        dppId={passportId}
                                        publicCode={apiDpp.publicCode}
                                        documents={apiDpp.documents ?? []}
                                        levels={isRepairerViewer ? ['PUBLIC', 'CIRCULAR_OPERATORS'] : undefined}
                                    />
                                )}
                                {!isRepairerViewer && (
                                    <DuplicateDppButton dppId={passportId} label="Dupliquer ce passeport" />
                                )}
                            </div>
                        )}
                    </aside>
                ) : score ? (
                    <ScoreAside score={score} passport={passport} />
                ) : null}
            </div>
        </>
    );
}

function DeleteDraftCard({ dppId }: { dppId: string }) {
    const router = useRouter();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const deleteDpp = useDeleteDppForm();
    const deleteLocalDraft = useDraftStore((s) => s.deleteDraft);

    const onConfirm = () => {
        if (deleteDpp.isPending) return;
        deleteDpp.mutate(dppId, {
            onSuccess: () => {
                setConfirmOpen(false);
                deleteLocalDraft(dppId);
                toast.success('Brouillon supprimé.');
                router.replace('/passports');
            },
            onError: (e) => {
                setConfirmOpen(false);
                if (isApiError(e) && e.status === 409) {
                    toast.error('Suppression impossible', {
                        description: e.message || 'Seul un brouillon peut être supprimé.',
                    });
                    return;
                }
                toast.error('La suppression a échoué', { description: e.message });
            },
        });
    };

    return (
        <Card className="border-destructive/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-base text-destructive">
                    <AlertTriangle className="h-4 w-4" /> Supprimer ce brouillon
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    Le brouillon et ses documents seront définitivement effacés. Une fois publié, un passeport ne peut
                    plus être supprimé.
                </p>
                <Button
                    variant="outline"
                    className="w-full gap-2 border-destructive/40 text-destructive hover:text-destructive"
                    onClick={() => setConfirmOpen(true)}
                    disabled={deleteDpp.isPending}
                >
                    {deleteDpp.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="h-4 w-4" />
                    )}
                    Supprimer ce brouillon
                </Button>
            </CardContent>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce brouillon ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Le brouillon et ses documents seront définitivement effacés. Cette action ne peut pas être
                            annulée.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteDpp.isPending}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                onConfirm();
                            }}
                            disabled={deleteDpp.isPending}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            {deleteDpp.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Supprimer définitivement
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

function DraftAside({ dppId }: { dppId: string }) {
    const { editDraft, loadingId } = useEditDraft();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Brouillon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    Ce passeport n&apos;est pas encore publié. Le score Iris et le QR code seront générés à la
                    publication.
                </p>
                <Button
                    onClick={() => void editDraft(dppId)}
                    disabled={loadingId === dppId}
                    className="w-full gap-2 bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
                >
                    <Pencil className="h-4 w-4" /> Modifier le brouillon
                </Button>
                <DuplicateDppButton dppId={dppId} label="Dupliquer le brouillon" />
            </CardContent>
        </Card>
    );
}

function DuplicateDppButton({ dppId, label }: { dppId: string; label: string }) {
    const router = useRouter();
    const duplicateDpp = useDuplicateDppForm();

    const onDuplicate = () => {
        duplicateDpp.mutate(dppId, {
            onSuccess: (created) => {
                toast.success('Passeport dupliqué.');
                router.push(`/passports/${created.id}`);
            },
            onError: (e) => {
                toast.error('La duplication a échoué', { description: e.message });
            },
        });
    };

    return (
        <Button variant="outline" onClick={onDuplicate} disabled={duplicateDpp.isPending} className="w-full gap-2">
            {duplicateDpp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            {label}
        </Button>
    );
}
