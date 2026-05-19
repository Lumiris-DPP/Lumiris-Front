// Jalons réglementaires ESPR / AGEC - source unique pour les surfaces qui rendent un calendrier
// (Conformité ESPR aujourd'hui, Cockpit/Overview demain). Aucune dépendance React : utilisable
// en RSC, en client component ou dans un script d'audit.

import type { Artisan, Passport } from '@lumiris/types';

/**
 * Secteurs visés par les actes délégués ESPR. `textile` est le seul actif côté LUMIRIS V1 ;
 * les autres sont préparés pour les vagues 2027-2030.
 */
export type RegulatorySector = 'textile' | 'electronics' | 'appliances' | 'furniture' | 'cross';

/** Type de jalon - distingue les ouvertures réglementaires des dates d'application. */
export type RegulatoryMilestoneKind =
    | 'registry_open' // le registre central DPP ouvre / s'élargit
    | 'delegated_act' // un acte délégué est publié
    | 'application_start' // les obligations deviennent opposables
    | 'reporting_deadline' // une échéance de reporting AGEC / ESPR
    | 'national_law'; // texte national (AGEC, LCAP, ...)

export interface RegulatoryMilestone {
    id: string;
    /** Date ISO 8601 (`YYYY-MM-DD`). Utilisée pour le positionnement sur la timeline. */
    date: string;
    kind: RegulatoryMilestoneKind;
    sector: RegulatorySector;
    /** Libellé court FR affiché sur la timeline et dans les compteurs. */
    title: string;
    /** Texte source réglementaire complet, ~1-3 phrases. */
    description: string;
    /** Référence textuelle (article ESPR, JOUE n°…, code AGEC…). */
    legalReference: string;
    /** Lien public vers le texte de référence quand disponible. */
    sourceUrl?: string;
    /** Marquer les jalons stratégiques qu'on affiche en bandeau de countdown. */
    major: boolean;
}

// --- Constantes officielles ---------------------------------------------------------------------

/**
 * Calendrier ESPR / AGEC tel qu'il est connu au 2026-05. Les dates de la vague textile sont
 * datées sur la base de la projection M+18 après acte délégué (cf. business model LUMIRIS).
 * Toute mise à jour officielle remplace l'entrée correspondante ici - jamais ailleurs.
 */
export const REGULATORY_MILESTONES: readonly RegulatoryMilestone[] = [
    {
        id: 'AGEC-2025-LABEL',
        date: '2025-01-01',
        kind: 'national_law',
        sector: 'textile',
        title: 'AGEC · étiquetage environnemental obligatoire',
        description:
            "Loi Anti-Gaspillage (AGEC) : l'étiquetage des caractéristiques environnementales des produits textiles devient obligatoire en France pour les entreprises mettant en marché plus de 25 000 unités/an.",
        legalReference: 'Loi AGEC 2020-105 · article 13',
        sourceUrl: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000041553759',
        major: false,
    },
    {
        id: 'ESPR-2026-REGISTRY',
        date: '2026-07-19',
        kind: 'registry_open',
        sector: 'cross',
        title: 'Ouverture du registre central DPP (Commission EU)',
        description:
            "La Commission européenne ouvre le registre central interopérable des Digital Product Passports. Le périmètre initial reste vide en attendant les actes délégués sectoriels, mais l'infrastructure et les API publiques de vérification sont opérationnelles.",
        legalReference: 'Règlement (UE) 2024/1781 · article 13',
        sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2024/1781',
        major: true,
    },
    {
        id: 'ESPR-2027-TEXTILE-ACT',
        date: '2027-06-30',
        kind: 'delegated_act',
        sector: 'textile',
        title: 'Acte délégué textile · publication attendue',
        description:
            "L'acte délégué ESPR précisant les exigences spécifiques au textile (composition, traçabilité, réparabilité, durabilité, microfibres) est attendu pour mi-2027. Il fige les champs DPP obligatoires sur lesquels LUMIRIS doit être déjà aligné.",
        legalReference: 'Règlement (UE) 2024/1781 · article 4 et annexe II',
        major: true,
    },
    {
        id: 'ESPR-2027-ELECTRONICS-ACT',
        date: '2027-12-31',
        kind: 'delegated_act',
        sector: 'electronics',
        title: 'Acte délégué électronique · publication attendue',
        description:
            "Acte délégué attendu pour l'électronique grand public (smartphones, tablettes). Hors périmètre LUMIRIS V1 - slot conservé pour anticiper la priorisation produit.",
        legalReference: 'Règlement (UE) 2024/1781 · annexe II',
        major: false,
    },
    {
        id: 'ESPR-2028-TEXTILE-APP',
        date: '2028-12-31',
        kind: 'application_start',
        sector: 'textile',
        title: 'Application obligatoire DPP textile (M+18 acte délégué)',
        description:
            "Tous les produits textiles mis en marché dans l'UE devront être accompagnés d'un Digital Product Passport conforme aux exigences de l'acte délégué. Fenêtre stratégique LUMIRIS : être la référence d'audit à cette date.",
        legalReference: 'Règlement (UE) 2024/1781 · article 4(1)',
        major: true,
    },
    {
        id: 'ESPR-2028-APPLIANCES-ACT',
        date: '2028-09-30',
        kind: 'delegated_act',
        sector: 'appliances',
        title: 'Acte délégué électroménager · publication attendue',
        description: "Acte délégué pour l'électroménager blanc (lavage, froid, cuisson). Slot préparatoire.",
        legalReference: 'Règlement (UE) 2024/1781 · annexe II',
        major: false,
    },
    {
        id: 'ESPR-2029-FURNITURE-ACT',
        date: '2029-06-30',
        kind: 'delegated_act',
        sector: 'furniture',
        title: 'Acte délégué mobilier · publication attendue',
        description: 'Acte délégué pour le mobilier domestique et de bureau. Slot préparatoire.',
        legalReference: 'Règlement (UE) 2024/1781 · annexe II',
        major: false,
    },
    {
        id: 'ESPR-2030-FURNITURE-APP',
        date: '2030-12-31',
        kind: 'application_start',
        sector: 'furniture',
        title: 'Application obligatoire DPP mobilier (M+18 acte délégué)',
        description: "Date cible théorique pour l'application des obligations DPP au secteur mobilier.",
        legalReference: 'Règlement (UE) 2024/1781 · article 4(1)',
        major: false,
    },
];

