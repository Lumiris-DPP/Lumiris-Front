'use client';

import { type ReactNode } from 'react';
import { AlertTriangle, BarChart3, ExternalLink, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import type { BillingCycle, PlanDto } from '@lumiris/api-client';
import { formatDate } from '@lumiris/utils';
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
import { Card, CardContent } from '@lumiris/ui/components/card';
import { cn } from '@lumiris/ui/lib/cn';
import { CheckoutDialog } from './checkout-dialog';
import { useSubscriptionPage } from './hooks';
import { PlanCard } from './plan-card';
import { euros } from './utils';

type SubscriptionPage = ReturnType<typeof useSubscriptionPage>;

export function Subscription() {
    const sub = useSubscriptionPage();

    if (!sub.isRealMode) {
        return (
            <Notice>
                <p className="font-medium text-foreground">Abonnement indisponible en mode démo</p>
                <p>
                    Créez un compte ou connectez-vous avec vos identifiants pour gérer votre abonnement ATELIER et
                    débloquer la création de passeports.
                </p>
            </Notice>
        );
    }

    if (sub.isError) {
        return (
            <Notice>
                <p className="font-medium text-destructive">Impossible de charger votre abonnement.</p>
                <Button variant="outline" size="sm" onClick={sub.retry}>
                    Réessayer
                </Button>
            </Notice>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-8">
            <PaymentRecoveryBanner sub={sub} />
            <CurrentSubscriptionCard sub={sub} />
            <AtelierPlusCard sub={sub} />

            <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-1 rounded-md bg-muted p-0.5 text-muted-foreground">
                    <CycleButton active={!sub.isAnnual} onClick={() => sub.setCycle('monthly')}>
                        Mensuel
                    </CycleButton>
                    <CycleButton active={sub.isAnnual} onClick={() => sub.setCycle('annual')}>
                        Annuel <span className="ml-1 font-mono text-[10px] text-lumiris-cyan">2 mois offerts</span>
                    </CycleButton>
                </div>
            </div>

            {sub.plansLoading ? (
                <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Chargement des offres…
                </div>
            ) : (
                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {sub.plans.map((plan) => (
                        <PlanCard
                            key={plan.tier}
                            plan={plan}
                            isCurrent={Boolean(
                                sub.subscription?.tier === plan.tier &&
                                sub.subscription?.billingCycle === sub.cycle &&
                                sub.subscription?.active,
                            )}
                            isAnnual={sub.isAnnual}
                            hasActiveSubscription={sub.hasActiveSubscription}
                            disabled={sub.portal.isPending || sub.changePlan.isPending}
                            onChoose={sub.onChoose}
                        />
                    ))}
                </section>
            )}

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-lumiris-cyan" />
                Paiement sécurisé par Stripe · aucun acteur ne peut payer pour influencer son score Iris.
            </p>

            {sub.checkout && (
                <CheckoutDialog
                    open
                    onOpenChange={(next) => {
                        if (!next) sub.closeCheckout();
                    }}
                    tier={sub.checkout.plan.tier}
                    cycle={sub.checkout.cycle}
                    planLabel={sub.checkout.plan.label}
                    amountLabel={amountLabel(sub.checkout.plan, sub.checkout.cycle)}
                    onConfirmed={sub.closeCheckout}
                />
            )}

            <AlertDialog
                open={sub.pendingPlan != null}
                onOpenChange={(open) => {
                    if (!open) sub.cancelPlanChange();
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Changer de plan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vous allez passer à {sub.pendingPlan?.label ?? 'ce plan'}. Un ajustement au prorata sera
                            facturé ou crédité automatiquement sur votre moyen de paiement.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={sub.confirmPlanChange}>Confirmer le changement</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Bandeau de récupération : un abonnement existant mais non actif (paiement échoué :
// past_due/incomplete/unpaid) n'a autrement aucune action de recouvrement. On expose le portail
// Stripe pour mettre à jour la carte et rétablir l'accès.
function PaymentRecoveryBanner({ sub }: { sub: SubscriptionPage }) {
    const { subscription } = sub;
    if (!subscription || subscription.active) return null;
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-2.5 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                <div>
                    <p className="font-medium text-foreground">Paiement de votre abonnement en échec</p>
                    <p className="text-xs text-muted-foreground">
                        Le paiement de votre abonnement a échoué — mettez à jour votre carte pour rétablir l&apos;accès.
                    </p>
                </div>
            </div>
            <Button onClick={sub.openPortal} disabled={sub.portal.isPending} className="shrink-0 gap-1.5">
                {sub.portal.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <ExternalLink className="h-4 w-4" />
                )}
                Mettre à jour le paiement
            </Button>
        </div>
    );
}

function amountLabel(plan: PlanDto, cycle: BillingCycle): string {
    const cents = cycle === 'annual' ? plan.annualAmountCents : plan.monthlyAmountCents;
    return `${euros(cents)} €/${cycle === 'annual' ? 'an' : 'mois'}`;
}

function Notice({ children }: { children: ReactNode }) {
    return (
        <div className="p-4 md:p-8">
            <Card>
                <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">{children}</CardContent>
            </Card>
        </div>
    );
}

function CurrentSubscriptionCard({ sub }: { sub: SubscriptionPage }) {
    const { subscription, quota, isLoading } = sub;
    return (
        <Card>
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-foreground">
                            {subscription ? subscription.tierLabel : 'Aucun abonnement actif'}
                        </p>
                        {subscription && (
                            <Badge
                                className={cn(
                                    subscription.active
                                        ? 'border-lumiris-emerald/30 bg-lumiris-emerald/10 text-lumiris-emerald'
                                        : 'border-lumiris-amber/30 bg-lumiris-amber/10 text-lumiris-amber',
                                )}
                            >
                                {subscription.active ? 'Actif' : subscription.status}
                            </Badge>
                        )}
                    </div>
                    {quota && (
                        <p className="text-sm text-muted-foreground">
                            {isLoading ? (
                                'Chargement…'
                            ) : quota.unlimited ? (
                                <>Passeports : {quota.used} (illimité)</>
                            ) : (
                                <>
                                    Passeports : <span className="font-mono text-foreground">{quota.used}</span> /{' '}
                                    {quota.limit ?? '—'}
                                </>
                            )}
                            {subscription?.cancelAtPeriodEnd && (
                                <span className="ml-2 text-lumiris-amber">· se termine en fin de période</span>
                            )}
                        </p>
                    )}
                    {subscription?.active && subscription.currentPeriodEnd && !subscription.cancelAtPeriodEnd && (
                        <p className="text-xs text-muted-foreground">
                            Prochain renouvellement : {formatDate(subscription.currentPeriodEnd, { locale: 'fr-FR' })}
                        </p>
                    )}
                    {!subscription && (
                        <p className="text-xs text-lumiris-amber">
                            Souscrivez un palier ATELIER pour créer vos passeports.
                        </p>
                    )}
                </div>

                {/* Résiliation/reprise n'ont de sens que sur un abonnement actif. Le portail d'un
                    abonnement non actif (paiement échoué) est exposé par PaymentRecoveryBanner. */}
                {subscription?.active && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                        {subscription.cancelAtPeriodEnd ? (
                            <Button onClick={sub.resumeSubscription} disabled={sub.resumeSub.isPending}>
                                {sub.resumeSub.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Reprendre l&apos;abonnement
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={sub.cancelSubscription}
                                disabled={sub.cancelSub.isPending}
                            >
                                {sub.cancelSub.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Résilier
                            </Button>
                        )}
                        <Button variant="outline" onClick={sub.openPortal} disabled={sub.portal.isPending}>
                            {sub.portal.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <ExternalLink className="mr-2 h-4 w-4" />
                            )}
                            Gérer / facturation
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Option ATELIER+ : un ADD-ON (2ᵉ article Stripe) qui s'ajoute au palier de base, pas un plan
// autonome. Activable uniquement lorsqu'un abonnement de base est actif.
function AtelierPlusCard({ sub }: { sub: SubscriptionPage }) {
    const active = sub.atelierPlus;
    const canManage = sub.hasActiveSubscription;
    const pending = sub.addAtelierPlus.isPending || sub.removeAtelierPlus.isPending;

    return (
        <Card className={cn(active && 'border-lumiris-iris/40 bg-lumiris-iris/5')}>
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lumiris-iris/10">
                            <Sparkles className="h-4 w-4 text-lumiris-iris" />
                        </div>
                        <p className="text-lg font-semibold text-foreground">Option ATELIER+</p>
                        <Badge
                            className={cn(
                                active
                                    ? 'border-lumiris-iris/30 bg-lumiris-iris/10 text-lumiris-iris'
                                    : 'border-border bg-muted text-muted-foreground',
                            )}
                        >
                            {active ? 'Activée' : 'Non activée'}
                        </Badge>
                    </div>
                    <p className="max-w-xl text-sm text-muted-foreground">
                        Option complémentaire qui s&apos;ajoute à votre palier ATELIER (elle ne le remplace pas).
                        Débloque l&apos;Analytics avancé : scans QR, score Iris vs marché et pièces les plus vues.
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BarChart3 className="h-3.5 w-3.5 text-lumiris-iris" />
                        Facturée en plus de votre abonnement de base, au prorata.
                    </p>
                    {!canManage && (
                        <p className="text-xs text-lumiris-amber">
                            Un abonnement ATELIER actif est requis pour ajouter cette option.
                        </p>
                    )}
                </div>

                <div className="shrink-0">
                    {active ? (
                        <Button
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={sub.deactivateAtelierPlus}
                            disabled={!canManage || pending}
                        >
                            {sub.removeAtelierPlus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Retirer l&apos;option
                        </Button>
                    ) : (
                        <Button
                            className="gap-1.5 bg-lumiris-iris text-white hover:bg-lumiris-iris/90"
                            onClick={sub.activateAtelierPlus}
                            disabled={!canManage || pending}
                        >
                            {sub.addAtelierPlus.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            Activer ATELIER+
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function CycleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'rounded-sm px-3 py-1 text-xs font-medium',
                active && 'bg-background text-foreground shadow-sm',
            )}
        >
            {children}
        </button>
    );
}
