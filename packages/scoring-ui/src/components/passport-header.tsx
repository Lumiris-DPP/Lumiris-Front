'use client';

import type { HTMLAttributes } from 'react';
import type { Artisan, Passport, IrisGrade as IrisGradeLetter } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { GARMENT_KIND_LABEL } from '../theme/dpp-labels';
import { IrisGrade } from './iris-grade';

export interface PassportHeaderProps extends HTMLAttributes<HTMLElement> {
    passport: Passport;
    artisan?: Artisan;
    grade: IrisGradeLetter;
}

export function PassportHeader({ passport, artisan, grade, className, ...rest }: PassportHeaderProps) {
    const kindLabel = GARMENT_KIND_LABEL[passport.garment.kind];
    return (
        <header
            className={cn(
                'border-border/60 bg-card flex flex-col gap-4 overflow-hidden rounded-2xl border md:flex-row md:items-stretch',
                className,
            )}
            {...rest}
        >
            <div className="bg-muted relative h-56 w-full md:h-auto md:w-1/2">
                {passport.garment.mainPhotoUrl ? (
                    <img
                        src={passport.garment.mainPhotoUrl}
                        alt={`${kindLabel} - ${passport.garment.reference}`}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                        Photo manquante
                    </div>
                )}
                <div className="absolute right-3 top-3">
                    <IrisGrade grade={grade} size="lg" tone="solid" />
                </div>
            </div>

            <div className="flex flex-1 flex-col justify-between gap-3 p-4 md:p-6">
                <div>
                    <p className="text-muted-foreground font-mono text-[11px] uppercase tracking-wider">{kindLabel}</p>
                    <h1 className="text-foreground mt-1 text-xl font-semibold leading-tight md:text-2xl">
                        {passport.garment.reference}
                    </h1>
                    {artisan ? (
                        <p className="text-muted-foreground mt-2 text-sm">
                            par <span className="text-foreground font-medium">{artisan.displayName}</span>
                            {artisan.atelierName ? ` · ${artisan.atelierName}` : null}
                            {artisan.city ? ` · ${artisan.city}` : null}
                        </p>
                    ) : null}
                </div>
                <div className="text-muted-foreground flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px]">
                    <span>GS1 {passport.gs1.verificationUrl}</span>
                    {typeof passport.garment.retailPrice === 'number' && passport.garment.retailPrice > 0 ? (
                        <span className="text-foreground text-base font-semibold">
                            {passport.garment.retailPrice} {passport.garment.currency}
                        </span>
                    ) : null}
                </div>
            </div>
        </header>
    );
}
