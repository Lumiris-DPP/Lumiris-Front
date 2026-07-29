'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { mockVisionUsers, type MockVisionUser } from '@lumiris/mock-data';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@lumiris/ui/components/alert-dialog';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { DataTableFilters } from '@lumiris/ui/components/data-table-filters';
import { Label } from '@lumiris/ui/components/label';
import { Textarea } from '@lumiris/ui/components/textarea';
import { useAdminAuditLog, useLogAction } from '@/lib/auth';
import { SEGMENT_KEYS, SEGMENT_META, getSegments, type SegmentKey } from './segments';
import { UserDetailDrawer } from './user-detail-drawer';
import { UserTable } from './user-table';

const SCORING_NOW = new Date('2026-04-30T08:00:00Z');

export function UserList() {
    const searchParams = useSearchParams();
    const auditLog = useAdminAuditLog();
    const log = useLogAction();

    const [search, setSearch] = useState('');
    const [segmentFilter, setSegmentFilter] = useState<SegmentKey | 'all'>('all');

    const [selected, setSelected] = useState<MockVisionUser | null>(null);
    const [pendingUser, setPendingUser] = useState<MockVisionUser | null>(null);
    const [readReason, setReadReason] = useState('');
    const [readConfirmed, setReadConfirmed] = useState(false);
    const [announcement, setAnnouncement] = useState('');

    const deepLinkId = searchParams.get('id');
    useEffect(() => {
        if (!deepLinkId) return;
        const target = mockVisionUsers.find((u) => u.id === deepLinkId && !u.anon);
        if (target) setSelected(target);
    }, [deepLinkId]);

    const accountUsers = useMemo(() => mockVisionUsers.filter((u) => !u.anon), []);
    const anonCount = mockVisionUsers.length - accountUsers.length;

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return accountUsers.filter((u) => {
            if (
                needle.length > 0 &&
                !(
                    u.email?.toLowerCase().includes(needle) ||
                    u.name?.toLowerCase().includes(needle) ||
                    u.id.toLowerCase().includes(needle)
                )
            )
                return false;
            if (segmentFilter !== 'all' && !getSegments(u, SCORING_NOW).includes(segmentFilter)) return false;
            return true;
        });
    }, [accountUsers, search, segmentFilter]);

    const resetFilters = () => {
        setSearch('');
        setSegmentFilter('all');
    };

    const confirmRead = () => {
        if (!pendingUser || !readConfirmed) return;
        const entry = log({
            action: 'vision_user.read',
            targetType: 'vision_user',
            targetId: pendingUser.id,
            payload: { reason: readReason.trim() },
        });
        setAnnouncement(`Ouverture fiche enregistrée — audit log ${entry.id}.`);
        setSelected(pendingUser);
        setPendingUser(null);
        setReadReason('');
        setReadConfirmed(false);
    };

    const lastAccessByUser = useMemo(() => {
        const map = new Map<string, string>();
        for (const entry of auditLog) {
            if (entry.action !== 'vision_user.read') continue;
            const prev = map.get(entry.targetId);
            if (!prev || entry.ts > prev) map.set(entry.targetId, entry.ts);
        }
        return map;
    }, [auditLog]);

    return (
        <div className="space-y-4">
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {announcement}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                    <span>Avec compte</span>
                    <span className="font-mono font-semibold text-foreground">
                        {accountUsers.length.toLocaleString('fr-FR')}
                    </span>
                </span>
                <span aria-hidden className="text-muted-foreground/40">
                    ·
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span>Sans compte</span>
                    <span className="font-mono font-semibold text-foreground">{anonCount.toLocaleString('fr-FR')}</span>
                </span>
            </div>
            <DataTableFilters
                search={{ value: search, onChange: setSearch, placeholder: 'Email, prénom, ID…' }}
                filters={[
                    {
                        label: 'Segment',
                        value: segmentFilter,
                        onChange: (v) => setSegmentFilter(v as SegmentKey | 'all'),
                        options: [
                            { value: 'all', label: 'Tous segments' },
                            ...SEGMENT_KEYS.map((k) => ({ value: k, label: SEGMENT_META[k].label })),
                        ],
                    },
                ]}
                onReset={resetFilters}
            />

            <UserTable rows={filtered} onOpen={setPendingUser} onResetFilters={resetFilters} />

            <UserDetailDrawer
                user={selected}
                onClose={() => setSelected(null)}
                lastAccessAt={selected ? lastAccessByUser.get(selected.id) : undefined}
            />

            <AlertDialog
                open={pendingUser !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingUser(null);
                        setReadReason('');
                        setReadConfirmed(false);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Accès fiche utilisateur</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="space-y-3">
                        <Textarea
                            value={readReason}
                            onChange={(e) => setReadReason(e.target.value)}
                            placeholder="Motif d'accès"
                            className="min-h-20"
                            aria-label="Motif d'accès"
                        />
                        <div className="inline-flex items-center gap-2">
                            <Checkbox
                                id="vision-user-read-confirm"
                                checked={readConfirmed}
                                onCheckedChange={(v) => setReadConfirmed(Boolean(v))}
                            />
                            <Label
                                htmlFor="vision-user-read-confirm"
                                className="cursor-pointer text-xs text-foreground"
                            >
                                Je confirme — l&apos;accès est tracé
                            </Label>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRead} disabled={!readConfirmed}>
                            Ouvrir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
