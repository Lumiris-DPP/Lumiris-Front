'use client';

import { Download, Printer } from 'lucide-react';
import Link from 'next/link';
import { QRCodeCanvas } from 'qrcode.react';
import { useRef } from 'react';
import type { Passport } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@lumiris/ui/components/dialog';

interface QrDialogProps {
    passport: Passport;
    onClose: () => void;
}

export function QrDialog({ passport, onClose }: QrDialogProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    function downloadPng() {
        const canvas = containerRef.current?.querySelector('canvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `qr-${passport.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function downloadSvg() {
        const url = passport.gs1.verificationUrl;
        const size = 220;
        const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#fff"/><text x="50%" y="50%" text-anchor="middle" font-family="monospace" font-size="10" fill="#000">${url}</text></svg>`;
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `qr-${passport.id}.svg`;
        link.href = href;
        link.click();
        URL.revokeObjectURL(href);
    }

    return (
        <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>QR — {passport.garment.reference}</DialogTitle>
                    <DialogDescription>
                        Identifiant GS1 Digital Link pour la pièce {passport.garment.reference}.
                    </DialogDescription>
                </DialogHeader>
                <div ref={containerRef} className="flex flex-col items-center gap-3 py-2">
                    <div className="border-border rounded-xl border bg-white p-4">
                        <QRCodeCanvas
                            value={passport.gs1.verificationUrl}
                            size={220}
                            includeMargin
                            level="M"
                            id={`qr-${passport.id}`}
                        />
                    </div>
                    <p className="text-muted-foreground max-w-full break-all font-mono text-[11px]">
                        {passport.gs1.verificationUrl}
                    </p>
                </div>
                <DialogFooter className="flex flex-row flex-wrap justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={downloadPng}>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> PNG
                    </Button>
                    <Button variant="ghost" size="sm" onClick={downloadSvg}>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> SVG
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/print/${passport.id}`} target="_blank">
                            <Printer className="mr-1.5 h-3.5 w-3.5" /> Imprimer
                        </Link>
                    </Button>
                    <Button size="sm" onClick={onClose}>
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
