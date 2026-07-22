import { computeScore, type ComputeScoreOptions } from '@lumiris/core/scoring';
import type { Artisan, Passport, ScoreResult } from '@lumiris/types';
import { mockArtisans } from './artisans';
import { mockCertificates } from './certificates';
import { mockPassports } from './passports';
import { mockRepairers } from './retoucheurs';

export interface PassportPublicView {
    passport: Passport;
    artisan: Artisan;
    slug: string;
    excerpt: string;
    irisScore: ScoreResult | undefined;
    inProgress: boolean;
}

const NOW = new Date('2026-04-30T08:00:00Z');

const SCORE_OPTIONS_BASE: Omit<ComputeScoreOptions, 'artisan'> = {
    certificates: mockCertificates,
    retoucheurs: mockRepairers,
    now: NOW,
};

function slugify(input: string): string {
    return input
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function buildExcerpt(passport: Passport, artisan: Artisan): string {
    const fibers = passport.materials.map((m) => `${m.percentage}% ${FIBER_LABEL_FR[m.fiber] ?? m.fiber}`).join(' · ');
    const productLabel = PRODUCT_LABEL_FR[passport.garment.kind] ?? 'Pièce textile';
    if (!fibers) {
        return `${productLabel} - ${artisan.atelierName}, ${artisan.city}.`;
    }
    return `${productLabel} ${fibers}, ${artisan.atelierName} (${artisan.city}).`;
}

// Variante minuscule volontaire : ces libellés s'insèrent dans une phrase (« Pull 50% laine, … »),
// contrairement au FIBER_LABEL de @lumiris/scoring-ui qui sert d'étiquette autonome. mock-data reste
// sans dépendance UI, donc la table est dupliquée ici en connaissance de cause.
const FIBER_LABEL_FR: Record<string, string> = {
    wool: 'laine',
    linen: 'lin',
    cotton: 'coton',
    silk: 'soie',
    hemp: 'chanvre',
    leather: 'cuir',
    cashmere: 'cachemire',
    'recycled-polyester': 'polyester recyclé',
    other: 'autres fibres',
};

const PRODUCT_LABEL_FR: Record<string, string> = {
    sweater: 'Pull',
    shirt: 'Chemise',
    shoe: 'Chaussures',
    jacket: 'Veste',
    trouser: 'Pantalon',
    accessory: 'Accessoire',
    other: 'Pièce textile',
};

function buildView(passport: Passport): PassportPublicView | undefined {
    const artisan = mockArtisans.find((a) => a.id === passport.artisanId);
    if (!artisan) return undefined;

    const slug = `${slugify(artisan.displayName)}-${slugify(passport.garment.reference)}`;
    const excerpt = buildExcerpt(passport, artisan);
    const inProgress = passport.status === 'InCompletion';

    let irisScore: ScoreResult | undefined;
    if (passport.status !== 'Draft' && passport.materials.length > 0) {
        try {
            irisScore = computeScore(passport, { ...SCORE_OPTIONS_BASE, artisan });
        } catch {
            irisScore = undefined;
        }
    }

    return { passport, artisan, slug, excerpt, irisScore, inProgress };
}

export const mockPassportsPublic: readonly PassportPublicView[] = mockPassports
    .filter((p) => p.status !== 'Draft')
    .map(buildView)
    .filter((v): v is PassportPublicView => !!v);

const VIEW_BY_ID = new Map<string, PassportPublicView>(mockPassportsPublic.map((v) => [v.passport.id, v]));
const VIEW_BY_SLUG = new Map<string, PassportPublicView>(mockPassportsPublic.map((v) => [v.slug, v]));

export function passportPublicByIdOrSlug(idOrSlug: string): PassportPublicView | undefined {
    return VIEW_BY_ID.get(idOrSlug) ?? VIEW_BY_SLUG.get(idOrSlug);
}

export function passportPublicByArtisan(artisanId: string): readonly PassportPublicView[] {
    return mockPassportsPublic.filter((v) => v.artisan.id === artisanId);
}
