'use client';

import type { HTMLAttributes } from 'react';
import { Sparkles } from 'lucide-react';
import type { Artisan, Passport, IrisGrade as IrisGradeLetter, ScoreResult } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { IrisGrade } from './iris-grade';
import { gradeBackground, gradeBorder, gradeColor } from '../theme/grade-color';

export interface PassportPhonePreviewProps extends HTMLAttributes<HTMLDivElement> {
    passport: Passport;
    artisan?: Artisan;
    score: ScoreResult;
    overrideGrade?: IrisGradeLetter;
}

export function PassportPhonePreview({
    passport,
    artisan,
    score,
    overrideGrade,
    className,
    ...rest
}: PassportPhonePreviewProps) {
    const grade = overrideGrade ?? score.grade;
    const photo = passport.garment.mainPhotoUrl;

    return (
        <div
            className={cn(
                'mx-auto w-[280px] overflow-hidden rounded-[2.5rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl',
                className,
            )}
            {...rest}
        >
            <div className="flex flex-col overflow-hidden rounded-[1.75rem] bg-card">
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary/40">
                    {photo ? (
                        <img src={photo} alt={passport.garment.reference} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground/40">
                            (pas de photo)
                        </div>
                    )}
                    <div className="absolute top-3 right-3">
                        <IrisGrade grade={grade} size="lg" tone="solid" />
                    </div>
                    {overrideGrade && overrideGrade !== score.grade ? (
                        <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-foreground/80 px-2 py-1 text-[10px] font-semibold text-background">
                            <Sparkles className="h-2.5 w-2.5" />
                            override
                        </div>
                    ) : null}
                </div>

                <div className="space-y-2 p-4">
                    <p className="truncate text-sm font-semibold text-foreground">{passport.garment.reference}</p>
                    <p className="truncate text-xs text-muted-foreground">
                        {artisan?.atelierName ?? artisan?.displayName ?? '-'}
                    </p>
                    <div className="flex items-baseline justify-between pt-2">
                        <span className="text-base font-bold text-foreground">
                            {passport.garment.retailPrice.toLocaleString('fr-FR')} €
                        </span>
                        <span
                            className={cn(
                                'rounded-full border px-2 py-0.5 font-mono text-[10px]',
                                gradeColor(grade),
                                gradeBackground(grade),
                                gradeBorder(grade),
                            )}
                        >
                            {Math.round(score.total)} / 100
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
