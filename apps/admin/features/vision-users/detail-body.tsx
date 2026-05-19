'use client';

import { useMemo, useState } from 'react';
import { Shirt, ShieldAlert } from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import { mockArtisans, mockPassportById, mockRepairers, type MockVisionUser } from '@lumiris/mock-data';
import { Wardrobe, type WardrobeCardItem } from '@lumiris/scoring-ui';
import { Avatar, AvatarFallback } from '@lumiris/ui/components/avatar';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { ScrollArea } from '@lumiris/ui/components/scroll-area';
import { SheetHeader, SheetTitle } from '@lumiris/ui/components/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lumiris/ui/components/tabs';
import { cn } from '@lumiris/ui/lib/cn';
import { EmptyState } from '../_shared/empty-state';
import { NonNegotiableBanner } from '../_shared/non-negotiable-banner';
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
    type EsprCategory,
    type RgpdLocalStatus,
} from './segments';

const SCORING_NOW = new Date('2026-04-30T08:00:00Z');

function fmt(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</p>
            <div className="text-foreground mt-0.5">{children}</div>
        </div>
    );
}

interface DetailBodyProps {
    user: MockVisionUser;
    onClose: () => void;
    lastAccessAt?: string | undefined;
}

export function DetailBody({ user, onClose, lastAccessAt }: DetailBodyProps) {
    const [rgpdStatus, setRgpdStatus] = useState<RgpdLocalStatus>(() => getRgpdStatus(user));
    const segments = useMemo(() => getSegments(user, SCORING_NOW), [user]);
    const breakdown = useMemo(() => getCategoryBreakdown(user), [user]);
    const documents = useMemo(() => getDocuments(user), [user]);
    const affiliation = useMemo(() => getAffiliationCommissionsEur(user), [user]);
    const scans30d = useMemo(() => getScans30d(user, SCORING_NOW), [user]);
    const wardrobeTotal = useMemo(() => totalWardrobeSize(user), [user]);

    const wardrobeByCategory = useMemo(() => {
        const textileItems: WardrobeCardItem[] = user.wardrobePassportIds
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
            });
        return { textile: textileItems };
    }, [user]);

    const isCompleted = rgpdStatus === 'completed' || user.erased;

    return (
        <div className="flex h-full flex-col">
            <SheetHeader className="border-border border-b p-5">
                <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                        <AvatarFallback>{user.name?.slice(0, 2).toUpperCase() ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <SheetTitle className="truncate">{user.name ?? user.id}</SheetTitle>
                        <p className="text-muted-foreground truncate text-xs">
                            {isCompleted ? '(profil anonymisé)' : user.email}
                        </p>
                    </div>
                    <RgpdStatusBadge status={rgpdStatus} />
                </div>
                {segments.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
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
                ) : null}
                {lastAccessAt ? (
                    <p className="text-muted-foreground mt-1 inline-flex items-center gap-1 font-mono text-[10px]">
                        <ShieldAlert className="h-3 w-3" /> Dernier accès admin :{' '}
                        {new Date(lastAccessAt).toLocaleString('fr-FR')}
                    </p>
                ) : null}
            </SheetHeader>

            <Tabs defaultValue="identity" className="flex flex-1 flex-col overflow-hidden">
                <TabsList className="border-border w-full justify-start gap-1 rounded-none border-b bg-transparent px-3">
                    <TabsTrigger value="identity">Identité</TabsTrigger>
                    <TabsTrigger value="wardrobe">Garde-Robe</TabsTrigger>
                    <TabsTrigger value="documents">Documents joints</TabsTrigger>
                    <TabsTrigger value="rgpd">RGPD</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1">
                    <div className="p-5 text-xs">
                        <TabsContent value="identity" className="m-0 space-y-4">
                            <section className="border-border bg-card grid grid-cols-2 gap-3 rounded-xl border p-3">
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
                            <section className="border-border bg-card flex flex-wrap gap-2 rounded-xl border p-3">
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
                                            <span className="text-muted-foreground/70 font-mono text-[10px]">
                                                aucun
                                            </span>
                                        ) : null}
                                    </div>
                                </Field>
                            </section>
                        </TabsContent>

                        <TabsContent value="wardrobe" className="m-0 space-y-4">
                            <div className="border-border bg-card rounded-xl border p-3">
                                <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                                    Inventaire global multi-secteurs
                                </p>
                                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {ESPR_CATEGORIES.map((cat) => {
                                        const count = breakdown.find((b) => b.category === cat)?.count ?? 0;
                                        return (
                                            <div
                                                key={cat}
                                                className="bg-muted/30 flex items-baseline justify-between rounded-md px-2 py-1.5"
                                            >
                                                <span className="text-foreground text-[11px]">
                                                    {ESPR_CATEGORY_LABEL[cat]}
                                                </span>
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

                            <CategorySection title={ESPR_CATEGORY_LABEL.textile} items={wardrobeByCategory.textile} />
                            <NonTextileNote breakdown={breakdown} />
                        </TabsContent>

                        <TabsContent value="documents" className="m-0 space-y-3">
                            <NonNegotiableBanner rule="Contenu chiffré côté utilisateur. Le back-office ne lit ni n'exporte les justificatifs (factures, garanties, contrats d'assurance, tickets de réparation). Seules les métadonnées sont visibles à des fins d'audit." />

                            {documents.length === 0 ? (
                                <p className="text-muted-foreground italic">Aucun document joint.</p>
                            ) : (
                                <div className="border-border bg-card overflow-hidden rounded-xl border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Produit lié</TableHead>
                                                <TableHead>Date upload</TableHead>
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
                                                    <TableCell className="text-foreground text-[11px]">
                                                        {doc.productLabel}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-[11px]">
                                                        {fmt(doc.uploadedAt)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-[11px]">
                                                        {formatBytes(doc.sizeBytes)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="rgpd" className="m-0 space-y-4">
                            <div className="border-lumiris-rose/30 bg-lumiris-rose/5 space-y-3 rounded-xl border p-4">
                                <h3 className="text-lumiris-rose inline-flex items-center gap-1 text-sm font-semibold">
                                    <ShieldAlert className="h-4 w-4" /> Actions RGPD
                                </h3>
                                <p className="text-foreground">
                                    Toutes les actions ci-dessous sont tracées dans le journal d&apos;audit et engagent
                                    la plateforme.
                                </p>
                                <RgpdDialog user={user} status={rgpdStatus} onStatusChange={setRgpdStatus} />
                            </div>

                            {user.rgpdRequests && user.rgpdRequests.length > 0 ? (
                                <ul className="border-border bg-card divide-border divide-y rounded-xl border">
                                    {user.rgpdRequests.map((req, i) => (
                                        <li
                                            key={`${req.kind}-${req.requestedAt}-${i}`}
                                            className="flex items-baseline justify-between px-3 py-2"
                                        >
                                            <span>
                                                {req.kind === 'export' ? 'Export' : 'Effacement'} ·{' '}
                                                {fmt(req.requestedAt)}
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
                        </TabsContent>
                    </div>
                </ScrollArea>
            </Tabs>

            <div className="border-border bg-card flex justify-end gap-2 border-t p-4">
                <Button size="sm" variant="ghost" onClick={onClose}>
                    Fermer
                </Button>
            </div>
        </div>
    );
}

function RgpdStatusBadge({ status }: { status: RgpdLocalStatus }) {
    if (status === 'none') return null;
    const map: Record<Exclude<RgpdLocalStatus, 'none'>, { label: string; tone: string }> = {
        requested: { label: 'Export demandé', tone: 'border-lumiris-amber/40 text-lumiris-amber' },
        pending_deletion: {
            label: 'Suppression en attente',
            tone: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose',
        },
        completed: { label: 'Anonymisé', tone: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose' },
    };
    const meta = map[status];
    return (
        <Badge variant="outline" className={cn('font-mono text-[10px]', meta.tone)}>
            {meta.label}
        </Badge>
    );
}

function CategorySection({ title, items }: { title: string; items: readonly WardrobeCardItem[] }) {
    return (
        <section>
            <h3 className="text-foreground mb-2 text-sm font-semibold">{title}</h3>
            {items.length === 0 ? (
                <EmptyState
                    icon={Shirt}
                    title="Garde-Robe vide."
                    description="L'utilisateur n'a encore rien ajouté dans cette catégorie."
                />
            ) : (
                <Wardrobe items={items} density="cozy" />
            )}
        </section>
    );
}

function NonTextileNote({ breakdown }: { breakdown: ReadonlyArray<{ category: EsprCategory; count: number }> }) {
    const others = breakdown.filter((b) => b.category !== 'textile' && b.count > 0);
    if (others.length === 0) return null;
    return (
        <section className="border-border bg-card rounded-xl border p-3">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                Hors textile · vue détaillée à venir
            </p>
            <p className="text-foreground/70 mt-1 text-[11px]">
                Les visuels par catégorie (Iris Scanner appliances, batteries, mobilier) arrivent avec l&apos;extension
                multi-secteurs. Les compteurs ci-dessus reflètent l&apos;inventaire global déjà déclaré par
                l&apos;utilisateur.
            </p>
        </section>
    );
}
