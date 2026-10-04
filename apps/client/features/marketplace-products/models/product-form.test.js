import { describe, expect, test } from 'bun:test';
import { createApiError, productPayloadSchema, convertDppRequestSchema } from '@lumiris/api-client';
import { eurosToCents, nonNegativeInteger, MAX_INTEGER } from './product-input';
import { convertedProductPayload } from './conversion-model';
import { editedProductPayload, initialState } from './product-form-model';
import { productErrorMessage } from './product-error';
import {
    cellKey,
    productPayloadFrom,
    sizeGuideFrom,
    toSizeGuidePayload,
    toVariantPayload,
    variantRowsError,
    variantRowsFrom,
} from './product-payload';

// Prépare un produit pour les tests.
function productFixture() {
    return {
        id: 'product',
        artisanProfileId: 'artisan',
        atelierPlus: false,
        name: 'Veste',
        description: 'Laine',
        category: 'outerwear',
        material: 'wool',
        originCountry: 'France',
        priceCents: 15999,
        currency: 'EUR',
        stock: 7,
        shippingCents: 690,
        preparationDays: 3,
        effectivePreparationDays: 14,
        weightGrams: 850,
        returnPolicy: 'Retour sous 14 jours',
        dppFormId: 'dpp',
        externalOrderUrl: 'https://atelier.example/veste',
        photoUrl: 'https://atelier.example/photo.jpg',
        status: 'PUBLISHED',
        variants: [
            {
                id: 'small',
                sizeLabel: 'S',
                colorLabel: 'Bleu',
                colorHex: '#123456',
                sku: 'S-B',
                stock: 3,
                position: 1,
                version: 0,
            },
            { id: 'medium', sizeLabel: 'M', colorLabel: 'Bleu', stock: 4, position: 0, version: 17 },
        ],
        sizeGuide: [{ sizeLabel: 'S', label: 'Poitrine', valueMm: 435, position: 0 }],
    };
}

