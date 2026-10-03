export const MAX_INTEGER = 2_147_483_647;

/** Convertit un montant français complet en centimes sans arrondi ni repli. */
export function eurosToCents(raw: string): number | null {
    const match = /^(\d+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)(?:[,.](\d{1,2}))?$/.exec(raw.trim());
    if (!match?.[1]) return null;
    const cents = BigInt(match[1].replace(/[ \u00a0\u202f]/g, '')) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
    return cents <= BigInt(MAX_INTEGER) ? Number(cents) : null;
}

/** Valide un entier naturel dans la borne donnée sans arrondi. */
export function nonNegativeInteger(raw: string, maximum = MAX_INTEGER): number | null {
    const value = raw.trim();
    if (!/^\d+$/.test(value)) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) && number <= maximum ? number : null;
}

/** Exige un montant explicite et signale toute saisie invalide. */
export function requireEuros(raw: string, label: string): number {
    const value = eurosToCents(raw);
    if (value === null) throw new Error(`${label} : saisissez un montant positif ou nul avec au plus deux décimales.`);
    return value;
}

/** Exige un entier dans les bornes annoncées au formulaire. */
export function requireInteger(raw: string, label: string, maximum = MAX_INTEGER): number {
    const value = nonNegativeInteger(raw, maximum);
    if (value === null) throw new Error(`${label} : saisissez un entier entre 0 et ${maximum}.`);
    return value;
}
