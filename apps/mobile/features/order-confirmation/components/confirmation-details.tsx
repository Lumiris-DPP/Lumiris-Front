'use client';

import Link from '@/components/navigation-link';

import { motion } from 'framer-motion';
import {
    CheckCircle2,
    ChevronRight,
    Clock,
    FileText,
    Loader2,
    Mail,
    RotateCcw,
    ShieldCheck,
    Sparkles,
    Truck,
} from 'lucide-react';

import { cn } from '@lumiris/ui/lib/cn';
import { routes } from '@/lib/routes';

import { formatCents } from '@/lib/marketplace/money';
import type { confirmationView } from '../models/confirmation-view';

import type { OrderGroup } from '@lumiris/api-client';
import { confirmationRefundFacts, confirmationTotalLabel } from '../models/confirmation-view';

// Affiche les montants et informations de la confirmation.
export function ConfirmationDetails({
    group,
    view,
    targetPi,
    wardrobeCount,
}: {
    group: OrderGroup;
    view: ReturnType<typeof confirmationView>;
    targetPi: string | null;
    wardrobeCount: number;
}) {
    const settling = view === 'pending' || view === 'pending-timeout';
    const unwound = view === 'unwound';
    const refundFacts = confirmationRefundFacts(group);
    const sellerCount = new Set(group.lines.map((line) => line.sellerName ?? '')).size;
    return (
        <div className="flex h-full flex-col overflow-y-auto bg-background pb-28">
            <div className="flex flex-col items-center px-6 pt-16 text-center">
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className={cn(
                        'flex h-20 w-20 items-center justify-center rounded-full',
                        unwound || settling
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-lumiris-emerald/10 text-lumiris-emerald',
                    )}
                >
                    {unwound ? (
                        <RotateCcw className="h-10 w-10" />
                    ) : settling ? (
                        <Clock className="h-10 w-10" />
                    ) : (
                        <CheckCircle2 className="h-10 w-10" />
                    )}
                </motion.div>
                <motion.h1
                    className="mt-5 text-xl font-bold text-balance text-foreground"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {unwound
                        ? group.status === 'REFUNDED'
                            ? refundFacts.refundedCents > 0 && refundFacts.refundedCents < group.amountChargedCents
                                ? 'Commande partiellement remboursée'
                                : 'Commande remboursée'
                            : 'Commande annulée'
                        : settling
                          ? 'Paiement en cours de confirmation'
                          : 'Commande confirmée'}
                </motion.h1>
                {group.invoiceNumber ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                        Facture <span className="font-mono text-foreground">{group.invoiceNumber}</span>
                    </p>
                ) : view === 'pending' ? (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Validation de la commande en cours…
                    </p>
                ) : null}
                {settling || group.status === 'CANCELLED' ? null : (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground/90">
                        <Mail className="h-3.5 w-3.5" aria-hidden />
                        {unwound
                            ? 'Le détail du remboursement t’a été envoyé par email.'
                            : 'Un reçu t’a été envoyé par email.'}
                    </p>
                )}
            </div>

            {view === 'pending-timeout' ? (
                <div className="mt-8 px-4">
                    <section className="rounded-2xl border border-lumiris-amber/30 bg-lumiris-amber/10 p-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-lumiris-amber" />
                            <h2 className="text-sm font-semibold text-foreground">Paiement en cours de confirmation</h2>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            La confirmation de ta commande peut prendre quelques instants — tu la retrouveras dans « Mes
                            commandes » dès qu&apos;elle est validée, avec son suivi.
                        </p>
                        <Link
                            href="/me/orders"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-lumiris-amber/40 px-3 py-1.5 text-xs font-semibold text-foreground"
                        >
                            Voir mes commandes
                        </Link>
                    </section>
                </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-4 px-4">
                <section className="opal-shadow rounded-2xl border border-border/60 bg-card p-4">
                    <h2 className="mb-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        {group.lines.length > 1 ? `Articles (${group.lines.length})` : 'Article'}
                    </h2>

                    <ul className="flex flex-col gap-1">
                        {group.lines.map((line) => (
                            <li key={line.id}>
                                <Link
                                    href={routes.orderTracking(line.id)}
                                    className="-mx-1 flex items-center justify-between gap-2 rounded-lg px-1 py-1.5 transition-colors hover:bg-muted/50"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-foreground">
                                            {line.productName ?? 'Pièce achetée'}
                                            {line.variantLabel ? ` (${line.variantLabel})` : ''}
                                        </span>
                                        {line.sellerName ? (
                                            <span className="block truncate text-[11px] text-muted-foreground">
                                                {line.sellerName}
                                            </span>
                                        ) : null}
                                    </span>
                                    <span className="shrink-0 text-sm text-foreground tabular-nums">
                                        {formatCents(line.amountTotalCents)}
                                    </span>
                                    <ChevronRight
                                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
                                        aria-hidden
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <dl className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-3 text-sm">
                        <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">Sous-total</dt>
                            <dd className="text-foreground tabular-nums">{formatCents(group.itemsTotalCents)}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">Livraison</dt>
                            <dd className="text-foreground tabular-nums">
                                {group.shippingCents === 0 ? 'Offerte' : formatCents(group.shippingCents)}
                            </dd>
                        </div>
                        <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2 font-semibold">
                            <dt className="text-foreground">{confirmationTotalLabel(group.status)}</dt>
                            <dd className="text-foreground tabular-nums">{formatCents(group.amountChargedCents)}</dd>
                        </div>
                        {refundFacts.refundedCents > 0 ? (
                            <div className="flex items-center justify-between">
                                <dt>Montant remboursé</dt>
                                <dd>{formatCents(refundFacts.refundedCents)}</dd>
                            </div>
                        ) : null}
                    </dl>
                </section>

                <section className="rounded-2xl border border-border/60 bg-card p-4">
                    <div className="flex items-center gap-2">
                        {unwound ? (
                            <RotateCcw className="h-4 w-4 text-muted-foreground" aria-hidden />
                        ) : (
                            <Truck className="h-4 w-4 text-muted-foreground" aria-hidden />
                        )}
                        <h2 className="text-sm font-semibold text-foreground">Et maintenant ?</h2>
                    </div>
                    {settling ? (
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            La préparation commence après confirmation du paiement.
                        </p>
                    ) : null}
                    {refundFacts.message ? (
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{refundFacts.message}</p>
                    ) : null}
                    <p
                        className={cn(
                            'mt-1.5 text-xs leading-relaxed text-muted-foreground',
                            (unwound || settling) && 'hidden',
                        )}
                    >
                        {sellerCount > 1
                            ? 'Chaque article conserve son propre suivi, y compris en cas d’annulation ou de remboursement. Consulte les articles ci-dessus pour connaître les expéditions.'
                            : 'Consulte le suivi de ta pièce pour connaître sa préparation et son expédition.'}
                    </p>
                    <p
                        className={cn(
                            'mt-1.5 text-xs leading-relaxed text-muted-foreground',
                            (unwound || settling) && 'hidden',
                        )}
                    >
                        Le suivi indique les actions disponibles pour chaque article.
                    </p>
                </section>

                <section
                    className={cn(
                        'rounded-2xl border border-lumiris-emerald/30 bg-lumiris-emerald/5 p-4',
                        unwound && 'hidden',
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-lumiris-emerald" />
                        <h2 className="text-sm font-semibold text-foreground">
                            {settling ? 'Ta Garde-Robe après validation' : 'Ajouté à ta Garde-Robe'}
                        </h2>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {settling
                            ? 'Ta pièce rejoint ta Garde-Robe dès la validation du paiement, avec son passeport et ses justificatifs.'
                            : 'Ta pièce a rejoint ta Garde-Robe avec son passeport numérique. Tes justificatifs sont rattachés :'}
                    </p>
                    {!settling ? (
                        <ul className="mt-3 flex flex-col gap-2">
                            <li className="flex items-center gap-2 text-sm text-foreground">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                Facture {group.invoiceNumber}
                            </li>
                            <li className="flex items-center gap-2 text-sm text-foreground">
                                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                Certificat de garantie
                            </li>
                        </ul>
                    ) : null}
                </section>

                {!settling && !unwound && wardrobeCount > 0 ? (
                    <p className="text-center text-xs text-muted-foreground">
                        {wardrobeCount} pièce{wardrobeCount > 1 ? 's' : ''} dans ta Garde-Robe.
                    </p>
                ) : null}
            </div>

            <div className="mt-8 flex flex-col gap-2 px-4">
                {group.invoiceNumber && targetPi ? (
                    <Link
                        href={routes.orderInvoice(targetPi)}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-semibold text-foreground"
                    >
                        <FileText className="h-4 w-4" />
                        Télécharger la facture
                    </Link>
                ) : null}
                <Link
                    href="/garde-robe"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-primary-foreground"
                >
                    Voir ma Garde-Robe
                </Link>
                <Link
                    href="/boutique"
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-semibold text-foreground"
                >
                    Continuer mes achats
                </Link>
            </div>
        </div>
    );
}
