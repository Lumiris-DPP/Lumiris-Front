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
    // false = fiche annuaire sans compte (import SIRENE) : bandeau "pas encore dans le réseau".
    claimed: boolean;
    interestCount: number;
}

export async function fetchPublicArtisanProfile(slug: string): Promise<ArtisanPublicProfileDto> {
    const res = await fetch(`${BASE}/v1/artisans/${slug}`);
    if (!res.ok) throw new Error(`GET /v1/artisans/${slug} → ${res.status}`);
    return res.json() as Promise<ArtisanPublicProfileDto>;
}

// Signal d'intérêt anonyme sur une fiche pas encore réclamée — pas de compte requis.
export async function signalArtisanInterest(slug: string): Promise<void> {
    const res = await fetch(`${BASE}/v1/artisans/${slug}/interest`, { method: 'POST' });
    if (!res.ok) throw new Error(`POST /v1/artisans/${slug}/interest → ${res.status}`);
}
