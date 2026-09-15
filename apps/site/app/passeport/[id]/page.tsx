import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/features/json-ld';
import { PassportPublicViewSection } from '@/features/passport-public-view';
import { fetchPublicPassport, passportProductName } from '@/lib/public-passport-api';

interface RouteProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
    const { id } = await params;
    const passport = await fetchPublicPassport(id);
    if (!passport) return {};

    const { view } = passport;
    const grade = view.irisScore?.grade ?? null;
    const productName = passportProductName(view.passport);
    const title = `${productName} | ${view.artisan.atelierName} - LUMIRIS`;
    const description = grade
        ? `Passeport numérique : matières, fabrication, certifications. Score Iris ${grade}. ${view.excerpt}`
        : `Passeport numérique : matières, fabrication, certifications. ${view.excerpt}`;
    const canonical = `/passeport/${view.passport.id}`;
    const photo = view.passport.garment.mainPhotoUrl;

    return {
        title,
        description,
        alternates: { canonical },
        // Catalogue de démonstration : indexer ces fiches promettrait une traçabilité qui n'existe pas.
        robots: { index: false, follow: false },
        openGraph: {
            type: 'article',
            url: canonical,
            title,
            description,
            images: photo ? [{ url: photo }] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: photo ? [photo] : undefined,
        },
    };
}

export default async function PassportPage({ params }: RouteProps) {
    const { id } = await params;
    const passport = await fetchPublicPassport(id);
    if (!passport) notFound();

    const { view } = passport;
    const grade = view.irisScore?.grade;

    const productJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: passportProductName(view.passport),
        description: view.excerpt,
        image: view.passport.garment.mainPhotoUrl || undefined,
        sku: view.passport.garment.reference,
        gtin14: view.passport.gs1.gtin,
        manufacturer: {
            '@type': 'Organization',
            name: view.artisan.atelierName,
            address: {
                '@type': 'PostalAddress',
                addressLocality: view.artisan.city,
                addressRegion: view.artisan.region,
                addressCountry: 'FR',
            },
        },
        countryOfOrigin: 'FR',
        offers:
            view.passport.garment.retailPrice && view.passport.garment.retailPrice > 0
                ? {
                      '@type': 'Offer',
                      priceCurrency: view.passport.garment.currency,
                      price: view.passport.garment.retailPrice,
                      availability: 'https://schema.org/InStock',
                  }
                : undefined,
        additionalProperty: grade
            ? [
                  {
                      '@type': 'PropertyValue',
                      name: 'Score Iris',
                      value: grade,
                  },
              ]
            : undefined,
    };

    return (
        <>
            <JsonLd data={productJsonLd} />
            <PassportPublicViewSection {...passport} />
        </>
    );
}
