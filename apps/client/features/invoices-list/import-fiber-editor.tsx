'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import type { InvoiceFiberLine } from '@/lib/invoices-store';

interface Props {
    fibers: InvoiceFiberLine[];
    onChange: (next: InvoiceFiberLine[]) => void;
}

export function ImportFiberEditor({ fibers, onChange }: Props) {
    return (
        <div className="sm:col-span-2">
            <Label>Fibres détectées</Label>
            {fibers.length === 0 ? (
                <p className="mt-1 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                    Aucune fibre détectée. Lancez l’extraction pour pré-remplir.
                </p>
            ) : (
                <ul className="mt-1 divide-y rounded-md border border-border bg-card">
                    {fibers.map((f, i) => (
                        <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                            <span className="text-foreground capitalize">{f.fiber}</span>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={f.pct}
                                    onChange={(e) =>
                                        onChange(
                                            fibers.map((row, idx) =>
                                                idx === i ? { ...row, pct: Number(e.target.value) } : row,
                                            ),
                                        )
                                    }
                                    className="h-8 w-20"
                                />
                                <span className="text-xs text-muted-foreground">%</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onChange(fibers.filter((_, idx) => idx !== i))}
                                    aria-label="Retirer la fibre"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
