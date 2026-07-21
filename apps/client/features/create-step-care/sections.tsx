'use client';

import Image from 'next/image';
import { Plus, Trash2 } from 'lucide-react';
import type { CareInstructionCode, DppMaterial, Fiber } from '@lumiris/types';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';

const FIBERS: ReadonlyArray<{ value: Fiber; label: string }> = [
    { value: 'cotton', label: 'Coton' },
    { value: 'wool', label: 'Laine' },
    { value: 'linen', label: 'Lin' },
    { value: 'silk', label: 'Soie' },
    { value: 'hemp', label: 'Chanvre' },
    { value: 'cashmere', label: 'Cachemire' },
    { value: 'leather', label: 'Cuir' },
    { value: 'recycled-polyester', label: 'Polyester recyclé' },
    { value: 'other', label: 'Autre' },
];

const CARE_SYMBOLS: ReadonlyArray<{ code: CareInstructionCode; label: string; svgPath: string }> = [
    { code: 'wash-30', label: 'Lavage 30°', svgPath: '/ginetex/ginetex--30c-fine-wash.svg' },
    { code: 'wash-40', label: 'Lavage 40°', svgPath: '/ginetex/ginetex--40c-mild-wash.svg' },
    { code: 'wash-60', label: 'Lavage 60°', svgPath: '/ginetex/ginetex--60c-coloured-wash.svg' },
    { code: 'no-wash', label: 'Ne pas laver', svgPath: '/ginetex/ginetex--do-not-wash.svg' },
    { code: 'dry-clean', label: 'Nettoyage à sec', svgPath: '/ginetex/ginetex--dry-cleaning.svg' },
    { code: 'no-dry-clean', label: 'Pas de nettoyage à sec', svgPath: '/ginetex/ginetex--do-not-dry-clean.svg' },
    { code: 'tumble-dry', label: 'Sèche-linge autorisé', svgPath: '/ginetex/ginetex--tumble-drying.svg' },
    { code: 'no-tumble', label: 'Pas de sèche-linge', svgPath: '/ginetex/ginetex--tumble-drying-1.svg' },
    { code: 'iron-low', label: 'Repassage doux', svgPath: '/ginetex/ginetex--iron-at-low-temperature.svg' },
    { code: 'iron-med', label: 'Repassage moyen', svgPath: '/ginetex/ginetex--iron-at-moderate-temperature.svg' },
    { code: 'iron-high', label: 'Repassage fort', svgPath: '/ginetex/ginetex--hot-iron.svg' },
    { code: 'no-iron', label: 'Ne pas repasser', svgPath: '/ginetex/ginetex--do-not-iron.svg' },
];

interface CompositionSectionProps {
    materials: DppMaterial[];
    onAdd: () => void;
    onRemove: (index: number) => void;
    onUpdate: (index: number, patch: Partial<DppMaterial>) => void;
}

export function CompositionSection({ materials, onAdd, onRemove, onUpdate }: CompositionSectionProps) {
    const total = materials.reduce((sum, m) => sum + m.percentage, 0);

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Composition des fibres</Label>
                <span
                    className={`font-mono text-sm font-semibold ${total === 100 ? 'text-lumiris-emerald' : total > 100 ? 'text-destructive' : 'text-lumiris-amber'}`}
                >
                    {total}% / 100%
                </span>
            </div>

            <div className="space-y-2">
                {materials.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <Select value={m.fiber} onValueChange={(v) => onUpdate(i, { fiber: v as Fiber })}>
                            <SelectTrigger className="w-44">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FIBERS.map((f) => (
                                    <SelectItem key={f.value} value={f.value}>
                                        {f.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="relative w-24">
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                value={m.percentage || ''}
                                onChange={(e) => onUpdate(i, { percentage: Number(e.target.value) || 0 })}
                                className="pr-7"
                            />
                            <span className="text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 text-sm">
                                %
                            </span>
                        </div>
                        <Input
                            value={m.originCountry}
                            placeholder="Pays d'origine"
                            onChange={(e) => onUpdate(i, { originCountry: e.target.value })}
                            className="flex-1"
                        />
                        <button
                            type="button"
                            onClick={() => onRemove(i)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Supprimer cette fibre"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={onAdd}
                className="border-border text-muted-foreground hover:border-lumiris-cyan hover:text-lumiris-cyan flex items-center gap-1.5 rounded-md border border-dashed px-3 py-1.5 text-sm transition-colors"
            >
                <Plus className="h-3.5 w-3.5" /> Ajouter une fibre
            </button>
        </section>
    );
}

interface CareSymbolsSectionProps {
    care: CareInstructionCode[];
    onToggle: (code: CareInstructionCode) => void;
}

export function CareSymbolsSection({ care, onToggle }: CareSymbolsSectionProps) {
    return (
        <section className="space-y-3">
            <Label className="text-base font-semibold">Instructions d&apos;entretien (GINETEX)</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CARE_SYMBOLS.map((s) => {
                    const checked = care.includes(s.code);
                    return (
                        <button
                            key={s.code}
                            type="button"
                            onClick={() => onToggle(s.code)}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                checked
                                    ? 'bg-lumiris-cyan/10 border-lumiris-cyan text-lumiris-cyan'
                                    : 'border-border text-muted-foreground hover:border-lumiris-cyan/50'
                            }`}
                        >
                            <Image
                                src={s.svgPath}
                                alt=""
                                aria-hidden
                                width={24}
                                height={24}
                                className="h-6 w-6 shrink-0"
                            />
                            <span className="truncate">{s.label}</span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
