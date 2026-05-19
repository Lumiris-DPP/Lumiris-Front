'use client';

import { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, ShieldCheck, ShieldX, Star, Timer } from 'lucide-react';
import { mockAffiliationEvents } from '@lumiris/mock-data';
import type { Repairer } from '@lumiris/types';
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
import { TabsContent } from '@lumiris/ui/components/tabs';
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import { useLogAction } from '@/lib/auth';
import {
    LUMIRIS_LOCAL_PRICE_MONTHLY_EUR,
    LUMIRIS_LOCAL_PRICE_YEARLY_EUR,
    REVIEW_HIDE_REASON_MIN_CHARS,
    RESPONSE_DELAY_MIN_BOOKINGS,
    toV1Specialty,
    V1_SPECIALTY_LABEL,
} from './specialties';
import type { LocalSubscription, RetoucheurOverlay } from './types';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</p>
            <div className="text-foreground mt-0.5">{children}</div>
        </div>
    );
}

function deriveSubscription(retoucheur: Repairer, overlay: RetoucheurOverlay | undefined): LocalSubscription {
    const base: LocalSubscription = retoucheur.localSubscribed
        ? {
              status: 'active',
              plan: retoucheur.id.charCodeAt(retoucheur.id.length - 1) % 2 === 0 ? 'monthly' : 'yearly',
              nextBillingAt: nextBilling(retoucheur.id),
          }
        : { status: 'none', plan: null, nextBillingAt: null };
    return { ...base, ...(overlay?.subscriptionOverride ?? {}) };
}

function nextBilling(seed: string): string {
    const offset = (seed.charCodeAt(seed.length - 1) % 28) + 1;
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString();
}

function responseDelayHours(retoucheur: Repairer, bookingCount: number): number | null {
    if (bookingCount < RESPONSE_DELAY_MIN_BOOKINGS) return null;
    return (retoucheur.reviewCount % 24) + 1;
}

function bookingsForRetoucheur(id: string): number {
    let count = 0;
    for (const ev of mockAffiliationEvents) {
        if (ev.beneficiaryKind === 'repairer' && ev.beneficiaryId === id) count += 1;
    }
    return count;
}

function v1Specialties(retoucheur: Repairer): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const code of retoucheur.specialities) {
        const v1 = toV1Specialty(code);
        if (v1 && !seen.has(v1)) {
            seen.add(v1);
            out.push(V1_SPECIALTY_LABEL[v1]);
        }
    }
    return out;
}

export function ProfileTab({ retoucheur }: { retoucheur: Repairer }) {
    const bookings = useMemo(() => bookingsForRetoucheur(retoucheur.id), [retoucheur.id]);
    const responseHours = responseDelayHours(retoucheur, bookings);
    const specialties = v1Specialties(retoucheur);

    return (
        <TabsContent value="profile" className="m-0 space-y-3">
            <div className="border-border bg-card grid grid-cols-2 gap-3 rounded-xl border p-3">
                <Field label="Adresse">
                    {retoucheur.atelierName ?? '-'}, {retoucheur.city}
                </Field>
                <Field label="Note moyenne">
                    <span className="font-mono">
                        {retoucheur.avgRating} / 5 ({retoucheur.reviewCount} avis)
                    </span>
                </Field>
                <Field label="Délai de prestation">
                    <span className="font-mono">{retoucheur.avgDelayDays} j</span>
                </Field>
                <Field label="Délai de réponse moyen">
                    {responseHours === null ? (
                        <span className="text-muted-foreground italic">Données insuffisantes</span>
                    ) : (
                        <span className="inline-flex items-center gap-1 font-mono">
                            <Timer className="h-3 w-3" /> {responseHours} h
                        </span>
                    )}
                </Field>
                <Field label="Fourchette tarif">
                    <span className="font-mono">
                        {retoucheur.priceRange.min}–{retoucheur.priceRange.max} €
                    </span>
                </Field>
                <Field label="Mises en relation (90 j)">
                    <span className="font-mono">{bookings}</span>
                </Field>
            </div>
            <Field label="Spécialités">
                {specialties.length === 0 ? (
                    <span className="text-muted-foreground italic">Aucune spécialité V1 textile</span>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {specialties.map((label) => (
                            <Badge key={label} variant="outline" className="text-[10px]">
                                {label}
                            </Badge>
                        ))}
                    </div>
                )}
            </Field>
        </TabsContent>
    );
}

interface KycTabProps {
    retoucheur: Repairer;
    overlay: RetoucheurOverlay | undefined;
    canVerify: boolean;
    onOpenVerify: () => void;
    onOpenReject: () => void;
    onResolveOverdue?: () => void;
    onPatchOverlay: (id: string, patch: Partial<RetoucheurOverlay>) => void;
}

