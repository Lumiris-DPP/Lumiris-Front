import type { IrisAxis, IrisGrade } from '@lumiris/types';

export type GradeColorToken = 'lumiris-emerald' | 'lumiris-cyan' | 'lumiris-iris' | 'lumiris-amber' | 'lumiris-rose';

export const GRADE_COLOR: Record<IrisGrade, GradeColorToken> = {
    A: 'lumiris-emerald',
    B: 'lumiris-cyan',
    C: 'lumiris-iris',
    D: 'lumiris-amber',
    E: 'lumiris-rose',
};

export function gradeColor(grade: IrisGrade): string {
    return `text-${GRADE_COLOR[grade]}`;
}

export function gradeBackground(grade: IrisGrade): string {
    return `bg-${GRADE_COLOR[grade]}/10`;
}

export function gradeBorder(grade: IrisGrade): string {
    return `border-${GRADE_COLOR[grade]}/30`;
}

export function gradeBackgroundSolid(grade: IrisGrade): string {
    return `bg-${GRADE_COLOR[grade]}`;
}

export function gradeBorder2px(grade: IrisGrade): string {
    return `border-2 border-${GRADE_COLOR[grade]}`;
}

export function gradeColorVar(grade: IrisGrade): string {
    return `var(--${GRADE_COLOR[grade]})`;
}

export const GRADE_LABEL: Record<IrisGrade, string> = {
    A: 'Excellent',
    B: 'Bon',
    C: 'Moyen',
    D: 'Insuffisant',
    E: 'Opaque',
};

export const AXIS_COLOR: Record<IrisAxis, GradeColorToken> = {
    transparency: 'lumiris-emerald',
    craftsmanship: 'lumiris-cyan',
    impact: 'lumiris-amber',
    repairability: 'lumiris-iris',
};

export const AXIS_LABEL: Record<IrisAxis, string> = {
    transparency: 'Transparence',
    craftsmanship: 'Savoir-faire',
    impact: 'Impact',
    repairability: 'Réparabilité',
};
