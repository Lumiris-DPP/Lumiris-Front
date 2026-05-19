'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Flag, MessageSquare, Sparkles } from 'lucide-react';
import type { AdminAuditLogEntry, Passport, ScoreResult } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import { usePermission } from '@/lib/auth';
import { ValidateDialog } from './validate-dialog';
import { RequestChangesDialog } from './request-changes-dialog';
import { FlagDialog } from './flag-dialog';
import { OverrideDialog } from './override-dialog';
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
    const [flagOpen, setFlagOpen] = useState(false);
    const [overrideOpen, setOverrideOpen] = useState(false);

    if (!canCurate && !canFlag && !canRequest && !canOverride) {
        return (
            <div className="border-border text-muted-foreground bg-muted/30 border-t px-5 py-3 text-center text-xs">
                Vous ne disposez d&apos;aucune permission de curation sur ce passeport.
            </div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-border bg-card flex flex-wrap gap-2 border-t p-4"
            >
                {canCurate ? (
                    <Button
                        size="sm"
                        className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 text-primary-foreground gap-1.5"
                        onClick={() => setValidateOpen(true)}
                        aria-label="Valider et publier ce passeport"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Valider et publier
                    </Button>
                ) : null}
                {canRequest ? (
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => setRequestOpen(true)}
                        aria-label="Demander des changements à l'artisan"
                    >
                        <MessageSquare className="h-3.5 w-3.5" aria-hidden /> Demander des changements
                    </Button>
                ) : null}
                {canFlag ? (
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-lumiris-rose/40 text-lumiris-rose hover:bg-lumiris-rose/10 gap-1.5"
                        onClick={() => setFlagOpen(true)}
                        aria-label="Signaler une anomalie sur ce passeport"
                    >
                        <Flag className="h-3.5 w-3.5" aria-hidden /> Signaler une anomalie
                    </Button>
                ) : null}
                <PermissionRequiredAction requires="passport.override">
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-lumiris-cyan/40 text-lumiris-cyan hover:bg-lumiris-cyan/10 gap-1.5"
                        onClick={() => setOverrideOpen(true)}
                        aria-label="Forcer un grade différent — action tracée dans le journal d'audit"
                    >
                        <Sparkles className="h-3.5 w-3.5" aria-hidden /> Forcer le grade
                    </Button>
                </PermissionRequiredAction>
            </motion.div>

            {canCurate && (
                <ValidateDialog
                    passport={passport}
                    grade={score.grade}
                    open={validateOpen}
                    onOpenChange={setValidateOpen}
                    onAfterAction={onAfterAction}
                />
            )}
            {canRequest && (
                <RequestChangesDialog
                    passport={passport}
                    open={requestOpen}
                    onOpenChange={setRequestOpen}
                    onAfterAction={onAfterAction}
                />
            )}
            {canFlag && (
                <FlagDialog
                    passport={passport}
                    open={flagOpen}
                    onOpenChange={setFlagOpen}
                    onAfterAction={onAfterAction}
                />
            )}
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
