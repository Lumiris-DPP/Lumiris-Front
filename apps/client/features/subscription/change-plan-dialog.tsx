'use client';

import type { ArtisanTier } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@lumiris/ui/components/dialog';
import { type BillingCycle, planAmount } from '@/lib/billing-store';

interface ChangePlanDialogProps {
    targetTier: ArtisanTier | null;
    currentTier: ArtisanTier;
    cycle: BillingCycle;
    onCancel: () => void;
    onConfirm: () => void;
}

export function ChangePlanDialog({ targetTier, currentTier, cycle, onCancel, onConfirm }: ChangePlanDialogProps) {
    const amount = targetTier ? planAmount(targetTier, cycle) : 0;
    return (
        <Dialog open={Boolean(targetTier)} onOpenChange={(o) => !o && onCancel()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmer le passage à un palier inférieur</DialogTitle>
                    <DialogDescription>
                        Vous passez de <strong>{currentTier}</strong> à <strong>{targetTier}</strong>. Certaines
                        fonctionnalités peuvent ne plus être disponibles.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2 text-sm">
                    <div className="bg-lumiris-amber/10 text-lumiris-amber border-lumiris-amber/30 rounded-md border p-2 text-xs">
                        Mode démo — aucun paiement n’est réellement effectué.
                    </div>
                    <p className="text-muted-foreground">
                        Nouveau tarif : <span className="text-foreground font-mono">{amount} €</span> (
                        {cycle === 'annual' ? 'annuel' : 'mensuel'}).
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        Annuler
                    </Button>
                    <Button onClick={onConfirm}>Confirmer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
