import { ImageResponse } from 'next/og';
import { getAllArticles, getArticleBySlug } from '@/lib/journal';
import { OG_LOGO_DATA_URI } from '@/lib/og-logo';

export const alt = 'Article LUMIRIS Journal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
    return getAllArticles().map((a) => ({ slug: a.slug }));
}

interface OgProps {
    params: Promise<{ slug: string }>;
}

export default async function Image({ params }: OgProps) {
    const { slug } = await params;
    const article = getArticleBySlug(slug);
    const title = article?.title ?? 'LUMIRIS Journal';
    const authorLine = `par ${article?.author ?? 'LUMIRIS'}`;

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
                    LUMIRIS · JOURNAL
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 1040 }}>
                <div
                    style={{
                        display: 'flex',
                        fontSize: 64,
                        fontWeight: 700,
                        lineHeight: 1.1,
                        color: '#0f172a',
                    }}
                >
                    {title}
                </div>
                <div style={{ display: 'flex', fontSize: 30, color: '#64748b', marginTop: 24 }}>{authorLine}</div>
            </div>

            <div style={{ display: 'flex', fontSize: 22, color: '#94a3b8' }}>
                Aucun acteur n’achète son score · lumiris.fr
            </div>
        </div>,
        size,
    );
}
