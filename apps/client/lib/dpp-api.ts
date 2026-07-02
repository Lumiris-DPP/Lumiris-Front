const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

const PART_NAMES: Record<string, string> = {
    PRODUCT_PHOTO:           'productPhoto',
    REACH_COMPLIANCE:        'reachCompliance',
    EU_DOC_OF_CONFORMITY:    'euDeclaration',
    TEST_REPORTS:            'testReports',
    TRANSACTION_CERTIFICATES:'transactionCerts',
    ORIGIN_CERTIFICATES:     'originCerts',
    REPAIR_MANUAL:           'repairManual',
    CARE_GUIDE:              'careGuide',
    END_OF_LIFE_GUIDE:       'endOfLifeGuide',
    SALE_INVOICE:            'saleInvoice',
    CREATION_PASSPORT:       'creationPassport',
};

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
    // Étape 2 — Composition & Entretien
    materials?: DppMaterialPayload[] | null;
    careInstructions?: string[] | null;
    careNotes?: string | null;
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

export interface DppFormDocumentDto {
    fileId: string;
    documentType: string;
    visibility: string;
    filename: string;
    url: string;
}

export type DppStatus = 'VALID' | 'INVALID';

export interface DppFormDto extends DppFormPayload {
    id: string;
    createdAt: string;
    status: DppStatus;
    mainPhotoUrl: string | null;
    documents: DppFormDocumentDto[];
}

export interface DppFormSummaryDto {
    id: string;
    createdAt: string;
    status: DppStatus;
    productName: string | null;
    productCategory: string | null;
    sku: string | null;
}

function authHeaders(token: string) {
    return { Authorization: `Bearer ${token}` };
}

export interface DppFormCreatedDto {
    id: string;
}

export async function submitDppForm(
    token: string,
    payload: DppFormPayload,
    files: Partial<Record<string, File>>,
): Promise<DppFormCreatedDto> {
    const form = new FormData();
    // Blob avec Content-Type application/json pour que Spring désérialise via @RequestPart
    form.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    for (const [docType, file] of Object.entries(files)) {
        const partName = PART_NAMES[docType];
        if (file && partName) form.append(partName, file);
    }

    const res = await fetch(`${BASE}/api/dpp-forms`, {
        method: 'POST',
        headers: authHeaders(token),
        body: form,
    });
    if (!res.ok) throw new Error(`POST /api/dpp-forms → ${res.status}`);
    return res.json() as Promise<DppFormCreatedDto>;
}

export async function fetchDppForms(token: string): Promise<DppFormSummaryDto[]> {
    const res = await fetch(`${BASE}/api/dpp-forms`, {
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`GET /api/dpp-forms → ${res.status}`);
    return res.json() as Promise<DppFormSummaryDto[]>;
}

export async function fetchDppForm(token: string, id: string): Promise<DppFormDto> {
    const res = await fetch(`${BASE}/api/dpp-forms/${id}`, {
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`GET /api/dpp-forms/${id} → ${res.status}`);
    return res.json() as Promise<DppFormDto>;
}