/** Bornes temporelles utilisées pour positionner les jalons sur la timeline. */
export const TIMELINE_RANGE = {
    start: new Date('2026-01-01T00:00:00Z'),
    end: new Date('2030-12-31T00:00:00Z'),
} as const;

/** Palette par secteur, alignée sur les tokens Prismatic Clarity. */
export const SECTOR_TONE: Record<RegulatorySector, { dot: string; text: string; chip: string }> = {
    textile: {
        dot: 'bg-lumiris-emerald',
        text: 'text-lumiris-emerald',
        chip: 'border-lumiris-emerald/40 text-lumiris-emerald bg-lumiris-emerald/10',
    },
    electronics: {
        dot: 'bg-lumiris-cyan',
        text: 'text-lumiris-cyan',
        chip: 'border-lumiris-cyan/40 text-lumiris-cyan bg-lumiris-cyan/10',
    },
    appliances: {
        dot: 'bg-lumiris-amber',
        text: 'text-lumiris-amber',
        chip: 'border-lumiris-amber/40 text-lumiris-amber bg-lumiris-amber/10',
    },
    furniture: {
        dot: 'bg-lumiris-orange',
        text: 'text-lumiris-orange',
        chip: 'border-lumiris-orange/40 text-lumiris-orange bg-lumiris-orange/10',
    },
    cross: {
        dot: 'bg-lumiris-rose',
        text: 'text-lumiris-rose',
        chip: 'border-lumiris-rose/40 text-lumiris-rose bg-lumiris-rose/10',
    },
};

export const SECTOR_LABEL: Record<RegulatorySector, string> = {
    textile: 'Textile',
    electronics: 'Électronique',
    appliances: 'Électroménager',
    furniture: 'Mobilier',
    cross: 'Tous secteurs',
};

// --- Helpers ------------------------------------------------------------------------------------

/**
 * Position d'un jalon sur la timeline 2026-2030, exprimée en pourcentage. Borne `[0, 100]` -
 * les jalons hors plage sont clampés au début / à la fin pour rester visibles.
 */
export function timelinePositionPct(milestone: RegulatoryMilestone): number {
    const t = new Date(milestone.date).getTime();
    const span = TIMELINE_RANGE.end.getTime() - TIMELINE_RANGE.start.getTime();
    const pct = ((t - TIMELINE_RANGE.start.getTime()) / span) * 100;
    return Math.min(100, Math.max(0, pct));
}

