import type {
    AdminAction,
    AdminAuditLogEntry,
    AdminUserRole,
    AffiliationEvent,
    Artisan,
    ArtisanTier,
    Passport,
    Subscription,
    SubscriptionStatus,
    SubscriptionTier,
} from '@lumiris/types';

let cursor = 0;
function uid(prefix: string): string {
    cursor += 1;
    return `${prefix}-${cursor.toString().padStart(4, '0')}`;
}

export function makeArtisan(overrides: Partial<Artisan> = {}): Artisan {
    return {
        id: uid('ART'),
        displayName: 'Test Artisan',
        atelierName: 'Atelier Test',
        city: 'Paris',
        region: 'Île-de-France',
        tier: 'Solo' as ArtisanTier,
        plus: false,
        epvLabeled: false,
        ofgLabeled: false,
        specialities: ['Couture'],
        story: 'Atelier test',
        photoUrl: 'https://example.com/photo.jpg',
        joinedAt: '2025-01-01T00:00:00Z',
        passportLimit: 5,
        ...overrides,
    };
}

export function makePassport(overrides: Partial<Passport> = {}): Passport {
    return {
        id: uid('PASS'),
        gs1: {
            gtin: '3600000000000',
            serial: 'SER-001',
            verificationUrl: 'https://verify.lumiris.eu/PASS-001',
        },
        status: 'Published',
        createdAt: '2026-04-01T08:00:00Z',
        updatedAt: '2026-04-15T08:00:00Z',
        publishedAt: '2026-04-15T08:00:00Z',
        artisanId: 'ART-0001',
        garment: {
            kind: 'shirt',
            reference: 'REF-001',
            mainPhotoUrl: 'https://example.com/main.jpg',
            dimensions: { weightG: 200 },
            retailPrice: 120,
            currency: 'EUR',
        },
        materials: [],
        steps: [],
        certifications: [],
        warranty: { durationMonths: 24, terms: 'Default warranty' },
        moderation: { status: 'Approved', reviewerId: 'CUR-001', reviewedAt: '2026-04-15T08:00:00Z' },
        carbonKg: 8,
        waterLiters: 1200,
        recycledPct: 10,
        transportKm: 800,
        ...overrides,
    };
}

export function makeSubscription(overrides: Partial<Subscription> = {}): Subscription {
    return {
        id: uid('SUB'),
        subscriberKind: 'artisan',
        subscriberId: 'ART-0001',
        displayName: 'Atelier Test',
        artisanTier: 'Solo' as ArtisanTier,
        tier: 'solo' as SubscriptionTier,
        plus: false,
        status: 'active' as SubscriptionStatus,
        mrrEur: 29,
        startedAt: '2025-12-01T08:00:00Z',
        nextBillingAt: '2026-05-01T08:00:00Z',
        lastChargeAt: '2026-04-01T08:00:00Z',
        paymentMethod: { brand: 'visa', last4: '1234' },
        city: 'Paris',
        ...overrides,
    };
}

export function makeAuditEntry(overrides: Partial<AdminAuditLogEntry> = {}): AdminAuditLogEntry {
    return {
        id: uid('AUD'),
        ts: '2026-04-30T10:00:00Z',
        actorId: 'CUR-001',
        actorRole: 'curator' as AdminUserRole,
        action: 'passport.curate' as AdminAction,
        targetType: 'passport',
        targetId: 'PASS-0001',
        payload: {},
        ...overrides,
    };
}

export function makeAffiliationEvent(overrides: Partial<AffiliationEvent> = {}): AffiliationEvent {
    return {
        id: uid('AFF'),
        kind: 'purchase',
        occurredAt: '2026-04-29T10:00:00Z',
        userId: 'VIS-001',
        beneficiaryKind: 'artisan',
        beneficiaryId: 'ART-0001',
        beneficiaryDisplayName: 'Atelier Test',
        transactionAmountEur: 100,
        commission: { type: 'pct', percent: 5, amountEur: 5 },
        payoutStatus: 'pending',
        ...overrides,
    };
}

export function shiftIso(baseIso: string, offsetMinutes: number): string {
    return new Date(new Date(baseIso).getTime() + offsetMinutes * 60_000).toISOString();
}
