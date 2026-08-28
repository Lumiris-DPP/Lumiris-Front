'use client';

import Link from 'next/link';
import { ChevronRight, FileText, ShieldCheck } from 'lucide-react';
import { useMyOrders, useWardrobe } from '@lumiris/api-client/react';
import { formatDate } from '@lumiris/utils';
import { routes } from '@/lib/routes';

interface PurchaseDocument {
    key: string;
    icon: typeof FileText;
    title: string;
    detail: string;
    href: string;
}

/**
 * Justificatifs produits par un achat — facture et certificat de garantie. Ils vivent côté
 * serveur, pas dans le coffre chiffré local : sans cette section, l'écran de confirmation
 * annonçait des justificatifs rattachés que « Mes documents » ne montrait nulle part.
 */
export function PurchaseDocuments({ userId }: { userId: string | null }) {
    const enabled = userId !== null;
    const { data: orders = [] } = useMyOrders({ enabled });
    const { data: wardrobe = [] } = useWardrobe(userId, { enabled });

    const invoices: PurchaseDocument[] = orders
        .filter((order) => order.invoiceNumber && order.paymentIntentId)
        .map((order) => ({
            key: `invoice-${order.id}`,
            icon: FileText,
            title: `Facture ${order.invoiceNumber}`,
            detail: [order.productName, order.createdAt ? formatDate(order.createdAt) : null]
                .filter(Boolean)
                .join(' · '),
            href: routes.orderInvoice(order.paymentIntentId as string),
        }));

    const warranties: PurchaseDocument[] = wardrobe
        .filter((item) => item.warrantyUntil || item.warrantyDescription)
        .map((item) => ({
            key: `warranty-${item.id}`,
            icon: ShieldCheck,
            title: 'Certificat de garantie',
            detail: [item.productName, item.warrantyUntil ? `jusqu'au ${formatDate(item.warrantyUntil)}` : null]
                .filter(Boolean)
                .join(' · '),
            href: '/garde-robe',
        }));

    const documents = [...invoices, ...warranties];
    if (documents.length === 0) return null;

    return (
        <section className="px-4 pt-4">
            <h2 className="mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Justificatifs d&apos;achat
            </h2>
            <ul className="flex flex-col gap-2">
                {documents.map((document) => {
                    const Icon = document.icon;
                    return (
                        <li key={document.key}>
                            <Link
                                href={document.href}
                                className="opal-shadow flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3"
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-foreground">
                                        {document.title}
                                    </span>
                                    {document.detail ? (
                                        <span className="block truncate text-[11px] text-muted-foreground">
                                            {document.detail}
                                        </span>
                                    ) : null}
                                </span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
