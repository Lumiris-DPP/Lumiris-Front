// Pure derivations from MockVisionUser - no React, no DOM.
// Encodes the V0 business rules: 2-tier ARPU, ESPR-wide wardrobe (textile is one of six),
// 4 user segments, attached-document metadata, RGPD lifecycle states.
// When the backend lands, these helpers become the contract for /vision-users endpoints.

import type { MockVisionUser } from '@lumiris/mock-data';

export const ESPR_CATEGORIES = [
    'textile',
    'electronique',
    'electromenager',
    'mobilier',
    'batteries',
    'autres',
] as const;
export type EsprCategory = (typeof ESPR_CATEGORIES)[number];

export const ESPR_CATEGORY_LABEL: Record<EsprCategory, string> = {
    textile: 'Textile',
    electronique: 'Électronique',
    electromenager: 'Électroménager',
    mobilier: 'Mobilier',
    batteries: 'Batteries',
    autres: 'Autres',
};

export const SEGMENT_KEYS = ['top_scanner', 'wardrobe_rich', 'churn_risk', 'affiliation_plus'] as const;
export type SegmentKey = (typeof SEGMENT_KEYS)[number];

interface SegmentMeta {
    label: string;
    tone: string;
    hint: string;
}

export const SEGMENT_META: Record<SegmentKey, SegmentMeta> = {
    top_scanner: {
        label: 'Top scanner',
        tone: 'border-lumiris-cyan/40 bg-lumiris-cyan/10 text-lumiris-cyan',
        hint: '> 20 scans sur 30 j',
    },
    wardrobe_rich: {
        label: 'Garde-Robe riche',
        tone: 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald',
        hint: '> 30 produits',
    },
    churn_risk: {
        label: 'Risque churn',
        tone: 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber',
        hint: '0 scan / 60 j',
    },
    affiliation_plus: {
        label: 'Affiliation+',
        tone: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose',
        hint: '> 50 € de commissions cumulées',
    },
};

export const TIER_OPTIONS = ['all', 'with_account', 'anonymous'] as const;
export type TierFilter = (typeof TIER_OPTIONS)[number];

export const RGPD_STATUS_OPTIONS = ['all', 'none', 'requested', 'pending_deletion', 'completed'] as const;
export type RgpdStatusFilter = (typeof RGPD_STATUS_OPTIONS)[number];

export const ARPU_NO_ACCOUNT_EUR = 2;
export const ARPU_WITH_ACCOUNT_EUR = 3.8;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(later: Date, earlier: Date): number {
    return Math.floor((later.getTime() - earlier.getTime()) / MS_PER_DAY);
}

// Deterministic FNV-1a 32-bit hash. Used to derive stable synthetic numbers per user.id
// so segments / breakdown / documents stay identical across renders and mock generations.
function hash(input: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i += 1) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

function pick(hashValue: number, slot: number, modulus: number): number {
    const rotated = (hashValue >>> (slot * 5)) ^ Math.imul(hashValue, slot + 1);
    return (rotated >>> 0) % modulus;
}

function lastSeenWithin(user: MockVisionUser, now: Date, days: number): boolean {
    if (!user.lastSeenAt) return false;
    return daysBetween(now, new Date(user.lastSeenAt)) <= days;
}

export function getScans30d(user: MockVisionUser, now: Date): number {
    if (!user.lastSeenAt) return 0;
    const since = daysBetween(now, new Date(user.lastSeenAt));
    if (since > 30) return 0;
    if (since <= 7) return user.scansCount;
    const decay = 1 - (since - 7) / 30;
    return Math.max(0, Math.round(user.scansCount * decay));
}

export function isMauActive(user: MockVisionUser, now: Date): boolean {
    if (user.anon) return false;
    if (user.erased) return false;
    return lastSeenWithin(user, now, 30);
}

// Average commission per scan ≈ 1.5 € — purely illustrative, no business meaning yet.
export function getAffiliationCommissionsEur(user: MockVisionUser): number {
    if (user.anon || !user.consentAffiliation) return 0;
    const seed = hash(`${user.id}:affil`);
    const base = (seed % 80) + user.scansCount * 1.5;
    return Math.round(base);
}

interface CategoryBreakdownEntry {
    category: EsprCategory;
    count: number;
}

// Wardrobe is global multi-secteurs by design (V0). For now passports are textile-only,
// so the non-textile counters are synthesized deterministically from user.id to demonstrate
// the breakdown UI. Wired to real attachments once the inventory backend ships.
export function getCategoryBreakdown(user: MockVisionUser): readonly CategoryBreakdownEntry[] {
    if (user.erased) return ESPR_CATEGORIES.map((c) => ({ category: c, count: 0 }));
    const textile = user.wardrobePassportIds.length;
    const seed = hash(`${user.id}:wardrobe`);
    const activityFactor = Math.min(1, user.scansCount / 12);
    const entries: CategoryBreakdownEntry[] = [
        { category: 'textile', count: textile },
        { category: 'electronique', count: Math.round(pick(seed, 1, 14) * activityFactor) + (textile > 0 ? 1 : 0) },
        { category: 'electromenager', count: Math.round(pick(seed, 2, 9) * activityFactor) },
        { category: 'mobilier', count: Math.round(pick(seed, 3, 7) * activityFactor) },
        { category: 'batteries', count: Math.round(pick(seed, 4, 12) * activityFactor) },
        { category: 'autres', count: Math.round(pick(seed, 5, 5) * activityFactor) },
    ];
    return entries;
}

export function totalWardrobeSize(user: MockVisionUser): number {
    return getCategoryBreakdown(user).reduce((sum, e) => sum + e.count, 0);
}

