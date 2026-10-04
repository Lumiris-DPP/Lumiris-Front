const CATEGORY_LABEL_FR: Record<string, string> = {
    jacket: 'Veste',
    coat: 'Manteau',
    sweater: 'Pull',
    shirt: 'Chemise',
    top: 'Haut',
    dress: 'Robe',
    skirt: 'Jupe',
    trouser: 'Pantalon',
    scarf: 'Écharpe',
    shoe: 'Chaussures',
    bag: 'Sac',
    hat: 'Chapeau',
    gloves: 'Gants',
    belt: 'Ceinture',
    accessory: 'Accessoire',
    other: 'Autre',
};

// Met la première lettre en majuscule.
export function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

// Renvoie le libellé français de la catégorie.
export function marketplaceCategoryLabel(value: string): string {
    const slug = value.trim();
    return CATEGORY_LABEL_FR[slug.toLowerCase()] ?? capitalize(slug);
}
