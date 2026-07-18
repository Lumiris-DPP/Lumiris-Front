'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, X } from 'lucide-react';
import type { GarmentCategory } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';

const CATEGORIES: ReadonlyArray<{ value: GarmentCategory; label: string }> = [
    { value: 'top', label: 'Haut (t-shirt, pull, chemise…)' },
    { value: 'bottom', label: 'Bas (pantalon, jupe, short…)' },
    { value: 'dress', label: 'Robe / Combinaison' },
    { value: 'outerwear', label: 'Veste / Manteau' },
    { value: 'shoe', label: 'Chaussure' },
    { value: 'accessory', label: 'Accessoire' },
    { value: 'other', label: 'Autre' },
];

const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Unique'];

export function CategoryField({
    value,
    onChange,
}: {
    value: GarmentCategory | undefined;
    onChange: (value: GarmentCategory) => void;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor="category">
                Catégorie <span className="text-destructive">*</span>
            </Label>
            <Select value={value ?? ''} onValueChange={(v) => onChange(v as GarmentCategory)}>
                <SelectTrigger id="category">
                    <SelectValue placeholder="Sélectionner…" />
                </SelectTrigger>
                <SelectContent>
                    {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                            {c.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export function PhotoField({ value, onChange }: { value: File | null; onChange: (file: File | null) => void }) {
    const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    return (
        <div className="space-y-2 md:col-span-2">
            <Label>Photo principale</Label>
            <label className="border-border bg-muted/40 hover:bg-muted relative flex aspect-square w-full max-w-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors">
                {previewUrl ? (
                    <>
                        <Image
                            src={previewUrl}
                            alt="Visuel principal"
                            fill
                            sizes="(min-width: 768px) 50vw, 100vw"
                            unoptimized
                            className="rounded-xl object-contain"
                        />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onChange(null);
                            }}
                            className="bg-background/80 absolute right-2 top-2 rounded-full p-1"
                            aria-label="Supprimer la photo"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </>
                ) : (
                    <>
                        <ImagePlus className="text-muted-foreground mb-2 h-6 w-6" />
                        <p className="text-muted-foreground text-sm">Glissez ou cliquez pour ajouter une photo</p>
                    </>
                )}
                <input
                    type="file"
                    accept="image/*"
                    aria-label="Importer la photo principale du produit"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                />
            </label>
        </div>
    );
}

export function SizesField({ selected, onToggle }: { selected: readonly string[]; onToggle: (size: string) => void }) {
    return (
        <div className="space-y-2 md:col-span-2">
            <Label>Tailles disponibles</Label>
            <div className="flex flex-wrap gap-2">
                {SIZES.map((size) => {
                    const isSelected = selected.includes(size);
                    return (
                        <button
                            key={size}
                            type="button"
                            onClick={() => onToggle(size)}
                            className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                                isSelected
                                    ? 'bg-lumiris-emerald border-lumiris-emerald text-white'
                                    : 'border-border text-muted-foreground hover:border-lumiris-emerald'
                            }`}
                        >
                            {size}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function ColorsField({ colors, onChange }: { colors: readonly string[]; onChange: (colors: string[]) => void }) {
    const [input, setInput] = useState('');

    const add = () => {
        const trimmed = input.trim();
        if (trimmed && !colors.includes(trimmed)) {
            onChange([...colors, trimmed]);
        }
        setInput('');
    };

    return (
        <div className="space-y-2 md:col-span-2">
            <Label htmlFor="color-input">Couleurs</Label>
            <div className="flex gap-2">
                <Input
                    id="color-input"
                    value={input}
                    placeholder="Écru, Marine, Terracotta…"
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            add();
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={add}
                    className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 rounded-md px-3 text-sm text-white"
                >
                    Ajouter
                </button>
            </div>
            {colors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {colors.map((color) => (
                        <Badge key={color} variant="secondary" className="gap-1">
                            {color}
                            <button
                                type="button"
                                onClick={() => onChange(colors.filter((c) => c !== color))}
                                aria-label={`Supprimer ${color}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
