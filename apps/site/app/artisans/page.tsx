import type { Metadata } from 'next';
import { ArtisansDirectory } from '@/features/artisans-directory';
import { fetchPublicArtisans } from '@/lib/public-artisan-api';

export const metadata: Metadata = {
    title: 'Annuaire des artisans textiles français',
    description:
        'Tous les ateliers textiles français qui publient leurs passeports DPP sur LUMIRIS. Couture, tissage, bonneterie, cordonnerie, broderie - partout en France.',
    alternates: { canonical: '/artisans' },
};

export default async function ArtisansPage() {
    return (
        <div className="pt-28 pb-20">
            <header className="mx-auto mb-12 max-w-5xl px-6">
                <p className="mb-4 text-xs font-medium tracking-[0.25em] text-muted-foreground uppercase">Artisans</p>
                <h1 className="text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl">
                    Les artisans textiles français
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground">
                    Tous les ateliers qui publient leurs passeports DPP sur LUMIRIS - couture, tissage, bonneterie,
                    cordonnerie, broderie. Cliquez sur un atelier pour voir ses pièces.
                </p>
            </header>

            <ArtisansDirectory artisans={await fetchPublicArtisans()} />
        </div>
    );
}
