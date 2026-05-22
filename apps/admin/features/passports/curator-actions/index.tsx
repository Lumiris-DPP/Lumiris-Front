'use client';

import { useState } from 'react';
import { CheckCircle2, MessageSquare, Sparkles, XCircle } from 'lucide-react';
import type { AdminAuditLogEntry, Passport, ScoreResult } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import { usePermission } from '@/lib/auth';
import { OverrideDialog } from './override-dialog';
import { RejectDialog } from './reject-dialog';
import { RequestChangesDialog } from './request-changes-dialog';
import { ValidateDialog } from './validate-dialog';
import { PermissionRequiredAction } from '../../_shared/permission-required-action';

interface CuratorActionsProps {
    passport: Passport;
    score: ScoreResult;
    onAfterAction: (entry: AdminAuditLogEntry) => void;
}

export function CuratorActions({ passport, score, onAfterAction }: CuratorActionsProps) {
    const canCurate = usePermission('passport.curate');
    const canFlag = usePermission('passport.flag');
    const canRequest = usePermission('passport.request_changes');
    const canOverride = usePermission('passport.override');

    const [validateOpen, setValidateOpen] = useState(false);
    const [requestOpen, setRequestOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [overrideOpen, setOverrideOpen] = useState(false);

    if (!canCurate && !canFlag && !canRequest && !canOverride) {
        return (
            <div className="text-muted-foreground text-center text-xs">
                Vous ne disposez d&apos;aucune permission de curation sur ce passeport.
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {canCurate ? (
                    <Button
                        size="sm"
                        className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 text-primary-foreground gap-1.5"
                        onClick={() => setValidateOpen(true)}
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Valider
                    </Button>
                ) : null}
                {canRequest ? (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRequestOpen(true)}>
                        <MessageSquare className="h-3.5 w-3.5" aria-hidden /> Demander complément
                    </Button>
                ) : null}
                {canFlag ? (
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-lumiris-rose/40 text-lumiris-rose hover:bg-lumiris-rose/10 gap-1.5"
                        onClick={() => setRejectOpen(true)}
                    >
                        <XCircle className="h-3.5 w-3.5" aria-hidden /> Rejeter
                    </Button>
                ) : null}
                <PermissionRequiredAction requires="passport.override">
                    <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => setOverrideOpen(true)}>
                        <Sparkles className="h-3.5 w-3.5" aria-hidden /> Override
                    </Button>
                </PermissionRequiredAction>
            </div>

            {canCurate ? (
                <ValidateDialog
                    passport={passport}
                    grade={score.grade}
                    open={validateOpen}
                    onOpenChange={setValidateOpen}
                    onAfterAction={onAfterAction}
                />
            ) : null}
            {canRequest ? (
                <RequestChangesDialog
                    passport={passport}
                    open={requestOpen}
                    onOpenChange={setRequestOpen}
                    onAfterAction={onAfterAction}
                />
            ) : null}
            {canFlag ? (
                <RejectDialog
                    passport={passport}
                    open={rejectOpen}
                    onOpenChange={setRejectOpen}
                    onAfterAction={onAfterAction}
                />
            ) : null}
            {canOverride ? (
                <OverrideDialog
                    passport={passport}
                    score={score}
                    open={overrideOpen}
                    onOpenChange={setOverrideOpen}
                    onAfterAction={onAfterAction}
                />
            ) : null}
        </>
    );
}
