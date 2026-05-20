interface RegulatoryMilestone {
    date: string;
    label: string;
    scope: 'EU' | 'FR' | 'Sectoriel';
}

export const ESPR_TEXTILE_TIMELINE: readonly RegulatoryMilestone[] = [
    { date: '2026-07-19', label: 'Ouverture du registre central DPP européen', scope: 'EU' },
    { date: '2027-Q4', label: "Adoption de l'acte délégué textile ESPR", scope: 'Sectoriel' },
    { date: '2028-H2', label: 'Application effective DPP textile (TPE incluses)', scope: 'EU' },
];

export function isEsprWindowActive(now: Date): boolean {
    return now.getFullYear() < 2028;
}
