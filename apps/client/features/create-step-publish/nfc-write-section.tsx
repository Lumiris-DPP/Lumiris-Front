'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Nfc } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Card, CardContent } from '@lumiris/ui/components/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@lumiris/ui/components/dialog';
import { Label } from '@lumiris/ui/components/label';
import { Button } from '@lumiris/ui/components/button';
import { Switch } from '@lumiris/ui/components/switch';
import { simulateNfcWrite } from '@/lib/nfc-mock';

export interface NfcWriteToggleProps {
    enabled: boolean;
    onChange: (v: boolean) => void;
}

export function NfcWriteToggle({ enabled, onChange }: NfcWriteToggleProps) {
    return (
        <Card>
            <CardContent className="flex items-start justify-between gap-3 pt-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Nfc className="text-lumiris-emerald h-4 w-4" />
                        <Label htmlFor="nfc-toggle" className="text-sm font-medium">
                            Écrire sur étiquette NFC après publication
                        </Label>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                            Démo
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        Approchez votre puce NFC du téléphone juste après la publication pour y écrire l’URL GS1.
                    </p>
                </div>
                <Switch id="nfc-toggle" checked={enabled} onCheckedChange={onChange} />
            </CardContent>
        </Card>
    );
}

export interface NfcWriteDialogProps {
    open: boolean;
    gs1: string;
    onDone: () => void;
}

export function NfcWriteDialog({ open, gs1, onDone }: NfcWriteDialogProps) {
    const [state, setState] = useState<'writing' | 'success'>('writing');
    const [bytes, setBytes] = useState<number | null>(null);

    useEffect(() => {
        if (!open) return;
        setState('writing');
        setBytes(null);
        let active = true;
        simulateNfcWrite(gs1).then((result) => {
            if (!active) return;
            setBytes(result.bytes);
            setState('success');
        });
        return () => {
            active = false;
        };
    }, [open, gs1]);

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onDone()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Nfc className="text-lumiris-emerald h-4 w-4" />
                        {state === 'writing' ? 'Approchez votre étiquette NFC' : 'Puce NFC écrite'}
                    </DialogTitle>
                    <DialogDescription>
                        {state === 'writing'
                            ? 'Maintenez le téléphone contre la puce — écriture simulée en cours…'
                            : `URL GS1 écrite (${bytes} octet${(bytes ?? 0) > 1 ? 's' : ''}).`}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center py-6">
                    {state === 'writing' ? (
                        <Loader2 className="text-lumiris-emerald h-10 w-10 animate-spin" />
                    ) : (
                        <CheckCircle2 className="text-lumiris-emerald h-10 w-10" />
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={onDone} disabled={state === 'writing'} className="w-full">
                        Continuer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
