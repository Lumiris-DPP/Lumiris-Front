export * from './listings';
export * from './cart-storage';
export * from './order-storage';
export * from './checkout';

export function formatEur(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(value);
}