export function KycTab({
    retoucheur,
    overlay,
    canVerify,
    onOpenVerify,
    onOpenReject,
    onResolveOverdue,
    onPatchOverlay,
}: KycTabProps) {
    const subscription = deriveSubscription(retoucheur, overlay);

    const handleResolveOverdue = () => {
        onPatchOverlay(retoucheur.id, { subscriptionOverride: { ...subscription, status: 'active' } });
        onResolveOverdue?.();
    };

    return (
        <TabsContent value="kyc" className="m-0 space-y-3">
            <div className="space-y-1.5">
                <p className="text-muted-foreground">Documents joints lors de la candidature (mock) :</p>
                <ul className="border-border bg-card divide-border divide-y rounded-xl border">
                    <li className="flex items-center justify-between px-3 py-2">
                        <span>Pièce d&apos;identité</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                            OK
                        </Badge>
                    </li>
                    <li className="flex items-center justify-between px-3 py-2">
                        <span>K-bis ou attestation CMA</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                            OK
                        </Badge>
                    </li>
                    <li className="flex items-center justify-between px-3 py-2">
                        <span>Photos atelier</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                            OK
                        </Badge>
                    </li>
                </ul>
            </div>

            <SubscriptionCard
                subscription={subscription}
                canVerify={canVerify}
                onResolveOverdue={handleResolveOverdue}
            />

            {overlay?.rejectReason ? (
                <div className="border-lumiris-rose/30 bg-lumiris-rose/5 rounded-xl border p-3">
                    <p className="text-lumiris-rose font-medium">Candidature rejetée</p>
                    <p className="text-foreground mt-1">{overlay.rejectReason}</p>
                </div>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-2">
                <Button
                    size="sm"
                    onClick={onOpenVerify}
                    disabled={!canVerify}
                    className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 gap-1.5"
                >
                    <ShieldCheck className="h-3.5 w-3.5" /> Vérifier KYC
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onOpenReject}
                    disabled={!canVerify}
                    className="border-lumiris-rose/40 text-lumiris-rose hover:bg-lumiris-rose/10 gap-1.5"
                >
                    <ShieldX className="h-3.5 w-3.5" /> Rejeter
                </Button>
            </div>
        </TabsContent>
    );
}

function SubscriptionCard({
    subscription,
    canVerify,
    onResolveOverdue,
}: {
    subscription: LocalSubscription;
    canVerify: boolean;
    onResolveOverdue: () => void;
}) {
    const planLabel =
        subscription.plan === 'monthly'
            ? `Mensuel · ${LUMIRIS_LOCAL_PRICE_MONTHLY_EUR} €/mois`
            : subscription.plan === 'yearly'
              ? `Annuel · ${LUMIRIS_LOCAL_PRICE_YEARLY_EUR} €/an`
              : '—';

    return (
        <div className="border-border bg-card space-y-2 rounded-xl border p-3">
            <p className="text-foreground font-medium">Abonnement LUMIRIS Local</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
                <Field label="Statut">
                    <SubscriptionBadge status={subscription.status} />
                </Field>
                <Field label="Plan">
                    <span className="font-mono">{planLabel}</span>
                </Field>
                <Field label="Prochain prélèvement">
                    {subscription.nextBillingAt ? (
                        <span className="inline-flex items-center gap-1 font-mono">
                            <CalendarClock className="h-3 w-3" /> {subscription.nextBillingAt.slice(0, 10)}
                        </span>
                    ) : (
                        <span className="text-muted-foreground italic">—</span>
                    )}
                </Field>
                <Field label="Tarification">
                    <span className="text-muted-foreground text-[11px]">
                        {LUMIRIS_LOCAL_PRICE_MONTHLY_EUR} €/mois · {LUMIRIS_LOCAL_PRICE_YEARLY_EUR} €/an
                    </span>
                </Field>
            </div>
            {subscription.status === 'overdue' ? (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onResolveOverdue}
                    disabled={!canVerify}
                    className="border-lumiris-emerald/40 text-lumiris-emerald hover:bg-lumiris-emerald/10 mt-1 gap-1.5"
                >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Marquer impayé résolu
                </Button>
            ) : null}
        </div>
    );
}

