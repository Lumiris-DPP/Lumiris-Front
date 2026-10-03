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

/** Met en majuscule la première lettre du libellé. */
export function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Traduit la catégorie de la pièce pour l’acheteur. */
export function marketplaceCategoryLabel(value: string): string {
    const slug = value.trim();
    return CATEGORY_LABEL_FR[slug.toLowerCase()] ?? capitalize(slug);
}
