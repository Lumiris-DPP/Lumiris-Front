'use client';

import { Suspense, memo, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ShieldAlert } from 'lucide-react';
import { mockVisionUsers, type MockVisionUser } from '@lumiris/mock-data';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@lumiris/ui/components/alert-dialog';
import { Avatar, AvatarFallback } from '@lumiris/ui/components/avatar';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Sheet, SheetContent } from '@lumiris/ui/components/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import { useAdminAuditLog, useLogAction } from '@/lib/auth';
import { NonNegotiableBanner } from '../_shared/non-negotiable-banner';
import { DetailBody } from './detail-body';
import {
    RGPD_STATUS_OPTIONS,
    SEGMENT_KEYS,
    SEGMENT_META,
    TIER_OPTIONS,
    computeTierKpis,
    getRgpdStatus,
    getSegments,
    type RgpdStatusFilter,
    type SegmentKey,
    type TierFilter,
    type TierKpis,
} from './segments';

const RGPD_FILTER_LABEL: Record<RgpdStatusFilter, string> = {
    all: 'RGPD : tous',
    none: 'Aucune demande',
    requested: 'Export demandé',
    pending_deletion: 'Suppression en cours',
    completed: 'Traitée',
};

const RGPD_ROW_LABEL: Record<'requested' | 'pending_deletion' | 'completed', string> = {
    requested: 'Export demandé',
    pending_deletion: 'Suppression en cours',
    completed: 'Traitée',
};

const SCORING_NOW = new Date('2026-04-30T08:00:00Z');

function VisionUsersComponent() {
    return (
        <div className="space-y-5">
            <Header />
            <NonNegotiableBanner rule="Le contenu des documents joints (factures, garanties, assurances) est chiffré côté utilisateur. L'admin ne voit jamais le contenu, uniquement les métadonnées." />
            <NonNegotiableBanner rule="Toute action RGPD (export, suppression) est audit-loguée et irréversible après confirmation." />
            <KpiPanel />
            <Suspense fallback={null}>
                <UserList />
            </Suspense>
        </div>
    );
}

function Header() {
    return (
        <div>
            <h2 className="text-foreground text-xl font-semibold">Utilisateurs VISION</h2>
            <p className="text-muted-foreground mt-1 text-sm">
                Deux paliers — sans compte (ARPU 2 €/an) et avec compte (ARPU 3,80 €/an). Anonymes jamais listés
                individuellement. Liste détaillée gated sur <code className="font-mono">vision_user.read</code>.
            </p>
        </div>
    );
}

function KpiPanel() {
    const kpis = useMemo(() => computeTierKpis(mockVisionUsers, SCORING_NOW), []);

    return (
        <div className="grid gap-3 lg:grid-cols-2">
            <TierCard
                title="Sans compte"
                accent="text-lumiris-cyan"
                kpi={kpis.anon}
                hint="Iris Scanner pré-auth, monétisation indirecte via affiliation."
            />
            <TierCard
                title="Avec compte"
                accent="text-lumiris-emerald"
                kpi={kpis.account}
                hint="Garde-Robe complète + documents joints chiffrés."
            />
        </div>
    );
}

function TierCard({ title, accent, kpi, hint }: { title: string; accent: string; kpi: TierKpis; hint: string }) {
    return (
        <div className="border-border bg-card rounded-xl border p-4">
            <div className="flex items-baseline justify-between">
                <p className="text-muted-foreground text-[11px] uppercase tracking-wider">{title}</p>
                <p className={cn('font-mono text-3xl font-bold', accent)}>{kpi.count}</p>
            </div>
            <p className="text-muted-foreground/70 mt-0.5 text-[11px]">{hint}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
                {kpi.tiles.map((t) => (
                    <Tile key={t.label} label={t.label} value={t.value} />
                ))}
            </div>
        </div>
    );
}

function Tile({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-muted/30 flex flex-col rounded-md px-2 py-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</span>
            <span className="text-foreground mt-0.5 font-mono text-sm font-semibold">{value}</span>
        </div>
    );
}

const MIN_READ_REASON = 12;

