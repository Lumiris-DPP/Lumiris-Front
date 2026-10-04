'use client';

import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { useSubscription } from '@/lib/use-subscription';
import { ConvertDppDialog } from './components/convert-dpp-dialog';
import { ProductsTab } from './components/products-tab';
import { VacationBanner } from './components/vacation-banner';
import { SellerConnectBanner, SellerStatsCards } from './components/seller-overview';
import { SubscriptionSaleNotice } from './components/subscription-sale-notice';

export function MarketplaceProducts() {
    const [convertOpen, setConvertOpen] = useState(false);

    const { saleState } = useSubscription();
    const sellBlocked = saleState !== 'active';

    return (
        <div className="space-y-4 p-8">
            <SellerConnectBanner />
            <VacationBanner />
            <SellerStatsCards />

            <div className="flex flex-col items-end gap-1.5">
                <Button
                    onClick={() => !sellBlocked && setConvertOpen(true)}
                    disabled={sellBlocked}
                    className="bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
                >
                    <Wand2 className="mr-1.5 h-4 w-4" /> Convertir un DPP en produit
                </Button>
                <SubscriptionSaleNotice />
            </div>

            <ProductsTab onCreate={() => !sellBlocked && setConvertOpen(true)} />

            <ConvertDppDialog open={convertOpen} onOpenChange={setConvertOpen} />
        </div>
    );
}
