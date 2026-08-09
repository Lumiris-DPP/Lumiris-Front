'use client';

import { useEffect, useState } from 'react';
import { Gavel, Loader2 } from 'lucide-react';
import type { SellerOrder } from '@lumiris/api-client';
import { useResolveDispute } from '@lumiris/api-client/react';
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
import { Textarea } from '@lumiris/ui/components/textarea';
import { toast } from '@lumiris/ui/components/sonner';
import { formatPriceCents } from '@lumiris/utils';

// Arbitrage en faveur de l'acheteur : le montant est modifiable, un litige se solde souvent par
// un dédommagement partiel (pièce conservée mais non conforme, retard, frais de retour).
export function ResolveDisputeDialog({
    dispute,
    open,
    onOpenChange,
}: {
    dispute: SellerOrder;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const currency = dispute.currency ?? 'EUR';
    const maxCents = Math.max(
        0,
        dispute.amountTotalCents + (dispute.shippingCents ?? 0) - (dispute.refundedCents ?? 0),
    );
    const [amountEuros, setAmountEuros] = useState('');
    const [resolution, setResolution] = useState('');
    const resolveMutation = useResolveDispute();

    useEffect(() => {
        if (open) {
            setAmountEuros((maxCents / 100).toFixed(2));
            setResolution('');
        }
    }, [open, maxCents]);

    const refundCents = Math.round(Number(amountEuros.replace(',', '.')) * 100);
    const amountValid = Number.isFinite(refundCents) && refundCents > 0 && refundCents <= maxCents;
    const valid = amountValid && resolution.trim().length >= 5;

    const submit = (event: React.SyntheticEvent) => {
        event.preventDefault();
        if (!valid || resolveMutation.isPending) return;
        resolveMutation.mutate(
            { orderId: dispute.id, input: { resolution: resolution.trim(), refundCents } },
            {
                onSuccess: () => {
                    toast.success('Litige tranché', {
                        description: 'Acheteur et atelier sont notifiés ; le remboursement part immédiatement.',
                    });
                    onOpenChange(false);
                },
                onError: (e) => toast.error(e.message || 'Arbitrage impossible.'),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>Trancher en faveur de l’acheteur</DialogTitle>
                        <DialogDescription>
                            « {dispute.productName} » — maximum remboursable {formatPriceCents(maxCents, currency)}.
                            {dispute.released
                                ? ' Les fonds ayant déjà été versés, la part correspondante est reprise à l’atelier.'
                                : ' Les fonds sont encore retenus par la plateforme.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="dispute-amount">Montant remboursé (€)</Label>
                            <Input
                                id="dispute-amount"
                                inputMode="decimal"
                                value={amountEuros}
                                onChange={(e) => setAmountEuros(e.target.value)}
                            />
                            {!amountValid && amountEuros !== '' ? (
                                <p className="text-[11px] text-destructive">
                                    Saisissez un montant entre 0,01 € et {formatPriceCents(maxCents, currency)}.
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="dispute-resolution">Motivation (visible des deux parties)</Label>
                            <Textarea
                                id="dispute-resolution"
                                rows={4}
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                placeholder="Éléments retenus, décision et montant accordé…"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={!valid || resolveMutation.isPending}
                            className="gap-1.5 bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
                        >
                            {resolveMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Gavel className="h-4 w-4" />
                            )}
                            Trancher et rembourser
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
