'use client';

import { Chip } from '@/components/chip';
import { colorOptionsOf, findVariant, sizeOptionsOf, type MarketplaceItem } from '@/lib/marketplace/product';
import type { VariantSelection } from '../models/purchase-state';

interface VariantPickerProps {
    item: MarketplaceItem;
    selection: VariantSelection;
    onChange: (next: VariantSelection) => void;
    onOpenSizeGuide?: () => void;
}

// Rien n'est rendu quand l'annonce n'a qu'une déclinaison sans libellé : une pièce unique s'affiche
// exactement comme avant les déclinaisons.
export function VariantPicker({ item, selection, onChange, onOpenSizeGuide }: VariantPickerProps) {
    const sizes = sizeOptionsOf(item);
    const colors = colorOptionsOf(item);
    if (sizes.length === 0 && colors.length === 0) return null;

    // Une combinaison inexistante est masquée plutôt qu'affichée désactivée ; une combinaison
    // épuisée reste visible et barrée, parce que savoir que sa taille est partie est une information.
    const sizeVariant = (size: string) => findVariant(item, size, colors.length > 0 ? selection.color : null);
    /** Résout la déclinaison de la couleur dans la taille choisie. */
    const colorVariant = (color: string) => findVariant(item, sizes.length > 0 ? selection.size : null, color);

    return (
        <div className="flex flex-col gap-4">
            {sizes.length > 0 ? (
                <fieldset className="flex flex-col gap-2">
                    <legend className="flex w-full items-center justify-between">
                        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Taille
                        </span>
                        {onOpenSizeGuide ? (
                            <button
                                type="button"
                                onClick={onOpenSizeGuide}
                                className="text-xs font-medium text-primary underline underline-offset-2"
                            >
                                Guide des tailles
                            </button>
                        ) : null}
                    </legend>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => {
                            const variant = sizeVariant(size);
                            if (selection.color && !variant) return null;
                            const soldOut = variant != null && variant.stock === 0;
                            return (
                                <Chip
                                    key={size}
                                    selected={selection.size === size}
                                    disabled={soldOut}
                                    onClick={() => onChange({ ...selection, size })}
                                >
                                    {size}
                                    {soldOut ? <SoldOutMention /> : null}
                                </Chip>
                            );
                        })}
                    </div>
                </fieldset>
            ) : null}

            {colors.length > 0 ? (
                <fieldset className="flex flex-col gap-2">
                    <legend className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Couleur
                    </legend>
                    <div className="flex flex-wrap gap-2">
                        {colors.map(({ label, hex }) => {
                            const variant = colorVariant(label);
                            if (selection.size && !variant) return null;
                            const soldOut = variant != null && variant.stock === 0;
                            return (
                                <Chip
                                    key={label}
                                    selected={selection.color === label}
                                    disabled={soldOut}
                                    showCheck={!hex}
                                    onClick={() => onChange({ ...selection, color: label })}
                                >
                                    {hex ? (
                                        <span
                                            aria-hidden
                                            className="h-3 w-3 rounded-full border border-border/60"
                                            style={{ backgroundColor: hex }}
                                        />
                                    ) : null}
                                    {label}
                                    {soldOut ? <SoldOutMention /> : null}
                                </Chip>
                            );
                        })}
                    </div>
                </fieldset>
            ) : null}
        </div>
    );
}

// Le barré ne se lit qu'à l'œil : le lecteur d'écran entend la rupture avec la taille ou la couleur.
function SoldOutMention() {
    return <span className="sr-only">, épuisée</span>;
}
