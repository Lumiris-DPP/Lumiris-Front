'use client';

import { Eye, MoreHorizontal, RefreshCcw, Trash2 } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@lumiris/ui/components/dropdown-menu';
import { TableCell, TableRow } from '@lumiris/ui/components/table';
import { formatDateFr, formatEur } from '@lumiris/utils';
import type { InvoiceView } from '@/lib/invoices-store';
import { INVOICE_BADGE_TONE, INVOICE_STATUS_LABELS } from './invoice-status';

interface Props {
    invoice: InvoiceView;
    onView: () => void;
    onRescan: () => void;
    onDelete: () => void;
}

export function InvoiceRow({ invoice, onView, onRescan, onDelete }: Props) {
    return (
        <TableRow className="cursor-pointer" onClick={onView}>
            <TableCell>
                <div className="flex flex-col">
                    <span className="text-foreground text-sm">{invoice.supplierName}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">{invoice.id}</span>
                </div>
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">{formatDateFr(invoice.issuedAt)}</TableCell>
            <TableCell className="text-foreground text-xs font-medium">{formatEur(invoice.totalAmount)}</TableCell>
            <TableCell>
                <Badge variant="outline" className={INVOICE_BADGE_TONE[invoice.status]}>
                    {INVOICE_STATUS_LABELS[invoice.status]}
                </Badge>
            </TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" aria-label="Actions">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={onView}>
                            <Eye className="mr-2 h-4 w-4" /> Voir le détail
                        </DropdownMenuItem>
                        {invoice.isLocal ? (
                            <DropdownMenuItem onSelect={onRescan}>
                                <RefreshCcw className="mr-2 h-4 w-4" /> Re-scanner
                            </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            disabled={!invoice.isLocal}
                            onSelect={() => invoice.isLocal && onDelete()}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}