export const DOCUMENT_TYPES = ['facture', 'garantie', 'assurance', 'reparation', 'autre'] as const;
type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
    facture: 'Facture',
    garantie: 'Garantie',
    assurance: 'Contrat assurance',
    reparation: 'Ticket réparation',
    autre: 'Autre',
};

interface AttachedDocument {
    /** Metadata-only handle. The encrypted payload never reaches the admin surface. */
    id: string;
    type: DocumentType;
    productLabel: string;
    uploadedAt: string;
    sizeBytes: number;
}

const PRODUCT_LABELS: Record<EsprCategory, readonly string[]> = {
    textile: ['Chemise lin Marie', 'Pull mérinos Claire', 'Veste Théo'],
    electronique: ['MacBook Pro 14', 'iPhone 15', 'Casque Sony WH-1000'],
    electromenager: ['Lave-linge Bosch', 'Aspirateur Dyson', 'Four Miele'],
    mobilier: ['Canapé Ligne Roset', 'Table chêne', 'Chaise Eames'],
    batteries: ['Powerbank Anker', 'Batterie e-bike VanMoof', 'UPS APC'],
    autres: ['Vélo Brompton', 'Console Switch', 'Trottinette Xiaomi'],
};

export function getDocuments(user: MockVisionUser): readonly AttachedDocument[] {
    if (user.erased || user.anon) return [];
    const seed = hash(`${user.id}:docs`);
    const count = (seed % 6) + 1;
    const docs: AttachedDocument[] = [];
    const created = new Date(user.createdAt).getTime();
    for (let i = 0; i < count; i += 1) {
        const type = DOCUMENT_TYPES[pick(seed, i, DOCUMENT_TYPES.length)] ?? 'autre';
        const category = ESPR_CATEGORIES[pick(seed, i + 6, ESPR_CATEGORIES.length)] ?? 'autres';
        const labels = PRODUCT_LABELS[category];
        const productLabel = labels[pick(seed, i + 12, labels.length)] ?? '-';
        const dayOffset = pick(seed, i + 18, 200);
        const uploadedAt = new Date(created + dayOffset * MS_PER_DAY).toISOString();
        const sizeKB = 80 + pick(seed, i + 24, 4800);
        docs.push({
            id: `${user.id}-DOC-${i + 1}`,
            type,
            productLabel,
            uploadedAt,
            sizeBytes: sizeKB * 1024,
        });
    }
    return docs;
}

export function getRgpdStatus(user: MockVisionUser): 'none' | 'requested' | 'pending_deletion' | 'completed' {
    if (user.erased) return 'completed';
    const reqs = user.rgpdRequests ?? [];
    if (reqs.some((r) => r.kind === 'erase' && r.status === 'pending')) return 'pending_deletion';
    if (reqs.some((r) => r.kind === 'export' && r.status === 'pending')) return 'requested';
    if (reqs.length > 0) return 'completed';
    return 'none';
}

export type RgpdLocalStatus = ReturnType<typeof getRgpdStatus>;

export function getSegments(user: MockVisionUser, now: Date): readonly SegmentKey[] {
    if (user.anon || user.erased) return [];
    const segments: SegmentKey[] = [];
    if (getScans30d(user, now) > 20) segments.push('top_scanner');
    if (totalWardrobeSize(user) > 30) segments.push('wardrobe_rich');
    if (user.lastSeenAt && daysBetween(now, new Date(user.lastSeenAt)) > 60) segments.push('churn_risk');
    if (getAffiliationCommissionsEur(user) > 50) segments.push('affiliation_plus');
    return segments;
}

export interface KpiTile {
    label: string;
    value: string;
}

export interface TierKpis {
    count: number;
    arpuEur: number;
    tiles: readonly KpiTile[];
}

export function computeTierKpis(users: readonly MockVisionUser[], now: Date): { anon: TierKpis; account: TierKpis } {
    const anonUsers = users.filter((u) => u.anon);
    const accountUsers = users.filter((u) => !u.anon && !u.erased);

    const anonScans30d = anonUsers.reduce((sum, u) => sum + getScans30d(u, now), 0);

    // Anon → account conversion proxy: accounts created in the last 30 j, normalized over
    // the funnel top (anon sessions + new accounts) on the same window.
    const newAccounts30d = accountUsers.filter((u) => daysBetween(now, new Date(u.createdAt)) <= 30).length;
    const funnelTop = newAccounts30d + anonUsers.filter((u) => lastSeenWithin(u, now, 30)).length;
    const conversionPct = funnelTop === 0 ? 0 : (newAccounts30d / funnelTop) * 100;

    const mauReal = accountUsers.filter((u) => isMauActive(u, now)).length;
    const avgWardrobe =
        accountUsers.length === 0
            ? 0
            : accountUsers.reduce((sum, u) => sum + totalWardrobeSize(u), 0) / accountUsers.length;

    return {
        anon: {
            count: anonUsers.length,
            arpuEur: ARPU_NO_ACCOUNT_EUR,
            tiles: [
                { label: 'Scans 30 j', value: anonScans30d.toString() },
                { label: 'ARPU théorique', value: `${ARPU_NO_ACCOUNT_EUR.toString().replace('.', ',')} €/an` },
                { label: 'Conversion 30 j', value: `${conversionPct.toFixed(0)}%` },
            ],
        },
        account: {
            count: accountUsers.length,
            arpuEur: ARPU_WITH_ACCOUNT_EUR,
            tiles: [
                { label: 'MAU réel', value: mauReal.toString() },
                { label: 'ARPU théorique', value: `${ARPU_WITH_ACCOUNT_EUR.toString().replace('.', ',')} €/an` },
                { label: 'Garde-Robe moyenne', value: avgWardrobe.toFixed(1) },
            ],
        },
    };
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
