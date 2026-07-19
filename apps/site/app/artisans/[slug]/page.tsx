import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArtisanPublicView } from '@/features/artisan-public-view';
import { JsonLd } from '@/features/json-ld';
import { fetchPublicArtisanProfile } from '@/lib/public-artisan-api';

interface RouteProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
    const { slug } = await params;
    const artisan = await fetchPublicArtisanProfile(slug);
    if (!artisan) return {};

    const name = artisan.atelierName ?? artisan.displayName ?? 'Atelier';
    const title = artisan.city ? `${name} - ${artisan.city} | Artisan textile LUMIRIS` : `${name} | LUMIRIS`;
    const description = artisan.story
        ? artisan.story.length > 160
            ? `${artisan.story.slice(0, 157).trimEnd()}…`
            : artisan.story
        : undefined;
    const canonical = `/artisans/${artisan.slug}`;

    return {
        title,
        description,
        alternates: { canonical },
        openGraph: {
            type: 'profile',
            url: canonical,
            title,
            description,
            images: artisan.photoUrls[0] ? [{ url: artisan.photoUrls[0] }] : undefined,
        },
    };
}

export default async function ArtisanPage({ params }: RouteProps) {
    const { slug } = await params;
    const artisan = await fetchPublicArtisanProfile(slug);
    if (!artisan) notFound();

    const name = artisan.atelierName ?? artisan.displayName ?? 'Atelier';
    const localBusinessJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `https://lumiris.fr/artisans/${artisan.slug}`,
        name,
        description: artisan.story ?? undefined,
        url: `https://lumiris.fr/artisans/${artisan.slug}`,
        sameAs: artisan.websiteUrl ? [artisan.websiteUrl] : undefined,
        image: artisan.photoUrls[0] || undefined,
        address: artisan.city
            ? {
                  '@type': 'PostalAddress',
                  addressLocality: artisan.city,
                  addressRegion: artisan.region ?? undefined,
                  addressCountry: 'FR',
              }
            : undefined,
    };

    return (
        <>
            <JsonLd data={localBusinessJsonLd} />
            <ArtisanPublicView artisan={artisan} />
        </>
    );
}
