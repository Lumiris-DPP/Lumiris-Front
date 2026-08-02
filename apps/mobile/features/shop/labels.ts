const MATERIAL_LABEL: Record<string, string> = {
    wool: 'Laine',
    linen: 'Lin',
    cotton: 'Coton',
    silk: 'Soie',
    hemp: 'Chanvre',
    leather: 'Cuir',
    cashmere: 'Cachemire',
    'recycled-polyester': 'Polyester recyclé',
};

export function materialLabel(material: string): string {
    return MATERIAL_LABEL[material] ?? capitalize(material);
}

function capitalize(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
