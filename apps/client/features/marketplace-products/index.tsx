'use client';

import { useState } from 'react';
import {
    Archive,
    ExternalLink,
    Eye,
    Loader2,
    PackagePlus,
    Pencil,
    ShoppingBag,
    Trash2,
    Wallet,
    Wand2,
} from 'lucide-react';
import type { MarketplaceItem } from '@lumiris/api-client';
import {
    useDeleteProduct,
    useMyProducts,
    useSellerDashboardLink,
    useSellerStats,
    useSellerStatus,
    useStartSellerOnboarding,
} from '@lumiris/api-client/react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@lumiris/ui/components/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { toast } from '@lumiris/ui/components/sonner';
import { formatPriceCents } from '@lumiris/utils';
import { useAuthStore } from '@/lib/auth-store';
import { EmptyState } from '@/features/empty-state';
import { ProductFormDialog } from './product-form-dialog';
import { ConvertDppDialog } from './convert-dpp-dialog';
import { STATUS_LABEL } from './labels';

export function MarketplaceProducts() {
    const token = useAuthStore((s) => s.token);
    const { data: products = [], isLoading, error } = useMyProducts({ enabled: Boolean(token) });
    const deleteMutation = useDeleteProduct();

    const [formOpen, setFormOpen] = useState(false);
    const [convertOpen, setConvertOpen] = useState(false);
    const [editing, setEditing] = useState<MarketplaceItem | undefined>(undefined);
    const [toDelete, setToDelete] = useState<MarketplaceItem | undefined>(undefined);

    const openEdit = (product: MarketplaceItem) => {
        setEditing(product);
        setFormOpen(true);
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        deleteMutation.mutate(toDelete.id, {
            onSuccess: () => toast.success('Produit supprimé.'),
            onError: (e) => toast.error(e.message || 'Échec de la suppression.'),
        });
        setToDelete(undefined);
    };

    if (isLoading) {
        return <div className="text-muted-foreground p-8 text-sm">Chargement…</div>;
    }
    if (error) {
        return <div className="text-destructive p-8 text-sm">Erreur : {error.message}</div>;
    }

    return (
        <div className="space-y-4 p-8">
            <SellerConnectBanner />
            <SellerStatsCards />
            <div className="flex items-center justify-end gap-2">
                <StripeDashboardButton />
                <Button
                    onClick={() => setConvertOpen(true)}
                    className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 text-white"
                >
                    <Wand2 className="mr-1.5 h-4 w-4" /> Convertir un DPP en produit
                </Button>
            </div>

            {products.length === 0 ? (
                <EmptyState
                    icon={PackagePlus}
                    title="Votre catalogue est vide"
                    description="Convertissez un passeport (DPP) en produit pour le rendre visible dans la Marketplace VISION."
                >
                    <Button onClick={() => setConvertOpen(true)}>Convertir un DPP</Button>
                </EmptyState>
            ) : (
                <div className="rounded-xl border">
                    <Table>
                        <caption className="sr-only">Vos produits Marketplace</caption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead>Prix</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead className="text-right">Vues</TableHead>
                                <TableHead className="text-right">Ventes</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-muted-foreground text-xs">
                                            {[product.category, product.material, product.originCountry]
                                                .filter(Boolean)
                                                .join(' · ') || '—'}
                                            {product.atelierPlus ? (
                                                <Badge variant="outline" className="ml-2 text-[10px]">
                                                    ATELIER+
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatPriceCents(product.priceCents, product.currency)}</TableCell>
                                    <TableCell>{product.stock}</TableCell>
                                    <TableCell className="text-muted-foreground text-right tabular-nums">
                                        {product.views ?? 0}
                                    </TableCell>
                                    <TableCell className="text-right font-medium tabular-nums">
                                        {product.salesCount ?? 0}
                                    </TableCell>
                                    <TableCell>
                                        {product.irisGrade ? (
                                            <Badge variant="secondary">
                                                {product.irisGrade}
                                                {product.irisTotal != null ? ` · ${product.irisTotal}` : ''}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={product.status === 'PUBLISHED' ? 'default' : 'outline'}>
                                            {STATUS_LABEL[product.status] ?? product.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEdit(product)}
                                            aria-label="Modifier"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setToDelete(product)}
                                            aria-label="Supprimer"
                                        >
                                            <Trash2 className="text-destructive h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} />
            <ConvertDppDialog open={convertOpen} onOpenChange={setConvertOpen} />

            <AlertDialog open={Boolean(toDelete)} onOpenChange={(open) => (open ? null : setToDelete(undefined))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            « {toDelete?.name} » sera retiré du catalogue. Cette action est définitive.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function SellerConnectBanner() {
    const token = useAuthStore((s) => s.token);
    const { data: status } = useSellerStatus({ enabled: Boolean(token) });
    const onboarding = useStartSellerOnboarding();

    // Une fois les paiements activés, plus de bandeau : l'activation est acquise.
    if (!token || status?.chargesEnabled) return null;

    // Onboarding Stripe Connect en redirection pure (page hébergée Stripe), pas d'intégration front.
    const activate = () =>
        onboarding.mutate(undefined, {
            onSuccess: ({ url }) => {
                window.location.href = url;
            },
            onError: () => toast.error("Impossible d'ouvrir l'onboarding des paiements."),
        });

    return (
        <div className="border-lumiris-amber/40 bg-lumiris-amber/10 flex flex-col gap-2 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm">
                <p className="text-foreground font-medium">Activez les paiements pour vendre en direct</p>
                <p className="text-muted-foreground text-xs">
                    Onboarding Stripe Connect — commission plateforme d’environ 5 %, payout net versé à l’atelier.
                </p>
            </div>
            <Button
                onClick={activate}
                disabled={onboarding.isPending}
                className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 shrink-0 gap-1.5 text-white"
            >
                {onboarding.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <ExternalLink className="h-4 w-4" />
                )}
                Activer les paiements
            </Button>
        </div>
    );
}

// Tableau de bord vendeur : ventes, revenus nets (net de commission), vues, pièces en garde-robe.
function SellerStatsCards() {
    const token = useAuthStore((s) => s.token);
    const { data: stats } = useSellerStats({ enabled: Boolean(token) });
    if (!token || !stats) return null;

    const cards = [
        { label: 'Ventes', value: String(stats.salesCount), icon: ShoppingBag, hint: 'commandes réglées' },
        {
            label: 'Revenus nets',
            value: formatPriceCents(stats.netCents, 'EUR'),
            icon: Wallet,
            hint: `net de ${formatPriceCents(stats.commissionCents, 'EUR')} de commission`,
        },
        { label: 'Vues', value: String(stats.totalViews), icon: Eye, hint: 'sur vos fiches produit' },
        { label: 'En garde-robe', value: String(stats.wardrobeCount), icon: Archive, hint: 'pièces chez vos clients' },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map(({ label, value, icon: Icon, hint }) => (
                <div key={label} className="bg-card rounded-xl border p-4">
                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                    </div>
                    <p className="text-foreground mt-1 text-2xl font-semibold tabular-nums">{value}</p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">{hint}</p>
                </div>
            ))}
        </div>
    );
}

// Ouvre le tableau de bord Stripe Express (solde + virements encaissés) — visible une fois activé.
function StripeDashboardButton() {
    const token = useAuthStore((s) => s.token);
    const { data: status } = useSellerStatus({ enabled: Boolean(token) });
    const dashboard = useSellerDashboardLink();
    if (!token || !status?.chargesEnabled) return null;

    const open = () =>
        dashboard.mutate(undefined, {
            onSuccess: ({ url }) => window.open(url, '_blank', 'noopener,noreferrer'),
            onError: () => toast.error("Impossible d'ouvrir le tableau de bord Stripe."),
        });

    return (
        <Button variant="outline" onClick={open} disabled={dashboard.isPending} className="gap-1.5">
            {dashboard.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            Mes paiements Stripe
        </Button>
    );
}
