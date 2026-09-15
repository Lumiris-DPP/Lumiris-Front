'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, SearchX } from 'lucide-react';
import type { RepairRequestResponse, RepairRequestStatus } from '@lumiris/api-client';
import { useRepairerRequests } from '@lumiris/api-client/react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card } from '@lumiris/ui/components/card';
import { DataTableFilters } from '@lumiris/ui/components/data-table-filters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { cn } from '@lumiris/ui/lib/cn';
import { formatDateFr } from '@lumiris/utils';

const STATUS_LABEL: Record<RepairRequestStatus, string> = {
    PENDING: 'Nouvelle demande',
    DRAFT: 'Devis envoyé',
    ACCEPTED: 'Accepté',
    REFUSED: 'Refusé',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminé',
};

const STATUS_TONE: Record<RepairRequestStatus, string> = {
    PENDING: 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber',
    DRAFT: 'border-border bg-muted text-muted-foreground',
    ACCEPTED: 'border-lumiris-cyan/40 bg-lumiris-cyan/10 text-lumiris-cyan',
    REFUSED: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose',
    IN_PROGRESS: 'border-lumiris-cyan/40 bg-lumiris-cyan/10 text-lumiris-cyan',
    COMPLETED: 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald',
};

const STATUS_ORDER: RepairRequestStatus[] = ['PENDING', 'DRAFT', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REFUSED'];

const HEAD_CLASS = 'h-11 text-[11px] font-medium tracking-wider text-muted-foreground uppercase';

function formatAmount(cents?: number): string {
    if (cents === undefined) return '—';
    return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function initials(name?: string): string {
    if (!name) return '?';
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join('');
}

type StatusFilter = 'all' | RepairRequestStatus;

export function RepairerPassports() {
    const router = useRouter();
    const { data: requests = [], isLoading } = useRepairerRequests();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const statusOptions = useMemo(() => {
        const count = (status: StatusFilter) =>
            status === 'all' ? requests.length : requests.filter((r) => r.status === status).length;
        return [
            { label: `Tous (${count('all')})`, value: 'all' },
            ...STATUS_ORDER.map((status) => ({ label: `${STATUS_LABEL[status]} (${count(status)})`, value: status })),
        ];
    }, [requests]);

    const rows = useMemo(() => {
        const term = search.trim().toLowerCase();
        const filtered = requests.filter((r) => {
            if (statusFilter !== 'all' && r.status !== statusFilter) return false;
            if (!term) return true;
            return (
                (r.dppProductName ?? '').toLowerCase().includes(term) ||
                (r.consumerName ?? '').toLowerCase().includes(term) ||
                r.dppPublicCode.toLowerCase().includes(term)
            );
        });
        return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }, [requests, search, statusFilter]);

    const reset = () => {
        setSearch('');
        setStatusFilter('all');
    };

    const open = (request: RepairRequestResponse) => router.push(`/passports/${request.dppFormId}`);

    if (isLoading) {
        return <p className="p-4 text-sm text-muted-foreground md:p-8">Chargement…</p>;
    }
    if (requests.length === 0) {
        return (
            <div className="p-4 md:p-8">
                <p className="text-sm text-muted-foreground">
                    Aucune demande d&apos;intervention pour l&apos;instant. Elles apparaîtront ici dès qu&apos;un client
                    VISION en enverra une depuis votre fiche.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 md:p-8">
            <DataTableFilters
                search={{ value: search, onChange: setSearch, placeholder: 'Rechercher par nom, client ou code' }}
                filters={[
                    {
                        label: 'Statut',
                        value: statusFilter,
                        onChange: (v) => setStatusFilter(v as StatusFilter),
                        options: statusOptions,
                    },
                ]}
                onReset={reset}
            />

            {rows.length === 0 ? (
                <Card className="items-center gap-3 px-6 py-14 text-center">
                    <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <SearchX className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-medium text-foreground">Aucune demande ne correspond</p>
                    <Button variant="outline" size="sm" onClick={reset}>
                        Réinitialiser les filtres
                    </Button>
                </Card>
            ) : (
                <Card className="gap-0 overflow-hidden py-0">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className={cn(HEAD_CLASS, 'pl-5')}>Passeport</TableHead>
                                <TableHead className={HEAD_CLASS}>Client</TableHead>
                                <TableHead className={HEAD_CLASS}>Devis</TableHead>
                                <TableHead className={HEAD_CLASS}>Statut</TableHead>
                                <TableHead className={HEAD_CLASS}>Reçu le</TableHead>
                                <TableHead className={cn(HEAD_CLASS, 'w-10 pr-5')}>
                                    <span className="sr-only">Ouvrir</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((request) => (
                                <TableRow
                                    key={request.id}
                                    role="link"
                                    tabIndex={0}
                                    aria-label={`Ouvrir le passeport ${request.dppProductName ?? 'sans nom'}`}
                                    onClick={() => open(request)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            open(request);
                                        }
                                    }}
                                    className="group cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                                >
                                    <TableCell className="py-3 pl-5">
                                        <div className="flex items-center gap-3">
                                            <span
                                                aria-hidden
                                                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-[11px] font-semibold tracking-wide text-muted-foreground"
                                            >
                                                {initials(request.dppProductName)}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-foreground">
                                                    {request.dppProductName ?? 'Passeport'}
                                                </p>
                                                <p className="truncate font-mono text-xs text-muted-foreground">
                                                    {request.dppPublicCode}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-sm text-muted-foreground">
                                        {request.consumerName ?? 'Client'}
                                    </TableCell>
                                    <TableCell className="py-3 text-sm text-muted-foreground">
                                        {formatAmount(request.quoteAmountCents)}
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] ${STATUS_TONE[request.status]}`}
                                        >
                                            {STATUS_LABEL[request.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-3 text-sm text-muted-foreground tabular-nums">
                                        {formatDateFr(request.createdAt)}
                                    </TableCell>
                                    <TableCell className="py-3 pr-5">
                                        <ChevronRight
                                            className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                                            aria-hidden
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="border-t border-border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground md:px-5">
                        {rows.length} demande{rows.length !== 1 ? 's' : ''} affichée{rows.length !== 1 ? 's' : ''}
                        {requests.length !== rows.length && ` sur ${requests.length}`}
                    </div>
                </Card>
            )}
        </div>
    );
}
