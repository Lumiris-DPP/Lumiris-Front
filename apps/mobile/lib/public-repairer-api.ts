const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export interface PublicRepairerDto {
    id: string;
    displayName: string | null;
    companyName: string | null;
    specialties: string[] | null;
    zones: string[] | null;
    schedule: string | null;
    address: string | null;
    city: string | null;
    region: string | null;
    averageRating: number | null;
    reviewCount: number;
    // false = fiche annuaire sans compte (import SIRENE) : bandeau "pas encore dans le réseau".
    claimed: boolean;
    interestCount: number;
}

export interface RepairerReviewDto {
    id: string;
    rating: number;
    comment: string | null;
    reviewerName: string | null;
    createdAt: string;
}

export async function fetchPublicRepairer(id: string): Promise<PublicRepairerDto> {
    const res = await fetch(`${BASE}/v1/repairers/${id}`);
    if (!res.ok) throw new Error(`GET /v1/repairers/${id} → ${res.status}`);
    return res.json() as Promise<PublicRepairerDto>;
}

export async function fetchRepairerReviews(id: string): Promise<RepairerReviewDto[]> {
    const res = await fetch(`${BASE}/v1/repairers/${id}/reviews`);
    if (!res.ok) throw new Error(`GET /v1/repairers/${id}/reviews → ${res.status}`);
    return res.json() as Promise<RepairerReviewDto[]>;
}

// Signal d'intérêt anonyme sur une fiche pas encore réclamée — pas de compte requis.
export async function signalRepairerInterest(id: string): Promise<void> {
    const res = await fetch(`${BASE}/v1/repairers/${id}/interest`, { method: 'POST' });
    if (!res.ok) throw new Error(`POST /v1/repairers/${id}/interest → ${res.status}`);
}
