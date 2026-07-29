'use client';

import { useMemo } from 'react';
import { Heart, Mail, Search, ShieldAlert } from 'lucide-react';
import type { MockVisionUser } from '@lumiris/mock-data';
import { Avatar, AvatarFallback } from '@lumiris/ui/components/avatar';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@lumiris/ui/components/tooltip';
import { cn } from '@lumiris/ui/lib/cn';
import { PaginationBar } from '../_shared/pagination-bar';
import { usePagination } from '../_shared/use-pagination';
import { SEGMENT_META, getRgpdStatus, getSegments } from './segments';

const SCORING_NOW = new Date('2026-04-30T08:00:00Z');
const SEGMENT_VISIBLE_MAX = 2;

const RGPD_ROW_LABEL: Record<'requested' | 'pending_deletion' | 'completed', string> = {
    requested: 'Export demandé',
    pending_deletion: 'Suppression en cours',
    completed: 'Traitée',
};

interface UserTableProps {
    rows: readonly MockVisionUser[];
    onOpen: (user: MockVisionUser) => void;
    onResetFilters: () => void;
}

export function UserTable({ rows, onOpen, onResetFilters }: UserTableProps) {
    const pagination = usePagination(rows, 25);
    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
                <TableHeader stickyHeader>
                    <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Inscription</TableHead>
                        <TableHead>Garde-Robe</TableHead>
                        <TableHead>Consentements</TableHead>
                        <TableHead>RGPD</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                    <p>Aucun utilisateur ne correspond à ces filtres.</p>
                                    <Button size="sm" variant="outline" onClick={onResetFilters} className="gap-1.5">
                                        <Search className="h-3.5 w-3.5" aria-hidden /> Réinitialiser
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        pagination.pageItems.map((user) => (
                            <UserRow key={user.id} user={user} onOpen={() => onOpen(user)} />
                        ))
                    )}
                </TableBody>
            </Table>
            {rows.length > 0 ? (
                <PaginationBar
                    page={pagination.page}
                    pageCount={pagination.pageCount}
                    pageSize={pagination.pageSize}
                    rangeStart={pagination.rangeStart}
                    rangeEnd={pagination.rangeEnd}
                    totalCount={rows.length}
                    onPageChange={pagination.setPage}
                    label="utilisateurs"
                />
            ) : null}
        </div>
    );
}

function UserRow({ user, onOpen }: { user: MockVisionUser; onOpen: () => void }) {
    const segments = useMemo(() => getSegments(user, SCORING_NOW), [user]);
    const rgpd = useMemo(() => getRgpdStatus(user), [user]);
    const visibleSegments = segments.slice(0, SEGMENT_VISIBLE_MAX);
    const overflowSegments = segments.length - visibleSegments.length;

    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px]">
                            {user.name?.slice(0, 2).toUpperCase() ?? 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="text-xs text-foreground">{maskEmail(user.email)}</p>
                        <p className="text-[10px] text-muted-foreground">
                            {user.name ?? '-'} · {user.city ?? '-'}
                        </p>
                        {visibleSegments.length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1">
                                {visibleSegments.map((s) => {
                                    const meta = SEGMENT_META[s];
                                    return (
                                        <Badge
                                            key={s}
                                            variant="outline"
                                            className={cn('font-mono text-[10px]', meta.tone)}
                                            title={meta.hint}
                                        >
                                            {meta.label}
                                        </Badge>
                                    );
                                })}
                                {overflowSegments > 0 ? (
                                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                        +{overflowSegments}
                                    </Badge>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <span className="font-mono text-[11px]">{fmt(user.createdAt)}</span>
            </TableCell>
            <TableCell>
                <span className="font-mono text-xs">{user.wardrobePassportIds.length}</span>
            </TableCell>
            <TableCell>
                <ConsentIcons
                    affiliation={Boolean(user.consentAffiliation)}
                    newsletter={Boolean(user.consentNewsletter)}
                />
            </TableCell>
            <TableCell>
                <RgpdRowBadge status={rgpd} />
            </TableCell>
            <TableCell className="text-right">
                <Button size="sm" variant="ghost" onClick={onOpen} className="gap-1.5">
                    Ouvrir
                </Button>
            </TableCell>
        </TableRow>
    );
}

function ConsentIcons({ affiliation, newsletter }: { affiliation: boolean; newsletter: boolean }) {
    if (!affiliation && !newsletter) {
        return <span className="font-mono text-[10px] text-muted-foreground/50">-</span>;
    }
    return (
        <div className="flex items-center gap-2">
            {affiliation ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="text-lumiris-emerald" aria-label="Consent affiliation">
                            <Heart className="h-3.5 w-3.5 fill-current" aria-hidden />
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">Affiliation</TooltipContent>
                </Tooltip>
            ) : null}
            {newsletter ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="text-lumiris-cyan" aria-label="Consent newsletter">
                            <Mail className="h-3.5 w-3.5" aria-hidden />
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">Newsletter</TooltipContent>
                </Tooltip>
            ) : null}
        </div>
    );
}

function RgpdRowBadge({ status }: { status: ReturnType<typeof getRgpdStatus> }) {
    if (status === 'none') {
        return <span className="font-mono text-[10px] text-muted-foreground/50">-</span>;
    }
    const map: Record<Exclude<typeof status, 'none'>, { label: string; tone: string; Icon?: typeof ShieldAlert }> = {
        requested: { label: RGPD_ROW_LABEL.requested, tone: 'border-lumiris-amber/40 text-lumiris-amber' },
        pending_deletion: {
            label: RGPD_ROW_LABEL.pending_deletion,
            tone: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose',
            Icon: ShieldAlert,
        },
        completed: { label: RGPD_ROW_LABEL.completed, tone: 'border-lumiris-emerald/40 text-lumiris-emerald' },
    };
    const meta = map[status];
    const Icon = meta.Icon;
    return (
        <Badge variant="outline" className={cn('gap-1 font-mono text-[10px]', meta.tone)}>
            {Icon ? <Icon className="h-3 w-3" aria-hidden /> : null}
            {meta.label}
        </Badge>
    );
}

export function maskEmail(email?: string): string {
    if (!email) return '-';
    const [user, domain] = email.split('@');
    if (!user || !domain) return email;
    const masked = user.length <= 2 ? `${user[0]}*` : `${user[0]}***${user[user.length - 1]}`;
    return `${masked}@${domain}`;
}

function fmt(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
