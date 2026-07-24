'use client';

import { useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';

interface AccessQrProps {
    /** URL encodée dans le QR. Pour un laissez-passer elle porte le token : à ne jamais logger. */
    url: string;
    /** Base du nom de fichier téléchargé. */
    filename: string;
    size?: number;
}

/**
 * Rend le QR en canvas (visible, sert aussi à l'export PNG) et en SVG masqué (export vectoriel,
 * seul format qui reste net à l'impression d'une étiquette).
 */
export function AccessQr({ url, filename, size = 160 }: AccessQrProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    function download(href: string, extension: string) {
        const link = document.createElement('a');
        link.download = `${filename}.${extension}`;
        link.href = href;
        link.click();
    }

    function downloadPng() {
        const canvas = containerRef.current?.querySelector('canvas');
        if (!canvas) return;
        download(canvas.toDataURL('image/png'), 'png');
    }

    function downloadSvg() {
        const svg = containerRef.current?.querySelector('svg');
        if (!svg) return;
        const source = new XMLSerializer().serializeToString(svg);
        const href = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml' }));
        download(href, 'svg');
        URL.revokeObjectURL(href);
    }

    return (
        <div ref={containerRef} className="flex flex-col items-center gap-3">
            <div className="rounded-lg border bg-white p-3">
                <QRCodeCanvas value={url} size={size} level="M" includeMargin={false} />
                <div className="hidden">
                    <QRCodeSVG value={url} size={size} level="M" />
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={downloadPng}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> PNG
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadSvg}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> SVG
                </Button>
            </div>
        </div>
    );
}
