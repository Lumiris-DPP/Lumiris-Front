'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Wand2 } from 'lucide-react';
import { useConvertDppToProduct, useDppForm, useDppForms } from '@lumiris/api-client/react';
import { isApiError } from '@lumiris/api-client';
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
import { toast } from '@lumiris/ui/components/sonner';
import { useSubscription } from '@/lib/use-subscription';
import {
    EMPTY_SIZE_GUIDE,
    newVariantRow,
    sizesOf,
    toSizeGuidePayload,
    toVariantPayload,
    variantRowsError,
    type SizeGuideDraft,
    type VariantRow,
} from './product-payload';
import { SizeGuideEditor } from './size-guide-editor';
import { VariantsEditor } from './variants-editor';

const MAX_PREPARATION_DAYS = 90;
const MAX_WEIGHT_GRAMS = 30000;

export function ConvertDppDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const router = useRouter();
    const { data: dpps = [], isLoading } = useDppForms({ enabled: open });
    const convert = useConvertDppToProduct();
    // Vendre exige un abonnement ATELIER actif (le backend renvoie 422 sinon).
    const { hasActiveSubscription, isRealMode } = useSubscription();
    const sellBlocked = isRealMode && !hasActiveSubscription;

    const [dppFormId, setDppFormId] = useState('');
    const [priceEuros, setPriceEuros] = useState('');
    const [shippingEuros, setShippingEuros] = useState('');
    const [stock, setStock] = useState('');
    const [preparationDays, setPreparationDays] = useState('0');
    const [weightGrams, setWeightGrams] = useState('');
    const [variants, setVariants] = useState<VariantRow[]>([]);
    const [sizeGuide, setSizeGuide] = useState<SizeGuideDraft>(EMPTY_SIZE_GUIDE);
    const [returnPolicy, setReturnPolicy] = useState('');
    const [externalOrderUrl, setExternalOrderUrl] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');

    const priceCents = useMemo(() => Math.round(parseFloat(priceEuros.replace(',', '.')) * 100), [priceEuros]);
    // Le détail du DPP porte les tailles et couleurs déjà déclarées au passeport : la grille se
    // pré-remplit, et l'artisan n'a plus qu'un clic à faire.
    const { data: selectedDpp } = useDppForm(dppFormId, { enabled: dppFormId !== '' });
    const sizes = sizesOf(variants);
    const variantsInvalid = variants.length > 0 && variantRowsError(variants) !== null;
    // A live product needs a real price: require strictly > 0, not just non-negative.
    const canSubmit =
        dppFormId !== '' &&
        Number.isFinite(priceCents) &&
        priceCents > 0 &&
        !variantsInvalid &&
        !convert.isPending &&
        !sellBlocked;

    const reset = () => {
        setDppFormId('');
        setPriceEuros('');
        setShippingEuros('');
        setStock('');
        setPreparationDays('0');
        setWeightGrams('');
        setVariants([]);
        setSizeGuide(EMPTY_SIZE_GUIDE);
        setReturnPolicy('');
        setExternalOrderUrl('');
        setPhotoUrl('');
    };

    const submit = () => {
        if (!canSubmit) return;
        convert.mutate(
            {
                dppFormId,
                payload: {
                    priceCents,
                    currency: 'EUR',
                    stock: stock ? Number(stock) : undefined,
                    variants: variants.length > 0 ? toVariantPayload(variants) : undefined,
                    sizeGuide: variants.length > 0 ? toSizeGuidePayload(sizeGuide, sizes) : undefined,
                    preparationDays: Math.min(
                        MAX_PREPARATION_DAYS,
                        Math.max(0, Math.round(Number(preparationDays) || 0)),
                    ),
                    weightGrams: weightGrams
                        ? Math.min(MAX_WEIGHT_GRAMS, Math.max(0, Math.round(Number(weightGrams) || 0)))
                        : undefined,
                    shippingCents: shippingEuros
                        ? Math.round(parseFloat(shippingEuros.replace(',', '.')) * 100)
                        : undefined,
                    returnPolicy: returnPolicy.trim() || undefined,
                    externalOrderUrl: externalOrderUrl.trim() || undefined,
                    photoUrl: photoUrl.trim() || undefined,
                    status: 'PUBLISHED',
                },
            },
            {
                onSuccess: (item) => {
                    toast.success('DPP converti en produit', {
                        description: `« ${item.name} » est en vente${item.inAppSale ? ' (paiement in-app)' : ''}.`,
                    });
                    reset();
                    onOpenChange(false);
                },
                // 422 : aucun abonnement ATELIER actif — on relaie le message backend + CTA abonnement.
                onError: (e) => {
                    if (isApiError(e) && e.status === 422) {
                        toast.error('Abonnement requis pour vendre', {
                            description: e.message,
                            action: { label: "Voir l'abonnement", onClick: () => router.push('/subscription') },
                        });
                        return;
                    }
                    toast.error('La conversion a échoué', { description: e.message });
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : (reset(), onOpenChange(false)))}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Convertir un DPP en produit</DialogTitle>
                    <DialogDescription>
                        Publiez une pièce passeportée dans la Marketplace VISION. Le nom, la catégorie, l’origine et le
                        score Iris sont repris du DPP. Un produit Stripe est créé pour la vente directe in-app.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {sellBlocked && (
                        <div className="flex items-start gap-2.5 rounded-lg border border-lumiris-amber/40 bg-lumiris-amber/10 p-3 text-sm">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-lumiris-amber" aria-hidden />
                            <div className="space-y-1.5">
                                <p className="font-medium text-foreground">Abonnement ATELIER requis pour vendre</p>
                                <p className="text-xs text-muted-foreground">
                                    Un abonnement ATELIER actif est nécessaire pour mettre une pièce en vente.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7"
                                    onClick={() => router.push('/subscription')}
                                >
                                    Voir l&apos;abonnement
                                </Button>
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="convert-dpp">Passeport (DPP)</Label>
                        <Select value={dppFormId} onValueChange={setDppFormId} disabled={isLoading}>
                            <SelectTrigger id="convert-dpp">
                                <SelectValue placeholder={isLoading ? 'Chargement…' : 'Choisir un DPP…'} />
                            </SelectTrigger>
                            <SelectContent>
                                {dpps.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                        {d.productName ?? 'Sans nom'}
                                        {d.sku ? ` · ${d.sku}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {!isLoading && dpps.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                Aucun DPP à convertir — créez d’abord un passeport.
                            </p>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="convert-price">
                                Prix (€) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="convert-price"
                                type="number"
                                min={0}
                                step="0.01"
                                value={priceEuros}
                                placeholder="159.00"
                                onChange={(e) => setPriceEuros(e.target.value)}
                            />
                        </div>
                        {variants.length === 0 ? (
                            <div className="space-y-2">
                                <Label htmlFor="convert-stock">Stock (défaut : quantité du DPP)</Label>
                                <Input
                                    id="convert-stock"
                                    type="number"
                                    min={0}
                                    value={stock}
                                    placeholder="ex. 10"
                                    onChange={(e) => setStock(e.target.value)}
                                />
                            </div>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="convert-shipping">Frais de port (€)</Label>
                            <Input
                                id="convert-shipping"
                                type="number"
                                min={0}
                                step="0.01"
                                value={shippingEuros}
                                placeholder="5.00"
                                onChange={(e) => setShippingEuros(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="convert-return">Conditions de retour</Label>
                            <Input
                                id="convert-return"
                                value={returnPolicy}
                                placeholder="Retour sous 14 jours"
                                onChange={(e) => setReturnPolicy(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="convert-prep">Délai de préparation (jours)</Label>
                        <Input
                            id="convert-prep"
                            type="number"
                            min={0}
                            max={MAX_PREPARATION_DAYS}
                            step="1"
                            value={preparationDays}
                            onChange={(e) => setPreparationDays(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Affiché à l’acheteur avant l’achat : « expédiée sous X jours ». 0 = pièce en stock.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="convert-weight">Poids du colis (g)</Label>
                        <Input
                            id="convert-weight"
                            type="number"
                            min={0}
                            max={MAX_WEIGHT_GRAMS}
                            step="10"
                            value={weightGrams}
                            placeholder="800"
                            onChange={(e) => setWeightGrams(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Emballage compris. Détermine le tarif du transporteur et permet d’imprimer l’étiquette en un
                            clic depuis la commande.
                        </p>
                    </div>

                    {variants.length === 0 ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setVariants([newVariantRow()])}
                        >
                            Décliner en plusieurs tailles ou couleurs
                        </Button>
                    ) : (
                        <>
                            <VariantsEditor
                                value={variants}
                                onChange={setVariants}
                                sizeSuggestions={selectedDpp?.availableSizes ?? undefined}
                                colorSuggestions={selectedDpp?.colors ?? undefined}
                            />
                            <SizeGuideEditor sizes={sizes} value={sizeGuide} onChange={setSizeGuide} />
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="convert-photo">Photo du produit (URL, optionnel)</Label>
                        <Input
                            id="convert-photo"
                            type="url"
                            value={photoUrl}
                            placeholder="https://mon-atelier.example/photo.jpg"
                            onChange={(e) => setPhotoUrl(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="convert-url">Lien de commande externe (affiliation, optionnel)</Label>
                        <Input
                            id="convert-url"
                            type="url"
                            value={externalOrderUrl}
                            placeholder="https://mon-atelier.example/produit"
                            onChange={(e) => setExternalOrderUrl(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={!canSubmit}
                        className="gap-1.5 bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
                    >
                        <Wand2 className="h-4 w-4" />
                        {convert.isPending ? 'Conversion…' : 'Mettre en vente'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
