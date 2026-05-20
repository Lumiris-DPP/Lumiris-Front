'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { cn } from '@lumiris/ui/lib/cn';
import { WizardShell } from './index';
import type { WizardStep } from '@/lib/draft-store';

interface WizardStepFrameProps {
    draftId: string;
    step: WizardStep;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    onPrev?: () => void;
    onNext?: () => void;
    nextLabel?: string;
    nextMissing?: string[];
    contentClassName?: string;
    children: React.ReactNode;
}

export function WizardStepFrame({
    draftId,
    step,
    title,
    subtitle,
    onPrev,
    onNext,
    nextLabel,
    nextMissing,
    contentClassName,
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
        >
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
                </CardHeader>
                <CardContent className={cn(contentClassName)}>{children}</CardContent>
            </Card>
        </WizardShell>
    );
}