/** Nombre de jours entre `now` et le jalon. Négatif quand le jalon est dépassé. */
export function daysUntil(milestone: RegulatoryMilestone, now: Date = new Date()): number {
    const diff = new Date(milestone.date).getTime() - now.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
}

/** Jalons majeurs uniquement, triés chronologiquement. Sert au bandeau de countdown. */
export function majorMilestones(now: Date = new Date()): readonly RegulatoryMilestone[] {
    return REGULATORY_MILESTONES.filter((m) => m.major)
        .filter((m) => daysUntil(m, now) > -180)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// --- Gap analysis -------------------------------------------------------------------------------

export type GapReason =
    | 'no_published_dpp' // aucun passeport publié pour cet artisan
    | 'all_capped_d' // tous les passeports publiés sont plafonnés D
    | 'missing_espr_fields' // au moins un passeport manque des champs ESPR/AGEC clés
    | 'low_average_score'; // score moyen < B (les passeports existent mais sont sous-classés)

export type RecommendedAction = 'relance' | 'demo' | 'training';

export interface GapEntry {
    artisanId: string;
    artisanName: string;
    city: string;
    tier: Artisan['tier'];
    reasons: readonly GapReason[];
    recommendedAction: RecommendedAction;
}

interface ReadinessSummary {
    totalArtisans: number;
    readyCount: number;
    readyRatio: number;
    gaps: readonly GapEntry[];
}

function passportMissingFields(passport: Passport): readonly string[] {
    const missing: string[] = [];
    if (passport.garment.dimensions.weightG === undefined) missing.push('weightG');
    if (passport.carbonKg === undefined) missing.push('carbonKg');
    if (passport.recycledPct === undefined && passport.materials.every((m) => m.fiber !== 'recycled-polyester')) {
        missing.push('recycledPct');
    }
    if (!passport.warranty.repairabilityCommitment) missing.push('repairability');
    return missing;
}

/**
 * Calcule l'état de préparation des artisans face à l'échéance DPP textile. "Prêt" = au moins
 * un passeport publié avec un grade ≥ B et aucun champ ESPR clé manquant.
 */
export function computeReadiness(
    artisans: readonly Artisan[],
    passports: readonly Passport[],
    scoresByArtisan: ReadonlyMap<string, { avg: number; published: number; allCapped: boolean }>,
): ReadinessSummary {
    const gaps: GapEntry[] = [];
    let readyCount = 0;

    for (const artisan of artisans) {
        const reasons: GapReason[] = [];
        const summary = scoresByArtisan.get(artisan.id) ?? { avg: 0, published: 0, allCapped: false };
        const artisanPassports = passports.filter((p) => p.artisanId === artisan.id && p.status === 'Published');

        if (summary.published === 0) reasons.push('no_published_dpp');
        if (summary.published > 0 && summary.allCapped) reasons.push('all_capped_d');
        if (summary.published > 0 && summary.avg < 70) reasons.push('low_average_score');

        const anyMissing = artisanPassports.some((p) => passportMissingFields(p).length > 0);
        if (anyMissing) reasons.push('missing_espr_fields');

        if (reasons.length === 0 && summary.published > 0 && summary.avg >= 70) {
            readyCount += 1;
            continue;
        }

        gaps.push({
            artisanId: artisan.id,
            artisanName: artisan.atelierName,
            city: artisan.city,
            tier: artisan.tier,
            reasons,
            recommendedAction: pickRecommendation(reasons),
        });
    }

    return {
        totalArtisans: artisans.length,
        readyCount,
        readyRatio: artisans.length === 0 ? 0 : readyCount / artisans.length,
        gaps,
    };
}

function pickRecommendation(reasons: readonly GapReason[]): RecommendedAction {
    if (reasons.includes('no_published_dpp')) return 'demo';
    if (reasons.includes('all_capped_d') || reasons.includes('low_average_score')) return 'training';
    return 'relance';
}

export const REASON_LABEL: Record<GapReason, string> = {
    no_published_dpp: 'Aucun DPP publié',
    all_capped_d: 'Tous les DPP plafonnés D',
    missing_espr_fields: 'Champs ESPR/AGEC manquants',
    low_average_score: 'Score moyen < B',
};

export const ACTION_LABEL: Record<RecommendedAction, string> = {
    relance: 'Relance commerciale',
    demo: 'Démo guidée du studio DPP',
    training: 'Atelier formation traçabilité',
};
