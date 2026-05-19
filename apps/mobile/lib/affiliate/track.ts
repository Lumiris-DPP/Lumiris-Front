// Affiliate click tracking - local-only stub for the MVP. À remplacer par appel
// `/v1/track/affiliate` quand l'API LUMIRIS sera prête (POST { source, ...payload, ts }
// - backend dédupe + signe la commission).

import { readUser } from '../auth/storage';
import { USER_KEYS, userScopedKey } from '../storage-keys';

interface PassportBuyPayload {
    source: 'passport-buy';
    passportId: string;
    artisanId: string;
    websiteUrl: string;
}

interface RepairRequestPayload {
    source: 'repair-request';
    repairerId: string;
    passportId: string | null;
    requestId: string;
}

type AffiliateClickPayload = PassportBuyPayload | RepairRequestPayload;

type AffiliateClickRecord = AffiliateClickPayload & { ts: string };

function currentKey(): string {
    return userScopedKey(readUser()?.id ?? null, USER_KEYS.affiliateClicks);
}

function read(): AffiliateClickRecord[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(currentKey());
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as AffiliateClickRecord[]) : [];
    } catch {
        return [];
    }
}

export function trackAffiliateClick(payload: AffiliateClickPayload): void {
    if (typeof window === 'undefined') return;
    const record = { ...payload, ts: new Date().toISOString() } as AffiliateClickRecord;
    try {
        const next = [...read(), record];
        window.localStorage.setItem(currentKey(), JSON.stringify(next));
    } catch {
        // localStorage indisponible (mode privé / quota) - on retombe sur le log dev.
    }
    if (process.env.NODE_ENV !== 'production') {
        console.info('[affiliate]', record);
    }
}
