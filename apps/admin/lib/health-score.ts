// Rapport 40:35 hérité du barème à trois axes, ramené à 1 depuis le retrait de l'axe overrides.
export const HEALTH_WEIGHTS = {
    capacity: 8 / 15,
    iris: 7 / 15,
} as const;

interface HealthInput {
    publishedCount: number;
    /** `Number.POSITIVE_INFINITY` pour Maison — score plein si actif. */
    passportLimit: number;
    avgIrisScore: number;
}

export interface HealthBreakdown {
    capacityUtilization: number;
    capacityScore: number;
    irisScore: number;
    total: number;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function computeHealthScore(input: HealthInput): HealthBreakdown {
    const capacityUtilization =
        input.passportLimit === Number.POSITIVE_INFINITY
            ? input.publishedCount > 0
                ? 100
                : 0
            : clamp((input.publishedCount / input.passportLimit) * 100, 0, 100);

    // Solo/Studio : montée linéaire jusqu'à 80% d'utilisation puis plateau (au-delà on bascule en signal "Upgrade conseillé").
    const capacityScore =
        input.passportLimit === Number.POSITIVE_INFINITY
            ? input.publishedCount > 0
                ? 100
                : 0
            : clamp((capacityUtilization / 80) * 100, 0, 100);

    const irisScore = clamp(input.avgIrisScore, 0, 100);

    const total = capacityScore * HEALTH_WEIGHTS.capacity + irisScore * HEALTH_WEIGHTS.iris;

    return {
        capacityUtilization: Math.round(capacityUtilization),
        capacityScore: Math.round(capacityScore),
        irisScore: Math.round(irisScore),
        total: Math.round(total),
    };
}

type HealthBand = 'critical' | 'warning' | 'healthy';

export function healthBand(total: number): HealthBand {
    if (total < 50) return 'critical';
    if (total < 75) return 'warning';
    return 'healthy';
}
