import type {
    MarketplaceItem,
    MarketplaceProductStatus,
    ProductPayload,
    ProductVariantPayload,
    SizeMeasurementPayload,
} from '@lumiris/api-client';

// Prix minimum d'un produit publié (le backend rejette sinon en 422).
export const MIN_PUBLISHED_PRICE_CENTS = 50;

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

export interface SizeGuideDraft {
    labels: string[];
    values: Record<string, string>;
}

export const EMPTY_SIZE_GUIDE: SizeGuideDraft = { labels: [], values: {} };

export function cellKey(sizeLabel: string, label: string): string {
    return `${sizeLabel}\0${label}`;
}

export function newVariantRow(sizeLabel = '', colorLabel = ''): VariantRow {
    return { key: crypto.randomUUID(), sizeLabel, colorLabel, colorHex: '', sku: '', stock: '0' };
}

export function variantRowsFrom(product?: MarketplaceItem): VariantRow[] {
    const variants = product?.variants ?? [];
    if (variants.length === 0) return [newVariantRow()];
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

/** Tailles distinctes déclarées par les déclinaisons — seules valeurs autorisées dans le guide. */
export function sizesOf(rows: readonly VariantRow[]): string[] {
    const sizes: string[] = [];
    for (const row of rows) {
        const size = row.sizeLabel.trim();
        if (size && !sizes.includes(size)) sizes.push(size);
    }
    return sizes;
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** Première raison pour laquelle la grille n'est pas enregistrable, ou null. */
export function variantRowsError(rows: readonly VariantRow[]): string | null {
    if (rows.length === 0) return 'Ajoutez au moins une déclinaison.';
    const seen = new Set<string>();
    for (const row of rows) {
        const combination = `${row.sizeLabel.trim().toLowerCase()}\0${row.colorLabel.trim().toLowerCase()}`;
        if (seen.has(combination)) return 'Deux déclinaisons portent la même combinaison de taille et de couleur.';
        seen.add(combination);
        if (Number(row.stock) < 0 || !Number.isFinite(Number(row.stock)))
            return 'Un stock doit être un entier positif.';
        if (row.colorHex.trim() && !HEX_COLOR.test(row.colorHex.trim())) {
            return 'Une teinte doit être un code hexadécimal, par exemple #1B3A5C.';
        }
    }
    return null;
}

export function toVariantPayload(rows: readonly VariantRow[]): ProductVariantPayload[] {
    return rows.map((row, index) => ({
        id: row.id,
        sizeLabel: row.sizeLabel.trim() || undefined,
        colorLabel: row.colorLabel.trim() || undefined,
        colorHex: row.colorHex.trim() || undefined,
        sku: row.sku.trim() || undefined,
        stock: Math.max(0, Math.round(Number(row.stock) || 0)),
        position: index,
        version: row.version,
    }));
}

// L'artisan saisit des centimètres, le contrat porte des millimètres entiers — même discipline que
// les centimes : aucun flottant n'atteint la base ni l'affichage.
export function toSizeGuidePayload(draft: SizeGuideDraft, sizes: readonly string[]): SizeMeasurementPayload[] {
    const measurements: SizeMeasurementPayload[] = [];
    draft.labels.forEach((label, position) => {
        const trimmedLabel = label.trim();
        if (!trimmedLabel) return;
        for (const sizeLabel of sizes) {
            const raw = draft.values[cellKey(sizeLabel, label)];
            const cm = Number(String(raw ?? '').replace(',', '.'));
            if (!raw || !Number.isFinite(cm) || cm <= 0) continue;
            measurements.push({ sizeLabel, label: trimmedLabel, valueMm: Math.round(cm * 10), position });
        }
    });
    return measurements;
}

/**
 * Payload complet reconstruit depuis une annonce existante. Le PUT est un remplacement intégral :
 * toute action qui ne fait que basculer le statut doit repasser déclinaisons, guide, port, retours
 * et délai — les omettre les effacerait en silence.
 */
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
