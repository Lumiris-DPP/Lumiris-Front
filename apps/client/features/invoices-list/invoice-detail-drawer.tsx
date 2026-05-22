'use client';

import Link from 'next/link';
import { ExternalLink, FileText, RefreshCcw } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { DetailDrawer } from '@lumiris/ui/components/detail-drawer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { type InvoiceView, usePassportsLinkedTo } from '@/lib/invoices-store';
import { formatDateFr, formatEur } from '@/lib/list-helpers';
import { useRescan } from './rescan-action';

interface Props {
    invoice: InvoiceView | null;
    artisanId: string;
    onClose: () => void;
}

export function InvoiceDetailDrawer({ invoice, artisanId, onClose }: Props) {
    if (!invoice) {
        return <DetailDrawer open={false} onOpenChange={onClose} title="" />;
    }
    return <DrawerBody invoice={invoice} artisanId={artisanId} onClose={onClose} />;
}

function DrawerBody({ invoice, artisanId, onClose }: { invoice: InvoiceView; artisanId: string; onClose: () => void }) {
    const linked = usePassportsLinkedTo(invoice.id, artisanId);
    const rescan = useRescan();

    return (
        <DetailDrawer
            open
            onOpenChange={(o) => !o && onClose()}
            title={invoice.supplierName}
            subtitle={`${formatDateFr(invoice.issuedAt)} · ${formatEur(invoice.totalAmount)}`}
            width="lg"
            tabs={[
                { value: 'detail', label: 'Détail', content: <DetailTab invoice={invoice} /> },
                {
                    value: 'passports',
                    label: `Passeports (${linked.length})`,
                    content: <LinkedPassportsTab linked={linked} />,
                },
                {
                    value: 'ocr',
                    label: 'Brut OCR',
                    content: <OcrTab invoice={invoice} onRescan={() => rescan(invoice)} />,
                },
            ]}
        />
    );
}

function DetailTab({ invoice }: { invoice: InvoiceView }) {
    const rows = [
        { label: 'Référence', value: invoice.id, mono: true },
        { label: 'Fournisseur', value: invoice.supplierName },
        { label: 'Émise le', value: formatDateFr(invoice.issuedAt) },
        { label: 'Ajoutée le', value: formatDateFr(invoice.addedAt) },
        { label: 'Total HT', value: formatEur(invoice.totalAmount), mono: true },
    ];
    return (
        <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
                {rows.map((row) => (
                    <div key={row.label} className="flex flex-col gap-0.5">
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">{row.label}</span>
                        <span className={row.mono ? 'text-foreground font-mono text-xs' : 'text-foreground'}>
                            {row.value}
                        </span>
                    </div>
                ))}
            </div>
            <DocumentPreview invoice={invoice} />
            {invoice.notes ? (
                <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Notes</p>
                    <p className="text-foreground mt-1 whitespace-pre-wrap text-sm">{invoice.notes}</p>
                </div>
            ) : null}
        </div>
    );
}

function DocumentPreview({ invoice }: { invoice: InvoiceView }) {
    const src = invoice.fileDataUri || invoice.fileUrl;
    if (!src) return null;
    const isImage = src.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|avif)$/i.test(src);
    return (
        <div className="border-border bg-muted/40 rounded-lg border p-3">
            {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={`Facture ${invoice.id}`} className="max-h-60 w-full rounded-md object-contain" />
            ) : (
                <div className="flex items-center gap-3">
                    <FileText className="text-muted-foreground h-7 w-7 shrink-0" />
                    <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lumiris-emerald inline-flex items-center gap-1 text-sm hover:underline"
                    >
                        Ouvrir le document <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
            )}
        </div>
    );
}

function LinkedPassportsTab({ linked }: { linked: ReadonlyArray<{ id: string; reference: string; status: string }> }) {
    if (linked.length === 0) {
        return <p className="text-muted-foreground text-sm">Aucun passeport rattaché à cette facture.</p>;
    }
    return (
        <div className="space-y-2">
            {linked.map((p) => (
                <Link
                    key={p.id}
                    href={`/passports/${p.id}`}
                    className="border-border bg-card hover:bg-muted/40 flex items-center justify-between rounded-lg border p-3 transition-colors"
                >
                    <div className="min-w-0">
                        <p className="text-foreground truncate text-sm font-medium">{p.reference}</p>
                        <p className="text-muted-foreground font-mono text-xs">{p.id}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                        {p.status}
                    </Badge>
                </Link>
            ))}
        </div>
    );
}

function OcrTab({ invoice, onRescan }: { invoice: InvoiceView; onRescan: () => void }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs">Champs extraits par l’OCR — lecture seule.</p>
                {invoice.isLocal ? (
                    <Button size="sm" variant="outline" onClick={onRescan}>
                        <RefreshCcw className="mr-1.5 h-3.5 w-3.5" /> Re-scanner
                    </Button>
                ) : null}
            </div>
            {invoice.fibers.length === 0 ? (
                <p className="text-muted-foreground border-border bg-muted/30 rounded-md border p-3 text-sm">
                    Aucune fibre extraite.
                </p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fibre</TableHead>
                            <TableHead>Libellé</TableHead>
                            <TableHead className="text-right">Part</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoice.fibers.map((f, i) => (
                            <TableRow key={i}>
                                <TableCell className="capitalize">{f.fiber}</TableCell>
                                <TableCell className="text-muted-foreground text-xs">{f.label ?? '—'}</TableCell>
                                <TableCell className="text-right font-mono text-xs">{f.pct}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
