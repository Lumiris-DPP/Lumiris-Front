import { ImageResponse } from 'next/og';
import { mockPassportsPublic, passportPublicByIdOrSlug } from '@lumiris/mock-data';
import { KIND_LABEL_FR } from '@lumiris/utils';
import { OG_LOGO_DATA_URI } from '@/lib/og-logo';

export const alt = 'Passeport LUMIRIS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Couleur du badge de grade = échelle Iris de marque (A=emerald … E=rose), pas un vert fixe.
const GRADE_BG: Record<string, string> = {
    A: '#0f8a50', // lumiris-emerald
    B: '#0e6e88', // lumiris-cyan
    C: '#7b2fe0', // lumiris-iris
    D: '#cf7415', // lumiris-amber
    E: '#c81f45', // lumiris-rose
};

export function generateStaticParams() {
    return mockPassportsPublic.map((view) => ({ id: view.passport.id }));
}

interface OgProps {
    params: Promise<{ id: string }>;
}

export default async function Image({ params }: OgProps) {
    const { id } = await params;
    const view = passportPublicByIdOrSlug(id);
    const kind = view ? (KIND_LABEL_FR[view.passport.garment.kind] ?? KIND_LABEL_FR.other) : 'Pièce';
    const title = view ? `${kind} ${view.passport.garment.reference}` : 'Passeport LUMIRIS';
    const sub = view ? `${view.artisan.atelierName} · ${view.artisan.city}` : '';
    const grade = view?.irisScore?.grade ?? null;

    return new ImageResponse(
        <div
            style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #fafafa 0%, #f1f5f9 100%)',
                color: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                padding: 80,
                fontFamily: 'sans-serif',
                justifyContent: 'space-between',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders via Satori, not the DOM */}
                <img src={OG_LOGO_DATA_URI} width={51} height={36} alt="" />
                <div style={{ display: 'flex', fontSize: 20, letterSpacing: 4, color: '#475569' }}>
                    LUMIRIS · PASSEPORT
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 48 }}>
                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 800 }}>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 64,
                            fontWeight: 700,
                            lineHeight: 1.05,
                            color: '#0f172a',
                        }}
                    >
                        {title}
                    </div>
                    <div style={{ display: 'flex', fontSize: 28, color: '#64748b', marginTop: 16 }}>{sub}</div>
                </div>
                {grade ? (
                    <div
                        style={{
                            width: 200,
                            height: 200,
                            borderRadius: 28,
                            background: GRADE_BG[grade] ?? '#0e6e88',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: 140,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {grade}
                    </div>
                ) : null}
            </div>

            <div style={{ display: 'flex', fontSize: 20, color: '#94a3b8' }}>lumiris.fr/passeport</div>
        </div>,
        size,
    );
}
