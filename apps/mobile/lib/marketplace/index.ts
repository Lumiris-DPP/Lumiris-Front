export * from './product';
export * from './cart-storage';
export * from './use-cart-details';

/**
 * Formatte un montant en CENTIMES vers un prix EUR (2 décimales). Source unique de formatage
 * des prix Boutique/panier/paiement : garantit que la carte, le bouton d'achat et l'écran de
 * paiement affichent exactement le même montant (ex. « 149,90 € » et non « 150 € »).
 */
export function formatCents(cents: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}
