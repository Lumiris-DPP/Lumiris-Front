'use client';

import { useEffect, useState } from 'react';
import { Loader2, PackageCheck } from 'lucide-react';
import { useShipFromAddress, useUpdateShipFromAddress, useShippingAvailability } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Skeleton } from '@lumiris/ui/components/skeleton';
import { toast } from '@lumiris/ui/components/sonner';

interface Draft {
    line1: string;
    line2: string;
    postalCode: string;
    city: string;
    country: string;
    phone: string;
}

const EMPTY_DRAFT: Draft = { line1: '', line2: '', postalCode: '', city: '', country: 'FR', phone: '' };

// Adresse d'enlèvement de l'atelier : l'expéditeur imprimé sur le bordereau. Distincte de la
// vitrine, qui ne publie qu'une ville — cette adresse-ci ne sort jamais sur un chemin public.
export function ShippingTab() {
    const { data: address, isLoading } = useShipFromAddress();
    const { data: shipping } = useShippingAvailability();
    const updateMutation = useUpdateShipFromAddress();
    const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

    useEffect(() => {
        if (!address) return;
        setDraft({
            line1: address.line1 ?? '',
            line2: address.line2 ?? '',
            postalCode: address.postalCode ?? '',
            city: address.city ?? '',
            country: address.country ?? 'FR',
            phone: address.phone ?? '',
        });
    }, [address]);

    const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

    const complete = draft.line1.trim() !== '' && draft.postalCode.trim() !== '' && draft.city.trim() !== '';

    const onSubmit = (event: React.SyntheticEvent) => {
        event.preventDefault();
        if (!complete || updateMutation.isPending) return;
        updateMutation.mutate(
            {
                line1: draft.line1.trim(),
                line2: draft.line2.trim() || undefined,
                postalCode: draft.postalCode.trim(),
                city: draft.city.trim(),
                country: draft.country.trim().toUpperCase() || 'FR',
                phone: draft.phone.trim() || undefined,
            },
            {
                onSuccess: () => toast.success('Adresse d’enlèvement enregistrée.'),
                onError: (e) => toast.error(e.message || 'Échec de l’enregistrement.'),
            },
        );
    };

    if (isLoading) {
        return (
            <div className="max-w-lg space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-2/3" />
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="max-w-lg space-y-4">
            <div>
                <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                    Adresse d&apos;enlèvement
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    {shipping?.enabled
                        ? 'Elle figure comme expéditeur sur vos bordereaux, et débloque l’impression d’étiquette en un clic depuis une commande.'
                        : 'Elle figure comme expéditeur sur vos colis. L’impression d’étiquette en un clic s’activera dès que l’intégration transporteur sera en place.'}
                </p>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="ship-line1">Adresse</Label>
                <Input
                    id="ship-line1"
                    value={draft.line1}
                    onChange={(e) => set('line1', e.target.value)}
                    placeholder="12 rue des Tisserands"
                    required
                />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="ship-line2">Complément</Label>
                <Input
                    id="ship-line2"
                    value={draft.line2}
                    onChange={(e) => set('line2', e.target.value)}
                    placeholder="Atelier au fond de la cour"
                />
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="ship-postal">Code postal</Label>
                    <Input
                        id="ship-postal"
                        value={draft.postalCode}
                        onChange={(e) => set('postalCode', e.target.value)}
                        placeholder="69001"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="ship-city">Ville</Label>
                    <Input
                        id="ship-city"
                        value={draft.city}
                        onChange={(e) => set('city', e.target.value)}
                        placeholder="Lyon"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="ship-country">Pays</Label>
                    <Input
                        id="ship-country"
                        value={draft.country}
                        onChange={(e) => set('country', e.target.value)}
                        maxLength={2}
                        placeholder="FR"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="ship-phone">Téléphone</Label>
                <Input
                    id="ship-phone"
                    value={draft.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="06 12 34 56 78"
                />
                <p className="text-[11px] text-muted-foreground">
                    Transmis au transporteur en cas de problème d&apos;enlèvement.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={!complete || updateMutation.isPending} className="gap-1.5">
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Enregistrer
                </Button>
                {address?.complete ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-lumiris-emerald">
                        <PackageCheck className="h-3.5 w-3.5" aria-hidden />
                        Prête pour l&apos;expédition
                    </span>
                ) : null}
            </div>
        </form>
    );
}
