import { expect, test } from 'bun:test';
import { validateStep } from './schema';
import { nonNegativeInteger } from '../marketplace-products/models/product-input';

test('le passeport exige un nom, une catégorie et un pays sans espace seul', () => {
    expect(validateStep({ garment: { name: ' ', originCountry: ' ' } })).toEqual({
        ok: false,
        missing: ['Nom du modèle', 'Catégorie', "Pays d'origine"],
    });
    expect(validateStep({ garment: { name: 'Veste', category: 'outerwear', originCountry: 'France' } })).toEqual({
        ok: true,
    });
});

test('le poids saisi reste un entier borné sans repli vers un gramme', () => {
    for (const raw of ['abc', '-1', '1.5', '1e3', '50001', ' ']) {
        expect(nonNegativeInteger(raw, 50000)).toBeNull();
    }
    expect(nonNegativeInteger('50000', 50000)).toBe(50000);
    expect(nonNegativeInteger('1', 50000)).toBe(1);
});
