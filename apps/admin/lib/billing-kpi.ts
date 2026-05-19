import type { Subscription } from '@lumiris/types';
import type { MrrPoint } from '@lumiris/mock-data';
import { PRICE_LINES, type PriceLineId } from './pricing';

interface BillingKpi {
    mrr: number;
    arr: number;
    churnPct: number;
    churnEur: number;
    netNew: number;
    split: { solo: number; studio: number; maison: number; plus: number; local: number };
}

export function computeBillingKpi(
    subscriptions: readonly Subscription[],
    mrrTrajectory: readonly MrrPoint[],
): BillingKpi {
    const active = subscriptions.filter((s) => s.status === 'active' || s.status === 'past_due');
    const mrr = active.reduce((sum, s) => sum + s.mrrEur, 0);
    const lastMonth = mrrTrajectory[mrrTrajectory.length - 2];
    const thisMonth = mrrTrajectory[mrrTrajectory.length - 1];
    const lastTotal = lastMonth
        ? lastMonth.solo + lastMonth.studio + lastMonth.maison + lastMonth.plus + lastMonth.local
        : 0;
    const thisTotal = thisMonth
        ? thisMonth.solo + thisMonth.studio + thisMonth.maison + thisMonth.plus + thisMonth.local
        : mrr;
    const netNew = thisTotal - lastTotal;
    const canceled = subscriptions.filter((s) => s.status === 'canceled');
    const churnEur = canceled.reduce((sum, s) => sum + (s.mrrEur || PRICE_LINES.studio.monthlyEur), 0);
    const churnPct = active.length === 0 ? 0 : (canceled.length / (active.length + canceled.length)) * 100;
    const arr = mrr * 12;
    const split = thisMonth ?? { solo: 0, studio: 0, maison: 0, plus: 0, local: 0 };
    return { mrr, arr, churnPct, churnEur, netNew, split };
}

// ─── LTV / CAC par segment ──────────────────────────────────────────────────
// Estimations conservatrices Chiffrage v4.2 § 8.2.

export type SegmentId = PriceLineId;

export interface LtvCacRow {
    id: SegmentId;
    label: string;
    arpuEur: number;
    retentionMonths: number;
    grossMargin: number;
    ltvEur: number;
    cacEur: number;
    ratio: number;
    color: string;
}

const RETENTION_MONTHS: Record<SegmentId, number> = {
    solo: 18,
    studio: 30,
    maison: 42,
    plus: 24,
    local: 14,
};

const CAC_EUR: Record<SegmentId, number> = {
    solo: 95,
    studio: 280,
    maison: 620,
    plus: 25,
    local: 55,
};

const GROSS_MARGIN = 0.8;

export function computeLtvCac(): readonly LtvCacRow[] {
    const segments: readonly SegmentId[] = ['solo', 'studio', 'maison', 'plus', 'local'];
    return segments.map((id) => {
        const line = PRICE_LINES[id];
        const months = RETENTION_MONTHS[id];
        const ltv = Math.round(line.monthlyEur * months * GROSS_MARGIN);
        const cac = CAC_EUR[id];
        const ratio = cac === 0 ? Number.POSITIVE_INFINITY : +(ltv / cac).toFixed(1);
        return {
            id,
            label: line.label,
            arpuEur: line.monthlyEur,
            retentionMonths: months,
            grossMargin: GROSS_MARGIN,
            ltvEur: ltv,
            cacEur: cac,
            ratio,
            color: line.color,
        };
    });
}

// ─── Viabilité M0 → M36 (Chiffrage v4.2 § 8) ───────────────────────────────
// Trajectoire calibrée pour point-mort en M22-M24 (base) et M28-M30 (stress -30/-33 %).

export interface ViabilityPoint {
    month: number;
    label: string;
    revenueEur: number;
    costEur: number;
    ebitdaEur: number;
    revenueStressedEur: number;
    ebitdaStressedEur: number;
}

const VIABILITY_PARAMS = {
    mrrStart: 906,
    mrrGrowth: 0.155,
    costsStart: 18_000,
    costsGrowth: 0.015,
    stressFactor: 0.55,
} as const;

export function computeViability(months = 36): readonly ViabilityPoint[] {
    const out: ViabilityPoint[] = [];
    for (let m = 0; m <= months; m++) {
        const revenue = Math.round(VIABILITY_PARAMS.mrrStart * Math.pow(1 + VIABILITY_PARAMS.mrrGrowth, m));
        const cost = Math.round(VIABILITY_PARAMS.costsStart * Math.pow(1 + VIABILITY_PARAMS.costsGrowth, m));
        const ebitda = revenue - cost;
        const revenueStressed = Math.round(revenue * VIABILITY_PARAMS.stressFactor);
        const ebitdaStressed = revenueStressed - cost;
        out.push({
            month: m,
            label: `M${m}`,
            revenueEur: revenue,
            costEur: cost,
            ebitdaEur: ebitda,
            revenueStressedEur: revenueStressed,
            ebitdaStressedEur: ebitdaStressed,
        });
    }
    return out;
}

export function findBreakevenMonth(points: readonly ViabilityPoint[], stressed = false): number | null {
    for (const p of points) {
        const ebitda = stressed ? p.ebitdaStressedEur : p.ebitdaEur;
        if (ebitda >= 0) return p.month;
    }
    return null;
}

// ─── Conversion mensuel → annuel (90 j) ────────────────────────────────────

interface MonthlyToAnnualConversion {
    totalActive: number;
    annualLike: number;
    pct: number;
}

export function computeMonthlyToAnnualConversion(subscriptions: readonly Subscription[]): MonthlyToAnnualConversion {
    const active = subscriptions.filter((s) => s.status === 'active');
    const annualLike = active.filter((s) => {
        if (!s.lastChargeAt) return false;
        const last = new Date(s.lastChargeAt).getTime();
        const next = new Date(s.nextBillingAt).getTime();
        const cycleDays = (next - last) / 86_400_000;
        return cycleDays > 60;
    });
    const totalActive = active.length;
    const pct = totalActive === 0 ? 0 : +((annualLike.length / totalActive) * 100).toFixed(1);
    return { totalActive, annualLike: annualLike.length, pct };
}
