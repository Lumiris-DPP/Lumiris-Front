'use client';

import { useMemo, useState } from 'react';
import { Shirt, ShieldAlert } from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import { mockArtisans, mockPassportById, mockRepairers, type MockVisionUser } from '@lumiris/mock-data';
import { Wardrobe, type WardrobeCardItem } from '@lumiris/scoring-ui';
import { Badge } from '@lumiris/ui/components/badge';
import { DetailDrawer } from '@lumiris/ui/components/detail-drawer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { cn } from '@lumiris/ui/lib/cn';
import { EmptyState } from '../_shared/empty-state';
import { RgpdDialog } from './rgpd-dialog';
import {
    DOCUMENT_TYPE_LABEL,
    ESPR_CATEGORIES,
    ESPR_CATEGORY_LABEL,
    SEGMENT_META,
    formatBytes,
    getAffiliationCommissionsEur,
    getCategoryBreakdown,
    getDocuments,
    getRgpdStatus,
    getScans30d,
    getSegments,
    totalWardrobeSize,
    type RgpdLocalStatus,
} from './segments';
import { maskEmail } from './user-table';

const SCORING_NOW = new Date('2026-04-30T08:00:00Z');

function fmt(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-[10px] tracking-wider text-muted-foreground uppercase">{label}</p>
            <div className="mt-0.5 text-foreground">{children}</div>
        </div>
    );
}

interface UserDetailDrawerProps {
    user: MockVisionUser | null;
    onClose: () => void;
    lastAccessAt?: string | undefined;
}

export function UserDetailDrawer({ user, onClose, lastAccessAt }: UserDetailDrawerProps) {
    const [rgpdStatus, setRgpdStatus] = useState<RgpdLocalStatus>(() => (user ? getRgpdStatus(user) : 'none'));

    if (!user) return null;

    const segments = getSegments(user, SCORING_NOW);
    const subtitle = lastAccessAt
        ? `${user.email ?? user.id} · dernier accès admin ${new Date(lastAccessAt).toLocaleString('fr-FR')}`
        : (user.email ?? user.id);

    return (
        <DetailDrawer
            open
            onOpenChange={(open) => !open && onClose()}
            title={user.name ?? maskEmail(user.email)}
            subtitle={subtitle}
            width="md"
            tabs={[
                {
                    value: 'identity',
                    label: 'Identité',
                    content: (
                        <div className="space-y-6">
                            <IdentityTab user={user} segments={segments} />
                            <DocumentsTab user={user} />
                        </div>
                    ),
                },
                { value: 'wardrobe', label: 'Garde-Robe', content: <WardrobeTab user={user} /> },
                {
                    value: 'rgpd',
                    label: 'RGPD',
                    content: <RgpdTab user={user} rgpdStatus={rgpdStatus} onStatusChange={setRgpdStatus} />,
                },
            ]}
        />
    );
}

function IdentityTab({
    user,
    segments,
}: {
    user: MockVisionUser;
    segments: ReadonlyArray<ReturnType<typeof getSegments>[number]>;
}) {
    const scans30d = getScans30d(user, SCORING_NOW);
    const wardrobeTotal = totalWardrobeSize(user);
    const affiliation = getAffiliationCommissionsEur(user);

    return (
        <div className="space-y-4 text-xs">
            <section className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-3">
                <Field label="Email">{user.email ?? '-'}</Field>
                <Field label="Prénom">{user.name ?? '-'}</Field>
                <Field label="Ville">{user.city ?? '-'}</Field>
                <Field label="Inscription">{fmt(user.createdAt)}</Field>
                <Field label="Dernière activité">{user.lastSeenAt ? fmt(user.lastSeenAt) : '-'}</Field>
                <Field label="Scans 30 j">
                    <span className="font-mono">{scans30d}</span>
                </Field>
                <Field label="Garde-Robe (total)">
                    <span className="font-mono">{wardrobeTotal}</span>
                </Field>
                <Field label="Commissions affiliation">
                    <span className="font-mono">{affiliation} €</span>
                </Field>
            </section>
            {segments.length > 0 ? (
                <section className="flex flex-wrap gap-2">
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
                </section>
            ) : null}
            <section className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3">
                <Field label="Consents">
                    <div className="mt-1 flex flex-wrap gap-1">
                        {user.consentNewsletter ? (
                            <Badge variant="outline" className="font-mono text-[10px]">
                                newsletter
                            </Badge>
                        ) : null}
                        {user.consentAffiliation ? (
                            <Badge variant="outline" className="font-mono text-[10px]">
                                affiliation
                            </Badge>
                        ) : null}
                        {!user.consentNewsletter && !user.consentAffiliation ? (
                            <span className="font-mono text-[10px] text-muted-foreground/70">aucun</span>
                        ) : null}
                    </div>
                </Field>
            </section>
        </div>
    );
}

