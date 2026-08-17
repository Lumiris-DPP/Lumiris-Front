export * from './product';
export * from './cart-storage';
export * from './use-cart-details';
export * from './shipping-address';

/**
 * Formatte un montant en CENTIMES vers un prix EUR (2 décimales). Source unique de formatage
 * des prix Boutique/panier/paiement : garantit que la carte, le bouton d'achat et l'écran de
 * paiement affichent exactement le même montant (ex. « 149,90 € » et non « 150 € »).
 */
export function formatCents(cents: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

/** Ligne « Livraison » d'un récapitulatif : le port offert se dit, il ne s'affiche pas « 0,00 € ». */
export function shippingCostLabel(cents: number): string {
    return cents === 0 ? 'Offerte' : formatCents(cents);
}
/**
 * Mention « ou 3× 99,97 € » du paiement fractionné. Stripe l'encaisse déjà via le Payment Element
 * et en porte le risque — Lumiris ne prête rien : cette fonction n'est qu'un affichage, et elle
 * n'affiche RIEN tant que le serveur ne le déclare pas activé ou que le montant est sous le seuil.
 *
 * Le fractionné se décide sur la fiche produit, pas au dernier écran du tunnel : c'est là que
 * l'acheteur regarde un prix à 300 € et renonce.
 */
export function installmentLabel(
    totalCents: number,
    options: { installmentsEnabled: boolean; installmentCount: number; installmentMinCents: number } | undefined,
): string | null {
    if (!options?.installmentsEnabled || options.installmentCount < 2) return null;
    if (totalCents < options.installmentMinCents) return null;
    // Le reliquat de la division part sur la première échéance : la somme des échéances annoncées
    // fait alors exactement le total. Un arrondi uniforme au centime supérieur le dépassait
    // (3× 66,34 € annoncés pour 199,00 € à payer).
    const count = options.installmentCount;
    const base = Math.floor(totalCents / count);
    const remainder = totalCents - base * count;
    if (remainder === 0) return `ou ${count}× ${formatCents(base)}`;
    return `ou ${formatCents(base + remainder)} puis ${count - 1}× ${formatCents(base)}`;
}
