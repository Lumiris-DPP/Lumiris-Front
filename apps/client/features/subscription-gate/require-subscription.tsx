'use client';

import Link from 'next/link';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent } from '@lumiris/ui/components/card';

import { SUBSCRIPTION_REQUIRED_MESSAGE, useSubscriptionGate } from '@/lib/use-subscription-gate';

export function RequireSubscription({ children }: { children: React.ReactNode }) {
    const { blocked, isLoading } = useSubscriptionGate();

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 p-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Vérification de votre abonnement…
            </div>
        );
    }

    if (!blocked) return <>{children}</>;

    return (
        <div className="p-8">
            <Card className="mx-auto max-w-2xl">
                <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lumiris-amber/10 text-lumiris-amber">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-foreground">{SUBSCRIPTION_REQUIRED_MESSAGE}</h2>
                        <p className="max-w-md text-sm text-muted-foreground">
                            La création d&apos;un passeport numérique produit nécessite un abonnement ATELIER actif.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button asChild className="bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90">
                            <Link href="/subscription">Voir les abonnements</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/passports">Retour à mes passeports</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
