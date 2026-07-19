'use client';

import { useMemo, useState } from 'react';
import { Wand2 } from 'lucide-react';
import { useConvertDppToProduct, useDppForms } from '@lumiris/api-client/react';
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

export function ConvertDppDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { data: dpps = [], isLoading } = useDppForms({ enabled: open });
    const convert = useConvertDppToProduct();

    const [dppFormId, setDppFormId] = useState('');
    const [priceEuros, setPriceEuros] = useState('');
    const [stock, setStock] = useState('');
    const [externalOrderUrl, setExternalOrderUrl] = useState('');

    const priceCents = useMemo(() => Math.round(parseFloat(priceEuros.replace(',', '.')) * 100), [priceEuros]);
    const canSubmit = dppFormId !== '' && Number.isFinite(priceCents) && priceCents >= 0 && !convert.isPending;

    const reset = () => {
        setDppFormId('');
        setPriceEuros('');
        setStock('');
        setExternalOrderUrl('');
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
                    externalOrderUrl: externalOrderUrl.trim() || undefined,
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
                onError: (e) => toast.error('La conversion a échoué', { description: e.message }),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : (reset(), onOpenChange(false)))}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Convertir un DPP en produit</DialogTitle>
                    <DialogDescription>
                        Publiez une pièce passeportée dans la Marketplace VISION. Le nom, la catégorie, l’origine et le
                        score Iris sont repris du DPP. Un produit Stripe est créé pour la vente directe in-app.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
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
                            <p className="text-muted-foreground text-xs">
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
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="convert-url">Lien de commande externe (affiliation, optionnel)</Label>
                        <Input
                            id="convert-url"
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
                        className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 gap-1.5 text-white"
                    >
                        <Wand2 className="h-4 w-4" />
                        {convert.isPending ? 'Conversion…' : 'Mettre en vente'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
