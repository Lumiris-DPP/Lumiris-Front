import type { AffiliationEvent } from '@lumiris/types';

export const ANONYMISATION_THRESHOLD_DAYS = 30;
export const NOW_REF = new Date('2026-04-30T08:00:00Z').getTime();

// Burst: > 5 events / actor / 10 min (Chiffrage v4.2 § 7.4).
const BURST_WINDOW_MS = 10 * 60_000;
export const BURST_THRESHOLD = 5;

// Geo improbable: 2 events > 500 km en < 1h pour un même userId.
const GEO_DISTANCE_KM = 500;
const GEO_TIME_MS = 60 * 60_000;

export function anonymiseUserId(userId: string, occurredAt: string): string {
    const ageDays = (NOW_REF - new Date(occurredAt).getTime()) / 86_400_000;
    if (ageDays < ANONYMISATION_THRESHOLD_DAYS) return userId;
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
    }
    return `user_anon_${(hash & 0xfff).toString(16).padStart(3, '0')}`;
}

export interface SuspiciousFlag {
    burst?: { count: number; windowMinutes: number };
    selfBooking?: boolean;
    geo?: { distanceKm: number };
}

interface Coord {
    lat: number;
    lng: number;
    city: string;
}

// En prod chaque event porte sa géolocalisation IP. Ce mock attache une ville stable
// par userId (utilisateur sédentaire) → la règle geo est armée mais ne flagge pas les patterns
// existants. La fonction est isolée pour qu'un backend puisse la remplacer.
// Typée comme tuple non-vide pour que `CITY_BANK[0]` soit garanti défini côté TS.
const CITY_BANK = [
    { lat: 48.86, lng: 2.35, city: 'Paris' },
    { lat: 43.3, lng: 5.37, city: 'Marseille' },
    { lat: 45.75, lng: 4.85, city: 'Lyon' },
    { lat: 47.21, lng: -1.55, city: 'Nantes' },
    { lat: 50.63, lng: 3.07, city: 'Lille' },
] as const satisfies readonly [Coord, ...Coord[]];

function userCoord(userId: string): Coord {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
    return CITY_BANK[hash % CITY_BANK.length] ?? CITY_BANK[0];
}

function haversineKm(a: Coord, b: Coord): number {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLng / 2);
    const aa = s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2;
    return R * 2 * Math.asin(Math.sqrt(aa));
}

export function buildSuspicionMap(events: readonly AffiliationEvent[]): Map<string, SuspiciousFlag> {
    const out = new Map<string, SuspiciousFlag>();

    const byUser = new Map<string, AffiliationEvent[]>();
    for (const e of events) {
        const list = byUser.get(e.userId) ?? [];
        list.push(e);
        byUser.set(e.userId, list);
    }

    for (const [, list] of byUser) {
        if (list.length <= BURST_THRESHOLD) continue;
        const sorted = [...list].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
        for (let i = 0; i < sorted.length; i++) {
            const head = sorted[i];
            if (!head) continue;
            const start = new Date(head.occurredAt).getTime();
            const win: AffiliationEvent[] = [];
            for (let j = i; j < sorted.length; j++) {
                const cursor = sorted[j];
                if (!cursor) continue;
                const t = new Date(cursor.occurredAt).getTime();
                if (t - start > BURST_WINDOW_MS) break;
                win.push(cursor);
            }
            if (win.length > BURST_THRESHOLD) {
                for (const e of win) {
                    const flag = out.get(e.id) ?? {};
                    flag.burst = { count: win.length, windowMinutes: BURST_WINDOW_MS / 60_000 };
                    out.set(e.id, flag);
                }
            }
        }
    }

    for (const e of events) {
        if (e.userId === e.beneficiaryId) {
            const flag = out.get(e.id) ?? {};
            flag.selfBooking = true;
            out.set(e.id, flag);
        }
    }

    for (const [userId, list] of byUser) {
        if (list.length < 2) continue;
        const sorted = [...list].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
        for (let i = 0; i < sorted.length - 1; i++) {
            const left = sorted[i];
            if (!left) continue;
            const ti = new Date(left.occurredAt).getTime();
            for (let j = i + 1; j < sorted.length; j++) {
                const right = sorted[j];
                if (!right) continue;
                const tj = new Date(right.occurredAt).getTime();
                if (tj - ti > GEO_TIME_MS) break;
                const ci = userCoord(userId);
                const cj = userCoord(userId);
                const km = haversineKm(ci, cj);
                if (km > GEO_DISTANCE_KM) {
                    for (const e of [left, right]) {
                        const flag = out.get(e.id) ?? {};
                        flag.geo = { distanceKm: Math.round(km) };
                        out.set(e.id, flag);
                    }
                }
            }
        }
    }

    return out;
}

export type FraudFilter = 'all' | 'burst' | 'self-booking' | 'geo' | 'flagged';

export function matchesFraudFilter(
    event: AffiliationEvent,
    suspicions: Map<string, SuspiciousFlag>,
    filter: FraudFilter,
): boolean {
    if (filter === 'all') return true;
    if (filter === 'flagged') return event.flaggedAsFraud === true;
    const flag = suspicions.get(event.id);
    if (!flag) return false;
    if (filter === 'burst') return flag.burst !== undefined;
    if (filter === 'self-booking') return flag.selfBooking === true;
    if (filter === 'geo') return flag.geo !== undefined;
    return false;
}
