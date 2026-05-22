'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import type { CertificationRef, Fiber, Material } from '@lumiris/types';
import { mockInvoices, mockSuppliers } from '@lumiris/mock-data';
import { COUNTRIES } from '@lumiris/utils';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';

const FIBERS: ReadonlyArray<{ value: Fiber; label: string }> = [
    { value: 'wool', label: 'Laine' },
    { value: 'linen', label: 'Lin' },
    { value: 'cotton', label: 'Coton' },
    { value: 'silk', label: 'Soie' },
    { value: 'hemp', label: 'Chanvre' },
    { value: 'cashmere', label: 'Cachemire' },
    { value: 'recycled-polyester', label: 'Polyester recyclé' },
    { value: 'other', label: 'Autre' },
];

interface FiberRowProps {
    row: Material;
    idx: number;
    availableCerts: readonly CertificationRef[];
    onChange: (patch: Partial<Material>) => void;
    onRemove: () => void;
}

export function FiberRow({ row, idx, availableCerts, onChange, onRemove }: FiberRowProps) {
    const linkedInvoices = mockInvoices.filter((i) => i.supplierId === row.supplierId);
    const supplierMatchesFiber = mockSuppliers.filter((s) => s.fibers.includes(row.fiber));

    return (
        <div className="border-border bg-muted/30 space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <p className="text-foreground text-sm font-medium">Fibre #{idx + 1}</p>
                <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Supprimer">
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                    <Label>Fibre</Label>
                    <Select value={row.fiber} onValueChange={(v) => onChange({ fiber: v as Fiber })}>
                        <SelectTrigger>
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
                </div>
                <div className="space-y-1.5">
                    <Label>Pourcentage</Label>
                    <div className="relative">
                        <Input
                            type="number"
                            min={0}
                            max={100}
                            value={row.percentage || ''}
                            onChange={(e) => onChange({ percentage: Number(e.target.value) || 0 })}
                        />
                        <span className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                            %
                        </span>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label>Fournisseur</Label>
                    <Select
                        value={row.supplierId || '__none'}
                        onValueChange={(v) => onChange({ supplierId: v === '__none' ? '' : v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Choisir…" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none">- Aucun</SelectItem>
                            {(supplierMatchesFiber.length > 0 ? supplierMatchesFiber : mockSuppliers).map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>Origine</Label>
                    <Select value={row.originCountry} onValueChange={(v) => onChange({ originCountry: v })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {COUNTRIES.map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                    {c.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Certifications fibre</Label>
                    <div className="bg-card space-y-1.5 rounded-md border p-2">
                        {availableCerts.length === 0 ? (
                            <p className="text-muted-foreground px-1 py-0.5 text-xs">
                                Aucun certificat d’atelier disponible — ajoutez-en depuis{' '}
                                <Link href="/certifications" className="text-foreground underline">
                                    Mes certifications
                                </Link>
                                .
                            </p>
                        ) : (
                            availableCerts.map((c) => {
                                const checked = row.certifications.some((rc) => rc.id === c.id);
                                const label = c.kind === 'CUSTOM' ? (c.customName ?? c.kind) : c.kind;
                                return (
                                    <label key={c.id} className="flex items-center gap-2 text-xs">
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={(v) => {
                                                const next = v
                                                    ? [...row.certifications, c]
                                                    : row.certifications.filter((rc) => rc.id !== c.id);
                                                onChange({ certifications: next });
                                            }}
                                        />
                                        <span className="text-foreground">{label}</span>
                                        <span className="text-muted-foreground truncate">- {c.scope ?? c.issuer}</span>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label>Facture liée (optionnel)</Label>
                    <Select
                        value={row.invoiceRef ?? '__none'}
                        onValueChange={(v) => onChange({ invoiceRef: v === '__none' ? undefined : v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Aucune" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none">- Aucune</SelectItem>
                            {linkedInvoices.map((i) => (
                                <SelectItem key={i.id} value={i.id}>
                                    {i.id} {i.ocrExtracted ? `· ${i.ocrExtracted.supplierName}` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {row.certifications.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                            {row.certifications.map((c) => (
                                <Badge key={c.id} variant="secondary" className="text-[10px]">
                                    {c.kind}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
