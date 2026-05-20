'use client';

import type { HTMLAttributes } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ScoreCap } from '@lumiris/types';
import { Alert, AlertDescription, AlertTitle } from '@lumiris/ui/components/alert';
import { cn } from '@lumiris/ui/lib/cn';

export interface ScoreCapWarningProps extends HTMLAttributes<HTMLDivElement> {
    cap: ScoreCap;
}

export function ScoreCapWarning({ cap, className, ...rest }: ScoreCapWarningProps) {
    if (!cap.applied) return null;

    return (
        <Alert
            className={cn(
                'border-iris-grade-d/40 bg-iris-grade-d/10 text-iris-grade-d [&>svg]:text-iris-grade-d',
                className,
            )}
            {...rest}
        >
            <AlertTriangle aria-hidden />
            <AlertTitle className="font-semibold">Plafonné à D</AlertTitle>
            <AlertDescription className="text-iris-grade-d/90">
                {cap.reason ?? 'Champ obligatoire manquant.'}
            </AlertDescription>
        </Alert>
    );
}
