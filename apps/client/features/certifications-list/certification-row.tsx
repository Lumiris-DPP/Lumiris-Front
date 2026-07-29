'use client';

import { Clock, Eye, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';
import { getEffectiveStatus } from '@lumiris/types';
import { AtelierStatusBadge } from '@lumiris/scoring-ui';
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
import { formatDateFr } from '@lumiris/utils';
import { isMockCertificate, type ArtisanCertificate } from '@/lib/certificates-store';
import { certLabel, isExpiringSoon } from './certification-status';

interface Props {
    cert: ArtisanCertificate;
    now: Date;
    onView: () => void;
    onRenew: () => void;
    onDelete: () => void;
}

export function CertificationRow({ cert, now, onView, onRenew, onDelete }: Props) {
    const status = getEffectiveStatus(cert, now);
    const expiringSoon = isExpiringSoon(cert, now);
    const isMock = isMockCertificate(cert.id);
    return (
        <TableRow className="cursor-pointer" onClick={onView}>
            <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                    <span>{certLabel(cert)}</span>
                    {isMock ? (
                        <Badge variant="outline" className="text-[10px] tracking-wide text-muted-foreground uppercase">
                            Démo
                        </Badge>
                    ) : null}
                </div>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{cert.issuer}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                    {formatDateFr(cert.expiresAt)}
                    {expiringSoon ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-lumiris-amber">
                            <Clock className="h-3 w-3" /> &lt; 90j
                        </span>
                    ) : null}
                </span>
            </TableCell>
            <TableCell>
                <AtelierStatusBadge status={status} />
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
                        <DropdownMenuItem onSelect={onRenew}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Renouveler
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            disabled={isMock}
                            onSelect={() => !isMock && onDelete()}
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