// Prépare une saisie de conversion pour les tests.
function conversionFixture() {
    return {
        priceEuros: '159,99',
        shippingEuros: '',
        stock: '',
        preparationDays: '0',
        weightGrams: '',
        variants: [],
        sizeGuide: { labels: [], values: {} },
        returnPolicy: '',
        externalOrderUrl: '',
        photoUrl: '',
    };
}
describe('A06 : euros français stricts', () => {
    test.each([
        ['0', 0],
        ['0,50', 50],
        ['0.29', 29],
        ['1,01', 101],
        ['159.99', 15999],
        [' 159,99 ', 15999],
        ['1 234,56', 123456],
        ['1\u00a0234,56', 123456],
        ['1\u202f234,56', 123456],
        ['0001,2', 120],
        ['21474836,47', MAX_INTEGER],
    ])('%s donne exactement %i centimes', (raw, cents) => expect(eurosToCents(raw)).toBe(cents));
    test.each([
        '',
        ' ',
        '-1',
        '+1',
        'NaN',
        'Infinity',
        '1e3',
        '0x10',
        '12abc',
        '12,34€',
        '1.234',
        '1,234',
        '1,2.3',
        ',50',
        '1,',
        '12 34,56',
        '1 2345',
        '21474836,48',
        '999999999999999999999',
    ])('refuse %j', (raw) => {
        expect(eurosToCents(raw)).toBeNull();
        expect(() => editedProductPayload({ ...initialState(productFixture()), priceEuros: raw })).toThrow();
        expect(() => convertedProductPayload({ ...conversionFixture(), priceEuros: raw })).toThrow();
    });
    test('édition et conversion utilisent les mêmes prix et frais de port', () => {
        const edited = editedProductPayload({
            ...initialState(productFixture()),
            priceEuros: '159,99',
            shippingEuros: '6,90',
        });
        const converted = convertedProductPayload({ ...conversionFixture(), shippingEuros: '6,90' });
        expect([edited.priceCents, edited.shippingCents]).toEqual([15999, 690]);
        expect([converted.priceCents, converted.shippingCents]).toEqual([15999, 690]);
        expect(productPayloadSchema.safeParse(edited).success).toBe(true);
        expect(convertDppRequestSchema.safeParse(converted).success).toBe(true);
    });
    test.each(['oops', '1e2', '-1', '1,234', ' '])('refuse les frais de port %j dans les deux formulaires', (raw) => {
        expect(() => editedProductPayload({ ...initialState(productFixture()), shippingEuros: raw })).toThrow(
            'Frais de port',
        );
        expect(() => convertedProductPayload({ ...conversionFixture(), shippingEuros: raw })).toThrow('Frais de port');
    });
    test('zéro explicite autorisé en brouillon, minimum 50 centimes à la publication', () => {
        expect(
            editedProductPayload({ ...initialState(productFixture()), status: 'DRAFT', priceEuros: '0' }).priceCents,
        ).toBe(0);
        for (const priceEuros of ['0', '0,01', '0,49']) {
            expect(() => editedProductPayload({ ...initialState(productFixture()), priceEuros })).toThrow('0,50');
            expect(() => convertedProductPayload({ ...conversionFixture(), priceEuros })).toThrow('0,50');
        }
        expect(convertedProductPayload({ ...conversionFixture(), priceEuros: '0,50' }).priceCents).toBe(50);
    });
    test('les champs optionnels vides de conversion restent absents, le zéro explicite reste zéro', () => {
        const blank = convertedProductPayload(conversionFixture());
        expect(blank.stock).toBeUndefined();
        expect(blank.shippingCents).toBeUndefined();
        expect(blank.weightGrams).toBeUndefined();
        const zero = convertedProductPayload({
            ...conversionFixture(),
            stock: '0',
            shippingEuros: '0',
            weightGrams: '0',
        });
        expect([zero.stock, zero.shippingCents, zero.weightGrams]).toEqual([0, 0, 0]);
    });
});
describe('A07 : stocks et bornes entières', () => {
    test.each(['', ' ', '-1', '1.5', '1,5', '2.0', '1e2', '0x10', 'abc', '2147483648'])(
        'refuse le stock de variante %j sans arrondi',
        (stock) => {
            const rows = variantRowsFrom(productFixture()).map((row) => ({ ...row, stock }));
            expect(nonNegativeInteger(stock)).toBeNull();
            expect(variantRowsError(rows)).toContain('entier');
            expect(() => toVariantPayload(rows)).toThrow('entier');
            expect(() => editedProductPayload({ ...initialState(productFixture()), variants: rows })).toThrow();
            if (stock !== '') expect(() => convertedProductPayload({ ...conversionFixture(), stock })).toThrow('Stock');
            expect(() => convertedProductPayload({ ...conversionFixture(), variants: rows })).toThrow();
        },
    );
    test.each(['0', '1', ' 42 ', '2147483647'])('conserve le stock entier %s et la version', (stock) => {
        const row = { ...variantRowsFrom(productFixture())[0], stock };
        expect(variantRowsError([row])).toBeNull();
        expect(toVariantPayload([row])[0]).toMatchObject({ stock: Number(stock), id: 'small', version: 0 });
    });
    test('rejette les doublons et les couleurs incorrectes', () => {
        const row = variantRowsFrom(productFixture())[0];
        expect(variantRowsError([row, { ...row, sizeLabel: ' s ', colorLabel: ' bleu ' }])).toContain(
            'même combinaison',
        );
        expect(() => toVariantPayload([{ ...row, colorHex: '#bad' }])).toThrow('hexadécimal');
        expect(() => toVariantPayload([])).toThrow('au moins');
    });
    test.each(['-1', '0.5', 'abc', '', '91'])('refuse le délai %j dans les deux payloads', (preparationDays) => {
        expect(() => editedProductPayload({ ...initialState(productFixture()), preparationDays })).toThrow('Délai');
        expect(() => convertedProductPayload({ ...conversionFixture(), preparationDays })).toThrow('Délai');
    });
    test.each(['-1', '1.5', 'abc', '30001'])('refuse le poids %j dans les deux payloads', (weightGrams) => {
        expect(() => editedProductPayload({ ...initialState(productFixture()), weightGrams })).toThrow('Poids');
        expect(() => convertedProductPayload({ ...conversionFixture(), weightGrams })).toThrow('Poids');
    });
});
describe('PUT complet et versions', () => {
    test.each(['ARCHIVED', 'PUBLISHED', 'DRAFT'])('la bascule %s ne modifie que le statut', (status) => {
        const product = productFixture();
        const before = structuredClone(product);
        const original = productPayloadFrom(product);
        const toggled = productPayloadFrom(product, status);
        expect(toggled).toEqual({ ...original, status });
        expect(toggled).toMatchObject({
            shippingCents: 690,
            returnPolicy: product.returnPolicy,
            preparationDays: 3,
            weightGrams: 850,
            dppFormId: 'dpp',
            externalOrderUrl: product.externalOrderUrl,
            photoUrl: product.photoUrl,
            priceCents: 15999,
        });
        expect(toggled.variants).toEqual(original.variants);
        expect(toggled.variants.map((variant) => variant.version)).toEqual([0, 17]);
        expect(toggled.sizeGuide).toEqual(product.sizeGuide);
        expect(product).toEqual(before);
        expect(productPayloadSchema.safeParse(toggled).success).toBe(true);
    });
    test('l’édition conserve les ids, versions, mesures et le délai brut', () => {
        const product = productFixture();
        const payload = editedProductPayload(initialState(product), product.currency);
        expect(payload.variants.map((variant) => [variant.id, variant.version])).toEqual([
            ['small', 0],
            ['medium', 17],
        ]);
        expect(payload.sizeGuide).toEqual(product.sizeGuide);
        expect(payload.preparationDays).toBe(3);
        expect(payload.shippingCents).toBe(690);
    });
    test('un ancien produit sans variantes garde son stock dans le formulaire', () => {
        const product = { ...productFixture(), variants: [] };
        expect(editedProductPayload(initialState(product)).variants[0]?.stock).toBe(7);
    });
    test('le guide de mesures revient exactement en millimètres', () => {
        const draft = sizeGuideFrom(productFixture());
        expect(toSizeGuidePayload(draft, ['S'])).toEqual(productFixture().sizeGuide);
        expect(
            toSizeGuidePayload({ labels: ['Poitrine'], values: { [cellKey('S', 'Poitrine')]: '43,5' } }, ['S'])[0]
                ?.valueMm,
        ).toBe(435);
    });
    test.each(['abc', '-1', '0', '1e2', '1,23', ' '])(
        'ne supprime pas silencieusement une mesure invalide %j',
        (raw) => {
            expect(() =>
                toSizeGuidePayload({ labels: ['Poitrine'], values: { [cellKey('S', 'Poitrine')]: raw } }, ['S']),
            ).toThrow('Mesure');
        },
    );
});
describe('A08 : cause exacte des erreurs', () => {
    test.each([
        [422, 'Un abonnement ATELIER actif est requis.'],
        [422, 'Le DPP doit être VALID.'],
        [422, 'Le prix doit atteindre 0,50 €.'],
        [409, 'Ce passeport est déjà converti.'],
        [403, 'Ce passeport appartient à un autre artisan.'],
        [503, 'Stripe indisponible.'],
    ])('relaie le %i avec sa vraie cause : %s', (status, message) => {
        expect(productErrorMessage(createApiError(status, message))).toBe(message);
    });
    test('précise les champs de validation sans inventer une cause abonnement', () => {
        const error = createApiError(422, 'Validation échouée', {
            errors: [{ field: 'stock', message: 'Doit être entier' }],
        });
        expect(productErrorMessage(error)).toBe('Validation échouée stock : Doit être entier');
        expect(productErrorMessage(new Error('Connexion interrompue'))).toBe('Connexion interrompue');
    });
});
