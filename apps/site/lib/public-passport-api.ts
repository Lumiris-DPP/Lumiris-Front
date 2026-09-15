import type { DppFormDto, DppFormPublicDto, IrisScoreDto } from '@lumiris/api-client';
import {
    mockArtisanById,
    mockArtisanBySlug,
    passportPublicByArtisan,
    passportPublicByIdOrSlug,
    type PassportPublicView,
} from '@lumiris/mock-data';
import { CARE_SYMBOLS, FIBER_LABEL } from '@lumiris/scoring-ui';
import {
    ARTISAN_PASSPORT_LIMIT,
    IRIS_GRADES,
    buildGS1Identifier,
    type Artisan,
    type CareInstructions,
    type Coordinates,
    type Fiber,
    type FrenchRegion,
    type GarmentKind,
    type IrisGrade,
    type Material,
    type Passport,
    type ScoreReason,
    type ScoreResult,
    type ScoreWeights,
} from '@lumiris/types';
import { env } from '@/env';
import { fetchPublicArtisanProfile, type ArtisanPublicProfileDto } from './public-artisan-api';

export interface PassportNote {
    title: string;
    body: string;
}

export interface PublicPassport {
    view: PassportPublicView;
    artisanSlug: string;
    notes: readonly PassportNote[];
}

export interface ArtisanPiece {
    href: string;
    name: string;
    photoUrl: string;
    grade: IrisGrade | null;
}

const SERVER_REVALIDATE_SECONDS = 300;

const UNKNOWN_ATELIER = 'Atelier';

const IRIS_WEIGHTS: ScoreWeights = { transparency: 0.4, craftsmanship: 0.25, impact: 0.25, repairability: 0.1 };

const DPP_CATEGORY_TO_GARMENT_KIND: Record<string, GarmentKind> = {
    top: 'other',
    bottom: 'trouser',
    dress: 'other',
    outerwear: 'jacket',
    shoe: 'shoe',
    accessory: 'accessory',
    other: 'other',
};

const CARE_CODES_BY_SLOT: ReadonlyArray<{ slot: keyof CareInstructions; codes: readonly string[] }> = [
    { slot: 'washing', codes: ['wash-30', 'wash-40', 'wash-60', 'no-wash', 'dry-clean', 'no-dry-clean'] },
    { slot: 'drying', codes: ['tumble-dry', 'no-tumble'] },
    { slot: 'ironing', codes: ['iron-low', 'iron-med', 'iron-high', 'no-iron'] },
];

const CARE_LABEL_BY_CODE = new Map<string, string>(CARE_SYMBOLS.map((symbol) => [symbol.code, symbol.label]));

export async function fetchPublicPassport(codeOrCatalogId: string): Promise<PublicPassport | null> {
    const published = await fetchPublishedDpp(codeOrCatalogId);
    if (published) return toPublicPassport(published);
    return catalogPassport(codeOrCatalogId);
}

export function passportProductName(passport: Passport): string {
    return passport.garment.name ?? passport.garment.reference;
}

export async function fetchArtisanPieces(slug: string): Promise<readonly ArtisanPiece[]> {
    const published = await fetchPublishedPieces(slug);
    if (published && published.length > 0) {
        return published.map((piece) => ({
            href: `/passeport/${piece.publicCode}`,
            name: piece.productName ?? piece.publicCode,
            photoUrl: piece.mainPhotoUrl ?? '',
            grade: (piece.irisGrade as IrisGrade | null) ?? null,
        }));
    }
    return catalogArtisanPieces(slug);
}

export function catalogArtisanPieces(slug: string): readonly ArtisanPiece[] {
    const artisan = mockArtisanBySlug(slug);
    if (!artisan) return [];

    return passportPublicByArtisan(artisan.id).map((view) => ({
        href: `/passeport/${view.passport.id}`,
        name: passportProductName(view.passport),
        photoUrl: view.passport.garment.mainPhotoUrl,
        grade: view.irisScore?.grade ?? null,
    }));
}

interface ArtisanPieceDto {
    publicCode: string;
    productName: string | null;
    productCategory: string | null;
    mainPhotoUrl: string | null;
    irisTotal: number | null;
    irisGrade: string | null;
}

async function fetchPublishedPieces(slug: string): Promise<ArtisanPieceDto[] | null> {
    const path = `/v1/artisans/${encodeURIComponent(slug)}/passeports`;
    try {
        const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
            next: { revalidate: SERVER_REVALIDATE_SECONDS },
        });
        if (res.status === 404) return null;
        if (!res.ok) {
            console.error(`GET ${path} → ${res.status}`);
            return null;
        }
        return (await res.json()) as ArtisanPieceDto[];
    } catch (error) {
        console.error(`GET ${path} injoignable`, error);
        return null;
    }
}

async function fetchPublishedDpp(code: string): Promise<DppFormPublicDto | null> {
    const path = `/public/dpp_forms/${encodeURIComponent(code)}`;
    try {
        const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
            next: { revalidate: SERVER_REVALIDATE_SECONDS },
        });
        if (res.status === 404) return null;
        if (!res.ok) {
            console.error(`GET ${path} → ${res.status}`);
            return null;
        }
        return (await res.json()) as DppFormPublicDto;
    } catch (error) {
        console.error(`GET ${path} injoignable`, error);
        return null;
    }
}

function catalogPassport(idOrSlug: string): PublicPassport | null {
    const view = passportPublicByIdOrSlug(idOrSlug);
    if (!view) return null;

    const artisan = mockArtisanById(view.artisan.id);
    return { view, artisanSlug: artisan?.slug ?? view.artisan.id, notes: [] };
}

