'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { CertificationRef, PassportWarranty } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Textarea } from '@lumiris/ui/components/textarea';
import { WizardShell } from '@/features/wizard-shell';
import { useStepNavigation } from '@/features/wizard-shell/use-step-navigation';
import { useDraftStore } from '@/lib/draft-store';
import { CertRow } from './cert-row';
import { validateStep } from './schema';

function newCert(): CertificationRef {
    const today = new Date();
    const exp = new Date(today);
    exp.setFullYear(today.getFullYear() + 2);
    return {
        id: `cert-draft-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'GOTS',
        issuer: '',
        issuedAt: today.toISOString(),
        expiresAt: exp.toISOString(),
        verified: false,
        fileUrl: '',
    };
}

export function CreateStepCertifications({ draftId }: { draftId: string }) {
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const setCertifications = useDraftStore((s) => s.setCertifications);
    const setWarranty = useDraftStore((s) => s.setWarranty);
    const { goNext, goTo } = useStepNavigation(draftId);

    const [certs, setCerts] = useState<CertificationRef[]>(
        draft?.certifications.length ? [...draft.certifications] : [],
    );
    const [warranty, setLocalWarranty] = useState<PassportWarranty>(
        draft?.warranty ?? { durationMonths: 12, terms: '' },
    );

    const updateCert = (idx: number, patch: Partial<CertificationRef>) => {
        setCerts((cur) => cur.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
    };

    const validation = useMemo(
        () =>
            validateStep({
                garment: draft?.garment ?? {
                    kind: 'sweater',
                    reference: '',
                    mainPhotoUrl: '',
                    dimensions: {},
                    retailPrice: 0,
                    currency: 'EUR',
                },
                materials: draft?.materials ?? [],
                steps: draft?.steps ?? [],
                certifications: certs,
                warranty,
            }),
        [certs, warranty, draft],
    );
    const nextMissing = validation.ok ? [] : validation.missing;

    const handleNext = () => {
        setCertifications(draftId, certs);
        setWarranty(draftId, warranty);
        goNext('certifications', 'publish');
    };

    return (
        <WizardShell
            draftId={draftId}
            step="certifications"
            onPrev={() => goTo('manufacturing')}
            onNext={handleNext}
            nextMissing={nextMissing}
        >
            <div className="space-y-6">
                <Card>
                    <CardContent className="space-y-3 pt-6">
                        <p className="text-muted-foreground text-xs">
                            Certifications spécifiques à cette pièce (lot GOTS, attestation matière). Pour les
                            certifications d’atelier réutilisables (EPV, OFG, ISO),{' '}
                            <a
                                href="/certifications"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-foreground underline-offset-2 hover:underline"
                            >
                                utilisez votre catalogue d’atelier
                            </a>
                            .
                        </p>
                        {certs.length === 0 && (
                            <p className="text-muted-foreground rounded-md border border-dashed py-6 text-center text-sm">
                                Aucune certification rattachée pour l’instant.
                            </p>
                        )}
                        {certs.map((cert, idx) => (
                            <CertRow
                                key={cert.id}
                                cert={cert}
                                onChange={(patch) => updateCert(idx, patch)}
                                onRemove={() => setCerts((cur) => cur.filter((_, i) => i !== idx))}
                            />
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setCerts((cur) => [...cur, newCert()])}>
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Ajouter une certification
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="grid gap-4 pt-6 md:grid-cols-[160px_1fr]">
                        <div className="space-y-1.5">
                            <Label htmlFor="dur">Garantie · durée (mois)</Label>
                            <Input
                                id="dur"
                                type="number"
                                min={0}
                                value={warranty.durationMonths || ''}
                                onChange={(e) =>
                                    setLocalWarranty((w) => ({
                                        ...w,
                                        durationMonths: Number(e.target.value) || 0,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="terms">Garantie · termes</Label>
                            <Textarea
                                id="terms"
                                rows={4}
                                value={warranty.terms}
                                onChange={(e) => setLocalWarranty((w) => ({ ...w, terms: e.target.value }))}
                                placeholder="Ex. réparation gratuite des coutures pendant 24 mois."
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </WizardShell>
    );
}
