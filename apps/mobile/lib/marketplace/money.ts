// Formate un montant en centimes en euros français.
export function formatCents(cents: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

// Décrit la livraison offerte ou son montant.
export function shippingCostLabel(cents: number): string {
    return cents === 0 ? 'Offerte' : formatCents(cents);
}

// Décrit les échéances autorisées en répartissant tous les centimes.
export function installmentLabel(
    totalCents: number,
    options: { installmentsEnabled: boolean; installmentCount: number; installmentMinCents: number } | undefined,
): string | null {
    if (!options?.installmentsEnabled || options.installmentCount < 2) return null;
    if (totalCents < options.installmentMinCents) return null;

    const count = options.installmentCount;
    const base = Math.floor(totalCents / count);
    const remainder = totalCents - base * count;
    if (remainder === 0) return `ou ${count}× ${formatCents(base)}`;
    return `ou ${formatCents(base + remainder)} puis ${count - 1}× ${formatCents(base)}`;
}
