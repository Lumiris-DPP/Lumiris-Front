import type { ConvertDppRequest } from '@lumiris/api-client';
import { MIN_PUBLISHED_PRICE_CENTS, sizesOf, toSizeGuidePayload, toVariantPayload } from './product-payload';
import type { SizeGuideDraft, VariantRow } from './product-payload';
import { MAX_PREPARATION_DAYS, MAX_WEIGHT_GRAMS, requireEuros, requireInteger } from './product-input';

/** Décrit les saisies de conversion du passeport en annonce. */
interface ConversionDraft {
    priceEuros: string;
    shippingEuros: string;
    stock: string;
    preparationDays: string;
    weightGrams: string;
    variants: VariantRow[];
    sizeGuide: SizeGuideDraft;
    returnPolicy: string;
    externalOrderUrl: string;
    photoUrl: string;
}

/** Construit une annonce publiée sans masquer une saisie invalide. */
export function convertedProductPayload(draft: ConversionDraft): ConvertDppRequest {
    const priceCents = requireEuros(draft.priceEuros, 'Prix');
    if (priceCents < MIN_PUBLISHED_PRICE_CENTS) throw new Error('Un produit publié doit coûter au moins 0,50 €.');
    return {
        priceCents,
        currency: 'EUR',
        stock: draft.variants.length === 0 && draft.stock !== '' ? requireInteger(draft.stock, 'Stock') : undefined,
        variants: draft.variants.length > 0 ? toVariantPayload(draft.variants) : undefined,
        sizeGuide: draft.variants.length > 0 ? toSizeGuidePayload(draft.sizeGuide, sizesOf(draft.variants)) : undefined,
        preparationDays: requireInteger(draft.preparationDays, 'Délai de préparation', MAX_PREPARATION_DAYS),
        weightGrams:
            draft.weightGrams === '' ? undefined : requireInteger(draft.weightGrams, 'Poids', MAX_WEIGHT_GRAMS),
        shippingCents: draft.shippingEuros === '' ? undefined : requireEuros(draft.shippingEuros, 'Frais de port'),
        returnPolicy: draft.returnPolicy.trim() || undefined,
        externalOrderUrl: draft.externalOrderUrl.trim() || undefined,
        photoUrl: draft.photoUrl.trim() || undefined,
        status: 'PUBLISHED',
    };
}
