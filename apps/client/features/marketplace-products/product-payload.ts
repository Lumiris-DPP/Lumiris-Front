import { nonNegativeInteger, requireInteger } from './product-input';
import type {
    MarketplaceItem,
    MarketplaceProductStatus,
    ProductPayload,
    ProductVariantPayload,
    SizeMeasurementPayload,
} from '@lumiris/api-client';

export const MIN_PUBLISHED_PRICE_CENTS = 50;

/** Décrit une déclinaison éditable avec son identité et sa version. */
export interface VariantRow {
    key: string;
    id?: string;
    sizeLabel: string;
    colorLabel: string;
    colorHex: string;
    sku: string;
    stock: string;
    version?: number;
}

/** Décrit les mesures saisies en centimètres pour les tailles du produit. */
export interface SizeGuideDraft {
    labels: string[];
    values: Record<string, string>;
}

export const EMPTY_SIZE_GUIDE: SizeGuideDraft = { labels: [], values: {} };

/** Identifie une cellule du guide par sa taille et sa mesure. */
export function cellKey(sizeLabel: string, label: string): string {
    return `${sizeLabel}\0${label}`;
}

/** Crée une déclinaison locale sans identité serveur. */
export function newVariantRow(sizeLabel = '', colorLabel = ''): VariantRow {
    return { key: crypto.randomUUID(), sizeLabel, colorLabel, colorHex: '', sku: '', stock: '0' };
}

/** Prépare les déclinaisons existantes en conservant stocks et versions. */
export function variantRowsFrom(product?: MarketplaceItem): VariantRow[] {
    const variants = product?.variants ?? [];
    if (variants.length === 0) return [{ ...newVariantRow(), stock: String(product?.stock ?? 0) }];
    return variants.map((variant) => ({
        key: variant.id,
        id: variant.id,
        sizeLabel: variant.sizeLabel ?? '',
        colorLabel: variant.colorLabel ?? '',
        colorHex: variant.colorHex ?? '',
        sku: variant.sku ?? '',
        stock: String(variant.stock),
        version: variant.version ?? undefined,
    }));
}

/** Prépare les mesures existantes en centimètres dans leur ordre déclaré. */
export function sizeGuideFrom(product?: MarketplaceItem): SizeGuideDraft {
    const measurements = product?.sizeGuide ?? [];
    const labels: string[] = [];
    const values: Record<string, string> = {};
    for (const measurement of [...measurements].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
        if (!labels.includes(measurement.label)) labels.push(measurement.label);
        values[cellKey(measurement.sizeLabel, measurement.label)] = String(measurement.valueMm / 10);
    }
    return { labels, values };
}

/** Liste les tailles distinctes déclarées par les déclinaisons. */
export function sizesOf(rows: readonly VariantRow[]): string[] {
    const sizes: string[] = [];
    for (const row of rows) {
        const size = row.sizeLabel.trim();
        if (size && !sizes.includes(size)) sizes.push(size);
    }
    return sizes;
}

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** Retourne la première erreur de stock, de combinaison ou de teinte. */
export function variantRowsError(rows: readonly VariantRow[]): string | null {
    if (rows.length === 0) return 'Ajoutez au moins une déclinaison.';
    const seen = new Set<string>();
    for (const row of rows) {
        const combination = `${row.sizeLabel.trim().toLowerCase()}\0${row.colorLabel.trim().toLowerCase()}`;
        if (seen.has(combination)) return 'Deux déclinaisons portent la même combinaison de taille et de couleur.';
        seen.add(combination);
        if (nonNegativeInteger(row.stock) === null) return 'Un stock doit être un entier positif ou nul.';
        if (row.colorHex.trim() && !HEX_COLOR.test(row.colorHex.trim())) {
            return 'Une teinte doit être un code hexadécimal, par exemple #1B3A5C.';
        }
    }
    return null;
}

/** Construit les déclinaisons validées en conservant leurs identités et versions. */
export function toVariantPayload(rows: readonly VariantRow[]): ProductVariantPayload[] {
    const error = variantRowsError(rows);
    if (error) throw new Error(error);
    return rows.map((row, index) => ({
        id: row.id,
        sizeLabel: row.sizeLabel.trim() || undefined,
        colorLabel: row.colorLabel.trim() || undefined,
        colorHex: row.colorHex.trim() || undefined,
        sku: row.sku.trim() || undefined,
        stock: requireInteger(row.stock, 'Stock'),
        position: index,
        version: row.version,
    }));
}

/** Convertit les mesures valides en millimètres entiers sans ignorer une erreur. */
export function toSizeGuidePayload(draft: SizeGuideDraft, sizes: readonly string[]): SizeMeasurementPayload[] {
    const measurements: SizeMeasurementPayload[] = [];
    draft.labels.forEach((label, position) => {
        const trimmedLabel = label.trim();
        if (!trimmedLabel) return;
        for (const sizeLabel of sizes) {
            const raw = draft.values[cellKey(sizeLabel, label)];
            if (raw === undefined || raw === '') continue;
            if (!/^\d+(?:[,.]\d)?$/.test(raw.trim()))
                throw new Error(
                    `Mesure ${trimmedLabel} (${sizeLabel}) : saisissez des centimètres avec au plus une décimale.`,
                );
            const [whole, decimal = '0'] = raw.trim().replace(',', '.').split('.');
            const valueMm = Number(whole) * 10 + Number(decimal);
            if (!Number.isSafeInteger(valueMm) || valueMm <= 0 || valueMm > 2_147_483_647)
                throw new Error(`Mesure ${trimmedLabel} (${sizeLabel}) : valeur hors limites.`);
            measurements.push({ sizeLabel, label: trimmedLabel, valueMm, position });
        }
    });
    return measurements;
}

/** Reconstruit le PUT complet en ne changeant que le statut demandé. */
export function productPayloadFrom(product: MarketplaceItem, status?: MarketplaceProductStatus): ProductPayload {
    return {
        name: product.name,
        description: product.description ?? undefined,
        category: product.category ?? undefined,
        material: product.material ?? undefined,
        originCountry: product.originCountry ?? undefined,
        priceCents: product.priceCents,
        currency: product.currency,
        shippingCents: product.shippingCents ?? 0,
        returnPolicy: product.returnPolicy ?? undefined,
        preparationDays: product.preparationDays ?? 0,
        weightGrams: product.weightGrams ?? 0,
        variants: (product.variants ?? []).map((variant, index) => ({
            id: variant.id,
            sizeLabel: variant.sizeLabel ?? undefined,
            colorLabel: variant.colorLabel ?? undefined,
            colorHex: variant.colorHex ?? undefined,
            sku: variant.sku ?? undefined,
            stock: variant.stock,
            position: variant.position ?? index,
            version: variant.version ?? undefined,
        })),
        sizeGuide: (product.sizeGuide ?? []).map((measurement, index) => ({
            sizeLabel: measurement.sizeLabel,
            label: measurement.label,
            valueMm: measurement.valueMm,
            position: measurement.position ?? index,
        })),
        externalOrderUrl: product.externalOrderUrl ?? undefined,
        photoUrl: product.photoUrl ?? undefined,
        dppFormId: product.dppFormId ?? undefined,
        status: status ?? product.status,
    };
}
