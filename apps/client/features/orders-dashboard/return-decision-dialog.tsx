'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import type { SellerOrder } from '@lumiris/api-client';
import { useDecideReturn } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@lumiris/ui/components/dialog';
import { Label } from '@lumiris/ui/components/label';
import { Textarea } from '@lumiris/ui/components/textarea';
import { toast } from '@lumiris/ui/components/sonner';

// Accepter et refuser ouvrent la même boîte : la seule différence est la décision transmise, et
// un refus exige un motif — l'acheteur peut en faire un litige, le dossier doit tenir.
export function ReturnDecisionDialog({
    order,
    open,
    onOpenChange,
}: {
    order: SellerOrder;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [note, setNote] = useState('');
    const decideMutation = useDecideReturn();

    useEffect(() => {
        if (open) setNote('');
    }, [open]);

    const decide = (accepted: boolean) => {
        if (decideMutation.isPending) return;
        if (!accepted && note.trim().length < 3) {
            toast.error('Un refus doit être motivé.');
            return;
        }
        decideMutation.mutate(
            { orderId: order.id, input: { accepted, note: note.trim() || undefined } },
            {
                onSuccess: () => {
                    toast.success(accepted ? 'Retour accepté' : 'Retour refusé', {
                        description: accepted
                            ? 'L’acheteur est invité à renvoyer la pièce.'
                            : 'L’acheteur est notifié du motif.',
                    });
                    onOpenChange(false);
                },
                onError: (e) => toast.error(e.message || 'Décision impossible.'),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Demande de retour</DialogTitle>
                    <DialogDescription>
                        « {order.productName} » — décision à transmettre à l’acheteur.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {order.returnReason ? (
                        <div className="rounded-lg border border-border bg-muted/40 p-3">
                            <p className="text-xs font-medium text-foreground">Motif invoqué</p>
                            <p className="mt-1 text-sm text-muted-foreground">{order.returnReason}</p>
                        </div>
                    ) : null}

                    <div className="space-y-1.5">
                        <Label htmlFor="return-note">Message à l’acheteur</Label>
                        <Textarea
                            id="return-note"
                            rows={3}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Adresse de retour, conditions d’emballage, ou motif du refus…"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={decideMutation.isPending}
                        onClick={() => decide(false)}
                    >
                        {decideMutation.isPending ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                            <X className="mr-1.5 h-4 w-4" />
                        )}
                        Refuser
                    </Button>
                    <Button
                        type="button"
                        disabled={decideMutation.isPending}
                        onClick={() => decide(true)}
                        className="bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
                    >
                        {decideMutation.isPending ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                            <Check className="mr-1.5 h-4 w-4" />
                        )}
                        Accepter le retour
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
