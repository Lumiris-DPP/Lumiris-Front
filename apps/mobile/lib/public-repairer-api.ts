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
