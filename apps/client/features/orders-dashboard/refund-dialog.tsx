'use client';

import { useEffect, useState } from 'react';
import { Loader2, Undo2 } from 'lucide-react';
import type { SellerOrder } from '@lumiris/api-client';
import { useRefundOrder } from '@lumiris/api-client/react';
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
import { RadioGroup, RadioGroupItem } from '@lumiris/ui/components/radio-group';
import { Textarea } from '@lumiris/ui/components/textarea';
import { toast } from '@lumiris/ui/components/sonner';
import { formatPriceCents } from '@lumiris/utils';

function refundableCents(order: SellerOrder): number {
    return Math.max(0, order.amountTotalCents + (order.shippingCents ?? 0) - (order.refundedCents ?? 0));
}

export function RefundDialog({
    order,
    open,
    onOpenChange,
}: {
    order: SellerOrder;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const maxCents = refundableCents(order);
    const [mode, setMode] = useState<'full' | 'partial'>('full');
    const [amountEuros, setAmountEuros] = useState('');
    const [reason, setReason] = useState('');
    const refundMutation = useRefundOrder();

    useEffect(() => {
        if (open) {
            setMode('full');
            setAmountEuros((maxCents / 100).toFixed(2));
            setReason('');
        }
    }, [open, maxCents]);

    const partialCents = Math.round(Number(amountEuros.replace(',', '.')) * 100);
    const partialValid = Number.isFinite(partialCents) && partialCents > 0 && partialCents <= maxCents;
    const valid = mode === 'full' || partialValid;

    const onSubmit = (event: React.SyntheticEvent) => {
        event.preventDefault();
        if (!valid || refundMutation.isPending) return;
        refundMutation.mutate(
            {
                orderId: order.id,
                input: {
                    amountCents: mode === 'partial' ? partialCents : undefined,
                    reason: reason.trim() || undefined,
                },
            },
            {
                onSuccess: () => {
                    toast.success('Remboursement émis', {
                        description: 'L’acheteur est notifié ; les fonds repartent sur son moyen de paiement.',
                    });
                    onOpenChange(false);
                },
                onError: (e) => toast.error(e.message || 'Le remboursement a échoué.'),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Rembourser « {order.productName} »</DialogTitle>
                        <DialogDescription>
                            Maximum remboursable : {formatPriceCents(maxCents, order.currency ?? 'EUR')}. Si vos fonds
                            ont déjà été versés, la part correspondante vous est reprise.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'full' | 'partial')}>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="full" id="refund-full" />
                                <Label htmlFor="refund-full" className="font-normal">
                                    Rembourser tout ({formatPriceCents(maxCents, order.currency ?? 'EUR')})
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="partial" id="refund-partial" />
                                <Label htmlFor="refund-partial" className="font-normal">
                                    Rembourser une partie
                                </Label>
                            </div>
                        </RadioGroup>

                        {mode === 'partial' && (
                            <div className="space-y-1.5">
                                <Label htmlFor="refund-amount">Montant (€)</Label>
                                <Input
                                    id="refund-amount"
                                    inputMode="decimal"
                                    value={amountEuros}
                                    onChange={(e) => setAmountEuros(e.target.value)}
                                />
                                {!partialValid && amountEuros !== '' ? (
                                    <p className="text-[11px] text-destructive">
                                        Saisissez un montant entre 0,01 € et{' '}
                                        {formatPriceCents(maxCents, order.currency ?? 'EUR')}.
                                    </p>
                                ) : null}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="refund-reason">Motif (visible par l’acheteur)</Label>
                            <Textarea
                                id="refund-reason"
                                rows={3}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Pièce retournée en bon état, geste commercial…"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" variant="destructive" disabled={!valid || refundMutation.isPending}>
                            {refundMutation.isPending ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                                <Undo2 className="mr-1.5 h-4 w-4" />
                            )}
                            Rembourser
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