function UserList() {
    const searchParams = useSearchParams();
    const auditLog = useAdminAuditLog();
    const log = useLogAction();

    const [search, setSearch] = useState('');
    const [segmentFilter, setSegmentFilter] = useState<SegmentKey | 'all'>('all');
    const [tierFilter, setTierFilter] = useState<TierFilter>('with_account');
    const [affiliationFilter, setAffiliationFilter] = useState<'all' | 'yes' | 'no'>('all');
    const [rgpdFilter, setRgpdFilter] = useState<RgpdStatusFilter>('all');

    const [selected, setSelected] = useState<MockVisionUser | null>(null);
    const [pendingUser, setPendingUser] = useState<MockVisionUser | null>(null);
    const [reasonModalOpen, setReasonModalOpen] = useState(false);
    const [readReason, setReadReason] = useState('');
    const [statusAnnouncement, setStatusAnnouncement] = useState('');

    // Deep-link via ?id=VIS-XXX — only resolves account users, anonymes restent masqués.
    const deepLinkId = searchParams.get('id');
    useEffect(() => {
        if (!deepLinkId) return;
        const target = mockVisionUsers.find((u) => u.id === deepLinkId && !u.anon);
        if (target) setSelected(target);
    }, [deepLinkId]);

    const accountUsers = useMemo(() => mockVisionUsers.filter((u) => !u.anon), []);

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return accountUsers.filter((u) => {
            if (tierFilter === 'anonymous') return false; // anonymes ne sont jamais listés individuellement
            if (
                needle.length > 0 &&
                !(
                    u.email?.toLowerCase().includes(needle) ||
                    u.name?.toLowerCase().includes(needle) ||
                    u.id.toLowerCase().includes(needle)
                )
            )
                return false;
            if (affiliationFilter === 'yes' && !u.consentAffiliation) return false;
            if (affiliationFilter === 'no' && u.consentAffiliation) return false;
            const status = getRgpdStatus(u);
            if (rgpdFilter !== 'all' && status !== rgpdFilter) return false;
            if (segmentFilter !== 'all') {
                const segs = getSegments(u, SCORING_NOW);
                if (!segs.includes(segmentFilter)) return false;
            }
            return true;
        });
    }, [accountUsers, search, segmentFilter, tierFilter, affiliationFilter, rgpdFilter]);

    const requestRead = (user: MockVisionUser) => {
        setPendingUser(user);
        setReasonModalOpen(true);
    };

    const confirmRead = () => {
        if (!pendingUser || readReason.trim().length < MIN_READ_REASON) return;
        const entry = log({
            action: 'vision_user.read',
            targetType: 'vision_user',
            targetId: pendingUser.id,
            payload: { reason: readReason.trim() },
        });
        setStatusAnnouncement(`Ouverture fiche utilisateur enregistrée — audit log ${entry.id} créé.`);
        setSelected(pendingUser);
        setPendingUser(null);
        setReadReason('');
        setReasonModalOpen(false);
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
        <div className="space-y-3">
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {statusAnnouncement}
            </div>
            <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3">
                <div className="relative min-w-56 flex-1">
                    <Search
                        className="text-muted-foreground/60 absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                        aria-hidden
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Email, prénom, ID…"
                        className="pl-8"
                        aria-label="Filtrer par email, prénom ou identifiant"
                    />
                </div>

                <FilterSelect
                    label="Segment"
                    value={segmentFilter}
                    onChange={(v) => setSegmentFilter(v as SegmentKey | 'all')}
                    options={[
                        { value: 'all', label: 'Tous segments' },
                        ...SEGMENT_KEYS.map((k) => ({ value: k, label: SEGMENT_META[k].label })),
                    ]}
                />
                <FilterSelect
                    label="Palier"
                    value={tierFilter}
                    onChange={(v) => setTierFilter(v as TierFilter)}
                    options={TIER_OPTIONS.map((t) => ({
                        value: t,
                        label:
                            t === 'all'
                                ? 'Tous paliers'
                                : t === 'with_account'
                                  ? 'Avec compte'
                                  : 'Sans compte (masqué)',
                    }))}
                />
                <FilterSelect
                    label="Affiliation"
                    value={affiliationFilter}
                    onChange={(v) => setAffiliationFilter(v as 'all' | 'yes' | 'no')}
                    options={[
                        { value: 'all', label: 'Affiliation : tous' },
                        { value: 'yes', label: 'Consent OUI' },
                        { value: 'no', label: 'Consent NON' },
                    ]}
                />
                <FilterSelect
                    label="RGPD"
                    value={rgpdFilter}
                    onChange={(v) => setRgpdFilter(v as RgpdStatusFilter)}
                    options={RGPD_STATUS_OPTIONS.map((s) => ({
                        value: s,
                        label: RGPD_FILTER_LABEL[s],
                    }))}
                />
            </div>

            <div className="border-border bg-card overflow-hidden rounded-xl border">
                <Table>
                    <TableHeader stickyHeader>
                        <TableRow>
                            <TableHead>Utilisateur</TableHead>
                            <TableHead>Inscription</TableHead>
                            <TableHead>Garde-Robe</TableHead>
                            <TableHead>Segments</TableHead>
                            <TableHead>Consentements</TableHead>
                            <TableHead>RGPD</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-muted-foreground py-6 text-center text-xs">
                                    <div className="flex flex-col items-center gap-2">
                                        <p>Aucun utilisateur ne correspond à ces filtres.</p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setSearch('');
                                                setSegmentFilter('all');
                                                setTierFilter('with_account');
                                                setAffiliationFilter('all');
                                                setRgpdFilter('all');
                                            }}
                                            className="gap-1.5"
                                        >
                                            <Search className="h-3.5 w-3.5" aria-hidden /> Réinitialiser les filtres
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((user) => (
                                <UserRow key={user.id} user={user} onOpen={() => requestRead(user)} />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <UserDetail
                user={selected}
                onClose={() => setSelected(null)}
                lastAccessAt={selected ? lastAccessByUser.get(selected.id) : undefined}
            />

            <AlertDialog
                open={reasonModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingUser(null);
                        setReadReason('');
                    }
                    setReasonModalOpen(open);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Justification d&apos;accès</AlertDialogTitle>
                        <AlertDialogDescription>
                            L&apos;ouverture d&apos;une fiche user est tracée avec le motif. Précisez pourquoi vous
                            accédez aux données personnelles de <strong>{maskEmail(pendingUser?.email)}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        value={readReason}
                        onChange={(e) => setReadReason(e.target.value)}
                        placeholder="Exemple : demande support · ticket #4231"
                        className="min-h-20"
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRead} disabled={readReason.trim().length < MIN_READ_REASON}>
                            Justifier et ouvrir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function UserRow({ user, onOpen }: { user: MockVisionUser; onOpen: () => void }) {
    const segments = useMemo(() => getSegments(user, SCORING_NOW), [user]);
    const rgpd = useMemo(() => getRgpdStatus(user), [user]);
    const wardrobe = user.wardrobePassportIds.length;

    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px]">
                            {user.name?.slice(0, 2).toUpperCase() ?? 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-foreground text-xs">{maskEmail(user.email)}</p>
                        <p className="text-muted-foreground text-[10px]">
                            {user.name ?? '-'} · {user.city ?? '-'}
                        </p>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <span className="font-mono text-[11px]">{fmt(user.createdAt)}</span>
            </TableCell>
            <TableCell>
                <span className="font-mono text-xs">{wardrobe}</span>
            </TableCell>
            <TableCell>
                {segments.length === 0 ? (
                    <span className="text-muted-foreground/50 font-mono text-[10px]">-</span>
                ) : (
                    <div className="flex flex-wrap gap-1">
                        {segments.map((s) => {
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
                    </div>
                )}
            </TableCell>
            <TableCell>
                <div className="flex flex-wrap gap-1">
                    {user.consentAffiliation ? (
                        <Badge
                            variant="outline"
                            className="border-lumiris-emerald/40 text-lumiris-emerald font-mono text-[10px]"
                        >
                            affil
                        </Badge>
                    ) : null}
                    {user.consentNewsletter ? (
                        <Badge
                            variant="outline"
                            className="border-lumiris-cyan/40 text-lumiris-cyan font-mono text-[10px]"
                        >
                            news
                        </Badge>
                    ) : null}
                </div>
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

function RgpdRowBadge({ status }: { status: ReturnType<typeof getRgpdStatus> }) {
    if (status === 'none') {
        return <span className="text-muted-foreground/50 font-mono text-[10px]">-</span>;
    }
    const map: Record<Exclude<typeof status, 'none'>, { label: string; tone: string; Icon?: typeof ShieldAlert }> = {
        requested: {
            label: RGPD_ROW_LABEL.requested,
            tone: 'border-lumiris-amber/40 text-lumiris-amber',
        },
        pending_deletion: {
            label: RGPD_ROW_LABEL.pending_deletion,
            tone: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose',
            Icon: ShieldAlert,
        },
        completed: {
            label: RGPD_ROW_LABEL.completed,
            tone: 'border-lumiris-emerald/40 text-lumiris-emerald',
        },
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

function FilterSelect<T extends string>({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: T;
    onChange: (next: T) => void;
    options: ReadonlyArray<{ value: T; label: string }>;
}) {
    return (
        <Select value={value} onValueChange={(v) => onChange(v as T)}>
            <SelectTrigger className="h-9 w-auto min-w-40 text-xs" aria-label={label}>
                <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent>
                {options.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                        {o.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function UserDetail({
    user,
    onClose,
    lastAccessAt,
}: {
    user: MockVisionUser | null;
    onClose: () => void;
    lastAccessAt?: string | undefined;
}) {
    return (
        <Sheet open={user !== null} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="bg-background w-full overflow-hidden p-0 sm:max-w-2xl">
                {user ? <DetailBody user={user} onClose={onClose} lastAccessAt={lastAccessAt} /> : null}
            </SheetContent>
        </Sheet>
    );
}

function maskEmail(email?: string): string {
    if (!email) return '-';
    const [user, domain] = email.split('@');
    if (!user || !domain) return email;
    const masked = user.length <= 2 ? `${user[0]}*` : `${user[0]}***${user[user.length - 1]}`;
    return `${masked}@${domain}`;
}

function fmt(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export const VisionUsers = memo(VisionUsersComponent);
