'use client';

import { useState } from 'react';
import { PackagePlus, Pencil, Trash2, Wand2 } from 'lucide-react';
import type { MarketplaceItem } from '@lumiris/api-client';
import { useDeleteProduct, useMyProducts } from '@lumiris/api-client/react';
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
            <div className="flex items-center justify-end">
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
