'use client';

import type { MarketplaceItem, MarketplaceProductStatus } from '@lumiris/api-client';
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
import { STATUS_LABEL, STATUSES } from './labels';
import { NO_DPP } from './product-form-model';
import { useProductForm } from './use-product-form';
import { SizeGuideEditor } from './size-guide-editor';
import { VariantsEditor } from './variants-editor';

/** Décrit le produit et les commandes du dialogue de modification. */
interface ProductFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: MarketplaceItem;
}

/** Affiche les sections du formulaire de modification du produit artisan. */
export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
    const { form, set, dpps, pending, sizes, onSubmit, error } = useProductForm(open, onOpenChange, product);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Modifier le produit</DialogTitle>
                    <DialogDescription>
                        Le score Iris affiché dérive du passeport (DPP) lié. Le lien de commande alimente l’affiliation.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="grid gap-4">
                    {error && (
                        <p role="alert" className="text-sm text-destructive">
                            {error}
                        </p>
                    )}
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
                                type="text"
                                inputMode="decimal"
                                value={form.priceEuros}
                                onChange={(e) => set('priceEuros', e.target.value)}
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Frais de port (€)" htmlFor="mp-shipping">
                            <Input
                                id="mp-shipping"
                                type="text"
                                inputMode="decimal"
                                value={form.shippingEuros}
                                onChange={(e) => set('shippingEuros', e.target.value)}
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

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Délai de préparation (jours)" htmlFor="mp-prep">
                            <Input
                                id="mp-prep"
                                type="text"
                                inputMode="numeric"
                                value={form.preparationDays}
                                onChange={(e) => set('preparationDays', e.target.value)}
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Affiché avant l’achat : « expédiée sous X jours ». 0 = pièce en stock.
                            </p>
                        </Field>
                        <Field label="Conditions de retour" htmlFor="mp-return">
                            <Input
                                id="mp-return"
                                placeholder="Retour sous 14 jours"
                                value={form.returnPolicy}
                                onChange={(e) => set('returnPolicy', e.target.value)}
                            />
                        </Field>
                    </div>

                    <Field label="Poids du colis (g)" htmlFor="mp-weight">
                        <Input
                            id="mp-weight"
                            type="text"
                            inputMode="numeric"
                            value={form.weightGrams}
                            onChange={(e) => set('weightGrams', e.target.value)}
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Emballage compris. C’est le poids qui détermine le tarif du transporteur et permet
                            d’imprimer l’étiquette en un clic. 0 = poids par défaut.
                        </p>
                    </Field>

                    <VariantsEditor value={form.variants} onChange={(next) => set('variants', next)} />

                    <SizeGuideEditor sizes={sizes} value={form.sizeGuide} onChange={(next) => set('sizeGuide', next)} />

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

/** Associe un libellé au champ du formulaire de produit. */
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
