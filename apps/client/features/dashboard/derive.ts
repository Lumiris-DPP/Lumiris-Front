import { mockInvoices, mockCertificates } from '@lumiris/mock-data';
import { ARTISAN_PASSPORT_LIMIT } from '@lumiris/types';
import type { Artisan, ArtisanTier, Certificate, Passport, ScoreResult, SupplierInvoice } from '@lumiris/types';
import { MOCK_CERT_TO_ARTISAN } from '@/lib/certificates-store';
import { mockInvoiceArtisanId } from '@/lib/invoices-store';

export interface ScoredPassport {
    passport: Passport;
    score: ScoreResult;
}

const ATELIER_INVOICES_KEY = 'atelier-invoices';
const ATELIER_CERTS_KEY = 'atelier-certs';

function readPersistedByArtisan<T>(key: string, artisanId: string): readonly T[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as { state?: { byArtisan?: Record<string, T[]> } } | null;
        const list = parsed?.state?.byArtisan?.[artisanId];
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function dedupeById<T extends { id: string }>(...sources: ReadonlyArray<readonly T[]>): T[] {
    const seen = new Map<string, T>();
    for (const source of sources) {
        for (const item of source) {
            seen.set(item.id, item);
        }
    }
    return [...seen.values()];
}

export function loadMergedInvoices(artisanId: string): readonly SupplierInvoice[] {
    const local = readPersistedByArtisan<SupplierInvoice>(ATELIER_INVOICES_KEY, artisanId);
    const scopedMocks = mockInvoices.filter((inv) => mockInvoiceArtisanId(inv) === artisanId);
    return dedupeById<SupplierInvoice>(scopedMocks, local);
}

export function loadMergedCertificates(artisanId: string): readonly Certificate[] {
    const local = readPersistedByArtisan<Certificate>(ATELIER_CERTS_KEY, artisanId);
    const scopedMocks = mockCertificates.filter((c) => MOCK_CERT_TO_ARTISAN[c.id] === artisanId);
    return dedupeById<Certificate>(scopedMocks, local);
}

export interface OnboardingItem {
    key: 'profile' | 'invoice' | 'passport';
    label: string;
    href: string;
    done: boolean;
}

export function onboardingChecklist(
    artisan: Artisan,
    passports: readonly Passport[],
    invoices: readonly SupplierInvoice[],
): readonly OnboardingItem[] {
    const profileComplete =
        artisan.story.trim().length > 0 && artisan.specialities.length > 0 && artisan.photoUrl.trim().length > 0;
    return [
        {
            key: 'profile',
            label: 'Complétez votre profil atelier',
            href: '/profile',
            done: profileComplete,
        },
        {
            key: 'invoice',
            label: 'Ajoutez une première facture fournisseur',
            href: '/invoices',
            done: invoices.length > 0,
        },
        {
            key: 'passport',
            label: 'Créez votre premier passeport',
            href: '/create',
            done: passports.length > 0,
        },
    ];
}

export interface ExpiringCertificate {
    certificate: Certificate;
    daysRemaining: number;
}

export function expiringCertificates(
    certificates: readonly Certificate[],
    now: Date,
    withinDays = 90,
): readonly ExpiringCertificate[] {
    const ms = now.getTime();
    const horizon = withinDays * 24 * 60 * 60 * 1000;
    const list: ExpiringCertificate[] = [];
    for (const cert of certificates) {
        const expiresAt = new Date(cert.expiresAt).getTime();
        if (!Number.isFinite(expiresAt)) continue;
        const delta = expiresAt - ms;
        if (delta < 0 || delta > horizon) continue;
        list.push({ certificate: cert, daysRemaining: Math.ceil(delta / (24 * 60 * 60 * 1000)) });
    }
    list.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return list;
}

export function incompletePassports(scored: readonly ScoredPassport[]): readonly ScoredPassport[] {
    return scored.filter((s) => s.passport.status === 'InCompletion' || s.score.cap?.applied === true);
}

export interface QuotaUsage {
    used: number;
    total: number;
    percent: number;
}

export function quotaUsage(passports: readonly Passport[], tier: ArtisanTier): QuotaUsage {
    const activePassports = passports.filter((p) => p.status !== 'Draft');
    const used = activePassports.length;
    const total = ARTISAN_PASSPORT_LIMIT[tier];
    const percent = Number.isFinite(total) && total > 0 ? Math.round((used / total) * 100) : 0;
    return { used, total, percent };
}
