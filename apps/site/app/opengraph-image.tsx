import { ImageResponse } from 'next/og';
import { OG_LOGO_DATA_URI } from '@/lib/og-logo';

export const alt = 'LUMIRIS — Le passeport numérique de la consommation européenne';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
    return new ImageResponse(
        <div
            style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #fafafa 0%, #f1f5f9 100%)',
                color: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                padding: 96,
                fontFamily: 'sans-serif',
                justifyContent: 'space-between',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {}
                <img src={OG_LOGO_DATA_URI} width={62} height={44} alt="" />
                <div style={{ display: 'flex', fontSize: 24, letterSpacing: 6, color: '#475569' }}>LUMIRIS</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 1000 }}>
                <div
                    style={{
                        display: 'flex',
                        fontSize: 72,
                        fontWeight: 700,
                        lineHeight: 1.05,
                        color: '#0f172a',
                    }}
                >
                    Un scan, une histoire, un score Iris.
                </div>
                <div style={{ display: 'flex', fontSize: 28, color: '#64748b', marginTop: 28 }}>
                    DPP textile artisanal + scanner universel ESPR · Aucun acteur n’achète son score
                </div>
            </div>

            <div style={{ display: 'flex', fontSize: 22, color: '#94a3b8' }}>lumiris.fr</div>
        </div>,
        size,
    );
}
