'use client';

import { memo, useMemo, useState } from 'react';
import { Filter, Inbox, MapPin, Megaphone, Search, ShieldCheck, Star } from 'lucide-react';
import { mockRepairers } from '@lumiris/mock-data';
import type { Repairer, RepairerSpecialty } from '@lumiris/types';
import { ActivityTab, KycTab, ProfileTab, ReviewsTab } from './drawer-tabs';
import { CommissionsTab } from './commissions-tab';
import type { CandidatureStatus, RetoucheurOverlay } from './types';
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
import { ScrollArea } from '@lumiris/ui/components/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lumiris/ui/components/sheet';
import { Slider } from '@lumiris/ui/components/slider';
import { Tabs, TabsList, TabsTrigger } from '@lumiris/ui/components/tabs';
import { Textarea } from '@lumiris/ui/components/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { cn } from '@lumiris/ui/lib/cn';
import { useLogAction, usePermission } from '@/lib/auth';
import { EmptyState } from '../_shared/empty-state';
import { NonNegotiableBanner } from '../_shared/non-negotiable-banner';
import { PermissionRequiredAction } from '../_shared/permission-required-action';

const SPECIALITY_LABEL: Record<RepairerSpecialty, string> = {
    alteration: 'Retouche',
    embroidery: 'Broderie',
    'shoe-repair': 'Cordonnerie',
    leather: 'Cuir',
    lining: 'Doublure',
    'electronics-repair': 'Électronique',
    'phone-repair': 'Téléphonie',
    'computer-repair': 'Informatique',
    cabinetmaking: 'Ébénisterie',
    upholstery: 'Tapisserie',
    'appliance-repair': 'Électroménager',
};

const STATUS_LABEL: Record<CandidatureStatus, string> = {
    pending: 'À vérifier',
    verified: 'Vérifié',
    rejected: 'Rejeté',
};

function RepairersComponent() {
    return <RepairersInner />;
}

