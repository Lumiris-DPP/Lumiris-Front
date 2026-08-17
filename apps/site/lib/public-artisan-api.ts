import { env } from '@/env';

export interface ArtisanPublicProfileDto {
    slug: string;
    displayName: string | null;
    atelierName: string | null;
    story: string | null;
    method: string | null;
    journey: string | null;
    specialties: string[] | null;
    city: string | null;
    region: string | null;
    websiteUrl: string | null;
    links: Record<string, string> | null;
    photoUrls: string[];
    epvLabeled: boolean;
    ofgLabeled: boolean;
    gotsLabeled: boolean;
    oekoTexLabeled: boolean;
    /** Date de retour de l'atelier, absente quand il n'est pas en congés. */
    pausedUntil?: string | null;
}

/**
 * Annuaire public. Les erreurs réseau renvoient une liste vide plutôt qu'une exception :
 * la page et le sitemap sont prérendus au build, et une API injoignable ne doit pas
 * faire échouer le build du site vitrine.
 */
export async function fetchPublicArtisans(): Promise<readonly ArtisanPublicProfileDto[]> {
    try {
        const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/v1/artisans`, {
            next: { revalidate: 300 },
        });
        if (!res.ok) {
            console.error(`GET /v1/artisans → ${res.status}`);
            return [];
        }
        return (await res.json()) as ArtisanPublicProfileDto[];
    } catch (error) {
        console.error('GET /v1/artisans injoignable', error);
        return [];
    }
}

export async function fetchPublicArtisanProfile(slug: string): Promise<ArtisanPublicProfileDto | null> {
    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/v1/artisans/${slug}`, {
        next: { revalidate: 300 },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GET /v1/artisans/${slug} → ${res.status}`);
    return res.json() as Promise<ArtisanPublicProfileDto>;
}
