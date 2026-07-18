const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export interface DppMaterialDto {
    fiber: string;
    percentage: number;
    originCountry: string;
}

export interface DppDocumentDto {
    fileId: string;
    documentType: string;
    visibility: string;
    filename: string;
    url: string;
}

export interface DppFormDto {
    id: string;
    publicCode: string;
    createdAt: string;
    status: string;
    mainPhotoUrl: string | null;
    productName: string | null;
    productDescription: string | null;
    productCategory: string | null;
    originCountry: string | null;
    availableSizes: string[] | null;
    colors: string[] | null;
    materials: DppMaterialDto[] | null;
    careInstructions: string[] | null;
    careNotes: string | null;
    manufacturedAt: string | null;
    batchNumber: string | null;
    gtin: string | null;
    sku: string | null;
    reachCompliant: boolean | null;
    recycledPct: number | null;
    warrantyDescription: string | null;
    isRepairable: boolean | null;
    endOfLifeInstructions: string | null;
    documents: DppDocumentDto[];
}

export interface IrisScoreDto {
    total: number;
    grade: string;
    breakdown: {
        transparency: number;
        craftsmanship: number;
        impact: number;
        repairability: number;
    };
}

export interface DppFormPublicDto {
    dpp: DppFormDto;
    irisScore: IrisScoreDto | null;
}

export type DppEventActorType = 'MANUFACTURER' | 'DISTRIBUTOR' | 'RETAILER' | 'CONSUMER' | 'REPAIRER' | 'RECYCLER';

export interface DppEventDto {
    id: string;
    occurredAt: string;
    description: string;
    actorType: DppEventActorType;
    createdAt: string | null;
}

export async function fetchPublicDppForm(code: string): Promise<DppFormPublicDto> {
    const res = await fetch(`${BASE}/public/dpp_forms/${code}`);
    if (!res.ok) throw new Error(`GET /public/dpp_forms/${code} → ${res.status}`);
    return res.json() as Promise<DppFormPublicDto>;
}

export async function fetchPublicDppEvents(code: string): Promise<DppEventDto[]> {
    const res = await fetch(`${BASE}/public/dpp_forms/${code}/events`);
    if (!res.ok) throw new Error(`GET /public/dpp_forms/${code}/events → ${res.status}`);
    return res.json() as Promise<DppEventDto[]>;
}