async function toPublicPassport(dto: DppFormPublicDto): Promise<PublicPassport> {
    const artisanSlug = dto.artisanSlug ?? dto.dpp.id;
    const artisan = toArtisan(await loadArtisanProfile(dto.artisanSlug), artisanSlug);
    const passport = toPassport(dto.dpp, artisanSlug);

    return {
        view: {
            passport,
            artisan,
            slug: passport.id,
            excerpt: buildExcerpt(passport, artisan),
            irisScore: toScoreResult(dto.irisScore),
            inProgress: passport.status === 'InCompletion',
        },
        artisanSlug,
        notes: buildNotes(dto.dpp),
    };
}

async function loadArtisanProfile(slug: string | null | undefined): Promise<ArtisanPublicProfileDto | null> {
    if (!slug) return null;
    try {
        return await fetchPublicArtisanProfile(slug);
    } catch (error) {
        console.error(`GET /v1/artisans/${slug} injoignable`, error);
        return null;
    }
}

function toPassport(dpp: DppFormDto, artisanId: string): Passport {
    const publicId = dpp.publicCode ?? dpp.id;

    return {
        id: publicId,
        gs1: buildGS1Identifier(dpp.gtin ?? '', publicId),
        status: dpp.status === 'VALID' ? 'Published' : 'InCompletion',
        createdAt: dpp.createdAt,
        updatedAt: dpp.createdAt,
        publishedAt: dpp.status === 'VALID' ? dpp.createdAt : undefined,
        artisanId,
        garment: {
            kind: DPP_CATEGORY_TO_GARMENT_KIND[dpp.productCategory ?? ''] ?? 'other',
            name: dpp.productName ?? undefined,
            reference: dpp.sku ?? publicId,
            mainPhotoUrl: dpp.mainPhotoUrl ?? '',
            dimensions: { weightG: dpp.weightGrams ?? undefined },
            retailPrice: 0,
            currency: 'EUR',
            description: dpp.productDescription ?? undefined,
            originCountry: dpp.originCountry ?? undefined,
            availableSizes: dpp.availableSizes ?? undefined,
            colors: dpp.colors ?? undefined,
        },
        materials: (dpp.materials ?? []).map(toMaterial),
        steps: [],
        certifications: [],
        warranty: {
            durationMonths: dpp.warrantyMonths ?? 0,
            terms: dpp.warrantyDescription ?? '',
        },
        care: toCareInstructions(dpp.careInstructions ?? []),
        recycledPct: dpp.recycledPct ?? undefined,
    };
}

function toMaterial(material: NonNullable<DppFormDto['materials']>[number]): Material {
    return {
        fiber: toFiber(material.fiber),
        percentage: material.percentage,
        supplierId: '',
        originCountry: material.originCountry ?? '',
        certifications: [],
        coordinates: toCoordinates(material.latitude, material.longitude),
    };
}

function toCoordinates(latitude: number | null | undefined, longitude: number | null | undefined) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return undefined;
    return { lat: latitude, lng: longitude } satisfies Coordinates;
}

function toFiber(value: string | null | undefined): Fiber {
    return value && value in FIBER_LABEL ? (value as Fiber) : 'other';
}

function toCareInstructions(codes: readonly string[]): CareInstructions | undefined {
    if (codes.length === 0) return undefined;

    const care: CareInstructions = { washing: '', drying: '', ironing: '', storage: '' };
    for (const { slot, codes: slotCodes } of CARE_CODES_BY_SLOT) {
        care[slot] = codes
            .filter((code) => slotCodes.includes(code))
            .map((code) => CARE_LABEL_BY_CODE.get(code) ?? code)
            .join(' · ');
    }
    return care;
}

function toScoreResult(score: IrisScoreDto | null | undefined): ScoreResult | undefined {
    if (!score || !isIrisGrade(score.grade)) return undefined;

    return {
        total: score.total,
        grade: score.grade,
        breakdown: score.breakdown,
        weights: score.weights ?? IRIS_WEIGHTS,
        reasons: (score.reasons ?? []) as readonly ScoreReason[],
    };
}

function isIrisGrade(value: string): value is IrisGrade {
    return (IRIS_GRADES as readonly string[]).includes(value);
}

function toArtisan(profile: ArtisanPublicProfileDto | null, slug: string): Artisan {
    return {
        id: slug,
        displayName: profile?.displayName ?? profile?.atelierName ?? UNKNOWN_ATELIER,
        atelierName: profile?.atelierName ?? profile?.displayName ?? UNKNOWN_ATELIER,
        city: profile?.city ?? '',
        region: (profile?.region ?? '') as FrenchRegion,
        tier: 'Solo',
        plus: false,
        epvLabeled: profile?.epvLabeled ?? false,
        ofgLabeled: profile?.ofgLabeled ?? false,
        specialities: profile?.specialties ?? [],
        story: profile?.story ?? '',
        photoUrl: profile?.photoUrls[0] ?? '',
        websiteUrl: profile?.websiteUrl || undefined,
        joinedAt: '',
        passportLimit: ARTISAN_PASSPORT_LIMIT.Solo,
    };
}

function buildExcerpt(passport: Passport, artisan: Artisan): string {
    const composition = passport.materials
        .map((material) => `${material.percentage}% ${FIBER_LABEL[material.fiber].toLowerCase()}`)
        .join(' · ');
    const atelier = artisan.city ? `${artisan.atelierName} (${artisan.city})` : artisan.atelierName;

    return [passportProductName(passport), composition, atelier].filter(Boolean).join(' - ');
}

function buildNotes(dpp: DppFormDto): readonly PassportNote[] {
    return [
        { title: 'Note d’entretien de l’atelier', body: dpp.careNotes },
        { title: 'Fin de vie', body: dpp.endOfLifeInstructions },
    ].filter((note): note is PassportNote => Boolean(note.body));
}
