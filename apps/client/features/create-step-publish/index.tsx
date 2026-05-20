'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    Download,
    Eye,
    FileText,
    Loader2,
    Nfc,
    Printer,
    Sparkles,
    X,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { ESPR_REQUIRED_FIELDS, AGEC_REQUIRED_FIELDS, computeScore } from '@lumiris/core/scoring';
import { mockCertificates } from '@lumiris/mock-data';
import { ARTISAN_PASSPORT_LIMIT, buildGS1Identifier } from '@lumiris/types';
import type { ArtisanTier, Passport, IrisGrade as IrisGradeLetter, ScoreResult } from '@lumiris/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@lumiris/ui/components/accordion';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@lumiris/ui/components/dialog';
import { toast } from '@lumiris/ui/components/sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lumiris/ui/components/tooltip';
import { cn } from '@lumiris/ui/lib/cn';
import { IrisGrade, MissingFieldsBadge, ScoreBreakdown, ScoreCapWarning, ScoreReasonsList } from '@lumiris/scoring-ui';
import { randomGtin13 } from '@lumiris/utils';
import { QuotaUpsellDialog } from '@/features/quota-upsell';
import { WizardShell } from '@/features/wizard-shell';
import { useStepNavigation } from '@/features/wizard-shell/use-step-navigation';
import { useBilling } from '@/lib/billing-store';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { draftToPassport, useDraftStore } from '@/lib/draft-store';
import { simulateNfcWrite } from '@/lib/nfc-mock';
import { usePassports } from '@/lib/passports-source';
import { activePassportCount, isQuotaReached } from '@/lib/quota';

