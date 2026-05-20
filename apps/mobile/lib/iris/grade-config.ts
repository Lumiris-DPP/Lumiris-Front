// Labels EN courts spécifiques à la surface mobile — ne pas remonter dans scoring-ui.

import { gradeBackground, gradeBackgroundSolid, gradeBorder, gradeColor } from '@lumiris/scoring-ui';
import type { IrisGrade } from '@lumiris/types';

const GRADE_LABEL_EN: Record<IrisGrade, string> = {
    A: 'Exceptional',
    B: 'Good',
    C: 'Average',
    D: 'Poor',
    E: 'Opaque',
};

interface GradeConfigEntry {
    color: string;
    label: string;
    cssClass: string;
    bgClass: string;
    bgSoftClass: string;
    borderClass: string;
}

export const GRADE_CONFIG: Record<IrisGrade, GradeConfigEntry> = {
    A: makeEntry('A'),
    B: makeEntry('B'),
    C: makeEntry('C'),
    D: makeEntry('D'),
    E: makeEntry('E'),
};

function makeEntry(grade: IrisGrade): GradeConfigEntry {
    return {
        color: `var(--iris-grade-${grade.toLowerCase()})`,
        label: GRADE_LABEL_EN[grade],
        cssClass: gradeColor(grade),
        bgClass: gradeBackgroundSolid(grade),
        bgSoftClass: gradeBackground(grade),
        borderClass: gradeBorder(grade),
    };
}
