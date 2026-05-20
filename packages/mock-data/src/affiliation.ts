import type { AffiliationEvent, Payout } from '@lumiris/types';

const REF = new Date('2026-04-30T08:00:00Z').getTime();
const DAY = 86_400_000;
const ago = (days: number, hour = 9, minute = 0): string =>
    new Date(REF - days * DAY + hour * 3_600_000 + minute * 60_000).toISOString();

const PURCHASE_COMMISSION_PCT = 0.04;
const REPAIR_COMMISSION_FLAT = 1.5;

function purchase(
    overrides: Pick<
        AffiliationEvent,
        | 'id'
        | 'occurredAt'
        | 'userId'
        | 'beneficiaryId'
        | 'beneficiaryDisplayName'
        | 'transactionAmountEur'
        | 'payoutStatus'
    > & { passportId?: string; flaggedAsFraud?: boolean; fraudReason?: string },
): AffiliationEvent {
    const amount = +(overrides.transactionAmountEur * PURCHASE_COMMISSION_PCT).toFixed(2);
    return {
        kind: 'purchase',
        beneficiaryKind: 'artisan',
        commission: { type: 'pct', percent: PURCHASE_COMMISSION_PCT * 100, amountEur: amount },
        ...overrides,
    };
}

function repair(
    overrides: Pick<
        AffiliationEvent,
        | 'id'
        | 'occurredAt'
        | 'userId'
        | 'beneficiaryId'
        | 'beneficiaryDisplayName'
        | 'transactionAmountEur'
        | 'payoutStatus'
    > & { flaggedAsFraud?: boolean; fraudReason?: string },
): AffiliationEvent {
    return {
        kind: 'repair_booking',
        beneficiaryKind: 'repairer',
        commission: { type: 'flat', amountEur: REPAIR_COMMISSION_FLAT },
        ...overrides,
    };
}

