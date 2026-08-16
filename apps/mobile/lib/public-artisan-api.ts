const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

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

export async function fetchPublicArtisanProfile(slug: string): Promise<ArtisanPublicProfileDto> {
    const res = await fetch(`${BASE}/v1/artisans/${slug}`);
    if (!res.ok) throw new Error(`GET /v1/artisans/${slug} → ${res.status}`);
    return res.json() as Promise<ArtisanPublicProfileDto>;
}
