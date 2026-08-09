'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, LogIn, Printer } from 'lucide-react';
import { useOrderGroup } from '@lumiris/api-client/react';
import { routes } from '@/lib/routes';
import { useUser } from '@/lib/auth/use-user';
import { formatCents } from '@/lib/marketplace';

const INVOICE_RETURN = (pi: string) => encodeURIComponent(routes.orderInvoice(pi));

function formatDate(iso: string | null | undefined): string {
    if (!iso)
        return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

// Facture imprimable rattachée au PaymentIntent (GET /api/orders/group/{pi}). Le segment [id]
// de la route est le paymentIntentId. La feuille porte `.facture-print` : l'impression (voir
// globals.css) masque l'app et n'imprime que cette feuille — l'export PDF passe par le
// navigateur (window.print → « Enregistrer au format PDF »).
export function OrderInvoice({ paymentIntentId }: { paymentIntentId: string }) {
    const { user, isAuthenticated } = useUser();
    const {
        data: group,
        isLoading,
        isError,
    } = useOrderGroup(paymentIntentId, {
        enabled: isAuthenticated && Boolean(paymentIntentId),
    });
    const autoPrinted = useRef(false);

    // Impression automatique une seule fois, dès que la facture est prête : le bouton
    // « Télécharger la facture » ouvre cette vue puis déclenche l'impression du navigateur.
    useEffect(() => {
        if (autoPrinted.current || !group) return;
        autoPrinted.current = true;
        const timer = window.setTimeout(() => window.print(), 400);
        return () => window.clearTimeout(timer);
    }, [group]);

    if (!isAuthenticated) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-5 bg-background px-8 text-center">
                <p className="text-base font-semibold text-foreground">Connecte-toi pour voir ta facture</p>
                <Link
                    href={`/auth/sign-in?returnTo=${INVOICE_RETURN(paymentIntentId)}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-primary-foreground"
                >
                    <LogIn className="h-4 w-4" />
                    Se connecter
                </Link>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Préparation de ta facture…
            </div>
        );
    }

    if (isError || !group) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 bg-background px-8 text-center">
                <p className="text-base font-semibold text-foreground">Facture indisponible</p>
                <p className="text-sm text-muted-foreground">
                    Impossible de charger cette commande pour le moment. Réessaie dans un instant.
                </p>
                <Link
                    href="/me/orders"
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                    Mes commandes
                </Link>
            </div>
        );
    }

    const isPaid = group.status !== 'PENDING';
    // Une facture qui ignore les remboursements ment sur ce que le client a réellement payé —
    // c'est la pièce qu'il produit à sa comptabilité ou à sa banque.
    const refundedCents = group.lines.reduce((sum, line) => sum + (line.refundedCents ?? 0), 0);
    const cancelledLines = group.lines.filter((line) => line.status === 'CANCELLED');

    return (
        <div className="flex h-full flex-col overflow-y-auto bg-background">
            {/* Barre d'action — écran uniquement (masquée à l'impression). */}
            <div className="facture-no-print mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 pt-12 pb-3 md:px-6">
                <Link
                    href={routes.order(paymentIntentId)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Commande
                </Link>
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-xs font-semibold text-primary-foreground"
                >
                    <Printer className="h-4 w-4" />
                    Télécharger la facture
                </button>
            </div>

            {/* Feuille de facture — seule partie imprimée. */}
            <div className="mx-auto w-full max-w-3xl px-4 pb-24 md:px-6">
                <article className="facture-print rounded-2xl border border-border/60 bg-card p-6 text-foreground md:p-10">
                    <header className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-lg font-bold tracking-tight">Lumiris</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">Passeports numériques & Boutique</p>
                        </div>
                        <div className="sm:text-right">
                            <h1 className="text-xl font-bold">Facture</h1>
                            {group.invoiceNumber ? (
                                <p className="mt-0.5 font-mono text-sm text-foreground">{group.invoiceNumber}</p>
                            ) : null}
                            <p className="mt-1 text-xs text-muted-foreground">{formatDate(group.createdAt)}</p>
                        </div>
                    </header>

                    {!isPaid ? (
                        <p className="mt-6 rounded-xl border border-lumiris-amber/30 bg-lumiris-amber/10 p-3 text-xs text-lumiris-amber">
                            Paiement en cours de confirmation — cette facture sera définitive une fois le paiement
                            validé.
                        </p>
                    ) : null}

                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                        <section>
                            <h2 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                Facturé à
                            </h2>
                            <p className="mt-1.5 text-sm font-medium text-foreground">
                                {user?.displayName?.trim() || 'Client Lumiris'}
                            </p>
                            {user?.email ? <p className="text-xs text-muted-foreground">{user.email}</p> : null}
                        </section>
                        <section className="sm:text-right">
                            <h2 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                Vendeur
                            </h2>
                            <p className="mt-1.5 text-sm font-medium text-foreground">Atelier partenaire Lumiris</p>
                            <p className="text-xs text-muted-foreground">Vente facilitée par Lumiris</p>
                        </section>
                    </div>

                    <table className="mt-8 w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/60 text-[11px] tracking-wider text-muted-foreground uppercase">
                                <th className="py-2 text-left font-semibold">Désignation</th>
                                <th className="py-2 text-right font-semibold">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {group.lines.map((line) => {
                                const cancelled = line.status === 'CANCELLED';
                                return (
                                    <tr key={line.id} className="border-b border-border/40">
                                        <td className="py-2.5 pr-3 text-foreground">
                                            {line.productName ?? 'Pièce achetée'}
                                            {cancelled ? (
                                                <span className="ml-2 text-[11px] text-muted-foreground">
                                                    — annulée
                                                </span>
                                            ) : null}
                                        </td>
                                        <td
                                            className={`py-2.5 text-right tabular-nums ${
                                                cancelled ? 'text-muted-foreground line-through' : 'text-foreground'
                                            }`}
                                        >
                                            {formatCents(line.amountTotalCents)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <dl className="mt-6 ml-auto flex max-w-xs flex-col gap-2 text-sm">
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
                        <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2 text-base font-bold">
                            <dt>Total payé</dt>
                            <dd className="tabular-nums">{formatCents(group.amountChargedCents)}</dd>
                        </div>
                        {refundedCents > 0 ? (
                            <>
                                <div className="flex items-center justify-between text-sm">
                                    <dt className="text-muted-foreground">
                                        Remboursé{cancelledLines.length > 0 ? ' (annulation)' : ''}
                                    </dt>
                                    <dd className="text-foreground tabular-nums">−{formatCents(refundedCents)}</dd>
                                </div>
                                <div className="flex items-center justify-between border-t border-border/60 pt-2 text-base font-bold">
                                    <dt>Reste à votre charge</dt>
                                    <dd className="tabular-nums">
                                        {formatCents(Math.max(0, group.amountChargedCents - refundedCents))}
                                    </dd>
                                </div>
                            </>
                        ) : null}
                    </dl>

                    <footer className="mt-8 border-t border-border/60 pt-4 text-[11px] leading-relaxed text-muted-foreground">
                        <p>TVA non applicable, art. 293 B du CGI.</p>
                        <p className="mt-1">
                            Lumiris facilite la vente entre l&apos;acheteur et l&apos;atelier vendeur. Ce document tient
                            lieu de facture pour votre achat et est rattaché à votre passeport numérique.
                        </p>
                    </footer>
                </article>
            </div>
        </div>
    );
}