export const mockAffiliationEvents: readonly AffiliationEvent[] = [
    purchase({
        id: 'aff-001',
        occurredAt: ago(0, 11, 25),
        userId: 'vis-2317',
        beneficiaryId: 'art-marie',
        beneficiaryDisplayName: 'Atelier de Marie',
        transactionAmountEur: 240,
        payoutStatus: 'pending',
        passportId: 'pass-marie-001',
    }),
    purchase({
        id: 'aff-002',
        occurredAt: ago(1, 14, 5),
        userId: 'vis-1822',
        beneficiaryId: 'art-theo',
        beneficiaryDisplayName: 'Maison Magnan',
        transactionAmountEur: 480,
        payoutStatus: 'pending',
        passportId: 'pass-theo-001',
    }),
    purchase({
        id: 'aff-003',
        occurredAt: ago(2, 9, 14),
        userId: 'vis-0901',
        beneficiaryId: 'art-paul',
        beneficiaryDisplayName: 'Tannerie Chevreau',
        transactionAmountEur: 320,
        payoutStatus: 'pending',
        passportId: 'pass-paul-001',
    }),
    purchase({
        id: 'aff-004',
        occurredAt: ago(3, 18, 30),
        userId: 'vis-2317',
        beneficiaryId: 'art-marie',
        beneficiaryDisplayName: 'Atelier de Marie',
        transactionAmountEur: 240,
        payoutStatus: 'pending',
        passportId: 'pass-marie-002',
    }),
    repair({
        id: 'aff-005',
        occurredAt: ago(2, 11, 0),
        userId: 'vis-1188',
        beneficiaryId: 'rtc-mehdi',
        beneficiaryDisplayName: 'Atelier Mehdi',
        transactionAmountEur: 35,
        payoutStatus: 'pending',
    }),
    repair({
        id: 'aff-006',
        occurredAt: ago(4, 13, 22),
        userId: 'vis-1822',
        beneficiaryId: 'rtc-007',
        beneficiaryDisplayName: 'Atelier Inès',
        transactionAmountEur: 80,
        payoutStatus: 'pending',
    }),
    repair({
        id: 'aff-007',
        occurredAt: ago(6, 9, 45),
        userId: 'vis-3001',
        beneficiaryId: 'rtc-008',
        beneficiaryDisplayName: 'Rivet Cordonnerie',
        transactionAmountEur: 60,
        payoutStatus: 'pending',
    }),
    purchase({
        id: 'aff-008',
        occurredAt: ago(7, 16, 0),
        userId: 'vis-2455',
        beneficiaryId: 'art-amelie',
        beneficiaryDisplayName: 'Berthier Brodeuse',
        transactionAmountEur: 180,
        payoutStatus: 'pending',
        passportId: 'pass-amelie-001',
    }),
    purchase({
        id: 'aff-009',
        occurredAt: ago(9, 10, 12),
        userId: 'vis-2317',
        beneficiaryId: 'art-jules',
        beneficiaryDisplayName: 'Jules & Fils',
        transactionAmountEur: 540,
        payoutStatus: 'pending',
        passportId: 'pass-jules-001',
    }),
    repair({
        id: 'aff-010',
        occurredAt: ago(11, 14, 30),
        userId: 'vis-1822',
        beneficiaryId: 'rtc-009',
        beneficiaryDisplayName: 'Manon Brodeuse',
        transactionAmountEur: 45,
        payoutStatus: 'pending',
    }),

    purchase({
        id: 'aff-100',
        occurredAt: ago(5, 10, 0),
        userId: 'vis-9999',
        beneficiaryId: 'art-marie',
        beneficiaryDisplayName: 'Atelier de Marie',
        transactionAmountEur: 240,
        payoutStatus: 'pending',
        passportId: 'pass-marie-001',
    }),
    purchase({
        id: 'aff-101',
        occurredAt: ago(5, 10, 30),
        userId: 'vis-9999',
        beneficiaryId: 'art-marie',
        beneficiaryDisplayName: 'Atelier de Marie',
        transactionAmountEur: 240,
        payoutStatus: 'pending',
        passportId: 'pass-marie-002',
    }),
    purchase({
        id: 'aff-102',
        occurredAt: ago(5, 11, 0),
        userId: 'vis-9999',
        beneficiaryId: 'art-marie',
        beneficiaryDisplayName: 'Atelier de Marie',
        transactionAmountEur: 240,
        payoutStatus: 'pending',
    }),
    purchase({
        id: 'aff-103',
        occurredAt: ago(5, 11, 15),
        userId: 'vis-9999',
        beneficiaryId: 'art-marie',
        beneficiaryDisplayName: 'Atelier de Marie',
        transactionAmountEur: 240,
        payoutStatus: 'pending',
    }),
    purchase({
        id: 'aff-104',
        occurredAt: ago(5, 11, 45),
        userId: 'vis-9999',
        beneficiaryId: 'art-marie',
        beneficiaryDisplayName: 'Atelier de Marie',
        transactionAmountEur: 240,
        payoutStatus: 'pending',
    }),
    purchase({
        id: 'aff-105',
        occurredAt: ago(5, 12, 0),
        userId: 'vis-9999',
        beneficiaryId: 'art-marie',
        beneficiaryDisplayName: 'Atelier de Marie',
        transactionAmountEur: 240,
        payoutStatus: 'pending',
    }),

    repair({
        id: 'aff-200',
        occurredAt: ago(3, 14, 0),
        userId: 'rtc-005',
        beneficiaryId: 'rtc-005',
        beneficiaryDisplayName: 'Yann Cuir',
        transactionAmountEur: 80,
        payoutStatus: 'pending',
    }),
    repair({
        id: 'aff-201',
        occurredAt: ago(8, 10, 22),
        userId: 'rtc-011',
        beneficiaryId: 'rtc-011',
        beneficiaryDisplayName: 'Atelier Local 11',
        transactionAmountEur: 50,
        payoutStatus: 'pending',
    }),

    purchase({
        id: 'aff-mar-01',
        occurredAt: ago(35, 11, 0),
        userId: 'vis-1188',
        beneficiaryId: 'art-claire',
        beneficiaryDisplayName: "L'atelier des Hauts",
        transactionAmountEur: 220,
        payoutStatus: 'paid',
        passportId: 'pass-claire-001',
    }),
    purchase({
        id: 'aff-mar-02',
        occurredAt: ago(40, 14, 22),
        userId: 'vis-2117',
        beneficiaryId: 'art-marie',
        beneficiaryDisplayName: 'Atelier de Marie',
        transactionAmountEur: 240,
        payoutStatus: 'paid',
        passportId: 'pass-marie-001',
    }),
    purchase({
        id: 'aff-mar-03',
        occurredAt: ago(42, 9, 11),
        userId: 'vis-3201',
        beneficiaryId: 'art-theo',
        beneficiaryDisplayName: 'Maison Magnan',
        transactionAmountEur: 480,
        payoutStatus: 'paid',
        passportId: 'pass-theo-002',
    }),
    repair({
        id: 'aff-mar-04',
        occurredAt: ago(38, 16, 0),
        userId: 'vis-1188',
        beneficiaryId: 'rtc-mehdi',
        beneficiaryDisplayName: 'Atelier Mehdi',
        transactionAmountEur: 35,
        payoutStatus: 'paid',
    }),
    repair({
        id: 'aff-mar-05',
        occurredAt: ago(45, 14, 30),
        userId: 'vis-2455',
        beneficiaryId: 'rtc-009',
        beneficiaryDisplayName: 'Manon Brodeuse',
        transactionAmountEur: 60,
        payoutStatus: 'paid',
    }),
    purchase({
        id: 'aff-mar-06',
        occurredAt: ago(48, 11, 0),
        userId: 'vis-2999',
        beneficiaryId: 'art-paul',
        beneficiaryDisplayName: 'Tannerie Chevreau',
        transactionAmountEur: 320,
        payoutStatus: 'paid',
        passportId: 'pass-paul-001',
    }),
    purchase({
        id: 'aff-mar-07',
        occurredAt: ago(52, 13, 12),
        userId: 'vis-2477',
        beneficiaryId: 'art-amelie',
        beneficiaryDisplayName: 'Berthier Brodeuse',
        transactionAmountEur: 180,
        payoutStatus: 'paid',
    }),
    repair({
        id: 'aff-mar-08',
        occurredAt: ago(54, 9, 50),
        userId: 'vis-1822',
        beneficiaryId: 'rtc-007',
        beneficiaryDisplayName: 'Atelier Inès',
        transactionAmountEur: 80,
        payoutStatus: 'paid',
    }),
];

