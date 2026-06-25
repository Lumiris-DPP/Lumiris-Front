const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export interface DppFormDto {
    id: string;
    productName: string | null;
    productType: string | null;
    internalReference: string | null;
    retailPrice: number | null;
    currency: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface DppFormPayload {
    productName?: string | null;
    productType?: string | null;
    internalReference?: string | null;
    retailPrice?: number | null;
    currency?: string | null;
    status?: string | null;
}

function headers(token: string) {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function createDppForm(token: string, payload: DppFormPayload = {}): Promise<DppFormDto> {
    const res = await fetch(`${BASE}/api/dpp-forms`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`POST /api/dpp-forms → ${res.status}`);
    return res.json() as Promise<DppFormDto>;
}

export async function patchDppForm(token: string, id: string, payload: DppFormPayload): Promise<DppFormDto> {
    const res = await fetch(`${BASE}/api/dpp-forms/${id}`, {
        method: 'PATCH',
        headers: headers(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`PATCH /api/dpp-forms/${id} → ${res.status}`);
    return res.json() as Promise<DppFormDto>;
}

export async function fetchDppForms(token: string): Promise<DppFormDto[]> {
    const res = await fetch(`${BASE}/api/dpp-forms`, { headers: headers(token) });
    if (!res.ok) throw new Error(`GET /api/dpp-forms → ${res.status}`);
    return res.json() as Promise<DppFormDto[]>;
}

export async function fetchDppForm(token: string, id: string): Promise<DppFormDto> {
    const res = await fetch(`${BASE}/api/dpp-forms/${id}`, { headers: headers(token) });
    if (!res.ok) throw new Error(`GET /api/dpp-forms/${id} → ${res.status}`);
    return res.json() as Promise<DppFormDto>;
}
