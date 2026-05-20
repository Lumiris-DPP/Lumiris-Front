export interface SupplierRef {
    id: string;
    name: string;
    country: string;
    fibers: readonly string[];
}

export const mockSuppliers: readonly SupplierRef[] = [
    { id: 'sup-filature-bretagne', name: 'Filature de Bretagne', country: 'FR', fibers: ['linen'] },
    { id: 'sup-laine-arles', name: "Coopérative Laine d'Arles", country: 'FR', fibers: ['wool'] },
    { id: 'sup-soie-cevennes', name: 'Magnanerie des Cévennes', country: 'FR', fibers: ['silk'] },
    {
        id: 'sup-coton-bio-belgique',
        name: 'BioCotton BV - Gent',
        country: 'BE',
        fibers: ['cotton', 'recycled-polyester'],
    },
    { id: 'sup-chanvre-allier', name: "Chanvre de l'Allier", country: 'FR', fibers: ['hemp'] },
    { id: 'sup-cachemire-mongolie', name: 'Mongolian Cashmere Coop', country: 'MN', fibers: ['cashmere'] },
    { id: 'sup-laine-tarn', name: 'Filature du Tarn', country: 'FR', fibers: ['wool'] },
];
