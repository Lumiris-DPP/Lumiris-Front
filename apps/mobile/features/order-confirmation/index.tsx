'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, FileText, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { useMyOrders, useWardrobe } from '@lumiris/api-client/react';
import { useUser } from '@/lib/auth/use-user';
import { clearCart, formatCents } from '@/lib/marketplace';

export function OrderConfirmation() {
    const { isAuthenticated } = useUser();

    // Filet de sécurité : vider le panier à l'arrivée (notamment après redirection 3-D Secure).
    useEffect(() => {
        clearCart();
    }, []);

    // La commande passe à PAID via le webhook Stripe → on poll jusqu'à confirmation.
    const { data: orders = [], isLoading } = useMyOrders({
        enabled: isAuthenticated,
        refetchInterval: (query) => {
            const latest = query.state.data?.[0];
            return latest && latest.status !== 'PENDING' ? false : 1500;
        },
    });
    const { data: wardrobe = [] } = useWardrobe({ enabled: isAuthenticated });

    const order = orders[0] ?? null;
    const settling = !order || order.status === 'PENDING';

    return (
        <div className="bg-background flex h-full flex-col overflow-y-auto pb-28">
            <div className="flex flex-col items-center px-6 pt-16 text-center">
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="bg-lumiris-emerald/10 text-lumiris-emerald flex h-20 w-20 items-center justify-center rounded-full"
                >
                    <CheckCircle2 className="h-10 w-10" />
                </motion.div>
                <motion.h1
                    className="text-foreground mt-5 text-balance text-xl font-bold"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {settling ? 'Paiement reçu' : 'Commande confirmée'}
                </motion.h1>
                {order?.invoiceNumber ? (
                    <p className="text-muted-foreground mt-1 text-sm">
                        Facture <span className="text-foreground font-mono">{order.invoiceNumber}</span>
                    </p>
                ) : (
                    <p className="text-muted-foreground mt-1 inline-flex items-center gap-1.5 text-sm">
                        {settling && (isLoading || order) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {settling ? 'Validation de la commande en cours…' : null}
                    </p>
                )}
            </div>

            {order ? (
                <div className="mt-8 flex flex-col gap-4 px-4">
                    <section className="border-border/60 bg-card opal-shadow rounded-2xl border p-4">
                        <h2 className="text-muted-foreground mb-3 text-[11px] font-semibold uppercase tracking-wider">
                            Article
                        </h2>
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-foreground truncate text-sm font-medium">
                                {order.productName ?? 'Pièce achetée'}
                            </p>
                            <span className="text-foreground shrink-0 text-sm tabular-nums">
                                {formatCents(order.amountTotalCents)}
                            </span>
                        </div>
                        <div className="border-border/60 mt-3 flex items-center justify-between border-t pt-3 text-sm font-semibold">
                            <span className="text-foreground">Total payé</span>
                            <span className="text-foreground tabular-nums">{formatCents(order.amountTotalCents)}</span>
                        </div>
                    </section>

                    <section className="border-lumiris-emerald/30 bg-lumiris-emerald/5 rounded-2xl border p-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="text-lumiris-emerald h-4 w-4" />
                            <h2 className="text-foreground text-sm font-semibold">Ajouté à ta Garde-Robe</h2>
                        </div>
                        <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                            {settling
                                ? 'Ta pièce rejoint ta Garde-Robe dès la validation du paiement, avec son passeport et ses justificatifs.'
                                : 'Ta pièce a rejoint ta Garde-Robe avec son passeport numérique. Tes justificatifs sont rattachés :'}
                        </p>
                        {!settling ? (
                            <ul className="mt-3 flex flex-col gap-2">
                                <li className="text-foreground flex items-center gap-2 text-sm">
                                    <FileText className="text-muted-foreground h-4 w-4" />
                                    Facture {order.invoiceNumber}
                                </li>
                                <li className="text-foreground flex items-center gap-2 text-sm">
                                    <ShieldCheck className="text-muted-foreground h-4 w-4" />
                                    Certificat de garantie
                                </li>
                            </ul>
                        ) : null}
                    </section>

                    {!settling && wardrobe.length > 0 ? (
                        <p className="text-muted-foreground text-center text-xs">
                            {wardrobe.length} pièce{wardrobe.length > 1 ? 's' : ''} dans ta Garde-Robe.
                        </p>
                    ) : null}
                </div>
            ) : (
                <div className="text-muted-foreground mt-10 flex items-center justify-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Récupération de ta commande…
                </div>
            )}

            <div className="mt-8 flex flex-col gap-2 px-4">
                <Link
                    href="/garde-robe"
                    className="bg-foreground text-primary-foreground flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold"
                >
                    Voir ma Garde-Robe
                </Link>
                <Link
                    href="/boutique"
                    className="border-border text-foreground flex w-full items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold"
                >
                    Continuer mes achats
                </Link>
            </div>
        </div>
    );
}
