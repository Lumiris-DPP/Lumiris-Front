import type { GarmentKind, IrisGrade } from '@lumiris/types';

export const KIND_LABEL_FR: Record<GarmentKind, string> = {
    sweater: 'Pull',
    shirt: 'Chemise',
    shoe: 'Chaussure',
    jacket: 'Veste',
    trouser: 'Pantalon',
    accessory: 'Accessoire',
    other: 'Autre',
};

export const DEFAULT_LOCALE = 'en-US';

export interface FormatOptions {
    locale?: string;
}

export function formatDate(value: string | Date, options: FormatOptions = {}): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat(options.locale ?? DEFAULT_LOCALE, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

export function formatRelativeDate(
    value: string | Date,
    reference: Date = new Date(),
    options: FormatOptions = {},
): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    const diffMs = date.getTime() - reference.getTime();
    const rtf = new Intl.RelativeTimeFormat(options.locale ?? DEFAULT_LOCALE, { numeric: 'auto' });
    const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
        ['year', 1000 * 60 * 60 * 24 * 365],
        ['month', 1000 * 60 * 60 * 24 * 30],
        ['week', 1000 * 60 * 60 * 24 * 7],
        ['day', 1000 * 60 * 60 * 24],
        ['hour', 1000 * 60 * 60],
        ['minute', 1000 * 60],
        ['second', 1000],
    ];
    for (const [unit, ms] of units) {
        if (Math.abs(diffMs) >= ms) return rtf.format(Math.round(diffMs / ms), unit);
    }
    return rtf.format(0, 'second');
}

export function formatPercent(
    value: number,
    options: FormatOptions & { fromUnit?: boolean; digits?: number } = {},
): string {
    if (!Number.isFinite(value)) return '-';
    const ratio = options.fromUnit ? value : value / 100;
    return new Intl.NumberFormat(options.locale ?? DEFAULT_LOCALE, {
        style: 'percent',
        minimumFractionDigits: options.digits ?? 0,
        maximumFractionDigits: options.digits ?? 1,
    }).format(ratio);
}

export function formatScoreTotal(total: number): string {
    if (!Number.isFinite(total)) return '- / 100';
    return `${roundTo(total, 1)} / 100`;
}

export function formatGrade(grade: IrisGrade | null | undefined): string {
    return grade ?? '-';
}

function roundTo(n: number, digits: number): number {
    const f = 10 ** digits;
    return Math.round(n * f) / f;
}

export function slugify(input: string): string {
    return input
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
