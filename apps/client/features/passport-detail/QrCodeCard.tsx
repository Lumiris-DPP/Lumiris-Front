'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';

const MOBILE_URL = process.env.NEXT_PUBLIC_MOBILE_URL ?? 'http://localhost:3002';

interface QrCodeCardProps {
    publicCode: string;
}

export function QrCodeCard({ publicCode }: QrCodeCardProps) {
    const dppUrl = `${MOBILE_URL}/p/${publicCode}`;

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="text-base">Partager ce DPP</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <div className="rounded-lg border bg-white p-3">
                    <QRCodeSVG value={dppUrl} size={160} level="M" />
                </div>

                <div className="flex flex-col items-center gap-1 text-center">
                    <p className="text-muted-foreground text-[11px] uppercase tracking-wider">Code DPP</p>
                    <p className="font-mono text-lg font-semibold tracking-widest">{publicCode}</p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(`/print/passport/${publicCode}`, '_blank')}
                >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Télécharger le PDF
                </Button>
            </CardContent>
        </Card>
    );
}
