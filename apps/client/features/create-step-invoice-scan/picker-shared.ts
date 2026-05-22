import type { Fiber } from '@lumiris/types';
import { mockSuppliers } from '@lumiris/mock-data';

export const FIBER_OPTIONS: ReadonlyArray<{ value: Fiber; label: string }> = [
    { value: 'wool', label: 'Laine' },
    { value: 'linen', label: 'Lin' },
    { value: 'cotton', label: 'Coton' },
    { value: 'silk', label: 'Soie' },
    { value: 'hemp', label: 'Chanvre' },
    { value: 'cashmere', label: 'Cachemire' },
    { value: 'recycled-polyester', label: 'Polyester recyclé' },
    { value: 'other', label: 'Autre' },
];

export function supplierLabel(id: string): string {
    return mockSuppliers.find((s) => s.id === id)?.name ?? id;
}
