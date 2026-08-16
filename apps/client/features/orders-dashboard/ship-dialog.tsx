'use client';

import { useEffect, useState } from 'react';
import { Loader2, Truck } from 'lucide-react';
import type { SellerOrder } from '@lumiris/api-client';
import { useShipOrder } from '@lumiris/api-client/react';
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

// Transporteurs proposés d'office : couvrent l'essentiel des envois d'un atelier français.
// « Autre » laisse saisir un nom libre plutôt que de bloquer une expédition hors liste.
const CARRIERS = ['Colissimo', 'Chronopost', 'Mondial Relay', 'UPS', 'DHL', 'DPD', 'Remise en main propre'] as const;
const OTHER = 'Autre';

// Modèles d'URL de suivi : l'acheteur reçoit un lien cliquable sans que l'atelier ait à le
// chercher. Un transporteur absent d'ici laisse simplement le champ libre.
const TRACKING_URL_TEMPLATE: Record<string, (tracking: string) => string> = {
    Colissimo: (t) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${t}`,
    Chronopost: (t) => `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${t}`,
    'Mondial Relay': (t) => `https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition=${t}`,
    UPS: (t) => `https://www.ups.com/track?tracknum=${t}`,
    DHL: (t) => `https://www.dhl.com/fr-fr/home/tracking.html?tracking-id=${t}`,
    DPD: (t) => `https://www.dpd.fr/trace/${t}`,
};

export function ShipDialog({
    order,
    open,
    onOpenChange,
}: {
    order: SellerOrder;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [carrierChoice, setCarrierChoice] = useState<string>(CARRIERS[0]);
    const [customCarrier, setCustomCarrier] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const shipMutation = useShipOrder();

    useEffect(() => {
        if (open) {
            setCarrierChoice(CARRIERS[0]);
            setCustomCarrier('');
            setTrackingNumber('');
        }
    }, [open]);

    const carrier = carrierChoice === OTHER ? customCarrier.trim() : carrierChoice;
    const trackingUrl = TRACKING_URL_TEMPLATE[carrier]?.(trackingNumber.trim());
    const valid = carrier.length > 1 && trackingNumber.trim().length > 3;

    const onSubmit = (event: React.SyntheticEvent) => {
        event.preventDefault();
        if (!valid || shipMutation.isPending) return;
        shipMutation.mutate(
            {
                orderId: order.id,
                input: { carrier, trackingNumber: trackingNumber.trim(), trackingUrl },
            },
            {
                onSuccess: () => {
                    toast.success('Commande marquée expédiée', {
                        description: 'L’acheteur reçoit le suivi et peut la pister en temps réel.',
                    });
                    onOpenChange(false);
                },
                onError: (e) => toast.error(e.message || 'Échec du marquage d’expédition.'),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            Expédier « {order.productName} »{order.variantLabel ? ` (${order.variantLabel})` : ''}
                        </DialogTitle>
                        <DialogDescription>
                            Le suivi est transmis à l’acheteur immédiatement. Vos fonds sont versés dès la livraison.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="carrier">Transporteur</Label>
                            <Select value={carrierChoice} onValueChange={setCarrierChoice}>
                                <SelectTrigger id="carrier">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[...CARRIERS, OTHER].map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {carrierChoice === OTHER && (
                            <div className="space-y-1.5">
                                <Label htmlFor="custom-carrier">Nom du transporteur</Label>
                                <Input
                                    id="custom-carrier"
                                    value={customCarrier}
                                    onChange={(e) => setCustomCarrier(e.target.value)}
                                    placeholder="Coursier local, transporteur régional…"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="tracking">Numéro de suivi</Label>
                            <Input
                                id="tracking"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="6A123456789"
                            />
                            {trackingUrl ? (
                                <p className="text-[11px] text-muted-foreground">
                                    Lien de suivi généré automatiquement pour {carrier}.
                                </p>
                            ) : null}
                        </div>

                        {order.shipTo ? (
                            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
                                <p className="font-medium text-foreground">Expédier à</p>
                                <p className="mt-1 text-muted-foreground">
                                    {order.shipTo.fullName}
                                    <br />
                                    {order.shipTo.line1}
                                    {order.shipTo.line2 ? (
                                        <>
                                            <br />
                                            {order.shipTo.line2}
                                        </>
                                    ) : null}
                                    <br />
                                    {order.shipTo.postalCode} {order.shipTo.city}, {order.shipTo.country}
                                    {order.shipTo.phone ? (
                                        <>
                                            <br />
                                            {order.shipTo.phone}
                                        </>
                                    ) : null}
                                </p>
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={!valid || shipMutation.isPending}
                            className="gap-1.5 bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
                        >
                            {shipMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Truck className="h-4 w-4" />
                            )}
                            Marquer expédiée
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
