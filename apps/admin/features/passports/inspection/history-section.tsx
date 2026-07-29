'use client';

import { useMemo } from 'react';
import { History } from 'lucide-react';
import type { AdminAction, AdminAuditLogEntry } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { useAdminAuditLog } from '@/lib/auth';
import { PaginationBar } from '../../_shared/pagination-bar';
import { usePagination } from '../../_shared/use-pagination';

const PASSPORT_ACTIONS: ReadonlySet<AdminAction> = new Set<AdminAction>([
    'passport.curate',
    'passport.override',
    'passport.validate',
    'passport.flag',
    'passport.request_changes',
]);

const ACTION_LABEL: Partial<Record<AdminAction, string>> = {
    'passport.curate': 'Curation',
    'passport.override': 'Override grade',
    'passport.validate': 'Validation',
    'passport.flag': 'Signalement',
    'passport.request_changes': 'Demande de corrections',
    'artisan.contact': 'Suggestion artisan',
};

const ACTION_TONE: Partial<Record<AdminAction, string>> = {
    'passport.override': 'border-lumiris-rose/40 text-lumiris-rose',
    'passport.flag': 'border-lumiris-amber/40 text-lumiris-amber',
    'passport.request_changes': 'border-lumiris-amber/40 text-lumiris-amber',
    'passport.curate': 'border-lumiris-emerald/40 text-lumiris-emerald',
    'passport.validate': 'border-lumiris-emerald/40 text-lumiris-emerald',
    'artisan.contact': 'border-lumiris-cyan/40 text-lumiris-cyan',
};

interface HistorySectionProps {
    passportId: string;
}

export function HistorySection({ passportId }: HistorySectionProps) {
    const log = useAdminAuditLog();

    const entries = useMemo<readonly AdminAuditLogEntry[]>(() => {
        return log
            .filter((e) => {
                if (PASSPORT_ACTIONS.has(e.action) && e.targetId === passportId) return true;
                if (e.action === 'artisan.contact' && e.payload.passportId === passportId) return true;
                return false;
            })
            .slice()
            .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    }, [log, passportId]);

    const pagination = usePagination(entries, 20);

    return (
        <section className="space-y-4">
            <header className="flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
                    <History className="h-4 w-4 text-lumiris-cyan" /> Historique
                </h2>
                <p className="text-xs text-muted-foreground">
                    {entries.length} entrée{entries.length > 1 ? 's' : ''}
                </p>
            </header>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Avant → après</TableHead>
                            <TableHead>Raison</TableHead>
                            <TableHead>Auteur</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pagination.pageItems.map((e) => (
                            <TableRow key={e.id}>
                                <TableCell className="font-mono text-[11px]">{formatDate(e.ts)}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={ACTION_TONE[e.action] ?? ''}>
                                        {ACTION_LABEL[e.action] ?? e.action}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{formatGradeDelta(e)}</TableCell>
                                <TableCell className="text-[11px] text-muted-foreground">
                                    {formatReason(e) ?? '-'}
                                </TableCell>
                                <TableCell className="text-xs">
                                    <span className="text-foreground">{e.actorId}</span>
                                    <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                                        ({e.actorRole})
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                        {entries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                                    Aucun événement enregistré pour ce passeport.
                                </TableCell>
                            </TableRow>
                        ) : null}
                    </TableBody>
                </Table>
                {entries.length > pagination.pageSize ? (
                    <PaginationBar
                        page={pagination.page}
                        pageCount={pagination.pageCount}
                        pageSize={pagination.pageSize}
                        rangeStart={pagination.rangeStart}
                        rangeEnd={pagination.rangeEnd}
                        totalCount={entries.length}
                        onPageChange={pagination.setPage}
                    />
                ) : null}
            </div>
        </section>
    );
}

function formatDate(ts: string): string {
    return new Date(ts).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatGradeDelta(e: AdminAuditLogEntry): string {
    const from = e.payload.from ?? e.payload.fromGrade;
    const to = e.payload.to ?? e.payload.toGrade;
    if (typeof from === 'string' && typeof to === 'string') return `${from} → ${to}`;
    if (typeof e.payload.decision === 'string') return String(e.payload.decision);
    return '-';
}

function formatReason(e: AdminAuditLogEntry): string | null {
    const reason = e.payload.reason ?? e.payload.kind;
    return typeof reason === 'string' ? reason : null;
}
