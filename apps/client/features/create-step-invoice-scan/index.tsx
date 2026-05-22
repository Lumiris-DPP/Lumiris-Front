'use client';

import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@lumiris/ui/components/alert';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { WizardShell } from '@/features/wizard-shell';
import { useStepNavigation } from '@/features/wizard-shell/use-step-navigation';
import { useDraftStore } from '@/lib/draft-store';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { mergeMaterials } from './apply-extraction';
import { InvoiceScanPickerBody } from './picker';

export function CreateStepInvoiceScan({ draftId }: { draftId: string }) {
    const artisan = useCurrentArtisan();
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const setMaterials = useDraftStore((s) => s.setMaterials);
    const { goNext, goTo } = useStepNavigation(draftId);

    return (
        <WizardShell
            draftId={draftId}
            step="invoice"
            onPrev={() => goTo('composition')}
            onNext={() => goNext('invoice', 'manufacturing')}
            nextLabel="Passer cette étape"
        >
            <Card>
                <CardContent className="space-y-4 pt-6">
                    <Alert className="border-lumiris-amber/30 bg-lumiris-amber/5 text-lumiris-amber">
                        <Info aria-hidden />
                        <AlertTitle>Mode démo</AlertTitle>
                        <AlertDescription className="text-foreground/80">
                            L’extraction de facture est simulée. En production, vous photographierez ou téléverserez vos
                            vraies factures fournisseurs et l’OCR (Mistral / Tesseract) tournera côté backend.
                        </AlertDescription>
                    </Alert>

                    <InvoiceScanPickerBody
                        artisanId={artisan.id}
                        onInject={(extracted) => {
                            if (!draft) return;
                            const merged = mergeMaterials(draft.materials, extracted);
                            setMaterials(draftId, merged);
                            goTo('composition');
                        }}
                    />
                </CardContent>
            </Card>
        </WizardShell>
    );
}
