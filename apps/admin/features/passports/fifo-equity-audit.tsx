'use client';

import { useMemo } from 'react';
import { TriangleAlert } from 'lucide-react';
import type { PassportRow } from './types';

interface FifoEntry {
    row: PassportRow;
    enqueuedRank: number;
    publishedRank: number;
}

interface FifoAudit {
    entries: readonly FifoEntry[];
    violations: readonly FifoEntry[];
}

function publishedTime(row: PassportRow): number {
    return new Date(
        row.passport.publishedAt ?? row.passport.moderation?.reviewedAt ?? row.passport.updatedAt,
    ).getTime();
}

function computeAudit(rows: readonly PassportRow[]): FifoAudit {
    const enqueuedOrder = [...rows].sort(
        (a, b) => new Date(a.passport.createdAt).getTime() - new Date(b.passport.createdAt).getTime(),
    );
    const enqueuedRankById = new Map<string, number>();
    enqueuedOrder.forEach((r, i) => enqueuedRankById.set(r.passport.id, i + 1));

    const validated = rows.filter((r) => r.status === 'validated');
    const sortedValidated = [...validated].sort((a, b) => publishedTime(a) - publishedTime(b));
    const last10 = sortedValidated.slice(-10).reverse();
    const entries: FifoEntry[] = last10.map((row, i) => ({
        row,
        enqueuedRank: enqueuedRankById.get(row.passport.id) ?? 0,
        publishedRank: sortedValidated.length - i,
    }));

    const violations = entries.filter((e) => {
        if (!e.row.isAtelierPlus) return false;
        const publishedThisTime = publishedTime(e.row);
        return entries.some((other) => {
            if (other.row.passport.id === e.row.passport.id) return false;
            if (other.row.isAtelierPlus) return false;
            return other.enqueuedRank < e.enqueuedRank && publishedTime(other.row) > publishedThisTime;
        });
    });

    return { entries, violations };
}

export function useFifoAudit(rows: readonly PassportRow[]): FifoAudit {
    return useMemo(() => computeAudit(rows), [rows]);
}

export function FifoViolationsAlert({ audit }: { audit: FifoAudit }) {
    if (audit.violations.length === 0) return null;
    return (
        <div className="flex items-center gap-2 rounded-lg border border-lumiris-rose/40 px-3 py-1.5 text-xs text-lumiris-rose">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
            <span className="font-medium">Violations FIFO · {audit.violations.length}</span>
        </div>
    );
}
