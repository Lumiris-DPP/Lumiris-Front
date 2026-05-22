'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { AGEC_REQUIRED_FIELDS, ESPR_REQUIRED_FIELDS, computeScore } from '@lumiris/core/scoring';
import { mockCertificates } from '@lumiris/mock-data';
import { ARTISAN_PASSPORT_LIMIT, buildGS1Identifier } from '@lumiris/types';
import type { ArtisanTier, Passport } from '@lumiris/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@lumiris/ui/components/accordion';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { toast } from '@lumiris/ui/components/sonner';
import { cn } from '@lumiris/ui/lib/cn';
import { randomGtin13 } from '@lumiris/utils';
import { QuotaUpsellDialog } from '@/features/quota-upsell';
import { WizardShell } from '@/features/wizard-shell';
import { useStepNavigation } from '@/features/wizard-shell/use-step-navigation';
import { useBilling } from '@/lib/billing-store';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { draftToPassport, useDraftStore } from '@/lib/draft-store';
import { usePassports } from '@/lib/passports-source';
import { activePassportCount, isQuotaReached } from '@/lib/quota';
import { CompletenessSection } from './completeness-section';
import { NfcWriteDialog, NfcWriteToggle } from './nfc-write-section';
import { PublishDialog } from './publish-dialog';

