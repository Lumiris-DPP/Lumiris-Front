import type { IrisAxis } from './score';

export interface IrisPillarDefinition {
    id: IrisAxis;
    label: string;
    weight: number;
    description: string;
}

export const IRIS_PILLARS: readonly IrisPillarDefinition[] = [
    {
        id: 'transparency',
        label: 'Transparence',
        weight: 40,
        description: 'Exhaustivité du passeport : matières, étapes, lieu, prix, photos.',
    },
    {
        id: 'craftsmanship',
        label: 'Savoir-faire',
        weight: 25,
        description: "Preuves humaines : gestes, certifications métier, années d'atelier.",
    },
    {
        id: 'impact',
        label: 'Impact',
        weight: 25,
        description: 'Empreinte environnementale réelle : fibres, énergie, transport.',
    },
    {
        id: 'repairability',
        label: 'Réparabilité',
        weight: 10,
        description: 'Pièces détachées disponibles, doc de soin, garantie réelle.',
    },
] as const;
