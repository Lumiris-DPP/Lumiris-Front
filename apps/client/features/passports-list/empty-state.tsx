'use client';

import { QrCode } from 'lucide-react';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { CreatePassportCta } from '@/features/quota-upsell/create-passport-cta';

export function EmptyState() {
    return (
        <Card>
            <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
                <div className="bg-lumiris-emerald/10 text-lumiris-emerald flex h-12 w-12 items-center justify-center rounded-full">
                    <QrCode className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-foreground text-lg font-semibold">Vous n&apos;avez pas encore de passeport</h2>
                    <p className="text-muted-foreground max-w-md text-sm">
                        Créez votre premier passeport numérique produit pour documenter une pièce textile et générer son
                        QR.
                    </p>
                </div>
                <CreatePassportCta className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 text-white">
                    Créer mon premier passeport
                </CreatePassportCta>
            </CardContent>
        </Card>
    );
}
