'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Copy, Loader2, Pencil, Trash2 } from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import { mockCertificates, mockPassportById } from '@lumiris/mock-data';
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
import { useDeleteDppForm, useDppForm, useDuplicateDppForm } from '@lumiris/api-client/react';
import { isApiError, type DppFormDto } from '@lumiris/api-client';
import { useAuthStore } from '@/lib/auth-store';
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
import { AccessQrCard } from './access-qr-card';
import { buildDetailView } from './view-model';

export function PassportDetail({ passportId }: { passportId: string }) {
    const artisan = useCurrentArtisan();
    const token = useAuthStore((s) => s.token);
    const drafts = useDraftStore((s) => s.drafts);
    const draft = drafts[passportId];

    // Les passeports « fixes » proviennent des mocks : réservés au mode démo (aucun token).
    const fixed = useMemo(() => (token ? null : mockPassportById(passportId)), [passportId, token]);

    // Fetched only when this isn't a draft or mock passport.
    const dppQuery = useDppForm(passportId, { enabled: !draft && !fixed && Boolean(token) });
    const apiDpp: DppFormDto | null = dppQuery.data ?? null;
    const loading = dppQuery.isLoading;
    const notFound = dppQuery.isError;

    const apiPassport = useMemo<Passport | null>(
        () => (apiDpp ? dppToPassport(apiDpp, artisan.id) : null),
        [apiDpp, artisan.id],
    );

    const passport = useMemo<Passport | null>(() => {
        if (draft) return draftToPassport(draft);
        if (fixed) return fixed;
        return apiPassport;
    }, [draft, fixed, apiPassport]);

    const now = useMemo(() => new Date(), []);
    // Le score client (calculé à partir de certificats mock) ne sert qu'à l'aperçu démo / brouillon
    // local. Un DPP publié via l'API expose son vrai score Iris (IrisScoreCard) : aucun calcul mock
    // en mode réel.
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
                            <Link href="/passports">
                                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Liste
                            </Link>
                        </Button>
                    </div>

                    <IdentityCard view={view} />
                    <CompositionCard view={view} />
                    <TraceabilityCard view={view} />
                    <SustainabilityCard view={view} />
                    {/* Se masque automatiquement tant qu'aucun ancrage n'existe (brouillon/démo). */}
                    <BlockchainAnchorCard view={view} />
                    {apiDpp && (
                        <>
                            <DocumentsCard documents={apiDpp.documents ?? []} />
                            {/* Events and Iris score only exist once a DPP is published. */}
                            {!isDraft && (
                                <>
                                    <EventFormCard passportId={passportId} />
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
                                {apiDpp.publicCode && (
                                    <AccessQrCard
                                        dppId={passportId}
                                        publicCode={apiDpp.publicCode}
                                        documents={apiDpp.documents ?? []}
                                    />
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
    const router = useRouter();
    const { editDraft, loadingId } = useEditDraft();
    const duplicateDpp = useDuplicateDppForm();

    const onDuplicate = () => {
        duplicateDpp.mutate(dppId, {
            onSuccess: (created) => {
                toast.success('Brouillon dupliqué.');
                router.push(`/passports/${created.id}`);
            },
            onError: (e) => {
                if (isApiError(e) && e.status === 409) {
                    toast.error('Duplication impossible', {
                        description: e.message || 'Seul un brouillon peut être dupliqué.',
                    });
                    return;
                }
                toast.error('La duplication a échoué', { description: e.message });
            },
        });
    };

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
                <Button
                    variant="outline"
                    onClick={onDuplicate}
                    disabled={duplicateDpp.isPending}
                    className="w-full gap-2"
                >
                    {duplicateDpp.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                    Dupliquer le brouillon
                </Button>
            </CardContent>
        </Card>
    );
}
