'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, LogIn, Printer } from 'lucide-react';
import { useOrderGroup } from '@lumiris/api-client/react';
import { useUser } from '@/lib/auth/use-user';
import { formatCents } from '@/lib/marketplace';

const INVOICE_RETURN = (pi: string) => encodeURIComponent(`/commande/${pi}/facture`);

function formatDate(iso: string | null | undefined): string {
    if (!iso) return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(),
    );
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
    const { data: group, isLoading, isError } = useOrderGroup(paymentIntentId, {
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
            <div className="bg-background flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
                <p className="text-foreground text-base font-semibold">Connecte-toi pour voir ta facture</p>
                <Link
                    href={`/auth/sign-in?returnTo=${INVOICE_RETURN(paymentIntentId)}`}
                    className="bg-foreground text-primary-foreground inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                    <LogIn className="h-4 w-4" />
                    Se connecter
                </Link>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-background text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Préparation de ta facture…
            </div>
        );
    }

    if (isError || !group) {
        return (
            <div className="bg-background flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
                <p className="text-foreground text-base font-semibold">Facture indisponible</p>
                <p className="text-muted-foreground text-sm">
                    Impossible de charger cette commande pour le moment. Réessaie dans un instant.
                </p>
                <Link
                    href="/me/orders"
                    className="bg-foreground text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                >
                    Mes commandes
                </Link>
            </div>
        );
    }

    const isPaid = group.status !== 'PENDING';

    return (
        <div className="bg-background flex h-full flex-col overflow-y-auto">
            {/* Barre d'action — écran uniquement (masquée à l'impression). */}
            <div className="facture-no-print mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 pb-3 pt-12 md:px-6">
                <Link
                    href={`/commande/${paymentIntentId}`}
                    className="border-border bg-card text-foreground inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Commande
                </Link>
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-foreground text-primary-foreground inline-flex h-9 items-center gap-2 rounded-full px-4 text-xs font-semibold"
                >
                    <Printer className="h-4 w-4" />
                    Télécharger la facture
                </button>
            </div>

            {/* Feuille de facture — seule partie imprimée. */}
            <div className="mx-auto w-full max-w-3xl px-4 pb-24 md:px-6">
                <article className="facture-print border-border/60 bg-card text-foreground rounded-2xl border p-6 md:p-10">
                    <header className="border-border/60 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-lg font-bold tracking-tight">Lumiris</p>
                            <p className="text-muted-foreground mt-0.5 text-xs">Passeports numériques & Boutique</p>
                        </div>
                        <div className="sm:text-right">
                            <h1 className="text-xl font-bold">Facture</h1>
                            {group.invoiceNumber ? (
                                <p className="text-foreground mt-0.5 font-mono text-sm">{group.invoiceNumber}</p>
                            ) : null}
                            <p className="text-muted-foreground mt-1 text-xs">{formatDate(group.createdAt)}</p>
                        </div>
                    </header>

                    {!isPaid ? (
                        <p className="border-lumiris-amber/30 bg-lumiris-amber/10 text-lumiris-amber mt-6 rounded-xl border p-3 text-xs">
                            Paiement en cours de confirmation — cette facture sera définitive une fois le paiement
                            validé.
                        </p>
                    ) : null}

                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                        <section>
                            <h2 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                                Facturé à
                            </h2>
                            <p className="text-foreground mt-1.5 text-sm font-medium">
                                {user?.displayName?.trim() || 'Client Lumiris'}
                            </p>
                            {user?.email ? <p className="text-muted-foreground text-xs">{user.email}</p> : null}
                        </section>
                        <section className="sm:text-right">
                            <h2 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                                Vendeur
                            </h2>
                            <p className="text-foreground mt-1.5 text-sm font-medium">Atelier partenaire Lumiris</p>
                            <p className="text-muted-foreground text-xs">Vente facilitée par Lumiris</p>
                        </section>
                    </div>

                    <table className="mt-8 w-full text-sm">
                        <thead>
                            <tr className="border-border/60 text-muted-foreground border-b text-[11px] uppercase tracking-wider">
                                <th className="py-2 text-left font-semibold">Désignation</th>
                                <th className="py-2 text-right font-semibold">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {group.lines.map((line) => (
                                <tr key={line.id} className="border-border/40 border-b">
                                    <td className="text-foreground py-2.5 pr-3">{line.productName ?? 'Pièce achetée'}</td>
                                    <td className="text-foreground py-2.5 text-right tabular-nums">
                                        {formatCents(line.amountTotalCents)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <dl className="ml-auto mt-6 flex max-w-xs flex-col gap-2 text-sm">
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
                        <div className="border-border/60 mt-1 flex items-center justify-between border-t pt-2 text-base font-bold">
                            <dt>Total</dt>
                            <dd className="tabular-nums">{formatCents(group.amountChargedCents)}</dd>
                        </div>
                    </dl>

                    <footer className="border-border/60 text-muted-foreground mt-8 border-t pt-4 text-[11px] leading-relaxed">
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
