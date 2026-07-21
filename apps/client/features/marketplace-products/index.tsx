'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Archive, ExternalLink, Eye, EyeOff, Loader2, ShoppingBag, Wallet, Wand2 } from 'lucide-react';
import { useSellerStats, useSellerStatus, useStartSellerOnboarding } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { toast } from '@lumiris/ui/components/sonner';
import { formatPriceCents } from '@lumiris/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useSubscription } from '@/lib/use-subscription';
import { ConvertDppDialog } from './convert-dpp-dialog';
import { ProductsTab } from './products-tab';

export function MarketplaceProducts() {
    const [convertOpen, setConvertOpen] = useState(false);
    // Vendre exige un abonnement ATELIER actif : on pré-désactive la conversion sinon (le
    // backend renvoie 422). Le blocage ne s'applique qu'en mode réel.
    const { hasActiveSubscription, isRealMode } = useSubscription();
    const sellBlocked = isRealMode && !hasActiveSubscription;

    return (
        <div className="space-y-4 p-8">
            <SellerConnectBanner />
            <SellerStatsCards />

            <div className="flex flex-col items-end gap-1.5">
                <Button
                    onClick={() => setConvertOpen(true)}
                    disabled={sellBlocked}
                    title={sellBlocked ? 'Abonnement ATELIER requis pour vendre' : undefined}
                    className="bg-lumiris-cyan hover:bg-lumiris-cyan/90 text-white"
                >
                    <Wand2 className="mr-1.5 h-4 w-4" /> Convertir un DPP en produit
                </Button>
                {sellBlocked && (
                    <p className="text-muted-foreground text-xs">
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

function SellerConnectBanner() {
    const token = useAuthStore((s) => s.token);
    const { data: status } = useSellerStatus({ enabled: Boolean(token) });
    const onboarding = useStartSellerOnboarding();

    // Une fois les paiements activés, plus de bandeau : l'activation est acquise.
    if (!token || status?.chargesEnabled) return null;

    // Onboarding Stripe Connect en redirection pure (page hébergée Stripe), pas d'intégration front.
    const activate = () =>
        onboarding.mutate(undefined, {
            onSuccess: ({ url }) => {
                window.location.href = url;
            },
            onError: () => toast.error("Impossible d'ouvrir l'onboarding des paiements."),
        });

    return (
        <div className="border-lumiris-amber/40 bg-lumiris-amber/10 flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-2.5 text-sm">
                <EyeOff className="text-lumiris-amber mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div>
                    <p className="text-foreground font-medium">
                        Vos produits publiés ne sont pas encore visibles par les acheteurs
                    </p>
                    <p className="text-muted-foreground text-xs">
                        Tant que les paiements ne sont pas activés, vos fiches restent masquées dans la Marketplace.
                        Activez Stripe Connect pour les rendre visibles et vendre en direct — commission plateforme
                        d’environ 5 %, payout net versé à l’atelier.
                    </p>
                </div>
            </div>
            <Button
                onClick={activate}
                disabled={onboarding.isPending}
                className="bg-lumiris-cyan hover:bg-lumiris-cyan/90 shrink-0 gap-1.5 text-white"
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

// Tableau de bord vendeur : ventes, revenus nets (net de commission), vues, pièces en garde-robe.
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
            hint: `net de ${formatPriceCents(stats.commissionCents, 'EUR')} de commission`,
        },
        { label: 'Vues', value: String(stats.totalViews), icon: Eye, hint: 'sur vos fiches produit' },
        { label: 'En garde-robe', value: String(stats.wardrobeCount), icon: Archive, hint: 'pièces chez vos clients' },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map(({ label, value, icon: Icon, hint }) => (
                <div key={label} className="bg-card rounded-xl border p-4">
                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                    </div>
                    <p className="text-foreground mt-1 text-2xl font-semibold tabular-nums">{value}</p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">{hint}</p>
                </div>
            ))}
        </div>
    );
}