function WardrobeTab({ user }: { user: MockVisionUser }) {
    const breakdown = useMemo(() => getCategoryBreakdown(user), [user]);
    const textileItems: WardrobeCardItem[] = useMemo(
        () =>
            user.wardrobePassportIds
                .map((id) => mockPassportById(id))
                .filter((p): p is NonNullable<typeof p> => !!p)
                .map((passport) => {
                    const artisan = mockArtisans.find((a) => a.id === passport.artisanId);
                    const score = computeScore(passport, {
                        certificates: passport.materials.flatMap((m) => m.certifications),
                        ...(artisan ? { artisan } : {}),
                        retoucheurs: mockRepairers,
                        now: SCORING_NOW,
                    });
                    return {
                        id: passport.id,
                        name: passport.garment.reference,
                        brand: artisan?.atelierName ?? '-',
                        grade: score.grade,
                        score: score.total,
                        price: passport.garment.retailPrice,
                        passportId: passport.id,
                    };
                }),
        [user],
    );

    return (
        <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-[10px] tracking-wider text-muted-foreground uppercase">Inventaire global</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {ESPR_CATEGORIES.map((cat) => {
                        const count = breakdown.find((b) => b.category === cat)?.count ?? 0;
                        return (
                            <div
                                key={cat}
                                className="flex items-baseline justify-between rounded-md bg-muted/30 px-2 py-1.5"
                            >
                                <span className="text-[11px] text-foreground">{ESPR_CATEGORY_LABEL[cat]}</span>
                                <span
                                    className={cn(
                                        'font-mono text-xs font-semibold',
                                        count === 0 ? 'text-muted-foreground/50' : 'text-foreground',
                                    )}
                                >
                                    {count}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <section>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{ESPR_CATEGORY_LABEL.textile}</h3>
                {textileItems.length === 0 ? (
                    <EmptyState icon={Shirt} title="Garde-Robe vide" description="Aucun passeport textile." />
                ) : (
                    <Wardrobe items={textileItems} density="cozy" />
                )}
            </section>
        </div>
    );
}

function DocumentsTab({ user }: { user: MockVisionUser }) {
    const documents = useMemo(() => getDocuments(user), [user]);
    if (documents.length === 0) {
        return <p className="text-muted-foreground italic">Aucun document joint.</p>;
    }
    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Produit lié</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Taille</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents.map((doc) => (
                        <TableRow key={doc.id}>
                            <TableCell>
                                <Badge variant="outline" className="font-mono text-[10px]">
                                    {DOCUMENT_TYPE_LABEL[doc.type]}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-[11px] text-foreground">{doc.productLabel}</TableCell>
                            <TableCell className="font-mono text-[11px]">{fmt(doc.uploadedAt)}</TableCell>
                            <TableCell className="text-right font-mono text-[11px]">
                                {formatBytes(doc.sizeBytes)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function RgpdTab({
    user,
    rgpdStatus,
    onStatusChange,
}: {
    user: MockVisionUser;
    rgpdStatus: RgpdLocalStatus;
    onStatusChange: (next: RgpdLocalStatus) => void;
}) {
    return (
        <div className="space-y-4 text-xs">
            <div className="space-y-3 rounded-xl border border-lumiris-rose/30 bg-lumiris-rose/5 p-4">
                <h3 className="inline-flex items-center gap-1 text-sm font-semibold text-lumiris-rose">
                    <ShieldAlert className="h-4 w-4" /> Actions RGPD
                </h3>
                <p className="text-foreground">
                    Toutes les actions ci-dessous sont tracées dans le journal d&apos;audit.
                </p>
                <RgpdDialog user={user} status={rgpdStatus} onStatusChange={onStatusChange} />
            </div>

            {user.rgpdRequests && user.rgpdRequests.length > 0 ? (
                <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                    {user.rgpdRequests.map((req, i) => (
                        <li
                            key={`${req.kind}-${req.requestedAt}-${i}`}
                            className="flex items-baseline justify-between px-3 py-2"
                        >
                            <span>
                                {req.kind === 'export' ? 'Export' : 'Effacement'} · {fmt(req.requestedAt)}
                            </span>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'font-mono text-[10px]',
                                    req.status === 'pending'
                                        ? 'border-lumiris-amber/40 text-lumiris-amber'
                                        : 'border-lumiris-emerald/40 text-lumiris-emerald',
                                )}
                            >
                                {req.status === 'pending' ? 'En attente' : 'Finalisé'}
                            </Badge>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}