function RepairersInner() {
    const [overlays, setOverlays] = useState<Map<string, RetoucheurOverlay>>(() => new Map());
    const [search, setSearch] = useState('');
    const [cityFilter, setCityFilter] = useState<string>('all');
    const [specialityFilter, setSpecialityFilter] = useState<RepairerSpecialty | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<CandidatureStatus | 'all'>('all');
    const [minRating, setMinRating] = useState(0);
    const [selected, setSelected] = useState<Repairer | null>(null);

    const cities = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const r of mockRepairers) {
            counts[r.city] = (counts[r.city] ?? 0) + 1;
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, []);

    const filtered = useMemo(() => {
        return mockRepairers.filter((r) => {
            if (cityFilter !== 'all' && r.city !== cityFilter) return false;
            if (specialityFilter !== 'all' && !r.specialities.includes(specialityFilter)) return false;
            const status = overlays.get(r.id)?.candidatureStatus ?? 'verified';
            if (statusFilter !== 'all' && status !== statusFilter) return false;
            if (r.avgRating < minRating) return false;
            if (search.trim().length > 0) {
                const needle = search.toLowerCase();
                const haystack = `${r.displayName} ${r.atelierName ?? ''} ${r.city}`.toLowerCase();
                if (!haystack.includes(needle)) return false;
            }
            return true;
        });
    }, [overlays, search, cityFilter, specialityFilter, statusFilter, minRating]);

    const pendingCount = useMemo(
        () => mockRepairers.filter((r) => (overlays.get(r.id)?.candidatureStatus ?? 'verified') === 'pending').length,
        [overlays],
    );

    const underservedSpecialities = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const r of mockRepairers) {
            for (const s of r.specialities) {
                counts[s] = (counts[s] ?? 0) + 1;
            }
        }
        return (Object.keys(SPECIALITY_LABEL) as RepairerSpecialty[]).filter((s) => (counts[s] ?? 0) < 3);
    }, []);

    const scrollToPriorityGaps = () => {
        if (typeof document === 'undefined') return;
        document.getElementById('priority-gaps-banner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const resetFilters = () => {
        setSearch('');
        setCityFilter('all');
        setSpecialityFilter('all');
        setStatusFilter('all');
        setMinRating(0);
    };

    const hasGaps = pendingCount > 0 || underservedSpecialities.length > 0;

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-foreground text-xl font-semibold">Retoucheurs (LUMIRIS Local)</h2>
                <Badge
                    variant="outline"
                    className="border-lumiris-emerald/40 text-lumiris-emerald mt-1.5 font-mono text-[10px]"
                >
                    Périmètre V1 — textile artisanal français
                </Badge>
                <p className="text-muted-foreground mt-1 text-sm">
                    {mockRepairers.length} retoucheurs référencés —{' '}
                    {mockRepairers.filter((r) => r.localSubscribed).length} abonnés Local.
                </p>
            </div>

            <NonNegotiableBanner rule="Modération des avis = retrait ou publication uniquement. Aucun avis ne peut être édité. Audit log obligatoire pour chaque masquage." />

            {hasGaps ? (
                <PriorityGapsBanner
                    pendingCount={pendingCount}
                    underservedSpecialities={underservedSpecialities}
                    onFilterPending={() => setStatusFilter('pending')}
                    onFilterSpeciality={(s) => setSpecialityFilter(s)}
                />
            ) : null}

            <CityHeatmap cities={cities} active={cityFilter} onSelect={setCityFilter} />

            <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3">
                <div className="min-w-55 relative flex-1">
                    <Search
                        className="text-muted-foreground/60 absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                        aria-hidden
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Nom, atelier, ville…"
                        className="pl-8"
                        aria-label="Filtrer par nom, atelier ou ville"
                    />
                </div>
                <Select
                    value={specialityFilter}
                    onValueChange={(v) => setSpecialityFilter(v as RepairerSpecialty | 'all')}
                >
                    <SelectTrigger className="w-40" aria-label="Filtrer par spécialité">
                        <Filter className="mr-1 h-3.5 w-3.5" aria-hidden /> <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes spécialités</SelectItem>
                        {Object.entries(SPECIALITY_LABEL).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                                {v}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CandidatureStatus | 'all')}>
                    <SelectTrigger className="w-45" aria-label="Filtrer par statut KYC">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous statuts KYC</SelectItem>
                        <SelectItem value="pending">À vérifier</SelectItem>
                        <SelectItem value="verified">Vérifié</SelectItem>
                        <SelectItem value="rejected">Rejeté</SelectItem>
                    </SelectContent>
                </Select>
                <div className="min-w-55 flex flex-1 items-center gap-2">
                    <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                        Note min. {minRating.toFixed(1)}
                    </span>
                    <Slider
                        value={[minRating]}
                        max={5}
                        step={0.1}
                        onValueChange={(v) => setMinRating(v[0] ?? 0)}
                        className="flex-1"
                        aria-label={`Note minimale ${minRating.toFixed(1)} sur 5`}
                    />
                </div>
            </div>

            <RepairerTable
                rows={filtered}
                overlays={overlays}
                onSelect={setSelected}
                cityFilter={cityFilter}
                hasGaps={hasGaps}
                onScrollToGaps={scrollToPriorityGaps}
                onResetFilters={resetFilters}
            />

            <RepairerDrawer
                retoucheur={selected}
                overlay={selected ? overlays.get(selected.id) : undefined}
                onClose={() => setSelected(null)}
                onPatchOverlay={(id, patch) =>
                    setOverlays((prev) => {
                        const next = new Map(prev);
                        next.set(id, { ...(next.get(id) ?? {}), ...patch });
                        return next;
                    })
                }
            />
        </div>
    );
}

