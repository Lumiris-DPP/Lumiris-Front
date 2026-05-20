'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Copy,
    Eye,
    ExternalLink,
    FileText,
    MoreHorizontal,
    Pencil,
    Printer,
    QrCode,
    Search,
    Trash2,
} from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import { mockCertificates } from '@lumiris/mock-data';
import { ARTISAN_PASSPORT_LIMIT, buildGS1Identifier } from '@lumiris/types';
import type { ArtisanTier, Passport, IrisGrade as IrisGradeLetter, PassportStatus, ScoreResult } from '@lumiris/types';
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
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent } from '@lumiris/ui/components/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@lumiris/ui/components/dropdown-menu';
import { Input } from '@lumiris/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Toaster, toast } from '@lumiris/ui/components/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { IrisGrade, AtelierStatusBadge } from '@lumiris/scoring-ui';
import { CreatePassportCta } from '@/features/quota-upsell/create-passport-cta';
import { useBillingStore } from '@/lib/billing-store';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { useDraftStore } from '@/lib/draft-store';
import { PASSPORT_STATUS_LABEL } from '@/lib/passport-status';
import { usePassports } from '@/lib/passports-source';
import { activePassportCount, isQuotaNearLimit, isQuotaReached } from '@/lib/quota';
import { QrModal } from './qr-modal';

const PAGE_SIZE = 25;
const STATUSES: ReadonlyArray<PassportStatus | 'all'> = ['all', 'Draft', 'InCompletion', 'Published'];
const GRADES: ReadonlyArray<IrisGradeLetter | 'all'> = ['all', 'A', 'B', 'C', 'D', 'E'];

interface ScoredRow {
    passport: Passport;
    score: ScoreResult;
}

