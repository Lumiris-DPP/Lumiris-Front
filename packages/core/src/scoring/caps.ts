// plafond D : un champ ESPR/AGEC manquant force grade ≤ D, total brut conservé (cf. grade.ts)

import type { Passport } from '@lumiris/types';
import { AGEC_REQUIRED_FIELDS, ESPR_REQUIRED_FIELDS } from './constants';

interface CapDecision {
    capped: boolean;
    reason?: string;
    missingFields: readonly string[];
}

export function checkCaps(passport: Passport): CapDecision {
    const esprMissing = ESPR_REQUIRED_FIELDS.filter((f) => !f.isPresent(passport)).map((f) => f.path);
    const agecMissing = AGEC_REQUIRED_FIELDS.filter((f) => !f.isPresent(passport)).map((f) => f.path);

    if (esprMissing.length === 0 && agecMissing.length === 0) {
        return { capped: false, missingFields: [] };
    }

    const fragments: string[] = [];
    if (esprMissing.length > 0) {
        fragments.push(`champ ESPR manquant : ${esprMissing.join(', ')}`);
    }
    if (agecMissing.length > 0) {
        fragments.push(`champ AGEC manquant : ${agecMissing.join(', ')}`);
    }

    return {
        capped: true,
        reason: fragments.join(' · '),
        missingFields: [...esprMissing, ...agecMissing],
    };
}
