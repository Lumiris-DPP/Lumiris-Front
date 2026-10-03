'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wand2 } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { useSubscription } from '@/lib/use-subscription';
import { ConvertDppDialog } from './components/convert-dpp-dialog';
import { ProductsTab } from './components/products-tab';
import { VacationBanner } from './components/vacation-banner';
import { SellerConnectBanner, SellerStatsCards } from './components/seller-overview';

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
