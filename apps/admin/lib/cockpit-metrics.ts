import { computeScore } from '@lumiris/core/scoring';
import {
    IRIS_GRADES,
    type AdminAuditLogEntry,
    type Artisan,
    type ArtisanTier,
    type IrisGrade,
    type Passport,
    type Subscription,
} from '@lumiris/types';
import {
    ACQUISITION_SOURCE_MIX,
    ARTISAN_TIER_MIX,
    ATELIER_MONTHLY_EUR,
    ATELIER_PLUS_ADOPTION_PCT,
    ATELIER_PLUS_MONTHLY_EUR,
    B2C_ACCOUNT_ACTIVATION_PCT,
    B2C_AFFILIATION_ARPU_MONTHLY_EUR,
    BREAKEVEN_NOMINAL_RANGE,
    BREAKEVEN_STRESS_RANGE,
    buildMonthlyTargets,
    ESPR_DEADLINES,
    FUNNEL_CONVERSION,
    LOCAL_MONTHLY_EUR,
    LTV_CAC_TARGETS,
    monthlyCostEur,
    STRESS_B2B_FACTOR,
    STRESS_B2C_FACTOR,
    type AcquisitionSource,
    type EsprDeadline,
    type LtvCacTarget,
    type MonthlyTarget,
} from './business-targets';

const DAY_MS = 86_400_000;

interface ArtisanKpi {
    readonly total: number;
    readonly splitByTier: Record<ArtisanTier, number>;
    readonly churn30d: number;
}

export function buildArtisanKpi(
    artisans: readonly Artisan[],
    auditLog: readonly AdminAuditLogEntry[],
    now: Date,
): ArtisanKpi {
    const splitByTier: Record<ArtisanTier, number> = { Solo: 0, Studio: 0, Maison: 0 };
    for (const a of artisans) splitByTier[a.tier] += 1;

    const thirtyDaysAgo = now.getTime() - 30 * DAY_MS;
    // `artisan.unsubscribe` n'est pas encore typée dans AdminAction (arrive avec le backend billing) — match string pour rester forward-compatible.
    const churn30d = auditLog
        .filter(
            (e) => e.targetType === 'artisan' && e.action === ('artisan.unsubscribe' as AdminAuditLogEntry['action']),
        )
        .filter((e) => new Date(e.ts).getTime() >= thirtyDaysAgo).length;

    return { total: artisans.length, splitByTier, churn30d };
}

interface CurationKpi {
    readonly pendingCount: number;
    readonly draftCount: number;
    readonly inCompletionCount: number;
    readonly medianValidationDays: number | null;
}

function median(values: readonly number[]): number | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
    return sorted[mid] ?? null;
}

export function buildCurationKpi(passports: readonly Passport[]): CurationKpi {
    const pending = passports.filter((p) => p.status !== 'Published' || p.moderation?.status === 'PendingReview');
    const draftCount = passports.filter((p) => p.status === 'Draft').length;
    const inCompletionCount = passports.filter((p) => p.status === 'InCompletion').length;

    // `createdAt` = entrée en file, `moderation.reviewedAt` = validation curator ; `publishedAt` ignoré car absent de certaines fixtures.
    const validationDays = passports.flatMap((p) => {
        if (p.status !== 'Published') return [];
        const reviewedAt = p.moderation?.status === 'Approved' ? p.moderation.reviewedAt : undefined;
        if (!reviewedAt) return [];
        const submitted = new Date(p.createdAt).getTime();
        const validated = new Date(reviewedAt).getTime();
        return [Math.max(0, (validated - submitted) / DAY_MS)];
    });

    return {
        pendingCount: pending.length,
        draftCount,
        inCompletionCount,
        medianValidationDays: median(validationDays),
    };
}

interface IrisKpi {
    readonly sampleSize: number;
    readonly avgTotal: number;
    /** Score moyen sur 5 — comparable à la cible plateforme. */
    readonly avgOnFive: number;
    readonly dominantGrade: IrisGrade | '-';
    readonly cappedCount: number;
    readonly deltaVsTarget: number;
}

