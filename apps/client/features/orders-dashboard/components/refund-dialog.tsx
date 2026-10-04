'use client';

import { useEffect, useState } from 'react';
import { Loader2, Undo2 } from 'lucide-react';
import type { RefundInput, SellerOrder } from '@lumiris/api-client';
import { orderKeys, useApiQueryClient, useRefundOrder } from '@lumiris/api-client/react';
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

import { REFUND_REASON_MAX_LENGTH, refundFailureOf, refundableCents, parseRefundCents } from '../models/refund-model';
import { forgetRefundOperation, readRefundOperation, rememberRefundOperation } from '../models/refund-operation';
import { useAuthStore } from '@/lib/auth-store';

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
    const userId = useAuthStore((s) => s.userId);
    const [operation, setOperation] = useState<RefundInput | null>(null);
    const [storageError, setStorageError] = useState(false);
    const refundMutation = useRefundOrder();
    const queryClient = useApiQueryClient();

    useEffect(() => {
        if (open) {
            let saved: RefundInput | null;
            try {
                saved = userId ? readRefundOperation(userId, order.id) : null;
                setStorageError(false);
            } catch {
                setStorageError(true);
                return;
            }
            setOperation(saved);
            if (saved) {
                setMode(saved.amountCents === undefined ? 'full' : 'partial');
                setAmountEuros(((saved.amountCents ?? maxCents) / 100).toFixed(2));
                setReason(saved.reason ?? '');
                return;
            }
            setMode('full');
            setAmountEuros((maxCents / 100).toFixed(2));
            setReason('');
        }
    }, [open, maxCents, userId, order.id]);

    const partialCents = parseRefundCents(amountEuros);
    const partialValid = partialCents !== null && partialCents > 0 && partialCents <= maxCents;
    const valid = order.canRefund && maxCents > 0 && (mode === 'full' || partialValid);

    const onSubmit = (event: React.SyntheticEvent) => {
        event.preventDefault();
        if ((!valid && !operation) || !userId || storageError || refundMutation.isPending) return;
        const input: RefundInput = operation ?? {
            operationId: crypto.randomUUID(),
            amountCents: mode === 'partial' ? (partialCents ?? undefined) : undefined,
            reason: reason.trim() || undefined,
        };
        try {
            rememberRefundOperation(userId, order.id, input);
        } catch {
            setStorageError(true);
            return;
        }
        setOperation(input);
        refundMutation.mutate(
            {
                orderId: order.id,
                input,
            },
            {
                onSuccess: () => {
                    forgetRefundOperation(userId, order.id);
                    setOperation(null);
                    toast.success('Remboursement émis', {
                        description: 'L’acheteur est notifié ; les fonds repartent sur son moyen de paiement.',
                    });
                    onOpenChange(false);
                },
                onError: (error) => {
                    const failure = refundFailureOf(error);
                    if (failure.release) {
                        forgetRefundOperation(userId, order.id);
                        setOperation(null);

                        void queryClient.invalidateQueries({ queryKey: orderKeys.sellerAll() });
                    }
                    toast.error(failure.message);
                },
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
                        {storageError ? (
                            <p role="alert">
                                Impossible de conserver cette opération. Aucun nouvel envoi ne sera effectué.
                            </p>
                        ) : null}
                        {operation ? (
                            <p role="status">
                                Une opération attend confirmation. La reprise conserve son montant et son identifiant.
                            </p>
                        ) : null}
                        <RadioGroup
                            disabled={Boolean(operation)}
                            value={mode}
                            onValueChange={(v) => setMode(v as 'full' | 'partial')}
                        >
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
                                    disabled={Boolean(operation)}
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
                                className="field-sizing-fixed"
                                rows={3}
                                value={reason}
                                maxLength={REFUND_REASON_MAX_LENGTH}
                                disabled={Boolean(operation)}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Pièce retournée en bon état, geste commercial…"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={(!valid && !operation) || !userId || storageError || refundMutation.isPending}
                        >
                            {refundMutation.isPending ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                                <Undo2 className="mr-1.5 h-4 w-4" />
                            )}
                            {operation ? 'Reprendre le remboursement' : 'Rembourser'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
