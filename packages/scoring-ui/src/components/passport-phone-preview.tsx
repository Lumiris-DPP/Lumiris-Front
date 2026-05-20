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
            <div className="bg-card flex flex-col overflow-hidden rounded-[1.75rem]">
                <div className="bg-secondary/40 relative aspect-[3/4] w-full overflow-hidden">
                    {photo ? (
                        <img src={photo} alt={passport.garment.reference} className="h-full w-full object-cover" />
                    ) : (
                        <div className="text-muted-foreground/40 flex h-full w-full items-center justify-center text-xs">
                            (pas de photo)
                        </div>
                    )}
                    <div className="absolute right-3 top-3">
                        <IrisGrade grade={grade} size="lg" tone="solid" />
                    </div>
                    {overrideGrade && overrideGrade !== score.grade ? (
                        <div className="bg-foreground/80 text-background absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold">
                            <Sparkles className="h-2.5 w-2.5" />
                            override
                        </div>
                    ) : null}
                </div>

                <div className="space-y-2 p-4">
                    <p className="text-foreground truncate text-sm font-semibold">{passport.garment.reference}</p>
                    <p className="text-muted-foreground truncate text-xs">
                        {artisan?.atelierName ?? artisan?.displayName ?? '-'}
                    </p>
                    <div className="flex items-baseline justify-between pt-2">
                        <span className="text-foreground text-base font-bold">
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