export const mockPayouts: readonly Payout[] = [
    {
        id: 'payout-2026-04',
        period: '2026-04',
        status: 'pending',
        totalEur: mockAffiliationEvents
            .filter((e) => e.payoutStatus === 'pending' && !e.flaggedAsFraud)
            .reduce((sum, e) => sum + e.commission.amountEur, 0),
        beneficiaryCount: new Set(
            mockAffiliationEvents.filter((e) => e.payoutStatus === 'pending').map((e) => e.beneficiaryId),
        ).size,
        excludedEventIds: [],
    },
    {
        id: 'payout-2026-03',
        period: '2026-03',
        status: 'paid',
        preparedAt: ago(28, 14, 47),
        paidAt: ago(27, 10, 0),
        totalEur: mockAffiliationEvents
            .filter((e) => e.payoutStatus === 'paid')
            .reduce((sum, e) => sum + e.commission.amountEur, 0),
        beneficiaryCount: new Set(
            mockAffiliationEvents.filter((e) => e.payoutStatus === 'paid').map((e) => e.beneficiaryId),
        ).size,
        excludedEventIds: [],
    },
    {
        id: 'payout-2026-02',
        period: '2026-02',
        status: 'paid',
        preparedAt: ago(58, 10, 0),
        paidAt: ago(57, 14, 30),
        totalEur: 142.6,
        beneficiaryCount: 8,
        excludedEventIds: [],
    },
    {
        id: 'payout-2026-01',
        period: '2026-01',
        status: 'paid',
        preparedAt: ago(89, 9, 0),
        paidAt: ago(88, 11, 0),
        totalEur: 118.2,
        beneficiaryCount: 6,
        excludedEventIds: [],
    },
] as const;

export interface AffiliationMonthBreakdown {
    month: string;
    label: string;
    purchaseEur: number;
    repairEur: number;
}

export const mockAffiliationTrajectory: readonly AffiliationMonthBreakdown[] = [
    { month: '2025-11', label: 'nov', purchaseEur: 142, repairEur: 28 },
    { month: '2025-12', label: 'déc', purchaseEur: 168, repairEur: 36 },
    { month: '2026-01', label: 'janv', purchaseEur: 188, repairEur: 42 },
    { month: '2026-02', label: 'févr', purchaseEur: 215, repairEur: 48 },
    { month: '2026-03', label: 'mars', purchaseEur: 248, repairEur: 56 },
    { month: '2026-04', label: 'avr', purchaseEur: 272, repairEur: 64 },
] as const;
