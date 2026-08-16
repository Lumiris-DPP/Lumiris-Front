'use client';

import { useState } from 'react';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { newVariantRow, variantRowsError, type VariantRow } from './product-payload';

interface VariantsEditorProps {
    value: VariantRow[];
    onChange: (next: VariantRow[]) => void;
    sizeSuggestions?: readonly string[];
    colorSuggestions?: readonly string[];
}

export function VariantsEditor({ value, onChange, sizeSuggestions, colorSuggestions }: VariantsEditorProps) {
    const error = variantRowsError(value);

    const patch = (key: string, field: keyof VariantRow, fieldValue: string) =>
        onChange(value.map((row) => (row.key === key ? { ...row, [field]: fieldValue } : row)));

    const remove = (key: string) => onChange(value.filter((row) => row.key !== key));

    const generate = (sizes: string[], colors: string[]) => {
        const existing = new Set(
            value.map((row) => `${row.sizeLabel.trim().toLowerCase()} ${row.colorLabel.trim().toLowerCase()}`),
        );
        const added: VariantRow[] = [];
        for (const size of sizes) {
            for (const color of colors.length > 0 ? colors : ['']) {
                if (existing.has(`${size.toLowerCase()} ${color.toLowerCase()}`)) continue;
                added.push(newVariantRow(size, color));
            }
        }
        // Une grille générée remplace la ligne par défaut vide plutôt que de s'y ajouter.
        const kept = value.filter((row) => row.id || row.sizeLabel.trim() || row.colorLabel.trim());
        onChange([...kept, ...added]);
    };

    return (
        <section className="grid gap-2">
            <div className="flex items-baseline justify-between">
                <Label className="text-xs">Déclinaisons</Label>
                <p className="text-[11px] text-muted-foreground">
                    Une annonce, un passeport, plusieurs tailles — chacune avec son stock.
                </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs">Taille</TableHead>
                            <TableHead className="text-xs">Couleur</TableHead>
                            <TableHead className="text-xs">Teinte</TableHead>
                            <TableHead className="text-xs">Réf.</TableHead>
                            <TableHead className="text-xs">Stock</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {value.map((row) => (
                            <TableRow key={row.key}>
                                <TableCell className="p-1.5">
                                    <Input
                                        aria-label="Taille"
                                        placeholder="M"
                                        value={row.sizeLabel}
                                        onChange={(e) => patch(row.key, 'sizeLabel', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell className="p-1.5">
                                    <Input
                                        aria-label="Couleur"
                                        placeholder="Bleu nuit"
                                        value={row.colorLabel}
                                        onChange={(e) => patch(row.key, 'colorLabel', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell className="p-1.5">
                                    <Input
                                        aria-label="Teinte hexadécimale"
                                        placeholder="#1B3A5C"
                                        value={row.colorHex}
                                        onChange={(e) => patch(row.key, 'colorHex', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell className="p-1.5">
                                    <Input
                                        aria-label="Référence"
                                        value={row.sku}
                                        onChange={(e) => patch(row.key, 'sku', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell className="p-1.5">
                                    <Input
                                        aria-label="Stock"
                                        type="number"
                                        min={0}
                                        step="1"
                                        value={row.stock}
                                        onChange={(e) => patch(row.key, 'stock', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell className="p-1.5">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Retirer la déclinaison"
                                        disabled={value.length <= 1}
                                        onClick={() => remove(row.key)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, newVariantRow()])}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Ajouter une déclinaison
                </Button>
                <GridGenerator
                    sizeSuggestions={sizeSuggestions}
                    colorSuggestions={colorSuggestions}
                    onGenerate={generate}
                />
            </div>

            {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </section>
    );
}

// Quatre tailles et deux couleurs en un geste, au lieu de huit lignes saisies à la main — c'est le
// gain ergonomique qui remplace les quatre annonces séparées d'avant.
function GridGenerator({
    sizeSuggestions,
    colorSuggestions,
    onGenerate,
}: {
    sizeSuggestions?: readonly string[];
    colorSuggestions?: readonly string[];
    onGenerate: (sizes: string[], colors: string[]) => void;
}) {
    const [open, setOpen] = useState(false);
    const [sizes, setSizes] = useState(() => (sizeSuggestions ?? []).join(', '));
    const [colors, setColors] = useState(() => (colorSuggestions ?? []).join(', '));

    const parsed = (raw: string) =>
        raw
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean);

    if (!open) {
        return (
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
                <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                Générer la grille
            </Button>
        );
    }

    return (
        <div className="grid w-full gap-2 rounded-xl border border-border bg-muted/30 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-1.5">
                    <Label htmlFor="mp-gen-sizes" className="text-xs">
                        Tailles
                    </Label>
                    <Input
                        id="mp-gen-sizes"
                        placeholder="S, M, L, XL"
                        value={sizes}
                        onChange={(e) => setSizes(e.target.value)}
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="mp-gen-colors" className="text-xs">
                        Couleurs (optionnel)
                    </Label>
                    <Input
                        id="mp-gen-colors"
                        placeholder="Bleu nuit, Écru"
                        value={colors}
                        onChange={(e) => setColors(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    size="sm"
                    disabled={parsed(sizes).length === 0 && parsed(colors).length === 0}
                    onClick={() => {
                        onGenerate(parsed(sizes), parsed(colors));
                        setOpen(false);
                    }}
                >
                    Générer
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Annuler
                </Button>
            </div>
        </div>
    );
}
