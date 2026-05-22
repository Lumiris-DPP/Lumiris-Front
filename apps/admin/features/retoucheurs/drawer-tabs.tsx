'use client';

import { useMemo } from 'react';
import { CalendarClock, CheckCircle2, ShieldCheck, ShieldX, Timer } from 'lucide-react';
import { mockAffiliationEvents } from '@lumiris/mock-data';
import type { Repairer } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { cn } from '@lumiris/ui/lib/cn';
import {
    LUMIRIS_LOCAL_PRICE_MONTHLY_EUR,
    LUMIRIS_LOCAL_PRICE_YEARLY_EUR,
    RESPONSE_DELAY_MIN_BOOKINGS,
    toV1Specialty,
    V1_SPECIALTY_LABEL,
} from './specialties';
import { SUBSCRIPTION_TONE } from './specialty-status';
import type { LocalSubscription, RetoucheurOverlay } from './types';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</p>
            <div className="text-foreground mt-0.5">{children}</div>
        </div>
    );
}

export function deriveSubscription(retoucheur: Repairer, overlay: RetoucheurOverlay | undefined): LocalSubscription {
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
    const responseHours = bookings < RESPONSE_DELAY_MIN_BOOKINGS ? null : (retoucheur.reviewCount % 24) + 1;
    const specialties = useMemo(() => v1Specialties(retoucheur), [retoucheur]);

    return (
        <div className="space-y-3 text-xs">
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
                <Field label="Délai de réponse">
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
        </div>
    );
}

interface KycTabProps {
    retoucheur: Repairer;
    overlay: RetoucheurOverlay | undefined;
    canVerify: boolean;
    onOpenVerify: () => void;
    onOpenReject: () => void;
    onResolveOverdue: () => void;
}

export function KycTab({ retoucheur, overlay, canVerify, onOpenVerify, onOpenReject, onResolveOverdue }: KycTabProps) {
    const subscription = deriveSubscription(retoucheur, overlay);
    const planLabel =
        subscription.plan === 'monthly'
            ? `Mensuel · ${LUMIRIS_LOCAL_PRICE_MONTHLY_EUR} €/mois`
            : subscription.plan === 'yearly'
              ? `Annuel · ${LUMIRIS_LOCAL_PRICE_YEARLY_EUR} €/an`
              : '—';
    const subMeta = SUBSCRIPTION_TONE[subscription.status];

    return (
        <div className="space-y-3 text-xs">
            <ul className="border-border bg-card divide-border divide-y rounded-xl border">
                {['Pièce d’identité', 'K-bis ou attestation CMA', 'Photos atelier'].map((doc) => (
                    <li key={doc} className="flex items-center justify-between px-3 py-2">
                        <span>{doc}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                            OK
                        </Badge>
                    </li>
                ))}
            </ul>

            <div className="border-border bg-card space-y-2 rounded-xl border p-3">
                <p className="text-foreground font-medium">Abonnement LUMIRIS Local</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <Field label="Statut">
                        <Badge variant="outline" className={cn('font-mono text-[10px]', subMeta.tone)}>
                            {subMeta.label}
                        </Badge>
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
        </div>
    );
}
