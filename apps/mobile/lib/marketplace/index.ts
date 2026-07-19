export * from './product';
export * from './cart-storage';
export * from './use-cart-details';

export function formatEur(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(value);
}

/** Formatte un montant en CENTIMES vers un prix EUR (2 décimales — usage paiement/récap). */
export function formatCents(cents: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}
