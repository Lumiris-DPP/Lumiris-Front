'use client';

import { Card, CardContent } from '@lumiris/ui/components/card';
import { cn } from '@lumiris/ui/lib/cn';
import { WizardShell } from './index';
import type { WizardStep } from '@/lib/draft-store';

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
            <Card>
                <CardContent className={cn('pt-6', contentClassName)}>{children}</CardContent>
            </Card>
        </WizardShell>
    );
}
