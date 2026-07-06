'use client';

import { BarChart3, Sparkles } from 'lucide-react';
import { EmptyState } from '@/features/empty-state';
import { useBilling, useBillingHydrated } from '@/lib/billing-store';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { usePassports } from '@/lib/passports-source';
import { ScansSection } from './scans-section';
import { PerformanceSection } from './performance-section';
import { TopPassportsSection } from './top-passports-section';

export function Analytics() {
    const artisan = useCurrentArtisan();
    const billing = useBilling(artisan.id);
    const hydrated = useBillingHydrated();
    const passports = usePassports(artisan.id);

    if (!hydrated) {
        return (
            <div className="text-muted-foreground flex flex-col items-center gap-3 px-8 py-16 text-sm">
                <Sparkles className="text-lumiris-amber h-6 w-6" />
                Vérification de l’accès ATELIER+…
            </div>
        );
    }

    if (!billing.atelierPlus) {
        return (
            <div className="p-4 md:p-8">
                <EmptyState
                    icon={Sparkles}
                    tone="amber"
                    title="Analytics nécessite ATELIER+"
                    description="Activez ATELIER+ pour suivre vos scans QR, votre score Iris vs marché et vos pièces les plus vues."
                    cta={{ label: 'Activer ATELIER+', href: '/subscription?upsell=analytics' }}
                />
            </div>
        );
    }

    if (passports.length === 0) {
        return (
            <div className="p-4 md:p-8">
                <EmptyState
                    icon={BarChart3}
                    title="Aucune statistique pour l’instant"
                    description="Publiez votre premier passeport pour voir vos scans, votre score Iris et vos pièces les plus vues."
                    cta={{ label: 'Créer mon premier passeport', href: '/create' }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-8">
            <ScansSection artisanId={artisan.id} />
            <PerformanceSection artisanId={artisan.id} />
            <TopPassportsSection artisanId={artisan.id} />
        </div>
    );
}
