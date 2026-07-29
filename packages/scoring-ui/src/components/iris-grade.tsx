'use client';

import type { HTMLAttributes } from 'react';
import type { IrisGrade as IrisGradeLetter } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { gradeBackground, gradeBackgroundSolid, gradeBorder, gradeColor } from '../theme/grade-color';

export type IrisGradeSize = 'sm' | 'md' | 'lg' | 'xl';
export type IrisGradeTone = 'soft' | 'solid';
export type IrisGradeShape = 'pill' | 'square';

export interface IrisGradeProps extends HTMLAttributes<HTMLDivElement> {
    grade: IrisGradeLetter;
    size?: IrisGradeSize;
    tone?: IrisGradeTone;
    shape?: IrisGradeShape;
}

const SIZE: Record<IrisGradeSize, string> = {
    sm: 'h-6 w-6 text-[11px]',
    md: 'h-9 w-9 text-sm',
    lg: 'h-14 w-14 text-xl',
    xl: 'h-[5.625rem] w-[5.625rem] text-[64px] leading-none font-bold',
};

const SHAPE: Record<IrisGradeShape, string> = {
    pill: 'rounded-full',
    square: 'rounded-2xl',
};

export function IrisGrade({ grade, size = 'md', tone = 'soft', shape = 'pill', className, ...rest }: IrisGradeProps) {
    const toneClasses =
        tone === 'solid'
            ? cn(gradeBackgroundSolid(grade), 'border-transparent text-primary-foreground')
            : cn(gradeColor(grade), gradeBackground(grade), gradeBorder(grade));

    return (
        <div
            role="img"
            aria-label={`Iris grade ${grade}`}
            className={cn(
                'inline-flex shrink-0 items-center justify-center border font-mono font-semibold tracking-tight',
                SHAPE[shape],
                SIZE[size],
                toneClasses,
                className,
            )}
            {...rest}
        >
            {grade}
        </div>
    );
}
