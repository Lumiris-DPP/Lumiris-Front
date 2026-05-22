'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Textarea } from '@lumiris/ui/components/textarea';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lumiris/ui/components/tooltip';
import { useToast } from '@lumiris/ui/hooks/use-toast';
import { useLogAction, usePermission } from '@/lib/auth';
import { useCurationStore } from './curation-store';
import type { PassportRow } from './types';

const REQUEST_TEMPLATE = `Bonjour,

Pour finaliser la curation de ce passeport, merci de joindre :
- la facture du fournisseur de fibre principale,
- une photo additionnelle de l'étape de fabrication,
- la fiche entretien complète (lavage / séchage / repassage / stockage).

Sans ces compléments sous 7 jours, le passeport sera renvoyé en brouillon.

Bien à vous,
L'équipe LUMIRIS`;

function isGradeAtLeastB(row: PassportRow): boolean {
    return !row.capApplied && !row.hasMissingRegulatoryField;
}

interface BulkActionsBarProps {
    rows: readonly PassportRow[];
    selectedIds: ReadonlySet<string>;
    onClear: () => void;
}

export function BulkActionsBar({ rows, selectedIds, onClear }: BulkActionsBarProps) {
    const canCurate = usePermission('passport.curate');
    const canRequest = usePermission('passport.request_changes');
    const [validateOpen, setValidateOpen] = useState(false);
    const [requestOpen, setRequestOpen] = useState(false);

    const selectedRows = useMemo(() => rows.filter((r) => selectedIds.has(r.passport.id)), [rows, selectedIds]);
    const eligible = useMemo(
        () =>
            selectedRows.filter(
                (r) => (r.passport.moderation?.status ?? 'PendingReview') === 'PendingReview' && isGradeAtLeastB(r),
            ),
        [selectedRows],
    );

    if (selectedIds.size === 0) return null;

    return (
        <TooltipProvider>
            <div className="border-lumiris-cyan/30 bg-lumiris-cyan/5 flex flex-wrap items-center gap-2 rounded-xl border p-3">
                <span id="bulk-validate-hint" className="text-foreground text-xs font-medium">
                    {selectedIds.size} sélectionné(s)
                </span>
                <span className="text-muted-foreground text-[10px]">· {eligible.length} éligible(s)</span>
                <div className="ml-auto flex flex-wrap gap-2">
                    {canCurate ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 text-primary-foreground gap-1.5"
                                    disabled={eligible.length === 0}
                                    onClick={() => setValidateOpen(true)}
                                    aria-describedby="bulk-validate-hint"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                                    Valider · {eligible.length}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Grade ≥ B et PendingReview uniquement.</TooltipContent>
                        </Tooltip>
                    ) : null}
                    {canRequest ? (
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRequestOpen(true)}>
                            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                            Demander modifs
                        </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={onClear}>
                        Vider
                    </Button>
                </div>

                {canCurate ? (
                    <BulkValidateDialog
                        rows={eligible}
                        open={validateOpen}
                        onOpenChange={setValidateOpen}
                        onDone={onClear}
                    />
                ) : null}
                {canRequest ? (
                    <BulkRequestChangesDialog
                        rows={selectedRows}
                        open={requestOpen}
                        onOpenChange={setRequestOpen}
                        onDone={onClear}
                    />
                ) : null}
            </div>
        </TooltipProvider>
    );
}

interface BulkDialogProps {
    rows: readonly PassportRow[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDone: () => void;
}

function BulkValidateDialog({ rows, open, onOpenChange, onDone }: BulkDialogProps) {
    const log = useLogAction();
    const { setOverlay } = useCurationStore();
    const { toast } = useToast();

    const handleConfirm = () => {
        const publishedAt = new Date().toISOString();
        for (const row of rows) {
            setOverlay(row.passport.id, { status: 'validated', publishedAt });
            log({
                action: 'passport.curate',
                targetType: 'passport',
                targetId: row.passport.id,
                payload: {
                    decision: 'validated',
                    bulk: true,
                    publishedAt,
                    qrCodeUrl: row.passport.gs1.verificationUrl,
                    artisanId: row.passport.artisanId,
                },
            });
        }
        toast({
            title: `${rows.length} passeport(s) validé(s)`,
            description: 'Une entrée audit log par passeport a été écrite.',
        });
        onOpenChange(false);
        onDone();
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Valider {rows.length} passeport(s)</AlertDialogTitle>
                    <AlertDialogDescription>Grade ≥ B et PendingReview uniquement.</AlertDialogDescription>
                </AlertDialogHeader>
                <ul className="border-border bg-muted/30 max-h-48 space-y-1 overflow-y-auto rounded-xl border p-3 text-xs">
                    {rows.map((r) => (
                        <li key={r.passport.id} className="font-mono text-[11px]">
                            · {r.passport.garment.reference}
                        </li>
                    ))}
                </ul>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className="bg-lumiris-emerald hover:bg-lumiris-emerald/90"
                    >
                        Confirmer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function BulkRequestChangesDialog({ rows, open, onOpenChange, onDone }: BulkDialogProps) {
    const log = useLogAction();
    const { setOverlay } = useCurationStore();
    const { toast } = useToast();
    const [message, setMessage] = useState(REQUEST_TEMPLATE);

    const handleSend = () => {
        if (message.trim().length === 0) return;
        for (const row of rows) {
            setOverlay(row.passport.id, { status: 'changes_requested', changesMessage: message });
            log({
                action: 'passport.request_changes',
                targetType: 'passport',
                targetId: row.passport.id,
                payload: { message, bulk: true, artisanId: row.passport.artisanId },
            });
        }
        toast({ title: `${rows.length} demande(s) envoyée(s)`, description: 'Une entrée audit log par passeport.' });
        onOpenChange(false);
        onDone();
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Demander modifs · {rows.length}</AlertDialogTitle>
                    <AlertDialogDescription>Envoyé à chaque artisan, tracé par passeport.</AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-40 font-mono text-xs"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSend} disabled={message.trim().length === 0}>
                        Envoyer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
