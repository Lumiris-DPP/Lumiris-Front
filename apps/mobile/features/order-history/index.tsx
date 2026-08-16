'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ChevronRight, LogIn, Package, Shirt, Truck } from 'lucide-react';
import type { OrderResponse } from '@lumiris/api-client';
import { ORDER_STATUS_LABEL_BUYER } from '@lumiris/api-client';
import { useMyOrders } from '@lumiris/api-client/react';
import { routes } from '@/lib/routes';
import { useUser } from '@/lib/auth/use-user';
import { formatCents } from '@/lib/marketplace';
import { GlassCard, IridescentBackground, slideUpFade } from '@/lib/motion';

const ORDERS_RETURN = encodeURIComponent('/me/orders');

function formatDate(iso: string | null | undefined): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

// Une ligne par PIÈCE, pas par paiement : chaque atelier expédie son propre colis, donc chaque
// pièce a son suivi, sa fenêtre de retour et son éventuel litige. Regrouper par paiement
// masquerait qu'un colis est arrivé pendant qu'un autre est encore en préparation.
export function OrderHistory() {
    const { isAuthenticated } = useUser();
    const { data: orders = [], isLoading } = useMyOrders({ enabled: isAuthenticated });
    const visible = orders.filter((order) => order.status !== 'PENDING');

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
                        <p className="text-xs text-muted-foreground">Suis chaque pièce jusqu&apos;à ta porte.</p>
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
                ) : visible.length === 0 ? (
                    <GlassCard className="flex flex-col items-center gap-3 p-7 text-center" intensity="subtle">
                        <Package className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.25} aria-hidden />
                        <p className="text-sm font-semibold text-foreground">Aucune commande pour le moment</p>
                        <p className="text-xs text-muted-foreground">
                            Tes achats en Boutique apparaîtront ici, avec leur suivi, leur facture et leur garantie.
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
                        {visible.map((order) => (
                            <li key={order.id}>
                                <OrderRow order={order} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function OrderRow({ order }: { order: OrderResponse }) {
    const date = formatDate(order.createdAt);
    const disputed = order.disputeStatus === 'OPEN';
    const shipping = order.shippingCents ?? 0;

    return (
        <Link
            href={routes.orderTracking(order.id)}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-3 py-3 backdrop-blur-md transition-colors hover:bg-card/80"
        >
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                {order.productPhotoUrl ? (
                    <Image
                        src={order.productPhotoUrl}
                        alt={order.productName ?? ''}
                        fill
                        sizes="56px"
                        className="object-cover"
                        unoptimized
                    />
                ) : (
                    <Shirt className="h-6 w-6 text-muted-foreground/30" strokeWidth={1.5} aria-hidden />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                    {order.productName ?? 'Commande'}
                    {order.variantLabel ? (
                        <span className="font-normal text-muted-foreground"> · {order.variantLabel}</span>
                    ) : null}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                    <span className={disputed ? 'font-semibold text-lumiris-amber' : 'font-semibold text-lumiris-cyan'}>
                        {disputed ? 'Litige en cours' : ORDER_STATUS_LABEL_BUYER[order.status]}
                    </span>
                    {date ? <span>· {date}</span> : null}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="tabular-nums">{formatCents(order.amountTotalCents + shipping)}</span>
                    {order.trackingNumber ? (
                        <span className="inline-flex items-center gap-1">
                            <Truck className="h-3 w-3" aria-hidden />
                            {order.carrier}
                        </span>
                    ) : null}
                    {disputed ? <AlertTriangle className="h-3 w-3 text-lumiris-amber" aria-hidden /> : null}
                </p>
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        </Link>
    );
}
