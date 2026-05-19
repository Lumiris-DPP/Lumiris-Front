// Score de santé d'un compte artisan - pur, sans JSX. Trois axes pondérés :
//   40% Utilisation du plafond passeports (activité / engagement)
//   35% Score Iris moyen des passeports publiés (0-100)
//   25% Fréquence d'overrides reçus sur 90 jours (pénalité)
//
// L'objectif est de remplacer le booléen "quality risk" exposé en V1 par une lecture
// décomposée que le CRM peut tooltip-er et trier.

export const HEALTH_WEIGHTS = {
    capacity: 0.4,
    iris: 0.35,
    overrides: 0.25,
} as const;

interface HealthInput {
    publishedCount: number;
    /** `Number.POSITIVE_INFINITY` pour Maison - traité comme score plein si actif. */
    passportLimit: number;
    /** Moyenne Iris 0-100. 0 si aucun passeport publié. */
    avgIrisScore: number;
    /** Nombre d'override_score reçus dans la fenêtre 90 jours. */
    overrideCount90d: number;
}

export interface HealthBreakdown {
    /** Pourcentage d'utilisation du plafond (0-100, plafonné). */
    capacityUtilization: number;
    /** Contribution capacité 0-100 avant pondération. */
    capacityScore: number;
    /** Score Iris 0-100 (déjà sur 100). */
    irisScore: number;
    overrideCount90d: number;
    /** Contribution overrides 0-100 avant pondération (100 = aucun override). */
    overrideScore: number;
    /** Total pondéré 0-100. */
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

    // Maison : plein si publié, sinon 0. Solo/Studio : 0 à 80% d'utilisation = montée linéaire,
    // puis plateau à 100 (au-delà on bascule en signal "Upgrade conseillé", pas en pénalité santé).
    const capacityScore =
        input.passportLimit === Number.POSITIVE_INFINITY
            ? input.publishedCount > 0
                ? 100
                : 0
            : clamp((capacityUtilization / 80) * 100, 0, 100);

    const irisScore = clamp(input.avgIrisScore, 0, 100);
    const overrideScore = clamp(100 - input.overrideCount90d * 25, 0, 100);

    const total =
        capacityScore * HEALTH_WEIGHTS.capacity +
        irisScore * HEALTH_WEIGHTS.iris +
        overrideScore * HEALTH_WEIGHTS.overrides;

    return {
        capacityUtilization: Math.round(capacityUtilization),
        capacityScore: Math.round(capacityScore),
        irisScore: Math.round(irisScore),
        overrideCount90d: input.overrideCount90d,
        overrideScore: Math.round(overrideScore),
        total: Math.round(total),
    };
}

type HealthBand = 'critical' | 'warning' | 'healthy';

export function healthBand(total: number): HealthBand {
    if (total < 50) return 'critical';
    if (total < 75) return 'warning';
    return 'healthy';
}
