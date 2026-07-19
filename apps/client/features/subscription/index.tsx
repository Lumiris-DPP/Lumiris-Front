'use client';

import { type ReactNode } from 'react';
import { ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import { formatDate } from '@lumiris/utils';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { cn } from '@lumiris/ui/lib/cn';
import { useSubscriptionPage } from './hooks';
import { PlanCard } from './plan-card';

type SubscriptionPage = ReturnType<typeof useSubscriptionPage>;

export function Subscription() {
    const sub = useSubscriptionPage();

    if (!sub.isRealMode) {
        return (
            <Notice>
                <p className="text-foreground font-medium">Abonnement indisponible en mode démo</p>
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
                <p className="text-destructive font-medium">Impossible de charger votre abonnement.</p>
                <Button variant="outline" size="sm" onClick={sub.retry}>
                    Réessayer
                </Button>
            </Notice>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-8">
            <CurrentSubscriptionCard sub={sub} />

            <div className="flex items-center justify-center">
                <div className="text-muted-foreground bg-muted inline-flex items-center gap-1 rounded-md p-0.5">
                    <CycleButton active={!sub.isAnnual} onClick={() => sub.setCycle('monthly')}>
                        Mensuel
                    </CycleButton>
                    <CycleButton active={sub.isAnnual} onClick={() => sub.setCycle('annual')}>
                        Annuel <span className="text-lumiris-emerald ml-1 font-mono text-[10px]">2 mois offerts</span>
                    </CycleButton>
                </div>
            </div>

            {sub.plansLoading ? (
                <div className="text-muted-foreground flex items-center gap-2 p-8 text-sm">
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
                            disabled={sub.portal.isPending || sub.changePlan.isPending || sub.checkoutSession.isPending}
                            onChoose={sub.onChoose}
                        />
                    ))}
                </section>
            )}

            <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
                <ShieldCheck className="text-lumiris-emerald h-3.5 w-3.5" />
                Paiement sécurisé par Stripe · aucun acteur ne peut payer pour influencer son score Iris.
            </p>
        </div>
    );
}

function Notice({ children }: { children: ReactNode }) {
    return (
        <div className="p-4 md:p-8">
            <Card>
                <CardContent className="text-muted-foreground space-y-3 p-6 text-sm">{children}</CardContent>
            </Card>
        </div>
    );
}

function CurrentSubscriptionCard({ sub }: { sub: SubscriptionPage }) {
    const { subscription, quota, hasActiveSubscription, isLoading } = sub;
    return (
        <Card>
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <p className="text-foreground text-lg font-semibold">
                            {subscription ? subscription.tierLabel : 'Aucun abonnement actif'}
                        </p>
                        {subscription && (
                            <Badge
                                className={cn(
                                    subscription.active
                                        ? 'bg-lumiris-emerald/10 text-lumiris-emerald border-lumiris-emerald/30'
                                        : 'bg-lumiris-amber/10 text-lumiris-amber border-lumiris-amber/30',
                                )}
                            >
                                {subscription.active ? 'Actif' : subscription.status}
                            </Badge>
                        )}
                    </div>
                    {quota && (
                        <p className="text-muted-foreground text-sm">
                            {isLoading ? (
                                'Chargement…'
                            ) : quota.unlimited ? (
                                <>Passeports : {quota.used} (illimité)</>
                            ) : (
                                <>
                                    Passeports : <span className="text-foreground font-mono">{quota.used}</span> /{' '}
                                    {quota.limit ?? '—'}
                                </>
                            )}
                            {subscription?.cancelAtPeriodEnd && (
                                <span className="text-lumiris-amber ml-2">· se termine en fin de période</span>
                            )}
                        </p>
                    )}
                    {subscription?.active && subscription.currentPeriodEnd && !subscription.cancelAtPeriodEnd && (
                        <p className="text-muted-foreground text-xs">
                            Prochain renouvellement : {formatDate(subscription.currentPeriodEnd, { locale: 'fr-FR' })}
                        </p>
                    )}
                    {!hasActiveSubscription && (
                        <p className="text-lumiris-amber text-xs">
                            Souscrivez un palier ATELIER pour créer vos passeports.
                        </p>
                    )}
                </div>

                {hasActiveSubscription && (
                    <Button variant="outline" onClick={sub.openPortal} disabled={sub.portal.isPending}>
                        {sub.portal.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ExternalLink className="mr-2 h-4 w-4" />
                        )}
                        Gérer / facturation
                    </Button>
                )}
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
