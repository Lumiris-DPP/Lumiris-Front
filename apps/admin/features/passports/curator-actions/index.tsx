'use client';

import { useState } from 'react';
import { CheckCircle2, MessageSquare, Sparkles, XCircle } from 'lucide-react';
import type { Passport, ScoreResult } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import { OverrideDialog } from './override-dialog';
import { RejectDialog } from './reject-dialog';
import { RequestChangesDialog } from './request-changes-dialog';
import { ValidateDialog } from './validate-dialog';

interface CuratorActionsProps {
    passport: Passport;
    score: ScoreResult;
}

export function CuratorActions({ passport, score }: CuratorActionsProps) {
    const [validateOpen, setValidateOpen] = useState(false);
    const [requestOpen, setRequestOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [overrideOpen, setOverrideOpen] = useState(false);

    return (
        <>
            <div className="flex flex-wrap gap-2">
                <Button
                    size="sm"
                    className="gap-1.5 bg-lumiris-emerald text-primary-foreground hover:bg-lumiris-emerald/90"
                    onClick={() => setValidateOpen(true)}
                >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Valider
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRequestOpen(true)}>
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden /> Demander complément
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-lumiris-rose/40 text-lumiris-rose hover:bg-lumiris-rose/10"
                    onClick={() => setRejectOpen(true)}
                >
                    <XCircle className="h-3.5 w-3.5" aria-hidden /> Rejeter
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => setOverrideOpen(true)}>
                    <Sparkles className="h-3.5 w-3.5" aria-hidden /> Override
                </Button>
            </div>

            <ValidateDialog
                passport={passport}
                grade={score.grade}
                open={validateOpen}
                onOpenChange={setValidateOpen}
            />
            <RequestChangesDialog passport={passport} open={requestOpen} onOpenChange={setRequestOpen} />
            <RejectDialog passport={passport} open={rejectOpen} onOpenChange={setRejectOpen} />
            <OverrideDialog passport={passport} score={score} open={overrideOpen} onOpenChange={setOverrideOpen} />
        </>
    );
}
