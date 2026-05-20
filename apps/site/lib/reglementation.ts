import type { ComponentType } from 'react';
import * as R1 from '@/content/reglementation/dpp-textile.mdx';
import * as R2 from '@/content/reglementation/agec.mdx';
import * as R3 from '@/content/reglementation/espr-calendrier.mdx';
import { asMdxArticleModule, type MdxArticleModule } from './mdx-types';

interface RegulationMeta {
    slug: string;
    title: string;
    summary: string;
    updatedAt: string;
}

interface Regulation extends RegulationMeta {
    Component: ComponentType;
}

function isRegulationMeta(meta: unknown): meta is RegulationMeta {
    if (!meta || typeof meta !== 'object') return false;
    const m = meta as Record<string, unknown>;
    return (
        typeof m.slug === 'string' &&
        typeof m.title === 'string' &&
        typeof m.summary === 'string' &&
        typeof m.updatedAt === 'string'
    );
}

const MODULES: ReadonlyArray<MdxArticleModule<RegulationMeta>> = [R1, R2, R3]
    .map((m): MdxArticleModule<RegulationMeta> | null => asMdxArticleModule(m, isRegulationMeta))
    .filter((m): m is MdxArticleModule<RegulationMeta> => m !== null);

const REGULATIONS: readonly Regulation[] = MODULES.map((m) => ({ ...m.meta, Component: m.default }));

const BY_SLUG = new Map<string, Regulation>(REGULATIONS.map((r) => [r.slug, r]));

export function getAllRegulations(): readonly Regulation[] {
    return REGULATIONS;
}

export function getRegulationBySlug(slug: string): Regulation | undefined {
    return BY_SLUG.get(slug);
}
