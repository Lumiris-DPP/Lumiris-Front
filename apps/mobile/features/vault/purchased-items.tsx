'use client';

import { BadgeCheck, ShieldCheck } from 'lucide-react';
import { useWardrobe as useBackendWardrobe } from '@lumiris/api-client/react';
import { useUser } from '@/lib/auth/use-user';

export function PurchasedItems() {
    const { isAuthenticated } = useUser();
    const { data: items = [] } = useBackendWardrobe({ enabled: isAuthenticated });

    if (!isAuthenticated || items.length === 0) return null;

    return (
        <section className="px-5 pb-2 pt-1">
            <div className="mb-2 flex items-center gap-2">
                <BadgeCheck className="text-primary h-4 w-4" strokeWidth={1.75} aria-hidden />
                <h2 className="text-foreground text-sm font-semibold">Mes achats</h2>
            </div>
            <ul className="flex flex-col gap-2">
                {items.map((it) => (
                    <li key={it.id} className="border-border/60 bg-card rounded-2xl border p-3">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-foreground truncate text-sm font-medium">
                                {it.productName ?? 'Pièce achetée'}
                            </p>
                            {it.invoiceNumber ? (
                                <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                                    {it.invoiceNumber}
                                </span>
                            ) : null}
                        </div>
                        {it.warrantyDescription ? (
                            <p className="text-muted-foreground mt-1 inline-flex items-center gap-1 text-[11px]">
                                <ShieldCheck className="text-lumiris-emerald h-3 w-3" aria-hidden />
                                {it.warrantyDescription}
                            </p>
                        ) : null}
                    </li>
                ))}
            </ul>
        </section>
    );
}
