'use client';

import { use } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import { usePassportSource } from '@/lib/use-passport-source';
import { useAutoPrint } from '@/lib/use-auto-print';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function PrintLabelPage({ params }: PageProps) {
    const { id } = use(params);
    const { passport } = usePassportSource(id);

    useAutoPrint(Boolean(passport));

    if (!passport) {
        return <p className="p-12 text-center font-mono text-sm">Passeport introuvable.</p>;
    }

    return (
        <div className="bg-white text-neutral-900">
            <div className="mx-auto flex min-h-screen w-[80mm] flex-col items-center justify-center gap-3 p-4 print:min-h-0">
                <LumirisLogo title="" className="h-6 w-auto" />
                <p className="font-mono text-[10px] tracking-widest uppercase">LUMIRIS · Iris</p>
                <p className="text-center text-sm font-semibold">{passport.garment.reference}</p>
                <div className="rounded-md border border-neutral-300 bg-white p-2">
                    <QRCodeCanvas value={passport.gs1.verificationUrl} size={180} marginSize={4} level="M" />
                </div>
                <p className="text-center font-mono text-[8px] break-all">{passport.gs1.verificationUrl}</p>
                <p className="text-[10px] text-neutral-600">{passport.garment.kind}</p>
            </div>
        </div>
    );
}
