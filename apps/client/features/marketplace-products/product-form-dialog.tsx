'use client';

import { useEffect, useState } from 'react';
import type { MarketplaceItem, MarketplaceProductStatus, ProductPayload } from '@lumiris/api-client';
import { useDppForms, useUpdateProduct } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@lumiris/ui/components/dialog';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Textarea } from '@lumiris/ui/components/textarea';
import { toast } from '@lumiris/ui/components/sonner';
import { STATUS_LABEL, STATUSES } from './labels';

const NO_DPP = 'none';

// Prix minimum d'un produit publié (le backend rejette sinon en 422).
const MIN_PUBLISHED_PRICE_CENTS = 50;

interface FormState {
    name: string;
    description: string;
    category: string;
    material: string;
    originCountry: string;
    priceEuros: string;
    stock: string;
    externalOrderUrl: string;
    photoUrl: string;
    dppFormId: string;
    status: MarketplaceProductStatus;
}

function initialState(product?: MarketplaceItem): FormState {
    return {
        name: product?.name ?? '',
        description: product?.description ?? '',
        category: product?.category ?? '',
        material: product?.material ?? '',
        originCountry: product?.originCountry ?? '',
        priceEuros: product ? String(product.priceCents / 100) : '',
        stock: product ? String(product.stock) : '0',
        externalOrderUrl: product?.externalOrderUrl ?? '',
        photoUrl: product?.photoUrl ?? '',
        dppFormId: product?.dppFormId ?? NO_DPP,
        status: product?.status ?? 'DRAFT',
    };
}

interface ProductFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: MarketplaceItem;
}

// Édition d'un produit du catalogue artisan. La CRÉATION passe uniquement par la conversion
// d'un DPP (cf. ConvertDppDialog) — pas de création "ex nihilo" ici.
export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
    const [form, setForm] = useState<FormState>(() => initialState(product));
    const { data: dpps = [] } = useDppForms({ enabled: open });
    const updateMutation = useUpdateProduct();
    const pending = updateMutation.isPending;

    // Réinitialise le formulaire à chaque ouverture / changement de produit édité.
    useEffect(() => {
        if (open) setForm(initialState(product));
    }, [open, product]);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.name.trim()) {
            toast.error('Le nom du produit est requis.');
            return;
        }
        const priceCents = Math.max(0, Math.round((Number(form.priceEuros) || 0) * 100));
        // Un produit publié doit coûter au moins 0,50 € (le backend rejette sinon en 422),
        // en miroir de la règle « prix > 0 » de la boîte de conversion DPP.
        if (form.status === 'PUBLISHED' && priceCents < MIN_PUBLISHED_PRICE_CENTS) {
            toast.error('Prix trop bas pour un produit publié', {
                description: 'Un produit publié doit coûter au moins 0,50 €.',
            });
            return;
        }
        const payload: ProductPayload = {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            category: form.category.trim() || undefined,
            material: form.material.trim() || undefined,
            originCountry: form.originCountry.trim() || undefined,
            priceCents,
            currency: 'EUR',
            stock: Math.max(0, Math.round(Number(form.stock) || 0)),
            externalOrderUrl: form.externalOrderUrl.trim() || undefined,
            photoUrl: form.photoUrl.trim() || undefined,
            dppFormId: form.dppFormId === NO_DPP ? undefined : form.dppFormId,
            status: form.status,
        };

        if (!product) return;
        const onSuccess = () => {
            toast.success('Produit mis à jour.');
            onOpenChange(false);
        };
        const onError = (error: Error) => toast.error(error.message || 'Échec de l’enregistrement.');
        updateMutation.mutate({ id: product.id, payload }, { onSuccess, onError });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Modifier le produit</DialogTitle>
                    <DialogDescription>
                        Le score Iris affiché dérive du passeport (DPP) lié. Le lien de commande alimente l’affiliation.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="grid gap-4">
                    <Field label="Nom" htmlFor="mp-name">
                        <Input id="mp-name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
                    </Field>

                    <Field label="Description" htmlFor="mp-desc">
                        <Textarea
                            id="mp-desc"
                            rows={2}
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Catégorie" htmlFor="mp-cat">
                            <Input
                                id="mp-cat"
                                placeholder="sweater, shirt…"
                                value={form.category}
                                onChange={(e) => set('category', e.target.value)}
                            />
                        </Field>
                        <Field label="Matière" htmlFor="mp-mat">
                            <Input
                                id="mp-mat"
                                placeholder="wool, linen…"
                                value={form.material}
                                onChange={(e) => set('material', e.target.value)}
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Origine" htmlFor="mp-origin">
                            <Input
                                id="mp-origin"
                                placeholder="France…"
                                value={form.originCountry}
                                onChange={(e) => set('originCountry', e.target.value)}
                            />
                        </Field>
                        <Field label="Prix (€)" htmlFor="mp-price">
                            <Input
                                id="mp-price"
                                type="number"
                                min={0}
                                step="0.01"
                                value={form.priceEuros}
                                onChange={(e) => set('priceEuros', e.target.value)}
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Stock" htmlFor="mp-stock">
                            <Input
                                id="mp-stock"
                                type="number"
                                min={0}
                                step="1"
                                value={form.stock}
                                onChange={(e) => set('stock', e.target.value)}
                            />
                        </Field>
                        <Field label="Statut" htmlFor="mp-status">
                            <Select
                                value={form.status}
                                onValueChange={(v) => set('status', v as MarketplaceProductStatus)}
                            >
                                <SelectTrigger id="mp-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUSES.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {STATUS_LABEL[s]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>

                    <Field label="Passeport lié (score Iris)" htmlFor="mp-dpp">
                        <Select value={form.dppFormId} onValueChange={(v) => set('dppFormId', v)}>
                            <SelectTrigger id="mp-dpp">
                                <SelectValue placeholder="Aucun" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NO_DPP}>Aucun</SelectItem>
                                {dpps.map((dpp) => (
                                    <SelectItem key={dpp.id} value={dpp.id}>
                                        {dpp.productName ?? dpp.sku ?? dpp.id.slice(0, 8)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Lien de commande externe (affiliation)" htmlFor="mp-url">
                        <Input
                            id="mp-url"
                            type="url"
                            placeholder="https://mon-atelier.fr/produit"
                            value={form.externalOrderUrl}
                            onChange={(e) => set('externalOrderUrl', e.target.value)}
                        />
                    </Field>

                    <Field label="Photo (URL)" htmlFor="mp-photo">
                        <Input
                            id="mp-photo"
                            type="url"
                            value={form.photoUrl}
                            onChange={(e) => set('photoUrl', e.target.value)}
                        />
                    </Field>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={pending}>
                            {pending ? 'Enregistrement…' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
    return (
        <div className="grid gap-1.5">
            <Label htmlFor={htmlFor} className="text-xs">
                {label}
            </Label>
            {children}
        </div>
    );
}
