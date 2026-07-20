export interface LabelConfig {
    key: 'epv' | 'ofg' | 'gots' | 'oeko-tex';
    name: string;
    description: string;
    dot: string;
}

export const SUPPORTED_LABELS: readonly LabelConfig[] = [
    {
        key: 'epv',
        name: 'EPV',
        description: 'Entreprise du Patrimoine Vivant',
        dot: 'bg-lumiris-amber',
    },
    {
        key: 'ofg',
        name: 'OFG',
        description: 'Origine France Garantie',
        dot: 'bg-tier-studio',
    },
    {
        key: 'gots',
        name: 'GOTS',
        description: 'Global Organic Textile Standard',
        dot: 'bg-lumiris-emerald',
    },
    {
        key: 'oeko-tex',
        name: 'OEKO-TEX',
        description: 'STANDARD 100 — sans substances nocives',
        dot: 'bg-tier-maison',
    },
];

export function slugify(input: string): string {
    return input
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

export function isValidEmail(s: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