export function buildIrisKpi(
    passports: readonly Passport[],
    artisans: readonly Artisan[],
    now: Date,
    target: number,
): IrisKpi {
    const published = passports.filter((p) => p.status === 'Published');
    if (published.length === 0) {
        return {
            sampleSize: 0,
            avgTotal: 0,
            avgOnFive: 0,
            dominantGrade: '-',
            cappedCount: 0,
            deltaVsTarget: -target,
        };
    }

    const results = published.map((passport) => {
        const artisan = artisans.find((a) => a.id === passport.artisanId);
        return computeScore(passport, {
            certificates: passport.materials.flatMap((m) => m.certifications),
            ...(artisan ? { artisan } : {}),
            now,
        });
    });

    const avgTotal = results.reduce((s, r) => s + r.total, 0) / results.length;
    const avgOnFive = (avgTotal / 100) * 5;
    const cappedCount = results.filter((r) => r.cap?.applied).length;

    const gradeCount: Record<IrisGrade, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    for (const r of results) gradeCount[r.grade] += 1;
    const dominantGrade = IRIS_GRADES.reduce<IrisGrade>(
        (best, g) => (gradeCount[g] > gradeCount[best] ? g : best),
        'A',
    );

    return {
        sampleSize: results.length,
        avgTotal,
        avgOnFive,
        dominantGrade,
        cappedCount,
        deltaVsTarget: avgOnFive - target,
    };
}

interface MrrKpi {
    readonly atelierMrr: number;
    readonly plusMrr: number;
    readonly localMrr: number;
    readonly mrrTotal: number;
    readonly arrTotal: number;
}

export function buildMrrKpi(subscriptions: readonly Subscription[]): MrrKpi {
    const active = subscriptions.filter((s) => s.status === 'active' || s.status === 'past_due');
    let atelierMrr = 0;
    let plusMrr = 0;
    let localMrr = 0;
    for (const s of active) {
        if (s.subscriberKind === 'artisan') {
            const tier: ArtisanTier = s.artisanTier ?? 'Solo';
            atelierMrr += ATELIER_MONTHLY_EUR[tier];
            if (s.plus) plusMrr += ATELIER_PLUS_MONTHLY_EUR;
        } else if (s.subscriberKind === 'repairer' && s.tier !== 'free') {
            localMrr += LOCAL_MONTHLY_EUR;
        }
    }
    const mrrTotal = atelierMrr + plusMrr + localMrr;
    return { atelierMrr, plusMrr, localMrr, mrrTotal, arrTotal: mrrTotal * 12 };
}

interface TrajectoryPoint {
    readonly month: string;
    readonly monthIndex: number;
    readonly arrAtelier: number;
    readonly arrAffiliation: number;
    readonly arrLocal: number;
    readonly chargesAnnualized: number;
    readonly arrTotal: number;
}

interface TrajectoryResult {
    readonly points: readonly TrajectoryPoint[];
    readonly breakevenRange: readonly [number, number];
}

export function buildTrajectory(stress: boolean): TrajectoryResult {
    const targets = buildMonthlyTargets();
    const b2bFactor = stress ? STRESS_B2B_FACTOR : 1;
    const b2cFactor = stress ? STRESS_B2C_FACTOR : 1;

    const points = targets.map<TrajectoryPoint>((t: MonthlyTarget) => {
        const adjustedArtisans = t.artisans * b2bFactor;
        const adjustedVisionUsers = t.visionUsers * b2cFactor;
        const adjustedLocal = t.localPaid * b2bFactor;

        const tierMrr =
            adjustedArtisans *
            ((ARTISAN_TIER_MIX.Solo ?? 0) * (ATELIER_MONTHLY_EUR.Solo ?? 0) +
                (ARTISAN_TIER_MIX.Studio ?? 0) * (ATELIER_MONTHLY_EUR.Studio ?? 0) +
                (ARTISAN_TIER_MIX.Maison ?? 0) * (ATELIER_MONTHLY_EUR.Maison ?? 0));
        const plusMrr = adjustedArtisans * ATELIER_PLUS_ADOPTION_PCT * ATELIER_PLUS_MONTHLY_EUR;
        const arrAtelier = (tierMrr + plusMrr) * 12;

        const arrAffiliation = adjustedVisionUsers * B2C_ACCOUNT_ACTIVATION_PCT * B2C_AFFILIATION_ARPU_MONTHLY_EUR * 12;
        const arrLocal = adjustedLocal * LOCAL_MONTHLY_EUR * 12;

        const chargesAnnualized = monthlyCostEur(t.monthIndex) * 12;

        return {
            month: t.label,
            monthIndex: t.monthIndex,
            arrAtelier: Math.round(arrAtelier),
            arrAffiliation: Math.round(arrAffiliation),
            arrLocal: Math.round(arrLocal),
            chargesAnnualized: Math.round(chargesAnnualized),
            arrTotal: Math.round(arrAtelier + arrAffiliation + arrLocal),
        };
    });

    return {
        points,
        breakevenRange: stress ? BREAKEVEN_STRESS_RANGE : BREAKEVEN_NOMINAL_RANGE,
    };
}

