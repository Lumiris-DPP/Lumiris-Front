// Strings littérales : Tailwind v4 doit pouvoir les scanner sans `@source inline`.

import type { IrisGrade } from '@lumiris/types';

export const GRADE_TEXT: Record<IrisGrade, string> = {
    A: 'text-lumiris-emerald',
    B: 'text-lumiris-cyan',
    C: 'text-lumiris-iris',
    D: 'text-lumiris-amber',
    E: 'text-lumiris-rose',
};

export const GRADE_BORDER: Record<IrisGrade, string> = {
    A: 'border-lumiris-emerald',
    B: 'border-lumiris-cyan',
    C: 'border-lumiris-iris',
    D: 'border-lumiris-amber',
    E: 'border-lumiris-rose',
};

export const GRADE_BG_SOFT: Record<IrisGrade, string> = {
    A: 'bg-lumiris-emerald/10',
    B: 'bg-lumiris-cyan/10',
    C: 'bg-lumiris-iris/10',
    D: 'bg-lumiris-amber/10',
    E: 'bg-lumiris-rose/10',
};

export const GRADE_LINE: Record<IrisGrade, string> = {
    A: 'bg-lumiris-emerald/30',
    B: 'bg-lumiris-cyan/30',
    C: 'bg-lumiris-iris/30',
    D: 'bg-lumiris-amber/30',
    E: 'bg-lumiris-rose/30',
};

export const GRADE_DOT_BG: Record<IrisGrade, string> = {
    A: 'bg-lumiris-emerald/40',
    B: 'bg-lumiris-cyan/40',
    C: 'bg-lumiris-iris/40',
    D: 'bg-lumiris-amber/40',
    E: 'bg-lumiris-rose/40',
};

export const GRADE_CSS_VAR: Record<IrisGrade, string> = {
    A: 'var(--color-lumiris-emerald)',
    B: 'var(--color-lumiris-cyan)',
    C: 'var(--color-lumiris-iris)',
    D: 'var(--color-lumiris-amber)',
    E: 'var(--color-lumiris-rose)',
};
