const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export interface DppCertificationPayload {
    name: string;
    customName?: string | null;
    licenseNumber?: string | null;
}

export interface DppMaterialPayload {
    fiber: string;
    percentage: number;
    originCountry: string;
}

export interface DppFormPayload {
    // Étape 1 — Le Produit
    productName?: string | null;
    productDescription?: string | null;
    productCategory?: string | null;
    originCountry?: string | null;
    availableSizes?: string[] | null;
    colors?: string[] | null;
    mainPhotoUrl?: string | null;
    // Étape 2 — Composition & Entretien
    materials?: DppMaterialPayload[] | null;
    careInstructions?: string[] | null;
    certifications?: DppCertificationPayload[] | null;
    // Étape 3 — Traçabilité
    manufacturedAt?: string | null;
    batchNumber?: string | null;
    gtin?: string | null;
    sku?: string | null;
    reachCompliant?: boolean | null;
    // Étape 4 — Éco-Score
    recycledPct?: number | null;
    warrantyDescription?: string | null;
    isRepairable?: boolean | null;
    endOfLifeInstructions?: string | null;
}

export interface DppFormDto extends DppFormPayload {
    id: string;
    createdAt: string;
}

function authHeaders(token: string) {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function submitDppForm(token: string, payload: DppFormPayload): Promise<DppFormDto> {
    const res = await fetch(`${BASE}/api/dpp-forms`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`POST /api/dpp-forms → ${res.status}`);
    return res.json() as Promise<DppFormDto>;
}