export interface LtvCacRow {
    readonly id: LtvCacTarget['id'];
    readonly label: string;
    readonly arpuAnnualEur: number;
    readonly lifetimeMonths: number;
    readonly ltvEur: number;
    readonly cacEur: number;
    readonly ratio: number;
    readonly tone: 'good' | 'watch' | 'bad';
}

function ratioTone(ratio: number): LtvCacRow['tone'] {
    if (ratio >= 3) return 'good';
    if (ratio >= 1) return 'watch';
    return 'bad';
}

export function buildLtvCacRows(): readonly LtvCacRow[] {
    return LTV_CAC_TARGETS.map((t) => {
        const ltv = t.arpuMonthlyEur * t.lifetimeMonths;
        const ratio = t.cacEur === 0 ? Number.POSITIVE_INFINITY : ltv / t.cacEur;
        return {
            id: t.id,
            label: t.label,
            arpuAnnualEur: t.arpuMonthlyEur * 12,
            lifetimeMonths: t.lifetimeMonths,
            ltvEur: ltv,
            cacEur: t.cacEur,
            ratio,
            tone: ratioTone(ratio),
        };
    });
}

interface FunnelStage {
    readonly id: 'lead' | 'demo' | 'signature' | 'activation';
    readonly label: string;
    readonly conversion: number;
}

interface FunnelSlice {
    readonly source: AcquisitionSource;
    readonly stages: Record<FunnelStage['id'], number>;
}

interface AcquisitionFunnel {
    readonly stages: readonly FunnelStage[];
    readonly slices: readonly FunnelSlice[];
    readonly totalLeads: number;
}

// Mock seedé — sera remplacé par un GET /metrics quand le backend arrivera.
export function buildAcquisitionFunnel(now: Date): AcquisitionFunnel {
    const month = now.getUTCMonth();
    const totalLeads = 60 + ((month * 13) % 41);

    const demoConversion = FUNNEL_CONVERSION.leadToDemo;
    const signatureConversion = demoConversion * FUNNEL_CONVERSION.demoToSignature;
    const activationConversion = signatureConversion * FUNNEL_CONVERSION.signatureToActivation;

    const stages: readonly FunnelStage[] = [
        { id: 'lead', label: 'Lead', conversion: 1 },
        { id: 'demo', label: 'Démo', conversion: demoConversion },
        { id: 'signature', label: 'Signature', conversion: signatureConversion },
        { id: 'activation', label: 'Activation', conversion: activationConversion },
    ];

    const slices = (Object.entries(ACQUISITION_SOURCE_MIX) as Array<[AcquisitionSource, number]>).map(
        ([source, share]) => {
            const sourceLeads = Math.round(totalLeads * share);
            const stagesCount: Record<FunnelStage['id'], number> = {
                lead: sourceLeads,
                demo: Math.round(sourceLeads * demoConversion),
                signature: Math.round(sourceLeads * signatureConversion),
                activation: Math.round(sourceLeads * activationConversion),
            };
            return { source, stages: stagesCount };
        },
    );

    return { stages, slices, totalLeads };
}

interface CountdownEntry {
    readonly deadline: EsprDeadline;
    readonly daysLeft: number;
}

export function buildEsprCountdown(now: Date): readonly CountdownEntry[] {
    const today = now.getTime();
    return ESPR_DEADLINES.map((d) => ({
        deadline: d,
        daysLeft: Math.ceil((new Date(d.date).getTime() - today) / DAY_MS),
    }));
}
