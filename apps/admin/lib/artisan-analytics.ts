import { computeScore } from '@lumiris/core/scoring';
import {
    IRIS_GRADES,
    type AdminAuditLogEntry,
    type Artisan,
    type ArtisanTier,
    type IrisGrade,
    type Passport,
    type Repairer,
    type Subscription,
} from '@lumiris/types';
import { computeHealthScore, type HealthBreakdown } from '@/lib/health-score';

export const TIER_MRR: Record<ArtisanTier, number> = { Solo: 29, Studio: 79, Maison: 149 };
export const PLUS_ADDON = 19;

const NINETY_DAYS_MS = 90 * 86_400_000;

function nextTier(tier: ArtisanTier): ArtisanTier | null {
    if (tier === 'Solo') return 'Studio';
    if (tier === 'Studio') return 'Maison';
    return null;
}

export interface ArtisanRow {
    artisan: Artisan;
    publishedCount: number;
    avgGrade: IrisGrade | '-';
    avgScore: number;
    cappedShare: number;
    flaggedShare: number;
    health: HealthBreakdown;
    overrideCount90d: number;
    cohortMonth: string;
    /** Offset en mois par rapport à `now` (0 = mois courant, -3 = il y a 3 mois). */
    cohortOffset: number;
    upgradeHint: ArtisanTier | null;
    mrr: number;
}

function monthKey(iso: string): string {
    const d = new Date(iso);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthOffset(iso: string, now: Date): number {
    const joined = new Date(iso);
    return (joined.getUTCFullYear() - now.getUTCFullYear()) * 12 + (joined.getUTCMonth() - now.getUTCMonth());
}

function countOverridesFor(
    auditLog: readonly AdminAuditLogEntry[],
    artisan: Artisan,
    artisanPassports: readonly Passport[],
    now: Date,
): number {
    const cutoff = now.getTime() - NINETY_DAYS_MS;
    const passportIds = new Set(artisanPassports.map((p) => p.id));
    return auditLog.filter((entry) => {
        if (entry.action !== 'passport.override') return false;
        if (new Date(entry.ts).getTime() < cutoff) return false;
        if (entry.targetType === 'passport' && passportIds.has(entry.targetId)) return true;
        const payloadArtisanId =
            typeof entry.payload?.artisanId === 'string' ? (entry.payload.artisanId as string) : null;
        return payloadArtisanId === artisan.id;
    }).length;
}

export function buildArtisanRows(
    artisans: readonly Artisan[],
    passports: readonly Passport[],
    repairers: readonly Repairer[],
    auditLog: readonly AdminAuditLogEntry[],
    now: Date,
): readonly ArtisanRow[] {
    return artisans.map((artisan) => buildArtisanRow(artisan, passports, repairers, auditLog, now));
}

export function buildArtisanRow(
    artisan: Artisan,
    passports: readonly Passport[],
    repairers: readonly Repairer[],
    auditLog: readonly AdminAuditLogEntry[],
    now: Date,
): ArtisanRow {
    const artisanPassports = passports.filter((p) => p.artisanId === artisan.id);
    const published = artisanPassports.filter((p) => p.status === 'Published');
    const scores = published.map((p) =>
        computeScore(p, {
            certificates: p.materials.flatMap((m) => m.certifications),
            artisan,
            retoucheurs: repairers,
            now,
        }),
    );
    const cappedShare =
        scores.length === 0 ? 0 : scores.filter((s) => s.cap?.applied || s.grade === 'D').length / scores.length;
    const avgScore = scores.length === 0 ? 0 : scores.reduce((sum, s) => sum + s.total, 0) / scores.length;
    const gradeCounts: Record<IrisGrade, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    scores.forEach((s) => {
        gradeCounts[s.grade] += 1;
    });
    const dominantGrade: IrisGrade | '-' =
        scores.length === 0
            ? '-'
            : IRIS_GRADES.reduce<IrisGrade>((best, g) => (gradeCounts[g] > gradeCounts[best] ? g : best), 'A');

    const overrideCount90d = countOverridesFor(auditLog, artisan, artisanPassports, now);
    const health = computeHealthScore({
        publishedCount: published.length,
        passportLimit: artisan.passportLimit,
        avgIrisScore: avgScore,
        overrideCount90d,
    });

    const upgradeHint =
        artisan.passportLimit !== Number.POSITIVE_INFINITY &&
        published.length / artisan.passportLimit >= 0.8 &&
        nextTier(artisan.tier) !== null
            ? nextTier(artisan.tier)
            : null;

    return {
        artisan,
        publishedCount: published.length,
        avgGrade: dominantGrade,
        avgScore,
        cappedShare,
        flaggedShare: 0,
        health,
        overrideCount90d,
        cohortMonth: monthKey(artisan.joinedAt),
        cohortOffset: monthOffset(artisan.joinedAt, now),
        upgradeHint,
        mrr: TIER_MRR[artisan.tier] + (artisan.plus ? PLUS_ADDON : 0),
    } satisfies ArtisanRow;
}

export interface CohortBucketMetrics {
    label: string;
    monthsAgo: number;
    cohortSize: number;
    nrr: number;
    expansion: number;
    churn: number;
}

/** Cohorte M-X = artisans inscrits il y a ≥ X mois ; expansion proxiée par ATELIER+ faute d'historique de tier. */
export function computeCohortMetrics(
    artisans: readonly Artisan[],
    subscriptions: readonly Subscription[],
    now: Date,
    buckets: readonly number[] = [3, 6, 12],
): readonly CohortBucketMetrics[] {
    const subsByArtisan = new Map<string, Subscription>();
    subscriptions.forEach((s) => {
        if (s.subscriberKind === 'artisan') subsByArtisan.set(s.subscriberId, s);
    });

    return buckets.map((monthsAgo) => {
        const cohort = artisans.filter((a) => -monthOffset(a.joinedAt, now) >= monthsAgo);
        const baselineMrr = cohort.reduce((sum, a) => sum + TIER_MRR[a.tier], 0);
        const currentMrr = cohort.reduce((sum, a) => {
            const sub = subsByArtisan.get(a.id);
            if (sub?.status === 'canceled') return sum;
            return sum + TIER_MRR[a.tier] + (a.plus ? PLUS_ADDON : 0);
        }, 0);
        const expansion = cohort.filter((a) => {
            const sub = subsByArtisan.get(a.id);
            return a.plus && sub?.status !== 'canceled';
        }).length;
        const churn = cohort.filter((a) => subsByArtisan.get(a.id)?.status === 'canceled').length;
        const nrr = baselineMrr === 0 ? 0 : Math.round((currentMrr / baselineMrr) * 100);
        return { label: `M-${monthsAgo}`, monthsAgo, cohortSize: cohort.length, nrr, expansion, churn };
    });
}

export function listCohortMonths(artisans: readonly Artisan[]): readonly string[] {
    const set = new Set<string>();
    artisans.forEach((a) => set.add(monthKey(a.joinedAt)));
    return [...set].sort().reverse();
}
