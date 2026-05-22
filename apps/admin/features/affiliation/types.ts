import type { AffiliationEvent, Payout } from '@lumiris/types';
import { NOW_REF, type SuspiciousFlag } from '@/lib/affiliation-fraud';

export type BankStatus = 'awaiting' | 'wire_sent' | 'reconciled' | 'failed';

export const BANK_STATUS_LABEL: Record<BankStatus, string> = {
    awaiting: 'En attente',
    wire_sent: 'Virement émis',
    reconciled: 'Réconcilié',
    failed: 'Échec',
};

export const BANK_STATUS_TONE: Record<BankStatus, string> = {
    awaiting: 'border-lumiris-amber/40 text-lumiris-amber',
    wire_sent: 'border-lumiris-cyan/40 text-lumiris-cyan',
    reconciled: 'border-lumiris-emerald/40 text-lumiris-emerald',
    failed: 'border-lumiris-rose/40 text-lumiris-rose',
};

export function inferBankStatus(p: Payout): BankStatus {
    if (p.status === 'paid') return 'reconciled';
    if (p.status === 'prepared') return 'wire_sent';
    return 'awaiting';
}

export function inferExpectedDate(p: Payout): string {
    if (p.paidAt) return p.paidAt;
    if (p.preparedAt) {
        return new Date(new Date(p.preparedAt).getTime() + 2 * 86_400_000).toISOString();
    }
    return new Date(NOW_REF + 5 * 86_400_000).toISOString();
}

export interface RateHistoryEntry {
    id: string;
    label: string;
    oldValue: string;
    newValue: string;
    reason: string;
    at: string;
}

export type FraudPattern = 'burst' | 'self_booking' | 'geo' | 'manual';

export interface FraudCase {
    event: AffiliationEvent;
    flag: SuspiciousFlag;
    pattern: FraudPattern;
}

export type FraudCaseStatus = 'open' | 'resolved' | 'anonymised';

export const FRAUD_PATTERN_LABEL: Record<FraudPattern, string> = {
    burst: 'Pic d’activité',
    self_booking: 'Auto-réservation',
    geo: 'Géo incohérente',
    manual: 'Flag manuel',
};

export interface AntiConflictAlert {
    id: string;
    severity: 'warn' | 'info';
    title: string;
    detail: string;
    partnerId: string;
    partnerName: string;
    occurredAt: string;
    eventIds: readonly string[];
}
