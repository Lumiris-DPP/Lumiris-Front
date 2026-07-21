'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Loader2, Pencil } from 'lucide-react';
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
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Toaster, toast } from '@lumiris/ui/components/sonner';
import { IrisScoreCard } from '@lumiris/scoring-ui';
import { useDppForm, useWithdrawDpp } from '@lumiris/api-client/react';
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
import { QrCodeCard } from './QrCodeCard';
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
        return <div className="text-muted-foreground p-8 text-sm">Chargement…</div>;
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
                        {view.apiStatus === 'DRAFT' && (
                            <Badge
                                variant="outline"
                                className="border-lumiris-amber/40 text-lumiris-amber bg-lumiris-amber/5"
                            >
                                Brouillon
                            </Badge>
                        )}
                        {view.apiStatus === 'VALID' && <Badge variant="default">Publié</Badge>}
                        {view.apiStatus === 'INVALID' && <Badge variant="destructive">Invalide</Badge>}
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
                            <DraftAside dppId={passportId} />
                        ) : (
                            <div className="space-y-4">
                                <IrisScoreCard dppId={passportId} />
                                {apiDpp.publicCode && <QrCodeCard publicCode={apiDpp.publicCode} />}
                                {apiDpp.status === 'VALID' && <WithdrawCard dppId={passportId} />}
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

// Retrait d'un passeport publié : VALID → INVALID + délistage de l'annonce marketplace.
// Action irréversible, protégée par une confirmation explicite.
function WithdrawCard({ dppId }: { dppId: string }) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const withdraw = useWithdrawDpp();

    const onConfirm = () => {
        if (withdraw.isPending) return;
        withdraw.mutate(dppId, {
            onSuccess: () => {
                setConfirmOpen(false);
                toast.success('Passeport retiré', {
                    description: 'Il est désormais invalide et son annonce marketplace a été délistée.',
                });
            },
            onError: (e) => {
                setConfirmOpen(false);
                // 409 : le DPP n'est pas publié — on relaie le message backend.
                if (isApiError(e) && e.status === 409) {
                    toast.error('Retrait impossible', {
                        description: e.message || "Ce passeport n'est pas publié.",
                    });
                    return;
                }
                toast.error('Le retrait a échoué', { description: e.message });
            },
        });
    };

    return (
        <Card className="border-destructive/30">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-1.5 text-base">
                    <AlertTriangle className="h-4 w-4" /> Retirer ce passeport
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">
                    Le passeport passera au statut <span className="text-foreground font-medium">invalide</span> et son
                    annonce dans la Marketplace sera délistée. Cette action est irréversible.
                </p>
                <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive border-destructive/40 w-full gap-2"
                    onClick={() => setConfirmOpen(true)}
                    disabled={withdraw.isPending}
                >
                    {withdraw.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                    Retirer ce passeport
                </Button>
            </CardContent>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Retirer ce passeport ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Le passeport deviendra invalide et son annonce marketplace sera délistée. Cette action est
                            définitive et ne peut pas être annulée.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={withdraw.isPending}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                onConfirm();
                            }}
                            disabled={withdraw.isPending}
                            className="bg-destructive hover:bg-destructive/90 text-white"
                        >
                            {withdraw.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Retirer définitivement
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
                <p className="text-muted-foreground text-sm">
                    Ce passeport n&apos;est pas encore publié. Le score Iris et le QR code seront générés à la
                    publication.
                </p>
                <Button
                    onClick={() => void editDraft(dppId)}
                    disabled={loadingId === dppId}
                    className="bg-lumiris-cyan hover:bg-lumiris-cyan/90 w-full gap-2 text-white"
                >
                    <Pencil className="h-4 w-4" /> Modifier le brouillon
                </Button>
            </CardContent>
        </Card>
    );
}
