import type { MarketplaceItem, MarketplaceProductStatus, ProductPayload } from '@lumiris/api-client';
import {
    MIN_PUBLISHED_PRICE_CENTS,
    sizeGuideFrom,
    variantRowsFrom,
    toVariantPayload,
    toSizeGuidePayload,
    sizesOf,
} from './product-payload';
import type { SizeGuideDraft, VariantRow } from './product-payload';
import { MAX_PREPARATION_DAYS, MAX_WEIGHT_GRAMS, requireEuros, requireInteger } from './product-input';

export const NO_DPP = 'none';

export interface ProductFormState {
    name: string;
    description: string;
    category: string;
    material: string;
    originCountry: string;
    priceEuros: string;
    shippingEuros: string;
    returnPolicy: string;
    preparationDays: string;
    weightGrams: string;
    variants: VariantRow[];
    sizeGuide: SizeGuideDraft;
    externalOrderUrl: string;
    photoUrl: string;
    dppFormId: string;
    status: MarketplaceProductStatus;
}

export function initialState(product?: MarketplaceItem): ProductFormState {
    return {
        name: product?.name ?? '',
        description: product?.description ?? '',
        category: product?.category ?? '',
        material: product?.material ?? '',
        originCountry: product?.originCountry ?? '',
        priceEuros: product ? String(product.priceCents / 100) : '',
        shippingEuros: product ? String((product.shippingCents ?? 0) / 100) : '0',
        returnPolicy: product?.returnPolicy ?? '',
        preparationDays: String(product?.preparationDays ?? 0),
        weightGrams: String(product?.weightGrams ?? 0),
        variants: variantRowsFrom(product),
        sizeGuide: sizeGuideFrom(product),
        externalOrderUrl: product?.externalOrderUrl ?? '',
        photoUrl: product?.photoUrl ?? '',
        dppFormId: product?.dppFormId ?? NO_DPP,
        status: product?.status ?? 'DRAFT',
    };
}

export function editedProductPayload(form: ProductFormState, currency = 'EUR'): ProductPayload {
    if (!form.name.trim()) throw new Error('Le nom du produit est requis.');
    const priceCents = requireEuros(form.priceEuros, 'Prix');
    if (form.status === 'PUBLISHED' && priceCents < MIN_PUBLISHED_PRICE_CENTS) {
        throw new Error('Un produit publié doit coûter au moins 0,50 €.');
    }
    const preparationDays = requireInteger(form.preparationDays, 'Délai de préparation', MAX_PREPARATION_DAYS);
    const weightGrams = requireInteger(form.weightGrams, 'Poids', MAX_WEIGHT_GRAMS);
    return {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category.trim() || undefined,
        material: form.material.trim() || undefined,
        originCountry: form.originCountry.trim() || undefined,
        priceCents,
        currency,
        shippingCents: requireEuros(form.shippingEuros, 'Frais de port'),
        returnPolicy: form.returnPolicy.trim() || undefined,
        preparationDays,
        weightGrams,
        variants: toVariantPayload(form.variants),
        sizeGuide: toSizeGuidePayload(form.sizeGuide, sizesOf(form.variants)),
        externalOrderUrl: form.externalOrderUrl.trim() || undefined,
        photoUrl: form.photoUrl.trim() || undefined,
        dppFormId: form.dppFormId === NO_DPP ? undefined : form.dppFormId,
        status: form.status,
    };
}