function CityHeatmap({
    cities,
    active,
    onSelect,
}: {
    cities: ReadonlyArray<[string, number]>;
    active: string;
    onSelect: (city: string) => void;
}) {
    return (
        <div className="border-border bg-card rounded-xl border p-3">
            <p className="text-muted-foreground mb-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider">
                <MapPin className="h-3 w-3" aria-hidden /> Implantations
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtre par ville">
                <button
                    type="button"
                    onClick={() => onSelect('all')}
                    aria-pressed={active === 'all'}
                    className={cn(
                        'rounded-full border px-2 py-1 font-mono text-[11px]',
                        active === 'all'
                            ? 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald'
                            : 'border-border text-muted-foreground hover:border-lumiris-emerald/40',
                    )}
                >
                    Toutes les villes
                </button>
                {cities.map(([city, count]) => (
                    <button
                        key={city}
                        type="button"
                        onClick={() => onSelect(city)}
                        aria-pressed={active === city}
                        className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[11px]',
                            active === city
                                ? 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald'
                                : 'border-border text-muted-foreground hover:border-lumiris-emerald/40',
                        )}
                    >
                        <MapPin className="h-2.5 w-2.5" aria-hidden /> {city}
                        <span className="text-muted-foreground/60">·{count}</span>
                    </button>
                ))}
            </div>
            <table className="sr-only">
                <caption>Densité retoucheurs par ville (équivalent textuel de la heatmap)</caption>
                <thead>
                    <tr>
                        <th scope="col">Ville</th>
                        <th scope="col">Nombre de retoucheurs</th>
                    </tr>
                </thead>
                <tbody>
                    {cities.map(([city, count]) => (
                        <tr key={`sr-${city}`}>
                            <th scope="row">{city}</th>
                            <td>{count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PriorityGapsBanner({
    pendingCount,
    underservedSpecialities,
    onFilterPending,
    onFilterSpeciality,
}: {
    pendingCount: number;
    underservedSpecialities: readonly RepairerSpecialty[];
    onFilterPending: () => void;
    onFilterSpeciality: (s: RepairerSpecialty) => void;
}) {
    return (
        <section
            id="priority-gaps-banner"
            aria-labelledby="priority-gaps-banner-title"
            className="border-lumiris-amber/30 bg-lumiris-amber/5 space-y-2 rounded-xl border p-3 text-xs"
        >
            <p
                id="priority-gaps-banner-title"
                className="text-lumiris-amber inline-flex items-center gap-1.5 font-semibold"
            >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Lacunes prioritaires
            </p>
            <ul className="space-y-1.5">
                {pendingCount > 0 ? (
                    <li className="flex flex-wrap items-baseline gap-2">
                        <span>
                            <strong>
                                {pendingCount} candidature{pendingCount > 1 ? 's' : ''} à vérifier
                            </strong>{' '}
                            — KYC en attente, traitez en lot.
                        </span>
                        <Button size="sm" variant="outline" onClick={onFilterPending} className="h-6 gap-1 text-[10px]">
                            Filtrer KYC à vérifier
                        </Button>
                    </li>
                ) : null}
                {underservedSpecialities.length > 0 ? (
                    <li className="flex flex-wrap items-baseline gap-2">
                        <span>
                            <strong>
                                {underservedSpecialities.length} spécialité
                                {underservedSpecialities.length > 1 ? 's' : ''} sous-représentée
                                {underservedSpecialities.length > 1 ? 's' : ''}
                            </strong>{' '}
                            (moins de 3 retoucheurs) — à renforcer pour la promesse LUMIRIS Local.
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {underservedSpecialities.map((s) => (
                                <Button
                                    key={s}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onFilterSpeciality(s)}
                                    className="h-6 gap-1 text-[10px]"
                                >
                                    {SPECIALITY_LABEL[s]}
                                </Button>
                            ))}
                        </div>
                    </li>
                ) : null}
            </ul>
        </section>
    );
}

function RepairerTable({
    rows,
    overlays,
    onSelect,
    cityFilter,
    hasGaps,
    onScrollToGaps,
    onResetFilters,
}: {
    rows: readonly Repairer[];
    overlays: Map<string, RetoucheurOverlay>;
    onSelect: (r: Repairer) => void;
    cityFilter: string;
    hasGaps: boolean;
    onScrollToGaps: () => void;
    onResetFilters: () => void;
}) {
    if (rows.length === 0) {
        const cityScoped = cityFilter !== 'all';
        return (
            <EmptyState
                icon={cityScoped ? Megaphone : Inbox}
                title={cityScoped ? 'Aucun retoucheur sur cette zone' : 'Aucun retoucheur ne correspond aux filtres'}
                description={
                    cityScoped
                        ? 'Personne n’est encore référencé ici. Identifiez les spécialités sous-représentées pour cibler le recrutement.'
                        : 'Élargissez le périmètre ou consultez les lacunes prioritaires pour orienter votre action.'
                }
                action={
                    hasGaps ? (
                        <Button size="sm" variant="outline" onClick={onScrollToGaps} className="gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Voir les lacunes prioritaires
                        </Button>
                    ) : (
                        <Button size="sm" variant="outline" onClick={onResetFilters} className="gap-1.5">
                            <Filter className="h-3.5 w-3.5" aria-hidden /> Réinitialiser les filtres
                        </Button>
                    )
                }
            />
        );
    }
    return (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Retoucheur</TableHead>
                        <TableHead>Spécialités</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Délai</TableHead>
                        <TableHead>Tarif</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((r) => {
                        const status = overlays.get(r.id)?.candidatureStatus ?? 'verified';
                        return (
                            <TableRow key={r.id} className="cursor-pointer" onClick={() => onSelect(r)}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-[10px]">
                                                {r.displayName.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-foreground text-sm">{r.displayName}</p>
                                            <p className="text-muted-foreground text-[10px]">
                                                {r.atelierName ?? ''} · {r.city}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {r.specialities.map((s) => (
                                            <Badge key={s} variant="outline" className="text-[10px]">
                                                {SPECIALITY_LABEL[s]}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 font-mono text-xs">
                                        <Star className="text-lumiris-amber h-3 w-3 fill-current" aria-hidden />
                                        {r.avgRating.toFixed(1)}
                                        <span className="text-muted-foreground">({r.reviewCount})</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono text-xs">{r.avgDelayDays} j</span>
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono text-xs">
                                        {r.priceRange.min}–{r.priceRange.max} €
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <CandidatureBadge status={status} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelect(r);
                                        }}
                                        aria-label={`Ouvrir la fiche de ${r.displayName}`}
                                    >
                                        Détail
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

function CandidatureBadge({ status }: { status: CandidatureStatus }) {
    const tone =
        status === 'verified'
            ? 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald'
            : status === 'pending'
              ? 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber'
              : 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose';
    return (
        <Badge variant="outline" className={cn('font-mono text-[10px]', tone)}>
            {STATUS_LABEL[status]}
        </Badge>
    );
}

interface RepairerDrawerProps {
    retoucheur: Repairer | null;
    overlay: RetoucheurOverlay | undefined;
    onClose: () => void;
    onPatchOverlay: (id: string, patch: Partial<RetoucheurOverlay>) => void;
}

function RepairerDrawer({ retoucheur, overlay, onClose, onPatchOverlay }: RepairerDrawerProps) {
    return (
        <Sheet open={retoucheur !== null} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="bg-background w-full overflow-hidden p-0 sm:max-w-2xl">
                {retoucheur ? (
                    <DrawerBody
                        retoucheur={retoucheur}
                        overlay={overlay}
                        onClose={onClose}
                        onPatchOverlay={onPatchOverlay}
                    />
                ) : null}
            </SheetContent>
        </Sheet>
    );
}

function DrawerBody({
    retoucheur,
    overlay,
    onClose,
    onPatchOverlay,
}: {
    retoucheur: Repairer;
    overlay: RetoucheurOverlay | undefined;
    onClose: () => void;
    onPatchOverlay: (id: string, patch: Partial<RetoucheurOverlay>) => void;
}) {
    const log = useLogAction();
    const canVerify = usePermission('retoucheur.kyc_verify');
    const canModerate = usePermission('retoucheur.review_hide');
    const status = overlay?.candidatureStatus ?? 'verified';

    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectTypedName, setRejectTypedName] = useState('');
    const [verifyOpen, setVerifyOpen] = useState(false);
    const [statusAnnouncement, setStatusAnnouncement] = useState('');

    const handleVerify = () => {
        onPatchOverlay(retoucheur.id, { candidatureStatus: 'verified' });
        const entry = log({
            action: 'retoucheur.kyc_verify',
            targetType: 'repairer',
            targetId: retoucheur.id,
            payload: { decision: 'verified' },
        });
        setStatusAnnouncement(`KYC vérifié pour ${retoucheur.displayName} — audit log ${entry.id} créé.`);
        setVerifyOpen(false);
    };

    const handleReject = () => {
        if (rejectReason.trim().length === 0) return;
        if (rejectTypedName.trim() !== retoucheur.displayName) return;
        onPatchOverlay(retoucheur.id, {
            candidatureStatus: 'rejected',
            rejectReason,
        });
        const entry = log({
            action: 'retoucheur.kyc_reject',
            targetType: 'repairer',
            targetId: retoucheur.id,
            payload: { decision: 'rejected', reason: rejectReason },
        });
        setStatusAnnouncement(`Candidature rejetée pour ${retoucheur.displayName} — audit log ${entry.id} créé.`);
        setRejectReason('');
        setRejectTypedName('');
        setRejectOpen(false);
    };

    const handleLocalDunning = () => {
        const entry = log({
            action: 'retoucheur.local_dunning',
            targetType: 'repairer',
            targetId: retoucheur.id,
            payload: { subscription: 'overdue_resolved' },
        });
        setStatusAnnouncement(
            `Impayé Local marqué résolu pour ${retoucheur.displayName} — audit log ${entry.id} créé.`,
        );
    };

    const rejectReady = rejectReason.trim().length > 0 && rejectTypedName.trim() === retoucheur.displayName;

    return (
        <div className="flex h-full flex-col">
            <SheetHeader className="border-border border-b p-5">
                <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                        <AvatarFallback>{retoucheur.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <SheetTitle className="truncate">{retoucheur.displayName}</SheetTitle>
                        <p className="text-muted-foreground truncate text-xs">
                            {retoucheur.atelierName ?? ''} · {retoucheur.city}
                        </p>
                    </div>
                    <CandidatureBadge status={status} />
                </div>
            </SheetHeader>

            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {statusAnnouncement}
            </div>

            <Tabs defaultValue="profile" className="flex flex-1 flex-col overflow-hidden">
                <TabsList className="border-border w-full justify-start gap-1 rounded-none border-b bg-transparent px-3">
                    <TabsTrigger value="profile">Profil</TabsTrigger>
                    <TabsTrigger value="kyc">KYC</TabsTrigger>
                    <TabsTrigger value="reviews">Avis</TabsTrigger>
                    <TabsTrigger value="commissions">Commissions</TabsTrigger>
                    <TabsTrigger value="activity">Activité</TabsTrigger>
                </TabsList>
                <ScrollArea className="flex-1">
                    <div className="space-y-3 p-5 text-xs">
                        <ProfileTab retoucheur={retoucheur} />
                        <KycTab
                            retoucheur={retoucheur}
                            overlay={overlay}
                            canVerify={canVerify}
                            onOpenVerify={() => setVerifyOpen(true)}
                            onOpenReject={() => setRejectOpen(true)}
                            onResolveOverdue={handleLocalDunning}
                            onPatchOverlay={onPatchOverlay}
                        />
                        <ReviewsTab
                            retoucheur={retoucheur}
                            overlay={overlay}
                            canModerate={canModerate}
                            onPatchOverlay={onPatchOverlay}
                            onAnnounce={setStatusAnnouncement}
                        />
                        <CommissionsTab retoucheurId={retoucheur.id} />
                        <ActivityTab />
                    </div>
                </ScrollArea>
            </Tabs>

            <div className="border-border bg-card flex justify-end gap-2 border-t p-4">
                <Button size="sm" variant="ghost" onClick={onClose}>
                    Fermer
                </Button>
            </div>

            <AlertDialog open={verifyOpen} onOpenChange={setVerifyOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="inline-flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" aria-hidden /> Vérifier le KYC ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Le retoucheur passera en <strong>vérifié</strong> et apparaîtra sur la carte consumer.
                            Action tracée dans le journal d&apos;audit.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <PermissionRequiredAction requires="retoucheur.kyc_verify">
                            <AlertDialogAction
                                onClick={handleVerify}
                                className="bg-lumiris-emerald hover:bg-lumiris-emerald/90"
                            >
                                Confirmer
                            </AlertDialogAction>
                        </PermissionRequiredAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rejeter la candidature ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Précisez la raison (obligatoire). Le retoucheur sera notifié et l&apos;action tracée. Tapez
                            le nom exact du retoucheur pour confirmer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-3">
                        <Textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Raison du rejet"
                            className="min-h-20"
                            aria-label="Raison du rejet"
                        />
                        <div>
                            <p className="text-muted-foreground mb-1 text-[11px]">
                                Tapez le nom exact :{' '}
                                <code className="bg-muted text-foreground rounded px-1 font-mono text-[11px]">
                                    {retoucheur.displayName}
                                </code>
                            </p>
                            <Input
                                value={rejectTypedName}
                                onChange={(e) => setRejectTypedName(e.target.value)}
                                placeholder={retoucheur.displayName}
                                autoComplete="off"
                                aria-label="Nom du retoucheur pour confirmation"
                            />
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <PermissionRequiredAction requires="retoucheur.kyc_verify">
                            <AlertDialogAction
                                onClick={handleReject}
                                disabled={!rejectReady}
                                className="bg-lumiris-rose hover:bg-lumiris-rose/90"
                            >
                                Rejeter
                            </AlertDialogAction>
                        </PermissionRequiredAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export const Repairers = memo(RepairersComponent);

export { Repairers as Retoucheurs };