export function PassportsList() {
    const router = useRouter();
    const artisan = useCurrentArtisan();
    const passports = usePassports(artisan.id);
    const drafts = useDraftStore((s) => s.drafts);
    const createDraft = useDraftStore((s) => s.createDraft);
    const setDraft = useDraftStore((s) => s.setDraft);
    const deleteDraft = useDraftStore((s) => s.deleteDraft);

    const [statusFilter, setStatusFilter] = useState<PassportStatus | 'all'>('all');
    const [gradeFilter, setGradeFilter] = useState<IrisGradeLetter | 'all'>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [qrPassport, setQrPassport] = useState<Passport | null>(null);
    const [pendingDelete, setPendingDelete] = useState<Passport | null>(null);

    const rows: readonly ScoredRow[] = useMemo(() => {
        const now = new Date();
        return passports.map((passport) => ({
            passport,
            score: computeScore(passport, {
                artisan,
                certificates: mockCertificates,
                now,
            }),
        }));
    }, [artisan, passports]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return rows.filter(({ passport, score }) => {
            if (statusFilter !== 'all' && passport.status !== statusFilter) return false;
            if (gradeFilter !== 'all' && score.grade !== gradeFilter) return false;
            if (term) {
                const ref = passport.garment.reference?.toLowerCase() ?? '';
                const kind = passport.garment.kind.toLowerCase();
                if (!ref.includes(term) && !kind.includes(term)) return false;
            }
            return true;
        });
    }, [rows, statusFilter, gradeFilter, search]);

    const total = filtered.length;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, pageCount);
    const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const billing = useBillingStore((s) => s.byArtisan[artisan.id]);
    const tier: ArtisanTier | null = billing?.tier ?? null;
    const quota = tier ? ARTISAN_PASSPORT_LIMIT[tier] : Number.NaN;
    const activeCount = activePassportCount(passports);
    const quotaReached = tier ? isQuotaReached(passports, tier) : false;
    const showQuotaWarning = tier ? !quotaReached && isQuotaNearLimit(passports, tier) : false;

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setGradeFilter('all');
        setPage(1);
    };

    const handleDuplicate = (source: Passport) => {
        const draftSource = drafts[source.id];
        const newId = createDraft(artisan.id);
        setDraft(newId, {
            status: 'Draft',
            garment: { ...source.garment, reference: '' },
            materials: draftSource ? [...draftSource.materials] : [...source.materials],
            steps: draftSource ? [...draftSource.steps] : [...source.steps],
            certifications: draftSource ? [...draftSource.certifications] : [...source.certifications],
            warranty: { ...source.warranty },
            gs1: buildGS1Identifier('0000000000000', newId),
            lastStep: undefined,
        });
        toast.success('Passeport dupliqué', {
            description: `Brouillon créé à partir de "${source.garment.reference || source.id}".`,
        });
        router.push(`/create/${newId}/identification`);
    };

    const handleDelete = () => {
        if (!pendingDelete) return;
        const ref = pendingDelete.garment.reference || pendingDelete.id;
        deleteDraft(pendingDelete.id);
        setPendingDelete(null);
        toast.success('Brouillon supprimé', { description: `"${ref}" a été retiré de votre liste.` });
    };

    const openPreview = (id: string) => window.open(`/preview/${id}`, '_blank', 'noopener,noreferrer');

    if (passports.length === 0) {
        return (
            <div className="space-y-6 p-8">
                <Toaster position="bottom-right" />
                <Card>
                    <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
                        <div className="bg-lumiris-emerald/10 text-lumiris-emerald flex h-12 w-12 items-center justify-center rounded-full">
                            <QrCode className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-foreground text-lg font-semibold">
                                Vous n&apos;avez pas encore de passeport
                            </h2>
                            <p className="text-muted-foreground max-w-md text-sm">
                                Créez votre premier passeport numérique produit pour documenter une pièce textile et
                                générer son QR.
                            </p>
                        </div>
                        <CreatePassportCta className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 text-white">
                            Créer un passeport
                        </CreatePassportCta>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-8">
            <Toaster position="bottom-right" />

            {quotaReached && (
                <div className="border-lumiris-amber/50 bg-lumiris-amber/10 text-foreground flex items-start gap-3 rounded-xl border p-4">
                    <AlertTriangle className="text-lumiris-amber mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <div className="text-sm">
                        <p className="font-medium">
                            Quota atteint — {activeCount} / {quota} passeports.
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                            Vous ne pouvez plus publier de nouveau passeport. Passez au palier supérieur depuis votre{' '}
                            <Link href="/subscription" className="text-foreground underline underline-offset-2">
                                abonnement
                            </Link>{' '}
                            ou supprimez des passeports inactifs.
                        </p>
                    </div>
                </div>
            )}

            {showQuotaWarning && (
                <div className="border-lumiris-amber/40 bg-lumiris-amber/10 text-foreground flex items-start gap-3 rounded-xl border p-4">
                    <AlertTriangle className="text-lumiris-amber mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <div className="text-sm">
                        <p className="font-medium">
                            Quota presque atteint — {activeCount} / {quota} passeports.
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                            Pensez à passer au palier supérieur depuis votre{' '}
                            <Link href="/subscription" className="text-foreground underline underline-offset-2">
                                abonnement
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            )}

            <Card>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1">
                        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Rechercher par référence ou type"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => {
                            setStatusFilter(v as PassportStatus | 'all');
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                    {s === 'all' ? 'Tous statuts' : PASSPORT_STATUS_LABEL[s]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={gradeFilter}
                        onValueChange={(v) => {
                            setGradeFilter(v as IrisGradeLetter | 'all');
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Grade" />
                        </SelectTrigger>
                        <SelectContent>
                            {GRADES.map((g) => (
                                <SelectItem key={g} value={g}>
                                    {g === 'all' ? 'Tous grades' : g}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px]">Photo</TableHead>
                                <TableHead>Référence</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Modifié</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center">
                                        <div className="text-foreground text-sm font-medium">
                                            Aucun passeport pour ces filtres
                                        </div>
                                        <div className="text-muted-foreground mt-1 text-xs">
                                            Modifiez la recherche ou les filtres ci-dessus.
                                        </div>
                                        <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                                            Réinitialiser
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}
                            {visible.map(({ passport, score }) => {
                                const isPublished = passport.status === 'Published';
                                const isDraft = passport.status === 'Draft' || passport.status === 'InCompletion';
                                return (
                                    <TableRow key={passport.id}>
                                        <TableCell>
                                            {passport.garment.mainPhotoUrl ? (
                                                <Image
                                                    src={passport.garment.mainPhotoUrl}
                                                    alt={`Vignette ${passport.garment.reference}`}
                                                    width={40}
                                                    height={40}
                                                    unoptimized
                                                    className="border-border h-10 w-10 rounded-md border object-cover"
                                                />
                                            ) : (
                                                <div className="border-border bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-md border text-[10px]">
                                                    ∅
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/passports/${passport.id}`}
                                                className="text-foreground hover:text-lumiris-emerald font-medium"
                                            >
                                                {passport.garment.reference || 'Brouillon'}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground capitalize">
                                            {passport.garment.kind}
                                        </TableCell>
                                        <TableCell>
                                            <AtelierStatusBadge status={passport.status} />
                                        </TableCell>
                                        <TableCell>
                                            <IrisGrade grade={score.grade} size="sm" />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {new Date(passport.updatedAt).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        aria-label={`Actions pour ${passport.garment.reference || passport.id}`}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-52">
                                                    {isDraft && (
                                                        <DropdownMenuItem asChild>
                                                            <Link href={resumeHref(passport)}>
                                                                <Pencil className="h-3.5 w-3.5" /> Continuer
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {isPublished && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => setQrPassport(passport)}>
                                                                <QrCode className="h-3.5 w-3.5" /> Voir QR
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/passports/${passport.id}`}>
                                                                    <Eye className="h-3.5 w-3.5" /> Voir détail
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleDuplicate(passport)}>
                                                        <Copy className="h-3.5 w-3.5" /> Dupliquer
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openPreview(passport.id)}>
                                                        <ExternalLink className="h-3.5 w-3.5" /> Aperçu client
                                                    </DropdownMenuItem>
                                                    {isPublished && (
                                                        <>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/print/${passport.id}`} target="_blank">
                                                                    <Printer className="h-3.5 w-3.5" /> Imprimer
                                                                    l&apos;étiquette
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link
                                                                    href={`/print/passport/${passport.id}`}
                                                                    target="_blank"
                                                                >
                                                                    <FileText className="h-3.5 w-3.5" /> Imprimer fiche
                                                                    complète
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {isDraft && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                variant="destructive"
                                                                onClick={() => setPendingDelete(passport)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" /> Supprimer
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {total > PAGE_SIZE && (
                <div className="text-muted-foreground flex items-center justify-between text-sm">
                    <p>
                        {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, total)} sur {total}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={safePage === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-mono text-xs">
                            {safePage} / {pageCount}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={safePage === pageCount}
                            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {qrPassport && <QrModal passport={qrPassport} onClose={() => setQrPassport(null)} />}

            <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce brouillon ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingDelete?.garment.reference || pendingDelete?.id} sera retiré définitivement de votre
                            atelier. Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function resumeHref(passport: Passport): string {
    if (passport.status === 'Published') return `/passports/${passport.id}`;
    if (passport.materials.length === 0) return `/create/${passport.id}/identification`;
    if (passport.steps.length === 0) return `/create/${passport.id}/composition`;
    if (passport.warranty.durationMonths === 0) return `/create/${passport.id}/manufacturing`;
    return `/create/${passport.id}/publish`;
}
