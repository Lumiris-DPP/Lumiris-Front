'use client';

import { use, useMemo } from 'react';
import { formatDateFr } from '@lumiris/utils';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import { useBilling, useBillingHydrated } from '@/lib/billing-store';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { useAutoPrint } from '@/lib/use-auto-print';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function PrintReceiptPage({ params }: PageProps) {
    const { id } = use(params);
    const artisan = useCurrentArtisan();
    const hydrated = useBillingHydrated();
    const billing = useBilling(artisan.id);

    const entry = useMemo(() => billing.invoiceHistory.find((e) => e.id === id), [billing.invoiceHistory, id]);

    useAutoPrint(hydrated && Boolean(entry));

    if (!hydrated) {
        return <p className="p-12 text-center font-mono text-sm text-neutral-700">Chargement…</p>;
    }

    if (!entry) {
        return <p className="p-12 text-center font-mono text-sm text-neutral-700">Reçu introuvable.</p>;
    }

    const date = new Date(entry.date);

    return (
        <div className="bg-white text-neutral-900">
            <div className="mx-auto flex min-h-screen w-[105mm] flex-col gap-4 p-6 print:min-h-0">
                <header className="space-y-1 border-b border-neutral-300 pb-3">
                    <LumirisLogo title="" className="mb-1 h-5 w-auto" />
                    <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                        LUMIRIS · Atelier
                    </p>
                    <h1 className="text-base font-semibold">Reçu de facturation</h1>
                    <p className="font-mono text-[10px] text-neutral-500">N° {entry.id}</p>
                </header>

                <section className="space-y-1.5 text-sm">
                    <Row label="Émis le">{formatDateFr(date)}</Row>
                    <Row label="Atelier">{artisan.atelierName}</Row>
                    <Row label="Plan">{entry.plan}</Row>
                    <Row label="Statut">payé</Row>
                </section>

                <section className="border-t border-neutral-300 pt-3 text-sm">
                    <div className="flex items-baseline justify-between">
                        <span className="font-medium">Total TTC</span>
                        <span className="font-mono text-lg font-semibold">{entry.amount} €</span>
                    </div>
                    <p className="mt-1 text-[10px] text-neutral-500">TVA non applicable - mode démo.</p>
                </section>

                <footer className="mt-auto border-t border-neutral-300 pt-3 text-[10px] text-neutral-500">
                    Reçu de démonstration. Aucune transaction réelle n’a été effectuée. Ce document est généré
                    localement et n’a aucune valeur fiscale.
                </footer>
            </div>
        </div>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</span>
            <span className="text-right">{children}</span>
        </div>
    );
}
