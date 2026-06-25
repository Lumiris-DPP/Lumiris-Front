'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import { formatEur, getOrderById, type Order } from '@/lib/marketplace';

export function OrderConfirmation({ orderId }: { orderId: string }) {
    // L'Order vit dans le localStorage scopé user ; on le lit côté client après montage.
    const [order, setOrder] = useState<Order | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setOrder(getOrderById(orderId));
        setReady(true);
    }, [orderId]);

    if (ready && !order) {
        return (
            <div className="bg-background flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
                <p className="text-foreground text-base font-semibold">Commande introuvable</p>
                <Link
                    href="/boutique"
                    className="bg-foreground text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                >
                    Retour à la Boutique
                </Link>
            </div>
        );
    }

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
                    Commande confirmée
                </motion.h1>
                {order ? (
                    <p className="text-muted-foreground mt-1 text-sm">
                        Commande <span className="text-foreground font-mono">{order.number}</span>
                    </p>
                ) : null}
            </div>

            {order ? (
                <div className="mt-8 flex flex-col gap-4 px-4">
                    <section className="border-border/60 bg-card opal-shadow rounded-2xl border p-4">
                        <h2 className="text-muted-foreground mb-3 text-[11px] font-semibold uppercase tracking-wider">
                            Articles
                        </h2>
                        <ul className="flex flex-col gap-2">
                            {order.lines.map((line) => (
                                <li key={line.passportId} className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-foreground truncate text-sm font-medium">
                                            {line.quantity} × {line.reference}
                                        </p>
                                        <p className="text-muted-foreground truncate text-xs">{line.artisanName}</p>
                                    </div>
                                    <span className="text-foreground shrink-0 text-sm tabular-nums">
                                        {formatEur(line.unitPrice * line.quantity)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <div className="border-border/60 mt-3 flex items-center justify-between border-t pt-3 text-sm font-semibold">
                            <span className="text-foreground">Total payé</span>
                            <span className="text-foreground tabular-nums">{formatEur(order.total)}</span>
                        </div>
                    </section>

                    <section className="border-lumiris-emerald/30 bg-lumiris-emerald/5 rounded-2xl border p-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="text-lumiris-emerald h-4 w-4" />
                            <h2 className="text-foreground text-sm font-semibold">Ajouté à ta Garde-Robe</h2>
                        </div>
                        <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                            Chaque pièce a rejoint ta Garde-Robe avec son passeport numérique. Tes justificatifs sont
                            chiffrés et rattachés :
                        </p>
                        <ul className="mt-3 flex flex-col gap-2">
                            <li className="text-foreground flex items-center gap-2 text-sm">
                                <FileText className="text-muted-foreground h-4 w-4" />
                                Facture {order.number}
                            </li>
                            <li className="text-foreground flex items-center gap-2 text-sm">
                                <ShieldCheck className="text-muted-foreground h-4 w-4" />
                                Certificat de garantie
                            </li>
                        </ul>
                    </section>

                    <section className="border-border/60 bg-card rounded-2xl border p-4">
                        <h2 className="text-muted-foreground mb-1 text-[11px] font-semibold uppercase tracking-wider">
                            Livraison
                        </h2>
                        <p className="text-foreground text-sm">{order.address.fullName}</p>
                        <p className="text-muted-foreground text-xs">
                            {order.address.line1}, {order.address.postalCode} {order.address.city}
                        </p>
                    </section>
                </div>
            ) : null}

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
