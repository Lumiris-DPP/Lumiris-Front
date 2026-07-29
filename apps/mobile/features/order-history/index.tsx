'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, FileText, LogIn, Package, ReceiptText } from 'lucide-react';
import { useMyOrders } from '@lumiris/api-client/react';
import type { OrderResponse } from '@lumiris/api-client';
import { routes } from '@/lib/routes';
import { useUser } from '@/lib/auth/use-user';
import { GlassCard, IridescentBackground, slideUpFade } from '@/lib/motion';

const ORDERS_RETURN = encodeURIComponent('/me/orders');

const STATUS_LABEL: Record<string, string> = {
    PENDING: 'En cours',
    PAID: 'Payée',
    FULFILLED: 'Expédiée',
    CANCELLED: 'Annulée',
    REFUNDED: 'Remboursée',
};

interface OrderRow {
    paymentIntentId: string;
    productNames: string[];
    status: string;
    createdAt: string | null;
    invoiceNumber: string | null;
}

// Regroupe les lignes d'un même paiement (un PaymentIntent peut couvrir plusieurs articles).
// L'ordre backend (plus récent d'abord) est préservé. Les lignes sans paymentIntentId sont
// ignorées : sans lui, aucun lien de détail fiable vers la commande.
function groupOrders(orders: OrderResponse[]): OrderRow[] {
    const byPi = new Map<string, OrderRow>();
    const order: string[] = [];
    for (const o of orders) {
        const pi = o.paymentIntentId;
        if (!pi) continue;
        let row = byPi.get(pi);
        if (!row) {
            row = {
                paymentIntentId: pi,
                productNames: [],
                status: o.status,
                createdAt: o.createdAt ?? null,
                invoiceNumber: o.invoiceNumber ?? null,
            };
            byPi.set(pi, row);
            order.push(pi);
        }
        if (o.productName) row.productNames.push(o.productName);
        if (!row.invoiceNumber && o.invoiceNumber) row.invoiceNumber = o.invoiceNumber;
    }
    return order.map((pi) => byPi.get(pi) as OrderRow);
}

function formatDate(iso: string | null): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function OrderHistory() {
    const { isAuthenticated } = useUser();
    const { data: orders = [], isLoading } = useMyOrders({ enabled: isAuthenticated });

    const rows = groupOrders(orders);

    return (
        <div className="relative flex h-full flex-col overflow-y-auto pb-28">
            <IridescentBackground intensity="subtle" />

            <motion.header
                className="px-5 pt-[max(env(safe-area-inset-top),3rem)] pb-5"
                variants={slideUpFade}
                initial="initial"
                animate="animate"
            >
                <Link
                    href="/me"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Profil
                </Link>
                <div className="mt-3 flex items-center gap-3">
                    <span
                        aria-hidden
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/60"
                    >
                        <Package className="h-5 w-5 text-foreground" strokeWidth={1.6} />
                    </span>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Mes commandes</h1>
                        <p className="text-xs text-muted-foreground">Tes achats et leurs justificatifs.</p>
                    </div>
                </div>
            </motion.header>

            <div className="flex flex-col gap-3 px-4">
                {!isAuthenticated ? (
                    <GlassCard className="flex flex-col items-center gap-4 p-7 text-center" intensity="subtle">
                        <p className="text-sm font-semibold text-foreground">Connecte-toi pour voir tes commandes</p>
                        <Link
                            href={`/auth/sign-in?returnTo=${ORDERS_RETURN}`}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-primary-foreground"
                        >
                            <LogIn className="h-4 w-4" />
                            Se connecter
                        </Link>
                    </GlassCard>
                ) : isLoading ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Chargement de tes commandes…</p>
                ) : rows.length === 0 ? (
                    <GlassCard className="flex flex-col items-center gap-3 p-7 text-center" intensity="subtle">
                        <Package className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.25} aria-hidden />
                        <p className="text-sm font-semibold text-foreground">Aucune commande pour le moment</p>
                        <p className="text-xs text-muted-foreground">
                            Tes achats en Boutique apparaîtront ici, avec leur facture et leur garantie.
                        </p>
                        <Link
                            href="/boutique"
                            className="mt-1 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground"
                        >
                            Découvrir la Boutique
                        </Link>
                    </GlassCard>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {rows.map((row) => {
                            const title =
                                row.productNames.length === 0
                                    ? 'Commande'
                                    : row.productNames.length === 1
                                      ? row.productNames[0]
                                      : `${row.productNames[0]} +${row.productNames.length - 1}`;
                            const date = formatDate(row.createdAt);
                            return (
                                <li
                                    key={row.paymentIntentId}
                                    className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md"
                                >
                                    <Link
                                        href={routes.order(row.paymentIntentId)}
                                        className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-card/80"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-foreground">{title}</p>
                                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                                                <span>{STATUS_LABEL[row.status] ?? row.status}</span>
                                                {date ? <span>· {date}</span> : null}
                                                {row.invoiceNumber ? (
                                                    <span className="inline-flex items-center gap-1 font-mono">
                                                        <ReceiptText className="h-3 w-3" aria-hidden />
                                                        {row.invoiceNumber}
                                                    </span>
                                                ) : null}
                                            </p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                                    </Link>
                                    {row.invoiceNumber ? (
                                        <Link
                                            href={routes.orderInvoice(row.paymentIntentId)}
                                            className="flex items-center gap-1.5 border-t border-border/60 px-4 py-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            <FileText className="h-3.5 w-3.5" aria-hidden />
                                            Télécharger la facture
                                        </Link>
                                    ) : null}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