export function CreateStepPublish({ draftId }: { draftId: string }) {
    const artisan = useCurrentArtisan();
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const publish = useDraftStore((s) => s.publish);
    const { goTo } = useStepNavigation(draftId);
    const passports = usePassports(artisan.id);
    const billing = useBilling(artisan.id);

    const [open, setOpen] = useState(false);
    const [upsellOpen, setUpsellOpen] = useState(false);
    const [published, setPublished] = useState<{
        passport: Passport;
        score: ScoreResult;
        gs1: string;
    } | null>(null);

    const passport = useMemo(() => (draft ? draftToPassport(draft) : null), [draft]);
    const score = useMemo(() => {
        if (!passport) return null;
        return computeScore(passport, {
            artisan,
            certificates: mockCertificates,
            now: new Date(),
        });
    }, [artisan, passport]);

    if (!passport || !score) {
        return (
            <WizardShell draftId={draftId} step="publish">
                {null}
            </WizardShell>
        );
    }

    const missing = listMissingFields(passport);
    const willBeIncomplete = missing.length > 0;

    const tier: ArtisanTier = billing.tier;
    const quotaWouldExceed = passport.status === 'Draft' && isQuotaReached(passports, tier);
    const usedSlots = activePassportCount(passports);
    const tierLimit = ARTISAN_PASSPORT_LIMIT[tier];

    const handlePublish = () => {
        if (quotaWouldExceed) {
            setUpsellOpen(true);
            return;
        }
        const gtin = randomGtin13();
        const serial = randomSerial(8);
        const gs1 = buildGS1Identifier(gtin, serial, draftId);
        const status: 'Published' | 'InCompletion' = willBeIncomplete ? 'InCompletion' : 'Published';
        publish(draftId, { gs1, status });
        setPublished({ passport: { ...passport, gs1, status }, score, gs1: gs1.verificationUrl });
        setOpen(true);
    };

    const checklist = buildChecklist(passport);

    return (
        <WizardShell draftId={draftId} step="publish" onPrev={() => goTo('certifications')}>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="text-lumiris-emerald h-5 w-5" /> Publication
                            </CardTitle>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Récap final, score Iris officiel et génération du QR.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <IrisGrade grade={score.grade} size="xl" shape="square" tone="solid" />
                            <p className="text-foreground font-mono text-3xl font-semibold">
                                {score.total.toFixed(1)}
                                <span className="text-muted-foreground/70 ml-0.5 text-sm font-normal">/ 100</span>
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ScoreBreakdown breakdown={score.breakdown} weights={score.weights} />
                        {score.cap?.applied && <ScoreCapWarning cap={score.cap} />}
                        <div className="flex items-center justify-between border-t pt-3">
                            <span className="text-muted-foreground text-xs">Champs ESPR/AGEC obligatoires</span>
                            <MissingFieldsBadge passport={passport} showWhenComplete />
                        </div>
                        <p className="text-muted-foreground border-t pt-3 text-xs">
                            Le passeport sera disponible via QR code et puce NFC GS1 Digital Link.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Checklist ESPR / AGEC</CardTitle>
                        <p className="text-muted-foreground text-xs">
                            Tout doit être coché pour publier en statut « Publié ». Sinon → sauvegarde en « En
                            complétion ».
                        </p>
                    </CardHeader>
                    <CardContent>
                        <ul className="grid gap-1.5 text-sm md:grid-cols-2">
                            {checklist.map((item) => (
                                <li
                                    key={`${item.kind}::${item.path}`}
                                    className={cn(
                                        'flex items-center gap-2 rounded-md px-2 py-1.5',
                                        item.ok ? 'text-foreground/80' : 'bg-lumiris-amber/5 text-lumiris-amber',
                                    )}
                                >
                                    {item.ok ? (
                                        <Check className="text-lumiris-emerald h-3.5 w-3.5 shrink-0" />
                                    ) : (
                                        <X className="text-lumiris-amber h-3.5 w-3.5 shrink-0" />
                                    )}
                                    <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                                        {item.kind}
                                    </span>
                                    <span className="truncate">{item.path}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Récap du DPP</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" className="w-full">
                            <Section value="prod" title="Produit">
                                <Field label="Type" value={passport.garment.kind} />
                                <Field label="Référence" value={passport.garment.reference || '-'} />
                                <Field
                                    label="Prix"
                                    value={`${passport.garment.retailPrice} ${passport.garment.currency}`}
                                />
                                <Field label="Poids" value={`${passport.garment.dimensions.weightG ?? '?'} g`} />
                            </Section>
                            <Section value="comp" title={`Composition (${passport.materials.length})`}>
                                {passport.materials.length === 0 && <Empty />}
                                {passport.materials.map((m, i) => (
                                    <p key={i} className="text-foreground text-xs">
                                        {m.percentage}% {m.fiber} - {m.originCountry} ·{' '}
                                        {m.supplierId || 'fournisseur manquant'} · {m.certifications.length} certif(s)
                                    </p>
                                ))}
                            </Section>
                            <Section value="steps" title={`Étapes (${passport.steps.length})`}>
                                {passport.steps.length === 0 && <Empty />}
                                {passport.steps.map((s) => (
                                    <p key={s.id} className="text-foreground text-xs">
                                        {s.kind} - {s.label || '(sans libellé)'} · {s.performedBy} ({s.locationCity},{' '}
                                        {s.locationCountry}) · {s.photos.length} photo(s)
                                    </p>
                                ))}
                            </Section>
                            <Section value="certs" title={`Certifications (${passport.certifications.length})`}>
                                {passport.certifications.length === 0 && <Empty />}
                                {passport.certifications.map((c) => (
                                    <p key={c.id} className="text-foreground text-xs">
                                        {c.kind} - {c.issuer || c.customName || '(organisme inconnu)'}{' '}
                                        {c.verified ? '· vérifiée' : '· non vérifiée'}
                                    </p>
                                ))}
                            </Section>
                            <Section value="warranty" title="Garantie">
                                <Field label="Durée" value={`${passport.warranty.durationMonths} mois`} />
                                <Field label="Termes" value={passport.warranty.terms || '-'} />
                            </Section>
                            <Section value="reasons" title="Motifs de score">
                                <ScoreReasonsList reasons={score.reasons} />
                            </Section>
                        </Accordion>
                    </CardContent>
                </Card>

                {quotaWouldExceed && (
                    <button
                        type="button"
                        onClick={() => setUpsellOpen(true)}
                        className="border-lumiris-amber/40 bg-lumiris-amber/10 text-foreground hover:bg-lumiris-amber/15 flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors"
                    >
                        <AlertTriangle className="text-lumiris-amber mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <div className="text-sm">
                            <p className="font-medium">
                                Quota atteint ({usedSlots}/{tierLimit}). Passez Studio pour 300 passeports ou supprimez
                                des passeports inactifs.
                            </p>
                            <span className="text-muted-foreground mt-0.5 inline-block text-xs underline underline-offset-2">
                                Voir mon abonnement
                            </span>
                        </div>
                    </button>
                )}

                <div className="flex items-center justify-between gap-4">
                    <p className="text-muted-foreground text-xs">
                        {quotaWouldExceed
                            ? `Quota ${tier} atteint — publication bloquée.`
                            : willBeIncomplete
                              ? 'Champs obligatoires manquants — sauvegarde en statut « En complétion », vous pourrez compléter plus tard.'
                              : 'Aucun champ obligatoire manquant — publication en statut « Publié ».'}
                    </p>
                    <PublishCta
                        incomplete={willBeIncomplete}
                        missing={missing}
                        onPublish={handlePublish}
                        quotaBlocked={quotaWouldExceed}
                    />
                </div>
            </div>

            {published && (
                <SuccessDialog
                    open={open}
                    onOpenChange={setOpen}
                    passportId={draftId}
                    gs1={published.gs1}
                    grade={published.score.grade}
                />
            )}

            <QuotaUpsellDialog open={upsellOpen} onOpenChange={setUpsellOpen} currentTier={tier} used={usedSlots} />
        </WizardShell>
    );
}

function Section({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
    return (
        <AccordionItem value={value}>
            <AccordionTrigger className="text-sm">{title}</AccordionTrigger>
            <AccordionContent className="space-y-1">{children}</AccordionContent>
        </AccordionItem>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground">{value}</span>
        </div>
    );
}

function Empty() {
    return <p className="text-muted-foreground text-xs italic">Aucun élément.</p>;
}

interface SuccessDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    passportId: string;
    gs1: string;
    grade: IrisGradeLetter;
}

function SuccessDialog({ open, onOpenChange, passportId, gs1, grade }: SuccessDialogProps) {
    const [nfcState, setNfcState] = useState<'idle' | 'writing' | 'success'>('idle');
    const [nfcBytes, setNfcBytes] = useState<number | null>(null);
    const nfcButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!open) {
            setNfcState('idle');
            setNfcBytes(null);
        }
    }, [open]);

    useEffect(() => {
        if (nfcState === 'success') {
            nfcButtonRef.current?.focus();
        }
    }, [nfcState]);

    const downloadPng = () => {
        const canvas = document.querySelector<HTMLCanvasElement>(`#publish-qr-${passportId} canvas`);
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `lumiris-${passportId}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const writeNfc = async () => {
        setNfcState('writing');
        setNfcBytes(null);
        const result = await simulateNfcWrite(gs1);
        setNfcBytes(result.bytes);
        setNfcState('success');
        toast.info('Mode démo — aucune puce réellement écrite.', {
            description: 'En production, Web NFC API (Chrome Android) ou hardware externe.',
        });
    };

    const nfcStatus =
        nfcState === 'writing'
            ? 'Écriture en cours…'
            : nfcState === 'success' && nfcBytes != null
              ? `Puce écrite — ${nfcBytes} octet${nfcBytes > 1 ? 's' : ''}.`
              : '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="text-lumiris-emerald h-4 w-4" /> Passeport publié
                    </DialogTitle>
                    <DialogDescription>
                        Grade Iris {grade}. QR généré, prêt à imprimer ou coller en doublure.
                    </DialogDescription>
                </DialogHeader>

                <div id={`publish-qr-${passportId}`} className="flex flex-col items-center gap-3 py-2">
                    <div className="border-border rounded-xl border bg-white p-4">
                        <QRCodeCanvas value={gs1} size={240} includeMargin level="M" />
                    </div>
                    <p className="text-muted-foreground max-w-full break-all font-mono text-[11px]">{gs1}</p>
                </div>

                <div className="border-border space-y-3 rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Nfc className="text-lumiris-emerald h-4 w-4" />
                            <h3 className="text-sm font-medium">Puce NFC GS1</h3>
                        </div>
                        <Badge variant="outline" className="font-mono uppercase">
                            Démo
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        Approchez votre puce NFC pour écrire l&apos;URL GS1 — payload :{' '}
                        <span className="text-foreground/80 break-all font-mono">{gs1}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            ref={nfcButtonRef}
                            variant="outline"
                            size="sm"
                            onClick={writeNfc}
                            disabled={nfcState === 'writing'}
                        >
                            {nfcState === 'writing' ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : nfcState === 'success' ? (
                                <CheckCircle2 className="text-lumiris-emerald mr-1.5 h-3.5 w-3.5" />
                            ) : (
                                <Nfc className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {nfcState === 'success' ? 'Réécrire la puce' : 'Écrire sur la puce'}
                        </Button>
                        <span
                            aria-live="polite"
                            className={cn(
                                'text-xs',
                                nfcState === 'success' ? 'text-lumiris-emerald' : 'text-muted-foreground',
                            )}
                        >
                            {nfcStatus}
                        </span>
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={downloadPng}>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Télécharger PNG
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/print/${passportId}`} target="_blank">
                            <Printer className="mr-1.5 h-3.5 w-3.5" /> Imprimer étiquette
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/print/passport/${passportId}`} target="_blank">
                            <FileText className="mr-1.5 h-3.5 w-3.5" /> Imprimer fiche complète
                        </Link>
                    </Button>
                    <Button asChild className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 text-white">
                        <Link href={`/passports/${passportId}`}>
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> Voir le passeport
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function listMissingFields(p: Passport): string[] {
    const missing: string[] = [];
    for (const f of ESPR_REQUIRED_FIELDS) {
        if (!f.isPresent(p)) missing.push(`ESPR · ${f.path}`);
    }
    for (const f of AGEC_REQUIRED_FIELDS) {
        if (!f.isPresent(p)) missing.push(`AGEC · ${f.path}`);
    }
    return missing;
}

interface ChecklistItem {
    kind: 'ESPR' | 'AGEC';
    path: string;
    ok: boolean;
}

function buildChecklist(p: Passport): ChecklistItem[] {
    return [
        ...ESPR_REQUIRED_FIELDS.map((f) => ({ kind: 'ESPR' as const, path: f.path, ok: f.isPresent(p) })),
        ...AGEC_REQUIRED_FIELDS.map((f) => ({ kind: 'AGEC' as const, path: f.path, ok: f.isPresent(p) })),
    ];
}

function PublishCta({
    incomplete,
    missing,
    onPublish,
    quotaBlocked,
}: {
    incomplete: boolean;
    missing: string[];
    onPublish: () => void;
    quotaBlocked: boolean;
}) {
    const button = (
        <Button
            onClick={onPublish}
            size="lg"
            disabled={quotaBlocked}
            className={cn(
                'text-white',
                incomplete
                    ? 'bg-lumiris-amber hover:bg-lumiris-amber/90'
                    : 'bg-lumiris-emerald hover:bg-lumiris-emerald/90',
            )}
        >
            {incomplete ? 'Sauvegarder en IN_COMPLETION' : 'Publier le passeport'}
        </Button>
    );
    if (quotaBlocked) {
        return (
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span>{button}</span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                        Quota atteint — passez au palier supérieur pour publier.
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    if (!incomplete || missing.length === 0) return button;
    const head = missing.slice(0, 3).join(' · ');
    const label =
        missing.length <= 3
            ? `Champs manquants : ${head}`
            : `Champs manquants : ${head} et ${missing.length - 3} autre${missing.length - 3 > 1 ? 's' : ''}`;
    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span>{button}</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">{label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function randomSerial(len: number): string {
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let s = '';
    for (let i = 0; i < len; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
    return s;
}
