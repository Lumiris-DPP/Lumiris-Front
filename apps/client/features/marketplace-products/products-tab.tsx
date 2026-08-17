'use client';

import { useState } from 'react';
import { Eye, EyeOff, PackagePlus, Pencil, Trash2 } from 'lucide-react';
import type { MarketplaceItem, MarketplaceProductStatus } from '@lumiris/api-client';
import { isApiError } from '@lumiris/api-client';
import { useDeleteProduct, useMyProducts, useUpdateProduct } from '@lumiris/api-client/react';
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
import { MIN_PUBLISHED_PRICE_CENTS, productPayloadFrom } from './product-payload';
import { STATUS_LABEL } from './labels';

// onCreate : la conversion DPP → produit est pilotée au niveau page (bouton toujours visible).

export function ProductsTab({ onCreate }: { onCreate: () => void }) {
    const token = useAuthStore((s) => s.token);
    const { data: products = [], isLoading, error } = useMyProducts({ enabled: Boolean(token) });
    const deleteMutation = useDeleteProduct();
    const updateMutation = useUpdateProduct();

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<MarketplaceItem | undefined>(undefined);
    const [toDelete, setToDelete] = useState<MarketplaceItem | undefined>(undefined);

    const openEdit = (product: MarketplaceItem) => {
        setEditing(product);
        setFormOpen(true);
    };

    // Passe un produit au statut donné (archivage ou (dé)publication) via l'update produit.
    const setStatus = (product: MarketplaceItem, status: MarketplaceProductStatus) => {
        if (updateMutation.isPending) return;
        updateMutation.mutate(
            { id: product.id, payload: productPayloadFrom(product, status) },
            {
                onSuccess: () => toast.success(status === 'ARCHIVED' ? 'Produit archivé.' : 'Produit publié.'),
                onError: (e) => toast.error(e.message || 'Échec de la mise à jour.'),
            },
        );
    };

    // Bascule rapide de visibilité depuis la ligne du tableau (Publier ↔ Archiver).
    const toggleVisibility = (product: MarketplaceItem) => {
        if (product.status === 'PUBLISHED') {
            setStatus(product, 'ARCHIVED');
            return;
        }
        // Un produit publié doit avoir un prix réel : on bloque côté client pour éviter le 422.
        if (product.priceCents < MIN_PUBLISHED_PRICE_CENTS) {
            toast.error('Prix trop bas pour publier', {
                description: 'Un produit publié doit coûter au moins 0,50 €. Modifiez le prix avant de publier.',
            });
            return;
        }
        setStatus(product, 'PUBLISHED');
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        const product = toDelete;
        deleteMutation.mutate(product.id, {
            onSuccess: () => toast.success('Produit supprimé.'),
            // 409 (ConflictException) : le produit a des commandes et ne peut être supprimé.
            // On affiche le message backend et on propose l'archivage comme alternative.
            onError: (e) => {
                if (isApiError(e) && e.status === 409) {
                    toast.error(e.message || 'Suppression impossible.', {
                        description:
                            'Ce produit a des commandes et ne peut pas être supprimé. Vous pouvez l’archiver pour le retirer de la vente.',
                        action: { label: 'Archiver', onClick: () => setStatus(product, 'ARCHIVED') },
                    });
                } else {
                    toast.error(e.message || 'Échec de la suppression.');
                }
            },
        });
        setToDelete(undefined);
    };

    if (isLoading) {
        return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;
    }
    if (error) {
        return <div className="p-8 text-sm text-destructive">Erreur : {error.message}</div>;
    }

    return (
        <div className="space-y-4">
            {products.length === 0 ? (
                <EmptyState
                    icon={PackagePlus}
                    title="Votre catalogue est vide"
                    description="Convertissez un passeport (DPP) en produit pour le rendre visible dans la Marketplace VISION."
                >
                    <Button onClick={onCreate}>Convertir un DPP</Button>
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
                                        <div className="text-xs text-muted-foreground">
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
                                    <TableCell>
                                        <span className="tabular-nums">{product.stock}</span>
                                        {(product.variants?.length ?? 0) > 1 ? (
                                            <span className="block text-[11px] text-muted-foreground">
                                                {product.variants?.length} déclinaisons
                                            </span>
                                        ) : null}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground tabular-nums">
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
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={product.status === 'PUBLISHED' ? 'default' : 'outline'}>
                                            {STATUS_LABEL[product.status] ?? product.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {/* Libellés en clair : trois icônes nues laissent l'artisan deviner
                                            laquelle dépublie et laquelle supprime définitivement. */}
                                        <div className="flex flex-wrap items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1.5"
                                                onClick={() => toggleVisibility(product)}
                                                disabled={updateMutation.isPending}
                                            >
                                                {product.status === 'PUBLISHED' ? (
                                                    <EyeOff className="h-4 w-4" aria-hidden />
                                                ) : (
                                                    <Eye className="h-4 w-4" aria-hidden />
                                                )}
                                                {product.status === 'PUBLISHED' ? 'Dépublier' : 'Publier'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1.5"
                                                onClick={() => openEdit(product)}
                                            >
                                                <Pencil className="h-4 w-4" aria-hidden />
                                                Modifier
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1.5 text-destructive hover:text-destructive"
                                                onClick={() => setToDelete(product)}
                                            >
                                                <Trash2 className="h-4 w-4" aria-hidden />
                                                Supprimer
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} />

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
