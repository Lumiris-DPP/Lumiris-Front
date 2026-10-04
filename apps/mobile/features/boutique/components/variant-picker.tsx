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

    // Un axe incompatible libère l'autre sélection ; les ruptures restent visibles.
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
                            const soldOut = item.variants
                                .filter((v) => v.sizeLabel?.trim() === size)
                                .every((v) => v.stock === 0);
                            return (
                                <Chip
                                    key={size}
                                    selected={selection.size === size}
                                    disabled={soldOut}
                                    onClick={() =>
                                        onChange({
                                            size,
                                            color:
                                                selection.color && (!variant || variant.stock === 0)
                                                    ? null
                                                    : selection.color,
                                        })
                                    }
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
                            const soldOut = item.variants
                                .filter((v) => v.colorLabel?.trim() === label)
                                .every((v) => v.stock === 0);
                            return (
                                <Chip
                                    key={label}
                                    selected={selection.color === label}
                                    disabled={soldOut}
                                    showCheck={!hex}
                                    onClick={() =>
                                        onChange({
                                            size:
                                                selection.size && (!variant || variant.stock === 0)
                                                    ? null
                                                    : selection.size,
                                            color: label,
                                        })
                                    }
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
