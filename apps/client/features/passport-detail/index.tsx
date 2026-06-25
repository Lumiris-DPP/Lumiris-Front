'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, Copy, ExternalLink, FileText, Printer, Trash2 } from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import { mockCertificates, mockPassportById } from '@lumiris/mock-data';
import type { Passport } from '@lumiris/types';
import {
    IrisGrade,
    MissingFieldsBadge,
    ScoreBreakdown,
    ScoreCapWarning,
    ScoreReasonsList,
    AtelierStatusBadge,
} from '@lumiris/scoring-ui';
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
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Toaster, toast } from '@lumiris/ui/components/sonner';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { draftToPassport, useDraftStore } from '@/lib/draft-store';

const PLACEHOLDER_PHOTO = '/default_product_picture.webp';

export function PassportDetail({ passportId }: { passportId: string }) {
    const router = useRouter();
    const artisan = useCurrentArtisan();
    const drafts = useDraftStore((s) => s.drafts);
    const draft = drafts[passportId];
    const createDraft = useDraftStore((s) => s.createDraft);
    const deleteDraft = useDraftStore((s) => s.deleteDraft);

    const [confirmDelete, setConfirmDelete] = useState(false);

    const fixed = useMemo(() => mockPassportById(passportId), [passportId]);
    const passport = useMemo<Passport | null>(() => {
        if (draft) return draftToPassport(draft);
        return fixed ?? null;
    }, [draft, fixed]);

    const now = useMemo(() => new Date(), []);
    const score = useMemo(
        () =>
            passport
                ? computeScore(passport, { artisan, certificates: mockCertificates, now })
                : null,
        [artisan, passport, now],
    );

    if (!passport || !score) {
        return (
            <div className="p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Passeport introuvable</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline">
                            <Link href="/passports">
                                <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour à la liste
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isDraft = passport.status !== 'Published';
    const displayPhoto = passport.garment.mainPhotoUrl || PLACEHOLDER_PHOTO;

    const handleDuplicate = () => {
        const newId = createDraft(artisan.id);
        if (draft) {
            const { setGarment, setMaterials } = useDraftStore.getState();
            setGarment(newId, { ...draft.garment, reference: '' });
            setMaterials(newId, [...draft.materials]);
        }
        toast.success('Passeport dupliqué', {
            description: `Brouillon créé à partir de "${passport.garment.reference || passport.id}".`,
        });
        router.push(`/create/${newId}/product`);
    };

    const handleDelete = () => {
        const ref = passport.garment.reference || passport.id;
        deleteDraft(passport.id);
        setConfirmDelete(false);
        toast.success('Brouillon supprimé', { description: `"${ref}" a été retiré.` });
        router.push('/passports');
    };

    return (
        <div className="grid gap-6 p-8 lg:grid-cols-[1fr_360px]">
            <Toaster position="bottom-right" />

            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/passports">
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Liste
                        </Link>
                    </Button>
                    <AtelierStatusBadge status={passport.status} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {passport.garment.name || passport.garment.reference || 'Sans nom'}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm capitalize">
                            {passport.garment.kind} · modifié le{' '}
                            {new Date(passport.updatedAt).toLocaleDateString('fr-FR')}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Image
                            src={displayPhoto}
                            alt={`Visuel principal du passeport ${passport.garment.reference}`}
                            width={640}
                            height={288}
                            unoptimized
                            className="border-border max-h-72 w-auto rounded-xl border object-contain"
                        />
                        <p className="text-muted-foreground break-all font-mono text-xs">
                            {passport.gs1.verificationUrl}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Composition</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        {passport.materials.length === 0 && <p className="text-muted-foreground">-</p>}
                        {passport.materials.map((m, i) => (
                            <p key={i} className="text-foreground">
                                <span className="font-mono">{m.percentage}%</span> {m.fiber} · {m.originCountry}
                            </p>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                <Card>
                    <CardHeader>
                        <p className="text-muted-foreground text-[11px] uppercase tracking-wider">Score Iris</p>
                        <div className="mt-2 flex items-center gap-3">
                            <IrisGrade grade={score.grade} size="lg" />
                            <p className="text-foreground font-mono text-2xl font-semibold">
                                {score.total.toFixed(1)}
                                <span className="text-muted-foreground/70 ml-0.5 text-sm font-normal">/ 100</span>
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ScoreBreakdown breakdown={score.breakdown} weights={score.weights} />
                        {score.cap?.applied && <ScoreCapWarning cap={score.cap} />}
                        <div className="flex items-center justify-between border-t pt-3">
                            <span className="text-muted-foreground text-xs">Champs ESPR/AGEC</span>
                            <MissingFieldsBadge passport={passport} showWhenComplete />
                        </div>
                        <div className="space-y-2 border-t pt-3">
                            <Button asChild variant="outline" className="w-full">
                                <Link href={`/print/${passport.id}`} target="_blank">
                                    <Printer className="mr-1.5 h-3.5 w-3.5" /> Imprimer étiquette
                                </Link>
                            </Button>
                            {passport.status !== 'Draft' && (
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={`/print/passport/${passport.id}`} target="_blank">
                                        <FileText className="mr-1.5 h-3.5 w-3.5" /> Télécharger fiche PDF
                                    </Link>
                                </Button>
                            )}
                            <Button asChild variant="outline" className="w-full">
                                <Link href={`/preview/${passport.id}`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Aperçu client
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full" onClick={handleDuplicate}>
                                <Copy className="mr-1.5 h-3.5 w-3.5" /> Dupliquer
                            </Button>
                            {isDraft && (
                                <Button
                                    variant="outline"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/5 w-full"
                                    onClick={() => setConfirmDelete(true)}
                                >
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Supprimer
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Motifs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScoreReasonsList reasons={score.reasons} limit={6} />
                    </CardContent>
                </Card>
            </aside>

            <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce brouillon ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {passport.garment.reference || passport.id} sera retiré définitivement de votre atelier.
                            Cette action est irréversible.
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
