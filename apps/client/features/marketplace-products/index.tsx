'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Archive, ExternalLink, Eye, EyeOff, Loader2, ShoppingBag, Wallet, Wand2 } from 'lucide-react';
import { useSellerStats, useSellerStatus, useStartSellerOnboarding } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { toast } from '@lumiris/ui/components/sonner';
import { StatCard } from '@lumiris/ui/components/stat-card';
import { formatPriceCents } from '@lumiris/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useSubscription } from '@/lib/use-subscription';
import { ConvertDppDialog } from './components/convert-dpp-dialog';
import { ProductsTab } from './components/products-tab';
import { VacationBanner } from './components/vacation-banner';

/** Affiche le catalogue artisan et ouvre la conversion des passeports. */
export function MarketplaceProducts() {
    const [convertOpen, setConvertOpen] = useState(false);

    const { hasActiveSubscription } = useSubscription();
    const sellBlocked = !hasActiveSubscription;

    return (
        <div className="space-y-4 p-8">
            <SellerConnectBanner />
            <VacationBanner />
            <SellerStatsCards />

            <div className="flex flex-col items-end gap-1.5">
                <Button
                    onClick={() => setConvertOpen(true)}
                    disabled={sellBlocked}
                    title={sellBlocked ? 'Abonnement ATELIER requis pour vendre' : undefined}
                    className="bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
                >
                    <Wand2 className="mr-1.5 h-4 w-4" /> Convertir un DPP en produit
                </Button>
                {sellBlocked && (
                    <p className="text-xs text-muted-foreground">
                        Abonnement ATELIER requis pour vendre.{' '}
                        <Link href="/subscription" className="text-lumiris-cyan underline">
                            Voir l&apos;abonnement
                        </Link>
                    </p>
                )}
            </div>

            <ProductsTab onCreate={() => setConvertOpen(true)} />

            <ConvertDppDialog open={convertOpen} onOpenChange={setConvertOpen} />
        </div>
    );
}

/** Propose une activation des paiements lorsque le compte vendeur la nécessite. */
function SellerConnectBanner() {
    const token = useAuthStore((s) => s.token);
    const { data: status } = useSellerStatus({ enabled: Boolean(token) });
    const onboarding = useStartSellerOnboarding();

    if (!token || status?.chargesEnabled) return null;

    /** Ouvre le parcours hébergé d’activation des paiements. */
    const activate = () =>
        onboarding.mutate(undefined, {
            /** Annonce la réussite et termine la mutation demandée. */
            onSuccess: ({ url }) => {
                window.location.href = url;
            },

            /** Affiche la cause exacte de l’échec de la requête. */
            onError: () => toast.error("Impossible d'ouvrir l'onboarding des paiements."),
        });

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-lumiris-amber/40 bg-lumiris-amber/10 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-2.5 text-sm">
                <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-lumiris-amber" aria-hidden />
                <div>
                    <p className="font-medium text-foreground">
                        Vos produits publiés ne sont pas encore visibles par les acheteurs
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Tant que les paiements ne sont pas activés, vos fiches restent masquées dans la Marketplace.
                        Activez Stripe Connect pour les rendre visibles et vendre en direct — commission plateforme
                        d’environ 5 %, payout net versé à l’atelier.
                    </p>
                </div>
            </div>
            <Button
                onClick={activate}
                disabled={onboarding.isPending}
                className="shrink-0 gap-1.5 bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
            >
                {onboarding.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <ExternalLink className="h-4 w-4" />
                )}
                Activer les paiements
            </Button>
        </div>
    );
}

/** Affiche les statistiques du catalogue vendeur connecté. */
function SellerStatsCards() {
    const token = useAuthStore((s) => s.token);
    const { data: stats } = useSellerStats({ enabled: Boolean(token) });
    if (!token || !stats) return null;

    const cards = [
        { label: 'Ventes', value: String(stats.salesCount), icon: ShoppingBag, hint: 'commandes réglées' },
        {
            label: 'Revenus nets',
            value: formatPriceCents(stats.netCents, 'EUR'),
            icon: Wallet,
            hint: `net de ${formatPriceCents(stats.commissionCents, 'EUR')} de commission, hors frais de port`,
        },
        { label: 'Vues', value: String(stats.totalViews), icon: Eye, hint: 'sur vos fiches produit' },
        { label: 'En garde-robe', value: String(stats.wardrobeCount), icon: Archive, hint: 'pièces chez vos clients' },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map((card) => (
                <StatCard key={card.label} {...card} />
            ))}
        </div>
    );
}
