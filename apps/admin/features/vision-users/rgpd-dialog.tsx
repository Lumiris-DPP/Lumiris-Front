'use client';

import { useState } from 'react';
import { Download, ShieldAlert, Trash2 } from 'lucide-react';
import type { MockVisionUser } from '@lumiris/mock-data';
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
import { Input } from '@lumiris/ui/components/input';
import { Textarea } from '@lumiris/ui/components/textarea';
import { useLogAction, usePermission } from '@/lib/auth';
import { PermissionRequiredAction } from '../_shared/permission-required-action';
import type { RgpdLocalStatus } from './segments';

const MIN_REASON_LENGTH = 30;

interface RgpdDialogProps {
    user: MockVisionUser;
    status: RgpdLocalStatus;
    onStatusChange: (next: RgpdLocalStatus) => void;
    onAnnounce?: (message: string) => void;
}

export function RgpdDialog({ user, status, onStatusChange, onAnnounce }: RgpdDialogProps) {
    const log = useLogAction();
    const canExport = usePermission('vision_user.gdpr_export');
    const canErase = usePermission('vision_user.gdpr_delete');

    const [exportOpen, setExportOpen] = useState(false);
    const [exportReason, setExportReason] = useState('');

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteTypedEmail, setDeleteTypedEmail] = useState('');
    const [announcement, setAnnouncement] = useState('');

    const isCompleted = status === 'completed';
    const isPendingDeletion = status === 'pending_deletion';

    const exportReady = exportReason.trim().length >= MIN_REASON_LENGTH;
    const deleteReady =
        deleteReason.trim().length >= MIN_REASON_LENGTH && !!user.email && deleteTypedEmail.trim() === user.email;

    const announce = (message: string) => {
        setAnnouncement(message);
        onAnnounce?.(message);
    };

    const handleExportConfirm = () => {
        if (!exportReady) return;
        const entry = log({
            action: 'vision_user.gdpr_export',
            targetType: 'vision_user',
            targetId: user.id,
            payload: {
                reason: exportReason.trim(),
                kind: 'gdpr_export',
                generated: false,
            },
        });
        announce(`Export RGPD enregistré — audit log ${entry.id} créé.`);
        onStatusChange('requested');
        setExportReason('');
        setExportOpen(false);
    };

    const handleDeleteConfirm = () => {
        if (!deleteReady) return;
        const entry = log({
            action: 'vision_user.gdpr_delete',
            targetType: 'vision_user',
            targetId: user.id,
            payload: {
                reason: deleteReason.trim(),
                kind: 'gdpr_delete',
                email_at_request: user.email,
            },
        });
        announce(`Suppression enregistrée — audit log ${entry.id} créé.`);
        onStatusChange('pending_deletion');
        setDeleteReason('');
        setDeleteTypedEmail('');
        setDeleteOpen(false);
    };

    return (
        <>
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {announcement}
            </div>
            <div className="flex flex-wrap gap-2">
                <PermissionRequiredAction requires="vision_user.gdpr_export">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!canExport || isCompleted}
                        onClick={() => setExportOpen(true)}
                        className="gap-1.5"
                    >
                        <Download className="h-3.5 w-3.5" aria-hidden /> Export RGPD
                    </Button>
                </PermissionRequiredAction>
                <PermissionRequiredAction requires="vision_user.gdpr_delete">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!canErase || isCompleted || isPendingDeletion}
                        onClick={() => setDeleteOpen(true)}
                        className="border-lumiris-rose/40 text-lumiris-rose hover:bg-lumiris-rose/10 gap-1.5"
                    >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden /> Supprimer compte
                    </Button>
                </PermissionRequiredAction>
            </div>

            <AlertDialog
                open={exportOpen}
                onOpenChange={(open) => {
                    setExportOpen(open);
                    if (!open) setExportReason('');
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="inline-flex items-center gap-2">
                            <Download className="h-4 w-4" aria-hidden /> Export RGPD
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            La demande sera tracée dans le journal d&apos;audit et le statut passera à{' '}
                            <strong>Export demandé</strong>. Aucun fichier n&apos;est généré côté V1 — l&apos;export
                            complet est délivré hors-bande par le DPO.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <p className="text-muted-foreground text-[11px]">
                            Motif (≥ {MIN_REASON_LENGTH} caractères) :{' '}
                            <span className="font-mono">
                                {exportReason.trim().length}/{MIN_REASON_LENGTH}
                            </span>
                        </p>
                        <Textarea
                            value={exportReason}
                            onChange={(e) => setExportReason(e.target.value)}
                            placeholder="Exemple : demande utilisateur transmise par email — ticket support #4231"
                            className="min-h-24"
                            aria-label="Motif de l'export RGPD"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <PermissionRequiredAction requires="vision_user.gdpr_export">
                            <AlertDialogAction onClick={handleExportConfirm} disabled={!exportReady}>
                                Confirmer la demande
                            </AlertDialogAction>
                        </PermissionRequiredAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={deleteOpen}
                onOpenChange={(open) => {
                    setDeleteOpen(open);
                    if (!open) {
                        setDeleteReason('');
                        setDeleteTypedEmail('');
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lumiris-rose inline-flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" aria-hidden /> Supprimer le compte
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Le compte sera marqué <strong>Suppression en attente</strong> et entrera dans la file
                            d&apos;anonymisation. Action tracée dans le journal d&apos;audit ; irréversible après
                            confirmation.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-3">
                        <div>
                            <p className="text-muted-foreground mb-1 text-[11px]">
                                Motif (≥ {MIN_REASON_LENGTH} caractères) :{' '}
                                <span className="font-mono">
                                    {deleteReason.trim().length}/{MIN_REASON_LENGTH}
                                </span>
                            </p>
                            <Textarea
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                placeholder="Exemple : demande utilisateur par formulaire DPO du 2026-04-30, identité vérifiée"
                                className="min-h-20"
                                aria-label="Motif de la suppression"
                            />
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1 text-[11px]">
                                Tapez l&apos;email exact du compte pour confirmer :{' '}
                                <code className="bg-muted text-foreground rounded px-1 font-mono text-[11px]">
                                    {user.email ?? '-'}
                                </code>
                            </p>
                            <Input
                                value={deleteTypedEmail}
                                onChange={(e) => setDeleteTypedEmail(e.target.value)}
                                placeholder="email@exemple.com"
                                autoComplete="off"
                                aria-label="Email exact du compte pour confirmation"
                            />
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <PermissionRequiredAction requires="vision_user.gdpr_delete">
                            <AlertDialogAction
                                onClick={handleDeleteConfirm}
                                disabled={!deleteReady}
                                className="bg-lumiris-rose hover:bg-lumiris-rose/90"
                            >
                                Confirmer la suppression
                            </AlertDialogAction>
                        </PermissionRequiredAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
