export const MAX_INTEGER = 2_147_483_647;
export const MAX_PREPARATION_DAYS = 90;
export const MAX_WEIGHT_GRAMS = 30000;

// Convertit un montant valide en centimes sans arrondi flottant.
export function eurosToCents(raw: string): number | null {
    const match = /^(\d+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)(?:[,.](\d{1,2}))?$/.exec(raw.trim());
    if (!match?.[1]) return null;
    const cents = BigInt(match[1].replace(/[ \u00a0\u202f]/g, '')) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
    return cents <= BigInt(MAX_INTEGER) ? Number(cents) : null;
}

// Lit un entier positif ou nul dans les limites permises.
export function nonNegativeInteger(raw: string, maximum = MAX_INTEGER): number | null {
    const value = raw.trim();
    if (!/^\d+$/.test(value)) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) && number <= maximum ? number : null;
}

// Lit un montant en centimes ou signale une saisie invalide.
export function requireEuros(raw: string, label: string): number {
    const value = eurosToCents(raw);
    if (value === null) throw new Error(`${label} : saisissez un montant positif ou nul avec au plus deux décimales.`);
    return value;
}

// Lit un entier autorisé ou signale une saisie invalide.
export function requireInteger(raw: string, label: string, maximum = MAX_INTEGER): number {
    const value = nonNegativeInteger(raw, maximum);
    if (value === null) throw new Error(`${label} : saisissez un entier entre 0 et ${maximum}.`);
    return value;
}