function SubscriptionBadge({ status }: { status: LocalSubscription['status'] }) {
    const { tone, label } =
        status === 'active'
            ? { tone: 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald', label: 'Actif' }
            : status === 'paused'
              ? { tone: 'border-muted-foreground/40 bg-muted text-muted-foreground', label: 'En pause' }
              : status === 'overdue'
                ? { tone: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose', label: 'Impayé' }
                : { tone: 'border-border bg-card text-muted-foreground', label: 'Non abonné' };
    return (
        <Badge variant="outline" className={cn('font-mono text-[10px]', tone)}>
            {label}
        </Badge>
    );
}

interface ReviewsTabProps {
    retoucheur: Repairer;
    overlay: RetoucheurOverlay | undefined;
    canModerate: boolean;
    onPatchOverlay: (id: string, patch: Partial<RetoucheurOverlay>) => void;
    onAnnounce?: (message: string) => void;
}

export function ReviewsTab({ retoucheur, overlay, canModerate, onPatchOverlay, onAnnounce }: ReviewsTabProps) {
    const log = useLogAction();
    const [pendingHideId, setPendingHideId] = useState<string | null>(null);
    const [hideReason, setHideReason] = useState('');

    const fakeReviews = [
        {
            id: `${retoucheur.id}-rev-1`,
            author: 'Camille B.',
            rating: 5,
            ts: '2026-04-12',
            text: 'Travail soigné, délai respecté.',
        },
        {
            id: `${retoucheur.id}-rev-2`,
            author: 'Antoine D.',
            rating: 4,
            ts: '2026-03-20',
            text: 'Bon contact, atelier sympathique.',
        },
        {
            id: `${retoucheur.id}-rev-3`,
            author: 'Anonyme',
            rating: 1,
            ts: '2026-02-04',
            text: 'Indésirable — texte abusif.',
        },
    ];

    const hidden = overlay?.hiddenReviewReasons ?? {};

    const closeDialog = () => {
        setPendingHideId(null);
        setHideReason('');
    };

    const handleConfirmHide = () => {
        if (pendingHideId === null) return;
        if (hideReason.trim().length < REVIEW_HIDE_REASON_MIN_CHARS) return;
        onPatchOverlay(retoucheur.id, {
            hiddenReviewReasons: { ...hidden, [pendingHideId]: hideReason.trim() },
        });
        const entry = log({
            action: 'retoucheur.review_hide',
            targetType: 'repairer',
            targetId: retoucheur.id,
            payload: {
                reviewId: pendingHideId,
                decision: 'hidden',
                reason: hideReason.trim(),
            },
        });
        onAnnounce?.(`Avis masqué — audit log ${entry.id} créé.`);
        closeDialog();
    };

    const handlePublish = (reviewId: string) => {
        const nextHidden = { ...hidden };
        delete nextHidden[reviewId];
        onPatchOverlay(retoucheur.id, { hiddenReviewReasons: nextHidden });
        const entry = log({
            action: 'retoucheur.review_hide',
            targetType: 'repairer',
            targetId: retoucheur.id,
            payload: { reviewId, decision: 'published' },
        });
        onAnnounce?.(`Avis publié — audit log ${entry.id} créé.`);
    };

    return (
        <TabsContent value="reviews" className="m-0 space-y-2">
            {fakeReviews.map((rev) => {
                const isHidden = rev.id in hidden;
                return (
                    <div
                        key={rev.id}
                        className={cn('border-border bg-card rounded-xl border p-3', isHidden && 'opacity-60')}
                    >
                        <div className="flex items-baseline justify-between">
                            <p className="text-foreground font-medium">{rev.author}</p>
                            <span className="font-mono text-[10px]">
                                <Star className="text-lumiris-amber inline h-3 w-3 fill-current" /> {rev.rating}/5 ·{' '}
                                {rev.ts}
                            </span>
                        </div>
                        <p className="text-foreground mt-1.5">{rev.text}</p>
                        {isHidden ? (
                            <div className="mt-2 space-y-1.5">
                                <p className="text-muted-foreground italic">Avis masqué — raison : {hidden[rev.id]}</p>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handlePublish(rev.id)}
                                    disabled={!canModerate}
                                    className="text-lumiris-emerald h-7 text-[11px]"
                                >
                                    Publier
                                </Button>
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPendingHideId(rev.id)}
                                disabled={!canModerate}
                                className="text-lumiris-rose mt-2 h-7 text-[11px]"
                            >
                                Masquer
                            </Button>
                        )}
                    </div>
                );
            })}

            <AlertDialog open={pendingHideId !== null} onOpenChange={(open) => !open && closeDialog()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Masquer cet avis ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Précisez la raison (au moins {REVIEW_HIDE_REASON_MIN_CHARS} caractères). Action tracée et
                            réversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        value={hideReason}
                        onChange={(e) => setHideReason(e.target.value)}
                        placeholder="Raison du masquage (insulte, spam, contenu hors-sujet…)"
                        className="min-h-20"
                    />
                    <p
                        className={cn(
                            'font-mono text-[10px]',
                            hideReason.trim().length < REVIEW_HIDE_REASON_MIN_CHARS
                                ? 'text-lumiris-rose'
                                : 'text-muted-foreground',
                        )}
                    >
                        {hideReason.trim().length}/{REVIEW_HIDE_REASON_MIN_CHARS} caractères minimum
                    </p>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmHide}
                            disabled={hideReason.trim().length < REVIEW_HIDE_REASON_MIN_CHARS}
                            className="bg-lumiris-rose hover:bg-lumiris-rose/90"
                        >
                            Masquer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TabsContent>
    );
}

export function ActivityTab() {
    return (
        <TabsContent value="activity" className="m-0">
            <p className="text-muted-foreground italic">
                RDV récents (mock) - alimentés par les events repair_booking.
            </p>
            <ul className="border-border bg-card divide-border mt-2 divide-y rounded-xl border">
                <li className="flex items-baseline justify-between px-3 py-2">
                    <span>RDV avec Anaïs · ourlet jean</span>
                    <span className="font-mono text-[10px]">2026-04-22</span>
                </li>
                <li className="flex items-baseline justify-between px-3 py-2">
                    <span>RDV avec Hugo · ressemelage</span>
                    <span className="font-mono text-[10px]">2026-04-15</span>
                </li>
            </ul>
        </TabsContent>
    );
}
