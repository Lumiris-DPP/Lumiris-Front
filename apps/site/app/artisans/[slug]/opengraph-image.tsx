import { ImageResponse } from 'next/og';
import { fetchPublicArtisanProfile, fetchPublicArtisans } from '@/lib/public-artisan-api';
import { OG_LOGO_DATA_URI } from '@/lib/og-logo';

export const alt = 'Artisan LUMIRIS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function generateStaticParams() {
    return (await fetchPublicArtisans()).map((a) => ({ slug: a.slug }));
}

interface OgProps {
    params: Promise<{ slug: string }>;
}

export default async function Image({ params }: OgProps) {
    const { slug } = await params;
    const artisan = await fetchPublicArtisanProfile(slug);
    const title = artisan?.atelierName ?? artisan?.displayName ?? 'Atelier LUMIRIS';
    const sub = [artisan?.displayName, [artisan?.city, artisan?.region].filter(Boolean).join(', ')]
        .filter(Boolean)
        .join(' · ');

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
                {}
                <img src={OG_LOGO_DATA_URI} width={51} height={36} alt="" />
                <div style={{ display: 'flex', fontSize: 20, letterSpacing: 4, color: '#475569' }}>
                    LUMIRIS · ARTISAN
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 1040 }}>
                <div
                    style={{
                        display: 'flex',
                        fontSize: 72,
                        fontWeight: 700,
                        lineHeight: 1.05,
                        color: '#0f172a',
                    }}
                >
                    {title}
                </div>
                <div style={{ display: 'flex', fontSize: 30, color: '#64748b', marginTop: 24 }}>{sub}</div>
            </div>

            <div style={{ display: 'flex', fontSize: 22, color: '#94a3b8' }}>lumiris.fr/artisans</div>
        </div>,
        size,
    );
}
