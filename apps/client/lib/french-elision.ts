const ELIDES_AFTER_DE = /^[aàâäeéèêëiîïoôöuùûüh]/i;

export function elideDe(noun: string): string {
    const trimmed = noun.trim();
    return ELIDES_AFTER_DE.test(trimmed) ? `d'${trimmed}` : `de ${trimmed}`;
}
