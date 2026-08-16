'use client';

import { Plus, X } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { cellKey, type SizeGuideDraft } from './product-payload';

interface SizeGuideEditorProps {
    sizes: readonly string[];
    value: SizeGuideDraft;
    onChange: (next: SizeGuideDraft) => void;
}

// Les lignes sont les tailles déclarées par les déclinaisons : les deux ne peuvent pas diverger, et
// le refus serveur d'une taille inconnue ne se déclenche jamais en pratique.
export function SizeGuideEditor({ sizes, value, onChange }: SizeGuideEditorProps) {
    if (sizes.length === 0) {
        return (
            <section className="grid gap-2">
                <Label className="text-xs">Guide des mesures</Label>
                <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                    Renseignez au moins une taille dans les déclinaisons pour saisir vos mesures.
                </p>
            </section>
        );
    }

    const setLabel = (index: number, label: string) =>
        onChange({ ...value, labels: value.labels.map((existing, i) => (i === index ? label : existing)) });

    const removeLabel = (index: number) => {
        const removed = value.labels[index];
        const values = { ...value.values };
        for (const size of sizes) delete values[cellKey(size, removed ?? '')];
        onChange({ labels: value.labels.filter((_, i) => i !== index), values });
    };

    const setCell = (size: string, label: string, cm: string) =>
        onChange({ ...value, values: { ...value.values, [cellKey(size, label)]: cm } });

    return (
        <section className="grid gap-2">
            <div className="flex items-baseline justify-between">
                <Label className="text-xs">Guide des mesures</Label>
                <p className="text-[11px] text-muted-foreground">En centimètres, pièce mesurée à plat.</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs">Taille</TableHead>
                            {value.labels.map((label, index) => (
                                <TableHead key={index} className="min-w-40 p-1.5">
                                    <div className="flex items-center gap-1">
                                        <Input
                                            aria-label={`Nom de la mesure ${index + 1}`}
                                            placeholder="Tour de poitrine"
                                            value={label}
                                            onChange={(e) => setLabel(index, e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Retirer cette mesure"
                                            onClick={() => removeLabel(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sizes.map((size) => (
                            <TableRow key={size}>
                                <TableCell className="text-sm font-medium">{size}</TableCell>
                                {value.labels.map((label, index) => (
                                    <TableCell key={index} className="p-1.5">
                                        <Input
                                            aria-label={`${label || 'Mesure'} pour la taille ${size}`}
                                            type="number"
                                            min={0}
                                            step="0.5"
                                            placeholder="cm"
                                            value={value.values[cellKey(size, label)] ?? ''}
                                            onChange={(e) => setCell(size, label, e.target.value)}
                                        />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange({ ...value, labels: [...value.labels, ''] })}
                >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Ajouter une mesure
                </Button>
            </div>

            <p className="text-[11px] text-muted-foreground">
                Ces mesures sont ce que l’acheteur compare à un vêtement qu’il possède déjà — c’est ce qui évite le
                retour.
            </p>
        </section>
    );
}