export function CreateStepPublish({ draftId }: { draftId: string }) {
    const router = useRouter();
    const artisan = useCurrentArtisan();
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const publish = useDraftStore((s) => s.publish);
    const { goTo } = useStepNavigation(draftId);
    const passports = usePassports(artisan.id);
    const billing = useBilling(artisan.id);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [upsellOpen, setUpsellOpen] = useState(false);
    const [nfcEnabled, setNfcEnabled] = useState(false);
    const [nfcDialog, setNfcDialog] = useState<{ open: boolean; gs1: string }>({ open: false, gs1: '' });

    const passport = useMemo(() => (draft ? draftToPassport(draft) : null), [draft]);
    const score = useMemo(() => {
        if (!passport) return null;
        return computeScore(passport, { artisan, certificates: mockCertificates, now: new Date() });
    }, [artisan, passport]);

    if (!passport || !score) {
        return (
            <WizardShell draftId={draftId} step="publish" hideNav>
                {null}
            </WizardShell>
        );
    }

    const incomplete = hasMissingFields(passport);
    const tier: ArtisanTier = billing.tier;
    const quotaWouldExceed = passport.status === 'Draft' && isQuotaReached(passports, tier);
    const usedSlots = activePassportCount(passports);
    const tierLimit = ARTISAN_PASSPORT_LIMIT[tier];

    const handleConfirm = () => {
        setConfirmOpen(false);
        const gtin = randomGtin13();
        const serial = randomSerial(8);
        const gs1 = buildGS1Identifier(gtin, serial, draftId);
        const status: 'Published' | 'InCompletion' = incomplete ? 'InCompletion' : 'Published';
        publish(draftId, { gs1, status });
        toast.success(incomplete ? 'Sauvegardé en complétion' : 'Passeport publié', {
            description: incomplete
                ? 'Vous pouvez compléter les champs manquants depuis le détail.'
                : `Grade ${score.grade} · QR GS1 généré.`,
        });
        if (nfcEnabled) {
            setNfcDialog({ open: true, gs1: gs1.verificationUrl });
        } else {
            router.push(`/passports/${draftId}`);
        }
    };

    const handleNfcDone = () => {
        setNfcDialog({ open: false, gs1: '' });
        router.push(`/passports/${draftId}`);
    };

    const handlePublishClick = () => {
        if (quotaWouldExceed) {
            setUpsellOpen(true);
            return;
        }
        setConfirmOpen(true);
    };

    return (
        <WizardShell draftId={draftId} step="publish" hideNav>
            <div className="space-y-6">
                <CompletenessSection passport={passport} score={score} draftId={draftId} />

                <RecapSection passport={passport} />

                <NfcWriteToggle enabled={nfcEnabled} onChange={setNfcEnabled} />

                {quotaWouldExceed && (
                    <QuotaAlert used={usedSlots} limit={tierLimit} onClick={() => setUpsellOpen(true)} />
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                    <Button variant="outline" onClick={() => goTo('certifications')}>
                        Précédent
                    </Button>
                    <Button
                        size="lg"
                        onClick={handlePublishClick}
                        disabled={quotaWouldExceed}
                        className={cn(
                            'text-white',
                            incomplete
                                ? 'bg-lumiris-amber hover:bg-lumiris-amber/90'
                                : 'bg-lumiris-emerald hover:bg-lumiris-emerald/90',
                        )}
                    >
                        <Sparkles className="mr-1.5 h-4 w-4" />
                        {incomplete ? 'Sauvegarder en complétion' : 'Publier le passeport'}
                    </Button>
                </div>
            </div>

            <PublishDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                onConfirm={handleConfirm}
                incomplete={incomplete}
            />
            <NfcWriteDialog open={nfcDialog.open} gs1={nfcDialog.gs1} onDone={handleNfcDone} />
            <QuotaUpsellDialog open={upsellOpen} onOpenChange={setUpsellOpen} currentTier={tier} used={usedSlots} />
        </WizardShell>
    );
}

function RecapSection({ passport }: { passport: Passport }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Récap du DPP</CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full">
                    <RecapItem value="prod" title="Produit">
                        <RecapLine label="Type" value={passport.garment.kind} />
                        <RecapLine label="Référence" value={passport.garment.reference || '-'} />
                        <RecapLine
                            label="Prix"
                            value={`${passport.garment.retailPrice} ${passport.garment.currency}`}
                        />
                        <RecapLine label="Poids" value={`${passport.garment.dimensions.weightG ?? '?'} g`} />
                    </RecapItem>
                    <RecapItem value="comp" title={`Composition (${passport.materials.length})`}>
                        {passport.materials.length === 0 && <Empty />}
                        {passport.materials.map((m, i) => (
                            <p key={i} className="text-foreground text-xs">
                                {m.percentage}% {m.fiber} - {m.originCountry} · {m.supplierId || 'fournisseur manquant'}{' '}
                                · {m.certifications.length} certif(s)
                            </p>
                        ))}
                    </RecapItem>
                    <RecapItem value="steps" title={`Étapes (${passport.steps.length})`}>
                        {passport.steps.length === 0 && <Empty />}
                        {passport.steps.map((s) => (
                            <p key={s.id} className="text-foreground text-xs">
                                {s.kind} - {s.label || '(sans libellé)'} · {s.performedBy} ({s.locationCity},{' '}
                                {s.locationCountry}) · {s.photos.length} photo(s)
                            </p>
                        ))}
                    </RecapItem>
                    <RecapItem value="certs" title={`Certifications (${passport.certifications.length})`}>
                        {passport.certifications.length === 0 && <Empty />}
                        {passport.certifications.map((c) => (
                            <p key={c.id} className="text-foreground text-xs">
                                {c.kind} - {c.issuer || c.customName || '(organisme inconnu)'}{' '}
                                {c.verified ? '· vérifiée' : '· non vérifiée'}
                            </p>
                        ))}
                    </RecapItem>
                    <RecapItem value="warranty" title="Garantie">
                        <RecapLine label="Durée" value={`${passport.warranty.durationMonths} mois`} />
                        <RecapLine label="Termes" value={passport.warranty.terms || '-'} />
                    </RecapItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}

function RecapItem({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
    return (
        <AccordionItem value={value}>
            <AccordionTrigger className="text-sm">{title}</AccordionTrigger>
            <AccordionContent className="space-y-1">{children}</AccordionContent>
        </AccordionItem>
    );
}

function RecapLine({ label, value }: { label: string; value: string }) {
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

function QuotaAlert({ used, limit, onClick }: { used: number; limit: number; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="border-lumiris-amber/40 bg-lumiris-amber/10 text-foreground hover:bg-lumiris-amber/15 flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors"
        >
            <AlertTriangle className="text-lumiris-amber mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="text-sm">
                <p className="font-medium">
                    Quota atteint ({used}/{limit}). Passez Studio pour 300 passeports ou supprimez des passeports
                    inactifs.
                </p>
                <span className="text-muted-foreground mt-0.5 inline-block text-xs underline underline-offset-2">
                    Voir mon abonnement
                </span>
            </div>
        </button>
    );
}

function randomSerial(len: number): string {
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let s = '';
    for (let i = 0; i < len; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
    return s;
}

function hasMissingFields(passport: Passport): boolean {
    for (const f of ESPR_REQUIRED_FIELDS) if (!f.isPresent(passport)) return true;
    for (const f of AGEC_REQUIRED_FIELDS) if (!f.isPresent(passport)) return true;
    return false;
}
