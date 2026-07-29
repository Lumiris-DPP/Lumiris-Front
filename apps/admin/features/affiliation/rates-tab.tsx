'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useLogAction, usePermission } from '@/lib/auth';
import {
    DEFAULT_PURCHASE_RATES,
    DEFAULT_REPAIR_COMMISSION,
    PURCHASE_RATE_BOUNDS,
    RATE_CHANGE_REASON_MIN_LENGTH,
    REPAIR_FLAT_BOUNDS,
    REPAIR_PCT_BOUNDS,
    type PurchaseRate,
    type RepairCommission,
    validatePurchaseRate,
    validateRepairFlat,
    validateRepairPct,
} from '@/lib/affiliation-config';
import { RateChangeDialog, type RateChangeTarget } from './rate-change-dialog';
import { PurchaseSection, RepairSection, purchaseKey, repairKey } from './rates-sections';
import type { RateHistoryEntry } from './types';

type HistoryKey = string;

interface InFlightChange {
    target: RateChangeTarget;
    kind: 'purchase' | 'repair-flat' | 'repair-pct';
    historyKey: HistoryKey;
    apply: (next: number) => void;
}

export function RatesTab() {
    const canWriteRates = usePermission('affiliation.rate_change');
    if (!canWriteRates) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Accès restreint</p>
                <p className="mt-0.5 text-xs">
                    L&apos;édition des taux requiert la permission{' '}
                    <code className="font-mono">affiliation.rate_change</code>.
                </p>
            </div>
        );
    }
    return <RatesEditor />;
}

function RatesEditor() {
    const log = useLogAction();
    const [purchaseRates, setPurchaseRates] = useState<readonly PurchaseRate[]>(DEFAULT_PURCHASE_RATES);
    const [repair, setRepair] = useState<RepairCommission>(DEFAULT_REPAIR_COMMISSION);
    const [history, setHistory] = useState<ReadonlyMap<HistoryKey, readonly RateHistoryEntry[]>>(() => new Map());
    const [inFlight, setInFlight] = useState<InFlightChange | null>(null);

    const handleConfirm = (newValue: number, reason: string) => {
        if (!inFlight) return;
        const { target, kind, historyKey, apply } = inFlight;
        const entry = log({
            action: 'affiliation.rate_change',
            targetType: 'affiliation_rate',
            targetId: kind,
            payload: {
                kind,
                label: target.label,
                oldValue: `${target.current} ${target.suffix}`,
                newValue: `${newValue} ${target.suffix}`,
                reason,
            },
        });
        apply(newValue);
        const update: RateHistoryEntry = {
            id: entry.id,
            label: target.label,
            oldValue: `${target.current} ${target.suffix}`,
            newValue: `${newValue} ${target.suffix}`,
            reason,
            at: entry.ts,
        };
        setHistory((prev) => {
            const next = new Map(prev);
            const list = next.get(historyKey) ?? [];
            next.set(historyKey, [update, ...list].slice(0, 3));
            return next;
        });
        setInFlight(null);
    };

    const editPurchase = (rate: PurchaseRate) =>
        setInFlight({
            target: {
                label: `Achat — ${rate.label}`,
                current: rate.percent,
                suffix: '%',
                bounds: PURCHASE_RATE_BOUNDS,
                validate: (v) => validatePurchaseRate(v)?.message ?? null,
            },
            kind: 'purchase',
            historyKey: purchaseKey(rate.category),
            apply: (next) =>
                setPurchaseRates((prev) =>
                    prev.map((r) => (r.category === rate.category ? { ...r, percent: next } : r)),
                ),
        });

    const editRepairFlat = () =>
        setInFlight({
            target: {
                label: 'Retouche — forfait',
                current: repair.flatEur,
                suffix: '€',
                bounds: REPAIR_FLAT_BOUNDS,
                validate: (v) => validateRepairFlat(v)?.message ?? null,
            },
            kind: 'repair-flat',
            historyKey: repairKey('flat'),
            apply: (next) => setRepair((prev) => ({ ...prev, flatEur: next })),
        });

    const editRepairPct = () =>
        setInFlight({
            target: {
                label: 'Retouche — % du devis',
                current: repair.pct,
                suffix: '%',
                bounds: REPAIR_PCT_BOUNDS,
                validate: (v) => validateRepairPct(v)?.message ?? null,
            },
            kind: 'repair-pct',
            historyKey: repairKey('pct'),
            apply: (next) => setRepair((prev) => ({ ...prev, pct: next })),
        });

    const toggleMode = (mode: 'flat' | 'pct') => {
        if (repair.mode === mode) return;
        setRepair((prev) => ({ ...prev, mode }));
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-lumiris-emerald/20 bg-lumiris-emerald/5 p-4 text-xs">
                <p className="inline-flex items-center gap-2 font-semibold text-foreground">
                    <SlidersHorizontal className="h-3.5 w-3.5" /> Bornes verrouillées
                </p>
                <p className="mt-1 text-muted-foreground">
                    Achat {PURCHASE_RATE_BOUNDS.min}-{PURCHASE_RATE_BOUNDS.max} % · forfait retouche{' '}
                    {REPAIR_FLAT_BOUNDS.min}-{REPAIR_FLAT_BOUNDS.max} € · % devis {REPAIR_PCT_BOUNDS.min}-
                    {REPAIR_PCT_BOUNDS.max} %. Toute modification est audit-loguée (
                    <code className="font-mono">affiliation.rate_change</code>) avec justification ≥{' '}
                    {RATE_CHANGE_REASON_MIN_LENGTH} caractères.
                </p>
            </div>

            <PurchaseSection rates={purchaseRates} history={history} onEdit={editPurchase} />
            <RepairSection
                repair={repair}
                history={history}
                onToggleMode={toggleMode}
                onEditFlat={editRepairFlat}
                onEditPct={editRepairPct}
            />

            <RateChangeDialog
                target={inFlight?.target ?? null}
                onCancel={() => setInFlight(null)}
                onConfirm={handleConfirm}
            />
        </div>
    );
}
