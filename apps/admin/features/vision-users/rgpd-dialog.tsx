'use client';

import { useState } from 'react';
import { Download, ShieldAlert, Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@lumiris/ui/components/alert-dialog';
import { Button } from '@lumiris/ui/components/button';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { Label } from '@lumiris/ui/components/label';
import { Textarea } from '@lumiris/ui/components/textarea';
import type { RgpdLocalStatus } from './segments';

interface RgpdDialogProps {
    status: RgpdLocalStatus;
    onStatusChange: (next: RgpdLocalStatus) => void;
    onAnnounce?: (message: string) => void;
}

export function RgpdDialog({ status, onStatusChange, onAnnounce }: RgpdDialogProps) {
    const [exportOpen, setExportOpen] = useState(false);
    const [exportReason, setExportReason] = useState('');
    const [exportConfirmed, setExportConfirmed] = useState(false);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
    const [announcement, setAnnouncement] = useState('');

    const isCompleted = status === 'completed';
    const isPendingDeletion = status === 'pending_deletion';

    const announce = (message: string) => {
        setAnnouncement(message);
        onAnnounce?.(message);
    };

    const handleExportConfirm = () => {
        if (!exportConfirmed) return;
        announce('Export RGPD enregistré.');
        onStatusChange('requested');
        setExportReason('');
        setExportConfirmed(false);
        setExportOpen(false);
    };

    const handleDeleteConfirm = () => {
        if (!deleteConfirmed) return;
        announce('Suppression enregistrée.');
        onStatusChange('pending_deletion');
        setDeleteReason('');
        setDeleteConfirmed(false);
        setDeleteOpen(false);
    };

    return (
        <>
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {announcement}
            </div>
            <div className="flex flex-wrap gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    disabled={isCompleted}
                    onClick={() => setExportOpen(true)}
                    className="gap-1.5"
                >
                    <Download className="h-3.5 w-3.5" aria-hidden /> Export RGPD
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={isCompleted || isPendingDeletion}
                    onClick={() => setDeleteOpen(true)}
                    className="gap-1.5 border-lumiris-rose/40 text-lumiris-rose hover:bg-lumiris-rose/10"
                >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden /> Supprimer compte
                </Button>
            </div>

            <AlertDialog
                open={exportOpen}
                onOpenChange={(open) => {
                    setExportOpen(open);
                    if (!open) {
                        setExportReason('');
                        setExportConfirmed(false);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="inline-flex items-center gap-2">
                            <Download className="h-4 w-4" aria-hidden /> Export RGPD
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tracé dans l&apos;audit log. Export hors-bande par le DPO.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-3">
                        <Textarea
                            value={exportReason}
                            onChange={(e) => setExportReason(e.target.value)}
                            placeholder="Motif"
                            className="min-h-20"
                            aria-label="Motif"
                        />
                        <div className="inline-flex items-center gap-2">
                            <Checkbox
                                id="rgpd-export-confirm"
                                checked={exportConfirmed}
                                onCheckedChange={(v) => setExportConfirmed(Boolean(v))}
                            />
                            <Label htmlFor="rgpd-export-confirm" className="cursor-pointer text-xs text-foreground">
                                Je confirme — l&apos;accès est tracé
                            </Label>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleExportConfirm} disabled={!exportConfirmed}>
                            Confirmer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={deleteOpen}
                onOpenChange={(open) => {
                    setDeleteOpen(open);
                    if (!open) {
                        setDeleteReason('');
                        setDeleteConfirmed(false);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="inline-flex items-center gap-2 text-lumiris-rose">
                            <ShieldAlert className="h-4 w-4" aria-hidden /> Supprimer compte
                        </AlertDialogTitle>
                        <AlertDialogDescription>Irréversible. Tracé dans l&apos;audit log.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-3">
                        <Textarea
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            placeholder="Motif"
                            className="min-h-20"
                            aria-label="Motif"
                        />
                        <div className="inline-flex items-start gap-2">
                            <Checkbox
                                id="rgpd-delete-confirm"
                                checked={deleteConfirmed}
                                onCheckedChange={(v) => setDeleteConfirmed(Boolean(v))}
                            />
                            <Label htmlFor="rgpd-delete-confirm" className="cursor-pointer text-xs text-foreground">
                                Je confirme — l&apos;action est tracée
                            </Label>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={!deleteConfirmed}
                            className="bg-lumiris-rose hover:bg-lumiris-rose/90"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
