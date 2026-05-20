import type { Passport, IrisGrade } from '@lumiris/types';
import { mockArtisanById } from './artisans';
import { featuredPassport, mockPassports } from './passports';

export type ProductCategory = 'sweater' | 'shirt' | 'shoe' | 'jacket' | 'trouser' | 'accessory' | 'other';

export interface MockProduct {
    id: string;
    passportId: string;
    artisanId: string;
    name: string;
    brand: string;
    category: ProductCategory;
    photoUrl: string;
    price: number;
    currency: 'EUR';
    grade: IrisGrade;
    score: number;
}

function previewGrade(passport: Passport): { grade: IrisGrade; score: number } {
    if (passport.status !== 'Published') return { grade: 'D', score: 38 };
    const compositionComplete =
        passport.materials.length > 0 && passport.materials.every((m) => m.supplierId && m.originCountry);
    const stepsRich = passport.steps.length >= 4 && passport.steps.every((s) => s.photos.length > 0);
    const certified = passport.materials.some((m) => m.certifications.length > 0);
    const warrantyLong = passport.warranty.durationMonths >= 24;

    let pts = 0;
    if (compositionComplete) pts += 30;
    if (stepsRich) pts += 25;
    if (certified) pts += 20;
    if (warrantyLong) pts += 25;

    if (pts >= 85) return { grade: 'A', score: pts };
    if (pts >= 70) return { grade: 'B', score: pts };
    if (pts >= 55) return { grade: 'C', score: pts };
    if (pts >= 40) return { grade: 'D', score: pts };
    return { grade: 'E', score: pts };
}

export const mockProducts: readonly MockProduct[] = mockPassports
    .filter((p) => p.status === 'Published')
    .map((p) => {
        const artisan = mockArtisanById(p.artisanId);
        const { grade, score } = previewGrade(p);
        return {
            id: `prod-${p.id}`,
            passportId: p.id,
            artisanId: p.artisanId,
            name: p.garment.reference,
            brand: artisan?.atelierName ?? p.artisanId,
            category: p.garment.kind,
            photoUrl: p.garment.mainPhotoUrl,
            price: p.garment.retailPrice,
            currency: p.garment.currency,
            grade,
            score,
        };
    });

export function mockProductById(id: string): MockProduct | undefined {
    return mockProducts.find((p) => p.id === id);
}

export const sampleProduct: MockProduct | undefined = (() => {
    const featured = featuredPassport;
    if (!featured) return undefined;
    return mockProducts.find((p) => p.passportId === featured.id);
})();
