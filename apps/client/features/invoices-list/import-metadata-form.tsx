'use client';

import { mockSuppliers } from '@lumiris/mock-data';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Textarea } from '@lumiris/ui/components/textarea';
import type { InvoiceFiberLine } from '@/lib/invoices-store';
import { ImportFiberEditor } from './import-fiber-editor';

export interface MetadataErrors {
    supplierId?: string;
    issuedAt?: string;
    totalAmount?: string;
    notes?: string;
}

interface Props {
    supplierId: string;
    onSupplierId: (v: string) => void;
    issuedAt: string;
    onIssuedAt: (v: string) => void;
    totalAmount: number;
    onTotalAmount: (v: number) => void;
    fibers: InvoiceFiberLine[];
    onFibers: (next: InvoiceFiberLine[]) => void;
    notes: string;
    onNotes: (v: string) => void;
    errors: MetadataErrors;
}

export function ImportMetadataForm(props: Props) {
    const { errors } = props;
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
                <Label htmlFor="inv-supplier">Fournisseur *</Label>
                <Select value={props.supplierId} onValueChange={props.onSupplierId}>
                    <SelectTrigger id="inv-supplier" className="w-full">
                        <SelectValue placeholder="Choisir un fournisseur" />
                    </SelectTrigger>
                    <SelectContent>
                        {mockSuppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                                {s.name} · {s.country}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.supplierId ? <p className="mt-1 text-xs text-destructive">{errors.supplierId}</p> : null}
            </div>

            <div>
                <Label htmlFor="inv-date">Date d’émission *</Label>
                <Input
                    id="inv-date"
                    type="date"
                    value={props.issuedAt}
                    onChange={(e) => props.onIssuedAt(e.target.value)}
                />
                {errors.issuedAt ? <p className="mt-1 text-xs text-destructive">{errors.issuedAt}</p> : null}
            </div>

            <div>
                <Label htmlFor="inv-amount">Total HT (EUR) *</Label>
                <Input
                    id="inv-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={Number.isFinite(props.totalAmount) ? props.totalAmount : ''}
                    onChange={(e) => props.onTotalAmount(Number(e.target.value))}
                />
                {errors.totalAmount ? <p className="mt-1 text-xs text-destructive">{errors.totalAmount}</p> : null}
            </div>

            <ImportFiberEditor fibers={props.fibers} onChange={props.onFibers} />

            <div className="sm:col-span-2">
                <Label htmlFor="inv-notes">Notes</Label>
                <Textarea
                    id="inv-notes"
                    placeholder="Référence interne, lot, particularités…"
                    value={props.notes}
                    onChange={(e) => props.onNotes(e.target.value)}
                    rows={3}
                />
            </div>
        </div>
    );
}
