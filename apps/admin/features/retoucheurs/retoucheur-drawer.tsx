'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { Repairer } from '@lumiris/types';
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
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { DetailDrawer } from '@lumiris/ui/components/detail-drawer';
import { Label } from '@lumiris/ui/components/label';
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import { useLogAction, usePermission } from '@/lib/auth';
import { PermissionRequiredAction } from '../_shared/permission-required-action';
import { CommissionsTab } from './commissions-tab';
import { deriveSubscription, KycTab, ProfileTab } from './drawer-tabs';
import { ReviewsTab } from './reviews-tab';
import { STATUS_LABEL, STATUS_TONE } from './specialty-status';
import type { RetoucheurOverlay } from './types';

interface RetoucheurDrawerProps {
    retoucheur: Repairer | null;
    overlay: RetoucheurOverlay | undefined;
    onClose: () => void;
    onPatchOverlay: (id: string, patch: Partial<RetoucheurOverlay>) => void;
}

export function RetoucheurDrawer({ retoucheur, overlay, onClose, onPatchOverlay }: RetoucheurDrawerProps) {
    const log = useLogAction();
    const canVerify = usePermission('retoucheur.kyc_verify');
    const canModerate = usePermission('retoucheur.review_hide');

    const [verifyOpen, setVerifyOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectConfirmed, setRejectConfirmed] = useState(false);
    const [announcement, setAnnouncement] = useState('');

    if (!retoucheur) return null;

    const status = overlay?.candidatureStatus ?? 'verified';

    const handleVerify = () => {
        onPatchOverlay(retoucheur.id, { candidatureStatus: 'verified' });
        const entry = log({
            action: 'retoucheur.kyc_verify',
            targetType: 'repairer',
            targetId: retoucheur.id,
            payload: { decision: 'verified' },
        });
        setAnnouncement(`KYC vérifié pour ${retoucheur.displayName} — audit log ${entry.id}.`);
        setVerifyOpen(false);
    };

    const handleReject = () => {
        if (!rejectConfirmed) return;
        onPatchOverlay(retoucheur.id, { candidatureStatus: 'rejected', rejectReason });
        const entry = log({
            action: 'retoucheur.kyc_reject',
            targetType: 'repairer',
            targetId: retoucheur.id,
            payload: { decision: 'rejected', reason: rejectReason },
        });
        setAnnouncement(`Candidature rejetée pour ${retoucheur.displayName} — audit log ${entry.id}.`);
        setRejectReason('');
        setRejectConfirmed(false);
        setRejectOpen(false);
    };

    const handleLocalDunning = () => {
        const sub = deriveSubscription(retoucheur, overlay);
        onPatchOverlay(retoucheur.id, { subscriptionOverride: { ...sub, status: 'active' } });
        const entry = log({
            action: 'retoucheur.local_dunning',
            targetType: 'repairer',
            targetId: retoucheur.id,
            payload: { subscription: 'overdue_resolved' },
        });
        setAnnouncement(`Impayé Local résolu pour ${retoucheur.displayName} — audit log ${entry.id}.`);
    };

    const tabs = [
        {
            value: 'profile',
            label: 'Profil',
            content: (
                <div className="space-y-6">
                    <ProfileTab retoucheur={retoucheur} />
                    <KycTab
                        retoucheur={retoucheur}
                        overlay={overlay}
                        canVerify={canVerify}
                        onOpenVerify={() => setVerifyOpen(true)}
                        onOpenReject={() => setRejectOpen(true)}
                        onResolveOverdue={handleLocalDunning}
                    />
                </div>
            ),
        },
        {
            value: 'activity',
            label: 'Activité',
            content: (
                <div className="space-y-6">
                    <ReviewsTab
                        retoucheur={retoucheur}
                        overlay={overlay}
                        canModerate={canModerate}
                        onPatchOverlay={onPatchOverlay}
                        onAnnounce={setAnnouncement}
                    />
                    <CommissionsTab retoucheurId={retoucheur.id} />
                </div>
            ),
        },
    ];

    return (
        <>
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {announcement}
            </div>
            <DetailDrawer
                open
                onOpenChange={(open) => !open && onClose()}
                title={retoucheur.displayName}
                subtitle={`${retoucheur.atelierName ?? ''} · ${retoucheur.city}`}
                width="md"
                tabs={tabs}
                footer={
                    <div className="flex items-center justify-between">
                        <Badge variant="outline" className={cn('font-mono text-[10px]', STATUS_TONE[status])}>
                            {STATUS_LABEL[status]}
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={onClose}>
                            Fermer
                        </Button>
                    </div>
                }
            />

            <AlertDialog open={verifyOpen} onOpenChange={setVerifyOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="inline-flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" aria-hidden /> Vérifier le KYC ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Le retoucheur passera en <strong>vérifié</strong>. Action tracée.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <PermissionRequiredAction requires="retoucheur.kyc_verify">
                            <AlertDialogAction
                                onClick={handleVerify}
                                className="bg-lumiris-emerald hover:bg-lumiris-emerald/90"
                            >
                                Confirmer
                            </AlertDialogAction>
                        </PermissionRequiredAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={rejectOpen}
                onOpenChange={(open) => {
                    setRejectOpen(open);
                    if (!open) {
                        setRejectReason('');
                        setRejectConfirmed(false);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rejeter la candidature ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette décision sera tracée dans le journal d&apos;audit.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-3">
                        <Textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder={`Motif du rejet (optionnel) pour ${retoucheur.displayName}…`}
                            className="min-h-20"
                            aria-label="Motif du rejet"
                        />
                        <div className="inline-flex items-center gap-2">
                            <Checkbox
                                id="retoucheur-reject-confirm"
                                checked={rejectConfirmed}
                                onCheckedChange={(v) => setRejectConfirmed(Boolean(v))}
                            />
                            <Label
                                htmlFor="retoucheur-reject-confirm"
                                className="cursor-pointer text-xs text-foreground"
                            >
                                Je confirme le rejet de cette candidature.
                            </Label>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <PermissionRequiredAction requires="retoucheur.kyc_verify">
                            <AlertDialogAction
                                onClick={handleReject}
                                disabled={!rejectConfirmed}
                                className="bg-lumiris-rose hover:bg-lumiris-rose/90"
                            >
                                Rejeter
                            </AlertDialogAction>
                        </PermissionRequiredAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
