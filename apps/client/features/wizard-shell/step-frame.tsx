'use client';

import { Info, X } from 'lucide-react';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { cn } from '@lumiris/ui/lib/cn';
import { WizardShell } from './index';
import { useDraftStore, type WizardStep } from '@/lib/draft-store';

interface WizardStepFrameProps {
    draftId: string;
    step: WizardStep;
    onPrev?: () => void;
    onNext?: () => void;
    nextLabel?: string;
    nextMissing?: string[];
    contentClassName?: string;
    hideNav?: boolean;
    children: React.ReactNode;
}

export function WizardStepFrame({
    draftId,
    step,
    onPrev,
    onNext,
    nextLabel,
    nextMissing,
    contentClassName,
    hideNav,
    children,
}: WizardStepFrameProps) {
    const filesDropped = useDraftStore((s) => s.drafts[draftId]?.filesDropped ?? false);
    const clearFilesDropped = useDraftStore((s) => s.clearFilesDropped);

    return (
        <WizardShell
            draftId={draftId}
            step={step}
            onPrev={onPrev}
            onNext={onNext}
            nextLabel={nextLabel}
            nextMissing={nextMissing}
            hideNav={hideNav}
        >
            {filesDropped && (
                <div className="border-lumiris-amber/40 bg-lumiris-amber/10 mb-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm">
                    <Info className="text-lumiris-amber mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <p className="text-muted-foreground flex-1">
                        Vos informations ont bien été restaurées. En revanche, les documents que vous aviez téléversés
                        doivent être re-sélectionnés : les fichiers ne sont pas conservés après un rafraîchissement de
                        la page.
                    </p>
                    <button
                        type="button"
                        onClick={() => clearFilesDropped(draftId)}
                        aria-label="Masquer ce message"
                        className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            <Card>
                <CardContent className={cn('pt-6', contentClassName)}>{children}</CardContent>
            </Card>
        </WizardShell>
    );
}
